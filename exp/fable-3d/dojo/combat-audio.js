// Minimal original synthesized impact sounds. No copyrighted audio assets or music.
// AudioContext is opened only by an explicit user interaction (start/tap/sound button).
import { showtimeFor } from './showtime-profiles.js';
import { isNativeRuntime } from './landscape-lock.js';
import {IMPACT_SOUND_RECIPES,combatFeedback} from './fight-feel.js';
import {readUIAudioMuted,setUIAudioMuted,subscribeUIAudioMuted} from '../shared-ui/ui-feedback.js';

export function cinematicSoundKind(key) {
  if (/tension_hold|mute/.test(key)) return null;
  if (/breath|rustle/.test(key)) return 'breath';
  if (/silence|silent|quiet|stillness|eyes_open|lights_out/.test(key)) return null;
  if (/fuse_beep/.test(key)) return 'beep';
  if (/nut_catch|nut_land_tick|body_land_soft/.test(key)) return 'tap';
  if (/presence_pass/.test(key)) return 'breath';
  if (/afterglow_hum|dark_aura|charge_low/.test(key)) return 'aura';
  if (/chime|blink|peekaboo|illusion|finish_pose/.test(key)) return 'chime';
  if (/poison|bubble|marks_converge/.test(key)) return 'bubble';
  if (/rock_wall_break|ground_slam|snow_slam|wall_slam|blast|explosion/.test(key)) return 'crash';
  if (/crack|rubble|debris/.test(key)) return 'crack';
  if (/ult_hit/.test(key)) return /light|claw|kick|rapid/.test(key) ? 'hit' : 'ultimate';
  if (/whoosh|swish|wind|dash|slide|jump|launch|pounce|release|nut_lob|nut_toss/.test(key)) return 'wind';
  if (/step|plant|shinkyaku|land|slam|knees_drop/.test(key)) return 'clinch';
  if (/grab|strain|taunt|grunt/.test(key)) return 'grunt';
  if (/howl|roar/.test(key)) return 'roar';
  return 'special';
}

