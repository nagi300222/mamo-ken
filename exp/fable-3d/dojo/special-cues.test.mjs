import test from 'node:test';import assert from 'node:assert/strict';
import {consumeSpecialMovementCues} from './special-cues.js';
test('special movement clock drains once through a stop and leaves contact to actual Battle',()=>{
 const played=[],visual=[],spec={motionVersion:'v17',cueTrack:[
  {at:.05,type:'sfx',key:'wind',trigger:'movement'},
  {at:.10,type:'sfx',key:'hit',trigger:'contact'},
  {at:.10,type:'vfx',key:'slash',trigger:'contact'},
  {at:.14,type:'vfx',key:'special',trigger:'movement'}]};
 const sinks={audio:{play:(...v)=>played.push(v)},characterId:'bullet',visual:c=>visual.push(c.key)};
 let cursor=consumeSpecialMovementCues(spec,.1,0,sinks);
 for(let stop=0;stop<10;stop++)cursor=consumeSpecialMovementCues(spec,.1,cursor,sinks);
 assert.deepEqual(played,[['wind','bullet']]);assert.deepEqual(visual,[]);
 cursor=consumeSpecialMovementCues(spec,.2,cursor,sinks);assert.equal(cursor,4);assert.deepEqual(visual,['special']);
});
test('legacy special hit cues also cannot manufacture a hit on whiff',()=>{
 const played=[],visual=[],spec={cueTrack:[{at:.1,type:'sfx',key:'hit'},{at:.1,type:'vfx',key:'hit'},{at:.2,type:'sfx',key:'wind'}]};
 assert.equal(consumeSpecialMovementCues(spec,1,0,{audio:{play:k=>played.push(k)},visual:c=>visual.push(c.key)}),3);
 assert.deepEqual(played,['wind']);assert.deepEqual(visual,[]);
});
