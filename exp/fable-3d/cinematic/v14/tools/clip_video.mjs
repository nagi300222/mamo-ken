#!/usr/bin/env node
// 1 クリップを参照プレイヤーのクリップ確認モードで全フレーム撮り、mp4 にする（対戦カメラ相当の真横＋斜め前の 2 画面）。
//   node clip_video.mjs --id yomikage --clip counter_success_v14 --anim anim/yomikage_polish_anim.glb --frames 21 [--foe pisuke --dist 0.42] [--base 1] [--loops 3] [--fps 30] --out FILE.mp4
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url'; import { createRequire } from 'node:module'; import { execFileSync } from 'node:child_process';
const pw = createRequire(import.meta.url)('playwright'); const HERE = path.dirname(fileURLToPath(import.meta.url)), REPO = path.resolve(HERE, '../../../../..');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i < 0 ? d : process.argv[i + 1]; };
const id = arg('id'), clip = arg('clip'), N = +arg('frames'), out = path.resolve(arg('out')), fps = +arg('fps', 30), loops = +arg('loops', 3), W = 426, H = 360;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.glb': 'model/gltf-binary', '.jpg': 'image/jpeg', '.png': 'image/png' };
const srv = await new Promise(res => { const s = http.createServer((q, r) => { const p = path.join(REPO, decodeURIComponent(q.url.split('?')[0])); if (!p.startsWith(REPO) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(r); }).listen(0, '127.0.0.1', () => res(s)); });
const browser = await pw.chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] }); const tmp = fs.mkdtempSync('/tmp/clipv-');
for (const view of ['match', '34']) { const page = await browser.newPage({ viewport: { width: W, height: H } }); const q = new URLSearchParams({ clip: 'idle', id, view, bare: 1, hw: arg('hw', '0.7') }); for (const k of ['foe', 'dist', 'base', 'anim']) if (arg(k)) q.set(k, arg(k));
  await page.goto(`http://127.0.0.1:${srv.address().port}/exp/fable-3d/cinematic/v14/player/index.html?${q}`); await page.waitForFunction(() => window.cine?.ready || window.cine?.error, null, { timeout: 60000 });
  for (let f = 0; f <= N; f++) { await page.evaluate(([f, c]) => window.cine.frame(f, c), [f, clip]); await page.screenshot({ path: path.join(tmp, `${view}_${String(f).padStart(4, '0')}.png`) }); } await page.close(); }
await browser.close(); srv.close();
const py = `
from PIL import Image, ImageDraw, ImageFont
F=ImageFont.truetype('/usr/share/fonts/opentype/ipafont-gothic/ipag.ttf',15); n=0
for lp in range(${loops}):
    for f in list(range(${N}+1))+[${N}]*10:
        a=Image.open('${tmp}/match_%04d.png'%f).convert('RGB'); b=Image.open('${tmp}/34_%04d.png'%f).convert('RGB'); S=Image.new('RGB',(a.width*2,a.height)); S.paste(a,(0,0)); S.paste(b,(a.width,0))
        d=ImageDraw.Draw(S); d.rectangle((0,0,S.width,20),fill=(0,0,0)); d.text((5,2),'${arg('label', id + ' ' + clip)}  F%d/${N}（${fps === 60 ? '等速' : '0.5倍速'}）'%f,font=F,fill=(255,230,120)); S.save('${tmp}/o_%05d.png'%n); n+=1`;
execFileSync('python3', ['-c', py]); fs.mkdirSync(path.dirname(out), { recursive: true });
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', path.join(tmp, 'o_%05d.png'), '-vf', 'pad=ceil(iw/2)*2:ceil(ih/2)*2', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '26', '-movflags', '+faststart', out]);
console.log(out, fs.statSync(out).size); fs.rmSync(tmp, { recursive: true });
