import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  CORE3_SEVEN_MOVE_PLAN,
  CORE3_SEVEN_MOVE_PLAN_VERSION,
  buildCore3SevenMoveCommandDefinitions,
  exportCore3SevenMovePlan,
  hashCore3SevenMovePlan,
  validateCore3SevenMovePlan,
} from '../src/core/core3-seven-move-plan.ts';

validateCore3SevenMovePlan();
assert.equal(CORE3_SEVEN_MOVE_PLAN_VERSION, 'core3-seven-move-plan-v1');
assert.equal(CORE3_SEVEN_MOVE_PLAN.length, 21);
assert.equal(CORE3_SEVEN_MOVE_PLAN.filter((entry) => entry.runtimeConnection === 'current_runtime').length, 9);
assert.equal(CORE3_SEVEN_MOVE_PLAN.filter((entry) => entry.runtimeConnection === 'not_connected').length, 12);
assert.equal(CORE3_SEVEN_MOVE_PLAN.filter((entry) => entry.balanceStatus === 'current_audited').length, 9);
assert.equal(CORE3_SEVEN_MOVE_PLAN.filter((entry) => entry.balanceStatus === 'bal_undecided').length, 12);
assert.ok(CORE3_SEVEN_MOVE_PLAN.filter((entry) => entry.runtimeConnection === 'current_runtime').every((entry) => entry.currentAudit !== null));
assert.ok(CORE3_SEVEN_MOVE_PLAN.filter((entry) => entry.runtimeConnection === 'not_connected').every((entry) => entry.currentAudit === null));

const expectedNames = [
  '地走り','昇撃','引き寄せ投げ','砂払い','山越え拳','胴押し','土煙突き',
  '二連牙','スライディング','宙返り蹴','かすみ連打','風切り爪','すり抜け足','つむじ返し',
  '地割れ','山掴み','巌の構え','岩砕き','天蓋落とし','根こそぎ','大山押し',
];
assert.deepEqual(CORE3_SEVEN_MOVE_PLAN.map((entry) => entry.nameJa), expectedNames);
assert.deepEqual(CORE3_SEVEN_MOVE_PLAN.map((entry) => entry.id), [
  'moguzo.cmd1','moguzo.cmd2','moguzo.cmd3','moguzo.cmd4','moguzo.cmd5','moguzo.cmd6','moguzo.cmd7',
  'pisuke.cmd1','pisuke.cmd2','pisuke.cmd3','pisuke.cmd4','pisuke.cmd5','pisuke.cmd6','pisuke.cmd7',
  'godan.cmd1','godan.cmd2','godan.cmd3','godan.cmd4','godan.cmd5','godan.cmd6','godan.cmd7',
]);
for (const entry of CORE3_SEVEN_MOVE_PLAN.filter((move) => move.reach === 3)) {
  assert.ok(entry.balanceConstraints.length >= 2, `Reach 3 constraint missing: ${entry.id}`);
}

const definitions = buildCore3SevenMoveCommandDefinitions();
assert.equal(definitions.length, 21);
assert.equal(definitions.filter((definition) => definition.source === 'current_impl').length, 9);
assert.equal(definitions.filter((definition) => definition.source === 'design_confirmed').length, 12);
assert.deepEqual(definitions.map((definition) => definition.name), expectedNames);
for (const characterId of ['moguzo','pisuke','godan']) {
  const filtered = buildCore3SevenMoveCommandDefinitions(characterId);
  assert.equal(filtered.length, 7);
  assert.ok(filtered.every((definition) => definition.characterId === characterId));
  assert.deepEqual(filtered.map((definition) => definition.definitionOrder), [0,1,2,3,4,5,6]);
}

const exportA = exportCore3SevenMovePlan();
const exportB = exportCore3SevenMovePlan();
assert.equal(exportA, exportB);
assert.equal(JSON.parse(exportA).entries.length, 21);
const hashA = hashCore3SevenMovePlan();
const hashB = hashCore3SevenMovePlan();
assert.equal(hashA, hashB);
assert.match(hashA, /^[0-9a-f]{8}$/);

const invented = structuredClone(CORE3_SEVEN_MOVE_PLAN);
invented.find((entry) => entry.id === 'moguzo.cmd4').currentAudit = { type:'atk', level:'low', damage:99, startupF:1, activeF:1, recoveryF:1 };
assert.throws(() => validateCore3SevenMovePlan(invented), /must not contain runtime BAL/);
const connected = structuredClone(CORE3_SEVEN_MOVE_PLAN);
connected.find((entry) => entry.id === 'pisuke.cmd4').runtimeConnection = 'current_runtime';
assert.throws(() => validateCore3SevenMovePlan(connected), /invalid current runtime|exactly nine/);
const missingConstraint = structuredClone(CORE3_SEVEN_MOVE_PLAN);
missingConstraint.find((entry) => entry.id === 'godan.cmd1').balanceConstraints = [];
assert.throws(() => validateCore3SevenMovePlan(missingConstraint), /Reach 3 constraints missing/);

const source = readFileSync(new URL('../src/core/core3-seven-move-plan.ts', import.meta.url), 'utf8');
for (const forbidden of ['Math.random', 'Date.now', 'performance.now', 'document.', 'window.', 'fetch(', 'localStorage']) {
  assert.equal(source.includes(forbidden), false, `forbidden plan API: ${forbidden}`);
}
console.log(`core3 seven-move plan tests passed; entries=21; current=9; unconnected=12; hash=${hashA}`);
