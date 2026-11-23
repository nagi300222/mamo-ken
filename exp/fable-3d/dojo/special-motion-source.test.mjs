import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {IDS} from './balance.js';
import {createShowtimeLoader,validateClipTiming} from './showtime-assets.js';
import {createSpecialMotionSource,loadApprovedSpecialMotionSource,loadV17SpecialMotionSource,specialMotionOverride,specialClipTime} from './special-motion-source.js';
const root=new URL('../motion/v17/',import.meta.url);
const json=async url=>JSON.parse(await readFile(url,'utf8'));
const metadata=await json(new URL('specials_v17.json',root)),contacts=await json(new URL('special_contacts_v17.json',root));
const source=()=>createSpecialMotionSource({version:'v17',metadata:structuredClone(metadata),contacts:structuredClone(contacts)});

function glb(data){
 assert.equal(data.readUInt32LE(0),0x46546c67);
 const length=data.readUInt32LE(12),doc=JSON.parse(data.subarray(20,20+length));
 const bytes=data.subarray(28+length);
 const accessor=index=>{const a=doc.accessors[index],v=doc.bufferViews[a.bufferView];return bytes.subarray((v.byteOffset??0)+(a.byteOffset??0),(v.byteOffset??0)+(a.byteOffset??0)+a.count*({SCALAR:1,VEC3:3,VEC4:4}[a.type]??1)*4);};
 const channels=animation=>animation.channels.map(c=>{const sampler=animation.samplers[c.sampler];return {name:doc.nodes[c.target.node].name,path:c.target.path,interpolation:sampler.interpolation??'LINEAR',input:accessor(sampler.input).toString('hex'),output:accessor(sampler.output).toString('hex')};}).sort((a,b)=>(a.name+a.path).localeCompare(b.name+b.path));
 return {doc,accessor,channels};
}

test('P3 specials remain unapproved until independent delivery review',()=>{
 assert.equal(loadApprovedSpecialMotionSource(()=>{throw Error('Must not fetch while disabled');}),null);
});
test('real P3 delivery has nine complete three-clip packs and exactly three redesigned moves',async()=>{
 const provider=await loadV17SpecialMotionSource(json);let revised=0,retained=0;
 for(const id of IDS){
  const pack=glb(await readFile(new URL(id+'_specials_v17.glb',root)));
  assert.equal(pack.doc.animations.length,3);
  for(const slot of ['s1','s2','s3']){
   const entry=provider.characters[id][slot],row=entry.row,clip=pack.doc.animations.find(a=>a.name===row.clip);
   assert.ok(clip?.channels.length>30,id+'.'+slot+' actual articulated motion');
   let last=0;for(const sampler of clip.samplers){const times=pack.accessor(sampler.input);for(let i=0;i<times.length;i+=4)last=Math.max(last,times.readFloatLE(i));}
   assert.ok(Math.abs(last-row.duration_sec)<.0002,id+'.'+slot+' actual GLB duration');
   const selected=specialMotionOverride(provider,id,{schemaVersion:1,characterId:id,moveId:slot},new URL('../cinematic/v14/'+id+'/manifest.json',import.meta.url));
   validateClipTiming(selected.spec,{name:row.clip,duration:last});
   assert.equal(new URL(selected.spec.animationSources.attacker.glb,selected.url).href,new URL(id+'_specials_v17.glb',root).href);
   if(row.origin==='v17 revised')revised++;else {assert.equal(row.origin,'v14 re-export');retained++;}
  }
 }
 assert.equal(revised,3);assert.equal(retained,24);
});
test('contact cues never enter time-only playback; movement retains authored wind/stance cues',()=>{
 const provider=source();let contactCount=0,movementCount=0;
 for(const moves of Object.values(provider.characters))for(const entry of Object.values(moves)){
  assert.ok(entry.cueTrack.every(c=>c.trigger==='movement'&&c.on==='always'&&!['hit','block'].includes(c.key)));
  assert.ok(entry.contactCueTrack.every(c=>c.trigger==='contact'&&['hit','guard'].includes(c.on)));
  contactCount+=entry.contactCueTrack.length;movementCount+=entry.cueTrack.length;
 }
 assert.ok(contactCount>70);assert.ok(movementCount>30);
 const corrupt=structuredClone(metadata);corrupt.characters.moguzo.s2.cue_track.find(c=>c.key==='hit').trigger='movement';
 assert.throws(()=>createSpecialMotionSource({version:'v17',metadata:corrupt,contacts}),/cue trigger|movement cue/);
});
test('unresolved surfaces and mismatched source clocks cannot become playable P3 delivery',()=>{
 const corrupt=structuredClone(contacts);corrupt.godan.s3.status='fix';
 assert.throws(()=>createSpecialMotionSource({version:'v17',metadata,contacts:corrupt}),/surface review/);
 const wrong=structuredClone(metadata);wrong.characters.chirka.s3.duration_sec+=.1;
 assert.throws(()=>createSpecialMotionSource({version:'v17',metadata:wrong,contacts}),/frame clock/);
});
test('showtime overlay selects new special GLBs while preserving nine original movie specs and reaction sources',async()=>{
 const originalFetch=globalThis.fetch,provider=source();const requested=[];
 globalThis.fetch=async url=>({ok:true,json:()=>json(url)});
 try{
  const loader=createShowtimeLoader(new URL('../cinematic/v14/',import.meta.url),{specialMotionSource:provider});
  for(const id of IDS){
   const original=await json(new URL('../cinematic/v14/'+id+'/manifest.json',import.meta.url));
   const entries=await loader(id,async(spec,url)=>{requested.push({spec,url});return {name:spec.clip,duration:spec.clip.endsWith('_v17')?provider.characters[id][spec.clip.slice(0,2)].row.frames/60:20};});
   assert.deepEqual(entries.ultimate.spec,original.moves.find(m=>m.moveId==='ultimate'));
   assert.equal(entries.s1.spec.motionVersion,'v17');
   assert.ok(entries.ultimate.spec.durationSeconds>=9&&entries.ultimate.spec.durationSeconds<=11);
  }
  assert.equal(requested.filter(r=>r.spec.clip.endsWith('_v17')).length,27);
 }finally{globalThis.fetch=originalFetch;}
});
test('P3 special clip frame mapping holds first/last contact on active interval and ends at recovery',()=>{
 const provider=source();
 for(const moves of Object.values(provider.characters))for(const entry of Object.values(moves)){
  const row=entry.row,duration=row.frames/60,move={startup:row.startup,active:row.active,recovery:row.recovery};
  const spec={motionVersion:'v17',contactSeconds:row.contactSeconds,contactPhase:row.contact,contactEndPhase:row.contact_end};
  assert.equal(specialClipTime(spec,move,0,duration),0);
  assert.ok(Math.abs(specialClipTime(spec,move,move.startup,duration)-row.contactSeconds)<1e-8);
  if(move.active>1)assert.ok(Math.abs(specialClipTime(spec,move,move.startup+move.active-1,duration)-Math.max(row.contactSeconds,row.contact_end*duration))<1e-8);
  assert.equal(specialClipTime(spec,move,move.startup+move.active+move.recovery,duration),duration);
 }
 const move={startup:10,active:5,recovery:20};assert.equal(specialClipTime({contactSeconds:.2},move,20,1),.2+.8*10/25);
});
