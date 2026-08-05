import { BAL, CURRENT_CHARACTER_IDS, CURRENT_CONTRACT, CURRENT_IMPL_SOURCE } from './constants.ts';
import {
  buildCurrentCommandDefinitions,
  CURRENT_COMPAT_PROFILE,
  resolveCommandTrigger,
} from './command-parser.ts';
import type {
  InputHistoryState,
  NormalizedInputEvent,
  PlayerId,
  TriggerInputEvent,
  TriggerResolution,
} from './command-types.ts';
import { fnv1a32, stableStringify } from './determinism.ts';
import { applyNormalizedInputEvent, createInputHistoryState } from './input-events.ts';
import { bridgeLegacyRuntimeInputPacket } from './runtime-input-bridge.ts';
import type { CurrentCharacterId, CurrentLevel } from './types.ts';
import type {
  RuntimeCommandShadowContext,
  RuntimeCommandShadowDecision,
  RuntimeCommandShadowIssue,
  RuntimeCommandShadowObservation,
  RuntimeCommandShadowState,
  RuntimeCommandShadowUpdate,
} from './runtime-command-shadow-types.ts';

export const RUNTIME_COMMAND_SHADOW_VERSION = 'runtime-command-shadow-v1' as const;
export const DEFAULT_RUNTIME_COMMAND_SHADOW_LOG = 256 as const;

export const RUNTIME_COMMAND_SHADOW_CONTRACT = {
  version: RUNTIME_COMMAND_SHADOW_VERSION,
  source: CURRENT_IMPL_SOURCE,
  executionAuthority: 'legacy-runtime',
  coreAuthority: 'observation-only',
  runtimeInjection: false,
  writeBack: false,
  provisionalActivation: false,
  commandProfile: CURRENT_COMPAT_PROFILE.id,
  comparedCurrentCommandCount: CURRENT_CHARACTER_IDS.reduce(
    (total, characterId) => total + CURRENT_CONTRACT.bal.CMD.moves[characterId].length,
    0,
  ),
  passthroughAffectsHistory: false,
  defaultMaxObservations: DEFAULT_RUNTIME_COMMAND_SHADOW_LOG,
} as const;

const CURRENT_CHARACTER_ID_SET = new Set<string>(CURRENT_CHARACTER_IDS);
const CURRENT_DEFINITIONS: Readonly<Record<CurrentCharacterId, ReturnType<typeof buildCurrentCommandDefinitions>>> = {
  moguzo: buildCurrentCommandDefinitions('moguzo'),
  pisuke: buildCurrentCommandDefinitions('pisuke'),
  godan: buildCurrentCommandDefinitions('godan'),
};

export class RuntimeCommandShadowError extends TypeError {
  readonly issues: readonly RuntimeCommandShadowIssue[];

  constructor(issue: RuntimeCommandShadowIssue) {
    super(`${issue.path}: expected ${issue.expected}; received ${issue.actual}`);
    this.name = 'RuntimeCommandShadowError';
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
  throw new RuntimeCommandShadowError({ path, expected, actual: describe(actual) });
}

function readRecord(value: unknown, path: string): Readonly<Record<string, unknown>> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) fail(path, 'object', value);
  return value as Readonly<Record<string, unknown>>;
}

function readRequired(record: Readonly<Record<string, unknown>>, key: string, path: string): unknown {
  if (!Object.hasOwn(record, key)) fail(`${path}.${key}`, 'present field', undefined);
  return record[key];
}

function readNonNegativeInteger(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) fail(path, 'non-negative integer', value);
  return value;
}

function readPositiveInteger(value: unknown, path: string): number {
  const number = readNonNegativeInteger(value, path);
  if (number === 0) fail(path, 'positive integer', value);
  return number;
}

function readPlayer(value: unknown, path: string): PlayerId {
  if (value !== 0 && value !== 1) fail(path, 'player 0 or 1', value);
  return value;
}

function readCharacterId(value: unknown, path: string): CurrentCharacterId {
  if (typeof value !== 'string' || !CURRENT_CHARACTER_ID_SET.has(value)) {
    fail(path, `current character ID (${CURRENT_CHARACTER_IDS.join(' | ')})`, value);
  }
  return value as CurrentCharacterId;
}

function normalFallback(event: TriggerInputEvent): RuntimeCommandShadowDecision {
  if (event.kind === 'grab') return { kind: 'fallback', fallback: 'normal-grab' };
  return { kind: 'fallback', fallback: 'normal-attack', level: event.level };
}

function legacyDecision(
  history: InputHistoryState,
  event: TriggerInputEvent,
  characterId: CurrentCharacterId,
): RuntimeCommandShadowDecision {
  const eligible = history.directionPresses.filter(
    (press) => press.frame <= event.frame && event.frame - press.frame <= BAL.CMD.bufF,
  );
  if (eligible.length < 2) return normalFallback(event);
  const previous = eligible[eligible.length - 2];
  const latest = eligible[eligible.length - 1];
  const moves = CURRENT_CONTRACT.bal.CMD.moves[characterId];

  for (let index = 0; index < moves.length; index += 1) {
    const move = moves[index];
    if (move.seq[0] !== previous.direction || move.seq[1] !== latest.direction) continue;
    const triggerMatches = event.kind === 'grab'
      ? move.type === 'grab'
      : (move.type === 'atk' || move.type === 'stance') && move.trigger === event.level;
    if (!triggerMatches) return normalFallback(event);
    const slot = index + 1;
    return {
      kind: 'command',
      commandId: `${characterId}:slot-${slot}`,
      slot,
      name: move.name,
    };
  }
  return normalFallback(event);
}

