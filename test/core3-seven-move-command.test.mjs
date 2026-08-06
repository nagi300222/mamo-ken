import assert from 'node:assert/strict';
import {
  TARGET_PROVISIONAL_PROFILE,
  applyNormalizedInputEvents,
  buildCore3SevenMoveCommandDefinitions,
  buildCurrentCommandDefinitions,
  createInputHistoryState,
  resolveCommandTrigger,
} from '../src/core/index.ts';

const directionEvent = (direction, frame, order, player = 0) => ({ kind:'direction', action:'press', direction, frame, order, player });
const triggerEvent = (trigger, frame, order, player = 0) => trigger === 'grab'
  ? { kind:'grab', frame, order, player }
  : { kind:'attack', level:trigger, frame, order, player };

function resolveExact(definition, definitions) {
  const directions = definition.directions.map((direction, index) => directionEvent(direction, index * 2, index));
  const triggerFrame = directions.length * 2;
  const state = applyNormalizedInputEvents(createInputHistoryState(0), directions, TARGET_PROVISIONAL_PROFILE);
  return resolveCommandTrigger(
    state,
    triggerEvent(definition.trigger, triggerFrame, directions.length),
    definitions,
    TARGET_PROVISIONAL_PROFILE,
  );
}

const currentDefinitions = buildCurrentCommandDefinitions();
const allDefinitions = buildCore3SevenMoveCommandDefinitions();
assert.equal(currentDefinitions.length, 9);
assert.equal(allDefinitions.length, 21);
assert.deepEqual(currentDefinitions.map((definition) => definition.name), [
  '地走り','昇撃','引き寄せ投げ','二連牙','スライディング','宙返り蹴','地割れ','山掴み','巌の構え',
]);
assert.ok(currentDefinitions.every((definition) => definition.source === 'current_impl'));
assert.equal(allDefinitions.filter((definition) => definition.source === 'current_impl').length, 9);
assert.equal(allDefinitions.filter((definition) => definition.source === 'design_confirmed').length, 12);
assert.ok(currentDefinitions.every((definition) => allDefinitions.some((planned) =>
  planned.id === definition.id
  && planned.name === definition.name
  && planned.trigger === definition.trigger
  && planned.directions.join(',') === definition.directions.join(','),
)));
assert.ok(currentDefinitions.every((definition) => !['砂払い','山越え拳','胴押し','土煙突き','かすみ連打','風切り爪','すり抜け足','つむじ返し','岩砕き','天蓋落とし','根こそぎ','大山押し'].includes(definition.name)));

for (const characterId of ['moguzo','pisuke','godan']) {
  const definitions = buildCore3SevenMoveCommandDefinitions(characterId);
  assert.equal(definitions.length, 7);
  for (const definition of definitions) {
    const result = resolveExact(definition, definitions);
    assert.equal(result.kind, 'command', `${definition.id} should parse`);
    assert.equal(result.match.definition.id, definition.id, `${definition.id} should win its exact input`);
  }
}

const pisuke = buildCore3SevenMoveCommandDefinitions('pisuke');
const whirlwind = pisuke.find((definition) => definition.name === 'つむじ返し');
const twinFang = pisuke.find((definition) => definition.name === '二連牙');
assert.ok(whirlwind && twinFang);
const overlapState = applyNormalizedInputEvents(createInputHistoryState(0), [
  directionEvent('down', 0, 0),
  directionEvent('right', 2, 1),
  directionEvent('right', 4, 2),
], TARGET_PROVISIONAL_PROFILE);
const overlapResult = resolveCommandTrigger(overlapState, triggerEvent('mid', 6, 3), pisuke, TARGET_PROVISIONAL_PROFILE);
assert.equal(overlapResult.kind, 'command');
assert.equal(overlapResult.match.definition.id, whirlwind.id, 'longer ↓→→ must beat suffix →→');

for (const definition of allDefinitions) {
  const characterDefinitions = buildCore3SevenMoveCommandDefinitions(definition.characterId);
  const directions = definition.directions.map((direction, index) => directionEvent(direction, index * 2, index));
  const state = applyNormalizedInputEvents(createInputHistoryState(0), directions, TARGET_PROVISIONAL_PROFILE);
  const wrongTrigger = definition.trigger === 'grab' ? 'mid' : 'grab';
  const result = resolveCommandTrigger(
    state,
    triggerEvent(wrongTrigger, directions.length * 2, directions.length),
    characterDefinitions,
    TARGET_PROVISIONAL_PROFILE,
  );
  assert.equal(result.kind, 'fallback', `${definition.id} wrong trigger must fall back`);
}

const godan = buildCore3SevenMoveCommandDefinitions('godan');
const stance = godan.find((definition) => definition.name === '巌の構え');
assert.ok(stance);
assert.equal(stance.trigger, 'mid');
assert.equal(stance.source, 'current_impl');

console.log('core3 seven-move command tests passed; definitions=21; currentAuthority=9; designConfirmed=12; suffixPriority=ok');
