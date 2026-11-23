import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MESH_PART_VERSION,MESH_PART_MORPHS,validateMeshPartManifest} from './part-contract.js';
const DEFAULT_MANIFEST=new URL('./assets/manifest.json',import.meta.url);
const manifests=new Map(),assets=new Map();
const fail=message=>{throw Error('実パーツ交換: '+message);};
export function loadMeshPartManifest({url=DEFAULT_MANIFEST,fetch:fetcher=globalThis.fetch}={}){
 const key=String(url);
 if(!manifests.has(key))manifests.set(key,fetcher(url).then(r=>{if(!r.ok)fail('部品表を読み込めません');return r.json();}).then(validateMeshPartManifest).catch(e=>{manifests.delete(key);throw e;}));
 return manifests.get(key);
}
export async function loadMeshPartModules(entries,{loader=new GLTFLoader(),baseURL=new URL('./assets/',import.meta.url),fetch:fetcher=globalThis.fetch}={}){
 return Promise.all(entries.map(async entry=>{
  const url=new URL(entry.file,baseURL),key=String(url)+'#'+entry.sha256;
  if(!assets.has(key))assets.set(key,(async()=>{
   const response=await fetcher(url);if(!response.ok)fail('部品を読み込めません: '+entry.id);
   const bytes=await response.arrayBuffer();if(bytes.byteLength!==entry.bytes)fail('部品サイズ不一致: '+entry.id);
   const digest=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(v=>v.toString(16).padStart(2,'0')).join('');
   if(digest!==entry.sha256)fail('部品ハッシュ不一致: '+entry.id);
   const gltf=await loader.parseAsync(bytes,new URL('.',url).href);return gltf;
  })().catch(error=>{assets.delete(key);throw error;}));
  return {entry,gltf:await assets.get(key)};
 }));
}
const matrixError=(a,b)=>Math.max(...a.elements.map((value,index)=>Math.abs(value-b.elements[index])));
// GLTFLoader sanitizes exported node names for PropertyBinding (paw.L -> pawL).
// Manifest joint names remain the actual GLB names, in exported skin order.
const runtimeBoneName=name=>THREE.PropertyBinding.sanitizeNodeName(name);
const pointKey=(attribute,index)=>[attribute.getX(index),attribute.getY(index),attribute.getZ(index)].map(v=>Math.round(v*1e6)).join(',');
// Weld UV duplicates only for edge counting; no vertices or source topology are changed.
export function boundaryVertices(geometry){
 const position=geometry.attributes.position,index=geometry.index;if(!position||!index||index.count%3)fail('三角形インデックスが必要です');
 const keys=Array.from({length:position.count},(_,i)=>pointKey(position,i)),edges=new Map(),representatives=new Map();
 for(let i=0;i<position.count;i++)if(!representatives.has(keys[i]))representatives.set(keys[i],i);
 for(let i=0;i<index.count;i+=3){const tri=[index.getX(i),index.getX(i+1),index.getX(i+2)];for(let j=0;j<3;j++){
  const a=keys[tri[j]],b=keys[tri[(j+1)%3]];if(a===b)continue;
  const key=a<b?a+'|'+b:b+'|'+a,edge=edges.get(key);if(edge)edge.count++;else edges.set(key,{a,b,count:1});
 }}
 const boundary=new Set();for(const edge of edges.values()){if(edge.count>2)fail('非多様体の継ぎ目です');if(edge.count===1){boundary.add(representatives.get(edge.a));boundary.add(representatives.get(edge.b));}}
 return [...boundary];
}
function validateGeometry(mesh,entry){
 const geometry=mesh.geometry,{position,normal,skinIndex,skinWeight,_avatar_region:regions,_avatar_part:part}=geometry.attributes;
 if(!position||!normal||!skinIndex||!skinWeight||!regions||!part||skinIndex.itemSize!==4||skinWeight.itemSize!==4)fail('位置・法線・4重み・色領域・部位属性が必要: '+entry.id);
 const morphs=geometry.morphAttributes.position??[];
 if(morphs.length!==4||!geometry.morphTargetsRelative||JSON.stringify(Object.keys(mesh.morphTargetDictionary??{}))!==JSON.stringify(MESH_PART_MORPHS))fail('4相対表情ストリーム不一致: '+entry.id);
 for(const attribute of [position,normal,skinIndex,skinWeight,regions,part,...morphs]){
  if(attribute.count!==position.count||[...attribute.array].some(v=>!Number.isFinite(v)))fail('頂点属性数または有限値が不正: '+entry.id);
 }
 for(let i=0;i<position.count;i++){
  let total=0;for(let j=0;j<4;j++){const weight=skinWeight.getComponent(i,j),joint=skinIndex.getComponent(i,j);if(weight<0||joint<0||joint>=mesh.skeleton.bones.length||!Number.isInteger(joint))fail('スキン頂点が不正: '+entry.id);total+=weight;}
  if(Math.abs(total-1)>.0002)fail('スキン重みが正規化されていません: '+entry.id);
 }
 return geometry;
}
function sourceMeshes(gltf,entry){
 gltf.scene.updateMatrixWorld(true);const meshes=new Set();
 for(const name of entry.meshNames){const object=gltf.scene.getObjectByName(name);if(!object)fail('指定メッシュがありません: '+entry.id+'/'+name);object.traverse(child=>{if(child.isSkinnedMesh)meshes.add(child);});}
 if(!meshes.size)fail('実SkinnedMeshがありません: '+entry.id);return [...meshes];
}
function weights(mesh,index){
 const map=new Map(),g=mesh.geometry.attributes;
 for(let i=0;i<4;i++){const weight=g.skinWeight.getComponent(index,i);if(weight>1e-8){const name=mesh.skeleton.bones[g.skinIndex.getComponent(index,i)].name;map.set(name,(map.get(name)??0)+weight);}}
 return map;
}
const vectorDistance=(a,ai,b,bi)=>Math.hypot(a.getX(ai)-b.getX(bi),a.getY(ai)-b.getY(bi),a.getZ(ai)-b.getZ(bi));
function indexVertices(meshes,tolerance,selected){
 const buckets=new Map();
 for(const mesh of meshes){const p=mesh.geometry.attributes.position;for(const i of selected?selected(mesh):Array.from({length:p.count},(_,i)=>i)){
  const key=[p.getX(i),p.getY(i),p.getZ(i)].map(n=>Math.floor(n/tolerance)).join(',');
  if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push({mesh,index:i});
 }}
 return {nearest(attribute,index){
  const at=[attribute.getX(index),attribute.getY(index),attribute.getZ(index)].map(n=>Math.floor(n/tolerance));let match,error=Infinity;
  for(let x=-1;x<=1;x++)for(let y=-1;y<=1;y++)for(let z=-1;z<=1;z++)for(const candidate of buckets.get([at[0]+x,at[1]+y,at[2]+z].join(','))??[]){
   const distance=vectorDistance(attribute,index,candidate.mesh.geometry.attributes.position,candidate.index);if(distance<error){match=candidate;error=distance;}
  }
  return {match,error};
 }};
}
export function validatePartSeams(partMeshes,allMeshes,entry,{hostMeshes=allMeshes}={}){
 const tolerance=entry.seams.tolerance,others=allMeshes.filter(mesh=>!partMeshes.includes(mesh)&&mesh.visible),target=indexVertices(others,tolerance);
 // Preserve only native open surface edges, e.g. the original foot sole cutoff.
 // An arbitrary unmatched donor edge is never classified as an acceptable seam.
 const originalSlot=hostMeshes.filter(mesh=>mesh.userData.avatarPart===entry.slot),originalOthers=indexVertices(hostMeshes.filter(mesh=>mesh.userData.avatarPart!==entry.slot&&mesh.visible),tolerance);
 const intrinsic=indexVertices(originalSlot,tolerance,mesh=>boundaryVertices(mesh.geometry).filter(i=>originalOthers.nearest(mesh.geometry.attributes.position,i).error>tolerance));
 let checked=0,seamVertices=0,intrinsicOpenVertices=0,maxPositionError=0,maxMorphError=0,maxWeightError=0,maxNormalError=0;
 for(const mesh of partMeshes)for(const index of boundaryVertices(mesh.geometry)){
  const g=mesh.geometry,p=g.attributes.position;let {match,error}=target.nearest(p,index);
  if(!match||error>tolerance){const original=intrinsic.nearest(p,index);match=original.match;error=original.error;intrinsicOpenVertices++;}else seamVertices++;
  if(!match||error>tolerance)fail('開境界が対象表面にも元の開境界にも一致しません: '+entry.id+' vertex '+index+' error '+error);
  const targetGeometry=match.mesh.geometry,ownWeights=weights(mesh,index),otherWeights=weights(match.mesh,match.index);
  const weightError=Math.max(...[...new Set([...ownWeights.keys(),...otherWeights.keys()])].map(name=>Math.abs((ownWeights.get(name)??0)-(otherWeights.get(name)??0))));
  const normalError=vectorDistance(g.attributes.normal,index,targetGeometry.attributes.normal,match.index);
  let morphError=0;for(let m=0;m<4;m++)morphError=Math.max(morphError,vectorDistance(g.morphAttributes.position[m],index,targetGeometry.morphAttributes.position[m],match.index));
  if(weightError>.0002||normalError>.035||morphError>tolerance)fail('継ぎ目の重み・法線・表情が一致しません: '+entry.id+' '+JSON.stringify({weightError,normalError,morphError}));
  checked++;maxPositionError=Math.max(maxPositionError,error);maxWeightError=Math.max(maxWeightError,weightError);maxNormalError=Math.max(maxNormalError,normalError);maxMorphError=Math.max(maxMorphError,morphError);
 }
 if(!seamVertices&&entry.slot!=='accessory')fail('検証可能な交換継ぎ目がありません: '+entry.id);
 return {checked,seamVertices,intrinsicOpenVertices,maxPositionError,maxMorphError,maxWeightError,maxNormalError,tolerance};
}
// Assemble transactionally. A rejected asset leaves the existing avatar intact.
// No donor bones are attached: every new mesh shares the host's actual Skeleton.
export function assembleMeshParts(avatar,loaded,{materialFactory}={}){
 const first=avatar.meshes[0],shared=first.skeleton,hostNames=shared.bones.map(b=>b.name),created=[],materials=[],replaced=new Set(loaded.map(({entry})=>entry.slot)),groups=[];
 avatar.scene.updateMatrixWorld(true);
 try{
  for(const {entry,gltf} of loaded){
   if(entry.targetBaseId!==avatar.baseId)fail('対象骨格が一致しません: '+entry.id);
   const partMeshes=[];
   for(const [index,source] of sourceMeshes(gltf,entry).entries()){
    validateGeometry(source,entry);
    const sourceNames=source.skeleton.bones.map(b=>b.name);
    const declaredNames=entry.jointNames.map(runtimeBoneName);
    if(new Set(declaredNames).size!==declaredNames.length||JSON.stringify(sourceNames)!==JSON.stringify(declaredNames)||sourceNames.length!==hostNames.length||sourceNames.some(name=>!hostNames.includes(name)))fail('対象の共有骨格ではありません: '+entry.id+' '+JSON.stringify({sourceNames,declaredNames,hostNames}));
    const remap=sourceNames.map(name=>hostNames.indexOf(name));
    for(let i=0;i<remap.length;i++)if(matrixError(source.skeleton.boneInverses[i],shared.boneInverses[remap[i]])>.00001)fail('対象の逆バインド行列が異なります: '+entry.id+'/'+sourceNames[i]);
    if(matrixError(source.matrixWorld,first.matrixWorld)>.00001||matrixError(source.bindMatrix,first.bindMatrix)>.00001)fail('対象のローカル座標系と一致しません: '+entry.id);
    if(!avatar.bones.has(runtimeBoneName(entry.socket.bone)))fail('ソケット骨がありません: '+entry.id);
    const geometry=source.geometry.clone(),skinIndex=geometry.attributes.skinIndex;
    for(let i=0;i<skinIndex.count;i++)for(let j=0;j<4;j++)skinIndex.setComponent(i,j,remap[skinIndex.getComponent(i,j)]);
    const original=Array.isArray(source.material)?source.material[0]:source.material;
    const material=materialFactory?materialFactory(original,entry):original.clone(),mesh=new THREE.SkinnedMesh(geometry,material);
    mesh.name='p2_'+entry.id+'_'+index;mesh.position.copy(first.position);mesh.quaternion.copy(first.quaternion);mesh.scale.copy(first.scale);mesh.bind(shared,first.bindMatrix);mesh.frustumCulled=false;
    mesh.morphTargetDictionary={...source.morphTargetDictionary};mesh.morphTargetInfluences=source.morphTargetInfluences.map(()=>0);
    mesh.userData={...source.userData,avatarPart:entry.slot,meshPart:{id:entry.id,targetBaseId:entry.targetBaseId,slot:entry.slot,donorId:entry.donorId,sha256:entry.sha256,lod:entry.lod}};
    created.push(mesh);materials.push(material);partMeshes.push(mesh);
   }
   groups.push({entry,meshes:partMeshes});
  }
  const retained=avatar.meshes.filter(mesh=>!replaced.has(mesh.userData.avatarPart)),next=[...retained,...created];
  const modules=groups.map(({entry,meshes})=>({id:entry.id,targetBaseId:entry.targetBaseId,slot:entry.slot,donorId:entry.donorId,sha256:entry.sha256,lod:entry.lod,vertices:meshes.reduce((n,m)=>n+m.geometry.attributes.position.count,0),triangles:meshes.reduce((n,m)=>n+m.geometry.index.count/3,0),socket:entry.socket,seams:validatePartSeams(meshes,next,entry,{hostMeshes:avatar.meshes})}));
  for(const mesh of avatar.meshes)if(replaced.has(mesh.userData.avatarPart))mesh.removeFromParent();
  for(const mesh of created)first.parent?.add(mesh);
  return {meshes:next,created,materials,assembly:{version:MESH_PART_VERSION,modules}};
 }catch(error){for(const mesh of created){mesh.geometry.dispose();mesh.material.dispose();}throw error;}
}

// Socket positions follow the current host pose. Position is a bone-local offset
// in the host bind rig; return values are in avatar-local metres, not game x.
export function measureMeshPartSockets(avatar){
 avatar.scene.updateMatrixWorld(true);
 return (avatar.partAssembly?.modules??[]).map(module=>{
  const bone=avatar.bones.get(runtimeBoneName(module.socket.bone));if(!bone?.isBone)fail('交換部品のソケット骨がありません: '+module.id);
  const world=bone.localToWorld(new THREE.Vector3(...module.socket.position)),local=avatar.scene.worldToLocal(world);
  return {moduleId:module.id,slot:module.slot,bone:bone.name,position:local.toArray(),space:'avatar-local-animated',source:'actual-host-bone'};
 });
}