function coreDecision(resolution: TriggerResolution): RuntimeCommandShadowDecision {
  if (resolution.kind === 'command') {
    const slot = resolution.match.definition.slot;
    if (slot === undefined) throw new Error('current command definition must have a slot');
    return {
      kind: 'command',
      commandId: resolution.match.definition.id,
      slot,
      name: resolution.match.definition.name,
    };
  }
  if (resolution.fallback.kind === 'normal-grab') return { kind: 'fallback', fallback: 'normal-grab' };
  if (resolution.fallback.kind === 'normal-attack') {
    return { kind: 'fallback', fallback: 'normal-attack', level: resolution.fallback.level };
  }
  throw new Error('runtime command shadow does not request direction fallback');
}

function observeTrigger(
  history: InputHistoryState,
  event: TriggerInputEvent,
  characterId: CurrentCharacterId,
): RuntimeCommandShadowObservation {
  const legacy = legacyDecision(history, event, characterId);
  const core = coreDecision(resolveCommandTrigger(
    history,
    event,
    CURRENT_DEFINITIONS[characterId],
    CURRENT_COMPAT_PROFILE,
  ));
  return {
    frame: event.frame,
    order: event.order,
    player: event.player,
    characterId,
    trigger: event.kind === 'grab' ? 'grab' : event.level,
    legacy,
    core,
    matches: stableStringify(legacy) === stableStringify(core),
  };
}

function applyEvent(
  history: InputHistoryState,
  event: NormalizedInputEvent,
  characterId: CurrentCharacterId,
): Readonly<{ history: InputHistoryState; observation?: RuntimeCommandShadowObservation }> {
  const observation = event.kind === 'direction' ? undefined : observeTrigger(history, event, characterId);
  const update = applyNormalizedInputEvent(history, event, CURRENT_COMPAT_PROFILE);
  return observation ? { history: update.state, observation } : { history: update.state };
}

export function createRuntimeCommandShadowState(
  maxObservations: unknown = DEFAULT_RUNTIME_COMMAND_SHADOW_LOG,
): RuntimeCommandShadowState {
  const max = readPositiveInteger(maxObservations, 'maxObservations');
  return {
    version: RUNTIME_COMMAND_SHADOW_VERSION,
    histories: [createInputHistoryState(0), createInputHistoryState(1)],
    cursors: [{ frame: -1, nextOrder: 0 }, { frame: -1, nextOrder: 0 }],
    observations: [],
    maxObservations: max,
  };
}

export function observeLegacyRuntimeInputPacket(
  state: RuntimeCommandShadowState,
  packetSource: unknown,
  contextSource: RuntimeCommandShadowContext,
): RuntimeCommandShadowUpdate {
  const context = readRecord(contextSource, 'context');
  const frame = readNonNegativeInteger(readRequired(context, 'frame', 'context'), 'context.frame');
  const player = readPlayer(readRequired(context, 'player', 'context'), 'context.player');
  const characterId = readCharacterId(readRequired(context, 'characterId', 'context'), 'context.characterId');
  const cursor = state.cursors[player];
  if (frame < cursor.frame) fail('context.frame', `frame at or after ${cursor.frame}`, frame);
  const orderStart = frame === cursor.frame ? cursor.nextOrder : 0;
  const bridge = bridgeLegacyRuntimeInputPacket(packetSource, { frame, player, orderStart });

  const histories: [InputHistoryState, InputHistoryState] = [state.histories[0], state.histories[1]];
  const packetObservations: RuntimeCommandShadowObservation[] = [];
  for (const event of bridge.events) {
    const applied = applyEvent(histories[player], event, characterId);
    histories[player] = applied.history;
    if (applied.observation) packetObservations.push(applied.observation);
  }

  const cursors = [...state.cursors] as [typeof state.cursors[0], typeof state.cursors[1]];
  cursors[player] = { frame, nextOrder: bridge.nextOrder };
  const observations = [...state.observations, ...packetObservations].slice(-state.maxObservations);
  const nextState: RuntimeCommandShadowState = {
    version: state.version,
    histories,
    cursors,
    observations,
    maxObservations: state.maxObservations,
  };
  return { state: nextState, bridge, observations: packetObservations };
}

export function runtimeCommandShadowHash(state: RuntimeCommandShadowState): string {
  return fnv1a32(`${RUNTIME_COMMAND_SHADOW_VERSION}:${stableStringify(state)}`);
}

export function runtimeCommandShadowMismatchCount(state: RuntimeCommandShadowState): number {
  return state.observations.reduce((count, observation) => count + (observation.matches ? 0 : 1), 0);
}
