export const COMBAT_CONTRACT_V2_VERSION='mamoken-combat-contract-v0.2' as const;
export const COMBAT_V2_AUTHORITY='shadow_only' as const;

export type ContractStatusTag='CURRENT_ANCHOR'|'PROTOTYPE_CANDIDATE'|'FORMAL'|'OPEN';
export type CombatV2Authority=typeof COMBAT_V2_AUTHORITY|'none';
export type Current3CharacterId='moguzo'|'pisuke'|'godan';
export type PlayerIdV2=0|1;
export type RelativeDirectionV2='BACK'|'DOWN'|'FORWARD';
export type AttackLevelV2='HIGH'|'MID'|'LOW';
export type BattleFlowV2='round_intro'|'fight'|'gyuiin_intro'|'gyuiin_play'|'gyuiin_result'|'ultimate_freeze'|'ultimate_cinematic'|'ko_freeze'|'round_result'|'match_result';
export type FighterControlStateV2='actionable'|'committed'|'guarding'|'dodging'|'mikiri'|'hitstun'|'blockstun'|'guard_break'|'throw_startup'|'thrown'|'down'|'wake'|'cinematic'|'ko'|'win';
export type PostureStateV2='NORMAL'|'SWAY_SHALLOW'|'SWAY_DEEP'|'CROUCH'|'LUNGE'|'CLINCH'|'DOWN';
export type EngagementStateV2='NORMAL'|'CLINCH';
export type FreezeKindV2='NONE'|'HITSTOP'|'ULTIMATE_FREEZE'|'GYUIIN_INTRO'|'KO_FREEZE'|'PAUSE';
export type MoveKindV2='strike'|'throw'|'stance';
export type ThrowRangeV2='CLINCH_ONLY'|'NORMAL_SHORT'|'NORMAL_LONG';
export type ForwardMovementV2='NONE'|'ONE_STEP'|'TWO_STEP'|'CHASE_TO_CONTACT'|'ENTER_CLINCH';
export type EndPositionV2='KEEP'|'NORMAL_RESET'|'CLINCH'|'OVEREXTENDED'|'DOWN_RESET';
export type DownTypeV2='NONE'|'lightDown'|'hardDown'|'throwDown'|'ultimateDown';
export type AdvantagePolicyV2='standard_contact_formula'|'not_applicable';
export type CancelWindowBasisV2='FIRST_CONTACT'|'LAST_CONTACT'|'ACTION_START'|'ACTION_END';
export type ContactScheduleStatusV2='FIXED_STRUCTURE'|'OPEN_TIMING';

export type BattleClocksV2=Readonly<{
  simulationFrame:number;
  combatFrame:number;
  fighterActionFrame:Readonly<Record<PlayerIdV2,number>>;
}>;

export type InputConstantSetV2=Readonly<{
  statusTag:'PROTOTYPE_CANDIDATE';
  legacyGestureSlackF:null;
  commandPrebufferF:10;
  directionHistoryF:40;
  directionGapMaxF:18;
  finalTriggerGraceF:10;
  guardTapThresholdF:6;
  rowBoundaryHysteresisPx:null;
  sameDirectionMinGapF:2;
  commandTotal2F:24;
  commandTotal3F:30;
  commandTotal4F:40;
}>;

export type InputHoldStateV2=Readonly<{
  activeHolds:Readonly<Partial<Record<RelativeDirectionV2,Readonly<{startSimulationFrame:number;holdCombatF:number}>>>>;
  completedHolds:readonly Readonly<{direction:RelativeDirectionV2;holdCombatF:number;releasedSimulationFrame:number}>[];
}>;

export type BulletChargeStateV2=Readonly<{
  value:0|1|2|3;
  lastGainSignature:string|null;
  maxReady:boolean;
}>;

export type ContactKindV2=
  |Readonly<{kind:'strike';level:AttackLevelV2}>
  |Readonly<{kind:'throw';throwRange:ThrowRangeV2}>
  |Readonly<{kind:'stance';stanceId:string}>;

export type ContactScheduleV2=Readonly<{
  status:ContactScheduleStatusV2;
  count:number;
  activeOffsetsF:readonly number[]|null;
}>;

export type CancelWindowV2=Readonly<{
  statusTag:ContractStatusTag;
  basis:CancelWindowBasisV2;
  startOffsetF:number|null;
  endOffsetF:number|null;
  allowedMoveIds:readonly string[];
  oncePerCombo:boolean;
}>;

export type MoveSpecV2Closure=Readonly<{
  id:`${Current3CharacterId}:slot-${1|2|3|4|5|6|7}`;
  characterId:Current3CharacterId;
  slot:1|2|3|4|5|6|7;
  nameJa:string;
  statusTag:'PROTOTYPE_CANDIDATE';
  authority:'shadow_only';
  sourceStatus:'CURRENT_ANCHOR_TRANSLATED'|'DESIGN_CONFIRMED_NUMERIC_CANDIDATE';
  moveKind:MoveKindV2;
  contactKind:ContactKindV2;
  downType:DownTypeV2;
  followupAllowed:boolean;
  forwardMovement:ForwardMovementV2;
  maximumApproachSteps:number|null;
  contactSchedule:ContactScheduleV2;
  cancelWindows:Readonly<{onHit:CancelWindowV2|null;onBlock:CancelWindowV2|null;onWhiff:CancelWindowV2|null}>;
  resourcePolicyId:'resource.action-contact-v0.2';
  advantagePolicy:AdvantagePolicyV2;
}>;

