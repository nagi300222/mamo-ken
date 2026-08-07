import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// pre-existing fix, unrelated to VIS-R1: このテストはT28マーカー導入当時の実装
// (2x5グリッド+ミステリー枠+trial/skeletonId借用)を検証していたが、P1で「全9キャラが
// 自身の実アート・実装を持つ(trial/skeletonId借用は廃止)」設計へ全面的に置き換えられ、
// このテストは追従されていなかった(BAL-R1完了報告 §7.2で確認済みのpre-existing failure)。
// 現行実装(3x3グリッド・ミステリー枠なし・全9キャラ実装済み)を検証する内容へ更新する。

const prototype=readFileSync(new URL('../prototype/mamoken_prototype_v01.html',import.meta.url),'utf8');
const dist=readFileSync(new URL('../dist/mamoken_mobile.html',import.meta.url),'utf8');
const patcher=readFileSync(new URL('../tools/apply_t28_roster_trial_select_ui.mjs',import.meta.url),'utf8');

for(const source of [prototype,dist]){
  assert.equal((source.match(/\/\* T28 roster trial select UI \*\//g)||[]).length,1);
  assert.ok(source.includes('const OFFICIAL_CHARACTER_COUNT=3'));
  assert.ok(source.includes('const SELECT_SLOTS=9'));
  assert.ok(source.includes('const cols=3,gap=6,s=Math.floor((SELECT_GRID_BOX.w-(cols-1)*gap)/cols)'));
  assert.ok(source.includes('function drawRosterCrop('));
  assert.ok(source.includes('鼻/胴体アンカー中心のクロップ'));
  assert.ok(source.includes("drawRosterCrop('roster_'+entry.id"));
  assert.ok(source.includes("drawRosterCrop('roster_'+c.id"));
  assert.ok(source.includes("faceCrop:{x:0.42,y:0.28,z:2.48}"));
  assert.ok(source.includes("heroCrop:{x:0.43,y:0.41,z:1.38}"));
  assert.ok(source.includes('game.p1=selected.combatIndex'));
  assert.ok(source.includes('Math.random()*CHARS.length'));
  assert.ok(source.includes("for(const sid of CHARS.map(function(c){return c.id;}))"),'all 9 characters must load their own sprite banks (trial skeleton borrowing retired)');
  assert.ok(source.includes('const sid=skeletonIdOf(f.c),sp=SPRITES[sid]'));
  assert.ok(source.includes('const scale=spriteScale(f.c)*poseScaleCorrection(f.c,poseId(f))'));
  assert.ok(source.includes('function commandMovesFor(c){return BAL.CMD.moves[c.id]||[];}'));
  assert.ok(source.includes('const moves=commandMovesFor(me.c)'));
  assert.ok(source.includes('const moves=commandMovesFor(myF.c)'));
  assert.ok(source.includes("for(let i=0;i<3;i++){\n    const R2=selRect(i)"),'online roster must remain official three');
  assert.equal(source.includes("for(const c of CHARS)loadImg('face_'"),false,'planned characters must not request missing face UI assets');
  assert.equal(source.includes('if(f.c.trial)'),false,'trial skeleton borrowing must stay fully retired');
  assert.equal(source.includes('selected.trialPlayable'),false,'trial gating must stay fully retired (all 9 are directly selectable)');
}

const charsStart=prototype.indexOf('const CHARS=['),charsEnd=prototype.indexOf('/* T20 full roster art select */',charsStart);
const charsBlock=prototype.slice(charsStart,charsEnd);
assert.equal((charsBlock.match(/id:'/g)||[]).length,9);
assert.equal((charsBlock.match(/trial:/g)||[]).length,0,'trial:true/false fields must stay fully retired');
assert.equal((charsBlock.match(/skeletonId:/g)||[]).length,0,'skeletonId borrowing fields must stay fully retired');

const renderStart=prototype.indexOf('function rSelect(){'),renderEnd=prototype.indexOf('function rCharacterDetail(){',renderStart);
const selectRender=prototype.slice(renderStart,renderEnd);
assert.ok(selectRender.includes('drawHeroArtByHeight('),'left preview must use the face(nose)-anchored height layout (VIS-R1 (2))');
assert.ok(selectRender.includes("drawUiIcon('facesq_'+entry.id"),'grid icons must use the facesq_* square crops');

// 現行レイアウト(SELECT_ART_BOX/SELECT_GRID_BOX/slotRect/SELECT_DETAIL_BTN/diffRect/
// SELECT_CONFIRM_BTN/SELECT_BACK_BTN。W=540,H=960固定なのでこの数値も固定)で
// スロット同士・スロットと各コントロールが重ならないことを確認する
const slotRects=[];
for(let i=0;i<9;i++){
  const cols=3,gap=6,gridBox={x:266,y:40,w:264,h:422},s=Math.floor((gridBox.w-(cols-1)*gap)/cols);
  const totalH=cols*s+(cols-1)*gap,y0=gridBox.y+(gridBox.h-totalH)/2;
  const col=i%cols,row=Math.floor(i/cols);
  slotRects.push({x:gridBox.x+col*(s+gap),y:y0+row*(s+gap),w:s,h:s});
}
const controls=[
  {id:'detail',x:18,y:476,w:504,h:60},
  {id:'diff0',x:22,y:570,w:160,h:46},
  {id:'diff1',x:190,y:570,w:160,h:46},
  {id:'diff2',x:358,y:570,w:160,h:46},
  {id:'confirm',x:18,y:630,w:504,h:68},
  {id:'back',x:18,y:708,w:504,h:50},
];
const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
for(let i=0;i<slotRects.length;i++)for(let j=i+1;j<slotRects.length;j++)assert.equal(overlap(slotRects[i],slotRects[j]),false,`slot overlap ${i}/${j}`);
for(const slot of slotRects)for(const control of controls)assert.equal(overlap(slot,control),false,`slot/control overlap ${control.id}`);
for(let i=0;i<controls.length;i++)for(let j=i+1;j<controls.length;j++)assert.equal(overlap(controls[i],controls[j]),false,`control overlap ${controls[i].id}/${controls[j].id}`);
assert.ok(controls.find((item)=>item.id==='detail').h>=56);
assert.ok(controls.find((item)=>item.id==='confirm').h>=64);
assert.ok(controls.find((item)=>item.id==='back').h>=44);

assert.ok(patcher.includes("const MARKER='/* T28 roster trial select UI */'"));
assert.ok(patcher.includes("faceCrop:{x:0.42,y:0.28,z:2.48}"));

console.log('roster select UI tests passed; chars=9; official=3; grid=3x3; mystery=none; online=3');
