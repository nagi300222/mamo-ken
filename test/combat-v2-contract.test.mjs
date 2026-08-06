import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
  COMBAT_CONTRACT_V2,
  COMBAT_CONTRACT_V2_VERSION,
} from '../src/core/v2-types/combat-contract-v2.ts';
import {
  buildCpuMatchupRunsV2,
  findCancelCyclesV2,
  hashCombatContractClosureV2,
  materializeMoveSpecV2Closure,
  reachPosturesV2,
  swapPlayerPairV2,
  validateCombatContractV2,
  validateMoveSpecV2CandidateDocument,
} from '../src/core/v2-validation/combat-contract-v2-validation.ts';

const ROOT=new URL('..',import.meta.url);
const json=JSON.parse(readFileSync(new URL('../design/combat/contracts/MAMOKEN_CURRENT_3_CHARACTERS_MOVESPEC_CLOSURE_v0.2.json',import.meta.url),'utf8'));
const document=readFileSync(new URL('../design/combat/contracts/MAMOKEN_COMBAT_CONTRACT_v0.2.md',import.meta.url),'utf8');
const plain=(value)=>JSON.parse(JSON.stringify(value));

assert.equal(COMBAT_CONTRACT_V2_VERSION,'mamoken-combat-contract-v0.2');
const contractValidation=validateCombatContractV2();
assert.equal(contractValidation.ok,true,contractValidation.errors.join('\n'));
assert.equal(COMBAT_CONTRACT_V2.statusTag,'PROTOTYPE_CANDIDATE');
assert.equal(COMBAT_CONTRACT_V2.authority,'shadow_only');
assert.equal(COMBAT_CONTRACT_V2.liveRuntimeAuthority,false);
assert.equal(COMBAT_CONTRACT_V2.formalBalanceAuthority,false);
assert.deepEqual(COMBAT_CONTRACT_V2.postureStates,['NORMAL','SWAY_SHALLOW','SWAY_DEEP','CROUCH','LUNGE','CLINCH','DOWN']);
assert.equal(COMBAT_CONTRACT_V2.postureStates.includes('SWAY'),false);
assert.notDeepEqual(COMBAT_CONTRACT_V2.inputNormalizationOrder,COMBAT_CONTRACT_V2.actionPriorityOrder);
assert.equal(COMBAT_CONTRACT_V2.inputConstants.commandPrebufferF,10);
assert.equal(COMBAT_CONTRACT_V2.inputConstants.directionHistoryF,40);
assert.equal(COMBAT_CONTRACT_V2.inputConstants.directionGapMaxF,18);
assert.equal(COMBAT_CONTRACT_V2.inputConstants.finalTriggerGraceF,10);
assert.equal(COMBAT_CONTRACT_V2.inputConstants.guardTapThresholdF,6);
assert.equal(COMBAT_CONTRACT_V2.inputConstants.sameDirectionMinGapF,2);
assert.equal(COMBAT_CONTRACT_V2.inputConstants.commandTotal2F,24);
assert.equal(COMBAT_CONTRACT_V2.inputConstants.commandTotal3F,30);
assert.equal(COMBAT_CONTRACT_V2.inputConstants.commandTotal4F,40);
assert.equal(COMBAT_CONTRACT_V2.inputConstants.legacyGestureSlackF,null);
assert.equal(COMBAT_CONTRACT_V2.inputConstants.rowBoundaryHysteresisPx,null);
assert.equal(COMBAT_CONTRACT_V2.clinch.standardDurationF,24);
assert.equal(COMBAT_CONTRACT_V2.clinch.simultaneousForwardDurationF,18);
assert.equal(COMBAT_CONTRACT_V2.freezePolicy.HITSTOP.simulationFrame,true);
assert.equal(COMBAT_CONTRACT_V2.freezePolicy.HITSTOP.combatFrame,false);
assert.equal(COMBAT_CONTRACT_V2.freezePolicy.PAUSE.stateHash,false);

