// マモ拳 pixel-rig コア。
// リグ計算（FK / IK / 揺れ物 / 補完）と低解像度バッファへの描画を1つにまとめたモジュール。
// ブラウザのビューワーと Node の書き出しスクリプトの両方がこのファイルだけを使う。
// DOM にも Node API にも依存しない（入力は JSON と RGBA 配列、出力は RGBA 配列）。

const DEG = Math.PI / 180;
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

export const EASE = {
  none: () => 0,
  linear: (t) => t,
  in: (t) => t * t,
  out: (t) => 1 - (1 - t) * (1 - t),
  inout: (t) => (t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t)),
};

// ---------------------------------------------------------------------------
// リグの構築
// ---------------------------------------------------------------------------

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/**
 * @param rigJson   chars/<id>/rig.json
 * @param palette   chars/<id>/palette.json
 * @param images    { [partName]: { w, h, data: Uint8Array(RGBA) } }
 */
export function createRig(rigJson, palette, images) {
  // --- パレット: index 0 = 透明。ramp は [line, deep, shadow, base, light] の5階調 ---
  const colors = [[0, 0, 0]];
  const rampOf = [null]; // index -> {ramp, level} | null
  const key2idx = new Map();
  const names = {};
  const add = (hex, name, ramp) => {
    const rgb = hexToRgb(hex);
    const k = (rgb[0] << 16) | (rgb[1] << 8) | rgb[2];
    if (key2idx.has(k)) throw new Error(`palette: 色が重複しています ${hex} (${name})`);
    key2idx.set(k, colors.length);
    names[name] = colors.length;
    colors.push(rgb);
    rampOf.push(ramp);
    return colors.length - 1;
  };
  const ramps = {};
  for (const [rname, list] of Object.entries(palette.ramps)) {
    ramps[rname] = list.map((hex, level) => add(hex, `${rname}.${level}`, { ramp: rname, level }));
  }
  for (const [cname, hex] of Object.entries(palette.flat || {})) add(hex, cname, null);
  const outlineIdx = names[palette.outline || 'outline'];

  // --- ボーン ---
  const bones = {};
  for (const [name, b] of Object.entries(rigJson.bones)) {
    bones[name] = { name, parent: b.parent ?? null, at: b.at || [0, 0], len: b.len || 0 };
  }

  // --- パーツ（画像を index 化して保持） ---
  const parts = {};
  for (const [name, p] of Object.entries(rigJson.parts)) {
    const img = images[name];
    if (!img) throw new Error(`パーツ画像がありません: ${name}`);
    const idx = new Uint8Array(img.w * img.h);
    for (let i = 0; i < idx.length; i++) {
      if (img.data[i * 4 + 3] < 128) continue;
      const k = (img.data[i * 4] << 16) | (img.data[i * 4 + 1] << 8) | img.data[i * 4 + 2];
      const ci = key2idx.get(k);
      if (ci === undefined) {
        throw new Error(`${name}: パレット外の色 #${k.toString(16).padStart(6, '0')} が (${i % img.w},${(i / img.w) | 0}) にあります`);
      }
      idx[i] = ci;
    }
    parts[name] = {
      name, w: img.w, h: img.h, idx,
      bone: p.bone, pivot: p.pivot, group: p.group, order: p.order ?? 0,
      baseAngle: p.baseAngle ?? 0, snap: p.snap ?? rigJson.snapDeg ?? 5.625,
      slot: p.slot ?? name, upright: !!p.upright, at: p.at || [0, 0],
    };
  }
  // slot: 同じ場所に差し替えて使うパーツの組（拳・目・眉・口など）
  const slots = {};
  for (const p of Object.values(parts)) (slots[p.slot] ||= []).push(p.name);
  const slotDefault = { ...(rigJson.slotDefaults || {}) };
  for (const s of Object.keys(slots)) if (!slotDefault[s]) slotDefault[s] = slots[s][0];

  const groups = rigJson.groups.map((g, i) => ({ shadow: 2, light: 1, tone: 0, line: true, ...g, id: i + 1 }));
  const groupByName = Object.fromEntries(groups.map((g) => [g.name, g]));
  for (const p of Object.values(parts)) if (!groupByName[p.group]) throw new Error(`${p.name}: 未定義の group ${p.group}`);

  const fills = (rigJson.fills || []).map((f) => ({ ...f, colorIdx: names[f.color] }));
  for (const f of fills) if (f.colorIdx === undefined) throw new Error(`fill: 未定義の色 ${f.color}`);

  return {
    json: rigJson, id: rigJson.id, palette, colors, rampOf, ramps, names, outlineIdx,
    bones, parts, slots, slotDefault, groups, groupByName, fills,
    limbs: rigJson.limbs, chains: rigJson.chains || [], stance: rigJson.stance,
    colliders: rigJson.colliders || [], cell: rigJson.cell,
  };
}

