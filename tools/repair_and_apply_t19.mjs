import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const self=fileURLToPath(import.meta.url);
const target=path.join(path.dirname(self),'apply_t19_offline_core_default.mjs');
let source=readFileSync(target,'utf8');
const oldLine=`  text=replaceOnce(text,"  assert.equal(api.canaryEnabled,false);\\n  assert.equal(api.resolveTrigger({}).accepted,false);","  assert.equal(api.canaryEnabled,true);\\n  assert.equal(api.offlineAuthority,'core-default');",'canary test shadow-only authority');`;
const newLine=`  text=replaceOnce(text,"{\\n  const api=loadApi('?mamokenShadow=1');\\n  assert.equal(api.requestedShadow,true);\\n  assert.equal(api.requestedCanary,false);\\n  assert.equal(api.enabled,true);\\n  assert.equal(api.canaryEnabled,false);\\n  assert.equal(api.resolveTrigger({}).accepted,false);\\n}","{\\n  const api=loadApi('?mamokenShadow=1');\\n  assert.equal(api.requestedShadow,true);\\n  assert.equal(api.requestedCanary,false);\\n  assert.equal(api.enabled,true);\\n  assert.equal(api.canaryEnabled,true);\\n  assert.equal(api.offlineAuthority,'core-default');\\n}",'canary test shadow-only authority');`;
const count=source.split(oldLine).length-1;
if(count!==1)throw new Error(`repair anchor expected once, found ${count}`);
source=source.replace(oldLine,newLine);
writeFileSync(target,source,'utf8');
unlinkSync(self);
await import(`${pathToFileURL(target).href}?repaired=1`);
