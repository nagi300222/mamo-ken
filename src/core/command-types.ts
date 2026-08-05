import type { CurrentCharacterId, CurrentLevel, Direction } from './types.ts';

export type PlayerId = 0 | 1;
export type InputTrigger = CurrentLevel | 'grab';
export type InputProfileStatus = 'current_impl' | 'provisional';

export type DirectionInputEvent = Readonly<{
  kind: 'direction';
  action: 'press' | 'release';
  direction: Direction;
  frame: number;
  order: number;
  player: PlayerId;
}>;

export type AttackInputEvent = Readonly<{
  kind: 'attack';
  level: CurrentLevel;
  frame: number;
  order: number;
  player: PlayerId;
}>;

export type GrabInputEvent = Readonly<{
  kind: 'grab';
  frame: number;
  order: number;
  player: PlayerId;
}>;

export type NormalizedInputEvent = DirectionInputEvent | AttackInputEvent | GrabInputEvent;
export type TriggerInputEvent = AttackInputEvent | GrabInputEvent;

export type DirectionPress = Readonly<{
  direction: Direction;
  frame: number;
  order: number;
}>;

export type HoldStart = Readonly<{
  direction: Direction;
  frame: number;
  order: number;
}>;

export type CompletedHold = Readonly<{
  direction: Direction;
  startFrame: number;
  startOrder: number;
  endFrame: number;
  endOrder: number;
}>;

export type InputHistoryState = Readonly<{
  player: PlayerId;
  directionPresses: readonly DirectionPress[];
  activeHolds: Readonly<Partial<Record<Direction, HoldStart>>>;
  completedHolds: readonly CompletedHold[];
  lastFrame: number;
  lastOrder: number;
}>;

export type InputHistoryUpdate = Readonly<{
  state: InputHistoryState;
  accepted: boolean;
  reason?: 'anti-chatter';
}>;

export type CommandTimingProfile = Readonly<{
  id: 'current-compat' | 'target-provisional';
  status: InputProfileStatus;
  directionHistoryF: number;
  commandPrebufferF: number;
  latestDirectionsOnly: boolean;
  directionGapMaxF?: number;
  commandTotal3F?: number;
  commandTotal4F?: number;
  finalButtonGraceF?: number;
  sameDirectionMinGapF?: number;
  holdDetectF?: number;
  chargeCompleteF?: number;
}>;

export type ChargeRequirement = Readonly<{
  direction: Direction;
  minHoldF?: number;
  releaseRequired?: boolean;
}>;

export type CommandDefinition = Readonly<{
  id: string;
  name: string;
  characterId?: CurrentCharacterId;
  slot?: number;
  directions: readonly Direction[];
  trigger: InputTrigger;
  specificity: number;
  definitionOrder: number;
  source: 'current_impl' | 'provisional';
  conditionId?: string;
  blockShorterOnConditionFailure?: boolean;
  charge?: ChargeRequirement;
}>;

export type CommandContext = Readonly<{
  activeConditions?: ReadonlySet<string>;
}>;

export type CommandMatch = Readonly<{
  definition: CommandDefinition;
  matchedPresses: readonly DirectionPress[];
}>;

export type MatchSet = Readonly<{
  matches: readonly CommandMatch[];
  blockers: readonly CommandMatch[];
}>;

export type CommandFallback =
  | Readonly<{ kind: 'direction-fallback'; direction: Direction }>
  | Readonly<{ kind: 'normal-attack'; level: CurrentLevel }>
  | Readonly<{ kind: 'normal-grab' }>;

export type TriggerResolution =
  | Readonly<{ kind: 'command'; match: CommandMatch; blockedBy: readonly string[] }>
  | Readonly<{ kind: 'fallback'; fallback: CommandFallback; blockedBy: readonly string[] }>;

export type CommandPrebufferDecision =
  | Readonly<{ status: 'immediate'; executeFrame: number }>
  | Readonly<{ status: 'queued'; executeFrame: number }>
  | Readonly<{ status: 'rejected' }>;

export type ScheduledCommand =
  | Readonly<{ status: 'immediate'; match: CommandMatch; executeFrame: number }>
  | Readonly<{ status: 'queued'; match: CommandMatch; executeFrame: number }>
  | Readonly<{ status: 'rejected'; match: CommandMatch }>;
