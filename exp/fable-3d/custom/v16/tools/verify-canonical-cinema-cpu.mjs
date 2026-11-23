// No WebGL context is created. Load actual rigs, clips and manifests, then
// exercise the same canonical actor -> authored cinema path used by Story.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

const root=new URL('../../../',import.meta.url);
const nativeFetch=globalThis.fetch;
globalThis.self=globalThis;
// These fixtures permit local GLTF parsing without image decoding or GPU upload.
// They do not establish texture, shader or visual quality correctness.
globalThis.createImageBitmap=async()=>({width:1024,height:1024,close(){}});
globalThis.ProgressEvent=class{constructor(type,properties){Object.assign(this,{type},properties);}};
globalThis.fetch=async(url,options)=>{
 const path=typeof url==='string'||url instanceof URL?String(url):url.url;
 if(path.startsWith('file:')){
  try{return new Response(await readFile(fileURLToPath(path)),{headers:{'Content-Type':path.endsWith('.json')?'application/json':'application/octet-stream'}});}
  catch{return new Response('missing',{status:404});}
 }
 return nativeFetch(url,options);
};
const {GLTFLoader}=await import('three/addons/loaders/GLTFLoader.js');
const {clone:cloneSkeleton}=await import('three/addons/utils/SkeletonUtils.js');
const {IDS}=await import(new URL('dojo/balance.js',root));
const {createShowtimeLoader}=await import(new URL('dojo/showtime-assets.js',root));
const {createAuthoredCinematic}=await import(new URL('dojo/authored-cinematic.js',root));
const {bindMorphTargets}=await import(new URL('dojo/morph-binding.js',root));
const loader=new GLTFLoader(),loadShowtime=createShowtimeLoader(new URL('cinematic/v14/',root));
const actors=[],cases=[],warnings=[],errors=[];
const originalWarn=console.warn,originalError=console.error;
const message=args=>args.map(value=>typeof value==='string'?value:String(value)).join(' ');

function sampleTimes(spec){
 const times=new Set([0,spec.durationSeconds]);
 for(let t=.5;t<spec.durationSeconds;t+=.5)times.add(t);
 for(const shot of spec.shots)times.add(Math.min(spec.durationSeconds,shot.start+.001));
 for(const track of Object.values(spec.actorTracks??{}))for(const segment of track.segments)times.add(Math.min(spec.durationSeconds,segment.start+.001));
 return [...times].sort((a,b)=>a-b);
}
try{
 for(const id of IDS){
   const original=await loader.loadAsync(new URL(`chars/${id}/${id}.glb`,root).href),model=cloneSkeleton(original.scene),packs=new Map();
   const bind=clip=>clip&&bindMorphTargets(clip,model);
   const entries=await loadShowtime(id,async(spec,manifestURL)=>{
    let clips=original.animations;
    if(spec.glb){
     const path=new URL(spec.glb,manifestURL).href;
     if(!packs.has(path))packs.set(path,loader.loadAsync(path).then(gltf=>gltf.animations));
     clips=await packs.get(path);
    }
    const clip=clips.find(clip=>clip.name===spec.clip);
    assert.ok(clip,`Missing source clip: ${id}/${spec.clip}`);return clip;
   });
   const meta=await fetch(new URL(`chars/${id}/${id}_motions.json`,root)).then(response=>response.json());
   // Matches Story's canonicalCinemaActor: original two-primitive scene and all
   // original clips, with every authored/reaction stream bound to that scene.
   // The modular editor actor never substitutes for this film-only actor.
   const showtime={};
   for(const [key,entry] of Object.entries(entries)){
    if(key==='reactions'){showtime[key]=Object.fromEntries(Object.entries(entry).map(([name,clip])=>[name,bind(clip)]));continue;}
    showtime[key]={...entry,attacker:bind(entry.attacker),target:bind(entry.target),start:bind(entry.start),
     ...(entry.clips?{clips:Object.fromEntries(Object.entries(entry.clips).map(([name,clip])=>[name,bind(clip)]))}:{})};
   }
   actors.push({id,meta,showtime,gltf:{scene:model,animations:original.animations.map(bind)},
    dispose(){const skeletons=new Set();model.traverse(node=>{if(node.isSkinnedMesh)skeletons.add(node.skeleton);});for(const skeleton of skeletons)skeleton.dispose();model.removeFromParent();}});
 }
 console.warn=(...args)=>warnings.push(message(args));
 console.error=(...args)=>errors.push(message(args));
 for(const [attackerIndex,attacker] of actors.entries())for(const [targetIndex,target] of actors.entries()){
  let movie;
  const result={attacker:attacker.id,target:target.id,mirror:(attackerIndex+targetIndex)%2===1,samples:0,ended:false};
  try{
   const entry=attacker.showtime.ultimate;
   movie=createAuthoredCinematic({entry,attacker,target,reducedMotion:false,audioCue:()=>{},mirror:result.mirror});
   let elapsed=0;
   for(const seconds of sampleTimes(entry.spec)){
    const frame=movie.update(seconds-elapsed,2.1);elapsed=seconds;
    assert.ok(frame.scene?.isScene&&frame.camera?.isCamera,'Invalid cinema frame');
    assert.ok([...frame.camera.position.toArray(),...frame.camera.quaternion.toArray()].every(Number.isFinite),'Non-finite cinema camera');
    frame.scene.updateMatrixWorld(true);
    frame.scene.traverse(node=>{if(node.isBone)assert.ok(node.matrixWorld.elements.every(Number.isFinite),'Non-finite actor bone: '+node.name);});
    result.samples++;result.ended=frame.ended;
   }
   assert.equal(result.ended,true,'Movie did not finish at authored duration');
  }catch(error){result.error=error.message;errors.push(`${attacker.id} -> ${target.id}: ${error.stack??error.message}`);}
  finally{movie?.dispose();}
  cases.push(result);
 }
}finally{
 console.warn=originalWarn;console.error=originalError;
 for(const actor of actors)actor.dispose();
}
const report={schemaVersion:1,passed:cases.length===81&&errors.length===0&&warnings.length===0,
 scope:'Actual Three.js CPU original-rig/clip/manifest construction and timeline playback matching Story canonicalCinemaActor; no GPU rendering',
 imageDecodingStubbed:true,webglRendered:false,actorCount:actors.length,caseCount:cases.length,
 warnings:[...new Set(warnings)],errors:[...new Set(errors)],cases};
const output=new URL('../evidence/canonical-cinema-cpu.json',import.meta.url);
await mkdir(new URL('.',output),{recursive:true});await writeFile(output,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({passed:report.passed,actorCount:actors.length,caseCount:cases.length,warnings:report.warnings,errors:report.errors,webglRendered:false},null,2));
assert.equal(report.passed,true,'Canonical cinema CPU verification failed; see evidence/canonical-cinema-cpu.json');
