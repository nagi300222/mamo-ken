import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import {loadV17R2SpecialMotionSource,canonicalSpecialClip,specialMotionOverride,specialClipTime} from './special-motion-source.js';
import {mergeR2SpecialMetadata,specialSourceIdentity} from './special-motion-contract-p3.js';
import {createShowtimeLoader} from './showtime-assets.js';import {IDS} from './balance.js';
import {authoredSpecialContactDelivery} from './p3-authored-special-delivery.mjs';
import {selectApprovedSpecialContacts} from './special-contact-runtime-p3.js';
const readJSON=async url=>JSON.parse(await readFile(url));
const r1=await readJSON(new URL('../motion/v17/specials_v17.json',import.meta.url)),r2=await readJSON(new URL('../motion/v17r2/specials_v17r2.json',import.meta.url));
function fakeClip(name,duration=20){return {name,duration,tracks:[{name:'pelvis.position'}],clone(){return fakeClip(this.name,this.duration);}};}
test('r2 explicitly merges six changed packs without mutating or loosely accepting r1/unknown metadata',()=>{
 const before=JSON.stringify(r1),merged=mergeR2SpecialMetadata(r1,r2);assert.equal(JSON.stringify(r1),before);assert.equal(Object.keys(merged.characters).length,9);assert.equal(merged.version,'v17-p3-specials-r2');
 assert.throws(()=>mergeR2SpecialMetadata(r1,{...r2,characters:{moguzo:r2.characters.moguzo}}),/Incomplete/);
 assert.throws(()=>specialSourceIdentity('v17r20','moguzo','s2'),/Unknown/);
 assert.equal(merged.characters.moguzo.s1.contactSeconds,13/60);assert.equal(merged.characters.moguzo.s1.sourceTiming.contactSeconds,.2167);
});
test('all 27 r2 delivery entries resolve exact existing pack/clip identities and canonical aliases do not mutate cached clips',async()=>{
 const source=await loadV17R2SpecialMotionSource(readJSON);let revised=0;
 for(const id of IDS)for(const [slot,entry]of Object.entries(source.characters[id])){
  const {identity}=entry,bytes=await readFile(new URL(identity.sourceFile,source.rootURL)),doc=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)));
  assert.ok(doc.animations.find(a=>a.name===identity.sourceClip),id+'.'+slot+' real source absent');
  const selected=specialMotionOverride(source,id,{schemaVersion:1,characterId:id,moveId:slot},new URL('../cinematic/v14/'+id+'/manifest.json',import.meta.url));
  assert.equal(new URL(selected.spec.animationSources.attacker.glb,selected.url).href,new URL(identity.sourceFile,source.rootURL).href);
  const cached=fakeClip(identity.sourceClip),runtime=canonicalSpecialClip(selected.spec,cached);assert.equal(cached.name,identity.sourceClip);assert.equal(runtime.name,slot+'_v17');assert.equal(selected.spec.actualSourceClip,identity.sourceClip);
  assert.equal(selected.spec.authoredContact.clip,slot+'_v17');assert.equal(selected.spec.sourceVersion,'v17-p3-specials-r2');
  if(identity.revision==='r2'){revised++;assert.notEqual(runtime,cached);assert.equal(runtime.userData.actualSourceClip,identity.sourceClip);}else assert.equal(runtime,cached);
 }
 assert.equal(revised,6);
});
test('r2 exact authored frame clocks match each active frame rather than rounded JSON phases',async()=>{
 const source=await loadV17R2SpecialMotionSource(readJSON);
 for(const id of IDS)for(const [slot,entry]of Object.entries(source.characters[id])){
  const spec=specialMotionOverride(source,id,{moveId:slot},new URL('file:///unused/manifest.json')).spec,row=entry.row;
  for(let i=0;i<row.active;i++)assert.ok(Math.abs(specialClipTime(spec,row,row.startup+i,row.frames/60)-(row.contact_frame+i)/60)<1e-8,id+'.'+slot+' active frame '+i);
 }
});
test('r2 authored exact surfaces retain original provenance and cannot pair with r1 animation approval',async()=>{
 const source=await loadV17R2SpecialMotionSource(readJSON),delivery=authoredSpecialContactDelivery(source);
 assert.equal(delivery.version,'v17-p3-specials-r2');assert.equal(delivery.characters.moguzo.s2.clip,'s2_v17');assert.equal(delivery.characters.moguzo.s2.sourceClip,'s2_v17r2');
 assert.equal(selectApprovedSpecialContacts('v17r2',delivery),delivery);assert.equal(selectApprovedSpecialContacts(null,delivery),null);assert.throws(()=>selectApprovedSpecialContacts('v17',delivery),/versions differ/);
});
test('r2 loadShowtime canonicalizes only new source actions and preserves all nine original ultimate/reaction specs',async()=>{
 const source=await loadV17R2SpecialMotionSource(readJSON),originalFetch=globalThis.fetch;globalThis.fetch=async url=>({ok:true,json:()=>readJSON(url)});
 try{
  const load=createShowtimeLoader(new URL('../cinematic/v14/',import.meta.url),{specialMotionSource:source});
  for(const id of IDS){
   const original=await readJSON(new URL('../cinematic/v14/'+id+'/manifest.json',import.meta.url));
   const result=await load(id,async spec=>fakeClip(spec.clip,spec.clip.includes('_v17')?source.characters[id][spec.clip.slice(0,2)].row.frames/60:20));
   assert.deepEqual(result.ultimate.spec,original.moves.find(m=>m.moveId==='ultimate'));
   for(const slot of ['s1','s2','s3'])assert.equal(result[slot].attacker.name,slot+'_v17');
  }
 }finally{globalThis.fetch=originalFetch;}
});