// ---------------------------------------------------------------------------
// ポーズの合成と補間
// ---------------------------------------------------------------------------

export function mergePose(...layers) {
  const out = {};
  for (const l of layers) {
    if (!l) continue;
    for (const [k, v] of Object.entries(l)) {
      if (v && typeof v === 'object' && !Array.isArray(v)) out[k] = { ...(out[k] || {}), ...v };
      else out[k] = Array.isArray(v) ? v.slice() : v;
    }
  }
  return out;
}

/** 数値と数値配列は補間、それ以外（差し替え・接地指定など）は a 側を保持する。 */
export function lerpPose(a, b, t) {
  if (t <= 0) return a;
  const out = {};
  for (const k of Object.keys(a)) {
    const va = a[k], vb = b[k];
    if (typeof va === 'number' && typeof vb === 'number') out[k] = lerp(va, vb, t);
    else if (Array.isArray(va) && Array.isArray(vb) && typeof va[0] === 'number') out[k] = va.map((x, i) => lerp(x, vb[i] ?? x, t));
    else out[k] = va;
  }
  return out;
}

// ---------------------------------------------------------------------------
// ソルバ
// ---------------------------------------------------------------------------

function rot(v, deg) {
  const c = Math.cos(deg * DEG), s = Math.sin(deg * DEG);
  return [v[0] * c - v[1] * s, v[0] * s + v[1] * c];
}

/** 2ボーンIK。届かない場合は伸ばさず、まっすぐ伸び切った位置で止める（ゴム腕防止）。 */
function ik2(ax, ay, tx, ty, l1, l2, bend) {
  let dx = tx - ax, dy = ty - ay;
  let d = Math.hypot(dx, dy);
  const max = l1 + l2 - 0.01, min = Math.abs(l1 - l2) + 0.01;
  const reachErr = d > max ? d - max : 0;
  d = clamp(d, min, max);
  const a = Math.atan2(dy, dx);
  const c1 = clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1);
  const t1 = a - bend * Math.acos(c1);
  const mx = ax + l1 * Math.cos(t1), my = ay + l1 * Math.sin(t1);
  const ex = ax + d * Math.cos(a), ey = ay + d * Math.sin(a);
  const t2 = Math.atan2(ey - my, ex - mx);
  return { t1: t1 / DEG, t2: t2 / DEG, mx, my, ex, ey, reachErr };
}

/**
 * 1ポーズを解く。戻り値の bones[name] = {x, y, rot}（root を原点とした座標、y は下向き正、地面 y=0）。
 * 角度は度。正の回転 = 画面上で時計回り = 右向きキャラが前に倒れる方向。
 */
