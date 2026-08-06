import type { CurrentCharacterId, CurrentLevel } from './types.ts';
import type { KnockbackClass, ReachClass } from './combat-types.ts';

export type AdditionalMoveSlot = 4 | 5 | 6 | 7;
export type AdditionalMoveCommandId = `${CurrentCharacterId}:slot-${AdditionalMoveSlot}`;

export type AdditionalMoveCapability =
  | 'conditional_command'
  | 'forward_movement'
  | 'down_on_hit'
  | 'one_hit_armor'
  | 'combo_end'
  | 'combo_limit'
  | 'guard_pressure';

export type AdditionalMovePoseStrategy = 'reuse_existing' | 'dedicated_asset';

export type AdditionalMoveSpecDraft = Readonly<{
  id: AdditionalMoveCommandId;
  nameJa: string;
  level: CurrentLevel;
  reachClass: ReachClass;
  repeatGroup: string;
  tags: readonly string[];
  weight: number | null;
  telegraphF: number | null;
  startupF: number | null;
  activeF: number | null;
  recoveryF: number | null;
  damage: number | null;
  chipDamage: number | null;
  guardDamage: number | null;
  hitAdvF: number | null;
  blockAdvF: number | null;
  whiffExtraRecoveryF: number | null;
  hitKnockbackClass: KnockbackClass | null;
  blockKnockbackClass: KnockbackClass | null;
  starterScale: number | null;
  comboProration: number | null;
  comboWeight: number | null;
  repeatLimit: number | null;
  cancelOnHit: readonly string[] | null;
  cancelOnBlock: readonly string[] | null;
  cancelOnWhiff: readonly string[] | null;
  armorHits: number | null;
  armorStartF: number | null;
  armorEndF: number | null;
  roarGainOnHit: number | null;
  roarGainOnBlock: number | null;
}>;

export type AdditionalMoveVerification = Readonly<{
  moveSpecUnit: boolean;
  commandResolution: boolean;
  deterministicCombat: boolean;
  comboInteraction: boolean;
  runtimeIntegration: boolean;
  cpuPolicy: boolean;
  onlineDeterminism: boolean;
  mobileSmoke: boolean;
}>;

export type AdditionalMoveImplementationDraft = Readonly<{
  commandId: AdditionalMoveCommandId;
  moveSpec: AdditionalMoveSpecDraft;
  implementedCapabilities: readonly AdditionalMoveCapability[];
  satisfiedConstraintIds: readonly string[];
  runtimeBehaviorId: string | null;
  poseStrategy: AdditionalMovePoseStrategy | null;
  poseId: string | null;
  seToken: string | null;
  verification: AdditionalMoveVerification;
}>;

export type AdditionalMoveReadinessStage = Readonly<{
  design: boolean;
  input: boolean;
  schema: boolean;
  moveSpec: boolean;
  runtime: boolean;
  verification: boolean;
  authority: boolean;
}>;

export type AdditionalMoveReadinessRecord = Readonly<{
  commandId: AdditionalMoveCommandId;
  characterId: CurrentCharacterId;
  slot: AdditionalMoveSlot;
  nameJa: string;
  roleJa: string;
  reachClass: ReachClass;
  designConstraintsJa: readonly string[];
  requiredConstraintIds: readonly string[];
  requiredCapabilities: readonly AdditionalMoveCapability[];
  unsupportedCapabilities: readonly AdditionalMoveCapability[];
  conditionId: string | null;
  overlaps: readonly Readonly<{ shorterId: string; longerId: string; resolution: 'longest-command-first' }>[];
  missingMoveSpecFields: readonly string[];
  missingRuntimeItems: readonly string[];
  missingVerificationItems: readonly string[];
  blockers: readonly string[];
  stages: AdditionalMoveReadinessStage;
}>;

export type AdditionalMoveReadinessReport = Readonly<{
  version: 'additional-move-readiness-v1';
  commandContractHash: string;
  totalMoves: 12;
  counts: Readonly<{
    designReady: number;
    inputReady: number;
    schemaReady: number;
    moveSpecReady: number;
    runtimeReady: number;
    verificationReady: number;
    authorityReady: number;
  }>;
  unsupportedCapabilities: readonly AdditionalMoveCapability[];
  records: readonly AdditionalMoveReadinessRecord[];
  hash: string;
}>;
