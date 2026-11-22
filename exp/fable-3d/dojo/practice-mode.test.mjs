import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createPracticeController,DUMMY_MODES} from './practice-mode.js';
import {Battle} from './battle.js';
import {FPS,ARENA,ROSTER} from './balance.js';
test('practice dummy stop / guard low / CPU all work',()=>{
 const p=createPracticeController(),g=new Battle('moguzo','godan');
 assert.deepEqual(DUMMY_MODES,['stand','guard','guard_stand','guard_crouch','reversal','cpu']);
 assert.deepEqual(p.dummyInput(g),{});
 p.setDummy('guard');assert.deepEqual(p.dummyInput(g),{right:true,down:false});
 g.fighters[0].action={level:'low'};assert.deepEqual(p.dummyInput(g),{right:true,down:true});
 g.fighters[1].facing=1;assert.deepEqual(p.dummyInput(g),{left:true,down:true});
 p.setDummy('cpu');assert.equal(p.dummyInput(g),null);
 assert.throws(()=>p.setDummy('missing'),/invalid dummy/);
});
test('HP, drive, super and timer refill but hitstun and events remain',()=>{
 const p=createPracticeController(),g=new Battle('pisuke','godan');
 g.time=3;g.fighters[0].hp=1;g.fighters[1].hp=1;g.fighters[1].stun=14;
 p.prepare(g);assert.equal(g.time,FPS*ARENA.roundSeconds);
 assert.equal(g.fighters[0].hp,ROSTER.pisuke.hp);
 assert.equal(g.fighters[1].stun,14);
 g.frame=12;g.events=[{type:'hit',slot:1,damage:70,comboHits:1}];p.after(g);
 assert.deepEqual(p.stats,{hits:1,damage:70,lastDamage:70,advantage:null});
 g.frame=22;g.events=[{type:'hit',slot:1,damage:23,comboHits:2}];p.after(g);
 assert.deepEqual(p.stats,{hits:2,damage:93,lastDamage:23,advantage:null});
 g.phase='ko';g.winner=0;g.fighters[1].ko=true;g.frame=100;
 g.events=[{type:'hit',slot:1,damage:20,comboHits:1}];p.after(g);
 assert.equal(g.phase,'fight');assert.equal(g.fighters[1].ko,false);
 assert.deepEqual(p.stats,{hits:1,damage:20,lastDamage:20,advantage:null});
});
test('reset positions without GLB reload and preserve Bullet tail source',()=>{
 const p=createPracticeController(),g=new Battle('bullet','chirka');
 g.setTailTipPath([[0,.1],[24,.65]]);
 p.setDummy('guard');g.fighters[0].x=1.2;g.fighters[0].hp=1;
 const n=p.reset(g);assert.notEqual(n,g);
 assert.deepEqual(n.fighters.map(x=>x.id),['bullet','chirka']);
 assert.equal(n._tailAt(24),.65);assert.equal(n.fighters[0].x,-.7);
 assert.equal(n.fighters[0].super,100);assert.equal(p.dummy,'guard');
});
test('HUD + mode wiring keep original right-side six buttons',()=>{
 const h=readFileSync(new URL('./index.html',import.meta.url),'utf8');
 const m=readFileSync(new URL('./main.js',import.meta.url),'utf8');
 const b=readFileSync(new URL('./build-pages.mjs',import.meta.url),'utf8');
 for(const id of ['match-mode','practice-panel','practice-dummy','practice-reset','practice-hits','practice-damage']){
   assert.ok(h.includes('id="'+id+'"'),id);
 }
 for(const fn of ['practice.prepare(battle)','practice.dummyInput(battle)','practice.after(battle)'])
   assert.ok(m.includes(fn),fn);
 assert.match(b,/practice-mode\.js/);
 assert.deepEqual([...h.split('id="buttons-rail"')[1].matchAll(/data-control="([^"]+)"/g)].map(x=>x[1]),
 ['weak','strong','throw','gyuiin','special','ultimateButton']);
});
