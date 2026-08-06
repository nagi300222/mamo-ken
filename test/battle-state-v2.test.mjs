import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
  COMBAT_CONTRACT_V2,
  materializeMoveSpecV2Closure,
  reachPosturesV2,
} from '../src/core/index.ts';
import {
  BATTLE_STATE_V2_VERSION,
  RESOLUTION_REASON_CODES_V2,
} from '../src/core/v2-types/battle-state-v2.ts';
import {MOVE_SPEC_V2_VERSION} from '../src/core/v2-types/move-spec-v2.ts';
import {
  advanceBattleClocksV2,
  createInitialBattleStateV2,
  createOpenMoveSpecV2FromClosure,
  hashBattleStateV2,
  hashMoveSpecV2,
  openTaggedValueV2,
  resolvedTaggedValueV2,
  swapFrameBatchIntentPlayersV2,
  validateBattleStateV2,
  validateFrameBatchIntentV2,
  validateMoveSpecV2,
  validateMoveSpecV2Registry,
  validateResolutionReasonCodesV2,
} from '../src/core/v2-validation/battle-state-v2-validation.ts';

const plain=(value)=>JSON.parse(JSON.stringify(value));
const closureJson=JSON.parse(readFileSync(new URL('../design/combat/contracts/MAMOKEN_CURRENT_3_CHARACTERS_MOVESPEC_CLOSURE_v0.2.json',import.meta.url),'utf8'));
const closures=materializeMoveSpecV2Closure(closureJson);
const specs=closures.map(createOpenMoveSpecV2FromClosure);

assert.equal(BATTLE_STATE_V2_VERSION,'mamoken-battle-state-v2-v0.1');
assert.equal(MOVE_SPEC_V2_VERSION,'mamoken-movespec-v2-v0.1');
assert.equal(specs.length,21);
assert.equal(new Set(specs.map((spec)=>spec.id)).size,21);
assert.ok(specs.every((spec)=>validateMoveSpecV2(spec).ok),specs.flatMap((spec)=>validateMoveSpecV2(spec).errors.map((error)=>`${spec.id}: ${error}`)).join('\n'));
assert.ok(specs.every((spec)=>spec.statusTag==='PROTOTYPE_CANDIDATE'&&spec.authority==='shadow_only'));
assert.ok(specs.every((spec)=>spec.reachClass.status==='OPEN'&&spec.targetPostures.length===0));
assert.ok(specs.every((spec)=>spec.timing.startupF.status==='OPEN'&&spec.damage.damage.status==='OPEN'));
assert.ok(specs.every((spec)=>spec.armor.status==='OPEN'&&spec.invulnerability.status==='OPEN'));
assert.ok(specs.every((spec)=>spec.tags.includes('g01-open-numerics')));
assert.equal(specs.find((spec)=>spec.id==='pisuke:slot-1').contactSchedule.count,2);
assert.equal(specs.find((spec)=>spec.id==='pisuke:slot-4').contactSchedule.count,3);
assert.equal(specs.find((spec)=>spec.id==='pisuke:slot-7').movement.maximumApproachSteps,2);
assert.equal(specs.find((spec)=>spec.id==='godan:slot-6').downPolicy.followupAllowed,false);
assert.equal(specs.find((spec)=>spec.id==='godan:slot-6').advantage.policy,'not_applicable');
assert.equal(specs.find((spec)=>spec.id==='godan:slot-6').downPolicy.wakeProfileId.status,'OPEN');
assert.equal(specs.find((spec)=>spec.id==='moguzo:slot-1').downPolicy.wakeProfileId,null);

const registry={version:'mamoken-movespec-v2-registry-v0.1',statusTag:'PROTOTYPE_CANDIDATE',authority:'shadow_only',moves:specs};
assert.deepEqual(validateMoveSpecV2Registry(registry),{ok:true,errors:[]});
const duplicateRegistry={...registry,moves:[...specs,specs[0]]};
assert.equal(validateMoveSpecV2Registry(duplicateRegistry).ok,false);

