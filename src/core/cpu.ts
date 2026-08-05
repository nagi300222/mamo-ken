import { fnv1a32, mulberry32 } from './determinism.ts';
import type { ArchetypeId } from './types.ts';
import type {
  CpuAction,
  CpuBossOverride,
  CpuDecision,
  CpuDifficulty,
  CpuDifficultyConfig,
  CpuObservation,
  CpuPersona,
  CpuState,
  PersonaBoutResult,
  PublicFighterObservation,
} from './cpu-types.ts';

export const PUBLIC_FIGHTER_OBSERVATION_KEYS = Object.freeze([
  'characterId', 'phase', 'hp', 'guard', 's', 'ult', 'focus', 'phaseFrame', 'lastPublicAction',
] as const);

export const CPU_DIFFICULTY_CONFIGS: Readonly<Record<CpuDifficulty, CpuDifficultyConfig>> = Object.freeze({
  EASY: Object.freeze({ reactionDelayF: 18, actionCadenceF: 18, mikiriRateCap: 0.04, dodgeRateCap: 0.05, commandRateCap: 0.05 }),
  NORMAL: Object.freeze({ reactionDelayF: 10, actionCadenceF: 12, mikiriRateCap: 0.12, dodgeRateCap: 0.10, commandRateCap: 0.25 }),
  HARD: Object.freeze({ reactionDelayF: 5, actionCadenceF: 8, mikiriRateCap: 0.22, dodgeRateCap: 0.15, commandRateCap: 0.60 }),
});

const ACTIONS = Object.freeze([
  'wait', 'attack_high', 'attack_mid', 'attack_low', 'guard', 'mikiri',
  'dodge_crouch', 'dodge_sway', 'dodge_step', 'grab', 'roar',
] as const satisfies readonly CpuAction[]);

function weights(values: Partial<Record<CpuAction, number>>): Readonly<Record<CpuAction, number>> {
  const complete = Object.fromEntries(ACTIONS.map((action) => [action, values[action] ?? 0])) as Record<CpuAction, number>;
  return Object.freeze(complete);
}

export const CPU_PERSONAS: Readonly<Record<ArchetypeId, CpuPersona>> = Object.freeze({
  standard: Object.freeze({ id: 'standard', actionWeights: weights({ wait: 1, attack_high: 2, attack_mid: 3, attack_low: 2, guard: 2, mikiri: 1, dodge_crouch: 1, dodge_sway: 1, dodge_step: 1, grab: 1, roar: 1 }), riskTolerance: 0.5, repeatTolerance: 0.4 }),
  rush: Object.freeze({ id: 'rush', actionWeights: weights({ wait: 0.5, attack_high: 3, attack_mid: 5, attack_low: 3, guard: 1, mikiri: 0.5, dodge_crouch: 1, dodge_sway: 2, dodge_step: 3, grab: 1, roar: 0.8 }), riskTolerance: 0.75, repeatTolerance: 0.55 }),
  power: Object.freeze({ id: 'power', actionWeights: weights({ wait: 1.5, attack_high: 4, attack_mid: 2, attack_low: 4, guard: 2, mikiri: 0.5, dodge_crouch: 1, dodge_sway: 0.5, dodge_step: 0.5, grab: 3, roar: 2 }), riskTolerance: 0.65, repeatTolerance: 0.3 }),
  defense: Object.freeze({ id: 'defense', actionWeights: weights({ wait: 2, attack_high: 1, attack_mid: 2, attack_low: 1, guard: 5, mikiri: 2, dodge_crouch: 2, dodge_sway: 2, dodge_step: 2, grab: 1, roar: 1 }), riskTolerance: 0.25, repeatTolerance: 0.2 }),
  tricky: Object.freeze({ id: 'tricky', actionWeights: weights({ wait: 2, attack_high: 2, attack_mid: 2, attack_low: 2, guard: 1, mikiri: 1, dodge_crouch: 2, dodge_sway: 3, dodge_step: 2, grab: 2, roar: 0.7 }), riskTolerance: 0.55, repeatTolerance: 0.25 }),
  grappler: Object.freeze({ id: 'grappler', actionWeights: weights({ wait: 1, attack_high: 2, attack_mid: 3, attack_low: 1, guard: 2, mikiri: 0.5, dodge_crouch: 1, dodge_sway: 1, dodge_step: 2, grab: 5, roar: 1 }), riskTolerance: 0.6, repeatTolerance: 0.35 }),
  counter: Object.freeze({ id: 'counter', actionWeights: weights({ wait: 3, attack_high: 1, attack_mid: 1, attack_low: 1, guard: 2, mikiri: 4, dodge_crouch: 3, dodge_sway: 3, dodge_step: 3, grab: 1, roar: 0.5 }), riskTolerance: 0.3, repeatTolerance: 0.15 }),
  charge: Object.freeze({ id: 'charge', actionWeights: weights({ wait: 1.5, attack_high: 2, attack_mid: 2, attack_low: 2, guard: 3, mikiri: 1, dodge_crouch: 1, dodge_sway: 2, dodge_step: 3, grab: 1, roar: 1 }), riskTolerance: 0.45, repeatTolerance: 0.25 }),
});

