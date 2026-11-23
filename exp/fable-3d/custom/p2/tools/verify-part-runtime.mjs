// Actual shipped GLB/Three CPU checks. Same-host swaps are controls, never claimed
// as authored foreign donor assets. Image decoding is stubbed; no WebGL/FPS claim.
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const nativeFetch=globalThis.fetch;
globalThis.self=globalThis;globalThis.createImageBitmap=async()=>({width:1024,height:1024,close(){}});
globalThis.ProgressEvent=class{constructor(type,props){this.type=type;Object.assign(this,props);}};
globalThis.fetch=async(url,options)=>{
 const path=typeof url==='string'||url instanceof URL?String(url):url.url;
 if(!path.startsWith('file:'))return nativeFetch(url,options);
 try{return new Response(await readFile(fileURLToPath(path)),{headers:{'Content-Type':path.endsWith('.json')?'application/json':'application/octet-stream'}});}catch(error){
  const legacy=path.match(/\/normal\/v15\/([a-z_]+)_normals\.glb$/);
  if(legacy&&error.code==='ENOENT'){const {buildNormalPack}=await import('../../../dojo/normal-clip-builder-v15.mjs');return new Response(buildNormalPack(await readFile(new URL('../../../chars/'+legacy[1]+'/'+legacy[1]+'.glb',import.meta.url)),legacy[1]).bytes);}
  return new Response(error.message,{status:404});
 }
};
const [{GLTFLoader},{clone:cloneSkeleton},factory,parts,contract]=await Promise.all([import('three/addons/loaders/GLTFLoader.js'),import('three/addons/utils/SkeletonUtils.js'),import('../../v16/avatar-factory.js'),import('../part-loader.js'),import('../part-contract.js')]);
const loader=new GLTFLoader(),manifest=JSON.parse(await readFile(new URL('../assets/manifest.json',import.meta.url))),legacy=JSON.parse(await readFile(new URL('../../v16/assets/manifest.json',import.meta.url))),report=[];
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const names=(scene,slot)=>{const found=[];scene.traverse(mesh=>{if(mesh.isSkinnedMesh&&mesh.material.name==='avatar_part_'+slot)found.push(mesh.name);});return found;};
for(const baseId of ['moguzo','godan','bullet']){
 const bytes=await readFile(new URL('../../v16/assets/'+legacy.bases[baseId].file,import.meta.url)),gltf=await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),''),avatar=await factory.createAvatar({appearance:{baseId,parts:{},palette:{},pattern:'solid'}});
 try{
  const before=factory.measureContacts(avatar),triangleCount=avatar.meshes.reduce((n,m)=>n+m.geometry.index.count/3,0),slots=['head','ears','hands','feet','tail'];
  const controls=slots.map(slot=>({id:'control_'+baseId+'_'+slot,targetBaseId:baseId,donorId:baseId,slot,meshNames:names(gltf.scene,slot),jointNames:avatar.meshes[0].skeleton.bones.map(b=>b.name),morphTargets:contract.MESH_PART_MORPHS,seams:{kind:'matched-host-boundary',tolerance:.00002},socket:{bone:slot==='tail'?'tail_01':'head',position:[0,0,0],space:'host-bind-local'},lod:0,sha256:hash(bytes)}));
  const download={...controls[0],file:'modules/control_'+baseId+'.glb',bytes:bytes.length};
  assert.equal((await parts.loadMeshPartModules([download],{loader,baseURL:'https://assets.invalid/',fetch:async()=>new Response(bytes)})).length,1);
  await assert.rejects(parts.loadMeshPartModules([{...download,sha256:'0'.repeat(64)}],{loader,baseURL:'https://assets.invalid/',fetch:async()=>new Response(bytes)}),/ハッシュ/);
  const assembly=parts.assembleMeshParts(avatar,controls.map(entry=>({entry,gltf})));avatar.meshes=assembly.meshes;avatar.partAssembly=assembly.assembly;
  avatar.animations=avatar.animations.map(clip=>factory.bindAvatarClip(clip,avatar));
  assert.equal(avatar.meshes.reduce((n,m)=>n+m.geometry.index.count/3,0),triangleCount,'control changed topology');
  for(const mesh of assembly.created)assert.equal(mesh.skeleton,avatar.meshes[0].skeleton,'module is not on shared skeleton');
  for(const mesh of assembly.created){assert.equal(mesh.userData.meshPart.targetBaseId,baseId);assert.equal(mesh.userData.meshPart.slot,mesh.userData.avatarPart);}
  const sockets=parts.measureMeshPartSockets(avatar);assert.equal(sockets.length,5);assert.ok(sockets.every(s=>s.source==='actual-host-bone'&&s.position.every(Number.isFinite)));
  const after=factory.measureContacts(avatar);assert.deepEqual(after.normals,before.normals,'same-host real swap changed measured attack surfaces');assert.deepEqual(after.hurtBounds,before.hurtBounds);
  assert.ok(assembly.assembly.modules.every(m=>m.seams.checked>0&&m.seams.maxPositionError<=.00002));
  // Nonfinite/skin corruption must fail before replacing any host node.
  const broken=cloneSkeleton(gltf.scene),brokenMesh=broken.getObjectByName(controls[2].meshNames[0]);brokenMesh.geometry=brokenMesh.geometry.clone();brokenMesh.geometry.attributes.skinWeight.setComponent(0,0,-1);
  const retained=[...avatar.meshes];assert.throws(()=>parts.assembleMeshParts(avatar,[{entry:controls[2],gltf:{scene:broken}}]),/スキン/);assert.deepEqual(avatar.meshes,retained);
  brokenMesh.geometry.dispose();
  const gapScene=cloneSkeleton(gltf.scene),gapMesh=gapScene.getObjectByName(controls[0].meshNames[0]);gapMesh.geometry=gapMesh.geometry.clone();
  const boundary=parts.boundaryVertices(gapMesh.geometry)[0];gapMesh.geometry.attributes.position.setX(boundary,gapMesh.geometry.attributes.position.getX(boundary)+.002);
  assert.throws(()=>parts.assembleMeshParts(avatar,[{entry:controls[0],gltf:{scene:gapScene}}]),/開境界|継ぎ目/);assert.deepEqual(avatar.meshes,retained);gapMesh.geometry.dispose();
  const wrongRig=cloneSkeleton(gltf.scene),wrongMesh=wrongRig.getObjectByName(controls[0].meshNames[0]);wrongMesh.skeleton.boneInverses=wrongMesh.skeleton.boneInverses.map(matrix=>matrix.clone());wrongMesh.skeleton.boneInverses[0].elements[12]+=.01;
  assert.throws(()=>parts.assembleMeshParts(avatar,[{entry:controls[0],gltf:{scene:wrongRig}}]),/逆バインド/);assert.deepEqual(avatar.meshes,retained);
  report.push({baseId,type:'same-host-actual-GLB-controls',triangles:triangleCount,normalSlots:Object.keys(after.normals).length,modules:assembly.assembly.modules});
  for(const mesh of assembly.created){mesh.geometry.dispose();mesh.material.dispose();}
 }finally{avatar.dispose();}
}
// Authored production parts are verified when present. An empty manifest is
// honestly unavailable; controls above are not added to its catalog.
for(const entry of contract.validateMeshPartManifest(manifest).modules){
 const definition={appearance:{baseId:entry.targetBaseId,parts:{},meshParts:{[entry.slot]:entry.donorId},palette:{},pattern:'spots'}};
 const avatar=await factory.createAvatar(definition);
 try{
  const measured=factory.measureContacts(avatar);assert.ok(Object.values(measured.normals).every(row=>row.activeReach.every(p=>Number.isFinite(p.reach)&&Number.isFinite(p.height))));
  assert.equal(avatar.partAssembly.modules[0].sha256,entry.sha256);assert.ok(avatar.grafts.includes(entry.slot));
  report.push({moduleId:entry.id,type:'authored-foreign-donor',assembly:avatar.partAssembly,measured});
 }finally{avatar.dispose();}
}
const out=process.env.MAMOKEN_EVIDENCE??'/tmp/mamoken-p2-parts';await mkdir(out,{recursive:true});await writeFile(out+'/parts-cpu.json',JSON.stringify({note:'Actual GLB CPU skin sampling; images stubbed, WebGL and physical iPhone untested',authoredModules:manifest.modules.length,results:report},null,2));
console.log('P2 PART RUNTIME CPU PASS: 3 actual host rigs, 15 same-host control swaps, shared skeleton, seams/morphs/skin, 18 normals; authored modules='+manifest.modules.length);
