import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { hashBattleStateV2, validateBattleStateV2 } from '../src/core/v2-validation/battle-state-v2-validation.ts';
import { LEGACY_ADAPTER_V2_CONTRACT, LEGACY_ADAPTER_V2_VERSION, LegacyAdapterV2Error, adaptLegacyBattleToV2, hashLegacyAdaptedBattleV2 } from '../src/core/legacy-adapter-v2.ts';

function makeFighter(overrides = {}) {
  return {
    c: { id: 'moguzo' },
    phase: 'idle',
    atkLv: null,
    dodgeType: null,
    hp: 880,
    guard: 93,
    s: 42,
    ult: 1,
    focus: 18,
    combo: 2,
    pf: 0,
    clinchF: 0,
    cmdArmorUsed: false,
    landedHit: false,
    cmdMove: null,
    ...overrides,
  };
}

function makeBattle() {
  return {
    f: 731,
    round: 2,
    wins: [1, 0],
    timer: 2869,
    flow: 'fight',
    hitstop: 0,
    clash: null,
    p: [
      makeFighter({ hp: 880, guard: 93, s: 42, ult: 1, focus: 18, combo: 3, pf: 0 }),
      makeFighter({ c: { id: 'godan' }, hp: 905, guard: 76, s: 31, ult: 0, focus: 14, combo: 0, pf: 0 }),
    ],
  };
}

function makeContext() {
  return {
    rngState: 0x12345678,
    aiRngState: 0x51a1,
    fighterSeeds: {
      0: { maxHp: 1000, maxGuard: 100, maxSGauge: 100, maxFocusGauge: 100, maxUltimateStock: 3, abilityId: 'moguzo:none' },
      1: { maxHp: 1000, maxGuard: 100, maxSGauge: 100, maxFocusGauge: 100, maxUltimateStock: 3, abilityId: 'godan:none' },
    },
  };
}

function expectReject(run, pathPrefix) {
  assert.throws(run, (error) => {
    assert.ok(error instanceof LegacyAdapterV2Error, `expected LegacyAdapterV2Error, got ${error}`);
    assert.ok(error.issues.length >= 1, 'expected at least one issue');
    if (pathPrefix) assert.ok(error.issues.some((issue) => issue.path.startsWith(pathPrefix)), `expected an issue path starting with ${pathPrefix}, got ${JSON.stringify(error.issues.map((i) => i.path))}`);
    return true;
  });
}

// --- contract shape ---
assert.equal(LEGACY_ADAPTER_V2_VERSION, 'legacy-adapter-v2-g02');
assert.equal(LEGACY_ADAPTER_V2_CONTRACT.source, 'prototype/mamoken_prototype_v01.html');
assert.equal(LEGACY_ADAPTER_V2_CONTRACT.writeBack, false);
assert.equal(LEGACY_ADAPTER_V2_CONTRACT.liveRuntimeAuthority, false);

// --- representative fixture: adapts to a valid, independently re-validated BattleStateV2 ---
const battle = makeBattle();
const context = makeContext();
const state = adaptLegacyBattleToV2(battle, context);
const revalidation = validateBattleStateV2(state);
assert.equal(revalidation.ok, true, `expected valid state, got errors: ${revalidation.errors.join('; ')}`);
assert.equal(state.version, 'mamoken-battle-state-v2-v0.3');
assert.equal(state.authority, 'shadow_only');
assert.equal(state.liveRuntimeAuthority, false);

// --- full field equality against a hand-computed expected shape ---
assert.deepEqual(state, {
  version: 'mamoken-battle-state-v2-v0.3',
  combatContractVersion: 'mamoken-combat-contract-v0.2',
  authority: 'shadow_only',
  liveRuntimeAuthority: false,
  flow: 'fight',
  clocks: { simulationFrame: 731, combatFrame: 731, fighterActionFrame: { 0: 0, 1: 0 } },
  freeze: { kind: 'NONE', remainingF: 0, sourceId: null },
  seed: 0x12345678,
  aiSeed: 0x51a1,
  fighters: {
    0: {
      playerId: 0,
      characterId: 'moguzo',
      controlState: 'actionable',
      postureState: 'NORMAL',
      action: { actionId: null, moveId: null, phase: 'idle', startedCombatFrame: null, actionFrame: 0, currentContactIndex: 0, cancelConsumed: false },
      defense: { guardHeld: false, mikiriWindowF: 0, dodgeWindowF: 0, armorHitsRemaining: 0, lastResult: 'NONE' },
      ability: { abilityId: 'moguzo:none', phase: 'idle', values: {} },
      resources: { hp: 880, maxHp: 1000, guard: 93, maxGuard: 100, sGauge: 42, maxSGauge: 100, focusGauge: 18, maxFocusGauge: 100, ultimateStock: 1, maxUltimateStock: 3 },
      combo: { count: 3 },
      timers: { hitstunF: 0, blockstunF: 0, guardBreakF: 0, downF: 0, wakeF: 0, invulnerabilityF: 0 },
      inputHold: { activeHolds: {}, completedHolds: [] },
      bulletCharge: null,
    },
    1: {
      playerId: 1,
      characterId: 'godan',
      controlState: 'actionable',
      postureState: 'NORMAL',
      action: { actionId: null, moveId: null, phase: 'idle', startedCombatFrame: null, actionFrame: 0, currentContactIndex: 0, cancelConsumed: false },
      defense: { guardHeld: false, mikiriWindowF: 0, dodgeWindowF: 0, armorHitsRemaining: 0, lastResult: 'NONE' },
      ability: { abilityId: 'godan:none', phase: 'idle', values: {} },
      resources: { hp: 905, maxHp: 1000, guard: 76, maxGuard: 100, sGauge: 31, maxSGauge: 100, focusGauge: 14, maxFocusGauge: 100, ultimateStock: 0, maxUltimateStock: 3 },
      combo: { count: 0 },
      timers: { hitstunF: 0, blockstunF: 0, guardBreakF: 0, downF: 0, wakeF: 0, invulnerabilityF: 0 },
      inputHold: { activeHolds: {}, completedHolds: [] },
      bulletCharge: null,
    },
  },
  spatial: { engagement: 'NORMAL', clinchRemainingF: 0, overextendedPlayer: null, sideSwap: false, lastPositionBatchId: 0 },
  round: { roundIndex: 2, timerCombatF: 2869, wins: { 0: 1, 1: 0 }, timeoutEnabled: true },
  lastBatchId: 0,
});

