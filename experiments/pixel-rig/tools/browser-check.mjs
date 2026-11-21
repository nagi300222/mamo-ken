// 任意の確認用: ブラウザ（ビューワーと同じ読み込み経路）と Node で、全コマの描画結果が1ピクセルも違わないことを確かめる。
// Playwright が入っている環境でだけ動く（このリポジトリの依存には含めていない）。
//   1) リポジトリ直下で  python3 -m http.server 8765
//   2) node experiments/pixel-rig/tools/browser-check.mjs [スクリーンショット出力先.png]
import crypto from 'node:crypto';
import { CHARS, loadChar } from './lib/load.mjs';
import { bakeMotion, renderPose } from '../src/rig.js';

// ESM の import はグローバルの node_modules を見ないので、require で探す
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const base = process.env.VIEWER_URL || 'http://localhost:8765/experiments/pixel-rig/';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1500, height: 1000 } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto(base + 'index.html');
await page.waitForFunction(() => document.querySelectorAll('#stage canvas').length > 0 && document.getElementById('motion').options.length > 0);

const inBrowser = await page.evaluate(async (ids) => {
  const { createRig, bakeMotion, renderPose } = await import('./src/rig.js');
  const getJSON = async (u) => (await fetch(u)).json();
  const img = (url) => new Promise((res) => { const i = new Image(); i.onload = () => { const c = document.createElement('canvas'); c.width = i.width; c.height = i.height; const g = c.getContext('2d'); g.drawImage(i, 0, 0); res({ w: i.width, h: i.height, data: g.getImageData(0, 0, i.width, i.height).data }); }; i.src = url; });
  const out = {};
  for (const id of ids) {
    const d = `chars/${id}`;
    const [rj, pal, man] = await Promise.all([getJSON(`${d}/rig.json`), getJSON(`${d}/palette.json`), getJSON(`${d}/manifest.json`)]);
    const images = {};
    for (const n of Object.keys(rj.parts)) images[n] = await img(`${d}/parts/${n}.png`);
    const rig = createRig(rj, pal, images);
    for (const m of man.motions) {
      const baked = bakeMotion(rig, { name: m, ...(await getJSON(`${d}/motions/${m}.json`)) });
      const hashes = [];
      for (const f of baked.frames) {
        const px = renderPose(rig, f.solved, { w: rig.cell.w, h: rig.cell.h, origin: rig.cell.origin });
        const h = await crypto.subtle.digest('SHA-256', px);
        hashes.push([...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, '0')).join(''));
      }
      out[`${id}/${m}`] = hashes;
    }
  }
  return out;
}, CHARS);

let frames = 0, diff = 0;
for (const id of CHARS) {
  const ch = loadChar(id);
  for (const m of ch.manifest.motions) {
    const baked = bakeMotion(ch.rig, ch.motions[m]);
    baked.frames.forEach((f, i) => {
      const px = renderPose(ch.rig, f.solved, { w: ch.rig.cell.w, h: ch.rig.cell.h, origin: ch.rig.cell.origin });
      const h = crypto.createHash('sha256').update(px).digest('hex');
      frames++;
      if (h !== inBrowser[`${id}/${m}`][i]) { diff++; console.log(`不一致: ${id}/${m} コマ${i}`); }
    });
  }
}
console.log(`ブラウザと Node の比較: ${frames} コマ中 ${diff} コマが不一致`);

if (process.argv[2]) {
  await page.check('#all'); await page.check('#bones'); await page.check('#pivots');
  await page.selectOption('#motion', 'stand_heavy');
  await page.click('#play');
  await page.evaluate(() => { const s = document.getElementById('scrub'); s.value = 12; s.dispatchEvent(new Event('input')); });
  await page.screenshot({ path: process.argv[2], fullPage: true });
}
console.log(errors.length ? `コンソールエラー:\n${errors.join('\n')}` : 'コンソールエラーなし');
await browser.close();
process.exit(diff || errors.length ? 1 : 0);