const baseSpec=specs.find((spec)=>spec.id==='moguzo:slot-2');
const resolvedReach={
  ...baseSpec,
  reachClass:resolvedTaggedValueV2('PROTOTYPE_CANDIDATE',2,'MAMOKEN_CURRENT_3_CHARACTERS_MOVESPEC_v0.1.json'),
  targetPostures:reachPosturesV2(2),
  armor:resolvedTaggedValueV2('PROTOTYPE_CANDIDATE',null,'MAMOKEN_CURRENT_3_CHARACTERS_MOVESPEC_v0.1.json'),
  invulnerability:resolvedTaggedValueV2('PROTOTYPE_CANDIDATE',{kind:'strike',startF:0,endF:4},'candidate-test'),
};
assert.equal(validateMoveSpecV2(resolvedReach).ok,true,validateMoveSpecV2(resolvedReach).errors.join('\n'));
const badReach={...resolvedReach,targetPostures:['CLINCH','NORMAL']};
assert.equal(validateMoveSpecV2(badReach).ok,false);
const badChase={...specs.find((spec)=>spec.id==='pisuke:slot-7'),movement:{...specs.find((spec)=>spec.id==='pisuke:slot-7').movement,maximumApproachSteps:3}};
assert.equal(validateMoveSpecV2(badChase).ok,false);
const formalWithOpen={...baseSpec,statusTag:'FORMAL',authority:'none'};
assert.ok(validateMoveSpecV2(formalWithOpen).errors.some((error)=>error.includes('FORMAL spec cannot contain OPEN')));
const badOpen={...baseSpec,reachClass:{status:'OPEN',value:2,sourceRef:null,note:null}};
assert.equal(validateMoveSpecV2(badOpen).ok,false);
const badThrow={...specs.find((spec)=>spec.id==='moguzo:slot-3'),advantage:{policy:'standard_contact_formula',hitAdvF:openTaggedValueV2(),blockAdvF:openTaggedValueV2(),whiffExtraRecoveryF:openTaggedValueV2()}};
assert.equal(validateMoveSpecV2(badThrow).ok,false);

const state=createInitialBattleStateV2({
  fighters:{
    0:{characterId:'moguzo',maxHp:1000,maxGuard:100,maxSGauge:100,maxRoarGauge:100,abilityId:'moguzo.guts'},
    1:{characterId:'bullet',maxHp:900,maxGuard:90,maxSGauge:100,maxRoarGauge:100,abilityId:'bullet.overcharge'},
  },
  roundIndex:1,
  timerCombatF:5940,
  timeoutEnabled:true,
});
assert.equal(validateBattleStateV2(state).ok,true,validateBattleStateV2(state).errors.join('\n'));
assert.equal(state.version,'mamoken-battle-state-v2-v0.1');
assert.equal(state.combatContractVersion,COMBAT_CONTRACT_V2.version);
assert.equal(state.authority,'shadow_only');
assert.equal(state.liveRuntimeAuthority,false);
assert.equal(state.fighters[0].bulletCharge,null);
assert.deepEqual(state.fighters[1].bulletCharge,{value:0,lastGainSignature:null,maxReady:false});
assert.notStrictEqual(state.fighters[0].inputHold,state.fighters[1].inputHold);
assert.equal(state.flow,'fight');
assert.equal(state.spatial.sideSwap,false);

const normalClocks=advanceBattleClocksV2(state.clocks,'NONE',{0:true,1:false});
assert.deepEqual(normalClocks,{simulationFrame:1,combatFrame:1,fighterActionFrame:{0:1,1:0}});
const hitstopClocks=advanceBattleClocksV2(normalClocks,'HITSTOP',{0:true,1:true});
assert.deepEqual(hitstopClocks,{simulationFrame:2,combatFrame:1,fighterActionFrame:{0:1,1:0}});
const ultimateFreezeClocks=advanceBattleClocksV2(hitstopClocks,'ULTIMATE_FREEZE',{0:true,1:true});
assert.deepEqual(ultimateFreezeClocks,{simulationFrame:3,combatFrame:1,fighterActionFrame:{0:1,1:0}});
const pauseClocks=advanceBattleClocksV2(ultimateFreezeClocks,'PAUSE',{0:true,1:true});
assert.deepEqual(pauseClocks,ultimateFreezeClocks);

const invalidBullet=structuredClone(state);invalidBullet.fighters[1].bulletCharge.maxReady=true;
assert.equal(validateBattleStateV2(invalidBullet).ok,false);
const invalidClinch=structuredClone(state);invalidClinch.spatial.engagement='CLINCH';invalidClinch.spatial.clinchRemainingF=24;
assert.equal(validateBattleStateV2(invalidClinch).ok,false);
const invalidClock=structuredClone(state);invalidClock.clocks.fighterActionFrame[0]=1;
assert.equal(validateBattleStateV2(invalidClock).ok,false);
const invalidFreeze=structuredClone(state);invalidFreeze.freeze={kind:'HITSTOP',remainingF:0,sourceId:null};
assert.equal(validateBattleStateV2(invalidFreeze).ok,false);