const candidateValidation=validateMoveSpecV2CandidateDocument(json);
assert.equal(candidateValidation.ok,true,candidateValidation.errors.join('\n'));
const moves=materializeMoveSpecV2Closure(json);
assert.equal(moves.length,21);
assert.equal(new Set(moves.map((move)=>move.id)).size,21);
for(const characterId of ['moguzo','pisuke','godan'])assert.equal(moves.filter((move)=>move.characterId===characterId).length,7);
assert.equal(moves.filter((move)=>move.sourceStatus==='CURRENT_ANCHOR_TRANSLATED').length,9);
assert.equal(moves.filter((move)=>move.sourceStatus==='DESIGN_CONFIRMED_NUMERIC_CANDIDATE').length,12);
assert.ok(moves.every((move)=>move.statusTag==='PROTOTYPE_CANDIDATE'&&move.authority==='shadow_only'));
assert.ok(moves.every((move)=>move.resourcePolicyId==='resource.action-contact-v0.2'));

for(const move of moves){
  assert.equal(move.moveKind,move.contactKind.kind);
  if(move.contactKind.kind==='strike')assert.ok(['HIGH','MID','LOW'].includes(move.contactKind.level));
  if(move.contactKind.kind==='throw')assert.ok(['CLINCH_ONLY','NORMAL_SHORT','NORMAL_LONG'].includes(move.contactKind.throwRange));
  if(move.contactKind.kind==='stance')assert.ok(move.contactKind.stanceId);
  const excludes=move.moveKind==='throw'||move.moveKind==='stance'||move.downType!=='NONE';
  assert.equal(move.advantagePolicy,excludes?'not_applicable':'standard_contact_formula');
  if(move.forwardMovement==='CHASE_TO_CONTACT')assert.ok(move.maximumApproachSteps>=1&&move.maximumApproachSteps<=2);
  else assert.equal(move.maximumApproachSteps,null);
  for(const window of Object.values(move.cancelWindows))if(window){
    assert.ok(['FIRST_CONTACT','LAST_CONTACT','ACTION_START','ACTION_END'].includes(window.basis));
    assert.ok(Number.isInteger(window.startOffsetF));
    assert.ok(Number.isInteger(window.endOffsetF));
    assert.ok(window.startOffsetF<=window.endOffsetF);
  }
}
assert.deepEqual(plain(moves.filter((move)=>move.moveKind==='throw').map((move)=>[move.id,move.contactKind.throwRange])),[
  ['moguzo:slot-3','NORMAL_LONG'],['godan:slot-2','NORMAL_SHORT'],
]);
assert.deepEqual(plain(moves.filter((move)=>move.moveKind==='stance').map((move)=>move.id)),['godan:slot-3']);

const niren=moves.find((move)=>move.id==='pisuke:slot-1');
const kasumi=moves.find((move)=>move.id==='pisuke:slot-4');
assert.deepEqual(niren.contactSchedule,{status:'OPEN_TIMING',count:2,activeOffsetsF:null});
assert.deepEqual(kasumi.contactSchedule,{status:'OPEN_TIMING',count:3,activeOffsetsF:null});
assert.ok(moves.filter((move)=>move.contactSchedule.count===1).every((move)=>move.contactSchedule.activeOffsetsF[0]===0));
const tsumuji=moves.find((move)=>move.id==='pisuke:slot-7');
assert.equal(tsumuji.forwardMovement,'CHASE_TO_CONTACT');
assert.equal(tsumuji.maximumApproachSteps,2);
const nekosogi=moves.find((move)=>move.id==='godan:slot-6');
assert.equal(nekosogi.downType,'lightDown');
assert.equal(nekosogi.followupAllowed,false);
assert.equal(nekosogi.advantagePolicy,'not_applicable');

assert.deepEqual(reachPosturesV2(0),['CLINCH']);
assert.deepEqual(reachPosturesV2(1),['CLINCH','NORMAL']);
assert.deepEqual(reachPosturesV2(2),['CLINCH','NORMAL','SWAY_SHALLOW']);
assert.deepEqual(reachPosturesV2(3),['CLINCH','NORMAL','SWAY_SHALLOW','SWAY_DEEP']);

