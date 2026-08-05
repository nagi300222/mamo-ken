import { BAL } from './constants.ts';
import type { ArchetypeId, CurrentLevel } from './types.ts';
import type {
  DefenseReplayEntry,
  DefenseReplayEvent,
  DefenseTimingProfile,
  DodgeKind,
  DodgeRelation,
  DodgeResolution,
  GuardBreakReturnHook,
  StepCancelContext,
  StepCancelDecision,
  StepCancelState,
} from './defense-types.ts';

const CURRENT_DODGE = BAL.DODGE as Readonly<{ totalF: number; judgeF: number; counterReadyF: number }>;

export const CURRENT_DEFENSE_PROFILE: DefenseTimingProfile = Object.freeze({
  id: 'current-defense',
  status: 'current_impl',
  totalF: CURRENT_DODGE.totalF,
  activeStartF: 1,
  activeEndF: CURRENT_DODGE.judgeF,
  counterReadyF: CURRENT_DODGE.counterReadyF,
  justStepCenterF: null,
  justStepRadiusF: null,
  justStepReturnReductionF: 0,
  justStepCounterReadyF: CURRENT_DODGE.counterReadyF,
  standardStepCancelLimit: 0,
  rushStepCancelLimit: 0,
});

export const TARGET_STEP_DEFENSE_PROFILE: DefenseTimingProfile = Object.freeze({
  id: 'target-step-defense',
  status: 'provisional',
  totalF: CURRENT_DODGE.totalF,
  activeStartF: 1,
  activeEndF: CURRENT_DODGE.judgeF,
  counterReadyF: CURRENT_DODGE.counterReadyF,
  justStepCenterF: 6,
  justStepRadiusF: 2,
  justStepReturnReductionF: 4,
  justStepCounterReadyF: 22,
  standardStepCancelLimit: 1,
  rushStepCancelLimit: 2,
});

const DODGE_TRIANGLE: Readonly<Record<DodgeKind, Readonly<Record<CurrentLevel, DodgeRelation>>>> = Object.freeze({
  crouch: Object.freeze({ high: 'evaded', mid: 'normal_hit', low: 'counter_hit' }),
  sway: Object.freeze({ high: 'counter_hit', mid: 'evaded', low: 'normal_hit' }),
  step: Object.freeze({ high: 'normal_hit', mid: 'counter_hit', low: 'evaded' }),
});

export const TARGET_GUARD_BREAK_RETURN: GuardBreakReturnHook = Object.freeze({
  status: 'provisional',
  stunF: 36,
  maxFollowupHits: 2,
  maxDamageRatio: 0.18,
  fullComboAllowed: false,
});

function inActiveWindow(frame: number, profile: DefenseTimingProfile): boolean {
  return frame >= profile.activeStartF && frame <= profile.activeEndF;
}

function isJustStepFrame(dodge: DodgeKind, frame: number, profile: DefenseTimingProfile): boolean {
  if (dodge === 'crouch' || profile.justStepCenterF === null || profile.justStepRadiusF === null) return false;
  return Math.abs(frame - profile.justStepCenterF) <= profile.justStepRadiusF;
}

export function resolveDodgeInteraction(
  dodge: DodgeKind,
  attackLevel: CurrentLevel,
  activeFrame: number,
  profile: DefenseTimingProfile = CURRENT_DEFENSE_PROFILE,
): DodgeResolution {
  const relation = inActiveWindow(activeFrame, profile) ? DODGE_TRIANGLE[dodge][attackLevel] : 'normal_hit';
  const justStep = relation === 'evaded' && isJustStepFrame(dodge, activeFrame, profile);
  return Object.freeze({
    dodge,
    attackLevel,
    activeFrame,
    relation,
    justStep,
    totalF: justStep ? profile.totalF - profile.justStepReturnReductionF : profile.totalF,
    counterReadyF: justStep ? profile.justStepCounterReadyF : relation === 'evaded' ? profile.counterReadyF : 0,
    stepCancelTokens: justStep ? 1 : 0,
  });
}

export function isCounterReady(successFrame: number, currentFrame: number, durationF: number): boolean {
  const elapsed = currentFrame - successFrame;
  return elapsed >= 0 && elapsed <= durationF;
}

export function createStepCancelState(): StepCancelState {
  return Object.freeze({ used: 0 });
}

export function stepCancelLimit(archetype: ArchetypeId, profile: DefenseTimingProfile = TARGET_STEP_DEFENSE_PROFILE): number {
  return archetype === 'rush' ? profile.rushStepCancelLimit : profile.standardStepCancelLimit;
}

export function resolveStepCancel(
  state: StepCancelState,
  context: StepCancelContext,
  profile: DefenseTimingProfile = TARGET_STEP_DEFENSE_PROFILE,
): StepCancelDecision {
  const limit = stepCancelLimit(context.archetype, profile);
  const reject = (reason: StepCancelDecision['reason']): StepCancelDecision => Object.freeze({ accepted: false, reason, limit, state });
  if (context.contact !== 'hit') return reject('not_hit');
  if (!context.hasToken) return reject('no_token');
  if (!context.moveTags.includes('step_cancel')) return reject('move_not_enabled');
  if (state.used >= limit) return reject('limit');
  return Object.freeze({ accepted: true, reason: 'none', limit, state: Object.freeze({ used: state.used + 1 }) });
}

function compareReplayEvent(a: DefenseReplayEvent, b: DefenseReplayEvent): number {
  const deliveredA = a.sourceFrame + a.deliveryDelayF;
  const deliveredB = b.sourceFrame + b.deliveryDelayF;
  return deliveredA - deliveredB || a.order - b.order;
}

export function replayDefenseEvents(
  events: readonly DefenseReplayEvent[],
  profile: DefenseTimingProfile = TARGET_STEP_DEFENSE_PROFILE,
): readonly DefenseReplayEntry[] {
  return Object.freeze(
    [...events].sort(compareReplayEvent).map((event) => {
      const result = resolveDodgeInteraction(event.dodge, event.level, event.activeFrame, profile);
      return Object.freeze({
        deliveredFrame: event.sourceFrame + event.deliveryDelayF,
        order: event.order,
        relation: result.relation,
        justStep: result.justStep,
      });
    }),
  );
}
