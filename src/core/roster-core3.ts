import { abilityGyuiinEffect } from './ability-hooks.ts';
import type { AbilityHookId } from './ability-types.ts';
import { CHARACTER_CATALOG_BY_ID } from './character-catalog.ts';
import type { CharacterCatalogEntry, CharacterCatalogMove } from './character-catalog.ts';
import { BAL, CURRENT_CHARACTERS, CURRENT_CONTRACT } from './constants.ts';
import { CPU_PERSONAS } from './cpu.ts';
import { REQUIRED_POSE_IDS } from './sprite-types.ts';
import type { PoseId } from './sprite-types.ts';
import type { CurrentCharacterId, CurrentLevel, Direction } from './types.ts';
import type {
  CharacterAssetMapping,
  CoreRosterCharacter,
  RecommendedComboData,
  RosterCommandMove,
} from './roster-types.ts';

const CURRENT_RUNTIME_POSE_IDS = Object.freeze([...(CURRENT_CONTRACT.sprites as { readonly poseIds: readonly string[] }).poseIds]);
const SPRITE_H = BAL.SPRITE_H as Readonly<Record<CurrentCharacterId, number>>;
const PORTRAIT_RATIO = BAL.PORTRAIT_RATIO as Readonly<Record<CurrentCharacterId, number>>;
const CURRENT_IDS = ['moguzo', 'pisuke', 'godan'] as const satisfies readonly CurrentCharacterId[];

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

type AuditedCommandMove = Readonly<{
  seq: readonly Direction[];
  trigger: CurrentLevel | 'grab';
  type: 'atk' | 'grab' | 'stance';
  lv?: CurrentLevel;
  name: string;
  d?: number;
  counterDmg?: number;
}>;

const ABILITY_HOOK_BY_CHARACTER = Object.freeze({
  moguzo: 'guts',
  pisuke: 'chase',
  godan: 'heavy_armor',
} as const satisfies Readonly<Record<CurrentCharacterId, AbilityHookId>>);

function catalogCharacter(characterId: CurrentCharacterId): CharacterCatalogEntry {
  return CHARACTER_CATALOG_BY_ID[characterId];
}

function auditedMoves(characterId: CurrentCharacterId): readonly AuditedCommandMove[] {
  return CURRENT_CONTRACT.bal.CMD.moves[characterId] as unknown as readonly AuditedCommandMove[];
}

function levelFor(move: CharacterCatalogMove): CurrentLevel | null {
  if (move.attribute === 'HIGH') return 'high';
  if (move.attribute === 'MID') return 'mid';
  if (move.attribute === 'LOW') return 'low';
  return null;
}

function typeFor(move: CharacterCatalogMove): 'atk' | 'grab' {
  return move.attribute === 'GRAB' ? 'grab' : 'atk';
}

function currentMove(
  characterId: CurrentCharacterId,
  catalogMove: CharacterCatalogMove,
  audited: AuditedCommandMove,
): RosterCommandMove {
  const damage = typeof audited.d === 'number' ? audited.d : typeof audited.counterDmg === 'number' ? audited.counterDmg : null;
  return Object.freeze({
    id: `${characterId}.cmd${catalogMove.slot}`,
    slot: catalogMove.slot as 1 | 2 | 3,
    status: 'current_impl',
    nameJa: catalogMove.nameJa,
    sequence: Object.freeze([...catalogMove.command.directions]),
    trigger: catalogMove.command.trigger,
    type: audited.type,
    level: audited.lv ?? levelFor(catalogMove),
    attribute: catalogMove.attribute,
    reach: catalogMove.reach,
    tier: catalogMove.difficulty,
    roleJa: catalogMove.roleJa,
    conditionsJa: Object.freeze([...catalogMove.conditionsJa]),
    balanceConstraints: Object.freeze([...catalogMove.balanceConstraints]),
    frameDataStatus: 'current_audited',
    estimatedDamage: damage,
    tags: Object.freeze(['current_runtime', `reach_${catalogMove.reach}`]),
  });
}

