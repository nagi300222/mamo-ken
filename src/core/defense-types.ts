import type { ArchetypeId, CurrentLevel } from './types.ts';

export type DodgeKind = 'crouch' | 'sway' | 'step';
export type DodgeRelation = 'evaded' | 'normal_hit' | 'counter_hit';
export type DefenseProfileStatus = 'current_impl' | 'provisional';

export type DefenseTimingProfile = Readonly<{
  id: string;
  status: DefenseProfileStatus;
  totalF: number;
  activeStartF: number;
  activeEndF: number;
  counterReadyF: number;
  justStepCenterF: number | null;
  justStepRadiusF: number | null;
  justStepReturnReductionF: number;
  justStepCounterReadyF: number;
  standardStepCancelLimit: number;
  rushStepCancelLimit: number;
}>;

export type DodgeResolution = Readonly<{
  dodge: DodgeKind;
  attackLevel: CurrentLevel;
  activeFrame: number;
  relation: DodgeRelation;
  justStep: boolean;
  totalF: number;
  counterReadyF: number;
  stepCancelTokens: number;
}>;

export type StepCancelState = Readonly<{ used: number }>;
export type StepCancelRejectReason = 'none' | 'not_hit' | 'no_token' | 'move_not_enabled' | 'limit';

export type StepCancelDecision = Readonly<{
  accepted: boolean;
  reason: StepCancelRejectReason;
  limit: number;
  state: StepCancelState;
}>;

export type GuardBreakReturnHook = Readonly<{
  status: 'provisional';
  stunF: number;
  maxFollowupHits: number;
  maxDamageRatio: number;
  fullComboAllowed: false;
}>;

export type DefenseReplayEvent = Readonly<{
  sourceFrame: number;
  deliveryDelayF: number;
  order: number;
  dodge: DodgeKind;
  level: CurrentLevel;
  activeFrame: number;
}>;

export type DefenseReplayEntry = Readonly<{
  deliveredFrame: number;
  order: number;
  relation: DodgeRelation;
  justStep: boolean;
}>;

export type StepCancelContext = Readonly<{
  archetype: ArchetypeId;
  contact: 'hit' | 'block' | 'whiff';
  hasToken: boolean;
  moveTags: readonly string[];
}>;
