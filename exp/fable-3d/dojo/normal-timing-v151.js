// The authored striking pose lands on Battle.startup, independently of clip length.
import {MOTIFS} from './normal-motifs-v15.js';
export function normalClipTime(id,slot,frame,move,duration,contacts){
 const authored=contacts?.[id]?.[slot];
 const contact=authored?.contact??MOTIFS[id][slot].contact;
 const end=authored?.contactEnd??Math.min(.94,contact+.08);
 const total=move.startup+move.active+move.recovery;
 const activeEnd=move.startup+move.active-1;
 const f=Math.max(0,Math.min(total,frame));
 let phase;
 if(f<=move.startup)phase=contact*f/move.startup;
 else if(f<=activeEnd)phase=contact+(end-contact)*(f-move.startup)/Math.max(1,move.active-1);
 else phase=end+(1-end)*(f-activeEnd)/Math.max(1,total-activeEnd);
 return Math.min(duration,phase*duration);
}
