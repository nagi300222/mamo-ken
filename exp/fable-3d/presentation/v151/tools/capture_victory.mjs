#!/usr/bin/env node
// 9体の「K.O. スロー → 勝利ムービー → 結果」を実ゲームで撮る。時計を 1/60 秒ずつ進めて毎フレーム撮り、60fps で連結する
// ＝ 実機と同じ再生速度の映像（コマ送りの比較動画とは別物）。ゲームのソースは変更しない（相手 CPU を無入力にする差し替えのみ）。
// 仮想時計で決定的に書き出す制作映像。60fpsで符号化するが、実機の描画FPSを測定した録画ではない。
//   node capture_victory.mjs --out DIR [--ids moguzo,godan] [--foe pisuke] [--every 1] [--from ko|victory] [--variant full|short] [--winner 0|1] [--mp4]
import fs from 'node:fs'; import path from 'node:path'; import { execFileSync } from 'node:child_process';
import { serve, launch, openGame, ALL, arg } from './lib.mjs';
const ids = String(arg('ids', ALL.join(','))).split(','), out = path.resolve(String(arg('out'))), every = +arg('every', 1), from = String(arg('from', 'ko')), variant = String(arg('variant', 'full')), winner = +arg('winner', 0);
const foeOf = id => String(arg('foe', id === 'pisuke' ? 'moguzo' : 'pisuke'));
const { srv, url } = await serve(); const browser = await launch(); fs.mkdirSync(out, { recursive: true });
for (const id of ids) {
  const g = await openGame(browser, url, { scale: +arg('scale', 1) }); const dir = path.join(out, id + (winner ? '_cpu' : '') + (variant === 'short' ? '_short' : '')); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  const pair = winner === 0 ? [id, foeOf(id)] : [foeOf(id), id];
  if (variant === 'short') { await g.page.selectOption('#cpu-choice', pair[1]); await g.page.evaluate(([a, b]) => mamoken3d.startMatch({ ids: [a, b], victoryVariant: 'short', vsVariant: 'short' }), pair);
    await g.page.waitForFunction(() => mamoken3d.presentation.loaded, null, { timeout: 90000 }); await g.page.clock.pauseAt(new Date(Date.now() + 3600e3)); }
  else await g.start(pair[0], pair[1]);
  await g.until('fight', 600); await g.step(30); await g.finish('ko', { winner });
  const box = await g.page.locator('#arena').boundingBox(); const clip = { x: Math.round(box.x), y: Math.round(box.y), width: Math.round(box.width) & ~1, height: Math.round(box.height) & ~1 };
  let n = 0, f = 0; const shot = async () => { if (f++ % every === 0) await g.page.screenshot({ path: path.join(dir, String(n++).padStart(4, '0') + '.png'), clip }); };
  if (from === 'ko') await g.until('ko', 200, shot); else await g.until('ko', 200);
  if (from === 'ko') await g.until('victory', 400, shot); else await g.until('victory', 400);
  await g.until('result', 700, shot); for (let i = 0; i < 40; i++) { await shot(); await g.step(1); }
  const s = await g.state(); console.log(id, 'frames', n, 'state', s.state, 'clip', s.victoryClip, 'errors', g.errors.length, g.errors[0] || '');
  if(g.errors.length)throw Error('Movie render errors: '+g.errors.join(' | '));
  if (arg('mp4', false)) execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(60 / every), '-i', path.join(dir, '%04d.png'), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '23', path.join(out, path.basename(dir) + '_victory.mp4')]);
  await g.ctx.close();
}
await browser.close(); srv.close();
