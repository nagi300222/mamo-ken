// マモ拳 Showtime v14 — 奥義ムービーの参照プレイヤー（Three.js）。
// manifest/<id>_ultimate.json の「カメラ・役者の位置・キュー」を、ムービー秒 t の純関数として評価する。
// ゲーム本体（dojo/）には依存しない。Codex の CinematicPlayer はこの評価規則を移植すれば同じ絵になる。
//   const cp = createCinePlayer(THREE, { scene, camera, manifest, actors:{attacker,target,...}, mirror:false });
//   cp.seek(t);   // t 秒の状態へ（役者の位置・クリップ時刻・カメラ・VFX をすべて更新）
// 規則の正本は cinematic/v14/MANIFEST_SPEC.md。

export const EASE = {
  linear: u => u, hold: u => (u < 1 ? 0 : 1),
  inQuad: u => u * u, outQuad: u => 1 - (1 - u) ** 2, inOutQuad: u => (u < .5 ? 2 * u * u : 1 - 2 * (1 - u) ** 2),
  inCubic: u => u ** 3, outCubic: u => 1 - (1 - u) ** 3, inOutCubic: u => (u < .5 ? 4 * u ** 3 : 1 - 4 * (1 - u) ** 3),
  outExpo: u => (u >= 1 ? 1 : 1 - 2 ** (-10 * u)), inExpo: u => (u <= 0 ? 0 : 2 ** (10 * u - 10)),
  outBack: u => 1 + 2.70158 * (u - 1) ** 3 + 1.70158 * (u - 1) ** 2,
};
const lerp = (a, b, u) => a + (b - a) * u;
const BONE_ALIAS = { head: 'head', chest: 'chest', pelvis: 'pelvis', pawL: 'pawL', pawR: 'pawR', footL: 'footL', footR: 'footR', jaw: 'jaw', tail: 'tail_02' };
const FALLBACK_HEIGHT = { head: .9, chest: .62, pelvis: .42, pawL: .55, pawR: .55, footL: .05, footR: .05, jaw: .85, tail: .35 };   // 骨が無いときの高さ（身長比）

// キー列（t 昇順）を時刻 t で評価。数値・数値配列を補間し、区間の緩急は「行き先のキー」の ease を使う。
export function evalKeys(keys, t, fields) {
  if (!keys?.length) return null;
  if (t <= keys[0].t) return pick(keys[0], keys[0], 0, fields);
  if (t >= keys.at(-1).t) return pick(keys.at(-1), keys.at(-1), 0, fields);
  let i = 0; while (keys[i + 1].t <= t) i++;
  const a = keys[i], b = keys[i + 1]; const u = (EASE[b.ease || 'inOutCubic'] || EASE.inOutCubic)((t - a.t) / (b.t - a.t));
  return pick(a, b, u, fields);
}
function pick(a, b, u, fields) {
  const o = {};
  for (const [k, def] of Object.entries(fields)) {
    const va = a[k] ?? def, vb = b[k] ?? va;
    o[k] = Array.isArray(va) ? va.map((x, i) => lerp(x, vb[i] ?? x, u)) : lerp(va, vb, u);
  }
  return o;
}

