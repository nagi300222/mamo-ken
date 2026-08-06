import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { abilityGyuiinEffect } from '../src/core/ability-hooks.ts';
import { CHARACTER_CATALOG_BY_ID } from '../src/core/character-catalog.ts';
import { CURRENT_CONTRACT } from '../src/core/constants.ts';
import { fnv1a32, stableStringify } from '../src/core/determinism.ts';
import { REQUIRED_POSE_IDS } from '../src/core/sprite-types.ts';
import { CANONICAL_TO_CURRENT_POSE, CORE3_ROSTER, validateCore3Roster } from '../src/core/roster-core3.ts';

validateCore3Roster();
assert.deepEqual(CORE3_ROSTER.map((character) => character.id), ['moguzo', 'pisuke', 'godan']);
assert.deepEqual(CORE3_ROSTER.map((character) => character.archetype), ['standard', 'rush', 'power']);
assert.deepEqual(CORE3_ROSTER.map((character) => character.commandDifficulty), [1, 2, 1]);

const expectedNames = {
  moguzo: ['地走り', '昇撃', '引き寄せ投げ', '砂払い', '山越え拳', '胴押し', '土煙突き'],
  pisuke: ['二連牙', 'スライディング', '宙返り蹴', 'かすみ連打', '風切り爪', 'すり抜け足', 'つむじ返し'],
  godan: ['地割れ', '山掴み', '巌の構え', '岩砕き', '天蓋落とし', '根こそぎ', '大山押し'],
};
const retiredProvisionalNames = ['踏み掌', '伏せ返し', '岩走り', '根性連掌', '風切り', '尾返し', '潜り牙', '追走連牙', '岩肩', '叩き落とし', '踏み潰し', '大岩返し'];
const expectedTierCounts = {
  moguzo: { beginner: 4, intermediate: 2, advanced: 1 },
  pisuke: { beginner: 3, intermediate: 2, advanced: 2 },
  godan: { beginner: 4, intermediate: 2, advanced: 1 },
};
const expectedSpecials = {
  moguzo: ['根性', 'guts'],
  pisuke: ['チェイス', 'chase'],
  godan: ['ヘビーアーマー', 'heavy_armor'],
};
const expectedComboCategories = ['beginner', 'basic', 'practical', 'advanced', 'max'];

for (const character of CORE3_ROSTER) {
  const catalog = CHARACTER_CATALOG_BY_ID[character.id];
  assert.equal(character.commandMoves.length, 7);
  assert.deepEqual(character.commandMoves.map((move) => move.slot), [1, 2, 3, 4, 5, 6, 7]);
  assert.deepEqual(character.commandMoves.map((move) => move.nameJa), expectedNames[character.id]);
  assert.ok(character.commandMoves.slice(0, 3).every((move) => move.status === 'current_impl'));
  assert.ok(character.commandMoves.slice(3).every((move) => move.status === 'design_confirmed'));
  assert.ok(character.commandMoves.slice(3).every((move) => move.estimatedDamage === null));

  const audited = CURRENT_CONTRACT.bal.CMD.moves[character.id];
  for (let index = 0; index < 7; index += 1) {
    const move = character.commandMoves[index];
    const designed = catalog.moves[index];
    assert.equal(move.nameJa, designed.nameJa);
    assert.deepEqual(move.sequence, designed.command.directions);
    assert.equal(move.trigger, designed.command.trigger);
    assert.equal(move.attribute, designed.attribute);
    assert.equal(move.reach, designed.reach);
    assert.equal(move.roleJa, designed.roleJa);
    assert.deepEqual(move.conditionsJa, designed.conditionsJa);
    assert.deepEqual(move.balanceConstraints, designed.balanceConstraints);
    if (index < 3) {
      assert.equal(move.nameJa, audited[index].name);
      assert.deepEqual(move.sequence, audited[index].seq);
      assert.equal(move.trigger, audited[index].trigger);
      assert.equal(move.type, audited[index].type);
      assert.equal(move.estimatedDamage, typeof audited[index].d === 'number' ? audited[index].d : null);
    }
  }

  const tierCounts = { beginner: 0, intermediate: 0, advanced: 0 };
  for (const move of character.commandMoves) tierCounts[move.tier] += 1;
  assert.deepEqual(tierCounts, expectedTierCounts[character.id]);
  assert.deepEqual([character.special.nameJa, character.special.abilityHook], expectedSpecials[character.id]);
  assert.equal(character.special.status, 'provisional');

  assert.equal(character.recommendedCombos.length, 5);
  assert.deepEqual(character.recommendedCombos.map((combo) => combo.category), expectedComboCategories);
  assert.equal(new Set(character.recommendedCombos.map((combo) => combo.id)).size, 5);
  for (let index = 0; index < character.recommendedCombos.length; index += 1) {
    const combo = character.recommendedCombos[index];
    const designed = catalog.combos[index];
    assert.equal(combo.labelJa, designed.labelJa);
    assert.equal(combo.status, 'unverified_move_spec');
    assert.deepEqual(combo.moveIds, []);
    assert.equal(combo.condition, null);
    assert.equal(combo.estimatedDamage, null);
    assert.deepEqual(combo.notesJa, designed.notesJa);
  }

  assert.equal(character.personaId, character.archetype);
  assert.equal(character.balanceAudit.maxHp, 1000);
  assert.equal(character.balanceAudit.currentCommandCount, 3);
  assert.ok(character.balanceAudit.guardMax > 0);
  assert.ok(character.balanceAudit.damageMul > 0);
  assert.ok(character.balanceAudit.sGainMul > 0);
  assert.deepEqual(abilityGyuiinEffect(character.special.abilityHook), { weightMul: 1, timingBonusF: 0, rewardDamageBonus: 0, rewardUltBonus: 0 });
  assert.equal(Object.keys(character.assets.poseMap).length, 24);
  assert.deepEqual(Object.keys(character.assets.poseMap), [...REQUIRED_POSE_IDS]);
  assert.deepEqual(character.assets.commandPoseMap, { 1: 'cmd1', 2: 'cmd2', 3: 'cmd3' });
}

