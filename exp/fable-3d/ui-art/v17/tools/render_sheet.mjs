#!/usr/bin/env node
// 素材一覧をブラウザで描いて PNG に保存する（確認用）。 node render_sheet.mjs OUT.png
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url'; import { createRequire } from 'node:module';
const pw = createRequire(import.meta.url)('playwright'); const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(HERE, '..');
const M = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.json'))); const out = path.resolve(process.argv[2] || path.join(ROOT, 'evidence/asset-sheet.png'));
const cell = a => `<figure style="margin:0;padding:10px;background:#16261f;border:1px solid #2b4138;display:flex;flex-direction:column;gap:6px;align-items:center;justify-content:space-between">
  <div style="height:${a.group === 'surface' && a.viewBox[3] > 300 ? 230 : 120}px;display:flex;align-items:center;color:#F1C66C">${fs.readFileSync(path.join(ROOT, a.file), 'utf8').replace('<svg ', '<svg style="max-height:100%;max-width:230px;width:auto;height:auto" ')}</div>
  <figcaption style="font:11px sans-serif;color:#BED1C7">${a.id}</figcaption></figure>`;
const html = `<body style="margin:0;background:#101F1B;padding:14px"><div style="display:grid;grid-template-columns:repeat(6,1fr);gap:10px">${M.assets.map(cell).join('')}</div></body>`;
const b = await pw.chromium.launch(); const p = await b.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 }); await p.setContent(html);
fs.mkdirSync(path.dirname(out), { recursive: true }); await p.screenshot({ path: out, fullPage: true }); await b.close(); console.log(out);
