import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fnv1a32, stableStringify } from '../src/core/determinism.ts';
import {
  CURRENT_COMBO_PROFILE,
  CURRENT_CONTACT_FRAME_OFFSET,
  CURRENT_NORMAL_MOVE_RECORDS,
  CURRENT_NORMAL_MOVES,
  TARGET_CAPACITY_BY_STYLE,
  TARGET_HEIGHT_LIMITS,
  TARGET_HIT_SCALES,
  TARGET_REPEAT_DAMAGE_SCALES,
  TARGET_REPEAT_HITSTUN_SCALES,
  TARGET_REPEAT_ROAR_SCALES,
  TARGET_WEIGHT_BY_MOVE_CLASS,
  createTargetProvisionalComboProfile,
  currentContactFrame,
} from '../src/core/combat-moves.ts';
import { areSameMoveForClash, createComboState, evaluateComboRoute, resolveDownFollowup } from '../src/core/combo.ts';
import { assertCombatValid, validateCombatMoveSpec, validateComboRuleProfile } from '../src/core/combat-validation.ts';

const mid = CURRENT_NORMAL_MOVES['normal.mid'];
const high = CURRENT_NORMAL_MOVES['normal.high'];
const low = CURRENT_NORMAL_MOVES['normal.low'];
const crouch = CURRENT_NORMAL_MOVES['normal.crouch'];

for (const record of Object.values(CURRENT_NORMAL_MOVE_RECORDS)) assertCombatValid(validateCombatMoveSpec(record.spec));
assertCombatValid(validateComboRuleProfile(CURRENT_COMBO_PROFILE));
for (const style of Object.keys(TARGET_CAPACITY_BY_STYLE)) assertCombatValid(validateComboRuleProfile(createTargetProvisionalComboProfile(style)));
assert.equal(CURRENT_CONTACT_FRAME_OFFSET, 1);
assert.deepEqual(
  [crouch, mid, high, low].map((move) => [move.telegraphF, move.startupF, move.activeF, move.recoveryF, move.damage, move.weight]),
  [[6, 10, 3, 14, 50, 0.5], [8, 14, 3, 18, 70, 1], [13, 22, 3, 24, 100, 2], [18, 30, 4, 30, 150, 3]],
);
assert.deepEqual([currentContactFrame(crouch), currentContactFrame(mid), currentContactFrame(high), currentContactFrame(low)], [11, 15, 23, 31]);
assert.equal(CURRENT_NORMAL_MOVE_RECORDS.crouch.fieldStatus.level, 'audit_required');
assert.equal(mid.starterScale, 1);
assert.equal(crouch.comboWeight, 1);
assert.deepEqual(mid.cancelOnHit, ['normal.high', 'normal.low']);
assert.deepEqual(high.cancelOnHit, ['normal.low']);
assert.deepEqual(low.cancelOnHit, []);

const basic = evaluateComboRoute(CURRENT_COMBO_PROFILE, [mid, high, low]);
assert.deepEqual(basic.steps.map((step) => step.accepted), [true, true, true]);
assert.deepEqual(basic.steps.map((step) => step.damageScale), [1, 0.9, 0.8]);
assert.deepEqual(basic.steps.map((step) => step.damage), [70, 90, 120]);
assert.equal(basic.state.totalDamage, 280);
assert.equal(basic.state.totalRoarGain, 23);
assert.equal(basic.state.ended, true);
assert.equal(basic.state.endReason, 'knockback_end');

const crouchRoute = evaluateComboRoute(CURRENT_COMBO_PROFILE, [crouch, mid, high, low]);
assert.deepEqual(crouchRoute.steps.map((step) => step.accepted), [true, true, true, false]);
assert.equal(crouchRoute.steps[3].reason, 'max_hits');
assert.equal(crouchRoute.state.totalDamage, 193);
assert.equal(crouchRoute.state.hits, 3);

const wrongOrder = evaluateComboRoute(CURRENT_COMBO_PROFILE, [high, mid]);
assert.equal(wrongOrder.steps[1].accepted, false);
assert.equal(wrongOrder.steps[1].reason, 'cancel_not_allowed');
const repeated = evaluateComboRoute(CURRENT_COMBO_PROFILE, [mid, mid]);
assert.equal(repeated.steps[1].reason, 'cancel_not_allowed');

