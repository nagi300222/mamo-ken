#!/usr/bin/env node
// 9体ならべ（preview/lineup.html）で、指定クリップ・フレームの静止画を縦に積む。  node lineup_shots.mjs --poses roar:20,ko:64 --out FILE [--view side|q|front]
import { serve, ROOT } from './lib/browser.mjs'; import { createRequire } from 'node:module'; import { execFileSync } from 'node:child_process'; import fs from 'node:fs'; import path from 'node:path';
const req = createRequire(import.meta.url); let pw; try { pw = req('playwright'); } catch { pw = req('/opt/node-tools/node_modules/playwright'); }
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i < 0 ? d : process.argv[i + 1]; };
const poses = String(arg('poses', 'idle:0')).split(',').map(p => p.split(':')); const out = arg('out', path.join(ROOT, '_scratch', 'lineup.png')); const view = arg('view', 'side');
const { srv, url } = await serve(); const br = await pw.chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
const p = await (await br.newContext({ viewport: { width: +arg('w', 1800), height: +arg('h', 380) } })).newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e)));
await p.goto(url + '/preview/lineup.html?manual=1'); await p.waitForFunction(() => window.lineup && (window.lineup.ready || window.lineup.error), null, { timeout: 180000 }); const files = [];
for (const [clip, f] of poses) { await p.evaluate(([clip, f, view]) => { const L = window.lineup; L.play(clip); L.S.view = view; L.place(); L.setTime(f / 60); L.draw(); }, [clip, +f, view]); const fn = `${out}.${clip}_${f}.png`; await p.screenshot({ path: fn }); files.push(fn); }
if (files.length > 1) { execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...files.flatMap(f => ['-i', f]), '-filter_complex', `vstack=inputs=${files.length}`, out]); files.forEach(f => fs.unlinkSync(f)); } else fs.renameSync(files[0], out);
if (errs.length) console.log('ERRORS', errs); await br.close(); srv.close(); console.log(out);
