#!/usr/bin/env node
// source/mode-*.svg（切り抜き PNG を相対参照する編集元）を Chromium で透過 PNG にする。
//   node render_outputs.mjs   → ../png/mode-<id>.webp（1280x480 透過）、mode-<id>.png（640x240 透過）、mode-<id>@thumb.png（180x80 の縮小確認用）。mode-<id>.raw.png は中間ファイル（git に入れない）
// 後処理は post.py。
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url'; import { createRequire } from 'node:module'; import { execFileSync } from 'node:child_process';
const pw = createRequire(import.meta.url)('playwright'); const HERE = path.dirname(fileURLToPath(import.meta.url)), V18 = path.resolve(HERE, '..'), OUT = path.join(V18, 'png'); fs.mkdirSync(OUT, { recursive: true });
const MIME = { '.svg': 'image/svg+xml', '.png': 'image/png', '.html': 'text/html' };
const srv = await new Promise(res => { const s = http.createServer((q, r) => { const p = path.join(V18, decodeURIComponent(q.url.split('?')[0])); if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(r); }).listen(0, '127.0.0.1', () => res(s)); });
const browser = await pw.chromium.launch({ args: ['--no-sandbox'] }); const ctx = await browser.newContext({ viewport: { width: 640, height: 240 }, deviceScaleFactor: 2 });
for (const id of ['vs', 'practice', 'arcade', 'survival', 'story', 'vs-large']) { const page = await ctx.newPage(); if (id === 'vs-large') await page.setViewportSize({ width: 480, height: 360 }); await page.goto(`http://127.0.0.1:${srv.address().port}/source/mode-${id}.svg`); await page.waitForLoadState('networkidle'); await page.screenshot({ path: path.join(OUT, `mode-${id}.raw.png`), omitBackground: true }); await page.close(); }
await browser.close(); srv.close();
console.log(execFileSync('python3', [path.join(HERE, 'post.py')]).toString());
