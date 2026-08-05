import type { ArchetypeId, CurrentCharacterId, CurrentFighterPhase } from './types.ts';

export type CpuDifficulty = 'EASY' | 'NORMAL' | 'HARD';
export type CpuAction =
  | 'wait'
  | 'attack_high'
  | 'attack_mid'
  | 'attack_low'
  | 'guard'
  | 'mikiri'
  | 'dodge_crouch'
  | 'dodge_sway'
  | 'dodge_step'
  | 'grab'
  | 'roar';

export type PublicFighterObservation = Readonly<{
  characterId: CurrentCharacterId;
  phase: CurrentFighterPhase;
  hp: number;
  guard: number;
  s: number;
  ult: number;
  focus: number;
  phaseFrame: number;
  lastPublicAction: CpuAction | null;
}>;

export type CpuObservation = Readonly<{
  frame: number;
  self: PublicFighterObservation;
  opponent: PublicFighterObservation;
}>;

export type QueuedCpuObservation = Readonly<{
  availableFrame: number;
  observation: CpuObservation;
}>;

export type CpuDifficultyConfig = Readonly<{
  reactionDelayF: number;
  actionCadenceF: number;
  mikiriRateCap: number;
  dodgeRateCap: number;
  commandRateCap: number;
}>;

export type CpuPersona = Readonly<{
  id: ArchetypeId;
  actionWeights: Readonly<Record<CpuAction, number>>;
  riskTolerance: number;
  repeatTolerance: number;
}>;

export type CpuBossOverride = Readonly<{
  id: 'dark_moguzo_boss';
  phase: 1 | 2 | 3;
  reactionDelayDeltaF: number;
  actionWeightDelta: Readonly<Partial<Record<CpuAction, number>>>;
  oneTimeRuleIds: readonly string[];
}>;

export type CpuActionLogEntry = Readonly<{
  frame: number;
  observationFrame: number;
  action: CpuAction;
  seedBefore: number;
  seedAfter: number;
  personaId: ArchetypeId;
  difficulty: CpuDifficulty;
}>;

export type CpuState = Readonly<{
  aiSeed: number;
  queued: readonly QueuedCpuObservation[];
  lastActionFrame: number;
  log: readonly CpuActionLogEntry[];
}>;

export type CpuDecision = Readonly<{
  action: CpuAction;
  state: CpuState;
  observation: CpuObservation | null;
}>;

export type PersonaBoutResult = Readonly<{
  left: ArchetypeId;
  right: ArchetypeId;
  leftScore: number;
  rightScore: number;
  winner: 'left' | 'right' | 'draw';
  finalSeed: number;
}>;
