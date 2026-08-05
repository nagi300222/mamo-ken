import assert from 'node:assert/strict';
import { CURRENT_CONTRACT } from '../src/core/constants.ts';
import {
  DEFAULT_RUNTIME_COMMAND_SHADOW_LOG,
  RUNTIME_COMMAND_SHADOW_CONTRACT,
  RUNTIME_COMMAND_SHADOW_VERSION,
  RuntimeCommandShadowError,
  createRuntimeCommandShadowState,
  observeLegacyRuntimeInputPacket,
  runtimeCommandShadowHash,
  runtimeCommandShadowMismatchCount,
} from '../src/core/runtime-command-shadow.ts';

const DIRECTION_TO_DODGE = { left: 'sway', down: 'crouch', right: 'lunge' };

function observe(state, packet, frame, player, characterId) {
  return observeLegacyRuntimeInputPacket(state, packet, { frame, player, characterId });
}

function triggerPacket(move) {
  return {
    cmds: [move.type === 'grab' ? { t: 'grab' } : { t: 'atk', lv: move.trigger }],
    hold: null,
  };
}

function runCurrentCommand(characterId, slot, player = 0) {
  const move = CURRENT_CONTRACT.bal.CMD.moves[characterId][slot - 1];
  let state = createRuntimeCommandShadowState();
  state = observe(state, {
    cmds: [{ t: 'dodge', kind: DIRECTION_TO_DODGE[move.seq[0]] }],
    hold: null,
  }, 10, player, characterId).state;
  state = observe(state, {
    cmds: [{ t: 'dodge', kind: DIRECTION_TO_DODGE[move.seq[1]] }],
    hold: null,
  }, 11, player, characterId).state;
  const update = observe(state, triggerPacket(move), 12, player, characterId);
  return { move, update };
}

function expectShadowError(run, path) {
  assert.throws(run, (error) => {
    assert.ok(error instanceof RuntimeCommandShadowError);
    assert.equal(error.issues.length, 1);
    assert.equal(error.issues[0].path, path);
    return true;
  });
}

assert.equal(RUNTIME_COMMAND_SHADOW_VERSION, 'runtime-command-shadow-v1');
assert.equal(DEFAULT_RUNTIME_COMMAND_SHADOW_LOG, 256);
assert.equal(RUNTIME_COMMAND_SHADOW_CONTRACT.source, 'prototype/mamoken_prototype_v01.html');
assert.equal(RUNTIME_COMMAND_SHADOW_CONTRACT.executionAuthority, 'legacy-runtime');
assert.equal(RUNTIME_COMMAND_SHADOW_CONTRACT.coreAuthority, 'observation-only');
assert.equal(RUNTIME_COMMAND_SHADOW_CONTRACT.runtimeInjection, false);
assert.equal(RUNTIME_COMMAND_SHADOW_CONTRACT.writeBack, false);
assert.equal(RUNTIME_COMMAND_SHADOW_CONTRACT.provisionalActivation, false);
assert.equal(RUNTIME_COMMAND_SHADOW_CONTRACT.commandProfile, 'current-compat');
assert.equal(RUNTIME_COMMAND_SHADOW_CONTRACT.comparedCurrentCommandCount, 9);
assert.equal(RUNTIME_COMMAND_SHADOW_CONTRACT.passthroughAffectsHistory, false);

for (const characterId of ['moguzo', 'pisuke', 'godan']) {
  const moves = CURRENT_CONTRACT.bal.CMD.moves[characterId];
  for (let index = 0; index < moves.length; index += 1) {
    const { move, update } = runCurrentCommand(characterId, index + 1);
    assert.equal(update.observations.length, 1);
    const observation = update.observations[0];
    assert.equal(observation.matches, true);
    assert.equal(observation.legacy.kind, 'command');
    assert.equal(observation.core.kind, 'command');
    assert.equal(observation.legacy.commandId, `${characterId}:slot-${index + 1}`);
    assert.equal(observation.core.commandId, `${characterId}:slot-${index + 1}`);
    assert.equal(observation.legacy.name, move.name);
    assert.equal(observation.core.name, move.name);
  }
}

{
  const p1 = runCurrentCommand('godan', 2, 1).update.observations[0];
  const p0 = runCurrentCommand('godan', 2, 0).update.observations[0];
  assert.deepEqual({ ...p1, player: 0 }, p0);
}

