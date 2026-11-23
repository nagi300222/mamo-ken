import {createP3ContactDelivery} from './p3-contact-adapter.js';
import {createNormalMotionSource} from './normal-motion-source.js';

// Explicit QA entry only. Loading a candidate never edits or enables the global
// normal-contact-overrides-p3.js approval module.
export function createP3NormalMotionCandidate(metadata,rawContacts,{assetRoot,revision=null}={}){
 const delivery=createP3ContactDelivery(metadata,{source:'runtime-skinned-mesh',characters:rawContacts});
 const source=createNormalMotionSource({version:'v17',delivery,...(assetRoot?{assetRoot}:{})});
 return Object.freeze({status:'candidate-only',revision,authoring:metadata.authoring,build:metadata.build,delivery,source});
}
export async function loadP3NormalMotionCandidate({motionRoot=new URL('../motion/v17/',import.meta.url),fetcher=globalThis.fetch,
 moduleLoader=url=>import(url),revision=null}={}){
 const metadataUrl=new URL('normals_v17.json',motionRoot),contactsUrl=new URL('normal-contacts-v17.js',motionRoot);
 const [response,raw]=await Promise.all([fetcher(metadataUrl),moduleLoader(contactsUrl.href)]);
 if(!response.ok)throw Error('P3 authored metadata HTTP '+response.status);
 if(!raw.NORMAL_CONTACTS_V17)throw Error('P3 measured NORMAL_CONTACTS_V17 is missing');
 const metadata=await response.json();
 return createP3NormalMotionCandidate(metadata,raw.NORMAL_CONTACTS_V17,{assetRoot:new URL('../../',motionRoot),revision});
}
