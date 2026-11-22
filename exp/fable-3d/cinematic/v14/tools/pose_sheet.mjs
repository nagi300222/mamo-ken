#!/usr/bin/env node
// 1クリップの数フレームを参照プレイヤーのクリップ確認モードで撮って1枚に並べる（モーション調整の目視用）。
//   node pose_sheet.mjs --id moguzo --clip s1_v14 --frames 0,6,10,13,16,24,35 [--views match,34] [--foe pisuke --dist 0.6] [--base 1] --out FILE.jpg
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url'; import { createRequire } from 'node:module'; import { execFileSync } from 'node:child_process';
const pw = createRequire(import.meta.url)('playwright'); const HERE = path.dirname(fileURLToPath(import.meta.url)), REPO = path.resolve(HERE, '../../../../..');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i < 0 ? d : process.argv[i + 1]; };
const id = arg('id', 'moguzo'), clip = arg('clip', 'idle'), frames = arg('frames', '0').split(',').map(Number), views = arg('views', 'match,34').split(','), out = path.resolve(arg('out', '/tmp/pose.jpg'));
const W = +arg('w', 300), H = +arg('h', 260);
export const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.glb': 'model/gltf-binary', '.jpg': 'image/jpeg', '.png': 'image/png', '.css': 'text/css' };
const srv = await new Promise(res => { const s = http.createServer((q, r) => { const p = path.join(REPO, decodeURIComponent(q.url.split('?')[0])); if (!p.startsWith(REPO) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream', 'cache-control': 'no-store' }); fs.createReadStream(p).pipe(r); }).listen(0, '127.0.0.1', () => res(s)); });
const browser = await pw.chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
const tmp = fs.mkdtempSync('/tmp/pose-'); const rows = [];
for (const view of views) {
  const page = await browser.newPage({ viewport: { width: W, height: H } }); page.on('pageerror', e => console.log('JS', e.message));
  const q = new URLSearchParams({ clip, id, view, bare: 1, hw: arg('hw', '0.62') }); for (const k of ['foe', 'dist', 'base', 'dx', 'dn']) if (arg(k)) q.set(k, arg(k));
  await page.goto(`http://127.0.0.1:${srv.address().port}/exp/fable-3d/cinematic/v14/player/index.html?${q}`); await page.waitForFunction(() => window.cine?.ready || window.cine?.error, null, { timeout: 60000 });
  const err = await page.evaluate(() => window.cine.error); if (err) { console.log(err); process.exit(1); }
  const fl = []; for (const f of frames) { await page.evaluate(([f, c]) => window.cine.frame(f, c), [f, clip]); const p = path.join(tmp, `${view}_${String(f).padStart(4, '0')}.png`); await page.screenshot({ path: p }); fl.push(p); }
  rows.push(fl); await page.close();
}
await browser.close(); srv.close();
const py = `
import sys
from PIL import Image, ImageDraw
rows=${JSON.stringify(rows)}; fr=${JSON.stringify(frames)}
W,H=Image.open(rows[0][0]).size; S=Image.new('RGB',(W*len(rows[0]),H*len(rows)))
for j,r in enumerate(rows):
    for i,p in enumerate(r):
        im=Image.open(p).convert('RGB'); ImageDraw.Draw(im).text((4,2),'F%d'%fr[i],fill=(255,255,0)); S.paste(im,(i*W,j*H))
S.save(${JSON.stringify(out)},quality=88); print(${JSON.stringify(out)},S.size)`;
console.log(execFileSync('python3', ['-c', py]).toString().trim()); fs.rmSync(tmp, { recursive: true });
