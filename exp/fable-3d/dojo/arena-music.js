// Original synthesized 32-step arena loop. No recordings or third-party music.
// Update is driven by the game's rendering loop; there are no background timers.
export const ARENA_BPM=118;
export const ARENA_STEP_SECONDS=60/ARENA_BPM/2;
export const MELODY_STEPS=Object.freeze([
  0,7,-1,5, 3,-1,7,10, 12,10,-1,7, 5,3,2,-1,
  0,-1,5,7, 10,12,7,-1, 5,3,-1,2, 0,-2,3,-1
]);
export const BASS_STEPS=Object.freeze([0,0,3,3,5,5,3,3, -2,-2,0,0,2,2,-2,-2]);

export function createArenaMusic(getContext){
  let enabled=false,nextAt=0,stepIndex=0,bus=null,active=false;
  const voices=new Set();
  function emit(ctx,time,freq,length,wave,level){
    const osc=ctx.createOscillator(),gain=ctx.createGain();
    osc.type=wave;osc.frequency.setValueAtTime(freq,time);
    gain.gain.setValueAtTime(.0001,time);
    gain.gain.exponentialRampToValueAtTime(level,time+.008);
    gain.gain.exponentialRampToValueAtTime(.0001,time+length);
    osc.connect(gain);gain.connect(bus);
    osc.onended=()=>{osc.disconnect();gain.disconnect();voices.delete(osc);};
    voices.add(osc);osc.start(time);osc.stop(time+length+.018);
  }
  const frequency=(midi)=>440*Math.pow(2,(midi-69)/12);
  function schedule(ctx,time,step){
    const m=MELODY_STEPS[step%MELODY_STEPS.length];
    if(m!==-1)emit(ctx,time,frequency(64+m),ARENA_STEP_SECONDS*.68,'triangle',.11);
    if(step%2===0){
      const b=BASS_STEPS[Math.floor(step/2)%BASS_STEPS.length];
      emit(ctx,time,frequency(40+b),ARENA_STEP_SECONDS*1.45,'sine',.18);
    }
  }
  function setEnabled(next){
    enabled=!!next;nextAt=0;stepIndex=0;
    if(bus)bus.gain.value=enabled&&active?.032:0;
    return enabled;
  }
  function update(playable){
    const ctx=getContext?.();
    if(!ctx||ctx.state!=='running'||!enabled||!playable){
      active=false;nextAt=0;
      if(bus)bus.gain.value=0;
      return false;
    }
    active=true;
    if(!bus){bus=ctx.createGain();bus.gain.value=.032;bus.connect(ctx.destination);}
    bus.gain.value=.032;
    const now=ctx.currentTime;
    if(!nextAt||nextAt<now-.30)nextAt=now+.035;
    let count=0;
    // Schedule no more than 3 short look-ahead notes per rendered frame.
    while(nextAt<now+.13&&count++<3){
      schedule(ctx,nextAt,stepIndex++);
      nextAt+=ARENA_STEP_SECONDS;
    }
    return true;
  }
  function dispose(){
    enabled=false;active=false;nextAt=0;
    if(bus){bus.gain.value=0;bus.disconnect();bus=null;}
    // Newly scheduled voices live <= one beat; do not disconnect while playing.
    // They will self-dispose onended; the global AudioContext is owned by combat-audio.
  }
  return {update,setEnabled,dispose,get enabled(){return enabled;},get active(){return active;},get step(){return stepIndex;}};
}
