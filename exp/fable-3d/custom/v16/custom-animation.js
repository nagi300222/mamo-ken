// No renderer dependency: native THREE AnimationClip/KeyframeTrack objects are
// cloned and converted, while source rigs and clips remain untouched.
import {AnimationMixer,Vector3,VectorKeyframeTrack,LoopOnce} from '../../preview/vendor/three.module.min.js';
import {specialMove} from '../../dojo/balance.js';
import {specialClipTime} from '../../dojo/special-motion-source.js';
import {bindMorphTargets} from '../../dojo/morph-binding.js';
import {p2MeleeCompatibility,P2_MELEE_COMPATIBILITY_VERSION} from './melee-compatibility-p2.js';
const multiply=(a,b)=>{const [x,y,z,w]=a,[p,q,r,s]=b;return [w*p+x*s+y*r-z*q,w*q-x*r+y*s+z*p,w*r+x*q-y*p+z*s,w*s-x*p-y*q-z*r];};
const inverse=q=>{const d=q.reduce((sum,v)=>sum+v*v,0);return [-q[0]/d,-q[1]/d,-q[2]/d,q[3]/d];};
const normalize=q=>{const d=Math.hypot(...q);return q.map(v=>v/d);};
const vector=(node,key)=>node[key].toArray();
export function inspectClipCompatibility(clip,sourceRoot,targetRoot,{moveKind}={}) {
  const missing=[],unsupported=[],optional=[],bones=new Set();
  for(const track of clip.tracks){
    const match=/^(.+)\.(position|quaternion|scale)$/.exec(track.name);
    if(!match){unsupported.push(track.name);continue;}
    const source=sourceRoot.getObjectByName(match[1]),target=targetRoot.getObjectByName(match[1]);
    if(source?.isBone&&!target?.isBone){
      if(/^(band_|scarf_|rope_|belt_)/.test(match[1])||moveKind==='projectile'&&/^tail_0[4-6]$/.test(match[1]))optional.push(match[1]);
      else missing.push(match[1]);
    }
    if(source?.isBone&&target?.isBone)bones.add(match[1]);
  }
  return {ok:missing.length===0&&bones.size>=3,missing:[...new Set(missing)],optional:[...new Set(optional)],unsupported,boneCount:bones.size};
}
export function retargetCustomClip(clip,sourceRoot,targetRoot,{name=clip.name,moveKind,moveRef,targetDefinition,motionSpec,sourceIdleClip,targetIdleClip}={}) {
  const p2=moveKind&&moveKind!=='projectile'?p2MeleeCompatibility(targetDefinition,moveRef,{sourceVersion:motionSpec?.sourceVersion}):null;
  if(p2&&(!p2.supported||motionSpec?.runtimeClip!==p2.identity.runtimeClip||motionSpec?.actualSourceClip!==p2.identity.sourceClip||motionSpec?.sourceFile!==p2.identity.sourceFile||clip.name!==p2.identity.runtimeClip))
    throw Error('異骨格近接のモーション互換を確認できません: '+(p2.reason||'選択した実制作データの参照が不一致です'));
  const compatibility=inspectClipCompatibility(clip,sourceRoot,targetRoot,{moveKind});
  if(!compatibility.ok)throw new Error('モーション互換性を確認できません: '+(compatibility.missing.join(', ')||'必要な骨が不足'));
  const result=clip.clone();result.name=name;
  result.tracks=result.tracks.flatMap(track=>{
    const match=/^(.+)\.(position|quaternion|scale)$/.exec(track.name);
    // Morph targets belong to meshes rather than the shared skeleton. They are
    // excluded instead of binding a foreign mesh's mouth/eyes to the avatar.
    if(!match)return [];
    const source=sourceRoot.getObjectByName(match[1]),target=targetRoot.getObjectByName(match[1]);
    if(!source?.isBone||!target?.isBone)return [];
    const property=match[2],a=vector(source,property),b=vector(target,property),values=track.values;
    if(property==='quaternion'){
      const correction=multiply(b,inverse(a));
      for(let i=0;i<values.length;i+=4){const q=normalize(multiply(correction,Array.from(values.slice(i,i+4))));values.set(q,i);}
    }else if(property==='position'){
      const sourceLength=Math.hypot(...a),targetLength=Math.hypot(...b);
      const ratio=sourceLength>.025?Math.max(.6,Math.min(1.6,targetLength/sourceLength)):1;
      for(let i=0;i<values.length;i++)values[i]=b[i%3]+(values[i]-a[i%3])*ratio;
    }else for(let i=0;i<values.length;i++)values[i]=a[i%3]===0?b[i%3]:b[i%3]*values[i]/a[i%3];
    return [track];
  });
  result.userData={...(result.userData??{}),customRetarget:{sourceClip:clip.name,boneCount:compatibility.boneCount,dropped:[...compatibility.unsupported,...compatibility.optional]}};
  if(p2){
    const morphs=sharedMorphTracks(clip,sourceRoot,targetRoot);
    result.tracks.push(...morphs.tracks);
    Object.assign(result.userData.customRetarget,{moveRef,targetRigId:p2.baseId,targetAppearanceKey:p2.targetAppearanceKey,
      compatibilityVersion:P2_MELEE_COMPATIBILITY_VERSION,sourceVersion:motionSpec.sourceVersion,sourceFile:motionSpec.sourceFile,actualSourceClip:motionSpec.actualSourceClip,
      sharedMorphNames:morphs.names,morphBindings:morphs.tracks.length,
      dropped:[...compatibility.optional,...compatibility.unsupported.filter(name=>!name.endsWith('.morphTargetInfluences'))]});
    if(p2.compatibility==='measured-foreign-melee'){
      if(!sourceIdleClip||!targetIdleClip)throw Error('異骨格近接の接地には元の両骨格のidle実クリップが必要です');
      result.userData.customRetarget.grounding=groundClone(result,clip,sourceRoot,targetRoot,sourceIdleClip,targetIdleClip,motionSpec,specialMove(p2.sourceCharacterId,2));
    }
  }
  return result;
}

