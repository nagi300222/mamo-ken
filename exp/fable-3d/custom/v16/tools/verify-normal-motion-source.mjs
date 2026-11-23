// Actual Three.js CPU skin/morph verification. Images are stubbed; this tool
// makes no claim of WebGL, shader, floor composition or iPhone performance QA.
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
const nativeFetch=globalThis.fetch;
globalThis.self=globalThis;globalThis.createImageBitmap=async()=>({width:1024,height:1024,close(){}});
globalThis.ProgressEvent=class{constructor(type,props){this.type=type;Object.assign(this,props);}};
globalThis.fetch=async(url,options)=>{
 const path=typeof url==='string'||url instanceof URL?String(url):url.url;
 if(path.startsWith('file:')){try{return new Response(await readFile(fileURLToPath(path)),{headers:{'Content-Type':path.endsWith('.json')?'application/json':'application/octet-stream'}});}catch(error){return new Response(error.message,{status:404});}}
 return nativeFetch(url,options);
};
const [{createAvatar,measureContacts},{loadP3NormalMotionCandidate},{ACTIVE_NORMAL_MOTION_SOURCE},{chooseClip},{normalMove},{normalClipTime},{createDefaultAvatar},{createCustomBattle}]=await Promise.all([
 import('../avatar-factory.js'),import('../../../dojo/p3-normal-candidate.js'),import('../../../dojo/normal-motion-source.js'),import('../../../dojo/models.js'),
 import('../../../dojo/balance.js'),import('../../../dojo/normal-timing-v151.js'),import('../avatar-schema.js'),import('../custom-combat.js')
]);
const artRevision=process.env.MAMOKEN_NORMAL_ART_REVISION??'r2';
let motionRoot=new URL(artRevision==='r2'?'../../../motion/v17r2/':'../../../motion/v17/',import.meta.url);
if(process.env.MAMOKEN_V17_MOTION_ROOT){const input=process.env.MAMOKEN_V17_MOTION_ROOT;motionRoot=/^(file|https?):/.test(input)?new URL(input):pathToFileURL(resolve(input)+'/');}
const activeBefore=ACTIVE_NORMAL_MOTION_SOURCE,candidate=await loadP3NormalMotionCandidate({artRevision,motionRoot,revision:process.env.MAMOKEN_ART_REVISION??null});
assert.equal(candidate.status,'candidate-only');assert.equal(candidate.source.version,'v17');
const results=[],surfaceFailures=[];const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
for(const id of Object.keys(candidate.delivery.characters)){
 const originalURL=new URL(`../../../chars/${id}/${id}.glb`,import.meta.url),partsURL=new URL(`../assets/${id}_parts.glb`,import.meta.url);
 const originals=[hash(await readFile(originalURL)),hash(await readFile(partsURL))];
 const definition=createDefaultAvatar(id),avatar=await createAvatar(definition,{normalMotionSource:candidate.source});
 try{
  assert.equal(avatar.normalMotionVersion,'v17');assert.equal(avatar.normalMotionSource,candidate.source);
  const names=avatar.animations.map(clip=>clip.name);assert.equal(names.filter(name=>candidate.source.isNormalClip(name,{rigId:id})).length,6);assert.equal(names.filter(name=>name.startsWith('v15_')).length,0);
  assert.equal(avatar.animations.length,43,'keep the original 37 clips plus exactly six selected normals');
  const measured=measureContacts(avatar);assert.equal(measured.normalMotionVersion,'v17');
  const moves=[];
  for(const [slot,reference]of Object.entries(candidate.source.contacts[id])){
   const row=measured.normals[slot],clip=avatar.animations.find(clip=>clip.name===candidate.source.clipName(slot,{rigId:id})),morphs=clip.tracks.filter(track=>track.name.endsWith('.morphTargetInfluences'));
   const meshNames=new Set(avatar.meshes.filter(mesh=>mesh.morphTargetInfluences).map(mesh=>mesh.name));
   if(morphs.length){assert.equal(morphs.length,meshNames.size);assert.deepEqual(new Set(morphs.map(track=>track.name.replace(/\.morphTargetInfluences$/,''))),meshNames);}
   const errors=reference.activeReach.map(point=>{const actual=row.activeReach.find(sample=>Math.abs(sample.phase-point.phase)<.00011);assert.ok(actual,'source phase missing from actual appearance measurement');return {phase:point.phase,reach:Math.abs(actual.reach-point.reach),height:Math.abs(actual.height-point.height)};});
   const surfaceOK=errors.every(point=>point.reach<.015&&point.height<.015);
   if(!surfaceOK)surfaceFailures.push({id,slot,errors,actual:row.activeReach,reference:reference.activeReach});
   const move=normalMove(id,slot),time=normalClipTime(id,slot,move.startup,move,clip.duration,candidate.source.contacts);
   assert.ok(Math.abs(time-reference.contact*clip.duration)<1e-9);
   assert.equal(chooseClip({action:{id:slot}},names,{},{normalMotionSource:candidate.source,rigId:id}),clip.name);
   moves.push({slot,clip:clip.name,tracks:clip.tracks.length,morphTargets:morphs.length,errors,contactSeconds:time,surfaceOK});
  }
  if(['moguzo','godan','bullet'].includes(id)){
   const altered=structuredClone(definition);altered.appearance.parts.head=id==='godan'?'pisuke':'godan';altered.appearance.palette.fur='#397db3';altered.appearance.pattern='spots';
   const changedAvatar=await createAvatar(altered,{normalMotionSource:candidate.source});
   try{
    const changed=measureContacts(changedAvatar),battle=createCustomBattle(altered,'pisuke',1,{measurements:[changed]});
    battle.tick({weak:true},{});const action=battle.fighters[0].action,clip=changedAvatar.animations.find(clip=>clip.name===candidate.source.clipName('stand_weak',{rigId:id}));
    assert.equal(action.customContact.contact,candidate.source.contacts[id].stand_weak.contact);
    assert.equal(normalClipTime(id,'stand_weak',action.startup,action,clip.duration),action.customContact.contact*clip.duration);
   }finally{changedAvatar.dispose();}
  }
  assert.deepEqual([hash(await readFile(originalURL)),hash(await readFile(partsURL))],originals,'no original or part GLB regeneration');
  results.push({id,moves,hurtBounds:measured.hurtBounds,originalSHA256:originals[0],partsSHA256:originals[1]});
 }finally{avatar.dispose();}
}
assert.equal(ACTIVE_NORMAL_MOTION_SOURCE,activeBefore,'candidate QA must not enable a global override');
assert.equal(results.flatMap(result=>result.moves).length,54);
const directory=process.env.MAMOKEN_EVIDENCE??'/tmp/mamoken-p3-normal-source-cpu';await mkdir(directory,{recursive:true});
await writeFile(resolve(directory,'report.json'),JSON.stringify({passed:surfaceFailures.length===0,failures:surfaceFailures,revision:candidate.revision,activeVersion:activeBefore.version,candidateVersion:candidate.source.version,note:'Actual GLTFLoader, 54 clips on original modular skins, CPU skin/morph/contact clocks. Image decoding stubbed. No actual GPU/iPhone performance claim.',results},null,2)+'\n');
assert.equal(surfaceFailures.length,0,'v17 measured table does not match exact runtime skin samples: '+JSON.stringify(surfaceFailures.map(row=>({id:row.id,slot:row.slot,errors:row.errors}))));
console.log('P3 SHARED NORMAL SOURCE CPU PASS: 9 rigs / 54 real v17 clips, morph broadcast, skin surfaces, contact clocks, three existing custom appearances; global selection unchanged');
