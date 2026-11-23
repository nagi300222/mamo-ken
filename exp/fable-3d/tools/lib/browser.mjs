// 静的サーバー + ヘッドレスChromium で preview/ を開く共通処理
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require('/opt/node-tools/node_modules/playwright'); }
export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.glb': 'model/gltf-binary', '.jpg': 'image/jpeg', '.png': 'image/png', '.css': 'text/css' };

export function serve() {
  return new Promise((res) => {
    const srv = http.createServer((req, rsp) => {
      const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
      if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { rsp.writeHead(404); rsp.end('not found'); return; }
      rsp.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream', 'cache-control': 'no-store' }); fs.createReadStream(p).pipe(rsp);
    }).listen(0, '127.0.0.1', () => res({ srv, url: `http://127.0.0.1:${srv.address().port}` }));
  });
}

export async function open({ width = 640, height = 640, scale = 1, query = 'manual=1&bare=1&nohud=1' } = {}) {
  const { srv, url } = await serve();
  const browser = await pw.chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: scale });
  const page = await ctx.newPage(); const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(`${url}/preview/index.html?${query}`);
  await page.waitForFunction(() => window.mamo && (window.mamo.ready || window.mamo.error), null, { timeout: 60000 });
  const err = await page.evaluate(() => window.mamo.error || null); if (err) errors.push(err);
  const close = async () => { await browser.close(); srv.close(); };
  const shot = async (file) => { await page.evaluate(() => window.mamo.draw()); await page.locator('#c').screenshot({ path: file }); };
  return { page, errors, close, shot, url };
}
