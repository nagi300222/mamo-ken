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
  const CLIPS = ONLY_COMMON ? COMMON : [...COMMON, ...(meta.unique_clips || []), ...(meta.v2_clips || [])]; R.unique_clips = meta.unique_clips || []; R.v2_clips = meta.v2_clips || []; R.meta = meta;
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
  const idle0 = await pose('idle', 0); P.clips = {}; const H = R.height; const SEC0 = /^(tail_|band_|belt_)/;
  const REFS = { idle: idle0, guard: await pose('guard_stand', 5), crouch: await pose('crouch', 12) };       // 終端・始端の基準姿勢
  if (R.meta.clips.guard_crouch) REFS.guard_crouch = await pose('guard_crouch', R.meta.clips.guard_crouch.loop_from);
  if (R.meta.clips.down) REFS.down = await pose('down', R.meta.clips.down.frames);
  if (R.meta.clips.clinch_hold) { REFS.clinch = await pose('clinch_hold', 0); REFS.clinch_end = await pose('clinch_hold', R.meta.clips.clinch_hold.frames); }
  { const j = R.meta.clips.jump_n; REFS.air = await pose('jump_n', j.airborne[0] + Math.floor((j.airborne[1] - j.airborne[0]) / 2)); }
  const tailN = R.joint_names.filter(n => /^tail_\d+$/.test(n)).sort(); let tailLen = 0; for (let i = 1; i < tailN.length; i++) tailLen += dist(idle0[tailN[i]], idle0[tailN[i - 1]]);
  const secTol = Math.max(0.02, 0.06 * tailLen);   // 長い尻尾は idle 自体の揺れが大きいので、尻尾の長さに比例させる
  R.tail_last = tailN[tailN.length - 1];
  for (const a of R.animations) {
    const N = a.frames; const frames = []; for (let f = 0; f <= N; f++) frames.push(await pose(a.name, f));
    let moved = 0; for (const f of frames) for (const k in f) moved = Math.max(moved, dist(f[k], frames[0][k]));
    const o = { bones_move_max_m: +moved.toFixed(4), bones_animated: moved > 1e-3 };
    const SEC = /^(tail_|band_|belt_)/;   // 二次動作（バネ）のボーン。idle 側も揺れているので本体とは別に測る
    let dEnd = 0, worst = '', dSec = 0; for (const k in idle0) { const d = dist(frames[N][k], a.loop ? frames[0][k] : idle0[k]); if (!a.loop && SEC.test(k)) { dSec = Math.max(dSec, d); continue; } if (d > dEnd) { dEnd = d; worst = k; } }
    const ci = R.meta.clips[a.name] || {}; const endPose = ci.end_pose || (['crouch', 'guard_stand'].includes(a.name) ? 'hold' : 'idle'); const holds = endPose !== 'idle';
    if (ci.v2 && REFS[endPose]) { let d = 0, w = ''; for (const k in idle0) { if (SEC0.test(k)) continue; const x = dist(frames[N][k], REFS[endPose][k]); if (x > d) { d = x; w = k; } } o.end_pose = endPose; o.end_pose_diff_m = +d.toFixed(5); o.end_pose_worst_bone = w; o.ends_at_declared_pose = d < 0.006; }
    if (ci.v2 && REFS[ci.start_pose]) { let d = 0; for (const k in idle0) { if (SEC0.test(k)) continue; d = Math.max(d, dist(frames[0][k], REFS[ci.start_pose][k])); } o.start_pose = ci.start_pose; o.start_pose_diff_m = +d.toFixed(5); o.starts_at_declared_pose = d < 0.006; }
    if (endPose === 'down') { const f = frames[N]; o.lying = { head_y: +f.head[1].toFixed(3), pelvis_y: +f.pelvis[1].toFixed(3), ankle_y: +Math.max(f.ankleL[1], f.ankleR[1]).toFixed(3), paw_y: +Math.max(f.pawL[1], f.pawR[1]).toFixed(3) }; o.lies_on_ground = f.head[1] < 0.26 && f.pelvis[1] < 0.22 && Math.max(f.ankleL[1], f.ankleR[1]) < 0.09 && Math.max(f.pawL[1], f.pawR[1]) < 0.10; }
    { let low = 9, lb = ''; for (const f of frames) for (const k in f) if (k !== 'root_ground' && f[k][1] < low) { low = f[k][1]; lb = k; } o.lowest_bone_y_m = +low.toFixed(4); o.lowest_bone = lb; }
    { let low = 9; for (const f of frames) for (const k in f) if (/^tail_/.test(k)) low = Math.min(low, f[k][1]); o.lowest_tail_y_m = +low.toFixed(4); }
    if (a.name === 'clinch_hold') R.clinch_paws = [0, 5, 17, N].map(f => ({ f, L: frames[f].pawL, R: frames[f].pawR, head: frames[f].head }));
    if (a.name === 'roar') { const st = ci.startup, en = ci.startup + ci.active; let drift = 0; for (let f = st; f <= en; f++) for (const s of ['L', 'R']) drift = Math.max(drift, dist(frames[f]['toe' + s], frames[st]['toe' + s])); o.feet_drift_while_active_m = +drift.toFixed(4); o.chest_forward_m = +(frames[st + 2].chest[2] - frames[0].chest[2]).toFixed(4); o.roar_holds_ground = drift < 0.01 && o.chest_forward_m > 0.015; }
    if (ci.v2 && holds) { /* 終端は宣言した姿勢と比べる（上で判定済み） */ }
    else if (a.loop) { o.loop_seam_max_m = +dEnd.toFixed(5); o.loop_seam_ok = dEnd < 0.002; }
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
  if (R.v2_clips.length) {
    const cl = Object.entries(P.clips).filter(([n]) => R.v2_clips.includes(n));
    C.v2_clips_end_at_declared_pose = { pass: cl.every(([, c]) => c.ends_at_declared_pose !== false), failed: cl.filter(([, c]) => c.ends_at_declared_pose === false).map(([n, c]) => `${n}: ${c.end_pose_diff_m}m ${c.end_pose_worst_bone}`) };
    C.v2_clips_start_at_declared_pose = { pass: cl.every(([, c]) => c.starts_at_declared_pose !== false), failed: cl.filter(([, c]) => c.starts_at_declared_pose === false).map(([n, c]) => `${n}: ${c.start_pose_diff_m}m`) };
    C.down_and_ko_lie_on_ground = { pass: cl.every(([, c]) => c.lies_on_ground !== false), detail: Object.fromEntries(cl.filter(([, c]) => c.lying).map(([n, c]) => [n, c.lying])) };
    if (P.clips.roar) C.roar_keeps_feet_planted = { pass: P.clips.roar.roar_holds_ground, feet_drift_m: P.clips.roar.feet_drift_while_active_m, chest_forward_m: P.clips.roar.chest_forward_m };
    { let low = 9, where = ''; for (const [n, c] of Object.entries(P.clips)) if (c.lowest_tail_y_m < low) { low = c.lowest_tail_y_m; where = n; } C.tail_not_buried = { pass: low > -0.08, lowest_tail_bone_y_m: low, clip: where, note: '尻尾のボーンが床より8cm以上沈むと、尻尾が床へ突き抜けて見える' }; }
    C.body_bones_not_below_ground = { pass: Object.entries(P.clips).every(([, c]) => c.lowest_bone_y_m > -0.03 || /^(tail_|band_|belt_)/.test(c.lowest_bone)), worst: Object.entries(P.clips).map(([n, c]) => [n, c.lowest_bone_y_m, c.lowest_bone]).sort((a, b) => a[1] - b[1]).slice(0, 3) };
  }
  C.feet_not_below_ground = { pass: Object.values(P.clips).every(c => c.lowest_foot_bone_y_m > -0.004) };
  R.playback = P;
}

