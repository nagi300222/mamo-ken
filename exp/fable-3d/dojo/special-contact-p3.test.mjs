import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import {Battle} from './battle.js';import {IDS,specialMove,normalMove,ultimateMove} from './balance.js';
import {NORMAL_HURT_BOUNDS} from './normal-contact-source.js';
import {ACTIVE_P3_SPECIAL_CONTACT_DELIVERY,createP3SpecialContactDelivery,withP3SpecialContact,specialSurfaceAt} from './special-contact-runtime-p3.js';
import {resolveSpecialBone,specialReleaseAnchor} from './special-motion-source.js';
const metadata=JSON.parse(await readFile(new URL('../motion/v17/specials_v17.json',import.meta.url)));
// Deliberately synthetic geometry fixture: validates the adapter and collision
// boundaries, not Claude's surface quality. Browser acceptance measures real GLBs.
function fixture(){const characters={};for(const id of IDS){characters[id]={};for(const [slot,row]of Object.entries(metadata.characters[id])){
 const activeReach=Array.from({length:Math.max(3,row.active)},(_,i)=>({phase:i/(Math.max(3,row.active)-1),reach:.35+i*.005,height:.3+i*.002}));
 characters[id][slot]={clip:row.clip,status:'ok',sampling:'exact-clip-clock',sampledContactSeconds:row.contactSeconds,
  attackLimb:row.attack_limb,reach:.35,height:.3,activeReach,projectileSocket:{forward:.42,height:.29}};
 }}return {source:'runtime-skinned-mesh',sampling:'exact-clip-clock',characters};}
