import { fnv1a32, stableStringify } from '../determinism.ts';
import {
  COMBAT_CONTRACT_V2,
  type BattleClocksV2,
  type FreezeKindV2,
  type MoveSpecV2Closure,
  type PlayerIdV2,
  type PostureStateV2,
} from '../v2-types/combat-contract-v2.ts';
import {
  BATTLE_STATE_V2_AUTHORITY,
  BATTLE_STATE_V2_VERSION,
  RESOLUTION_REASON_CODES_V2,
  type BattleStateV2,
  type FighterStateV2,
  type FrameBatchIntentV2,
  type RosterCharacterIdV2,
} from '../v2-types/battle-state-v2.ts';
import {
  MOVE_SPEC_V2_VERSION,
  type MoveArmorDefinitionV2,
  type MoveInvulnerabilityDefinitionV2,
  type MoveSpecV2,
  type MoveSpecV2Registry,
  type ResolvedContractStatusV2,
  type TaggedValueV2,
} from '../v2-types/move-spec-v2.ts';
import { reachPosturesV2 } from './combat-contract-v2-validation.ts';

export type ValidationResultV2=Readonly<{ok:boolean;errors:readonly string[]}>;

export type FighterSeedV2=Readonly<{
  characterId:RosterCharacterIdV2;
  maxHp:number;
  maxGuard:number;
  maxSGauge:number;
  maxRoarGauge:number;
  abilityId:string;
}>;

export type InitialBattleStateOptionsV2=Readonly<{
  fighters:Readonly<Record<PlayerIdV2,FighterSeedV2>>;
  roundIndex:number;
  timerCombatF:number;
  timeoutEnabled:boolean;
}>;

const POSTURES=new Set(['NORMAL','SWAY_SHALLOW','SWAY_DEEP','CROUCH','LUNGE','CLINCH','DOWN']);
const CONTROLS=new Set(['actionable','committed','guarding','dodging','mikiri','hitstun','blockstun','guard_break','throw_startup','thrown','down','wake','cinematic','ko','win']);
const ACTION_PHASES=new Set(['idle','telegraph','startup','active','recovery','completed']);
const END_POSITIONS=new Set(['KEEP','NORMAL_RESET','CLINCH','OVEREXTENDED','DOWN_RESET']);
const FORWARD_MOVEMENTS=new Set(['NONE','ONE_STEP','TWO_STEP','CHASE_TO_CONTACT','ENTER_CLINCH']);
const DOWN_TYPES=new Set(['NONE','lightDown','hardDown','throwDown','ultimateDown']);
const STATUS_TAGS=new Set(['CURRENT_ANCHOR','PROTOTYPE_CANDIDATE','FORMAL','OPEN']);
const BATCH_HASH=/^[0-9a-f]{8}$/;

function integer(value:unknown,min=0):value is number{return Number.isInteger(value)&&Number(value)>=min;}
function finite(value:unknown):value is number{return typeof value==='number'&&Number.isFinite(value);}
function text(value:unknown):value is string{return typeof value==='string'&&value.length>0;}
function freezePair<T>(zero:T,one:T):Readonly<Record<PlayerIdV2,T>>{return Object.freeze({0:zero,1:one});}
function result(errors:string[]):ValidationResultV2{return Object.freeze({ok:errors.length===0,errors:Object.freeze(errors)});}

export function openTaggedValueV2<T>(sourceRef:string|null=null,note:string|null=null):TaggedValueV2<T>{
  return Object.freeze({status:'OPEN',value:null,sourceRef,note});
}

export function resolvedTaggedValueV2<T>(status:ResolvedContractStatusV2,value:T,sourceRef:string,note:string|null=null):TaggedValueV2<T>{
  if(!sourceRef)throw new TypeError('resolved tagged value requires sourceRef');
  return Object.freeze({status,value,sourceRef,note});
}

function validateTaggedValue<T>(value:TaggedValueV2<T>,path:string,errors:string[],predicate:(candidate:T)=>boolean):void{
  if(!value||typeof value!=='object'){errors.push(`${path}: tagged value required`);return;}
  if(value.status==='OPEN'){
    if(value.value!==null)errors.push(`${path}: OPEN value must be null`);
    return;
  }
  if(!['CURRENT_ANCHOR','PROTOTYPE_CANDIDATE','FORMAL'].includes(value.status))errors.push(`${path}: invalid status`);
  if(!text(value.sourceRef))errors.push(`${path}: resolved sourceRef required`);
  if(!predicate(value.value))errors.push(`${path}: invalid resolved value`);
}

