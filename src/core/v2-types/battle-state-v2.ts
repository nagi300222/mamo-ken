// G01.2 RNG and combo schema correction
import type {
  BattleClocksV2,
  BattleFlowV2,
  BulletChargeStateV2,
  ContactKindV2,
  DownTypeV2,
  EngagementStateV2,
  EndPositionV2,
  FighterControlStateV2,
  ForwardMovementV2,
  FreezeKindV2,
  InputHoldStateV2,
  PlayerIdV2,
  PostureStateV2,
} from './combat-contract-v2.ts';

export const BATTLE_STATE_V2_VERSION='mamoken-battle-state-v2-v0.3' as const;
export const BATTLE_STATE_V2_AUTHORITY='shadow_only' as const;

export type RosterCharacterIdV2='moguzo'|'pisuke'|'godan'|'hakuma'|'chirka'|'takimaru'|'yomikage'|'bullet'|'dark_moguzo';
export type ActionPhaseV2='idle'|'telegraph'|'startup'|'active'|'recovery'|'completed';
export type DefenseResultKindV2='NONE'|'GUARD'|'MIKIRI'|'DODGE'|'ARMOR'|'GUARD_BREAK';
export type ContactOutcomeV2='HIT'|'BLOCK'|'MIKIRI'|'DODGE'|'ARMOR'|'THROW'|'WHIFF'|'TRADE'|'STANCE';
export type ActionClassV2='ULTIMATE'|'ROAR'|'ABILITY'|'LONG_COMMAND'|'SHORT_COMMAND'|'THROW_BRANCH'|'STEP_CANCEL'|'NORMAL_CHAIN';

export type ResolutionReasonCodeV2=
  |'OK_ACTIONABLE'
  |'OK_BATCH_ACCEPTED'
  |'REJECT_NOT_FIGHT'
  |'REJECT_GLOBAL_FREEZE'
  |'REJECT_FIGHTER_LOCKED'
  |'REJECT_INPUT_INVALID'
  |'REJECT_COMMAND_NOT_FOUND'
  |'REJECT_CONDITION_FAILED'
  |'REJECT_OUT_OF_REACH'
  |'REJECT_TARGET_POSTURE'
  |'REJECT_THROW_RANGE'
  |'REJECT_CANCEL_WINDOW'
  |'REJECT_RESOURCE'
  |'REJECT_FAIL_CLOSED'
  |'RESULT_HIT'
  |'RESULT_BLOCK'
  |'RESULT_MIKIRI'
  |'RESULT_DODGE'
  |'RESULT_ARMOR'
  |'RESULT_THROW'
  |'RESULT_WHIFF'
  |'RESULT_TRADE'
  |'RESULT_STANCE';

export const RESOLUTION_REASON_CODES_V2=Object.freeze([
  'OK_ACTIONABLE','OK_BATCH_ACCEPTED','REJECT_NOT_FIGHT','REJECT_GLOBAL_FREEZE','REJECT_FIGHTER_LOCKED',
  'REJECT_INPUT_INVALID','REJECT_COMMAND_NOT_FOUND','REJECT_CONDITION_FAILED','REJECT_OUT_OF_REACH',
  'REJECT_TARGET_POSTURE','REJECT_THROW_RANGE','REJECT_CANCEL_WINDOW','REJECT_RESOURCE','REJECT_FAIL_CLOSED',
  'RESULT_HIT','RESULT_BLOCK','RESULT_MIKIRI','RESULT_DODGE','RESULT_ARMOR','RESULT_THROW','RESULT_WHIFF',
  'RESULT_TRADE','RESULT_STANCE',
] as const satisfies readonly ResolutionReasonCodeV2[]);

export type DeterministicScalarV2=string|number|boolean|null;

export type ActionStateV2=Readonly<{
  actionId:string|null;
  moveId:string|null;
  phase:ActionPhaseV2;
  startedCombatFrame:number|null;
  actionFrame:number;
  currentContactIndex:number;
  cancelConsumed:boolean;
}>;

export type DefenseStateV2=Readonly<{
  guardHeld:boolean;
  mikiriWindowF:number;
  dodgeWindowF:number;
  armorHitsRemaining:number;
  lastResult:DefenseResultKindV2;
}>;

export type AbilityStateV2=Readonly<{
  abilityId:string;
  phase:string;
  values:Readonly<Record<string,DeterministicScalarV2>>;
}>;

export type FighterResourcesV2=Readonly<{
  hp:number;
  maxHp:number;
  guard:number;
  maxGuard:number;
  sGauge:number;
  maxSGauge:number;
  focusGauge:number;
  maxFocusGauge:number;
  ultimateStock:number;
  maxUltimateStock:number;
}>;

export type FighterComboStateV2=Readonly<{
  count:number;
}>;

export type FighterTimersV2=Readonly<{
  hitstunF:number;
  blockstunF:number;
  guardBreakF:number;
  downF:number;
  wakeF:number;
  invulnerabilityF:number;
}>;

