import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {UI_ART,UI_ART_VERSION,uiArtUrl} from '../shared-ui/p4-art-map.js';
const source=new URL('../ui-art/v17/',import.meta.url),runtime=new URL('../shared-ui/art/v17/',import.meta.url);
const manifest=JSON.parse(await readFile(new URL('manifest.json',source),'utf8'));
const hash=s=>createHash('sha256').update(s).digest('hex');
test('Claude source art stays intact and all external SVG palettes are explicit',async()=>{
 assert.equal(manifest.assets.length,27);assert.equal(UI_ART_VERSION,manifest.version);
 for(const [id,entry]of Object.entries(UI_ART)){
  const original=await readFile(new URL(entry.sourceFile,source),'utf8'),derived=await readFile(new URL(entry.file,runtime),'utf8');
  assert.equal(hash(original),entry.sourceSHA256,id+' source changed');assert.equal(hash(derived),entry.sha256,id+' runtime changed');
  assert.ok(!/var\(--mk-|currentColor/.test(derived),id+' relies on external CSS inheritance');
  assert.ok(!/<script|<foreignObject|(?:href|src)\s*=\s*["']https?:/i.test(derived),id+' nonlocal active content');
  assert.equal(new URL(uiArtUrl(id)).pathname,new URL(entry.file,runtime).pathname);
 }
 assert.throws(()=>uiArtUrl('not-an-asset'),/Unknown/);
});
test('five modes, nine identities and six controls keep distinct authored art bindings',()=>{
 for(const id of ['versus','practice','arcade','survival','journey'])assert.ok(UI_ART['mode-'+id]);
 const crests=manifest.assets.filter(a=>a.character);assert.equal(crests.length,9);assert.equal(new Set(crests.map(a=>a.file)).size,9);
 for(const id of ['weak','heavy','throw','gyuiin','special','ultimate'])assert.ok(UI_ART['button-'+id]);
 assert.notEqual(UI_ART['button-weak'].sha256,UI_ART['button-heavy'].sha256);
 assert.notEqual(UI_ART['mode-journey'].sha256,UI_ART['mode-journey-paper'].sha256);
});