function designMove(characterId: CurrentCharacterId, catalogMove: CharacterCatalogMove): RosterCommandMove {
  return Object.freeze({
    id: `${characterId}.cmd${catalogMove.slot}`,
    slot: catalogMove.slot as 4 | 5 | 6 | 7,
    status: 'design_confirmed',
    nameJa: catalogMove.nameJa,
    sequence: Object.freeze([...catalogMove.command.directions]),
    trigger: catalogMove.command.trigger,
    type: typeFor(catalogMove),
    level: levelFor(catalogMove),
    attribute: catalogMove.attribute,
    reach: catalogMove.reach,
    tier: catalogMove.difficulty,
    roleJa: catalogMove.roleJa,
    conditionsJa: Object.freeze([...catalogMove.conditionsJa]),
    balanceConstraints: Object.freeze([...catalogMove.balanceConstraints]),
    frameDataStatus: 'bal_undecided',
    estimatedDamage: null,
    tags: Object.freeze([
      'design_confirmed',
      `reach_${catalogMove.reach}`,
      ...(catalogMove.conditionsJa.length > 0 ? ['conditional'] : []),
    ]),
  });
}

function commandMoves(characterId: CurrentCharacterId): readonly RosterCommandMove[] {
  const catalog = catalogCharacter(characterId);
  const audited = auditedMoves(characterId);
  return Object.freeze(catalog.moves.map((move, index) => {
    if (index < 3) return currentMove(characterId, move, audited[index]);
    return designMove(characterId, move);
  }));
}

