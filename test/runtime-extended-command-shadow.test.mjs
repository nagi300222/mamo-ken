import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const catalogSource=readFileSync(new URL('../runtime/character-catalog-browser.js',import.meta.url),'utf8');
const extendedSource=readFileSync(new URL('../runtime/runtime-extended-command-shadow-browser.js',import.meta.url),'utf8');
const plain=(value)=>JSON.parse(JSON.stringify(value));

function loadContext(search='?mamokenExtendedShadow=1'){
  const context=vm.createContext({console,location:{search}});
  context.window=context;
  context.globalThis=context;
  vm.runInContext(catalogSource,context,{filename:'character-catalog-browser.js'});
  vm.runInContext(extendedSource,context,{filename:'runtime-extended-command-shadow-browser.js'});
  return context;
}
function load(search){return loadContext(search).__MAMOKEN_EXTENDED_COMMAND_SHADOW__;}
function payload(definition,offset=0,player=0,withCondition=true){
  const directions=definition.directions.map((direction,index)=>({direction,frame:offset+index*2}));
  return{
    frame:directions.length?directions.at(-1).frame+1:offset,
    player,
    characterId:definition.characterId,
    trigger:definition.trigger,
    directions,
    activeConditions:definition.conditionId&&withCondition?[definition.conditionId]:[],
  };
}

const context=loadContext();
const catalog=context.__MAMOKEN_CHARACTER_CATALOG__;
const contract=catalog.commandContract;
const api=context.__MAMOKEN_EXTENDED_COMMAND_SHADOW__;
assert.equal(api.version,'runtime-extended-command-shadow-browser-v2');
assert.equal(api.reportVersion,'mamoken-extended-command-shadow-report-v2');
assert.equal(api.enabled,true);
assert.equal(api.requestedEnabled,true);
assert.equal(contract.definitions.length,21);
assert.equal(contract.overlaps.length,2);
assert.deepEqual(plain(api.contract().overlaps),plain(contract.overlaps));
assert.equal(api.contract().hash,contract.hash);
assert.equal(api.contract().priorityPolicy,'longest-command-first');
assert.equal(api.contract().timingProfiles.current.id,'current-compat');
assert.equal(api.contract().timingProfiles.target.id,'target-provisional');

const expected={
  'current-parity':9,
  'design-only-candidate':11,
  'longer-design-overrides-current':1,
  'runtime-only':0,
  'catalog-current-only':0,
  'different-current':0,
  'fallback-parity':0,
};
for(const definition of contract.definitions){
  const result=api.observeTrigger(payload(definition,definition.slot*20,definition.slot%2,true));
  assert.equal(result.accepted,true);
  assert.equal(result.observation.catalog.kind,'command');
  assert.equal(result.observation.catalog.commandId,definition.id);
  assert.equal(result.observation.catalog.name,definition.name);
  assert.equal(result.observation.catalog.source,definition.source);
}
const summary=api.summary();
assert.equal(summary.observationCount,21);
assert.equal(summary.conflictCount,1);
assert.deepEqual(plain(summary.classifications),expected);
assert.equal(summary.byCharacter.moguzo.observations,7);
assert.equal(summary.byCharacter.pisuke.observations,7);
assert.equal(summary.byCharacter.godan.observations,7);
assert.equal(summary.byCharacter.pisuke.conflicts,1);
assert.equal(summary.declaredOverlapCount,2);
assert.deepEqual(plain(summary.declaredOverlapKinds),{
  'current_impl->design_confirmed':1,
  'design_confirmed->design_confirmed':1,
  other:0,
});
assert.equal(api.conflictCount(),1);

const report=api.report();
const conflict=report.observations.find((item)=>item.classification==='longer-design-overrides-current');
assert.ok(conflict);
assert.equal(conflict.characterId,'pisuke');
assert.equal(conflict.runtime.commandId,'pisuke:slot-1');
assert.equal(conflict.catalog.commandId,'pisuke:slot-7');
assert.equal(conflict.catalog.name,'つむじ返し');
assert.deepEqual(plain(report.commandContract.overlaps.map((overlap)=>[overlap.shorterId,overlap.longerId])),[
  ['pisuke:slot-1','pisuke:slot-7'],
  ['godan:slot-4','godan:slot-7'],
]);

const conditioned=contract.definitions.find((definition)=>definition.id==='pisuke:slot-6');
const conditionSuccess=api.resolveTrigger(payload(conditioned,300,0,true));
assert.equal(conditionSuccess.decision.catalog.commandId,'pisuke:slot-6');
assert.deepEqual(plain(conditionSuccess.decision.activeConditions),['pisuke.lunge-success']);
const conditionFailure=api.resolveTrigger(payload(conditioned,300,0,false));
assert.equal(conditionFailure.decision.catalog.kind,'fallback');
assert.equal(conditionFailure.decision.catalog.fallback,'normal-attack');
assert.deepEqual(plain(conditionFailure.decision.activeConditions),[]);
const normalizedConditions=api.resolveTrigger({...payload(conditioned,300,0,true),activeConditions:['pisuke.lunge-success','pisuke.lunge-success']});
assert.deepEqual(plain(normalizedConditions.decision.activeConditions),['pisuke.lunge-success']);

const manual=api.resolveTrigger({
  frame:12,player:0,characterId:'moguzo',trigger:'mid',activeConditions:[],
  directions:[{direction:'right',frame:0},{direction:'down',frame:1}],
});
assert.equal(manual.accepted,true);
assert.equal(manual.decision.runtime.commandId,'moguzo:slot-1');
assert.equal(manual.decision.catalog.kind,'fallback');
assert.equal(manual.decision.classification,'runtime-only');

