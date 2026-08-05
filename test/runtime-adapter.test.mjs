import assert from 'node:assert/strict';
import { CURRENT_PHASE_REPORT } from '../src/core/constants.ts';
import { stateHash } from '../src/core/determinism.ts';
import {
  RUNTIME_ADAPTER_CONTRACT,
  RUNTIME_ADAPTER_VERSION,
  RuntimeAdapterError,
  adaptLegacyRuntimeBattle,
} from '../src/core/runtime-adapter.ts';

function makeBattle() {
  return {
    f: 731,
    flow: 'fight',
    timer: 2869,
    p: [
      {
        c: { id: 'moguzo' },
        phase: 'attack',
        hp: 880,
        guard: 93.4,
        s: 42,
        ult: 1,
        focus: 18.5,
        combo: 2,
        pf: 17,
      },
      {
        c: { id: 'godan' },
        phase: 'blockstun',
        hp: 905,
        guard: 76.22,
        s: 31,
        ult: 0,
        focus: 14.25,
        combo: 0,
        pf: 6,
      },
    ],
  };
}

function hashable(snapshot) {
  const { lastHash: _lastHash, ...value } = snapshot;
  return value;
}

function expectAdapterError(run, path) {
  assert.throws(run, (error) => {
    assert.ok(error instanceof RuntimeAdapterError);
    assert.equal(error.issues.length, 1);
    assert.equal(error.issues[0].path, path);
    return true;
  });
}

assert.equal(RUNTIME_ADAPTER_VERSION, 'legacy-runtime-adapter-v1');
assert.equal(RUNTIME_ADAPTER_CONTRACT.source, 'prototype/mamoken_prototype_v01.html');
assert.equal(RUNTIME_ADAPTER_CONTRACT.direction, 'legacy-runtime-to-core-snapshot');
assert.equal(RUNTIME_ADAPTER_CONTRACT.writeBack, false);
assert.equal(RUNTIME_ADAPTER_CONTRACT.provisionalActivation, false);
assert.deepEqual(RUNTIME_ADAPTER_CONTRACT.battleFields, ['f', 'flow', 'timer', 'p']);
assert.deepEqual(RUNTIME_ADAPTER_CONTRACT.fighterFields, ['c.id', 'phase', 'hp', 'guard', 's', 'ult', 'focus', 'combo', 'pf']);
assert.deepEqual(RUNTIME_ADAPTER_CONTRACT.externalContext, ['rngState', 'aiRngState']);

const source = makeBattle();
const context = { rngState: 0x12345678, aiRngState: 0x51a1 };
const snapshot = adaptLegacyRuntimeBattle(source, context);
assert.deepEqual(snapshot, {
  version: 'core-spec-v1',
  frame: 731,
  flow: 'fight',
  timer: 2869,
  seed: 0x12345678,
  aiSeed: 0x51a1,
  fighters: [
    {
      characterId: 'moguzo',
      phase: 'attack',
      hp: 880,
      guard: 93.4,
      s: 42,
      ult: 1,
      focus: 18.5,
      combo: 2,
      phaseFrame: 17,
    },
    {
      characterId: 'godan',
      phase: 'blockstun',
      hp: 905,
      guard: 76.22,
      s: 31,
      ult: 0,
      focus: 14.25,
      combo: 0,
      phaseFrame: 6,
    },
  ],
  lastHash: '2f2f6296',
});
assert.equal(snapshot.lastHash, stateHash(hashable(snapshot)));
assert.equal(adaptLegacyRuntimeBattle(makeBattle(), context).lastHash, snapshot.lastHash);
const changedBattle = makeBattle();
changedBattle.p[1].hp -= 1;
assert.notEqual(adaptLegacyRuntimeBattle(changedBattle, context).lastHash, snapshot.lastHash);

source.p[0].hp = 1;
source.p[0].c.id = 'pisuke';
assert.equal(snapshot.fighters[0].hp, 880);
assert.equal(snapshot.fighters[0].characterId, 'moguzo');

for (const { value: phase } of CURRENT_PHASE_REPORT.fighterPhases) {
  const battle = makeBattle();
  battle.p[0].phase = phase;
  assert.equal(adaptLegacyRuntimeBattle(battle, context).fighters[0].phase, phase);
}
for (const { value: flow } of CURRENT_PHASE_REPORT.battleFlows) {
  const battle = makeBattle();
  battle.flow = flow;
  assert.equal(adaptLegacyRuntimeBattle(battle, context).flow, flow);
}

{
  const battle = makeBattle();
  battle.p[0].phase = 'mikiri';
  expectAdapterError(() => adaptLegacyRuntimeBattle(battle, context), 'battle.p[0].phase');
}
{
  const battle = makeBattle();
  battle.flow = 'gyuiinIntro';
  expectAdapterError(() => adaptLegacyRuntimeBattle(battle, context), 'battle.flow');
}
{
  const battle = makeBattle();
  battle.p[0].c.id = 'dark_moguzo';
  expectAdapterError(() => adaptLegacyRuntimeBattle(battle, context), 'battle.p[0].c.id');
}
{
  const battle = makeBattle();
  battle.p = [battle.p[0]];
  expectAdapterError(() => adaptLegacyRuntimeBattle(battle, context), 'battle.p');
}
{
  const battle = makeBattle();
  battle.f = -1;
  expectAdapterError(() => adaptLegacyRuntimeBattle(battle, context), 'battle.f');
}
{
  const battle = makeBattle();
  battle.p[1].ult = 0.5;
  expectAdapterError(() => adaptLegacyRuntimeBattle(battle, context), 'battle.p[1].ult');
}
{
  const battle = makeBattle();
  delete battle.p[0].focus;
  expectAdapterError(() => adaptLegacyRuntimeBattle(battle, context), 'battle.p[0].focus');
}
expectAdapterError(() => adaptLegacyRuntimeBattle(makeBattle(), { rngState: 0, aiRngState: 0x1_0000_0000 }), 'context.aiRngState');
expectAdapterError(() => adaptLegacyRuntimeBattle(null, context), 'battle');

console.log(`runtime adapter tests passed; hash=${snapshot.lastHash}; phases=${CURRENT_PHASE_REPORT.fighterPhases.length}; flows=${CURRENT_PHASE_REPORT.battleFlows.length}`);
