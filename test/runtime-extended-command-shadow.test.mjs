import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const catalogSource=readFileSync(new URL('../runtime/character-catalog-browser.js',import.meta.url),'utf8');
const extendedSource=readFileSync(new URL('../runtime/runtime-extended-command-shadow-browser.js',import.meta.url),'utf8');
const plain=(value)=>JSON.parse(JSON.stringify(value));

function load(search='?mamokenExtendedShadow=1'){
  const context=vm.createContext({console,location:{search}});
  context.window=context;
  context.globalThis=context;
  vm.runInContext(catalogSource,context,{filename:'character-catalog-browser.js'});
  vm.runInContext(extendedSource,context,{filename:'runtime-extended-command-shadow-browser.js'});
  return context.__MAMOKEN_EXTENDED_COMMAND_SHADOW__;
}

function payload(characterId,move,offset=0,player=0){
  const directions=move.command.directions.map((direction,index)=>({direction,frame:offset+index*2}));
  return{
    frame:directions.length?directions.at(-1).frame+1:offset,
    player,
    characterId,
    trigger:move.command.trigger,
    directions,
  };
}

const api=load();
assert.equal(api.version,'runtime-extended-command-shadow-browser-v1');
assert.equal(api.reportVersion,'mamoken-extended-command-shadow-report-v1');
assert.equal(api.enabled,true);
assert.equal(api.requestedEnabled,true);

const catalogContext=vm.createContext({console,location:{search:'?mamokenExtendedShadow=1'}});
catalogContext.window=catalogContext;
catalogContext.globalThis=catalogContext;
vm.runInContext(catalogSource,catalogContext);
vm.runInContext(extendedSource,catalogContext);
const catalog=catalogContext.__MAMOKEN_CHARACTER_CATALOG__;
const auditApi=catalogContext.__MAMOKEN_EXTENDED_COMMAND_SHADOW__;

const expected={
  'current-parity':9,
  'design-only-candidate':11,
  'longer-design-overrides-current':1,
  'runtime-only':0,
  'catalog-current-only':0,
  'different-current':0,
  'fallback-parity':0,
};
for(const characterId of ['moguzo','pisuke','godan']){
  for(const move of catalog.byId[characterId].moves){
    const result=auditApi.observeTrigger(payload(characterId,move,move.slot*20,move.slot%2));
    assert.equal(result.accepted,true);
    assert.equal(result.observation.catalog.kind,'command');
    assert.equal(result.observation.catalog.commandId,`${characterId}:slot-${move.slot}`);
    assert.equal(result.observation.catalog.name,move.nameJa);
  }
}
const summary=auditApi.summary();
assert.equal(summary.observationCount,21);
assert.equal(summary.conflictCount,1);
assert.deepEqual(plain(summary.classifications),expected);
assert.equal(summary.byCharacter.moguzo.observations,7);
assert.equal(summary.byCharacter.pisuke.observations,7);
assert.equal(summary.byCharacter.godan.observations,7);
assert.equal(summary.byCharacter.pisuke.conflicts,1);
assert.equal(auditApi.conflictCount(),1);

const conflict=auditApi.report().observations.find((item)=>item.classification==='longer-design-overrides-current');
assert.ok(conflict);
assert.equal(conflict.characterId,'pisuke');
assert.equal(conflict.runtime.commandId,'pisuke:slot-1');
assert.equal(conflict.catalog.commandId,'pisuke:slot-7');
assert.equal(conflict.catalog.name,'つむじ返し');

const manual=auditApi.resolveTrigger({
  frame:12,player:0,characterId:'moguzo',trigger:'mid',
  directions:[{direction:'right',frame:0},{direction:'down',frame:1}],
});
assert.equal(manual.accepted,true);
assert.equal(manual.decision.runtime.commandId,'moguzo:slot-1');
assert.equal(manual.decision.catalog.kind,'fallback');
assert.equal(manual.decision.classification,'runtime-only');

const fallback=auditApi.resolveTrigger({frame:0,player:0,characterId:'godan',trigger:'high',directions:[]});
assert.equal(fallback.decision.classification,'fallback-parity');
assert.equal(fallback.decision.runtime.fallback,'normal-attack');

