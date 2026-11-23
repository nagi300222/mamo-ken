// Movement uses the authored animation clock. Contact is presented once by
// actual Battle events, including for older clips with time-only hit cues.
export function consumeSpecialMovementCues(spec,seconds,index,{audio,characterId,visual}={}){
 const cues=spec.cueTrack??[];
 while(index<cues.length&&cues[index].at<=seconds){
  const cue=cues[index++];
  if(cue.trigger==='contact'||['hit','block','tap'].includes(cue.key))continue;
  if(spec.motionVersion==='v17'&&cue.trigger!=='movement')continue;
  if(cue.type==='sfx')audio?.play(cue.key,characterId);
  else if(cue.type==='vfx')visual?.(cue);
 }
 return index;
}
