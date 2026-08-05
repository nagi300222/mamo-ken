import { CORE_SPEC_VERSION, CURRENT_CHARACTER_IDS, CURRENT_IMPL_SOURCE, CURRENT_PHASE_REPORT } from './constants.ts';
import { stateHash } from './determinism.ts';
import type { BattleState, CurrentBattleFlow, CurrentCharacterId, CurrentFighterPhase, FighterState, HashableBattleState } from './types.ts';
import type { RuntimeAdapterContext, RuntimeAdapterIssue } from './runtime-adapter-types.ts';

export const RUNTIME_ADAPTER_VERSION = 'legacy-runtime-adapter-v1' as const;

export const RUNTIME_ADAPTER_CONTRACT = {
  version: RUNTIME_ADAPTER_VERSION,
  source: CURRENT_IMPL_SOURCE,
  direction: 'legacy-runtime-to-core-snapshot',
  writeBack: false,
  provisionalActivation: false,
  battleFields: ['f', 'flow', 'timer', 'p'] as const,
  fighterFields: ['c.id', 'phase', 'hp', 'guard', 's', 'ult', 'focus', 'combo', 'pf'] as const,
  externalContext: ['rngState', 'aiRngState'] as const,
} as const;

const CURRENT_CHARACTER_ID_SET = new Set<string>(CURRENT_CHARACTER_IDS);
const CURRENT_FIGHTER_PHASE_SET = new Set<string>(CURRENT_PHASE_REPORT.fighterPhases.map(({ value }) => value));
const CURRENT_BATTLE_FLOW_SET = new Set<string>(CURRENT_PHASE_REPORT.battleFlows.map(({ value }) => value));

export class RuntimeAdapterError extends TypeError {
  readonly issues: readonly RuntimeAdapterIssue[];

  constructor(issue: RuntimeAdapterIssue) {
    super(`${issue.path}: expected ${issue.expected}; received ${issue.actual}`);
    this.name = 'RuntimeAdapterError';
    this.issues = [issue];
  }
}

function describe(value: unknown): string {
  if (typeof value === 'number' && Number.isNaN(value)) return 'NaN';
  if (typeof value === 'number' && !Number.isFinite(value)) return String(value);
  if (value === null) return 'null';
  if (Array.isArray(value)) return `array(length=${value.length})`;
  if (typeof value === 'string') return JSON.stringify(value);
  return typeof value;
}

function fail(path: string, expected: string, actual: unknown): never {
  throw new RuntimeAdapterError({ path, expected, actual: describe(actual) });
}

function readRecord(value: unknown, path: string): Readonly<Record<string, unknown>> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) fail(path, 'object', value);
  return value as Readonly<Record<string, unknown>>;
}

function readRequired(record: Readonly<Record<string, unknown>>, key: string, path: string): unknown {
  if (!Object.hasOwn(record, key)) fail(`${path}.${key}`, 'present field', undefined);
  return record[key];
}

function readNonNegativeNumber(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) fail(path, 'finite non-negative number', value);
  return value;
}

function readNonNegativeInteger(value: unknown, path: string): number {
  const number = readNonNegativeNumber(value, path);
  if (!Number.isInteger(number)) fail(path, 'non-negative integer', value);
  return number;
}

function readUint32(value: unknown, path: string): number {
  const number = readNonNegativeInteger(value, path);
  if (number > 0xffff_ffff) fail(path, 'unsigned 32-bit integer', value);
  return number;
}

function readCharacterId(value: unknown, path: string): CurrentCharacterId {
  if (typeof value !== 'string' || !CURRENT_CHARACTER_ID_SET.has(value)) fail(path, `current character ID (${CURRENT_CHARACTER_IDS.join(' | ')})`, value);
  return value as CurrentCharacterId;
}

function readFighterPhase(value: unknown, path: string): CurrentFighterPhase {
  if (typeof value !== 'string' || !CURRENT_FIGHTER_PHASE_SET.has(value)) fail(path, 'audited current fighter phase', value);
  return value as CurrentFighterPhase;
}

function readBattleFlow(value: unknown, path: string): CurrentBattleFlow {
  if (typeof value !== 'string' || !CURRENT_BATTLE_FLOW_SET.has(value)) fail(path, 'audited current battle flow', value);
  return value as CurrentBattleFlow;
}

function adaptFighter(value: unknown, index: 0 | 1): FighterState {
  const path = `battle.p[${index}]`;
  const fighter = readRecord(value, path);
  const character = readRecord(readRequired(fighter, 'c', path), `${path}.c`);
  return {
    characterId: readCharacterId(readRequired(character, 'id', `${path}.c`), `${path}.c.id`),
    phase: readFighterPhase(readRequired(fighter, 'phase', path), `${path}.phase`),
    hp: readNonNegativeNumber(readRequired(fighter, 'hp', path), `${path}.hp`),
    guard: readNonNegativeNumber(readRequired(fighter, 'guard', path), `${path}.guard`),
    s: readNonNegativeNumber(readRequired(fighter, 's', path), `${path}.s`),
    ult: readNonNegativeInteger(readRequired(fighter, 'ult', path), `${path}.ult`),
    focus: readNonNegativeNumber(readRequired(fighter, 'focus', path), `${path}.focus`),
    combo: readNonNegativeInteger(readRequired(fighter, 'combo', path), `${path}.combo`),
    phaseFrame: readNonNegativeInteger(readRequired(fighter, 'pf', path), `${path}.pf`),
  };
}

export function adaptLegacyRuntimeBattle(source: unknown, context: RuntimeAdapterContext): BattleState {
  const battle = readRecord(source, 'battle');
  const adapterContext = readRecord(context, 'context');
  const fighters = readRequired(battle, 'p', 'battle');
  if (!Array.isArray(fighters) || fighters.length !== 2) fail('battle.p', 'two-fighter array', fighters);

  const hashable: HashableBattleState = {
    version: CORE_SPEC_VERSION,
    frame: readNonNegativeInteger(readRequired(battle, 'f', 'battle'), 'battle.f'),
    flow: readBattleFlow(readRequired(battle, 'flow', 'battle'), 'battle.flow'),
    timer: readNonNegativeInteger(readRequired(battle, 'timer', 'battle'), 'battle.timer'),
    seed: readUint32(readRequired(adapterContext, 'rngState', 'context'), 'context.rngState'),
    aiSeed: readUint32(readRequired(adapterContext, 'aiRngState', 'context'), 'context.aiRngState'),
    fighters: [adaptFighter(fighters[0], 0), adaptFighter(fighters[1], 1)],
  };

  return { ...hashable, lastHash: stateHash(hashable) };
}
