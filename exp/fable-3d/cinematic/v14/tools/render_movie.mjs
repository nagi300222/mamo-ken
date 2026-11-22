#!/usr/bin/env node
// 奥義ムービーを参照プレイヤーで 1 コマずつ描いて、連番 PNG・コンタクトシート・mp4 にする。
//   node render_movie.mjs --movie moguzo [--target pisuke] [--mirror 1] [--fps 30] [--w 852 --h 393] --out DIR [--mp4 FILE] [--sheet FILE --n 24] [--times 0.1,0.5]
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url'; import { createRequire } from 'node:module'; import { execFileSync } from 'node:child_process';
const pw = createRequire(import.meta.url)('playwright'); const HERE = path.dirname(fileURLToPath(import.meta.url)), REPO = path.resolve(HERE, '../../../../..');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i < 0 ? d : process.argv[i + 1]; };
const movie = arg('movie', 'moguzo'), target = arg('target', 'pisuke'), fps = +arg('fps', 30), W = +arg('w', 852), H = +arg('h', 393), out = path.resolve(arg('out', '/tmp/cine_' + movie));
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.glb': 'model/gltf-binary', '.jpg': 'image/jpeg', '.png': 'image/png', '.css': 'text/css' };
const srv = await new Promise(res => { const s = http.createServer((q, r) => { const p = path.join(REPO, decodeURIComponent(q.url.split('?')[0])); if (!p.startsWith(REPO) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream', 'cache-control': 'no-store' }); fs.createReadStream(p).pipe(r); }).listen(0, '127.0.0.1', () => res(s)); });
const browser = await pw.chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: +arg('dpr', 1) }); const errors = [];
page.on('pageerror', e => errors.push(String(e))); page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()); });
const q = new URLSearchParams({ movie, target, bare: 1, mirror: arg('mirror', '0'), reduced: arg('reduced', '0') });
await page.goto(`http://127.0.0.1:${srv.address().port}/exp/fable-3d/cinematic/v14/player/index.html?${q}`);
await page.waitForFunction(() => window.cine?.ready || window.cine?.error, null, { timeout: 90000 });
const err = await page.evaluate(() => window.cine.error); if (err) { console.error(err); process.exit(1); }
const dur = await page.evaluate(() => window.cine.duration);
fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
const times = arg('times') ? arg('times').split(',').map(Number) : Array.from({ length: Math.floor(dur * fps) + 1 }, (_, i) => i / fps); const log = [];
for (let i = 0; i < times.length; i++) { const r = await page.evaluate(t => window.cine.seek(t), times[i]); log.push(r); await page.screenshot({ path: path.join(out, String(i).padStart(4, '0') + '.png') }); }
await browser.close(); srv.close();
if (errors.length) console.log('console:', [...new Set(errors)].slice(0, 8).join(' | '));
if (arg('sheet')) { const n = +arg('n', 24), cols = +arg('cols', 6), idx = arg('times') ? times.map((_, i) => i) : Array.from({ length: n }, (_, i) => Math.round(i * (times.length - 1) / (n - 1)));
  const py = `
from PIL import Image, ImageDraw
idx=${JSON.stringify(idx)}; log=${JSON.stringify(log.map(l => l.shot + ' ' + l.t.toFixed(2)))}; cols=${cols}; w=${+arg('sw', 320)}
ims=[]
for i in idx:
    im=Image.open('${out}/%04d.png'%i).convert('RGB'); im=im.resize((w,round(im.height*w/im.width))); d=ImageDraw.Draw(im); d.rectangle((0,0,150,11),fill=(0,0,0)); d.text((2,0),log[i],fill=(255,255,0)); ims.append(im)
rows=(len(ims)+cols-1)//cols; S=Image.new('RGB',(w*cols,ims[0].height*rows))
for k,im in enumerate(ims): S.paste(im,((k%cols)*w,(k//cols)*im.height))
S.save('${path.resolve(arg('sheet'))}',quality=86); print('${path.resolve(arg('sheet'))}',S.size)`;
  console.log(execFileSync('python3', ['-c', py]).toString().trim()); }
if (arg('mp4')) { fs.mkdirSync(path.dirname(path.resolve(arg('mp4'))), { recursive: true });
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', path.join(out, '%04d.png'), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', arg('crf', '23'), '-movflags', '+faststart', path.resolve(arg('mp4'))]); console.log('mp4', path.resolve(arg('mp4')), fs.statSync(path.resolve(arg('mp4'))).size); }
fs.writeFileSync(path.join(out, 'render_log.json'), JSON.stringify({ movie, target, fps, size: [W, H], duration: dur, frames: times.length, errors: [...new Set(errors)] }, null, 1));