// --- distinct P1/P2 combo preserved independently ---
assert.equal(state.fighters[0].combo.count, 3);
assert.equal(state.fighters[1].combo.count, 0);
assert.notEqual(state.fighters[0].combo.count, state.fighters[1].combo.count);

// --- seed / aiSeed preservation (direct passthrough, no renaming or derivation) ---
assert.equal(state.seed, context.rngState);
assert.equal(state.aiSeed, context.aiRngState);
{
  const differentSeeds = adaptLegacyBattleToV2(makeBattle(), { ...context, rngState: 0xdeadbeef, aiRngState: 0xbeef });
  assert.equal(differentSeeds.seed, 0xdeadbeef);
  assert.equal(differentSeeds.aiSeed, 0xbeef);
}

// --- deterministic output: same snapshot => same V2 state and hash ---
{
  const stateAgain = adaptLegacyBattleToV2(makeBattle(), makeContext());
  assert.deepEqual(stateAgain, state);
  assert.equal(hashBattleStateV2(stateAgain), hashBattleStateV2(state));
  assert.equal(hashLegacyAdaptedBattleV2(makeBattle(), makeContext()), hashBattleStateV2(state));
}
{
  const mutated = makeBattle();
  mutated.p[1].hp -= 1;
  const mutatedState = adaptLegacyBattleToV2(mutated, makeContext());
  assert.notEqual(hashBattleStateV2(mutatedState), hashBattleStateV2(state));
}

// --- source object is not mutated, and later external mutation does not affect the returned state ---
{
  const src = makeBattle();
  const snapshot = adaptLegacyBattleToV2(src, makeContext());
  src.p[0].hp = 1;
  src.p[0].c.id = 'pisuke';
  assert.equal(snapshot.fighters[0].resources.hp, 880);
  assert.equal(snapshot.fighters[0].characterId, 'moguzo');
}

// --- P1/P2 swap: swapping input fighters swaps output fighters symmetrically ---
{
  const swapped = makeBattle();
  [swapped.p[0], swapped.p[1]] = [swapped.p[1], swapped.p[0]];
  const swappedState = adaptLegacyBattleToV2(swapped, makeContext());
  assert.equal(swappedState.fighters[0].characterId, state.fighters[1].characterId);
  assert.equal(swappedState.fighters[1].characterId, state.fighters[0].characterId);
  assert.equal(swappedState.fighters[0].combo.count, state.fighters[1].combo.count);
  assert.equal(swappedState.fighters[1].combo.count, state.fighters[0].combo.count);
}

// --- fail-closed: missing seed ---
expectReject(() => adaptLegacyBattleToV2(makeBattle(), { aiRngState: 1, fighterSeeds: makeContext().fighterSeeds }), 'context.rngState');

// --- fail-closed: missing combo ---
{
  const b = makeBattle();
  delete b.p[0].combo;
  expectReject(() => adaptLegacyBattleToV2(b, makeContext()), 'battle.p[0].combo');
}

// --- fail-closed: unknown phase ---
{
  const b = makeBattle();
  b.p[0].phase = 'crouch'; // LegacyFighterPhase, present in types.ts but never a real f.phase value
  expectReject(() => adaptLegacyBattleToV2(b, makeContext()), 'battle.p[0].phase');
}
{
  // the 3 spurious "fighterPhases" entries inherited from the over-broad audit regex must NOT be
  // accepted as real fighter phases by this adapter (see legacy-adapter-v2.ts comment + G02
  // completion report §Findings)
  for (const spurious of ['in', 'select', 'reveal']) {
    const b = makeBattle();
    b.p[0].phase = spurious;
    expectReject(() => adaptLegacyBattleToV2(b, makeContext()), 'battle.p[0].phase');
  }
}

