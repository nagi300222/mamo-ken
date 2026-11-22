#!/usr/bin/env node
// マモ拳 v15.1 通常技監査 — 実ゲーム（dojo/）を Chromium + WebGL で開き、9体×6通常技を対戦カメラ（横画面 852x393）のまま再生して、
//   (1) 空振り計測: 毎戦闘フレームのスキン後頂点から「どの部位が・どの高さで・どこまで前へ出ているか」を実測
//   (2) 最大間合いヒット撮影: Battle が当たると判定する最大距離（reach+0.16）に相手を置き、ヒットストップで止まる接触姿勢を撮影
// を行う。ゲームのソースは書き換えない（CPU を無入力にする通信差し替えのみ）。
//   node measure_normals.mjs --out DIR [--ids moguzo,godan] [--foe moguzo] [--pack DIR]   (--pack: normal/v15 の代わりに読ませる通常技パックの場所)
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
import { fileURLToPath } from 'node:url'; import { createRequire } from 'node:module';
const require = createRequire(import.meta.url); const pw = require('playwright');
const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../../../../..');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i < 0 ? d : (process.argv[i + 1]?.startsWith('--') || process.argv[i + 1] === undefined ? true : process.argv[i + 1]); };
const ALL = ['moguzo', 'pisuke', 'godan', 'hakuma', 'chirka', 'takimaru', 'yomikage', 'bullet', 'dark_moguzo'];
const SLOTS = ['stand_weak', 'stand_heavy', 'crouch_weak', 'crouch_heavy', 'air_weak', 'air_heavy'];
const ids = String(arg('ids', ALL.join(','))).split(','), foe = String(arg('foe', 'moguzo'));
const out = path.resolve(String(arg('out', path.join(HERE, '../audit/v15')))), pack = arg('pack', null);
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.glb': 'model/gltf-binary', '.jpg': 'image/jpeg', '.png': 'image/png', '.css': 'text/css', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav' };
const srv = await new Promise(res => { const s = http.createServer((q, r) => { let p = path.join(REPO, decodeURIComponent(q.url.split('?')[0])); if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, 'index.html');
  if (!p.startsWith(REPO) || !fs.existsSync(p)) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream', 'cache-control': 'no-store' }); fs.createReadStream(p).pipe(r); }).listen(0, '127.0.0.1', () => res(s)); });
const base = `http://127.0.0.1:${srv.address().port}/exp/fable-3d/dojo/`;
const browser = await pw.chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
fs.mkdirSync(out, { recursive: true });

// ページ内: スキン後の頂点を部位ごとに集計する
const IN_PAGE = () => {
  const part = n => { const s = n.toLowerCase(); const side = /(_l|\.l|l)$/.test(s) ? 'L' : /(_r|\.r|r)$/.test(s) ? 'R' : '';
    if (/paw|hand|wrist|elbow|shoulder|clav|forearm|upperarm|arm/.test(s)) return 'arm' + side; if (/foot|shin|thigh|knee|ankle|leg|toe/.test(s)) return 'leg' + side;
    if (/tail/.test(s)) return 'tail'; if (/head|jaw|ear|neck|snout|nose|beak/.test(s)) return 'head'; return 'body'; };
  window.__prep = (ai) => { const a = mamoken3d.actors[ai]; if (a.__m) return; const ms = [];
    a.gltf.scene.traverse(o => { if (!o.isSkinnedMesh) return; const g = o.geometry, si = g.attributes.skinIndex, sw = g.attributes.skinWeight, n = g.attributes.position.count; const grp = new Array(n), bone = new Array(n);
      for (let i = 0; i < n; i++) { let b = 0, w = -1; for (let k = 0; k < 4; k++) { const x = sw.getComponent(i, k); if (x > w) { w = x; b = si.getComponent(i, k); } } bone[i] = o.skeleton.bones[b].name; grp[i] = part(bone[i]); }
      ms.push({ o, n, grp, bone }); });
    a.__m = ms; a.__v = new (ms[0].o.position.constructor)(); };
  // 攻撃側の前方向 = facing。px は足元の x。戻り値: 部位ごとの最前頂点 {fwd, y, bone}
  window.__ext = (ai, bins) => { const a = mamoken3d.actors[ai], p = mamoken3d.battle.fighters[ai], v = a.__v, r = {}; const prof = bins ? new Array(20).fill(-9) : null; let top = 0;
    a.gltf.scene.updateMatrixWorld(true);
    for (const m of a.__m) for (let i = 0; i < m.n; i += 2) { m.o.getVertexPosition(i, v); v.applyMatrix4(m.o.matrixWorld); const f = (v.x - p.x) * p.facing, g = m.grp[i];
      const c = r[g]; if (!c || f > c.fwd) r[g] = { fwd: f, y: v.y - p.y, bone: m.bone[i] };
      const lo = r[g + '_lo']; if (!lo || v.y < lo.y) r[g + '_lo'] = { y: v.y, fwd: f };
      if (prof) { const b = Math.max(0, Math.min(19, Math.floor((v.y - p.y) / .05))); if (f > prof[b]) prof[b] = f; if (v.y - p.y > top) top = v.y - p.y; } }
    for (const k in r) { r[k].fwd = +r[k].fwd.toFixed(3); r[k].y = +r[k].y.toFixed(3); }
    return prof ? { r, prof: prof.map(x => +x.toFixed(3)), top: +top.toFixed(3) } : r; };
  window.__reset = (dist) => { const g = mamoken3d.battle, [p, t] = g.fighters; g.time = 70 * 60; g.projectiles.length = 0;
    for (const f of [p, t]) { f.y = 0; f.vy = 0; f.airVX = 0; f.action = null; f.frame = 0; f.stun = 0; f.stop = 0; f.dashF = 0; f.landF = 0; f.hp = mamoken3d.ROSTER[f.id].hp; f.state = 'idle'; f.chainWeakCount = 0; }
    p.x = -dist / 2; t.x = dist / 2; p.facing = 1; t.facing = -1; };
  window.__begin = async (slot) => { const B = await import('./balance.js'); const g = mamoken3d.battle, p = g.fighters[0]; const m = B.normalMove(p.id, slot); const ok = g._begin(p, { ...m }, slot); return { ok, startup: m.startup, active: m.active, recovery: m.recovery, reach: m.reach, damage: m.damage }; };
  window.__jump = () => { const g = mamoken3d.battle, p = g.fighters[0]; p.vy = mamoken3d.ROSTER[p.id].jump; p.y = .006; p.airVX = 0; };
  window.__st = () => { const g = mamoken3d.battle, [p, t] = g.fighters; return { f: p.frame, act: p.action?.id || null, stop: p.stop, y: +p.y.toFixed(3), vy: +p.vy.toFixed(4), x: +p.x.toFixed(3), tx: +t.x.toFixed(3), thp: t.hp, clip: mamoken3d.actors[0].currentName, foeClip: mamoken3d.actors[1].currentName }; };
};

const result = {};
for (const id of ids) {
  const ctx = await browser.newContext({ viewport: { width: 852, height: 393 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage(); page.on('pageerror', e => console.log('JS', id, e.message));
  await page.route('**/dojo/cpu.js', r => r.fulfill({ contentType: 'text/javascript', body: 'export function cpuInput(){return {};}\nexport const CPU_LEVELS={};\n' }));
  if (pack) await page.route(/\/normal\/v15\/(\w+)_normals\.glb/, r => { const c = r.request().url().match(/\/(\w+)_normals\.glb/)[1]; r.fulfill({ contentType: 'model/gltf-binary', body: fs.readFileSync(path.join(path.resolve(String(pack)), c + '_normals.glb')) }); });
  await page.clock.install();
  await page.goto(base, { waitUntil: 'domcontentloaded' }); await page.waitForFunction(() => window.mamoken3d);
  await page.locator('#selection').waitFor({ state: 'visible' });
  await page.selectOption('#cpu-choice', foe).catch(() => {});
  await page.locator('.fighter-card').nth(ALL.indexOf(id)).tap(); await page.locator('#start').tap();
  await page.waitForFunction(id => window.mamoken3d?.actors?.[0]?.id === id && window.mamoken3d?.battle?.frame > 0, id, { timeout: 60000 });
  await page.clock.pauseAt(new Date(Date.now() + 3600e3));
  const step = async (n = 1) => { for (let i = 0; i < n; i++) await page.clock.runFor(16.7); };
  await page.evaluate(IN_PAGE); await page.evaluate(() => { __prep(0); __prep(1); });
  const R = result[id] = { foe, moves: {} };
  // 構え（idle）の体表プロファイル: 高さ 5cm 刻みの最前面。相手として立ったときの「当たる面」になる。
  await page.evaluate(() => __reset(1.8)); await step(30);
  R.idle = await page.evaluate(() => __ext(0, true));
  const dir = path.join(out, id); fs.mkdirSync(dir, { recursive: true });
  for (const slot of SLOTS) {
    const air = slot.startsWith('air_');
    const startAir = async () => { if (!air) return; await page.evaluate(() => __jump()); for (let i = 0; i < 80; i++) { await step(1); const s = await page.evaluate(() => __st()); if (s.vy <= .012) break; } };
    // ---- (1) 空振り計測 ----
    await page.evaluate(() => __reset(1.8)); await step(26); await startAir();
    const info = await page.evaluate(s => __begin(s), slot); const total = info.startup + info.active + info.recovery; const frames = [];
    for (let f = 0; f < total + 4; f++) { await step(1); const st = await page.evaluate(() => __st()); const ex = await page.evaluate(() => __ext(0)); frames.push({ ...st, ex }); if (!st.act && f > 3) break; }
    // ---- (2) 最大間合いでヒットさせて、ヒットストップの接触姿勢を撮る ----
    const D = +(info.reach + .16 - .012).toFixed(3);
    await page.evaluate(d => __reset(d), D); await step(26); await startAir();
    await page.evaluate(s => __begin(s), slot); let hit = null; const hp0 = (await page.evaluate(() => __st())).thp;
    for (let f = 0; f < total + 4; f++) { await step(1); const st = await page.evaluate(() => __st());
      if (st.thp < hp0) { await step(2); const s2 = await page.evaluate(() => __st()); const ex = await page.evaluate(() => __ext(0)); const fex = await page.evaluate(() => __ext(1, true));
        hit = { frame: st.f, dist: +(s2.tx - s2.x).toFixed(3), y: s2.y, ex, foeProf: fex.prof, foeClip: s2.foeClip }; await page.screenshot({ path: path.join(dir, slot + '_hit.png') }); break; } }
    if (!hit) await page.screenshot({ path: path.join(dir, slot + '_nohit.png') });
    R.moves[slot] = { ...info, D, frames, hit };
    console.log(id, slot, 'S/A/R', info.startup, info.active, info.recovery, 'reach', info.reach, hit ? 'hit@' + hit.frame : 'NO HIT');
  }
  await ctx.close();
  fs.writeFileSync(path.join(out, id + '.json'), JSON.stringify(R));
}
await browser.close(); srv.close();
