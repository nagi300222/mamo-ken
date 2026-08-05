import { consumeMaxCharge, gainCharge } from './gauge.ts';
import type { GaugeState } from './gauge-types.ts';
import type {
  AbilityGyuiinEffect,
  AbilityHookId,
  FeintResolution,
  FeintState,
  GutsState,
  HeavyArmorResolution,
  HeavyArmorState,
  IronWallBonus,
  IronWallState,
  JustState,
  PressureResolution,
} from './ability-types.ts';

export const ABILITY_HOOK_IDS = Object.freeze([
  'guts',
  'chase',
  'heavy_armor',
  'iron_wall',
  'feint',
  'pressure',
  'just',
  'overcharge',
] as const satisfies readonly AbilityHookId[]);

export const NO_GYUIIN_ABILITY_EFFECT: AbilityGyuiinEffect = Object.freeze({
  weightMul: 1,
  timingBonusF: 0,
  rewardDamageBonus: 0,
  rewardUltBonus: 0,
});

export function abilityGyuiinEffect(_hook: AbilityHookId): AbilityGyuiinEffect {
  return NO_GYUIIN_ABILITY_EFFECT;
}

export function createGutsState(): GutsState {
  return Object.freeze({ distinctMoveIds: Object.freeze([]), commandReliefReady: false });
}

export function recordGutsMove(state: GutsState, moveId: string): GutsState {
  const distinct = state.distinctMoveIds.includes(moveId)
    ? state.distinctMoveIds
    : Object.freeze([...state.distinctMoveIds, moveId].slice(-3));
  return Object.freeze({ distinctMoveIds: distinct, commandReliefReady: distinct.length >= 3 });
}

export function consumeGutsCommandRelief(state: GutsState): Readonly<{ starterScaleBonus: number; state: GutsState }> {
  if (!state.commandReliefReady) return Object.freeze({ starterScaleBonus: 0, state });
  return Object.freeze({ starterScaleBonus: 0.05, state: createGutsState() });
}

export function gutsLowHpModifiers(hp: number, maxHp: number): Readonly<{ damageDealtMul: number; damageTakenMul: number }> {
  const active = maxHp > 0 && hp / maxHp <= 0.3;
  return Object.freeze({ damageDealtMul: active ? 1.03 : 1, damageTakenMul: active ? 0.97 : 1 });
}

export function chaseStepCancelLimit(): 2 {
  return 2;
}

export function canChaseResume(contact: 'hit' | 'block' | 'whiff', knockbackClass: 0 | 1 | 2, moveTags: readonly string[]): boolean {
  return contact === 'hit' && knockbackClass === 0 && moveTags.includes('step_cancel');
}

export function createHeavyArmorState(enabled: boolean): HeavyArmorState {
  return Object.freeze({ hitsRemaining: enabled ? 1 : 0 });
}

export function resolveHeavyArmor(
  state: HeavyArmorState,
  input: Readonly<{ phaseFrame: number; moveTags: readonly string[]; incoming: 'strike' | 'grab' | 'mikiri' | 'special_counter' }>,
): HeavyArmorResolution {
  const eligible = state.hitsRemaining === 1
    && input.phaseFrame >= 4
    && input.moveTags.includes('heavy_armor')
    && input.incoming === 'strike';
  return Object.freeze({
    absorbed: eligible,
    starterScale: eligible ? 0.85 : 1,
    state: eligible ? Object.freeze({ hitsRemaining: 0 }) : state,
  });
}

export function createIronWallState(): IronWallState {
  return Object.freeze({ charges: 0, expiresFrame: 0 });
}

export function grantIronWall(
  state: IronWallState,
  source: 'guard' | 'correct_dodge' | 'just_step' | 'proactive_attack' | 'throw',
  frame: number,
): IronWallState {
  if (source === 'proactive_attack' || source === 'throw') return state;
  return Object.freeze({ charges: 1, expiresFrame: frame + 600 });
}

export function consumeIronWall(
  state: IronWallState,
  frame: number,
  moveLevel: 'high' | 'mid' | 'low' | 'grab',
  mode: 'startup' | 'guard_damage',
): Readonly<{ bonus: IronWallBonus; state: IronWallState }> {
  if (state.charges === 0 || frame > state.expiresFrame || moveLevel === 'grab') {
    return Object.freeze({ bonus: Object.freeze({ startupReductionF: 0, guardDamageMul: 1 }), state: createIronWallState() });
  }
  const bonus = mode === 'startup'
    ? Object.freeze({ startupReductionF: 2, guardDamageMul: 1 })
    : Object.freeze({ startupReductionF: 0, guardDamageMul: 1.15 });
  return Object.freeze({ bonus, state: createIronWallState() });
}

export function createFeintState(): FeintState {
  return Object.freeze({ usedInSequence: false });
}

export function resolveFeint(
  state: FeintState,
  input: Readonly<{ inTelegraph: boolean; currentFrame: number; requestedRecoveryF?: number }>,
): FeintResolution {
  const recoveryF = Math.max(8, Math.min(12, input.requestedRecoveryF ?? 10));
  if (state.usedInSequence || !input.inTelegraph) {
    return Object.freeze({ accepted: false, recoveryF, nextActionFrame: input.currentFrame, state });
  }
  return Object.freeze({
    accepted: true,
    recoveryF,
    nextActionFrame: input.currentFrame + recoveryF,
    state: Object.freeze({ usedInSequence: true }),
  });
}

export function resolvePressure(
  input: Readonly<{ sourceContact: 'hit' | 'block' | 'whiff'; moveTags: readonly string[]; requestedWhiffF?: number }>,
): PressureResolution {
  const throwWhiffF = Math.max(28, Math.min(34, input.requestedWhiffF ?? 30));
  return Object.freeze({
    canBranchToThrow: input.sourceContact === 'hit' && input.moveTags.includes('pressure_throw_branch'),
    throwWhiffF,
    followupStarterScale: 0.6,
    guaranteesThrow: false,
  });
}

export function createJustState(): JustState {
  return Object.freeze({ followupReady: false, expiresFrame: 0 });
}

export function grantJustFollowup(source: 'correct_dodge' | 'just_step' | 'idle_wait', frame: number): JustState {
  if (source === 'idle_wait') return createJustState();
  return Object.freeze({ followupReady: true, expiresFrame: frame + 22 });
}

export function consumeJustFollowup(state: JustState, frame: number): Readonly<{ accepted: boolean; state: JustState }> {
  const accepted = state.followupReady && frame <= state.expiresFrame;
  return Object.freeze({ accepted, state: createJustState() });
}

export function gainOvercharge(gauges: GaugeState, source: 'attack_hit' | 'guard_success' | 'just_step' | 'active_success' | 'time' | 'gyuiin'): GaugeState {
  return gainCharge(gauges, 'charge', source);
}

export function releaseOvercharge(gauges: GaugeState): Readonly<{ accepted: boolean; gauges: GaugeState }> {
  return consumeMaxCharge(gauges, 'charge');
}
