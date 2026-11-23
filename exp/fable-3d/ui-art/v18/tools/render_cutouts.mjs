#!/usr/bin/env node
// CUTOUTS の一覧どおりに、元の 9 体の GLB から透明背景の切り抜き PNG を描いて ../source/cutouts/ に置く（余白は切り詰める）。
//   node render_cutouts.mjs [--only name,name]
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url'; import { createRequire } from 'node:module'; import { execFileSync } from 'node:child_process';
const pw = createRequire(import.meta.url)('playwright'); const HERE = path.dirname(fileURLToPath(import.meta.url)), REPO = path.resolve(HERE, '../../../../..'), OUT = path.resolve(HERE, '../source/cutouts');
export const CUTOUTS = JSON.parse(fs.readFileSync(path.join(HERE, 'cutouts.json')));
const only = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1].split(',') : null;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.glb': 'model/gltf-binary', '.jpg': 'image/jpeg', '.png': 'image/png' };
const srv = await new Promise(res => { const s = http.createServer((q, r) => { const p = path.join(REPO, decodeURIComponent(q.url.split('?')[0])); if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(r); }).listen(0, '127.0.0.1', () => res(s)); });
const browser = await pw.chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] }); fs.mkdirSync(OUT, { recursive: true });
for (const c of CUTOUTS) { if (only && !only.includes(c.name)) continue; const W = c.w || 560, H = c.h || 560; const page = await browser.newPage({ viewport: { width: W, height: H } });
  const qs = new URLSearchParams({ id: c.id, clip: c.clip || 'idle', t: c.t ?? 0.3, yaw: c.yaw ?? 0, pitch: c.pitch ?? 6, w: W, h: H, mode: c.mode || 'color', tint: c.tint || '14211d', fit: c.fit || 1.06 });
  await page.goto(`http://127.0.0.1:${srv.address().port}/exp/fable-3d/ui-art/v18/tools/render_marmot.html?${qs}`); await page.waitForFunction(() => window.cut?.ready, null, { timeout: 90000 }); const st = await page.evaluate(() => window.cut); if (st.error) { console.log(c.name, st.error); process.exit(1); }
  const f = path.join(OUT, c.name + '.png'); await page.screenshot({ path: f, omitBackground: true }); await page.close();
  execFileSync('python3', ['-c', `from PIL import Image\nim=Image.open(${JSON.stringify(f)}).convert('RGBA'); b=im.getbbox(); im=im.crop(b)\n${c.flip ? 'im=im.transpose(Image.FLIP_LEFT_RIGHT)' : ''}\nim.save(${JSON.stringify(f)},optimize=True); print(${JSON.stringify(c.name)}, im.size)`], { stdio: 'inherit' }); }
await browser.close(); srv.close();
