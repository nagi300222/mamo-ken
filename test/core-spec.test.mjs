import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  BAL,
  CURRENT_ARCHETYPE_IDS,
  CURRENT_CHARACTERS,
  CURRENT_CHARACTER_IDS,
  CURRENT_CONTRACT,
  CURRENT_PHASE_REPORT,
  PLANNED_ARCHETYPE_IDS,
} from '../src/core/constants.ts';
import {
  STABLE_SERIALIZATION_VERSION,
  createInitialBattleState,
  fnv1a32,
  mulberry32,
  stableStringify,
  stateHash,
  stepDeterministic,
  toHashableBattleState,
} from '../src/core/determinism.ts';
import {
  assertValid,
  validateCharacterCombatSpec,
  validateCommandMoveSpec,
  validateMoveSpec,
} from '../src/core/validation.ts';

const snapshot = JSON.parse(readFileSync(new URL('../reports/current_impl_constants.json', import.meta.url), 'utf8'));
const phaseSnapshot = JSON.parse(readFileSync(new URL('../reports/current_impl_phases.json', import.meta.url), 'utf8'));

assert.deepEqual(CURRENT_CONTRACT, snapshot);
assert.deepEqual(BAL, snapshot.bal);
assert.deepEqual(CURRENT_CHARACTERS, snapshot.characters);
assert.deepEqual(CURRENT_CHARACTER_IDS, snapshot.characterIds);
assert.deepEqual(CURRENT_PHASE_REPORT.fighterPhases.map((phase) => phase.value), phaseSnapshot.fighterPhases.map((phase) => phase.value));
assert.deepEqual(CURRENT_PHASE_REPORT.battleFlows.map((flow) => flow.value), phaseSnapshot.battleFlows.map((flow) => flow.value));
assert.ok(CURRENT_PHASE_REPORT.fighterPhases.some((phase) => phase.value === 'clash'));
assert.deepEqual(CURRENT_ARCHETYPE_IDS, ['standard', 'rush', 'power']);
assert.deepEqual(PLANNED_ARCHETYPE_IDS, ['defense', 'tricky', 'grappler', 'counter', 'charge']);

for (const [name, move] of Object.entries(BAL.ATK)) assertValid(validateMoveSpec(name, move));
for (const [characterId, moves] of Object.entries(BAL.CMD.moves)) {
  for (const move of moves) assertValid(validateCommandMoveSpec(characterId, move));
}
for (const character of CURRENT_CHARACTERS) assertValid(validateCharacterCombatSpec(character));

assert.equal(STABLE_SERIALIZATION_VERSION, 'stable-json-v1');
assert.equal(stableStringify({ b: 1, a: 2 }), stableStringify({ a: 2, b: 1 }));
assert.equal(stableStringify({ aa: 1, b: 2, A: 3 }), '{"A":3,"aa":1,"b":2}');
assert.throws(() => stableStringify({ a: undefined }), /undefined/);
assert.throws(() => stableStringify({ a: NaN }), /non-finite/);
assert.throws(() => stableStringify({ a: Infinity }), /non-finite/);
assert.throws(() => stableStringify({ a: 1n }), /bigint/);
assert.throws(() => stableStringify(new Date('2026-08-05T00:00:00Z')), /non-plain object/);
assert.throws(() => stableStringify(new Map([['a', 1]])), /non-plain object/);
assert.throws(() => stableStringify(new Set([1])), /non-plain object/);
class NonPlain { value = 1; }
assert.throws(() => stableStringify(new NonPlain()), /non-plain object/);
const sparse = [];
sparse[1] = 'hole';
assert.throws(() => stableStringify(sparse), /sparse array/);
assert.throws(() => stableStringify({ [Symbol('hidden')]: 1 }), /symbol keys/);
const cyclic = {};
cyclic.self = cyclic;
assert.throws(() => stableStringify(cyclic), /cyclic/);

assert.deepEqual(mulberry32(0), [0.26642920868471265, 1831565813]);
assert.deepEqual(mulberry32(0x12345678), [0.10615200875326991, 2136985709]);
assert.equal(fnv1a32(''), '811c9dc5');
assert.equal(fnv1a32('mamoken'), '8a362c97');

