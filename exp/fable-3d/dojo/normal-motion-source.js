import {NORMAL_CONTACTS as BASE_CONTACTS,NORMAL_CONTACTS_VERSION as BASE_VERSION} from './normal-contacts-v151.js';
import {ACTIVE_NORMAL_MOTION_VERSION,NORMAL_CONTACTS,NORMAL_CONTACTS_VERSION} from './normal-contact-source.js';
import {APPROVED_P3_CONTACT_DELIVERY} from './normal-contact-overrides-p3.js';
import {validateP3ContactDelivery} from './p3-contact-adapter.js';

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
 const clipName=slot=>{check(isNormal(slot),'unknown normal '+slot);return version+'_'+slot;};
 const clipNames=Object.freeze(NORMAL_MOTION_SLOTS.map(clipName));
 const slotForClip=name=>typeof name==='string'&&name.startsWith(version+'_')&&isNormal(name.slice(version.length+1))?name.slice(version.length+1):null;
 const pack=id=>{
  check(NORMAL_MOTION_IDS.includes(id),'unknown rig '+id);
  const relative=version==='v17'?`motion/v17/${id}_normals_v17.glb`:`normal/v15/${id}_normals.glb`;
  return Object.freeze({id,version,contactVersion,path:'../'+relative,url:new URL(relative,assetRoot).href,
   clipNames,contacts:contacts[id]});
 };
 const validatePack=(id,gltf)=>{
  pack(id);check(Array.isArray(gltf?.animations)&&gltf.animations.length===6,id+' requires exactly six clips');
  const seen=new Set();
  for(const clip of gltf.animations){
   check(clipNames.includes(clip.name)&&!seen.has(clip.name),id+' unexpected/duplicate clip '+clip.name);
   check(Number.isFinite(clip.duration)&&clip.duration>0&&Array.isArray(clip.tracks)&&clip.tracks.length>=4,id+' invalid clip '+clip.name);
   if(version==='v17'){
    const reference=contacts[id][slotForClip(clip.name)];
    check(Number.isFinite(reference.authoredDuration)&&Math.abs(clip.duration-reference.authoredDuration)<.001,id+' stale pack duration '+clip.name);
   }
   seen.add(clip.name);
  }
  check(seen.size===6,id+' missing clips');return gltf;
 };
 return Object.freeze({version,contactVersion,contacts,clipNames,clipName,slotForClip,originalClipName:name=>BASE_CLIPS[slotForClip(name)]??null,pack,validatePack,
  isNormalClip:name=>typeof name==='string'&&clipNames.includes(name)});
}

export const ACTIVE_NORMAL_MOTION_SOURCE=createNormalMotionSource({version:ACTIVE_NORMAL_MOTION_VERSION,delivery:APPROVED_P3_CONTACT_DELIVERY});
// Fail closed if someone changes a contact selector without changing the source.
check(ACTIVE_NORMAL_MOTION_SOURCE.contacts===NORMAL_CONTACTS&&ACTIVE_NORMAL_MOTION_SOURCE.contactVersion===NORMAL_CONTACTS_VERSION,'contact/motion selection mismatch');
export function getNormalMotionPack(id,{source=ACTIVE_NORMAL_MOTION_SOURCE}={}){return source.pack(id);}
