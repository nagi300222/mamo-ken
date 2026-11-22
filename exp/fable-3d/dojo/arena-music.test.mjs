import test from 'node:test';
import assert from 'node:assert/strict';
import { createArenaMusic, MELODY_STEPS, ARENA_BPM, ARENA_STEP_SECONDS } from './arena-music.js';
import { readFileSync } from 'node:fs';

test('original music is a bounded generated 32-step melody',()=>{
 assert.equal(MELODY_STEPS.length,32);
 assert.equal(ARENA_BPM,118);
 assert.ok(ARENA_STEP_SECONDS>.2&&ARENA_STEP_SECONDS<.3);
});
test('BGM defaults OFF, schedules only when user enables AND match is active',()=>{
 let voices=0;const fake={
  currentTime:3,state:'running',destination:{},
  createGain(){return {gain:{value:0,setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){}};},
  createOscillator(){return {frequency:{setValueAtTime(){}},connect(){},start(){voices++},stop(){},disconnect(){}};}
 };
 let lookups=0;const music=createArenaMusic(()=>{lookups++;return fake;});
 assert.equal(music.enabled,false);
 music.update(true);assert.equal(voices,0);
 assert.equal(music.setEnabled(true),true);
 music.update(false);assert.equal(voices,0);
 music.update(true);assert.ok(voices>0);
 const before=voices;
 music.update(false);assert.equal(music.active,false);
 assert.equal(music.setEnabled(false),false);
 music.update(true);assert.equal(voices,before);
 assert.ok(lookups>0);music.dispose();
});
test('BGM has no background timer or HTTP asset and is separately toggleable',()=>{
 const code=readFileSync(new URL('./arena-music.js',import.meta.url),'utf8');
 const main=readFileSync(new URL('./main.js',import.meta.url),'utf8');
 const html=readFileSync(new URL('./index.html',import.meta.url),'utf8');
 assert.doesNotMatch(code,/setInterval\(|setTimeout\(|fetch\(/);
 assert.match(html,/id="music-toggle"/);assert.match(main,/music\.update/);
 assert.match(main,/createArenaMusic\(\(\)=>audioFX\.context\)/);
 assert.match(main,/audioFX\.setMuted\(!audioFX\.muted\)/);
});
