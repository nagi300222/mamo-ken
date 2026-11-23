import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Battle} from './battle.js';
import {IDS,normalMove,specialMove} from './balance.js';
import {NORMAL_SLOTS} from './normal-motifs-v15.js';
import {fightFeelFor,feedbackForMove,IMPACT_SOUND_RECIPES} from './fight-feel.js';
import {createCombatAudio} from './combat-audio.js';
import {specialHitstunP3} from './special-balance-p3.js';
import {APPROVED_P3_CONTACT_DELIVERY} from './normal-contact-overrides-p3.js';

function contact(id,slot,guard=false){
 const battle=new Battle(id,'pisuke'),[p,t]=battle.fighters;p.x=1.42;t.x=1.76;t.ability.grit=false;
 battle._begin(p,normalMove(id,slot),slot);let event;
 for(let f=0;f<80;f++){
  battle.tick({},guard?{right:true,down:slot.startsWith('crouch_')}:{});
  event=battle.events.find(e=>e.type===(guard?'block':'hit'));if(event)break;
 }
 assert.ok(event,id+'/'+slot+' no contact');return {battle,p,t,event};
}
test('81 unique feel identities distinguish hit, guard, swing and silent miss',()=>{
 const keys=new Set();
 for(const id of IDS)for(const moveId of [...NORMAL_SLOTS,'s1','s2','s3']){
  const move=moveId.startsWith('s')&&/^s\d$/.test(moveId)?specialMove(id,+moveId[1]-1):normalMove(id,moveId);
  const feel=fightFeelFor(id,moveId,move);assert.ok(feel);keys.add(feel.id);
  assert.ok(feel.hitstop>=4&&feel.hitstop<=10);assert.ok(feel.guardstop<feel.hitstop);
  assert.ok(IMPACT_SOUND_RECIPES[feel.hitSound]);assert.ok(IMPACT_SOUND_RECIPES[feel.guardSound]);assert.ok(IMPACT_SOUND_RECIPES[feel.swingSound]);
  const whiff=feedbackForMove({id},{...move,id:moveId},'whiff');assert.equal(whiff.stopFrames,0);assert.equal(whiff.sound,null);assert.equal(whiff.effect,null);
 }
 assert.equal(keys.size,81);
 assert.ok(fightFeelFor('godan','stand_heavy').hitstop>fightFeelFor('pisuke','stand_heavy').hitstop);
 assert.equal(fightFeelFor('moguzo','ultimate'),null,'must preserve existing ultimate clock');
});
test('real normal contacts apply symmetric per-move holds and freeze both pose clocks',()=>{
 for(const id of IDS)for(const slot of ['stand_weak','stand_heavy','crouch_weak','crouch_heavy'])for(const guard of [false,true]){
  const {battle,p,t,event}=contact(id,slot,guard),feel=fightFeelFor(id,slot,normalMove(id,slot));
  assert.equal(event.feedback.outcome,guard?'guard':'hit');assert.equal(event.feedback.point.space,'authored-strike-surface');
  const duration=guard?feel.guardstop:feel.hitstop;
  assert.equal(p.stop,duration);assert.equal(t.stop,duration);const frame=p.frame;
  for(let f=0;f<duration;f++){battle.tick({},guard?{right:true,down:slot.startsWith('crouch_')}:{});assert.equal(p.frame,frame);}
 }
});
test('earliest special input survives the longest heavy hold without extending cancel recovery',()=>{
 const {battle,p}=contact('godan','stand_heavy');assert.equal(p.stop,10);
 battle.tick({special2:true},{});assert.equal(p.bufferedInput.actionFrame,p.frame);
 const events=[];
 for(let f=0;f<30;f++){battle.tick({},{});events.push(...battle.events);}
 assert.equal(events.filter(e=>e.type==='cancel'&&e.to==='s2').length,1);
 const late=new Battle('godan','pisuke'),[a,t]=late.fighters;a.x=-.17;t.x=.17;
 late._begin(a,normalMove('godan','stand_heavy'),'stand_heavy');let hit=false,elapsed=0,cancels=0;
 for(let f=0;f<120;f++){
  const input=hit&&!a.stop&&elapsed++===8?{special2:true}:{};late.tick(input,{});
  if(late.events.some(e=>e.type==='hit'))hit=true;cancels+=late.events.filter(e=>e.type==='cancel').length;
 }
 assert.equal(cancels,0,'late inputs must remain outside finite cancel window');
});
test('normal miss publishes one swing and one silent miss, no impact or hitstop',()=>{
 for(const id of IDS){
  const battle=new Battle(id,'pisuke'),[p,t]=battle.fighters;p.x=-1;t.x=1;
  battle._begin(p,normalMove(id,'stand_heavy'),'stand_heavy');const events=[];
  for(let i=0;i<90;i++){battle.tick({},{});events.push(...battle.events);assert.equal(p.stop,0);assert.equal(t.stop,0);}
  assert.equal(events.filter(e=>e.feedback?.outcome==='swing').length,1);
  assert.equal(events.filter(e=>e.feedback?.outcome==='whiff').length,1);
  assert.equal(events.filter(e=>e.type==='hit'||e.type==='block').length,0);
 }
});
test('projectile feedback retains authored source and marks only true expiry as miss',()=>{
 const hit=new Battle('pisuke','godan'),[a,t]=hit.fighters;a.x=-.35;t.x=.35;
 hit._begin(a,specialMove('pisuke',0),'s1');const events=[];
 for(let f=0;f<120;f++){hit.tick({},{});events.push(...hit.events);}
 const contact=events.find(e=>e.type==='hit');assert.equal(contact.feedback.id,'pisuke.s1');assert.equal(contact.feedback.point.space,'projectile-contact');
 assert.equal(events.filter(e=>e.feedback?.outcome==='whiff').length,0);
 const miss=new Battle('pisuke','godan');miss.fighters[0].x=-1.4;miss.fighters[1].x=1.4;miss._begin(miss.fighters[0],specialMove('pisuke',0),'s1');const missed=[];
 for(let f=0;f<120;f++){miss.tick({},{});missed.push(...miss.events);}
 assert.equal(missed.filter(e=>e.feedback?.outcome==='whiff').length,1);assert.equal(miss.projectiles.length,0);
});
test('81 performance records change only the allowed 19-special hitstun column',()=>{
 const baseline=JSON.parse(readFileSync(new URL('../../../docs/mamoken-p3/baseline/MOVE_CATALOG.json',import.meta.url)));
 assert.equal(baseline.catalog.length,81);
 let adjusted=0;
 for(const row of baseline.catalog){
  const now=row.kind==='normal'?normalMove(row.characterId,row.moveId):specialMove(row.characterId,+row.moveId[1]-1);
  const permitted={...now},before={...row.performance};
  if(row.kind==='special'){
   const expected=specialHitstunP3(row.characterId,+row.moveId[1]-1);
   assert.equal(now.hitstun,expected,row.key+' unauthorized hitstun');
   if(expected!==undefined){delete permitted.hitstun;delete before.hitstun;adjusted++;}
  }
  if(row.kind==='normal'&&APPROVED_P3_CONTACT_DELIVERY)for(const key of ['reach','strikeHeight','activeReach','normalVersion']){delete permitted[key];delete before[key];}
  assert.deepEqual(permitted,before,row.key);
 }
 assert.equal(adjusted,19);
});
test('feedback audio remains gesture-gated and respects mute and independent volume',()=>{
 let contexts=0,starts=0,master;
 class Context{
  constructor(){contexts++;this.state='running';this.currentTime=1;this.destination={};}
  createGain(){const node={gain:{value:0,setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){}};master??=node;return node;}
  createOscillator(){return {frequency:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){},start(){starts++;},stop(){}};}
 }
 const audio=createCombatAudio(()=>Context),event={feedback:feedbackForMove({id:'moguzo'},{id:'stand_weak'},'hit')};
 assert.equal(audio.playFeedback(event),false);assert.equal(contexts,0);
 audio.setVolume(.25);audio.unlock();assert.equal(master.gain.value,.03);assert.equal(audio.playFeedback(event),true);assert.equal(starts,1);
 audio.setMuted(true);audio.setVolume(.5);assert.equal(master.gain.value,0);assert.equal(audio.playFeedback(event),false);
 audio.setMuted(false);assert.equal(master.gain.value,.06);
 audio.setVolume(0);assert.equal(audio.playFeedback(event),false);assert.equal(starts,1);
 assert.throws(()=>audio.setVolume(NaN),TypeError);
 assert.equal(audio.playFeedback({feedback:feedbackForMove({id:'moguzo'},{id:'stand_weak'},'whiff')}),false);
});
