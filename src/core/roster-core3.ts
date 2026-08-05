import { abilityGyuiinEffect } from './ability-hooks.ts';
import { BAL, CURRENT_CHARACTERS, CURRENT_CONTRACT } from './constants.ts';
import { CPU_PERSONAS } from './cpu.ts';
import { REQUIRED_POSE_IDS } from './sprite-types.ts';
import type { PoseId } from './sprite-types.ts';
import type { CurrentCharacterId, Direction } from './types.ts';
import type {
  CharacterAssetMapping,
  CoreRosterCharacter,
  RecommendedComboData,
  RosterCommandMove,
} from './roster-types.ts';

const CURRENT_RUNTIME_POSE_IDS = Object.freeze([...(CURRENT_CONTRACT.sprites as { readonly poseIds: readonly string[] }).poseIds]);
const SPRITE_H = BAL.SPRITE_H as Readonly<Record<CurrentCharacterId, number>>;
const PORTRAIT_RATIO = BAL.PORTRAIT_RATIO as Readonly<Record<CurrentCharacterId, number>>;

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

function currentMoves(characterId: CurrentCharacterId): readonly RosterCommandMove[] {
  return Object.freeze(CURRENT_CONTRACT.bal.CMD.moves[characterId].map((move, index) => Object.freeze({
    id: `${characterId}.cmd${index + 1}`,
    slot: (index + 1) as 1 | 2 | 3,
    status: 'current_impl' as const,
    nameJa: move.name,
    sequence: Object.freeze([...move.seq]),
    trigger: move.trigger,
    type: move.type,
    level: move.lv === 'high' || move.lv === 'mid' || move.lv === 'low' ? move.lv : null,
    tier: 'beginner' as const,
    role: `current_slot_${index + 1}`,
    estimatedDamage: typeof move.d === 'number' ? move.d : 0,
    tags: Object.freeze(['existing_slot']),
  })));
}

function provisionalMove(
  characterId: CurrentCharacterId,
  slot: 4 | 5 | 6 | 7,
  nameJa: string,
  sequence: readonly Direction[],
  trigger: RosterCommandMove['trigger'],
  type: RosterCommandMove['type'],
  level: RosterCommandMove['level'],
  tier: RosterCommandMove['tier'],
  role: string,
  estimatedDamage: number,
  tags: readonly string[] = [],
): RosterCommandMove {
  return Object.freeze({
    id: `${characterId}.cmd${slot}`,
    slot,
    status: 'provisional',
    nameJa,
    sequence: Object.freeze([...sequence]),
    trigger,
    type,
    level,
    tier,
    role,
    estimatedDamage,
    tags: Object.freeze([...tags]),
  });
}

const EXTRA_MOVES: Readonly<Record<CurrentCharacterId, readonly RosterCommandMove[]>> = Object.freeze({
  moguzo: Object.freeze([
    provisionalMove('moguzo', 4, '踏み掌', ['right', 'left'], 'mid', 'atk', 'mid', 'beginner', 'close_reset', 80),
    provisionalMove('moguzo', 5, '伏せ返し', ['down', 'left', 'down'], 'mid', 'atk', 'mid', 'intermediate', 'crouch_branch', 75),
    provisionalMove('moguzo', 6, '岩走り', ['left', 'down', 'right'], 'low', 'atk', 'low', 'intermediate', 'range_low', 105),
    provisionalMove('moguzo', 7, '根性連掌', ['down', 'right', 'down', 'right'], 'high', 'atk', 'high', 'advanced', 'guts_payoff', 130, ['conditional', 'guts_relief']),
  ]),
  pisuke: Object.freeze([
    provisionalMove('pisuke', 4, '風切り', ['right', 'down', 'right'], 'mid', 'atk', 'mid', 'intermediate', 'chase_entry', 75, ['step_cancel']),
    provisionalMove('pisuke', 5, '尾返し', ['left', 'down', 'left'], 'high', 'atk', 'high', 'intermediate', 'throw_check', 90),
    provisionalMove('pisuke', 6, '潜り牙', ['down', 'right', 'down', 'right'], 'low', 'atk', 'low', 'advanced', 'low_route', 95),
    provisionalMove('pisuke', 7, '追走連牙', ['left', 'right', 'left', 'right'], 'mid', 'atk', 'mid', 'advanced', 'chase_payoff', 120, ['conditional', 'step_cancel']),
  ]),
  godan: Object.freeze([
    provisionalMove('godan', 4, '岩肩', ['right', 'left'], 'mid', 'atk', 'mid', 'beginner', 'armor_entry', 100, ['heavy_armor']),
    provisionalMove('godan', 5, '叩き落とし', ['right', 'down', 'right'], 'high', 'atk', 'high', 'intermediate', 'heavy_high', 125),
    provisionalMove('godan', 6, '踏み潰し', ['left', 'down', 'left'], 'low', 'atk', 'low', 'intermediate', 'heavy_low', 135),
    provisionalMove('godan', 7, '大岩返し', ['down', 'left', 'down', 'left'], 'low', 'atk', 'low', 'advanced', 'armor_payoff', 140, ['conditional', 'heavy_armor']),
  ]),
});