function validateContactSchedule(spec:MoveSpecV2,path:string,errors:string[]):void{
  const schedule=spec.contactSchedule;
  if(!integer(schedule.count,1))errors.push(`${path}.count: positive integer required`);
  if(schedule.status==='FIXED_STRUCTURE'){
    if(!Array.isArray(schedule.activeOffsetsF))errors.push(`${path}.activeOffsetsF: fixed array required`);
    else{
      if(schedule.activeOffsetsF.length!==schedule.count)errors.push(`${path}.activeOffsetsF: count mismatch`);
      if(!schedule.activeOffsetsF.every((frame)=>integer(frame)))errors.push(`${path}.activeOffsetsF: non-negative integers required`);
    }
  }else if(schedule.status==='OPEN_TIMING'){
    if(schedule.activeOffsetsF!==null)errors.push(`${path}.activeOffsetsF: OPEN timing must be null`);
  }else errors.push(`${path}.status: invalid`);
}

function validateCancelWindow(window:MoveSpecV2['cancelWindows']['onHit'],path:string,errors:string[]):void{
  if(window===null)return;
  if(!STATUS_TAGS.has(window.statusTag))errors.push(`${path}.statusTag: invalid`);
  if(!['FIRST_CONTACT','LAST_CONTACT','ACTION_START','ACTION_END'].includes(window.basis))errors.push(`${path}.basis: invalid`);
  if(window.statusTag==='OPEN'){
    if(window.startOffsetF!==null||window.endOffsetF!==null)errors.push(`${path}: OPEN offsets must be null`);
  }else{
    if(!integer(window.startOffsetF)||!integer(window.endOffsetF))errors.push(`${path}: resolved offsets required`);
    else if(window.startOffsetF>window.endOffsetF)errors.push(`${path}: start after end`);
  }
  if(!Array.isArray(window.allowedMoveIds)||!window.allowedMoveIds.every(text))errors.push(`${path}.allowedMoveIds: string array required`);
  if(typeof window.oncePerCombo!=='boolean')errors.push(`${path}.oncePerCombo: boolean required`);
}

function armorValid(value:MoveArmorDefinitionV2|null):boolean{
  return value===null||(integer(value.armorHits,1)&&integer(value.startF)&&integer(value.endF)&&value.startF<=value.endF);
}
function invulnerabilityValid(value:MoveInvulnerabilityDefinitionV2|null):boolean{
  return value===null||(['strike','throw','all'].includes(value.kind)&&integer(value.startF)&&integer(value.endF)&&value.startF<=value.endF);
}

function openPaths(value:unknown,path='$',output:string[]=[]):string[]{
  if(value===null||typeof value!=='object')return output;
  const record=value as Record<string,unknown>;
  if(record.status==='OPEN'&&Object.prototype.hasOwnProperty.call(record,'value'))output.push(path);
  if(Array.isArray(value))value.forEach((entry,index)=>openPaths(entry,`${path}[${index}]`,output));
  else for(const [key,entry] of Object.entries(record))openPaths(entry,`${path}.${key}`,output);
  return output;
}

