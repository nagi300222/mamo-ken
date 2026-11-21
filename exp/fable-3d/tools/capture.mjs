#!/usr/bin/env node
// 納品用の画像・動画を Three.js プレビュー（＝実際のGLB）から撮る。
//   node exp/fable-3d/tools/capture.mjs [--only moguzo] [--skip video]
// 出力: chars/{id}/renders/*.jpg, chars/{id}/motions/*.mp4, validation/deform/{id}_*.jpg
import { open, ROOT } from './lib/browser.mjs';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs'; import path from 'node:path';
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i < 0 ? d : process.argv[i + 1]; };
const ALL = ['moguzo', 'pisuke', 'godan', 'hakuma', 'chirka', 'takimaru', 'yomikage', 'bullet', 'dark_moguzo'];
const CHARS = String(arg('only', ALL.join(','))).split(','); const SKIP = String(arg('skip', '')).split(',');
const TMP = path.join(ROOT, '_scratch', 'cap'); fs.mkdirSync(TMP, { recursive: true });
const ff = (...a) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...a]);
const py = (...a) => execFileSync('python3', [path.join(ROOT, 'tools', 'compose.py'), ...a], { stdio: 'inherit' });
const REFCAM = { moguzo: [-0.30, 0.10, 1], pisuke: [-0.80, 0.10, 0.62], godan: [-0.12, 0.10, 1], hakuma: [-0.30, 0.10, 1], chirka: [-0.50, 0.10, 0.9], takimaru: [0.20, 0.10, 1], yomikage: [-0.70, 0.10, 0.72], bullet: [-0.45, 0.10, 0.9], dark_moguzo: [-0.30, 0.10, 1] };   // 元絵に近い角度

async function stills(b, id) {
  const out = path.join(ROOT, 'chars', id, 'renders'); fs.mkdirSync(out, { recursive: true });
  const pose = (clip, f, cam, o = {}) => b.page.evaluate(([clip, f, cam, o]) => { const m = window.mamo; m.set({ toon: !!o.toon, facing: o.facing || 'right', bones: false }); m.play(clip, { fade: 0 }); m.setTime(f / 60);
    if (Array.isArray(cam)) { m.setCamera('front', o); const H = m.S.height; const c = m.S; const v = new m.THREE.Vector3(...cam).normalize(); const cam3 = m.cameraRef(); const t = new m.THREE.Vector3(0, (o.centerY ?? 0.5) * H, 0); const d = cam3.position.distanceTo(t); cam3.position.copy(v.multiplyScalar(d).add(t)); cam3.lookAt(t); }
    else m.setCamera(cam, o); }, [clip, f, cam, o]);
  await b.page.evaluate(async (c) => { await window.mamo.load(c); window.mamo.set({ paused: true, grid: true }); }, id);
  for (const [name, cam] of [['front', 'front'], ['side', 'game'], ['three_quarter', 'three_quarter'], ['back', 'back']]) { await pose('idle', 0, cam, { span: 1.35 }); await b.shot(path.join(out, `${name}.png`)); }
  await pose('idle', 0, 'three_quarter', { span: 1.35, toon: true }); await b.shot(path.join(out, 'toon_three_quarter.png'));
  await pose('idle', 0, 'game', { span: 1.35, toon: true }); await b.shot(path.join(out, 'toon_side.png'));
  await pose('idle', 0, 'game', { span: 1.35, facing: 'left' }); await b.shot(path.join(TMP, `${id}_left_mirror.png`));
  await pose('idle', 0, 'game', { span: 1.35, facing: 'left_rot' }); await b.shot(path.join(TMP, `${id}_left_rot.png`));
  await pose('idle', 0, 'game', { span: 1.35 }); await b.shot(path.join(TMP, `${id}_right.png`));
  await pose('idle', 0, REFCAM[id], { span: 1.35 }); await b.shot(path.join(TMP, `${id}_refangle.png`));
  py('turnaround', id, out); py('compare', id, TMP, out); py('facing', id, TMP, out); py('tojpg', out);
}