const delivery=()=>createP3SpecialContactDelivery(metadata,fixture());
test('all six release anchors resolve to real original exported bones, including foot.R and tail_03',async()=>{
 let count=0;for(const id of IDS){
  const bytes=await readFile(new URL('../chars/'+id+'/'+id+'.glb',import.meta.url)),doc=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)));
  const bones=doc.nodes.map(n=>({...n,isBone:true})),root={getObjectByName:name=>bones.find(b=>b.name===name),traverse:fn=>bones.forEach(fn)};
  for(const row of Object.values(metadata.characters[id]))if(row.kind==='projectile'){
   const bone=resolveSpecialBone(root,specialReleaseAnchor(row));assert.ok(bone,id+' real release bone absent');count++;
   if(id==='pisuke')assert.equal(bone.name,'foot.R');if(id==='bullet')assert.equal(bone.name,'tail_03');
  }
 }assert.equal(count,6);
});
test('special surface gameplay defaults off and rejects sparse/interpolated data as final',()=>{
 assert.equal(ACTIVE_P3_SPECIAL_CONTACT_DELIVERY,null);
 assert.throws(()=>createP3SpecialContactDelivery(metadata,{source:'runtime-skinned-mesh',characters:{}}),/exact skinned-mesh clock/);
 const bad=fixture();bad.characters.godan.s3.activeReach=[{phase:0,reach:.35,height:.3},{phase:.5,reach:.4,height:.3},{phase:1,reach:.35,height:.3}];
 assert.throws(()=>createP3SpecialContactDelivery(metadata,bad),/missing exact active frame/);
 const late=fixture();late.characters.chirka.s3.sampledContactSeconds+=.03;
 assert.throws(()=>createP3SpecialContactDelivery(metadata,late),/another clock/);
});
test('all 19 candidate melee surfaces apply after custom source resolution without changing timing/damage/cancel',()=>{
 const d=delivery();let count=0;
 for(const id of IDS)for(let i=0;i<3;i++){
  const original=specialMove(id,i),updated=withP3SpecialContact({id},original,'s'+(i+1),d);
  for(const key of ['startup','active','recovery','damage','hitstun','blockstun','cancelOnHit','cancelOnBlock','travel','knockback'])assert.deepEqual(updated[key],original[key]);
  if(['strike','anti','dash','tail'].includes(original.kind)){count++;assert.ok(updated.specialContact);assert.equal(updated.reach,.35);}
  else if(original.kind==='projectile')assert.deepEqual(updated.projectileSocket,{forward:.42,height:.29});
  else assert.equal(updated,original);
 }
 assert.equal(count,19);
 const source={...specialMove('godan',2),sourceCharacterId:'godan',sourceMoveId:'s3'};
 assert.equal(withP3SpecialContact({id:'pisuke',visualRigId:'godan'},source,'s1',d).specialContact.clip,'s3_v17');
});
test('candidate Battle uses actual phase reach, vertical hurt bounds and facing on both sides for all 19 moves',()=>{
 const d=delivery();let cases=0;
 for(const id of IDS)for(let i=0;i<3;i++){
  const move=specialMove(id,i);if(!['strike','anti','dash','tail'].includes(move.kind))continue;
  for(const facing of [1,-1]){
   const g=new Battle(id,'moguzo',1,{specialContactDelivery:d}),[a,t]=g.fighters;assert.ok(g._begin(a,move,'s'+(i+1)));
   a.x=0;a.y=0;a.facing=facing;t.y=0;
   for(let frame=a.action.startup;frame<a.action.startup+a.action.active;frame++){
    a.frame=frame;const point=specialSurfaceAt(a.action,frame);t.x=facing*(point.reach+.159);assert.equal(g._contact(a,t,a.action),true,id+' near surface');
    t.x=facing*(point.reach+.161);assert.equal(g._contact(a,t,a.action),false,id+' beyond surface');
    t.x=-facing*.34;assert.equal(g._contact(a,t,a.action),false,id+' behind');
    t.x=facing*.34;t.y=2;assert.equal(g._contact(a,t,a.action),false,id+' above actual surface');t.y=0;cases++;
   }
   a.frame=a.action.startup-1;assert.equal(g._contact(a,t,a.action),false);
   a.frame=a.action.startup+a.action.active;assert.equal(g._contact(a,t,a.action),false);
  }
 }
 assert.ok(cases>200);
});
test('measured projectile release sockets affect all six native projectiles; custom socket callback takes priority',()=>{
 const d=delivery();let count=0;
 for(const id of IDS)for(let i=0;i<3;i++)if(specialMove(id,i).kind==='projectile'){
  for(const custom of [false,true]){
   const g=new Battle(id,'moguzo',1,{specialContactDelivery:d,...(custom?{projectileOrigin:()=>({forward:.18,height:.48})}:{})}),[a,t]=g.fighters;
   a.x=-1;t.x=1.7;a.facing=1;g._begin(a,specialMove(id,i),'s'+(i+1));a.frame=a.action.startup-1;g._act(a,t);
   assert.equal(g.projectiles[0].x,-1+(custom?.18:.42));assert.equal(g.projectiles[0].y,custom?.48:.29);
  }count++;
 }
 assert.equal(count,6);
});
test('normal/ultimate moves and the paired throw/counter path are unchanged; rematch keeps injected candidate',()=>{
 const d=delivery(),fighter={id:'moguzo'},normal=normalMove('moguzo','stand_weak'),ultimate=ultimateMove('moguzo');
 assert.equal(withP3SpecialContact(fighter,normal,'stand_weak',d),normal);assert.equal(withP3SpecialContact(fighter,ultimate,'ultimate',d),ultimate);
 for(const [id,index]of [['takimaru',2],['yomikage',2]]){const move=specialMove(id,index);assert.equal(withP3SpecialContact({id},move,'s3',d),move);}
 const g=new Battle('godan','moguzo',1,{specialContactDelivery:d});assert.equal(g.again().specialContactDelivery,d);
 const [a,t]=g.fighters;g._begin(a,specialMove('godan',2),'s3');a.x=0;t.x=.4;a.frame=a.action.startup;
 g._damage(a,t,a.action);const event=g.events.find(e=>e.type==='hit');assert.equal(event.feedback.point.space,'authored-special-surface');
 assert.ok(event.feedback.point.y>=NORMAL_HURT_BOUNDS.moguzo.stand.bottom);
});
