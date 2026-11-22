#!/usr/bin/env node
// sample_clips.mjs の曲線から、技ごとの「意図した打撃部位」「実際に最前へ出る部位」「ピーク時刻と前方距離」を表にする。
//   node analyze_curves.mjs [--dir audit/v15] [--motifs ../../dojo/normal-motifs-v15.js]
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath, pathToFileURL } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i < 0 ? d : process.argv[i + 1]; };
const dir = path.resolve(arg('dir', path.join(HERE, '../audit/v15')));
const { MOTIFS, GESTURES } = await import(pathToFileURL(path.resolve(arg('motifs', path.join(HERE, '../../../dojo/normal-motifs-v15.js')))).href);
const BAL = { stand_weak: .39, stand_heavy: .54, crouch_weak: .39, crouch_heavy: .57, air_weak: .42, air_heavy: .49 };
// 意図部位: gesture の角度が最も大きい肢（尾 > 脚 > 腕 > 頭 の順に、十分大きければ採用）
export function intended(g) { const mag = k => Math.max(...(g[k] || [0]).map(Math.abs)); const sum = re => Object.keys(g).filter(k => re.test(k)).reduce((s, k) => s + mag(k), 0);
  const tail = sum(/^tail/), legL = sum(/(thigh|shin|foot)l$/), legR = sum(/(thigh|shin|foot)r$/), armL = sum(/(upperarm|forearm|paw)l$/), armR = sum(/(upperarm|forearm|paw)r$/), head = sum(/^(head|neck)$/);
  if (tail > 40) return ['tail']; if (Math.max(legL, legR) >= 60) return [legL > legR ? 'legL' : 'legR'];
  if (armL + armR < 25 && head > 30) return ['head']; if (armL > 30 && armR > 30 && Math.min(armL, armR) / Math.max(armL, armR) > .6) return ['armL', 'armR']; return [armL > armR ? 'armL' : 'armR']; }
const rows = []; if (process.argv[1] === fileURLToPath(import.meta.url)) await main(); async function main() {
for (const id of Object.keys(MOTIFS)) { const C = JSON.parse(fs.readFileSync(path.join(dir, id + '_curves.json')));
  for (const slot of Object.keys(BAL)) { const spec = MOTIFS[id][slot], want = intended(GESTURES[spec.gesture]); const S = C['new:' + slot].samples, N = S.length - 1;
    const parts = ['armL', 'armR', 'legL', 'legR', 'tail', 'head', 'body'];
    const at = (i, p) => S[i][p]?.[0] ?? -9; const iC = Math.round(spec.contact * N);
    const front = i => parts.map(p => [p, at(i, p)]).sort((a, b) => b[1] - a[1])[0];
    let pk = { v: -9 }; for (let i = 0; i <= N; i++) for (const p of want) if (at(i, p) > pk.v) pk = { v: at(i, p), i, p, y: S[i][p][1], bone: S[i][p][2] };
    let all = { v: -9 }; for (let i = 0; i <= N; i++) { const f = front(i); if (f[1] > all.v) all = { v: f[1], i, p: f[0] }; }
    const fc = front(iC), wantAtC = Math.max(...want.map(p => at(iC, p))), idle = Math.max(...want.map(p => at(0, p)));
    // 持続中に reach の 92% 以上を保つ区間
    let e = pk.i; while (e < N && at(e + 1, pk.p) >= pk.v - .02) e++; let s = pk.i; while (s > 0 && at(s - 1, pk.p) >= pk.v - .02) s--;
    rows.push({ id, slot, gesture: spec.gesture, label: spec.label, want: want.join('+'), contactU: spec.contact, wantAtContact: +wantAtC.toFixed(3), frontAtContact: fc[0], frontAtContactFwd: fc[1], peakU: +(pk.i / N).toFixed(3), peakFwd: pk.v, peakY: pk.y, peakBone: pk.bone, holdU: [+(s / N).toFixed(3), +(e / N).toFixed(3)],
      travel: +(pk.v - idle).toFixed(3), overallFront: all.p, overallFwd: all.v, overallU: +(all.i / N).toFixed(3), battleReach: BAL[slot] + (id === 'godan' || id === 'takimaru' ? .045 : 0) }); } }
fs.writeFileSync(path.join(dir, 'curve_summary.json'), JSON.stringify(rows, null, 1));
const pad = (s, n) => String(s).padEnd(n);
console.log(pad('id', 12), pad('slot', 13), pad('gesture', 18), pad('want', 10), 'cU   want@c front@c        peakU peak  y     travel | overall      | reach');
for (const r of rows) console.log(pad(r.id, 12), pad(r.slot, 13), pad(r.gesture, 18), pad(r.want, 10), r.contactU.toFixed(2), r.wantAtContact.toFixed(2).padStart(6), pad(r.frontAtContact + ' ' + r.frontAtContactFwd.toFixed(2), 13), r.peakU.toFixed(2).padStart(5), r.peakFwd.toFixed(2), r.peakY.toFixed(2), r.travel.toFixed(2).padStart(6), '|', pad(r.overallFront + ' ' + r.overallFwd.toFixed(2) + '@' + r.overallU.toFixed(2), 12), '|', r.battleReach.toFixed(3));
}
