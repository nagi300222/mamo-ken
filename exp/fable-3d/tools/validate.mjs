#!/usr/bin/env node
// GLB のデータ検証 + ヘッドレスブラウザでの再生検証。結果は validation/{id}.json と validation/summary.json。
//   node exp/fable-3d/tools/validate.mjs [--only moguzo] [--clips idle,crouch]
import fs from 'node:fs'; import path from 'node:path';
import { open, ROOT } from './lib/browser.mjs';
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i < 0 ? d : process.argv[i + 1]; };
const CHARS = String(arg('only', 'moguzo,pisuke,godan,hakuma,chirka,takimaru,yomikage,bullet,dark_moguzo')).split(',');
const COMMON = String(arg('clips', 'idle,walk_f,walk_b,dash_f,crouch,jump_n,stand_light,stand_heavy,guard_stand,hurt_light')).split(',');
const ONLY_COMMON = process.argv.includes('--clips');
const REQUIRED = ['root_ground', 'pelvis', 'spine', 'chest', 'neck', 'head', 'jaw', ...['shoulder', 'upper_arm', 'forearm', 'wrist', 'paw', 'thigh', 'shin', 'ankle', 'foot', 'toe'].flatMap(b => [b + '.L', b + '.R']), 'tail_01', 'tail_02', 'tail_03'];
const sanitize = (n) => n.replace(/\s/g, '_').replace(/[\[\]\.:\/]/g, '');   // THREE.PropertyBinding.sanitizeNodeName と同じ規則
const COMP = { 5120: [Int8Array, 1], 5121: [Uint8Array, 1], 5122: [Int16Array, 2], 5123: [Uint16Array, 2], 5125: [Uint32Array, 4], 5126: [Float32Array, 4] };
const NUM = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };

function readGLB(file) {
  const buf = fs.readFileSync(file); const jl = buf.readUInt32LE(12); const json = JSON.parse(buf.subarray(20, 20 + jl).toString('utf8'));
  const bin = buf.subarray(20 + jl + 8); 
  const acc = (i) => {
    const a = json.accessors[i]; const [T, sz] = COMP[a.componentType]; const n = NUM[a.type]; const out = new T(a.count * n);
    if (a.bufferView !== undefined) { const bv = json.bufferViews[a.bufferView]; const stride = bv.byteStride || sz * n; const base = (bv.byteOffset || 0) + (a.byteOffset || 0);
      const dv = new DataView(bin.buffer, bin.byteOffset + base); const get = { 5120: 'getInt8', 5121: 'getUint8', 5122: 'getInt16', 5123: 'getUint16', 5125: 'getUint32', 5126: 'getFloat32' }[a.componentType];
      for (let k = 0; k < a.count; k++) for (let c = 0; c < n; c++) out[k * n + c] = dv[get](k * stride + c * sz, true); }
    return { data: out, count: a.count, n, normalized: !!a.normalized, sparse: !!a.sparse };
  };
  return { json, bin, acc, size: buf.length };
}

