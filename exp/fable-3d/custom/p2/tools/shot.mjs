#!/usr/bin/env node
// 確認ページを使って、モジュールを host に載せた姿を撮る。1 枚のシートに「行 = 姿勢（クリップと時刻）、列 = 視点」で並べる。
//   node shot.mjs --host moguzo --modules modules/moguzo/head_godan.glb [--assets DIR(絶対 or リポジトリ相対)] --poses idle:0,walk:0.2 --views front,side,head:front --mat tex|clay [--wire 1] --w 360 --h 360 --out FILE.jpg [--gap FILE.json]
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url'; import { createRequire } from 'node:module'; import { execFileSync } from 'node:child_process';
const pw = createRequire(import.meta.url)('playwright'); const HERE = path.dirname(fileURLToPath(import.meta.url)), REPO = path.resolve(HERE, '../../../../..');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i < 0 ? d : process.argv[i + 1]; };
const host = arg('host'), modules = arg('modules', ''), poses = arg('poses', 'idle:0').split(',').map(s => s.split(':')), views = arg('views', 'front,side,back').split(','), out = path.resolve(arg('out', 'p2shot.jpg')), W = +arg('w', 360), H = +arg('h', 360);
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.glb': 'model/gltf-binary', '.jpg': 'image/jpeg', '.png': 'image/png' };
const extra = arg('assets') ? path.resolve(arg('assets')) : null;       // リポジトリ外の試作 GLB を見るとき
const srv = await new Promise(res => { const s = http.createServer((q, r) => { const u = decodeURIComponent(q.url.split('?')[0]); const p = extra && u.startsWith('/__assets/') ? path.join(extra, u.slice(10)) : path.join(REPO, u);
  if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(r); }).listen(0, '127.0.0.1', () => res(s)); });
const browser = await pw.chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: W, height: H } }); page.on('pageerror', e => console.log('JS', e.message));
const qs = new URLSearchParams({ host, modules, mat: arg('mat', 'tex') }); if (extra) qs.set('assets', '/__assets/'); if (arg('wire')) qs.set('wire', '1');
await page.goto(`http://127.0.0.1:${srv.address().port}/exp/fable-3d/custom/p2/preview/index.html?${qs}`); await page.waitForFunction(() => window.p2?.ready || window.p2?.error, null, { timeout: 90000 });
const err = await page.evaluate(() => window.p2.error); if (err) { console.log(err); await browser.close(); srv.close(); process.exit(1); }
const tmp = fs.mkdtempSync('/tmp/p2shot-'); const rows = [], gaps = {};
for (const [clip, t] of poses) { const row = [];
  for (const v of views) { const [vv, dist] = v.split('@'); await page.evaluate(([c, t, v, d]) => { p2.pose(c, +t || 0); p2.view(v, +d || 0); p2.render(); }, [clip, t, vv, dist]); const f = path.join(tmp, `${rows.length}_${row.length}.png`); await page.screenshot({ path: f }); row.push(f); }
  gaps[`${clip}:${t || 0}`] = await page.evaluate(() => p2.seamGap()); rows.push(row); }
await browser.close(); srv.close();
if (arg('gap')) fs.writeFileSync(path.resolve(arg('gap')), JSON.stringify(gaps, null, 1));
const py = `
from PIL import Image, ImageDraw
rows=${JSON.stringify(rows)}; lab=${JSON.stringify(poses.map(p => p.join(' t=')))}; vs=${JSON.stringify(views)}
w,h=Image.open(rows[0][0]).size; s=Image.new('RGB',(w*len(rows[0]),h*len(rows)))
for r,row in enumerate(rows):
    for c,f in enumerate(row):
        im=Image.open(f).convert('RGB'); d=ImageDraw.Draw(im); d.text((6,4),lab[r]+'  '+vs[c],fill=(255,240,120)); s.paste(im,(c*w,r*h))
s.save(${JSON.stringify(out)},quality=88); print(${JSON.stringify(out)}, s.size)`;
console.log(execFileSync('python3', ['-c', py]).toString().trim()); console.log(JSON.stringify(gaps));
