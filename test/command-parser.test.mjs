import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  CURRENT_COMPAT_PROFILE,
  TARGET_PROVISIONAL_PROFILE,
  applyNormalizedInputEvent,
  applyNormalizedInputEvents,
  buildCurrentCommandDefinitions,
  createInputHistoryState,
  decideCommandPrebuffer,
  fnv1a32,
  isDirectionHeld,
  matchCommandDefinitions,
  resolveCommandTrigger,
  resolveDirectionFallback,
  scheduleCommandMatch,
  stableStringify,
} from '../src/core/index.ts';

const d = (direction, frame, order = 0, player = 0, action = 'press') => ({ kind: 'direction', action, direction, frame, order, player });
const atk = (level, frame, order = 0, player = 0) => ({ kind: 'attack', level, frame, order, player });
const grab = (frame, order = 0, player = 0) => ({ kind: 'grab', frame, order, player });

function stateFrom(events, profile = CURRENT_COMPAT_PROFILE, player = 0) {
  return applyNormalizedInputEvents(createInputHistoryState(player), events, profile);
}

function triggerFor(definition, frame, order = 0, player = 0) {
  return definition.trigger === 'grab' ? grab(frame, order, player) : atk(definition.trigger, frame, order, player);
}

const currentDefinitions = buildCurrentCommandDefinitions();
assert.equal(currentDefinitions.length, 9);
assert.deepEqual(currentDefinitions.map((definition) => definition.name), [
  '地走り', '昇撃', '引き寄せ投げ',
  '二連牙', 'スライディング', '宙返り蹴',
  '地割れ', '山掴み', '巌の構え',
]);

for (const definition of currentDefinitions) {
  const directions = definition.directions.map((direction, index) => d(direction, index, index));
  const state = stateFrom(directions);
  const result = resolveCommandTrigger(state, triggerFor(definition, directions.length, directions.length), [definition], CURRENT_COMPAT_PROFILE);
  assert.equal(result.kind, 'command', `${definition.name} should resolve`);
  assert.equal(result.match.definition.id, definition.id);
  const wrong = definition.trigger === 'grab' ? atk('mid', directions.length, directions.length) : grab(directions.length, directions.length);
  assert.equal(resolveCommandTrigger(state, wrong, [definition], CURRENT_COMPAT_PROFILE).kind, 'fallback');
}

const groundRun = currentDefinitions.find((definition) => definition.name === '地走り');
assert.ok(groundRun);
for (const [triggerFrame, shouldMatch] of [[23, true], [24, true], [25, false]]) {
  const state = stateFrom([d('right', 0, 0), d('down', 1, 1)]);
  const result = resolveCommandTrigger(state, atk('mid', triggerFrame, 2), [groundRun], CURRENT_COMPAT_PROFILE);
  assert.equal(result.kind === 'command', shouldMatch, `current history ${triggerFrame}F boundary`);
}

const targetTwo = { id:'target-two', name:'target-two', directions:['left','right'], trigger:'mid', specificity:0, definitionOrder:0, source:'provisional' };
for (const [gap, shouldMatch] of [[18, true], [19, false]]) {
  const state = stateFrom([d('left', 0, 0), d('right', gap, 1)], TARGET_PROVISIONAL_PROFILE);
  const result = resolveCommandTrigger(state, atk('mid', gap, 2), [targetTwo], TARGET_PROVISIONAL_PROFILE);
  assert.equal(result.kind === 'command', shouldMatch, `direction gap ${gap}`);
}

const targetThree = { ...targetTwo, id:'target-three', name:'target-three', directions:['left','down','right'] };
for (const [lastFrame, shouldMatch] of [[28, true], [29, false]]) {
  const state = stateFrom([d('left', 0, 0), d('down', 14, 1), d('right', lastFrame, 2)], TARGET_PROVISIONAL_PROFILE);
  const result = resolveCommandTrigger(state, atk('mid', lastFrame, 3), [targetThree], TARGET_PROVISIONAL_PROFILE);
  assert.equal(result.kind === 'command', shouldMatch, `3-direction total ${lastFrame}`);
}

const targetFour = { ...targetTwo, id:'target-four', name:'target-four', directions:['left','down','right','down'] };
for (const [lastFrame, shouldMatch] of [[38, true], [39, false]]) {
  const state = stateFrom([d('left', 0, 0), d('down', 12, 1), d('right', 24, 2), d('down', lastFrame, 3)], TARGET_PROVISIONAL_PROFILE);
  const result = resolveCommandTrigger(state, atk('mid', lastFrame, 4), [targetFour], TARGET_PROVISIONAL_PROFILE);
  assert.equal(result.kind === 'command', shouldMatch, `4-direction total ${lastFrame}`);
}

for (const [triggerFrame, shouldMatch] of [[11, true], [12, false]]) {
  const state = stateFrom([d('left', 0, 0), d('right', 1, 1)], TARGET_PROVISIONAL_PROFILE);
  const result = resolveCommandTrigger(state, atk('mid', triggerFrame, 2), [targetTwo], TARGET_PROVISIONAL_PROFILE);
  assert.equal(result.kind === 'command', shouldMatch, `final button grace ${triggerFrame - 1}`);
}

