import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { CURRENT_CONTRACT } from '../src/core/constants.ts';
import { compareShadowReports, normalizeShadowReport } from '../tools/compare_runtime_shadow_reports.mjs';

const __dirname=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(__dirname,'..');
const browserSource=readFileSync(path.join(ROOT,'runtime','runtime-command-shadow-browser.js'),'utf8');
const runtimeBal={CMD:CURRENT_CONTRACT.bal.CMD};

function plain(value){return JSON.parse(JSON.stringify(value));}
function loadApi(){
  const sandbox={console,location:{search:'?mamokenCoreCommand=1'}};
  sandbox.window=sandbox;
  sandbox.globalThis=sandbox;
  vm.createContext(sandbox);
  vm.runInContext(`const BAL=${JSON.stringify(runtimeBal)};`,sandbox);
  vm.runInContext(browserSource,sandbox,{filename:'runtime-command-shadow-browser.js'});
  return sandbox.__MAMOKEN_COMMAND_SHADOW__;
}
function payload(characterId,trigger,frame,player=0,directions=[]){
  return{frame,player,characterId,trigger,directions};
}
function commandPayload(characterId,move,frame,player=0){
  return payload(characterId,move.type==='grab'?'grab':move.trigger,frame,player,[
    {direction:move.seq[0],frame:frame-2},
    {direction:move.seq[1],frame:frame-1}
  ]);
}
function complete(api,source){
  const result=api.resolveTrigger(source);
  const outcome=result.decision.kind==='command'?'command':'fallback';
  api.completeCanaryAttempt(result.attemptId,outcome);
  return result;
}
function buildFixture({rollback=false}={}){
  const api=loadApi();
  const moguzo=CURRENT_CONTRACT.bal.CMD.moves.moguzo[0];
  complete(api,commandPayload('moguzo',moguzo,10,0));
  complete(api,payload('pisuke','high',20,1,[]));
  const godanPayload=payload('godan','grab',30,0,[]);
  const third=api.resolveTrigger(godanPayload);
  if(rollback)api.failCanaryAttempt(third.attemptId,godanPayload,'runtime-validation-failed','fixture rollback');
  else api.completeCanaryAttempt(third.attemptId,'fallback');
  return{api,report:plain(api.report()),text:api.exportReport()};
}

const first=buildFixture();
const second=buildFixture();
assert.equal(first.text,second.text);
assert.equal(first.report.reportVersion,'mamoken-command-shadow-report-v3');
assert.equal(first.report.observerVersion,'runtime-command-shadow-browser-v5');
assert.equal(first.report.canary.summary.attemptCount,3);
assert.equal(first.report.canary.summary.commandCount,1);
assert.equal(first.report.canary.summary.fallbackCount,2);
assert.equal(first.report.canary.summary.rollbackCount,0);
assert.equal(first.report.canary.summary.pendingCount,0);
assert.equal(first.report.canary.summary.firstFrame,10);
assert.equal(first.report.canary.summary.lastFrame,30);
assert.equal(first.report.canary.summary.byPlayer['0'].attempts,2);
assert.equal(first.report.canary.summary.byPlayer['1'].fallbacks,1);
assert.equal(first.report.canary.summary.byCharacter.moguzo.commands,1);
assert.equal(first.report.canary.summary.byCharacter.pisuke.fallbacks,1);
assert.equal(first.report.canary.summary.byCharacter.godan.fallbacks,1);
assert.equal(first.report.canary.summary.byTrigger.grab.fallbacks,1);
assert.equal(first.report.canary.summary.eventHash,first.api.canaryHash());
assert.deepEqual(first.report.canary.summary.rollbackReasons,{});
assert.deepEqual(first.report.canary.events.map((event)=>event.attemptId),[1,2,3]);
assert.deepEqual(first.report.canary.events.map((event)=>event.outcome),['command','fallback','fallback']);
normalizeShadowReport(first.report,'fixture');

