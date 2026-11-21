// 数値検証: node tools/validate.mjs  → docs/validation.md を書き出す
//  1) 足滑り: 接地指定中の足先（母指球）の地面座標が、連続する2コマの間でどれだけずれるか
//  2) モーション間の大きさ・足元原点のそろい
//  3) 体格比（基準姿勢での身長、胴体の幅）
//  4) IK の届かなさ、地面めり込み補正の発動、セルからのはみ出し
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, CHARS, loadChar } from './lib/load.mjs';
import { bakeMotion, renderPose, boundsOf, solveStatic, mergePose } from '../src/rig.js';

const out = [];
const P = (s = '') => out.push(s);
const fmt = (v, d = 2) => (Math.abs(v) < 0.005 ? '0' : v.toFixed(d));
let problems = 0;

P('# 検証結果（自動生成）');
P();
P('`node tools/validate.mjs` が書き出したもの。手で編集しない。数値はすべて低解像度バッファ上のピクセル。');
P();

const chars = CHARS.map(loadChar);
const baked = {};
for (const ch of chars) { baked[ch.id] = {}; for (const m of ch.manifest.motions) baked[ch.id][m] = bakeMotion(ch.rig, ch.motions[m]); }

// ---------- 1) 足滑り ----------
P('## 1. 足滑り');
P();
P('接地指定（`plant`）が続いている区間ごとに、区間の最初のコマを基準にした足先の地面座標のずれ（累積）を測った。');
P('地面座標 = セル内の足先位置（描画と同じ整数丸め）＋ そのコマの移動量（`root` と `velocity × 開始フレーム`）。');
P('ループするモーションは2周つないで、周回の継ぎ目も測っている。「連続値」は丸める前の計算値での差。');
P();
P('| キャラ | モーション | 測ったコマ数 | 最大ずれ X (px) | 最大ずれ Y (px) | 連続値の最大ずれ (px) |');
P('|---|---|---:|---:|---:|---:|');
const slipMax = {};
for (const ch of chars) {
  slipMax[ch.id] = 0;
  for (const m of ch.manifest.motions) {
    const b = baked[ch.id][m];
    let n = 0, mx = 0, my = 0, mf = 0;
    const world = (f, key, cyc) => {
      const c = f.solved.contacts[key];
      const t = f.start + cyc * b.total;
      const vx = b.velocity[0] * t, vy = b.velocity[1] * t;
      return { x: Math.round(c.x) + f.root[0] + Math.round(vx), y: Math.round(c.y) + f.root[1] + Math.round(vy), fx: c.x + f.solved.pose.root[0] + vx, fy: c.y + f.solved.pose.root[1] + vy };
    };
    // 接地が続く区間ごとに、区間の最初のコマからの累積のずれを測る（1コマずつの差では、少しずつ流れる滑りを見逃すため）
    const seq = b.frames.map((f) => [f, 0]);
    if (b.loop) seq.push(...b.frames.map((f) => [f, 1])); // ループは2周目までつないで、周回の継ぎ目も測る
    for (const L of ch.rig.limbs) {
      if (L.type !== 'leg') continue;
      let start = null;
      for (const [f, cyc] of seq) {
        if (!f.plant.includes(L.key)) { start = null; continue; }
        const wc = world(f, L.key, cyc);
        if (!start) { start = wc; continue; }
        n++; mx = Math.max(mx, Math.abs(wc.x - start.x)); my = Math.max(my, Math.abs(wc.y - start.y));
        mf = Math.max(mf, Math.hypot(wc.fx - start.fx, wc.fy - start.fy));
      }
    }
    slipMax[ch.id] = Math.max(slipMax[ch.id], mx, my);
    if (Math.max(mx, my) > 1) problems++;
    P(`| ${ch.id} | ${m} | ${n} | ${mx} | ${my} | ${fmt(mf)} |`);
  }
}
P();
P(`キャラごとの最大値: ${chars.map((c) => `${c.id} ${slipMax[c.id]}px`).join(' / ')}`);
P();
P('補足: 歩きは絵の更新が毎フレームではない（`step` フレームごと）ので、ゲーム側が毎フレーム等速で動かすと、絵が更新されるまでの間は足が `velocity × (step−1)` px だけ先に進んで見える。これはコマ送りのスプライト全般に付く揺れで、上の表には含めていない。');
P();
P('| キャラ | モーション | velocity (px/f) | step (f) | コマ間の見かけの揺れ (px) |');
P('|---|---|---:|---:|---:|');
for (const ch of chars) for (const m of ch.manifest.motions) {
  const b = baked[ch.id][m];
  if (b.velocity[0]) P(`| ${ch.id} | ${m} | ${fmt(b.velocity[0], 3)} | ${b.step} | ${fmt(Math.abs(b.velocity[0]) * (b.step - 1))} |`);
}
P();

