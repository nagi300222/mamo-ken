import test from 'node:test';
import assert from 'node:assert/strict';
import {Battle} from './battle.js';
import {IDS,normalMove} from './balance.js';
import {NORMAL_SLOTS,MOTIFS} from './normal-motifs-v15.js';
import {normalClipTime} from './normal-timing-v151.js';
import {fighterStyle} from './fighter-style.js';
import {cpuInput,CPU_LEVELS} from './cpu.js';
import {createPracticeController} from './practice-mode.js';

export function route(id,distance=.35,face=1,delay=0){
 const g=new Battle(id,'godan');const[p,t]=g.fighters;
 p.x=-face*distance/2;t.x=face*distance/2;p.facing=face;t.facing=-face;
 let stage=0,wait=0;const hits=[],events=[];
 for(let f=0;f<160;f++){
  let input=f===0?{weak:true}:{};
  if((stage===1||stage===3)&&!p.stop){
   if(wait++>=delay){input=stage===1?{strong:true}:{special2:true};stage++;wait=0;}
  }
  g.tick(input,hits.length?{[face===1?'right':'left']:true}:{});
  events.push(...g.events);
  for(const e of g.events)if(e.type==='hit'&&e.slot===1){hits.push(e);if(stage===0)stage=1;else if(stage===2)stage=3;}
 }
 return {g,hits,events};
}
test('54 explicit normal rows are legal, contact timing aligns on the actual startup and freezes with frame',()=>{
 const keys=new Set();
 for(const id of IDS)for(const slot of NORMAL_SLOTS){
  const m=normalMove(id,slot);keys.add(id+'/'+slot);
  for(const k of ['startup','active','recovery','damage','hitstun','blockstun'])assert.ok(Number.isInteger(m[k])&&m[k]>0,id+'/'+slot+':'+k);
  assert.ok(m.blockstun<m.hitstun);
  assert.ok(Math.abs(normalClipTime(id,slot,m.startup,m,2)-MOTIFS[id][slot].contact*2)<1e-12);
  assert.equal(normalClipTime(id,slot,m.startup+m.active+m.recovery,m,2),2);
  let previous=-1;
  for(let f=0;f<=m.startup+m.active+m.recovery;f++){
   const now=normalClipTime(id,slot,f,m,2);assert.ok(now>=previous);previous=now;
  }
 }
 assert.equal(keys.size,54);
});
test('all nine weak → strong → special2 routes are three real unguardable hits in both directions',()=>{
 for(const id of IDS)for(const face of [1,-1]){
  const {hits,events}=route(id,.35,face);
  assert.deepEqual(hits.map(e=>e.comboHits),[1,2,3],id+' '+face);
  assert.equal(events.filter(e=>e.type==='block').length,0,id);
  assert.equal(events.filter(e=>e.type==='cancel').length,2,id);
  assert.ok(hits[1].damage<normalMove(id,'stand_heavy').damage);
 }
});
test('routes fail when out of range or delayed beyond the finite hit-confirm window',()=>{
 for(const id of IDS){
  const reach=normalMove(id,'stand_weak').reach;
  const far=route(id,reach+.18);assert.equal(far.hits.length,0,id+' whiff');
  const late=route(id,.35,1,8);assert.equal(late.events.filter(e=>e.type==='cancel').length,0,id+' late');
 }
});
test('blocked normals cannot turn into invulnerable special2 and repeated weak presses have bounded chains',()=>{
 for(const id of IDS){
  const g=new Battle(id,'godan'),p=g.fighters[0],t=g.fighters[1];p.x=-.18;t.x=.18;
  let first=false,cancels=[];
  for(let f=0;f<90;f++){
   g.tick(f===0?{weak:true}:first?{special2:f%2===0}:{},{right:true});
   if(g.events.some(e=>e.type==='block'))first=true;
   cancels.push(...g.events.filter(e=>e.type==='cancel'));
  }
  assert.ok(first,id);assert.equal(cancels.length,0,id);
  const chain=new Battle(id,'godan');const[a,b]=chain.fighters;a.x=-.17;b.x=.17;
  let max=0;
  for(let f=0;f<220;f++){chain.tick({weak:f%2===0},{});max=Math.max(max,a.chainWeakCount);}
  assert.ok(max<=fighterStyle(id).weakChainMax,id+':'+max);
 }
});
test('CPU sees actual fighter elapsed frames, never a nonexistent action.frame or future button',()=>{
 const g=new Battle('godan','moguzo',3),[op,p]=g.fighters;
 op.x=-.2;p.x=.2;g._begin(op,normalMove('godan','stand_heavy'),'stand_heavy');
 assert.equal(op.action.frame,undefined);
 op.frame=0;assert.equal(cpuInput(g,p,op,3).right,undefined);
 op.frame=CPU_LEVELS[3].reactionFrames;
 let guarded=false;
 for(let seed=0;seed<20;seed++){g.cpuSeed=seed;guarded ||= !!cpuInput(g,p,op,3).right;}
 assert.ok(guarded);
});
test('practice explicit guards and reversal use real battle states; separated hits do not inflate combos',()=>{
 const pc=createPracticeController(),g=new Battle('moguzo','godan'),[p,t]=g.fighters;p.x=-.18;t.x=.18;
 pc.setDummy('guard_stand');p.action={level:'low'};assert.equal(pc.dummyInput(g).down,false);
 pc.setDummy('guard_crouch');assert.equal(pc.dummyInput(g).down,true);
 pc.setDummy('reversal');assert.equal(pc.dummyInput(g).weak,true);
 t.stun=3;assert.equal(pc.dummyInput(g).weak,undefined);t.stun=0;p.action=null;
 pc.setDummy('stand');
 for(let f=0;f<90;f++){g.tick(f===0||f===45?{weak:true}:{},pc.dummyInput(g));pc.after(g);}
 assert.equal(pc.stats.hits,1);assert.equal(pc.stats.damage,normalMove('moguzo','stand_weak').damage);
 assert.equal(pc.stats.advantage,3); // measured readiness difference, not a raw formula
});