// --- fail-closed: unknown posture (dodgeType not in crouch|sway|lunge) ---
{
  const b = makeBattle();
  b.p[0].phase = 'dodge';
  b.p[0].pf = 5;
  b.p[0].dodgeType = 'backflip';
  expectReject(() => adaptLegacyBattleToV2(b, makeContext()), 'battle.p[0].dodgeType');
}

// --- fail-closed: missing resource (Bullet has no live BulletCharge gauge at all) ---
{
  const b = makeBattle();
  b.p[0].c.id = 'bullet';
  expectReject(() => adaptLegacyBattleToV2(b, makeContext()), 'battle.p[0]');
}

// --- fail-closed: unsupported version / unknown flow ---
{
  const b = makeBattle();
  b.flow = 'gyuiinIntro'; // a ProvisionalBattleFlow value, never a real B.flow value
  expectReject(() => adaptLegacyBattleToV2(b, makeContext()), 'battle.flow');
}

// --- fail-closed: non-integer resource value (V2 requires integer resources; legacy can be fractional) ---
{
  const b = makeBattle();
  b.p[0].guard = 93.4;
  expectReject(() => adaptLegacyBattleToV2(b, makeContext()), 'battle.p[0].guard');
}

// --- fail-closed: structurally invalid source ---
expectReject(() => adaptLegacyBattleToV2(null, makeContext()), 'battle');
{
  const b = makeBattle();
  b.p = [b.p[0]];
  expectReject(() => adaptLegacyBattleToV2(b, makeContext()), 'battle.p');
}

// --- clash minigame sub-phase mapping (only sub-state the legacy source actually distinguishes) ---
for (const [clashPhase, expectedFlow] of [['in', 'gyuiin_intro'], ['select', 'gyuiin_play'], ['reveal', 'gyuiin_result']]) {
  const b = makeBattle();
  b.flow = 'clash';
  b.clash = { phase: clashPhase };
  b.p[0].phase = 'clash';
  b.p[1].phase = 'clash';
  const clashState = adaptLegacyBattleToV2(b, makeContext());
  assert.equal(clashState.flow, expectedFlow);
}

// --- freeze derivation: NONE when hitstop<=0, HITSTOP during ordinary fight-flow hitstop ---
{
  const b = makeBattle();
  b.hitstop = 6;
  const frozenState = adaptLegacyBattleToV2(b, makeContext());
  assert.deepEqual(frozenState.freeze, { kind: 'HITSTOP', remainingF: 6, sourceId: 'legacy:flow=fight' });
}
{
  const b = makeBattle();
  b.flow = 'ultCine';
  b.hitstop = 3;
  b.p[0].phase = 'ultAtk';
  const ultFreeze = adaptLegacyBattleToV2(b, makeContext());
  assert.equal(ultFreeze.freeze.kind, 'ULTIMATE_FREEZE');
  assert.equal(ultFreeze.flow, 'ultimate_cinematic');
}

// --- clinch: engagement/posture derived from clinchF, forced CLINCH posture on both fighters ---
{
  const b = makeBattle();
  b.p[0].clinchF = 12;
  const clinchState = adaptLegacyBattleToV2(b, makeContext());
  assert.equal(clinchState.spatial.engagement, 'CLINCH');
  assert.equal(clinchState.spatial.clinchRemainingF, 12);
  assert.equal(clinchState.fighters[0].postureState, 'CLINCH');
  assert.equal(clinchState.fighters[1].postureState, 'CLINCH');
}

// --- crouch posture derived from atkLv==='crouch' on an attack phase ---
{
  const b = makeBattle();
  b.p[0].phase = 'attack';
  b.p[0].atkLv = 'crouch';
  b.p[0].pf = 3;
  const crouchState = adaptLegacyBattleToV2(b, makeContext());
  assert.equal(crouchState.fighters[0].postureState, 'CROUCH');
  assert.equal(crouchState.fighters[0].controlState, 'committed');
}

// --- no live import: this module must never import the prototype file or any live runtime path ---
{
  const source = readFileSync(new URL('../src/core/legacy-adapter-v2.ts', import.meta.url), 'utf8');
  // the prototype path may appear as a contract metadata string (mirrors RUNTIME_ADAPTER_CONTRACT.source
  // in G01's runtime-adapter.ts); what must never appear is an actual import/require of it or of runtime/**
  assert.ok(!/\b(import|require)\b[^\n]*mamoken_prototype_v01/.test(source), 'legacy-adapter-v2.ts must not import the live prototype');
  assert.ok(!/from\s+['"](\.\.\/)*runtime\//.test(source), 'legacy-adapter-v2.ts must not import runtime/**');
}

console.log(`legacy adapter v2 tests passed; hash=${hashBattleStateV2(state)}; contractVersion=${LEGACY_ADAPTER_V2_VERSION}`);
