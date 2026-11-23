#!/usr/bin/env node
// manifest の各モジュールについて、host の元の姿（base）とモジュールを載せた姿を、待機・歩行・ガード・攻撃で並べた比較画像と比較動画を作り、
// 同じ姿勢で継ぎ目のずれ（スキニング後、WebGL と同じ計算）を測って JSON に書く。
//   node evidence.mjs [--ids a,b] [--video 0]   → ../evidence/<id>_poses.jpg, <id>_seam.jpg, <id>.mp4, seam_gap.json
// 仮想時間で 1/30 秒ずつ進めた連番（実機の fps ではない）。ゲームの実行時コードは通していない（確認ページ preview/index.html）。
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url'; import { createRequire } from 'node:module'; import { execFileSync } from 'node:child_process';
const pw = createRequire(import.meta.url)('playwright'); const HERE = path.dirname(fileURLToPath(import.meta.url)), REPO = path.resolve(HERE, '../../../../..'), P2 = path.resolve(HERE, '..'), OUT = path.join(P2, 'evidence');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i < 0 ? d : process.argv[i + 1]; };
const man = JSON.parse(fs.readFileSync(path.join(P2, 'assets/manifest.json'))); const ids = arg('ids') ? arg('ids').split(',') : man.modules.map(m => m.id); const video = arg('video', '1') !== '0'; fs.mkdirSync(OUT, { recursive: true });
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.glb': 'model/gltf-binary' };
const srv = await new Promise(res => { const s = http.createServer((q, r) => { const p = path.join(REPO, decodeURIComponent(q.url.split('?')[0])); if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(r); }).listen(0, '127.0.0.1', () => res(s)); });
const browser = await pw.chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
const W = 300, H = 300; const POSES = [['idle', '待機'], ['walk_f', '歩行'], ['guard_stand', 'ガード'], ['stand_heavy', '攻撃（立ち強）'], ['crouch_heavy', '攻撃（しゃがみ強）'], ['hurt_heavy', '被弾']];
// slot ごとの視点: 全身 2 つ + 継ぎ目の寄り 2 つ
const VIEWS = { head: ['front', '34b', 'head:front@0.55', 'head:back@0.55'], ears: ['front', '34b', 'head:front@0.42', 'head:top@0.42'], hands: ['front', '34b', 'upper_arm.L:front@0.6', 'upper_arm.R:back@0.6'], feet: ['front', '34b', 'thigh.L:low@0.6', 'thigh.R:back@0.6'], tail: ['34b', 'back', 'tail_01:back@0.5', 'tail_01:side@0.5'] };
const open = async (host, modules, extra = {}) => { const page = await browser.newPage({ viewport: { width: W, height: H } }); page.on('pageerror', e => console.log('JS', e.message)); const qs = new URLSearchParams({ host, modules, ...extra });
  await page.goto(`http://127.0.0.1:${srv.address().port}/exp/fable-3d/custom/p2/preview/index.html?${qs}`); await page.waitForFunction(() => window.p2?.ready || window.p2?.error, null, { timeout: 90000 }); const e = await page.evaluate(() => p2.error); if (e) throw Error(e); return page; };