export type CpuMatchupPlanV2=Readonly<{
  roster:readonly ['moguzo','pisuke','godan','hakuma','chirka','takimaru','yomikage','bullet','dark_moguzo'];
  nonMirrorPairCount:36;
  mirrorPairCount:9;
  sideSwappedSymmetryRuns:true;
}>;

export type CombatContractV2=Readonly<{
  version:typeof COMBAT_CONTRACT_V2_VERSION;
  statusTag:'PROTOTYPE_CANDIDATE';
  authority:typeof COMBAT_V2_AUTHORITY;
  liveRuntimeAuthority:false;
  formalBalanceAuthority:false;
  postureStates:readonly PostureStateV2[];
  inputConstants:InputConstantSetV2;
  clocks:Readonly<{
    simulationAdvancesDuringHitstop:true;
    combatAdvancesDuringHitstop:false;
    fighterActionAdvancesDuringHitstop:false;
  }>;
  clinch:Readonly<{
    standardDurationF:24;
    simultaneousForwardDurationF:18;
    expiryResult:'NORMAL_RESET';
    ticksDuringHitstop:false;
    ticksDuringGlobalFreeze:false;
    clearsOn:readonly ['throw_success','down','round_transition','ultimate','gyuiin'];
  }>;
  freezePolicy:Readonly<Record<FreezeKindV2,Readonly<{
    simulationFrame:boolean;
    inputHistory:boolean;
    combatFrame:boolean;
    actionTimeline:boolean;
    cpuDecision:boolean;
    stateHash:boolean;
  }>>>;
  inputNormalizationOrder:readonly ['release','direction_press','guard_mikiri','attack_grab','roar_ultimate'];
  actionPriorityOrder:readonly ['ULTIMATE','ROAR','ABILITY','LONG_COMMAND','SHORT_COMMAND','THROW_BRANCH','STEP_CANCEL','NORMAL_CHAIN'];
  cpuMatchups:CpuMatchupPlanV2;
}>;

export const COMBAT_CONTRACT_V2:CombatContractV2=Object.freeze({
  version:COMBAT_CONTRACT_V2_VERSION,
  statusTag:'PROTOTYPE_CANDIDATE',
  authority:COMBAT_V2_AUTHORITY,
  liveRuntimeAuthority:false,
  formalBalanceAuthority:false,
  postureStates:Object.freeze(['NORMAL','SWAY_SHALLOW','SWAY_DEEP','CROUCH','LUNGE','CLINCH','DOWN']),
  inputConstants:Object.freeze({statusTag:'PROTOTYPE_CANDIDATE',legacyGestureSlackF:null,commandPrebufferF:10,directionHistoryF:40,directionGapMaxF:18,finalTriggerGraceF:10,guardTapThresholdF:6,rowBoundaryHysteresisPx:null,sameDirectionMinGapF:2,commandTotal2F:24,commandTotal3F:30,commandTotal4F:40}),
  clocks:Object.freeze({simulationAdvancesDuringHitstop:true,combatAdvancesDuringHitstop:false,fighterActionAdvancesDuringHitstop:false}),
  clinch:Object.freeze({standardDurationF:24,simultaneousForwardDurationF:18,expiryResult:'NORMAL_RESET',ticksDuringHitstop:false,ticksDuringGlobalFreeze:false,clearsOn:Object.freeze(['throw_success','down','round_transition','ultimate','gyuiin'])}),
  freezePolicy:Object.freeze({
    NONE:Object.freeze({simulationFrame:true,inputHistory:true,combatFrame:true,actionTimeline:true,cpuDecision:true,stateHash:true}),
    HITSTOP:Object.freeze({simulationFrame:true,inputHistory:true,combatFrame:false,actionTimeline:false,cpuDecision:false,stateHash:true}),
    ULTIMATE_FREEZE:Object.freeze({simulationFrame:true,inputHistory:true,combatFrame:false,actionTimeline:false,cpuDecision:false,stateHash:true}),
    GYUIIN_INTRO:Object.freeze({simulationFrame:true,inputHistory:true,combatFrame:false,actionTimeline:false,cpuDecision:false,stateHash:true}),
    KO_FREEZE:Object.freeze({simulationFrame:true,inputHistory:true,combatFrame:false,actionTimeline:false,cpuDecision:false,stateHash:true}),
    PAUSE:Object.freeze({simulationFrame:false,inputHistory:false,combatFrame:false,actionTimeline:false,cpuDecision:false,stateHash:false}),
  }),
  inputNormalizationOrder:Object.freeze(['release','direction_press','guard_mikiri','attack_grab','roar_ultimate']),
  actionPriorityOrder:Object.freeze(['ULTIMATE','ROAR','ABILITY','LONG_COMMAND','SHORT_COMMAND','THROW_BRANCH','STEP_CANCEL','NORMAL_CHAIN']),
  cpuMatchups:Object.freeze({roster:Object.freeze(['moguzo','pisuke','godan','hakuma','chirka','takimaru','yomikage','bullet','dark_moguzo']),nonMirrorPairCount:36,mirrorPairCount:9,sideSwappedSymmetryRuns:true}),
});