export function createOpenMoveSpecV2FromClosure(closure:MoveSpecV2Closure):MoveSpecV2{
  const numericSource='MAMOKEN_CURRENT_3_CHARACTERS_MOVESPEC_v0.1.json';
  const pendingNote='numeric import deferred to G08';
  const openNumber=()=>openTaggedValueV2<number>(numericSource,pendingNote);
  const openPosition=()=>openTaggedValueV2<'KEEP'|'NORMAL_RESET'|'CLINCH'|'OVEREXTENDED'|'DOWN_RESET'>(null,'position result not fixed in G01');
  const standardAdvantage=closure.advantagePolicy==='standard_contact_formula';
  return Object.freeze({
    schemaVersion:MOVE_SPEC_V2_VERSION,
    id:closure.id,
    commandId:closure.id,
    characterId:closure.characterId,
    slot:closure.slot,
    nameJa:closure.nameJa,
    statusTag:'PROTOTYPE_CANDIDATE',
    authority:'shadow_only',
    sourceStatus:closure.sourceStatus,
    moveKind:closure.moveKind,
    contactKind:closure.contactKind,
    timing:Object.freeze({telegraphF:openNumber(),startupF:openNumber(),activeDurationF:openNumber(),recoveryF:openNumber(),totalDurationF:openNumber()}),
    contactSchedule:closure.contactSchedule,
    reachClass:openTaggedValueV2<0|1|2|3>(null,'reach import deferred to G08'),
    targetPostures:Object.freeze([]),
    movement:Object.freeze({
      forwardMovement:closure.forwardMovement,
      maximumApproachSteps:closure.maximumApproachSteps,
      endPositionOnHit:openPosition(),
      endPositionOnBlock:openPosition(),
      endPositionOnWhiff:openPosition(),
    }),
    downPolicy:Object.freeze({
      downType:closure.downType,
      followupAllowed:closure.followupAllowed,
      wakeProfileId:closure.downType==='NONE'?null:openTaggedValueV2<string>(null,'wake profile not fixed in G01'),
    }),
    damage:Object.freeze({damage:openNumber(),chipDamage:openNumber(),guardDamage:openNumber(),hitstopF:openNumber()}),
    advantage:Object.freeze({
      policy:closure.advantagePolicy,
      hitAdvF:standardAdvantage?openTaggedValueV2<number>(numericSource,pendingNote):null,
      blockAdvF:standardAdvantage?openTaggedValueV2<number>(numericSource,pendingNote):null,
      whiffExtraRecoveryF:standardAdvantage?openTaggedValueV2<number>(numericSource,pendingNote):null,
    }),
    cancelWindows:closure.cancelWindows,
    armor:openTaggedValueV2<MoveArmorDefinitionV2|null>(null,'armor presence not fixed in G01'),
    invulnerability:openTaggedValueV2<MoveInvulnerabilityDefinitionV2|null>(null,'invulnerability presence not fixed in G01'),
    resourcePolicyId:closure.resourcePolicyId,
    tags:Object.freeze(['g00-closure','g01-open-numerics']),
  });
}

