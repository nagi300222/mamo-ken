import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { abilityGyuiinEffect } from '../src/core/ability-hooks.ts';
import { CURRENT_CONTRACT } from '../src/core/constants.ts';
import { fnv1a32, stableStringify } from '../src/core/determinism.ts';
import { REQUIRED_POSE_IDS } from '../src/core/sprite-types.ts';
import { CANONICAL_TO_CURRENT_POSE, CORE3_ROSTER, validateCore3Roster } from '../src/core/roster-core3.ts';

validateCore3Roster();
assert.deepEqual(CORE3_ROSTER.map((character) => character.id), ['moguzo', 'pisuke', 'godan']);
assert.deepEqual(CORE3_ROSTER.map((character) => character.archetype), ['standard', 'rush', 'power']);
assert.deepEqual(CORE3_ROSTER.map((character) => character.commandDifficulty), [1, 2, 1]);

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

for (const character of CORE3_ROSTER) {
  assert.equal(character.commandMoves.length, 7);
  assert.deepEqual(character.commandMoves.map((move) => move.slot), [1, 2, 3, 4, 5, 6, 7]);
  assert.ok(character.commandMoves.slice(0, 3).every((move) => move.status === 'current_impl'));
  assert.ok(character.commandMoves.slice(3).every((move) => move.status === 'provisional'));
  const audited = CURRENT_CONTRACT.bal.CMD.moves[character.id];
  for (let index = 0; index < 3; index += 1) {
    assert.equal(character.commandMoves[index].nameJa, audited[index].name);
    assert.deepEqual(character.commandMoves[index].sequence, audited[index].seq);
    assert.equal(character.commandMoves[index].trigger, audited[index].trigger);
    assert.equal(character.commandMoves[index].type, audited[index].type);
  }
  const tierCounts = { beginner: 0, intermediate: 0, advanced: 0 };
  for (const move of character.commandMoves) tierCounts[move.tier] += 1;
  assert.deepEqual(tierCounts, expectedTierCounts[character.id]);
  assert.deepEqual([character.special.nameJa, character.special.abilityHook], expectedSpecials[character.id]);
  assert.equal(character.special.status, 'provisional');
  assert.equal(character.recommendedCombos.length, 5);
  assert.equal(new Set(character.recommendedCombos.map((combo) => combo.id)).size, 5);
  for (const combo of character.recommendedCombos) {
    assert.ok(combo.moveIds.length >= 2);
    assert.ok(combo.estimatedDamage <= (combo.condition === 'normal' ? 320 : 360));
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
const changed = CORE3_ROSTER.map((character) => character.id === 'moguzo' ? { ...character, commandMoves: character.commandMoves.map((move) => move.slot === 7 ? { ...move, estimatedDamage: move.estimatedDamage + 1 } : move) } : character);
assert.notEqual(hash, fnv1a32(stableStringify(changed)));

assert.throws(() => validateCore3Roster(CORE3_ROSTER.slice(0, 2)), /three/);
const badCount = CORE3_ROSTER.map((character) => character.id === 'moguzo' ? { ...character, commandMoves: character.commandMoves.slice(0, 6) } : character);
assert.throws(() => validateCore3Roster(badCount), /seven/);
const badCurrent = CORE3_ROSTER.map((character) => character.id === 'pisuke' ? { ...character, commandMoves: character.commandMoves.map((move) => move.slot === 1 ? { ...move, nameJa: '改変' } : move) } : character);
assert.throws(() => validateCore3Roster(badCurrent), /current slot/);
const badCombo = CORE3_ROSTER.map((character) => character.id === 'godan' ? { ...character, recommendedCombos: character.recommendedCombos.map((combo, index) => index === 0 ? { ...combo, estimatedDamage: 321 } : combo) } : character);
assert.throws(() => validateCore3Roster(badCombo), /damage exceeds/);

const source = readFileSync(new URL('../src/core/roster-core3.ts', import.meta.url), 'utf8');
for (const forbidden of ['Math.random', 'Date.now', 'localeCompare', 'document.', 'window.', 'setTimeout', 'setInterval']) {
  assert.equal(source.includes(forbidden), false, `forbidden API: ${forbidden}`);
}
console.log(`core3 roster tests passed; characters=3; commands=21; combos=15; hash=${hash}`);
