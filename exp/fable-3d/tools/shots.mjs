#!/usr/bin/env node
// 任意のポーズを Three.js プレビュー経由で撮る（確認用）。
//   node shots.mjs --char moguzo --poses idle:0,crouch:30 --cams game,three_quarter,front,back34 --out DIR [--toon] [--bones] [--size 420]
import { open } from './lib/browser.mjs';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs'; import path from 'node:path';
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i < 0 ? d : (process.argv[i + 1]?.startsWith('--') || process.argv[i + 1] === undefined ? true : process.argv[i + 1]); };
const char = arg('char', 'moguzo'), poses = String(arg('poses', 'idle:0')).split(','), cams = String(arg('cams', 'game,three_quarter,front,back34')).split(',');
const out = arg('out', '_scratch'), size = +arg('size', 420); fs.mkdirSync(out, { recursive: true });
const b = await open({ width: size, height: size });
await b.page.evaluate(async ([c, toon, bones, facing]) => { await window.mamo.load(c); window.mamo.set({ toon, bones, facing, paused: true }); }, [char, !!arg('toon', false), !!arg('bones', false), arg('facing', 'right')]);
for (const p of poses) {
  const [clip, fr] = p.split(':'); const files = [];
  for (const cam of cams) {
    await b.page.evaluate(([clip, fr, cam, span]) => { const m = window.mamo; m.play(clip, { fade: 0 }); m.setTime(fr / 60); m.setCamera(cam, { span }); }, [clip, +fr, cam, +arg('span', 1.75)]);
    const f = path.join(out, `_${char}_${clip}_${fr}_${cam}.png`); await b.shot(f); files.push(f);
  }
  const sheet = path.join(out, `${char}_${clip}_${fr}.png`);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...files.flatMap(f => ['-i', f]), '-filter_complex', `hstack=inputs=${files.length}`, sheet]);
  files.forEach(f => fs.unlinkSync(f)); console.log(sheet);
}
if (b.errors.length) console.log('ERRORS', b.errors);
await b.close();