function sharedMorphTracks(clip,sourceRoot,targetRoot){
 const suffix='.morphTargetInfluences',streams=clip.tracks.filter(track=>track.name.endsWith(suffix));
 if(!streams.length)return {tracks:[],names:[]};
 const stream=streams[0],sourceNode=sourceRoot.getObjectByName(stream.name.slice(0,-suffix.length))??sourceRoot,sourceMeshes=[],targetMeshes=[];
 sourceNode.traverse(node=>{if(node.morphTargetDictionary)sourceMeshes.push(node);});
 targetRoot.traverse(node=>{if(node.morphTargetDictionary&&node.visible)targetMeshes.push(node);});
 const namesOf=mesh=>Object.keys(mesh.morphTargetDictionary).sort((a,b)=>mesh.morphTargetDictionary[a]-mesh.morphTargetDictionary[b]);
 if(!sourceMeshes.length||!targetMeshes.length)throw Error('手の形・表情の実モーフ辞書がありません');
 const sourceNames=namesOf(sourceMeshes[0]),targetNames=namesOf(targetMeshes[0]);
 if(sourceNames.length!==stream.getValueSize()||sourceMeshes.some(mesh=>namesOf(mesh).join('|')!==sourceNames.join('|'))||
  targetMeshes.some(mesh=>namesOf(mesh).join('|')!==targetNames.join('|'))||targetNames.length!==sourceNames.length||targetNames.some(name=>!sourceNames.includes(name)))throw Error('手の形・表情の実モーフの意味・順序が未対応です');
 for(const other of streams)if(other.times.length!==stream.times.length||other.values.length!==stream.values.length||other.times.some((v,i)=>v!==stream.times[i])||other.values.some((v,i)=>v!==stream.values[i]))throw Error('複数の異なるモーフ流は移植できません');
 return {names:targetNames,tracks:targetMeshes.map(mesh=>{
  const track=stream.clone();track.name=mesh.name+suffix;const values=track.values.slice();
  for(let i=0;i<stream.times.length;i++)for(let j=0;j<targetNames.length;j++)values[i*targetNames.length+j]=stream.values[i*sourceNames.length+sourceNames.indexOf(targetNames[j])];
  track.values=values;return track;
 })};
}

