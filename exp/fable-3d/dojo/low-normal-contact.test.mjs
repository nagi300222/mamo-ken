import test from 'node:test';
import assert from 'node:assert/strict';
import {Battle} from './battle.js';
import {IDS,normalMove} from './balance.js';

const LOW_NORMALS=['crouch_weak','crouch_heavy'];
// The normal pushboxes already allow this spacing. No reach/height enlargement,
// custom hurt bounds, forced contact, or direct damage call is used by this gate.
const SPACING=.34,WALL=1.76;

function probe(attackerId,targetId,slot,facing,posture){
 const battle=new Battle(attackerId,targetId),[attacker,target]=battle.fighters;
 const guarded=posture==='crouch_guard',crouching=posture!=='stand';
 attacker.x=guarded?facing*(WALL-SPACING):-facing*SPACING/2;
 target.x=guarded?facing*WALL:facing*SPACING/2;
 attacker.facing=facing;target.facing=-facing;
 const originalHp=target.hp,originalGuard=target.guard;
 const defenderInput={down:crouching,...(guarded?{[facing===1?'right':'left']:true}:{})};
 const move=normalMove(attackerId,slot);
 let contact=null,contactFrame=null,started=null;
 for(let frame=0;frame<move.startup+move.active+move.recovery+2;frame++){
  battle.tick({down:true,...(frame===0?{[slot==='crouch_weak'?'weak':'strong']:true}:{})},defenderInput);
  if(frame===0)started=attacker.action?.id;
  contact=battle.events.find(event=>(event.type==='hit'||event.type==='block')&&event.attacker===attacker.slot&&event.slot===target.slot);
  if(contact){contactFrame=attacker.frame;break;}
 }
 return {move,contact,contactFrame,started,target,originalHp,originalGuard};
}

for(const posture of ['stand','crouch','crouch_guard'])test(`all 18 low normals contact all nine ${posture} targets from both sides (324 actual Battle probes)`,()=>{
 const failures=[];let probes=0;
 for(const attackerId of IDS)for(const slot of LOW_NORMALS)for(const targetId of IDS)for(const facing of [1,-1]){
  const label=`${attackerId}/${slot} → ${targetId}/${posture}/${facing}`;
  const result=probe(attackerId,targetId,slot,facing,posture),{move,contact,target}=result;
  probes++;
  const problems=[];
  if(move.level!=='low')problems.push('normal lost its low designation');
  if(result.started!==slot)problems.push(`input started ${result.started}`);
  if(!contact)problems.push('no real contact in the full active window');
  else{
   if(result.contactFrame<move.startup||result.contactFrame>=move.startup+move.active)problems.push(`contact outside active frames: ${result.contactFrame}`);
   if(posture==='crouch_guard'){
    if(contact.type!=='block')problems.push(`correct low guard produced ${contact.type}`);
    if(target.hp!==result.originalHp||contact.damage!==0)problems.push('guard lost HP');
    if(target.guard>=result.originalGuard)problems.push('block did not spend guard');
   }else{
    if(contact.type!=='hit')problems.push(`unguarded target produced ${contact.type}`);
    if(target.hp>=result.originalHp||!(contact.damage>0))problems.push('hit did not damage target');
   }
  }
  if(problems.length)failures.push({case:label,problems});
 }
 assert.equal(probes,324);
 assert.deepEqual(failures,[],`${failures.length}/324 low-normal matchups failed`);
});
