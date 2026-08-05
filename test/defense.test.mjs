import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fnv1a32, stableStringify } from '../src/core/determinism.ts';
import {
  CURRENT_DEFENSE_PROFILE,
  TARGET_GUARD_BREAK_RETURN,
  TARGET_STEP_DEFENSE_PROFILE,
  createStepCancelState,
  isCounterReady,
  replayDefenseEvents,
  resolveDodgeInteraction,
  resolveStepCancel,
} from '../src/core/defense.ts';

const expected = {
  crouch: { high: 'evaded', mid: 'normal_hit', low: 'counter_hit' },
  sway: { high: 'counter_hit', mid: 'evaded', low: 'normal_hit' },
  step: { high: 'normal_hit', mid: 'counter_hit', low: 'evaded' },
};
for (const dodge of ['crouch', 'sway', 'step']) {
  for (const level of ['high', 'mid', 'low']) {
    assert.equal(resolveDodgeInteraction(dodge, level, 5, CURRENT_DEFENSE_PROFILE).relation, expected[dodge][level]);
  }
}
assert.equal(resolveDodgeInteraction('sway', 'mid', 0).relation, 'normal_hit');
assert.equal(resolveDodgeInteraction('step', 'low', 11).relation, 'normal_hit');

for (const frame of [3, 9]) assert.equal(resolveDodgeInteraction('sway', 'mid', frame, TARGET_STEP_DEFENSE_PROFILE).justStep, false);
for (const frame of [4, 5, 6, 7, 8]) assert.equal(resolveDodgeInteraction('sway', 'mid', frame, TARGET_STEP_DEFENSE_PROFILE).justStep, true);
assert.equal(resolveDodgeInteraction('crouch', 'high', 6, TARGET_STEP_DEFENSE_PROFILE).justStep, false);
const just = resolveDodgeInteraction('step', 'low', 6, TARGET_STEP_DEFENSE_PROFILE);
assert.equal(just.totalF, 18);
assert.equal(just.counterReadyF, 22);
assert.equal(just.stepCancelTokens, 1);
assert.equal(isCounterReady(100, 122, 22), true);
assert.equal(isCounterReady(100, 123, 22), false);
assert.equal(isCounterReady(100, 99, 22), false);

const enabled = { archetype: 'standard', contact: 'hit', hasToken: true, moveTags: ['step_cancel'] };
let state = createStepCancelState();
let decision = resolveStepCancel(state, enabled);
assert.equal(decision.accepted, true);
state = decision.state;
assert.equal(resolveStepCancel(state, enabled).reason, 'limit');
assert.equal(resolveStepCancel(createStepCancelState(), { ...enabled, contact: 'whiff' }).reason, 'not_hit');
assert.equal(resolveStepCancel(createStepCancelState(), { ...enabled, contact: 'block' }).reason, 'not_hit');
assert.equal(resolveStepCancel(createStepCancelState(), { ...enabled, hasToken: false }).reason, 'no_token');
assert.equal(resolveStepCancel(createStepCancelState(), { ...enabled, moveTags: [] }).reason, 'move_not_enabled');

let rush = createStepCancelState();
for (let i = 0; i < 2; i += 1) {
  const result = resolveStepCancel(rush, { ...enabled, archetype: 'rush' });
  assert.equal(result.accepted, true);
  rush = result.state;
}
assert.equal(resolveStepCancel(rush, { ...enabled, archetype: 'rush' }).reason, 'limit');
assert.equal(TARGET_GUARD_BREAK_RETURN.stunF, 36);
assert.equal(TARGET_GUARD_BREAK_RETURN.maxFollowupHits, 2);
assert.equal(TARGET_GUARD_BREAK_RETURN.fullComboAllowed, false);

function scriptedEvents(changed = false) {
  const events = [];
  for (let frame = 1; frame <= 10_000; frame += 1) {
    events.push({
      sourceFrame: frame,
      deliveryDelayF: changed && frame === 731 ? 7 : frame % 5,
      order: frame % 3,
      dodge: frame % 3 === 0 ? 'crouch' : frame % 3 === 1 ? 'sway' : 'step',
      level: frame % 3 === 0 ? 'high' : frame % 3 === 1 ? 'mid' : 'low',
      activeFrame: (frame % 10) + 1,
    });
  }
  return events;
}
const replayA = replayDefenseEvents(scriptedEvents());
const replayB = replayDefenseEvents(scriptedEvents().map((event) => ({ ...event })));
const replayChanged = replayDefenseEvents(scriptedEvents(true));
const hashA = fnv1a32(stableStringify(replayA));
const hashB = fnv1a32(stableStringify(replayB));
const changedHash = fnv1a32(stableStringify(replayChanged));
assert.equal(hashA, hashB);
assert.notEqual(hashA, changedHash);
const changedEntry = replayChanged.findIndex((entry, index) => stableStringify(entry) !== stableStringify(replayA[index]));
assert.ok(changedEntry >= 0);

const source = readFileSync(new URL('../src/core/defense.ts', import.meta.url), 'utf8');
for (const forbidden of ['Math.random', 'Date.now', 'localeCompare', 'document.', 'window.', 'setTimeout', 'setInterval']) {
  assert.equal(source.includes(forbidden), false, `forbidden API: ${forbidden}`);
}

console.log(`defense tests passed; 10000F hash=${hashA}; changed=${changedHash}; firstDiffIndex=${changedEntry}`);