const stateHash=hashBattleStateV2(state);
assert.match(stateHash,/^[0-9a-f]{8}$/);
assert.equal(stateHash,hashBattleStateV2(createInitialBattleStateV2({fighters:{0:{characterId:'moguzo',maxHp:1000,maxGuard:100,maxSGauge:100,maxRoarGauge:100,abilityId:'moguzo.guts'},1:{characterId:'bullet',maxHp:900,maxGuard:90,maxSGauge:100,maxRoarGauge:100,abilityId:'bullet.overcharge'}},roundIndex:1,timerCombatF:5940,timeoutEnabled:true})));
assert.notEqual(hashMoveSpecV2(baseSpec),hashMoveSpecV2(resolvedReach));

const batch={
  batchId:1,
  sourceSimulationFrame:state.clocks.simulationFrame,
  sourceCombatFrame:state.clocks.combatFrame,
  preStateHash:stateHash,
  actions:{
    0:{playerId:0,batchId:1,sourceSimulationFrame:0,preStateHash:stateHash,actionId:'moguzo:slot-1',moveId:'moguzo:slot-1',actionClass:'LONG_COMMAND',priorityIndex:3},
    1:{playerId:1,batchId:1,sourceSimulationFrame:0,preStateHash:stateHash,actionId:'normal.mid',moveId:null,actionClass:'NORMAL_CHAIN',priorityIndex:7},
  },
  positions:{
    0:{playerId:0,batchId:1,sourceCombatFrame:0,preStateHash:stateHash,movement:'ONE_STEP',requestedSteps:1,requestedEndPosition:'KEEP'},
    1:null,
  },
  contacts:[
    {attacker:0,defender:1,batchId:1,sourceCombatFrame:0,preStateHash:stateHash,moveId:'moguzo:slot-1',contactIndex:0,contactKind:{kind:'strike',level:'MID'},reachClass:2,targetPostures:reachPosturesV2(2)},
  ],
};
assert.equal(validateFrameBatchIntentV2(batch).ok,true,validateFrameBatchIntentV2(batch).errors.join('\n'));
const swapped=swapFrameBatchIntentPlayersV2(batch);
assert.equal(validateFrameBatchIntentV2(swapped).ok,true,validateFrameBatchIntentV2(swapped).errors.join('\n'));
assert.deepEqual(plain(swapFrameBatchIntentPlayersV2(swapped)),plain(batch));
assert.equal(swapped.actions[0].actionId,'normal.mid');
assert.equal(swapped.contacts[0].attacker,1);
const invalidBatch=structuredClone(batch);invalidBatch.contacts[0].defender=0;
assert.equal(validateFrameBatchIntentV2(invalidBatch).ok,false);
const invalidReachBatch=structuredClone(batch);invalidReachBatch.contacts[0].targetPostures=['CLINCH'];
assert.equal(validateFrameBatchIntentV2(invalidReachBatch).ok,false);

assert.equal(validateResolutionReasonCodesV2().ok,true);
assert.equal(new Set(RESOLUTION_REASON_CODES_V2).size,RESOLUTION_REASON_CODES_V2.length);
assert.ok(RESOLUTION_REASON_CODES_V2.some((code)=>code==='REJECT_FAIL_CLOSED'));
assert.ok(RESOLUTION_REASON_CODES_V2.some((code)=>code==='RESULT_TRADE'));

for(const path of ['../src/core/v2-types/battle-state-v2.ts','../src/core/v2-types/move-spec-v2.ts','../src/core/v2-validation/battle-state-v2-validation.ts']){
  const source=readFileSync(new URL(path,import.meta.url),'utf8');
  for(const forbidden of ['prototype/','dist/','runtime/','server/','assets/','Math.random','Date.now','globalThis.window','window.document','document.','localStorage','sessionStorage','fetch(','setTimeout(','setInterval('])assert.equal(source.includes(forbidden),false,`${path}: forbidden live dependency ${forbidden}`);
}

console.log(`battle state v2 tests passed; moves=21; openNumerics=21; reasons=${RESOLUTION_REASON_CODES_V2.length}; clocks=3; hash=${stateHash}`);
