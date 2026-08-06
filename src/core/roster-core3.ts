import { abilityGyuiinEffect } from './ability-hooks.ts';
import { CHARACTER_CATALOG_BY_ID } from './character-catalog.ts';
import type { CharacterCatalogMove } from './character-catalog.ts';
import { BAL, CURRENT_CHARACTERS, CURRENT_CONTRACT } from './constants.ts';
import { CPU_PERSONAS } from './cpu.ts';
import { REQUIRED_POSE_IDS } from './sprite-types.ts';
import type { PoseId } from './sprite-types.ts';
import type { CurrentCharacterId, CurrentLevel } from './types.ts';
import type {
  CharacterAssetMapping,
  CoreRosterCharacter,
  RecommendedComboData,
  RosterCommandMove,
} from './roster-types.ts';

const CURRENT_RUNTIME_POSE_IDS = Object.freeze([...(CURRENT_CONTRACT.sprites as { readonly poseIds: readonly string[] }).poseIds]);
const SPRITE_H = BAL.SPRITE_H as Readonly<Record<CurrentCharacterId, number>>;
const PORTRAIT_RATIO = BAL.PORTRAIT_RATIO as Readonly<Record<CurrentCharacterId, number>>;
const CURRENT_SLOTS = 3;

export const CANONICAL_TO_CURRENT_POSE: Readonly<Record<PoseId, string>> = Object.freeze({
  idle: 'idle',
  guard: 'guard',
  flinch: 'hurt',
  victory: 'win',
  high_telegraph: 'tele_high',
  mid_telegraph: 'tele_mid',
  low_telegraph: 'tele_low',
  mid_attack: 'atk_mid',
  high_attack: 'atk_high',
  low_attack: 'atk_low',
  mikiri: 'mikiri',
  roar_inhale: 'roar_charge',
  roar_release: 'roar',
  grab: 'grab_reach',
  grab_lift: 'grab_lift',
  grabbed: 'grabbed',
  down: 'down',
  getup: 'getup',
  ko: 'ko',
  ult_charge: 'ult_charge',
  crouch: 'crouch',
  sway: 'sway',
  lunge: 'lunge',
  crouch_atk: 'crouch_atk',
});

function tierFor(move: CharacterCatalogMove): RosterCommandMove['tier'] {
  if (move.difficulty === 'standard') return 'intermediate';
  return move.difficulty;
}

function levelFor(move: CharacterCatalogMove): CurrentLevel | null {
  if (move.attribute === 'HIGH') return 'high';
  if (move.attribute === 'MID') return 'mid';
  if (move.attribute === 'LOW') return 'low';
  return null;
}

function commandMove(characterId: CurrentCharacterId, slot: 1 | 2 | 3 | 4 | 5 | 6 | 7): RosterCommandMove {
  const catalogMove = CHARACTER_CATALOG_BY_ID[characterId].moves[slot - 1];
  if (!catalogMove || catalogMove.slot !== slot) throw new Error(`${characterId}: missing catalog slot ${slot}`);
  const audited = slot <= CURRENT_SLOTS ? CURRENT_CONTRACT.bal.CMD.moves[characterId][slot - 1] : null;
  const current = catalogMove.implementationStatus === 'current_runtime';
  const type = audited?.type ?? (catalogMove.attribute === 'GRAB' ? 'grab' : 'atk');
  const auditedLevel = audited?.lv;
  const level = auditedLevel === 'high' || auditedLevel === 'mid' || auditedLevel === 'low' ? auditedLevel : levelFor(catalogMove);
  return Object.freeze({
    id: `${characterId}.cmd${slot}`,
    slot,
    status: current ? 'current_impl' : 'design_confirmed',
    nameJa: catalogMove.nameJa,
    sequence: Object.freeze([...catalogMove.command.directions]),
    trigger: catalogMove.command.trigger,
    type,
    level,
    attribute: catalogMove.attribute,
    reach: catalogMove.reach,
    tier: tierFor(catalogMove),
    roleJa: catalogMove.roleJa,
    conditionsJa: Object.freeze([...catalogMove.conditionsJa]),
    balanceConstraints: Object.freeze([...catalogMove.balanceConstraints]),
    estimatedDamage: typeof audited?.d === 'number' ? audited.d : null,
    tags: Object.freeze(current ? ['existing_slot'] : ['design_confirmed']),
  });
}