const counter = evaluateComboRoute(CURRENT_COMBO_PROFILE, [mid, high, low], { counterStarter: true });
assert.deepEqual(counter.steps.map((step) => step.damage), [88, 100, 135]);
assert.equal(counter.state.totalDamage, 323);

const down1 = resolveDownFollowup(CURRENT_COMBO_PROFILE, createComboState(), low);
assert.equal(down1.accepted, true);
assert.equal(down1.damage, 75);
assert.equal(down1.state.downFollowupsUsed, 1);
const down2 = resolveDownFollowup(CURRENT_COMBO_PROFILE, down1.state, low);
assert.equal(down2.accepted, false);
assert.equal(down2.reason, 'down_followup_unavailable');

assert.deepEqual(TARGET_CAPACITY_BY_STYLE, {
  standard: 3.5, rush: 4.5, power: 2.5, defense: 2.5, tricky: 4, grappler: 3.5, counter: 3.5, charge: 3.5, charge_max: 4.5, dark_moguzo_pvp: 5.5,
});
assert.deepEqual(TARGET_WEIGHT_BY_MOVE_CLASS, {
  crouch_or_light_normal: 0.5, standard_normal_or_light_command: 1, heavy_normal_or_standard_command: 1.5, heavy_command: 2, max_release: 2.5, followup_throw: 1.5,
});
assert.deepEqual(TARGET_HIT_SCALES, [1, 0.88, 0.76, 0.66, 0.58, 0.52]);
assert.deepEqual(TARGET_REPEAT_DAMAGE_SCALES, [1, 0.85, 0.7, 0.55]);
assert.deepEqual(TARGET_REPEAT_HITSTUN_SCALES, [1, 0.9, 0.75, 0.6]);
assert.deepEqual(TARGET_REPEAT_ROAR_SCALES, [1, 0.7, 0.45, 0.2]);
assert.deepEqual(TARGET_HEIGHT_LIMITS.rush, { mid: 4, high: 3, low: 1 });
assert.equal(createTargetProvisionalComboProfile('standard').capacity, 3.5);
assert.equal(createTargetProvisionalComboProfile('charge_max').heightLimits.mid, 3);
assert.equal(createTargetProvisionalComboProfile('dark_moguzo_pvp').heightLimits, null);
assert.equal(CURRENT_COMBO_PROFILE.cancelWindowF, 14);
assert.equal(CURRENT_COMBO_PROFILE.status, 'current_impl');
assert.equal(createTargetProvisionalComboProfile('standard').status, 'provisional');
assert.equal(areSameMoveForClash(mid, mid), true);
assert.equal(areSameMoveForClash(mid, high), false);

const invalidMove = { ...mid, startupF: 0, cancelOnHit: ['normal.high', 'normal.high'] };
const invalidValidation = validateCombatMoveSpec(invalidMove);
assert.equal(invalidValidation.ok, false);
if (!invalidValidation.ok) {
  assert.ok(invalidValidation.errors.some((error) => error.includes('startupF')));
  assert.ok(invalidValidation.errors.some((error) => error.includes('duplicates')));
}

function customMove(id, overrides = {}) {
  return {
    ...mid,
    id,
    nameJa: id,
    damage: 100,
    weight: 1,
    comboWeight: 0.5,
    repeatGroup: id,
    repeatLimit: 6,
    cancelOnHit: [],
    hitKnockbackClass: 0,
    roarGainOnHit: 10,
    ...overrides,
  };
}
const repeatMoves = [0, 1, 2, 3].map((index) => customMove(`repeat.${index}`, {
  repeatGroup: 'repeat.family',
  cancelOnHit: index < 3 ? [`repeat.${index + 1}`] : [],
}));
const repeatRoute = evaluateComboRoute(createTargetProvisionalComboProfile('rush'), repeatMoves);
assert.deepEqual(repeatRoute.steps.map((step) => step.accepted), [true, true, true, true]);
assert.deepEqual(repeatRoute.steps.map((step) => step.hitstunScale), [1, 0.9, 0.75, 0.6]);
assert.deepEqual(repeatRoute.steps.map((step) => step.roarGain), [10, 7, 5, 2]);

