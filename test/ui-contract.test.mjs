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
assert.equal(UI_CONTRACT.version, 'ui-contract-v3');
assert.equal(UI_CONTRACT.roster.length, 9);
assert.deepEqual(UI_CONTRACT.roster.slice(0, 3).map((slot) => slot.characterId), ['moguzo', 'pisuke', 'godan']);
assert.ok(UI_CONTRACT.roster.slice(0, 3).every((slot) => slot.unlocked && slot.playableNow && slot.offlineTrialPlayable && slot.status === 'current_impl'));
assert.deepEqual(UI_CONTRACT.roster.slice(3).map((slot) => slot.characterId), ['hakuma', 'chirka', 'takimaru', 'yomikage', 'bullet', 'dark_moguzo']);
assert.ok(UI_CONTRACT.roster.slice(3).every((slot) => slot.unlocked && !slot.playableNow && slot.offlineTrialPlayable && slot.status === 'planned' && slot.placeholder === null && slot.trialLabelJa));
assert.deepEqual(UI_CONTRACT.roster.map((slot)=>slot.trialSkeletonSource),['moguzo','pisuke','godan','godan','pisuke','godan','pisuke','pisuke','moguzo']);
for (const slot of UI_CONTRACT.roster.slice(0, 3)) {
  assert.deepEqual(Object.keys(slot.stats), ['ATK', 'SPD', 'DEF', 'TEC', 'BRK']);
  assert.equal(slot.statsAreIndependentAxes, true);
  assert.equal('TOTAL' in slot.stats, false);
}
for(const slot of UI_CONTRACT.roster){
  for(const crop of [slot.faceCrop,slot.heroCrop]){
    assert.ok(crop.anchorX>=0&&crop.anchorX<=1);
    assert.ok(crop.anchorY>=0&&crop.anchorY<=1);
    assert.ok(crop.zoom>=1);
  }
}
const bullet=UI_CONTRACT.roster.find((slot)=>slot.characterId==='bullet');
assert.notEqual(bullet.faceCrop.anchorX,0.5);
assert.ok(bullet.heroCrop.zoom>1.3);
assert.deepEqual(UI_CONTRACT.characterSelect,{
  columns:5,rows:2,rosterEntries:9,totalCells:10,mysteryCellIndex:9,faceCropAnchor:'nose',
  textSeparatedFromArtwork:true,officialPlayableCount:3,offlineTrialPlayableCount:9,onlinePlayableCount:9,
  provisionalSkeletonLabelRequired:true,
});
assert.deepEqual(UI_CONTRACT.difficulties, ['EASY', 'NORMAL', 'HARD']);
assert.ok(UI_CONTRACT.actions.some((action) => action.id === 'back'));
assert.ok(UI_CONTRACT.actions.some((action) => action.id === 'character_detail'));
assert.ok(UI_CONTRACT.actions.some((action) => action.id === 'pause'));
assert.ok(UI_CONTRACT.actions.some((action) => action.id === 'move_list'));
assert.equal(UI_CONTRACT.actions.find((action) => action.id === 'disconnect_request').requiresConfirmation, true);
assert.equal(UI_CONTRACT.onlineDisconnect.confirmationRequired, true);
assert.equal(UI_CONTRACT.ultTextOverlay.bakedIntoSprite, false);
assert.deepEqual(UI_CONTRACT.characterDetail.tabs, ['performance', 'moves', 'combos']);
assert.deepEqual(UI_CONTRACT.characterDetail.tabLabelsJa, { performance: '性能', moves: 'わざ', combos: 'コンボ' });
assert.equal(UI_CONTRACT.characterDetail.returnsTo, 'character_select');
assert.equal(UI_CONTRACT.characterDetail.preservesSelectedCharacter, true);
assert.equal(UI_CONTRACT.characterDetail.allRosterEntriesVisible, true);
assert.equal(UI_CONTRACT.characterDetail.battleAvailabilityUnchanged, true);
assert.equal(UI_CONTRACT.characterDetail.offlineTrialAvailabilityVisible, true);
assert.equal(UI_CONTRACT.characterDetail.comboUnverifiedLabelJa, '未検証');
assert.equal(UI_CONTRACT.characterDetail.scrollStepLogicalPx, 260);
assert.ok(UI_CONTRACT.characterDetail.minimumPrimaryTargetLogicalPx >= 74);

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
  assert.equal(layout.rosterRegions.length, 10);
  assert.equal(layout.rosterRegions.filter((region)=>region.role==='roster_slot').length,9);
  assert.equal(layout.rosterRegions.filter((region)=>region.role==='mystery_slot').length,1);
  assert.equal(layout.rosterRegions[9].id,'roster_mystery');
  assert.equal(layout.battleRegions.filter((region) => region.role === 'direction').length, 3);
  assert.equal(layout.battleRegions.filter((region) => region.role === 'attack').length, 3);
  for (const group of [layout.rosterRegions, layout.battleRegions]) {
    for (let a = 0; a < group.length; a += 1) for (let b = a + 1; b < group.length; b += 1) {
      assert.equal(rectanglesOverlap(group[a].rect, group[b].rect), false, `${width}x${height}: ${group[a].id}/${group[b].id}`);
    }
  }
}
assert.throws(() => buildPortraitLayout(319, 568), /minimum/);
assert.throws(() => validateUiContract({ ...UI_CONTRACT, roster: UI_CONTRACT.roster.slice(0, 8) }), /nine/);
assert.throws(() => validateUiContract({ ...UI_CONTRACT, characterSelect: { ...UI_CONTRACT.characterSelect, columns: 3 } }), /2x5/);
assert.throws(() => validateUiContract({ ...UI_CONTRACT, characterSelect: { ...UI_CONTRACT.characterSelect, offlineTrialPlayableCount: 8 } }), /counts/);
const badCue = UI_CONTRACT.inputCues.map((cue) => cue.id === 'attack_high' ? { ...cue, shapeToken: '' } : cue);
assert.throws(() => validateUiContract({ ...UI_CONTRACT, inputCues: badCue }), /incomplete cue/);
assert.throws(() => validateUiContract({ ...UI_CONTRACT, characterDetail: { ...UI_CONTRACT.characterDetail, tabs: ['performance', 'moves'] } }), /tabs/);
assert.throws(() => validateUiContract({ ...UI_CONTRACT, characterDetail: { ...UI_CONTRACT.characterDetail, minimumPrimaryTargetLogicalPx: 40 } }), /too small/);

const source = readFileSync(new URL('../src/core/ui-contract.ts', import.meta.url), 'utf8');
for (const forbidden of ['Math.random', 'Date.now', 'localeCompare', 'document.', 'window.', 'setTimeout', 'setInterval']) {
  assert.equal(source.includes(forbidden), false, `forbidden API: ${forbidden}`);
}
console.log(`UI contract tests passed; roster=9; grid=2x5; mystery=1; official=3; offlineTrial=9; detailTabs=${UI_CONTRACT.characterDetail.tabs.length}; viewports=${viewports.length}; cues=${UI_CONTRACT.inputCues.length}`);