function commandMoves(characterId: CurrentCharacterId): readonly RosterCommandMove[] {
  return Object.freeze([1, 2, 3, 4, 5, 6, 7].map((slot) => commandMove(
    characterId,
    slot as 1 | 2 | 3 | 4 | 5 | 6 | 7,
  )));
}

function combos(characterId: CurrentCharacterId): readonly RecommendedComboData[] {
  return Object.freeze(CHARACTER_CATALOG_BY_ID[characterId].combos.map((combo) => Object.freeze({
    id: `${characterId}.combo.${combo.category}`,
    category: combo.category,
    labelJa: combo.labelJa,
    status: 'unverified_move_spec' as const,
    moveIds: Object.freeze([]),
    condition: null,
    estimatedDamage: null,
    notesJa: Object.freeze([...combo.notesJa]),
  })));
}

function assets(characterId: CurrentCharacterId): CharacterAssetMapping {
  return Object.freeze({
    status: 'current_impl',
    portraitRatio: PORTRAIT_RATIO[characterId],
    spriteHeight: SPRITE_H[characterId],
    poseMap: CANONICAL_TO_CURRENT_POSE,
    commandPoseMap: Object.freeze({ 1: 'cmd1', 2: 'cmd2', 3: 'cmd3' }),
  });
}

function rosterCharacter(
  id: CurrentCharacterId,
  archetype: 'standard' | 'rush' | 'power',
  commandDifficulty: 1 | 2,
  special: CoreRosterCharacter['special'],
): CoreRosterCharacter {
  const current = CURRENT_CHARACTERS.find((character) => character.id === id);
  if (!current) throw new Error(`missing current character: ${id}`);
  return Object.freeze({
    id,
    displayName: current.name,
    archetype,
    commandDifficulty,
    commandMoves: commandMoves(id),
    special,
    recommendedCombos: combos(id),
    personaId: archetype,
    assets: assets(id),
    balanceAudit: Object.freeze({
      maxHp: BAL.HP,
      guardMax: current.gMax,
      damageMul: current.dMul,
      startupOffsetF: current.sOfs,
      sGainMul: current.sMul,
      currentCommandCount: CURRENT_SLOTS,
    }),
  });
}

export const CORE3_ROSTER: readonly CoreRosterCharacter[] = Object.freeze([
  rosterCharacter('moguzo', 'standard', 1, Object.freeze({ id: 'moguzo.guts', nameJa: '根性', status: 'provisional', abilityHook: 'guts' })),
  rosterCharacter('pisuke', 'rush', 2, Object.freeze({ id: 'pisuke.chase', nameJa: 'チェイス', status: 'provisional', abilityHook: 'chase' })),
  rosterCharacter('godan', 'power', 1, Object.freeze({ id: 'godan.heavy_armor', nameJa: 'ヘビーアーマー', status: 'provisional', abilityHook: 'heavy_armor' })),
]);

