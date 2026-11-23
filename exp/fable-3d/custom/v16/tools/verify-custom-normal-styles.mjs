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
const [Avatar,Schema,Combat,{loadP3NormalMotionCandidate},{IDS,normalMove},{normalClipTime},{normalReachAt,normalHeightAt},{NORMAL_HURT_BOUNDS},THREE]=await Promise.all([
 import('../avatar-factory.js'),import('../avatar-schema.js'),import('../custom-combat.js'),import('../../../dojo/p3-normal-candidate.js'),import('../../../dojo/balance.js'),
 import('../../../dojo/normal-timing-v151.js'),import('../../../dojo/normal-contact-runtime-v151.js'),import('../../../dojo/normal-contact-source.js'),import('three')
]);
const candidate=await loadP3NormalMotionCandidate(),report={passed:false,version:candidate.delivery.version,note:'Actual original modular meshes and v17 clips, CPU skin/morph on 81 existing body/style combinations. Images stubbed; not WebGL or phone performance.',cases:[],samples:0};
const group=name=>{const n=name.toLowerCase().replace(/[^a-z0-9]/g,''),side=n.endsWith('l')?'L':n.endsWith('r')?'R':'';
 if(/paw|hand|wrist|elbow|shoulder|clav|forearm|upperarm|arm/.test(n))return'arm'+side;
 if(/foot|shin|thigh|knee|ankle|leg|toe/.test(n))return'leg'+side;if(/tail/.test(n))return'tail';if(/head|jaw|ear|neck|snout|nose|beak/.test(n))return'head';return'body';};
