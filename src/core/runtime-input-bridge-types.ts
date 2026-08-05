import type { NormalizedInputEvent, PlayerId } from './command-types.ts';
import type { CurrentLevel, JsonValue } from './types.ts';

export type LegacyRuntimeDodgeKind = 'sway' | 'crouch' | 'lunge';
export type LegacyRuntimeHold = 'guard' | CurrentLevel | null;
export type LegacyRuntimePassthroughType = 'roar' | 'mikiri' | 'ult' | 'mgTap' | 'mgHit' | 'mgPick';

export type LegacyRuntimeInputPacketSource = Readonly<{
  cmds?: unknown;
  hold?: unknown;
}>;

export type RuntimeInputBridgeContext = Readonly<{
  frame: unknown;
  player: unknown;
  orderStart?: unknown;
}>;

export type RuntimeInputPassthrough = Readonly<{
  index: number;
  order: number;
  type: LegacyRuntimePassthroughType;
  command: Readonly<Record<string, JsonValue>>;
}>;

export type RuntimeInputBridgeResult = Readonly<{
  events: readonly NormalizedInputEvent[];
  passthrough: readonly RuntimeInputPassthrough[];
  hold: LegacyRuntimeHold;
  nextOrder: number;
}>;

export type RuntimeInputBridgeIssue = Readonly<{
  path: string;
  expected: string;
  actual: string;
}>;

export type RuntimeInputBridgePlayer = PlayerId;
