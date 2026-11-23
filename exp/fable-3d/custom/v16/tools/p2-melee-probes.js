// Shared real-asset CPU/browser probe. No replacement Battle or mock rig.
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import * as Avatar from '../avatar-factory.js';
import {createDefaultAvatar} from '../avatar-schema.js';
import {createCustomBattle,customCpuInput} from '../custom-combat.js';
import {retargetCustomClip} from '../custom-animation.js';
import * as Motion from '../../../dojo/special-motion-source.js';
import {specialMove,normalMove} from '../../../dojo/balance.js';
import {cpuInput} from '../../../dojo/cpu.js';
import {P2_MELEE_TARGETS,P2_MELEE_REFS,P2_MELEE_MESH_PROFILES,p2MeleeCompatibility} from '../melee-compatibility-p2.js';
const check=(ok,message)=>{if(!ok)throw Error('P2 melee probe: '+message);};
const rootURL=new URL('../../../',import.meta.url),styles={moguzo:'pisuke',godan:'bullet',bullet:'moguzo'};
const group=name=>{const n=name.toLowerCase().replace(/[^a-z0-9]/g,''),side=n.endsWith('l')?'L':n.endsWith('r')?'R':'';
 if(/paw|hand|wrist|elbow|shoulder|clav|forearm|upperarm|arm/.test(n))return'arm'+side;
 if(/foot|shin|thigh|knee|ankle|leg|toe/.test(n))return'leg'+side;if(/tail/.test(n))return'tail';if(/head|jaw|ear|neck|snout|nose|beak/.test(n))return'head';return'body';};
const declared=limbs=>new Set(limbs.split('+').flatMap(limb=>/^paw|^elbow/.test(limb)?['arm'+limb.at(-1)]:/^shoulder/.test(limb)?['arm'+limb.at(-1),'body']:/^foot|^knee/.test(limb)?['leg'+limb.at(-1)]:limb==='body'?['body','head']:[limb]));
const poseSnapshot=root=>{const values=[];root.traverse(node=>{if(node.isBone)values.push([node.name,...node.position.toArray(),...node.quaternion.toArray(),...node.scale.toArray()]);if(node.morphTargetInfluences)values.push([node.name,...node.morphTargetInfluences]);});return JSON.stringify(values);};

