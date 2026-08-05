import type { InputHistoryState, PlayerId } from './command-types.ts';
import type { CurrentCharacterId, CurrentLevel } from './types.ts';
import type { RuntimeInputBridgeResult } from './runtime-input-bridge-types.ts';

export type RuntimeCommandShadowContext = Readonly<{
  frame: unknown;
  player: unknown;
  characterId: unknown;
}>;

export type RuntimeCommandShadowCursor = Readonly<{
  frame: number;
  nextOrder: number;
}>;

export type RuntimeCommandShadowDecision =
  | Readonly<{
      kind: 'command';
      commandId: string;
      slot: number;
      name: string;
    }>
  | Readonly<{
      kind: 'fallback';
      fallback: 'normal-attack' | 'normal-grab';
      level?: CurrentLevel;
    }>;

export type RuntimeCommandShadowObservation = Readonly<{
  frame: number;
  order: number;
  player: PlayerId;
  characterId: CurrentCharacterId;
  trigger: CurrentLevel | 'grab';
  legacy: RuntimeCommandShadowDecision;
  core: RuntimeCommandShadowDecision;
  matches: boolean;
}>;

export type RuntimeCommandShadowState = Readonly<{
  version: 'runtime-command-shadow-v1';
  histories: readonly [InputHistoryState, InputHistoryState];
  cursors: readonly [RuntimeCommandShadowCursor, RuntimeCommandShadowCursor];
  observations: readonly RuntimeCommandShadowObservation[];
  maxObservations: number;
}>;

export type RuntimeCommandShadowUpdate = Readonly<{
  state: RuntimeCommandShadowState;
  bridge: RuntimeInputBridgeResult;
  observations: readonly RuntimeCommandShadowObservation[];
}>;

export type RuntimeCommandShadowIssue = Readonly<{
  path: string;
  expected: string;
  actual: string;
}>;
