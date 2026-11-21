#!/usr/bin/env node
// 既存キャラの動きが変わっていないことの確認。各クリップの数フレームで全ボーン位置を記録／比較する。
//   node regress.mjs save FILE [ids]   /   node regress.mjs compare FILE [ids]
import { open } from './lib/browser.mjs'; import fs from 'node:fs';
const [mode, file, ids = 'moguzo,pisuke,godan'] = process.argv.slice(2);
const b = await open({ width: 200, height: 200 }); const out = {};
for (const id of ids.split(',')) {
  await b.page.evaluate(async (c) => { await window.mamo.load(c); window.mamo.set({ paused: true }); }, id);
  const clips = await b.page.evaluate(() => window.mamo.clips()); out[id] = { stats: await b.page.evaluate(() => window.mamo.stats()) };
  for (const c of clips) { const N = Math.round(c.duration * 60); out[id][c.name] = {};
    for (const f of [0, Math.round(N / 3), Math.round(N * 2 / 3), N]) out[id][c.name][f] = await b.page.evaluate(([n, f]) => { const m = window.mamo; m.play(n, { fade: 0 }); m.setTime(f / 60); m.draw(); return m.bones(); }, [c.name, f]); }
}
await b.close();
if (mode === 'save') { fs.writeFileSync(file, JSON.stringify(out)); console.log('saved', file); }
else { const ref = JSON.parse(fs.readFileSync(file, 'utf8')); let ok = true;
  for (const id in ref) { if (!out[id]) continue; let worst = 0, where = ''; for (const clip in ref[id]) { if (clip === 'stats') continue; for (const f in ref[id][clip]) for (const bn in ref[id][clip][f]) { const a = ref[id][clip][f][bn], c = out[id]?.[clip]?.[f]?.[bn]; if (!c) { worst = 9; where = `${clip} missing`; continue; } const d = Math.hypot(a[0] - c[0], a[1] - c[1], a[2] - c[2]); if (d > worst) { worst = d; where = `${clip}@${f} ${bn}`; } } }
    const st = ref[id].stats, s2 = out[id].stats; const same = st.tris === s2.tris && st.verts === s2.verts && st.bones === s2.bones; if (worst > 1e-4 || !same) ok = false;
    console.log(id, 'max bone diff(m)=' + worst.toExponential(2), where, 'mesh same=' + same); }
  process.exit(ok ? 0 : 1); }
