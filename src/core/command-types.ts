import type { CurrentCharacterId, CurrentLevel, Direction, JsonValue } from './types.ts';

export type InputEventKind = 'directionPress' | 'directionRelease' | 'attack' | 'grab';
export type CommandTrigger = CurrentLevel | 'grab' | 'attackEnded' | 'grabEnded';
export type CommandProfileKind = 'current_impl' | 'target_provisional';
export type CommandResolutionKind = 'command' | 'directionFallback' | 'normalAttackFallback' | 'normalGrabFallback' | 'rejected';
export type PrebufferDecision = 'immediate' | 'queued' | 'rejected';

export type NormalizedInputEvent = Readonly<{
  frame: number;
  order: number;
  player: 0 | 1;
  kind: InputEventKind;
  direction?: Direction;
  level?: CurrentLevel;
}>;

export type DirectionHistoryEntry = Readonly<{
  frame: number;
  order: number;
  player: 0 | 1;
  direction: Direction;
  releasedFrame?: number;
}>;

export type CommandParserState = Readonly<{
  history: readonly DirectionHistoryEntry[];
  held: Readonly<Record<Direction, number | null>>;
  lastHash: string;
}>;

export type TimingProfile = Readonly<{
  kind: CommandProfileKind;
  directionHistoryF: number;
  commandPrebufferF: number;
  latestDirectionCount: number;
  directionGapMaxF?: number;
  commandTotal3F?: number;
  commandTotal4F?: number;
  finalButtonGraceF?: number;
  sameDirectionMinGapF?: number;
  holdDetectF?: number;
  chargeCompleteF?: number;
}>;

export type CommandCondition = Readonly<{
  id: string;
  active: boolean;
  blocksOverlappingFallback?: boolean;
}>;

export type CommandDefinition = Readonly<{
  id: string;
  characterId?: CurrentCharacterId;
  name: string;
  sequence: readonly Direction[];
  trigger: CommandTrigger;
  definitionOrder: number;
  specificity: number;
  currentMoveIndex?: number;
  condition?: CommandCondition;
  charge?: Readonly<{ direction: Direction; holdF: number }>;
  payload?: unknown;
}>;

export type CommandMatch = Readonly<{
  definition: CommandDefinition;
  completedFrame: number;
  matchedDirections: readonly DirectionHistoryEntry[];
}>;

export type CommandResolution = Readonly<{
  kind: CommandResolutionKind;
  frame: number;
  event: NormalizedInputEvent;
  match?: CommandMatch;
  blockedBy?: CommandDefinition;
}>;

export type PrebufferResolution = Readonly<{
  decision: PrebufferDecision;
  command?: CommandMatch;
  actionableFrame?: number;
}>;
