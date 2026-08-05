import { CURRENT_CONTRACT } from './constants.ts';
import type { CurrentLevel, CurrentMoveKey, MoveSpec as CurrentRuntimeMoveSpec } from './types.ts';
import type {
  ComboRuleProfile,
  ComboStyleId,
  CurrentMoveMigrationRecord,
  CurrentNormalMoveId,
  HeightLimits,
  ProvisionalMoveClass,
} from './combat-types.ts';

export const CURRENT_CONTACT_FRAME_OFFSET = 1 as const;

const MOVE_ORDER = ['crouch', 'mid', 'high', 'low'] as const satisfies readonly CurrentMoveKey[];
const MOVE_NAMES = Object.freeze({ crouch: 'しゃがみ突き', mid: '中段', high: '上段', low: '下段' } as const);
const CURRENT_ADVANTAGE = Object.freeze({
  crouch: { hit: 3, block: -4 },
  mid: { hit: 4, block: -6 },
  high: { hit: 6, block: -10 },
  low: { hit: 0, block: -18 },
} as const);

type CurrentCombatBal = Readonly<{
  ATK: Readonly<Record<CurrentMoveKey, CurrentRuntimeMoveSpec>>;
  TELEGRAPH: Readonly<Record<CurrentMoveKey, number>>;
  CMAX: number;
  SCALE: readonly number[];
  CHAIN: number;
  GDMG_A: number;
  CHIP_LOW: number;
  SG: Readonly<{ aHit: number; aHitC: readonly number[]; aBlk: number }>;
  DOWN: Readonly<{ followupMul: number }>;
  DODGE: Readonly<{ counterScale: readonly number[]; counterMul: number }>;
}>;

const CURRENT_BAL = CURRENT_CONTRACT.bal as unknown as CurrentCombatBal;

function moveId(key: CurrentMoveKey): CurrentNormalMoveId {
  return `normal.${key}`;
}

function targetLevel(key: CurrentMoveKey): CurrentLevel {
  return key === 'crouch' ? 'mid' : key;
}

function cancelTargets(key: CurrentMoveKey): readonly CurrentNormalMoveId[] {
  const weight = CURRENT_BAL.ATK[key].w;
  return MOVE_ORDER.filter((candidate) => CURRENT_BAL.ATK[candidate].w > weight).map(moveId);
}

function migrationRecord(key: CurrentMoveKey): CurrentMoveMigrationRecord {
  const source = CURRENT_BAL.ATK[key];
  const id = moveId(key);
  const fieldStatus = {
    level: key === 'crouch' ? 'audit_required' : 'current_impl',
    hitAdvF: key === 'low' ? 'audit_required' : 'current_impl',
    reachClass: 'audit_required',
    hitKnockbackClass: key === 'low' ? 'current_impl' : 'audit_required',
    blockKnockbackClass: 'audit_required',
  } as const;
  return Object.freeze({
    status: 'current_impl',
    sourceMoveKey: key,
    fieldStatus,
    spec: Object.freeze({
      id,
      nameJa: MOVE_NAMES[key],
      level: targetLevel(key),
      weight: source.w,
      telegraphF: CURRENT_BAL.TELEGRAPH[key],
      startupF: source.s,
      activeF: source.a,
      recoveryF: source.r,
      damage: source.d,
      chipDamage: key === 'low' ? CURRENT_BAL.CHIP_LOW : 0,
      guardDamage: CURRENT_BAL.GDMG_A,
      hitAdvF: CURRENT_ADVANTAGE[key].hit,
      blockAdvF: CURRENT_ADVANTAGE[key].block,
      whiffExtraRecoveryF: 0,
      reachClass: 1,
      hitKnockbackClass: key === 'low' ? 2 : 0,
      blockKnockbackClass: 0,
      starterScale: 1,
      comboProration: 1,
      comboWeight: 1,
      repeatGroup: id,
      repeatLimit: 1,
      cancelOnHit: cancelTargets(key),
      cancelOnBlock: Object.freeze([]),
      cancelOnWhiff: Object.freeze([]),
      armorHits: 0,
      roarGainOnHit: CURRENT_BAL.SG.aHit,
      roarGainOnBlock: CURRENT_BAL.SG.aBlk,
      tags: Object.freeze([
        'current_impl',
        'normal',
        key,
        ...(key === 'crouch' ? ['crouch_attack', 'level_mapping_audit'] : []),
        ...(key === 'low' ? ['down'] : []),
      ]),
    }),
  });
}

export const CURRENT_NORMAL_MOVE_RECORDS = Object.freeze(
  Object.fromEntries(MOVE_ORDER.map((key) => [key, migrationRecord(key)])) as Readonly<Record<CurrentMoveKey, CurrentMoveMigrationRecord>>,
);

