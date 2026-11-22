// 小さな glTF 読み取り + FK。元GLB／通常技パックのアニメを時刻でサンプルし、ボーンのリグ空間位置（x=キャラの左, y=上, z=前）を返す。
import fs from 'node:fs';
export function readGlb(file) { const b = Buffer.isBuffer(file) ? file : fs.readFileSync(file); const jl = b.readUInt32LE(12); const doc = JSON.parse(b.toString('utf8', 20, 20 + jl)); const bin = b.subarray(28 + jl); return { doc, bin }; }
const DIM = { SCALAR: 1, VEC3: 3, VEC4: 4 };
export function accessor({ doc, bin }, i) { const a = doc.accessors[i], v = doc.bufferViews[a.bufferView], d = DIM[a.type], st = v.byteStride || d * 4, off = (v.byteOffset || 0) + (a.byteOffset || 0); const out = new Float32Array(a.count * d);
  for (let k = 0; k < a.count; k++) for (let c = 0; c < d; c++) out[k * d + c] = bin.readFloatLE(off + k * st + c * 4); return { data: out, dim: d, count: a.count }; }
export const qmul = (a, b) => { const [x, y, z, w] = a, [p, q, r, s] = b; return [w * p + x * s + y * r - z * q, w * q - x * r + y * s + z * p, w * r + x * q - y * p + z * s, w * s - x * p - y * q - z * r]; };
export const qrot = (q, v) => { const [x, y, z, w] = q, [a, b, c] = v; const tx = 2 * (y * c - z * b), ty = 2 * (z * a - x * c), tz = 2 * (x * b - y * a); return [a + w * tx + y * tz - z * ty, b + w * ty + z * tx - x * tz, c + w * tz + x * ty - y * tx]; };
const slerp = (a, b, u) => { let d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3]; if (d < 0) { b = b.map(x => -x); d = -d; } if (d > .9995) { const o = a.map((x, i) => x + (b[i] - x) * u), m = Math.hypot(...o); return o.map(x => x / m); } const th = Math.acos(d), s = Math.sin(th); const wa = Math.sin((1 - u) * th) / s, wb = Math.sin(u * th) / s; return a.map((x, i) => x * wa + b[i] * wb); };
export function loadRig(file) { const g = readGlb(file), N = g.doc.nodes, parent = new Array(N.length).fill(-1); N.forEach((n, i) => (n.children || []).forEach(c => parent[c] = i)); const byName = Object.fromEntries(N.map((n, i) => [n.name, i]));
  const clips = {}; for (const a of g.doc.animations || []) { const ch = []; for (const c of a.channels) { if (c.target.path === 'weights' || c.target.path === 'scale') continue; const s = a.samplers[c.sampler]; ch.push({ node: c.target.node, path: c.target.path, t: accessor(g, s.input).data, v: accessor(g, s.output) }); } clips[a.name] = { ch, dur: Math.max(...ch.map(c => c.t[c.t.length - 1])) }; }
  return { g, N, parent, byName, clips }; }
// クリップを時刻 time [s] でサンプル → {node: {t,r}}（無いものは rest）
export function samplePose(rig, clipName, time) { const pose = rig.N.map(n => ({ t: n.translation || [0, 0, 0], r: n.rotation || [0, 0, 0, 1] })); const clip = rig.clips[clipName]; if (!clip) throw Error('no clip ' + clipName);
  for (const c of clip.ch) { const T = c.t, n = T.length; let i = 0; while (i < n - 2 && T[i + 1] <= time) i++; const u = n < 2 ? 0 : Math.max(0, Math.min(1, (time - T[i]) / ((T[i + 1] - T[i]) || 1))); const d = c.v.dim, A = Array.from(c.v.data.subarray(i * d, i * d + d)), B = n < 2 ? A : Array.from(c.v.data.subarray((i + 1) * d, (i + 1) * d + d));
    if (c.path === 'rotation') pose[c.node].r = slerp(A, B, u); else pose[c.node].t = A.map((x, k) => x + (B[k] - x) * u); }
  return pose; }
export function fk(rig, pose) { const W = new Array(rig.N.length); const go = i => { if (W[i]) return W[i]; const p = rig.parent[i]; if (p < 0) return W[i] = { p: pose[i].t, q: pose[i].r }; const P = go(p); const pos = qrot(P.q, pose[i].t); return W[i] = { p: [P.p[0] + pos[0], P.p[1] + pos[1], P.p[2] + pos[2]], q: qmul(P.q, pose[i].r) }; };
  for (let i = 0; i < rig.N.length; i++) go(i); return W; }
// ボーン先端（local +Y に len 伸ばした点）
export const tipOf = (W, i, len) => { const d = qrot(W[i].q, [0, len, 0]); return [W[i].p[0] + d[0], W[i].p[1] + d[1], W[i].p[2] + d[2]]; };