export function validateMoveSpecV2(spec:MoveSpecV2):ValidationResultV2{
  const errors:string[]=[];
  if(spec.schemaVersion!==MOVE_SPEC_V2_VERSION)errors.push('schemaVersion: invalid');
  if(!text(spec.id)||!text(spec.commandId)||!text(spec.characterId)||!text(spec.nameJa))errors.push('identity: required');
  if(!integer(spec.slot,1))errors.push('slot: positive integer required');
  if(!STATUS_TAGS.has(spec.statusTag))errors.push('statusTag: invalid');
  if(spec.authority!=='shadow_only'&&spec.authority!=='none')errors.push('authority: invalid');
  if(spec.moveKind!==spec.contactKind.kind)errors.push('moveKind/contactKind mismatch');
  if(spec.contactKind.kind==='strike'&&!['HIGH','MID','LOW'].includes(spec.contactKind.level))errors.push('contactKind.level: invalid');
  if(spec.contactKind.kind==='throw'&&!['CLINCH_ONLY','NORMAL_SHORT','NORMAL_LONG'].includes(spec.contactKind.throwRange))errors.push('contactKind.throwRange: invalid');
  if(spec.contactKind.kind==='stance'&&!text(spec.contactKind.stanceId))errors.push('contactKind.stanceId: required');

  for(const [key,value] of Object.entries(spec.timing))validateTaggedValue(value,`timing.${key}`,errors,(candidate)=>integer(candidate));
  for(const [key,value] of Object.entries(spec.damage))validateTaggedValue(value,`damage.${key}`,errors,(candidate)=>integer(candidate));
  validateContactSchedule(spec,'contactSchedule',errors);
  validateTaggedValue(spec.reachClass,'reachClass',errors,(candidate)=>integer(candidate)&&candidate<=3);
  if(spec.reachClass.status==='OPEN'){
    if(spec.targetPostures.length!==0)errors.push('targetPostures: must stay empty while reach is OPEN');
  }else if(JSON.stringify(spec.targetPostures)!==JSON.stringify(reachPosturesV2(spec.reachClass.value)))errors.push('targetPostures: reach set mismatch');

  if(!FORWARD_MOVEMENTS.has(spec.movement.forwardMovement))errors.push('movement.forwardMovement: invalid');
  if(spec.movement.forwardMovement==='CHASE_TO_CONTACT'){
    if(!integer(spec.movement.maximumApproachSteps,1)||spec.movement.maximumApproachSteps>2)errors.push('movement.maximumApproachSteps: 1..2 required');
  }else if(spec.movement.maximumApproachSteps!==null)errors.push('movement.maximumApproachSteps: only chase may set it');
  for(const [key,value] of [['endPositionOnHit',spec.movement.endPositionOnHit],['endPositionOnBlock',spec.movement.endPositionOnBlock],['endPositionOnWhiff',spec.movement.endPositionOnWhiff]] as const){
    validateTaggedValue(value,`movement.${key}`,errors,(candidate)=>END_POSITIONS.has(candidate));
  }

  if(!DOWN_TYPES.has(spec.downPolicy.downType))errors.push('downPolicy.downType: invalid');
  if(typeof spec.downPolicy.followupAllowed!=='boolean')errors.push('downPolicy.followupAllowed: boolean required');
  if(spec.downPolicy.downType==='NONE'){
    if(spec.downPolicy.wakeProfileId!==null)errors.push('downPolicy.wakeProfileId: non-down move must use null');
  }else{
    if(spec.downPolicy.wakeProfileId===null)errors.push('downPolicy.wakeProfileId: down move requires tagged value');
    else validateTaggedValue(spec.downPolicy.wakeProfileId,'downPolicy.wakeProfileId',errors,text);
  }

  if(spec.advantage.policy==='not_applicable'){
    if(spec.advantage.hitAdvF!==null||spec.advantage.blockAdvF!==null||spec.advantage.whiffExtraRecoveryF!==null)errors.push('advantage: not_applicable must use null fields');
  }else if(spec.advantage.policy==='standard_contact_formula'){
    for(const [key,value] of [['hitAdvF',spec.advantage.hitAdvF],['blockAdvF',spec.advantage.blockAdvF],['whiffExtraRecoveryF',spec.advantage.whiffExtraRecoveryF]] as const){
      if(value===null)errors.push(`advantage.${key}: tagged value required`);
      else validateTaggedValue(value,`advantage.${key}`,errors,finite);
    }
  }else errors.push('advantage.policy: invalid');
  const excludesAdvantage=spec.moveKind==='throw'||spec.moveKind==='stance'||spec.downPolicy.downType!=='NONE';
  if(excludesAdvantage&&spec.advantage.policy!=='not_applicable')errors.push('advantage.policy: throw/down/stance must be not_applicable');

  validateCancelWindow(spec.cancelWindows.onHit,'cancelWindows.onHit',errors);
  validateCancelWindow(spec.cancelWindows.onBlock,'cancelWindows.onBlock',errors);
  validateCancelWindow(spec.cancelWindows.onWhiff,'cancelWindows.onWhiff',errors);
  validateTaggedValue(spec.armor,'armor',errors,armorValid);
  validateTaggedValue(spec.invulnerability,'invulnerability',errors,invulnerabilityValid);
  if(!text(spec.resourcePolicyId))errors.push('resourcePolicyId: required');
  if(new Set(spec.tags).size!==spec.tags.length||!spec.tags.every(text))errors.push('tags: unique strings required');
  if(spec.statusTag==='FORMAL')for(const path of openPaths(spec))errors.push(`${path}: FORMAL spec cannot contain OPEN value`);
  return result(errors);
}

export function validateMoveSpecV2Registry(registry:MoveSpecV2Registry):ValidationResultV2{
  const errors:string[]=[];
  if(registry.version!=='mamoken-movespec-v2-registry-v0.1')errors.push('version: invalid');
  if(registry.statusTag!=='PROTOTYPE_CANDIDATE'||registry.authority!=='shadow_only')errors.push('registry authority boundary invalid');
  if(new Set(registry.moves.map((move)=>move.id)).size!==registry.moves.length)errors.push('moves: duplicate id');
  for(const move of registry.moves)for(const error of validateMoveSpecV2(move).errors)errors.push(`${move.id}:${error}`);
  return result(errors);
}

