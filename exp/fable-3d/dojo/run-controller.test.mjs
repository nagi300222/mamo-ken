import test from 'node:test';
import assert from 'node:assert/strict';
import {RunController,survivalLevel,healFraction,readSurvivalBest} from './run-controller.js';
import {RUN_CPU_LEVELS,runCpuInput} from './run-cpu.js';
import {IDS,ROSTER} from './balance.js';
const end=(run,winner=0,hp=100,reason='ko')=>{const g=run.createBattle();g.phase='ko';g.winner=winner;g.fighters[0].hp=hp;g.events=reason==='timeout'?[{type:'timeout'}]:[];return {g,out:run.finish(g)};};
test('arcade has deterministic seven distinct opponents and correct final for all nine fighters',()=>{
 for(const player of IDS){const a=new RunController({mode:'arcade',player,seed:42}),b=new RunController({mode:'arcade',player,seed:42});assert.deepEqual(a.route,b.route);assert.equal(a.route.length,8);assert.equal(new Set(a.route.slice(0,7).map(e=>e.opponent)).size,7);assert.ok(a.route.slice(0,7).every(e=>e.opponent!==player));assert.equal(a.route[7].opponent,player==='dark_moguzo'?'moguzo':'dark_moguzo');assert.equal(a.route[7].stage,'newmoon');for(let i=1;i<7;i++)assert.notEqual(a.route[i-1].stage,a.route[i].stage);}
});
test('arcade two rounds to win; per-round no victory; match then clear; duplicate callbacks idempotent',()=>{
 const run=new RunController({mode:'arcade',player:'moguzo',seed:1});
 for(let i=0;i<8;i++){
  const first=end(run);assert.equal(first.out.kind,'round');assert.equal(first.out.victory,false);assert.equal(run.finish(first.g),first.out);assert.equal(run.score[0],1);run.advance();
  const second=end(run);assert.equal(second.out.kind,i===7?'clear':'next');assert.equal(second.out.victory,true);if(i<7)run.advance();
 }assert.equal(run.wins,8);assert.equal(run.status,'clear');assert.throws(()=>run.advance());
});
test('arcade loss or draw permits unlimited continue to same stage and opponent, full reset',()=>{
 const run=new RunController({mode:'arcade',player:'godan',seed:5});const original=run.encounter;
 for(let i=0;i<25;i++){
  end(run,-1,0,i%2?'timeout':'ko');assert.equal(run.status,'continue');run.continue();assert.equal(run.continues,i+1);assert.equal(run.encounter.opponent,original.opponent);assert.equal(run.encounter.stage,original.stage);assert.deepEqual(run.score,[0,0]);
 }
 let g=run.createBattle();assert.equal(g.fighters[0].hp,ROSTER.godan.hp);g.phase='ko';g.winner=1;run.finish(g);run.advance();end(run,1,0);assert.equal(run.status,'continue');
});
test('survival boundaries use exact legacy heals and CPU labels without clamping',()=>{
 assert.deepEqual([1,15,16,30,31,45,46,60,61,120].map(survivalLevel),[1,1,3,3,5,5,7,7,9,9]);
 assert.deepEqual([1,15,16,30,31].map(healFraction),[.5,.5,1/3,1/3,.25]);
 const memory=new Map(),storage={getItem:k=>memory.get(k),setItem:(k,v)=>memory.set(k,v)},r=new RunController({mode:'survival',player:'bullet',seed:12,storage});
 let g=r.createBattle();
 for(let wins=1;wins<=110;wins++){
  assert.equal(r.encounter.level,survivalLevel(wins));
  g.phase='ko';g.winner=0;g.fighters[0].hp=100;const out=r.finish(g);assert.equal(out.short,true);assert.equal(r.hp,Math.min(ROSTER.bullet.hp,100+Math.floor(ROSTER.bullet.hp*healFraction(wins))));assert.equal(r.lastHeal,r.hp-100);
  // Poison, combo, gauge, all ability fields and projectiles must not carry.
  Object.assign(g.fighters[0],{super:100,guard:0,poison:90,roarCooldown:42,drive:1});g.fighters[0].ability.charge=3;
  r.advance();const next=r.createBattle();assert.equal(next.fighters[0].hp,r.hp);assert.equal(next.fighters[0].poison,0);assert.equal(next.fighters[0].super,0);assert.equal(next.fighters[0].ability.charge,0);assert.equal(next.fighters[0].roarCooldown,0);assert.equal(next.fighters[0].guard,ROSTER.bullet.guardMax);assert.equal(next.projectiles.length,0);
  g=next;
 }
 assert.equal(readSurvivalBest(storage),110);
});
test('survival blocks have boss last, exclude mirror except dark boss, and never repeat adjacent stages',()=>{
 for(const player of IDS){const r=new RunController({mode:'survival',player,seed:125});for(let fight=1;fight<=105;fight++){const e=r.encounter,size=player==='dark_moguzo'?8:15;assert.equal(e.opponent==='dark_moguzo',fight%size===0);assert.ok(e.opponent!==player||player==='dark_moguzo'&&fight%8===0);if(fight>1)assert.notEqual(e.stage,r.route[r.index-1].stage);end(r);r.advance();}}
});
test('survival loss, timeout draw and double KO end without continue, storage failures are safe',()=>{
 for(const reason of ['timeout','ko']){const r=new RunController({mode:'survival',player:'chirka',storage:{getItem(){throw Error('denied');}}});end(r,-1,0,reason);assert.equal(r.status,'end');assert.equal(r.hp,0);assert.equal(r.lastHeal,0);assert.throws(()=>r.continue());assert.throws(()=>r.advance());}
 assert.equal(readSurvivalBest({getItem:()=>'-3'}),0);assert.equal(readSurvivalBest({getItem:()=>'{broken'}),0);
 const r=new RunController({mode:'survival',player:'moguzo'});end(r,0,ROSTER.moguzo.hp-2);assert.equal(r.lastHeal,2);assert.equal(r.hp,ROSTER.moguzo.hp);
});
test('nine run CPUs produce finite real Battle games',()=>{
 assert.equal(RUN_CPU_LEVELS.length,10);assert.equal(new Set(RUN_CPU_LEVELS.slice(1).map(c=>JSON.stringify(c))).size,9);
 for(let level=1;level<=9;level++){
  const r=new RunController({mode:'arcade',player:'moguzo',level,seed:22}),g=r.createBattle();let actions=0;
  for(let i=0;i<6000&&g.phase==='fight';i++){const input=runCpuInput(g,level);if(input.weak||input.strong||input.special1||input.special2||input.special3)actions++;g.tick({},input);}
  assert.equal(g.phase,'ko');assert.ok(actions>0);assert.ok(g.fighters.every(f=>Number.isFinite(f.hp)&&f.hp>=0));
 }
});
test('run CPU waits for visible startup and preserves chosen guard through blockstun',()=>{
 const r=new RunController({mode:'arcade',player:'moguzo',seed:22}),g=r.createBattle(),[op,p]=g.fighters;
 op.x=-.2;p.x=.2;g.frame=1;op.action={serial:2,kind:'strike',startup:40,active:4,reach:.5,level:'low'};op.frame=0;
 for(let level=1;level<=9;level++){const i=runCpuInput(g,level);assert.equal(i.right,undefined);assert.equal(i.down,undefined);assert.equal(i.stepBack,undefined);}
 op.frame=30;let guards=0;for(let seed=1;seed<=40;seed++){g.cpuSeed=seed;const i=runCpuInput(g,9);if(i.right&&i.down)guards++;}assert.ok(guards>=30);
 p.stun=8;p.state='block';p.input={down:true};assert.deepEqual(runCpuInput(g,1),{right:true,down:true});
});
