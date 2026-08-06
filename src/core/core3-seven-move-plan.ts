import type { CommandDefinition } from './command-types.ts';
import { CHARACTER_CATALOG_BY_ID } from './character-catalog.ts';
import { CURRENT_CONTRACT } from './constants.ts';
import { fnv1a32, stableStringify } from './determinism.ts';
import { CORE3_ROSTER } from './roster-core3.ts';
import type { CurrentCharacterId, CurrentLevel, Direction } from './types.ts';

export const CORE3_SEVEN_MOVE_PLAN_VERSION = 'core3-seven-move-plan-v1' as const;

export type Core3MoveRuntimeConnection = 'current_runtime' | 'not_connected';
export type Core3MoveBalanceStatus = 'current_audited' | 'bal_undecided';

export type Core3CurrentAudit = Readonly<{
  type: 'atk' | 'grab' | 'stance';
  level: CurrentLevel | null;
  damage: number | null;
  startupF: number | null;
  activeF: number | null;
  recoveryF: number | null;
}>;

export type Core3SevenMovePlanEntry = Readonly<{
  id: string;
  characterId: CurrentCharacterId;
  slot: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  nameJa: string;
  directions: readonly Direction[];
  trigger: CurrentLevel | 'grab';
  attribute: 'HIGH' | 'MID' | 'LOW' | 'GRAB';
  reach: 0 | 1 | 2 | 3;
  roleJa: string;
  difficulty: 'beginner' | 'standard' | 'advanced';
  conditionsJa: readonly string[];
  balanceConstraints: readonly string[];
  runtimeConnection: Core3MoveRuntimeConnection;
  balanceStatus: Core3MoveBalanceStatus;
  currentAudit: Core3CurrentAudit | null;
}>;

type CurrentRawMove = Readonly<{
  type: 'atk' | 'grab' | 'stance';
  lv?: CurrentLevel;
  d?: number;
  counterDmg?: number;
  s?: number;
  a?: number;
  r?: number;
}>;

function currentRawMoves(characterId: CurrentCharacterId): readonly CurrentRawMove[] {
  return CURRENT_CONTRACT.bal.CMD.moves[characterId] as unknown as readonly CurrentRawMove[];
}

function currentAudit(characterId: CurrentCharacterId, slot: number): Core3CurrentAudit {
  const raw = currentRawMoves(characterId)[slot - 1];
  if (!raw) throw new Error(`missing current raw move: ${characterId}:${slot}`);
  return Object.freeze({
    type: raw.type,
    level: raw.lv ?? null,
    damage: typeof raw.d === 'number' ? raw.d : typeof raw.counterDmg === 'number' ? raw.counterDmg : null,
    startupF: typeof raw.s === 'number' ? raw.s : null,
    activeF: typeof raw.a === 'number' ? raw.a : null,
    recoveryF: typeof raw.r === 'number' ? raw.r : null,
  });
}

export const CORE3_SEVEN_MOVE_PLAN: readonly Core3SevenMovePlanEntry[] = Object.freeze(
  CORE3_ROSTER.flatMap((character) => character.commandMoves.map((move) => {
    const catalogMove = CHARACTER_CATALOG_BY_ID[character.id].moves[move.slot - 1];
    if (!catalogMove) throw new Error(`missing catalog move: ${character.id}:${move.slot}`);
    const connected = move.status === 'current_impl';
    return Object.freeze({
      id: move.id,
      characterId: character.id,
      slot: move.slot,
      nameJa: move.nameJa,
      directions: Object.freeze([...move.sequence]),
      trigger: move.trigger,
      attribute: move.attribute,
      reach: move.reach,
      roleJa: move.roleJa,
      difficulty: catalogMove.difficulty,
      conditionsJa: Object.freeze([...move.conditionsJa]),
      balanceConstraints: Object.freeze([...move.balanceConstraints]),
      runtimeConnection: connected ? 'current_runtime' : 'not_connected',
      balanceStatus: connected ? 'current_audited' : 'bal_undecided',
      currentAudit: connected ? currentAudit(character.id, move.slot) : null,
    });
  })),
);

