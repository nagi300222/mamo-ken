#!/usr/bin/env node
// 合成イメージと原画一覧を撮る → ../preview/*.png
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url'; import { createRequire } from 'node:module';
const pw = createRequire(import.meta.url)('playwright'); const HERE = path.dirname(fileURLToPath(import.meta.url)), V18 = path.resolve(HERE, '..');
const MIME = { '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.html': 'text/html; charset=utf-8' };
const srv = await new Promise(res => { const s = http.createServer((q, r) => { const p = path.join(V18, decodeURIComponent(q.url.split('?')[0])); if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(r); }).listen(0, '127.0.0.1', () => res(s)); });
const browser = await pw.chromium.launch({ args: ['--no-sandbox'] });
const shot = async (qs, w, h, name, full = false) => { const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2 }); const page = await ctx.newPage(); await page.goto(`http://127.0.0.1:${srv.address().port}/preview/index.html?${qs}`); await page.waitForLoadState('networkidle'); await page.screenshot({ path: path.join(V18, 'preview', name), fullPage: full }); await ctx.close(); console.log(name); };
await shot('view=menu&w=720&h=320', 720, 320, 'menu_720x320.png'); await shot('view=menu&w=852&h=393', 852, 393, 'menu_852x393.png'); await shot('view=menu&w=720&h=320&states=1', 720, 320, 'menu_720x320_states.png'); await shot('view=sheet', 960, 600, 'originals_sheet.png', true);
await browser.close(); srv.close();
