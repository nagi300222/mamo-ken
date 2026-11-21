// 元絵と新規ピクセルキャラの比較画像、3体の並び・黒ベタシルエットを書き出す。
// 元絵（assets/portraits/*.png）は比較のために縮小して横に置くだけで、スプライト側には一切使っていない。
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, CHARS, loadChar } from './lib/load.mjs';
import { solveStatic, renderPose, boundsOf } from '../src/rig.js';
import { readPNG, writePNG, makeImage, blit } from '../src/png-node.js';

const OUT = path.join(ROOT, 'out/compare');
fs.mkdirSync(OUT, { recursive: true });
const SCALE = 4;
const BG = [72, 84, 104, 255];

/** 面積平均で縮小（比較表示用） */
function shrink(src, th) {
  const k = src.h / th, tw = Math.round(src.w / k);
  const out = makeImage(tw, th);
  for (let y = 0; y < th; y++) for (let x = 0; x < tw; x++) {
    let r = 0, g = 0, b = 0, a = 0, n = 0;
    for (let sy = Math.floor(y * k); sy < Math.min(src.h, Math.ceil((y + 1) * k)); sy++)
      for (let sx = Math.floor(x * k); sx < Math.min(src.w, Math.ceil((x + 1) * k)); sx++) {
        const i = (sy * src.w + sx) * 4, al = src.data[i + 3];
        r += src.data[i] * al; g += src.data[i + 1] * al; b += src.data[i + 2] * al; a += al; n++;
      }
    if (a > 0) out.data.set([r / a, g / a, b / a, a / n], (y * tw + x) * 4);
  }
  return out;
}
function crop(img, [x0, y0, x1, y1], pad = 2) {
  x0 -= pad; y0 -= pad; x1 += pad; y1 += pad;
  const out = makeImage(x1 - x0 + 1, y1 - y0 + 1);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    if (x < 0 || y < 0 || x >= img.w || y >= img.h) continue;
    out.data.set(img.data.subarray((y * img.w + x) * 4, (y * img.w + x) * 4 + 4), ((y - y0) * out.w + (x - x0)) * 4);
  }
  return out;
}
const silhouette = (img) => {
  const o = makeImage(img.w, img.h);
  for (let i = 0; i < img.w * img.h; i++) if (img.data[i * 4 + 3]) o.data.set([0, 0, 0, 255], i * 4);
  return o;
};

const stand = {};
for (const id of CHARS) {
  const ch = loadChar(id);
  const { w, h, origin } = ch.rig.cell;
  const rgba = renderPose(ch.rig, solveStatic(ch.rig, ch.rig.stance), { w, h, origin });
  const img = { w, h, data: rgba };
  stand[id] = { img, origin, bounds: boundsOf(rgba, w, h) };
  writePNG(path.join(OUT, `stand_${id}_1x.png`), w, h, rgba);

  // 元絵 | 新規ピクセル（4倍）| シルエット
  const sprite = crop(img, stand[id].bounds);
  const H = sprite.h * SCALE + 24;
  const ref = shrink(readPNG(path.join(ROOT, '../../assets/portraits', `${id}.png`)), sprite.h * SCALE);
  const sheet = makeImage(ref.w + sprite.w * SCALE * 2 + 48, H, BG);
  blit(sheet, ref, 12, 12);
  blit(sheet, sprite, ref.w + 24, 12, SCALE);
  const sil = makeImage(sprite.w * SCALE + 12, H, [255, 255, 255, 255]);
  blit(sil, silhouette(sprite), 6, 12, SCALE);
  blit(sheet, sil, ref.w + sprite.w * SCALE + 36, 0);
  writePNG(path.join(OUT, `compare_${id}.png`), sheet.w, sheet.h, sheet.data);
}

// 3体を同じ地面・同じ倍率で並べる（上: カラー / 下: 黒ベタ）
const gap = 150, top = 130;
const line = makeImage(gap * CHARS.length * SCALE, top * 2 * SCALE, BG);
for (let y = top * SCALE; y < line.h; y++) for (let x = 0; x < line.w; x++) line.data.set([255, 255, 255, 255], (y * line.w + x) * 4);
CHARS.forEach((id, i) => {
  const s = stand[id];
  const dx = (i * gap + gap / 2 - s.origin[0]) * SCALE;
  blit(line, s.img, dx, (top - 6 - s.origin[1]) * SCALE, SCALE);
  blit(line, silhouette(s.img), dx, (top * 2 - 6 - s.origin[1]) * SCALE, SCALE);
});
writePNG(path.join(OUT, 'lineup.png'), line.w, line.h, line.data);
console.log('out/compare に書き出しました');
