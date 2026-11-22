// Minimal original synthesized impact sounds. No copyrighted audio assets or music.
// AudioContext is opened only by an explicit user interaction (start/tap/sound button).
import { showtimeFor } from './showtime-profiles.js';

export function createCombatAudio(contextFactory=()=>globalThis.AudioContext||globalThis.webkitAudioContext){
  let context=null,master=null,muted=false;
  const last=new Map();
  function unlock(){
    if(!context){
      const Factory=contextFactory();
      if(!Factory)return false;
      try{
        context=new Factory();
        master=context.createGain();master.gain.value=.12;master.connect(context.destination);
      }catch{context=null;master=null;return false;}
    }
    if(context.state==='suspended')context.resume().catch(()=>{});
    return true;
  }
  function setMuted(next){
    muted=!!next;
    if(master)master.gain.value=muted?0:.12;
    return muted;
  }
  function play(kind,id='moguzo'){
    if(muted||!context||context.state!=='running')return false;
    const now=context.currentTime,key=kind+':'+id;
    // Avoid noisy overlaps when several collision events share one simulation frame.
    if(now-(last.get(key)??-100)<.045)return false;
    last.set(key,now);
    const base=showtimeFor(id).pitch;
    const cfg={
      tap:[.9,.055,.08,'triangle'],hit:[.75,.10,.28,'sawtooth'],
      block:[1.5,.09,.14,'triangle'],special:[1.5,.17,.18,'sawtooth'],
      ultimate:[.72,.37,.27,'sawtooth'],roar:[.55,.25,.25,'sawtooth'],
      clinch:[.48,.22,.21,'triangle'],counter:[2.3,.14,.20,'square'],
      ko:[.35,.37,.25,'sawtooth']
    }[kind]||[1,.1,.12,'triangle'];
    const [ratio,duration,level,wave]=cfg;
    try{
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
      oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};
      return true;
    }catch{return false;}
  }
  return {unlock,play,setMuted,get muted(){return muted;},get supported(){return !!contextFactory();}};
}