async function videos(b, id) {
  const out = path.join(ROOT, 'chars', id, 'motions'); fs.mkdirSync(out, { recursive: true });
  const meta = JSON.parse(fs.readFileSync(path.join(ROOT, 'chars', id, `${id}_motions.json`), 'utf8')); const list = [];
  for (const [clip, info] of Object.entries(meta.clips)) {
    const N = info.frames; const seq = []; const reps = info.loop ? 2 : 1;
    for (let r = 0; r < reps; r++) for (let f = (r ? 1 : 0); f <= N; f++) seq.push(f);
    if (!info.loop) for (let k = 0; k < 14; k++) seq.push(N);
    const dir = path.join(TMP, `${id}_${clip}`); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
    await b.page.evaluate(([clip, root]) => { const m = window.mamo; m.set({ toon: false, facing: 'right', root }); m.play(clip, { fade: 0 }); }, [clip, ['jump_n', 'dash_f'].includes(clip)]);
    for (const [vi, cam] of ['game', 'three_quarter'].entries()) {
      await b.page.evaluate(([cam, clip]) => window.mamo.setCamera(cam, { span: clip === 'jump_n' ? 2.15 : (clip === 'dash_f' ? 1.7 : 1.42), centerY: clip === 'jump_n' ? 0.90 : 0.52, centerZ: clip === 'dash_f' ? 0.22 : 0.05 }), [cam, clip]);
      for (const [i, f] of seq.entries()) { await b.page.evaluate((f) => { window.mamo.setTime(f / 60); window.mamo.draw(); }, f); await b.page.locator('#view').screenshot({ path: path.join(dir, `${vi}_${String(i).padStart(4, '0')}.png`) }); }
    }
    const mp4 = path.join(out, `${clip}.mp4`);
    ff('-framerate', '60', '-i', path.join(dir, '0_%04d.png'), '-framerate', '60', '-i', path.join(dir, '1_%04d.png'), '-filter_complex', 'hstack=inputs=2', '-c:v', 'libx264', '-crf', '27', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', mp4);
    list.push(mp4); fs.rmSync(dir, { recursive: true, force: true }); process.stdout.write(`  ${id}/${clip} ${seq.length}f\n`);
  }
  const lst = path.join(TMP, `${id}_list.txt`); fs.writeFileSync(lst, list.map(f => `file '${f}'`).join('\n'));
  ff('-f', 'concat', '-safe', '0', '-i', lst, '-c', 'copy', path.join(out, 'all.mp4'));
  await b.page.evaluate(() => window.mamo.set({ root: false }));
}

async function deform(id) {
  const out = path.join(ROOT, 'validation', 'deform'); fs.mkdirSync(out, { recursive: true }); const cams = ['game', 'three_quarter', 'front', 'back34']; const rows = [];
  const grab = async (b, label, setup, cs = cams, span = 1.5) => { const files = []; for (const cam of cs) { await b.page.evaluate(setup); await b.page.evaluate(([cam, span]) => window.mamo.setCamera(cam, { span }), [cam, span]); const f = path.join(TMP, `${id}_d${rows.length}_${cam}.png`); await b.shot(f); files.push(f); } rows.push([label, files]); };
  const at = (clip, f) => `(() => { const m = window.mamo; m.play('${clip}', { fade: 0 }); m.setTime(${f} / 60); })()`;
  let b = await open({ width: 360, height: 360, query: `manual=1&bare=1&nohud=1&flat=1&base=../_scratch/deform&char=${id}` });
  const dm = JSON.parse(fs.readFileSync(path.join(ROOT, '_scratch', 'deform', `${id}_motions.json`), 'utf8')).clips.deform_test.shots;
  await grab(b, '腕を前へ突き出す', at('deform_test', dm.arms_forward)); await grab(b, '腕を頭上に上げる', at('deform_test', dm.arms_overhead)); await grab(b, '片脚を大きく上げる', at('deform_test', dm.leg_raise));
  await grab(b, '拳の回転 0°', at('deform_test', dm.fist_0)); await grab(b, '拳の回転 90°', at('deform_test', dm.fist_90)); await grab(b, '拳の回転 180°', at('deform_test', dm.fist_180)); await grab(b, '拳の回転 270°', at('deform_test', dm.fist_270));
  const errs1 = b.errors.slice(); await b.close(); py('sheet', id, 'A_腕・脚・拳の回転', JSON.stringify(rows), path.join(out, `${id}_A_limbs.png`)); rows.length = 0;
  b = await open({ width: 360, height: 360, query: `manual=1&bare=1&nohud=1&char=${id}` });
  const meta = JSON.parse(fs.readFileSync(path.join(ROOT, 'chars', id, `${id}_motions.json`), 'utf8')).clips;
  await grab(b, '深くしゃがむ（片手を地面）', at('crouch', meta.crouch.frames));
  const xf = (t) => `(() => { const m = window.mamo; m.play('crouch', { fade: 0 }); m.setTime(${meta.crouch.frames} / 60); m.play('jump_n', { fade: 0.10 }); m.step(${t}); })()`;
  await grab(b, 'しゃがみ→ジャンプ（クロスフェード中 0.05s）', xf(0.05)); await grab(b, 'しゃがみ→ジャンプ（0.15s 後）', xf(0.15));
  await grab(b, 'ジャンプ頂点（脚の折り畳み）', at('jump_n', meta.jump_n.airborne[0] + Math.round((meta.jump_n.airborne[1] - meta.jump_n.airborne[0]) / 2)));
  await grab(b, '着地', at('jump_n', meta.jump_n.airborne[1] + 2));
  py('sheet', id, 'B_しゃがみ・ジャンプ', JSON.stringify(rows), path.join(out, `${id}_B_crouch_jump.png`)); rows.length = 0;
  const sl = meta.stand_light; await grab(b, 'パンチ（発生フレーム）', at('stand_light', sl.startup)); await grab(b, 'パンチ後 +6F', at('stand_light', sl.startup + sl.active + 6)); await grab(b, 'パンチ終了（待機へ戻る）', at('stand_light', sl.frames));
  await grab(b, '待機 F0（比較用）', at('idle', 0)); const sh = meta.stand_heavy; await grab(b, '強攻撃（発生フレーム）', at('stand_heavy', sh.startup + 1));
  py('sheet', id, 'C_攻撃と待機への復帰', JSON.stringify(rows), path.join(out, `${id}_C_attack_return.png`)); rows.length = 0;
  await grab(b, 'ダッシュ中（尻尾・装飾の遅れ）', at('dash_f', Math.round(meta.dash_f.frames * 0.45))); await grab(b, 'ダッシュ着地直後', at('dash_f', Math.round(meta.dash_f.frames * 0.8)));
  await grab(b, '被弾（のけぞり）', at('hurt_light', 4)); await grab(b, '歩き（片足が浮く瞬間）', at('walk_f', Math.round(meta.walk_f.frames * 0.8)));
  for (const [n, c] of Object.entries(meta)) if (n.startsWith('sp_')) { const f0 = c.hits ? c.hits[0][0] : c.startup; await grab(b, `固有モーション ${n}（F${f0 + 1}）`, at(n, f0 + 1)); if (c.hits && c.hits[1]) await grab(b, `固有モーション ${n}（F${c.hits[1][0] + 1}）`, at(n, c.hits[1][0] + 1)); }
  py('sheet', id, 'D_尻尾・装飾の揺れと被弾・歩き・固有モーション', JSON.stringify(rows), path.join(out, `${id}_D_secondary.png`)); rows.length = 0;
  if (meta.sp_tail_whip) {            // 長い尻尾の打撃を、横・真上・斜め・後ろから数フレームおきに並べる（軌道、胴や床との干渉、読みやすさの確認用）
    const tw = meta.sp_tail_whip; for (const f of [0, 9, 13, 16, tw.startup, tw.tail_tip_max_forward_frame, tw.startup + tw.active + 3, tw.startup + tw.active + 12]) await grab(b, `尾薙ぎ F${f}` + (f === tw.tail_tip_max_forward_frame ? `（最大リーチ ${tw.tail_tip_max_forward_m}m）` : ''), at('sp_tail_whip', f), ['game', 'top', 'three_quarter', 'back34'], 2.5);
    py('sheet', id, 'E_長い尻尾の打撃（左から: ゲーム視点 / 真上 / 斜め前 / 斜め後ろ）', JSON.stringify(rows), path.join(out, `${id}_E_tail_whip.png`)); rows.length = 0;
  }
  const errs = errs1.concat(b.errors); await b.close(); if (errs.length) console.log('console errors', errs);
  py('tojpg', out);
}

for (const id of CHARS) {
  console.log('capture', id);
  if (!SKIP.includes('stills')) { const b = await open({ width: 520, height: 600, scale: 1 }); await stills(b, id); await b.close(); }
  if (!SKIP.includes('video')) { const b = await open({ width: 440, height: 440, query: 'manual=1&bare=1' }); await b.page.evaluate(async (c) => { await window.mamo.load(c); window.mamo.set({ paused: true }); }, id); await videos(b, id); await b.close(); }
  if (!SKIP.includes('deform')) await deform(id);
}

// ---- 9体まとめ（同じ縮尺・同じ光）----
async function roster() {
  const out = path.join(ROOT, 'roster'); fs.mkdirSync(out, { recursive: true });
  const { serve } = await import('./lib/browser.mjs'); const { createRequire } = await import('node:module'); const req = createRequire(import.meta.url); let pw; try { pw = req('playwright'); } catch { pw = req('/opt/node-tools/node_modules/playwright'); }
  const { srv, url } = await serve(); const br = await pw.chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
  const p = await (await br.newContext({ viewport: { width: 1800, height: 400 } })).newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto(url + '/preview/lineup.html?manual=1&bare=1'); await p.waitForFunction(() => window.lineup && (window.lineup.ready || window.lineup.error), null, { timeout: 180000 });
  const at = (clip, f, view) => p.evaluate(([clip, f, view]) => { const L = window.lineup; if (L.S.clip !== clip) L.play(clip); if (view) { L.S.view = view; L.place(); } L.setTime(f / 60); L.draw(); }, [clip, f, view]);
  for (const [v, name] of [['side', 'lineup_side'], ['q', 'lineup_three_quarter'], ['front', 'lineup_front']]) { await at('idle', 0, v); await p.screenshot({ path: path.join(out, name + '.png') }); }
  if (!SKIP.includes('lineupvideo')) { const list = [];
    for (const clip of ['idle', 'walk_f', 'dash_f', 'crouch', 'jump_n', 'stand_light', 'stand_heavy', 'guard_stand', 'hurt_light', 'unique']) {
      const N = await p.evaluate((c) => window.lineup.maxFrames(c), clip); const dir = path.join(TMP, 'lineup_' + clip); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true }); await at(clip, 0, 'side');
      const total = (clip === 'idle' || clip === 'walk_f') ? N : N + 10; for (let f = 0; f <= total; f++) { await at(clip, f); await p.screenshot({ path: path.join(dir, String(f).padStart(4, '0') + '.png') }); }
      const mp4 = path.join(out, `lineup_${clip}.mp4`); ff('-framerate', '60', '-i', path.join(dir, '%04d.png'), '-c:v', 'libx264', '-crf', '28', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', mp4); list.push(mp4); fs.rmSync(dir, { recursive: true, force: true }); process.stdout.write(`  lineup/${clip} ${total}f\n`); }
    const lst = path.join(TMP, 'lineup_list.txt'); fs.writeFileSync(lst, list.map(f => `file '${f}'`).join('\n')); ff('-f', 'concat', '-safe', '0', '-i', lst, '-c', 'copy', path.join(out, 'lineup_all.mp4')); for (const f of list) if (!/lineup_(unique|stand_heavy|walk_f)\.mp4$/.test(f)) fs.unlinkSync(f); }
  await br.close(); srv.close(); if (errs.length) console.log('lineup errors', errs);
  py('grid', 'compare', out); py('grid', 'turnaround', out); py('tojpg', out);
}
if (!SKIP.includes('roster') && CHARS.length === ALL.length) await roster();
