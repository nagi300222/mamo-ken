import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  BAL,
  CURRENT_CHARACTERS,
  CURRENT_CHARACTER_IDS,
  CURRENT_CONTRACT,
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

const snapshot = JSON.parse(readFileSync(new URL('../reports/current_impl_constants.json', import.meta.url), 'utf8'));
const expectedCurrentContract = {
  bal: snapshot.bal,
  characters: snapshot.characters,
  characterIds: snapshot.characterIds,
  levels: snapshot.levels,
  choices: snapshot.choices,
  commandMoves: snapshot.commandMoves,
  inputTiming: snapshot.inputTiming,
  roar: snapshot.roar,
  sGauge: snapshot.sGauge,
  clash: snapshot.clash,
  down: snapshot.down,
  ult: snapshot.ult,
  net: snapshot.net,
  aiDifficulty: snapshot.aiDifficulty,
  sprites: snapshot.sprites,
};

assert.deepEqual(CURRENT_CONTRACT, expectedCurrentContract);
assert.deepEqual(BAL, snapshot.bal);
assert.deepEqual(CURRENT_CHARACTERS, snapshot.characters);
assert.deepEqual(CURRENT_CHARACTER_IDS, snapshot.characterIds);

assert.equal(STABLE_SERIALIZATION_VERSION, 'stable-json-v1');
assert.equal(stableStringify({ b: 1, a: 2 }), stableStringify({ a: 2, b: 1 }));
assert.equal(stableStringify({ aa: 1, b: 2, A: 3 }), '{"A":3,"aa":1,"b":2}');
assert.throws(() => stableStringify({ a: undefined }), /undefined/);
assert.throws(() => stableStringify({ a: NaN }), /non-finite/);
assert.throws(() => stableStringify({ a: Infinity }), /non-finite/);
assert.throws(() => stableStringify({ a: 1n }), /bigint/);
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

let a = createInitialBattleState(0xc0ffee, 0x51a1);
let b = createInitialBattleState(0xc0ffee, 0x51a1);
for (let frame = 1; frame <= 10_000; frame += 1) {
  const inputs = scriptedInputs(frame);
  a = stepDeterministic(a, inputs);
  b = stepDeterministic(b, inputs.map((input) => ({ ...input })));
  assert.equal(a.lastHash, b.lastHash, `hash mismatch at frame ${frame}`);
}
assert.equal(a.frame, 10_000);
assert.equal(a.lastHash, '7776b8f4');

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

console.log(`core spec tests passed; 10000F hash=${a.lastHash}; seedNegative=${changedSeed.lastHash}; inputNegative=${changedInput.lastHash}`);