test('a continuous correct guard blocks canceled normals during blockstun; no false hit through stun',()=>{
 for(const id of IDS){
  const g=new Battle(id,'godan'),[p,t]=g.fighters;p.x=1.40;t.x=1.76;
  let hits=0,blocks=0,max=0;
  for(let f=0;f<360;f++){
   t.guard=100;t.hp=9999;
   const weak=(!p.action||p.comboContact)&&!p.prev.weak;
   g.tick({weak},{right:true});
   hits+=g.events.filter(e=>e.type==='hit').length;
   blocks+=g.events.filter(e=>e.type==='block').length;
   max=Math.max(max,p.chainWeakCount);
  }
  assert.equal(hits,0,id+' converted blockstun to hitstun');
  assert.ok(blocks>1,id);assert.ok(max<=fighterStyle(id).weakChainMax,id);
 }
 const g=new Battle('moguzo','godan');const p=g.fighters[1];
 p.state='block';p.stun=4;p.input={right:true,down:true};
 assert.deepEqual(cpuInput(g,p,g.fighters[0],2),{right:true,down:true});
});

test('air normals demand standing guard and corner pressure cannot create an endless guaranteed weak loop',()=>{
 for(const id of IDS){
  const g=new Battle(id,'godan'),[p,t]=g.fighters;p.x=1.4;t.x=1.76;
  let landed=false,maxHits=0,blocked=0;
  for(let f=0;f<600;f++){
   t.hp=99999;t.guard=100;
   const weak=(!p.action||p.comboContact&&p.stop===0)&&!p.prev.weak;
   g.tick({weak},landed?{right:true}:{});
   if(g.events.some(e=>e.type==='hit'))landed=true;
   maxHits=Math.max(maxHits,p.comboHits);
   blocked+=g.events.filter(e=>e.type==='block').length;
  }
  assert.ok(landed&&blocked>0,id+' never provided a real guard gap');
  assert.ok(maxHits<=fighterStyle(id).weakChainMax,id+' infinite raw link '+maxHits);
  const air=normalMove(id,'air_weak');t.action=null;t.stun=0;t.y=0;t.input={right:true,down:true};
  assert.equal(g._guarding(t,air),false,id+' air blocked crouching');
  t.input.down=false;assert.equal(g._guarding(t,air),true,id+' air failed standing guard');
 }
});
