import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { frameTargets } from './camera-frame.js';
const read=(n)=>readFileSync(new URL('./'+n,import.meta.url),'utf8');
const html=read('index.html'),style=read('style.css'),main=read('main.js');
test('Astra HUDを追加してもv0.3の3D対戦canvasは全領域を使用',()=>{
  assert.match(html,/id="combat-layout"/);
  assert.ok(html.indexOf('id="stick-rail"')<html.indexOf('id="arena"'));
  assert.ok(html.indexOf('id="buttons-rail"')>html.indexOf('id="stage"'));
  assert.ok(html.indexOf('id="stage"')<html.search(/<div\b[^>]*class="[^"]*\bhud\b[^"]*"/),'HUD remains overlay after canvas');
  assert.match(style,/#arena>\.hud\s*\{\s*position:absolute/);
  assert.match(main,/import \{ frameTargets \} from '\.\/camera-frame\.js'/);
  assert.match(main,/updateCamera\(\);\s*renderer\.render\(scene,camera\)/);
  const view=frameTargets([{x:-.7,y:0},{x:.7,y:0}],1.3);
  assert.ok(view.halfWidth<1.7);
});
test('HUDに体力、ドライブ、奥義それぞれの名称・数値',()=>{
  for(const n of [0,1])for(const label of ['hp','meter','drive','drive-value','super-value','ability','name']){
    assert.equal((html.match(new RegExp('id="'+label+'-'+n+'"','g'))||[]).length,1,label+' '+n);
  }
  assert.match(main,/function showDriveStatus\(move\)/);
  assert.match(main,/driveStatus\(move,/);
});
test('技表は対戦画面から撤去してヘッダーの開閉に移した',()=>{
  assert.match(html,/<button[^>]*popovertarget="commands-help"/);
  assert.match(html,/<div id="commands-help" popover>/);
  assert.equal((html.match(/id="commands-help"/g)||[]).length,1);
  assert.match(html,/236236/);
  assert.ok(!html.includes('class="commands-help"'));
});
test('右側6ボタン。ギュイーンと↓+必殺の咆哮は発動状態を読み上げ可能',()=>{
  const rightControls=html.split('id="buttons-rail"')[1]||'';
  assert.deepEqual([...rightControls.matchAll(/data-control="([^"]+)"/g)].map(x=>x[1]),
    ['weak','strong','throw','gyuiin','special','ultimateButton']);
  for(const k of ['roar','gyuiin']){
    assert.match(html,new RegExp('id="'+k+'-status"'));
    assert.match(main,/button\.setAttribute\('aria-label'/);
  }
});
test('咆哮とギュイーンの演出・決着理由を明確に表示',()=>{
  for(const name of ['roar_counter','roar_clash','gyuiin_start','gyuiin_break','block','hit']){
    assert.match(main,new RegExp(name));
  }
  for(const token of ['RingGeometry','OctahedronGeometry','result-reason','時間切れ','ダブルKO']){
    assert.ok(main.includes(token)||html.includes(token));
  }
});
test('Codexの入力保持・ヒットストップ修正は上書きされていない',()=>{
  assert.match(main,/directionSamples\.splice\(0\)/);
  assert.match(main,/queuedActions\.clear\(\)/);
  assert.match(main,/Promise\.allSettled/);
  assert.match(main,/function updateCamera/);
  assert.match(main,/battle\.tick\(input\(\)\)/);
});
