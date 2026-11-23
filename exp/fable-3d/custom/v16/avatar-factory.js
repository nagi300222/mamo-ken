import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {clone as cloneSkeleton} from 'three/addons/utils/SkeletonUtils.js';
import {NORMAL_CONTACTS} from '../../dojo/normal-contacts-v151.js';

export const AVATAR_BASE_IDS=Object.freeze(['moguzo','pisuke','godan','hakuma','chirka','takimaru','yomikage','bullet','dark_moguzo']);
const NAMES=['モグゾー','ピスケ','ゴダン','ハクマ','チルカ','タキマル','ヨミカゲ','バレット','ダークモグゾー'];
const shapeChoices=Object.freeze([{id:'base',label:'ベースと同じ'},...AVATAR_BASE_IDS.map((id,i)=>({id,label:NAMES[i]+'型'}))]);
export const AVATAR_PARTS=Object.freeze(Object.fromEntries(['head','ears','tail','hands','feet','accessory'].map(slot=>[slot,slot==='accessory'?[{id:'base',label:'ベースの装飾'},{id:'none',label:'装飾なし'}]:shapeChoices])));
export const AVATAR_PATTERNS=Object.freeze([{id:'solid',label:'基本の毛並み'},{id:'spots',label:'斑点'},{id:'stripes',label:'しま模様'},{id:'mask',label:'目元の模様'}]);
export const AVATAR_PALETTE_KEYS=Object.freeze(['fur','belly','muzzle','paw','foot','ear','tail','accent','pattern']);
const REGION_KEYS=['fur','belly','muzzle','paw','foot','ear','tail','accent'];
const cache=new Map();let manifestPromise;
const ASSETS=new URL('./assets/',import.meta.url);
export function loadAvatarManifest(){return manifestPromise??=(fetch(new URL('manifest.json',ASSETS)).then(r=>{if(!r.ok)throw Error('アバターの部位表を読み込めません');return r.json();}).catch(error=>{manifestPromise=undefined;throw error;}));}
const load=(url,loader)=>{const key=String(url);if(!cache.has(key))cache.set(key,loader.loadAsync(key).catch(e=>{cache.delete(key);throw e;}));return cache.get(key);};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=(a,b,v)=>{const t=clamp((v-a)/(b-a),0,1);return t*t*(3-2*t);};
const hex=v=>typeof v==='string'&&/^#[0-9a-f]{6}$/i.test(v);
const xyz=p=>new THREE.Vector3(p[0],p[2],-p[1]);