const base = createInitialBattleState(1234);
const sameLastHashChanged = { ...base, lastHash: 'different-last-hash' };
assert.equal(stateHash(toHashableBattleState(base)), stateHash(toHashableBattleState(sameLastHashChanged)));
assert.notEqual(stateHash(toHashableBattleState(base)), stateHash({ ...toHashableBattleState(base), seed: 999 }));

function scriptedInputs(frame) {
  const events = [];
  if (frame % 37 === 0) events.push({ frame, player: 0, kind: 'attack', level: frame % 74 === 0 ? 'high' : 'mid' });
  if (frame % 53 === 0) events.push({ frame, player: 1, kind: 'attack', level: frame % 106 === 0 ? 'low' : 'mid' });
  if (frame % 211 === 0) events.push({ frame, player: 0, kind: 'guard' });
  return events;
}

function swapInput(input) {
  return { ...input, player: input.player === 0 ? 1 : 0 };
}

function swapState(state) {
  const hashable = toHashableBattleState(state);
  const swapped = { ...hashable, fighters: [hashable.fighters[1], hashable.fighters[0]] };
  return { ...swapped, lastHash: stateHash(swapped) };
}

function normalizeForSwap(state) {
  const hashable = toHashableBattleState(state);
  return {
    ...hashable,
    fighters: [...hashable.fighters].sort((a, b) => a.characterId.localeCompare(b.characterId)),
  };
}

let a = createInitialBattleState(0xc0ffee, 0x51a1);
let b = createInitialBattleState(0xc0ffee, 0x51a1);
for (let frame = 1; frame <= 10_000; frame += 1) {
  const inputs = scriptedInputs(frame);
  a = stepDeterministic(a, inputs);
  b = stepDeterministic(b, inputs.map((input) => ({ ...input })));
  assert.equal(a.lastHash, b.lastHash, `hash mismatch at frame ${frame}`);
}
assert.equal(a.frame, 10_000);
assert.equal(a.lastHash, '7a28953f');

let normal = createInitialBattleState(0xc0ffee, 0x51a1);
let swapped = swapState(createInitialBattleState(0xc0ffee, 0x51a1));
for (let frame = 1; frame <= 10_000; frame += 1) {
  const inputs = scriptedInputs(frame);
  normal = stepDeterministic(normal, inputs);
  swapped = stepDeterministic(swapped, inputs.map(swapInput));
  assert.equal(stateHash(normalizeForSwap(normal)), stateHash(normalizeForSwap(swapped)), `swap mismatch at frame ${frame}`);
}
const swapHash = stateHash(normalizeForSwap(normal));
assert.equal(swapHash, '7a28953f');

let baselineForNegative = createInitialBattleState(0xc0ffee, 0x51a1);
let changedSeed = createInitialBattleState(0xc0ffef, 0x51a1);
let changedInput = createInitialBattleState(0xc0ffee, 0x51a1);
let seedDivergenceFrame = 0;
let inputDivergenceFrame = 0;
for (let frame = 1; frame <= 10_000; frame += 1) {
  const baselineInputs = scriptedInputs(frame);
  baselineForNegative = stepDeterministic(baselineForNegative, baselineInputs);
  changedSeed = stepDeterministic(changedSeed, baselineInputs);
  const inputVariant = frame === 4096 ? [{ frame, player: 0, kind: 'attack', level: 'low' }] : baselineInputs;
  changedInput = stepDeterministic(changedInput, inputVariant);
  if (!seedDivergenceFrame && changedSeed.lastHash !== baselineForNegative.lastHash) seedDivergenceFrame = frame;
  if (!inputDivergenceFrame && changedInput.lastHash !== baselineForNegative.lastHash) inputDivergenceFrame = frame;
}
assert.notEqual(changedSeed.lastHash, baselineForNegative.lastHash);
assert.notEqual(changedInput.lastHash, baselineForNegative.lastHash);
assert.equal(seedDivergenceFrame, 1);
assert.equal(inputDivergenceFrame, 4096);

console.log(`core spec tests passed; 10000F hash=${a.lastHash}; swapHash=${swapHash}; seedNegative=${changedSeed.lastHash}; inputNegative=${changedInput.lastHash}`);
