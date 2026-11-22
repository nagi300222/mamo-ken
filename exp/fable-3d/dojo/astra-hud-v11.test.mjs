import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ROSTER} from './balance.js';
import {HUD_THEMES,hudTheme,isSuperReady,chargePips} from './hud-themes.js';
const read=n=>readFileSync(new URL('./'+n,import.meta.url),'utf8');

test('HUDテーマは全9体固有、数値は読取り専用',()=>{
 assert.deepEqual(Object.keys(HUD_THEMES).sort(),Object.keys(ROSTER).sort());
 assert.equal(new Set(Object.values(HUD_THEMES).map(v=>v.mark)).size,9);
 assert.equal(hudTheme('bullet').tone,'amber');
 assert.equal(isSuperReady(99),false);
 assert.equal(isSuperReady(100),true);
 assert.deepEqual(chargePips(2),[true,true,false]);
 assert.deepEqual(chargePips(999),[true,true,true]);
});
test('header contains independent SFX/BGM/FX settings, without changing 6 attack buttons',()=>{
 const html=read('index.html'),main=read('main.js'),css=read('style.css');
 assert.match(html,/popovertarget="av-settings"/);
 for(const id of ['sound-toggle','music-toggle','fx-toggle','hud-side-0','hud-side-1','ultimate-ready-0','ultimate-ready-1','charge-pips-0','charge-pips-1']){
   assert.ok(html.includes('id="'+id+'"'),id);
 }
 const right=html.split('id="buttons-rail"')[1];
 assert.deepEqual([...right.matchAll(/data-control="([^"]+)"/g)].map(x=>x[1]),
 ['weak','strong','throw','gyuiin','special','ultimateButton']);
 assert.match(main,/const effectsAllowed=/);
 assert.match(main,/function showBanner/);
 assert.match(main,/MODEL_ASSETS\[id\]\.portrait/);
 assert.match(css,/#arena \.showtime-banner/);
 assert.match(css,/#av-settings\[popover\]/);
 assert.match(css,/#arena \.charge-pips/);
});
test('Bullet charge pips, Yomikage reticle, FX OFF visual-only',()=>{
 const main=read('main.js'),build=read('build-pages.mjs');
 assert.match(main,/p\.id==='bullet'/);
 assert.match(main,/p\.ability\.charge/);
 assert.match(main,/impactFX\('reticle'/);
 assert.match(main,/visualFXEnabled=!visualFXEnabled/);
 assert.match(main,/actor\?\.illusions\?\.stop\(\)/);
 assert.match(build,/hud-themes\.js/);
});