export type FighterStateV2=Readonly<{
  playerId:PlayerIdV2;
  characterId:RosterCharacterIdV2;
  controlState:FighterControlStateV2;
  postureState:PostureStateV2;
  action:ActionStateV2;
  defense:DefenseStateV2;
  ability:AbilityStateV2;
  resources:FighterResourcesV2;
  combo:FighterComboStateV2;
  timers:FighterTimersV2;
  inputHold:InputHoldStateV2;
  bulletCharge:BulletChargeStateV2|null;
}>;

export type SpatialPairStateV2=Readonly<{
  engagement:EngagementStateV2;
  clinchRemainingF:number;
  overextendedPlayer:PlayerIdV2|null;
  sideSwap:false;
  lastPositionBatchId:number;
}>;

export type FreezeStateV2=Readonly<{
  kind:FreezeKindV2;
  remainingF:number;
  sourceId:string|null;
}>;

export type RoundStateV2=Readonly<{
  roundIndex:number;
  timerCombatF:number;
  wins:Readonly<Record<PlayerIdV2,number>>;
  timeoutEnabled:boolean;
}>;

export type BattleStateV2=Readonly<{
  version:typeof BATTLE_STATE_V2_VERSION;
  combatContractVersion:'mamoken-combat-contract-v0.2';
  authority:typeof BATTLE_STATE_V2_AUTHORITY;
  liveRuntimeAuthority:false;
  flow:BattleFlowV2;
  clocks:BattleClocksV2;
  freeze:FreezeStateV2;
  seed:number;
  aiSeed:number;
  fighters:Readonly<Record<PlayerIdV2,FighterStateV2>>;
  spatial:SpatialPairStateV2;
  round:RoundStateV2;
  lastBatchId:number;
}>;

export type ActionStartIntentV2=Readonly<{
  playerId:PlayerIdV2;
  batchId:number;
  sourceSimulationFrame:number;
  preStateHash:string;
  actionId:string;
  moveId:string|null;
  actionClass:ActionClassV2;
  priorityIndex:number;
}>;

export type PositionIntentV2=Readonly<{
  playerId:PlayerIdV2;
  batchId:number;
  sourceCombatFrame:number;
  preStateHash:string;
  movement:ForwardMovementV2;
  requestedSteps:number;
  requestedEndPosition:EndPositionV2;
}>;

export type ContactIntentV2=Readonly<{
  attacker:PlayerIdV2;
  defender:PlayerIdV2;
  batchId:number;
  sourceCombatFrame:number;
  preStateHash:string;
  moveId:string;
  contactIndex:number;
  contactKind:ContactKindV2;
  reachClass:0|1|2|3;
  targetPostures:readonly PostureStateV2[];
}>;

export type ActionStartResultV2=Readonly<{
  playerId:PlayerIdV2;
  accepted:boolean;
  reason:ResolutionReasonCodeV2;
  actionId:string|null;
}>;

export type PositionResultV2=Readonly<{
  playerId:PlayerIdV2;
  accepted:boolean;
  reason:ResolutionReasonCodeV2;
  appliedSteps:number;
  endPosition:EndPositionV2;
}>;

export type ContactResultV2=Readonly<{
  attacker:PlayerIdV2;
  defender:PlayerIdV2;
  moveId:string;
  contactIndex:number;
  outcome:ContactOutcomeV2;
  reason:ResolutionReasonCodeV2;
  hpDelta:Readonly<Record<PlayerIdV2,number>>;
  guardDelta:Readonly<Record<PlayerIdV2,number>>;
  sGaugeDelta:Readonly<Record<PlayerIdV2,number>>;
  focusGaugeDelta:Readonly<Record<PlayerIdV2,number>>;
  ultimateStockDelta:Readonly<Record<PlayerIdV2,number>>;
  bulletChargeDelta:Readonly<Record<PlayerIdV2,number>>;
  comboCountDelta:Readonly<Record<PlayerIdV2,number>>;
  downType:DownTypeV2;
  followupAllowed:boolean;
}>;

export type FrameBatchIntentV2=Readonly<{
  batchId:number;
  sourceSimulationFrame:number;
  sourceCombatFrame:number;
  preStateHash:string;
  actions:Readonly<Record<PlayerIdV2,ActionStartIntentV2|null>>;
  positions:Readonly<Record<PlayerIdV2,PositionIntentV2|null>>;
  contacts:readonly ContactIntentV2[];
}>;

export type FrameBatchResultV2=Readonly<{
  batchId:number;
  preStateHash:string;
  actionResults:Readonly<Record<PlayerIdV2,ActionStartResultV2>>;
  positionResults:Readonly<Record<PlayerIdV2,PositionResultV2>>;
  contactResults:readonly ContactResultV2[];
  postState:BattleStateV2;
  postStateHash:string;
}>;
