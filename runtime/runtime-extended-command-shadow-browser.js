(function installRuntimeExtendedCommandShadow(root){
  'use strict';

  const VERSION='runtime-extended-command-shadow-browser-v2';
  const REPORT_VERSION='mamoken-extended-command-shadow-report-v2';
  const MAX_OBSERVATIONS=256;
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
  function assertTrigger(value){if(value!=='grab'&&!CURRENT_LEVEL_SET.has(value))fail('trigger must be high, mid, low, or grab');return value;}
  function assertDirection(value){if(value!=='left'&&value!=='down'&&value!=='right')fail('direction must be left, down, or right');return value;}

  function browserCatalog(){
    const data=root.__MAMOKEN_CHARACTER_CATALOG__;
    if(!data||!data.commandContract)fail('browser command contract is unavailable');
    return data;
  }
  function contract(){
    const value=browserCatalog().commandContract;
    if(!value.hash||!Array.isArray(value.definitions)||!Array.isArray(value.overlaps))fail('browser command contract is incomplete');
    if(value.priorityPolicy!=='longest-command-first')fail('unsupported command priority policy');
    if(!value.timingProfiles||!value.timingProfiles.current||!value.timingProfiles.target)fail('browser timing profiles are unavailable');
    return value;
  }
  function characterSet(){return new Set(contract().definitions.map(function(definition){return definition.characterId;}));}
  function assertCharacter(value){if(!characterSet().has(value))fail('characterId must be a current character');return value;}
  function definitionsFor(characterId,source){
    return contract().definitions.filter(function(definition){
      return definition.characterId===characterId&&(!source||definition.source===source);
    });
  }
  function fallbackDecision(trigger){
    return trigger==='grab'
      ?{kind:'fallback',fallback:'normal-grab'}
      :{kind:'fallback',fallback:'normal-attack',level:trigger};
  }
  function commandDecision(definition){
    return{
      kind:'command',
      commandId:definition.id,
      slot:definition.slot,
      name:definition.name,
      source:definition.source
    };
  }
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
    const activeConditions=source.activeConditions==null?[]:source.activeConditions;
    if(!Array.isArray(activeConditions)||activeConditions.some(function(value){return typeof value!=='string'||!value;}))fail('activeConditions must be an array of strings');
    return{
      frame:frame,
      player:assertPlayer(source.player),
      characterId:assertCharacter(source.characterId),
      trigger:assertTrigger(source.trigger),
      directions:directions,
      activeConditions:Array.from(new Set(activeConditions)).sort()
    };
  }
  function timingMatches(sequence,matched,triggerFrame,profile){
    if(matched.length!==sequence.length||matched.length===0)return false;
    if(triggerFrame-matched[0].frame>profile.directionHistoryF)return false;
    if(profile.finalButtonGraceF!=null&&triggerFrame-matched[matched.length-1].frame>profile.finalButtonGraceF)return false;
    if(profile.directionGapMaxF!=null){
      for(let index=1;index<matched.length;index++)if(matched[index].frame-matched[index-1].frame>profile.directionGapMaxF)return false;
    }
    const total=matched[matched.length-1].frame-matched[0].frame;
    if(matched.length===3&&profile.commandTotal3F!=null&&total>profile.commandTotal3F)return false;
    if(matched.length===4&&profile.commandTotal4F!=null&&total>profile.commandTotal4F)return false;
    return true;
  }
  function matchingDefinitions(payload,definitions,profile){
    const eligible=payload.directions.filter(function(entry){return entry.frame<=payload.frame&&payload.frame-entry.frame<=profile.directionHistoryF;});
    const candidates=[];
    for(const definition of definitions){
      if(definition.trigger!==payload.trigger)continue;
      if(definition.conditionId&&!payload.activeConditions.includes(definition.conditionId))continue;
      const sequence=definition.directions;
      if(!suffixMatches(eligible,sequence))continue;
      const matched=eligible.slice(-sequence.length);
      if(!timingMatches(sequence,matched,payload.frame,profile))continue;
      candidates.push(definition);
    }
    candidates.sort(function(left,right){
      return right.directions.length-left.directions.length
        ||right.specificity-left.specificity
        ||left.definitionOrder-right.definitionOrder;
    });
    return candidates;
  }
  function runtimeDecision(payload){
    const profile=contract().timingProfiles.current;
    const candidates=matchingDefinitions(payload,definitionsFor(payload.characterId,'current_impl'),profile);
    return candidates[0]?commandDecision(candidates[0]):fallbackDecision(payload.trigger);
  }
  function catalogDecision(payload){
    const profile=contract().timingProfiles.target;
    const candidates=matchingDefinitions(payload,definitionsFor(payload.characterId),profile);
    return candidates[0]?commandDecision(candidates[0]):fallbackDecision(payload.trigger);
  }
  function classification(runtime,candidate){
    if(runtime.kind==='fallback'&&candidate.kind==='fallback')return'fallback-parity';
    if(runtime.kind==='command'&&candidate.kind==='command'){
      if(runtime.commandId===candidate.commandId)return'current-parity';
      if(candidate.source==='design_confirmed')return'longer-design-overrides-current';
      return'different-current';
    }
    if(runtime.kind==='fallback'&&candidate.kind==='command'){
      return candidate.source==='design_confirmed'?'design-only-candidate':'catalog-current-only';
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
      activeConditions:payload.activeConditions,
      runtime:runtime,
      catalog:candidate,
      classification:classification(runtime,candidate)
    };
  }
  function overlapKinds(){
    const counts={
      'current_impl->design_confirmed':0,
      'design_confirmed->design_confirmed':0,
      other:0
    };
    for(const overlap of contract().overlaps){
      const key=overlap.shorterSource+'->'+overlap.longerSource;
      if(Object.prototype.hasOwnProperty.call(counts,key))counts[key]++;
      else counts.other++;
    }
    return counts;
  }
  function observationHash(){return fnv1a32(stableStringify({version:VERSION,contractHash:contract().hash,observations:observations}));}
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
    const byCharacter={};
    for(const characterId of characterSet())byCharacter[characterId]=emptyCounter();
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
      byTrigger:byTrigger,
      declaredOverlapCount:contract().overlaps.length,
      declaredOverlapKinds:overlapKinds()
    };
  }
  function contractSnapshot(){
    const value=contract();
    return{
      version:value.version,
      hash:value.hash,
      priorityPolicy:value.priorityPolicy,
      timingProfiles:{current:value.timingProfiles.current,target:value.timingProfiles.target},
      definitionCount:value.definitions.length,
      overlaps:value.overlaps
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
      commandContract:contractSnapshot(),
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
    contract:function(){return clone(contractSnapshot());},
    summary:function(){return clone(buildSummary());},
    report:function(){return clone(buildReport());},
    exportReport:function(){return JSON.stringify(buildReport(),null,2)+'\n';},
    snapshot:function(){return clone({version:VERSION,requestedEnabled:requestedEnabled,enabled:api.enabled,disabledReason:disabledReason,contractHash:contract().hash,observations:observations});},
    hash:function(){return observationHash();},
    conflictCount:function(){return buildSummary().conflictCount;}
  };

  Object.defineProperty(root,'__MAMOKEN_EXTENDED_COMMAND_SHADOW__',{value:api,writable:false,configurable:true});
})(typeof window!=='undefined'?window:globalThis);
