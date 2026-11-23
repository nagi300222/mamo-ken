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
const [THREE,{GLTFLoader},Avatar,Schema,Combat,Motion,{IDS,specialMove}]=await Promise.all([
 import('three'),import('three/addons/loaders/GLTFLoader.js'),import('../avatar-factory.js'),import('../avatar-schema.js'),import('../custom-combat.js'),import('../../../dojo/special-motion-source.js'),import('../../../dojo/balance.js')
]);
const selectedIDs=process.env.MAMOKEN_LEADING_TEST_IDS?.split(',')??IDS;assert.ok(selectedIDs.length&&selectedIDs.every(id=>IDS.includes(id)));
const source=await Motion.loadV17R2SpecialMotionSource(),loader=new GLTFLoader(),packs=new Map(),report={passed:false,sourceVersion:source.sourceVersion,selectedIDs,note:'Actual R2 GLTFLoader/CPU skins and bound clips; independent declared-part extrema checked every actual active frame. Images stubbed; not WebGL/phone evidence.',cases:[],samples:0,changedLeadingCases:0,maxOldFixedPartError:0};
const group=name=>{const n=name.toLowerCase().replace(/[^a-z0-9]/g,''),side=n.endsWith('l')?'L':n.endsWith('r')?'R':'';
 if(/paw|hand|wrist|elbow|shoulder|clav|forearm|upperarm|arm/.test(n))return'arm'+side;
 if(/foot|shin|thigh|knee|ankle|leg|toe/.test(n))return'leg'+side;if(/tail/.test(n))return'tail';if(/head|jaw|ear|neck|snout|nose|beak/.test(n))return'head';return'body';};