function combos(characterId: CurrentCharacterId): readonly RecommendedComboData[] {
  const common: RecommendedComboData[] = [
    Object.freeze({ id: `${characterId}.combo1`, labelJa: '基本三段', moveIds: Object.freeze(['normal.mid', 'normal.high', 'normal.low']), condition: 'normal', estimatedDamage: 280 }),
    Object.freeze({ id: `${characterId}.combo2`, labelJa: 'しゃがみ始動', moveIds: Object.freeze(['normal.crouch', 'normal.mid', 'normal.high']), condition: 'normal', estimatedDamage: 193 }),
  ];
  const unique: Record<CurrentCharacterId, readonly RecommendedComboData[]> = {
    moguzo: Object.freeze([
      Object.freeze({ id: 'moguzo.combo3', labelJa: '地走り連携', moveIds: Object.freeze(['normal.mid', 'moguzo.cmd1']), condition: 'normal', estimatedDamage: 165 }),
      Object.freeze({ id: 'moguzo.combo4', labelJa: '昇撃締め', moveIds: Object.freeze(['moguzo.cmd2', 'normal.high']), condition: 'normal', estimatedDamage: 220 }),
      Object.freeze({ id: 'moguzo.combo5', labelJa: '根性連掌ルート', moveIds: Object.freeze(['normal.mid', 'moguzo.cmd7', 'normal.high']), condition: 'conditional', estimatedDamage: 300 }),
    ]),
    pisuke: Object.freeze([
      Object.freeze({ id: 'pisuke.combo3', labelJa: '二連牙連携', moveIds: Object.freeze(['normal.mid', 'pisuke.cmd1']), condition: 'normal', estimatedDamage: 165 }),
      Object.freeze({ id: 'pisuke.combo4', labelJa: '滑り追撃', moveIds: Object.freeze(['pisuke.cmd2', 'down_followup']), condition: 'normal', estimatedDamage: 120 }),
      Object.freeze({ id: 'pisuke.combo5', labelJa: '追走連牙ルート', moveIds: Object.freeze(['pisuke.cmd7', 'normal.high', 'normal.low']), condition: 'conditional', estimatedDamage: 340 }),
    ]),
    godan: Object.freeze([
      Object.freeze({ id: 'godan.combo3', labelJa: '地割れ追撃', moveIds: Object.freeze(['godan.cmd1', 'down_followup']), condition: 'normal', estimatedDamage: 165 }),
      Object.freeze({ id: 'godan.combo4', labelJa: '山掴み締め', moveIds: Object.freeze(['normal.mid', 'godan.cmd2']), condition: 'normal', estimatedDamage: 180 }),
      Object.freeze({ id: 'godan.combo5', labelJa: '大岩返しルート', moveIds: Object.freeze(['godan.cmd7', 'normal.high']), condition: 'conditional', estimatedDamage: 240 }),
    ]),
  };
  return Object.freeze([...common, ...unique[characterId]]);
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
    commandMoves: Object.freeze([...currentMoves(id), ...EXTRA_MOVES[id]]),
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
      currentCommandCount: 3,
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
    if (character.commandMoves.length !== 7) throw new Error(`${character.id}: seven command moves required`);
    if (character.recommendedCombos.length !== 5) throw new Error(`${character.id}: five recommended combos required`);
    const current = CURRENT_CONTRACT.bal.CMD.moves[character.id];
    for (let index = 0; index < 3; index += 1) {
      const rebuilt = character.commandMoves[index];
      const audited = current[index];
      if (rebuilt.status !== 'current_impl' || rebuilt.nameJa !== audited.name || rebuilt.trigger !== audited.trigger || rebuilt.type !== audited.type) throw new Error(`${character.id}: current slot ${index + 1} mismatch`);
      if (rebuilt.sequence.join(',') !== audited.seq.join(',')) throw new Error(`${character.id}: current sequence ${index + 1} mismatch`);
    }
    if (!character.commandMoves.slice(3).every((move) => move.status === 'provisional')) throw new Error(`${character.id}: new slots must remain provisional`);
    if (new Set(character.commandMoves.map((move) => `${move.sequence.join(',')}+${move.trigger}`)).size !== 7) throw new Error(`${character.id}: duplicate command input`);
    for (const combo of character.recommendedCombos) {
      const cap = combo.condition === 'normal' ? 320 : 360;
      if (combo.estimatedDamage > cap) throw new Error(`${combo.id}: estimated damage exceeds target cap`);
    }
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