const midFamily = Array.from({ length: 5 }, (_, index) => customMove(`mid.${index}`, {
  repeatGroup: `mid.${index}`,
  cancelOnHit: index < 4 ? [`mid.${index + 1}`] : [],
}));
const heightRoute = evaluateComboRoute(createTargetProvisionalComboProfile('rush'), midFamily);
assert.deepEqual(heightRoute.steps.map((step) => step.accepted), [true, true, true, true, false]);
assert.equal(heightRoute.steps[4].reason, 'height_limit');

const capacityMoves = [
  customMove('capacity.1', { comboWeight: 1.5, cancelOnHit: ['capacity.2'] }),
  customMove('capacity.2', { comboWeight: 1.5, cancelOnHit: ['capacity.3'] }),
  customMove('capacity.3', { comboWeight: 1 }),
];
const capacityRoute = evaluateComboRoute(createTargetProvisionalComboProfile('standard'), capacityMoves);
assert.deepEqual(capacityRoute.steps.map((step) => step.accepted), [true, true, false]);
assert.equal(capacityRoute.steps[2].reason, 'capacity');

const clamped = customMove('clamped', { starterScale: 0.1, comboProration: 0.1 });
const clampedRoute = evaluateComboRoute(createTargetProvisionalComboProfile('rush'), [clamped]);
assert.equal(clampedRoute.steps[0].damageScale, 0.4);
assert.equal(clampedRoute.steps[0].damage, 40);
const targetCounter = evaluateComboRoute(createTargetProvisionalComboProfile('rush'), [customMove('counter.start')], { counterStarter: true });
assert.equal(targetCounter.steps[0].damageScale, 1.2);
assert.equal(targetCounter.steps[0].damage, 120);

function routeForFrame(frame, changed = false) {
  if (changed && frame === 731) return [crouch, high, low];
  switch (frame % 4) {
    case 0: return [mid, high, low];
    case 1: return [crouch, mid, high];
    case 2: return [mid, low];
    default: return [high, low];
  }
}
function replay(changed = false) {
  let summary = { frame: 0, totalDamage: 0, totalRoarGain: 0, accepted: 0, rejected: 0, lastReason: 'none' };
  const hashes = [];
  for (let frame = 1; frame <= 10_000; frame += 1) {
    const route = evaluateComboRoute(CURRENT_COMBO_PROFILE, routeForFrame(frame, changed), { counterStarter: frame % 29 === 0 });
    summary = {
      frame,
      totalDamage: summary.totalDamage + route.state.totalDamage,
      totalRoarGain: summary.totalRoarGain + route.state.totalRoarGain,
      accepted: summary.accepted + route.steps.filter((step) => step.accepted).length,
      rejected: summary.rejected + route.steps.filter((step) => !step.accepted).length,
      lastReason: route.state.endReason,
    };
    hashes.push(fnv1a32(stableStringify(summary)));
  }
  return { summary, hashes, hash: hashes.at(-1) };
}
const replayA = replay(false);
const replayB = replay(false);
assert.deepEqual(replayA, replayB);
const changedReplay = replay(true);
const divergence = replayA.hashes.findIndex((hash, index) => hash !== changedReplay.hashes[index]) + 1;
assert.equal(divergence, 731);
assert.equal(replayA.hash, '7fab5c7a');
assert.equal(changedReplay.hash, 'b9bd6d05');

for (const path of ['../src/core/combat-types.ts', '../src/core/combat-moves.ts', '../src/core/combo.ts', '../src/core/combat-validation.ts']) {
  const source = readFileSync(new URL(path, import.meta.url), 'utf8');
  for (const forbidden of ['Math.random', 'Date(', 'localeCompare', 'document.', 'window.', 'canvas', 'AudioContext', 'setTimeout', 'setInterval']) {
    assert.equal(source.includes(forbidden), false, `${path} contains forbidden ${forbidden}`);
  }
}

console.log(`combat move tests passed; 10000F hash=${replayA.hash}; changed=${changedReplay.hash}; divergence=${divergence}`);