const snap = async (page, clip, t, view, file) => { const [v, d] = view.split('@'); await page.evaluate(([c, t, v, d]) => { p2.pose(c, t); p2.view(v, +d || 0); p2.render(); }, [clip, t, v, d]); await page.screenshot({ path: file }); };
const gapFile = path.join(OUT, 'seam_gap.json'); const GAP = fs.existsSync(gapFile) ? JSON.parse(fs.readFileSync(gapFile)) : { note: 'モジュールの host 境界頂点の写しと、host の隣の slot の同じ場所の頂点の距離 [m]。スキニング後（three.js の SkinnedMesh.getVertexPosition = 描画と同じ計算）。各クリップを等間隔 9 時刻で測った最大', tolerance_m: 0.00002, modules: {} };
for (const id of ids) { const m = man.modules.find(x => x.id === id); const tmp = fs.mkdtempSync('/tmp/p2ev-'); const views = VIEWS[m.slot];
  const base = await open(m.targetBaseId, ''), mod = await open(m.targetBaseId, m.file), clay = await open(m.targetBaseId, m.file, { mat: 'clay', wire: '1' }); const dur = await mod.evaluate(() => p2.clips);
  const rows = []; const gaps = {}; let worst = 0;
  for (const [clip, jp] of POSES) { const t = dur[clip] * (clip === 'idle' ? .3 : clip.includes('heavy') ? .38 : .5); const row = [];
    for (const [k, pg] of [['base', base], ['mod', mod]]) for (const v of views) { const f = path.join(tmp, `${clip}_${k}_${row.length}.png`); await snap(pg, clip, t, v, f); row.push(f); }
    rows.push({ label: `${jp} ${clip} t=${t.toFixed(2)}s`, files: row });
    let mx = 0, n = 0; for (let i = 0; i < 9; i++) { const g = await mod.evaluate(([c, t]) => { p2.pose(c, t); return p2.seamGap(); }, [clip, dur[clip] * i / 8.001]); for (const x of Object.values(g)) { mx = Math.max(mx, x.maxGap); n = Math.max(n, x.matchedVertices); } }
    gaps[clip] = { maxGap_m: mx, seamVertices: n }; worst = Math.max(worst, mx); }
  GAP.modules[id] = { clips: gaps, maxGap_m: worst, pass: worst <= GAP.tolerance_m };
  // 継ぎ目の寄り（面の張り方が見える表示）: 待機と攻撃
  const srow = []; for (const [clip, f] of [['idle', .3], ['stand_heavy', .38]]) for (const v of views.slice(2)) { const p = path.join(tmp, `seam_${srow.length}.png`); await snap(clay, clip, dur[clip] * f, v, p); srow.push(p); }
  let frames = null;
  if (video) { frames = path.join(tmp, 'v'); fs.mkdirSync(frames); let n = 0; const v = m.slot === 'tail' ? '34b' : '34';
    for (const clip of ['idle', 'walk_f', 'guard_stand', 'stand_heavy', 'crouch_heavy']) { const N = Math.max(8, Math.round(Math.min(dur[clip], 1.4) * 30)); for (let i = 0; i < N; i++) { const t = i / 30; await snap(base, clip, t, v, path.join(frames, `a_${String(n).padStart(4, '0')}.png`)); await snap(mod, clip, t, v, path.join(frames, `b_${String(n).padStart(4, '0')}.png`)); await snap(mod, clip, t, views[2], path.join(frames, `c_${String(n).padStart(4, '0')}.png`)); fs.writeFileSync(path.join(frames, `l_${String(n).padStart(4, '0')}.txt`), clip); n++; } } }
  await base.close(); await mod.close(); await clay.close();
  const py = `
import json, glob, os, subprocess
from PIL import Image, ImageDraw, ImageFont
F=ImageFont.truetype('/usr/share/fonts/opentype/ipafont-gothic/ipag.ttf',14); rows=${JSON.stringify(rows)}; W,H=${W},${H}; nv=${views.length}; title=${JSON.stringify(`${m.id}   左 ${views.length} 列 = host の元の姿（base ${m.targetBaseId}）／右 ${views.length} 列 = ${m.slot} を ${m.donorId} の実メッシュに交換`)}
s=Image.new('RGB',(W*nv*2+6,(H+20)*len(rows)+24),(16,22,30)); d=ImageDraw.Draw(s); d.text((6,4),title,fill=(255,220,140),font=F)
for r,row in enumerate(rows):
    y=24+r*(H+20); d.text((6,y+2),row['label'],fill=(200,210,225),font=F)
    for c,f in enumerate(row['files']): s.paste(Image.open(f).convert('RGB'),(c*W+(6 if c>=nv else 0),y+20))
s.save(${JSON.stringify(path.join(OUT, id + '_poses.jpg'))},quality=86)
sr=${JSON.stringify(srow)}; s=Image.new('RGB',(W*len(sr),H+22),(16,22,30)); d=ImageDraw.Draw(s); d.text((6,4),${JSON.stringify(`${m.id}  継ぎ目の寄り（肌色 = モジュール、青 = host の元の面。線 = モジュールの三角形）  左 2 = 待機、右 2 = 攻撃`)},fill=(255,220,140),font=F)
for c,f in enumerate(sr): s.paste(Image.open(f).convert('RGB'),(c*W,22))
s.save(${JSON.stringify(path.join(OUT, id + '_seam.jpg'))},quality=88)
fr=${JSON.stringify(frames)}
if fr:
    n=len(glob.glob(fr+'/a_*.png'))
    for i in range(n):
        k='%04d'%i; im=Image.new('RGB',(W*3,H+22),(16,22,30)); d=ImageDraw.Draw(im); lab=open(fr+'/l_'+k+'.txt').read()
        for c,p in enumerate('abc'): im.paste(Image.open(fr+'/'+p+'_'+k+'.png').convert('RGB'),(c*W,22))
        d.text((6,4),'base '+${JSON.stringify(m.targetBaseId)}+'  '+lab,fill=(200,210,225),font=F); d.text((W+6,4),${JSON.stringify(`${m.slot} ← ${m.donorId}`)},fill=(255,220,140),font=F); d.text((W*2+6,4),'継ぎ目の寄り',fill=(255,220,140),font=F); im.save(fr+'/o_'+k+'.png')
    subprocess.run(['ffmpeg','-y','-loglevel','error','-framerate','30','-i',fr+'/o_%04d.png','-c:v','libx264','-pix_fmt','yuv420p','-crf','26',${JSON.stringify(path.join(OUT, id + '.mp4'))}],check=True)
print('ok')`;
  execFileSync('python3', ['-c', py]); fs.rmSync(tmp, { recursive: true, force: true }); console.log(id, 'maxGap', worst, GAP.modules[id].pass ? 'pass' : 'FAIL'); fs.writeFileSync(gapFile, JSON.stringify(GAP, null, 1)); }
await browser.close(); srv.close();
