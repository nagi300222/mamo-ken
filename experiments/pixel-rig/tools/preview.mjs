// 作業用プレビュー: node tools/preview.mjs out.png [scale] [--sil] -- char[:motion[:frame]] ...
import { loadChar } from './lib/load.mjs';
import { solveStatic, renderPose, bakeMotion, mergePose } from '../src/rig.js';
import { makeImage, blit, writePNG } from '../src/png-node.js';

const args = process.argv.slice(2);
const out = args[0], scale = +args[1] || 4, sil = args.includes('--sil');
const specs = args.slice(args.indexOf('--') + 1);
const cache = {};
const cells = [];
for (const spec of specs) {
  const [id, motion, frame, flip] = spec.split(':');
  const ch = (cache[id] ||= loadChar(id));
  const { w, h, origin } = ch.rig.cell;
  let solved;
  if (motion && motion !== '-') {
    const baked = bakeMotion(ch.rig, ch.motions[motion]);
    solved = baked.frames[(+frame || 0) % baked.frames.length].solved;
  } else solved = solveStatic(ch.rig, mergePose(ch.rig.stance, frame ? JSON.parse(frame) : null));
  if (solved.warn.length) console.log(spec, solved.warn.join(' / '));
  const rgba = renderPose(ch.rig, solved, { w, h, origin, flip: !!flip });
  if (sil) for (let i = 0; i < w * h; i++) if (rgba[i * 4 + 3]) { rgba[i * 4] = rgba[i * 4 + 1] = rgba[i * 4 + 2] = 0; }
  cells.push({ w, h, data: rgba, origin });
}
const cw = cells[0].w, chh = cells[0].h;
const img = makeImage(cw * scale * cells.length, chh * scale, sil ? [255, 255, 255, 255] : [72, 84, 104, 255]);
cells.forEach((c, i) => {
  for (let x = 0; x < cw * scale; x++) { const y = c.origin[1] * scale; img.data.set([40, 48, 62, 255], (y * img.w + i * cw * scale + x) * 4); }
  blit(img, c, i * cw * scale, 0, scale);
});
writePNG(out, img.w, img.h, img.data);