const b = await open({ width: 480, height: 480 }); const summary = {}; const ALLR = {};
fs.mkdirSync(path.join(ROOT, 'validation'), { recursive: true });
for (const id of CHARS) {
  const R = checkData(id); R.height = JSON.parse(fs.readFileSync(path.join(ROOT, 'chars', id, `${id}_motions.json`), 'utf8')).height;
  await checkPlayback(b, id, R);
  delete R.meta; ALLR[id] = R;
  R.all_pass = Object.values(R.checks).every(c => c.pass);
  fs.writeFileSync(path.join(ROOT, 'validation', `${id}.json`), JSON.stringify({ ...R, clinch_paws: undefined }, null, 1));
  summary[id] = { all_pass: R.all_pass, failed: Object.entries(R.checks).filter(([, c]) => !c.pass).map(([k]) => k), triangles: R.triangles, joints: R.joint_names.length, clips: R.animations.length, unique_clips: R.unique_clips, v2_clips: R.v2_clips.length, textures: R.textures, file_size_mb: +(R.file_size_bytes / 1e6).toFixed(2), draw_calls: R.playback.stats.meshes };
  console.log(id, JSON.stringify(summary[id]));
  for (const [k, c] of Object.entries(R.checks)) if (!c.pass) console.log('  FAIL', k, JSON.stringify(c));
}
// ---- 組み合い: 全キャラの組み合わせで、手のひらが同じ位置に来るか（体格差があっても）、頭どうしが重ならないか ----
const pairs = {}; let worst = { d: 0 }, headMin = { d: 9 }; const SP = 0.36;
const ids = Object.keys(ALLR).filter(id => ALLR[id].clinch_paws);
for (const a of ids) for (const bb of ids) { let dmax = 0, hmin = 9;
  ALLR[a].clinch_paws.forEach((pa, i) => { const pb = ALLR[bb].clinch_paws[i]; const mir = (p) => [-p[0], p[1], SP - p[2]];      // 相手は180度回って0.36m先に立つ
    dmax = Math.max(dmax, dist(pa.L, mir(pb.R)), dist(pa.R, mir(pb.L))); hmin = Math.min(hmin, dist(pa.head, mir(pb.head))); });
  pairs[`${a}_vs_${bb}`] = { palm_gap_max_m: +dmax.toFixed(4), head_distance_min_m: +hmin.toFixed(3) }; if (dmax > worst.d) worst = { d: dmax, pair: `${a}_vs_${bb}` }; if (hmin < headMin.d) headMin = { d: hmin, pair: `${a}_vs_${bb}` }; }