function checkData(id) {
  const file = path.join(ROOT, 'chars', id, `${id}.glb`); const { json, acc, size } = readGLB(file); const R = { file: path.relative(ROOT, file), file_size_bytes: size, checks: {} };
  const C = R.checks; const ok = (name, pass, detail) => { C[name] = { pass: !!pass, ...detail }; };
  const skin = json.skins?.[0]; const joints = (skin?.joints || []).map(j => json.nodes[j].name);
  ok('skin_exists', json.skins?.length === 1, { skins: json.skins?.length || 0, joints: joints.length });
  const missing = REQUIRED.filter(b => !joints.includes(b)); ok('required_bones', missing.length === 0, { required: REQUIRED.length, missing });
  R.joint_names = joints; R.bone_name_map_three = Object.fromEntries(joints.map(j => [j, sanitize(j)]));
  let tris = 0, verts = 0, maxDev = 0, badJoint = 0, hasAttr = true, maxInfl = 0; const prims = [];
  for (const m of json.meshes) for (const p of m.primitives) {
    const a = p.attributes; if (a.JOINTS_0 === undefined || a.WEIGHTS_0 === undefined) { hasAttr = false; continue; }
    const J = acc(a.JOINTS_0), W = acc(a.WEIGHTS_0); const div = W.normalized ? (W.data instanceof Uint8Array ? 255 : 65535) : 1;
    for (let v = 0; v < W.count; v++) { let s = 0, k = 0; for (let c = 0; c < 4; c++) { const w = W.data[v * 4 + c] / div; s += w; if (w > 0) { k++; if (J.data[v * 4 + c] >= joints.length) badJoint++; } } maxDev = Math.max(maxDev, Math.abs(s - 1)); maxInfl = Math.max(maxInfl, k); }
    const t = json.accessors[p.indices].count / 3; tris += t; verts += W.count;
    prims.push({ material: json.materials[p.material]?.name, triangles: t, vertices: W.count, morph_targets: (p.targets || []).length });
  }
  ok('joints_weights_attributes', hasAttr, { primitives: prims.length });
  ok('weights_normalized', maxDev < 1e-3 && badJoint === 0, { max_abs_deviation_from_1: +maxDev.toExponential(2), joints_out_of_range: badJoint, max_influences: maxInfl });
  const meta = JSON.parse(fs.readFileSync(path.join(ROOT, 'chars', id, `${id}_motions.json`), 'utf8'));
  const CLIPS = ONLY_COMMON ? COMMON : [...COMMON, ...(meta.unique_clips || [])]; R.unique_clips = meta.unique_clips || [];
  const anims = (json.animations || []).map(a => { let d = 0; for (const s of a.samplers) { const mx = json.accessors[s.input].max[0]; d = Math.max(d, mx); } return { name: a.name, duration: +d.toFixed(4), channels: a.channels.length }; });
  const names = anims.map(a => a.name); const missClip = CLIPS.filter(c => !names.includes(c));
  ok('clips_present', missClip.length === 0 && anims.length === CLIPS.length, { expected: CLIPS.length, found: anims.length, missing: missClip });
  const durBad = anims.filter(a => meta.clips[a.name] && Math.abs(a.duration - meta.clips[a.name].frames / 60) > 1e-3).map(a => ({ name: a.name, glb: a.duration, defined: meta.clips[a.name].frames / 60 }));
  ok('clip_durations_match_definition', durBad.length === 0, { mismatched: durBad });
  if (!ONLY_COMMON) ok('has_unique_motion', R.unique_clips.length >= 1 && R.unique_clips.every(c => names.includes(c)), { unique_clips: R.unique_clips });
  ok('shape_keys_present', ['paw_open.L', 'paw_open.R', 'blink', 'brow_angry'].every(k => (json.meshes[0].extras?.targetNames || []).includes(k)), { found: json.meshes[0].extras?.targetNames || [] });
  R.animations = anims.map(a => ({ ...a, frames: Math.round(a.duration * 60), loop: meta.clips[a.name]?.loop }));
  R.triangles = tris; R.vertices_after_split = verts; R.primitives = prims;
  R.textures = (json.textures || []).length; R.images = (json.images || []).map(im => ({ mime: im.mimeType, bytes: json.bufferViews[im.bufferView].byteLength }));
  R.materials = (json.materials || []).map(m => m.name); R.morph_targets = json.meshes[0].extras?.targetNames || [];
  return R;
}

