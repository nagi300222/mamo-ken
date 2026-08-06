import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { FULL_ROSTER, validateFullRoster } from '../src/core/roster-full.ts';
import { FULL_ROSTER_IDS, PLANNED_CHARACTER_IDS } from '../src/core/constants.ts';

const __dirname=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(__dirname,'..');
const EXPECTED=['moguzo','pisuke','godan','hakuma','chirka','takimaru','yomikage','bullet','dark_moguzo'];
const ids=EXPECTED;

validateFullRoster();
assert.deepEqual(FULL_ROSTER.map((character)=>character.id),EXPECTED);
assert.deepEqual([...FULL_ROSTER_IDS],EXPECTED);
assert.deepEqual([...PLANNED_CHARACTER_IDS],['hakuma','chirka','takimaru','yomikage','bullet']);
assert.deepEqual(FULL_ROSTER.filter((character)=>character.playableNow).map((character)=>character.id),['moguzo','pisuke','godan']);
assert.equal(FULL_ROSTER.find((character)=>character.id==='dark_moguzo').combatStatus,'another_planned');
assert.equal(FULL_ROSTER.find((character)=>character.id==='dark_moguzo').heightRatio,1);
assert.equal(FULL_ROSTER.find((character)=>character.id==='dark_moguzo').widthRatio,1);
assert.equal(FULL_ROSTER.find((character)=>character.id==='pisuke').heightRatio,null);
assert.equal(FULL_ROSTER.find((character)=>character.id==='pisuke').selectionDisplayScale,1.04);
assert.equal(FULL_ROSTER.find((character)=>character.id==='godan').selectionDisplayScale,1.08);

for(const character of FULL_ROSTER){
  const asset=path.join(ROOT,character.selectionAssetPath);
  assert.equal(existsSync(asset),true,`missing roster art: ${character.id}`);
  const metadata=await sharp(asset).metadata();
  assert.equal(metadata.format,'webp');
  assert.equal(metadata.width,256);
  assert.equal(metadata.height,256);
  assert.equal(metadata.hasAlpha,true);
}

const prototype=readFileSync(path.join(ROOT,'prototype','mamoken_prototype_v01.html'),'utf8');
const dist=readFileSync(path.join(ROOT,'dist','mamoken_mobile.html'),'utf8');
const build=readFileSync(path.join(ROOT,'tools','build_mobile.mjs'),'utf8');
const patcher=readFileSync(path.join(ROOT,'tools','apply_t20_full_roster_art_select.mjs'),'utf8');

for(const source of [prototype,dist]){
  assert.equal((source.match(/\/\* T20 full roster art select \*\//g)||[]).length,1);
  assert.ok(source.includes('const SELECT_SLOTS=ROSTER.length'));
  assert.ok(source.includes('const cols=3,s=88'));
  assert.ok(source.includes('const selected=ROSTER[selCharIdx]'));
  assert.ok(source.includes('300*c.displayScale'));
  assert.ok(source.includes('(r.h+10)*entry.displayScale'));
  assert.ok(source.includes('function loadImg(key,src,preserveWhite)'));
  assert.ok(source.includes('if(!preserveWhite)whitenAsset(e)'));
  assert.ok(source.includes('if(!selected.playable)'));
  assert.ok(source.includes("'閲覧のみ：2D・技 実装待ち'"));
  assert.ok(source.includes("for(let i=0;i<3;i++){\n    const R2=selRect(i)"),'online select must stay current-three only');
  for(const id of EXPECTED)assert.ok(source.includes(`id:'${id}'`),`missing roster id in runtime: ${id}`);
}
for(const id of ids)assert.ok(prototype.includes(`loadImg('roster_${id}','../assets/roster3d/${id}.webp',true)`));
assert.ok(build.includes("top === 'roster3d'"));
assert.ok(patcher.includes("const MARKER='/* T20 full roster art select */'"));
for(const id of ids){
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

console.log(`full roster art tests passed; roster=${FULL_ROSTER.length}; playable=3; previewOnly=6; assets=9x256`);