function createFighter(playerId:PlayerIdV2,seed:FighterSeedV2):FighterStateV2{
  if(!integer(seed.maxHp,1)||!integer(seed.maxGuard,1)||!integer(seed.maxSGauge,1)||!integer(seed.maxRoarGauge,1)||!text(seed.abilityId))throw new TypeError(`player ${playerId}: invalid fighter seed`);
  return Object.freeze({
    playerId,
    characterId:seed.characterId,
    controlState:'actionable',
    postureState:'NORMAL',
    action:Object.freeze({actionId:null,moveId:null,phase:'idle',startedCombatFrame:null,actionFrame:0,currentContactIndex:0,cancelConsumed:false}),
    defense:Object.freeze({guardHeld:false,mikiriWindowF:0,dodgeWindowF:0,armorHitsRemaining:0,lastResult:'NONE'}),
    ability:Object.freeze({abilityId:seed.abilityId,phase:'idle',values:Object.freeze({})}),
    resources:Object.freeze({hp:seed.maxHp,maxHp:seed.maxHp,guard:seed.maxGuard,maxGuard:seed.maxGuard,sGauge:0,maxSGauge:seed.maxSGauge,roarGauge:0,maxRoarGauge:seed.maxRoarGauge}),
    timers:Object.freeze({hitstunF:0,blockstunF:0,guardBreakF:0,downF:0,wakeF:0,invulnerabilityF:0}),
    inputHold:Object.freeze({activeHolds:Object.freeze({}),completedHolds:Object.freeze([])}),
    bulletCharge:seed.characterId==='bullet'?Object.freeze({value:0,lastGainSignature:null,maxReady:false}):null,
  });
}

export function createInitialBattleStateV2(options:InitialBattleStateOptionsV2):BattleStateV2{
  if(!integer(options.roundIndex,1)||!integer(options.timerCombatF))throw new TypeError('invalid round options');
  const state:BattleStateV2=Object.freeze({
    version:BATTLE_STATE_V2_VERSION,
    combatContractVersion:COMBAT_CONTRACT_V2.version,
    authority:BATTLE_STATE_V2_AUTHORITY,
    liveRuntimeAuthority:false,
    flow:'fight',
    clocks:Object.freeze({simulationFrame:0,combatFrame:0,fighterActionFrame:freezePair(0,0)}),
    freeze:Object.freeze({kind:'NONE',remainingF:0,sourceId:null}),
    fighters:freezePair(createFighter(0,options.fighters[0]),createFighter(1,options.fighters[1])),
    spatial:Object.freeze({engagement:'NORMAL',clinchRemainingF:0,overextendedPlayer:null,sideSwap:false,lastPositionBatchId:0}),
    round:Object.freeze({roundIndex:options.roundIndex,timerCombatF:options.timerCombatF,wins:freezePair(0,0),timeoutEnabled:options.timeoutEnabled}),
    lastBatchId:0,
  });
  const validation=validateBattleStateV2(state);
  if(!validation.ok)throw new Error(validation.errors.join('\n'));
  return state;
}

