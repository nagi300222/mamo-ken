import assert from 'node:assert/strict';
import {
  CURRENT_COMPAT_PROFILE,
  buildCurrentCommandDefinitions,
  resolveCommandTrigger,
} from '../src/core/command-parser.ts';
import { fnv1a32, stableStringify } from '../src/core/determinism.ts';
import {
  applyNormalizedInputEvents,
  createInputHistoryState,
  validateNormalizedInputEvent,
} from '../src/core/input-events.ts';
import {
  RUNTIME_INPUT_BRIDGE_CONTRACT,
  RUNTIME_INPUT_BRIDGE_VERSION,
  RuntimeInputBridgeError,
  bridgeLegacyRuntimeInputPacket,
} from '../src/core/runtime-input-bridge.ts';

function makePacket() {
  return {
    cmds: [
      { t: 'dodge', kind: 'sway' },
      { t: 'dodge', kind: 'crouch' },
      { t: 'dodge', kind: 'lunge' },
      { t: 'atk', lv: 'high' },
      { t: 'grab' },
      { t: 'roar', ignored: 1 },
      { t: 'mikiri' },
      { t: 'ult' },
      { t: 'mgTap' },
      { t: 'mgHit' },
      { t: 'mgPick', choice: 'rock' },
    ],
    hold: 'guard',
  };
}

function expectBridgeError(run, path) {
  assert.throws(run, (error) => {
    assert.ok(error instanceof RuntimeInputBridgeError);
    assert.equal(error.issues.length, 1);
    assert.equal(error.issues[0].path, path);
    return true;
  });
}

assert.equal(RUNTIME_INPUT_BRIDGE_VERSION, 'legacy-runtime-input-bridge-v1');
assert.equal(RUNTIME_INPUT_BRIDGE_CONTRACT.source, 'prototype/mamoken_prototype_v01.html');
assert.equal(RUNTIME_INPUT_BRIDGE_CONTRACT.direction, 'legacy-runtime-input-to-normalized-events');
assert.equal(RUNTIME_INPUT_BRIDGE_CONTRACT.writeBack, false);
assert.equal(RUNTIME_INPUT_BRIDGE_CONTRACT.runtimeInjection, false);
assert.equal(RUNTIME_INPUT_BRIDGE_CONTRACT.provisionalActivation, false);
assert.deepEqual(RUNTIME_INPUT_BRIDGE_CONTRACT.mappedCommandTypes, ['dodge', 'atk', 'grab']);
assert.deepEqual(RUNTIME_INPUT_BRIDGE_CONTRACT.passthroughCommandTypes, ['roar', 'mikiri', 'ult', 'mgTap', 'mgHit', 'mgPick']);
assert.equal(RUNTIME_INPUT_BRIDGE_CONTRACT.holdMappedToNormalizedEvent, false);
assert.equal(RUNTIME_INPUT_BRIDGE_CONTRACT.dodgeTapEncoding, 'direction-press-release-same-frame');

const packet = makePacket();
const result = bridgeLegacyRuntimeInputPacket(packet, { frame: 100, player: 0, orderStart: 7 });
assert.deepEqual(result, {
  events: [
    { kind: 'direction', action: 'press', direction: 'left', frame: 100, order: 7, player: 0 },
    { kind: 'direction', action: 'release', direction: 'left', frame: 100, order: 8, player: 0 },
    { kind: 'direction', action: 'press', direction: 'down', frame: 100, order: 9, player: 0 },
    { kind: 'direction', action: 'release', direction: 'down', frame: 100, order: 10, player: 0 },
    { kind: 'direction', action: 'press', direction: 'right', frame: 100, order: 11, player: 0 },
    { kind: 'direction', action: 'release', direction: 'right', frame: 100, order: 12, player: 0 },
    { kind: 'attack', level: 'high', frame: 100, order: 13, player: 0 },
    { kind: 'grab', frame: 100, order: 14, player: 0 },
  ],
  passthrough: [
    { index: 5, order: 15, type: 'roar', command: { t: 'roar' } },
    { index: 6, order: 16, type: 'mikiri', command: { t: 'mikiri' } },
    { index: 7, order: 17, type: 'ult', command: { t: 'ult' } },
    { index: 8, order: 18, type: 'mgTap', command: { t: 'mgTap' } },
    { index: 9, order: 19, type: 'mgHit', command: { t: 'mgHit' } },
    { index: 10, order: 20, type: 'mgPick', command: { t: 'mgPick', choice: 'rock' } },
  ],
  hold: 'guard',
  nextOrder: 21,
});
for (const event of result.events) validateNormalizedInputEvent(event);
assert.equal(fnv1a32(stableStringify(result)), 'a989a2c7');
assert.deepEqual(bridgeLegacyRuntimeInputPacket(makePacket(), { frame: 100, player: 0, orderStart: 7 }), result);

packet.cmds[0].kind = 'lunge';
packet.cmds[10].choice = 'paper';
packet.hold = null;
assert.equal(result.events[0].direction, 'left');
assert.equal(result.passthrough[5].command.choice, 'rock');
assert.equal(result.hold, 'guard');

