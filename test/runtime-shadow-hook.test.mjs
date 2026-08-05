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

function loadBrowserObserver(search){
  const sandbox={console,location:{search}};
  sandbox.window=sandbox;
  sandbox.globalThis=sandbox;
  vm.createContext(sandbox);
  vm.runInContext(`const BAL=${JSON.stringify(runtimeBal)};`,sandbox);
  vm.runInContext(browserSource,sandbox,{filename:'runtime-command-shadow-browser.js'});
  return sandbox.__MAMOKEN_COMMAND_SHADOW__;
}

function commandPayload(characterId,move,slot,frame=12,player=0){
  return{
    frame,
    player,
    characterId,
    trigger:move.type==='grab'?'grab':move.trigger,
    directions:[
      {direction:move.seq[0],frame:frame-2},
      {direction:move.seq[1],frame:frame-1}
    ],
    legacy:{kind:'command',commandId:`${characterId}:slot-${slot}`,slot,name:move.name}
  };
}

{
  const api=loadBrowserObserver('');
  assert.equal(api.version,'runtime-command-shadow-browser-v5');
  assert.equal(api.reportVersion,'mamoken-command-shadow-report-v3');
  assert.equal(api.requestedEnabled,false);
  assert.equal(api.requestedShadow,false);
  assert.equal(api.requestedCanary,false);
  assert.equal(api.requestedLegacy,false);
  assert.equal(api.canaryEnabled,true);
  assert.equal(api.offlineAuthority,'core-default');
  assert.equal(api.enabled,false);
  const result=api.observeTrigger({});
  assert.equal(result.accepted,false);
  assert.equal(result.reason,'disabled');
  assert.equal(api.snapshot().observations.length,0);
  assert.equal(api.snapshot().canaryEvents.length,0);
  assert.equal(api.summary().observationCount,0);
  assert.equal(api.report().summary.mismatchCount,0);
  assert.equal(api.report().canary.enabled,true);
  assert.equal(api.report().canary.defaultEnabled,true);
  assert.equal(api.report().canary.summary.attemptCount,0);
}

const currentApi=loadBrowserObserver('?mamokenShadow=1');
assert.equal(currentApi.requestedEnabled,true);
assert.equal(currentApi.requestedShadow,true);
assert.equal(currentApi.requestedCanary,false);
assert.equal(currentApi.canaryEnabled,true);
assert.equal(currentApi.enabled,true);
let currentCount=0;
for(const characterId of ['moguzo','pisuke','godan']){
  const moves=CURRENT_CONTRACT.bal.CMD.moves[characterId];
  for(let index=0;index<moves.length;index++){
    const move=moves[index];
    const result=currentApi.observeTrigger(commandPayload(characterId,move,index+1,20+currentCount));
    assert.equal(result.accepted,true);
    assert.equal(result.observation.matches,true);
    assert.equal(result.observation.core.kind,'command');
    assert.equal(result.observation.core.commandId,`${characterId}:slot-${index+1}`);
    assert.equal(result.observation.core.name,move.name);
    currentCount++;
  }
}
assert.equal(currentCount,9);
assert.equal(currentApi.mismatchCount(),0);
assert.equal(currentApi.summary().observationCount,9);
assert.equal(currentApi.summary().byCharacter.moguzo.observations,3);
assert.equal(currentApi.summary().byCharacter.pisuke.observations,3);
assert.equal(currentApi.summary().byCharacter.godan.observations,3);
assert.equal(currentApi.canaryAudit().summary.attemptCount,0);

{
  const api=loadBrowserObserver('?x=1&mamokenShadow=1');
  const fallback=api.observeTrigger({
    frame:4,player:1,characterId:'pisuke',trigger:'high',directions:[],
    legacy:{kind:'fallback',fallback:'normal-attack',level:'high'}
  });
  assert.equal(fallback.observation.matches,true);
  assert.equal(fallback.observation.core.kind,'fallback');

  const move=CURRENT_CONTRACT.bal.CMD.moves.moguzo[0];
  const mismatch=api.observeTrigger({
    ...commandPayload('moguzo',move,1,10),
    legacy:{kind:'fallback',fallback:'normal-attack',level:'mid'}
  });
  assert.equal(mismatch.observation.matches,false);
  assert.equal(api.mismatchCount(),1);
  assert.equal(api.summary().byTrigger.mid.mismatches,1);
}

function longRunHash(){
  const api=loadBrowserObserver('?mamokenShadow=1');
  for(let frame=0;frame<300;frame++){
    const level=frame%3===0?'high':(frame%3===1?'mid':'low');
    api.observeTrigger({
      frame,player:frame%2,characterId:frame%2===0?'moguzo':'pisuke',trigger:level,directions:[],
      legacy:{kind:'fallback',fallback:'normal-attack',level}
    });
  }
  const snapshot=api.snapshot();
  assert.equal(snapshot.observations.length,256);
  assert.equal(snapshot.observations[0].frame,44);
  assert.equal(snapshot.observations[255].frame,299);
  assert.equal(api.mismatchCount(),0);
  assert.equal(api.summary().firstFrame,44);
  assert.equal(api.summary().lastFrame,299);
  return api.hash();
}
const longHash=longRunHash();
assert.equal(longHash,longRunHash());

{
  const api=loadBrowserObserver('?mamokenShadow=1');
  api.disable('forced test disable');
  assert.equal(api.enabled,false);
  assert.equal(api.observeTrigger({}).accepted,false);
  api.reset();
  assert.equal(api.enabled,true);
  assert.equal(api.snapshot().observations.length,0);
  assert.equal(api.snapshot().canaryEvents.length,0);
}

const prototype=readFileSync(path.join(ROOT,'prototype','mamoken_prototype_v01.html'),'utf8');
const dist=readFileSync(path.join(ROOT,'dist','mamoken_mobile.html'),'utf8');
const buildScript=readFileSync(path.join(ROOT,'tools','build_mobile.mjs'),'utf8');
const patchScript=readFileSync(path.join(ROOT,'tools','apply_t15_runtime_shadow_hook.mjs'),'utf8');
const externalTag='<script src="../runtime/runtime-command-shadow-browser.js"></script>';

assert.equal((prototype.match(/\/\* T15 runtime command shadow hook \*\//g)||[]).length,1);
assert.equal((prototype.match(/runtimeCommandShadowObserve\(f,c,legacyCm\);/g)||[]).length,2);
assert.equal((prototype.match(/runtimeCommandShadowReset\(\);roundInit\(true\);/g)||[]).length,2);
assert.equal((prototype.match(new RegExp(externalTag.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'g'))||[]).length,1);
assert.ok(prototype.includes('window.__MAMOKEN_COMMAND_SHADOW__'));
assert.ok(patchScript.includes("const MARKER='/* T15 runtime command shadow hook */'"));

assert.ok(buildScript.includes('runtime-command-shadow-browser.js'));
assert.ok(buildScript.includes('RUNTIME_SHADOW_TAG'));
assert.equal(dist.includes(externalTag),false);
assert.ok(dist.includes('runtime-command-shadow-browser-v5'));
assert.ok(dist.includes('mamoken-command-shadow-report-v3'));
assert.ok(dist.includes('/* T15 runtime command shadow hook */'));
assert.equal((dist.match(/runtimeCommandShadowObserve\(f,c,legacyCm\);/g)||[]).length,2);

console.log(`runtime shadow hook tests passed; currentCommands=${currentCount}; longHash=${longHash}; shadowDefaultOff=true; coreDefaultOn=true; ring=256; report=v3`);
