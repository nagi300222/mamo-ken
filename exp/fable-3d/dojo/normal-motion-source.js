import {NORMAL_CONTACTS as BASE_CONTACTS,NORMAL_CONTACTS_VERSION as BASE_VERSION} from './normal-contacts-v151.js';
import {ACTIVE_NORMAL_MOTION_VERSION,NORMAL_CONTACTS,NORMAL_CONTACTS_VERSION} from './normal-contact-source.js';
import {APPROVED_P3_CONTACT_DELIVERY} from './normal-contact-overrides-p3.js';
import {validateP3ContactDelivery,normalArtIdentity} from './p3-contact-adapter.js';

export const NORMAL_MOTION_IDS=Object.freeze(['moguzo','pisuke','godan','hakuma','chirka','takimaru','yomikage','bullet','dark_moguzo']);
export const NORMAL_MOTION_SLOTS=Object.freeze(['stand_weak','stand_heavy','crouch_weak','crouch_heavy','air_weak','air_heavy']);
const isNormal=slot=>NORMAL_MOTION_SLOTS.includes(slot);
const BASE_CLIPS=Object.freeze({stand_weak:'stand_light',stand_heavy:'stand_heavy',crouch_weak:'crouch_light',crouch_heavy:'crouch_heavy',air_weak:'air_light',air_heavy:'air_heavy'});
const check=(valid,message)=>{if(!valid)throw Error('Normal motion source: '+message);};

// Test/QA injection uses a complete measured delivery without changing the live
// approval module. Production actors all consume the single active provider.
export function createNormalMotionSource({version='v15',delivery=null,assetRoot=new URL('../',import.meta.url)}={}){
 check(version==='v15'||version==='v17','unknown version '+version);
 const reviewed=version==='v17'?validateP3ContactDelivery(delivery):null;
 const contacts=reviewed?.characters??BASE_CONTACTS;
 const contactVersion=reviewed?.version??BASE_VERSION;
 const rigOptions=options=>typeof options==='string'?options:options?.rigId;
 const namesFor=id=>NORMAL_MOTION_SLOTS.map(slot=>version==='v17'?contacts[id][slot].clip:version+'_'+slot);
 const clipNames=Object.freeze([...new Set(NORMAL_MOTION_IDS.flatMap(namesFor))]);
 const clipName=(slot,options)=>{
  check(isNormal(slot),'unknown normal '+slot);const id=rigOptions(options);
  if(id!==undefined){check(NORMAL_MOTION_IDS.includes(id),'unknown rig '+id);return version==='v17'?contacts[id][slot].clip:version+'_'+slot;}
  const names=[...new Set(NORMAL_MOTION_IDS.map(id=>version==='v17'?contacts[id][slot].clip:version+'_'+slot))];
  check(names.length===1,'visual rig id required for '+slot);return names[0];
 };
 const slotForClip=(name,options)=>{
  const id=rigOptions(options);if(id!==undefined)check(NORMAL_MOTION_IDS.includes(id),'unknown rig '+id);
  const ids=id?[id]:NORMAL_MOTION_IDS;return NORMAL_MOTION_SLOTS.find(slot=>ids.some(id=>clipName(slot,{rigId:id})===name))??null;
 };
 const pack=id=>{
  check(NORMAL_MOTION_IDS.includes(id),'unknown rig '+id);
  const files=version==='v17'?[...new Set(NORMAL_MOTION_SLOTS.map(slot=>contacts[id][slot].file??normalArtIdentity(contactVersion,id,slot).file))]:[`normal/v15/${id}_normals.glb`];
  check(files.length===1,id+' requires one coherent source pack');const relative=files[0];
  return Object.freeze({id,version,contactVersion,file:relative,path:'../'+relative,url:new URL(relative,assetRoot).href,
   clipNames:Object.freeze(namesFor(id)),contacts:contacts[id]});
 };
 const validatePack=(id,gltf)=>{
  const selected=pack(id);check(Array.isArray(gltf?.animations)&&gltf.animations.length===6,id+' requires exactly six clips');
  const seen=new Set();
  for(const clip of gltf.animations){
   check(selected.clipNames.includes(clip.name)&&!seen.has(clip.name),id+' unexpected/duplicate clip '+clip.name);
   check(Number.isFinite(clip.duration)&&clip.duration>0&&Array.isArray(clip.tracks)&&clip.tracks.length>=4,id+' invalid clip '+clip.name);
   if(version==='v17'){
    const reference=contacts[id][slotForClip(clip.name,{rigId:id})];
    check(Number.isFinite(reference.authoredDuration)&&Math.abs(clip.duration-reference.authoredDuration)<.001,id+' stale pack duration '+clip.name);
   }
   seen.add(clip.name);
  }
  check(seen.size===6,id+' missing clips');return gltf;
 };
 return Object.freeze({version,contactVersion,contacts,clipNames,clipName,slotForClip,originalClipName:(name,options)=>BASE_CLIPS[slotForClip(name,options)]??null,pack,validatePack,
  isNormalClip:(name,options)=>slotForClip(name,options)!==null});
}

export const ACTIVE_NORMAL_MOTION_SOURCE=createNormalMotionSource({version:ACTIVE_NORMAL_MOTION_VERSION,delivery:APPROVED_P3_CONTACT_DELIVERY});
// Fail closed if someone changes a contact selector without changing the source.
check(ACTIVE_NORMAL_MOTION_SOURCE.contacts===NORMAL_CONTACTS&&ACTIVE_NORMAL_MOTION_SOURCE.contactVersion===NORMAL_CONTACTS_VERSION,'contact/motion selection mismatch');
export function getNormalMotionPack(id,{source=ACTIVE_NORMAL_MOTION_SOURCE}={}){return source.pack(id);}
