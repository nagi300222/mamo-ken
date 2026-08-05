import type { BattleState } from './types.ts';

export type LegacyRuntimeCharacterSource = Readonly<{
  id?: unknown;
}>;

export type LegacyRuntimeFighterSource = Readonly<{
  c?: unknown;
  phase?: unknown;
  hp?: unknown;
  guard?: unknown;
  s?: unknown;
  ult?: unknown;
  focus?: unknown;
  combo?: unknown;
  pf?: unknown;
}>;

export type LegacyRuntimeBattleSource = Readonly<{
  f?: unknown;
  flow?: unknown;
  timer?: unknown;
  p?: unknown;
}>;

export type RuntimeAdapterContext = Readonly<{
  rngState: unknown;
  aiRngState: unknown;
}>;

export type RuntimeAdapterIssue = Readonly<{
  path: string;
  expected: string;
  actual: string;
}>;

export type CurrentRuntimeSnapshot = BattleState;
