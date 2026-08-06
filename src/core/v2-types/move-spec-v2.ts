import type {
  AdvantagePolicyV2,
  CancelWindowV2,
  ContactKindV2,
  ContactScheduleV2,
  ContractStatusTag,
  DownTypeV2,
  EndPositionV2,
  ForwardMovementV2,
  MoveKindV2,
  PostureStateV2,
} from './combat-contract-v2.ts';

export const MOVE_SPEC_V2_VERSION='mamoken-movespec-v2-v0.1' as const;

export type ResolvedContractStatusV2=Exclude<ContractStatusTag,'OPEN'>;

export type TaggedValueV2<T>=
  |Readonly<{
    status:'OPEN';
    value:null;
    sourceRef:string|null;
    note:string|null;
  }>
  |Readonly<{
    status:ResolvedContractStatusV2;
    value:T;
    sourceRef:string;
    note:string|null;
  }>;

export type MoveTimingV2=Readonly<{
  telegraphF:TaggedValueV2<number>;
  startupF:TaggedValueV2<number>;
  activeDurationF:TaggedValueV2<number>;
  recoveryF:TaggedValueV2<number>;
  totalDurationF:TaggedValueV2<number>;
}>;

export type MoveDamageV2=Readonly<{
  damage:TaggedValueV2<number>;
  chipDamage:TaggedValueV2<number>;
  guardDamage:TaggedValueV2<number>;
  hitstopF:TaggedValueV2<number>;
}>;

export type MoveAdvantageV2=Readonly<{
  policy:AdvantagePolicyV2;
  hitAdvF:TaggedValueV2<number>|null;
  blockAdvF:TaggedValueV2<number>|null;
  whiffExtraRecoveryF:TaggedValueV2<number>|null;
}>;

export type MoveArmorV2=Readonly<{
  armorHits:TaggedValueV2<number>;
  startF:TaggedValueV2<number>;
  endF:TaggedValueV2<number>;
}>|null;

export type MoveInvulnerabilityV2=Readonly<{
  kind:'strike'|'throw'|'all';
  startF:TaggedValueV2<number>;
  endF:TaggedValueV2<number>;
}>|null;

export type MoveMovementV2=Readonly<{
  forwardMovement:ForwardMovementV2;
  maximumApproachSteps:number|null;
  endPositionOnHit:EndPositionV2;
  endPositionOnBlock:EndPositionV2;
  endPositionOnWhiff:EndPositionV2;
}>;

export type MoveDownPolicyV2=Readonly<{
  downType:DownTypeV2;
  followupAllowed:boolean;
  wakeProfileId:string|null;
}>;

export type MoveCancelWindowsV2=Readonly<{
  onHit:CancelWindowV2|null;
  onBlock:CancelWindowV2|null;
  onWhiff:CancelWindowV2|null;
}>;

export type MoveSpecV2=Readonly<{
  schemaVersion:typeof MOVE_SPEC_V2_VERSION;
  id:string;
  commandId:string;
  characterId:string;
  slot:number;
  nameJa:string;
  statusTag:ContractStatusTag;
  authority:'shadow_only'|'none';
  sourceStatus:string;
  moveKind:MoveKindV2;
  contactKind:ContactKindV2;
  timing:MoveTimingV2;
  contactSchedule:ContactScheduleV2;
  reachClass:TaggedValueV2<0|1|2|3>;
  targetPostures:readonly PostureStateV2[];
  movement:MoveMovementV2;
  downPolicy:MoveDownPolicyV2;
  damage:MoveDamageV2;
  advantage:MoveAdvantageV2;
  cancelWindows:MoveCancelWindowsV2;
  armor:MoveArmorV2;
  invulnerability:MoveInvulnerabilityV2;
  resourcePolicyId:string;
  tags:readonly string[];
}>;

export type MoveSpecV2Registry=Readonly<{
  version:'mamoken-movespec-v2-registry-v0.1';
  statusTag:'PROTOTYPE_CANDIDATE';
  authority:'shadow_only';
  moves:readonly MoveSpecV2[];
}>;