const clinch = ids.length ? { pass: worst.d < 0.03 && headMin.d > 0.16, pairs_checked: Object.keys(pairs).length, spacing_m: SP, palm_gap_worst: { pair: worst.pair, m: +worst.d.toFixed(4) }, head_distance_min: { pair: headMin.pair, m: +headMin.d.toFixed(3) },
  note: '手ボーン（拳の中心付近）どうしの距離。0.03m未満なら手のひらが合っている。頭ボーンどうしが0.16m以上離れていれば頭は重ならない', pairs } : null;
if (clinch) { fs.writeFileSync(path.join(ROOT, 'validation', 'clinch_pairs.json'), JSON.stringify(clinch, null, 1)); console.log('clinch pairs', JSON.stringify({ pass: clinch.pass, palm_gap_worst: clinch.palm_gap_worst, head_distance_min: clinch.head_distance_min })); }
for (const id of Object.keys(ALLR)) delete ALLR[id].clinch_paws;
fs.writeFileSync(path.join(ROOT, 'validation', 'summary.json'), JSON.stringify({ generated_by: 'tools/validate.mjs', common_clips_checked: COMMON, clinch_pairs: clinch && { pass: clinch.pass, pairs_checked: clinch.pairs_checked, palm_gap_worst: clinch.palm_gap_worst, head_distance_min: clinch.head_distance_min }, characters: summary }, null, 1));
await b.close();
process.exit(Object.values(summary).every(s => s.all_pass) && (!clinch || clinch.pass) ? 0 : 1);
