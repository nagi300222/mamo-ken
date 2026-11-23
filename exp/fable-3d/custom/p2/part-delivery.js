import {validateMeshPartManifest,MESH_PART_DONORS} from './part-contract.js';
const slots=['head','ears','hands','feet'];
const key=entry=>[entry.targetBaseId,entry.slot,entry.donorId].join('/');
export function verifyMeshPartDelivery(manifest,{requireFull=false}={}){
 validateMeshPartManifest(manifest);
 const expected=MESH_PART_DONORS.flatMap(targetBaseId=>MESH_PART_DONORS.filter(donorId=>donorId!==targetBaseId).flatMap(donorId=>slots.map(slot=>key({targetBaseId,donorId,slot}))));
 expected.push('moguzo/tail/godan','godan/tail/moguzo');
 const present=new Set(manifest.modules.map(key)),missing=expected.filter(id=>!present.has(id)),extra=[...present].filter(id=>!expected.includes(id));
 if(requireFull&&(missing.length||extra.length||present.size!==26))throw Error('P2全交換の26部品が揃っていません: '+JSON.stringify({present:present.size,missing,extra}));
 return {publishedModules:manifest.modules.length,expectedModules:26,full:!missing.length&&!extra.length&&present.size===26,missing,extra};
}
// These are test appearances, never replacements for a user's saved choices.
// Prefer different donors across adjacent slots to exercise both sides of a seam.
export function mixedMeshPartProfiles(manifest,{requireFull=false}={}){
 verifyMeshPartDelivery(manifest,{requireFull});
 const order={moguzo:['godan','bullet'],godan:['bullet','moguzo'],bullet:['moguzo','godan']};
 return MESH_PART_DONORS.map(baseId=>{
  const moduleIds=[],meshParts={};
  for(const [index,slot]of [...slots,'tail'].entries()){
   const donors=order[baseId],preferred=[donors[index%2],donors[(index+1)%2]];
   const entry=preferred.map(donorId=>manifest.modules.find(m=>m.targetBaseId===baseId&&m.slot===slot&&m.donorId===donorId)).find(Boolean);
   if(entry){meshParts[slot]=entry.donorId;moduleIds.push(entry.id);}
  }
  return {baseId,meshParts,moduleIds,exchangedSlots:moduleIds.length,mixedDonors:new Set(Object.values(meshParts)).size,partial:moduleIds.length<(baseId==='bullet'?4:5)};
 }).filter(profile=>profile.exchangedSlots);
}
