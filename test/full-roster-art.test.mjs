import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { FULL_ROSTER, OFFLINE_TRIAL_ROSTER_IDS, validateFullRoster } from '../src/core/roster-full.ts';
import { FULL_ROSTER_IDS, PLANNED_CHARACTER_IDS } from '../src/core/constants.ts';

const __dirname=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(__dirname,'..');
const EXPECTED=['moguzo','pisuke','godan','hakuma','chirka','takimaru','yomikage','bullet','dark_moguzo'];

validateFullRoster();
assert.deepEqual(FULL_ROSTER.map((character)=>character.id),EXPECTED);
assert.deepEqual([...FULL_ROSTER_IDS],EXPECTED);
assert.deepEqual([...OFFLINE_TRIAL_ROSTER_IDS],EXPECTED);
assert.deepEqual([...PLANNED_CHARACTER_IDS],['hakuma','chirka','takimaru','yomikage','bullet']);
assert.deepEqual(FULL_ROSTER.filter((character)=>character.playableNow).map((character)=>character.id),['moguzo','pisuke','godan']);
assert.equal(FULL_ROSTER.filter((character)=>character.offlineTrialPlayable).length,9);
assert.deepEqual(FULL_ROSTER.map((character)=>character.trialSkeletonSource),['moguzo','pisuke','godan','godan','pisuke','godan','pisuke','pisuke','moguzo']);
assert.ok(FULL_ROSTER.slice(3).every((character)=>character.trialLabelJa));
assert.equal(FULL_ROSTER.find((character)=>character.id==='dark_moguzo').combatStatus,'another_planned');
assert.equal(FULL_ROSTER.find((character)=>character.id==='dark_moguzo').heightRatio,1);
assert.equal(FULL_ROSTER.find((character)=>character.id==='dark_moguzo').widthRatio,1);
assert.equal(FULL_ROSTER.find((character)=>character.id==='pisuke').heightRatio,null);
assert.equal(FULL_ROSTER.find((character)=>character.id==='pisuke').selectionDisplayScale,1.04);
assert.equal(FULL_ROSTER.find((character)=>character.id==='godan').selectionDisplayScale,1.08);
const bullet=FULL_ROSTER.find((character)=>character.id==='bullet');
assert.notEqual(bullet.selectionFaceCrop.anchorX,0.5);
assert.ok(bullet.selectionHeroCrop.zoom>1.3);
assert.ok(bullet.notes.some((note)=>note.includes('尾を除外')));

for(const character of FULL_ROSTER){
  const asset=path.join(ROOT,character.selectionAssetPath);
  assert.equal(existsSync(asset),true,`missing roster art: ${character.id}`);
  const metadata=await sharp(asset).metadata();
  assert.equal(metadata.format,'webp');
  assert.equal(metadata.width,256);
  assert.equal(metadata.height,256);
  assert.equal(metadata.hasAlpha,true);
  for(const crop of [character.selectionFaceCrop,character.selectionHeroCrop]){
    assert.ok(crop.anchorX>=0&&crop.anchorX<=1);
    assert.ok(crop.anchorY>=0&&crop.anchorY<=1);
    assert.ok(crop.zoom>=1);
  }
}

const prototype=readFileSync(path.join(ROOT,'prototype','mamoken_prototype_v01.html'),'utf8');
const dist=readFileSync(path.join(ROOT,'dist','mamoken_mobile.html'),'utf8');
const build=readFileSync(path.join(ROOT,'tools','build_mobile.mjs'),'utf8');
const t20Patcher=readFileSync(path.join(ROOT,'tools','apply_t20_full_roster_art_select.mjs'),'utf8');
const t28Patcher=readFileSync(path.join(ROOT,'tools','apply_t28_roster_trial_select_ui.mjs'),'utf8');