const fallback=api.resolveTrigger({frame:0,player:0,characterId:'godan',trigger:'high',directions:[],activeConditions:[]});
assert.equal(fallback.decision.classification,'fallback-parity');
assert.equal(fallback.decision.runtime.fallback,'normal-attack');

const firstHash=api.hash();
const firstExport=api.exportReport();
const firstReport=JSON.parse(firstExport);
assert.equal(firstReport.diagnosticOnly,true);
assert.deepEqual(firstReport.authority,{runtime:'unchanged-current-9',catalog:'none'});
assert.equal(firstReport.commandContract.hash,contract.hash);
assert.equal(firstReport.commandContract.definitionCount,21);
assert.equal(firstReport.commandContract.overlaps.length,2);
assert.equal(firstReport.summary.observationHash,firstHash);
assert.equal(firstExport.endsWith('\n'),true);
assert.equal(firstExport.includes('localStorage'),false);
assert.equal(firstExport.includes('timestamp'),false);

function recordAll(target){
  for(const definition of contract.definitions)target.observeTrigger(payload(definition,definition.slot*20,definition.slot%2,true));
}
api.reset();recordAll(api);
assert.equal(api.hash(),firstHash);
assert.equal(api.exportReport(),firstExport);

const snapshot=api.snapshot();
assert.equal(snapshot.contractHash,contract.hash);
snapshot.observations.length=0;
assert.equal(api.summary().observationCount,21);
const contractClone=api.contract();
contractClone.overlaps.length=0;
assert.equal(api.contract().overlaps.length,2);

assert.throws(()=>api.resolveTrigger({frame:-1,player:0,characterId:'moguzo',trigger:'mid',directions:[]}),/frame/);
assert.throws(()=>api.resolveTrigger({frame:1,player:2,characterId:'moguzo',trigger:'mid',directions:[]}),/player/);
assert.throws(()=>api.resolveTrigger({frame:1,player:0,characterId:'hakuma',trigger:'mid',directions:[]}),/current character/);
assert.throws(()=>api.resolveTrigger({frame:1,player:0,characterId:'moguzo',trigger:'ult',directions:[]}),/trigger/);
assert.throws(()=>api.resolveTrigger({frame:2,player:0,characterId:'moguzo',trigger:'mid',directions:[{direction:'down',frame:2},{direction:'right',frame:1}]}),/frame ordered/);
assert.throws(()=>api.resolveTrigger({frame:2,player:0,characterId:'moguzo',trigger:'mid',directions:[],activeConditions:[1]}),/activeConditions/);

const disabled=load('');
assert.equal(disabled.enabled,false);
assert.deepEqual(plain(disabled.observeTrigger({frame:0,player:0,characterId:'moguzo',trigger:'mid',directions:[]})),{accepted:false,reason:'disabled'});
assert.equal(disabled.summary().observationCount,0);

const ring=load();
for(let index=0;index<300;index++)ring.observeTrigger({frame:index,player:index%2,characterId:'moguzo',trigger:'mid',directions:[],activeConditions:[]});
assert.equal(ring.summary().observationCount,256);
assert.equal(ring.snapshot().observations[0].frame,44);

const descriptor=Object.getOwnPropertyDescriptor(context,'__MAMOKEN_EXTENDED_COMMAND_SHADOW__');
assert.equal(descriptor.writable,false);
assert.equal(descriptor.configurable,true);
for(const forbidden of ['localStorage','sessionStorage','fetch(','XMLHttpRequest','WebSocket','navigator.clipboard','Date.now','performance.now','Math.random']){
  assert.equal(extendedSource.includes(forbidden),false,`forbidden API: ${forbidden}`);
}
for(const duplicatedTiming of ['<=24','<=38','>18','>28'])assert.equal(extendedSource.includes(duplicatedTiming),false,`handwritten timing remains: ${duplicatedTiming}`);

const prototype=readFileSync(new URL('../prototype/mamoken_prototype_v01.html',import.meta.url),'utf8');
const dist=readFileSync(new URL('../dist/mamoken_mobile.html',import.meta.url),'utf8');
const build=readFileSync(new URL('../tools/build_mobile.mjs',import.meta.url),'utf8');
const t24Patcher=readFileSync(new URL('../tools/apply_t24_extended_command_shadow.mjs',import.meta.url),'utf8');
const t26Patcher=readFileSync(new URL('../tools/apply_t26_browser_command_contract.mjs',import.meta.url),'utf8');
for(const source of [prototype,dist]){
  assert.ok(source.includes('/* T24 extended command shadow hook */'));
  assert.ok(source.includes('/* T26 browser command contract */'));
  assert.ok(source.includes("activeConditions:(f.c.id==='pisuke'&&f.clinchF>0)?['pisuke.lunge-success']:[]"));
  assert.ok(source.includes('extended.observeTrigger(payload)'));
}
assert.ok(prototype.includes('<script src="../runtime/runtime-extended-command-shadow-browser.js"></script>'));
assert.equal(dist.includes('<script src="../runtime/runtime-extended-command-shadow-browser.js"></script>'),false);
assert.ok(dist.includes('runtime-extended-command-shadow-browser-v2'));
assert.ok(dist.includes('core3-command-catalog-v1'));
assert.ok(build.includes('RUNTIME_EXTENDED_SHADOW_JS'));
assert.ok(t24Patcher.includes("const MARKER='/* T24 extended command shadow hook */'"));
assert.ok(t26Patcher.includes("const MARKER='/* T26 browser command contract */'"));

console.log(`runtime extended command shadow tests passed; contract=${contract.hash}; catalog=21; observedConflicts=1; declaredOverlaps=2; hash=${firstHash}; ring=256`);