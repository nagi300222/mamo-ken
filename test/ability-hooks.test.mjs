import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createGaugeState } from '../src/core/gauge.ts';
import {
  ABILITY_HOOK_IDS,
  abilityGyuiinEffect,
  canChaseResume,
  chaseStepCancelLimit,
  consumeGutsCommandRelief,
  consumeIronWall,
  consumeJustFollowup,
  createFeintState,
  createGutsState,
  createHeavyArmorState,
  createIronWallState,
  gainOvercharge,
  grantIronWall,
  grantJustFollowup,
  gutsLowHpModifiers,
  recordGutsMove,
  releaseOvercharge,
  resolveFeint,
  resolveHeavyArmor,
  resolvePressure,
} from '../src/core/ability-hooks.ts';

assert.deepEqual(ABILITY_HOOK_IDS, ['guts', 'chase', 'heavy_armor', 'iron_wall', 'feint', 'pressure', 'just', 'overcharge']);
for (const hook of ABILITY_HOOK_IDS) {
  assert.deepEqual(abilityGyuiinEffect(hook), { weightMul: 1, timingBonusF: 0, rewardDamageBonus: 0, rewardUltBonus: 0 });
}

let guts = createGutsState();
guts = recordGutsMove(guts, 'mid');
guts = recordGutsMove(guts, 'mid');
guts = recordGutsMove(guts, 'high');
assert.equal(guts.commandReliefReady, false);
guts = recordGutsMove(guts, 'cmd.1');
assert.equal(guts.commandReliefReady, true);
const relief = consumeGutsCommandRelief(guts);
assert.equal(relief.starterScaleBonus, 0.05);
assert.equal(relief.state.commandReliefReady, false);
assert.deepEqual(gutsLowHpModifiers(300, 1000), { damageDealtMul: 1.03, damageTakenMul: 0.97 });
assert.deepEqual(gutsLowHpModifiers(301, 1000), { damageDealtMul: 1, damageTakenMul: 1 });

assert.equal(chaseStepCancelLimit(), 2);
assert.equal(canChaseResume('hit', 0, ['step_cancel']), true);
assert.equal(canChaseResume('whiff', 0, ['step_cancel']), false);
assert.equal(canChaseResume('hit', 1, ['step_cancel']), false);

for (const incoming of ['grab', 'mikiri', 'special_counter']) {
  assert.equal(resolveHeavyArmor(createHeavyArmorState(true), { phaseFrame: 6, moveTags: ['heavy_armor'], incoming }).absorbed, false);
}
assert.equal(resolveHeavyArmor(createHeavyArmorState(true), { phaseFrame: 3, moveTags: ['heavy_armor'], incoming: 'strike' }).absorbed, false);
const armored = resolveHeavyArmor(createHeavyArmorState(true), { phaseFrame: 4, moveTags: ['heavy_armor'], incoming: 'strike' });
assert.equal(armored.absorbed, true);
assert.equal(armored.starterScale, 0.85);
assert.equal(armored.state.hitsRemaining, 0);

let wall = createIronWallState();
assert.equal(grantIronWall(wall, 'proactive_attack', 10).charges, 0);
assert.equal(grantIronWall(wall, 'throw', 10).charges, 0);
wall = grantIronWall(wall, 'guard', 10);
assert.equal(wall.expiresFrame, 610);
const wallStartup = consumeIronWall(wall, 610, 'mid', 'startup');
assert.deepEqual(wallStartup.bonus, { startupReductionF: 2, guardDamageMul: 1 });
assert.equal(wallStartup.state.charges, 0);
const wallGuard = consumeIronWall(grantIronWall(createIronWallState(), 'just_step', 20), 21, 'high', 'guard_damage');
assert.deepEqual(wallGuard.bonus, { startupReductionF: 0, guardDamageMul: 1.15 });
assert.equal(consumeIronWall(grantIronWall(createIronWallState(), 'guard', 0), 1, 'grab', 'startup').bonus.startupReductionF, 0);

let feint = createFeintState();
assert.equal(resolveFeint(feint, { inTelegraph: false, currentFrame: 100 }).accepted, false);
const feintResult = resolveFeint(feint, { inTelegraph: true, currentFrame: 100, requestedRecoveryF: 2 });
assert.equal(feintResult.accepted, true);
assert.equal(feintResult.recoveryF, 8);
assert.equal(feintResult.nextActionFrame, 108);
feint = feintResult.state;
assert.equal(resolveFeint(feint, { inTelegraph: true, currentFrame: 108 }).accepted, false);

assert.deepEqual(resolvePressure({ sourceContact: 'hit', moveTags: ['pressure_throw_branch'] }), {
  canBranchToThrow: true,
  throwWhiffF: 30,
  followupStarterScale: 0.6,
  guaranteesThrow: false,
});
assert.equal(resolvePressure({ sourceContact: 'block', moveTags: ['pressure_throw_branch'], requestedWhiffF: 100 }).canBranchToThrow, false);
assert.equal(resolvePressure({ sourceContact: 'whiff', moveTags: [], requestedWhiffF: 0 }).throwWhiffF, 28);

assert.equal(grantJustFollowup('idle_wait', 0).followupReady, false);
const just = grantJustFollowup('correct_dodge', 100);
assert.equal(consumeJustFollowup(just, 122).accepted, true);
assert.equal(consumeJustFollowup(just, 123).accepted, false);

let charge = createGaugeState('charge');
charge = gainOvercharge(charge, 'attack_hit');
charge = gainOvercharge(charge, 'guard_success');
charge = gainOvercharge(charge, 'just_step');
assert.equal(charge.charge, 3);
assert.equal(gainOvercharge(charge, 'time').charge, 3);
assert.equal(gainOvercharge(charge, 'gyuiin').charge, 3);
const released = releaseOvercharge(charge);
assert.equal(released.accepted, true);
assert.equal(released.gauges.charge, 0);

const source = readFileSync(new URL('../src/core/ability-hooks.ts', import.meta.url), 'utf8');
for (const forbidden of ['Math.random', 'Date.now', 'localeCompare', 'document.', 'window.', 'setTimeout', 'setInterval']) {
  assert.equal(source.includes(forbidden), false, `forbidden API: ${forbidden}`);
}
console.log('ability hook tests passed; eight hooks isolated; Gyuiin effect zero');
