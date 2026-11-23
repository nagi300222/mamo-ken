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
const [{GLTFLoader},Avatar,Schema,Combat,Animation,Motion,{IDS,specialMove},SpecialContact]=await Promise.all([
 import('three/addons/loaders/GLTFLoader.js'),import('../avatar-factory.js'),import('../avatar-schema.js'),import('../custom-combat.js'),
 import('../custom-animation.js'),import('../../../dojo/special-motion-source.js'),import('../../../dojo/balance.js'),import('../../../dojo/special-contact-runtime-p3.js')
]);
const loader=new GLTFLoader(),source=await Motion.loadV17SpecialMotionSource(),native={},report={passed:false,note:'Actual GLTFLoader/Three CPU skin/retarget evaluation. Images stubbed; no WebGL or physical-phone performance claim.',sourceVersion:source.sourceVersion,native:[],grafted:[],mixed:[],seeded:[]};
const metadata=JSON.parse(await readFile(new URL('../../../motion/v17/specials_v17.json',import.meta.url))),characters={};
const protectedURLs=IDS.flatMap(id=>[new URL(`../../../chars/${id}/${id}.glb`,import.meta.url),new URL(`../assets/${id}_parts.glb`,import.meta.url)]);
const hashes=async()=>Object.fromEntries(await Promise.all(protectedURLs.map(async url=>[url.pathname,createHash('sha256').update(await readFile(url)).digest('hex')])));
const protectedBefore=await hashes();
for(const id of IDS){
 const [original,pack]=await Promise.all([loader.loadAsync(new URL(`../../../chars/${id}/${id}.glb`,import.meta.url).href),loader.loadAsync(new URL(`../../../motion/v17/${id}_specials_v17.glb`,import.meta.url).href)]);
 native[id]={original,pack};
}
function measure(avatar,id,slot){
 const row=source.characters[id][slot].row,move=specialMove(id,+slot.slice(1)-1),raw=native[id].pack.animations.find(clip=>clip.name===row.clip);
 const selected=Motion.specialMotionOverride(source,id,{moveId:slot},new URL('../../../cinematic/v14/'+id+'/manifest.json',import.meta.url));
 const converted=id===avatar.baseId?raw:Animation.retargetCustomClip(raw,native[id].original.scene,avatar.scene,{moveKind:move.kind});
 const clip=Avatar.bindAvatarClip(converted,avatar),ref=id+'.'+slot,anchor=Motion.specialReleaseAnchor(row),bone=Motion.resolveSpecialBone(avatar.scene,anchor);
 const measured=Avatar.measureSpecialContact(avatar,clip,selected.spec,move,{ref,sourceVersion:metadata.version,releaseBone:bone});
 assert.equal(measured.activeReach.length,move.active);assert.equal(measured.sourceCharacterId,id);assert.equal(measured.ref,ref);
 for(let frame=0;frame<move.active;frame++)assert.equal(measured.activeReach[frame].seconds,Motion.specialClipTime(selected.spec,move,move.startup+frame,clip.duration));
 if(move.kind==='projectile'){
  const socket=Avatar.measureProjectileSocket(avatar,clip,selected.spec.contactSeconds,{bone});
  assert.ok(Math.abs(socket.forward-measured.projectileSocket.forward)<.00006&&Math.abs(socket.height-measured.projectileSocket.height)<.00006,'actual retarget release bone must match the source-clock socket helper');
  if(id===avatar.baseId){const automatic=Avatar.measureSpecialContact(avatar,clip,selected.spec,move,{ref});assert.deepEqual(automatic.projectileSocket,measured.projectileSocket,'shared source metadata must identify its own release bone and version');}
 }
 return {measured,move,clip,spec:selected.spec,anchor:bone?.name};
}
const measuredRows=[];
try{
 for(const id of IDS){
  const definition=Schema.createDefaultAvatar(id),avatar=await Avatar.createAvatar(definition);
  try{
   const base=Avatar.measureContacts(avatar);base.specialContacts={};base.projectileSockets={};characters[id]={};
   for(const slot of ['s1','s2','s3']){
    const result=measure(avatar,id,slot),row=result.measured;characters[id][slot]=row;base.specialContacts[row.ref]=row;
    if(row.projectileSocket)base.projectileSockets[row.ref]=row.projectileSocket;
    measuredRows.push({definition,measurement:base,id,slot,row});report.native.push({id,slot,row,anchor:result.anchor});
   }
   // Unchanged throw/counter handling stays available; source measurements are
   // preserved but their paired/reaction rules are not replaced by strike boxes.
   assert.ok(Combat.createCustomBattle(definition,'moguzo',1,{measurements:[base],specialContactDelivery:null}));
  }finally{avatar.dispose();}
 }
 const delivery=SpecialContact.createP3SpecialContactDelivery(metadata,{source:'runtime-skinned-mesh',sampling:'exact-clip-clock',characters});
 for(const id of IDS){
  const definition=Schema.createDefaultAvatar(id);definition.appearance.parts.head=id==='godan'?'pisuke':'godan';definition.appearance.parts.ears='chirka';definition.appearance.palette.fur='#397db3';definition.appearance.pattern='spots';
  const avatar=await Avatar.createAvatar(definition);
  try{
   const measurement=Avatar.measureContacts(avatar);measurement.specialContacts={};measurement.projectileSockets={};
   for(const slot of ['s1','s2','s3']){const {measured:row}=measure(avatar,id,slot);measurement.specialContacts[row.ref]=row;if(row.projectileSocket)measurement.projectileSockets[row.ref]=row.projectileSocket;}
   const battle=Combat.createCustomBattle(definition,'moguzo',1,{measurements:[measurement],specialContactDelivery:delivery});
   for(const slot of ['s1','s2','s3']){const p=battle.fighters[0];p.action=null;p.frame=0;assert.ok(battle._begin(p,{},slot));if(['strike','anti','dash','tail'].includes(p.action.kind))assert.equal(p.action.specialContact,measurement.specialContacts[id+'.'+slot]);}
   report.grafted.push({id,appearance:definition.appearance,contacts:measurement.specialContacts});
  }finally{avatar.dispose();}
 }
 const projectiles=IDS.filter(id=>specialMove(id,0).kind==='projectile');
 for(const targetId of IDS){
  const definition=Schema.createDefaultAvatar(targetId),avatar=await Avatar.createAvatar(definition);
  try{
   const measurement=Avatar.measureContacts(avatar);measurement.specialContacts={};measurement.projectileSockets={};
   for(const sourceId of projectiles){
    const {measured:row}=measure(avatar,sourceId,'s1');measurement.specialContacts[row.ref]=row;measurement.projectileSockets[row.ref]=row.projectileSocket;
    report.currentCase={sourceId,targetId,row};
    const equipped=structuredClone(definition);equipped.combat.specials[1]=row.ref;
    const battle=Combat.createCustomBattle(equipped,'godan',1,{measurements:[measurement],specialContactDelivery:delivery}),[p,t]=battle.fighters;
    p.x=-1;t.x=1.7;assert.ok(battle._begin(p,{},'s2'));assert.equal(p.action.customSpecialContact,row);
    assert.deepEqual(p.action.projectileSocket,row.projectileSocket,'canonical donor socket must not replace actual retarget socket');
    p.frame=p.action.startup-1;battle._act(p,t);
    assert.ok(Math.abs(battle.projectiles[0].x-(p.x+row.projectileSocket.forward))<1e-8);
    assert.ok(Math.abs(battle.projectiles[0].y-row.projectileSocket.height)<1e-8);
    report.mixed.push({sourceId,targetId,slot:'s2',socket:row.projectileSocket,canonicalSocket:delivery.characters[sourceId].s1.projectileSocket});
   }
  }finally{avatar.dispose();}
 }
 for(const seed of [7,19,41]){
  const definition=Schema.createSeededMob(seed),avatar=await Avatar.createAvatar(definition);
  try{
   const measurement=Avatar.measureContacts(avatar);measurement.specialContacts={};measurement.projectileSockets={};
   for(const sourceId of projectiles){const {measured:row}=measure(avatar,sourceId,'s1');measurement.specialContacts[row.ref]=row;measurement.projectileSockets[row.ref]=row.projectileSocket;}
   const battle=Combat.createCustomBattle(definition,'moguzo',1,{measurements:[measurement],specialContactDelivery:delivery});
   report.seeded.push({seed,baseId:avatar.baseId,appearance:definition.appearance,contacts:measurement.specialContacts,valid:battle.customDefinitions[0].name===definition.name});
  }finally{avatar.dispose();}
 }
 for(const {definition,measurement,id,slot,row}of measuredRows){
  const battle=Combat.createCustomBattle(definition,'moguzo',1,{measurements:[measurement],specialContactDelivery:delivery}),[p,t]=battle.fighters;
  p.x=0;t.x=1.5;
  assert.ok(battle._begin(p,{},slot));
  if(['strike','anti','dash','tail'].includes(p.action.kind)){
   assert.equal(p.action.specialContact,row,'custom exact skin must take precedence over canonical skin');
   assert.deepEqual(p.action.activeReach,row.activeReach);
  }
 }
 assert.equal(report.native.length,27);assert.equal(report.mixed.length,54);assert.equal(report.seeded.length,3);
 assert.equal(report.grafted.length,9);assert.deepEqual(await hashes(),protectedBefore);report.originalAndPartsSHA256=protectedBefore;
 delete report.currentCase;
 report.passed=true;
}catch(error){report.error=error.stack;throw error;}
finally{
 const directory=process.env.MAMOKEN_EVIDENCE??'/tmp/mamoken-p3-custom-special';await mkdir(directory,{recursive:true});
 await writeFile(resolve(directory,'report.json'),JSON.stringify(report,null,2)+'\n');
}
console.log('CUSTOM SPECIAL CPU PASS: 27 native clips / 19 melee trajectories / 27 contact sockets / 9 existing grafted appearances / 54 mixed release sockets / 3 seeded appearances; 18 original/parts GLB hashes unchanged');
