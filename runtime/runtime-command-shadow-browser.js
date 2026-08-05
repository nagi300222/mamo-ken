(function installRuntimeCommandShadow(root){
  'use strict';

  const VERSION='runtime-command-shadow-browser-v4';
  const REPORT_VERSION='mamoken-command-shadow-report-v2';
  const MAX_OBSERVATIONS=256;
  const MAX_CANARY_EVENTS=256;
  const CURRENT_CHARACTERS=['moguzo','pisuke','godan'];
  const CURRENT_LEVELS=['high','mid','low'];
  const CURRENT_CHARACTER_SET=new Set(CURRENT_CHARACTERS);
  const CURRENT_LEVEL_SET=new Set(CURRENT_LEVELS);
  const search=(root.location&&root.location.search)||'';
  const requestedShadow=/(?:^|[?&])mamokenShadow=1(?:&|$)/.test(search);
  const requestedCanary=/(?:^|[?&])mamokenCoreCommand=1(?:&|$)/.test(search);
  const requestedEnabled=requestedShadow||requestedCanary;
  let disabledReason=null;
  let observations=[];
  let canaryEvents=[];
  let canaryAttemptSeq=0;

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
  function assertCharacter(value){if(!CURRENT_CHARACTER_SET.has(value))fail('characterId must be a current character');return value;}
  function assertTrigger(value){if(value!=='grab'&&!CURRENT_LEVEL_SET.has(value))fail('trigger must be high, mid, low, or grab');return value;}
  function assertDirection(value){if(value!=='left'&&value!=='down'&&value!=='right')fail('direction must be left, down, or right');return value;}
  function assertAttemptId(value){if(!Number.isInteger(value)||value<1)fail('attemptId must be a positive integer');return value;}
  function assertRollbackReason(value){if(typeof value!=='string'||!/^[a-z0-9-]{1,64}$/.test(value))fail('rollback reason must be a stable lowercase code');return value;}

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

  function normalizeDecisionPayload(source){
    if(!source||typeof source!=='object'||Array.isArray(source))fail('payload must be an object');
    if(!Array.isArray(source.directions))fail('directions must be an array');
    return{
      frame:assertFrame(source.frame),
      player:assertPlayer(source.player),
      characterId:assertCharacter(source.characterId),
      trigger:assertTrigger(source.trigger),
      directions:source.directions.map(function(entry){
        if(!entry||typeof entry!=='object'||Array.isArray(entry))fail('direction entry must be an object');
        return{direction:assertDirection(entry.direction),frame:assertFrame(entry.frame)};
      })
    };
  }

  function normalizePayload(source){
    const payload=normalizeDecisionPayload(source);
    if(!source.legacy||typeof source.legacy!=='object'||Array.isArray(source.legacy))fail('legacy decision must be an object');
    return{
      frame:payload.frame,
      player:payload.player,
      characterId:payload.characterId,
      trigger:payload.trigger,
      directions:payload.directions,
      legacy:clone(source.legacy)
    };
  }

  function counter(){return{observations:0,mismatches:0};}
  function addCount(bucket,key,item){
    bucket[key].observations++;
    if(!item.matches)bucket[key].mismatches++;
  }
  function observationHash(){return fnv1a32(stableStringify({version:VERSION,observations:observations}));}
  function buildSummary(){
    const byPlayer={'0':counter(),'1':counter()};
    const byCharacter={moguzo:counter(),pisuke:counter(),godan:counter()};
    const byTrigger={high:counter(),mid:counter(),low:counter(),grab:counter()};
    let mismatches=0;
    for(const item of observations){
      if(!item.matches)mismatches++;
      addCount(byPlayer,String(item.player),item);
      addCount(byCharacter,item.characterId,item);
      addCount(byTrigger,item.trigger,item);
    }
    return{
      observationCount:observations.length,
      mismatchCount:mismatches,
      observationHash:observationHash(),
      firstFrame:observations.length?observations[0].frame:null,
      lastFrame:observations.length?observations[observations.length-1].frame:null,
      byPlayer:byPlayer,
      byCharacter:byCharacter,
      byTrigger:byTrigger
    };
  }

  function canaryCounter(){return{attempts:0,commands:0,fallbacks:0,rollbacks:0,pending:0};}
  function addCanaryCount(bucket,key,event){
    const target=bucket[key];
    target.attempts++;
    if(event.outcome==='command')target.commands++;
    else if(event.outcome==='fallback')target.fallbacks++;
    else if(event.outcome==='rollback')target.rollbacks++;
    else target.pending++;
  }
  function canaryEventHash(){return fnv1a32(stableStringify({version:VERSION,events:canaryEvents}));}
  function buildCanarySummary(){
    const byPlayer={'0':canaryCounter(),'1':canaryCounter()};
    const byCharacter={moguzo:canaryCounter(),pisuke:canaryCounter(),godan:canaryCounter()};
    const byTrigger={high:canaryCounter(),mid:canaryCounter(),low:canaryCounter(),grab:canaryCounter()};
    const reasonCounts={};
    let commandCount=0,fallbackCount=0,rollbackCount=0,pendingCount=0;
    for(const event of canaryEvents){
      if(event.outcome==='command')commandCount++;
      else if(event.outcome==='fallback')fallbackCount++;
      else if(event.outcome==='rollback'){
        rollbackCount++;
        reasonCounts[event.reason]=(reasonCounts[event.reason]||0)+1;
      }else pendingCount++;
      addCanaryCount(byPlayer,String(event.player),event);
      addCanaryCount(byCharacter,event.characterId,event);
      addCanaryCount(byTrigger,event.trigger,event);
    }
    const rollbackReasons={};
    for(const reason of Object.keys(reasonCounts).sort())rollbackReasons[reason]=reasonCounts[reason];
    return{
      attemptCount:canaryEvents.length,
      commandCount:commandCount,
      fallbackCount:fallbackCount,
      rollbackCount:rollbackCount,
      pendingCount:pendingCount,
      eventHash:canaryEventHash(),
      firstFrame:canaryEvents.length?canaryEvents[0].frame:null,
      lastFrame:canaryEvents.length?canaryEvents[canaryEvents.length-1].frame:null,
      byPlayer:byPlayer,
      byCharacter:byCharacter,
      byTrigger:byTrigger,
      rollbackReasons:rollbackReasons
    };
  }
  function appendCanaryEvent(event){
    canaryEvents=canaryEvents.concat([event]).slice(-MAX_CANARY_EVENTS);
    return event;
  }
  function findCanaryEvent(attemptId){
    for(let index=canaryEvents.length-1;index>=0;index--){
      if(canaryEvents[index].attemptId===attemptId)return canaryEvents[index];
    }
    return null;
  }
  function createCanaryEvent(payload,decision){
    const event={
      attemptId:++canaryAttemptSeq,
      frame:payload.frame,
      player:payload.player,
      characterId:payload.characterId,
      trigger:payload.trigger,
      decision:decision?clone(decision):null,
      outcome:'pending',
      reason:null
    };
    return appendCanaryEvent(event);
  }

  function buildReport(){
    return{
      reportVersion:REPORT_VERSION,
      observerVersion:VERSION,
      requestedEnabled:requestedEnabled,
      requestedShadow:requestedShadow,
      requestedCanary:requestedCanary,
      enabled:api.enabled,
      disabledReason:disabledReason,
      summary:buildSummary(),
      observations:clone(observations),
      canary:{
        requested:requestedCanary,
        enabled:api.canaryEnabled,
        disabledReason:disabledReason,
        summary:buildCanarySummary(),
        events:clone(canaryEvents)
      }
    };
  }

  const api={
    version:VERSION,
    reportVersion:REPORT_VERSION,
    get enabled(){return requestedEnabled&&disabledReason===null;},
    get requestedEnabled(){return requestedEnabled;},
    get requestedShadow(){return requestedShadow;},
    get requestedCanary(){return requestedCanary;},
    get canaryEnabled(){return requestedCanary&&disabledReason===null;},
    get disabledReason(){return disabledReason;},
    resolveTrigger:function(source){
      if(!api.canaryEnabled)return{accepted:false,reason:'disabled'};
      const payload=normalizeDecisionPayload(source);
      const decision=coreDecision(payload);
      const event=createCanaryEvent(payload,decision);
      return{accepted:true,attemptId:event.attemptId,decision:clone(decision)};
    },
    completeCanaryAttempt:function(attemptId,outcome){
      const id=assertAttemptId(attemptId);
      if(outcome!=='command'&&outcome!=='fallback')fail('canary outcome must be command or fallback');
      const event=findCanaryEvent(id);
      if(!event)fail('canary attempt is outside the audit ring or unknown');
      if(event.outcome!=='pending')fail('canary attempt is already completed');
      const expected=event.decision&&event.decision.kind==='command'?'command':'fallback';
      if(outcome!==expected)fail('canary outcome does not match the resolved decision');
      event.outcome=outcome;
      return clone(event);
    },
    failCanaryAttempt:function(attemptId,source,reason,error){
      const payload=normalizeDecisionPayload(source);
      const stableReason=assertRollbackReason(reason);
      let event=null;
      if(attemptId!==null&&attemptId!==undefined){
        event=findCanaryEvent(assertAttemptId(attemptId));
        if(event&&event.outcome!=='pending')fail('canary attempt is already completed');
      }
      if(!event)event=createCanaryEvent(payload,null);
      event.outcome='rollback';
      event.reason=stableReason;
      disabledReason=error instanceof Error?error.message:String(error||stableReason);
      return clone(event);
    },
    canaryStatus:function(){
      return clone({
        requested:requestedCanary,
        enabled:api.canaryEnabled,
        disabledReason:disabledReason,
        summary:buildCanarySummary()
      });
    },
    canaryAudit:function(){
      return clone({summary:buildCanarySummary(),events:canaryEvents});
    },
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
    reset:function(){
      observations=[];
      canaryEvents=[];
      canaryAttemptSeq=0;
      disabledReason=null;
    },
    disable:function(error){
      disabledReason=error instanceof Error?error.message:String(error||'disabled');
    },
    snapshot:function(){
      return clone({
        version:VERSION,
        requestedEnabled:requestedEnabled,
        requestedShadow:requestedShadow,
        requestedCanary:requestedCanary,
        canaryEnabled:api.canaryEnabled,
        enabled:api.enabled,
        disabledReason:disabledReason,
        observations:observations,
        canaryEvents:canaryEvents
      });
    },
    summary:function(){return clone(buildSummary());},
    report:function(){return clone(buildReport());},
    exportReport:function(){return JSON.stringify(buildReport(),null,2)+'\n';},
    hash:function(){return observationHash();},
    canaryHash:function(){return canaryEventHash();},
    mismatchCount:function(){return buildSummary().mismatchCount;}
  };

  Object.defineProperty(root,'__MAMOKEN_COMMAND_SHADOW__',{value:api,writable:false,configurable:true});
})(typeof window!=='undefined'?window:globalThis);
