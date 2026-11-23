import {APPROVED_P3_SPECIAL_MOTION_VERSION} from './special-motion-overrides-p3.js';
import {APPROVED_P3_SPECIAL_CONTACT_DELIVERY} from './special-contact-overrides-p3.js';
import {specialSourceIdentity} from './special-motion-contract-p3.js';

const IDS=['moguzo','pisuke','godan','hakuma','chirka','takimaru','yomikage','bullet','dark_moguzo'];
const SLOTS=['s1','s2','s3'];
const MELEE=new Set(['strike','anti','dash','tail']);
const check=(ok,message)=>{if(!ok)throw Error('P3 special contact: '+message);};
const finite=Number.isFinite;

// This adapter is a separate gameplay candidate. Animation metadata alone is
// insufficient: the final record must certify exact contact/active sampling.
export function createP3SpecialContactDelivery(metadata,measurements){
 check(metadata?.characters&&typeof metadata.version==='string','missing metadata');
 check(measurements?.source==='runtime-skinned-mesh'&&measurements.sampling==='exact-clip-clock','exact skinned-mesh clock required');
 const characters={};let melee=0,projectiles=0;
 for(const id of IDS){characters[id]={};for(const slot of SLOTS){
  const row=metadata.characters[id]?.[slot],surface=measurements.characters?.[id]?.[slot],label=id+'.'+slot,identity=specialSourceIdentity(metadata.version,id,slot);
  check(row?.character===id&&row.move_id===slot&&row.clip===identity.sourceClip,label+' identity');
  check(row.fps===60&&Number.isInteger(row.frames)&&row.frames>0,label+' frame clock');
  check(finite(row.contactSeconds)&&row.contactSeconds>0&&row.contactSeconds<row.frames/60,label+' contact clock');
  check(surface?.status==='ok'&&!surface.issues?.length&&[identity.runtimeClip,identity.sourceClip].includes(surface.clip),label+' unresolved surface');
  check((surface.sourceClip??surface.clip)===identity.sourceClip,label+' source clip identity');
  if(identity.family==='v17r2')check((surface.sourceFile??surface.file)===identity.sourceFile,label+' revised source file');
  check(surface.sampling==='exact-clip-clock'&&Math.abs(surface.sampledContactSeconds-row.contactSeconds)<.00002,label+' contact measured at another clock');
  check(surface.attackLimb===row.attack_limb&&finite(surface.reach)&&finite(surface.height),label+' measured limb');
  if(row.kind==='projectile'){
   projectiles++;const socket=surface.projectileSocket;
   check(socket&&finite(socket.forward)&&finite(socket.height)&&socket.height>0&&Math.abs(socket.forward)<2,label+' measured release bone required');
  }else if(!['grab','counter'].includes(row.kind)){
   melee++;const points=surface.activeReach;check(Array.isArray(points)&&points.length>=3,label+' active trajectory required');
   let previous=-1;
   for(const point of points){check(finite(point.phase)&&point.phase>previous&&point.phase>=0&&point.phase<=1&&finite(point.reach)&&finite(point.height),label+' active trajectory');previous=point.phase;}
   check(points[0].phase===0&&points.at(-1).phase===1,label+' active interval incomplete');
   for(let frame=0;frame<row.active;frame++)check(points.some(p=>Math.abs(p.phase-frame/Math.max(1,row.active-1))<1e-6),label+' missing exact active frame '+frame);
   check(Math.abs(points[0].reach-surface.reach)<.002&&Math.abs(points[0].height-surface.height)<.002,label+' exact first contact discontinuity');
  }
  characters[id][slot]={...surface,source:'runtime-skinned-mesh',clip:identity.runtimeClip,sourceClip:identity.sourceClip,sourceFile:identity.sourceFile,revision:identity.revision,kind:row.kind,contactSeconds:row.contactSeconds,
   contact:row.contact,contactEnd:row.contact_end,activeFrameCount:row.active,sourceVersion:metadata.version};
 }}
 check(melee===19&&projectiles===6,'expected 19 melee / 6 projectile / throw / counter');
 return validateP3SpecialContactDelivery({version:metadata.version,source:'runtime-skinned-mesh',sampling:'exact-clip-clock',characters});
}

export function validateP3SpecialContactDelivery(delivery){
 check(delivery?.source==='runtime-skinned-mesh'&&delivery.sampling==='exact-clip-clock'&&typeof delivery.version==='string','reviewed delivery required');
 let melee=0,projectiles=0;
 for(const id of IDS)for(const slot of SLOTS){
  const row=delivery.characters?.[id]?.[slot],label=id+'.'+slot,identity=specialSourceIdentity(delivery.version,id,slot);
  check(row?.status==='ok'&&!row.issues?.length&&row.source==='runtime-skinned-mesh'&&row.sampling==='exact-clip-clock'&&row.clip===identity.runtimeClip,label+' reviewed row');
  check((row.sourceClip??row.clip)===identity.sourceClip&&(identity.family!=='v17r2'||row.sourceFile===identity.sourceFile),label+' source provenance');
  check(finite(row.contactSeconds)&&finite(row.sampledContactSeconds)&&Math.abs(row.sampledContactSeconds-row.contactSeconds)<.00002&&finite(row.reach)&&finite(row.height),label+' contact identity');
  check(row.sourceVersion===delivery.version&&['projectile','strike','antiair','rush','grab','counter'].includes(row.kind),label+' source version/kind');
  if(row.kind==='projectile'){
   projectiles++;check(row.projectileSocket&&finite(row.projectileSocket.forward)&&finite(row.projectileSocket.height)&&row.projectileSocket.height>0&&Math.abs(row.projectileSocket.forward)<2,label+' release socket');
  }else if(!['grab','counter'].includes(row.kind)){
   melee++;check(row.activeReach?.length>=3&&row.activeReach[0].phase===0&&row.activeReach.at(-1).phase===1&&row.activeReach.every((p,i,all)=>finite(p.phase)&&p.phase>=0&&p.phase<=1&&(!i||p.phase>all[i-1].phase)&&finite(p.reach)&&finite(p.height)),label+' active surface');
   check(Number.isInteger(row.activeFrameCount)&&row.activeFrameCount>0,label+' active clock');
   for(let frame=0;frame<row.activeFrameCount;frame++)check(row.activeReach.some(p=>Math.abs(p.phase-frame/Math.max(1,row.activeFrameCount-1))<1e-6),label+' missing exact active frame '+frame);
  }
 }
 check(melee===19&&projectiles===6,'expected 19 melee / 6 projectile / throw / counter');
 return delivery;
}