export function solvePose(rig, pose) {
  const B = {};
  const warn = [];
  const st = rig.json.spine; // ['pelvis','torso','chest','neck','head']
  const set = (name, x, y, r) => (B[name] = { x, y, rot: r });
  const child = (name, parentName, localRot) => {
    const b = rig.bones[name], p = B[parentName];
    const o = rot(b.at, p.rot);
    return set(name, p.x + o[0], p.y + o[1], p.rot + (localRot || 0));
  };

  set('root_ground', 0, 0, 0);
  let hip = pose.hip.slice();

  // 胴体が地面にめり込まない補正（しゃがみで胴体を潰さず、腰の高さ側で吸収する）
  let groundPush = 0;
  const solveSpine = () => {
    set('pelvis', hip[0], hip[1], pose.pelvis || 0);
    for (let i = 1; i < st.length; i++) child(st[i], st[i - 1], pose[st[i]] || 0);
  };
  solveSpine();
  for (const c of rig.colliders) {
    const b = B[c.bone];
    const o = rot(c.at, b.rot);
    const low = b.y + o[1] + c.r;
    const lim = -(c.clear ?? 1);
    if (low > lim) groundPush = Math.max(groundPush, low - lim);
  }
  if (groundPush > 0) { hip[1] -= groundPush; solveSpine(); }

  // 頭まわりの子ボーン（顎・耳など単純FK）
  const fkBones = rig.json.fk || [];
  for (const name of fkBones) child(name, rig.bones[name].parent, pose[name] || 0);

  // 腕・脚（IK）
  const contacts = {};
  for (const L of rig.limbs) {
    const up = rig.bones[L.upper], lo = rig.bones[L.lower];
    let ax, ay;
    if (L.type === 'arm') {
      // 肩ボーン: 胸の子。ポーズで前後上下にずらせる。
      const sh = rig.bones[L.shoulder], p = B[sh.parent];
      const off = pose[L.shoulderKey] || [0, 0];
      const o = rot([sh.at[0] + off[0], sh.at[1] + off[1]], p.rot);
      set(L.shoulder, p.x + o[0], p.y + o[1], p.rot);
      ax = B[L.shoulder].x; ay = B[L.shoulder].y;
    } else {
      const p = B[up.parent];
      const o = rot(up.at, p.rot);
      ax = p.x + o[0]; ay = p.y + o[1];
    }
    let tx, ty, endRot = 0, heel = 0, toeRot = 0;
    const tg = pose[L.key];
    if (L.type === 'arm') {
      // 手首ターゲット = 肩からの相対（画面軸）。tg[2] があれば拳の回転（前腕基準）。
      tx = ax + tg[0]; ty = ay + tg[1];
    } else {
      // 足ターゲット = 足裏の基準点（足首の真下）。root 相対。[x, y, 足の回転, かかと上げ角]
      const fx = tg[0], fy = tg[1];
      endRot = tg[2] || 0; heel = tg[3] || 0;
      const ft = rig.bones[L.foot];
      if (heel) {
        // 母指球（つま先の付け根）を支点にかかとを上げる。つま先は地面に残す。
        const ballX = fx + ft.len, ballY = fy;
        const o = rot([-ft.len, -L.ankleH], heel);
        tx = ballX + o[0]; ty = ballY + o[1];
        endRot = heel; toeRot = -heel;
      } else {
        const o = rot([0, -L.ankleH], endRot);
        tx = fx + o[0]; ty = fy + o[1];
      }
    }
    const bend = pose[L.bendKey] ?? L.bend;
    const r = ik2(ax, ay, tx, ty, up.len, lo.len, bend);
    if (r.reachErr > 0.5) warn.push(`${L.key}: ターゲットに ${r.reachErr.toFixed(1)}px 届いていません`);
    set(L.upper, ax, ay, r.t1);
    set(L.lower, r.mx, r.my, r.t2);
    if (L.type === 'arm') {
      set(L.wrist, r.ex, r.ey, r.t2);
      set(L.end, r.ex, r.ey, r.t2 + (tg[2] || 0));
    } else {
      set(L.ankle, r.ex, r.ey, r.t2);
      set(L.foot, r.ex, r.ey, endRot);
      const ft = rig.bones[L.foot];
      const o = rot([ft.len, L.ankleH], endRot);
      set(L.toe, r.ex + o[0], r.ey + o[1], endRot + toeRot);
      contacts[L.key] = { x: r.ex + o[0], y: r.ey + o[1], reachErr: r.reachErr };
    }
  }
  return { bones: B, warn, contacts, groundPush, pose };
}

