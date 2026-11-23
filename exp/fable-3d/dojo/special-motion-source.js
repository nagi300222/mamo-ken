import {IDS} from './balance.js';
import {APPROVED_P3_SPECIAL_MOTION_VERSION} from './special-motion-overrides-p3.js';

const SLOTS=['s1','s2','s3'];
const MOVEMENT_SOUNDS=new Set(['wind','special','clinch','grunt','chime','roar']);
const MOVEMENT_EFFECTS=new Set(['special','roar']);
const CONTACT_TYPES=new Set(['sfx','vfx','shake']);
const invariant=(ok,message)=>{if(!ok)throw Error('Invalid P3 special source: '+message);};
const finite=value=>Number.isFinite(value);

// This source describes authored animation only. It never changes Battle ranges,
// damage, startup, active, recovery or enables a new cross-skeleton technique.
export function createSpecialMotionSource({version,metadata,contacts,baseURL=new URL('../motion/v17/',import.meta.url)}){
 invariant(version==='v17','version');
 invariant(metadata?.version==='v17-p3-specials-1','metadata version');
 invariant(Object.keys(metadata.characters??{}).length===IDS.length,'nine characters');
 const characters={};
 for(const id of IDS){
  invariant(Object.keys(metadata.characters[id]??{}).length===3,id+' three moves');
  characters[id]={};
  for(const slot of SLOTS){
   const row=metadata.characters[id][slot],surface=contacts?.[id]?.[slot],label=id+'.'+slot;
   invariant(row?.character===id&&row.move_id===slot&&row.clip===slot+'_v17',label+' identity');
   invariant(row.fps===60&&Number.isInteger(row.frames)&&row.frames>0&&finite(row.duration_sec)&&row.duration_sec>0,label+' duration');
   invariant(Math.abs(row.duration_sec-row.frames/row.fps)<.0002,label+' frame clock');
   invariant(finite(row.contactSeconds)&&row.contactSeconds>0&&row.contactSeconds<row.duration_sec,label+' contact');
   invariant(surface?.status==='ok'&&!(surface.issues?.length)&&surface.clip===row.clip,label+' surface review');
   invariant(finite(surface.reach)&&finite(surface.height),label+' measured surface');
   invariant(Math.abs(surface.contactSeconds-row.contactSeconds)<.0002&&surface.attackLimb===row.attack_limb,label+' contact identity');
   const movement=[],contact=[];let last=-1;
   for(const cue of row.cue_track??[]){
    invariant(finite(cue.at)&&cue.at>=last&&cue.at>=0&&cue.at<row.duration_sec,label+' cue clock');last=cue.at;
    if(cue.trigger==='contact'){
     invariant(CONTACT_TYPES.has(cue.type)&&['hit','guard'].includes(cue.on),label+' contact cue');
     contact.push({...cue});
    }else{
     invariant(cue.trigger==='movement'&&cue.on==='always',label+' cue trigger');
     invariant(cue.type==='sfx'?MOVEMENT_SOUNDS.has(cue.key):cue.type==='vfx'&&MOVEMENT_EFFECTS.has(cue.key),label+' movement cue');
     movement.push({...cue});
    }
   }
   characters[id][slot]=Object.freeze({row:Object.freeze({...row}),surface:Object.freeze({...surface}),
    cueTrack:Object.freeze(movement),contactCueTrack:Object.freeze(contact)});
  }
  Object.freeze(characters[id]);
 }
 return Object.freeze({version,characters:Object.freeze(characters),baseURL:new URL(baseURL)});
}

export async function loadV17SpecialMotionSource(fetchJSON=async url=>{
 const response=await fetch(url);if(!response.ok)throw Error('P3 special HTTP '+response.status+': '+url.pathname);return response.json();
}){
 const baseURL=new URL('../motion/v17/',import.meta.url);
 const [metadata,contacts]=await Promise.all(['specials_v17.json','special_contacts_v17.json'].map(name=>fetchJSON(new URL(name,baseURL))));
 return createSpecialMotionSource({version:'v17',metadata,contacts,baseURL});
}

export function loadApprovedSpecialMotionSource(fetchJSON){
 if(APPROVED_P3_SPECIAL_MOTION_VERSION===null)return null;
 invariant(APPROVED_P3_SPECIAL_MOTION_VERSION==='v17','approved version');
 return loadV17SpecialMotionSource(fetchJSON);
}

export function specialMotionOverride(source,id,spec,originalURL){
 if(!source||spec.moveId==='ultimate')return {spec,url:originalURL};
 const authored=source.characters[id]?.[spec.moveId];invariant(!!authored,id+'.'+spec.moveId+' source');
 const {row,surface,cueTrack,contactCueTrack}=authored;
 return {url:new URL('manifest.json',source.baseURL),spec:{...spec,
  animationSources:{attacker:{glb:id+'_specials_v17.glb',clip:row.clip}},
  inGameStartClip:undefined,actorTracks:undefined,
  contactSeconds:row.contactSeconds,contactPhase:row.contact,contactEndPhase:row.contact_end,
  cueTrack,contactCueTrack,motionVersion:source.version,authoredContact:surface,
  kind:row.kind,attackLimb:row.attack_limb,origin:row.origin}};
}

// Freeze uses the Battle frame. A long hitstop never advances this clip clock.
// For P3 clips the complete active interval maps to the authored contact interval;
// the remaining motion maps only to recovery. Older clips keep their old mapping.
export function specialClipTime(spec,move,frame,duration){
 const contact=spec.contactSeconds??duration*move.startup/(move.startup+move.active+move.recovery);
 const f=Math.max(0,Math.min(frame,move.startup+move.active+move.recovery));
 if(f>=move.startup+move.active+move.recovery)return duration;
 if(f<=move.startup)return contact*f/Math.max(1,move.startup);
 if(spec.motionVersion!=='v17')return Math.min(duration,contact+(duration-contact)*(f-move.startup)/(move.active+move.recovery));
 const activeEnd=move.startup+move.active-1;
 const end=Math.max(contact,Math.min(duration,(spec.contactEndPhase??spec.contactPhase)*duration));
 if(f<=activeEnd)return contact+(end-contact)*(f-move.startup)/Math.max(1,move.active-1);
 return Math.min(duration,end+(duration-end)*(f-activeEnd)/Math.max(1,move.recovery+1));
}
