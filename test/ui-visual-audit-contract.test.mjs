import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const prototype=readFileSync(new URL('../prototype/mamoken_prototype_v01.html',import.meta.url),'utf8');
const dist=readFileSync(new URL('../dist/mamoken_mobile.html',import.meta.url),'utf8');
const patcher=readFileSync(new URL('../tools/apply_t29_ui_visual_fixes.mjs',import.meta.url),'utf8');
const capture=readFileSync(new URL('../tools/capture_ui_visual_audit.mjs',import.meta.url),'utf8');
const workflow=readFileSync(new URL('../.github/workflows/ui-visual-audit.yml',import.meta.url),'utf8');

for(const source of [prototype,dist]){
  assert.equal((source.match(/\/\* T29 visual audit fixes \*\//g)||[]).length,1);
  assert.ok(source.includes("txt(c.nameJa,W/2,34,30,'#fff')"));
  assert.equal(source.includes("txt(c.name,W/2,34,30,'#fff')"),false);
  assert.ok(source.includes("detailCard(26,y,414,218,'#7fd8ff')"));
  assert.ok(source.includes("txt('総合難度',48,y+198"));
  assert.ok(source.includes("y+=230;"));
  assert.equal(source.includes("detailCard(26,y,414,190,'#7fd8ff')"),false);
  assert.equal(source.includes("txt('総合難度',48,y+174"),false);
}

assert.ok(patcher.includes("const MARKER='/* T29 visual audit fixes */'"));
assert.ok(patcher.includes("c.nameJa"));
assert.ok(patcher.includes("performance card height"));
assert.ok(patcher.includes("difficulty row spacing"));

for(const viewport of ["{id:'320x568',width:320,height:568}","{id:'390x844',width:390,height:844}","{id:'430x932',width:430,height:932}"]){
  assert.ok(capture.includes(viewport),`missing viewport: ${viewport}`);
}
for(const state of ['01-title','02-select-moguzo','03-select-bullet','04-detail-performance','05-detail-moves','06-detail-combos','07-select-hakuma','08-battle-trial','09-pause','10-movelist-trial','11-result-trial']){
  assert.ok(capture.includes(state),`missing capture state: ${state}`);
}
assert.ok(capture.includes("page.on('pageerror'"));
assert.ok(capture.includes("message.type()==='error'"));
assert.ok(capture.includes('screenshots=33')||capture.includes("files.length"));
assert.ok(capture.includes("if(manifest.errors.length)throw new Error"));
assert.ok(workflow.includes('workflow_dispatch:'));
assert.equal(workflow.includes('pull_request:'),false,'heavy browser audit should remain manually triggered');
assert.ok(workflow.includes('playwright@1.55.0'));
assert.ok(workflow.includes('capture_ui_visual_audit.mjs'));
assert.ok(workflow.includes('mamoken-ui-visual-audit'));

for(const forbidden of ['localStorage.setItem','sessionStorage.setItem','new WebSocket(','XMLHttpRequest(']){
  assert.equal(patcher.includes(forbidden),false,`patcher side effect: ${forbidden}`);
  assert.equal(capture.includes(forbidden),false,`capture side effect: ${forbidden}`);
}

console.log('UI visual audit contract tests passed; viewports=3; states=11; screenshots=33; fixedDefects=2; manualWorkflow=true');
