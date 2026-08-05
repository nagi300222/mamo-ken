import type { ArchetypeId, CurrentLevel, CurrentMoveKey } from './types.ts';

export type DataStatus = 'confirmed' | 'current_impl' | 'provisional' | 'audit_required' | 'undecided' | 'legacy';
export type MoveLevel = CurrentLevel | 'grab';
export type ReachClass = 0 | 1 | 2 | 3;
export type KnockbackClass = 0 | 1 | 2;

export type CombatMoveSpec = Readonly<{
  id: string;
  nameJa: string;
  level: MoveLevel;
  weight: number;
  telegraphF: number;
  startupF: number;
  activeF: number;
  recoveryF: number;
  damage: number;
  chipDamage: number;
  guardDamage: number;
  hitAdvF: number;
  blockAdvF: number;
  whiffExtraRecoveryF: number;
  reachClass: ReachClass;
  hitKnockbackClass: KnockbackClass;
  blockKnockbackClass: KnockbackClass;
  starterScale: number;
  comboProration: number;
  comboWeight: number;
  repeatGroup: string;
  repeatLimit: number;
  cancelOnHit: readonly string[];
  cancelOnBlock: readonly string[];
  cancelOnWhiff: readonly string[];
  armorHits: number;
  armorStartF?: number;
  armorEndF?: number;
  roarGainOnHit: number;
  roarGainOnBlock: number;
  tags: readonly string[];
}>;

export type CombatCharacterSpec = Readonly<{
  maxHp: number;
  guardMax: number;
  guardRegenDelayF: number;
  guardRegenPerSec: number;
  damageTakenMul: number;
  guardDamageTakenMul: number;
  chipDamageTakenMul: number;
  knockbackTakenMul: number;
  comboCapacity: number;
  normalCancelLimit: number;
  specialCancelLimit: number;
  stepCancelLimit: number;
  commandDifficulty: 1 | 2 | 3 | 4 | 5;
  archetype: ArchetypeId;
  abilityHook: string;
}>;

export type CurrentNormalMoveId = `normal.${CurrentMoveKey}`;
export type MoveFieldStatus = Readonly<Partial<Record<keyof CombatMoveSpec, DataStatus>>>;
export type CurrentMoveMigrationRecord = Readonly<{
  status: 'current_impl';
  sourceMoveKey: CurrentMoveKey;
  fieldStatus: MoveFieldStatus;
  spec: CombatMoveSpec & Readonly<{ id: CurrentNormalMoveId }>;
}>;

export type ComboStyleId = ArchetypeId | 'charge_max' | 'dark_moguzo_pvp';
export type ProvisionalMoveClass =
  | 'crouch_or_light_normal'
  | 'standard_normal_or_light_command'
  | 'heavy_normal_or_standard_command'
  | 'heavy_command'
  | 'max_release'
  | 'followup_throw';

export type HeightLimits = Readonly<Record<CurrentLevel, number>>;
export type DownFollowupRule = Readonly<{ limit: number; damageMul: number; endsCombo: boolean }>;

export type ComboRuleProfile = Readonly<{
  id: string;
  status: 'current_impl' | 'provisional';
  maxHits: number;
  capacity: number;
  hitScales: readonly number[];
  counterHitScales?: readonly number[];
  minimumScale: number;
  counterStarterMul: number;
  repeatDamageScales: readonly number[];
  repeatHitstunScales: readonly number[];
  repeatRoarScales: readonly number[];
  heightLimits: HeightLimits | null;
  downFollowup: DownFollowupRule | null;
  cancelWindowF: number | null;
  strictWeightChain: boolean;
  roarGainByHit?: readonly number[];
}>;

export type ComboEndReason =
  | 'none'
  | 'already_ended'
  | 'max_hits'
  | 'capacity'
  | 'knockback_end'
  | 'cancel_not_allowed'
  | 'weight_order'
  | 'repeat_limit'
  | 'height_limit'
  | 'down_followup_unavailable'
  | 'down_followup_consumed';

export type ComboState = Readonly<{
  hits: number;
  capacityUsed: number;
  totalDamage: number;
  totalRoarGain: number;
  cumulativeProration: number;
  counterRoute: boolean;
  repeatCounts: Readonly<Record<string, number>>;
  heightCounts: Readonly<Record<MoveLevel, number>>;
  lastMoveId: string | null;
  lastMoveWeight: number | null;
  lastHitKnockbackClass: KnockbackClass | null;
  lastCancelOnHit: readonly string[] | null;
  downFollowupsUsed: number;
  ended: boolean;
  endReason: ComboEndReason;
}>;

export type ComboStepResult = Readonly<{
  accepted: boolean;
  reason: ComboEndReason;
  moveId: string;
  hitIndex: number;
  damageScale: number;
  damage: number;
  hitstunScale: number;
  roarGain: number;
  state: ComboState;
}>;
