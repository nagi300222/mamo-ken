import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Battle} from './battle.js';
import {IDS,specialMove,normalMove,ultimateMove} from './balance.js';
import {specialHitstunP3} from './special-balance-p3.js';
import {probeSpecial} from './p3-special-audit.mjs';
const base=JSON.parse(readFileSync(new URL('../../../docs/mamoken-p3/baseline/MOVE_CATALOG.json',import.meta.url)));
const candidates=base.catalog.filter(row=>row.kind==='special'&&specialHitstunP3(row.characterId,+row.moveId[1]-1)!==undefined);

test('19 near-range specials reward an actual hit while keeping large guard/whiff risks',()=>{
 assert.equal(candidates.length,19);
 for(const row of candidates){
  const index=+row.moveId[1]-1,move=specialMove(row.characterId,index);
  for(const face of [1,-1])for(const timing of ['first','last']){
   const hit=probeSpecial(row.characterId,index,{face,timing}),guard=probeSpecial(row.characterId,index,{face,timing,guard:true});
   assert.equal(hit.outcome,'hit',row.key+' '+face+' '+timing);
   assert.equal(hit.contactActionFrame,move.startup+(timing==='last'?move.active-1:0));
   assert.equal(hit.advantage,move.hitstun-move.active-move.recovery+(timing==='last'?move.active-1:0));
   if(timing==='first')assert.ok(hit.advantage>=-1&&hit.advantage<=2,row.key+' over-rewarded');
   assert.equal(guard.outcome,'block',row.key+' guard');assert.ok(guard.advantage<=-10,row.key+' removed block risk');
   assert.equal(hit.damage,move.damage,row.key+' changed damage');
  }
  const miss=probeSpecial(row.characterId,index,{whiff:true});
  assert.equal(miss.outcome,'whiff');assert.equal(miss.maxStop,0);assert.equal(miss.attackerReady,move.startup+move.active+move.recovery);
 }
});
test('native projectile, paired throw and successful counter timings retain their original rules',()=>{
 for(const row of base.catalog.filter(row=>row.kind==='special'&&!candidates.includes(row))){
  const index=+row.moveId[1]-1,move=specialMove(row.characterId,index);assert.equal(move.hitstun,undefined,row.key);
  const probe=probeSpecial(row.characterId,index);
  if(move.kind==='projectile')assert.ok(probe.advantage<0,row.key+' close projectile became safe');
  if(move.kind==='throw'){assert.equal(probe.outcome,'hit');assert.equal(probe.advantage,40);assert.equal(probe.contactActionFrame,move.startup);}
  if(move.kind==='counter'){assert.equal(probe.outcome,'counter');assert.equal(probe.damage,Math.round(move.damage*.63));assert.equal(probe.maxStop,0);}
 }
});
test('earliest and latest special contact cannot sustain a corner infinite through normal cancels',()=>{
 for(const row of candidates)for(const face of [1,-1])for(const late of [false,true]){
  const g=new Battle(row.characterId,'godan'),[p,t]=g.fighters,index=+row.moveId[1]-1,move=specialMove(row.characterId,index);
  p.x=face*1.42;t.x=face*1.76;p.facing=face;t.facing=-face;g._begin(p,move,row.moveId);
  let landed=false,blocks=0,maxHits=0,contacts=0;
  for(let f=0;f<2000;f++){
   t.hp=999999;t.guard=100;
   if(!landed&&late){t.y=p.frame+1<move.startup+move.active-1?2:0;t.vy=0;}
   const input={};
   if(landed&&!p.stop&&!p.stun){
    if(!p.action&&!p.prev.weak)input.weak=true;
    else if(p.action?.id.endsWith('_weak')&&p.comboContact&&!p.prev.strong)input.strong=true;
    else if(p.action?.id.endsWith('_heavy')&&p.comboContact&&!p.prev['special'+(index+1)])input['special'+(index+1)]=true;
   }
   const back=p.x>=t.x?'left':'right';
   g.tick(input,landed?{[back]:true,down:p.action?.level==='low'}:{});
   for(const event of g.events){if(event.type==='hit'){landed=true;contacts++;maxHits=Math.max(maxHits,event.comboHits??1);}if(event.type==='block')blocks++;}
  }
  assert.ok(landed&&blocks>0,row.key+' '+face+' late='+late+' never provided a real guard return');
  assert.ok(maxHits<=4,row.key+' unlimited guaranteed contacts '+maxHits);
  assert.ok(contacts<=4,row.key+' converted correct continuous guard into more hits '+contacts);
 }
});
test('longer special hitstun never allows ordinary target attacks before stun actually ends',()=>{
 for(const row of candidates){
  const g=new Battle(row.characterId,'pisuke'),[p,t]=g.fighters,move=specialMove(row.characterId,+row.moveId[1]-1);
  p.x=1.42;t.x=1.76;g._begin(p,move,row.moveId);let hit=false,checked=0;
  for(let frame=0;frame<150;frame++){
   const locked=t.stun>0||t.stop>0;
   g.tick({},hit?{weak:true,strong:true,special1:true}:{});
   if(g.events.some(e=>e.type==='hit'))hit=true;
   if(hit&&locked){assert.equal(t.action,null,row.key+' target attacked during stun');checked++;}
  }
  assert.ok(checked>=move.hitstun,row.key);
 }
});
test('ultimate damage and hit-confirm-only signals do not use the normal/special feel adapter',()=>{
 for(const id of IDS){
  const g=new Battle(id,'pisuke'),[p,t]=g.fighters;p.x=-.17;t.x=.17;p.super=100;t.ability.grit=false;
  g._begin(p,ultimateMove(id),'ultimate');let event;
  for(let f=0;f<90;f++){g.tick({},{});event=g.events.find(e=>e.type==='ultimate_hit');if(event)break;}
  assert.ok(event,id);assert.equal(g.events.filter(e=>e.type==='ultimate_hit').length,1);assert.equal(event.feedback,undefined);
 }
});
