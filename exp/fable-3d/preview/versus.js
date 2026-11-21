// 2体を格闘ゲームと同じ向き（横視点、互いに向かい合う）で並べ、対になるモーションを同じフレーム基準で再生する。
// ゲーム側（dojo）の配置に合わせている: 1P は rotation.y=+90°、2P は -90°（ミラーではなく回転）。
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
const CHARS = ['moguzo', 'pisuke', 'godan', 'hakuma', 'chirka', 'takimaru', 'yomikage', 'bullet', 'dark_moguzo'];
const Q = new URLSearchParams(location.search); const $ = (id) => document.getElementById(id);
if (Q.has('bare')) { $('bar').style.display = 'none'; $('wrap').style.height = '100%'; }
const renderer = new THREE.WebGLRenderer({ canvas: $('c'), antialias: true, preserveDrawingBuffer: true }); renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x23262e);
scene.add(new THREE.HemisphereLight(0xe6ecff, 0x6a5a4c, 2.3)); const key = new THREE.DirectionalLight(0xfff2e0, 2.6); key.position.set(-1.2, 2.4, 2.0); scene.add(key);
scene.add(new THREE.GridHelper(10, 100, 0x555b68, 0x343944));
const camera = new THREE.PerspectiveCamera(20, 1, 0.1, 100);
const S = { a: Q.get('a') || 'moguzo', b: Q.get('b') || 'godan', seq: Q.get('seq') || 'clinch', frame: 0, paused: false, speed: 1, actors: [], cache: {}, view: Q.get('view') || 'side' };
const ease = (u) => { u = Math.min(1, Math.max(0, u)); return u * u * (3 - 2 * u); };
// 各シーケンス: 区間ごとに 1P・2P のクリップと開始フレーム、2体の間隔(m)を決める
function timeline(seq, A, B) {
  const fr = (m, c) => m.clips[c].frames; const T = [];
  if (seq === 'clinch') { const g = A.meta.clips.gyuiin; const hit = g.startup + g.active - 4, H = fr(A.meta, 'clinch_hold'), R = fr(A.meta, 'clinch_recoil');
    T.push({ n: hit, a: ['gyuiin', 0], b: ['idle', 0], d: (f) => 0.36 + 0.32 * (1 - f / hit), label: 'ギュイーン前進（1P）' });
    T.push({ n: H, a: ['clinch_hold', 0], b: ['clinch_hold', 0], d: () => 0.36, label: '組み合い clinch_hold（両者同期）' });
    T.push({ n: Math.max(R, fr(B.meta, 'clinch_recoil')) + 12, a: ['clinch_recoil', 0], b: ['clinch_recoil', 0], d: (f) => 0.36 + (1.35 - 0.36) * ease(f / 8), label: '弾き戻し clinch_recoil' }); }
  if (seq === 'roar') { const r = A.meta.clips.roar; T.push({ n: r.startup + 1, a: ['roar', 0], b: ['idle', 0], d: () => 0.62, label: '咆哮の溜め（1P）' });
    T.push({ n: fr(A.meta, 'roar') - r.startup - 1 + 8, a: ['roar', r.startup + 1], b: ['roar_hit', 0], d: (f) => 0.62 + 0.16 * ease(f / 10), label: '咆哮ヒット → roar_hit（2P）' }); }
  if (seq === 'roar_guard') { const r = A.meta.clips.roar; T.push({ n: r.startup + 1, a: ['roar', 0], b: ['guard_stand', 0], d: () => 0.62, label: '咆哮の溜め（1P）／ガード（2P）' });
    T.push({ n: fr(A.meta, 'roar') - r.startup - 1 + 6, a: ['roar', r.startup + 1], b: ['guard_impact', 0], d: (f) => 0.62 + 0.05 * ease(f / 8), label: '咆哮をガード → guard_impact（2P）' }); }
  if (seq === 'guard') { const l = A.meta.clips.stand_light, h = A.meta.clips.stand_heavy;
    T.push({ n: l.startup, a: ['stand_light', 0], b: ['guard_stand', 5], d: () => 0.42, label: '立ち弱（1P）／立ちガード（2P）' }); T.push({ n: fr(A.meta, 'stand_light') - l.startup + 6, a: ['stand_light', l.startup], b: ['guard_hit', 0], d: () => 0.42, label: 'guard_hit（2P）' });
    T.push({ n: h.startup, a: ['stand_heavy', 0], b: ['guard_crouch', 6], d: () => 0.52, label: '立ち強（1P）／しゃがみガード（2P）' }); T.push({ n: fr(A.meta, 'stand_heavy') - h.startup + 6, a: ['stand_heavy', h.startup], b: ['guard_crouch_hit', 0], d: () => 0.52, label: 'guard_crouch_hit（2P）' }); }
  if (seq === 'hit') { const l = A.meta.clips.stand_light, h = A.meta.clips.stand_heavy;
    T.push({ n: l.startup, a: ['stand_light', 0], b: ['idle', 0], d: () => 0.40, label: '立ち弱（1P）' }); T.push({ n: Math.max(fr(A.meta, 'stand_light') - l.startup, fr(B.meta, 'hurt_light')) + 4, a: ['stand_light', l.startup], b: ['hurt_light', 0], d: (f) => 0.40 + 0.085 * ease(f / 6), label: '弱被弾 hurt_light（2P）' });
    T.push({ n: h.startup, a: ['stand_heavy', 0], b: ['idle', 0], d: () => 0.50, label: '立ち強（1P）' }); T.push({ n: Math.max(fr(A.meta, 'stand_heavy') - h.startup, fr(B.meta, 'hurt_heavy')) + 4, a: ['stand_heavy', h.startup], b: ['hurt_heavy', 0], d: (f) => 0.50 + 0.085 * ease(f / 6), label: '強被弾 hurt_heavy（2P）' });
    T.push({ n: h.startup, a: ['stand_heavy', 0], b: ['idle', 0], d: () => 0.50, label: '立ち強（1P）' }); T.push({ n: fr(B.meta, 'ko') + 10, a: ['stand_heavy', h.startup], b: ['ko', 0], d: (f) => 0.50 + 0.25 * ease(f / 30), label: 'KO（2P）' }); }
  if (seq === 'throw') { const t = A.meta.clips.throw_reach; const c = t.startup + t.active;
    T.push({ n: c, a: ['throw_reach', 0], b: ['idle', 0], d: () => 0.34, label: '掴み throw_reach（1P）' }); T.push({ n: fr(A.meta, 'throw_hit') + 6, a: ['throw_hit', 0], b: ['thrown', 0], d: (f) => 0.34 + 0.30 * ease((f - 18) / 10), label: '投げ throw_hit（1P）／thrown（2P）' });
    T.push({ n: fr(B.meta, 'wakeup') + 6, a: ['idle', 0], b: ['wakeup', 0], d: () => 0.64, label: '起き上がり wakeup（2P）' }); }
  return T;
}
const SEQS = [['clinch', 'ギュイーン→組み合い→弾き'], ['roar', '咆哮ヒット'], ['roar_guard', '咆哮ガード'], ['guard', 'ガード被弾'], ['hit', '弱強被弾・KO'], ['throw', '掴み・投げ・起き上がり']];
async function get(id) { if (!S.cache[id]) { const [gltf, meta] = await Promise.all([new GLTFLoader().loadAsync(`../chars/${id}/${id}.glb`), fetch(`../chars/${id}/${id}_motions.json`).then(r => r.json())]); S.cache[id] = { gltf, meta }; } return S.cache[id]; }
async function setup() {
  for (const a of S.actors) scene.remove(a.holder); S.actors = [];
  for (const [i, id] of [S.a, S.b].entries()) { let { gltf, meta } = await get(id);
    if (i === 1 && S.a === S.b) { gltf = await new GLTFLoader().loadAsync(`../chars/${id}/${id}.glb`); }      // 同キャラ対面は別インスタンスで読む
    gltf.scene.traverse(o => { if (o.isSkinnedMesh) o.frustumCulled = false; }); const mixer = new THREE.AnimationMixer(gltf.scene); const actions = {}; gltf.animations.forEach(c => actions[c.name] = mixer.clipAction(c));
    const holder = new THREE.Group(), turn = new THREE.Group(); holder.add(turn); turn.add(gltf.scene); scene.add(holder); turn.rotation.y = i === 0 ? Math.PI / 2 : -Math.PI / 2; S.actors.push({ id, meta, mixer, actions, holder, cur: null }); }
  S.T = timeline(S.seq, S.actors[0], S.actors[1]); S.total = S.T.reduce((s, t) => s + t.n, 0); S.frame = 0; apply(); ui();
}
function pose(act, [clip, start], f) { const a = act.actions[clip] || act.actions.idle; if (act.cur !== a) { act.mixer.stopAllAction(); a.reset(); a.setLoop(THREE.LoopRepeat, Infinity); a.play(); act.cur = a; }
  const d = a.getClip().duration, loop = act.meta.clips[clip]?.loop; const t = (start + f) / 60; a.time = loop ? t % d : Math.min(t, d - 1e-4); act.mixer.update(0); }
