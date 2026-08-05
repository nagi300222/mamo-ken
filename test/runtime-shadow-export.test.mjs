import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { CURRENT_CONTRACT } from '../src/core/constants.ts';
import {
  compareShadowReports,
  normalizeShadowReport,
  parseShadowReportText
} from '../tools/compare_runtime_shadow_reports.mjs';

const __dirname=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(__dirname,'..');
const browserSource=readFileSync(path.join(ROOT,'runtime','runtime-command-shadow-browser.js'),'utf8');
const comparatorPath=path.join(ROOT,'tools','compare_runtime_shadow_reports.mjs');
const runtimeBal={CMD:CURRENT_CONTRACT.bal.CMD};

function loadObserver(search='?mamokenShadow=1'){
  const sandbox={console,location:{search}};
  sandbox.window=sandbox;
  sandbox.globalThis=sandbox;
  vm.createContext(sandbox);
  vm.runInContext(`const BAL=${JSON.stringify(runtimeBal)};`,sandbox);
  vm.runInContext(browserSource,sandbox,{filename:'runtime-command-shadow-browser.js'});
  return sandbox.__MAMOKEN_COMMAND_SHADOW__;
}

function observeFallback(api,{frame,player,characterId,trigger,matches=true}){
  const legacy=trigger==='grab'
    ?{kind:'fallback',fallback:'normal-grab'}
    :{kind:'fallback',fallback:'normal-attack',level:trigger};
  if(!matches)legacy.fallback='tampered-fallback';
  return api.observeTrigger({frame,player,characterId,trigger,directions:[],legacy});
}

function buildReport({extra=false,mismatch=false}={}){
  const api=loadObserver();
  observeFallback(api,{frame:1,player:0,characterId:'moguzo',trigger:'high'});
  observeFallback(api,{frame:2,player:1,characterId:'pisuke',trigger:'mid'});
  observeFallback(api,{frame:3,player:0,characterId:'godan',trigger:'grab'});
  if(extra)observeFallback(api,{frame:4,player:1,characterId:'moguzo',trigger:'low',matches:!mismatch});
  return{api,text:api.exportReport(),report:JSON.parse(api.exportReport())};
}

const first=buildReport();
const second=buildReport();
assert.equal(first.text,second.text);
assert.equal(first.text.endsWith('\n'),true);
assert.equal(first.api.reportVersion,'mamoken-command-shadow-report-v1');
assert.equal(first.report.reportVersion,'mamoken-command-shadow-report-v1');
assert.equal(first.report.observerVersion,'runtime-command-shadow-browser-v2');
assert.equal(first.report.summary.observationCount,3);
assert.equal(first.report.summary.mismatchCount,0);
assert.equal(first.report.summary.firstFrame,1);
assert.equal(first.report.summary.lastFrame,3);
assert.equal(first.report.summary.byPlayer['0'].observations,2);
assert.equal(first.report.summary.byPlayer['1'].observations,1);
assert.equal(first.report.summary.byCharacter.moguzo.observations,1);
assert.equal(first.report.summary.byCharacter.pisuke.observations,1);
assert.equal(first.report.summary.byCharacter.godan.observations,1);
assert.equal(first.report.summary.byTrigger.high.observations,1);
assert.equal(first.report.summary.byTrigger.mid.observations,1);
assert.equal(first.report.summary.byTrigger.low.observations,0);
assert.equal(first.report.summary.byTrigger.grab.observations,1);
assert.equal(first.report.summary.observationHash,first.api.hash());
assert.equal(Object.hasOwn(first.report,'timestamp'),false);
assert.equal(Object.hasOwn(first.report,'url'),false);
assert.equal(Object.hasOwn(first.report,'userAgent'),false);
assert.equal(first.text.includes('mamokenShadow=1'),false);

const parsed=parseShadowReportText(first.text,'fixture');
assert.equal(parsed.summary.observationHash,first.api.hash());
assert.deepEqual(normalizeShadowReport(first.report),parsed);

const identical=compareShadowReports(first.report,second.report);
assert.equal(identical.compatible,true);
assert.equal(identical.identical,true);
assert.equal(identical.firstDifferenceIndex,null);
assert.equal(identical.delta.observationCount,0);
assert.equal(identical.delta.mismatchCount,0);

const changed=buildReport({extra:true,mismatch:true});
const different=compareShadowReports(first.report,changed.report);
assert.equal(different.compatible,true);
assert.equal(different.identical,false);
assert.equal(different.firstDifferenceIndex,3);
assert.equal(different.delta.observationCount,1);
assert.equal(different.delta.mismatchCount,1);
assert.equal(different.firstDifference.left,null);
assert.equal(different.firstDifference.right.matches,false);

{
  const tampered=structuredClone(first.report);
  tampered.summary.observationHash='00000000';
  assert.throws(()=>normalizeShadowReport(tampered,'tampered'),/observationHash.*does not match/);
}
{
  const tampered=structuredClone(first.report);
  tampered.summary.observationCount=99;
  assert.throws(()=>normalizeShadowReport(tampered,'tampered'),/observationCount.*does not match/);
}
{
  const tampered=structuredClone(first.report);
  tampered.reportVersion='unknown-report';
  assert.throws(()=>normalizeShadowReport(tampered,'tampered'),/reportVersion/);
}

const temp=mkdtempSync(path.join(tmpdir(),'mamoken-shadow-export-'));
try{
  const leftPath=path.join(temp,'left.json');
  const samePath=path.join(temp,'same.json');
  const changedPath=path.join(temp,'changed.json');
  const invalidPath=path.join(temp,'invalid.json');
  writeFileSync(leftPath,first.text,'utf8');
  writeFileSync(samePath,second.text,'utf8');
  writeFileSync(changedPath,changed.text,'utf8');
  writeFileSync(invalidPath,'{"broken":true}\n','utf8');

  const sameRun=spawnSync(process.execPath,[comparatorPath,leftPath,samePath],{encoding:'utf8'});
  assert.equal(sameRun.status,0,sameRun.stderr);
  assert.equal(JSON.parse(sameRun.stdout).identical,true);

  const changedRun=spawnSync(process.execPath,[comparatorPath,leftPath,changedPath],{encoding:'utf8'});
  assert.equal(changedRun.status,1,changedRun.stderr);
  assert.equal(JSON.parse(changedRun.stdout).identical,false);
  assert.equal(JSON.parse(changedRun.stdout).delta.mismatchCount,1);

  const invalidRun=spawnSync(process.execPath,[comparatorPath,leftPath,invalidPath],{encoding:'utf8'});
  assert.equal(invalidRun.status,2);
  assert.match(invalidRun.stderr,/reportVersion/);
}finally{
  rmSync(temp,{recursive:true,force:true});
}

assert.equal(/\bfetch\s*\(/.test(browserSource),false);
assert.equal(/localStorage/.test(browserSource),false);
assert.equal(/createElement\(['"]a['"]\)/.test(browserSource),false);
assert.equal(/Date\.|new Date/.test(browserSource),false);

console.log(`runtime shadow export tests passed; reportHash=${first.report.summary.observationHash}; observations=3; compareExit=0/1/2`);
