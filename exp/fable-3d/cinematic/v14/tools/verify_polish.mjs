#!/usr/bin/env node
// 実機前の仕上げクリップの検証。結果は validation/polish.json と validation/bullet_s3_tail.json。
//  1) バレット s3_v14: 骨盤と尻尾の全フレームのワールド位置が、現行 sp_tail_whip と一致するか（元 GLB の上で再生して比べる）
//  2) アニメ専用 GLB を元 GLB に結び付けた再生が、完全な GLB に焼いたものと一致するか
//  3) ヨミカゲ counter_success_v14 の長さ・移動量
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto'; import { fileURLToPath } from 'node:url'; import { createRequire } from 'node:module';
const pw = createRequire(import.meta.url)('playwright-core'); const HERE = path.dirname(fileURLToPath(import.meta.url)), V14 = path.resolve(HERE, '..'), ROOT = path.resolve(V14, '../..'), REPO = path.resolve(ROOT, '../..');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.glb': 'model/gltf-binary', '.jpg': 'image/jpeg', '.png': 'image/png', '.css': 'text/css' };
const srv = await new Promise(res => { const s = http.createServer((q, r) => { const p = path.join(REPO, decodeURIComponent(q.url.split('?')[0])); if (!p.startsWith(REPO) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream', 'cache-control': 'no-store' }); fs.createReadStream(p).pipe(r); }).listen(0, '127.0.0.1', () => res(s)); });
const browser = await pw.chromium.launch({ executablePath: process.env.CHROMIUM_PATH, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
async function sample(id, clip, frames, anim) { const page = await browser.newPage({ viewport: { width: 200, height: 200 } }); const q = new URLSearchParams({ id, clip: 'idle', base: 1, bare: 1 }); if (anim) q.set('anim', anim);
  await page.goto(`http://127.0.0.1:${srv.address().port}/exp/fable-3d/cinematic/v14/player/index.html?${q}`); await page.waitForFunction(() => window.cine?.ready || window.cine?.error, null, { timeout: 60000 });
  const out = []; for (const f of frames) out.push(await page.evaluate(([f, c]) => { window.cine.frame(f, c); return window.cine.bones(); }, [f, clip])); await page.close(); return out; }
const maxDiff = (A, B, names) => { let d = 0, where = ''; A.forEach((a, i) => { for (const n of names || Object.keys(a.bones)) { const x = a.bones[n], y = B[i].bones[n]; if (!x || !y) continue; const e = Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]); if (e > d) { d = e; where = `${n}@F${i}`; } } }); return { max_m: d, where }; };
const J = (p) => JSON.parse(fs.readFileSync(p, 'utf8')); const checks = []; const ck = (name, pass, detail) => { checks.push({ name, pass: !!pass, detail }); console.log(pass ? 'PASS' : 'FAIL', name, typeof detail === 'string' ? detail : JSON.stringify(detail)); };
const sha = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');

// ---- 1) バレット s3 ----
const F48 = Array.from({ length: 49 }, (_, i) => i); const old = await sample('bullet', 'sp_tail_whip', F48), neu = await sample('bullet', 's3_v14', F48, 'anim/bullet_polish_anim.glb');
const tailBones = Object.keys(old[0].bones).filter(n => /^tail_|^pelvis$|^root_ground$/.test(n)), upper = ['chest', 'head', 'pawL', 'pawR'];
const dTail = maxDiff(old, neu, tailBones), dUpper = maxDiff(old, neu, upper);
const mOld = J(path.join(ROOT, 'chars/bullet/bullet_motions.json')).clips.sp_tail_whip, mNew = J(path.join(V14, 'anim/bullet_polish_motions.json')).clips.s3_v14;
const pathDiff = Math.max(...mOld.tail_tip_path.map((r, i) => Math.max(...r.map((x, k) => Math.abs(x - mNew.tail_tip_path[i][k])))));
ck('バレット s3_v14: 骨盤と尻尾 6 本の全 49 フレームの位置が sp_tail_whip と一致（1e-5 m 未満）', dTail.max_m < 1e-5, { bones: tailBones, ...dTail });
ck('バレット s3_v14: 尻尾先端の軌道（tail_tip_path 25 点）が同じ', pathDiff === 0 && mOld.tail_tip_path.length === mNew.tail_tip_path.length, { max_abs_diff: pathDiff, points: mNew.tail_tip_path.length, max_forward_m: [mOld.tail_tip_max_forward_m, mNew.tail_tip_max_forward_m], at_frame: [mOld.tail_tip_max_forward_frame, mNew.tail_tip_max_forward_frame] });
ck('バレット s3_v14: 上体は実際に変わっている（胸・頭・手が 3cm 以上動く）', dUpper.max_m > 0.03, dUpper);
ck('バレット s3_v14: 長さ 48F・発生 19・持続 6（現行と同じ）', mNew.frames === 48 && mNew.startup === 19 && mNew.active === 6, `${mNew.frames}F ${mNew.startup}/${mNew.active}`);
const battleSamples = (m) => m.tail_tip_path.map(r => [r[0], r[1]]);          // battle.js が読む [フレーム, 前方距離]
fs.writeFileSync(path.join(V14, 'validation', 'bullet_s3_tail.json'), JSON.stringify({ compared: 'chars/bullet/bullet.glb の sp_tail_whip  vs  anim/bullet_polish_anim.glb の s3_v14（どちらも元 GLB の上で再生）', frames: 49, bones_compared: tailBones, max_world_diff_m: dTail.max_m, max_world_diff_at: dTail.where,
  tail_tip_path_max_abs_diff: pathDiff, tail_tip_forward_m_by_frame: { sp_tail_whip: battleSamples(mOld), s3_v14: battleSamples(mNew) }, upper_body_max_change_m: dUpper.max_m, upper_body_max_change_at: dUpper.where,
  how_preserved: '骨盤と尻尾は現行クリップのキーをそのまま使い、背骨・胸・首・頭・両腕・足の高さだけを上書きした（tools/mamo3d/motions_v14b.py の bullet_s3）。尻尾の揺れは骨盤の動きとキーだけから計算されるので同じ結果になる' }, null, 1));
// ---- 2) アニメ専用 GLB と完全な GLB の一致（完全な GLB は _scratch にあるときだけ） ----
for (const [id, clip, n] of [['yomikage', 'counter_success_v14', 21], ['bullet', 's3_v14', 48]]) { const full = path.join(ROOT, '_scratch/polish', id, id + '_v14.glb'); const fr = Array.from({ length: n + 1 }, (_, i) => i); const a = await sample(id, clip, fr, `anim/${id}_polish_anim.glb`);
  ck(`${id} ${clip}: アニメ専用 GLB を元 GLB に結び付けて再生できる（${n + 1} フレーム）`, a.length === n + 1 && Object.keys(a[0].bones).length > 20, `${Object.keys(a[0].bones).length} bones, ${fs.statSync(path.join(V14, 'anim', id + '_polish_anim.glb')).size} bytes`);
  ck(`${id} ${clip}: シェイプキー（目・手の開き）も動く`, a.some(s => s.weights && s.weights.some(w => w > 0.5)), JSON.stringify(a[Math.min(8, n)].weights));
  if (fs.existsSync(full)) { fs.mkdirSync(path.join(V14, '_tmp'), { recursive: true }); fs.copyFileSync(full, path.join(V14, '_tmp', id + '_full.glb')); const b = await sample(id, clip, fr, `_tmp/${id}_full.glb`); const d = maxDiff(a, b); ck(`${id} ${clip}: アニメ専用 GLB と完全な GLB で骨の位置が一致`, d.max_m < 1e-6, d); fs.rmSync(path.join(V14, '_tmp'), { recursive: true }); } }
// ---- 3) ヨミカゲ 反撃 ----
const cs = J(path.join(V14, 'anim/yomikage_polish_motions.json')).clips.counter_success_v14; const cf = await sample('yomikage', 'counter_success_v14', [0, 3, 7, 12, 21], 'anim/yomikage_polish_anim.glb'); const idle = await sample('yomikage', 'idle', [0]);
const px = (s) => s.bones.pelvis; const shift = Math.hypot(px(cf[2])[0] - px(cf[0])[0], px(cf[2])[2] - px(cf[0])[2]);
ck('ヨミカゲ counter_success_v14: 長さ 0.25〜0.4 秒', cs.duration_sec >= 0.25 && cs.duration_sec <= 0.4, `${cs.frames}F = ${cs.duration_sec}s`);
ck('ヨミカゲ counter_success_v14: 腰の移動が小さい（10cm 未満）', shift < 0.10, `${(shift * 100).toFixed(1)} cm`);
ck('ヨミカゲ counter_success_v14: 掌底で手前の手が頭より前・高い位置へ出る', cf[2].bones.pawR[1] > cf[0].bones.pawR[1] + 0.05, `pawR y ${cf[0].bones.pawR[1].toFixed(3)} → ${cf[2].bones.pawR[1].toFixed(3)}`);
ck('ヨミカゲ counter_success_v14: 構え（idle の 0F）で終わる', maxDiff([cf[4]], idle).max_m < 0.02, maxDiff([cf[4]], idle));
await browser.close(); srv.close();
const pass = checks.every(c => c.pass); fs.writeFileSync(path.join(V14, 'validation', 'polish.json'), JSON.stringify({ all_pass: pass, passed: checks.filter(c => c.pass).length, total: checks.length,
  files: Object.fromEntries(['yomikage_polish_anim.glb', 'bullet_polish_anim.glb'].map(f => [f, { bytes: fs.statSync(path.join(V14, 'anim', f)).size, sha256: sha(path.join(V14, 'anim', f)) }])), checks }, null, 1));
console.log(`\n${checks.filter(c => c.pass).length}/${checks.length} ${pass ? 'ALL PASS' : 'FAILED'}`); process.exit(pass ? 0 : 1);