const rolledBack=buildFixture({rollback:true});
assert.equal(rolledBack.report.canary.summary.attemptCount,3);
assert.equal(rolledBack.report.canary.summary.commandCount,1);
assert.equal(rolledBack.report.canary.summary.fallbackCount,1);
assert.equal(rolledBack.report.canary.summary.rollbackCount,1);
assert.equal(rolledBack.report.canary.summary.pendingCount,0);
assert.equal(rolledBack.report.canary.summary.rollbackReasons['runtime-validation-failed'],1);
assert.equal(rolledBack.report.canary.events[2].outcome,'rollback');
assert.equal(rolledBack.report.canary.events[2].reason,'runtime-validation-failed');
assert.equal(rolledBack.report.canary.enabled,false);

const comparison=compareShadowReports(first.report,rolledBack.report);
assert.equal(comparison.compatible,true);
assert.equal(comparison.identical,false);
assert.equal(comparison.observationsIdentical,true);
assert.equal(comparison.canaryIdentical,false);
assert.equal(comparison.firstDifferenceIndex,null);
assert.equal(comparison.canaryFirstDifferenceIndex,2);
assert.equal(comparison.delta.canaryAttemptCount,0);
assert.equal(comparison.delta.canaryFallbackCount,-1);
assert.equal(comparison.delta.canaryRollbackCount,1);
assert.equal(comparison.canaryFirstDifference.left.outcome,'fallback');
assert.equal(comparison.canaryFirstDifference.right.outcome,'rollback');

{
  const tampered=structuredClone(first.report);
  tampered.canary.summary.eventHash='00000000';
  assert.throws(()=>normalizeShadowReport(tampered,'tampered'),/eventHash.*does not match/);
}
{
  const tampered=structuredClone(first.report);
  tampered.canary.summary.commandCount=99;
  assert.throws(()=>normalizeShadowReport(tampered,'tampered'),/commandCount.*does not match/);
}
{
  const tampered=structuredClone(first.report);
  tampered.canary.events[0].outcome='fallback';
  assert.throws(()=>normalizeShadowReport(tampered,'tampered'),/fallback decision/);
}
{
  const tampered=structuredClone(rolledBack.report);
  tampered.canary.events[2].reason='BAD REASON';
  assert.throws(()=>normalizeShadowReport(tampered,'tampered'),/stable lowercase rollback code/);
}
{
  const tampered=structuredClone(first.report);
  tampered.canary.events[1].attemptId=1;
  assert.throws(()=>normalizeShadowReport(tampered,'tampered'),/strictly increasing/);
}

function ringHash(){
  const api=loadApi();
  for(let frame=0;frame<300;frame++){
    const trigger=frame%4===0?'grab':(frame%3===0?'high':(frame%3===1?'mid':'low'));
    complete(api,payload(frame%2===0?'moguzo':'pisuke',trigger,frame,frame%2,[]));
  }
  const audit=plain(api.canaryAudit());
  assert.equal(audit.events.length,256);
  assert.equal(audit.events[0].attemptId,45);
  assert.equal(audit.events[255].attemptId,300);
  assert.equal(audit.events[0].frame,44);
  assert.equal(audit.events[255].frame,299);
  assert.equal(audit.summary.attemptCount,256);
  assert.equal(audit.summary.fallbackCount,256);
  assert.equal(audit.summary.commandCount,0);
  assert.equal(audit.summary.rollbackCount,0);
  assert.equal(audit.summary.pendingCount,0);
  assert.equal(audit.summary.eventHash,api.canaryHash());
  return audit.summary.eventHash;
}
const ringAuditHash=ringHash();
assert.equal(ringAuditHash,ringHash());

{
  const api=loadApi();
  const source=payload('moguzo','mid',7,0,[]);
  const rollback=api.failCanaryAttempt(null,source,'resolve-error','BAL unavailable');
  assert.equal(rollback.attemptId,1);
  assert.equal(rollback.decision,null);
  assert.equal(rollback.outcome,'rollback');
  assert.equal(api.canaryStatus().summary.rollbackReasons['resolve-error'],1);
}

assert.equal(first.text.includes('timestamp'),false);
assert.equal(first.text.includes('userAgent'),false);
assert.equal(first.text.includes('location'),false);

console.log(`runtime canary audit tests passed; fixtureHash=${first.report.canary.summary.eventHash}; ringHash=${ringAuditHash}; outcomes=command/fallback/rollback`);
