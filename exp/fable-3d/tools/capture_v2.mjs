#!/usr/bin/env node
// モーションv2 の確認用画像・動画を撮る（既存の capture.mjs の成果物には触れない）。
//   node exp/fable-3d/tools/capture_v2.mjs [--only moguzo] [--skip sheets,video,lineup,versus]
// 出力: chars/{id}/renders/motion_v2_sheet.jpg, chars/{id}/motions/{v2クリップ}.mp4 と all_v2.mp4, roster/v2/*
import { open, ROOT } from './lib/browser.mjs';
import { execFileSync } from 'node:child_process'; import fs from 'node:fs'; import path from 'node:path';
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i < 0 ? d : process.argv[i + 1]; };
const ALL = ['moguzo', 'pisuke', 'godan', 'hakuma', 'chirka', 'takimaru', 'yomikage', 'bullet', 'dark_moguzo'];
const CHARS = String(arg('only', ALL.join(','))).split(','); const SKIP = String(arg('skip', '')).split(',');
const TMP = path.join(ROOT, '_scratch', 'cap2'); fs.mkdirSync(TMP, { recursive: true });
const ff = (...a) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...a]); const node = (...a) => execFileSync('node', a, { stdio: 'inherit' });
const py = (...a) => execFileSync('python3', [path.join(ROOT, 'tools', 'compose.py'), ...a], { stdio: 'inherit' });
const keyFrame = (c) => c.end_pose === 'down' ? c.frames : (c.hits ? c.hits[0][0] + 1 : (c.startup !== undefined ? c.startup + 1 : (c.loop_from !== undefined ? c.loop_from + 4 : Math.max(3, Math.round(c.frames * 0.22)))));