// 揺れ物・尻尾: ポーズの目標形状へ引き戻す力つきの verlet チェーン。
// stiff=1 で完全FK、0 に近いほど紐のように遅れてついてくる。
function chainTargets(rig, solved, ch, pose) {
  const anchor = solved.bones[ch.anchor];
  const o = rot(ch.at, anchor.rot);
  const pts = [[anchor.x + o[0], anchor.y + o[1]]];
  const angles = pose[ch.key] || ch.rest;
  let a = (ch.follow === false ? 0 : anchor.rot);
  for (let i = 0; i < ch.bones.length; i++) {
    a += angles[i] ?? 0;
    const len = rig.bones[ch.bones[i]].len;
    const p = pts[pts.length - 1];
    pts.push([p[0] + len * Math.cos(a * DEG), p[1] + len * Math.sin(a * DEG)]);
  }
  return pts;
}

function stepChains(rig, solved, state, rootX, rootY, dt = 1) {
  for (const ch of rig.chains) {
    const tg = chainTargets(rig, solved, ch, solved.pose).map((p) => [p[0] + rootX, p[1] + rootY]);
    let s = state[ch.name];
    if (!s) s = state[ch.name] = { p: tg.map((p) => p.slice()), q: tg.map((p) => p.slice()) };
    const n = tg.length;
    s.p[0] = tg[0].slice(); s.q[0] = tg[0].slice();
    for (let i = 1; i < n; i++) {
      const vx = (s.p[i][0] - s.q[i][0]) * ch.damp, vy = (s.p[i][1] - s.q[i][1]) * ch.damp;
      s.q[i] = s.p[i].slice();
      s.p[i][0] += vx + (tg[i][0] - s.p[i][0]) * ch.stiff;
      s.p[i][1] += vy + (ch.gravity || 0) + (tg[i][1] - s.p[i][1]) * ch.stiff;
    }
    for (let it = 0; it < 4; it++) {
      for (let i = 1; i < n; i++) {
        const len = rig.bones[ch.bones[i - 1]].len;
        const dx = s.p[i][0] - s.p[i - 1][0], dy = s.p[i][1] - s.p[i - 1][1];
        const d = Math.hypot(dx, dy) || 1e-6;
        s.p[i][0] = s.p[i - 1][0] + (dx / d) * len;
        s.p[i][1] = s.p[i - 1][1] + (dy / d) * len;
        if (ch.floor !== false && s.p[i][1] > -(ch.floor ?? 1)) s.p[i][1] = -(ch.floor ?? 1); // 地面（y=0）を突き抜けない。floor = パーツの太さの半分
      }
    }
  }
}

function applyChains(rig, solved, state, rootX, rootY) {
  for (const ch of rig.chains) {
    const s = state[ch.name];
    for (let i = 0; i < ch.bones.length; i++) {
      const a = s.p[i], b = s.p[i + 1];
      solved.bones[ch.bones[i]] = {
        x: a[0] - rootX, y: a[1] - rootY,
        rot: Math.atan2(b[1] - a[1], b[0] - a[0]) / DEG,
      };
    }
  }
}

/** 揺れ物なしで1ポーズを解く（立ち姿の確認など）。チェーンは目標形状そのまま。 */
export function solveStatic(rig, pose) {
  const solved = solvePose(rig, pose);
  const state = {};
  stepChains(rig, solved, state, 0, 0);
  applyChains(rig, solved, state, 0, 0);
  return solved;
}

// ---------------------------------------------------------------------------
// モーションのベイク（60Hz タイムライン → 絵の更新フレーム列）
// ---------------------------------------------------------------------------

/**
 * motion = { loop, step, velocity?, base?, keys:[{hold, tween?, pose, plant?, root?}] }
 * 戻り値 frames[] は「絵として異なる1コマ」。start/dur は 60Hz フレーム数。
 */