export function validateCore3Roster(roster: readonly CoreRosterCharacter[] = CORE3_ROSTER): void {
  if (roster.length !== 3) throw new Error('core roster must contain three characters');
  if (new Set(roster.map((character) => character.id)).size !== 3) throw new Error('duplicate core character');
  for (const character of roster) {
    const catalog = CHARACTER_CATALOG_BY_ID[character.id];
    if (character.commandMoves.length !== 7) throw new Error(`${character.id}: seven command moves required`);
    if (character.recommendedCombos.length !== 5) throw new Error(`${character.id}: five recommended combos required`);
    for (let index = 0; index < 7; index += 1) {
      const rebuilt = character.commandMoves[index];
      const designed = catalog.moves[index];
      if (rebuilt.slot !== designed.slot || rebuilt.nameJa !== designed.nameJa) throw new Error(`${character.id}: catalog slot ${index + 1} mismatch`);
      if (rebuilt.sequence.join(',') !== designed.command.directions.join(',') || rebuilt.trigger !== designed.command.trigger) throw new Error(`${character.id}: catalog input ${index + 1} mismatch`);
      if (rebuilt.attribute !== designed.attribute || rebuilt.reach !== designed.reach || rebuilt.roleJa !== designed.roleJa) throw new Error(`${character.id}: catalog design ${index + 1} mismatch`);
      const expectedTier = designed.difficulty === 'standard' ? 'intermediate' : designed.difficulty;
      if (rebuilt.tier !== expectedTier) throw new Error(`${character.id}: catalog difficulty ${index + 1} mismatch`);
      if (index < CURRENT_SLOTS) {
        const audited = CURRENT_CONTRACT.bal.CMD.moves[character.id][index];
        if (rebuilt.status !== 'current_impl' || designed.implementationStatus !== 'current_runtime') throw new Error(`${character.id}: current slot ${index + 1} status mismatch`);
        if (rebuilt.nameJa !== audited.name || rebuilt.trigger !== audited.trigger || rebuilt.type !== audited.type) throw new Error(`${character.id}: current slot ${index + 1} mismatch`);
        if (rebuilt.sequence.join(',') !== audited.seq.join(',')) throw new Error(`${character.id}: current sequence ${index + 1} mismatch`);
        if (rebuilt.estimatedDamage !== (typeof audited.d === 'number' ? audited.d : null)) throw new Error(`${character.id}: current damage audit ${index + 1} mismatch`);
      } else {
        if (rebuilt.status !== 'design_confirmed' || designed.implementationStatus !== 'design_confirmed') throw new Error(`${character.id}: future slot ${index + 1} must remain design-confirmed only`);
        if (rebuilt.estimatedDamage !== null) throw new Error(`${character.id}: future slot ${index + 1} damage must remain unresolved`);
      }
    }
    if (new Set(character.commandMoves.map((move) => `${move.sequence.join(',')}+${move.trigger}`)).size !== 7) throw new Error(`${character.id}: duplicate command input`);
    for (let index = 0; index < character.recommendedCombos.length; index += 1) {
      const combo = character.recommendedCombos[index];
      const designed = catalog.combos[index];
      if (combo.category !== designed.category || combo.labelJa !== designed.labelJa) throw new Error(`${character.id}: combo category mismatch`);
      if (combo.status !== 'unverified_move_spec' || combo.moveIds.length !== 0 || combo.estimatedDamage !== null || combo.condition !== null) throw new Error(`${character.id}: combo must remain unverified`);
    }
    if (character.special.nameJa !== catalog.specials[0]?.nameJa) throw new Error(`${character.id}: special design mismatch`);
    if (character.personaId !== character.archetype || !CPU_PERSONAS[character.personaId]) throw new Error(`${character.id}: persona mismatch`);
    const gyuiin = abilityGyuiinEffect(character.special.abilityHook);
    if (gyuiin.rewardDamageBonus !== 0 || gyuiin.rewardUltBonus !== 0 || gyuiin.timingBonusF !== 0 || gyuiin.weightMul !== 1) throw new Error(`${character.id}: ability changes Gyuiin`);
    for (const poseId of REQUIRED_POSE_IDS) {
      const runtimePose = character.assets.poseMap[poseId];
      if (!CURRENT_RUNTIME_POSE_IDS.includes(runtimePose)) throw new Error(`${character.id}: unmapped runtime pose ${poseId}/${runtimePose}`);
    }
    for (const runtimePose of Object.values(character.assets.commandPoseMap)) if (!CURRENT_RUNTIME_POSE_IDS.includes(runtimePose)) throw new Error(`${character.id}: missing command pose ${runtimePose}`);
  }
}