function validateFighter(state:BattleStateV2,fighter:FighterStateV2,playerId:PlayerIdV2,errors:string[]):void{
  const path=`fighters.${playerId}`;
  if(fighter.playerId!==playerId)errors.push(`${path}.playerId: key mismatch`);
  if(!CONTROLS.has(fighter.controlState))errors.push(`${path}.controlState: invalid`);
  if(!POSTURES.has(fighter.postureState))errors.push(`${path}.postureState: invalid`);
  if(!ACTION_PHASES.has(fighter.action.phase))errors.push(`${path}.action.phase: invalid`);
  if(fighter.action.phase==='idle'){
    if(fighter.action.actionId!==null||fighter.action.moveId!==null||fighter.action.startedCombatFrame!==null||fighter.action.actionFrame!==0)errors.push(`${path}.action: idle invariant violated`);
  }else if(!text(fighter.action.actionId)||fighter.action.startedCombatFrame===null||!integer(fighter.action.startedCombatFrame))errors.push(`${path}.action: active identity required`);
  if(!integer(fighter.action.actionFrame)||!integer(fighter.action.currentContactIndex))errors.push(`${path}.action: non-negative counters required`);
  if(state.clocks.fighterActionFrame[playerId]!==fighter.action.actionFrame)errors.push(`${path}.actionFrame: clock mismatch`);
  for(const [key,value] of Object.entries(fighter.timers))if(!integer(value))errors.push(`${path}.timers.${key}: non-negative integer required`);
  for(const [value,max,key] of [[fighter.resources.hp,fighter.resources.maxHp,'hp'],[fighter.resources.guard,fighter.resources.maxGuard,'guard'],[fighter.resources.sGauge,fighter.resources.maxSGauge,'sGauge'],[fighter.resources.roarGauge,fighter.resources.maxRoarGauge,'roarGauge']] as const){
    if(!integer(max,1)||!integer(value)||value>max)errors.push(`${path}.resources.${key}: invalid range`);
  }
  if((fighter.controlState==='down'||fighter.controlState==='ko')&&fighter.postureState!=='DOWN')errors.push(`${path}: down/ko control requires DOWN posture`);
  if(fighter.characterId==='bullet'){
    if(fighter.bulletCharge===null)errors.push(`${path}.bulletCharge: Bullet requires charge state`);
    else if(!integer(fighter.bulletCharge.value)||fighter.bulletCharge.value>3||fighter.bulletCharge.maxReady!==(fighter.bulletCharge.value===3))errors.push(`${path}.bulletCharge: invalid`);
  }else if(fighter.bulletCharge!==null)errors.push(`${path}.bulletCharge: non-Bullet must use null`);
  for(const [direction,hold] of Object.entries(fighter.inputHold.activeHolds)){
    if(!['BACK','DOWN','FORWARD'].includes(direction)||!hold||!integer(hold.startSimulationFrame)||!integer(hold.holdCombatF))errors.push(`${path}.inputHold.activeHolds.${direction}: invalid`);
    else if(hold.startSimulationFrame>state.clocks.simulationFrame)errors.push(`${path}.inputHold.activeHolds.${direction}: future start`);
  }
  for(const [index,hold] of fighter.inputHold.completedHolds.entries())if(!['BACK','DOWN','FORWARD'].includes(hold.direction)||!integer(hold.holdCombatF)||!integer(hold.releasedSimulationFrame)||hold.releasedSimulationFrame>state.clocks.simulationFrame)errors.push(`${path}.inputHold.completedHolds[${index}]: invalid`);
}

export function validateBattleStateV2(state:BattleStateV2):ValidationResultV2{
  const errors:string[]=[];
  if(state.version!==BATTLE_STATE_V2_VERSION)errors.push('version: invalid');
  if(state.combatContractVersion!==COMBAT_CONTRACT_V2.version)errors.push('combatContractVersion: mismatch');
  if(state.authority!==BATTLE_STATE_V2_AUTHORITY||state.liveRuntimeAuthority!==false)errors.push('authority boundary violated');
  for(const [key,value] of Object.entries(state.clocks)){
    if(key==='fighterActionFrame')continue;
    if(!integer(value))errors.push(`clocks.${key}: non-negative integer required`);
  }
  if(!integer(state.clocks.fighterActionFrame[0])||!integer(state.clocks.fighterActionFrame[1]))errors.push('clocks.fighterActionFrame: invalid');
  if(state.freeze.kind==='NONE'){
    if(state.freeze.remainingF!==0||state.freeze.sourceId!==null)errors.push('freeze: NONE invariant violated');
  }else if(!integer(state.freeze.remainingF,1)||!text(state.freeze.sourceId))errors.push('freeze: active freeze requires duration and source');
  validateFighter(state,state.fighters[0],0,errors);
  validateFighter(state,state.fighters[1],1,errors);
  if(state.spatial.sideSwap!==false)errors.push('spatial.sideSwap: current contract requires false');
  if(!integer(state.spatial.clinchRemainingF)||!integer(state.spatial.lastPositionBatchId)||state.spatial.lastPositionBatchId>state.lastBatchId)errors.push('spatial: invalid counters');
  if(state.spatial.engagement==='CLINCH'){
    if(state.spatial.clinchRemainingF<1||state.fighters[0].postureState!=='CLINCH'||state.fighters[1].postureState!=='CLINCH')errors.push('spatial: CLINCH invariant violated');
  }else if(state.spatial.clinchRemainingF!==0)errors.push('spatial: NORMAL engagement requires zero clinch timer');
  if(state.spatial.overextendedPlayer!==null&&state.spatial.overextendedPlayer!==0&&state.spatial.overextendedPlayer!==1)errors.push('spatial.overextendedPlayer: invalid');
  if(!integer(state.round.roundIndex,1)||!integer(state.round.timerCombatF)||!integer(state.round.wins[0])||!integer(state.round.wins[1]))errors.push('round: invalid counters');
  if(!integer(state.lastBatchId))errors.push('lastBatchId: invalid');
  return result(errors);
}

