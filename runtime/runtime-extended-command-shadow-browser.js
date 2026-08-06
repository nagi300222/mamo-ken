(function installRuntimeExtendedCommandShadow(root){
  'use strict';

  const VERSION='runtime-extended-command-shadow-browser-v1';
  const REPORT_VERSION='mamoken-extended-command-shadow-report-v1';
  const MAX_OBSERVATIONS=256;
  const CURRENT_CHARACTERS=['moguzo','pisuke','godan'];
  const CURRENT_CHARACTER_SET=new Set(CURRENT_CHARACTERS);
  const CURRENT_LEVEL_SET=new Set(['high','mid','low']);
  const search=(root.location&&root.location.search)||'';
  const requestedEnabled=/(?:^|[?&])mamokenExtendedShadow=1(?:&|$)/.test(search);
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
    for(let index=0;index<text.length;index++){
      hash^=text.charCodeAt(index);
      hash=Math.imul(hash,0x01000193)>>>0;
    }
    return hash.toString(16).padStart(8,'0');
  }
  function clone(value){return JSON.parse(JSON.stringify(value));}
  function fail(message){throw new TypeError(message);}
  function assertFrame(value){if(!Number.isInteger(value)||value<0)fail('frame must be a non-negative integer');return value;}
  function assertPlayer(value){if(value!==0&&value!==1)fail('player must be 0 or 1');return value;}
  function assertCharacter(value){if(!CURRENT_CHARACTER_SET.has(value))fail('characterId must be a current character');return value;}
  function assertTrigger(value){if(value!=='grab'&&!CURRENT_LEVEL_SET.has(value))fail('trigger must be high, mid, low, or grab');return value;}
  function assertDirection(value){if(value!=='left'&&value!=='down'&&value!=='right')fail('direction must be left, down, or right');return value;}

  function catalog(){
    const data=root.__MAMOKEN_CHARACTER_CATALOG__;
    if(!data||!data.byId)fail('character catalog browser API is unavailable');
    return data;
  }
  function characterCatalog(characterId){
    const character=catalog().byId[characterId];
    if(!character||!Array.isArray(character.moves)||character.moves.length!==7)fail('current character catalog must contain seven moves');
    return character;
  }
  function fallbackDecision(trigger){
    return trigger==='grab'
      ?{kind:'fallback',fallback:'normal-grab'}
      :{kind:'fallback',fallback:'normal-attack',level:trigger};
  }
  function commandDecision(characterId,move){
    return{
      kind:'command',
      commandId:characterId+':slot-'+move.slot,
      slot:move.slot,
      name:move.nameJa,
      implementationStatus:move.implementationStatus
    };
  }
  function triggerMatches(move,trigger){return move.command&&move.command.trigger===trigger;}
  function suffixMatches(directions,sequence){
    if(directions.length<sequence.length)return false;
    const offset=directions.length-sequence.length;
    for(let index=0;index<sequence.length;index++)if(directions[offset+index].direction!==sequence[index])return false;
    return true;
  }
  function normalizePayload(source){
    if(!source||typeof source!=='object'||Array.isArray(source))fail('payload must be an object');
    if(!Array.isArray(source.directions))fail('directions must be an array');
    const frame=assertFrame(source.frame);
    const directions=source.directions.map(function(entry){
      if(!entry||typeof entry!=='object'||Array.isArray(entry))fail('direction entry must be an object');
      return{direction:assertDirection(entry.direction),frame:assertFrame(entry.frame)};
    });
    for(let index=1;index<directions.length;index++)if(directions[index].frame<directions[index-1].frame)fail('directions must be frame ordered');
    return{
      frame:frame,
      player:assertPlayer(source.player),
      characterId:assertCharacter(source.characterId),
      trigger:assertTrigger(source.trigger),
      directions:directions
    };
  }

  function runtimeDecision(payload){
    const moves=characterCatalog(payload.characterId).moves.filter(function(move){return move.implementationStatus==='current_runtime';});
    const eligible=payload.directions.filter(function(entry){return entry.frame<=payload.frame&&payload.frame-entry.frame<=24;});
    if(eligible.length<2)return fallbackDecision(payload.trigger);
    const latest=eligible.slice(-2);
    for(const move of moves){
      if(!triggerMatches(move,payload.trigger)||move.command.directions.length!==2)continue;
      if(suffixMatches(latest,move.command.directions))return commandDecision(payload.characterId,move);
    }
    return fallbackDecision(payload.trigger);
  }

  function targetTimingMatches(sequence,matched,triggerFrame){
    if(matched.length!==sequence.length||matched.length===0)return false;
    if(triggerFrame-matched[0].frame>38)return false;
    if(triggerFrame-matched[matched.length-1].frame>10)return false;
    for(let index=1;index<matched.length;index++)if(matched[index].frame-matched[index-1].frame>18)return false;
    const total=matched[matched.length-1].frame-matched[0].frame;
    if(matched.length===3&&total>28)return false;
    if(matched.length===4&&total>38)return false;
    return true;
  }
  function catalogDecision(payload){
    const moves=characterCatalog(payload.characterId).moves;
    const eligible=payload.directions.filter(function(entry){return entry.frame<=payload.frame&&payload.frame-entry.frame<=38;});
    const candidates=[];
    for(const move of moves){
      if(!triggerMatches(move,payload.trigger))continue;
      const sequence=move.command.directions;
      if(!suffixMatches(eligible,sequence))continue;
      const matched=eligible.slice(-sequence.length);
      if(!targetTimingMatches(sequence,matched,payload.frame))continue;
      candidates.push(move);
    }
    candidates.sort(function(a,b){return b.command.directions.length-a.command.directions.length||a.slot-b.slot;});
    return candidates[0]?commandDecision(payload.characterId,candidates[0]):fallbackDecision(payload.trigger);
  }
  function classification(runtime,candidate){
    if(runtime.kind==='fallback'&&candidate.kind==='fallback')return'fallback-parity';
    if(runtime.kind==='command'&&candidate.kind==='command'){
      if(runtime.commandId===candidate.commandId)return'current-parity';
      if(candidate.implementationStatus==='design_confirmed')return'longer-design-overrides-current';
      return'different-current';
    }
    if(runtime.kind==='fallback'&&candidate.kind==='command'){
      return candidate.implementationStatus==='design_confirmed'?'design-only-candidate':'catalog-current-only';
    }
    return'runtime-only';
  }
  function resolve(source){
    const payload=normalizePayload(source);
    const runtime=runtimeDecision(payload);
    const candidate=catalogDecision(payload);
    return{
      frame:payload.frame,
      player:payload.player,
      characterId:payload.characterId,
      trigger:payload.trigger,
      runtime:runtime,
      catalog:candidate,
      classification:classification(runtime,candidate)
    };
  }
  function observationHash(){return fnv1a32(stableStringify({version:VERSION,observations:observations}));}
  function emptyCounter(){return{observations:0,conflicts:0};}
  function buildSummary(){
    const classifications={
      'current-parity':0,
      'design-only-candidate':0,
      'longer-design-overrides-current':0,
      'runtime-only':0,
      'catalog-current-only':0,
      'different-current':0,
      'fallback-parity':0
    };
    const byCharacter={moguzo:emptyCounter(),pisuke:emptyCounter(),godan:emptyCounter()};
    const byTrigger={high:emptyCounter(),mid:emptyCounter(),low:emptyCounter(),grab:emptyCounter()};
    let conflictCount=0;
    for(const item of observations){
      classifications[item.classification]++;
      const conflict=item.classification==='longer-design-overrides-current'||item.classification==='runtime-only'||item.classification==='catalog-current-only'||item.classification==='different-current';
      byCharacter[item.characterId].observations++;
      byTrigger[item.trigger].observations++;
      if(conflict){
        conflictCount++;
        byCharacter[item.characterId].conflicts++;
        byTrigger[item.trigger].conflicts++;
      }
    }
    return{
      observationCount:observations.length,
      conflictCount:conflictCount,
      observationHash:observationHash(),
      classifications:classifications,
      byCharacter:byCharacter,
      byTrigger:byTrigger
    };
  }
  function buildReport(){
    return{
      reportVersion:REPORT_VERSION,
      observerVersion:VERSION,
      requestedEnabled:requestedEnabled,
      enabled:api.enabled,
      disabledReason:disabledReason,
      diagnosticOnly:true,
      authority:{runtime:'unchanged-current-9',catalog:'none'},
      timing:{runtime:'current-compat-24f',catalog:'target-provisional-38f'},
      summary:buildSummary(),
      observations:clone(observations)
    };
  }

  const api={
    version:VERSION,
    reportVersion:REPORT_VERSION,
    get enabled(){return requestedEnabled&&disabledReason===null;},
    get requestedEnabled(){return requestedEnabled;},
    get disabledReason(){return disabledReason;},
    resolveTrigger:function(source){
      if(!api.enabled)return{accepted:false,reason:'disabled'};
      return{accepted:true,decision:clone(resolve(source))};
    },
    observeTrigger:function(source){
      if(!api.enabled)return{accepted:false,reason:'disabled'};
      const observation=resolve(source);
      observations=observations.concat([observation]).slice(-MAX_OBSERVATIONS);
      return{accepted:true,observation:clone(observation)};
    },
    reset:function(){observations=[];disabledReason=null;},
    disable:function(error){disabledReason=error instanceof Error?error.message:String(error||'disabled');},
    summary:function(){return clone(buildSummary());},
    report:function(){return clone(buildReport());},
    exportReport:function(){return JSON.stringify(buildReport(),null,2)+'\n';},
    snapshot:function(){return clone({version:VERSION,requestedEnabled:requestedEnabled,enabled:api.enabled,disabledReason:disabledReason,observations:observations});},
    hash:function(){return observationHash();},
    conflictCount:function(){return buildSummary().conflictCount;}
  };

  Object.defineProperty(root,'__MAMOKEN_EXTENDED_COMMAND_SHADOW__',{value:api,writable:false,configurable:true});
})(typeof window!=='undefined'?window:globalThis);
