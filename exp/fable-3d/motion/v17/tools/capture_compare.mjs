#!/usr/bin/env node
// 通常技の比較映像の素材を撮る: 実ゲームの対戦カメラ（横画面）で、クリップを 1/60 秒ずつ進めて毎フレーム撮る。
// ＝ 仮想時間の 60fps。実機の描画 fps を測ったものではない。ゲームのソースは変えず、通常技パックの読み込みだけ差し替える。
//   node capture_compare.mjs --out DIR --pack DIR|current --contacts normal_contacts_v17.json [--ids ..] [--slots ..] [--mirror] [--still]
//   --pack current : 現行ゲームが読む normal/v15（v15 の 54 本）。 --mirror : 自キャラを右側に置いて左向きで再生。 --still : 接触時刻の 1 枚だけ。
import fs from 'node:fs'; import path from 'node:path';
import { serve, launch, openGame, ALL, arg } from '../../../presentation/v151/tools/lib.mjs';
const SLOTS = String(arg('slots', 'stand_weak,stand_heavy,crouch_weak,crouch_heavy,air_weak,air_heavy')).split(','), ids = String(arg('ids', ALL.join(','))).split(',');
const out = path.resolve(String(arg('out'))), pack = String(arg('pack', 'current')), C = JSON.parse(fs.readFileSync(String(arg('contacts')))), mirror = !!arg('mirror', false), still = !!arg('still', false), foe = String(arg('foe', 'moguzo'));
const { srv, url } = await serve(); const browser = await launch();
for (const id of ids) {
  const g = await openGame(browser, url, { scale: 1 });
  if (pack !== 'current') await g.page.route(/\/normal\/v15\/(\w+)_normals\.glb/, r => { const c = r.request().url().match(/\/(\w+)_normals\.glb/)[1]; r.fulfill({ contentType: 'model/gltf-binary', body: fs.readFileSync(path.join(path.resolve(pack), c + '_normals.glb')) }); });
  await g.start(id, foe === id ? 'pisuke' : foe); await g.until('fight', 900); await g.step(20);
  await g.page.addStyleTag({ content: '.hud,#note,#round-call,#showtime-banner,#presentation-skip{visibility:hidden!important}' });
  const box = await g.page.locator('#arena').boundingBox(); const clip = { x: Math.round(box.x), y: Math.round(box.y), width: Math.round(box.width) & ~1, height: Math.round(box.height) & ~1 };
  for (const slot of SLOTS) { const c = C[id][slot], air = slot.startsWith('air_'), dist = c.reach + .16, dir = path.join(out, id, slot + (mirror ? '_mirror' : '')); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
    const info = await g.page.evaluate(([name]) => { const a = mamoken3d.actors[0], act = a.actions[name]; return { dur: act.getClip().duration }; }, ['v15_' + slot]);
    const frames = still ? [Math.round(c.contact * info.dur * 60)] : Array.from({ length: Math.round(info.dur * 60) + 13 }, (_, i) => i - 6);     // 前後に構えを少し入れる
    let n = 0;
    for (const f of frames) {
      await g.page.evaluate(([name, f, dist, air, mirror]) => { const gme = mamoken3d.battle, [p, t] = gme.fighters, a = mamoken3d.actors[0], act = a.actions[name]; gme.time = 70 * 60;
        for (const q of [p, t]) { q.vy = 0; q.action = null; q.stun = 0; q.stop = 0; q.state = 'idle'; q.hp = mamoken3d.ROSTER[q.id].hp; }
        const s = mirror ? -1 : 1; p.x = -s * dist / 2; t.x = s * dist / 2; p.facing = s; t.facing = -s; t.y = 0; p.y = air ? .34 : 0; if (air) p.vy = .0062;
        if (f < 0 || f > act.getClip().duration * 60) { if (a.current === act) { act.stop(); a.key = ''; } return; }          // 構え（ゲームの idle へ戻す）
        for (const k in a.actions) if (a.actions[k] !== act) a.actions[k].stop();
        act.reset(); act.enabled = true; act.setEffectiveWeight(1); act.setEffectiveTimeScale(1); act.clampWhenFinished = true; act.play(); act.paused = true; act.time = Math.min(act.getClip().duration - 1e-4, f / 60); a.current = act; a.mixer.update(0);
      }, ['v15_' + slot, f, dist, air, mirror]);
      await g.step(1); await g.page.screenshot({ path: path.join(dir, String(n++).padStart(4, '0') + '.png'), clip }); }
    await g.page.evaluate(() => { const a = mamoken3d.actors[0]; a.current?.stop(); a.key = ''; const p = mamoken3d.battle.fighters[0]; p.y = 0; p.vy = 0; }); await g.step(2); }
  console.log(id, 'ok', g.errors.length ? g.errors[0] : ''); await g.ctx.close();
}
await browser.close(); srv.close();