for (const id of CHARS) {
  const meta = JSON.parse(fs.readFileSync(path.join(ROOT, 'chars', id, `${id}_motions.json`), 'utf8')); const v2 = meta.v2_clips;
  if (!SKIP.includes('sheets')) {      // 追加クリップごとに要所の1フレーム（ゲーム視点）を並べた一覧
    const b = await open({ width: 300, height: 300 }); await b.page.evaluate(async (c) => { await window.mamo.load(c); window.mamo.set({ paused: true }); }, id); const cells = [];
    for (const n of v2) { const f = keyFrame(meta.clips[n]); await b.page.evaluate(([n, f]) => { const m = window.mamo; m.play(n, { fade: 0 }); m.setTime(f / 60); m.setCamera('game', { span: 1.75 }); }, [n, f]); const fn = path.join(TMP, `${id}_${n}.png`); await b.shot(fn); cells.push([`${n}  F${f}`, fn]); }
    if (b.errors.length) console.log('errors', b.errors); await b.close(); py('cells', id, JSON.stringify(cells), path.join(ROOT, 'chars', id, 'renders', 'motion_v2_sheet.jpg'));
  }
  if (!SKIP.includes('video')) {       // 追加クリップの動画（ゲーム視点）。単発は終端で少し止める
    const out = path.join(ROOT, 'chars', id, 'motions'); const b = await open({ width: 560, height: 400, query: 'manual=1&bare=1' }); await b.page.evaluate(async (c) => { await window.mamo.load(c); window.mamo.set({ paused: true }); }, id); const list = [];
    for (const n of v2) { const N = meta.clips[n].frames; const dir = path.join(TMP, `${id}_${n}`); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
      await b.page.evaluate(([n, root]) => { const m = window.mamo; m.set({ root }); m.play(n, { fade: 0 }); m.setCamera('game', { span: 1.9, centerY: 0.55, centerZ: 0.05 }); }, [n, false]);
      for (let i = 0; i <= N + 10; i++) { await b.page.evaluate((f) => { window.mamo.setTime(f / 60); window.mamo.draw(); }, Math.min(i, N)); await b.page.locator('#view').screenshot({ path: path.join(dir, String(i).padStart(4, '0') + '.png') }); }
      const mp4 = path.join(out, `${n}.mp4`); ff('-framerate', '60', '-i', path.join(dir, '%04d.png'), '-c:v', 'libx264', '-crf', '28', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', mp4); list.push(mp4); fs.rmSync(dir, { recursive: true, force: true }); }
    const lst = path.join(TMP, `${id}_v2.txt`); fs.writeFileSync(lst, list.map(f => `file '${f}'`).join('\n')); ff('-f', 'concat', '-safe', '0', '-i', lst, '-c', 'copy', path.join(out, 'all_v2.mp4')); await b.close(); console.log(`  ${id}: ${list.length} clips`);
  }
}
const R2 = path.join(ROOT, 'roster', 'v2'); fs.mkdirSync(R2, { recursive: true });
if (!SKIP.includes('lineup') && CHARS.length === ALL.length) {      // 9体を並べた比較（静止画と動画）
  const T = path.join(ROOT, 'tools');
  node(path.join(T, 'lineup_shots.mjs'), '--poses', 'roar:11,roar:20,gyuiin:15,clinch_hold:20,guard_hit:3,guard_crouch:10,hurt_heavy:6,ko:64', '--out', path.join(R2, 'lineup_reactions.png'), '--h', '330');
  node(path.join(T, 'lineup_shots.mjs'), '--poses', 'throw_reach:8,crouch_light:7,crouch_heavy:14,air_light:8,air_heavy:13,cmd_236:15,cmd_623:12,super:22', '--out', path.join(R2, 'lineup_attacks.png'), '--h', '330');
  const { serve } = await import('./lib/browser.mjs'); const { createRequire } = await import('node:module'); const req = createRequire(import.meta.url); let pw; try { pw = req('playwright'); } catch { pw = req('/opt/node-tools/node_modules/playwright'); }
  const { srv, url } = await serve(); const br = await pw.chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] }); const p = await (await br.newContext({ viewport: { width: 1800, height: 400 } })).newPage();
  await p.goto(url + '/preview/lineup.html?manual=1&bare=1'); await p.waitForFunction(() => window.lineup && (window.lineup.ready || window.lineup.error), null, { timeout: 180000 }); const list = [];
  for (const clip of ['roar', 'gyuiin', 'guard_hit', 'hurt_heavy', 'ko', 'throw_reach', 'crouch_heavy', 'air_heavy', 'cmd_236', 'cmd_623', 'super']) { const N = await p.evaluate((c) => window.lineup.maxFrames(c), clip); const dir = path.join(TMP, 'l_' + clip); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
    for (let f = 0; f <= N + 8; f++) { await p.evaluate(([clip, f]) => { const L = window.lineup; if (L.S.clip !== clip) L.play(clip); L.setTime(f / 60); L.draw(); }, [clip, f]); await p.screenshot({ path: path.join(dir, String(f).padStart(4, '0') + '.png') }); }
    const mp4 = path.join(TMP, `lineup_${clip}.mp4`); ff('-framerate', '60', '-i', path.join(dir, '%04d.png'), '-c:v', 'libx264', '-crf', '28', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', mp4); list.push(mp4); fs.rmSync(dir, { recursive: true, force: true }); process.stdout.write(`  lineup/${clip}\n`); }
  const lst = path.join(TMP, 'l.txt'); fs.writeFileSync(lst, list.map(f => `file '${f}'`).join('\n')); ff('-f', 'concat', '-safe', '0', '-i', lst, '-c', 'copy', path.join(R2, 'lineup_v2_all.mp4')); await br.close(); srv.close();
}
if (!SKIP.includes('versus') && CHARS.length === ALL.length) {      // 2体を向かい合わせた確認（スマホ横画面の比率）
  const V = path.join(ROOT, 'tools', 'versus_shots.mjs'); const out = path.join(R2, 'versus');
  node(V, '--pairs', 'moguzo:godan,pisuke:takimaru,chirka:hakuma,bullet:yomikage,dark_moguzo:moguzo,moguzo:moguzo', '--seq', 'clinch', '--video', '--out', out, '--span', '2.0');
  node(V, '--pairs', 'moguzo:godan,pisuke:takimaru', '--seq', 'roar,roar_guard,guard,hit,throw', '--video', '--out', out, '--span', '2.0');
  node(V, '--pairs', 'moguzo:godan,pisuke:takimaru,chirka:takimaru,hakuma:takimaru,chirka:chirka', '--seq', 'clinch', '--frames', '12,30,50,60', '--out', out, '--span', '1.7');
  node(V, '--pairs', 'moguzo:godan,pisuke:takimaru', '--seq', 'throw', '--frames', '8,20,30,40,70', '--out', out, '--span', '1.9');
}
py('tojpg', R2); if (fs.existsSync(path.join(R2, 'versus'))) py('tojpg', path.join(R2, 'versus'));
