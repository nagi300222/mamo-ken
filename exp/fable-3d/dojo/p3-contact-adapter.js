// The actual Claude delivery has v17_* clips and authored frame/contact clocks.
// Authored clocks alone are NOT measured reach. A complete, separately measured
// 54-row table is required before the runtime override can be installed.
import {validNormalStrikeHeight} from './normal-contact-runtime-v151.js';
import {NORMAL_BALANCE} from './normal-balance-v151.js';
const IDS=['moguzo','pisuke','godan','hakuma','chirka','takimaru','yomikage','bullet','dark_moguzo'];
const SLOTS=['stand_weak','stand_heavy','crouch_weak','crouch_heavy','air_weak','air_heavy'];
const PARTS={pawL:'armL',pawR:'armR',elbowL:'armL',elbowR:'armR',shoulderL:'armL',shoulderR:'armR',footL:'legL',footR:'legR',kneeL:'legL',kneeR:'legR',tail:'tail',body:'body',head:'head'};
const requireValue=(valid,message)=>{if(!valid)throw new Error('P3 contact delivery: '+message);};
// Exact rows cover every actual Battle frame; a 2F attack needs two samples,
// while optional diagnostic samples between game frames remain permissible.
export function validNormalActiveTrajectory(row,{expectedActive,minLegacySamples=3,groundTolerance=.01}={}){
 const points=row?.activeReach,exact=row?.battleActive!==undefined;
 if(!Array.isArray(points)||points.length<(exact?Math.max(2,row.battleActive):minLegacySamples))return false;
 if(exact&&(!Number.isInteger(row.battleActive)||row.battleActive<2||expectedActive!==undefined&&row.battleActive!==expectedActive))return false;
 if(exact&&(!Number.isFinite(row.contactSeconds)||!Number.isFinite(row.authoredDuration)||!Number.isFinite(row.contact)||
   Math.abs(row.contactSeconds-row.contact*row.authoredDuration)>=.0002))return false;
 if(points[0].phase!==0||points.at(-1).phase!==1)return false;
 let previous=-Infinity;
 for(const point of points){
  if(!Number.isFinite(point.phase)||point.phase<=previous||point.phase<0||point.phase>1||
    !Number.isFinite(point.reach)||point.reach<0||!validNormalStrikeHeight(row.slot??'',point.height,groundTolerance))return false;
  previous=point.phase;
 }
 if(exact)for(let frame=0;frame<row.battleActive;frame++)if(!points.some(point=>Math.abs(point.phase-frame/(row.battleActive-1))<.00011))return false;
 return true;
}
function validateTrajectory(id,slot,row){
 const label=id+'/'+slot;
 requireValue(validNormalActiveTrajectory({...row,slot},{expectedActive:NORMAL_BALANCE[id][slot].active}),label+' invalid active surface/actual Battle frame coverage');
 if(row.battleActive!==undefined){
  requireValue(Number.isFinite(row.contactSeconds)&&Number.isFinite(row.authoredDuration)&&
   Math.abs(row.contactSeconds-row.contact*row.authoredDuration)<.0002,label+' exact contact seconds missing/misaligned');
 }
 requireValue(row.trajectorySampling!=='exact-battle-active-frames'||row.battleActive!==undefined,label+' exact sampling claim lacks Battle frame metadata');
}
export function createP3ContactDelivery(metadata,measurements){
 requireValue(metadata?.characters&&typeof metadata.version==='string','missing authored metadata/version');
 requireValue(measurements?.source==='runtime-skinned-mesh','reach must come from actual skinned-mesh measurements');
 const characters={};
 for(const id of IDS){characters[id]={};for(const slot of SLOTS){
  const authored=metadata.characters[id]?.[slot],measured=measurements.characters?.[id]?.[slot];
  const label=id+'/'+slot;
  requireValue(authored?.clip==='v17_'+slot&&authored.character===id&&authored.game_action===slot,label+' identity mismatch');
  requireValue(authored.fps===60&&Number.isInteger(authored.frames)&&authored.frames>0,label+' frame clock');
  requireValue(Number.isFinite(authored.duration_sec)&&Math.abs(authored.duration_sec-authored.frames/60)<.001,label+' duration');
  requireValue(authored.contact_frame>0&&authored.contact_hold_frames>0&&authored.contact_frame+authored.contact_hold_frames<authored.frames,label+' contact interval');
  const contact=authored.contact_frame/authored.frames,contactEnd=(authored.contact_frame+authored.contact_hold_frames)/authored.frames;
  requireValue(Math.abs(authored.contact-contact)<.0002&&Math.abs(authored.contact_end-contactEnd)<.0002,label+' authored normalized clock');
  // Whole-body drops include the leading head surface. Do not relax a declared
  // hand/foot strike when its head accidentally sticks out ahead of the limb.
  const intended=String(authored.attack_limb).split('+').flatMap(limb=>limb==='body'?['body','head']:[PARTS[limb]]);
  requireValue(intended.every(Boolean)&&measured&&intended.includes(measured.attackPart),label+' measured attack part differs from intended limb');
  requireValue(measured.status==='ok'&&!measured.issues?.length,label+' unresolved art/contact review');
  requireValue(Number.isFinite(measured.reach)&&measured.reach>=0&&validNormalStrikeHeight(slot,measured.height),label+' missing measured surface');
  validateTrajectory(id,slot,{...measured,contact,authoredDuration:authored.frames/60});
  requireValue(Math.abs(measured.activeReach[0].reach-measured.reach)<.015&&Math.abs(measured.activeReach[0].height-measured.height)<.015,label+' contact/active discontinuity');
  if(measured.contact!==undefined)requireValue(Math.abs(measured.contact-contact)<.0002,label+' measurements used another clip clock');
  if(measured.contactEnd!==undefined)requireValue(Math.abs(measured.contactEnd-contactEnd)<.0002,label+' measurements used another active clock');
  characters[id][slot]={...measured,contact,contactEnd,status:'ok',clip:authored.clip,gesture:authored.name_jp,
    authoredFrames:authored.frames,authoredFps:60,authoredDuration:authored.frames/60,
    trajectorySampling:measured.battleActive!==undefined?'exact-battle-active-frames':'legacy-active-samples',
    sourceVersion:metadata.version,source:'runtime-skinned-mesh'};
 }}
 return {version:metadata.version,source:'runtime-skinned-mesh',characters,...(measurements.hurtBounds?{hurtBounds:measurements.hurtBounds}:{})};
}
export function validateP3ContactDelivery(delivery){
 requireValue(delivery?.source==='runtime-skinned-mesh'&&typeof delivery.version==='string','override needs measured versioned delivery');
 for(const id of IDS)for(const slot of SLOTS){
  const row=delivery.characters?.[id]?.[slot];
  requireValue(row?.clip==='v17_'+slot&&row.source==='runtime-skinned-mesh'&&row.status==='ok',id+'/'+slot+' missing reviewed row');
  requireValue(row.contact>0&&row.contactEnd>row.contact&&row.contactEnd<1&&Number.isFinite(row.reach)&&row.reach>=0&&validNormalStrikeHeight(slot,row.height),id+'/'+slot+' invalid contact');
  validateTrajectory(id,slot,row);
 }
 if(delivery.hurtBounds)for(const id of IDS)for(const stance of ['stand','crouch']){
  const box=delivery.hurtBounds[id]?.[stance];requireValue(box&&Number.isFinite(box.bottom)&&Number.isFinite(box.top)&&box.top>box.bottom,id+'/'+stance+' invalid hurt bounds');
 }
 return delivery;
}
