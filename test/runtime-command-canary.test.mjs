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

{
  const api=loadApi('');
  assert.equal(api.requestedCanary,false);
  assert.equal(api.canaryEnabled,false);
  assert.equal(api.resolveTrigger({}).accepted,false);
  assert.equal(api.resolveTrigger({}).reason,'disabled');
  assert.deepEqual(plain(api.canaryStatus()),{requested:false,enabled:false,disabledReason:null});
}

{
  const api=loadApi('?mamokenShadow=1');
  assert.equal(api.requestedShadow,true);
  assert.equal(api.requestedCanary,false);
  assert.equal(api.enabled,true);
  assert.equal(api.canaryEnabled,false);
  assert.equal(api.resolveTrigger({}).accepted,false);
}

const canary=loadApi('?mamokenCoreCommand=1');
assert.equal(canary.version,'runtime-command-shadow-browser-v3');
assert.equal(canary.requestedShadow,false);
assert.equal(canary.requestedCanary,true);
assert.equal(canary.requestedEnabled,true);
assert.equal(canary.enabled,true);
assert.equal(canary.canaryEnabled,true);
assert.deepEqual(plain(canary.canaryStatus()),{requested:true,enabled:true,disabledReason:null});

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
    commandCount++;
  }
}
assert.equal(commandCount,9);

{
  const result=canary.resolveTrigger({
    frame:100,
    player:0,
    characterId:'moguzo',
    trigger:'high',
    directions:[]
  });
  assert.equal(result.accepted,true);
  assert.deepEqual(plain(result.decision),{kind:'fallback',fallback:'normal-attack',level:'high'});
}

{
  const move=CURRENT_CONTRACT.bal.CMD.moves.moguzo[0];
  const originalTrigger=move.type==='grab'?'grab':move.trigger;
  const wrongTrigger=['high','mid','low','grab'].find((candidate)=>candidate!==originalTrigger);
  const result=canary.resolveTrigger(decisionPayload('moguzo',move,110,0,wrongTrigger));
  assert.equal(result.accepted,true);
  assert.equal(result.decision.kind,'fallback');
}

{
  const combined=loadApi('?x=1&mamokenShadow=1&mamokenCoreCommand=1');
  assert.equal(combined.requestedShadow,true);
  assert.equal(combined.requestedCanary,true);
  assert.equal(combined.enabled,true);
  assert.equal(combined.canaryEnabled,true);
}

{
  const api=loadApi('?mamokenCoreCommand=1');
  api.disable('forced canary failure');
  assert.equal(api.enabled,false);
  assert.equal(api.canaryEnabled,false);
  assert.equal(api.resolveTrigger({}).accepted,false);
  assert.deepEqual(plain(api.canaryStatus()),{requested:true,enabled:false,disabledReason:'forced canary failure'});
  api.reset();
  assert.equal(api.enabled,true);
  assert.equal(api.canaryEnabled,true);
}

const prototype=readFileSync(path.join(ROOT,'prototype','mamoken_prototype_v01.html'),'utf8');
const dist=readFileSync(path.join(ROOT,'dist','mamoken_mobile.html'),'utf8');
const patcher=readFileSync(path.join(ROOT,'tools','apply_t17_runtime_command_canary.mjs'),'utf8');

for(const source of [prototype,dist]){
  assert.equal((source.match(/\/\* T17 offline runtime command canary \*\//g)||[]).length,1);
  assert.equal((source.match(/const legacyCm=detectCommandMove\(f\);runtimeCommandShadowObserve\(f,c,legacyCm\);/g)||[]).length,2);
  assert.equal((source.match(/const cm=runtimeCommandCanaryResolve\(f,c,legacyCm\);/g)||[]).length,2);
  assert.equal((source.match(/if\(!api\|\|!api\.canaryEnabled\|\|lastMatchOnline\|\|NET\.active\)return legacyCm;/g)||[]).length,1);
  assert.equal((source.match(/api\.resolveTrigger\(\{/g)||[]).length,1);
  assert.equal((source.match(/Core command canary resolved an unknown current move/g)||[]).length,1);
}
assert.ok(prototype.includes('<script src="../runtime/runtime-command-shadow-browser.js"></script>'));
assert.equal(dist.includes('<script src="../runtime/runtime-command-shadow-browser.js"></script>'),false);
assert.ok(dist.includes('runtime-command-shadow-browser-v3'));
assert.ok(dist.includes('mamokenCoreCommand=1'));
assert.ok(patcher.includes("const MARKER='/* T17 offline runtime command canary */'"));
assert.ok(patcher.includes('lastMatchOnline||NET.active'));

assert.equal(/\bfetch\s*\(/.test(browserSource),false);
assert.equal(/localStorage/.test(browserSource),false);
assert.equal(/Date\.|new Date/.test(browserSource),false);

console.log(`runtime command canary tests passed; currentCommands=${commandCount}; defaultOff=true; onlineAuthority=false; rollback=legacy`);