export function bakeMotion(rig, motion) {
  const step = motion.step || 4;
  // キーの pose は、その場のオブジェクトか motion.poses の名前。{"use": "名前", ...} で名前付きポーズに上書きもできる。
  const named = motion.poses || {};
  const resolve = (p) => {
    if (typeof p === 'string') { if (!named[p]) throw new Error(`${motion.name}: 未定義のポーズ ${p}`); return [named[p]]; }
    if (p && p.use) { const { use, ...rest } = p; if (!named[use]) throw new Error(`${motion.name}: 未定義のポーズ ${use}`); return [named[use], rest]; }
    return [p];
  };
  const keys = motion.keys.map((k) => {
    const pose = mergePose(rig.stance, motion.base, ...resolve(k.pose));
    pose.root = k.root || [0, 0];
    return { ...k, pose, tween: k.tween || 'none', plant: k.plant || motion.plant || [] };
  });
  let total = 0;
  const starts = keys.map((k) => { const s = total; total += k.hold; return s; });
  const vel = motion.velocity || [0, 0];

  const poseAt = (f) => {
    let i = keys.length - 1;
    while (i > 0 && starts[i] > f) i--;
    const k = keys[i];
    const next = keys[i + 1] || (motion.loop ? keys[0] : k);
    const t = EASE[k.tween]((f - starts[i]) / k.hold);
    const pose = lerpPose(k.pose, next.pose, t);
    if (motion.feetSpace === 'world') {
      // 足のターゲットを「モーション開始位置を原点とした地面座標」で書くモード。
      // 接地中の足は同じ数値を書き続けるだけで、root が動いても滑らない。
      const out = { ...pose };
      for (const L of rig.limbs) if (L.type === 'leg') { const f = pose[L.key].slice(); f[0] -= pose.root[0]; f[1] -= pose.root[1]; out[L.key] = f; }
      return { pose: out, key: i, plant: k.plant };
    }
    return { pose, key: i, plant: k.plant };
  };

  const frames = [];
  const state = {};
  const cycles = motion.loop ? 2 : 1;
  const pre = motion.loop ? 0 : 40; // 非ループは最初のキーで揺れ物を落ち着かせてから開始
  for (let c = 0; c < cycles; c++) {
    for (let f = (c === 0 ? -pre : 0); f < total; f++) {
      const ff = Math.max(0, f);
      const sample = Math.floor(ff / step) * step;
      const { pose, key, plant } = poseAt(sample);
      const solved = solvePose(rig, pose);
      // root の移動: キーの root（補間済み）＋ 等速 velocity。揺れ物は毎60Hzフレームの連続位置で積分する。
      const cur = poseAt(ff).pose.root;
      const wx = cur[0] + vel[0] * (ff + c * total), wy = cur[1] + vel[1] * (ff + c * total);
      stepChains(rig, solved, state, wx, wy);
      if (c === cycles - 1 && f >= 0 && f % step === 0) {
        const rx = RI(pose.root[0]), ry = RI(pose.root[1]);
        applyChains(rig, solved, state, wx, wy);
        frames.push({
          index: frames.length, start: f, dur: Math.min(step, total - f), key, plant,
          root: [rx, ry], solved,
        });
      }
    }
  }
  return { name: motion.name, loop: !!motion.loop, total, step, velocity: vel, frames };
}

// ---------------------------------------------------------------------------
// 描画（低解像度バッファ）
// ---------------------------------------------------------------------------

// 実行環境（ブラウザ / Node）で三角関数の末尾ビットが違っても同じ絵になるよう、丸めの前に 1/4096 へ量子化する。
const Q = (v) => Math.round(v * 4096) / 4096;
const RI = (v) => Math.round(Q(v));
const snapAngle = (deg, s) => (s > 0 ? Math.round(Q(deg / s)) * s : Q(deg));

/** ポーズで差し替え指定されたパーツを考慮して、スロットごとに描くパーツ名を返す。 */
function activeParts(rig, pose) {
  const swap = pose.swap || {};
  const out = [];
  for (const slot of Object.keys(rig.slots)) {
    const name = swap[slot] || rig.slotDefault[slot];
    if (name === 'none') continue;
    if (!rig.parts[name]) throw new Error(`swap: 未定義のパーツ ${name}`);
    out.push(rig.parts[name]);
  }
  return out;
}

