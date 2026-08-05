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
function loadApi(search=''){
  const sandbox={console,location:{search}};
  sandbox.window=sandbox;
  sandbox.globalThis=sandbox;
  vm.createContext(sandbox);
  vm.runInContext(`const BAL=${JSON.stringify(runtimeBal)};`,sandbox);
  vm.runInContext(browserSource,sandbox,{filename:'runtime-command-shadow-browser.js'});
  return sandbox.__MAMOKEN_COMMAND_SHADOW__;
}
function commandPayload(characterId,move,frame=20,player=0){
  return{
    frame,
    player,
    characterId,
    trigger:move.type==='grab'?'grab':move.trigger,
    directions:[
      {direction:move.seq[0],frame:frame-2},
      {direction:move.seq[1],frame:frame-1}
    ]
  };
}

const normal=loadApi('');
assert.equal(normal.version,'runtime-command-shadow-browser-v5');
assert.equal(normal.reportVersion,'mamoken-command-shadow-report-v3');
assert.equal(normal.requestedEnabled,false);
assert.equal(normal.requestedShadow,false);
assert.equal(normal.requestedCanary,false);
assert.equal(normal.requestedLegacy,false);
assert.equal(normal.enabled,false); // shadow observation remains opt-in
assert.equal(normal.canaryEnabled,true);
assert.equal(normal.offlineAuthority,'core-default');
const normalStatus=plain(normal.canaryStatus());
assert.equal(normalStatus.defaultEnabled,true);
assert.equal(normalStatus.legacyOverride,false);
assert.equal(normalStatus.offlineAuthority,'core-default');
assert.equal(normalStatus.enabled,true);

const move=CURRENT_CONTRACT.bal.CMD.moves.moguzo[0];
const normalResult=normal.resolveTrigger(commandPayload('moguzo',move));
assert.equal(normalResult.accepted,true);
assert.equal(normalResult.decision.kind,'command');
normal.completeCanaryAttempt(normalResult.attemptId,'command');
assert.equal(normal.canaryAudit().summary.commandCount,1);

const explicit=loadApi('?mamokenCoreCommand=1');
assert.equal(explicit.requestedCanary,true);
assert.equal(explicit.requestedEnabled,true);
assert.equal(explicit.enabled,true);
assert.equal(explicit.canaryEnabled,true);
assert.equal(explicit.offlineAuthority,'core-default');

const legacy=loadApi('?mamokenLegacyCommand=1');
assert.equal(legacy.requestedLegacy,true);
assert.equal(legacy.requestedCanary,false);
assert.equal(legacy.enabled,false);
assert.equal(legacy.canaryEnabled,false);
assert.equal(legacy.offlineAuthority,'legacy-override');
assert.deepEqual(plain(legacy.resolveTrigger({})),{accepted:false,reason:'disabled'});
const legacyReport=plain(legacy.report());
assert.equal(legacyReport.authority.offline,'legacy-override');
assert.equal(legacyReport.authority.online,'legacy');
assert.equal(legacyReport.canary.defaultEnabled,true);
assert.equal(legacyReport.canary.legacyOverride,true);
assert.equal(legacyReport.canary.enabled,false);
normalizeShadowReport(legacyReport,'legacy-override');

const shadowLegacy=loadApi('?mamokenShadow=1&mamokenLegacyCommand=1');
assert.equal(shadowLegacy.enabled,true);
assert.equal(shadowLegacy.canaryEnabled,false);
assert.equal(shadowLegacy.offlineAuthority,'legacy-override');
const observed=shadowLegacy.observeTrigger({
  frame:1,player:0,characterId:'moguzo',trigger:'high',directions:[],
  legacy:{kind:'fallback',fallback:'normal-attack',level:'high'}
});
assert.equal(observed.accepted,true);
assert.equal(shadowLegacy.canaryAudit().summary.attemptCount,0);

const overrideWins=loadApi('?mamokenCoreCommand=1&mamokenLegacyCommand=1');
assert.equal(overrideWins.requestedCanary,true);
assert.equal(overrideWins.requestedLegacy,true);
assert.equal(overrideWins.enabled,true); // explicit diagnostic observation still requested
assert.equal(overrideWins.canaryEnabled,false);
assert.equal(overrideWins.offlineAuthority,'legacy-override');

const rollback=loadApi('');
const rollbackPayload=commandPayload('moguzo',move,30);
const rollbackResult=rollback.resolveTrigger(rollbackPayload);
rollback.failCanaryAttempt(rollbackResult.attemptId,rollbackPayload,'runtime-validation-failed','forced rollback');
assert.equal(rollback.canaryEnabled,false);
assert.equal(rollback.offlineAuthority,'legacy-rollback');
assert.equal(rollback.canaryStatus().summary.rollbackCount,1);
rollback.reset();
assert.equal(rollback.canaryEnabled,true);
assert.equal(rollback.offlineAuthority,'core-default');

const normalReport=plain(loadApi('').report());
assert.equal(normalReport.requestedLegacy,false);
assert.equal(normalReport.authority.offline,'core-default');
assert.equal(normalReport.authority.online,'legacy');
assert.equal(normalReport.canary.defaultEnabled,true);
assert.equal(normalReport.canary.legacyOverride,false);
normalizeShadowReport(normalReport,'normal');
const authorityDifference=compareShadowReports(normalReport,legacyReport);
assert.equal(authorityDifference.compatible,true);
assert.equal(authorityDifference.authorityIdentical,false);
assert.equal(authorityDifference.identical,false);

const explicitV3=plain(explicit.report());
const historicalV2=structuredClone(explicitV3);
historicalV2.reportVersion='mamoken-command-shadow-report-v2';
delete historicalV2.requestedLegacy;
delete historicalV2.authority;
delete historicalV2.canary.defaultEnabled;
delete historicalV2.canary.legacyOverride;
const normalizedV2=normalizeShadowReport(historicalV2,'historical-v2');
assert.equal(normalizedV2.reportVersion,'mamoken-command-shadow-report-v2');
assert.equal(normalizedV2.authority,null);

const prototype=readFileSync(path.join(ROOT,'prototype','mamoken_prototype_v01.html'),'utf8');
const dist=readFileSync(path.join(ROOT,'dist','mamoken_mobile.html'),'utf8');
for(const source of [prototype,dist]){
  assert.ok(source.includes('lastMatchOnline||NET.active'));
}
assert.ok(dist.includes('runtime-command-shadow-browser-v5'));
assert.ok(dist.includes('mamoken-command-shadow-report-v3'));
assert.ok(dist.includes('mamokenLegacyCommand=1'));
assert.equal(/\bfetch\s*\(/.test(browserSource),false);
assert.equal(/localStorage/.test(browserSource),false);
assert.equal(/Date\.|new Date/.test(browserSource),false);

console.log('runtime command authority tests passed; offline=core-default; online=legacy; rollbackQuery=mamokenLegacyCommand=1');