export const DARK_MOGUZO_BOSS_OVERRIDES: readonly CpuBossOverride[] = Object.freeze([
  Object.freeze({ id: 'dark_moguzo_boss', phase: 1, reactionDelayDeltaF: -1, actionWeightDelta: Object.freeze({ attack_mid: 1 }), oneTimeRuleIds: Object.freeze([]) }),
  Object.freeze({ id: 'dark_moguzo_boss', phase: 2, reactionDelayDeltaF: -2, actionWeightDelta: Object.freeze({ attack_high: 1, grab: 1 }), oneTimeRuleIds: Object.freeze(['phase2_roar_once']) }),
  Object.freeze({ id: 'dark_moguzo_boss', phase: 3, reactionDelayDeltaF: -3, actionWeightDelta: Object.freeze({ attack_low: 1, roar: 2 }), oneTimeRuleIds: Object.freeze(['phase3_ult_pressure_once']) }),
]);

function number(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new TypeError('public observation number required');
  return value;
}

export function sanitizePublicFighterObservation(raw: Record<string, unknown>): PublicFighterObservation {
  return Object.freeze({
    characterId: raw.characterId as PublicFighterObservation['characterId'],
    phase: raw.phase as PublicFighterObservation['phase'],
    hp: number(raw.hp),
    guard: number(raw.guard),
    s: number(raw.s),
    ult: number(raw.ult),
    focus: number(raw.focus),
    phaseFrame: number(raw.phaseFrame),
    lastPublicAction: (raw.lastPublicAction ?? null) as CpuAction | null,
  });
}

export function createCpuObservation(frame: number, self: Record<string, unknown>, opponent: Record<string, unknown>): CpuObservation {
  return Object.freeze({ frame, self: sanitizePublicFighterObservation(self), opponent: sanitizePublicFighterObservation(opponent) });
}

export function createCpuState(aiSeed: number): CpuState {
  return Object.freeze({ aiSeed: aiSeed >>> 0, queued: Object.freeze([]), lastActionFrame: -1_000_000, log: Object.freeze([]) });
}

export function queueCpuObservation(
  state: CpuState,
  observation: CpuObservation,
  difficulty: CpuDifficulty,
  bossOverride?: CpuBossOverride,
): CpuState {
  const delay = Math.max(1, CPU_DIFFICULTY_CONFIGS[difficulty].reactionDelayF + (bossOverride?.reactionDelayDeltaF ?? 0));
  const queued = [...state.queued, Object.freeze({ availableFrame: observation.frame + delay, observation })]
    .sort((a, b) => a.availableFrame - b.availableFrame || a.observation.frame - b.observation.frame);
  return Object.freeze({ ...state, queued: Object.freeze(queued) });
}

function cappedWeights(persona: CpuPersona, difficulty: CpuDifficulty, observation: CpuObservation, bossOverride?: CpuBossOverride): Readonly<Record<CpuAction, number>> {
  const config = CPU_DIFFICULTY_CONFIGS[difficulty];
  const result = { ...persona.actionWeights };
  for (const action of ACTIONS) result[action] = Math.max(0, result[action] + (bossOverride?.actionWeightDelta[action] ?? 0));
  const total = Math.max(1, Object.values(result).reduce((sum, value) => sum + value, 0));
  result.mikiri = Math.min(result.mikiri, total * config.mikiriRateCap);
  for (const action of ['dodge_crouch', 'dodge_sway', 'dodge_step'] as const) result[action] = Math.min(result[action], total * config.dodgeRateCap / 3);
  result.roar = observation.self.s >= 100 ? Math.min(result.roar, total * config.commandRateCap) : 0;
  if (observation.self.phase !== 'idle' && observation.self.phase !== 'guard') {
    for (const action of ACTIONS) result[action] = action === 'wait' ? 1 : 0;
  }
  return Object.freeze(result);
}