const matchups=buildCpuMatchupRunsV2();
assert.equal(matchups.length,45);
assert.equal(matchups.filter((run)=>run.mirror).length,9);
assert.equal(matchups.filter((run)=>!run.mirror).length,36);
assert.ok(matchups.every((run)=>run.sideSwapped));
assert.equal(new Set(matchups.map((run)=>`${run.left}|${run.right}`)).size,45);

const pair=Object.freeze({0:Object.freeze({hp:100,posture:'NORMAL'}),1:Object.freeze({hp:80,posture:'SWAY_DEEP'})});
assert.deepEqual(plain(swapPlayerPairV2(pair)),{0:{hp:80,posture:'SWAY_DEEP'},1:{hp:100,posture:'NORMAL'}});
assert.deepEqual(plain(swapPlayerPairV2(swapPlayerPairV2(pair))),plain(pair));

assert.deepEqual(findCancelCyclesV2(moves),[]);
const cycleMoves=moves.slice(0,2).map((move,index)=>Object.freeze({...move,cancelWindows:Object.freeze({onHit:Object.freeze({statusTag:'PROTOTYPE_CANDIDATE',basis:'FIRST_CONTACT',startOffsetF:0,endOffsetF:1,allowedMoveIds:Object.freeze([moves[1-index].id]),oncePerCombo:false}),onBlock:null,onWhiff:null})}));
assert.ok(findCancelCyclesV2(cycleMoves).length>0);

const hash=hashCombatContractClosureV2(COMBAT_CONTRACT_V2,moves);
assert.match(hash,/^[0-9a-f]{8}$/);
assert.equal(hash,hashCombatContractClosureV2(COMBAT_CONTRACT_V2,materializeMoveSpecV2Closure(json)));
const changed=moves.map((move)=>move.id==='pisuke:slot-7'?Object.freeze({...move,maximumApproachSteps:1}):move);
assert.notEqual(hash,hashCombatContractClosureV2(COMBAT_CONTRACT_V2,changed));

const invalidFormal=structuredClone(json);invalidFormal.statusTag='FORMAL';
assert.equal(validateMoveSpecV2CandidateDocument(invalidFormal).ok,false);
const invalidThrow=structuredClone(json);invalidThrow.moves.find((move)=>move.id==='moguzo:slot-3').contactKind.throwRange=null;
assert.equal(validateMoveSpecV2CandidateDocument(invalidThrow).ok,false);
const invalidMulti=structuredClone(json);invalidMulti.moves.find((move)=>move.id==='pisuke:slot-4').contactSchedule={status:'FIXED_STRUCTURE',count:3,activeOffsetsF:[0]};
assert.equal(validateMoveSpecV2CandidateDocument(invalidMulti).ok,false);
const invalidChase=structuredClone(json);invalidChase.moves.find((move)=>move.id==='pisuke:slot-7').maximumApproachSteps=3;
assert.equal(validateMoveSpecV2CandidateDocument(invalidChase).ok,false);
const invalidResource=structuredClone(json);invalidResource.defaults.resourcePolicyId='fixed.s.gain';
assert.equal(validateMoveSpecV2CandidateDocument(invalidResource).ok,false);

assert.ok(document.includes('live runtime / existing BAL / online protocol       = HOLD'));
assert.ok(document.includes('SWAY_SHALLOW'));
assert.ok(document.includes('maximumApproachSteps'));
assert.ok(document.includes('resource.action-contact-v0.2'));
assert.ok(document.includes('36'));
assert.ok(document.includes('9'));

for(const path of ['../src/core/v2-types/combat-contract-v2.ts','../src/core/v2-validation/combat-contract-v2-validation.ts']){
  const source=readFileSync(new URL(path,import.meta.url),'utf8');
  for(const forbidden of ['prototype/','dist/','runtime/','server/','assets/','Math.random','Date.now','document.','window.','localStorage','fetch('])assert.equal(source.includes(forbidden),false,`${path}: forbidden live dependency ${forbidden}`);
}

console.log(`combat v2 contract tests passed; moves=21; current=9; candidate=12; matchups=36+9; multi=2; cycles=0; hash=${hash}`);
