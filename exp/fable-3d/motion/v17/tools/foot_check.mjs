#!/usr/bin/env node
// v17 通常技の足接地の点検（元リグの FK、ボーン位置）。地上技（立ち・しゃがみ）について、
//   ・足先（toe）が床より下へ潜っていないか（最小の高さ）
//   ・接触の前後で軸足（より動いていない方の足）がどれだけ滑るか
// を出す。体ごと回る技（バレットの尾技）は両足とも回るので「回転技」と表示する。
//   node foot_check.mjs  → ../FOOT_CHECK_V17.md
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { loadRig, samplePose, fk, tipOf } from '../../../normal-art/v15_1/tools/glbfk.mjs';
const HERE = path.dirname(fileURLToPath(import.meta.url)), V17 = path.resolve(HERE, '..'); const META = JSON.parse(fs.readFileSync(path.join(V17, 'normals_v17.json')));
const rows = []; let bad = 0;
for (const [id, moves] of Object.entries(META.characters)) { const rig = loadRig(path.join(V17, id + '_normals_v17.glb'));
  for (const [slot, m] of Object.entries(moves)) { if (slot.startsWith('air_')) continue; const N = m.frames, B = n => rig.byName[n];
    const track = { L: [], R: [] }; let minY = 9, minAt = 0, minFoot = '';
    for (let f = 0; f <= N; f++) { const W = fk(rig, samplePose(rig, m.clip, f / 60));
      for (const s of ['L', 'R']) { const toe = tipOf(W, B('toe.' + s), .02), ank = W[B('ankle.' + s)].p; track[s].push([ank[0], ank[2]]); const y = Math.min(toe[1], W[B('toe.' + s)].p[1], W[B('foot.' + s)].p[1]); if (y < minY) { minY = y; minAt = f; minFoot = s; } } }
    const travel = s => { let d = 0; const a = Math.max(0, m.windup_frame), b = Math.min(N, m.follow_frame); for (let f = a + 1; f <= b; f++) d += Math.hypot(track[s][f][0] - track[s][f - 1][0], track[s][f][1] - track[s][f - 1][1]); return d; };
    const tL = travel('L'), tR = travel('R'), pivot = tL < tR ? 'L' : 'R', slide = Math.min(tL, tR); const spin = /tail/.test(m.attack_limb);
    const base0 = (() => { const W = fk(rig, samplePose(rig, m.clip, 0)); return Math.min(W[B('toe.L')].p[1], W[B('toe.R')].p[1]); })();
    const sink = minY - base0; const flag = [];           // 構えの足先の高さを床とみなし、そこからの沈み込みを見る
    if (sink < -.012) flag.push(`足先が構えより ${(sink * 100).toFixed(1)}cm 低い（F${minAt} ${minFoot}）`);
    if (!spin && m.foot_slide !== 'intended' && slide > .06) flag.push(`軸足 ${pivot} が予備〜打ち抜きで ${(slide * 100).toFixed(1)}cm 動く`);
    if (flag.length) bad++;
    rows.push(`| ${id} | ${slot} | ${m.name_jp} | ${(sink * 100).toFixed(1)} | ${spin ? '回転技' : pivot + ' ' + (slide * 100).toFixed(1) + (m.foot_slide === 'intended' ? '（両足で滑り込む演技）' : '')} | ${flag.join(' / ')} |`); } }
fs.writeFileSync(path.join(V17, 'FOOT_CHECK_V17.md'), ['# v17 P3｜地上の通常技 36 本の足接地の点検', '', '元リグの FK（ボーン位置）での点検。「沈み」は構え（F0）の足先の高さからの最小差 [cm]（負＝床へ潜る方向）。「軸足の動き」は、予備の頂点から打ち抜きまでに、動きの少ない方の足首が床の上を動いた道のり [cm]。',
  '踏み込む技では軸足も少し動く（踏み替え）ので、6cm を超えたものだけ注意に出している。メッシュ表面ではなくボーンでの判定。', '', '| キャラ | 技 | 名前 | 沈み cm | 軸足の動き cm | 注意 |', '|---|---|---|---|---|---|', ...rows, ''].join('\n'));
console.log('ground moves', rows.length, 'flagged', bad); console.log(rows.filter(r => !r.endsWith('|  |')).join('\n'));