export function createCombatAudio(contextFactory=()=>globalThis.AudioContext||globalThis.webkitAudioContext){
  let context=null,master=null,muted=readUIAudioMuted(),volume=1;
  const last=new Map();
  let noiseBuffer=null;
  const activeSounds=new Set();
  function suspend(){
    for(const stop of activeSounds){try{stop();}catch{}}
    activeSounds.clear();
    if(context?.state==='running'){try{context.suspend?.()?.catch?.(()=>{});}catch{}}
  }
  const cleanup=[];
  function listen(target,type,handler,options){target?.addEventListener?.(type,handler,options);cleanup.push(()=>target?.removeEventListener?.(type,handler,options));}
  listen(globalThis,'pagehide',suspend);
  listen(globalThis.document,'visibilitychange',()=>{if(globalThis.document.hidden)suspend();});
  if(isNativeRuntime()){
    listen(globalThis,'mamoken:native-state',event=>{if(event.detail?.active===false)suspend();});
    // Resume only within a real user gesture, including the pause/resume button.
    listen(globalThis,'pointerdown',()=>{if(globalThis.mamokenNative?.active!==false&&context?.state==='suspended')unlock();},{capture:true});
  }
  const unsubscribeMute=subscribeUIAudioMuted(next=>applyMuted(next));
  function unlock(){
    if(globalThis.document?.hidden||globalThis.mamokenNative?.active===false)return false;
    if(!context){
      const Factory=contextFactory();
      if(!Factory)return false;
      try{
        context=new Factory();
        master=context.createGain();master.gain.value=muted?0:.12*volume;master.connect(context.destination);
      }catch{context=null;master=null;return false;}
    }
    if(context.state==='suspended')context.resume().catch(()=>{});
    return true;
  }
  function applyMuted(next){
    muted=!!next;
    if(master)master.gain.value=muted?0:.12*volume;
    if(muted){for(const stop of activeSounds){try{stop();}catch{}}activeSounds.clear();}
    return muted;
  }
  function setMuted(next){return setUIAudioMuted(next);}
  function setVolume(next){
    if(!Number.isFinite(next))throw new TypeError('sound volume must be finite');
    volume=Math.max(0,Math.min(1,next));
    if(master)master.gain.value=muted?0:.12*volume;
    return volume;
  }
  function playNoise(kind, now, duration, level, voices, recipe) {
    if (!context.createBuffer || !context.createBiquadFilter) return false;
    if (!noiseBuffer) {
      noiseBuffer = context.createBuffer(1, context.sampleRate, context.sampleRate);
      const samples = noiseBuffer.getChannelData(0);
      for (let index = 0; index < samples.length; index++) samples[index] = Math.random() * 2 - 1;
    }
    const source = context.createBufferSource(), filter = context.createBiquadFilter();
    const gain = context.createGain();
    source.buffer = noiseBuffer;
    filter.type = recipe?.filter??(kind === 'wind' || kind === 'breath' ? 'bandpass' : 'lowpass');
    const cutoff = recipe?.cutoff??{wind:1500,breath:700,crack:900,crash:450}[kind];
    filter.frequency.setValueAtTime(cutoff, now);
    filter.frequency.exponentialRampToValueAtTime(recipe?.endCutoff??Math.max(80,cutoff * .35), now + duration);
    gain.gain.setValueAtTime(.0001,now);
    gain.gain.exponentialRampToValueAtTime(level,now + Math.min(.04,duration * .2));
    gain.gain.exponentialRampToValueAtTime(.0001,now + duration);
    source.connect(filter);filter.connect(gain);gain.connect(master);
    const stop = () => {gain.disconnect();source.stop();};
    activeSounds.add(stop);
    voices?.add(stop);
    source.onended = () => {
      voices?.delete(stop);
      activeSounds.delete(stop);
      source.disconnect();filter.disconnect();gain.disconnect();
    };
    source.start(now);source.stop(now + duration);
    return true;
  }
  function play(kind,id='moguzo',{voices}={}){
    if(muted||volume===0||!context||context.state!=='running')return false;
    const now=context.currentTime,key=kind+':'+id;
    // Avoid noisy overlaps when several collision events share one simulation frame.
    if(now-(last.get(key)??-100)<.045)return false;
    last.set(key,now);
    const base=showtimeFor(id).pitch;
    const recipe=IMPACT_SOUND_RECIPES[kind];
    const cfg=recipe?[recipe.ratio,recipe.duration,recipe.level,recipe.wave]:{
      tap:[.9,.055,.08,'triangle'],hit:[.75,.10,.28,'sawtooth'],
      block:[1.5,.09,.14,'triangle'],special:[1.5,.17,.18,'sawtooth'],
      ultimate:[.72,.37,.27,'sawtooth'],roar:[.55,.25,.25,'sawtooth'],
      clinch:[.48,.22,.21,'triangle'],counter:[2.3,.14,.20,'square'],
      ko:[.35,.37,.25,'sawtooth'],
      wind:[1.2,.22,.14,'triangle'],breath:[.4,.32,.035,'sine'],
      crack:[.45,.25,.24,'triangle'],crash:[.32,.55,.38,'sawtooth'],
      chime:[3.8,.23,.10,'sine'],bubble:[2.1,.16,.10,'sine'],
      grunt:[.28,.20,.14,'triangle'],aura:[.28,.65,.05,'sine'],
      beep:[4,.055,.08,'square']
    }[kind]||[1,.1,.12,'triangle'];
    const [ratio,duration,level,wave]=cfg;
    try{
      if ((recipe?.noise||['wind','breath','crack','crash'].includes(kind)) &&
          playNoise(kind,now,duration,level,voices,recipe?.noise)) return true;
      const oscillator=context.createOscillator(),gain=context.createGain();
      const startFreq=Math.max(50,base*ratio);
      oscillator.type=wave;
      oscillator.frequency.setValueAtTime(startFreq,now);
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(45,startFreq*(kind==='counter'?1.4:.55)),now+duration);
      gain.gain.setValueAtTime(.0001,now);
      gain.gain.exponentialRampToValueAtTime(Math.max(.001,level),now+.008);
      gain.gain.exponentialRampToValueAtTime(.0001,now+duration);
      oscillator.connect(gain);gain.connect(master);
      oscillator.start(now);oscillator.stop(now+duration+.016);
      const stop=()=>{gain.disconnect();oscillator.stop();};
      activeSounds.add(stop);
      voices?.add(stop);
      oscillator.onended=()=>{
        voices?.delete(stop);
        activeSounds.delete(stop);
        oscillator.disconnect();gain.disconnect();
      };
      return true;
    }catch{return false;}
  }
  function playFeedback(event,options){
    const feedback=combatFeedback(event);
    if(!feedback?.sound)return false;
    return play(feedback.sound,feedback.characterId,options);
  }
  return {unlock,play,playFeedback,setMuted,setVolume,suspend,dispose(){suspend();unsubscribeMute();for(const remove of cleanup)remove();context?.close?.()?.catch?.(()=>{});},get volume(){return volume;},get muted(){return muted;},get context(){return context;},get supported(){return !!contextFactory();}};
}
