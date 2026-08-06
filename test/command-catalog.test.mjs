import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  CORE3_COMMAND_CATALOG_VERSION,
  CORE3_COMMAND_PRIORITY_POLICY,
  CURRENT_COMPAT_PROFILE,
  TARGET_PROVISIONAL_PROFILE,
  applyNormalizedInputEvents,
  auditCore3CommandInputOverlaps,
  buildCore3CatalogCommandDefinitions,
  buildCore3CommandCatalogContract,
  createInputHistoryState,
  hashCore3CommandCatalog,
  resolveCommandTrigger,
  validateCore3CommandCatalog,
} from '../src/core/index.ts';

const direction=(value,frame,order,player=0)=>({kind:'direction',action:'press',direction:value,frame,order,player});
const trigger=(definition,frame,order,player=0)=>definition.trigger==='grab'
  ?{kind:'grab',frame,order,player}
  :{kind:'attack',level:definition.trigger,frame,order,player};

function resolveDefinition(definition,definitions,withCondition=true){
  const events=definition.directions.map((value,index)=>direction(value,index*2,index));
  const state=applyNormalizedInputEvents(createInputHistoryState(0),events,TARGET_PROVISIONAL_PROFILE);
  const context=definition.conditionId&&withCondition?{activeConditions:new Set([definition.conditionId])}:undefined;
  return resolveCommandTrigger(state,trigger(definition,events.at(-1).frame+1,events.length),definitions,TARGET_PROVISIONAL_PROFILE,{context});
}

validateCore3CommandCatalog();
assert.equal(CORE3_COMMAND_CATALOG_VERSION,'core3-command-catalog-v1');
assert.equal(CORE3_COMMAND_PRIORITY_POLICY,'longest-command-first');

const contract=buildCore3CommandCatalogContract();
const definitions=contract.definitions;
const overlaps=contract.overlaps;
assert.equal(contract.version,CORE3_COMMAND_CATALOG_VERSION);
assert.equal(contract.priorityPolicy,CORE3_COMMAND_PRIORITY_POLICY);
assert.strictEqual(contract.timingProfiles.current,CURRENT_COMPAT_PROFILE);
assert.strictEqual(contract.timingProfiles.target,TARGET_PROVISIONAL_PROFILE);
assert.deepEqual(contract.timingProfiles.current,{
  id:'current-compat',status:'current_impl',directionHistoryF:24,commandPrebufferF:12,latestDirectionsOnly:true,
});
assert.deepEqual(contract.timingProfiles.target,{
  id:'target-provisional',status:'provisional',directionHistoryF:38,commandPrebufferF:12,latestDirectionsOnly:true,
  directionGapMaxF:18,commandTotal3F:28,commandTotal4F:38,finalButtonGraceF:10,sameDirectionMinGapF:2,
  holdDetectF:30,chargeCompleteF:45,
});
assert.equal(definitions.length,21);
assert.equal(definitions.filter((definition)=>definition.source==='current_impl').length,9);
assert.equal(definitions.filter((definition)=>definition.source==='design_confirmed').length,12);
assert.deepEqual(definitions.map((definition)=>definition.characterId),[
  ...Array(7).fill('moguzo'),...Array(7).fill('pisuke'),...Array(7).fill('godan'),
]);

for(const characterId of ['moguzo','pisuke','godan']){
  const characterDefinitions=buildCore3CatalogCommandDefinitions(characterId);
  assert.equal(characterDefinitions.length,7);
  for(const definition of characterDefinitions){
    const result=resolveDefinition(definition,characterDefinitions,true);
    assert.equal(result.kind,'command',`${definition.id} should resolve`);
    assert.equal(result.match.definition.id,definition.id);
  }
}