for (const hold of [null, 'guard', 'high', 'mid', 'low']) {
  const bridged = bridgeLegacyRuntimeInputPacket({ cmds: [], hold }, { frame: 0, player: 1 });
  assert.equal(bridged.hold, hold);
  assert.deepEqual(bridged.events, []);
  assert.equal(bridged.nextOrder, 0);
}

let history = createInputHistoryState(0);
const right = bridgeLegacyRuntimeInputPacket({ cmds: [{ t: 'dodge', kind: 'lunge' }], hold: null }, { frame: 10, player: 0 });
history = applyNormalizedInputEvents(history, right.events, CURRENT_COMPAT_PROFILE);
const down = bridgeLegacyRuntimeInputPacket({ cmds: [{ t: 'dodge', kind: 'crouch' }], hold: null }, { frame: 11, player: 0 });
history = applyNormalizedInputEvents(history, down.events, CURRENT_COMPAT_PROFILE);
const mid = bridgeLegacyRuntimeInputPacket({ cmds: [{ t: 'atk', lv: 'mid' }], hold: null }, { frame: 12, player: 0 });
const trigger = mid.events[0];
assert.equal(trigger.kind, 'attack');
const resolution = resolveCommandTrigger(
  history,
  trigger,
  buildCurrentCommandDefinitions('moguzo'),
  CURRENT_COMPAT_PROFILE,
);
assert.equal(resolution.kind, 'command');
assert.equal(resolution.match.definition.name, '地走り');
assert.deepEqual(resolution.match.matchedPresses.map(({ direction }) => direction), ['right', 'down']);

let playerTwoHistory = createInputHistoryState(1);
const playerTwoDirections = bridgeLegacyRuntimeInputPacket(
  { cmds: [{ t: 'dodge', kind: 'lunge' }, { t: 'dodge', kind: 'crouch' }], hold: 'mid' },
  { frame: 20, player: 1, orderStart: 4 },
);
playerTwoHistory = applyNormalizedInputEvents(playerTwoHistory, playerTwoDirections.events, CURRENT_COMPAT_PROFILE);
assert.equal(playerTwoHistory.player, 1);
assert.deepEqual(playerTwoHistory.directionPresses.map(({ direction }) => direction), ['right', 'down']);
assert.deepEqual(playerTwoHistory.activeHolds, {});

const firstSameFrame = bridgeLegacyRuntimeInputPacket(
  { cmds: [{ t: 'dodge', kind: 'sway' }], hold: null },
  { frame: 200, player: 0 },
);
const secondSameFrame = bridgeLegacyRuntimeInputPacket(
  { cmds: [{ t: 'grab' }], hold: null },
  { frame: 200, player: 0, orderStart: firstSameFrame.nextOrder },
);
const sameFrameHistory = applyNormalizedInputEvents(
  createInputHistoryState(0),
  [...firstSameFrame.events, ...secondSameFrame.events],
  CURRENT_COMPAT_PROFILE,
);
assert.equal(sameFrameHistory.lastFrame, 200);
assert.equal(sameFrameHistory.lastOrder, 2);

expectBridgeError(() => bridgeLegacyRuntimeInputPacket(null, { frame: 0, player: 0 }), 'packet');
expectBridgeError(() => bridgeLegacyRuntimeInputPacket({ cmds: {}, hold: null }, { frame: 0, player: 0 }), 'packet.cmds');
expectBridgeError(() => bridgeLegacyRuntimeInputPacket({ cmds: [] }, { frame: 0, player: 0 }), 'packet.hold');
expectBridgeError(() => bridgeLegacyRuntimeInputPacket({ cmds: [], hold: 'crouch' }, { frame: 0, player: 0 }), 'packet.hold');
expectBridgeError(() => bridgeLegacyRuntimeInputPacket({ cmds: [], hold: null }, { frame: -1, player: 0 }), 'context.frame');
expectBridgeError(() => bridgeLegacyRuntimeInputPacket({ cmds: [], hold: null }, { frame: 0, player: 2 }), 'context.player');
expectBridgeError(() => bridgeLegacyRuntimeInputPacket({ cmds: [], hold: null }, { frame: 0, player: 0, orderStart: 0.5 }), 'context.orderStart');
expectBridgeError(() => bridgeLegacyRuntimeInputPacket({ cmds: [{}], hold: null }, { frame: 0, player: 0 }), 'packet.cmds[0].t');
expectBridgeError(() => bridgeLegacyRuntimeInputPacket({ cmds: [{ t: 'unknown' }], hold: null }, { frame: 0, player: 0 }), 'packet.cmds[0].t');
expectBridgeError(() => bridgeLegacyRuntimeInputPacket({ cmds: [{ t: 'dodge', kind: 'up' }], hold: null }, { frame: 0, player: 0 }), 'packet.cmds[0].kind');
expectBridgeError(() => bridgeLegacyRuntimeInputPacket({ cmds: [{ t: 'atk', lv: 'crouch' }], hold: null }, { frame: 0, player: 0 }), 'packet.cmds[0].lv');
expectBridgeError(() => bridgeLegacyRuntimeInputPacket({ cmds: [{ t: 'mgPick' }], hold: null }, { frame: 0, player: 0 }), 'packet.cmds[0].choice');

console.log(`runtime input bridge tests passed; hash=${fnv1a32(stableStringify(result))}; events=${result.events.length}; passthrough=${result.passthrough.length}`);