export const CURRENT_NORMAL_MOVES = Object.freeze(
  Object.fromEntries(MOVE_ORDER.map((key) => [moveId(key), CURRENT_NORMAL_MOVE_RECORDS[key].spec])) as Readonly<
    Record<CurrentNormalMoveId, CurrentMoveMigrationRecord['spec']>
  >,
);

export function currentContactFrame(move: CurrentMoveMigrationRecord['spec']): number {
  return move.startupF + CURRENT_CONTACT_FRAME_OFFSET;
}

export const CURRENT_COMBO_PROFILE: ComboRuleProfile = Object.freeze({
  id: 'current-normal-chain-v1',
  status: 'current_impl',
  maxHits: CURRENT_BAL.CMAX,
  capacity: CURRENT_BAL.CMAX,
  hitScales: Object.freeze([...CURRENT_BAL.SCALE]),
  counterHitScales: Object.freeze([...CURRENT_BAL.DODGE.counterScale]),
  minimumScale: 0,
  counterStarterMul: CURRENT_BAL.DODGE.counterMul,
  repeatDamageScales: Object.freeze([1]),
  repeatHitstunScales: Object.freeze([1]),
  repeatRoarScales: Object.freeze([1]),
  heightLimits: null,
  downFollowup: Object.freeze({ limit: 1, damageMul: CURRENT_BAL.DOWN.followupMul, endsCombo: true }),
  cancelWindowF: CURRENT_BAL.CHAIN,
  strictWeightChain: true,
  roarGainByHit: Object.freeze([...CURRENT_BAL.SG.aHitC]),
});

export const TARGET_CAPACITY_BY_STYLE = Object.freeze({
  standard: 3.5,
  rush: 4.5,
  power: 2.5,
  defense: 2.5,
  tricky: 4,
  grappler: 3.5,
  counter: 3.5,
  charge: 3.5,
  charge_max: 4.5,
  dark_moguzo_pvp: 5.5,
} as const satisfies Readonly<Record<ComboStyleId, number>>);

export const TARGET_WEIGHT_BY_MOVE_CLASS = Object.freeze({
  crouch_or_light_normal: 0.5,
  standard_normal_or_light_command: 1,
  heavy_normal_or_standard_command: 1.5,
  heavy_command: 2,
  max_release: 2.5,
  followup_throw: 1.5,
} as const satisfies Readonly<Record<ProvisionalMoveClass, number>>);

export const TARGET_HEIGHT_LIMITS = Object.freeze({
  standard: Object.freeze({ mid: 3, high: 2, low: 1 }),
  rush: Object.freeze({ mid: 4, high: 3, low: 1 }),
  power: Object.freeze({ mid: 2, high: 2, low: 1 }),
  defense: Object.freeze({ mid: 2, high: 2, low: 1 }),
  tricky: Object.freeze({ mid: 3, high: 2, low: 1 }),
  grappler: Object.freeze({ mid: 2, high: 2, low: 1 }),
  counter: Object.freeze({ mid: 2, high: 2, low: 1 }),
  charge: Object.freeze({ mid: 3, high: 2, low: 1 }),
} as const satisfies Readonly<Record<Exclude<ComboStyleId, 'charge_max' | 'dark_moguzo_pvp'>, HeightLimits>>);

export const TARGET_REPEAT_DAMAGE_SCALES = Object.freeze([1, 0.85, 0.7, 0.55]);
export const TARGET_REPEAT_HITSTUN_SCALES = Object.freeze([1, 0.9, 0.75, 0.6]);
export const TARGET_REPEAT_ROAR_SCALES = Object.freeze([1, 0.7, 0.45, 0.2]);
export const TARGET_HIT_SCALES = Object.freeze([1, 0.88, 0.76, 0.66, 0.58, 0.52]);

export function createTargetProvisionalComboProfile(style: ComboStyleId): ComboRuleProfile {
  const heightKey = style === 'charge_max' ? 'charge' : style;
  const heightLimits = heightKey === 'dark_moguzo_pvp' ? null : TARGET_HEIGHT_LIMITS[heightKey];
  return Object.freeze({
    id: `target-combo-${style}`,
    status: 'provisional',
    maxHits: TARGET_HIT_SCALES.length,
    capacity: TARGET_CAPACITY_BY_STYLE[style],
    hitScales: TARGET_HIT_SCALES,
    minimumScale: 0.4,
    counterStarterMul: 1.2,
    repeatDamageScales: TARGET_REPEAT_DAMAGE_SCALES,
    repeatHitstunScales: TARGET_REPEAT_HITSTUN_SCALES,
    repeatRoarScales: TARGET_REPEAT_ROAR_SCALES,
    heightLimits,
    downFollowup: null,
    cancelWindowF: null,
    strictWeightChain: false,
  });
}
