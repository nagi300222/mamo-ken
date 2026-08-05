import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CURRENT_CONTRACT } from '../src/core/constants.ts';
import {
  CURRENT_COMMAND_PROFILE,
  TARGET_COMMAND_PROFILE,
  applyAndResolve,
  currentCommandDefinitions,
  findCommandMatches,
  resolveCommand,
  resolvePrebuffer,
} from '../src/core/command-parser.ts';
import { createCommandParserState, applyInputEvent, applyInputEvents, compareInputEvents } from '../src/core/input-events.ts';
import { fnv1a32, stableStringify } from '../src/core/determinism.ts';

const sourceFiles = ['src/core/command-parser.ts', 'src/core/input-events.ts', 'src/core/command-types.ts'];
for (const file of sourceFiles) {
  const src = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
  assert.ok(!/Math\.random|\bDate\b|localeCompare|document\.|window\.|Canvas|Audio|setTimeout|setInterval|performance\./.test(src), `${file} has forbidden nondeterminism or browser API`);
}

const press = (frame, direction, order = 0, player = 0) => ({ frame, order, player, kind: 'directionPress', direction });
const release = (frame, direction, order = 0, player = 0) => ({ frame, order, player, kind: 'directionRelease', direction });
const attack = (frame, level, order = 0, player = 0) => ({ frame, order, player, kind: 'attack', level });
const grab = (frame, order = 0, player = 0) => ({ frame, order, player, kind: 'grab' });

function stateWith(events) { return applyInputEvents(createCommandParserState(), events); }
function triggerFor(move, frame = 10) { return move.trigger === 'grab' ? grab(frame) : attack(frame, move.trigger); }
function assertCommand(characterId, move, index) {
  const defs = currentCommandDefinitions(characterId);
  const state = stateWith([press(0, move.seq[0]), press(1, move.seq[1])]);
  const result = resolveCommand(state, triggerFor(move), defs, CURRENT_COMMAND_PROFILE);
  assert.equal(result.kind, 'command', `${characterId}:${move.name}`);
  assert.equal(result.match.definition.name, move.name);
  assert.equal(result.match.definition.currentMoveIndex, index);
}

let currentCount = 0;
for (const [characterId, moves] of Object.entries(CURRENT_CONTRACT.bal.CMD.moves)) {
  moves.forEach((move, index) => { assertCommand(characterId, move, index); currentCount += 1; });
}
assert.equal(currentCount, 9);

{
  const defs = currentCommandDefinitions('moguzo');
  const move = CURRENT_CONTRACT.bal.CMD.moves.moguzo[0];
  const state = stateWith([press(0, move.seq[0]), press(1, move.seq[1])]);
  assert.equal(resolveCommand(state, attack(10, move.trigger === 'mid' ? 'high' : 'mid'), defs).kind, 'normalAttackFallback');
}

{
  const defs = currentCommandDefinitions('moguzo');
  const move = CURRENT_CONTRACT.bal.CMD.moves.moguzo[0];
  assert.equal(resolveCommand(stateWith([press(0, move.seq[0]), press(23, move.seq[1])]), attack(24, move.trigger), defs).kind, 'command');
  assert.equal(resolveCommand(stateWith([press(0, move.seq[0]), press(24, move.seq[1])]), attack(24, move.trigger), defs).kind, 'command');
  assert.equal(resolveCommand(stateWith([press(0, move.seq[0]), press(25, move.seq[1])]), attack(25, move.trigger), defs).kind, 'normalAttackFallback');
}