// pre-existing fix, unrelated to VIS-R1: このループの一部assertionはT28マーカー導入当時の
// 実装(10枠グリッド+ミステリー枠+trial/skeletonId借用)を検証していたが、P1で「全9キャラが
// 自身の実アート・実装を持つ(trial/skeletonId借用は廃止)」設計へ全面的に置き換えられ、
// このテストは追従されていなかった(BAL-R1完了報告 §7.2で確認済みのpre-existing failure)。
// 現行実装(9枠・ミステリー枠なし・全9キャラ実装済み)を検証する内容へ更新する。
for(const source of [prototype,dist]){
  assert.equal((source.match(/\/\* T20 full roster art select \*\//g)||[]).length,1);
  assert.equal((source.match(/\/\* T28 roster trial select UI \*\//g)||[]).length,1);
  assert.ok(source.includes('const SELECT_SLOTS=9'));
  assert.ok(source.includes('const cols=3,gap=6,s=Math.floor((SELECT_GRID_BOX.w-(cols-1)*gap)/cols)'));
  assert.ok(source.includes('function drawRosterCrop('));
  assert.ok(source.includes("faceCrop:{x:0.42,y:0.28,z:2.48}"));
  assert.ok(source.includes("heroCrop:{x:0.43,y:0.41,z:1.38}"));
  assert.ok(source.includes('function loadImg(key,src,preserveWhite)'));
  assert.ok(source.includes('if(!preserveWhite)whitenAsset(e)'));
  assert.ok(source.includes('game.p1=selected.combatIndex'));
  assert.ok(source.includes("for(let i=0;i<3;i++){\n    const R2=selRect(i)"),'online select must stay current-three only');
  assert.ok(source.includes("for(const sid of CHARS.map(function(c){return c.id;}))"),'all 9 characters must load their own sprite banks (trial skeleton borrowing retired)');
  assert.equal(source.includes('selected.trialPlayable'),false,'trial gating must stay fully retired (all 9 are directly selectable)');
  assert.ok(source.includes('function skeletonIdOf(c)'));
  assert.ok(source.includes('function commandMovesFor(c)'));
  for(const id of EXPECTED)assert.ok(source.includes(`id:'${id}'`),`missing roster id in runtime: ${id}`);
}
for(const id of EXPECTED)assert.ok(prototype.includes(`loadImg('roster_${id}','../assets/roster3d/${id}.webp',true)`));
assert.ok(build.includes("top === 'roster3d'"));
assert.ok(t20Patcher.includes("const MARKER='/* T20 full roster art select */'"));
assert.ok(t28Patcher.includes("const MARKER='/* T28 roster trial select UI */'"));
for(const id of EXPECTED){
  assert.ok(dist.includes(`loadImg('roster_${id}','../assets/roster3d/${id}.webp',true)`));
  assert.ok(dist.includes(`\"../assets/roster3d/${id}.webp\":\"data:image/webp;base64,`));
}
assert.equal((prototype.match(/const CHARS=\[/g)||[]).length,1);
assert.equal((prototype.match(/const ROSTER=\[/g)||[]).length,1);

const design=readFileSync(path.join(ROOT,'design','MAMOKEN_CHARACTER_DESIGN_v1.0.md'),'utf8');
const artProgress=readFileSync(path.join(ROOT,'design','MAMOKEN_CHARACTER_ART_PROGRESS_2026-08-06.md'),'utf8');
const resume=readFileSync(path.join(ROOT,'design','2D_ART_RESUME_PLAN_2026-08-06.md'),'utf8');
assert.ok(design.includes('通常8キャラ＋アナザー1キャラ'));
assert.ok(design.includes('ダークモグゾー'));
assert.ok(artProgress.includes('今回チャットへ添付された9画像を見た目正本として優先'));
assert.ok(artProgress.includes('handDigits = 4'));
assert.ok(artProgress.includes('footToes = 4'));
assert.ok(resume.includes('画像生成停止中'));
assert.ok(resume.includes('既存画像のみ'));
assert.ok(resume.includes('ピスケ'));
assert.ok(resume.includes('ダークモグゾー'));
assert.ok(resume.includes('再開順'));

console.log(`full roster art tests passed; roster=${FULL_ROSTER.length}; official=3; offlineTrial=9; grid=3x3; assets=9x256`);