try{
 for(const baseId of IDS){
  const defaultDefinition=Schema.createDefaultAvatar(baseId),avatar=await Avatar.createAvatar(defaultDefinition,{normalMotionSource:candidate.source});
  try{
   const meshes=avatar.meshes.filter(m=>m.visible).map(mesh=>{const si=mesh.geometry.attributes.skinIndex,sw=mesh.geometry.attributes.skinWeight,groups=[];
    for(let i=0;i<si.count;i++){let k=0;for(let j=1;j<4;j++)if(sw.getComponent(i,j)>sw.getComponent(i,k))k=j;groups.push(group(mesh.skeleton.bones[si.getComponent(i,k)].name));}return {mesh,groups};});
   for(const styleId of IDS){
    const definition=structuredClone(defaultDefinition);definition.combat.styleId=styleId;definition.combat.specials=['pisuke.s1','moguzo.s1','bullet.s1'];
    const measurement=Avatar.measureContacts(avatar,{styleId}),battle=Combat.createCustomBattle(definition,'moguzo',1,{measurements:[measurement],specialContactDelivery:null});
    assert.equal(measurement.normalStyleId,styleId);assert.equal(measurement.normalSampling,'exact-style-active-frames');
    const mixer=new THREE.AnimationMixer(avatar.scene),vector=new THREE.Vector3(),rows=[];
    try{
     for(const slot of Object.keys(measurement.normals)){
      const [p,t]=battle.fighters;p.action=null;p.frame=0;p.stun=0;p.stop=0;p.x=0;p.y=slot.startsWith('air_')?.5:0;p.state='idle';
      assert.ok(battle._begin(p,{},slot));const move=p.action,reference=candidate.source.contacts[baseId][slot],clip=avatar.animations.find(c=>c.name===candidate.source.clipName(slot,{rigId:baseId}));
      assert.equal(move.active,normalMove(styleId,slot).active);assert.equal(move.customContact.battleActive,reference.battleActive);
      mixer.stopAllAction();const action=mixer.clipAction(clip);action.reset().play();action.setEffectiveTimeScale(0);
      let maxReachError=0,maxHeightError=0;
      for(let activeFrame=0;activeFrame<move.active;activeFrame++){
       p.frame=move.startup+activeFrame;const seconds=normalClipTime(baseId,slot,p.frame,move,clip.duration),phase=activeFrame/(move.active-1);
       assert.ok(measurement.normals[slot].activeReach.some(point=>Math.abs(point.phase-phase)<1e-9),'missing exact style frame');
       assert.ok(Math.abs(seconds-(reference.contact+(reference.contactEnd-reference.contact)*phase)*clip.duration)<1e-9);
       action.time=seconds;mixer.update(0);avatar.scene.updateMatrixWorld(true);let reach=-Infinity,height=0;
       for(const {mesh,groups}of meshes)for(let vertex=0;vertex<groups.length;vertex++)if((reference.bothHands?reference.attackParts:[reference.attackPart]).includes(groups[vertex])){mesh.getVertexPosition(vertex,vector);vector.applyMatrix4(mesh.matrixWorld);if(vector.z>reach){reach=vector.z;height=vector.y;}}
       const reachError=Math.abs(normalReachAt(move,p.frame)-reach),heightError=Math.abs(normalHeightAt(move,p.frame)-height);
       maxReachError=Math.max(maxReachError,reachError);maxHeightError=Math.max(maxHeightError,heightError);
       assert.ok(reachError<.00011&&heightError<.00011,`${baseId}/${styleId}/${slot}/${activeFrame}: actual skin mismatch ${reachError}/${heightError}`);
       for(const facing of [1,-1]){
        p.facing=facing;t.y=Math.max(0,p.y+height-.2);t.state='idle';t.input={};
        const distance=Math.max(0,reach)+.16,box=NORMAL_HURT_BOUNDS[t.id].stand,worldY=p.y+height;
        t.x=facing*(distance-.003);const expected=worldY+.06>=t.y+box.bottom&&worldY-.06<=t.y+box.top;
        assert.equal(battle._contact(p,t,move),expected,'actual visible surface inner boundary');
        t.x=facing*(distance+.003);assert.equal(battle._contact(p,t,move),false,'actual visible surface outer boundary');
       }
       report.samples++;
      }
      rows.push({slot,sourceActive:reference.battleActive,styleActive:move.active,measuredPhases:measurement.normals[slot].activeReach.map(p=>p.phase),maxReachError,maxHeightError});
     }
    }finally{mixer.stopAllAction();mixer.uncacheRoot(avatar.scene);}
    report.cases.push({baseId,styleId,rows});
   }
  }finally{avatar.dispose();}
 }
 assert.equal(report.cases.length,81);assert.equal(report.cases.flatMap(c=>c.rows).length,486);
 report.lowTakiCompare={};
 for(const [revision,source]of [['r1',(await loadP3NormalMotionCandidate({artRevision:'r1'})).source],['r2',candidate.source]]){
  const definition=Schema.createDefaultAvatar('takimaru'),avatar=await Avatar.createAvatar(definition,{normalMotionSource:source});
  try{
   const measurement=Avatar.measureContacts(avatar),row=measurement.normals.crouch_heavy,cases=[];
   for(const targetId of IDS)for(const facing of [1,-1]){
    const battle=Combat.createCustomBattle(definition,targetId,1,{measurements:[measurement],specialContactDelivery:null}),[p,t]=battle.fighters;
    p.x=0;p.facing=facing;t.x=facing*.55;t.state='crouch';t.input={down:true};assert.ok(battle._begin(p,{},'crouch_heavy'));p.frame=p.action.startup;
    assert.equal(p.action.level,'low');cases.push({targetId,facing,hit:battle._contact(p,t,p.action)});
   }
   report.lowTakiCompare[revision]={clip:source.clipName('crouch_heavy',{rigId:'takimaru'}),reach:row.reach,height:row.height,activeParts:row.activeReach.map(p=>p.part),cases,hits:cases.filter(c=>c.hit).length};
  }finally{avatar.dispose();}
 }
 assert.equal(report.lowTakiCompare.r2.hits,18,'revised first low contact must reach every crouching canonical body in both directions');
 assert.ok(report.lowTakiCompare.r1.hits<18,'the probe must reproduce the original high low-attack regression');
 assert.deepEqual(report.lowTakiCompare.r2.activeParts,['armR','armL','armL','armL'],'the actual leading hand changes during the sweep');
 report.passed=true;
}catch(error){report.error=error.stack;throw error;}
finally{const directory=process.env.MAMOKEN_EVIDENCE??'/tmp/mamoken-p3-custom-normal-styles';await mkdir(directory,{recursive:true});await writeFile(resolve(directory,'report.json'),JSON.stringify(report,null,2)+'\n');}
console.log(`CUSTOM NORMAL STYLE CPU PASS: 81 body/styles, 486 clips, ${report.samples} exact actual active-frame skin/clock samples, both-facing collision boundaries`);