function weightedAction(seed: number, actionWeights: Readonly<Record<CpuAction, number>>): readonly [CpuAction, number] {
  const [roll, nextSeed] = mulberry32(seed);
  const total = ACTIONS.reduce((sum, action) => sum + actionWeights[action], 0);
  if (total <= 0) return ['wait', nextSeed] as const;
  let cursor = roll * total;
  for (const action of ACTIONS) {
    cursor -= actionWeights[action];
    if (cursor < 0) return [action, nextSeed] as const;
  }
  return ['wait', nextSeed] as const;
}

export function decideCpuAction(
  state: CpuState,
  frame: number,
  persona: CpuPersona,
  difficulty: CpuDifficulty,
  bossOverride?: CpuBossOverride,
): CpuDecision {
  const available = state.queued.filter((entry) => entry.availableFrame <= frame);
  const pending = state.queued.filter((entry) => entry.availableFrame > frame);
  const observation = available.length ? available[available.length - 1].observation : null;
  const config = CPU_DIFFICULTY_CONFIGS[difficulty];
  if (!observation || frame - state.lastActionFrame < config.actionCadenceF) {
    return Object.freeze({ action: 'wait', observation, state: Object.freeze({ ...state, queued: Object.freeze(pending) }) });
  }
  const seedBefore = state.aiSeed;
  const [action, seedAfter] = weightedAction(seedBefore, cappedWeights(persona, difficulty, observation, bossOverride));
  const entry = Object.freeze({ frame, observationFrame: observation.frame, action, seedBefore, seedAfter, personaId: persona.id, difficulty });
  return Object.freeze({
    action,
    observation,
    state: Object.freeze({ aiSeed: seedAfter, queued: Object.freeze(pending), lastActionFrame: frame, log: Object.freeze([...state.log, entry]) }),
  });
}

export function allPersonaPairings(): readonly (readonly [ArchetypeId, ArchetypeId])[] {
  const ids = Object.keys(CPU_PERSONAS) as ArchetypeId[];
  const pairs: (readonly [ArchetypeId, ArchetypeId])[] = [];
  for (let left = 0; left < ids.length; left += 1) for (let right = left + 1; right < ids.length; right += 1) pairs.push([ids[left], ids[right]] as const);
  return Object.freeze(pairs);
}

function personaSeed(seed: number, persona: ArchetypeId, bout: number): number {
  return Number.parseInt(fnv1a32(`${seed >>> 0}:${persona}:${bout}`), 16) >>> 0;
}

function actionValue(action: CpuAction): number {
  if (action.startsWith('attack_')) return 3;
  if (action.startsWith('dodge_') || action === 'guard') return 2;
  if (action === 'grab' || action === 'roar' || action === 'mikiri') return 4;
  return 0;
}

function personaBoutScore(persona: CpuPersona, seed: number): readonly [number, number] {
  let current = seed;
  let score = 0;
  for (let turn = 0; turn < 24; turn += 1) {
    const [action, next] = weightedAction(current, persona.actionWeights);
    const [noise, afterNoise] = mulberry32(next);
    score += actionValue(action) + Math.floor(noise * 3);
    current = afterNoise;
  }
  return [score, current] as const;
}

export function simulatePersonaBout(left: ArchetypeId, right: ArchetypeId, seed: number, bout = 0): PersonaBoutResult {
  const [leftScore, leftSeed] = personaBoutScore(CPU_PERSONAS[left], personaSeed(seed, left, bout));
  const [rightScore, rightSeed] = personaBoutScore(CPU_PERSONAS[right], personaSeed(seed, right, bout));
  return Object.freeze({
    left,
    right,
    leftScore,
    rightScore,
    winner: leftScore === rightScore ? 'draw' : leftScore > rightScore ? 'left' : 'right',
    finalSeed: (leftSeed ^ rightSeed) >>> 0,
  });
}

export function simulatePairingBatch(left: ArchetypeId, right: ArchetypeId, seed: number, bouts = 1_000): Readonly<{ leftWins: number; rightWins: number; draws: number; hash: string }> {
  let leftWins = 0;
  let rightWins = 0;
  let draws = 0;
  const summaries: string[] = [];
  for (let bout = 0; bout < bouts; bout += 1) {
    const result = simulatePersonaBout(left, right, seed, bout);
    if (result.winner === 'left') leftWins += 1;
    else if (result.winner === 'right') rightWins += 1;
    else draws += 1;
    summaries.push(`${result.leftScore}:${result.rightScore}:${result.finalSeed}`);
  }
  return Object.freeze({ leftWins, rightWins, draws, hash: fnv1a32(summaries.join('|')) });
}