const declared=limbs=>new Set(limbs.split('+').flatMap(limb=>/^paw|^elbow/.test(limb)?['arm'+limb.at(-1)]:/^shoulder/.test(limb)?['arm'+limb.at(-1),'body']:/^foot|^knee/.test(limb)?['leg'+limb.at(-1)]:limb==='body'?['body','head']:[limb]));
try{
 for(const grafted of [false,true])for(const id of selectedIDs){
  const definition=Schema.createDefaultAvatar(id);
  if(grafted){definition.appearance.parts.head=id==='godan'?'pisuke':'godan';definition.appearance.parts.ears='chirka';definition.appearance.palette.fur='#397db3';definition.appearance.pattern='spots';}
  const avatar=await Avatar.createAvatar(definition),measurement=Avatar.measureContacts(avatar);measurement.specialContacts={};measurement.projectileSockets={};
  try{
   const meshes=avatar.meshes.filter(mesh=>mesh.visible).map(mesh=>{const si=mesh.geometry.attributes.skinIndex,sw=mesh.geometry.attributes.skinWeight,groups=[];
    for(let i=0;i<si.count;i++){let best=0;for(let k=1;k<4;k++)if(sw.getComponent(i,k)>sw.getComponent(i,best))best=k;groups.push(group(mesh.skeleton.bones[si.getComponent(i,best)].name));}return{mesh,groups};});
   for(const slot of ['s1','s2','s3']){
    const authored=source.characters[id][slot],selected=Motion.specialMotionOverride(source,id,{characterId:id,moveId:slot},new URL('../../../cinematic/v14/'+id+'/manifest.json',import.meta.url));
    const file=authored.identity.sourceFile;if(!packs.has(file))packs.set(file,await loader.loadAsync(new URL('../../../'+file,import.meta.url).href));
    const raw=packs.get(file).animations.find(c=>c.name===authored.identity.sourceClip),clip=Avatar.bindAvatarClip(Motion.canonicalSpecialClip(selected.spec,raw),avatar),move=specialMove(id,+slot[1]-1),ref=id+'.'+slot;
    const socketBone=Motion.resolveSpecialBone(avatar.scene,Motion.specialReleaseAnchor(authored.row));
    assert.throws(()=>Avatar.measureSpecialContact(avatar,clip,{...selected.spec,attackLimb:'undeclared'},move,{ref,releaseBone:socketBone}),/宣言された技の手足/);
    const measured=Avatar.measureSpecialContact(avatar,clip,selected.spec,move,{ref,releaseBone:socketBone});measurement.specialContacts[ref]=measured;if(measured.projectileSocket)measurement.projectileSockets[ref]=measured.projectileSocket;
    assert.equal(measured.sourceClip,authored.identity.sourceClip);assert.equal(measured.sourceFile,file);
    const intended=declared(authored.row.attack_limb),mixer=new THREE.AnimationMixer(avatar.scene),vector=new THREE.Vector3(),observed=[];
    try{
     const action=mixer.clipAction(clip);action.reset().play();action.setEffectiveTimeScale(0);
     for(let frame=0;frame<move.active;frame++){
      const seconds=Motion.specialClipTime(selected.spec,move,move.startup+frame,clip.duration);action.time=seconds;mixer.update(0);avatar.scene.updateMatrixWorld(true);
      const surfaces={};for(const {mesh,groups}of meshes)for(let i=0;i<groups.length;i++){
       if(!intended.has(groups[i]))continue;mesh.getVertexPosition(i,vector);vector.applyMatrix4(mesh.matrixWorld);
       const prior=surfaces[groups[i]];if(!prior||vector.z>prior.reach)surfaces[groups[i]]={reach:vector.z,height:vector.y,part:groups[i]};
      }
      const actual=Object.values(surfaces).sort((a,b)=>b.reach-a.reach)[0],row=measured.activeReach[frame];
      assert.ok(actual&&Math.abs(actual.reach-row.reach)<.000001&&Math.abs(actual.height-row.height)<.000001,`${id}/${slot}/${frame}: sampler differs from independent declared-limb extrema`);
      assert.equal(row.part,actual.part);assert.ok(intended.has(row.part));
      const old=surfaces[authored.surface.attackPart],oldReachError=old?actual.reach-old.reach:0;
      report.maxOldFixedPartError=Math.max(report.maxOldFixedPartError,oldReachError);observed.push({frame,seconds,part:row.part,reach:row.reach,height:row.height,oldFixedPart:authored.surface.attackPart,oldReachError});report.samples++;
     }
    }finally{mixer.stopAllAction();mixer.uncacheRoot(avatar.scene);}
    if(observed.some(point=>point.part!==authored.surface.attackPart))report.changedLeadingCases++;
    report.cases.push({id,slot,grafted,sourceClip:measured.sourceClip,sourceFile:measured.sourceFile,attackParts:measured.attackParts,observed});
   }
   const battle=Combat.createCustomBattle(definition,'moguzo',1,{measurements:[measurement]});
   for(const slot of ['s1','s2','s3']){
    const p=battle.fighters[0];p.action=null;p.frame=0;assert.ok(battle._begin(p,{},slot),id+' measured native/grafted special rejected');
    if(['strike','anti','dash','tail'].includes(p.action.kind))assert.equal(p.action.specialContact,measurement.specialContacts[id+'.'+slot]);
   }
  }finally{avatar.dispose();}
 }
 assert.equal(report.cases.length,selectedIDs.length*6);assert.ok(report.changedLeadingCases>0);assert.ok(report.maxOldFixedPartError>.005,'the real corpus must expose the original fixed-part regression');report.passed=true;
}catch(error){report.error=error.stack;throw error;}
finally{const directory=process.env.MAMOKEN_EVIDENCE??'/tmp/p3-custom-special-leading';await mkdir(directory,{recursive:true});await writeFile(resolve(directory,'report.json'),JSON.stringify(report,null,2)+'\n');}
console.log('CUSTOM SPECIAL LEADING CPU PASS:',report.cases.length,'native/grafted clips,',report.samples,'active frames,',report.changedLeadingCases,'cases expose fixed-part error; max',report.maxOldFixedPartError);
