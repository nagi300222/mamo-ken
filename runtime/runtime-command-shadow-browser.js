(function installRuntimeCommandShadow(root){
  'use strict';

  const VERSION='runtime-command-shadow-browser-v1';
  const MAX_OBSERVATIONS=256;
  const CURRENT_CHARACTERS=new Set(['moguzo','pisuke','godan']);
  const CURRENT_LEVELS=new Set(['high','mid','low']);
  const requestedEnabled=/(?:^|[?&])mamokenShadow=1(?:&|$)/.test((root.location&&root.location.search)||'');
  let disabledReason=null;
  let observations=[];

  function stableStringify(value){
    if(value===null||typeof value!=='object')return JSON.stringify(value);
    if(Array.isArray(value))return'['+value.map(stableStringify).join(',')+']';
    const keys=Object.keys(value).sort();
    return'{'+keys.map(function(key){return JSON.stringify(key)+':'+stableStringify(value[key]);}).join(',')+'}';
  }

  function fnv1a32(text){
    let hash=0x811c9dc5;
    for(let i=0;i<text.length;i++){
      hash^=text.charCodeAt(i);
      hash=Math.imul(hash,0x01000193)>>>0;
    }
    return hash.toString(16).padStart(8,'0');
  }

  function clone(value){return JSON.parse(JSON.stringify(value));}
  function fail(message){throw new TypeError(message);}
  function assertFrame(value){if(!Number.isInteger(value)||value<0)fail('frame must be a non-negative integer');return value;}
  function assertPlayer(value){if(value!==0&&value!==1)fail('player must be 0 or 1');return value;}
  function assertCharacter(value){if(!CURRENT_CHARACTERS.has(value))fail('characterId must be a current character');return value;}
  function assertTrigger(value){if(value!=='grab'&&!CURRENT_LEVELS.has(value))fail('trigger must be high, mid, low, or grab');return value;}
  function assertDirection(value){if(value!=='left'&&value!=='down'&&value!=='right')fail('direction must be left, down, or right');return value;}

  function fallbackDecision(trigger){
    return trigger==='grab'
      ?{kind:'fallback',fallback:'normal-grab'}
      :{kind:'fallback',fallback:'normal-attack',level:trigger};
  }

  function coreDecision(payload){
    if(typeof BAL==='undefined'||!BAL.CMD||!BAL.CMD.moves)fail('runtime BAL.CMD is unavailable');
    const frame=payload.frame,trigger=payload.trigger;
    const directions=payload.directions.filter(function(entry){
      return entry.frame<=frame&&frame-entry.frame<=BAL.CMD.bufF;
    });
    if(directions.length<2)return fallbackDecision(trigger);
    const previous=directions[directions.length-2].direction;
    const latest=directions[directions.length-1].direction;
    const moves=BAL.CMD.moves[payload.characterId]||[];
    for(let index=0;index<moves.length;index++){
      const move=moves[index];
      if(move.seq[0]!==previous||move.seq[1]!==latest)continue;
      const triggerMatches=trigger==='grab'
        ?move.type==='grab'
        :(move.type==='atk'||move.type==='stance')&&move.trigger===trigger;
      if(!triggerMatches)continue;
      return{kind:'command',commandId:payload.characterId+':slot-'+(index+1),slot:index+1,name:move.name};
    }
    return fallbackDecision(trigger);
  }

  function normalizePayload(source){
    if(!source||typeof source!=='object'||Array.isArray(source))fail('payload must be an object');
    if(!Array.isArray(source.directions))fail('directions must be an array');
    if(!source.legacy||typeof source.legacy!=='object'||Array.isArray(source.legacy))fail('legacy decision must be an object');
    return{
      frame:assertFrame(source.frame),
      player:assertPlayer(source.player),
      characterId:assertCharacter(source.characterId),
      trigger:assertTrigger(source.trigger),
      directions:source.directions.map(function(entry){
        if(!entry||typeof entry!=='object'||Array.isArray(entry))fail('direction entry must be an object');
        return{direction:assertDirection(entry.direction),frame:assertFrame(entry.frame)};
      }),
      legacy:clone(source.legacy)
    };
  }

  const api={
    version:VERSION,
    get enabled(){return requestedEnabled&&disabledReason===null;},
    get requestedEnabled(){return requestedEnabled;},
    get disabledReason(){return disabledReason;},
    observeTrigger:function(source){
      if(!api.enabled)return{accepted:false,reason:'disabled'};
      const payload=normalizePayload(source);
      const core=coreDecision(payload);
      const observation={
        frame:payload.frame,
        player:payload.player,
        characterId:payload.characterId,
        trigger:payload.trigger,
        legacy:payload.legacy,
        core:core,
        matches:stableStringify(payload.legacy)===stableStringify(core)
      };
      observations=observations.concat([observation]).slice(-MAX_OBSERVATIONS);
      return{accepted:true,observation:clone(observation)};
    },
    reset:function(){observations=[];disabledReason=null;},
    disable:function(error){
      disabledReason=error instanceof Error?error.message:String(error||'disabled');
    },
    snapshot:function(){
      return clone({
        version:VERSION,
        requestedEnabled:requestedEnabled,
        enabled:api.enabled,
        disabledReason:disabledReason,
        observations:observations
      });
    },
    hash:function(){return fnv1a32(stableStringify({version:VERSION,observations:observations}));},
    mismatchCount:function(){return observations.reduce(function(total,item){return total+(item.matches?0:1);},0);}
  };

  Object.defineProperty(root,'__MAMOKEN_COMMAND_SHADOW__',{value:api,writable:false,configurable:true});
})(typeof window!=='undefined'?window:globalThis);
