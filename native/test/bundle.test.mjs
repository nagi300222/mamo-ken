import test from 'node:test';import assert from 'node:assert/strict';import {readFile,access} from 'node:fs/promises';
const native=new URL('../',import.meta.url),repo=new URL('../',native),web=new URL('www/',native);
let built=true;try{await access(new URL('index.html',web));}catch{built=false;}
test('installed app bundles local models and scripts without a remote application server',{skip:!built},async()=>{
 for(const path of ['index.html','dojo/index.html','story/index.html']){
  const html=await readFile(new URL(path,web),'utf8');assert.equal((html.match(/src="\/native-runtime\.js"/g)??[]).length,1);assert.ok(!/<script[^>]+src=["']https?:/i.test(html));
  assert.equal((html.match(/href="\/native-layout\.css"/g)??[]).length,1);
  assert.ok(html.indexOf('href="/native-layout.css"')>html.lastIndexOf('<style'),'Native layout precedes an inline web style');
  const links=[...html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*>/g)];assert.match(links.at(-1)[0],/href="\/native-layout\.css"/,'A later web stylesheet can override native notch protection');
  const original=await readFile(new URL('exp/fable-3d/_pages/'+path,repo),'utf8');
  assert.equal(html.replace('<script src="/native-runtime.js"></script>','').replace('<link rel="stylesheet" href="/native-layout.css">',''),original,'Native packing rewrote existing web markup/styles: '+path);
 }
 for(const id of ['moguzo','pisuke','godan','hakuma','chirka','takimaru','yomikage','bullet','dark_moguzo']){
  const original=await readFile(new URL(`exp/fable-3d/chars/${id}/${id}.glb`,repo)),bundled=await readFile(new URL(`chars/${id}/${id}.glb`,web));assert.deepEqual(bundled,original,'original rig changed in native bundle: '+id);
  await access(new URL(`normal/v15/${id}_normals.glb`,web));await access(new URL(`presentation/v151/${id}_victory.glb`,web));await access(new URL(`custom/v16/assets/${id}_parts.glb`,web));
 }
});
test('native layout asset stays identical to its editable source',{skip:!built},async()=>{
 assert.deepEqual(await readFile(new URL('native-layout.css',web)),await readFile(new URL('runtime/native-layout.css',native)));
});