function blitPart(buf, w, h, part, jx, jy, deg, yMax) {
  const c = Math.round(Math.cos(deg * DEG) * 1e9) / 1e9, s = Math.round(Math.sin(deg * DEG) * 1e9) / 1e9;
  // 目的側の外接矩形
  const xs = [], ys = [];
  for (const [px, py] of [[0, 0], [part.w, 0], [0, part.h], [part.w, part.h]]) {
    const lx = px - part.pivot[0], ly = py - part.pivot[1];
    xs.push(jx + lx * c - ly * s); ys.push(jy + lx * s + ly * c);
  }
  const x0 = Math.max(0, Math.floor(Math.min(...xs))), x1 = Math.min(w - 1, Math.ceil(Math.max(...xs)));
  // yMax = 足裏の高さ。太ももや尻尾の丸みが地面より下へ出ないように切る（腰を落としたとき、腿が地面に乗った形になる）。
  const y0 = Math.max(0, Math.floor(Math.min(...ys))), y1 = Math.min(h - 1, yMax - 1, Math.ceil(Math.max(...ys)));
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const dx = x + 0.5 - jx, dy = y + 0.5 - jy;
      const sx = Math.floor(Q(dx * c + dy * s + part.pivot[0]));
      const sy = Math.floor(Q(-dx * s + dy * c + part.pivot[1]));
      if (sx < 0 || sy < 0 || sx >= part.w || sy >= part.h) continue;
      const ci = part.idx[sy * part.w + sx];
      if (ci) buf[y * w + x] = ci;
    }
  }
}

function fillCapsule(buf, w, h, ax, ay, ra, bx, by, rb, ci, yMax) {
  const x0 = Math.max(0, Math.floor(Math.min(ax - ra, bx - rb))), x1 = Math.min(w - 1, Math.ceil(Math.max(ax + ra, bx + rb)));
  // yMax: 足裏の高さ。補完の丸みが地面より下へはみ出さないように切る。
  const y0 = Math.max(0, Math.floor(Math.min(ay - ra, by - rb))), y1 = Math.min(h - 1, yMax - 1, Math.ceil(Math.max(ay + ra, by + rb)));
  const dx = bx - ax, dy = by - ay, dd = dx * dx + dy * dy || 1e-6;
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const px = x + 0.5 - ax, py = y + 0.5 - ay;
      const t = clamp((px * dx + py * dy) / dd, 0, 1);
      const r = lerp(ra, rb, t);
      const ex = px - dx * t, ey = py - dy * t;
      if (ex * ex + ey * ey <= r * r) buf[y * w + x] = ci;
    }
  }
}

/**
 * solved を w×h の RGBA バッファに描く。origin = root_ground のセル内座標（ピクセル境界）。
 * 手順: グループごとに平塗りパーツを合成 → 画面空間で陰影（階調シフト）→ 重なりに内側線 → 最後に外周アウトライン。
 * 陰影と輪郭を回転後にかけるので、パーツを回しても陰影の向きと1px線が崩れない。
 */
