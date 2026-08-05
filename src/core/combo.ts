import type { CombatMoveSpec, ComboEndReason, ComboRuleProfile, ComboState, ComboStepResult } from './combat-types.ts';

const EMPTY_LEVEL_COUNTS = Object.freeze({ high: 0, mid: 0, low: 0, grab: 0 });

function scaleAt(values: readonly number[], index: number): number {
  return values[Math.min(index, values.length - 1)] ?? 1;
}

function rejected(state: ComboState, move: CombatMoveSpec, reason: ComboEndReason): ComboStepResult {
  return Object.freeze({
    accepted: false,
    reason,
    moveId: move.id,
    hitIndex: state.hits,
    damageScale: 0,
    damage: 0,
    hitstunScale: 0,
    roarGain: 0,
    state: Object.freeze({ ...state, ended: true, endReason: reason }),
  });
}

export function createComboState(): ComboState {
  return Object.freeze({
    hits: 0,
    capacityUsed: 0,
    totalDamage: 0,
    totalRoarGain: 0,
    cumulativeProration: 1,
    counterRoute: false,
    repeatCounts: Object.freeze({}),
    heightCounts: EMPTY_LEVEL_COUNTS,
    lastMoveId: null,
    lastMoveWeight: null,
    lastHitKnockbackClass: null,
    lastCancelOnHit: null,
    downFollowupsUsed: 0,
    ended: false,
    endReason: 'none',
  });
}

export function resolveComboStep(
  profile: ComboRuleProfile,
  state: ComboState,
  move: CombatMoveSpec,
  options: Readonly<{ counterStarter?: boolean }> = {},
): ComboStepResult {
  if (state.ended) return rejected(state, move, 'already_ended');
  if (state.hits >= profile.maxHits) return rejected(state, move, 'max_hits');
  if (state.capacityUsed + move.comboWeight > profile.capacity) return rejected(state, move, 'capacity');
  if (state.lastHitKnockbackClass === 2) return rejected(state, move, 'knockback_end');

  if (state.lastMoveId !== null) {
    if (!state.lastCancelOnHit?.includes(move.id)) return rejected(state, move, 'cancel_not_allowed');
    if (profile.strictWeightChain && state.lastMoveWeight !== null && move.weight <= state.lastMoveWeight) {
      return rejected(state, move, 'weight_order');
    }
  }

  const repeatBefore = state.repeatCounts[move.repeatGroup] ?? 0;
  if (repeatBefore >= move.repeatLimit) return rejected(state, move, 'repeat_limit');
  const heightBefore = state.heightCounts[move.level];
  if (profile.heightLimits && move.level !== 'grab' && heightBefore >= profile.heightLimits[move.level]) {
    return rejected(state, move, 'height_limit');
  }

  const counterRoute = state.hits === 0 ? options.counterStarter === true : state.counterRoute;
  const scales = counterRoute && profile.counterHitScales ? profile.counterHitScales : profile.hitScales;
  const hitScale = scaleAt(scales, state.hits);
  const repeatDamageScale = scaleAt(profile.repeatDamageScales, repeatBefore);
  const repeatHitstunScale = scaleAt(profile.repeatHitstunScales, repeatBefore);
  const repeatRoarScale = scaleAt(profile.repeatRoarScales, repeatBefore);
  const starterScale = state.hits === 0 ? move.starterScale : 1;
  const counterMul = state.hits === 0 && options.counterStarter ? profile.counterStarterMul : 1;
  const unclamped = hitScale * state.cumulativeProration * starterScale * repeatDamageScale * counterMul;
  const damageScale = Math.max(profile.minimumScale, unclamped);
  const damage = Math.round(move.damage * damageScale);
  const roarGain = profile.roarGainByHit
    ? profile.roarGainByHit[Math.min(state.hits, profile.roarGainByHit.length - 1)] ?? 0
    : Math.round(move.roarGainOnHit * repeatRoarScale);

  const repeatCounts = Object.freeze({ ...state.repeatCounts, [move.repeatGroup]: repeatBefore + 1 });
  const heightCounts = Object.freeze({ ...state.heightCounts, [move.level]: heightBefore + 1 });
  const nextState = Object.freeze({
    hits: state.hits + 1,
    capacityUsed: state.capacityUsed + move.comboWeight,
    totalDamage: state.totalDamage + damage,
    totalRoarGain: state.totalRoarGain + roarGain,
    cumulativeProration: state.cumulativeProration * move.comboProration,
    counterRoute,
    repeatCounts,
    heightCounts,
    lastMoveId: move.id,
    lastMoveWeight: move.weight,
    lastHitKnockbackClass: move.hitKnockbackClass,
    lastCancelOnHit: move.cancelOnHit,
    downFollowupsUsed: state.downFollowupsUsed,
    ended: move.hitKnockbackClass === 2,
    endReason: move.hitKnockbackClass === 2 ? ('knockback_end' as const) : ('none' as const),
  });
  return Object.freeze({
    accepted: true,
    reason: nextState.endReason,
    moveId: move.id,
    hitIndex: state.hits,
    damageScale,
    damage,
    hitstunScale: repeatHitstunScale,
    roarGain,
    state: nextState,
  });
}

export function resolveDownFollowup(profile: ComboRuleProfile, state: ComboState, move: CombatMoveSpec): ComboStepResult {
  const rule = profile.downFollowup;
  if (!rule || state.downFollowupsUsed >= rule.limit) return rejected(state, move, 'down_followup_unavailable');
  const damage = Math.round(move.damage * rule.damageMul);
  const nextState = Object.freeze({
    ...state,
    hits: state.hits + 1,
    totalDamage: state.totalDamage + damage,
    downFollowupsUsed: state.downFollowupsUsed + 1,
    ended: rule.endsCombo,
    endReason: 'down_followup_consumed' as const,
  });
  return Object.freeze({
    accepted: true,
    reason: 'down_followup_consumed',
    moveId: move.id,
    hitIndex: state.hits,
    damageScale: rule.damageMul,
    damage,
    hitstunScale: 1,
    roarGain: 0,
    state: nextState,
  });
}

export function areSameMoveForClash(a: CombatMoveSpec, b: CombatMoveSpec): boolean {
  return a.id === b.id && a.level === b.level;
}

export function evaluateComboRoute(
  profile: ComboRuleProfile,
  moves: readonly CombatMoveSpec[],
  options: Readonly<{ counterStarter?: boolean }> = {},
): Readonly<{ state: ComboState; steps: readonly ComboStepResult[] }> {
  let state = createComboState();
  const steps: ComboStepResult[] = [];
  for (const move of moves) {
    const result = resolveComboStep(profile, state, move, {
      counterStarter: state.hits === 0 && options.counterStarter,
    });
    steps.push(result);
    state = result.state;
    if (!result.accepted || state.ended) break;
  }
  return Object.freeze({ state, steps: Object.freeze(steps) });
}
