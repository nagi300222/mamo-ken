#!/usr/bin/env node
// v14 GLB が元 GLB の造形・リグ・既存クリップをそのまま含むことを、バイナリの中身で確かめる。
//   node verify_glb.mjs [ids]      → cinematic/v14/validation/glb_identity.json
import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto'; import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(HERE, '../../..'), V14 = path.resolve(HERE, '..');
const ALL = ['moguzo', 'pisuke', 'godan', 'hakuma', 'chirka', 'takimaru', 'yomikage', 'bullet', 'dark_moguzo'];
const ids = (process.argv[2] || ALL.join(',')).split(',');
function load(p) { const b = fs.readFileSync(p); const n = b.readUInt32LE(12); const json = JSON.parse(b.subarray(20, 20 + n).toString('utf8')); const bin = b.subarray(20 + n + 8); return { json, bin, size: b.length, sha: crypto.createHash('sha256').update(b).digest('hex') }; }
const h = (buf) => crypto.createHash('sha1').update(buf).digest('hex');
const CT = { 5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4 }, NT = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };
function view(g, bv, off, len) { const v = g.json.bufferViews[bv]; return g.bin.subarray((v.byteOffset || 0) + (off || 0), (v.byteOffset || 0) + (off || 0) + len); }
function acc(g, i) { const a = g.json.accessors[i]; const parts = [];
  if (a.bufferView !== undefined) parts.push(h(view(g, a.bufferView, a.byteOffset, a.count * NT[a.type] * CT[a.componentType])));
  if (a.sparse) parts.push('sp' + a.sparse.count, h(view(g, a.sparse.indices.bufferView, a.sparse.indices.byteOffset, a.sparse.count * CT[a.sparse.indices.componentType])), h(view(g, a.sparse.values.bufferView, a.sparse.values.byteOffset, a.sparse.count * NT[a.type] * CT[a.componentType])));
  return parts.join('+') + ':' + a.count; }
function sig(g) {
  const mesh = g.json.meshes.map(m => m.primitives.map(p => ({ attrs: Object.fromEntries(Object.entries(p.attributes).map(([k, i]) => [k, acc(g, i)])), idx: acc(g, p.indices), targets: (p.targets || []).map(t => Object.fromEntries(Object.entries(t).map(([k, i]) => [k, acc(g, i)]))) })));
  const nodes = g.json.nodes.map(n => ({ name: n.name, t: n.translation, r: n.rotation, s: n.scale, children: (n.children || []).map(c => g.json.nodes[c].name) }));
  const skins = g.json.skins.map(s => ({ joints: s.joints.map(j => g.json.nodes[j].name), ibm: acc(g, s.inverseBindMatrices) }));
  const images = (g.json.images || []).map(im => { const v = g.json.bufferViews[im.bufferView]; return h(g.bin.subarray(v.byteOffset || 0, (v.byteOffset || 0) + v.byteLength)); });
  const anims = Object.fromEntries(g.json.animations.map(a => [a.name, h(Buffer.from(a.channels.map(c => { const s = a.samplers[c.sampler]; return g.json.nodes[c.target.node].name + '.' + c.target.path + '=' + acc(g, s.input) + '/' + acc(g, s.output); }).sort().join('|')))]));
  return { mesh, nodes, skins, images, materials: g.json.materials, anims };
}
const out = {}; let ok = true;
for (const id of ids) {
  const a = load(path.join(ROOT, 'chars', id, id + '.glb')), b = load(path.join(V14, id, id + '_v14.glb')); const A = sig(a), B = sig(b); const eq = (x, y) => JSON.stringify(x) === JSON.stringify(y);
  const r = { base_sha256: a.sha, v14_sha256: b.sha, base_bytes: a.size, v14_bytes: b.size, mesh_identical: eq(A.mesh, B.mesh), skeleton_identical: eq(A.nodes, B.nodes) && eq(A.skins, B.skins), texture_identical: eq(A.images, B.images), materials_identical: eq(A.materials, B.materials),
    base_clips: Object.keys(A.anims).length, base_clips_identical: Object.keys(A.anims).filter(k => A.anims[k] === B.anims[k]).length, base_clips_changed: Object.keys(A.anims).filter(k => A.anims[k] !== B.anims[k]), v14_added_clips: Object.keys(B.anims).filter(k => !(k in A.anims)) };
  r.pass = r.mesh_identical && r.skeleton_identical && r.texture_identical && r.materials_identical && r.base_clips_identical === r.base_clips; ok &&= r.pass; out[id] = r;
  console.log(id, r.pass ? 'PASS' : 'FAIL', `mesh=${r.mesh_identical} skel=${r.skeleton_identical} tex=${r.texture_identical} clips=${r.base_clips_identical}/${r.base_clips} +${r.v14_added_clips.length}`, r.base_clips_changed.slice(0, 5).join(','));
}
fs.mkdirSync(path.join(V14, 'validation'), { recursive: true }); fs.writeFileSync(path.join(V14, 'validation', 'glb_identity.json'), JSON.stringify(out, null, 1)); process.exit(ok ? 0 : 1);
