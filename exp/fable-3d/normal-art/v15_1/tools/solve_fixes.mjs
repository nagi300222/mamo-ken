#!/usr/bin/env node
// source/fixes_v151.mjs の「接触時に先端をどこへ置くか」から、元リグの FK で局所回転を解き、
// dojo/normal-motifs-v15.js の GESTURES / MOTIFS を書き換える（--write）。ビルダーと同じ合成規則（元キー × XYZ 角）で評価する。
//   node solve_fixes.mjs [--ids bullet] [--slots stand_heavy] [--write] [--seed 1]
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { loadRig, samplePose, fk, tipOf, qmul } from './glbfk.mjs'; import { FIXES } from '../source/fixes_v151.mjs';
const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(HERE, '../../..');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i < 0 ? d : (process.argv[i + 1]?.startsWith('--') || process.argv[i + 1] === undefined ? true : process.argv[i + 1]); };
const ids = arg('ids', null)?.split?.(','), slots = arg('slots', null)?.split?.(','), write = !!arg('write', false);
const SRC = { stand_weak: 'stand_light', stand_heavy: 'stand_heavy', crouch_weak: 'crouch_light', crouch_heavy: 'crouch_heavy', air_weak: 'air_light', air_heavy: 'air_heavy' };
const RAD = Math.PI / 180, canon = n => String(n || '').replace(/[^a-z0-9]/gi, '').toLowerCase();
const qang = (rx, ry, rz) => { const hx = rx * RAD / 2, hy = ry * RAD / 2, hz = rz * RAD / 2, x = Math.sin(hx), y = Math.sin(hy), z = Math.sin(hz), a = Math.cos(hx), b = Math.cos(hy), c = Math.cos(hz); return [x * b * c + a * y * z, a * y * c - x * b * z, a * b * z + x * y * c, a * b * c - x * y * z]; };
const MUTE = { armL: ['shoulderl', 'shoulderfixl', 'upperarml', 'forearml', 'forearmtwistl', 'wristl', 'pawl'], armR: ['shoulderr', 'shoulderfixr', 'upperarmr', 'forearmr', 'forearmtwistr', 'wristr', 'pawr'], legL: ['thighl', 'thighfixl', 'shinl', 'anklel', 'footl', 'toel'], legR: ['thighr', 'thighfixr', 'shinr', 'ankler', 'footr', 'toer'] };
let seed = +arg('seed', 7); const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
const results = {};
for (const [id, moves] of Object.entries(FIXES)) { if (ids && !ids.includes(id)) continue;
  const rig = loadRig(path.join(ROOT, 'chars', id, id + '.glb')); const keys = rig.N.map(n => canon(n.name)); const B = n => rig.byName[n];
  const tails = rig.N.map((n, i) => /^tail_\d+$/.test(n.name) ? i : -1).filter(i => i >= 0).sort((a, b) => rig.N[a].name.localeCompare(rig.N[b].name)), lastTail = tails.at(-1), tailLen = rig.N[lastTail].translation?.[1] || .08;
  const tip = (W, t) => t === 'tail' ? tipOf(W, lastTail, tailLen) : t === 'head' ? tipOf(W, B('jaw'), .06) : t.startsWith('elbow') ? W[B('forearm.' + t.at(-1))].p : t.startsWith('paw') ? tipOf(W, B(t), .045) : tipOf(W, B(t), .03);
  // キャラの寸法
  const jc = rig.clips.stand_light; let jab = 0; for (let u = 0; u <= 1; u += .05) jab = Math.max(jab, tip(fk(rig, samplePose(rig, 'stand_light', u * jc.dur)), 'paw.L')[2]);
  const W0 = fk(rig, samplePose(rig, 'stand_light', 0)); const m = { jab, head: W0[B('head')].p[1], leg: W0[B('pelvis')].p[1], tail: tails.reduce((s, i) => s + Math.hypot(...(rig.N[i].translation || [0, 0, 0])), 0) + tailLen - .02 };
  results[id] = { metrics: Object.fromEntries(Object.entries(m).map(([k, v]) => [k, +v.toFixed(3)])), moves: {} };
  for (const [slot, F] of Object.entries(moves)) { if (slots && !slots.includes(slot)) continue;
    const clip = SRC[slot], dur = rig.clips[clip].dur, muted = new Set((F.mute || []).flatMap(k => MUTE[k]));
    const P0 = samplePose(rig, clip, 0), Pc = samplePose(rig, clip, F.contact * dur);
    const base = Pc.map((p, i) => ({ t: p.t, r: muted.has(keys[i]) ? P0[i].r : p.r }));
    const vars = [...F.vars], nv = vars.length * 3 + (F.move ? 3 : 0);
    const pose = x => { const g = {}; vars.forEach((b, i) => g[b] = x.slice(i * 3, i * 3 + 3)); const mv = F.move ? x.slice(vars.length * 3) : null;
      const out = base.map((p, i) => { let a = g[keys[i]]; const fx = /^thighfix([lr])$/.exec(keys[i]); if (fx && g['thigh' + fx[1]]) a = g['thigh' + fx[1]].map(n => n / 2); if (!a) return p; return { t: p.t, r: qmul(p.r, qang(a[0] * F.power, a[1] * F.power, a[2] * F.power)) }; });
      if (mv) { const i = B('pelvis'); out[i] = { r: out[i].r, t: out[i].t.map((v, k) => v + mv[k] * F.power / 100) }; } return out; };
    const Wb = fk(rig, base), T1 = F.at(m), T2 = F.at2?.(m), feet = ['toe.L', 'toe.R'].filter(t => t !== F.tip), others = ['head', 'paw.L', 'paw.R'].filter(t => t !== F.tip && t !== F.tip2 && !(F.tip.startsWith('elbow') && t === 'paw.' + F.tip.at(-1)));
    const x0 = new Array(nv).fill(0); vars.forEach((b, i) => (F.pose0?.[b] || [0, 0, 0]).forEach((v, k) => x0[i * 3 + k] = v));
    const lim = i => i >= vars.length * 3 ? [8, 6, 10][i - vars.length * 3] : vars[Math.floor(i / 3)] === 'pelvis' ? (F.spin ? 200 : 45) : /^tail/.test(vars[Math.floor(i / 3)]) ? 50 : /forearm|shin/.test(vars[Math.floor(i / 3)]) ? 100 : /head|neck|paw|foot|spine/.test(vars[Math.floor(i / 3)]) ? 45 : 110;
    const cost = x => { const W = fk(rig, pose(x)); let c = 0; const d = (p, T, w = 1) => { for (let k = 0; k < 3; k++) if (T[k] != null) c += w * (k === 0 ? .5 : 1) * (p[k] - T[k]) ** 2; };
      const p1 = tip(W, F.tip); d(p1, T1); if (T2) d(tip(W, F.tip2), T2);
      if (F.lead) for (const o of others) { const z = tip(W, o)[2] - (p1[2] - .05); if (z > 0) c += 2 * z * z; }
      if (!F.air) for (const f of feet) { const a = tip(W, f), b = tip(Wb, f); c += F.spin ? 3 * (a[1] - b[1]) ** 2 : 1.2 * ((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2); }
      for (const o of ['paw.L', 'paw.R', 'toe.L', 'toe.R', 'tail', 'head']) { const y = tip(W, o)[1] - .012; if (y < 0 && !(F.air)) c += 6 * y * y; }
      if (F.spin) { const h = tip(W, 'head'), hb = W[B('head')].p; if (h[2] - hb[2] < .03) c += .3 * (h[2] - hb[2] - .03) ** 2; }   // 顔は相手へ向ける
      for (let i = 0; i < nv; i++) c += (i >= vars.length * 3 ? 4e-6 : 2.5e-7) * (x[i] - x0[i]) ** 2; return c; };
    let best = null;
    for (let r = 0; r < 6; r++) { let x = x0.map((v, i) => Math.max(-lim(i), Math.min(lim(i), v + (r ? (rnd() - .5) * 40 : 0)))), c = cost(x);
      for (const st of [24, 12, 6, 3, 1]) for (let it = 0, moved = true; it < 60 && moved; it++) { moved = false; for (let i = 0; i < nv; i++) for (const s of [st, -st]) { const y = x.slice(); y[i] = Math.max(-lim(i), Math.min(lim(i), y[i] + s)); const cy = cost(y); if (cy < c - 1e-9) { x = y; c = cy; moved = true; } } }
      if (!best || c < best.c) best = { x, c }; }
    const x = best.x.map(Math.round), W = fk(rig, pose(x)), p1 = tip(W, F.tip), g = {};
    vars.forEach((b, i) => { const a = x.slice(i * 3, i * 3 + 3); if (a.some(v => v)) g[b] = a; });
    if (F.move) { const mv = x.slice(vars.length * 3).map(v => v / 100); if (mv.some(v => v)) g.$move = mv; }
    if (muted.size) g.$mute = [...muted].filter(k => keys.includes(k));
    results[id].moves[slot] = { gesture: F.gesture, label: F.label, contact: F.contact, power: F.power, g, tipAt: p1.map(v => +v.toFixed(3)), target: T1.map(v => v == null ? null : +v.toFixed(3)), cost: +best.c.toFixed(5), head: tip(W, 'head').map(v => +v.toFixed(2)) };
    console.log(id.padEnd(12), slot.padEnd(13), F.gesture.padEnd(18), 'tip', F.tip.padEnd(8), 'target', results[id].moves[slot].target.join(','), '→', results[id].moves[slot].tipAt.join(','), 'head z', results[id].moves[slot].head[2], 'cost', best.c.toFixed(4)); } }
fs.writeFileSync(path.join(HERE, '../source/solved_v151.json'), JSON.stringify(results, null, 1));
if (write) { const file = path.join(ROOT, 'dojo/normal-motifs-v15.js'); let s = fs.readFileSync(file, 'utf8'); const J = o => '{' + Object.entries(o).map(([k, v]) => (k[0] === '$' ? k : k) + ':' + JSON.stringify(v).replace(/"/g, "'")).join(',') + '}';
  for (const [id, r] of Object.entries(results)) for (const [slot, v] of Object.entries(r.moves)) {
    const blk = new RegExp('( ' + id + ':Object\\.freeze\\(\\{[\\s\\S]*?\\n  ' + slot + ':)B\\(\'(\\w+)\',[^\\n]*?\\)(,?)\\n'); const mm = blk.exec(s); if (!mm) throw Error('MOTIFS line not found ' + id + '/' + slot);
    const old = mm[2]; s = s.replace(blk, `$1B('${v.gesture}',${v.power},${v.contact},'${v.label}')$3\n`);
    const line = ` ${v.gesture}:K(${J(v.g)}),`; const gre = new RegExp('\\n ' + v.gesture + ':K\\(\\{.*\\}\\),?');
    if (gre.test(s)) s = s.replace(gre, '\n' + line); else { const ore = new RegExp('\\n ' + old + ':K\\(\\{.*\\}\\),?'); if (old !== v.gesture && ore.test(s) && !new RegExp("B\\('" + old + "'").test(s)) s = s.replace(ore, '\n' + line); else s = s.replace(/\n\}\);\s*$/, ',\n' + line.replace(/,$/, '') + '\n});\n'); } }
  s = s.replace(/\),\n,\n/g, '),\n').replace(/\}\)\n,\n/g, '}),\n'); fs.writeFileSync(file, s); console.log('wrote', file); }
