import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { CURRENT_CONTRACT } from '../src/core/constants.ts';

const __dirname=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(__dirname,'..');
const browserSource=readFileSync(path.join(ROOT,'runtime','runtime-command-shadow-browser.js'),'utf8');
const runtimeBal={CMD:CURRENT_CONTRACT.bal.CMD};

function plain(value){return JSON.parse(JSON.stringify(value));}
function loadApi(search){
  const sandbox={console,location:{search}};
  sandbox.window=sandbox;
  sandbox.globalThis=sandbox;
  vm.createContext(sandbox);
  vm.runInContext(`const BAL=${JSON.stringify(runtimeBal)};`,sandbox);
  vm.runInContext(browserSource,sandbox,{filename:'runtime-command-shadow-browser.js'});
  return sandbox.__MAMOKEN_COMMAND_SHADOW__;
}

function decisionPayload(characterId,move,frame=30,player=0,triggerOverride=null){
  return{
    frame,
    player,
    characterId,
    trigger:triggerOverride??(move.type==='grab'?'grab':move.trigger),
    directions:[
      {direction:move.seq[0],frame:frame-2},
      {direction:move.seq[1],frame:frame-1}
    ]
  };
}
function complete(api,result){
  const outcome=result.decision.kind==='command'?'command':'fallback';
  return api.completeCanaryAttempt(result.attemptId,outcome);
}

{
  const api=loadApi('');
  assert.equal(api.requestedCanary,false);
  assert.equal(api.requestedLegacy,false);
  assert.equal(api.enabled,false);
  assert.equal(api.canaryEnabled,true);
  assert.equal(api.offlineAuthority,'core-default');
  const status=plain(api.canaryStatus());
  assert.equal(status.requested,false);
  assert.equal(status.defaultEnabled,true);
  assert.equal(status.legacyOverride,false);
  assert.equal(status.offlineAuthority,'core-default');
  assert.equal(status.enabled,true);
  assert.equal(status.disabledReason,null);
  assert.equal(status.summary.attemptCount,0);
}

{
  const api=loadApi('?mamokenShadow=1');
  assert.equal(api.requestedShadow,true);
  assert.equal(api.requestedCanary,false);
  assert.equal(api.enabled,true);
  assert.equal(api.canaryEnabled,true);
  assert.equal(api.offlineAuthority,'core-default');
}

{
  const api=loadApi('?mamokenLegacyCommand=1');
  assert.equal(api.requestedLegacy,true);
  assert.equal(api.canaryEnabled,false);
  assert.equal(api.offlineAuthority,'legacy-override');
  assert.deepEqual(plain(api.resolveTrigger({})),{accepted:false,reason:'disabled'});
}

{
  const api=loadApi('?mamokenCoreCommand=1&mamokenLegacyCommand=1');
  assert.equal(api.requestedCanary,true);
  assert.equal(api.requestedLegacy,true);
  assert.equal(api.canaryEnabled,false);
  assert.equal(api.offlineAuthority,'legacy-override');
}

const canary=loadApi('?mamokenCoreCommand=1');
assert.equal(canary.version,'runtime-command-shadow-browser-v5');
assert.equal(canary.reportVersion,'mamoken-command-shadow-report-v3');
assert.equal(canary.requestedShadow,false);
assert.equal(canary.requestedCanary,true);
assert.equal(canary.requestedEnabled,true);
assert.equal(canary.enabled,true);
assert.equal(canary.canaryEnabled,true);
assert.equal(canary.canaryStatus().summary.attemptCount,0);

let commandCount=0;
for(const characterId of ['moguzo','pisuke','godan']){
  const moves=CURRENT_CONTRACT.bal.CMD.moves[characterId];
  for(let index=0;index<moves.length;index++){
    const move=moves[index];
    const result=canary.resolveTrigger(decisionPayload(characterId,move,40+commandCount,commandCount%2));
    assert.equal(result.accepted,true);
    assert.equal(result.decision.kind,'command');
    assert.equal(result.decision.commandId,`${characterId}:slot-${index+1}`);
    assert.equal(result.decision.slot,index+1);
    assert.equal(result.decision.name,move.name);
    const event=complete(canary,result);
    assert.equal(event.outcome,'command');
    commandCount++;
  }
}
assert.equal(commandCount,9);

{
  const payload={frame:100,player:0,characterId:'moguzo',trigger:'high',directions:[]};
  const result=canary.resolveTrigger(payload);
  assert.equal(result.accepted,true);
  assert.deepEqual(plain(result.decision),{kind:'fallback',fallback:'normal-attack',level:'high'});
  assert.equal(complete(canary,result).outcome,'fallback');
}

{
  const move=CURRENT_CONTRACT.bal.CMD.moves.moguzo[0];
  const originalTrigger=move.type==='grab'?'grab':move.trigger;
  const wrongTrigger=['high','mid','low','grab'].find((candidate)=>candidate!==originalTrigger);
  const result=canary.resolveTrigger(decisionPayload('moguzo',move,110,0,wrongTrigger));
  assert.equal(result.accepted,true);
  assert.equal(result.decision.kind,'fallback');
  complete(canary,result);
}