// ---------- 2) 大きさ・原点のそろい ----------
P('## 2. モーション間の大きさ・足元原点');
P();
P('パーツは拡大縮小せずに回転と移動だけで描いているので、頭や胴体そのものの大きさはどのコマでも同じ。');
P('ここでは「単発モーションの最後のコマが構え（idle の1コマ目）と同じ高さに戻っているか」と、「接地しているコマの最下端がいつも同じ行か」を確かめた。');
P();
P('| キャラ | モーション | 最初のコマの高さ | 最後のコマの高さ | 最後のコマと構えの高さの差 | 接地コマの最下端の行（原点行=0） | コマ全体の高さの幅 |');
P('|---|---|---:|---:|---:|---|---:|');
for (const ch of chars) {
  const { w, h, origin } = ch.rig.cell;
  const hOf = (f) => { const bb = boundsOf(renderPose(ch.rig, f.solved, { w, h, origin }), w, h); return { h: bb[3] - bb[1] + 1, bottom: bb[3] - origin[1], bb }; };
  const ref = hOf(baked[ch.id].idle.frames[0]);
  for (const m of ch.manifest.motions) {
    const b = baked[ch.id][m];
    const hs = b.frames.map(hOf);
    const first = hs[0], last = hs[hs.length - 1];
    const bottoms = [...new Set(b.frames.map((f, i) => (f.plant.length ? hs[i].bottom : null)).filter((v) => v !== null))];
    const skip = b.loop || ch.motions[m].returnsToStance === false; // しゃがみ中の技など、構えに戻らないモーションは対象外
    const loopOrIdleEnd = skip ? '—' : `${last.h - ref.h}`;
    if (!skip && last.h !== ref.h) problems++;
    if (bottoms.some((v) => v !== 0)) problems++;
    P(`| ${ch.id} | ${m} | ${first.h} | ${last.h} | ${loopOrIdleEnd} | ${bottoms.join(', ')} | ${Math.min(...hs.map((x) => x.h))}〜${Math.max(...hs.map((x) => x.h))} |`);
    for (const x of hs) if (x.bb[0] <= 0 || x.bb[1] <= 0 || x.bb[2] >= w - 1 || x.bb[3] >= h - 1) { problems++; P(`| ${ch.id} | ${m} | **セルからはみ出しています** | | | | |`); break; }
  }
}
P();
P('最下端の行 0 は、足裏の1px下に付く外周アウトラインの行。全モーションで 0 なら足元原点はそろっている。dash_f は移動して終わるので、最後のコマは「移動後の構え」。「—」はループするモーションと、構えに戻らないモーション（`returnsToStance: false`）。');
P();

// ---------- 3) 体格比 ----------
P('## 3. 体格比');
P();
P('身長は、背骨の角度をすべて 0 にした基準姿勢（足の位置と腰の高さは構えのまま）で、耳の先から足裏までを測った。幅は胴体グループ（骨盤・腹・胸・近い側の太もも）だけを描いたときの最大幅。');
P();
P('| キャラ | 基準姿勢の身長 (px) | 比 | 目標 | 構えの高さ (px) | 胴体の最大幅 (px) | 比 | 目安 |');
P('|---|---:|---:|---:|---:|---:|---:|---:|');
const target = { moguzo: [1, 1], pisuke: [1.03, 0.9], godan: [1.08, 1.25] };
const meas = {};
for (const ch of chars) {
  const { w, h, origin } = ch.rig.cell;
  const up = solveStatic(ch.rig, mergePose(ch.rig.stance, { pelvis: 0, torso: 0, chest: 0, neck: 0, head: 0 }));
  const bu = boundsOf(renderPose(ch.rig, up, { w, h, origin, outline: false }), w, h);
  const st = solveStatic(ch.rig, ch.rig.stance);
  const bs = boundsOf(renderPose(ch.rig, st, { w, h, origin, outline: false }), w, h);
  const bb = boundsOf(renderPose(ch.rig, up, { w, h, origin, outline: false, groups: ['body'] }), w, h);
  meas[ch.id] = { height: origin[1] - bu[1], stance: origin[1] - bs[1], width: bb[2] - bb[0] + 1 };
}
for (const ch of chars) {
  const m = meas[ch.id], r = meas.moguzo, t = target[ch.id] || ['-', '-'];
  P(`| ${ch.id} | ${m.height} | ${(m.height / r.height).toFixed(3)} | ${t[0]} | ${m.stance} | ${m.width} | ${(m.width / r.width).toFixed(3)} | ${t[1]} |`);
}
P();

// ---------- 4) ソルバの警告 ----------
P('## 4. ソルバの警告');
P();
P('| キャラ | モーション | IKが届かないコマ | 地面めり込み補正が働いたコマ（最大押し上げ px） |');
P('|---|---|---:|---|');
for (const ch of chars) for (const m of ch.manifest.motions) {
  const b = baked[ch.id][m];
  const w = b.frames.filter((f) => f.solved.warn.length).length;
  const g = b.frames.filter((f) => f.solved.groundPush > 0);
  if (w) problems++;
  P(`| ${ch.id} | ${m} | ${w} | ${g.length ? `${g.length}（${fmt(Math.max(...g.map((f) => f.solved.groundPush)), 1)}）` : '0'} |`);
}
P();
P(problems ? `**要確認の項目が ${problems} 件あります。**` : '要確認の項目はありません（足滑り 1px 以下、原点・高さのずれなし、IK 警告なし、セルはみ出しなし）。');
fs.writeFileSync(path.join(ROOT, 'docs/validation.md'), out.join('\n') + '\n');
console.log(`docs/validation.md を書き出しました（要確認 ${problems} 件）`);
