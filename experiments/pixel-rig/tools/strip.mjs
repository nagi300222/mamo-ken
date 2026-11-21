// 作業用: モーションのコマを横に並べて切り出す。 node tools/strip.mjs out.png scale char motion [motion...]
import { loadChar } from './lib/load.mjs';
import { bakeMotion, renderPose, boundsOf } from '../src/rig.js';
import { makeImage, blit, writePNG } from '../src/png-node.js';
const [out, sc, id, ...names] = process.argv.slice(2);
const scale = +sc, ch = loadChar(id), { w, h, origin } = ch.rig.cell;
const rows = names.map((n) => {
  const b = bakeMotion(ch.rig, ch.motions[n]); const fr = []; let last = null;
  for (const f of b.frames) {
    if (f.solved.warn.length) console.log(n, f.index, f.solved.warn.join('/'));
    const data = renderPose(ch.rig, f.solved, { w, h, origin: [origin[0] + f.root[0], origin[1] + f.root[1]] });
    if (last && Buffer.compare(Buffer.from(last.buffer), Buffer.from(data.buffer)) === 0) continue;
    fr.push(data); last = data;
  }
  return fr;
});
// 全コマ共通の切り出し範囲
let bb = [w, h, 0, 0];
for (const r of rows) for (const d of r) { const b = boundsOf(d, w, h); bb = [Math.min(bb[0], b[0]), Math.min(bb[1], b[1]), Math.max(bb[2], b[2]), Math.max(bb[3], b[3])]; }
const cw = bb[2] - bb[0] + 5, chh = bb[3] - bb[1] + 5, cols = Math.max(...rows.map((r) => r.length));
const img = makeImage(cols * cw * scale, rows.length * chh * scale, [72, 84, 104, 255]);
rows.forEach((r, ri) => {
  for (let x = 0; x < img.w; x++) img.data.set([40, 48, 62, 255], (((ri * chh + origin[1] - bb[1] + 2) * scale) * img.w + x) * 4);
  r.forEach((d, i) => blit(img, { w, h, data: d }, (i * cw - bb[0] + 2) * scale, (ri * chh - bb[1] + 2) * scale, scale));
});
writePNG(out, img.w, img.h, img.data);
console.log(img.w, img.h, rows.map((r) => r.length).join(','));