export async function runP2MeleeProbes(){
 const source=await Motion.loadApprovedSpecialMotionSource();check(source?.sourceVersion==='v17-p3-specials-r2','actual selected R2 source required');
 const loader=new GLTFLoader(),originals=new Map(),packs=new Map(),report={passed:false,sourceVersion:source.sourceVersion,rows:[],rejected:[],activeSamples:0,boundaryChecks:0,fullBattleCases:0,customCpuCases:0};
 try{
  for(const baseId of P2_MELEE_TARGETS)for(const profile of ['base','published'])for(const ref of P2_MELEE_REFS){
   const definition=createDefaultAvatar(baseId);definition.combat.styleId=styles[baseId];definition.combat.specials=[ref,'moguzo.s1','pisuke.s1'];
   if(profile==='published')definition.appearance.meshParts={...P2_MELEE_MESH_PROFILES[baseId]};
   const compatible=p2MeleeCompatibility(definition,ref,{sourceVersion:source.sourceVersion});
   if(!compatible.supported){report.rejected.push({baseId,profile,ref,reason:compatible.reason});continue;}
   const sourceId=ref.split('.')[0],authored=source.characters[sourceId].s3;
   if(!originals.has(sourceId))originals.set(sourceId,await loader.loadAsync(new URL(`chars/${sourceId}/${sourceId}.glb`,rootURL).href));
   if(!packs.has(authored.identity.sourceFile))packs.set(authored.identity.sourceFile,await loader.loadAsync(new URL(authored.identity.sourceFile,rootURL).href));
   const original=originals.get(sourceId),sourceSnapshot=poseSnapshot(original.scene),raw=packs.get(authored.identity.sourceFile).animations.find(c=>c.name===authored.identity.sourceClip),rawValues=JSON.stringify(raw.toJSON());
   const selected=Motion.specialMotionOverride(source,sourceId,{characterId:sourceId,moveId:'s3'},new URL(`cinematic/v14/${sourceId}/manifest.json`,rootURL));
   const avatar=await Avatar.createAvatar(definition);
   try{
    const move=specialMove(sourceId,2),before=performance.now(),canonical=Motion.canonicalSpecialClip(selected.spec,raw);
    const converted=sourceId===baseId?canonical:retargetCustomClip(canonical,original.scene,avatar.scene,{moveKind:selected.spec.kind,moveRef:ref,targetDefinition:definition,motionSpec:selected.spec,
      sourceIdleClip:original.animations.find(c=>c.name==='idle'),targetIdleClip:avatar.animations.find(c=>c.name==='idle')});
    const clip=Avatar.bindAvatarClip(converted,avatar),retargetMs=performance.now()-before;
    check(poseSnapshot(original.scene)===sourceSnapshot,'source pose was mutated');check(JSON.stringify(raw.toJSON())===rawValues,'original source clip was mutated');
    const measurement=Avatar.measureContacts(avatar),row=Avatar.measureSpecialContact(avatar,clip,selected.spec,move,{ref});measurement.specialContacts={[ref]:row};
    const game=createCustomBattle(definition,'godan',2,{measurements:[measurement]}),[player,target]=game.fighters;
    check(game._begin(player,{},'s1'),'measured equipped slot did not start');
    check(player.id===styles[baseId]&&player.visualRigId===baseId,'style and body identities collapsed');
    check(player.action.sourceCharacterId===sourceId&&player.action.sourceMoveId==='s3'&&player.action.id==='s1','source move was replaced by slot/style move');
    for(const key of ['startup','active','recovery','damage','travel','hitstun'])check(player.action[key]===move[key],key+' changed during retarget');
    check(player.action.specialContact===row,'canonical surface replaced actual custom skin');
    player.frame=6;check(game._absorbing(player,normalMove('moguzo','stand_weak'))===null,'foreign Godan armor ability stacked onto another style');
    const intended=declared(authored.row.attack_limb),meshes=avatar.meshes.filter(mesh=>mesh.visible).map(mesh=>{
     const si=mesh.geometry.attributes.skinIndex,sw=mesh.geometry.attributes.skinWeight,groups=[];for(let i=0;i<si.count;i++){let k=0;for(let j=1;j<4;j++)if(sw.getComponent(i,j)>sw.getComponent(i,k))k=j;groups.push(group(mesh.skeleton.bones[si.getComponent(i,k)].name));}return {mesh,groups};
    });
    const mixer=new THREE.AnimationMixer(avatar.scene),action=mixer.clipAction(clip),vector=new THREE.Vector3(),points=[];action.reset().play().setEffectiveTimeScale(0);
    try{
     for(let frame=0;frame<move.active;frame++){
      const seconds=Motion.specialClipTime(selected.spec,move,move.startup+frame,clip.duration);action.time=seconds;mixer.update(0);avatar.scene.updateMatrixWorld(true);
      let reach=-Infinity,height=0,part,footMin=Infinity;
      for(const {mesh,groups}of meshes)for(let vertex=0;vertex<groups.length;vertex++){
       mesh.getVertexPosition(vertex,vector);vector.applyMatrix4(mesh.matrixWorld);check(Number.isFinite(vector.x+vector.y+vector.z),'nonfinite actual skinned vertex');
       if(groups[vertex].startsWith('leg'))footMin=Math.min(footMin,vector.y);
       if(intended.has(groups[vertex])&&vector.z>reach){reach=vector.z;height=vector.y;part=groups[vertex];}
      }
      check(Math.abs(reach-row.activeReach[frame].reach)<.000001&&Math.abs(height-row.activeReach[frame].height)<.000001&&part===row.activeReach[frame].part,'independent active skin mismatches measured contact');
      if(converted.userData?.customRetarget?.grounding){const g=converted.userData.customRetarget.grounding,probe=g.probes.find(p=>p.frame===move.startup+frame);if(!probe.sourceRaised)check(footMin>=g.targetIdleFloor-.001,'active feet gained penetration beyond own idle');}
      for(const facing of [1,-1])for(const crouch of [false,true]){
       player.x=0;player.y=0;player.facing=facing;player.frame=move.startup+frame;target.y=0;target.state=crouch?'crouch':'idle';target.input={down:crouch};
       const targetBox=game.hurtBoundsResolver(target)[target.id][crouch?'crouch':'stand'];
       target.x=facing*(Math.max(0,reach)+.16-.003);check(game._contact(player,target,player.action)===(height+.06>=targetBox.bottom&&height-.06<=targetBox.top),'measured inner hit/height boundary');
       target.x=facing*(Math.max(0,reach)+.16+.003);check(!game._contact(player,target,player.action),'outside measured surface hit');report.boundaryChecks+=2;
      }
      points.push({frame,seconds,reach,height,part,footMin});report.activeSamples++;
     }
    }finally{mixer.stopAllAction();mixer.uncacheRoot(avatar.scene);}
    const scenarios=[];
    for(const facing of [1,-1])for(const outcome of ['hit','guard','miss']){
     const b=createCustomBattle(definition,'pisuke',2,{measurements:[measurement]}),[p,t]=b.fighters;p.x=-facing*.225;t.x=facing*.225;p.facing=facing;t.facing=-facing;
     if(outcome==='guard'){t.x=facing*1.76;p.x=t.x-facing*.45;}if(outcome==='miss'){p.x=-facing*1.2;t.x=facing*1.2;}const initialX=p.x;check(b._begin(p,{},'s1'),'full real startup rejected');let hits=0,blocks=0,contactFrame=null;
     for(let f=0;f<move.startup+move.active+move.recovery+45;f++){
      b.tick({},outcome==='guard'?{[facing===1?'right':'left']:true}:{});
      for(const event of b.events){if(event.type==='hit'){hits++;contactFrame??=p.frame;}if(event.type==='block'){blocks++;contactFrame??=p.frame;}}
     }
     check(hits===(outcome==='hit'?1:0)&&blocks===(outcome==='guard'?1:0),baseId+'/'+ref+'/'+outcome+' actual hit/guard/miss mismatch '+JSON.stringify({hits,blocks,px:p.x,tx:t.x}));
     check(Math.abs(p.x-initialX)<=move.travel+.2,'unexpected root travel');scenarios.push({facing,outcome,hits,blocks,contactFrame,rootTravel:p.x-initialX});report.fullBattleCases++;
    }
    const victim=createCustomBattle('moguzo',definition,2,{measurements:[null,measurement]}),[attacker,defender]=victim.fighters;
    defender.x=0;attacker.x=-.35;attacker.facing=1;defender.facing=-1;victim._begin(attacker,normalMove('moguzo','stand_weak'),'stand_weak');attacker.frame=attacker.action.startup;
    const box=measurement.hurtBounds.stand;check(victim._contact(attacker,defender,attacker.action)===(attacker.action.strikeHeight+.06>=box.bottom&&attacker.action.strikeHeight-.06<=box.top),'custom victim did not use its own measured hurt bounds');
    const cpu=createCustomBattle('moguzo',definition,2,{measurements:[null,measurement]}),[human,npc]=cpu.fighters;human.x=-.75;npc.x=.75;cpu.frame=16;
    const baseline=cpuInput({...cpu,frame:17},npc,human,2),adapted=customCpuInput({...cpu,frame:17},npc,human,2);
    if(sourceId!==baseId){check(baseline.special1===true&&adapted.special1===undefined,'custom CPU treated equipped melee as an unlimited wave');check(adapted.left===true,'custom CPU lost its unchanged approach');}
    human.x=-.35;npc.x=.35;let cpuStarts=0,cpuHits=0;
    for(let f=0;f<140;f++){cpu.tick({});for(const e of cpu.events){if(e.type==='move'&&e.slot===1&&e.action==='s1')cpuStarts++;if(e.type==='hit'&&e.slot===0&&e.feedback?.id===ref)cpuHits++;}}
    check(cpuStarts>0&&cpuHits>0,'actual custom CPU did not execute and land its reachable equipped source');report.customCpuCases++;
    report.rows.push({baseId,profile,ref,styleId:definition.combat.styleId,sourceFile:selected.spec.sourceFile,sourceClip:selected.spec.actualSourceClip,partAssembly:avatar.partAssembly,
      retargetMs,grounding:converted.userData?.customRetarget?.grounding??null,morphs:converted.userData?.customRetarget?.sharedMorphNames??null,points,scenarios,cpuStarts,cpuHits,hurtBounds:measurement.hurtBounds});
   }finally{avatar.dispose();}
  }
  check(report.rows.length===16&&report.rejected.length===2,'unexpected initial matrix coverage');report.passed=true;return report;
 }catch(error){error.report=report;throw error;}
}
