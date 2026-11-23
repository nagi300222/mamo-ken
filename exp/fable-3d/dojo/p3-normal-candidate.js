import {createP3ContactDelivery,NORMAL_R2_CONTACT_VERSION,normalArtIdentity} from './p3-contact-adapter.js';
import {createNormalMotionSource} from './normal-motion-source.js';
export const NORMAL_ART_MANIFEST_FILES=Object.freeze({r1Metadata:'motion/v17/normals_v17.json',
 r2Metadata:'motion/v17r2/normals_v17r2.json',r2Contacts:'motion/v17r2/normal_contacts_v17r2.json'});
const IDS=['moguzo','pisuke','godan','hakuma','chirka','takimaru','yomikage','bullet','dark_moguzo'];
const SLOTS=['stand_weak','stand_heavy','crouch_weak','crouch_heavy','air_weak','air_heavy'];
const check=(ok,message)=>{if(!ok)throw Error('P3 normal art metadata: '+message);};
export function mergeNormalArtMetadata(r1,r2){
 check(r1?.version==='v17-p3-normals-1'&&Object.keys(r1.characters??{}).length===9,'complete original r1 metadata required');
 check(r2?.version===NORMAL_R2_CONTACT_VERSION&&Object.keys(r2.characters??{}).length===1&&r2.characters.takimaru,'r2 must contain only the delivered Takimaru pack');
 const characters={};
 for(const id of IDS){
  const authored=id==='takimaru'?r2:r1,rows=authored.characters[id];check(rows&&Object.keys(rows).length===6,id+' needs all six authored normals');characters[id]={};
  for(const slot of SLOTS){const row=rows[slot],identity=normalArtIdentity(r2.version,id,slot);
   check(row?.character===id&&row.game_action===slot&&row.clip===identity.clip,id+'/'+slot+' revised identity');
   characters[id][slot]={...row,authoredMetadataFile:id==='takimaru'?NORMAL_ART_MANIFEST_FILES.r2Metadata:NORMAL_ART_MANIFEST_FILES.r1Metadata};
  }
 }
 return {...r2,characters,sourceManifests:{...NORMAL_ART_MANIFEST_FILES},originalVersion:r1.version};
}
export async function loadMergedNormalArtMetadata({read,fetchJSON,assetRoot=new URL('../',import.meta.url)}={}){
 const load=read??(path=>fetchJSON?fetchJSON(new URL(path,assetRoot)):fetch(new URL(path,assetRoot)).then(response=>{if(!response.ok)throw Error('P3 authored metadata HTTP '+response.status);return response.json();}));
 const [r1,r2]=await Promise.all([load(NORMAL_ART_MANIFEST_FILES.r1Metadata),load(NORMAL_ART_MANIFEST_FILES.r2Metadata)]);
 return mergeNormalArtMetadata(r1,r2);
}

// Explicit QA entry only. Loading a candidate never edits or enables the global
// normal-contact-overrides-p3.js approval module.
export function createP3NormalMotionCandidate(metadata,rawContacts,{assetRoot,revision=null}={}){
 const delivery=createP3ContactDelivery(metadata,{source:'runtime-skinned-mesh',characters:rawContacts});
 const source=createNormalMotionSource({version:'v17',delivery,...(assetRoot?{assetRoot}:{})});
 return Object.freeze({status:'candidate-only',revision,artRevision:metadata.version===NORMAL_R2_CONTACT_VERSION?'r2':'r1',authoring:metadata.authoring,build:metadata.build,delivery,source});
}
export async function loadP3NormalMotionCandidate({artRevision='r2',motionRoot=new URL(artRevision==='r2'?'../motion/v17r2/':'../motion/v17/',import.meta.url),fetcher=globalThis.fetch,
 moduleLoader=url=>import(url),revision=null}={}){
 check(artRevision==='r1'||artRevision==='r2','unknown art revision');
 if(artRevision==='r2'){
  const assetRoot=new URL('../../',motionRoot),fetchJSON=async url=>{const response=await fetcher(url);if(!response.ok)throw Error('P3 authored metadata HTTP '+response.status);return response.json();};
  const [metadata,raw]=await Promise.all([loadMergedNormalArtMetadata({assetRoot,fetchJSON}),fetchJSON(new URL(NORMAL_ART_MANIFEST_FILES.r2Contacts,assetRoot))]);
  return createP3NormalMotionCandidate(metadata,raw,{assetRoot,revision});
 }
 const metadataUrl=new URL('normals_v17.json',motionRoot),contactsUrl=new URL('normal-contacts-v17.js',motionRoot);
 const [response,raw]=await Promise.all([fetcher(metadataUrl),moduleLoader(contactsUrl.href)]);
 if(!response.ok)throw Error('P3 authored metadata HTTP '+response.status);
 if(!raw.NORMAL_CONTACTS_V17)throw Error('P3 measured NORMAL_CONTACTS_V17 is missing');
 const metadata=await response.json();
 return createP3NormalMotionCandidate(metadata,raw.NORMAL_CONTACTS_V17,{assetRoot:new URL('../../',motionRoot),revision});
}
