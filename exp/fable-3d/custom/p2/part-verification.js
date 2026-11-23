// Optional acceptance sampling of the actual assembled skin. No gameplay values
// are changed. Call before attaching an independent presentation mixer.
import * as THREE from 'three';
import {boundaryVertices} from './part-loader.js';
export function measureMeshPartSeamMotion(avatar,{samples=9}={}){
 if(!Number.isInteger(samples)||samples<2||samples>60)throw Error('継ぎ目のサンプル数が不正です');
 const records=[],v=new THREE.Vector3(),w=new THREE.Vector3(),mixer=new THREE.AnimationMixer(avatar.scene);
 const clipNames=['idle','walk_f','guard_stand',avatar.normalMotionSource.clipName('stand_heavy',{rigId:avatar.baseId}),avatar.normalMotionSource.clipName('crouch_heavy',{rigId:avatar.baseId}),'hurt_heavy'];
 for(const module of avatar.partAssembly?.modules??[]){
  const own=avatar.meshes.filter(m=>m.userData.meshPart?.id===module.id),others=avatar.meshes.filter(m=>m.visible&&!own.includes(m)),pairs=[];
  for(const mesh of own)for(const vertex of boundaryVertices(mesh.geometry)){
   const p=mesh.geometry.attributes.position;let nearest,distance=Infinity;
   for(const target of others){const q=target.geometry.attributes.position;for(let index=0;index<q.count;index++){
    const d=Math.hypot(p.getX(vertex)-q.getX(index),p.getY(vertex)-q.getY(index),p.getZ(vertex)-q.getZ(index));if(d<distance){distance=d;nearest={target,index};}
   }}
   if(distance<=module.seams.tolerance)pairs.push({mesh,vertex,...nearest});
  }
  if(pairs.length!==module.seams.seamVertices)throw Error('動的継ぎ目の対応頂点数が一致しません: '+module.id);
  records.push({moduleId:module.id,pairs,clips:[],maxGap:0});
 }
 try{
  for(const name of clipNames){
   const clip=avatar.animations.find(c=>c.name===name);if(!clip)throw Error('動的継ぎ目の確認クリップがありません: '+name);
   mixer.stopAllAction();const action=mixer.clipAction(clip);action.setLoop(THREE.LoopOnce,1);action.clampWhenFinished=true;action.play();
   const maxima=records.map(()=>0);
   for(let phase=0;phase<samples;phase++){
    action.time=clip.duration*phase/(samples-1);mixer.update(0);avatar.scene.updateMatrixWorld(true);
    for(const mesh of avatar.meshes)mesh.skeleton.update();
    for(const [index,row] of records.entries())for(const pair of row.pairs){
     pair.mesh.getVertexPosition(pair.vertex,v);v.applyMatrix4(pair.mesh.matrixWorld);pair.target.getVertexPosition(pair.index,w);w.applyMatrix4(pair.target.matrixWorld);
     const gap=v.distanceTo(w);if(!Number.isFinite(gap))throw Error('動的継ぎ目が有限値ではありません: '+row.moduleId);maxima[index]=Math.max(maxima[index],gap);
    }
   }
   for(const [index,row] of records.entries()){row.maxGap=Math.max(row.maxGap,maxima[index]);row.clips.push({name,samples,maxGap:maxima[index]});}
  }
  return records.map(({pairs,...row})=>({...row,pairCount:pairs.length,sampledPoses:clipNames.length*samples,source:'actual-skinned-vertices'}));
 }finally{mixer.stopAllAction();mixer.uncacheRoot(avatar.scene);avatar.scene.updateMatrixWorld(true);}
}