// Enabling the new default animation without its matching final gameplay data
// fails explicitly. Tests can instead inject a candidate into an isolated Battle.
export function selectApprovedSpecialContacts(version,delivery){
 if(version===null)return null;
 const validated=validateP3SpecialContactDelivery(delivery);
 check(specialSourceIdentity(validated.version,IDS[0],'s1').family===version,'approved motion/contact versions differ');
 return validated;
}
export const ACTIVE_P3_SPECIAL_CONTACT_DELIVERY=selectApprovedSpecialContacts(APPROVED_P3_SPECIAL_MOTION_VERSION,APPROVED_P3_SPECIAL_CONTACT_DELIVERY);

export function withP3SpecialContact(fighter,move,id,delivery){
 if(!delivery||!/^s[123]$/.test(id)||move.isSuper)return move;
 const character=move.sourceCharacterId??fighter.visualRigId??fighter.id,slot=move.sourceMoveId??id;
 let row=delivery.characters[character]?.[slot];check(!!row,character+'.'+slot+' not measured');
 if(move.kind==='projectile')return {...move,specialSurfaceVersion:delivery.version,projectileSocket:{...(move.projectileSocket??row.projectileSocket)}};
 if(!MELEE.has(move.kind))return move; // paired throws and counters retain their original rules
 if(move.customSpecialContact){
  if(!compatibleCustomSpecialContact(move.customSpecialContact,{character,slot,ref:move.customRef,version:delivery.version,active:move.active,canonical:row}))return null;
  row=move.customSpecialContact;
 }else if(move.customRef||fighter.definition)return null; // do not certify changed meshes from a canonical surface
 return {...move,specialSurfaceVersion:delivery.version,specialContact:row,reach:row.reach,strikeHeight:row.height,
  activeReach:row.activeReach.map(p=>({...p})),strikeRadius:.06};
}

export function compatibleCustomSpecialContact(row,{character,slot,ref,version,active,canonical}){
 if(!row||row.source!=='runtime-skinned-mesh'||row.sampling!=='exact-clip-clock'||row.status!=='ok'||row.issues?.length||
   row.motionVersion!=='v17'||row.sourceVersion!==version||row.sourceCharacterId!==character||row.sourceMoveId!==slot||row.ref!==ref||
   row.clip!==slot+'_v17'||row.activeFrameCount!==active||!finite(row.reach)||!finite(row.height)||
   !finite(row.sampledContactSeconds)||!finite(row.contactSeconds)||Math.abs(row.sampledContactSeconds-row.contactSeconds)>.00002||Math.abs(row.contactSeconds-canonical.contactSeconds)>.00002)return false;
 const identity=specialSourceIdentity(version,character,slot);
 if((row.sourceClip??row.clip)!==identity.sourceClip||(identity.family==='v17r2'&&row.sourceFile!==identity.sourceFile))return false;
 const points=row.activeReach;if(!Array.isArray(points)||points.length<3||points[0].phase!==0||points.at(-1).phase!==1||
  !points.every((p,i)=>finite(p.phase)&&p.phase>=0&&p.phase<=1&&(!i||p.phase>points[i-1].phase)&&finite(p.reach)&&finite(p.height)))return false;
 if(Math.abs(points[0].reach-row.reach)>.002||Math.abs(points[0].height-row.height)>.002)return false;
 for(let frame=0;frame<active;frame++)if(!points.some(p=>Math.abs(p.phase-frame/Math.max(1,active-1))<1e-6))return false;
 return true;
}

export function specialSurfaceAt(move,frame){
 const points=move.activeReach,phase=Math.max(0,Math.min(1,(frame-move.startup)/Math.max(1,move.active-1)));
 if(phase<=points[0].phase)return points[0];
 for(let i=1;i<points.length;i++)if(phase<=points[i].phase){const a=points[i-1],b=points[i],mix=(phase-a.phase)/(b.phase-a.phase);return {phase,reach:a.reach+(b.reach-a.reach)*mix,height:a.height+(b.height-a.height)*mix};}
 return points.at(-1);
}
export function specialSurfaceContact(attacker,target,move,hurtBounds){
 if(attacker.frame<move.startup||attacker.frame>=move.startup+move.active)return false;
 const forward=(target.x-attacker.x)*attacker.facing;if(forward<0||forward<(move.minReach??0))return false;
 const point=specialSurfaceAt(move,attacker.frame);
 if(forward>Math.max(0,point.reach)+.16)return false;
 const crouching=target.y===0&&(target.state==='crouch'||target.state==='block'&&target.input.down||target.action?.id?.startsWith('crouch_'));
 const box=hurtBounds?.[target.id]?.[crouching?'crouch':'stand'];check(!!box,'missing target hurt bounds: '+target.id);
 const y=attacker.y+point.height,radius=move.strikeRadius??.06;
 return y+radius>=target.y+box.bottom&&y-radius<=target.y+box.top;
}