const firstHash=auditApi.hash();
const firstExport=auditApi.exportReport();
const firstReport=JSON.parse(firstExport);
assert.equal(firstReport.diagnosticOnly,true);
assert.deepEqual(firstReport.authority,{runtime:'unchanged-current-9',catalog:'none'});
assert.deepEqual(firstReport.timing,{runtime:'current-compat-24f',catalog:'target-provisional-38f'});
assert.equal(firstReport.summary.observationHash,firstHash);
assert.equal(firstExport.endsWith('\n'),true);
assert.equal(firstExport.includes('localStorage'),false);
assert.equal(firstExport.includes('timestamp'),false);

function recordAll(target){
  for(const characterId of ['moguzo','pisuke','godan'])for(const move of catalog.byId[characterId].moves)target.observeTrigger(payload(characterId,move,move.slot*20,move.slot%2));
}
auditApi.reset();recordAll(auditApi);
assert.equal(auditApi.hash(),firstHash);
assert.equal(auditApi.exportReport(),firstExport);

const snapshot=auditApi.snapshot();
snapshot.observations.length=0;
assert.equal(auditApi.summary().observationCount,21);

assert.throws(()=>auditApi.resolveTrigger({frame:-1,player:0,characterId:'moguzo',trigger:'mid',directions:[]}),/frame/);
assert.throws(()=>auditApi.resolveTrigger({frame:1,player:2,characterId:'moguzo',trigger:'mid',directions:[]}),/player/);
assert.throws(()=>auditApi.resolveTrigger({frame:1,player:0,characterId:'hakuma',trigger:'mid',directions:[]}),/current character/);
assert.throws(()=>auditApi.resolveTrigger({frame:1,player:0,characterId:'moguzo',trigger:'ult',directions:[]}),/trigger/);
assert.throws(()=>auditApi.resolveTrigger({frame:2,player:0,characterId:'moguzo',trigger:'mid',directions:[{direction:'down',frame:2},{direction:'right',frame:1}]}),/frame ordered/);

const disabled=load('');
assert.equal(disabled.enabled,false);
assert.deepEqual(plain(disabled.observeTrigger({frame:0,player:0,characterId:'moguzo',trigger:'mid',directions:[]})),{accepted:false,reason:'disabled'});
assert.equal(disabled.summary().observationCount,0);

const ring=load();
for(let index=0;index<300;index++)ring.observeTrigger({frame:index,player:index%2,characterId:'moguzo',trigger:'mid',directions:[]});
assert.equal(ring.summary().observationCount,256);
assert.equal(ring.snapshot().observations[0].frame,44);

const descriptor=Object.getOwnPropertyDescriptor(catalogContext,'__MAMOKEN_EXTENDED_COMMAND_SHADOW__');
assert.equal(descriptor.writable,false);
assert.equal(descriptor.configurable,true);
for(const forbidden of ['localStorage','sessionStorage','fetch(','XMLHttpRequest','WebSocket','navigator.clipboard','Date.now','performance.now','Math.random']){
  assert.equal(extendedSource.includes(forbidden),false,`forbidden API: ${forbidden}`);
}

const prototype=readFileSync(new URL('../prototype/mamoken_prototype_v01.html',import.meta.url),'utf8');
const dist=readFileSync(new URL('../dist/mamoken_mobile.html',import.meta.url),'utf8');
const build=readFileSync(new URL('../tools/build_mobile.mjs',import.meta.url),'utf8');
const patcher=readFileSync(new URL('../tools/apply_t24_extended_command_shadow.mjs',import.meta.url),'utf8');
for(const source of [prototype,dist]){
  assert.ok(source.includes('/* T24 extended command shadow hook */'));
  assert.ok(source.includes('window.__MAMOKEN_EXTENDED_COMMAND_SHADOW__'));
  assert.ok(source.includes('extended.observeTrigger(payload)'));
}
assert.ok(prototype.includes('<script src="../runtime/runtime-extended-command-shadow-browser.js"></script>'));
assert.equal(dist.includes('<script src="../runtime/runtime-extended-command-shadow-browser.js"></script>'),false);
assert.ok(dist.includes('runtime-extended-command-shadow-browser-v1'));
assert.ok(build.includes('RUNTIME_EXTENDED_SHADOW_JS'));
assert.ok(build.includes('runtimeExtendedShadowSource'));
assert.ok(patcher.includes("const MARKER='/* T24 extended command shadow hook */'"));

console.log(`runtime extended command shadow tests passed; catalog=21; current=9; designOnly=11; conflicts=1; hash=${firstHash}; ring=256`);