// A graft changes a selected region with the donor generator's dimensions while
// retaining the base's shared seam vertices, skin weights and bone hierarchy.
// It is deliberately bounded: this is a parameterized shape graft, not a claim
// that arbitrary remeshed heads can be swapped without a compatibility pass.
export function graftPoint(point,region,base,donors){
 const p=point.clone(), P=base.parameters;
 const apply=(target,pivot,ratios,amount)=>{
  p.x+=(pivot.x+(p.x-pivot.x)*ratios[0]-p.x)*amount;
  p.y+=(pivot.y+(p.y-pivot.y)*ratios[1]-p.y)*amount;
  p.z+=(pivot.z+(p.z-pivot.z)*ratios[2]-p.z)*amount;
 };
 if(region===1&&donors.head){
  const d=donors.head.parameters,c=xyz(P.head_c),r=P.head_r;
  const amount=smooth(c.y-r[2]*.90,c.y-r[2]*.32,p.y);
  apply(p,c,[clamp(d.head_r[0]/r[0],.78,1.25),clamp(d.head_r[2]/r[2],.78,1.25),clamp(d.head_r[1]/r[1],.78,1.25)],amount);
 }
 if(region===2&&donors.ears){
  const d=donors.ears.parameters,c=xyz(P.head_c),sign=p.x<0?-1:1;
  const ear=c.clone().add(new THREE.Vector3(sign*P.ear_off[0],P.ear_off[2],-P.ear_off[1]));
  const amount=smooth(ear.y-P.ear_r[2],ear.y-P.ear_r[2]*.1,p.y);
  apply(p,ear,[clamp(d.ear_r[0]/P.ear_r[0],.7,1.5),clamp(d.ear_r[2]/P.ear_r[2],.7,1.5),clamp(d.ear_r[1]/P.ear_r[1],.7,1.5)],amount);
 }
 if(region===3&&donors.hands){
  const d=donors.hands.parameters,side=p.x<0?'R':'L',w=xyz(P.wrists[side]);
  const amount=smooth(.005,.035,p.distanceTo(w));
  // Restrict the graft to the paw beyond the wrist, leaving elbows/shoulder seams.
  const hand=new THREE.Vector3(...P.hands[side].map(row=>row[0]));
  const direction=new THREE.Vector3(hand.x,hand.z,-hand.y);
  const along=p.clone().sub(w).dot(direction);
  if(along>-.006)apply(p,w,[clamp(d.fist[1]/P.fist[1],.72,1.35),clamp(d.fist[2]/P.fist[2],.72,1.35),clamp(d.fist[0]/P.fist[0],.72,1.35)],amount*smooth(-.006,.02,along));
 }
 if(region===4&&donors.feet){
  const d=donors.feet.parameters,side=p.x<0?'R':'L',a=xyz(P.ankles[side]);
  const amount=1-smooth(P.ankle_z*.7,P.ankle_z*1.5,p.y);
  apply(p,a,[clamp(d.foot_w/P.foot_w,.72,1.3),1,clamp(d.foot_len/P.foot_len,.75,1.25)],amount);
 }
 if(region===5&&donors.tail){
  const d=donors.tail.parameters,t=xyz(P.tail_base),amount=smooth(.008,.04,p.distanceTo(t));
  const ratio=clamp(d.tail_len/P.tail_len,.6,1.65);
  apply(p,t,[clamp(d.tail_r[0]/P.tail_r[0],.65,1.5),1,ratio],amount);
 }
 return p;
}
function reshapeGeometry(geometry,base,donors){
 const g=geometry.clone(),position=g.attributes.position,regions=g.attributes._avatar_part;
 if(!regions)return g;
 const v=new THREE.Vector3(),delta=new THREE.Vector3();
 for(let i=0;i<position.count;i++){
  v.fromBufferAttribute(position,i);const result=graftPoint(v,regions.getX(i),base,donors);
  for(const m of g.morphAttributes.position??[]){
   delta.fromBufferAttribute(m,i);
   const end=g.morphTargetsRelative?v.clone().add(delta):delta;
   const warped=graftPoint(end,regions.getX(i),base,donors);
   if(g.morphTargetsRelative)warped.sub(result);
   m.setXYZ(i,warped.x,warped.y,warped.z);
  }
  position.setXYZ(i,result.x,result.y,result.z);
 }
 // Retain smooth seam normals. Recomputing per module would introduce a hard
 // shading edge where the original one-piece surface was partitioned.
 const normal=g.attributes.normal;
 if(normal){
  const original=geometry.attributes.position,n=new THREE.Vector3(),t=new THREE.Vector3(),b=new THREE.Vector3(),origin=new THREE.Vector3();
  for(let i=0;i<normal.count;i++){
   origin.fromBufferAttribute(original,i);n.fromBufferAttribute(normal,i).normalize();
   t.set(Math.abs(n.x)<.9?1:0,Math.abs(n.x)<.9?0:1,0).cross(n).normalize();b.crossVectors(n,t).normalize();
   const q=graftPoint(origin,regions.getX(i),base,donors);
   const a=graftPoint(origin.clone().addScaledVector(t,.0001),regions.getX(i),base,donors).sub(q);
   const c=graftPoint(origin.clone().addScaledVector(b,.0001),regions.getX(i),base,donors).sub(q);
   n.crossVectors(a,c).normalize();normal.setXYZ(i,n.x,n.y,n.z);
  }
  normal.needsUpdate=true;
 }
 position.needsUpdate=true;g.computeBoundingBox();g.computeBoundingSphere();return g;
}
function appearanceMaterial(original,base,palette,pattern){
 const material=original.clone();const originalColor=original.color?.clone()??new THREE.Color(1,1,1);
 const colors=REGION_KEYS.map(k=>new THREE.Color(hex(palette[k])?palette[k]:base.palette[k]));
 const reference=REGION_KEYS.map(k=>new THREE.Color(base.palette[k]));
 const patternColor=new THREE.Color(hex(palette.pattern)?palette.pattern:'#493a56');
 material.onBeforeCompile=shader=>{
  shader.uniforms.avatarColors={value:colors};shader.uniforms.avatarReference={value:reference};
  shader.uniforms.avatarPatternColor={value:patternColor};shader.uniforms.avatarPattern={value:['solid','spots','stripes','mask'].indexOf(pattern)};
  shader.vertexShader='attribute float _avatar_region; varying float vAvatarRegion; varying vec3 vAvatarRest;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvAvatarRegion = _avatar_region; vAvatarRest=position;');
  shader.fragmentShader='uniform vec3 avatarColors[8]; uniform vec3 avatarReference[8]; uniform vec3 avatarPatternColor; uniform int avatarPattern; varying float vAvatarRegion; varying vec3 vAvatarRest;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
   if(vAvatarRegion < 7.5) {
    int region=int(clamp(floor(vAvatarRegion+.5),0.,7.));
    diffuseColor.rgb *= avatarColors[region] / max(avatarReference[region],vec3(.012));
    float mask=0.;
    if(vAvatarRegion < .5) {
     if(avatarPattern==1){vec3 q=fract(vAvatarRest*vec3(29.,23.,29.))-.5; mask=1.-smoothstep(.16,.23,length(q.xy));}
     if(avatarPattern==2)mask=smoothstep(.73,.89,sin(vAvatarRest.y*115.+sin(vAvatarRest.x*29.)*1.3));
     if(avatarPattern==3){float y=vAvatarRest.y; mask=(1.-smoothstep(.044,.068,abs(y-${(base.parameters.head_c[2]+.02).toFixed(5)})))*smoothstep(.035,.075,abs(vAvatarRest.x))*(1.-smoothstep(.072,.11,abs(vAvatarRest.x)))*smoothstep(.045,.08,vAvatarRest.z);}
    }
    diffuseColor.rgb=mix(diffuseColor.rgb,avatarPatternColor*(.65+.35*diffuseColor.rgb),mask*.72);
   }
  `);
 };
 material.customProgramCacheKey=()=>`mamoken-avatar-16-${base.id}-${pattern}`;
 material.color.copy(originalColor);return material;
}

export async function createAvatar(definition,options={}){
 const manifest=await loadAvatarManifest(),appearance=definition.appearance??definition;
 const baseId=appearance.baseId??'moguzo',base=manifest.bases[baseId];
 if(!base)throw Error('未対応の骨格です: '+baseId);
 const parts=appearance.parts??{},donors={};
 for(const slot of ['head','ears','hands','feet','tail']){
  const id=parts[slot]??'base';if(id==='base'||id===baseId)continue;
  if(!manifest.bases[id])throw Error('未対応の部品です: '+slot+'/'+id);
  if(slot==='tail'&&manifest.bases[id].parameters.tail_n!==base.parameters.tail_n)throw Error('長尾と短尾の骨格は異なります。同じ尾骨数の部品を選んでください');
  donors[slot]=manifest.bases[id];
 }
 if(!['base','none',undefined].includes(parts.accessory))throw Error('この装飾の交換は骨格互換を確認中です');
 const loader=options.loader??new GLTFLoader();
 const gltf=await load(new URL(base.file,options.baseURL??ASSETS),loader);
 const normal=await load(new URL(`../../normal/v15/${baseId}_normals.glb`,import.meta.url),loader);
 const scene=cloneSkeleton(gltf.scene),meshes=[],geometries=new Set(),materials=new Set(),skeletons=new Set(),bones=new Map();
 scene.traverse(object=>{
  if(object.isBone)bones.set(object.name,object);
  if(!object.isSkinnedMesh)return;
  const source=Array.isArray(object.material)?object.material[0]:object.material;
  object.geometry=reshapeGeometry(object.geometry,base,donors);geometries.add(object.geometry);
  const part=source.name.replace(/^avatar_part_/,'');object.userData.avatarPart=part;
  object.material=appearanceMaterial(source,base,appearance.palette??{},appearance.pattern??'solid');materials.add(object.material);
  if(part==='accessory'&&parts.accessory==='none')object.visible=false;
  object.frustumCulled=false;skeletons.add(object.skeleton);meshes.push(object);
 });
 scene.updateMatrixWorld(true);
 const animations=[...gltf.animations,...normal.animations];let disposed=false;
 return {scene,animations,bones,meshes,baseId,appearance:structuredClone(appearance),parameters:base.parameters,
  grafts:Object.keys(donors),gltf:{scene,animations},
  dispose(){if(disposed)return;disposed=true;scene.removeFromParent();for(const g of geometries)g.dispose();for(const m of materials)m.dispose();for(const s of skeletons)s.dispose();}
 };
}
const bonePart=name=>{const n=name.toLowerCase().replace(/[^a-z0-9]/g,''),side=n.endsWith('l')?'L':n.endsWith('r')?'R':'';
 if(/paw|hand|wrist|elbow|shoulder|clav|forearm|upperarm|arm/.test(n))return 'arm'+side;
 if(/foot|shin|thigh|knee|ankle|leg|toe/.test(n))return 'leg'+side;
 if(/tail/.test(n))return 'tail';if(/head|jaw|ear|neck|snout|nose|beak/.test(n))return 'head';return 'body';};

// CPU skin sampling is performed once per appearance before a custom Battle.
// It uses the actual post-graft vertices, not a guessed body-scale multiplier.
export function measureContacts(avatar){
 const root=avatar.scene,old={p:root.position.clone(),q:root.quaternion.clone(),s:root.scale.clone()};
 root.position.set(0,0,0);root.quaternion.identity();root.scale.set(1,1,1);
 const mixer=new THREE.AnimationMixer(root),v=new THREE.Vector3(),meshData=[];
 for(const mesh of avatar.meshes){
  if(!mesh.visible||mesh.userData.avatarPart==='accessory')continue;
  const {skinIndex,skinWeight,position}=mesh.geometry.attributes,groups=[];
  for(let i=0;i<position.count;i++){
   let best=0;for(let k=1;k<4;k++)if(skinWeight.getComponent(i,k)>skinWeight.getComponent(i,best))best=k;
   groups.push(bonePart(mesh.skeleton.bones[skinIndex.getComponent(i,best)].name));
  }
  meshData.push({mesh,groups});
 }
 const at=(name,time)=>{
  mixer.stopAllAction();const clip=avatar.animations.find(a=>a.name===name);if(!clip)throw Error('接触計測に必要なアニメがありません: '+name);
  const action=mixer.clipAction(clip);action.play();action.time=Math.min(clip.duration,time);mixer.update(0);root.updateMatrixWorld(true);
 };
 const surface=(part)=>{
  let reach=-Infinity,height=0;const ys=[];
  for(const {mesh,groups} of meshData)for(let i=0;i<groups.length;i++){
   const group=groups[i];if(part&&group!==part)continue;
   mesh.getVertexPosition(i,v);v.applyMatrix4(mesh.matrixWorld);
   if(part){if(v.z>reach){reach=v.z;height=v.y;}}
   else if(['body','head','legL','legR'].includes(group))ys.push(v.y);
  }
  if(part&&!Number.isFinite(reach))throw Error('打撃部位の頂点がありません: '+part);
  ys.sort((a,b)=>a-b);return part?{reach:+reach.toFixed(4),height:+height.toFixed(4)}:{bottom:0,top:+(ys[Math.floor(ys.length*.98)]??0).toFixed(4)};
 };
 try{
  const normals={};
  for(const [slot,reference] of Object.entries(NORMAL_CONTACTS[avatar.baseId])){
   const clip=avatar.animations.find(a=>a.name==='v15_'+slot);if(!clip)throw Error('通常技がありません: '+slot);
   const activeReach=[0,.5,1].map(phase=>{at(clip.name,(reference.contact+(reference.contactEnd-reference.contact)*phase)*clip.duration);return {phase,...surface(reference.attackPart)};});
   normals[slot]={...reference,...activeReach[0],activeReach};delete normals[slot].phase;
  }
  const bounds=(names,phases=[0,.25,.5,.75])=>{let top=0;for(const name of names){const clip=avatar.animations.find(a=>a.name===name);if(!clip)continue;for(const phase of phases){at(name,phase*clip.duration);top=Math.max(top,surface(null).top);}}return {bottom:0,top};};
  const hurtBounds={stand:bounds(['idle','guard_stand']),crouch:bounds(['crouch','guard_crouch'],[.65,.8,.98])};
  at('idle',0);const paw=[...avatar.bones.values()].find(b=>b.name.replace(/[^a-z0-9]/gi,'').toLowerCase()==='pawl');
  const socket=paw?paw.getWorldPosition(v):v.set(0,.35,.17);
  return {normals,hurtBounds,projectileSocket:{forward:+socket.z.toFixed(4),height:+socket.y.toFixed(4)},source:'runtime-skinned-mesh',baseId:avatar.baseId,grafts:[...avatar.grafts]};
 }finally{
  mixer.stopAllAction();mixer.uncacheRoot(root);root.position.copy(old.p);root.quaternion.copy(old.q);root.scale.copy(old.s);root.updateMatrixWorld(true);
 }
}

// Source-specific firing sockets are measured from the selected retargeted clip.
// Call after retargetCustomClip and use the same contact seconds as gameplay.
export function measureProjectileSocket(avatar,clip,contactSeconds){
 if(!clip?.isAnimationClip && !(clip instanceof THREE.AnimationClip))throw Error('発射計測には実アニメーションが必要です');
 if(!Number.isFinite(contactSeconds)||contactSeconds<0)throw Error('発射時刻が不正です');
 const root=avatar.scene,position=root.position.clone(),rotation=root.quaternion.clone(),scale=root.scale.clone();
 const mixer=new THREE.AnimationMixer(root),out=new THREE.Vector3();
 try{
  root.position.set(0,0,0);root.quaternion.identity();root.scale.set(1,1,1);
  const action=mixer.clipAction(clip);action.play();action.time=Math.min(contactSeconds,clip.duration);mixer.update(0);root.updateMatrixWorld(true);
  const bones=[...avatar.bones.values()];
  const paw=bones.find(b=>b.name.replace(/[^a-z0-9]/gi,'').toLowerCase()==='pawl');
  if(!paw)throw Error('発射用の手首ソケットがありません');
  paw.getWorldPosition(out);
  return {forward:+out.z.toFixed(4),height:+out.y.toFixed(4),bone:paw.name,atSeconds:contactSeconds,source:'runtime-bone-world-position'};
 }finally{
  mixer.stopAllAction();mixer.uncacheRoot(root);root.position.copy(position);root.quaternion.copy(rotation);root.scale.copy(scale);root.updateMatrixWorld(true);
 }
}