export function advanceBattleClocksV2(clocks:BattleClocksV2,freezeKind:FreezeKindV2,activeActions:Readonly<Record<PlayerIdV2,boolean>>):BattleClocksV2{
  const policy=COMBAT_CONTRACT_V2.freezePolicy[freezeKind];
  return Object.freeze({
    simulationFrame:clocks.simulationFrame+(policy.simulationFrame?1:0),
    combatFrame:clocks.combatFrame+(policy.combatFrame?1:0),
    fighterActionFrame:freezePair(
      clocks.fighterActionFrame[0]+(policy.actionTimeline&&activeActions[0]?1:0),
      clocks.fighterActionFrame[1]+(policy.actionTimeline&&activeActions[1]?1:0),
    ),
  });
}

export function validateFrameBatchIntentV2(batch:FrameBatchIntentV2):ValidationResultV2{
  const errors:string[]=[];
  if(!integer(batch.batchId,1)||!integer(batch.sourceSimulationFrame)||!integer(batch.sourceCombatFrame))errors.push('batch counters: invalid');
  if(!BATCH_HASH.test(batch.preStateHash))errors.push('preStateHash: FNV-1a hash required');
  for(const playerId of [0,1] as const){
    const action=batch.actions[playerId];
    if(action&&(action.playerId!==playerId||action.batchId!==batch.batchId||action.sourceSimulationFrame!==batch.sourceSimulationFrame||action.preStateHash!==batch.preStateHash||!text(action.actionId)||!integer(action.priorityIndex)))errors.push(`actions.${playerId}: batch mismatch`);
    const position=batch.positions[playerId];
    if(position&&(position.playerId!==playerId||position.batchId!==batch.batchId||position.sourceCombatFrame!==batch.sourceCombatFrame||position.preStateHash!==batch.preStateHash||!FORWARD_MOVEMENTS.has(position.movement)||!integer(position.requestedSteps)||!END_POSITIONS.has(position.requestedEndPosition)))errors.push(`positions.${playerId}: batch mismatch`);
  }
  for(const [index,contact] of batch.contacts.entries()){
    if(contact.attacker===contact.defender||contact.batchId!==batch.batchId||contact.sourceCombatFrame!==batch.sourceCombatFrame||contact.preStateHash!==batch.preStateHash||!text(contact.moveId)||!integer(contact.contactIndex)||!integer(contact.reachClass)||contact.reachClass>3)errors.push(`contacts[${index}]: batch mismatch`);
    if(JSON.stringify(contact.targetPostures)!==JSON.stringify(reachPosturesV2(contact.reachClass)))errors.push(`contacts[${index}].targetPostures: reach set mismatch`);
  }
  return result(errors);
}

function swapPlayer(playerId:PlayerIdV2):PlayerIdV2{return playerId===0?1:0;}
export function swapFrameBatchIntentPlayersV2(batch:FrameBatchIntentV2):FrameBatchIntentV2{
  const swapAction=(action:FrameBatchIntentV2['actions'][PlayerIdV2],playerId:PlayerIdV2)=>action?Object.freeze({...action,playerId}):null;
  const swapPosition=(position:FrameBatchIntentV2['positions'][PlayerIdV2],playerId:PlayerIdV2)=>position?Object.freeze({...position,playerId}):null;
  return Object.freeze({
    ...batch,
    actions:freezePair(swapAction(batch.actions[1],0),swapAction(batch.actions[0],1)),
    positions:freezePair(swapPosition(batch.positions[1],0),swapPosition(batch.positions[0],1)),
    contacts:Object.freeze(batch.contacts.map((contact)=>Object.freeze({...contact,attacker:swapPlayer(contact.attacker),defender:swapPlayer(contact.defender)}))),
  });
}

export function validateResolutionReasonCodesV2():ValidationResultV2{
  const errors:string[]=[];
  if(new Set(RESOLUTION_REASON_CODES_V2).size!==RESOLUTION_REASON_CODES_V2.length)errors.push('reason codes: duplicate');
  for(const code of RESOLUTION_REASON_CODES_V2)if(!/^(OK|REJECT|RESULT)_[A-Z0-9_]+$/.test(code))errors.push(`reason code: invalid ${code}`);
  return result(errors);
}

export function hashBattleStateV2(state:BattleStateV2):string{return fnv1a32(stableStringify(state));}
export function hashMoveSpecV2(spec:MoveSpecV2):string{return fnv1a32(stableStringify(spec));}
