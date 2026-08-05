import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { chooseGyuiin } from '../src/core/gauge.ts';
import {
  CPU_DIFFICULTY_CONFIGS,
  CPU_PERSONAS,
  DARK_MOGUZO_BOSS_OVERRIDES,
  PUBLIC_FIGHTER_OBSERVATION_KEYS,
  allPersonaPairings,
  createCpuObservation,
  createCpuState,
  decideCpuAction,
  queueCpuObservation,
  simulatePairingBatch,
} from '../src/core/cpu.ts';

const raw = {
  characterId: 'moguzo', phase: 'idle', hp: 1000, guard: 100, s: 100, ult: 0, focus: 0, phaseFrame: 0,
  lastPublicAction: null,
  hiddenInput: 'high', commandBuffer: ['right', 'down'], futureAction: 'grab', rawPointerX: 99,
};
const observation = createCpuObservation(100, raw, { ...raw, characterId: 'pisuke' });
assert.deepEqual(Object.keys(observation.self), PUBLIC_FIGHTER_OBSERVATION_KEYS);
assert.equal('hiddenInput' in observation.self, false);
assert.equal('commandBuffer' in observation.self, false);
assert.equal('futureAction' in observation.self, false);
assert.equal('rawPointerX' in observation.self, false);

assert.deepEqual(CPU_DIFFICULTY_CONFIGS.EASY, { reactionDelayF: 18, actionCadenceF: 18, mikiriRateCap: 0.04, dodgeRateCap: 0.05, commandRateCap: 0.05 });
assert.deepEqual(CPU_DIFFICULTY_CONFIGS.NORMAL, { reactionDelayF: 10, actionCadenceF: 12, mikiriRateCap: 0.12, dodgeRateCap: 0.10, commandRateCap: 0.25 });
assert.deepEqual(CPU_DIFFICULTY_CONFIGS.HARD, { reactionDelayF: 5, actionCadenceF: 8, mikiriRateCap: 0.22, dodgeRateCap: 0.15, commandRateCap: 0.60 });

function decisionSequence(seed, difficulty = 'NORMAL', bossOverride) {
  let state = createCpuState(seed);
  const actions = [];
  for (let frame = 0; frame < 2_000; frame += 20) {
    const obs = createCpuObservation(frame, raw, { ...raw, characterId: 'godan', hp: 1000 - (frame % 400) });
    state = queueCpuObservation(state, obs, difficulty, bossOverride);
    const result = decideCpuAction(state, frame + 20, CPU_PERSONAS.standard, difficulty, bossOverride);
    actions.push(result.action);
    state = result.state;
  }
  return { actions, state };
}
const a = decisionSequence(0x12345678);
const b = decisionSequence(0x12345678);
const changed = decisionSequence(0x12345679);
assert.deepEqual(a.actions, b.actions);
assert.notDeepEqual(a.actions, changed.actions);
assert.deepEqual(a.state.log, b.state.log);
assert.ok(a.state.log.every((entry) => entry.observationFrame <= entry.frame));

const boss = DARK_MOGUZO_BOSS_OVERRIDES[1];
const bossRun = decisionSequence(0x12345678, 'HARD', boss);
assert.ok(bossRun.state.log.length > 0);
assert.equal(boss.oneTimeRuleIds.includes('phase2_roar_once'), true);
assert.equal(JSON.stringify(boss).includes('hiddenInput'), false);
assert.equal(JSON.stringify(boss).includes('commandBuffer'), false);

const pairings = allPersonaPairings();
assert.equal(pairings.length, 28);
const batchHashes = [];
for (const [left, right] of pairings) {
  const batch = simulatePairingBatch(left, right, 0xc0ffee, 1_000);
  const repeat = simulatePairingBatch(left, right, 0xc0ffee, 1_000);
  const swapped = simulatePairingBatch(right, left, 0xc0ffee, 1_000);
  assert.deepEqual(batch, repeat);
  assert.equal(batch.leftWins, swapped.rightWins, `${left}/${right} left-right swap`);
  assert.equal(batch.rightWins, swapped.leftWins, `${left}/${right} right-left swap`);
  assert.equal(batch.draws, swapped.draws, `${left}/${right} draw swap`);
  assert.equal(batch.leftWins + batch.rightWins + batch.draws, 1_000);
  batchHashes.push(`${left}:${right}:${batch.hash}`);
}
assert.equal(new Set(batchHashes).size, 28);

function gyuiinSequence(seed) {
  const result = [];
  let current = seed;
  for (let i = 0; i < 1_000; i += 1) {
    const next = chooseGyuiin(current);
    result.push(next.kind);
    current = next.nextSeed;
  }
  return result;
}
const canonicalGyuiin = gyuiinSequence(0x51a1);
for (const persona of Object.values(CPU_PERSONAS)) {
  assert.deepEqual(gyuiinSequence(0x51a1), canonicalGyuiin, `Gyuiin changed by ${persona.id}`);
}

const source = readFileSync(new URL('../src/core/cpu.ts', import.meta.url), 'utf8');
for (const forbidden of ['Math.random', 'Date.now', 'localeCompare', 'document.', 'window.', 'setTimeout', 'setInterval']) {
  assert.equal(source.includes(forbidden), false, `forbidden API: ${forbidden}`);
}
for (const hidden of ['hiddenInput', 'commandBuffer', 'futureAction', 'rawPointer']) {
  assert.equal(source.includes(hidden), false, `hidden observation access: ${hidden}`);
}

console.log(`CPU tests passed; pairings=${pairings.length}; bouts=${pairings.length * 1000}; logs=${a.state.log.length}`);