// This adapter changes only a cloned clip's pelvis translation. Support is
// established by the source's real two-foot minimum relative to its own idle;
// intentional raised feet / jumps are never pulled down onto the floor.
function groundClone(result,sourceClip,sourceRoot,targetRoot,sourceIdleClip,targetIdleClip,spec,move){
 const snapshots=[];
 for(const root of [sourceRoot,targetRoot])root.traverse(node=>{if(node.isBone||node.morphTargetInfluences)snapshots.push({node,p:node.position.clone(),q:node.quaternion.clone(),s:node.scale.clone(),m:node.morphTargetInfluences?.slice()});});
 const sourceMixer=new AnimationMixer(sourceRoot),targetMixer=new AnimationMixer(targetRoot),v=new Vector3();
 const feet=root=>{const records=[];root.traverse(mesh=>{
  if(!mesh.isSkinnedMesh||!mesh.visible)return;const si=mesh.geometry.attributes.skinIndex,sw=mesh.geometry.attributes.skinWeight,indices=[];
  for(let i=0;i<si.count;i++){let k=0;for(let j=1;j<4;j++)if(sw.getComponent(i,j)>sw.getComponent(i,k))k=j;if(/foot|shin|thigh|knee|ankle|leg|toe/i.test(mesh.skeleton.bones[si.getComponent(i,k)].name))indices.push(i);}
  if(indices.length)records.push({mesh,indices});
 });if(!records.length)throw Error('接地を計測する実足メッシュがありません');return records;};
 const srcFeet=feet(sourceRoot),dstFeet=feet(targetRoot);
 const floor=(root,records)=>{root.updateMatrixWorld(true);const inverse=root.matrixWorld.clone().invert();let min=Infinity;
  for(const {mesh,indices}of records)for(const i of indices){mesh.getVertexPosition(i,v);v.applyMatrix4(mesh.matrixWorld).applyMatrix4(inverse);min=Math.min(min,v.y);}if(!Number.isFinite(min))throw Error('接地計測が有限値ではありません');return min;};
 const play=(mixer,clip)=>{const action=mixer.clipAction(clip);action.reset().setLoop(LoopOnce,1);action.clampWhenFinished=true;action.play().setEffectiveTimeScale(0);return action;};
 const at=(mixer,action,time)=>{action.time=time;mixer.update(0);};
 try{
  const si=play(sourceMixer,bindMorphTargets(sourceIdleClip,sourceRoot)),ti=play(targetMixer,targetIdleClip);
  at(sourceMixer,si,Math.min(.2,sourceIdleClip.duration/2));at(targetMixer,ti,Math.min(.2,targetIdleClip.duration/2));
  const sourceIdleFloor=floor(sourceRoot,srcFeet),targetIdleFloor=floor(targetRoot,dstFeet);sourceMixer.stopAllAction();targetMixer.stopAllAction();
  const sourceAction=play(sourceMixer,bindMorphTargets(sourceClip,sourceRoot)),targetAction=play(targetMixer,result),pelvis=targetRoot.getObjectByName('pelvis'),position=result.tracks.find(track=>track.name==='pelvis.position');
  if(!pelvis||!position||position.getValueSize()!==3)throw Error('検証済みpelvis位置流が無い技には接地補正を適用できません');
  const original=position.createInterpolant(new Float32Array(3)),total=move.startup+move.active+move.recovery;
  const gameTimes=Array.from({length:total+1},(_,frame)=>specialClipTime(spec,move,frame,result.duration));
  const times=[...new Set([...sourceClip.tracks.flatMap(track=>Array.from(track.times)),...gameTimes,...Array.from({length:Math.ceil(result.duration*60)+1},(_,i)=>Math.min(result.duration,i/60))].map(Math.fround))].sort((a,b)=>a-b);
  const values=[],samples=[];let maxOffset=0;
  for(const time of times){
   at(sourceMixer,sourceAction,time);at(targetMixer,targetAction,time);
   const sourceFloor=floor(sourceRoot,srcFeet),targetFloor=floor(targetRoot,dstFeet),lift=sourceFloor-sourceIdleFloor;
   const q=Math.max(0,Math.min(1,(lift-.005)/.020)),support=1-q*q*(3-2*q),offset=Math.max(0,targetIdleFloor-targetFloor)*support;
   if(offset>.05){const error=Error('接地補正が安定しないため、この組み合わせは未対応です');error.code='P2_GROUNDING_LIMIT';error.details={time,sourceFloor,targetFloor,sourceIdleFloor,targetIdleFloor,lift,support,offset};throw error;}
   const point=new Vector3(0,offset,0).applyMatrix4(targetRoot.matrixWorld),origin=new Vector3().applyMatrix4(targetRoot.matrixWorld);
   pelvis.parent.worldToLocal(point);pelvis.parent.worldToLocal(origin);point.sub(origin);
   const old=original.evaluate(time);values.push(old[0]+point.x,old[1]+point.y,old[2]+point.z);maxOffset=Math.max(maxOffset,offset);
   samples.push({time,sourceFloor,targetFloor,lift,support,offset});
  }
  targetMixer.stopAllAction();targetMixer.uncacheRoot(targetRoot);
  result.tracks=result.tracks.map(track=>track===position?new VectorKeyframeTrack(position.name,new Float32Array(times),new Float32Array(values),position.getInterpolation()):track);
  const corrected=play(targetMixer,result),probes=[];
  for(let frame=0;frame<=total;frame++){
   const time=specialClipTime(spec,move,frame,result.duration);at(sourceMixer,sourceAction,time);at(targetMixer,corrected,time);
   const sourceFloor=floor(sourceRoot,srcFeet),correctedFloor=floor(targetRoot,dstFeet),lift=sourceFloor-sourceIdleFloor;
   if(lift<=.005&&correctedFloor<targetIdleFloor-.001)throw Error('接地補正後の実足がidle足底より沈んでいます');
   probes.push({frame,time,sourceFloor,correctedFloor,sourceRaised:lift>.025});
  }
  return {method:'source-support-host-idle-up-v1',sourceIdleFloor,targetIdleFloor,maxOffset,samples,probes};
 }finally{
  sourceMixer.stopAllAction();targetMixer.stopAllAction();sourceMixer.uncacheRoot(sourceRoot);targetMixer.uncacheRoot(targetRoot);
  for(const {node,p,q,s,m}of snapshots){node.position.copy(p);node.quaternion.copy(q);node.scale.copy(s);if(m)for(let i=0;i<m.length;i++)node.morphTargetInfluences[i]=m[i];}
  sourceRoot.updateMatrixWorld(true);targetRoot.updateMatrixWorld(true);
 }
}

// Same source contact clocks as the original authored-special player. Only the
// game clock selects a pose; hitstop must hold this exact sampled time.
export function customSpecialTime(frame,move,spec,duration) {
  const contact=spec.contactSeconds??Math.min(duration*.45,duration-.001);
  if(frame<=move.startup)return Math.max(0,contact*frame/move.startup);
  const rest=move.active+move.recovery;
  return Math.min(duration,contact+(duration-contact)*(frame-move.startup)/Math.max(1,rest));
}
