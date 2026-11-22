#!/usr/bin/env node
// 実ゲーム（dojo/）を Chromium + WebGL で開き、スマホ横画面 852x393 の対戦カメラのまま
// 必殺 s1/s2/s3 と奥義を 1 戦闘フレームずつ撮る。ゲームのソースは書き換えない。
//   node capture_specials.mjs --out DIR [--ids moguzo,godan] [--moves s1,s2,s3,ultimate] [--v14] [--foe pisuke] [--every 1]
// --v14 : cinematic/v14/<id>/<id>_v14.glb と <id>_v14_motions.json を、通信の差し替えだけで読ませる（新モーションの撮影用）。
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
import { fileURLToPath } from 'node:url'; import { createRequire } from 'node:module';
const require = createRequire(import.meta.url); const pw = require('playwright');
const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../../../../..'); const V14 = path.resolve(HERE, '..');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i < 0 ? d : (process.argv[i + 1]?.startsWith('--') || process.argv[i + 1] === undefined ? true : process.argv[i + 1]); };
const ALL = ['moguzo', 'pisuke', 'godan', 'hakuma', 'chirka', 'takimaru', 'yomikage', 'bullet', 'dark_moguzo'];
const ids = String(arg('ids', ALL.join(','))).split(','), moves = String(arg('moves', 's1,s2,s3,ultimate')).split(',');
const out = path.resolve(String(arg('out', path.join(V14, '_capture')))), useV14 = !!arg('v14', false), foe = String(arg('foe', 'pisuke')), every = +arg('every', 1);
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.glb': 'model/gltf-binary', '.jpg': 'image/jpeg', '.png': 'image/png', '.css': 'text/css', '.webp': 'image/webp', '.svg': 'image/svg+xml' };
const srv = await new Promise(res => { const s = http.createServer((q, r) => { let p = path.join(REPO, decodeURIComponent(q.url.split('?')[0])); if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, 'index.html');
  if (!p.startsWith(REPO) || !fs.existsSync(p)) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream', 'cache-control': 'no-store' }); fs.createReadStream(p).pipe(r); }).listen(0, '127.0.0.1', () => res(s)); });
const base = `http://127.0.0.1:${srv.address().port}/exp/fable-3d/dojo/`;
const browser = await pw.chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
const log = [];
for (const id of ids) {
  const ctx = await browser.newContext({ viewport: { width: 852, height: 393 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  const page = await ctx.newPage(); page.on('pageerror', e => console.log('JS', e.message));
  // CPU を無入力にする（相手は立ったまま。技の見た目だけを撮るため）。ゲームのファイルは変えず、通信だけ差し替える。
  await page.route('**/dojo/cpu.js', r => r.fulfill({ contentType: 'text/javascript', body: 'export function cpuInput(){return {};}\nexport const CPU_LEVELS={};\n' }));
  if (useV14) {
    await page.route(/\/chars\/(\w+)\/\1\.glb/, (r) => { const c = r.request().url().match(/\/chars\/(\w+)\//)[1]; const f = path.join(V14, c, c + '_v14.glb'); fs.existsSync(f) ? r.fulfill({ contentType: 'model/gltf-binary', body: fs.readFileSync(f) }) : r.continue(); });
    await page.route(/\/chars\/(\w+)\/\1_motions\.json/, (r) => { const c = r.request().url().match(/\/chars\/(\w+)\//)[1]; const f = path.join(V14, c, c + '_v14_motions.json'); fs.existsSync(f) ? r.fulfill({ contentType: 'application/json', body: fs.readFileSync(f) }) : r.continue(); });
  }
  await page.clock.install();
  await page.goto(base, { waitUntil: 'domcontentloaded' }); await page.waitForFunction(() => window.mamoken3d);
  await page.locator('#selection').waitFor({ state: 'visible' });
  await page.selectOption('#cpu-choice', foe).catch(() => {});
  await page.locator('.fighter-card').nth(ALL.indexOf(id)).tap(); await page.locator('#start').tap();
  await page.waitForFunction(id => window.mamoken3d?.actors?.[0]?.id === id && window.mamoken3d?.battle?.frame > 0, id, { timeout: 40000 });
  await page.clock.pauseAt(new Date(Date.now() + 3600e3));
  const step = async (n = 1) => { for (let i = 0; i < n; i++) await page.clock.runFor(16.7); };
  for (const mv of moves) {
    const dir = path.join(out, id, mv); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
    // 立ち位置を決めて両者を素の構えに戻す
    const info = await page.evaluate(async ({ mv }) => {
      const B = await import('./balance.js'); const g = window.mamoken3d.battle, p = g.fighters[0], t = g.fighters[1];
      const m = mv === 'ultimate' ? B.ultimateMove(p.id) : B.specialMove(p.id, +mv[1] - 1);
      const dist = m.kind === 'projectile' ? 1.25 : Math.max(.34, (m.reach || .4) * .82 + (m.travel || 0) * .9);
      g.time = 70 * 60; g.projectiles.length = 0;
      for (const f of [p, t]) { f.y = 0; f.vy = 0; f.action = null; f.frame = 0; f.stun = 0; f.stop = 0; f.dashF = 0; f.hp = ROSTER_HP(f); f.state = 'idle'; }
      function ROSTER_HP(f) { return window.mamoken3d.ROSTER[f.id].hp; }
      p.x = -dist / 2; t.x = dist / 2; p.super = 100; p.drive = 100; if (p.ability) { p.ability.armorCooldown = 0; }
      return { name: m.name, kind: m.kind, startup: m.startup, active: m.active, recovery: m.recovery, dist };
    }, { mv });
    await step(24);                                    // 構えで落ち着かせる（カメラの追従も含む）
    await page.evaluate(async ({ mv }) => { const B = await import('./balance.js'); const g = window.mamoken3d.battle, p = g.fighters[0];
      const m = mv === 'ultimate' ? B.ultimateMove(p.id) : B.specialMove(p.id, +mv[1] - 1); p.super = 100; window.__ok = g._begin(p, { ...m }, mv); }, { mv });
    const total = info.startup + info.active + info.recovery; let n = 0, movie = false; const tail = info.kind === 'projectile' ? 46 : 26;
    for (let f = 0; f < total + tail + (movie ? 400 : 0) && n < 420; f++) {
      await step(1);
      const st = await page.evaluate(() => ({ f: mamoken3d.battle.frame, movie: mamoken3d.cinematic.active, clip: mamoken3d.actors[0].currentName, foe: mamoken3d.actors[1].currentName, hp: mamoken3d.battle.fighters[1].hp }));
      if (st.movie) movie = true; else if (movie && f > total + tail) break;
      if (f % every === 0) await page.screenshot({ path: path.join(dir, String(n++).padStart(4, '0') + '.png') });
      if (f === info.startup + 1) info.clip = st.clip, info.foeClip = st.foe;
      info.hpAfter = st.hp;
    }
    info.frames = n; info.movie = movie; log.push({ id, mv, ...info }); console.log(id, mv, JSON.stringify(info));
    if (movie) await page.evaluate(() => document.querySelector('#cinematic-skip')?.click());
    await step(30);
  }
  await ctx.close();
}
fs.writeFileSync(path.join(out, 'capture_log.json'), JSON.stringify({ v14: useV14, foe, viewport: [852, 393], log }, null, 1));
await browser.close(); srv.close();