let chatter = createInputHistoryState(0);
let update = applyNormalizedInputEvent(chatter, d('right', 0, 0), TARGET_PROVISIONAL_PROFILE);
assert.equal(update.accepted, true);
chatter = update.state;
update = applyNormalizedInputEvent(chatter, d('right', 1, 1), TARGET_PROVISIONAL_PROFILE);
assert.equal(update.accepted, false);
assert.equal(update.reason, 'anti-chatter');
assert.equal(update.state.directionPresses.length, 1);
update = applyNormalizedInputEvent(update.state, d('right', 2, 2), TARGET_PROVISIONAL_PROFILE);
assert.equal(update.accepted, true);
assert.equal(update.state.directionPresses.length, 2);

const charge = {
  id:'charge', name:'charge', directions:['right'], trigger:'high', specificity:0, definitionOrder:0, source:'provisional',
  charge:{direction:'left', releaseRequired:true},
};
for (const [releaseFrame, shouldMatch] of [[44, false], [45, true], [46, true]]) {
  const events = [d('left', 0, 0), d('left', releaseFrame, 1, 0, 'release'), d('right', releaseFrame + 1, 2)];
  const state = stateFrom(events, TARGET_PROVISIONAL_PROFILE);
  const result = resolveCommandTrigger(state, atk('high', releaseFrame + 2, 3), [charge], TARGET_PROVISIONAL_PROFILE);
  assert.equal(result.kind === 'command', shouldMatch, `charge release ${releaseFrame}`);
}
const heldState = stateFrom([d('left', 0, 0)], TARGET_PROVISIONAL_PROFILE);
assert.equal(isDirectionHeld(heldState, 'left', 29, TARGET_PROVISIONAL_PROFILE), false);
assert.equal(isDirectionHeld(heldState, 'left', 30, TARGET_PROVISIONAL_PROFILE), true);

const short = { id:'short', name:'short', directions:['right','down'], trigger:'mid', specificity:0, definitionOrder:1, source:'provisional' };
const conditional = { id:'conditional', name:'conditional', directions:['left','right','down'], trigger:'mid', specificity:0, definitionOrder:0, source:'provisional', conditionId:'powered', blockShorterOnConditionFailure:true };
const overlapState = stateFrom([d('left',0,0), d('right',1,1), d('down',2,2)], TARGET_PROVISIONAL_PROFILE);
let overlap = resolveCommandTrigger(overlapState, atk('mid',2,3), [short, conditional], TARGET_PROVISIONAL_PROFILE, {context:{activeConditions:new Set(['powered'])}});
assert.equal(overlap.kind, 'command');
assert.equal(overlap.match.definition.id, 'conditional');
overlap = resolveCommandTrigger(overlapState, atk('mid',2,3), [short, conditional], TARGET_PROVISIONAL_PROFILE);
assert.equal(overlap.kind, 'fallback');
assert.equal(overlap.fallback.kind, 'normal-attack');
assert.deepEqual(overlap.blockedBy, ['conditional']);

const longest = resolveCommandTrigger(overlapState, atk('mid',2,3), [short, {...conditional, conditionId:undefined, blockShorterOnConditionFailure:false}], TARGET_PROVISIONAL_PROFILE);
assert.equal(longest.kind, 'command');
assert.equal(longest.match.definition.id, 'conditional');

const equalState = stateFrom([d('right',0,0), d('down',1,1)], TARGET_PROVISIONAL_PROFILE);
const lowSpecificity = {...short, id:'low-specificity', specificity:1, definitionOrder:0};
const highSpecificity = {...short, id:'high-specificity', specificity:2, definitionOrder:1};
let tied = resolveCommandTrigger(equalState, atk('mid',1,2), [lowSpecificity, highSpecificity], TARGET_PROVISIONAL_PROFILE);
assert.equal(tied.kind, 'command');
assert.equal(tied.match.definition.id, 'high-specificity');
const orderFirst = {...short, id:'order-first', specificity:2, definitionOrder:4};
const orderSecond = {...short, id:'order-second', specificity:2, definitionOrder:5};
tied = resolveCommandTrigger(equalState, atk('mid',1,2), [orderSecond, orderFirst], TARGET_PROVISIONAL_PROFILE);
assert.equal(tied.kind, 'command');
assert.equal(tied.match.definition.id, 'order-first');

const matched = matchCommandDefinitions(equalState, atk('mid',1,2), [short], TARGET_PROVISIONAL_PROFILE).matches[0];
assert.ok(matched);
for (const [remaining, status] of [[0,'immediate'],[11,'queued'],[12,'queued'],[13,'rejected']]) {
  const decision = decideCommandPrebuffer(100, remaining, 100 + remaining, CURRENT_COMPAT_PROFILE);
  assert.equal(decision.status, status);
  const scheduled = scheduleCommandMatch(matched, 100, remaining, 100 + remaining, CURRENT_COMPAT_PROFILE);
  assert.equal(scheduled.status, status);
  if (status === 'queued') assert.equal(scheduled.executeFrame, 100 + remaining);
}