assert.throws(()=>buildCore3CatalogCommandDefinitions('hakuma'),/unknown current character/);
const conditioned=definitions.filter((definition)=>definition.conditionId);
assert.equal(conditioned.length,1);
assert.equal(conditioned[0].id,'pisuke:slot-6');
assert.equal(conditioned[0].conditionId,'pisuke.lunge-success');
assert.equal(conditioned[0].blockShorterOnConditionFailure,false);
const pisukeDefinitions=buildCore3CatalogCommandDefinitions('pisuke');
const conditionFailure=resolveDefinition(conditioned[0],pisukeDefinitions,false);
assert.equal(conditionFailure.kind,'fallback');
assert.deepEqual(conditionFailure.blockedBy,[]);
assert.equal(conditionFailure.fallback.kind,'normal-attack');
assert.equal(conditionFailure.fallback.level,'low');

assert.deepEqual(overlaps.map((overlap)=>[overlap.shorterId,overlap.longerId]),[
  ['pisuke:slot-1','pisuke:slot-7'],
  ['godan:slot-4','godan:slot-7'],
]);
assert.ok(overlaps.every((overlap)=>overlap.resolution==='longest-command-first'));
assert.deepEqual(overlaps.map((overlap)=>[overlap.shorterSource,overlap.longerSource]),[
  ['current_impl','design_confirmed'],
  ['design_confirmed','design_confirmed'],
]);

for(const [characterId,shortSlot,longSlot] of [['pisuke',1,7],['godan',4,7]]){
  const characterDefinitions=buildCore3CatalogCommandDefinitions(characterId);
  const shorter=characterDefinitions.find((definition)=>definition.slot===shortSlot);
  const longer=characterDefinitions.find((definition)=>definition.slot===longSlot);
  const shortResult=resolveDefinition(shorter,characterDefinitions,true);
  const longResult=resolveDefinition(longer,characterDefinitions,true);
  assert.equal(shortResult.kind,'command');
  assert.equal(shortResult.match.definition.id,shorter.id);
  assert.equal(longResult.kind,'command');
  assert.equal(longResult.match.definition.id,longer.id);
}

const pisukeLong=pisukeDefinitions.find((definition)=>definition.slot===7);
const pisukeLongEvents=pisukeLong.directions.map((value,index)=>direction(value,index*2,index));
const pisukeLongState=applyNormalizedInputEvents(createInputHistoryState(0),pisukeLongEvents,TARGET_PROVISIONAL_PROFILE);
const pisukeMatches=resolveCommandTrigger(
  pisukeLongState,
  trigger(pisukeLong,pisukeLongEvents.at(-1).frame+1,pisukeLongEvents.length),
  pisukeDefinitions,
  TARGET_PROVISIONAL_PROFILE,
);
assert.equal(pisukeMatches.kind,'command');
assert.equal(pisukeMatches.match.definition.name,'つむじ返し');

const hash=hashCore3CommandCatalog(contract);
const rebuilt=buildCore3CommandCatalogContract();
assert.equal(hash,hashCore3CommandCatalog(rebuilt));
const changed={...contract,timingProfiles:{...contract.timingProfiles,target:{...contract.timingProfiles.target,directionHistoryF:37}}};
assert.notEqual(hash,hashCore3CommandCatalog(changed));
const changedDefinitions=definitions.map((definition)=>definition.id==='godan:slot-7'?{...definition,directions:['right','down','right']}:definition);
assert.notEqual(hash,hashCore3CommandCatalog({...contract,definitions:changedDefinitions,overlaps:auditCore3CommandInputOverlaps(changedDefinitions)}));

for(const path of ['../src/core/command-catalog.ts','../src/core/command-types.ts']){
  const source=readFileSync(new URL(path,import.meta.url),'utf8');
  for(const forbidden of ['Math.random','localeCompare','document.','window.','Canvas','Audio(','setTimeout(','setInterval(','performance.now','Date(']){
    assert.equal(source.includes(forbidden),false,`${path} contains forbidden API ${forbidden}`);
  }
}

console.log(`command catalog tests passed; definitions=21; current=9; design=12; overlaps=2; conditional=1; profiles=current+target; priority=longest-first; hash=${hash}`);