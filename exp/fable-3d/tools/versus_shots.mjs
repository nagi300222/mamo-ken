#!/usr/bin/env node
// 2体確認ページ（preview/versus.html）の静止画・動画を撮る。スマホ横画面の比率（844×390）。
//   node versus_shots.mjs --pairs moguzo:godan,pisuke:takimaru --seq clinch --frames 10,30,50 --out DIR      （静止画シート）
//   node versus_shots.mjs --pairs moguzo:godan --seq clinch,roar,guard,hit,throw --video --out DIR           （動画）
import { serve, ROOT } from './lib/browser.mjs'; import { createRequire } from 'node:module'; import { execFileSync } from 'node:child_process'; import fs from 'node:fs'; import path from 'node:path';
const req = createRequire(import.meta.url); let pw; try { pw = req('playwright'); } catch { pw = req('/opt/node-tools/node_modules/playwright'); }
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i < 0 ? d : (process.argv[i + 1] === undefined || process.argv[i + 1].startsWith('--') ? true : process.argv[i + 1]); };
const pairs = String(arg('pairs', 'moguzo:godan')).split(',').map(p => p.split(':')); const seqs = String(arg('seq', 'clinch')).split(','); const out = arg('out', path.join(ROOT, '_scratch', 'versus')); fs.mkdirSync(out, { recursive: true });
const W = +arg('w', 844), H = +arg('h', 390); const view = arg('view', 'side');
const { srv, url } = await serve(); const br = await pw.chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
const p = await (await br.newContext({ viewport: { width: W, height: H } })).newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e))); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await p.goto(`${url}/preview/versus.html?manual=1&bare=1&span=${arg('span', '2.0')}`); await p.waitForFunction(() => window.versus && (window.versus.ready || window.versus.error), null, { timeout: 120000 });
const ff = (...a) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...a]);
for (const [a, b] of pairs) for (const seq of seqs) {
  const total = await p.evaluate(([a, b, seq, view]) => window.versus.setup(a, b, seq, view), [a, b, seq, view]);
  if (arg('video', false)) { const dir = path.join(out, `_${a}_${b}_${seq}`); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir);
    for (let f = 0; f < total; f++) { await p.evaluate((f) => { window.versus.setFrame(f); window.versus.draw(); }, f); await p.screenshot({ path: path.join(dir, String(f).padStart(4, '0') + '.png') }); }
    const mp4 = path.join(out, `${a}_vs_${b}_${seq}.mp4`); ff('-framerate', '60', '-i', path.join(dir, '%04d.png'), '-c:v', 'libx264', '-crf', '27', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', mp4); fs.rmSync(dir, { recursive: true, force: true }); console.log(mp4, total + 'f');
  } else { const frames = String(arg('frames', '10')).split(',').map(Number); const files = [];
    for (const f of frames) { await p.evaluate((f) => { window.versus.setFrame(f); window.versus.draw(); }, f); const fn = path.join(out, `_${a}_${b}_${seq}_${f}.png`); await p.screenshot({ path: fn }); files.push(fn); }
    const sheet = path.join(out, `${a}_vs_${b}_${seq}.png`); if (files.length > 1) { ff(...files.flatMap(f => ['-i', f]), '-filter_complex', `vstack=inputs=${files.length}`, sheet); files.forEach(f => fs.unlinkSync(f)); } else fs.renameSync(files[0], sheet); console.log(sheet); }
}
if (errs.length) console.log('ERRORS', errs); await br.close(); srv.close();
