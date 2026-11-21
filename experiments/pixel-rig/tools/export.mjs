// 全モーションの全コマを書き出す: node tools/export.mjs [charId...]
//   out/<id>/frames/<motion>_<nn>.png  1コマずつの透過PNG（共通セル、足元原点固定、移動は含めない）
//   out/<id>/sheet.png + anim.json     スプライトシートとアニメーション定義
//   out/<id>/gif/<motion>.gif          確認用GIF（移動を反映、3倍）
//   out/<id>/contact.png               目視確認用コンタクトシート（2倍、行=モーション）
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, CHARS, loadChar } from './lib/load.mjs';
import { bakeMotion, renderPose, boundsOf } from '../src/rig.js';
import { writePNG, makeImage, blit } from '../src/png-node.js';
import { encodeGIF } from '../src/gif-node.js';

const ids = process.argv.slice(2).length ? process.argv.slice(2) : CHARS;
const BG = [72, 84, 104, 255];

for (const id of ids) {
  const ch = loadChar(id);
  const { w, h, origin } = ch.rig.cell;
  const dir = path.join(ROOT, 'out', id);
  fs.rmSync(path.join(dir, 'frames'), { recursive: true, force: true });
  fs.mkdirSync(path.join(dir, 'frames'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'gif'), { recursive: true });
  const anim = {
    id, cell: { w, h }, origin: { x: origin[0], y: origin[1] },
    note: 'origin は root_ground（足元原点）のセル内座標。dur は60Hzフレーム数。root はそのコマでゲーム側が足す移動量(px)。velocity は等速移動(px/フレーム)。',
    motions: {},
  };
  const rows = [];
  for (const name of ch.manifest.motions) {
    const baked = bakeMotion(ch.rig, ch.motions[name]);
    const frames = [];
    for (const f of baked.frames) {
      const data = renderPose(ch.rig, f.solved, { w, h, origin });
      const prev = frames[frames.length - 1];
      // 絵も移動量も同じコマはまとめる
      if (prev && prev.root[0] === f.root[0] && prev.root[1] === f.root[1] && Buffer.compare(Buffer.from(prev.data.buffer), Buffer.from(data.buffer)) === 0) { prev.dur += f.dur; continue; }
      frames.push({ data, dur: f.dur, root: f.root, plant: f.plant, start: f.start });
      const b = boundsOf(data, w, h);
      if (b[0] === 0 || b[1] === 0 || b[2] === w - 1 || b[3] === h - 1) console.warn(`  ! ${id}/${name} コマ${frames.length}: セルの端に接しています`);
    }
    frames.forEach((f, i) => writePNG(path.join(dir, 'frames', `${name}_${String(i).padStart(2, '0')}.png`), w, h, f.data));
    rows.push({ name, frames, baked });
    // GIF（移動を反映）。跳び・ダッシュが切れないよう上下左右に余白を取る
    const minX = Math.min(0, ...frames.map((f) => f.root[0])), maxX = Math.max(0, ...frames.map((f) => f.root[0]));
    const minY = Math.min(0, ...frames.map((f) => f.root[1]));
    const S = 3, gw = (w + maxX - minX) * S, gh = (h - minY) * S;
    let acc = 0;
    const gifFrames = frames.map((f) => {
      const img = makeImage(gw, gh, BG);
      for (let y = (origin[1] - minY) * S; y < gh; y++) for (let x = 0; x < gw; x++) img.data.set([58, 68, 86, 255], (y * gw + x) * 4);
      blit(img, { w, h, data: f.data }, (f.root[0] - minX) * S, (f.root[1] - minY) * S, S);
      acc += (f.dur * 100) / 60; const delay = Math.max(2, Math.round(acc)); acc -= delay;
      return { data: img.data, delay };
    });
    fs.writeFileSync(path.join(dir, 'gif', `${name}.gif`), encodeGIF(gw, gh, gifFrames, { loop: true }));
  }
  // スプライトシート（行 = モーション）
  const cols = Math.max(...rows.map((r) => r.frames.length));
  const sheet = makeImage(cols * w, rows.length * h);
  // コンタクトシートは全コマ共通の外接矩形で切り詰める（余白だけ除く。各コマの相対位置はそのまま）
  let bb = [w, h, 0, 0];
  for (const r of rows) for (const f of r.frames) { const b = boundsOf(f.data, w, h); bb = [Math.min(bb[0], b[0]), Math.min(bb[1], b[1]), Math.max(bb[2], b[2]), Math.max(bb[3], b[3])]; }
  const cw = bb[2] - bb[0] + 5, chh = bb[3] - bb[1] + 5;
  const contact = makeImage(cols * cw * 2, rows.length * chh * 2, BG);
  rows.forEach((r, ri) => {
    anim.motions[r.name] = {
      loop: r.baked.loop, total: r.baked.total, velocity: r.baked.velocity,
      frames: r.frames.map((f, i) => ({ x: i * w, y: ri * h, w, h, dur: f.dur, root: f.root, plant: f.plant })),
    };
    for (let x = 0; x < contact.w; x++) contact.data.set([40, 48, 62, 255], (((ri * chh + origin[1] - bb[1] + 2) * 2) * contact.w + x) * 4);
    r.frames.forEach((f, i) => {
      blit(sheet, { w, h, data: f.data }, i * w, ri * h);
      blit(contact, { w, h, data: f.data }, (i * cw - bb[0] + 2) * 2, (ri * chh - bb[1] + 2) * 2, 2);
    });
  });
  writePNG(path.join(dir, 'sheet.png'), sheet.w, sheet.h, sheet.data);
  writePNG(path.join(dir, 'contact.png'), contact.w, contact.h, contact.data);
  fs.writeFileSync(path.join(dir, 'anim.json'), JSON.stringify(anim, null, 1) + '\n');
  console.log(`${id}: ${rows.map((r) => `${r.name}(${r.frames.length})`).join(' ')}`);
}
