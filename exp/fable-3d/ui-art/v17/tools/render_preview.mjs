#!/usr/bin/env node
// 合成プレビュー（preview/index.html）の各画面を PNG に保存する。 node render_preview.mjs  → ../evidence/composite-*.png
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url'; import { createRequire } from 'node:module';
const pw = createRequire(import.meta.url)('playwright'); const HERE = path.dirname(fileURLToPath(import.meta.url)), REPO = path.resolve(HERE, '../../../../..'), OUT = path.resolve(HERE, '../evidence');
const MIME = { '.html': 'text/html; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json', '.jpg': 'image/jpeg' };
const srv = await new Promise(res => { const s = http.createServer((q, r) => { const p = path.join(REPO, decodeURIComponent(q.url.split('?')[0])); if (!p.startsWith(REPO) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(r); }).listen(0, '127.0.0.1', () => res(s)); });
const b = await pw.chromium.launch(); const p = await b.newPage({ viewport: { width: 1320, height: 800 }, deviceScaleFactor: 1 }); const bad = []; p.on('response', r => { if (r.status() >= 400) bad.push(r.status() + ' ' + r.url()); });
await p.goto(`http://127.0.0.1:${srv.address().port}/exp/fable-3d/ui-art/v17/preview/index.html`); await p.waitForFunction(() => document.body.dataset.ready === '1'); await p.waitForTimeout(400);
fs.mkdirSync(OUT, { recursive: true });
for (const [id, name] of [['a1', 'a1-mode-select'], ['a2', 'a2-battle-hud'], ['a3', 'a3-character-select'], ['b1', 'b1-editor'], ['b2', 'b2-explore']]) await p.locator('#' + id).screenshot({ path: path.join(OUT, 'composite-' + name + '.png') });
console.log('composites 5, failed requests', bad); await b.close(); srv.close();
