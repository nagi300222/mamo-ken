import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import {
  buildCore3CommandCatalogContract,
  hashCore3CommandCatalog,
} from '../src/core/index.ts';

const source=readFileSync(new URL('../runtime/character-catalog-browser.js',import.meta.url),'utf8');
const context=vm.createContext({});
context.window=context;
context.globalThis=context;
vm.runInContext(source,context,{filename:'character-catalog-browser.js'});
const browser=context.__MAMOKEN_CHARACTER_CATALOG__;
const browserContract=JSON.parse(JSON.stringify(browser.commandContract));
const coreContract=buildCore3CommandCatalogContract();
const corePlain=JSON.parse(JSON.stringify(coreContract));

assert.equal(browserContract.version,'core3-command-catalog-v1');
assert.equal(browserContract.priorityPolicy,'longest-command-first');
assert.equal(browserContract.hash,hashCore3CommandCatalog(coreContract));
assert.deepEqual({...browserContract,hash:undefined},{...corePlain,hash:undefined});
assert.equal(browserContract.definitions.length,21);
assert.equal(browserContract.definitions.filter((definition)=>definition.source==='current_impl').length,9);
assert.equal(browserContract.definitions.filter((definition)=>definition.source==='design_confirmed').length,12);
assert.deepEqual(browserContract.overlaps.map((overlap)=>[overlap.shorterId,overlap.longerId]),[
  ['pisuke:slot-1','pisuke:slot-7'],
  ['godan:slot-4','godan:slot-7'],
]);
assert.deepEqual(browserContract.timingProfiles.current,corePlain.timingProfiles.current);
assert.deepEqual(browserContract.timingProfiles.target,corePlain.timingProfiles.target);
assert.equal(Object.isFrozen(browser.commandContract),true);
assert.equal(Object.isFrozen(browser.commandContract.definitions),true);
assert.equal(Object.isFrozen(browser.commandContract.definitions[0]),true);
assert.equal(Object.isFrozen(browser.commandContract.timingProfiles.target),true);
assert.equal(Object.isFrozen(browser.commandContract.overlaps[0]),true);
assert.throws(()=>{browser.commandContract.definitions.push({});},TypeError);
assert.throws(()=>{browser.commandContract.priorityPolicy='shortest-first';},TypeError);

const descriptor=Object.getOwnPropertyDescriptor(context,'__MAMOKEN_CHARACTER_CATALOG__');
assert.equal(descriptor.writable,false);
assert.equal(descriptor.configurable,false);
for(const forbidden of ['Math.random','Date.now','performance.now','localStorage','sessionStorage','fetch(','XMLHttpRequest','WebSocket']){
  assert.equal(source.includes(forbidden),false,`forbidden API: ${forbidden}`);
}

console.log(`browser command contract tests passed; definitions=21; overlaps=2; currentProfile=${browserContract.timingProfiles.current.id}; targetProfile=${browserContract.timingProfiles.target.id}; hash=${browserContract.hash}`);