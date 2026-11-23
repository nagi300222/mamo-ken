import test from 'node:test';
import assert from 'node:assert/strict';
import {createCombatAudio} from '../../exp/fable-3d/dojo/combat-audio.js';
test('native background stops pending sound and suspends; foreground waits for a user gesture',()=>{
 const previous={Capacitor:globalThis.Capacitor,mamokenNative:globalThis.mamokenNative,addEventListener:globalThis.addEventListener};const listeners=new Map();
 globalThis.Capacitor={isNativePlatform:()=>true};globalThis.mamokenNative={isNative:true,active:true};globalThis.addEventListener=(name,callback)=>{if(!listeners.has(name))listeners.set(name,[]);listeners.get(name).push(callback);};
 let stopped=0,resumed=0;const parameter={setValueAtTime(){},exponentialRampToValueAtTime(){}};
 class Context{constructor(){this.state='running';this.currentTime=1;this.destination={};}createGain(){return {gain:{...parameter,value:1},connect(){},disconnect(){}};}createOscillator(){return {frequency:parameter,connect(){},disconnect(){},start(){},stop(){stopped++;}};}suspend(){this.state='suspended';return Promise.resolve();}resume(){this.state='running';resumed++;return Promise.resolve();}}
 try{
  const audio=createCombatAudio(()=>Context);assert.equal(audio.unlock(),true);audio.play('hit');const scheduled=stopped;
  mamokenNative.active=false;for(const callback of listeners.get('mamoken:native-state'))callback({detail:{active:false}});
  assert.ok(stopped>scheduled);assert.equal(audio.context.state,'suspended');assert.equal(audio.play('hit'),false);
  for(const callback of listeners.get('pointerdown'))callback({isTrusted:true});assert.equal(resumed,0,'inactive native state resumed sound');
  mamokenNative.active=true;
  for(const callback of listeners.get('mamoken:native-state'))callback({detail:{active:true}});
  assert.equal(resumed,0);for(const callback of listeners.get('pointerdown'))callback({isTrusted:true});assert.equal(resumed,1);assert.equal(audio.context.state,'running');
 }finally{globalThis.Capacitor=previous.Capacitor;globalThis.mamokenNative=previous.mamokenNative;globalThis.addEventListener=previous.addEventListener;}
});
