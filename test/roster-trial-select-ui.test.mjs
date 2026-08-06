import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const prototype=readFileSync(new URL('../prototype/mamoken_prototype_v01.html',import.meta.url),'utf8');
const dist=readFileSync(new URL('../dist/mamoken_mobile.html',import.meta.url),'utf8');
const patcher=readFileSync(new URL('../tools/apply_t28_roster_trial_select_ui.mjs',import.meta.url),'utf8');

for(const source of [prototype,dist]){
  assert.equal((source.match(/\/\* T28 roster trial select UI \*\//g)||[]).length,1);
  assert.ok(source.includes('const OFFICIAL_CHARACTER_COUNT=3'));
  assert.ok(source.includes('const SELECT_SLOTS=10'));
  assert.ok(source.includes('const cols=5,s=96,gapX=6,gapY=6'));
  assert.ok(source.includes("if(i>=ROSTER.length){sfx('guard');return;}"));
  assert.ok(source.includes("txt('?',r.x+r.w/2"));
  assert.ok(source.includes("txt('未定'"));
  assert.ok(source.includes('function drawRosterCrop('));
  assert.ok(source.includes('鼻/胴体アンカー中心のクロップ'));
  assert.ok(source.includes("drawRosterCrop('roster_'+entry.id"));
  assert.ok(source.includes("drawRosterCrop('roster_'+c.id"));
  assert.ok(source.includes("faceCrop:{x:0.42,y:0.28,z:2.48}"));
  assert.ok(source.includes("heroCrop:{x:0.43,y:0.41,z:1.38}"));
  assert.ok(source.includes("'仮骨格で試運転'"));
  assert.ok(source.includes("'既存性能・共通技のみ / 専用技未実装'"));
  assert.ok(source.includes("'仮骨格テスト：専用コマンド技は未実装'"));
  assert.ok(source.includes("if(p1.c.trial)txt('仮骨格 / 共通技のみ'"));
  assert.ok(source.includes("if(p2.c.trial)txt('仮骨格 / 共通技のみ'"));
  assert.ok(source.includes('if(!selected.trialPlayable)'));
  assert.ok(source.includes('game.p1=selected.combatIndex'));
  assert.ok(source.includes('Math.random()*CHARS.length'));
  assert.ok(source.includes("for(const sid of ['moguzo','pisuke','godan'])"));
  assert.ok(source.includes('const sid=skeletonIdOf(f.c),sp=SPRITES[sid]'));
  assert.ok(source.includes('const scale=spriteScale(f.c)'));
  assert.ok(source.includes('function commandMovesFor(c){return BAL.CMD.moves[c.id]||[];}'));
  assert.ok(source.includes('const moves=commandMovesFor(me.c)'));
  assert.ok(source.includes('const moves=commandMovesFor(myF.c)'));
  assert.ok(source.includes('if(f.c.trial)return legacyCm'));
  assert.ok(source.includes('if(f.c.trial)return;'));
  assert.ok(source.includes("for(let i=0;i<3;i++){\n    const R2=selRect(i)"),'online roster must remain official three');
  assert.equal(source.includes("for(const c of CHARS)loadImg('face_'"),false,'planned characters must not request missing face UI assets');
  assert.equal(source.includes("for(const c of CHARS){\n  SPRITES[c.id]"),false,'planned characters must not request missing sprite banks');
  assert.equal(source.includes('BAL.CMD.moves[f.c.id]'),false,'trial command lookup must fail closed through helper');
  assert.equal(source.includes('BAL.CMD.moves[me.c.id]'),false,'trial CPU command lookup must fail closed through helper');
  assert.equal(source.includes('BAL.CMD.moves[myF.c.id]'),false,'trial move list command lookup must fail closed through helper');
}

const charsStart=prototype.indexOf('const CHARS=['),charsEnd=prototype.indexOf('/* T20 full roster art select */',charsStart);
const charsBlock=prototype.slice(charsStart,charsEnd);
assert.equal((charsBlock.match(/id:'/g)||[]).length,9);
assert.equal((charsBlock.match(/trial:true/g)||[]).length,6);
assert.equal((charsBlock.match(/trial:false/g)||[]).length,3);
assert.deepEqual([...charsBlock.matchAll(/id:'([^']+)'[\s\S]*?skeletonId:'([^']+)'/g)].map((match)=>[match[1],match[2]]),[
  ['moguzo','moguzo'],['pisuke','pisuke'],['godan','godan'],['hakuma','godan'],['chirka','pisuke'],
  ['takimaru','godan'],['yomikage','pisuke'],['bullet','pisuke'],['dark_moguzo','moguzo'],
]);

const renderStart=prototype.indexOf('function rSelect(){'),renderEnd=prototype.indexOf('function rCharacterDetail(){',renderStart);
const selectRender=prototype.slice(renderStart,renderEnd);
assert.equal(selectRender.includes('drawStanding('),false,'selection UI must not size icons or hero art from full-body/tail bounds');
assert.ok(selectRender.includes('const hero={x:18,y:34,w:184,h:218},info={x:214,y:34,w:308,h:218}'));
assert.ok(selectRender.includes("txt(c.name,info.x+18"),'name must be in the dedicated info panel');
assert.ok(selectRender.includes("txt(c.type,info.x+18"),'style must be in the dedicated info panel');
assert.ok(selectRender.includes("drawRosterCrop('roster_'+c.id,hero.x+6"),'hero art must stay in its own card');

const slotRects=[];
for(let i=0;i<10;i++){
  const cols=5,s=96,gapX=6,gapY=6,totalW=cols*s+(cols-1)*gapX,x0=(540-totalW)/2,y0=270;
  const col=i%cols,row=Math.floor(i/cols);
  slotRects.push({x:x0+col*(s+gapX),y:y0+row*(s+gapY),w:s,h:s});
}
const controls=[
  {id:'detail',x:18,y:478,w:504,h:72},
  {id:'diff0',x:22,y:590,w:160,h:48},
  {id:'diff1',x:190,y:590,w:160,h:48},
  {id:'diff2',x:358,y:590,w:160,h:48},
  {id:'confirm',x:18,y:660,w:504,h:76},
  {id:'back',x:18,y:758,w:504,h:58},
];
const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
for(let i=0;i<slotRects.length;i++)for(let j=i+1;j<slotRects.length;j++)assert.equal(overlap(slotRects[i],slotRects[j]),false,`slot overlap ${i}/${j}`);
for(const slot of slotRects)for(const control of controls)assert.equal(overlap(slot,control),false,`slot/control overlap ${control.id}`);
for(let i=0;i<controls.length;i++)for(let j=i+1;j<controls.length;j++)assert.equal(overlap(controls[i],controls[j]),false,`control overlap ${controls[i].id}/${controls[j].id}`);
assert.ok(controls.find((item)=>item.id==='detail').h>=70);
assert.ok(controls.find((item)=>item.id==='confirm').h>=74);
assert.ok(controls.find((item)=>item.id==='back').h>=56);

assert.ok(patcher.includes("const MARKER='/* T28 roster trial select UI */'"));
assert.ok(patcher.includes("faceCrop:{x:0.42,y:0.28,z:2.48}"));
assert.ok(patcher.includes('const SELECT_SLOTS=10'));
assert.ok(patcher.includes('const cols=5,s=96'));

console.log('roster trial select UI tests passed; chars=9; official=3; trial=6; grid=2x5; mystery=1; bulletTailCompensated=true; online=3');