const summary=plain(canary.canaryAudit().summary);
assert.equal(summary.attemptCount,11);
assert.equal(summary.commandCount,9);
assert.equal(summary.fallbackCount,2);
assert.equal(summary.rollbackCount,0);
assert.equal(summary.pendingCount,0);
assert.equal(summary.byCharacter.moguzo.attempts,5);
assert.equal(summary.byCharacter.pisuke.commands,3);
assert.equal(summary.byCharacter.godan.commands,3);
assert.equal(summary.eventHash,canary.canaryHash());

{
  const combined=loadApi('?x=1&mamokenShadow=1&mamokenCoreCommand=1');
  assert.equal(combined.requestedShadow,true);
  assert.equal(combined.requestedCanary,true);
  assert.equal(combined.enabled,true);
  assert.equal(combined.canaryEnabled,true);
}

{
  const api=loadApi('?mamokenCoreCommand=1');
  const move=CURRENT_CONTRACT.bal.CMD.moves.moguzo[0];
  const payload=decisionPayload('moguzo',move,12);
  const result=api.resolveTrigger(payload);
  const rollback=api.failCanaryAttempt(result.attemptId,payload,'runtime-validation-failed','forced canary failure');
  assert.equal(rollback.outcome,'rollback');
  assert.equal(rollback.reason,'runtime-validation-failed');
  assert.equal(api.enabled,false);
  assert.equal(api.canaryEnabled,false);
  assert.equal(api.resolveTrigger({}).accepted,false);
  const status=plain(api.canaryStatus());
  assert.equal(status.requested,true);
  assert.equal(status.defaultEnabled,true);
  assert.equal(status.legacyOverride,false);
  assert.equal(status.offlineAuthority,'legacy-rollback');
  assert.equal(status.enabled,false);
  assert.equal(status.disabledReason,'forced canary failure');
  assert.equal(status.summary.rollbackCount,1);
  assert.equal(status.summary.rollbackReasons['runtime-validation-failed'],1);
  api.reset();
  assert.equal(api.enabled,true);
  assert.equal(api.canaryEnabled,true);
  assert.equal(api.offlineAuthority,'core-default');
  assert.equal(api.canaryStatus().summary.attemptCount,0);
}

const prototype=readFileSync(path.join(ROOT,'prototype','mamoken_prototype_v01.html'),'utf8');
const dist=readFileSync(path.join(ROOT,'dist','mamoken_mobile.html'),'utf8');
const patcher=readFileSync(path.join(ROOT,'tools','apply_t17_runtime_command_canary.mjs'),'utf8');
const auditPatcher=readFileSync(path.join(ROOT,'tools','apply_t18_runtime_canary_audit.mjs'),'utf8');

for(const source of [prototype,dist]){
  assert.equal((source.match(/\/\* T17 offline runtime command canary \*\//g)||[]).length,1);
  assert.equal((source.match(/const legacyCm=detectCommandMove\(f\);runtimeCommandShadowObserve\(f,c,legacyCm\);/g)||[]).length,2);
  assert.equal((source.match(/const cm=runtimeCommandCanaryResolve\(f,c,legacyCm\);/g)||[]).length,2);
  assert.equal((source.match(/if\(!api\|\|!api\.canaryEnabled\|\|lastMatchOnline\|\|NET\.active\)return legacyCm;/g)||[]).length,1);
  assert.equal((source.match(/api\.resolveTrigger\(payload\)/g)||[]).length,1);
  assert.equal((source.match(/api\.completeCanaryAttempt\(attemptId,'command'\)/g)||[]).length,1);
  assert.equal((source.match(/api\.completeCanaryAttempt\(attemptId,'fallback'\)/g)||[]).length,1);
  assert.equal((source.match(/api\.failCanaryAttempt\(attemptId,payload,/g)||[]).length,1);
  assert.equal((source.match(/Core command canary resolved an unknown current move/g)||[]).length,1);
}
assert.ok(prototype.includes('<script src="../runtime/runtime-command-shadow-browser.js"></script>'));
assert.equal(dist.includes('<script src="../runtime/runtime-command-shadow-browser.js"></script>'),false);
assert.ok(dist.includes('runtime-command-shadow-browser-v5'));
assert.ok(dist.includes('mamoken-command-shadow-report-v3'));
assert.ok(dist.includes('mamokenCoreCommand=1'));
assert.ok(dist.includes('mamokenLegacyCommand=1'));
assert.ok(patcher.includes("const MARKER='/* T17 offline runtime command canary */'"));
assert.ok(patcher.includes('lastMatchOnline||NET.active'));
assert.ok(auditPatcher.includes('runtime-validation-failed'));
assert.ok(auditPatcher.includes('resolve-error'));

assert.equal(/\bfetch\s*\(/.test(browserSource),false);
assert.equal(/localStorage/.test(browserSource),false);
assert.equal(/Date\.|new Date/.test(browserSource),false);

console.log(`runtime command canary tests passed; currentCommands=${commandCount}; auditHash=${summary.eventHash}; defaultOn=true; onlineAuthority=legacy; rollback=legacy`);
