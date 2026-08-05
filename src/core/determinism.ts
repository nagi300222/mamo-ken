import type { BattleInput, BattleState, FighterState, HashableBattleState } from './types.ts';
import { BAL, CORE_SPEC_VERSION, CURRENT_CHARACTERS } from './constants.ts';

export const STABLE_SERIALIZATION_VERSION = 'stable-json-v1' as const;

type Seen = WeakSet<object>;

function compareCodeUnit(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function assertSerializable(value: unknown, path = '$', seen: Seen = new WeakSet()): void {
  if (value === undefined) throw new TypeError(`${path}: undefined is not serializable in ${STABLE_SERIALIZATION_VERSION}`);
  if (typeof value === 'number' && !Number.isFinite(value)) throw new TypeError(`${path}: non-finite number is not serializable in ${STABLE_SERIALIZATION_VERSION}`);
  if (typeof value === 'bigint') throw new TypeError(`${path}: bigint is not serializable in ${STABLE_SERIALIZATION_VERSION}`);
  if (typeof value === 'function' || typeof value === 'symbol') throw new TypeError(`${path}: unsupported value type for ${STABLE_SERIALIZATION_VERSION}`);
  if (value === null || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      if (!(index in value)) throw new TypeError(`${path}: sparse array is not serializable in ${STABLE_SERIALIZATION_VERSION}`);
    }
  } else {
    const proto = Object.getPrototypeOf(value);
    if (proto !== Object.prototype && proto !== null) throw new TypeError(`${path}: non-plain object is not serializable in ${STABLE_SERIALIZATION_VERSION}`);
    if (Object.getOwnPropertySymbols(value).length > 0) throw new TypeError(`${path}: symbol keys are not serializable in ${STABLE_SERIALIZATION_VERSION}`);
  }
  if (seen.has(value)) throw new TypeError(`${path}: cyclic reference is not serializable in ${STABLE_SERIALIZATION_VERSION}`);
  seen.add(value);
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertSerializable(item, `${path}[${index}]`, seen));
  } else {
    for (const key of Object.keys(value).sort(compareCodeUnit)) {
      assertSerializable((value as Record<string, unknown>)[key], `${path}.${key}`, seen);
    }
  }
  seen.delete(value);
}

export function mulberry32(seed: number): readonly [number, number] {
  const next = (seed + 0x6d2b79f5) >>> 0;
  let t = next;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, next] as const;
}

export function stableStringify(value: unknown): string {
  assertSerializable(value);
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => compareCodeUnit(a, b));
  return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`).join(',')}}`;
}

export function fnv1a32(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

export function toHashableBattleState(state: BattleState): HashableBattleState {
  const { lastHash: _lastHash, ...hashable } = state;
  return hashable;
}

export function stateHash(state: HashableBattleState): string {
  return fnv1a32(`${STABLE_SERIALIZATION_VERSION}:${stableStringify(state)}`);
}

function initialFighter(index: 0 | 1): FighterState {
  const character = CURRENT_CHARACTERS[index];
  return {
    characterId: character.id,
    phase: 'idle',
    hp: BAL.HP,
    guard: character.gMax,
    s: 0,
    ult: 0,
    focus: 0,
    combo: 0,
    phaseFrame: 0,
  };
}

export function createInitialBattleState(seed: number, aiSeed = seed ^ 0xa511ce): BattleState {
  const hashable = {
    version: CORE_SPEC_VERSION,
    frame: 0,
    flow: 'fight' as const,
    timer: BAL.TIME,
    seed: seed >>> 0,
    aiSeed: aiSeed >>> 0,
    fighters: [initialFighter(0), initialFighter(1)] as const,
  };
  return { ...hashable, lastHash: stateHash(hashable) };
}

function advanceFighter(fighter: FighterState): FighterState {
  return { ...fighter, phaseFrame: fighter.phaseFrame + 1 };
}

export function stepDeterministic(state: BattleState, inputs: readonly BattleInput[]): BattleState {
  let seed = state.seed;
  const nextFighters = state.fighters.map(advanceFighter) as [FighterState, FighterState];
  for (const input of [...inputs].sort((a, b) => a.player - b.player || compareCodeUnit(a.kind, b.kind) || compareCodeUnit(a.level ?? '', b.level ?? ''))) {
    const [, nextSeed] = mulberry32(seed);
    seed = nextSeed;
    const f = nextFighters[input.player];
    const damage = input.kind === 'attack' ? (input.level === 'low' ? 3 : input.level === 'high' ? 2 : 1) : 0;
    nextFighters[input.player] = { ...f, s: Math.min(BAL.SMAX, f.s + (input.kind === 'attack' ? 1 : 0)) };
    const opponent = nextFighters[input.player === 0 ? 1 : 0];
    nextFighters[input.player === 0 ? 1 : 0] = { ...opponent, hp: Math.max(0, opponent.hp - damage) };
  }
  const hashable = {
    version: state.version,
    frame: state.frame + 1,
    flow: state.flow,
    timer: Math.max(0, state.timer - 1),
    seed,
    aiSeed: state.aiSeed,
    fighters: nextFighters,
  } as const;
  return { ...hashable, lastHash: stateHash(hashable) };
}