const fallbackEvent = d('left', 10, 0);
assert.deepEqual(resolveDirectionFallback(fallbackEvent), {kind:'direction-fallback', direction:'left'});
const fallbackResolution = resolveCommandTrigger(createInputHistoryState(0), atk('low',10,1), [], CURRENT_COMPAT_PROFILE, {fallbackDirection:'left'});
assert.deepEqual(fallbackResolution.fallback, {kind:'direction-fallback', direction:'left'});

const sameFrameState = stateFrom([d('down',5,1), d('right',5,0)], CURRENT_COMPAT_PROFILE);
const sameFrameResult = resolveCommandTrigger(sameFrameState, atk('mid',5,2), [groundRun], CURRENT_COMPAT_PROFILE);
assert.equal(sameFrameResult.kind, 'command');
assert.throws(() => stateFrom([d('right',5,0), d('down',5,0)]), /duplicate frame\/order\/player/);

for (const player of [0,1]) {
  const state = stateFrom([d('right',0,0,player), d('down',1,1,player)], CURRENT_COMPAT_PROFILE, player);
  const result = resolveCommandTrigger(state, atk('mid',2,2,player), [groundRun], CURRENT_COMPAT_PROFILE);
  assert.equal(result.kind, 'command');
  assert.equal(result.match.definition.name, '地走り');
}

function replayEvents(frame, changedOrder = false) {
  if (frame === 731) {
    return changedOrder
      ? [d('right',frame,1), d('down',frame,0), atk('mid',frame,2)]
      : [d('right',frame,0), d('down',frame,1), atk('mid',frame,2)];
  }
  if (frame % 20 !== 0) return [];
  const index = (frame / 20) % currentDefinitions.length;
  const definition = currentDefinitions[index];
  const events = definition.directions.map((direction, order) => d(direction, frame, order));
  events.push(triggerFor(definition, frame, definition.directions.length));
  return events;
}

function createReplay() {
  return {state:createInputHistoryState(0), commandCount:0, fallbackCount:0, lastCommand:null};
}

function replayFrame(replay, frame, changedOrder = false) {
  let state = replay.state;
  let commandCount = replay.commandCount;
  let fallbackCount = replay.fallbackCount;
  let lastCommand = replay.lastCommand;
  const events = [...replayEvents(frame, changedOrder)].sort((a,b)=>a.frame-b.frame||a.order-b.order||a.player-b.player);
  for (const event of events) {
    if (event.kind === 'direction') {
      state = applyNormalizedInputEvent(state, event, CURRENT_COMPAT_PROFILE).state;
    } else {
      const result = resolveCommandTrigger(state, event, currentDefinitions, CURRENT_COMPAT_PROFILE);
      if (result.kind === 'command') { commandCount += 1; lastCommand = result.match.definition.id; }
      else fallbackCount += 1;
      state = applyNormalizedInputEvent(state, event, CURRENT_COMPAT_PROFILE).state;
    }
  }
  return {state, commandCount, fallbackCount, lastCommand};
}

function replayHash(replay, frame) {
  return fnv1a32(stableStringify({frame, replay}));
}

let replayA=createReplay();
let replayB=createReplay();
let replayChanged=createReplay();
let negativeDivergence=0;
let finalHash='';
for (let frame=1; frame<=10_000; frame+=1) {
  replayA=replayFrame(replayA,frame,false);
  replayB=replayFrame(replayB,frame,false);
  replayChanged=replayFrame(replayChanged,frame,true);
  const aHash=replayHash(replayA,frame);
  const bHash=replayHash(replayB,frame);
  const changedHash=replayHash(replayChanged,frame);
  assert.equal(aHash,bHash,`parser replay mismatch at frame ${frame}`);
  if (!negativeDivergence && aHash!==changedHash) negativeDivergence=frame;
  finalHash=aHash;
}
assert.equal(negativeDivergence,731);
assert.equal(replayA.commandCount,replayB.commandCount);
assert.equal(finalHash, 'f5a7abc5');

for (const path of ['../src/core/command-parser.ts','../src/core/input-events.ts','../src/core/command-types.ts']) {
  const source=readFileSync(new URL(path,import.meta.url),'utf8');
  for (const forbidden of ['Math.random','localeCompare','document.','window.','Canvas','Audio(','setTimeout(','setInterval(','performance.now','Date(']) {
    assert.equal(source.includes(forbidden),false,`${path} contains forbidden API ${forbidden}`);
  }
}

console.log(`command parser tests passed; currentCommands=${currentDefinitions.length}; 10000F hash=${finalHash}; negativeDivergence=${negativeDivergence}; prebuffer=0 immediate/11 queued/12 queued/13 rejected; p1p2=logical-direction-ok`);
