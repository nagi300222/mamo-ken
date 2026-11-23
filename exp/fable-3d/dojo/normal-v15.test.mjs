import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {IDS} from './balance.js';
import {MOTIFS,GESTURES,NORMAL_SOURCE,NORMAL_SLOTS} from './normal-motifs-v15.js';
import {buildNormalPack,decodeNormalPack} from './normal-clip-builder-v15.mjs';
import {chooseClip} from './models.js';
import {createNormalMotionSource} from './normal-motion-source.js';
const clipNames=NORMAL_SLOTS.map(s=>'v15_'+s);
test('nine actors have six authored distinct normal gestures, not just hue differences',()=>{
 assert.deepEqual(Object.keys(MOTIFS).sort(),[...IDS].sort());
 assert.equal(NORMAL_SLOTS.length,6);
 let all=[];
 for(const id of IDS){
   assert.deepEqual(Object.keys(MOTIFS[id]).sort(),[...NORMAL_SLOTS].sort());
   const gestures=NORMAL_SLOTS.map(k=>MOTIFS[id][k].gesture);
   assert.equal(new Set(gestures).size,6,id+' has duplicated normal choreography');
   all.push(...gestures);
   for(const name of NORMAL_SLOTS){
     const m=MOTIFS[id][name];
     assert.ok(m.power>=.8 && m.power<=1.5 && m.contact>.2 && m.contact<.75);
     assert.ok(Object.keys(GESTURES[m.gesture]).length>=4,id+'/'+name);
   }
 }
 assert.equal(new Set(all).size,54,'all 54 moves have individual authoring gestures');
});
test('GLB animation-only assets are rebuilt with 54 keyed skeletal clips and no source model changes',()=>{
 let modified=0,totalBytes=0;
 for(const id of IDS){
   const source=readFileSync(new URL('../chars/'+id+'/'+id+'.glb',import.meta.url));
   const out=buildNormalPack(source,id);
   const {doc}=decodeNormalPack(out.bytes);
   const animations=doc.animations;
   assert.equal(out.bytes.toString('utf8',0,4),'glTF');
   assert.deepEqual(animations.map(c=>c.name).sort(),[...clipNames].sort());
   assert.ok(!doc.skins?.length, 'preserve source GLB, use animation-only delivery');
   assert.equal(out.report.length,6);
   for(const r of out.report){
     assert.ok(r.bones>=3,id+'/'+r.slot+' bones '+r.bones);
     assert.ok(r.modifiedSamples>=6,id+'/'+r.slot);
     assert.match(r.clip,/^v15_/);
   }
   totalBytes+=out.bytes.length;modified+=out.report.reduce((n,x)=>n+x.modifiedSamples,0);
   assert.ok(out.bytes.length<source.length*.60,id+' animation pack too big');
 }
 assert.ok(modified>1500,'must actually change real bone keyframe data');
 assert.ok(totalBytes<6500000,'nine animation-only packs should stay phone-friendly');
});
test('v15 normal clips take priority only when they exist, without modifying specials or KO',()=>{
 const actor={ko:false,stun:0,state:'attack',action:{id:'stand_weak',anim:'stand_light'}};
 const legacy={normalMotionSource:createNormalMotionSource({version:'v15'})};
 assert.equal(chooseClip(actor,['idle','stand_light','v15_stand_weak'],{},legacy),'v15_stand_weak');
 assert.equal(chooseClip(actor,['idle','stand_light'],{},legacy),'stand_light');
 const special={...actor,action:{id:'s2',anim:'sp_rising_upper'}};
 assert.equal(chooseClip(special,['idle','sp_rising_upper']),'sp_rising_upper');
});
test('Pages generation and actor loader include all 9 normal packs without altering original GLBs',()=>{
 const build=readFileSync(new URL('./build-pages.mjs',import.meta.url),'utf8');
 const main=readFileSync(new URL('./main.js',import.meta.url),'utf8');
 assert.match(build,/pack-normals-v15\.mjs/);
 assert.match(build,/normal','v15',id\+'_normals\.glb'/);
 assert.match(main,/normalGLB\.animations/);
 assert.match(main,/normalMotionSource\.validatePack\(id,normalGLB\)/);
 assert.match(main,/bindMorphTargets\(clip,gltf\.scene\)/);
});
