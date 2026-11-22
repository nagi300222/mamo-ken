#!/usr/bin/env node
// 実ゲームの対戦カメラで、通常技クリップを正規化時刻 u で静止させて撮る（接触姿勢の確認・before/after 用）。
// 相手は「reach + hurt radius 0.16m」= その技が当たる最大距離に立たせる。ゲームのソースは変更しない。
//   node pose_shots.mjs --out DIR --contacts normal_contacts.json [--pack DIR] [--ids ..] [--slots ..] [--us 0.1,c,e] [--foe moguzo]
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
import { fileURLToPath } from 'node:url'; import { createRequire } from 'node:module';
const require = createRequire(import.meta.url); const pw = require('playwright');
const HERE = path.dirname(fileURLToPath(import.meta.url)); const REPO = path.resolve(HERE, '../../../../..');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i < 0 ? d : (process.argv[i + 1]?.startsWith('--') || process.argv[i + 1] === undefined ? true : process.argv[i + 1]); };
const ALL = ['moguzo', 'pisuke', 'godan', 'hakuma', 'chirka', 'takimaru', 'yomikage', 'bullet', 'dark_moguzo'];
const SLOTS = String(arg('slots', 'stand_weak,stand_heavy,crouch_weak,crouch_heavy,air_weak,air_heavy')).split(',');
const ids = String(arg('ids', ALL.join(','))).split(','), foe = String(arg('foe', 'moguzo')), us = String(arg('us', 'c')).split(',');
const out = path.resolve(String(arg('out'))), pack = arg('pack', null), C = JSON.parse(fs.readFileSync(String(arg('contacts'))));
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.glb': 'model/gltf-binary', '.jpg': 'image/jpeg', '.png': 'image/png', '.css': 'text/css', '.webp': 'image/webp', '.svg': 'image/svg+xml' };
const srv = await new Promise(res => { const s = http.createServer((q, r) => { let p = path.join(REPO, decodeURIComponent(q.url.split('?')[0])); if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, 'index.html');
  if (!p.startsWith(REPO) || !fs.existsSync(p)) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream', 'cache-control': 'no-store' }); fs.createReadStream(p).pipe(r); }).listen(0, '127.0.0.1', () => res(s)); });
const browser = await pw.chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
for (const id of ids) {
  const ctx = await browser.newContext({ viewport: { width: 852, height: 393 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage(); page.on('pageerror', e => console.log('JS', id, e.message));
  await page.route('**/dojo/cpu.js', r => r.fulfill({ contentType: 'text/javascript', body: 'export function cpuInput(){return {};}\nexport const CPU_LEVELS={};\n' }));
  if (pack) await page.route(/\/normal\/v15\/(\w+)_normals\.glb/, r => { const c = r.request().url().match(/\/(\w+)_normals\.glb/)[1]; r.fulfill({ contentType: 'model/gltf-binary', body: fs.readFileSync(path.join(path.resolve(String(pack)), c + '_normals.glb')) }); });
  await page.clock.install(); await page.goto(`http://127.0.0.1:${srv.address().port}/exp/fable-3d/dojo/`, { waitUntil: 'domcontentloaded' }); await page.waitForFunction(() => window.mamoken3d);
  await page.locator('#selection').waitFor({ state: 'visible' }); await page.selectOption('#cpu-choice', foe).catch(() => {});
  await page.locator('.fighter-card').nth(ALL.indexOf(id)).tap(); await page.locator('#start').tap();
  await page.waitForFunction(id => window.mamoken3d?.actors?.[0]?.id === id && window.mamoken3d?.battle?.frame > 0, id, { timeout: 60000 });
  await page.clock.pauseAt(new Date(Date.now() + 3600e3)); const step = async n => { for (let i = 0; i < n; i++) await page.clock.runFor(16.7); };
  await page.addStyleTag({ content: '#hud,.hud,#touch,.touch,#controls,.controls,#round-message,#note{opacity:0!important}' }).catch(() => {});
  fs.mkdirSync(path.join(out, id), { recursive: true });
  for (const slot of SLOTS) { const c = C[id][slot], air = slot.startsWith('air_'), dist = c.reach + .16;
    for (const uu of us) { const u = uu === 'c' ? c.contact : uu === 'e' ? c.contactEnd : +uu;
      await page.evaluate(([dist, air]) => { const g = mamoken3d.battle, [p, t] = g.fighters; g.time = 70 * 60; for (const f of [p, t]) { f.y = 0; f.vy = 0; f.action = null; f.stun = 0; f.stop = 0; f.state = 'idle'; f.hp = mamoken3d.ROSTER[f.id].hp; } p.x = -dist / 2; t.x = dist / 2; p.facing = 1; t.facing = -1; window.__air = air; }, [dist, air]);
      await step(3);
      await page.evaluate(([name, u, air]) => { const a = mamoken3d.actors[0], act = a.actions[name]; for (const k in a.actions) if (a.actions[k] !== act) a.actions[k].stop();
        act.reset(); act.enabled = true; act.setEffectiveWeight(1); act.setEffectiveTimeScale(1); act.clampWhenFinished = true; act.play(); act.paused = true; act.time = Math.min(act.getClip().duration - 1e-4, u * act.getClip().duration); a.mixer.update(0);
        if (air) { const p = mamoken3d.battle.fighters[0]; p.y = .34; p.vy = .0062; } }, ['v15_' + slot, u, air]);
      await step(1); await page.screenshot({ path: path.join(out, id, `${slot}_${uu}.png`) });
      await page.evaluate(() => { const a = mamoken3d.actors[0]; a.key = ''; const p = mamoken3d.battle.fighters[0]; p.y = 0; p.vy = 0; }); await step(2); } }
  await ctx.close(); console.log(id, 'shots ok');
}
await browser.close(); srv.close();
