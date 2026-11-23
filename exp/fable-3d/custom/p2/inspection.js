import * as THREE from 'three';
import {createAvatar,measureContacts} from '../v16/avatar-factory.js';
import {loadMeshPartManifest,measureMeshPartSockets} from './part-loader.js';
import {measureMeshPartSeamMotion} from './part-verification.js';
import {verifyMeshPartDelivery,mixedMeshPartProfiles} from './part-delivery.js';
const canvas=document.getElementById('view'),scene=new THREE.Scene(),mixedScene=new THREE.Scene(),actors=[],rows=[],catalogRows=[],mixedRows=[],evidence={ready:false,actors,rows,catalogRows,mixedRows,paused:false};window.meshPartEvidence=evidence;
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;scene.background=new THREE.Color('#d9e3de');
scene.add(new THREE.HemisphereLight('#fff5d9','#496957',2.3));const key=new THREE.DirectionalLight('#fff5e6',3.2);key.position.set(2,4,4);scene.add(key);
function litScene(){const stage=new THREE.Scene();stage.background=scene.background.clone();stage.add(scene.children[0].clone(),key.clone());return stage;}
mixedScene.background=scene.background.clone();mixedScene.add(scene.children[0].clone(),key.clone());let activeScene=scene,richLabels='';
const camera=new THREE.OrthographicCamera(-1.45,1.45,1.3,-1.3,.01,30);camera.position.set(.6,.35,4);camera.lookAt(0,.1,0);
const resize=()=>{const width=canvas.clientWidth,height=canvas.clientHeight;renderer.setSize(width,height,false);const aspect=width/height;camera.left=-1.3*aspect;camera.right=1.3*aspect;camera.updateProjectionMatrix();};addEventListener('resize',resize);resize();
function render(){renderer.render(activeScene,camera);evidence.rendererInfo={calls:renderer.info.render.calls,...renderer.info.memory};}
function pose(avatar,mixer,slot,phase=.5){mixer.stopAllAction();const name=['idle','walk_f','guard_stand','hurt_heavy'].includes(slot)?slot:avatar.normalMotionSource.clipName(slot,{rigId:avatar.baseId}),clip=avatar.animations.find(c=>c.name===name);if(!clip)throw Error('実ポーズがありません: '+name);const action=mixer.clipAction(clip);action.setLoop(THREE.LoopOnce,1);action.clampWhenFinished=true;action.play();action.time=clip.duration*phase;mixer.update(0);avatar.scene.updateMatrixWorld(true);}
evidence.setPose=(slot,phase=.5)=>{evidence.paused=true;activeScene=scene;document.getElementById('labels').innerHTML=richLabels;for(const actor of actors)pose(actor.avatar,actor.mixer,slot,phase);render();};
evidence.showMixed=()=>{evidence.paused=true;activeScene=mixedScene;document.getElementById('labels').replaceChildren();for(const row of mixedRows){const label=document.createElement('div');label.className='label';const left=document.createElement('span'),right=document.createElement('span');left.textContent=row.baseId+' — '+row.exchangedSlots+'部位 / '+(row.partial?'partial catalog':'mixed donors');right.textContent=row.moduleIds.join(' · ');label.append(left,right);document.getElementById('labels').append(label);}render();};
try{
 const manifest=await loadMeshPartManifest(),requireFull=new URL(location.href).searchParams.get('full')==='1',delivery=verifyMeshPartDelivery(manifest,{requireFull}),selected=['moguzo-head-godan','godan-hands-bullet','bullet-feet-moguzo'].map(id=>manifest.modules.find(m=>m.id===id)).filter(Boolean);evidence.delivery=delivery;evidence.requireFull=requireFull;
 if(selected.length!==3)throw Error('3代表骨格の実donor部品がまだ揃っていません');
 for(const [index,entry]of selected.entries()){
  const appearance={baseId:entry.targetBaseId,parts:{},palette:{},pattern:'solid'},base=await createAvatar({appearance}),modified=await createAvatar({appearance:{...appearance,meshParts:{[entry.slot]:entry.donorId},pattern:['solid','spots','mask'][index]}});
  const measured=measureContacts(modified),seamMotion=measureMeshPartSeamMotion(modified);
  if(seamMotion.some(row=>row.maxGap>entry.seams.tolerance))throw Error('実アニメ中に交換継ぎ目が開いています: '+entry.id);
  const row={moduleId:entry.id,sha256:entry.sha256,targetBaseId:entry.targetBaseId,slot:entry.slot,donorId:entry.donorId,assembly:modified.partAssembly,measurements:measured,seamMotion,sockets:measureMeshPartSockets(modified),actualMeshes:modified.meshes.filter(m=>m.userData.meshPart).map(m=>({name:m.name,...m.userData.meshPart,vertices:m.geometry.attributes.position.count})),morphTracks:modified.animations.filter(c=>c.tracks.some(t=>t.name.endsWith('.morphTargetInfluences'))).length};rows.push(row);
  for(const [column,avatar]of [base,modified].entries()){
   avatar.scene.position.set(column===0?-.48:.48,.71-index*.81,0);avatar.scene.rotation.y=.18;scene.add(avatar.scene);
   const mixer=new THREE.AnimationMixer(avatar.scene),clip=avatar.animations.find(c=>c.name==='idle');mixer.clipAction(clip).play();actors.push({avatar,mixer});
  }
  const label=document.createElement('div');label.className='label';const left=document.createElement('span'),right=document.createElement('span');left.textContent=entry.targetBaseId+' — 元の部品';right.textContent=entry.id+' / '+entry.sha256.slice(0,12);label.append(left,right);document.getElementById('labels').append(label);
 }
 richLabels=document.getElementById('labels').innerHTML;render();
 for(const row of rows)catalogRows.push({moduleId:row.moduleId,sha256:row.sha256,actualMeshes:row.actualMeshes,rendered:true,drawCalls:evidence.rendererInfo.calls,glError:renderer.getContext().getError(),scope:'rich-paired-representative'});
 for(const entry of manifest.modules.filter(entry=>!selected.some(row=>row.id===entry.id))){
  const avatar=await createAvatar({appearance:{baseId:entry.targetBaseId,parts:{},meshParts:{[entry.slot]:entry.donorId},palette:{},pattern:'spots'}}),stage=litScene(),mixer=new THREE.AnimationMixer(avatar.scene);
  try{
   stage.add(avatar.scene);pose(avatar,mixer,'stand_heavy');renderer.render(stage,camera);
   const glError=renderer.getContext().getError();if(glError)throw Error('実パーツ描画でGLエラー: '+entry.id+'/'+glError);
   const actualMeshes=avatar.meshes.filter(mesh=>mesh.userData.meshPart).map(mesh=>({name:mesh.name,...mesh.userData.meshPart,vertices:mesh.geometry.attributes.position.count}));
   catalogRows.push({moduleId:entry.id,sha256:entry.sha256,actualMeshes,rendered:true,drawCalls:renderer.info.render.calls,glError,scope:'single-actual-normal-pose'});
  }finally{mixer.stopAllAction();mixer.uncacheRoot(avatar.scene);avatar.dispose();}
 }
 for(const [index,profile]of mixedMeshPartProfiles(manifest,{requireFull}).entries()){
  const avatar=await createAvatar({appearance:{baseId:profile.baseId,parts:{},meshParts:profile.meshParts,palette:{},pattern:'stripes'}}),seamMotion=measureMeshPartSeamMotion(avatar),measured=measureContacts(avatar);
  if(seamMotion.some(row=>row.maxGap>.00002))throw Error('複数交換の実継ぎ目が開きました: '+profile.baseId);
  avatar.scene.position.set(0,.71-index*.81,0);avatar.scene.rotation.y=.18;mixedScene.add(avatar.scene);const mixer=new THREE.AnimationMixer(avatar.scene);pose(avatar,mixer,'stand_heavy');
  mixedRows.push({...profile,assembly:avatar.partAssembly,seamMotion,measurements:measured});
 }
 render();evidence.ready=true;
 let previous=performance.now();renderer.setAnimationLoop(now=>{const delta=Math.min((now-previous)/1000,.05);previous=now;if(!evidence.paused)for(const actor of actors)actor.mixer.update(delta);render();});
}catch(error){evidence.error=error.stack??error.message;document.getElementById('error').hidden=false;document.getElementById('error').textContent=evidence.error;console.error(error);}
