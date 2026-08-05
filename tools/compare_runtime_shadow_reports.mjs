import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPORT_VERSION='mamoken-command-shadow-report-v1';
const CURRENT_CHARACTERS=new Set(['moguzo','pisuke','godan']);
const CURRENT_TRIGGERS=new Set(['high','mid','low','grab']);

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
function assertCounter(value,label){
  if(!isObject(value))fail(label,'must be an object');
  return{
    observations:assertInteger(value.observations,`${label}.observations`),
    mismatches:assertInteger(value.mismatches,`${label}.mismatches`)
  };
}
function normalizeDecision(value,label){if(!isObject(value))fail(label,'must be an object');return JSON.parse(JSON.stringify(value));}
function normalizeObservation(value,label){
  if(!isObject(value))fail(label,'must be an object');
  const characterId=value.characterId;
  const trigger=value.trigger;
  if(!CURRENT_CHARACTERS.has(characterId))fail(`${label}.characterId`,'must be a current character');
  if(!CURRENT_TRIGGERS.has(trigger))fail(`${label}.trigger`,'must be high, mid, low, or grab');
  if(value.player!==0&&value.player!==1)fail(`${label}.player`,'must be 0 or 1');
  if(typeof value.matches!=='boolean')fail(`${label}.matches`,'must be boolean');
  return{
    frame:assertInteger(value.frame,`${label}.frame`),
    player:value.player,
    characterId,
    trigger,
    legacy:normalizeDecision(value.legacy,`${label}.legacy`),
    core:normalizeDecision(value.core,`${label}.core`),
    matches:value.matches
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

export function normalizeShadowReport(source,label='report'){
  if(!isObject(source))fail(label,'must be an object');
  if(source.reportVersion!==REPORT_VERSION)fail(`${label}.reportVersion`,`must be ${REPORT_VERSION}`);
  if(typeof source.observerVersion!=='string'||source.observerVersion.length===0)fail(`${label}.observerVersion`,'must be a non-empty string');
  if(typeof source.requestedEnabled!=='boolean')fail(`${label}.requestedEnabled`,'must be boolean');
  if(typeof source.enabled!=='boolean')fail(`${label}.enabled`,'must be boolean');
  if(source.disabledReason!==null&&typeof source.disabledReason!=='string')fail(`${label}.disabledReason`,'must be null or string');
  if(!Array.isArray(source.observations))fail(`${label}.observations`,'must be an array');
  if(source.observations.length>256)fail(`${label}.observations`,'must not exceed the 256-entry ring');
  const observations=source.observations.map((item,index)=>normalizeObservation(item,`${label}.observations[${index}]`));
  if(!isObject(source.summary))fail(`${label}.summary`,'must be an object');
  const summary={
    observationCount:assertInteger(source.summary.observationCount,`${label}.summary.observationCount`),
    mismatchCount:assertInteger(source.summary.mismatchCount,`${label}.summary.mismatchCount`),
    observationHash:source.summary.observationHash,
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
  if(typeof summary.observationHash!=='string'||!/^[0-9a-f]{8}$/.test(summary.observationHash))fail(`${label}.summary.observationHash`,'must be an 8-character lowercase hex hash');
  assertSummaryMatch(summary,expectedSummary(source.observerVersion,observations),`${label}.summary`);
  return{
    reportVersion:REPORT_VERSION,
    observerVersion:source.observerVersion,
    requestedEnabled:source.requestedEnabled,
    enabled:source.enabled,
    disabledReason:source.disabledReason,
    summary,
    observations
  };
}

export function parseShadowReportText(text,label='report'){
  let parsed;
  try{parsed=JSON.parse(text);}catch(error){fail(label,`invalid JSON (${error.message})`);}
  return normalizeShadowReport(parsed,label);
}

export function compareShadowReports(leftSource,rightSource){
  const left=normalizeShadowReport(leftSource,'left');
  const right=normalizeShadowReport(rightSource,'right');
  const compatible=left.reportVersion===right.reportVersion&&left.observerVersion===right.observerVersion;
  const leftText=stableStringify(left.observations);
  const rightText=stableStringify(right.observations);
  const identical=compatible&&leftText===rightText;
  const maxLength=Math.max(left.observations.length,right.observations.length);
  let firstDifferenceIndex=null;
  for(let index=0;index<maxLength;index++){
    if(stableStringify(left.observations[index])!==stableStringify(right.observations[index])){
      firstDifferenceIndex=index;
      break;
    }
  }
  return{
    reportVersion:REPORT_VERSION,
    compatible,
    identical,
    left:{
      observerVersion:left.observerVersion,
      observationCount:left.summary.observationCount,
      mismatchCount:left.summary.mismatchCount,
      observationHash:left.summary.observationHash
    },
    right:{
      observerVersion:right.observerVersion,
      observationCount:right.summary.observationCount,
      mismatchCount:right.summary.mismatchCount,
      observationHash:right.summary.observationHash
    },
    delta:{
      observationCount:right.summary.observationCount-left.summary.observationCount,
      mismatchCount:right.summary.mismatchCount-left.summary.mismatchCount
    },
    firstDifferenceIndex,
    firstDifference:firstDifferenceIndex===null?null:{
      left:left.observations[firstDifferenceIndex]??null,
      right:right.observations[firstDifferenceIndex]??null
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