const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
async function checkPlayback(b, id, R) {
  const P = {}; const page = b.page; const errs0 = b.errors.length;
  await page.evaluate(async (c) => { await window.mamo.load(c); window.mamo.set({ paused: true }); }, id);
  P.loaded_clips = await page.evaluate(() => window.mamo.clips()); P.stats = await page.evaluate(() => window.mamo.stats());
  const pose = (clip, f) => page.evaluate(([clip, f]) => { const m = window.mamo; m.play(clip, { fade: 0 }); m.setTime(f / 60); m.draw(); return m.bones(); }, [clip, f]);
  const idle0 = await pose('idle', 0); P.clips = {}; const H = R.height;
  const tailN = R.joint_names.filter(n => /^tail_\d+$/.test(n)).sort(); let tailLen = 0; for (let i = 1; i < tailN.length; i++) tailLen += dist(idle0[tailN[i]], idle0[tailN[i - 1]]);
  const secTol = Math.max(0.02, 0.06 * tailLen);   // 長い尻尾は idle 自体の揺れが大きいので、尻尾の長さに比例させる
  R.tail_last = tailN[tailN.length - 1];
  for (const a of R.animations) {
    const N = a.frames; const frames = []; for (let f = 0; f <= N; f++) frames.push(await pose(a.name, f));
    let moved = 0; for (const f of frames) for (const k in f) moved = Math.max(moved, dist(f[k], frames[0][k]));
    const o = { bones_move_max_m: +moved.toFixed(4), bones_animated: moved > 1e-3 };
    const SEC = /^(tail_|band_|belt_)/;   // 二次動作（バネ）のボーン。idle 側も揺れているので本体とは別に測る
    let dEnd = 0, worst = '', dSec = 0; for (const k in idle0) { const d = dist(frames[N][k], a.loop ? frames[0][k] : idle0[k]); if (!a.loop && SEC.test(k)) { dSec = Math.max(dSec, d); continue; } if (d > dEnd) { dEnd = d; worst = k; } }
    const holds = ['crouch', 'guard_stand'].includes(a.name);
    if (a.loop) { o.loop_seam_max_m = +dEnd.toFixed(5); o.loop_seam_ok = dEnd < 0.002; }
    else if (!holds) { o.end_vs_idle_max_m = +dEnd.toFixed(5); o.end_vs_idle_worst_bone = worst; o.returns_to_idle = dEnd < 0.004; o.end_vs_idle_secondary_bones_max_m = +dSec.toFixed(5); o.secondary_settles = dSec < secTol; }
    let jump = 0; for (let f = 1; f <= N; f++) for (const k in idle0) jump = Math.max(jump, dist(frames[f][k], frames[f - 1][k])); o.max_bone_step_per_frame_m = +jump.toFixed(4);
    // 足の接地: 足首が低い（=接地している）フレームでの最低点と、地面より下への沈み込み
    let minY = 9, maxToe = 0; for (const f of frames) for (const s of ['L', 'R']) { minY = Math.min(minY, f['toe' + s][1], f['ankle' + s][1]); maxToe = Math.max(maxToe, f['toe' + s][1]); }
    o.lowest_foot_bone_y_m = +minY.toFixed(4);
    if (['idle', 'crouch', 'guard_stand', 'stand_light', 'hurt_light'].includes(a.name)) { let drift = 0; for (const s of ['L', 'R']) { if (a.name === 'hurt_light' && s === 'L') continue; for (const f of frames) drift = Math.max(drift, dist(f['ankle' + s], frames[0]['ankle' + s])); }
      if (a.name === 'idle' || a.name === 'guard_stand') { o.planted_foot_drift_max_m = +drift.toFixed(4); } }
    if (a.name === 'crouch') { const f = frames[N]; o.pelvis_drop_m = +(frames[0].pelvis[1] - f.pelvis[1]).toFixed(4); o.lead_paw_height_m = +f.pawL[1].toFixed(4);
      o.lead_foot_drift_m = +Math.max(...frames.slice(12).map(g => dist(g.toeL, frames[12].toeL))).toFixed(4);
      o.paw_open_morph_at_end = await page.evaluate(() => window.mamo.morph('paw_open.L')); }
    if (a.name.startsWith('stand_') || a.name.startsWith('sp_')) { let reach = -9, fr = 0; frames.forEach((f, i) => { for (const k of ['pawL', 'pawR', 'toeL', 'toeR', R.tail_last]) if (f[k][2] > reach) { reach = f[k][2]; fr = i; } }); o.max_forward_reach_m = +reach.toFixed(4); o.max_reach_frame = fr; o.max_reach_bone = ['pawL', 'pawR', 'toeL', 'toeR', R.tail_last].find(k => Math.abs(frames[fr][k][2] - reach) < 1e-9); }
    P.clips[a.name] = o;
  }
  P.console_errors = b.errors.slice(errs0);
  const C = R.checks;
  C.three_loads_all_clips = { pass: P.loaded_clips.length === R.animations.length, loaded: P.loaded_clips.length };
  C.three_bones_move_in_every_clip = { pass: Object.values(P.clips).every(c => c.bones_animated) };
  C.three_no_console_errors = { pass: P.console_errors.length === 0, errors: P.console_errors };
  C.loops_are_seamless = { pass: Object.values(P.clips).every(c => c.loop_seam_ok !== false) };
  C.attacks_return_to_idle = { pass: Object.values(P.clips).every(c => c.returns_to_idle !== false) };
  C.secondary_motion_settles_at_end = { pass: Object.values(P.clips).every(c => c.secondary_settles !== false), threshold_m: +secTol.toFixed(4) };
  if (P.clips.crouch) C.crouch_lead_hand_on_ground = { pass: P.clips.crouch.lead_paw_height_m < 0.045, paw_bone_height_m: P.clips.crouch.lead_paw_height_m, note: '手のボーンは拳の中心付近。0.045m 未満なら開いた手が床に触れている' };
  if (id === 'bullet' && P.clips.sp_tail_whip) {      // 長い尻尾の打撃: 尻尾のボーン数、最大リーチが尻尾によるものか、拳より長いか、床や胴に潜らないか
    const meta = JSON.parse(fs.readFileSync(path.join(ROOT, 'chars', id, `${id}_motions.json`), 'utf8')); const tw = meta.clips.sp_tail_whip; const w = P.clips.sp_tail_whip; const punch = Math.max(P.clips.stand_light.max_forward_reach_m, P.clips.stand_heavy.max_forward_reach_m);
    C.bullet_tail_has_extra_bones = { pass: meta.tail_bones.length >= 5, tail_bones: meta.tail_bones.length };
    C.bullet_tail_whip_reach = { pass: w.max_reach_bone === R.tail_last && tw.tail_tip_max_forward_m > punch * 1.35 && tw.tail_tip_max_forward_frame >= tw.startup && tw.tail_tip_max_forward_frame <= tw.startup + tw.active,
      tail_tip_max_forward_m: tw.tail_tip_max_forward_m, at_frame: tw.tail_tip_max_forward_frame, active_frames: [tw.startup, tw.startup + tw.active], longest_punch_reach_m: punch, ratio: +(tw.tail_tip_max_forward_m / punch).toFixed(2), reach_bone_in_glb: w.max_reach_bone };
    C.bullet_tail_clear_of_ground_and_body = { pass: tw.tail_tip_min_height_m > 0.015 && tw.tail_to_body_axis_min_m > 0.10, tail_tip_min_height_m: tw.tail_tip_min_height_m, tail_to_body_axis_min_m: tw.tail_to_body_axis_min_m, note: '胴の軸からの距離が胴の半径(約0.14m)より小さいと胴に潜る' };
  }
  C.feet_not_below_ground = { pass: Object.values(P.clips).every(c => c.lowest_foot_bone_y_m > -0.004) };
  R.playback = P;
}

