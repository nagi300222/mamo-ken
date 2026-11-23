import {consumeSpecialMovementCues} from '../dojo/special-cues.js';

// A canonical clip name can be shared by three different equipped sources.
// Playback identity belongs to the chosen slot/action instance and source ref.
export function specialPlaybackKey(actor,fighter,entry,name){
 return [name,fighter.action?.id??'',entry?.sourceRef??fighter.action?.customRef??'',entry?.action?.getClip().uuid??'',fighter.action?.serial??0,fighter.state].join(':');
}
export function presentEquippedSpecial(actor,fighter,entry,seconds,{audio,visual}){
 const characterId=entry.sourceCharacterId??fighter.action?.sourceCharacterId??actor.id;
 const ref=entry.sourceRef??fighter.action?.customRef??characterId+'.'+fighter.action?.id;
 const record=cue=>{actor.specialCueLog??=[];actor.specialCueLog.push({ref,characterId,...cue});if(actor.specialCueLog.length>48)actor.specialCueLog.shift();};
 actor.specialCueIndex=consumeSpecialMovementCues(entry.spec,seconds,actor.specialCueIndex??0,{
  characterId,audio:{play(key,id){const played=audio?.play(key,id);record({type:'sfx',key,played:!!played});return played;}},
  visual:cue=>{const result=visual?.(cue,characterId);record({type:'vfx',key:cue.key,rendered:!!result,...(result?.material?.color?{color:result.material.color.getHex()}:{})});}
 });
}
