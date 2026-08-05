import { CURRENT_IMPL_SOURCE } from './constants.ts';
import type { NormalizedInputEvent, PlayerId } from './command-types.ts';
import type { CurrentLevel, Direction, JsonValue } from './types.ts';
import type {
  LegacyRuntimeDodgeKind,
  LegacyRuntimeHold,
  LegacyRuntimePassthroughType,
  RuntimeInputBridgeContext,
  RuntimeInputBridgeIssue,
  RuntimeInputBridgeResult,
  RuntimeInputPassthrough,
} from './runtime-input-bridge-types.ts';

export const RUNTIME_INPUT_BRIDGE_VERSION = 'legacy-runtime-input-bridge-v1' as const;

export const RUNTIME_INPUT_BRIDGE_CONTRACT = {
  version: RUNTIME_INPUT_BRIDGE_VERSION,
  source: CURRENT_IMPL_SOURCE,
  direction: 'legacy-runtime-input-to-normalized-events',
  writeBack: false,
  runtimeInjection: false,
  provisionalActivation: false,
  mappedCommandTypes: ['dodge', 'atk', 'grab'] as const,
  passthroughCommandTypes: ['roar', 'mikiri', 'ult', 'mgTap', 'mgHit', 'mgPick'] as const,
  holdMappedToNormalizedEvent: false,
  dodgeTapEncoding: 'direction-press-release-same-frame',
} as const;

const DODGE_TO_DIRECTION: Readonly<Record<LegacyRuntimeDodgeKind, Direction>> = {
  sway: 'left',
  crouch: 'down',
  lunge: 'right',
};
const CURRENT_LEVELS = new Set<string>(['high', 'mid', 'low']);
const DODGE_KINDS = new Set<string>(Object.keys(DODGE_TO_DIRECTION));
const PASSTHROUGH_TYPES = new Set<string>(RUNTIME_INPUT_BRIDGE_CONTRACT.passthroughCommandTypes);

export class RuntimeInputBridgeError extends TypeError {
  readonly issues: readonly RuntimeInputBridgeIssue[];

  constructor(issue: RuntimeInputBridgeIssue) {
    super(`${issue.path}: expected ${issue.expected}; received ${issue.actual}`);
    this.name = 'RuntimeInputBridgeError';
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
  throw new RuntimeInputBridgeError({ path, expected, actual: describe(actual) });
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

function readPlayer(value: unknown, path: string): PlayerId {
  if (value !== 0 && value !== 1) fail(path, 'player 0 or 1', value);
  return value;
}

function readString(value: unknown, path: string): string {
  if (typeof value !== 'string') fail(path, 'string', value);
  return value;
}

function readLevel(value: unknown, path: string): CurrentLevel {
  if (typeof value !== 'string' || !CURRENT_LEVELS.has(value)) fail(path, 'current attack level (high | mid | low)', value);
  return value as CurrentLevel;
}

function readDodgeKind(value: unknown, path: string): LegacyRuntimeDodgeKind {
  if (typeof value !== 'string' || !DODGE_KINDS.has(value)) fail(path, 'legacy dodge kind (sway | crouch | lunge)', value);
  return value as LegacyRuntimeDodgeKind;
}

function readHold(value: unknown, path: string): LegacyRuntimeHold {
  if (value === null || value === 'guard') return value;
  if (typeof value === 'string' && CURRENT_LEVELS.has(value)) return value as CurrentLevel;
  return fail(path, 'null, guard, or current attack level', value);
}

function passthroughCommand(
  type: LegacyRuntimePassthroughType,
  command: Readonly<Record<string, unknown>>,
  path: string,
): Readonly<Record<string, JsonValue>> {
  if (type === 'mgPick') return { t: type, choice: readString(readRequired(command, 'choice', path), `${path}.choice`) };
  return { t: type };
}

export function bridgeLegacyRuntimeInputPacket(
  packetSource: unknown,
  contextSource: RuntimeInputBridgeContext,
): RuntimeInputBridgeResult {
  const packet = readRecord(packetSource, 'packet');
  const context = readRecord(contextSource, 'context');
  const commands = readRequired(packet, 'cmds', 'packet');
  if (!Array.isArray(commands)) fail('packet.cmds', 'array', commands);

  const frame = readNonNegativeInteger(readRequired(context, 'frame', 'context'), 'context.frame');
  const player = readPlayer(readRequired(context, 'player', 'context'), 'context.player');
  let order = Object.hasOwn(context, 'orderStart')
    ? readNonNegativeInteger(context.orderStart, 'context.orderStart')
    : 0;
  const hold = readHold(readRequired(packet, 'hold', 'packet'), 'packet.hold');
  const events: NormalizedInputEvent[] = [];
  const passthrough: RuntimeInputPassthrough[] = [];

  commands.forEach((value, index) => {
    const path = `packet.cmds[${index}]`;
    const command = readRecord(value, path);
    const type = readString(readRequired(command, 't', path), `${path}.t`);

    if (type === 'dodge') {
      const kind = readDodgeKind(readRequired(command, 'kind', path), `${path}.kind`);
      const direction = DODGE_TO_DIRECTION[kind];
      events.push({ kind: 'direction', action: 'press', direction, frame, order, player });
      order += 1;
      events.push({ kind: 'direction', action: 'release', direction, frame, order, player });
      order += 1;
      return;
    }
    if (type === 'atk') {
      events.push({
        kind: 'attack',
        level: readLevel(readRequired(command, 'lv', path), `${path}.lv`),
        frame,
        order,
        player,
      });
      order += 1;
      return;
    }
    if (type === 'grab') {
      events.push({ kind: 'grab', frame, order, player });
      order += 1;
      return;
    }
    if (PASSTHROUGH_TYPES.has(type)) {
      const passthroughType = type as LegacyRuntimePassthroughType;
      passthrough.push({
        index,
        order,
        type: passthroughType,
        command: passthroughCommand(passthroughType, command, path),
      });
      order += 1;
      return;
    }
    fail(`${path}.t`, `audited runtime input type (${[
      ...RUNTIME_INPUT_BRIDGE_CONTRACT.mappedCommandTypes,
      ...RUNTIME_INPUT_BRIDGE_CONTRACT.passthroughCommandTypes,
    ].join(' | ')})`, type);
  });

  return { events, passthrough, hold, nextOrder: order };
}