for (const retired of retiredProvisionalNames) {
  assert.equal(CORE3_ROSTER.some((character) => character.commandMoves.some((move) => move.nameJa === retired)), false, `retired provisional move remains: ${retired}`);
}

assert.deepEqual(CANONICAL_TO_CURRENT_POSE, {
  idle: 'idle', guard: 'guard', flinch: 'hurt', victory: 'win',
  high_telegraph: 'tele_high', mid_telegraph: 'tele_mid', low_telegraph: 'tele_low', mid_attack: 'atk_mid',
  high_attack: 'atk_high', low_attack: 'atk_low', mikiri: 'mikiri', roar_inhale: 'roar_charge',
  roar_release: 'roar', grab: 'grab_reach', grab_lift: 'grab_lift', grabbed: 'grabbed',
  down: 'down', getup: 'getup', ko: 'ko', ult_charge: 'ult_charge',
  crouch: 'crouch', sway: 'sway', lunge: 'lunge', crouch_atk: 'crouch_atk',
});

const hash = fnv1a32(stableStringify(CORE3_ROSTER));
assert.equal(hash, fnv1a32(stableStringify(CORE3_ROSTER.map((character) => ({ ...character })))));
const changed = CORE3_ROSTER.map((character) => character.id === 'moguzo' ? { ...character, commandMoves: character.commandMoves.map((move) => move.slot === 7 ? { ...move, reach: 2 } : move) } : character);
assert.notEqual(hash, fnv1a32(stableStringify(changed)));

assert.throws(() => validateCore3Roster(CORE3_ROSTER.slice(0, 2)), /three/);
const badCount = CORE3_ROSTER.map((character) => character.id === 'moguzo' ? { ...character, commandMoves: character.commandMoves.slice(0, 6) } : character);
assert.throws(() => validateCore3Roster(badCount), /seven/);
const badCurrent = CORE3_ROSTER.map((character) => character.id === 'pisuke' ? { ...character, commandMoves: character.commandMoves.map((move) => move.slot === 1 ? { ...move, nameJa: '改変' } : move) } : character);
assert.throws(() => validateCore3Roster(badCurrent), /catalog slot/);
const guessedDamage = CORE3_ROSTER.map((character) => character.id === 'godan' ? { ...character, commandMoves: character.commandMoves.map((move) => move.slot === 7 ? { ...move, estimatedDamage: 140 } : move) } : character);
assert.throws(() => validateCore3Roster(guessedDamage), /damage must remain unresolved/);
const inventedCombo = CORE3_ROSTER.map((character) => character.id === 'moguzo' ? { ...character, recommendedCombos: character.recommendedCombos.map((combo, index) => index === 0 ? { ...combo, moveIds: ['normal.mid', 'moguzo.cmd1'] } : combo) } : character);
assert.throws(() => validateCore3Roster(inventedCombo), /combo must remain unverified/);

const source = readFileSync(new URL('../src/core/roster-core3.ts', import.meta.url), 'utf8');
for (const forbidden of ['Math.random', 'Date.now', 'localeCompare', 'document.', 'window.', 'setTimeout', 'setInterval']) {
  assert.equal(source.includes(forbidden), false, `forbidden API: ${forbidden}`);
}
for (const retired of retiredProvisionalNames) assert.equal(source.includes(retired), false, `retired provisional source text remains: ${retired}`);
console.log(`core3 roster tests passed; characters=3; catalogParity=21; runtime=9; designOnly=12; combos=15-unverified; hash=${hash}`);