export function renderPose(rig, solved, opts) {
  const { w, h, origin, flip = false } = opts;
  const N = w * h;
  const canvas = new Uint8Array(N);
  const owner = new Uint8Array(N);
  const gbuf = new Uint8Array(N);
  const ox = origin[0], oy = origin[1];
  const pose = solved.pose;
  const zOver = pose.z || {};
  const act = activeParts(rig, pose);
  const groups = rig.groups.map((g) => ({ g, z: zOver[g.name] ?? g.z })).sort((a, b) => a.z - b.z).map((e) => e.g);
  const tmp = new Uint8Array(N);

  for (const g of groups) {
    if (opts.groups && !opts.groups.includes(g.name)) continue; // 計測用: 指定グループだけ描く
    gbuf.fill(0);
    let any = false;
    // 関節の隙間を埋める補完（画面空間で直接ラスタライズするので回転しても欠けない）
    for (const f of rig.fills) {
      if (f.group !== g.name) continue;
      const A = solved.bones[f.a.bone], Bn = solved.bones[f.b.bone];
      if (!A || !Bn) continue;
      const pa = rot(f.a.at || [0, 0], A.rot), pb = rot(f.b.at || [0, 0], Bn.rot);
      fillCapsule(gbuf, w, h, RI(A.x + pa[0]) + ox, RI(A.y + pa[1]) + oy, f.a.r,
        RI(Bn.x + pb[0]) + ox, RI(Bn.y + pb[1]) + oy, f.b.r, f.colorIdx, oy);
      any = true;
    }
    const ps = act.filter((p) => p.group === g.name).sort((a, b) => a.order - b.order);
    for (const p of ps) {
      const b = solved.bones[p.bone];
      if (!b) throw new Error(`${p.name}: ボーン ${p.bone} が解かれていません`);
      const o = rot(p.at, b.rot);
      const deg = p.upright ? 0 : snapAngle(b.rot - p.baseAngle, p.snap);
      blitPart(gbuf, w, h, p, RI(b.x + o[0]) + ox, RI(b.y + o[1]) + oy, deg, oy);
      any = true;
    }
    if (!any) continue;

    // 画面空間の陰影: 光は前上（右上）から。後ろ下の縁から shadow px 以内を1段暗く、前上の縁から light px 以内を1段明るく。
    tmp.set(gbuf);
    const inside = (x, y) => x >= 0 && y >= 0 && x < w && y < h && tmp[y * w + x] !== 0;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const ci = tmp[y * w + x];
        if (!ci) continue;
        const r = rig.rampOf[ci];
        if (!r) continue;
        let shift = g.tone;
        let dS = 99, dL = 99;
        for (let k = 1; k <= g.shadow + 2; k++) if (!inside(x - k, y + k) || !inside(x, y + k)) { dS = k; break; }
        for (let k = 1; k <= g.light; k++) if (!inside(x + k, y - k) || !inside(x, y - k)) { dL = k; break; }
        if (dS <= g.shadow) shift -= 1;
        else if (dL <= g.light) shift += 1;
        if (g.deep && dS <= g.deep) shift -= 1;
        if (shift) {
          const ramp = rig.ramps[r.ramp];
          gbuf[y * w + x] = ramp[clamp(r.level + shift, 1, ramp.length - 1)];
        }
      }
    }
    // 合成。下に別グループがある境界ピクセルは内側線（その素材の最暗色）にする。
    // merge: 付け根（肩など）は線を引かず、下のグループとなじませる。
    const merges = (g.merge || []).map((m) => {
      const b = solved.bones[m.bone], o = rot(m.at || [0, 0], b.rot);
      return [RI(b.x + o[0]) + ox, RI(b.y + o[1]) + oy, m.r * m.r];
    });
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        let ci = gbuf[i];
        if (!ci) continue;
        if (g.line) {
          let edge = false;
          if (x > 0 && !tmp[i - 1] && owner[i - 1]) edge = true;
          else if (x < w - 1 && !tmp[i + 1] && owner[i + 1]) edge = true;
          else if (y > 0 && !tmp[i - w] && owner[i - w]) edge = true;
          else if (y < h - 1 && !tmp[i + w] && owner[i + w]) edge = true;
          for (const m of merges) if ((x + 0.5 - m[0]) ** 2 + (y + 0.5 - m[1]) ** 2 <= m[2]) edge = false;
          if (edge) {
            const r = rig.rampOf[tmp[i]];
            ci = r ? rig.ramps[r.ramp][0] : rig.outlineIdx;
          }
        }
        canvas[i] = ci; owner[i] = g.id;
      }
    }
  }

  // 外周アウトライン（1px、外側に付ける）
  const out = new Uint8ClampedArray(N * 4);
  const put = (i, ci) => {
    const c = rig.colors[ci];
    out[i * 4] = c[0]; out[i * 4 + 1] = c[1]; out[i * 4 + 2] = c[2]; out[i * 4 + 3] = 255;
  };
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const di = flip ? y * w + (2 * ox - 1 - x) : i;
      if (flip && (2 * ox - 1 - x < 0 || 2 * ox - 1 - x >= w)) continue;
      if (canvas[i]) { put(di, canvas[i]); continue; }
      if (opts.outline === false) continue;
      if ((x > 0 && canvas[i - 1]) || (x < w - 1 && canvas[i + 1]) || (y > 0 && canvas[i - w]) || (y < h - 1 && canvas[i + w])) put(di, rig.outlineIdx);
    }
  }
  return out;
}

/** 不透明ピクセルの外接矩形 [x0,y0,x1,y1]（両端含む）。空なら null。 */
export function boundsOf(rgba, w, h) {
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (rgba[(y * w + x) * 4 + 3]) {
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  return x1 < 0 ? null : [x0, y0, x1, y1];
}
