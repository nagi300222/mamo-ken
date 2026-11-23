// Explicit accepted deliveries, not a permissive prefix match. Runtime actions
// retain the canonical names so custom retargeting uses the same supported rig.
const REVISED=Object.freeze({moguzo:'s2',godan:'s2',hakuma:'s3',takimaru:'s2',yomikage:'s2',bullet:'s2'});
const VERSIONS=Object.freeze({v17:'v17-p3-specials-1',v17r2:'v17-p3-specials-r2'});
const IDS=['moguzo','pisuke','godan','hakuma','chirka','takimaru','yomikage','bullet','dark_moguzo'];
export function specialSourceIdentity(version,id,slot){
 const family=Object.hasOwn(VERSIONS,version)?version:Object.keys(VERSIONS).find(key=>VERSIONS[key]===version);
 if(!family||!IDS.includes(id)||!['s1','s2','s3'].includes(slot))throw Error('Unknown explicit P3 special identity: '+version+'/'+id+'/'+slot);
 const revised=family==='v17r2'&&REVISED[id]===slot,packR2=family==='v17r2'&&Object.hasOwn(REVISED,id);
 return {family,sourceVersion:VERSIONS[family],runtimeClip:slot+'_v17',sourceClip:slot+(revised?'_v17r2':'_v17'),
  sourceFile:'motion/'+(packR2?'v17r2':'v17')+'/'+id+'_specials_'+(packR2?'v17r2':'v17')+'.glb',revision:revised?'r2':'r1'};
}
export function mergeR2SpecialMetadata(r1,r2){
 if(r1?.version!==VERSIONS.v17||r2?.version!==VERSIONS.v17r2||
   Object.keys(r2.characters??{}).length!==6||Object.keys(REVISED).some(id=>!r2.characters[id]))throw Error('Incomplete explicit P3 r2 metadata');
 const characters={};
 for(const [id,moves]of Object.entries({...r1.characters,...r2.characters})){
  characters[id]=Object.fromEntries(Object.entries(moves).map(([slot,row])=>[slot,{...row,
   sourceTiming:{contactSeconds:row.contactSeconds,contact:row.contact,contact_end:row.contact_end},
   contactSeconds:row.contact_frame/60,contactEndSeconds:(row.contact_frame+row.active-1)/60,
   contact:row.contact_frame/row.frames,contact_end:(row.contact_frame+row.active-1)/row.frames}]));
 }
 return {...r1,...r2,characters};
}