export function createCinePlayer(THREE, { scene, camera, manifest, actors, mirror = false, fx = null, onCue = null }) {
  const M = manifest, sx = mirror ? -1 : 1, V = THREE.Vector3;
  const tmp = new V(), tmp2 = new V();
  // ---- 役者 ----
  // actors[name] = { root: Object3D（足元原点・この下にGLB）, mixer, clips:{name:AnimationClip}, height }
  const state = {};
  for (const [name, a] of Object.entries(actors)) {
    const track = M.actorTracks[name]; if (!track) continue;
    const bones = {}; a.root.traverse(o => { if (o.isBone) bones[o.name] = o; });
    const actions = {}; let cur = null;
    state[name] = { a, track, bones, actions, get cur() { return cur; }, set cur(v) { cur = v; } };
  }
  function playClip(s, clipName, time) {
    const clip = s.a.clips[clipName]; if (!clip) throw Error(`clip ${clipName} が ${s.a.id || '?'} に無い`);
    let act = s.actions[clipName];
    if (!act) { act = s.actions[clipName] = s.a.mixer.clipAction(clip); act.setLoop(THREE.LoopOnce, 1); act.clampWhenFinished = true; }
    if (s.cur !== act) { if (s.cur) s.cur.stop(); act.reset(); act.play(); s.cur = act; }
    act.paused = true; act.time = Math.max(0, Math.min(clip.duration, time)); s.a.mixer.update(0);
  }
  function placeActor(s, t) {
    const tr = s.track;
    // どのクリップを、どの時刻で（segments: ムービー秒 → クリップ秒。既定は 1 本を t=0 から等速）
    let seg = tr.segments[0]; for (const g of tr.segments) if (t >= g.start) seg = g;
    const ct = (seg.clipStart || 0) + (t - seg.start) * (seg.rate ?? 1);
    playClip(s, seg.clip, seg.loop ? ct % s.a.clips[seg.clip].duration : ct);
    const k = evalKeys(tr.root, t, { pos: [0, 0, 0], rotY: 0, rotZ: 0, rotX: 0, scale: 1 });
    const piv = (tr.pivotHeight ?? .45) * (s.a.height || .6);
    const r = s.a.root; r.position.set(0, 0, 0); r.rotation.set(0, 0, 0); r.scale.setScalar(k.scale); r.updateMatrix();
    // M = T(pos) · T(0,piv,0) · Rz · Rx · T(0,-piv,0) · Ry   （回転軸はステージ基準。宙返りは rotZ）
    const m = new THREE.Matrix4().makeTranslation(sx * k.pos[0], k.pos[1], k.pos[2]);
    m.multiply(new THREE.Matrix4().makeTranslation(0, piv, 0));
    m.multiply(new THREE.Matrix4().makeRotationZ(sx * THREE.MathUtils.degToRad(k.rotZ)));
    m.multiply(new THREE.Matrix4().makeRotationX(THREE.MathUtils.degToRad(k.rotX)));
    m.multiply(new THREE.Matrix4().makeTranslation(0, -piv, 0));
    m.multiply(new THREE.Matrix4().makeRotationY(sx * THREE.MathUtils.degToRad(k.rotY)));
    m.multiply(new THREE.Matrix4().makeScale(k.scale, k.scale, k.scale));
    r.matrixAutoUpdate = false; r.matrix.copy(m); r.updateMatrixWorld(true);
    const vis = tr.visible; r.visible = !vis || vis.some(([a, b]) => t >= a && t < b);
    if (tr.opacity) s.a.setOpacity?.(evalKeys(tr.opacity, t, { v: 1 }).v);
  }
  // ---- 位置の基準（anchor） ----
  // 'stage' | '<actor>' | '<actor>.root' | '<actor>.<bone>'。offset はステージ軸（mirror 時は x 反転）。
  function anchorPos(ref, out) {
    const off = ref.offset || [0, 0, 0]; const [an, bn] = (ref.anchor || 'stage').split('.');
    out.set(0, 0, 0);
    if (an !== 'stage') {
      const s = state[an]; if (!s) throw Error('anchor の役者が無い: ' + ref.anchor);
      if (!bn || bn === 'root') out.setFromMatrixPosition(s.a.root.matrixWorld);
      else { const b = s.bones[BONE_ALIAS[bn] || bn];
        if (b) b.getWorldPosition(out); else { out.setFromMatrixPosition(s.a.root.matrixWorld); out.y += (FALLBACK_HEIGHT[bn] ?? .5) * (s.a.height || .6); } }
    }
    out.x += sx * off[0]; out.y += off[1]; out.z += off[2]; return out;
  }
  // ---- カメラ ----
  function shotAt(t) { return M.shots.find(s => t >= s.start && t < s.end) || M.shots.at(-1); }
  const camState = { pos: new V(), look: new V(), fov: 40, roll: 0 };
  function evalCam(shot, t) {
    const keys = shot.camera.keys; let a = keys[0], b = keys[0], u = 0;
    if (t >= keys.at(-1).t) a = b = keys.at(-1);
    else if (t > keys[0].t) { let i = 0; while (keys[i + 1].t <= t) i++; a = keys[i]; b = keys[i + 1]; u = (EASE[b.ease || 'inOutCubic'] || EASE.inOutCubic)((t - a.t) / (b.t - a.t)); }
    // 各キーの位置は「いま」の骨位置で解決してから補間する（追従ショットで対象が動いても外れない）
    anchorPos(a.pos, tmp); anchorPos(b.pos, tmp2); camState.pos.lerpVectors(tmp, tmp2, u);
    anchorPos(a.look, tmp); anchorPos(b.look, tmp2); camState.look.lerpVectors(tmp, tmp2, u);
    camState.fov = lerp(a.fov ?? 40, b.fov ?? a.fov ?? 40, u); camState.roll = lerp(a.roll || 0, b.roll ?? a.roll ?? 0, u);
  }
  function applyShake(t) {
    let dx = 0, dy = 0, dr = 0;
    for (const c of M.cues) if (c.type === 'shake') { const age = t - c.at; if (age < 0 || age > c.dur) continue;
      const k = (1 - age / c.dur) ** 2 * c.amp, f = c.freq || 28; dx += Math.sin(age * f * 2.3 + c.at * 7) * k; dy += Math.cos(age * f * 3.1 + c.at * 3) * k; dr += Math.sin(age * f * 1.7) * k * 8; }
    return [dx, dy, dr];
  }
  function applyCamera(t, reduced) {
    const shot = shotAt(t); evalCam(shot, t);
    const [dx, dy, dr] = reduced ? [0, 0, 0] : applyShake(t);
    camera.position.copy(camState.pos); camera.up.set(0, 1, 0); camera.lookAt(camState.look);
    camera.translateX(dx); camera.translateY(dy);
    camera.rotateZ(THREE.MathUtils.degToRad(sx * camState.roll + dr));
    if (camera.isPerspectiveCamera) { camera.fov = camState.fov; camera.updateProjectionMatrix(); }
    return shot;
  }
  // ---- キュー ----
  let lastT = -1;
  function seek(t, { reducedMotion = false } = {}) {
    t = Math.max(0, Math.min(M.durationSeconds, t));
    for (const s of Object.values(state)) placeActor(s, t);
    const shot = applyCamera(t, reducedMotion);
    fx?.update(t, { anchorPos, mirror, shot, state });
    if (onCue) for (const c of M.cues) if (c.at > lastT && c.at <= t) onCue(c);
    lastT = t; return { shot: shot.id, t };
  }
  return { seek, shotAt, anchorPos, state, get duration() { return M.durationSeconds; } };
}