export function buildCore3SevenMoveCommandDefinitions(
  characterId?: CurrentCharacterId,
): readonly CommandDefinition[] {
  const entries = characterId
    ? CORE3_SEVEN_MOVE_PLAN.filter((entry) => entry.characterId === characterId)
    : CORE3_SEVEN_MOVE_PLAN;
  return Object.freeze(entries.map((entry, definitionOrder) => Object.freeze({
    id: `${entry.characterId}:slot-${entry.slot}`,
    name: entry.nameJa,
    characterId: entry.characterId,
    slot: entry.slot,
    directions: Object.freeze([...entry.directions]),
    trigger: entry.trigger,
    specificity: entry.directions.length,
    definitionOrder,
    source: entry.runtimeConnection === 'current_runtime' ? 'current_impl' : 'design_confirmed',
  })));
}

export function validateCore3SevenMovePlan(
  plan: readonly Core3SevenMovePlanEntry[] = CORE3_SEVEN_MOVE_PLAN,
): void {
  if (plan.length !== 21) throw new Error(`Core3 seven-move plan requires 21 entries; got ${plan.length}`);
  const ids = new Set<string>();
  for (const character of CORE3_ROSTER) {
    const entries = plan.filter((entry) => entry.characterId === character.id);
    if (entries.length !== 7) throw new Error(`${character.id}: seven plan entries required`);
    if (entries.map((entry) => entry.slot).join(',') !== '1,2,3,4,5,6,7') throw new Error(`${character.id}: plan slot order mismatch`);
    for (const entry of entries) {
      if (ids.has(entry.id)) throw new Error(`duplicate plan id: ${entry.id}`);
      ids.add(entry.id);
      const rosterMove = character.commandMoves[entry.slot - 1];
      const catalogMove = CHARACTER_CATALOG_BY_ID[entry.characterId].moves[entry.slot - 1];
      if (!rosterMove || !catalogMove) throw new Error(`missing source move: ${entry.id}`);
      if (entry.nameJa !== rosterMove.nameJa || entry.directions.join(',') !== rosterMove.sequence.join(',') || entry.trigger !== rosterMove.trigger) {
        throw new Error(`plan/roster command mismatch: ${entry.id}`);
      }
      if (entry.attribute !== rosterMove.attribute || entry.reach !== rosterMove.reach || entry.roleJa !== rosterMove.roleJa) {
        throw new Error(`plan/roster classification mismatch: ${entry.id}`);
      }
      if (entry.difficulty !== catalogMove.difficulty) throw new Error(`plan/catalog difficulty mismatch: ${entry.id}`);
      if (entry.runtimeConnection === 'current_runtime') {
        if (entry.slot > 3 || entry.balanceStatus !== 'current_audited' || entry.currentAudit === null) {
          throw new Error(`invalid current runtime plan entry: ${entry.id}`);
        }
      } else if (entry.slot < 4 || entry.balanceStatus !== 'bal_undecided' || entry.currentAudit !== null) {
        throw new Error(`unconnected move must not contain runtime BAL: ${entry.id}`);
      }
      if (entry.reach === 3 && entry.balanceConstraints.length < 2) throw new Error(`Reach 3 constraints missing: ${entry.id}`);
    }
  }
  if (plan.filter((entry) => entry.runtimeConnection === 'current_runtime').length !== 9) throw new Error('exactly nine moves must remain connected');
  if (plan.filter((entry) => entry.runtimeConnection === 'not_connected').length !== 12) throw new Error('exactly twelve moves must remain unconnected');
}

export function exportCore3SevenMovePlan(): string {
  return stableStringify({ version: CORE3_SEVEN_MOVE_PLAN_VERSION, entries: CORE3_SEVEN_MOVE_PLAN });
}

export function hashCore3SevenMovePlan(): string {
  return fnv1a32(exportCore3SevenMovePlan());
}