const b = await open({ width: 480, height: 480 }); const summary = {};
fs.mkdirSync(path.join(ROOT, 'validation'), { recursive: true });
for (const id of CHARS) {
  const R = checkData(id); R.height = JSON.parse(fs.readFileSync(path.join(ROOT, 'chars', id, `${id}_motions.json`), 'utf8')).height;
  await checkPlayback(b, id, R);
  R.all_pass = Object.values(R.checks).every(c => c.pass);
  fs.writeFileSync(path.join(ROOT, 'validation', `${id}.json`), JSON.stringify(R, null, 1));
  summary[id] = { all_pass: R.all_pass, failed: Object.entries(R.checks).filter(([, c]) => !c.pass).map(([k]) => k), triangles: R.triangles, joints: R.joint_names.length, clips: R.animations.length, unique_clips: R.unique_clips, textures: R.textures, file_size_mb: +(R.file_size_bytes / 1e6).toFixed(2), draw_calls: R.playback.stats.meshes };
  console.log(id, JSON.stringify(summary[id]));
  for (const [k, c] of Object.entries(R.checks)) if (!c.pass) console.log('  FAIL', k, JSON.stringify(c));
}
fs.writeFileSync(path.join(ROOT, 'validation', 'summary.json'), JSON.stringify({ generated_by: 'tools/validate.mjs', common_clips_checked: COMMON, characters: summary }, null, 1));
await b.close();
process.exit(Object.values(summary).every(s => s.all_pass) ? 0 : 1);
