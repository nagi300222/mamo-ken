import { BAL } from './constants.ts';
import { mulberry32 } from './determinism.ts';
import type { ArchetypeId } from './types.ts';
import type {
  ChargeGainSource,
  GaugeGainSource,
  GaugeState,
  GyuiinKind,
  GyuiinParticipant,
  GyuiinRewardResult,
  GyuiinRule,
  PostContactFlow,
  PostContactFlowInput,
  RoarContact,
  RoarResolution,
} from './gauge-types.ts';

const SG = BAL.SG as Readonly<{ aHit: number; aHitC: readonly number[]; aBlk: number; whiff: number; gOk: number; got: number }>;
const FOCUS = BAL.FOCUS as Readonly<{ max: number; gainDmgMul: number; gainGuard: number; gainMikiri: number }>;
const ROAR = BAL.ROAR as Readonly<{ d: number }>;
const ULT = BAL.ULT as Readonly<{ stock: number; d: number }>;

export const GYUIIN_RULE: GyuiinRule = Object.freeze({
  damage: 120,
  ultStock: 1,
  sGauge: 0,
  focus: 0,
  charge: 0,
  streakBonus: 0,
  guaranteedFollowupStunF: 0,
  weights: Object.freeze({ jyanken: 0.5, renda: 0.25, hayauchi: 0.25 }),
});

export const GAUGE_LIMITS = Object.freeze({ s: BAL.SMAX, focus: FOCUS.max, ult: ULT.stock, charge: 3 });
export const ULT_DAMAGE = ULT.d;

export function createGaugeState(archetype: ArchetypeId): GaugeState {
  return Object.freeze({ s: 0, focus: 0, ult: 0, charge: archetype === 'charge' ? 0 : null });
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

export function addUltStock(state: GaugeState, amount: number): GaugeState {
  return Object.freeze({ ...state, ult: clamp(state.ult + amount, 0, GAUGE_LIMITS.ult) });
}

export function gainS(
  state: GaugeState,
  source: GaugeGainSource,
  options: Readonly<{ comboIndex?: number; repeatScale?: number }> = {},
): GaugeState {
  const comboIndex = options.comboIndex ?? 0;
  const base = source === 'attack_hit'
    ? SG.aHitC[Math.min(comboIndex, SG.aHitC.length - 1)] ?? SG.aHit
    : source === 'attack_block'
      ? SG.aBlk
      : source === 'whiff'
        ? SG.whiff
        : source === 'guard_success'
          ? SG.gOk
          : SG.got;
  const gain = Math.round(base * (options.repeatScale ?? 1));
  return Object.freeze({ ...state, s: clamp(state.s + gain, 0, GAUGE_LIMITS.s) });
}

export function gainFocus(state: GaugeState, source: 'damage' | 'guard' | 'mikiri', amount = 0): GaugeState {
  const gain = source === 'damage' ? amount * FOCUS.gainDmgMul : source === 'guard' ? FOCUS.gainGuard : FOCUS.gainMikiri;
  return Object.freeze({ ...state, focus: clamp(state.focus + gain, 0, GAUGE_LIMITS.focus) });
}

export function gainCharge(state: GaugeState, archetype: ArchetypeId, source: ChargeGainSource, amount = 1): GaugeState {
  if (archetype !== 'charge' || state.charge === null || source === 'time' || source === 'gyuiin') return state;
  return Object.freeze({ ...state, charge: clamp(state.charge + amount, 0, GAUGE_LIMITS.charge) });
}

export function consumeMaxCharge(state: GaugeState, archetype: ArchetypeId): Readonly<{ accepted: boolean; gauges: GaugeState }> {
  if (archetype !== 'charge' || state.charge !== GAUGE_LIMITS.charge) return Object.freeze({ accepted: false, gauges: state });
  return Object.freeze({ accepted: true, gauges: Object.freeze({ ...state, charge: 0 }) });
}

export function resolveRoarContact(state: GaugeState, contact: RoarContact): RoarResolution {
  const cleanHit = contact.hit && !contact.blocked && !contact.armorAbsorbed;
  const afterSpend = Object.freeze({ ...state, s: 0 });
  return Object.freeze({
    cleanHit,
    damage: contact.hit ? ROAR.d : 0,
    gauges: cleanHit ? addUltStock(afterSpend, 1) : afterSpend,
  });
}

export function chooseGyuiin(seed: number): Readonly<{ kind: GyuiinKind; nextSeed: number }> {
  const [roll, nextSeed] = mulberry32(seed);
  const kind: GyuiinKind = roll < GYUIIN_RULE.weights.jyanken
    ? 'jyanken'
    : roll < GYUIIN_RULE.weights.jyanken + GYUIIN_RULE.weights.renda
      ? 'renda'
      : 'hayauchi';
  return Object.freeze({ kind, nextSeed });
}

export function applyGyuiinReward(winner: GyuiinParticipant, loser: GyuiinParticipant): GyuiinRewardResult {
  return Object.freeze({
    winner: Object.freeze({ ...winner, gauges: addUltStock(winner.gauges, GYUIIN_RULE.ultStock) }),
    loser: Object.freeze({ ...loser, hp: Math.max(0, loser.hp - GYUIIN_RULE.damage) }),
  });
}

export function resolvePostContactFlow(input: PostContactFlowInput): PostContactFlow {
  if (input.ko) return 'ko';
  if (input.ultStock >= GAUGE_LIMITS.ult) return 'ultActivation';
  if (input.gyuiinTriggered) return 'gyuiinIntro';
  return 'fight';
}
