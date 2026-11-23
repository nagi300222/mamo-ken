import test from 'node:test';
import assert from 'node:assert/strict';
import {UI_AUDIO_KEY,readUIAudioMuted,setUIAudioMuted,createUIFeedback} from './ui-feedback.js';
import {createCombatAudio} from '../dojo/combat-audio.js';
function storage(){const map=new Map();return {getItem:key=>map.get(key)??null,setItem:(key,value)=>map.set(key,value)};}
function deferred(){let resolve;return {promise:new Promise(r=>resolve=r),get resolve(){return resolve;}};}
class Doc extends EventTarget{hidden=false;}
function fixture({decode}={}){
 const document=new Doc(),target=new EventTarget(),store=storage();let starts=0,stops=0,resumes=0,contexts=0;
 class Context{
  constructor(){contexts++;this.state='running';this.destination={};this.currentTime=1;}
  createGain(){return {gain:{value:1},connect(){},disconnect(){}};}
  decodeAudioData(){return decode?.promise??Promise.resolve({duration:.1});}
  createBufferSource(){return {connect(){},disconnect(){},start(){starts++;},stop(){stops++;}};}
  suspend(){this.state='suspended';return Promise.resolve();}
  resume(){resumes++;this.state='running';return Promise.resolve();}
  close(){this.state='closed';return Promise.resolve();}
 }
 const feedback=createUIFeedback({sounds:{select:'select.wav',confirm:'confirm.wav',save:'save.wav'},storage:store,document,eventTarget:target,contextFactory:()=>Context,fetcher:async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(0)})});
 return {feedback,document,target,store,Context,get starts(){return starts;},get stops(){return stops;},get resumes(){return resumes;},get contexts(){return contexts;}};
}
test('mute is versioned and persists into a newly-created route; unavailable storage does not throw',()=>{
 const store=storage();setUIAudioMuted(true,store);assert.equal(readUIAudioMuted(store),true);
 assert.deepEqual(JSON.parse(store.getItem(UI_AUDIO_KEY)),{version:1,muted:true});
 const f=createUIFeedback({storage:store,document:null,eventTarget:null});assert.equal(f.muted,true);f.dispose();
 const broken={getItem(){throw Error('denied');},setItem(){throw Error('denied');}};
 assert.doesNotThrow(()=>setUIAudioMuted(true,broken));assert.equal(readUIAudioMuted(broken),true);
 store.setItem(UI_AUDIO_KEY,'{"version":9,"muted":true}');assert.equal(readUIAudioMuted(store),false);
 setUIAudioMuted(false,store);
});
test('there is no context or playback before an explicit gesture and no combat cue for missing UI samples',async()=>{
 const f=fixture();assert.equal(await f.feedback.play('select'),false);assert.equal(f.contexts,0);
 f.feedback.gesture();assert.equal(await f.feedback.play('select'),true);assert.equal(f.starts,1);
 assert.equal(await f.feedback.play('hit'),false);assert.equal(f.starts,1);f.feedback.dispose();
});
test('muting while an authored sample decodes cancels the obsolete play request',async()=>{
 const d=deferred(),f=fixture({decode:d});f.feedback.gesture();const pending=f.feedback.play('confirm');
 await Promise.resolve();await Promise.resolve();f.feedback.setMuted(true);d.resolve({duration:.1});
 assert.equal(await pending,false);assert.equal(f.starts,0);
 f.feedback.setMuted(false);assert.equal(await f.feedback.play('confirm'),true);assert.equal(f.starts,1);f.feedback.dispose();
});
test('background stops active voices; foreground alone cannot replay or resume',async()=>{
 const f=fixture();f.feedback.gesture();assert.equal(await f.feedback.play('select'),true);
 f.document.hidden=true;f.document.dispatchEvent(new Event('visibilitychange'));assert.equal(f.feedback.activeCount,0);assert.ok(f.stops>0);
 f.document.hidden=false;f.document.dispatchEvent(new Event('visibilitychange'));assert.equal(await f.feedback.play('save'),false);assert.equal(f.resumes,0);
 f.feedback.gesture();assert.equal(await f.feedback.play('save'),true);assert.equal(f.resumes,1);f.feedback.dispose();
});
test('native deactivation and disposal cancel pending work without automatic foreground audio',async()=>{
 const d=deferred(),f=fixture({decode:d});f.feedback.gesture();const pending=f.feedback.play('save');
 const state=new Event('mamoken:native-state');state.detail={active:false};f.target.dispatchEvent(state);d.resolve({duration:.1});
 assert.equal(await pending,false);assert.equal(f.starts,0);
 f.feedback.dispose();assert.equal(f.feedback.gesture(),false);assert.equal(await f.feedback.play('select'),false);
});
test('a combat context first unlocked while muted has zero gain and synchronizes with shared settings',()=>{
 const original=globalThis.localStorage,store=storage();globalThis.localStorage=store;setUIAudioMuted(true,store);
 let gain;class Context{constructor(){this.state='running';this.destination={};}createGain(){gain={gain:{value:99},connect(){}};return gain;}close(){return Promise.resolve();}}
 const audio=createCombatAudio(()=>Context);
 try{assert.equal(audio.muted,true);audio.unlock();assert.equal(gain.gain.value,0);setUIAudioMuted(false,store);assert.equal(audio.muted,false);assert.equal(gain.gain.value,.12);audio.setMuted(true);assert.equal(readUIAudioMuted(store),true);assert.equal(gain.gain.value,0);}
 finally{audio.dispose();setUIAudioMuted(false,store);if(original===undefined)delete globalThis.localStorage;else globalThis.localStorage=original;}
});
test('enabled confirmation is captured before its target disables itself for loading',async()=>{
 const handlers=new Map(),doc={hidden:false,addEventListener(type,callback,options){if(!handlers.has(type))handlers.set(type,[]);handlers.get(type).push({callback,capture:options?.capture===true});},removeEventListener(){}};
 const store=storage();setUIAudioMuted(false,store);let starts=0;
 class Context{constructor(){this.state='running';this.destination={};}createGain(){return {gain:{value:1},connect(){}};}decodeAudioData(){return Promise.resolve({duration:.2});}createBufferSource(){return {connect(){},disconnect(){},start(){starts++;},stop(){}};}close(){return Promise.resolve();}}
 const ui=createUIFeedback({sounds:{confirm:'confirm.wav'},storage:store,document:doc,eventTarget:null,contextFactory:()=>Context,fetcher:async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(0)})});
 const button={disabled:false,dataset:{},closest(){return this;},matches(selector){return selector.split(',').includes('#start');}};
 const click={target:button,isTrusted:true};
 for(const {callback} of handlers.get('pointerdown'))callback(click);
 for(const {callback,capture} of handlers.get('click'))if(capture)callback(click);
 // This is the normal target-handler transition into its loading state.
 button.disabled=true;
 for(const {callback,capture} of handlers.get('click'))if(!capture)callback(click);
 for(let i=0;i<8;i++)await Promise.resolve();assert.equal(starts,1,'target loading state swallowed the valid confirmation');
 // An already-disabled target and combat action must still be silent.
 for(const {callback} of handlers.get('click'))callback(click);
 for(let i=0;i<8;i++)await Promise.resolve();assert.equal(starts,1);
 button.disabled=false;button.matches=selector=>selector==='[data-control]';
 for(const {callback} of handlers.get('click'))callback(click);
 for(let i=0;i<8;i++)await Promise.resolve();assert.equal(starts,1);ui.dispose();
});