{
  let state = createRuntimeCommandShadowState();
  const passthrough = observe(state, {
    cmds: [{ t: 'roar' }, { t: 'mgTap' }],
    hold: 'guard',
  }, 5, 0, 'moguzo');
  state = passthrough.state;
  assert.equal(passthrough.bridge.events.length, 0);
  assert.equal(passthrough.bridge.passthrough.length, 2);
  assert.equal(state.histories[0].lastFrame, -1);
  assert.deepEqual(state.cursors[0], { frame: 5, nextOrder: 2 });
  const attack = observe(state, { cmds: [{ t: 'atk', lv: 'mid' }], hold: null }, 5, 0, 'moguzo');
  assert.equal(attack.observations[0].order, 2);
  assert.equal(attack.observations[0].core.kind, 'fallback');
  assert.equal(attack.observations[0].matches, true);
}

{
  let state = createRuntimeCommandShadowState();
  state = observe(state, { cmds: [{ t: 'dodge', kind: 'lunge' }], hold: null }, 1, 0, 'moguzo').state;
  state = observe(state, { cmds: [{ t: 'dodge', kind: 'crouch' }], hold: null }, 2, 0, 'moguzo').state;
  const mismatchTrigger = observe(state, { cmds: [{ t: 'atk', lv: 'high' }], hold: null }, 3, 0, 'moguzo');
  assert.equal(mismatchTrigger.observations[0].legacy.kind, 'fallback');
  assert.equal(mismatchTrigger.observations[0].core.kind, 'fallback');
  assert.equal(mismatchTrigger.observations[0].matches, true);
}

{
  let state = createRuntimeCommandShadowState();
  state = observe(state, { cmds: [{ t: 'dodge', kind: 'lunge' }], hold: null }, 0, 0, 'moguzo').state;
  state = observe(state, { cmds: [{ t: 'dodge', kind: 'crouch' }], hold: null }, 1, 0, 'moguzo').state;
  const expired = observe(state, { cmds: [{ t: 'atk', lv: 'mid' }], hold: null }, 26, 0, 'moguzo');
  assert.equal(expired.observations[0].legacy.kind, 'fallback');
  assert.equal(expired.observations[0].core.kind, 'fallback');
  assert.equal(expired.observations[0].matches, true);
}

{
  let state = createRuntimeCommandShadowState(2);
  state = observe(state, { cmds: [{ t: 'atk', lv: 'mid' }], hold: null }, 1, 0, 'moguzo').state;
  state = observe(state, { cmds: [{ t: 'atk', lv: 'high' }], hold: null }, 2, 0, 'moguzo').state;
  state = observe(state, { cmds: [{ t: 'grab' }], hold: null }, 3, 0, 'moguzo').state;
  assert.equal(state.observations.length, 2);
  assert.equal(state.observations[0].frame, 2);
  assert.equal(state.observations[1].frame, 3);
}

{
  const packet = { cmds: [{ t: 'atk', lv: 'mid' }], hold: null };
  const update = observe(createRuntimeCommandShadowState(), packet, 4, 0, 'moguzo');
  packet.cmds[0].lv = 'low';
  assert.equal(update.observations[0].trigger, 'mid');
}

expectShadowError(() => createRuntimeCommandShadowState(0), 'maxObservations');
expectShadowError(() => observe(createRuntimeCommandShadowState(), { cmds: [], hold: null }, 0, 0, 'dark_moguzo'), 'context.characterId');
{
  const state = observe(createRuntimeCommandShadowState(), { cmds: [], hold: null }, 5, 0, 'moguzo').state;
  expectShadowError(() => observe(state, { cmds: [], hold: null }, 4, 0, 'moguzo'), 'context.frame');
}

function scriptedShadow(changed = false) {
  let state = createRuntimeCommandShadowState(512);
  for (let frame = 0; frame < 10_000; frame += 1) {
    const player = frame % 2;
    const characterId = player === 0 ? 'moguzo' : 'pisuke';
    const cmds = [];
    if (frame % 29 === 0) cmds.push({ t: 'dodge', kind: 'lunge' });
    if (frame % 31 === 0) cmds.push({ t: 'dodge', kind: player === 0 ? 'crouch' : 'lunge' });
    if (frame % 37 === 0) cmds.push({ t: 'atk', lv: changed && frame === 4995 ? 'low' : 'mid' });
    if (frame % 113 === 0) cmds.push({ t: 'grab' });
    if (frame % 127 === 0) cmds.push({ t: 'roar' });
    state = observe(state, { cmds, hold: null }, frame, player, characterId).state;
  }
  return state;
}

const longA = scriptedShadow(false);
const longB = scriptedShadow(false);
const longChanged = scriptedShadow(true);
const longHash = runtimeCommandShadowHash(longA);
assert.equal(runtimeCommandShadowMismatchCount(longA), 0);
assert.equal(longA.observations.length, 512);
assert.equal(longHash, runtimeCommandShadowHash(longB));
assert.notEqual(longHash, runtimeCommandShadowHash(longChanged));

console.log(`runtime command shadow tests passed; hash=${longHash}; observations=${longA.observations.length}; mismatches=${runtimeCommandShadowMismatchCount(longA)}`);
