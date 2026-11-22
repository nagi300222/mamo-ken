import {test} from 'node:test';
import assert from 'node:assert/strict';
import {bindMorphTargets} from './morph-binding.js';
test('single primitive facial clip binds every real mesh without changing source or samples',()=>{
 const values=new Float32Array([0,1,1,0]);
 const track={name:'Mamo.morphTargetInfluences',values,getValueSize:()=>2,clone(){return {...this};}};
 const clip={tracks:[track],clone(){return {...this};}};
 const root={getObjectByName:()=>({traverse(fn){for(const name of ['body','body_1'])fn({name,morphTargetInfluences:[0,0]});}})};
 const bound=bindMorphTargets(clip,root);
 assert.deepEqual(bound.tracks.map(t=>t.name),['body.morphTargetInfluences','body_1.morphTargetInfluences']);
 assert.equal(clip.tracks.length,1);assert.ok(bound.tracks.every(t=>t.values===values));
 assert.throws(()=>bindMorphTargets(clip,{getObjectByName:()=>null}),/Cannot bind/);
});
