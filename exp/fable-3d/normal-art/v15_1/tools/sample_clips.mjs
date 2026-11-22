#!/usr/bin/env node
// マモ拳 v15.1 — 通常技クリップを「クリップ正規化時刻 u=0..1」で直接サンプルし、部位ごとの前方到達距離の曲線を取る。
// Codex の区間写像（ゲーム startup → source contact、startup+active-1 → contactEnd）に渡す contact / contactEnd / reach を決めるための実測。
// 実ゲームのページ上で、実際に読み込まれた元GLBのスキンメッシュ + 通常技パックのアクションをそのまま使う（ゲームのソースは変更しない）。
//   node sample_clips.mjs --out DIR [--ids ...] [--pack DIR] [--n 40]
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
import { fileURLToPath } from 'node:url'; import { createRequire } from 'node:module';
const require = createRequire(import.meta.url); const pw = require('playwright');
const HERE = path.dirname(fileURLToPath(import.meta.url)); const REPO = path.resolve(HERE, '../../../../..');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i < 0 ? d : (process.argv[i + 1]?.startsWith('--') || process.argv[i + 1] === undefined ? true : process.argv[i + 1]); };
const ALL = ['moguzo', 'pisuke', 'godan', 'hakuma', 'chirka', 'takimaru', 'yomikage', 'bullet', 'dark_moguzo'];
const SLOTS = ['stand_weak', 'stand_heavy', 'crouch_weak', 'crouch_heavy', 'air_weak', 'air_heavy'];
const ids = String(arg('ids', ALL.join(','))).split(','), N = +arg('n', 40);
const out = path.resolve(String(arg('out', path.join(HERE, '../audit/v15')))), pack = arg('pack', null), shots = !!arg('shots', false);
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.glb': 'model/gltf-binary', '.jpg': 'image/jpeg', '.png': 'image/png', '.css': 'text/css', '.webp': 'image/webp', '.svg': 'image/svg+xml' };
const srv = await new Promise(res => { const s = http.createServer((q, r) => { let p = path.join(REPO, decodeURIComponent(q.url.split('?')[0])); if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, 'index.html');
  if (!p.startsWith(REPO) || !fs.existsSync(p)) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream', 'cache-control': 'no-store' }); fs.createReadStream(p).pipe(r); }).listen(0, '127.0.0.1', () => res(s)); });
const base = `http://127.0.0.1:${srv.address().port}/exp/fable-3d/dojo/`;
const browser = await pw.chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
fs.mkdirSync(out, { recursive: true });
const IN_PAGE = () => {
  const part = n => { const s = n.toLowerCase(); const side = /(_l|\.l)$/.test(s) || /[a-z]L$/.test(n) ? 'L' : /(_r|\.r)$/.test(s) || /[a-z]R$/.test(n) ? 'R' : '';
    if (/paw|hand|wrist|elbow|shoulder|clav|forearm|upper_?arm|arm/.test(s)) return 'arm' + side; if (/foot|shin|thigh|knee|ankle|leg|toe/.test(s)) return 'leg' + side;
    if (/tail/.test(s)) return 'tail'; if (/head|jaw|ear|neck|snout|nose|beak/.test(s)) return 'head'; return 'body'; };
  window.__prep = () => { const a = mamoken3d.actors[0]; const ms = [];
    a.gltf.scene.traverse(o => { if (!o.isSkinnedMesh) return; const g = o.geometry, si = g.attributes.skinIndex, sw = g.attributes.skinWeight, n = g.attributes.position.count; const grp = new Array(n), bone = new Array(n);
      for (let i = 0; i < n; i++) { let b = 0, w = -1; for (let k = 0; k < 4; k++) { const x = sw.getComponent(i, k); if (x > w) { w = x; b = si.getComponent(i, k); } } bone[i] = o.skeleton.bones[b].name; grp[i] = part(bone[i]); }
      ms.push({ o, n, grp, bone }); });
    a.__m = ms; a.__v = new (ms[0].o.position.constructor)(); };
  // クリップ name を正規化時刻 u で静止させ、足元 x からの前方距離を部位別に測る（y は床からの高さ。root の上下移動込み）
  window.__sample = (name, u) => { const a = mamoken3d.actors[0], p = mamoken3d.battle.fighters[0], act = a.actions[name]; if (!act) return null;
    for (const k in a.actions) if (a.actions[k] !== act) a.actions[k].stop();
    act.reset(); act.enabled = true; act.setEffectiveWeight(1); act.setEffectiveTimeScale(1); act.clampWhenFinished = true; act.play(); act.paused = true; const d = act.getClip().duration; act.time = Math.min(d - 1e-4, u * d); a.mixer.update(0);
    a.holder.position.set(p.x, 0, 0); a.holder.updateMatrixWorld(true); const v = a.__v, r = {};
    for (const m of a.__m) for (let i = 0; i < m.n; i++) { m.o.getVertexPosition(i, v); v.applyMatrix4(m.o.matrixWorld); const f = (v.x - p.x) * p.facing, g = m.grp[i];
      const c = r[g]; if (!c || f > c[0]) r[g] = [f, v.y, m.bone[i], v.z];
      const lo = r[g + '_lo']; if (!lo || v.y < lo[1]) r[g + '_lo'] = [f, v.y]; }
    for (const k in r) { r[k][0] = +r[k][0].toFixed(3); r[k][1] = +r[k][1].toFixed(3); if (r[k][3] !== undefined) r[k][3] = +r[k][3].toFixed(3); }
    return { dur: +d.toFixed(4), r }; };
  // 被弾範囲: クリップ name の u で、体幹（body+head+leg。腕と尾は除く）の頂点高さの分布を返す。root（足元）基準。
  window.__bounds = (name, u) => { const a = mamoken3d.actors[0], p = mamoken3d.battle.fighters[0], act = a.actions[name]; if (!act) return null;
    for (const k in a.actions) if (a.actions[k] !== act) a.actions[k].stop();
    act.reset(); act.enabled = true; act.setEffectiveWeight(1); act.setEffectiveTimeScale(1); act.clampWhenFinished = true; act.play(); act.paused = true; const d = act.getClip().duration; act.time = Math.min(d - 1e-4, u * d); a.mixer.update(0);
    a.holder.position.set(p.x, 0, 0); a.holder.updateMatrixWorld(true); const v = a.__v, ys = [], fw = [];
    for (const m of a.__m) for (let i = 0; i < m.n; i++) { if (/^(arm|tail)/.test(m.grp[i])) continue; m.o.getVertexPosition(i, v); v.applyMatrix4(m.o.matrixWorld); ys.push(v.y); fw.push((v.x - p.x) * p.facing); }
    ys.sort((x, y) => x - y); fw.sort((x, y) => x - y); const q = (A, f) => +A[Math.min(A.length - 1, Math.floor(f * A.length))].toFixed(3);
    return { n: ys.length, min: q(ys, 0), p01: q(ys, .01), p98: q(ys, .98), p995: q(ys, .995), max: q(ys, .9999), back: q(fw, .01), front: q(fw, .99) }; };
};
for (const id of ids) {
  const ctx = await browser.newContext({ viewport: { width: 852, height: 393 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage(); page.on('pageerror', e => console.log('JS', id, e.message));
  await page.route('**/dojo/cpu.js', r => r.fulfill({ contentType: 'text/javascript', body: 'export function cpuInput(){return {};}\nexport const CPU_LEVELS={};\n' }));
  if (pack) await page.route(/\/normal\/v15\/(\w+)_normals\.glb/, r => { const c = r.request().url().match(/\/(\w+)_normals\.glb/)[1]; r.fulfill({ contentType: 'model/gltf-binary', body: fs.readFileSync(path.join(path.resolve(String(pack)), c + '_normals.glb')) }); });
  await page.clock.install();
  await page.goto(base, { waitUntil: 'domcontentloaded' }); await page.waitForFunction(() => window.mamoken3d);
  await page.locator('#selection').waitFor({ state: 'visible' });
  await page.selectOption('#cpu-choice', 'moguzo').catch(() => {});
  await page.locator('.fighter-card').nth(ALL.indexOf(id)).tap(); await page.locator('#start').tap();
  await page.waitForFunction(id => window.mamoken3d?.actors?.[0]?.id === id && window.mamoken3d?.battle?.frame > 0, id, { timeout: 60000 });
  await page.clock.pauseAt(new Date(Date.now() + 3600e3));
  for (let i = 0; i < 30; i++) await page.clock.runFor(16.7);
  await page.evaluate(IN_PAGE); await page.evaluate(() => { const g = mamoken3d.battle, [p, t] = g.fighters; p.x = -.9; t.x = .9; __prep(); });
  const R = {};
  if (!process.argv.includes('--bounds-only')) for (const slot of SLOTS) for (const pre of ['v15_', '']) {
    const name = pre ? 'v15_' + slot : { stand_weak: 'stand_light', stand_heavy: 'stand_heavy', crouch_weak: 'crouch_light', crouch_heavy: 'crouch_heavy', air_weak: 'air_light', air_heavy: 'air_heavy' }[slot];
    const s = []; for (let i = 0; i <= N; i++) s.push(await page.evaluate(([n, u]) => __sample(n, u), [name, i / N]));
    R[(pre ? 'new:' : 'src:') + slot] = { clip: name, dur: s[0]?.dur, samples: s.map(x => x?.r) };
  }
  const names = await page.evaluate(() => Object.keys(mamoken3d.actors[0].actions)); const Bd = {};
  for (const [key, clip, us] of [['stand', 'idle', [0, .25, .5, .75]], ['crouch', 'crouch', [1]], ['guard_crouch', 'guard_crouch', [1]], ['guard_stand', 'guard_stand', [1]]]) if (names.includes(clip)) Bd[key] = { clip, samples: await Promise.all(us.map(u => page.evaluate(([n, u]) => __bounds(n, u), [clip, u]))) };
  fs.writeFileSync(path.join(out, id + '_bounds.json'), JSON.stringify(Bd, null, 1));
  if (!process.argv.includes('--bounds-only'))   fs.writeFileSync(path.join(out, id + '_curves.json'), JSON.stringify(R)); 
  console.log(id, 'ok');
  await ctx.close();
}
await browser.close(); srv.close();
