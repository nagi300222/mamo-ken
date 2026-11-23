import {Battle} from './battle.js';
import {IDS} from './balance.js';
import {specialSurfaceAt} from './special-contact-runtime-p3.js';
import {writeFile} from 'node:fs/promises';
import {mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {practiceRouteFor} from './combo-routes-p3.mjs';
export function probe(id,{distance=.35,face=1,delay=0,crouch=false,finisher='s2',strongKnockback,corner=false,guardFirst=false}={}){
 const g=new Battle(id,'godan'),[p,t]=g.fighters;p.x=-face*distance/2;t.x=face*distance/2;p.facing=face;t.facing=-face;if(corner){p.x=face*(1.76-distance);t.x=face*1.76;}
 if(strongKnockback!==undefined)g.moveResolver=(fighter,move,moveId)=>moveId===(crouch?'crouch_heavy':'stand_heavy')?{...move,knockback:strongKnockback}:move;
 let stage=0,wait=0;const hits=[],events=[],frames=[];
 for(let f=0;f<160;f++){
  let input=f===0?{weak:true,down:crouch}:{down:crouch};
  if((stage===1||stage===3)&&!p.stop&&wait++>=delay){input=stage===1?{strong:true,down:crouch}:{['special'+finisher.slice(1)]:true};stage++;wait=0;}
  const before={targetStun:t.stun,targetStop:t.stop,distance:Math.abs(t.x-p.x)};
  g.tick(input,guardFirst||hits.length?{[face===1?'right':'left']:true,down:crouch}:{});
  for(const e of g.events){events.push({...e,at:f});if(e.type==='hit'&&e.slot===1){hits.push({...e,at:f,before,action:p.action?.id,actionFrame:p.frame});if(stage===0)stage=1;else if(stage===2)stage=3;}}
  if(p.action&&p.frame>=p.action.startup&&p.frame<p.action.startup+p.action.active&&!p.stop)frames.push({at:f,move:p.action.id,frame:p.frame,dist:Math.abs(t.x-p.x),targetStun:t.stun,targetState:t.state,targetY:t.y,attackerY:p.y,reach:p.action.reach,height:p.action.strikeHeight,point:p.action.specialContact?specialSurfaceAt(p.action,p.frame):null,contact:g._contact(p,t,p.action)});
 }
 return {id,distance,face,delay,crouch,finisher,strongKnockback,corner,guardFirst,hits:hits.map(e=>({comboHits:e.comboHits,damage:e.damage,move:e.move,at:e.at,before:e.before,action:e.action,actionFrame:e.actionFrame})),events:events.filter(e=>['cancel','block','hit'].includes(e.type)),frames};
}
const directory=process.env.MAMOKEN_EVIDENCE??'/tmp/p3-combo-audit';await mkdir(directory,{recursive:true});
const matrix=[];
for(const id of IDS)for(const crouch of [false,true])for(const face of [1,-1])for(const scenario of ['mid-common-s2','mid-character','wall-common-s2','late','guard-first','whiff']){
 const finisher=practiceRouteFor(id).finisher;
 const result=probe(id,{face,crouch,finisher:['mid-common-s2','wall-common-s2'].includes(scenario)?'s2':finisher,
  corner:scenario==='wall-common-s2',distance:scenario==='wall-common-s2'?.34:scenario==='whiff'?1.5:.35,delay:scenario==='late'?8:0,guardFirst:scenario==='guard-first'});
 result.scenario=scenario;
 if(['mid-character','wall-common-s2'].includes(scenario)){assert.deepEqual(result.hits.map(h=>h.comboHits),[1,2,3],id+'/'+scenario);assert.equal(result.events.filter(e=>e.type==='cancel').length,2);assert.equal(result.events.filter(e=>e.type==='block').length,0);assert.ok(result.hits.slice(1).every(h=>h.before.targetStun>0),'guard held throughout true combo');}
 if(['guard-first','whiff'].includes(scenario))assert.equal(result.hits.length,0,id+'/'+scenario);
 if(['late','whiff','guard-first'].includes(scenario))assert.equal(result.events.filter(e=>e.type==='cancel').length,0,id+'/'+scenario+' must not bypass hit confirm');
 matrix.push(result);
}
const summary=IDS.map(id=>{const standing=matrix.find(r=>r.id===id&&!r.crouch&&r.face===1&&r.scenario==='mid-character'),crouching=matrix.find(r=>r.id===id&&r.crouch&&r.face===1&&r.scenario==='mid-character'),old=matrix.find(r=>r.id===id&&!r.crouch&&r.face===1&&r.scenario==='mid-common-s2');return {id,finisher:standing.finisher,name:practiceRouteFor(id).name,standing:standing.hits,crouching:crouching.hits,oldMidS2Hits:old.hits.length,oldMidS2Active:old.frames.filter(f=>f.move==='s2')};});
await writeFile(directory+'/routes.json',JSON.stringify({note:'Actual combined R2 native Battle, both facings, standing/crouching. Initial opener alone is unguarded; defender holds correct guard afterward. No performance, CPU policy or contact data is modified.',cases:matrix},null,2)+'\n');
await writeFile(directory+'/route-summary.json',JSON.stringify(summary,null,2)+'\n');
console.log('ROUTE AUDIT PASS',matrix.length,'cases; 36 native midscreen routes + 36 preserved close wall s2 routes; late/guard/miss controls');
