import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPORT_V1='mamoken-command-shadow-report-v1';
const REPORT_V2='mamoken-command-shadow-report-v2';
const REPORT_V3='mamoken-command-shadow-report-v3';
const SUPPORTED_REPORTS=new Set([REPORT_V1,REPORT_V2,REPORT_V3]);
const CURRENT_CHARACTERS=new Set(['moguzo','pisuke','godan']);
const CURRENT_TRIGGERS=new Set(['high','mid','low','grab']);
const CANARY_OUTCOMES=new Set(['command','fallback','rollback','pending']);

export function stableStringify(value){
  if(value===null||typeof value!=='object')return JSON.stringify(value);
  if(Array.isArray(value))return`[${value.map(stableStringify).join(',')}]`;
  const keys=Object.keys(value).sort();
  return`{${keys.map((key)=>`${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
}

export function fnv1a32(text){
  let hash=0x811c9dc5;
  for(let index=0;index<text.length;index++){
    hash^=text.charCodeAt(index);
    hash=Math.imul(hash,0x01000193)>>>0;
  }
  return hash.toString(16).padStart(8,'0');
}

function fail(label,message){throw new TypeError(`${label}: ${message}`);}
function isObject(value){return!!value&&typeof value==='object'&&!Array.isArray(value);}
function assertInteger(value,label,min=0){if(!Number.isInteger(value)||value<min)fail(label,`must be an integer >= ${min}`);return value;}
function assertNullableFrame(value,label){if(value===null)return null;return assertInteger(value,label);}
function assertHash(value,label){if(typeof value!=='string'||!/^[0-9a-f]{8}$/.test(value))fail(label,'must be an 8-character lowercase hex hash');return value;}
function assertNullableString(value,label){if(value!==null&&typeof value!=='string')fail(label,'must be null or string');return value;}
function assertCounter(value,label){
  if(!isObject(value))fail(label,'must be an object');
  return{
    observations:assertInteger(value.observations,`${label}.observations`),
    mismatches:assertInteger(value.mismatches,`${label}.mismatches`)
  };
}
function assertCanaryCounter(value,label){
  if(!isObject(value))fail(label,'must be an object');
  return{
    attempts:assertInteger(value.attempts,`${label}.attempts`),
    commands:assertInteger(value.commands,`${label}.commands`),
    fallbacks:assertInteger(value.fallbacks,`${label}.fallbacks`),
    rollbacks:assertInteger(value.rollbacks,`${label}.rollbacks`),
    pending:assertInteger(value.pending,`${label}.pending`)
  };
}
function normalizeDecision(value,label){if(!isObject(value))fail(label,'must be an object');return JSON.parse(JSON.stringify(value));}
function normalizeCharacterTriggerPlayer(value,label){
  const characterId=value.characterId;
  const trigger=value.trigger;
  if(!CURRENT_CHARACTERS.has(characterId))fail(`${label}.characterId`,'must be a current character');
  if(!CURRENT_TRIGGERS.has(trigger))fail(`${label}.trigger`,'must be high, mid, low, or grab');
  if(value.player!==0&&value.player!==1)fail(`${label}.player`,'must be 0 or 1');
  return{characterId,trigger,player:value.player};
}
function normalizeObservation(value,label){
  if(!isObject(value))fail(label,'must be an object');
  const identity=normalizeCharacterTriggerPlayer(value,label);
  if(typeof value.matches!=='boolean')fail(`${label}.matches`,'must be boolean');
  return{
    frame:assertInteger(value.frame,`${label}.frame`),
    player:identity.player,
    characterId:identity.characterId,
    trigger:identity.trigger,
    legacy:normalizeDecision(value.legacy,`${label}.legacy`),
    core:normalizeDecision(value.core,`${label}.core`),
    matches:value.matches
  };
}
function normalizeCanaryEvent(value,label){
  if(!isObject(value))fail(label,'must be an object');
  const identity=normalizeCharacterTriggerPlayer(value,label);
  const outcome=value.outcome;
  if(!CANARY_OUTCOMES.has(outcome))fail(`${label}.outcome`,'must be command, fallback, rollback, or pending');
  const decision=value.decision===null?null:normalizeDecision(value.decision,`${label}.decision`);
  const reason=value.reason;
  if(outcome==='rollback'){
    if(typeof reason!=='string'||!/^[a-z0-9-]{1,64}$/.test(reason))fail(`${label}.reason`,'must be a stable lowercase rollback code');
  }else if(reason!==null){
    fail(`${label}.reason`,'must be null unless outcome is rollback');
  }
  if(outcome==='command'&&(!decision||decision.kind!=='command'))fail(`${label}.decision`,'must be a command decision for command outcome');
  if(outcome==='fallback'&&(!decision||decision.kind!=='fallback'))fail(`${label}.decision`,'must be a fallback decision for fallback outcome');
  if(outcome==='pending'&&!decision)fail(`${label}.decision`,'must exist for pending outcome');
  return{
    attemptId:assertInteger(value.attemptId,`${label}.attemptId`,1),
    frame:assertInteger(value.frame,`${label}.frame`),
    player:identity.player,
    characterId:identity.characterId,
    trigger:identity.trigger,
    decision,
    outcome,
    reason
  };
}

function counter(){return{observations:0,mismatches:0};}
function addCount(bucket,key,item){
  bucket[key].observations++;
  if(!item.matches)bucket[key].mismatches++;
}
function expectedSummary(observerVersion,observations){
  const byPlayer={'0':counter(),'1':counter()};
  const byCharacter={moguzo:counter(),pisuke:counter(),godan:counter()};
  const byTrigger={high:counter(),mid:counter(),low:counter(),grab:counter()};
  let mismatchCount=0;
  for(const item of observations){
    if(!item.matches)mismatchCount++;
    addCount(byPlayer,String(item.player),item);
    addCount(byCharacter,item.characterId,item);
    addCount(byTrigger,item.trigger,item);
  }
  return{
    observationCount:observations.length,
    mismatchCount,
    observationHash:fnv1a32(stableStringify({version:observerVersion,observations})),
    firstFrame:observations.length?observations[0].frame:null,
    lastFrame:observations.length?observations.at(-1).frame:null,
    byPlayer,
    byCharacter,
    byTrigger
  };
}
function assertSummaryMatch(actual,expected,label){
  for(const key of ['observationCount','mismatchCount','observationHash','firstFrame','lastFrame']){
    if(actual[key]!==expected[key])fail(`${label}.${key}`,'does not match observations');
  }
  for(const key of ['byPlayer','byCharacter','byTrigger']){
    if(stableStringify(actual[key])!==stableStringify(expected[key]))fail(`${label}.${key}`,'does not match observations');
  }
}
function canaryCounter(){return{attempts:0,commands:0,fallbacks:0,rollbacks:0,pending:0};}
function addCanaryCount(bucket,key,event){
  bucket[key].attempts++;
  if(event.outcome==='command')bucket[key].commands++;
  else if(event.outcome==='fallback')bucket[key].fallbacks++;
  else if(event.outcome==='rollback')bucket[key].rollbacks++;
  else bucket[key].pending++;
}
function expectedCanarySummary(observerVersion,events){
  const byPlayer={'0':canaryCounter(),'1':canaryCounter()};
  const byCharacter={moguzo:canaryCounter(),pisuke:canaryCounter(),godan:canaryCounter()};
  const byTrigger={high:canaryCounter(),mid:canaryCounter(),low:canaryCounter(),grab:canaryCounter()};
  const reasonCounts={};
  let commandCount=0,fallbackCount=0,rollbackCount=0,pendingCount=0;
  for(const event of events){
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
    attemptCount:events.length,
    commandCount,
    fallbackCount,
    rollbackCount,
    pendingCount,
    eventHash:fnv1a32(stableStringify({version:observerVersion,events})),
    firstFrame:events.length?events[0].frame:null,
    lastFrame:events.length?events.at(-1).frame:null,
    byPlayer,
    byCharacter,
    byTrigger,
    rollbackReasons
  };
}
function assertCanarySummaryMatch(actual,expected,label){
  for(const key of ['attemptCount','commandCount','fallbackCount','rollbackCount','pendingCount','eventHash','firstFrame','lastFrame']){
    if(actual[key]!==expected[key])fail(`${label}.${key}`,'does not match canary events');
  }
  for(const key of ['byPlayer','byCharacter','byTrigger','rollbackReasons']){
    if(stableStringify(actual[key])!==stableStringify(expected[key]))fail(`${label}.${key}`,'does not match canary events');
  }
}

function normalizeObservationSection(source,label,observerVersion){
  if(!Array.isArray(source.observations))fail(`${label}.observations`,'must be an array');
  if(source.observations.length>256)fail(`${label}.observations`,'must not exceed the 256-entry ring');
  const observations=source.observations.map((item,index)=>normalizeObservation(item,`${label}.observations[${index}]`));
  if(!isObject(source.summary))fail(`${label}.summary`,'must be an object');
  const summary={
    observationCount:assertInteger(source.summary.observationCount,`${label}.summary.observationCount`),
    mismatchCount:assertInteger(source.summary.mismatchCount,`${label}.summary.mismatchCount`),
    observationHash:assertHash(source.summary.observationHash,`${label}.summary.observationHash`),
    firstFrame:assertNullableFrame(source.summary.firstFrame,`${label}.summary.firstFrame`),
    lastFrame:assertNullableFrame(source.summary.lastFrame,`${label}.summary.lastFrame`),
    byPlayer:{
      '0':assertCounter(source.summary.byPlayer&&source.summary.byPlayer['0'],`${label}.summary.byPlayer.0`),
      '1':assertCounter(source.summary.byPlayer&&source.summary.byPlayer['1'],`${label}.summary.byPlayer.1`)
    },
    byCharacter:{
      moguzo:assertCounter(source.summary.byCharacter&&source.summary.byCharacter.moguzo,`${label}.summary.byCharacter.moguzo`),
      pisuke:assertCounter(source.summary.byCharacter&&source.summary.byCharacter.pisuke,`${label}.summary.byCharacter.pisuke`),
      godan:assertCounter(source.summary.byCharacter&&source.summary.byCharacter.godan,`${label}.summary.byCharacter.godan`)
    },
    byTrigger:{
      high:assertCounter(source.summary.byTrigger&&source.summary.byTrigger.high,`${label}.summary.byTrigger.high`),
      mid:assertCounter(source.summary.byTrigger&&source.summary.byTrigger.mid,`${label}.summary.byTrigger.mid`),
      low:assertCounter(source.summary.byTrigger&&source.summary.byTrigger.low,`${label}.summary.byTrigger.low`),
      grab:assertCounter(source.summary.byTrigger&&source.summary.byTrigger.grab,`${label}.summary.byTrigger.grab`)
    }
  };
  assertSummaryMatch(summary,expectedSummary(observerVersion,observations),`${label}.summary`);
  return{summary,observations};
}
function normalizeCanarySection(source,label,observerVersion,topLevel){
  if(!isObject(source))fail(label,'must be an object');
  if(typeof source.requested!=='boolean')fail(`${label}.requested`,'must be boolean');
  if(typeof source.enabled!=='boolean')fail(`${label}.enabled`,'must be boolean');
  const disabledReason=assertNullableString(source.disabledReason,`${label}.disabledReason`);
  if(source.requested!==topLevel.requestedCanary)fail(`${label}.requested`,'must match requestedCanary');
  let defaultEnabled=false,legacyOverride=false;
  if(topLevel.reportVersion===REPORT_V3){
    if(source.defaultEnabled!==true)fail(`${label}.defaultEnabled`,'must be true');
    if(typeof source.legacyOverride!=='boolean')fail(`${label}.legacyOverride`,'must be boolean');
    if(source.legacyOverride!==topLevel.requestedLegacy)fail(`${label}.legacyOverride`,'must match requestedLegacy');
    defaultEnabled=true;
    legacyOverride=source.legacyOverride;
    if(source.enabled!==(!legacyOverride&&disabledReason===null))fail(`${label}.enabled`,'does not match default/override/disabled state');
  }else if(source.enabled!==(source.requested&&disabledReason===null)){
    fail(`${label}.enabled`,'does not match requested/disabled state');
  }
  if(disabledReason!==topLevel.disabledReason)fail(`${label}.disabledReason`,'must match top-level disabledReason');
  if(!Array.isArray(source.events))fail(`${label}.events`,'must be an array');
  if(source.events.length>256)fail(`${label}.events`,'must not exceed the 256-entry ring');
  const events=source.events.map((item,index)=>normalizeCanaryEvent(item,`${label}.events[${index}]`));
  for(let index=1;index<events.length;index++){
    if(events[index].attemptId<=events[index-1].attemptId)fail(`${label}.events[${index}].attemptId`,'must be strictly increasing');
  }
  if(!isObject(source.summary))fail(`${label}.summary`,'must be an object');
  const summary={
    attemptCount:assertInteger(source.summary.attemptCount,`${label}.summary.attemptCount`),
    commandCount:assertInteger(source.summary.commandCount,`${label}.summary.commandCount`),
    fallbackCount:assertInteger(source.summary.fallbackCount,`${label}.summary.fallbackCount`),
    rollbackCount:assertInteger(source.summary.rollbackCount,`${label}.summary.rollbackCount`),
    pendingCount:assertInteger(source.summary.pendingCount,`${label}.summary.pendingCount`),
    eventHash:assertHash(source.summary.eventHash,`${label}.summary.eventHash`),
    firstFrame:assertNullableFrame(source.summary.firstFrame,`${label}.summary.firstFrame`),
    lastFrame:assertNullableFrame(source.summary.lastFrame,`${label}.summary.lastFrame`),
    byPlayer:{
      '0':assertCanaryCounter(source.summary.byPlayer&&source.summary.byPlayer['0'],`${label}.summary.byPlayer.0`),
      '1':assertCanaryCounter(source.summary.byPlayer&&source.summary.byPlayer['1'],`${label}.summary.byPlayer.1`)
    },
    byCharacter:{
      moguzo:assertCanaryCounter(source.summary.byCharacter&&source.summary.byCharacter.moguzo,`${label}.summary.byCharacter.moguzo`),
      pisuke:assertCanaryCounter(source.summary.byCharacter&&source.summary.byCharacter.pisuke,`${label}.summary.byCharacter.pisuke`),
      godan:assertCanaryCounter(source.summary.byCharacter&&source.summary.byCharacter.godan,`${label}.summary.byCharacter.godan`)
    },
    byTrigger:{
      high:assertCanaryCounter(source.summary.byTrigger&&source.summary.byTrigger.high,`${label}.summary.byTrigger.high`),
      mid:assertCanaryCounter(source.summary.byTrigger&&source.summary.byTrigger.mid,`${label}.summary.byTrigger.mid`),
      low:assertCanaryCounter(source.summary.byTrigger&&source.summary.byTrigger.low,`${label}.summary.byTrigger.low`),
      grab:assertCanaryCounter(source.summary.byTrigger&&source.summary.byTrigger.grab,`${label}.summary.byTrigger.grab`)
    },
    rollbackReasons:isObject(source.summary.rollbackReasons)?JSON.parse(JSON.stringify(source.summary.rollbackReasons)):fail(`${label}.summary.rollbackReasons`,'must be an object')
  };
  for(const [reason,count] of Object.entries(summary.rollbackReasons)){
    if(!/^[a-z0-9-]{1,64}$/.test(reason))fail(`${label}.summary.rollbackReasons`,'contains an invalid reason code');
    assertInteger(count,`${label}.summary.rollbackReasons.${reason}`,1);
  }
  assertCanarySummaryMatch(summary,expectedCanarySummary(observerVersion,events),`${label}.summary`);
  return{requested:source.requested,defaultEnabled,legacyOverride,enabled:source.enabled,disabledReason,summary,events};
}

export function normalizeShadowReport(source,label='report'){
  if(!isObject(source))fail(label,'must be an object');
  if(!SUPPORTED_REPORTS.has(source.reportVersion))fail(`${label}.reportVersion`,`must be ${REPORT_V1}, ${REPORT_V2}, or ${REPORT_V3}`);
  if(typeof source.observerVersion!=='string'||source.observerVersion.length===0)fail(`${label}.observerVersion`,'must be a non-empty string');
  if(typeof source.requestedEnabled!=='boolean')fail(`${label}.requestedEnabled`,'must be boolean');
  if(typeof source.enabled!=='boolean')fail(`${label}.enabled`,'must be boolean');
  const disabledReason=assertNullableString(source.disabledReason,`${label}.disabledReason`);
  const observationSection=normalizeObservationSection(source,label,source.observerVersion);

  if(source.reportVersion===REPORT_V1){
    return{
      reportVersion:REPORT_V1,
      observerVersion:source.observerVersion,
      requestedEnabled:source.requestedEnabled,
      enabled:source.enabled,
      disabledReason,
      summary:observationSection.summary,
      observations:observationSection.observations,
      canary:null
    };
  }

  if(typeof source.requestedShadow!=='boolean')fail(`${label}.requestedShadow`,'must be boolean');
  if(typeof source.requestedCanary!=='boolean')fail(`${label}.requestedCanary`,'must be boolean');
  if(source.requestedEnabled!==(source.requestedShadow||source.requestedCanary))fail(`${label}.requestedEnabled`,'must match requestedShadow/requestedCanary');
  if(source.enabled!==(source.requestedEnabled&&disabledReason===null))fail(`${label}.enabled`,'does not match requested/disabled state');
  let requestedLegacy=false,authority=null;
  if(source.reportVersion===REPORT_V3){
    if(typeof source.requestedLegacy!=='boolean')fail(`${label}.requestedLegacy`,'must be boolean');
    requestedLegacy=source.requestedLegacy;
    if(!isObject(source.authority))fail(`${label}.authority`,'must be an object');
    const expectedOffline=requestedLegacy?'legacy-override':(disabledReason===null?'core-default':'legacy-rollback');
    if(source.authority.offline!==expectedOffline)fail(`${label}.authority.offline`,'does not match override/disabled state');
    if(source.authority.online!=='legacy')fail(`${label}.authority.online`,'must be legacy');
    authority={offline:source.authority.offline,online:'legacy'};
  }
  const topLevel={reportVersion:source.reportVersion,requestedCanary:source.requestedCanary,requestedLegacy,disabledReason};
  const canary=normalizeCanarySection(source.canary,`${label}.canary`,source.observerVersion,topLevel);
  return{
    reportVersion:source.reportVersion,
    observerVersion:source.observerVersion,
    requestedEnabled:source.requestedEnabled,
    requestedShadow:source.requestedShadow,
    requestedCanary:source.requestedCanary,
    requestedLegacy,
    enabled:source.enabled,
    disabledReason,
    authority,
    summary:observationSection.summary,
    observations:observationSection.observations,
    canary
  };
}

export function parseShadowReportText(text,label='report'){
  let parsed;
  try{parsed=JSON.parse(text);}catch(error){fail(label,`invalid JSON (${error.message})`);}
  return normalizeShadowReport(parsed,label);
}

function firstDifference(left,right){
  const maxLength=Math.max(left.length,right.length);
  for(let index=0;index<maxLength;index++){
    if(stableStringify(left[index])!==stableStringify(right[index]))return index;
  }
  return null;
}
function canaryMetrics(report){
  if(!report.canary)return null;
  return{
    attemptCount:report.canary.summary.attemptCount,
    commandCount:report.canary.summary.commandCount,
    fallbackCount:report.canary.summary.fallbackCount,
    rollbackCount:report.canary.summary.rollbackCount,
    pendingCount:report.canary.summary.pendingCount,
    eventHash:report.canary.summary.eventHash
  };
}

export function compareShadowReports(leftSource,rightSource){
  const left=normalizeShadowReport(leftSource,'left');
  const right=normalizeShadowReport(rightSource,'right');
  const compatible=left.reportVersion===right.reportVersion&&left.observerVersion===right.observerVersion;
  const observationsIdentical=stableStringify(left.observations)===stableStringify(right.observations);
  const leftCanary=left.canary?left.canary.events:[];
  const rightCanary=right.canary?right.canary.events:[];
  const canaryIdentical=stableStringify(leftCanary)===stableStringify(rightCanary);
  const authorityIdentical=stableStringify(left.authority)===stableStringify(right.authority);
  const identical=compatible&&observationsIdentical&&canaryIdentical&&authorityIdentical;
  const firstDifferenceIndex=firstDifference(left.observations,right.observations);
  const canaryFirstDifferenceIndex=firstDifference(leftCanary,rightCanary);
  const leftCanaryMetrics=canaryMetrics(left);
  const rightCanaryMetrics=canaryMetrics(right);
  return{
    reportVersion:compatible?left.reportVersion:null,
    compatible,
    identical,
    observationsIdentical,
    canaryIdentical,
    authorityIdentical,
    left:{
      reportVersion:left.reportVersion,
      observerVersion:left.observerVersion,
      observationCount:left.summary.observationCount,
      mismatchCount:left.summary.mismatchCount,
      observationHash:left.summary.observationHash,
      authority:left.authority,
      canary:leftCanaryMetrics
    },
    right:{
      reportVersion:right.reportVersion,
      observerVersion:right.observerVersion,
      observationCount:right.summary.observationCount,
      mismatchCount:right.summary.mismatchCount,
      observationHash:right.summary.observationHash,
      authority:right.authority,
      canary:rightCanaryMetrics
    },
    delta:{
      observationCount:right.summary.observationCount-left.summary.observationCount,
      mismatchCount:right.summary.mismatchCount-left.summary.mismatchCount,
      canaryAttemptCount:leftCanaryMetrics&&rightCanaryMetrics?rightCanaryMetrics.attemptCount-leftCanaryMetrics.attemptCount:null,
      canaryCommandCount:leftCanaryMetrics&&rightCanaryMetrics?rightCanaryMetrics.commandCount-leftCanaryMetrics.commandCount:null,
      canaryFallbackCount:leftCanaryMetrics&&rightCanaryMetrics?rightCanaryMetrics.fallbackCount-leftCanaryMetrics.fallbackCount:null,
      canaryRollbackCount:leftCanaryMetrics&&rightCanaryMetrics?rightCanaryMetrics.rollbackCount-leftCanaryMetrics.rollbackCount:null
    },
    firstDifferenceIndex,
    firstDifference:firstDifferenceIndex===null?null:{
      left:left.observations[firstDifferenceIndex]??null,
      right:right.observations[firstDifferenceIndex]??null
    },
    canaryFirstDifferenceIndex,
    canaryFirstDifference:canaryFirstDifferenceIndex===null?null:{
      left:leftCanary[canaryFirstDifferenceIndex]??null,
      right:rightCanary[canaryFirstDifferenceIndex]??null
    }
  };
}

export function readShadowReport(filePath,label=path.basename(filePath)){
  return parseShadowReportText(readFileSync(filePath,'utf8'),label);
}

function main(argv){
  if(argv.length!==2){
    console.error('Usage: node tools/compare_runtime_shadow_reports.mjs <left-report.json> <right-report.json>');
    return 2;
  }
  try{
    const left=readShadowReport(argv[0],'left');
    const right=readShadowReport(argv[1],'right');
    const result=compareShadowReports(left,right);
    process.stdout.write(`${JSON.stringify(result,null,2)}\n`);
    return result.identical?0:1;
  }catch(error){
    console.error(error instanceof Error?error.message:String(error));
    return 2;
  }
}

const isDirect=process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(isDirect)process.exitCode=main(process.argv.slice(2));
