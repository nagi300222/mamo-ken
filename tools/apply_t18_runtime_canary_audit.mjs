import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(__dirname,'..');
const TARGET=path.join(ROOT,'prototype','mamoken_prototype_v01.html');
const MARKER='/* T17 offline runtime command canary */';

const OLD_HELPER=`${MARKER}
function runtimeCommandCanaryResolve(f,c,legacyCm){
  const api=window.__MAMOKEN_COMMAND_SHADOW__;
  if(!api||!api.canaryEnabled||lastMatchOnline||NET.active)return legacyCm;
  try{
    const trigger=c.t==='grab'?'grab':c.lv;
    const result=api.resolveTrigger({
      frame:B.f,
      player:f.side,
      characterId:f.c.id,
      trigger:trigger,
      directions:f.dirBuf.map(function(entry){return{direction:entry.dir,frame:entry.f};})
    });
    if(!result||!result.accepted)return legacyCm;
    if(result.decision.kind==='fallback')return null;
    const idx=result.decision.slot-1;
    const moves=BAL.CMD.moves[f.c.id];
    const move=moves&&moves[idx];
    const compatible=!!move&&(trigger==='grab'
      ?move.type==='grab'
      :(move.type==='atk'||move.type==='stance')&&move.trigger===trigger);
    if(!compatible||move.name!==result.decision.name||result.decision.commandId!==f.c.id+':slot-'+(idx+1)){
      throw new Error('Core command canary resolved an unknown current move');
    }
    return{move:move,idx:idx};
  }catch(error){
    try{api.disable(error);}catch(ignore){}
    return legacyCm;
  }
}
`;

const NEW_HELPER=`${MARKER}
function runtimeCommandCanaryResolve(f,c,legacyCm){
  const api=window.__MAMOKEN_COMMAND_SHADOW__;
  if(!api||!api.canaryEnabled||lastMatchOnline||NET.active)return legacyCm;
  const trigger=c.t==='grab'?'grab':c.lv;
  const payload={
    frame:B.f,
    player:f.side,
    characterId:f.c.id,
    trigger:trigger,
    directions:f.dirBuf.map(function(entry){return{direction:entry.dir,frame:entry.f};})
  };
  let attemptId=null;
  try{
    const result=api.resolveTrigger(payload);
    if(!result||!result.accepted)return legacyCm;
    attemptId=result.attemptId;
    if(result.decision.kind==='fallback'){
      api.completeCanaryAttempt(attemptId,'fallback');
      return null;
    }
    const idx=result.decision.slot-1;
    const moves=BAL.CMD.moves[f.c.id];
    const move=moves&&moves[idx];
    const compatible=!!move&&(trigger==='grab'
      ?move.type==='grab'
      :(move.type==='atk'||move.type==='stance')&&move.trigger===trigger);
    if(!compatible||move.name!==result.decision.name||result.decision.commandId!==f.c.id+':slot-'+(idx+1)){
      throw new Error('Core command canary resolved an unknown current move');
    }
    api.completeCanaryAttempt(attemptId,'command');
    return{move:move,idx:idx};
  }catch(error){
    try{
      api.failCanaryAttempt(attemptId,payload,attemptId==null?'resolve-error':'runtime-validation-failed',error);
    }catch(auditError){
      try{api.disable(error);}catch(ignore){}
    }
    return legacyCm;
  }
}
`;

function count(text,needle){return text.split(needle).length-1;}

let html=readFileSync(TARGET,'utf8');
if(html.includes(NEW_HELPER)){
  console.log('T18 runtime canary audit hook already applied');
  process.exit(0);
}
if(count(html,OLD_HELPER)!==1)throw new Error(`T18 helper anchor count must be 1, found ${count(html,OLD_HELPER)}`);
html=html.replace(OLD_HELPER,NEW_HELPER);

if(count(html,MARKER)!==1)throw new Error('T17/T18 canary marker count must remain 1');
if(count(html,"api.completeCanaryAttempt(attemptId,'command');")!==1)throw new Error('command completion audit hook missing');
if(count(html,"api.completeCanaryAttempt(attemptId,'fallback');")!==1)throw new Error('fallback completion audit hook missing');
if(count(html,'api.failCanaryAttempt(attemptId,payload,')!==1)throw new Error('rollback audit hook missing');
if(count(html,"attemptId==null?'resolve-error':'runtime-validation-failed'")!==1)throw new Error('stable rollback reason mapping missing');
if(count(html,'if(!api||!api.canaryEnabled||lastMatchOnline||NET.active)return legacyCm;')!==1)throw new Error('offline/online authority guard changed');

writeFileSync(TARGET,html,'utf8');
console.log('T18 runtime canary audit hook applied');
