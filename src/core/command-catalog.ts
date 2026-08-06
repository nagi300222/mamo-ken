import { CORE3_ROSTER } from './roster-core3.ts';
import type { CommandDefinition, CommandDefinitionSource, InputTrigger } from './command-types.ts';
import type { CurrentCharacterId, Direction } from './types.ts';

export const CORE3_COMMAND_CATALOG_VERSION = 'core3-command-catalog-v1' as const;
export const CORE3_COMMAND_PRIORITY_POLICY = 'longest-command-first' as const;

export type CommandInputOverlap = Readonly<{
  characterId: CurrentCharacterId;
  trigger: InputTrigger;
  shorterId: string;
  shorterName: string;
  shorterSource: CommandDefinitionSource;
  shorterDirections: readonly Direction[];
  longerId: string;
  longerName: string;
  longerSource: CommandDefinitionSource;
  longerDirections: readonly Direction[];
  resolution: typeof CORE3_COMMAND_PRIORITY_POLICY;
}>;

const CONDITION_BY_COMMAND_ID: Readonly<Record<string, string>> = Object.freeze({
  'pisuke.cmd6': 'pisuke.lunge-success',
});

function definitionSource(status: 'current_impl' | 'design_confirmed'): CommandDefinitionSource {
  return status;
}

function definitionFor(characterId: CurrentCharacterId, move: (typeof CORE3_ROSTER)[number]['commandMoves'][number]): CommandDefinition {
  const conditionId = CONDITION_BY_COMMAND_ID[move.id];
  return Object.freeze({
    id: `${characterId}:slot-${move.slot}`,
    name: move.nameJa,
    characterId,
    slot: move.slot,
    directions: Object.freeze([...move.sequence]),
    trigger: move.trigger,
    specificity: 0,
    definitionOrder: move.slot - 1,
    source: definitionSource(move.status),
    ...(conditionId ? { conditionId, blockShorterOnConditionFailure: false } : {}),
  });
}

export function buildCore3CatalogCommandDefinitions(characterId?: CurrentCharacterId): readonly CommandDefinition[] {
  const characters = characterId
    ? CORE3_ROSTER.filter((character) => character.id === characterId)
    : CORE3_ROSTER;
  if (characterId && characters.length !== 1) throw new RangeError(`unknown current character: ${characterId}`);
  return Object.freeze(characters.flatMap((character) => character.commandMoves.map((move) => definitionFor(character.id, move))));
}

function isProperSuffix(shorter: readonly Direction[], longer: readonly Direction[]): boolean {
  if (shorter.length >= longer.length) return false;
  const offset = longer.length - shorter.length;
  for (let index = 0; index < shorter.length; index += 1) {
    if (shorter[index] !== longer[offset + index]) return false;
  }
  return true;
}

export function auditCore3CommandInputOverlaps(
  definitions: readonly CommandDefinition[] = buildCore3CatalogCommandDefinitions(),
): readonly CommandInputOverlap[] {
  const overlaps: CommandInputOverlap[] = [];
  for (const shorter of definitions) {
    if (!shorter.characterId) continue;
    for (const longer of definitions) {
      if (shorter === longer || shorter.characterId !== longer.characterId || shorter.trigger !== longer.trigger) continue;
      if (!isProperSuffix(shorter.directions, longer.directions)) continue;
      overlaps.push(Object.freeze({
        characterId: shorter.characterId,
        trigger: shorter.trigger,
        shorterId: shorter.id,
        shorterName: shorter.name,
        shorterSource: shorter.source,
        shorterDirections: Object.freeze([...shorter.directions]),
        longerId: longer.id,
        longerName: longer.name,
        longerSource: longer.source,
        longerDirections: Object.freeze([...longer.directions]),
        resolution: CORE3_COMMAND_PRIORITY_POLICY,
      }));
    }
  }
  overlaps.sort((left, right) => {
    const characterOrder = CORE3_ROSTER.findIndex((character) => character.id === left.characterId)
      - CORE3_ROSTER.findIndex((character) => character.id === right.characterId);
    if (characterOrder !== 0) return characterOrder;
    const leftSlot = Number(left.longerId.split('-').at(-1));
    const rightSlot = Number(right.longerId.split('-').at(-1));
    return leftSlot - rightSlot;
  });
  return Object.freeze(overlaps);
}

export function validateCore3CommandCatalog(): void {
  const definitions = buildCore3CatalogCommandDefinitions();
  if (definitions.length !== 21) throw new Error('current-three command catalog must contain 21 definitions');
  if (definitions.filter((definition) => definition.source === 'current_impl').length !== 9) throw new Error('command catalog must preserve nine current definitions');
  if (definitions.filter((definition) => definition.source === 'design_confirmed').length !== 12) throw new Error('command catalog must contain twelve design-confirmed definitions');
  if (new Set(definitions.map((definition) => definition.id)).size !== definitions.length) throw new Error('duplicate command definition id');

  for (const character of CORE3_ROSTER) {
    const characterDefinitions = definitions.filter((definition) => definition.characterId === character.id);
    if (characterDefinitions.length !== 7) throw new Error(`${character.id}: seven definitions required`);
    const inputs = characterDefinitions.map((definition) => `${definition.directions.join(',')}+${definition.trigger}`);
    if (new Set(inputs).size !== inputs.length) throw new Error(`${character.id}: exact duplicate command input`);
    for (let index = 0; index < characterDefinitions.length; index += 1) {
      const definition = characterDefinitions[index];
      const move = character.commandMoves[index];
      if (definition.slot !== move.slot || definition.name !== move.nameJa) throw new Error(`${character.id}: slot ${index + 1} catalog mismatch`);
      if (definition.directions.join(',') !== move.sequence.join(',') || definition.trigger !== move.trigger) throw new Error(`${character.id}: slot ${index + 1} input mismatch`);
      if (definition.source !== move.status) throw new Error(`${character.id}: slot ${index + 1} source mismatch`);
    }
  }

  const conditioned = definitions.filter((definition) => definition.conditionId);
  if (conditioned.length !== 1 || conditioned[0].id !== 'pisuke:slot-6' || conditioned[0].conditionId !== 'pisuke.lunge-success') {
    throw new Error('Pisuke slot 6 must be the only current-three conditional command');
  }
  if (conditioned[0].blockShorterOnConditionFailure !== false) throw new Error('conditional failure must fall back normally');

  const overlaps = auditCore3CommandInputOverlaps(definitions);
  const expected = [
    ['pisuke:slot-1', 'pisuke:slot-7'],
    ['godan:slot-4', 'godan:slot-7'],
  ];
  if (overlaps.length !== expected.length) throw new Error(`expected two suffix overlaps, found ${overlaps.length}`);
  for (let index = 0; index < expected.length; index += 1) {
    if (overlaps[index].shorterId !== expected[index][0] || overlaps[index].longerId !== expected[index][1]) throw new Error('unexpected command overlap');
    if (overlaps[index].resolution !== CORE3_COMMAND_PRIORITY_POLICY) throw new Error('overlap must resolve by longest-command priority');
  }
}
