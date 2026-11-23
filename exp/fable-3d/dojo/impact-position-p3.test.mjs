import test from 'node:test';
import assert from 'node:assert/strict';
import {Battle} from './battle.js';
import {ARENA,specialMove,normalMove} from './balance.js';
import {specialSurfaceAt} from './special-contact-runtime-p3.js';
import {normalReachAt,normalHeightAt} from './normal-contact-runtime-v151.js';

test('mirrored corner hit and guard feedback stays on the rendered normal/special surface throughout hitstop',()=>{
 for(const kind of ['normal','special'])for(const guard of [false,true])for(const facing of [1,-1]){
  const g=new Battle('godan','moguzo'),[p,t]=g.fighters;
  const id=kind==='special'?'s3':'stand_heavy',move=kind==='special'?specialMove('godan',2):normalMove('godan',id);
  t.x=facing>0?ARENA.maxX:ARENA.minX;p.x=t.x-facing*.5092535705939819;p.facing=facing;t.facing=-facing;
  assert.ok(g._begin(p,move,id));
  let event;
  for(let i=0;i<60;i++){
   // A normal's final startup is also exercised inside actual body overlap.
   // Neither its active frame, surface, damage nor hitstop is replaced.
   if(kind==='normal'&&p.frame===move.startup-1)p.x=t.x-facing*.25;
   g.tick({},guard?(facing>0?{right:true}:{left:true}):{});
   event=g.events.find(e=>e.type===(guard?'block':'hit'));if(event)break;
  }
  assert.ok(event,kind+' '+facing+' '+guard+' must contact at the wall');
  assert.equal(p.frame,move.startup);assert.equal(event.feedback.point.space,kind==='special'?'authored-special-surface':'authored-strike-surface');
  const surface=kind==='special'?specialSurfaceAt(p.action,p.frame):{reach:normalReachAt(p.action,p.frame),height:normalHeightAt(p.action,p.frame)},point=event.feedback.point,root=p.x,targetRoot=t.x,poseFrame=p.frame,hold=p.stop;
  assert.ok(Math.abs(point.x-(root+facing*surface.reach))<1e-9,'impact must use the post-separation rendered root');
  assert.ok(Math.abs(point.y-(p.y+surface.height))<1e-9);
  for(let i=0;i<hold;i++){
   g.tick({},guard?(facing>0?{right:true}:{left:true}):{});
   assert.equal(p.x,root,'attacker root moved while the impact pose was stopped');
   assert.equal(t.x,targetRoot,'defender root moved while the impact pose was stopped');
   assert.equal(p.frame,poseFrame);assert.equal(p.stop,hold-i-1);
   assert.ok(Math.abs(point.x-(p.x+facing*surface.reach))<1e-9);
  }
 }
});

test('a real projectile impact keeps its independent world point at a separating wall',()=>{
 for(const facing of [1,-1]){
  const g=new Battle('pisuke','moguzo'),[p,t]=g.fighters;
  t.x=facing>0?ARENA.maxX:ARENA.minX;p.x=t.x-facing*.20;p.facing=facing;t.facing=-facing;
  const start=t.x-facing*.12,speed=.025,height=.31;
  g.projectiles.push({id:1,owner:0,x:start,y:height,speed,face:facing,life:60,damage:30,level:'mid',sourceCharacterId:'pisuke',sourceMoveId:'s1'});
  g.tick({},{});const event=g.events.find(e=>e.type==='hit');
  assert.ok(event);assert.notEqual(p.x,t.x-facing*.20,'must exercise actual overlap separation');
  assert.deepEqual(event.feedback.point,{x:start+facing*speed,y:height,space:'projectile-contact'});
 }
});

test('both authored impacts follow their final roots in a real mirrored weak trade',()=>{
 for(const facing of [1,-1]){
  const g=new Battle('moguzo','moguzo'),[a,b]=g.fighters;
  a.x=-facing*.17;b.x=facing*.17;a.facing=facing;b.facing=-facing;
  for(const p of [a,b])assert.ok(g._begin(p,normalMove(p.id,'stand_weak'),'stand_weak'));
  const moves=g.fighters.map(p=>p.action);let hits=[];
  for(let i=0;i<30;i++){g.tick({},{});hits=g.events.filter(e=>e.type==='hit');if(hits.length)break;}
  assert.equal(hits.length,2,'both real attacks must trade');
  for(const event of hits){
   const p=g.fighters[event.attacker],move=moves[event.attacker];
   assert.ok(event.damage>0);assert.equal(event.feedback.point.space,'authored-strike-surface');
   assert.ok(Math.abs(event.feedback.point.x-(p.x+p.facing*normalReachAt(move,move.startup)))<1e-9,'later trade damage must not leave the first impact behind');
  }
 }
});

test('a later projectile can move the hitter without moving its independent projectile point',()=>{
 for(const facing of [1,-1]){
  const g=new Battle('moguzo','pisuke'),[a,b]=g.fighters;
  a.x=-facing*.17;b.x=facing*.17;a.facing=facing;b.facing=-facing;
  assert.ok(g._begin(a,normalMove(a.id,'stand_weak'),'stand_weak'));const move=a.action;
  while(a.frame<move.startup-1)g.tick({},{});
  const projectileX=a.x,projectileY=.30;
  g.projectiles.push({id:1,owner:1,x:projectileX,y:projectileY,speed:0,face:-facing,life:60,damage:30,level:'mid',sourceCharacterId:'pisuke',sourceMoveId:'s1'});
  g.tick({},{});const hits=g.events.filter(e=>e.type==='hit'),strike=hits.find(e=>e.attacker===0),projectile=hits.find(e=>e.attacker===1);
  assert.equal(hits.length,2);assert.ok(strike&&projectile);
  assert.ok(Math.abs(strike.feedback.point.x-(a.x+facing*normalReachAt(move,move.startup)))<1e-9);
  assert.deepEqual(projectile.feedback.point,{x:projectileX,y:projectileY,space:'projectile-contact'});
 }
});
