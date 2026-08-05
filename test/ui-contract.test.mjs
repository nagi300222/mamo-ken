import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  UI_CONTRACT,
  buildPortraitLayout,
  rectanglesOverlap,
  validatePortraitLayout,
  validateUiContract,
} from '../src/core/ui-contract.ts';

validateUiContract();
assert.equal(UI_CONTRACT.roster.length, 8);
assert.deepEqual(UI_CONTRACT.roster.slice(0, 3).map((slot) => slot.characterId), ['moguzo', 'pisuke', 'godan']);
assert.ok(UI_CONTRACT.roster.slice(0, 3).every((slot) => slot.unlocked && slot.status === 'current_impl'));
assert.ok(UI_CONTRACT.roster.slice(3).every((slot) => !slot.unlocked && slot.status === 'planned' && slot.placeholder !== null));
for (const slot of UI_CONTRACT.roster.slice(0, 3)) {
  assert.deepEqual(Object.keys(slot.stats), ['ATK', 'SPD', 'DEF', 'TEC', 'BRK']);
  assert.equal(slot.statsAreIndependentAxes, true);
  assert.equal('TOTAL' in slot.stats, false);
}
assert.deepEqual(UI_CONTRACT.difficulties, ['EASY', 'NORMAL', 'HARD']);
assert.ok(UI_CONTRACT.actions.some((action) => action.id === 'back'));
assert.ok(UI_CONTRACT.actions.some((action) => action.id === 'pause'));
assert.ok(UI_CONTRACT.actions.some((action) => action.id === 'move_list'));
assert.equal(UI_CONTRACT.actions.find((action) => action.id === 'disconnect_request').requiresConfirmation, true);
assert.equal(UI_CONTRACT.onlineDisconnect.confirmationRequired, true);
assert.equal(UI_CONTRACT.ultTextOverlay.bakedIntoSprite, false);

for (const cue of UI_CONTRACT.inputCues) {
  assert.ok(cue.colorToken);
  assert.ok(cue.shapeToken);
  assert.ok(cue.positionToken);
  assert.ok(cue.seToken);
}
assert.deepEqual(UI_CONTRACT.inputCues.filter((cue) => cue.id.startsWith('dir_')).map((cue) => cue.label), ['←', '↓', '→']);
assert.deepEqual(UI_CONTRACT.inputCues.filter((cue) => cue.id.startsWith('attack_')).map((cue) => cue.label), ['上', '中', '下']);

const viewports = [
  [320, 568, 0, 0],
  [360, 640, 24, 16],
  [390, 844, 44, 34],
  [430, 932, 47, 34],
];
for (const [width, height, safeTop, safeBottom] of viewports) {
  const layout = buildPortraitLayout(width, height, safeTop, safeBottom);
  validatePortraitLayout(layout);
  assert.equal(layout.rosterRegions.length, 8);
  assert.equal(layout.battleRegions.filter((region) => region.role === 'direction').length, 3);
  assert.equal(layout.battleRegions.filter((region) => region.role === 'attack').length, 3);
  for (const group of [layout.rosterRegions, layout.battleRegions]) {
    for (let a = 0; a < group.length; a += 1) for (let b = a + 1; b < group.length; b += 1) {
      assert.equal(rectanglesOverlap(group[a].rect, group[b].rect), false, `${width}x${height}: ${group[a].id}/${group[b].id}`);
    }
  }
}
assert.throws(() => buildPortraitLayout(319, 568), /minimum/);
assert.throws(() => validateUiContract({ ...UI_CONTRACT, roster: UI_CONTRACT.roster.slice(0, 7) }), /eight/);
const badCue = UI_CONTRACT.inputCues.map((cue) => cue.id === 'attack_high' ? { ...cue, shapeToken: '' } : cue);
assert.throws(() => validateUiContract({ ...UI_CONTRACT, inputCues: badCue }), /incomplete cue/);

const source = readFileSync(new URL('../src/core/ui-contract.ts', import.meta.url), 'utf8');
for (const forbidden of ['Math.random', 'Date.now', 'localeCompare', 'document.', 'window.', 'setTimeout', 'setInterval']) {
  assert.equal(source.includes(forbidden), false, `forbidden API: ${forbidden}`);
}
console.log(`UI contract tests passed; slots=8; viewports=${viewports.length}; cues=${UI_CONTRACT.inputCues.length}`);
