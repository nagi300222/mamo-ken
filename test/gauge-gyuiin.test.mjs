import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fnv1a32, stableStringify } from '../src/core/determinism.ts';
import {
  GAUGE_LIMITS,
  GYUIIN_RULE,
  addUltStock,
  applyGyuiinReward,
  chooseGyuiin,
  consumeMaxCharge,
  createGaugeState,
  gainCharge,
  gainFocus,
  gainS,
  resolvePostContactFlow,
  resolveRoarContact,
} from '../src/core/gauge.ts';

assert.deepEqual(GYUIIN_RULE, {
  damage: 120,
  ultStock: 1,
  sGauge: 0,
  focus: 0,
  charge: 0,
  streakBonus: 0,
  guaranteedFollowupStunF: 0,
  weights: { jyanken: 0.5, renda: 0.25, hayauchi: 0.25 },
});

const characterIds = ['moguzo', 'pisuke', 'godan', 'himalaya', 'bobak', 'grappler_tbd', 'counter_tbd', 'charge_tbd', 'dark_moguzo'];
for (const characterId of characterIds) {
  const winner = { characterId, archetype: characterId === 'charge_tbd' ? 'charge' : 'standard', hp: 1000, gauges: createGaugeState(characterId === 'charge_tbd' ? 'charge' : 'standard') };
  const loser = { characterId: 'godan', archetype: 'power', hp: 1000, gauges: createGaugeState('power') };
  const result = applyGyuiinReward(winner, loser);
  assert.equal(result.loser.hp, 880);
  assert.equal(result.winner.gauges.ult, 1);
  assert.equal(result.winner.gauges.s, 0);
  assert.equal(result.winner.gauges.focus, 0);
  assert.equal(result.winner.gauges.charge, winner.gauges.charge);
}

let state = createGaugeState('standard');
state = gainS(state, 'attack_hit', { comboIndex: 0 });
assert.equal(state.s, 12);
state = gainS(state, 'attack_hit', { comboIndex: 1 });
assert.equal(state.s, 19);
state = gainS(state, 'guard_success');
assert.equal(state.s, 25);
state = gainFocus(state, 'guard');
assert.equal(state.focus, 8);
state = gainFocus(state, 'mikiri');
assert.equal(state.focus, 38);
state = gainFocus(state, 'damage', 1000);
assert.equal(state.focus, 100);

let charge = createGaugeState('charge');
charge = gainCharge(charge, 'charge', 'attack_hit');
charge = gainCharge(charge, 'charge', 'guard_success');
charge = gainCharge(charge, 'charge', 'just_step');
assert.equal(charge.charge, 3);
assert.equal(gainCharge(charge, 'charge', 'time').charge, 3);
assert.equal(gainCharge(charge, 'charge', 'gyuiin').charge, 3);
assert.equal(gainCharge(createGaugeState('standard'), 'standard', 'attack_hit').charge, null);
const spent = consumeMaxCharge(charge, 'charge');
assert.equal(spent.accepted, true);
assert.equal(spent.gauges.charge, 0);
assert.equal(consumeMaxCharge(createGaugeState('charge'), 'charge').accepted, false);

const fullS = { ...createGaugeState('standard'), s: GAUGE_LIMITS.s };
const clean = resolveRoarContact(fullS, { hit: true, blocked: false, armorAbsorbed: false });
assert.equal(clean.cleanHit, true);
assert.equal(clean.gauges.ult, 1);
assert.equal(clean.gauges.s, 0);
for (const contact of [
  { hit: true, blocked: true, armorAbsorbed: false },
  { hit: true, blocked: false, armorAbsorbed: true },
  { hit: false, blocked: false, armorAbsorbed: false },
]) {
  const result = resolveRoarContact(fullS, contact);
  assert.equal(result.cleanHit, false);
  assert.equal(result.gauges.ult, 0);
}

assert.equal(resolvePostContactFlow({ ko: true, ultStock: 3, gyuiinTriggered: true }), 'ko');
assert.equal(resolvePostContactFlow({ ko: false, ultStock: 3, gyuiinTriggered: true }), 'ultActivation');
assert.equal(resolvePostContactFlow({ ko: false, ultStock: 2, gyuiinTriggered: true }), 'gyuiinIntro');
assert.equal(resolvePostContactFlow({ ko: false, ultStock: 2, gyuiinTriggered: false }), 'fight');
assert.equal(addUltStock({ ...createGaugeState('standard'), ult: 2 }, 5).ult, 3);

function sequence(seed, count) {
  const kinds = [];
  let current = seed;
  for (let i = 0; i < count; i += 1) {
    const next = chooseGyuiin(current);
    kinds.push(next.kind);
    current = next.nextSeed;
  }
  return kinds;
}
const seqA = sequence(0x51a1, 10_000);
const seqB = sequence(0x51a1, 10_000);
const seqChanged = sequence(0x51a2, 10_000);
const hash = fnv1a32(stableStringify(seqA));
assert.equal(hash, fnv1a32(stableStringify(seqB)));
assert.notEqual(hash, fnv1a32(stableStringify(seqChanged)));
assert.ok(seqA.includes('jyanken'));
assert.ok(seqA.includes('renda'));
assert.ok(seqA.includes('hayauchi'));

const source = readFileSync(new URL('../src/core/gauge.ts', import.meta.url), 'utf8');
for (const forbidden of ['Math.random', 'Date.now', 'localeCompare', 'document.', 'window.', 'setTimeout', 'setInterval']) {
  assert.equal(source.includes(forbidden), false, `forbidden API: ${forbidden}`);
}

console.log(`gauge/Gyuiin tests passed; 10000 draws hash=${hash}`);