const defsTarget = [
  { id: 'gap', name: 'gap', sequence: ['left', 'down', 'right'], trigger: 'mid', definitionOrder: 0, specificity: 1 },
  { id: 'four', name: 'four', sequence: ['left', 'down', 'right', 'left'], trigger: 'mid', definitionOrder: 1, specificity: 1 },
  { id: 'repeat', name: 'repeat', sequence: ['left', 'left'], trigger: 'mid', definitionOrder: 2, specificity: 1 },
  { id: 'charge', name: 'charge', sequence: ['left'], trigger: 'mid', definitionOrder: 3, specificity: 1, charge: { direction: 'left', holdF: TARGET_COMMAND_PROFILE.chargeCompleteF } },
];
assert.equal(resolveCommand(stateWith([press(0, 'left'), press(18, 'down'), press(19, 'right')]), attack(20, 'mid'), defsTarget, TARGET_COMMAND_PROFILE).kind, 'command');
assert.equal(resolveCommand(stateWith([press(0, 'left'), press(19, 'down'), press(20, 'right')]), attack(21, 'mid'), defsTarget, TARGET_COMMAND_PROFILE).kind, 'normalAttackFallback');
assert.equal(resolveCommand(stateWith([press(0, 'left'), press(28, 'down'), press(28, 'right')]), attack(28, 'mid'), defsTarget, { ...TARGET_COMMAND_PROFILE, directionGapMaxF: 99 }).kind, 'command');
assert.equal(resolveCommand(stateWith([press(0, 'left'), press(29, 'down'), press(29, 'right')]), attack(29, 'mid'), defsTarget, { ...TARGET_COMMAND_PROFILE, directionGapMaxF: 99 }).kind, 'normalAttackFallback');
assert.equal(resolveCommand(stateWith([press(0, 'left'), press(13, 'down'), press(25, 'right'), press(38, 'left')]), attack(38, 'mid'), defsTarget, { ...TARGET_COMMAND_PROFILE, directionGapMaxF: 99 }).kind, 'command');
assert.equal(resolveCommand(stateWith([press(0, 'left'), press(13, 'down'), press(25, 'right'), press(39, 'left')]), attack(39, 'mid'), defsTarget, { ...TARGET_COMMAND_PROFILE, directionGapMaxF: 99 }).kind, 'normalAttackFallback');
assert.equal(resolveCommand(stateWith([press(0, 'left'), press(1, 'left')]), attack(2, 'mid'), defsTarget, TARGET_COMMAND_PROFILE).kind, 'normalAttackFallback');
assert.equal(resolveCommand(stateWith([press(0, 'left'), press(2, 'left')]), attack(3, 'mid'), defsTarget, TARGET_COMMAND_PROFILE).kind, 'command');
let chargeState = createCommandParserState();
chargeState = applyInputEvent(chargeState, press(0, 'left'));
assert.equal(resolveCommand(chargeState, attack(44, 'mid'), defsTarget, TARGET_COMMAND_PROFILE).kind, 'normalAttackFallback');
assert.equal(resolveCommand(chargeState, attack(45, 'mid'), defsTarget, TARGET_COMMAND_PROFILE).kind, 'command');
chargeState = applyInputEvent(chargeState, release(46, 'left'));
assert.equal(resolveCommand(chargeState, attack(47, 'mid'), defsTarget, TARGET_COMMAND_PROFILE).kind, 'normalAttackFallback');
assert.equal(resolveCommand(stateWith([press(0, 'left'), press(20, 'down')]), attack(31, 'mid'), defsTarget, TARGET_COMMAND_PROFILE).kind, 'normalAttackFallback');
assert.equal(resolveCommand(stateWith([press(0, 'left'), press(20, 'down')]), attack(30, 'mid'), defsTarget, { ...TARGET_COMMAND_PROFILE, directionGapMaxF: 99 }).kind, 'normalAttackFallback');

{
  const defs = [
    { id: 'short', name: 'short', sequence: ['left', 'down'], trigger: 'mid', definitionOrder: 0, specificity: 1 },
    { id: 'conditional', name: 'conditional', sequence: ['left', 'down', 'right'], trigger: 'mid', definitionOrder: 1, specificity: 1, condition: { id: 'stance', active: true, blocksOverlappingFallback: true } },
  ];
  assert.equal(resolveCommand(stateWith([press(0, 'left'), press(1, 'down'), press(2, 'right')]), attack(2, 'mid'), defs, TARGET_COMMAND_PROFILE).match.definition.name, 'conditional');
  const falseDefs = [{ ...defs[1], condition: { id: 'stance', active: false, blocksOverlappingFallback: true } }, defs[0]];
  const falseResult = resolveCommand(stateWith([press(0, 'left'), press(1, 'down'), press(2, 'right')]), attack(2, 'mid'), falseDefs, TARGET_COMMAND_PROFILE);
  assert.equal(falseResult.kind, 'rejected');
  assert.equal(falseResult.blockedBy.name, 'conditional');
}