function apply() { let f = Math.min(S.frame, S.total - 1e-3), seg = S.T[0]; for (const t of S.T) { if (f < t.n) { seg = t; break; } f -= t.n; seg = t; }
  const d = seg.d(f); S.actors[0].holder.position.x = -d / 2; S.actors[1].holder.position.x = d / 2; pose(S.actors[0], seg.a, f); pose(S.actors[1], seg.b, f); S.label = seg.label; S.dist = d; S.segf = f; }
function resize() { const c = $('c'); const w = c.clientWidth, h = c.clientHeight; if (c.width !== Math.floor(w * renderer.getPixelRatio()) || c.height !== Math.floor(h * renderer.getPixelRatio())) renderer.setSize(w, h, false);
  camera.aspect = w / h; const span = Q.get('span') ? +Q.get('span') : 2.0; const hf = 2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect); const dist = span / 2 / Math.tan(hf / 2);
  if (S.view === 'top') { camera.position.set(0, dist * 0.9, dist * 0.45); } else camera.position.set(0, 0.40 + dist * 0.03, dist); camera.lookAt(0, 0.36, 0); camera.updateProjectionMatrix(); }
function draw() { resize(); renderer.render(scene, camera); $('hud').textContent = `${S.a} vs ${S.b}  ${S.label}\nF ${Math.floor(S.frame)} / ${S.total}   間隔 ${S.dist.toFixed(2)}m`; }
const clock = new THREE.Clock();
function tick() { const dt = clock.getDelta(); if (!S.paused && S.T) { S.frame += dt * 60 * S.speed; if (S.frame >= S.total + 20) S.frame = 0; apply(); } if (S.T) draw(); if (!Q.has('manual')) requestAnimationFrame(tick); }
function ui() { for (const [id, k] of [['a', 'a'], ['b', 'b']]) { const s = $(id); s.replaceChildren(...CHARS.map(c => { const o = document.createElement('option'); o.value = o.textContent = c; o.selected = c === S[k]; return o; })); s.onchange = () => { S[k] = s.value; setup(); }; }
  $('seqs').replaceChildren(...SEQS.map(([k, l]) => { const b = document.createElement('button'); b.textContent = l; if (k === S.seq) b.className = 'on'; b.onclick = () => { S.seq = k; setup(); }; return b; })); }
$('pp').onclick = () => { S.paused = !S.paused; $('pp').textContent = S.paused ? '再生' : '一時停止'; }; $('slow').onclick = () => { S.speed = S.speed === 1 ? 0.25 : 1; $('slow').className = S.speed === 1 ? '' : 'on'; };
setup().then(() => { window.versus = { S, ready: true, setup: async (a, b, seq, view) => { S.a = a; S.b = b; S.seq = seq; if (view) S.view = view; await setup(); return S.total; }, setFrame: (f) => { S.frame = f; apply(); }, draw,
  paws: () => S.actors.map(a => { const o = {}; a.holder.updateMatrixWorld(true); a.holder.traverse(n => { if (['pawL', 'pawR', 'head', 'pelvis'].includes(n.name)) { const v = new THREE.Vector3(); n.getWorldPosition(v); o[n.name] = [v.x, v.y, v.z]; } }); return o; }) }; tick(); })
  .catch(e => { $('hud').textContent = String(e); window.versus = { error: String(e) }; });
