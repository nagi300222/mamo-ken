// P3 actual WebGL actor hold + actual browser Web Audio synthesis acceptance.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {analyzeAudioBuffer,monoWav} from './audio-buffer-evidence.mjs';
const {chromium}=createRequire(import.meta.url)('playwright-core');
const base=process.env.MAMOKEN_URL??'http://127.0.0.1:4173/exp/fable-3d/dojo/';
const directory=(process.env.MAMOKEN_EVIDENCE??'/tmp/mamoken-p3')+'/fight-feel';
await mkdir(directory,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH??'/usr/bin/google-chrome',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:852,height:393},isMobile:true,hasTouch:true});
await page.addInitScript(()=>{
 window.__p3audio=[];const pending=new WeakMap();
 for(const [Type,kind]of [[OscillatorNode,'oscillator'],[AudioBufferSourceNode,'noise']]){
  const start=Type.prototype.start,stop=Type.prototype.stop;
  Type.prototype.start=function(when=0,...args){pending.set(this,{kind,start:when,offline:this.context instanceof OfflineAudioContext});return start.call(this,when,...args);};
  Type.prototype.stop=function(when,...args){const record=pending.get(this);if(record&&Number.isFinite(when))window.__p3audio.push({...record,duration:when-record.start,wave:this.type});return stop.call(this,when,...args);};
 }
});
const errors=[],cases=[];
page.on('pageerror',error=>errors.push(error.message));
page.on('console',message=>{if(/PropertyBinding.*(not found|failed)/.test(message.text()))errors.push(message.text());});
page.on('response',response=>{if(response.status()>=400&&!response.url().endsWith('favicon.ico'))errors.push(response.status()+' '+response.url());});
try{
 await page.goto(base,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.mamoken3d);
 for(const [id,index]of [['pisuke',1],['godan',2],['bullet',7]]){
  await page.locator('.fighter-card').nth(index).tap();await page.locator('#match-mode').selectOption('practice');await page.locator('#start').tap();
  await page.waitForFunction(id=>mamoken3d.actors[0]?.id===id&&mamoken3d.practice.enabled&&mamoken3d.battle?.frame>0,id,{timeout:45000});
  for(const [slot,guard]of [['stand_weak',false],['stand_heavy',false],['stand_heavy',true]]){
   await page.locator('#practice-dummy').selectOption(guard?'guard_stand':'stand');
   await page.evaluate(async({id,slot,guard})=>{
    const {normalMove}=await import('./balance.js'),g=mamoken3d.battle,[a,t]=g.fighters;
    for(const p of [a,t]){p.action=null;p.y=0;p.vy=0;p.frame=0;p.stun=0;p.stop=0;p.dashF=0;p.landF=0;p.state='idle';p.input={};p.prev={};p.comboHits=0;p.comboContact=null;p.bufferedInput=null;}
    a.x=1.42;t.x=1.76;a.facing=1;t.facing=-1;t.guard=100;
    window.__p3contact=null;window.__p3audio=[];g._begin(a,normalMove(id,slot),slot);
    const tick=g.tick;g.tick=function(...inputs){
     const result=tick.apply(this,inputs),event=this.events.find(e=>e.type===(guard?'block':'hit'));
     if(event){window.__p3contact={event,attackerStop:a.stop,targetStop:t.stop,poseFrame:a.frame};a.stop=300;t.stop=300;this.tick=tick;}
     return result;
    };
   },{id,slot,guard});
   await page.waitForFunction(()=>window.__p3contact,undefined,{timeout:10000});
   const record=await page.evaluate(async()=>{
    const {fightFeelFor,IMPACT_SOUND_RECIPES}=await import('./fight-feel.js'),r=window.__p3contact,p=mamoken3d.battle.fighters[0],actor=mamoken3d.actors[0];
    return {...r,clip:actor.currentName,time:actor.current.time,expected:fightFeelFor(p.id,p.action.id,p.action),recipe:IMPACT_SOUND_RECIPES[r.event.feedback.sound],played:window.__p3audio};
   });
   assert.equal(record.attackerStop,guard?record.expected.guardstop:record.expected.hitstop);assert.equal(record.targetStop,record.attackerStop);
   assert.equal(record.event.feedback.point.space,'authored-strike-surface');assert.match(record.clip,/^v1[57]_/);
   const expectedDuration=record.recipe.duration+(record.recipe.noise?0:.016),expectedKind=record.recipe.noise?'noise':'oscillator';
   assert.equal(record.played.filter(sound=>sound.kind===expectedKind&&Math.abs(sound.duration-expectedDuration)<.004).length,1,id+'/'+slot+' actual in-game audio did not consume its P3 feedback exactly once');
   assert.ok(!record.played.some(sound=>sound.kind==='oscillator'&&(
    !guard&&sound.wave==='sawtooth'&&Math.abs(sound.duration-.116)<.003||guard&&sound.wave==='triangle'&&Math.abs(sound.duration-.106)<.003)),id+'/'+slot+' old generic impact was double-played');
   await page.screenshot({path:directory+'/'+id+'-'+slot+'-'+(guard?'guard':'hit')+'.png'});
   const frozen=await page.evaluate(()=>({frame:mamoken3d.battle.fighters[0].frame,time:mamoken3d.actors[0].current.time,stop:mamoken3d.battle.fighters[0].stop}));
   await page.waitForFunction(stop=>mamoken3d.battle.fighters[0].stop<stop-1,frozen.stop,{timeout:8000});
   const after=await page.evaluate(()=>({frame:mamoken3d.battle.fighters[0].frame,time:mamoken3d.actors[0].current.time}));
   assert.equal(after.frame,frozen.frame);assert.equal(after.time,frozen.time);cases.push({id,slot,guard,...record});
  }
  await page.locator('#select-back').tap();
 }
 const audio=await page.evaluate(async()=>{
  const {createCombatAudio}=await import('./combat-audio.js'),{feedbackForMove,IMPACT_SOUND_RECIPES}=await import('./fight-feel.js');
  const results={};
  // OfflineAudioContext produces real browser audio samples without requesting
  // microphone/output permission or claiming a physical phone speaker was heard.
  class TestContext extends OfflineAudioContext{constructor(){super(1,24000,48000);}get state(){return 'running';}}
  for(const [name,id,slot,outcome,volume,muted]of [
   ['light','pisuke','stand_weak','hit',1,false],['heavy','godan','stand_heavy','hit',1,false],
   ['guard','godan','stand_heavy','guard',1,false],['swing','godan','stand_heavy','swing',1,false],
   ['whiff','godan','stand_heavy','whiff',1,false],['quarter','pisuke','stand_weak','hit',.25,false],
   ['muted','godan','stand_heavy','hit',1,true],['zero','godan','stand_heavy','hit',0,false]
  ]){
   window.__p3audio=[];
   const sound=createCombatAudio(()=>TestContext);sound.setVolume(volume);sound.unlock();sound.setMuted(muted);
   const event={feedback:feedbackForMove({id},{id:slot,kind:'strike'},outcome)};
   // Reproducible white-noise fixture, limited to the synchronous synth call.
   const nativeRandom=Math.random;let seed=0x53a901,played;
   Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
   try{played=sound.playFeedback(event);}finally{Math.random=nativeRandom;}
   const buffer=await sound.context.startRendering(),samples=buffer.getChannelData(0);
   const recipe=IMPACT_SOUND_RECIPES[event.feedback.sound];
   results[name]={played,noiseSeed:'0x53a901',samples:Array.from(samples),sampleRate:buffer.sampleRate,sound:event.feedback.sound,
    scheduled:window.__p3audio.filter(record=>record.offline),expectedDuration:recipe?recipe.duration+(recipe.noise?0:.016):0};
  }
  return results;
 });
 for(const [name,result]of Object.entries(audio)){
  const {samples,sampleRate}=result;
  Object.assign(result,analyzeAudioBuffer(samples,sampleRate,{tailStart:audio.light.expectedDuration+.02,quietStart:result.expectedDuration+.025}));
  await writeFile(directory+'/'+name+'.wav',monoWav(samples,sampleRate));delete result.samples;
 }
 // Write measurements before assertions so failed CI retains the actual signal,
 // schedules and in-game events rather than screenshots alone.
 await writeFile(directory+'/report.json',JSON.stringify({cases,audio,errors},null,2));
 for(const name of ['light','heavy','guard','swing']){
  const result=audio[name];assert.equal(result.played,true);assert.ok(result.finite&&result.rms>0&&result.peak<.1,name+' clipped, nonfinite or silent');
  assert.equal(result.scheduled.length,1,name+' did not schedule exactly one voice');
  assert.ok(Math.abs(result.scheduled[0].duration-result.expectedDuration)<1e-6,name+' voice ended outside its authored envelope');
  assert.ok(result.quietPeak<1e-7,name+' leaked audio beyond its scheduled end');
 }
 assert.ok(audio.heavy.scheduled[0].duration>audio.light.scheduled[0].duration+.1,'heavy has no longer scheduled contact envelope');
 assert.ok(audio.heavy.tailEnergy>1e-12&&audio.heavy.tailRms>1e-7,'heavy rendered no sustained energy after the light hit ended');
 assert.equal(audio.light.quietPeak,0,'light voice did not stop cleanly');
 assert.notEqual(audio.guard.sound,audio.heavy.sound);assert.notEqual(audio.swing.sound,audio.heavy.sound);
 assert.ok(Math.abs(audio.quarter.rms/audio.light.rms-.25)<.005,'independent volume gain not respected');
 for(const name of ['whiff','muted','zero']){assert.equal(audio[name].played,false);assert.equal(audio[name].peak,0);}
 assert.deepEqual(errors,[]);await writeFile(directory+'/report.json',JSON.stringify({cases,audio,errors},null,2));
 console.log('P3 FEEDBACK WEBGL/AUDIO PASS: 9 real weak/heavy/guard holds, frozen authored poses, 8 browser audio buffers with mute/volume/miss distinctions');
}catch(error){await page.screenshot({path:directory+'/failure.png'}).catch(()=>{});throw error;}
finally{await browser.close();}