function combos(characterId: CurrentCharacterId): readonly RecommendedComboData[] {
  return Object.freeze(catalogCharacter(characterId).combos.map((combo, index) => Object.freeze({
    id: `${characterId}.combo${index + 1}`,
    category: combo.category,
    labelJa: combo.labelJa,
    status: 'unverified_move_spec',
    moveIds: Object.freeze([]),
    condition: 'undecided',
    estimatedDamage: null,
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
): CoreRosterCharacter {
  const current = CURRENT_CHARACTERS.find((character) => character.id === id);
  const catalog = catalogCharacter(id);
  if (!current) throw new Error(`missing current character: ${id}`);
  if (catalog.difficulty !== 1 && catalog.difficulty !== 2) throw new Error(`unexpected current command difficulty: ${id}`);
  const special = catalog.specials[0];
  if (!special || special.status !== 'confirmed') throw new Error(`missing confirmed current special: ${id}`);
  return Object.freeze({
    id,
    displayName: current.name,
    archetype,
    commandDifficulty: catalog.difficulty,
    commandMoves: commandMoves(id),
    special: Object.freeze({
      id: `${id}.${special.id}`,
      nameJa: special.nameJa,
      status: 'confirmed',
      abilityHook: ABILITY_HOOK_BY_CHARACTER[id],
    }),
    recommendedCombos: combos(id),
    personaId: archetype,
    assets: assets(id),
    balanceAudit: Object.freeze({
      maxHp: BAL.HP,
      guardMax: current.gMax,
      damageMul: current.dMul,
      startupOffsetF: current.sOfs,
      sGainMul: current.sMul,
      currentCommandCount: 3,
      plannedCommandCount: 7,
    }),
  });
}

export const CORE3_ROSTER: readonly CoreRosterCharacter[] = Object.freeze([
  rosterCharacter('moguzo', 'standard'),
  rosterCharacter('pisuke', 'rush'),
  rosterCharacter('godan', 'power'),
]);

export function validateCore3Roster(roster: readonly CoreRosterCharacter[] = CORE3_ROSTER): void {
  if (roster.length !== 3) throw new Error('core roster must contain three characters');
  if (new Set(roster.map((character) => character.id)).size !== 3) throw new Error('duplicate core character');
  if (roster.map((character) => character.id).join(',') !== CURRENT_IDS.join(',')) throw new Error('core roster order mismatch');

  for (const character of roster) {
    const catalog = catalogCharacter(character.id);
    if (character.commandMoves.length !== 7) throw new Error(`${character.id}: seven command moves required`);
    if (character.recommendedCombos.length !== 5) throw new Error(`${character.id}: five recommended combos required`);
    const current = auditedMoves(character.id);

    for (let index = 0; index < 7; index += 1) {
      const move = character.commandMoves[index];
      const designed = catalog.moves[index];
      if (move.slot !== index + 1) throw new Error(`${character.id}: move slot order mismatch`);
      if (move.nameJa !== designed.nameJa) throw new Error(`${character.id}: catalog move name mismatch at slot ${index + 1}`);
      if (move.sequence.join(',') !== designed.command.directions.join(',')) throw new Error(`${character.id}: catalog command mismatch at slot ${index + 1}`);
      if (move.trigger !== designed.command.trigger) throw new Error(`${character.id}: catalog trigger mismatch at slot ${index + 1}`);
      if (move.attribute !== designed.attribute || move.reach !== designed.reach) throw new Error(`${character.id}: catalog classification mismatch at slot ${index + 1}`);
      if (move.roleJa !== designed.roleJa || move.tier !== designed.difficulty) throw new Error(`${character.id}: catalog role mismatch at slot ${index + 1}`);
      if (move.conditionsJa.join(',') !== designed.conditionsJa.join(',')) throw new Error(`${character.id}: catalog conditions mismatch at slot ${index + 1}`);
      if (move.balanceConstraints.join(',') !== designed.balanceConstraints.join(',')) throw new Error(`${character.id}: catalog constraints mismatch at slot ${index + 1}`);

      if (index < 3) {
        const audited = current[index];
        if (move.status !== 'current_impl' || move.frameDataStatus !== 'current_audited') throw new Error(`${character.id}: current slot ${index + 1} status mismatch`);
        if (move.nameJa !== audited.name || move.trigger !== audited.trigger || move.type !== audited.type) throw new Error(`${character.id}: current slot ${index + 1} mismatch`);
        if (move.sequence.join(',') !== audited.seq.join(',')) throw new Error(`${character.id}: current sequence ${index + 1} mismatch`);
        if (move.estimatedDamage === null) throw new Error(`${character.id}: current slot ${index + 1} damage audit missing`);
      } else {
        if (move.status !== 'design_confirmed' || move.frameDataStatus !== 'bal_undecided') throw new Error(`${character.id}: new slot ${index + 1} must remain design-confirmed/BAL-undecided`);
        if (move.estimatedDamage !== null) throw new Error(`${character.id}: new slot ${index + 1} must not invent damage`);
      }
      if (move.reach === 3 && move.balanceConstraints.length < 2) throw new Error(`${character.id}: Reach 3 slot ${index + 1} needs constraints`);
    }

    if (new Set(character.commandMoves.map((move) => `${move.sequence.join(',')}+${move.trigger}`)).size !== 7) throw new Error(`${character.id}: duplicate command input`);
    if (character.special.status !== 'confirmed' || character.special.nameJa !== catalog.specials[0]?.nameJa) throw new Error(`${character.id}: confirmed special mismatch`);
    if (!character.recommendedCombos.every((combo) => combo.status === 'unverified_move_spec' && combo.moveIds.length === 0 && combo.estimatedDamage === null && combo.condition === 'undecided')) {
      throw new Error(`${character.id}: unmeasured combo route must remain empty`);
    }
    if (character.personaId !== character.archetype || !CPU_PERSONAS[character.personaId]) throw new Error(`${character.id}: persona mismatch`);
    const gyuiin = abilityGyuiinEffect(character.special.abilityHook);
    if (gyuiin.rewardDamageBonus !== 0 || gyuiin.rewardUltBonus !== 0 || gyuiin.timingBonusF !== 0 || gyuiin.weightMul !== 1) throw new Error(`${character.id}: ability changes Gyuiin`);
    if (character.balanceAudit.currentCommandCount !== 3 || character.balanceAudit.plannedCommandCount !== 7) throw new Error(`${character.id}: command-count audit mismatch`);
    for (const poseId of REQUIRED_POSE_IDS) {
      const runtimePose = character.assets.poseMap[poseId];
      if (!CURRENT_RUNTIME_POSE_IDS.includes(runtimePose)) throw new Error(`${character.id}: unmapped runtime pose ${poseId}/${runtimePose}`);
    }
    for (const runtimePose of Object.values(character.assets.commandPoseMap)) if (!CURRENT_RUNTIME_POSE_IDS.includes(runtimePose)) throw new Error(`${character.id}: missing command pose ${runtimePose}`);
  }
}