{
  const defs = [
    { id: 'two', name: 'two', sequence: ['left', 'down'], trigger: 'mid', definitionOrder: 0, specificity: 1 },
    { id: 'three', name: 'three', sequence: ['left', 'down', 'right'], trigger: 'mid', definitionOrder: 1, specificity: 1 },
    { id: 'spec-a', name: 'spec-a', sequence: ['down', 'right'], trigger: 'high', definitionOrder: 2, specificity: 10 },
    { id: 'spec-b', name: 'spec-b', sequence: ['down', 'right'], trigger: 'high', definitionOrder: 3, specificity: 1 },
    { id: 'order-a', name: 'order-a', sequence: ['right', 'left'], trigger: 'low', definitionOrder: 4, specificity: 1 },
    { id: 'order-b', name: 'order-b', sequence: ['right', 'left'], trigger: 'low', definitionOrder: 5, specificity: 1 },
  ];
  assert.equal(resolveCommand(stateWith([press(0, 'left'), press(1, 'down'), press(2, 'right')]), attack(2, 'mid'), defs, TARGET_COMMAND_PROFILE).match.definition.name, 'three');
  assert.equal(resolveCommand(stateWith([press(0, 'down'), press(1, 'right')]), attack(1, 'high'), defs, TARGET_COMMAND_PROFILE).match.definition.name, 'spec-a');
  assert.equal(resolveCommand(stateWith([press(0, 'right'), press(1, 'left')]), attack(1, 'low'), defs, TARGET_COMMAND_PROFILE).match.definition.name, 'order-a');
}

{
  const defs = currentCommandDefinitions('moguzo');
  const state = stateWith([press(0, 'right'), press(1, 'down')]);
  const match = findCommandMatches(state, 2, 'mid', defs, CURRENT_COMMAND_PROFILE)[0];
  assert.equal(resolvePrebuffer(match, 11, 100).decision, 'queued');
  assert.equal(resolvePrebuffer(match, 12, 100).decision, 'queued');
  assert.equal(resolvePrebuffer(match, 13, 100).decision, 'rejected');
  assert.equal(resolvePrebuffer(match, 0, 100).decision, 'immediate');
  assert.equal(resolvePrebuffer(match, 12, 100).actionableFrame, 100);
}

{
  const sorted = [attack(5, 'mid', 2, 0), press(5, 'left', 0, 0), grab(5, 1, 0)].sort(compareInputEvents);
  assert.deepEqual(sorted.map((event) => event.kind), ['directionPress', 'grab', 'attack']);
  let state = createCommandParserState();
  const defs = currentCommandDefinitions('moguzo');
  let result;
  for (const event of sorted) [state, result] = applyAndResolve(state, event, defs);
  assert.equal(result.kind, 'normalAttackFallback');
}

{
  const defs = currentCommandDefinitions('moguzo');
  assert.equal(resolveCommand(createCommandParserState(), press(0, 'left'), defs).kind, 'directionFallback');
  const p1 = stateWith([press(0, 'right', 0, 0), press(1, 'down', 0, 0)]);
  const p2 = stateWith([press(0, 'right', 0, 1), press(1, 'down', 0, 1)]);
  assert.equal(resolveCommand(p1, attack(2, 'mid', 0, 0), defs).match.definition.name, '地走り');
  assert.equal(resolveCommand(p2, attack(2, 'mid', 0, 1), defs).match.definition.name, '地走り');
}

function frameEvents(frame) {
  const events = [];
  if (frame % 17 === 0) events.push(press(frame, frame % 34 === 0 ? 'right' : 'left', 0, 0));
  if (frame % 29 === 0) events.push(press(frame, frame % 58 === 0 ? 'down' : 'right', 1, 1));
  if (frame % 43 === 0) events.push(attack(frame, frame % 86 === 0 ? 'high' : 'mid', 2, 0));
  if (frame % 71 === 0) events.push(grab(frame, 3, 1));
  return events;
}
function replay(changeAt = -1) {
  let left = createCommandParserState();
  let right = createCommandParserState();
  let hash = '';
  let negativeFrame = 0;
  for (let frame = 1; frame <= 10_000; frame += 1) {
    const events = frameEvents(frame);
    const changed = frame === changeAt ? events.map((event) => ({ ...event, order: 10 - event.order })) : events.map((event) => ({ ...event }));
    left = applyInputEvents(left, events);
    right = applyInputEvents(right, changed);
    const leftHash = fnv1a32(stableStringify(left));
    const rightHash = fnv1a32(stableStringify(right));
    if (!negativeFrame && leftHash !== rightHash) negativeFrame = frame;
    if (changeAt < 0) assert.equal(leftHash, rightHash, `parser hash mismatch at ${frame}`);
    hash = leftHash;
  }
  return { hash, negativeFrame };
}
const deterministic = replay();
assert.equal(deterministic.hash, 'f45738c9');
const negative = replay(731);
assert.equal(negative.negativeFrame, 731);

console.log(`command parser tests passed; 10000F hash=${deterministic.hash}; negativeDivergence=${negative.negativeFrame}; currentCommands=${currentCount}; prebuffer=11/12 queued, 13 rejected; p1p2=logical-direction-ok`);
