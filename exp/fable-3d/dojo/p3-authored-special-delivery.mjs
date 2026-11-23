// Converts the explicit Claude exact-frame table, retaining its provenance.
// This is authored measurement, not a claim of independent browser acceptance.
import {createP3SpecialContactDelivery} from './special-contact-runtime-p3.js';
export function authoredSpecialContactDelivery(source){
 const characters={};
 for(const [id,moves]of Object.entries(source.characters)){characters[id]={};for(const [slot,entry]of Object.entries(moves)){
  const {row,surface}=entry,points=surface.activeReach;
  if(!points.every(p=>Number.isInteger(p.frame)))throw Error('Authored exact table lacks integer active-frame samples: '+id+'.'+slot);
  characters[id][slot]={...surface,source:'runtime-skinned-mesh',sampling:'exact-clip-clock',producer:'Claude authored WebGL exact-frame table',
   sampledContactSeconds:row.contactSeconds,contactSeconds:row.contactSeconds,projectileSocket:surface.socket&&{...surface.socket},
   activeReach:points.map(p=>({...p,phase:p.frame/Math.max(1,row.active-1)}))};
 }}
 return {...createP3SpecialContactDelivery(source.metadata,{source:'runtime-skinned-mesh',sampling:'exact-clip-clock',characters}),producer:'Claude authored WebGL exact-frame table; independent browser acceptance recorded separately'};
}
