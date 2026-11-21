// マモ拳 3D プレビュー。GLTFLoader で GLB を読み、AnimationMixer で再生する。
// ヘッドレス検証・キャプチャ用に window.mamo を公開している。
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { OutlineEffect } from 'three/addons/effects/OutlineEffect.js';

const CHARS = ['moguzo', 'pisuke', 'godan'];
const CLIPS = ['idle', 'walk_f', 'walk_b', 'dash_f', 'crouch', 'jump_n', 'stand_light', 'stand_heavy', 'guard_stand', 'hurt_light'];
const FPS = 60;
const Q = new URLSearchParams(location.search);
const $ = (id) => document.getElementById(id);
const BASE = Q.get('base') || '../chars';            // ?base=../_scratch/deform&flat=1 で確認用GLBを読む
const DIR = (id) => Q.has('flat') ? '' : id + '/';

if (Q.has('bare')) { $('panel').style.display = 'none'; $('app').style.gridTemplateColumns = '1fr'; $('app').style.gridTemplateRows = '1fr'; if (Q.has('nohud')) $('hud').style.display = 'none'; }
const canvas = $('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
const outline = new OutlineEffect(renderer, { defaultThickness: 0.0035, defaultColor: [0.12, 0.08, 0.05] });
const scene = new THREE.Scene();
const BG = new THREE.Color(0x23262e); scene.background = BG;
const camera = new THREE.PerspectiveCamera(24, 1, 0.05, 50);
const controls = new OrbitControls(camera, canvas); controls.enableDamping = false;
scene.add(new THREE.HemisphereLight(0xe6ecff, 0x6a5a4c, 2.3));
const key = new THREE.DirectionalLight(0xfff2e0, 2.6); key.position.set(-1.2, 2.4, 2.0); scene.add(key);
const rim = new THREE.DirectionalLight(0xbfd4ff, 1.0); rim.position.set(1.5, 1.2, -2.0); scene.add(rim);
const grid = new THREE.GridHelper(4, 40, 0x555b68, 0x343944); scene.add(grid);
const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.22, 32), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28, depthWrite: false }));
shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.001; scene.add(shadow);

const mover = new THREE.Group();   // 移動量（ルートモーション）を与える
const facer = new THREE.Group();   // 向き（ミラー・回転）
scene.add(mover); mover.add(facer);

const S = { id: null, gltf: null, mixer: null, actions: {}, cur: null, meta: null, paused: false, speed: 1, facing: 'right', cam: 'game',
            toon: false, wire: false, bones: false, root: false, autoReturn: true, fade: 0.1, helper: null, mats: [], cache: {}, skinned: [], height: 0.6, loopCount: 0 };

const gradient = (() => { const d = new Uint8Array([90, 90, 90, 255, 170, 170, 170, 255, 255, 255, 255, 255]); const t = new THREE.DataTexture(d, 3, 1, THREE.RGBAFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();

async function load(id) {
  if (!S.cache[id]) {
    const [gltf, meta] = await Promise.all([new GLTFLoader().loadAsync(`${BASE}/${DIR(id)}${id}.glb`), fetch(`${BASE}/${DIR(id)}${id}_motions.json`).then(r => r.json())]);
    S.cache[id] = { gltf, meta };
  }
  const { gltf, meta } = S.cache[id];
  facer.clear(); if (S.helper) { scene.remove(S.helper); S.helper = null; }
  S.id = id; S.gltf = gltf; S.meta = meta; S.height = meta.height; facer.add(gltf.scene);
  S.skinned = []; S.mats = [];
  gltf.scene.traverse(o => {
    if (o.isSkinnedMesh) { o.frustumCulled = false; S.skinned.push(o);
      if (!o.userData.std) { o.userData.std = o.material; const m = o.material;
        o.userData.toon = new THREE.MeshToonMaterial({ map: m.map, color: m.color, gradientMap: gradient, name: m.name });
        if (/eye/.test(m.name)) o.userData.toon.userData.outlineParameters = { visible: false }; } }
  });
  S.mixer = new THREE.AnimationMixer(gltf.scene); S.actions = {};
  for (const clip of gltf.animations) S.actions[clip.name] = S.mixer.clipAction(clip);
  S.mixer.addEventListener('finished', (e) => { if (S.autoReturn && S.cur && e.action === S.actions[S.cur] && S.actions.idle && S.cur !== 'idle') play('idle'); });
  S.cur = null; applyDisplay(); play(S.actions.idle ? 'idle' : gltf.animations[0].name, { fade: 0 }); setCamera(S.cam); buildUI(); return true;
}

function play(name, opt = {}) {
  const a = S.actions[name]; if (!a) return false;
  const fade = opt.fade ?? S.fade; const prev = S.cur ? S.actions[S.cur] : null; const info = S.meta.clips[name] || {};
  a.reset(); a.setLoop(info.loop ? THREE.LoopRepeat : THREE.LoopOnce, Infinity); a.clampWhenFinished = true; a.enabled = true; a.setEffectiveWeight(1); a.play();
  if (prev && prev !== a && fade > 0) a.crossFadeFrom(prev, fade, false); else if (prev && prev !== a) prev.stop();
  S.cur = name; S.loopCount = 0; mover.position.set(0, 0, 0); markUI(); return true;
}

function rootMotion() {
  mover.position.set(0, 0, 0); if (!S.root || !S.cur) return;
  const info = S.meta.clips[S.cur]; const a = S.actions[S.cur]; const f = a.time * FPS; const leg = S.meta.metrics.leg; const dir = S.facing === 'right' ? 1 : -1;
  let z = 0, y = 0;
  if (info.move_per_loop_leg) { const span = 0.9; const d = info.move_per_loop_leg * leg * (S.mixerLoops + a.time / a.getClip().duration); z = ((d % span) + span * 1.5) % span - span / 2; }
  if (info.move_total_leg) { const [f0, f1] = info.move_frames; const u = Math.min(1, Math.max(0, (f - f0) / (f1 - f0))); z = info.move_total_leg * leg * (u * (2 - u)) - (a.isRunning() || a.paused ? 0 : 0); }
  if (info.airborne) { const [f0, f1] = info.airborne; const u = (f - f0) / (f1 - f0); if (u > 0 && u < 1) y = info.jump_height_leg * leg * 4 * u * (1 - u); }
  mover.position.set(0, y, z * dir);
}

function applyDisplay() {
  for (const m of S.skinned) { m.material = S.toon ? m.userData.toon : m.userData.std; m.material.wireframe = S.wire; }
  if (S.bones && !S.helper && S.gltf) { S.helper = new THREE.SkeletonHelper(S.gltf.scene); scene.add(S.helper); }
  if (S.helper) S.helper.visible = S.bones;
  facer.rotation.set(0, 0, 0); facer.scale.set(1, 1, 1);
  if (S.facing === 'left') facer.scale.z = -1;            // ミラー（スプライト反転と同じ見え方）
  if (S.facing === 'left_rot') facer.rotation.y = Math.PI; // 回転（ミラーしない）
}

const CAMS = { game: [-1, 0.02, 0, 20], front: [0, 0.05, 1, 24], three_quarter: [-0.62, 0.22, 0.78, 24], back: [0, 0.05, -1, 24], side_l: [1, 0.02, 0, 20], back34: [0.62, 0.25, -0.78, 24], top: [-0.3, 1, 0.5, 24] };
function setCamera(name, opt = {}) {
  const c = CAMS[name] || CAMS.game; S.cam = name; const H = S.height; const span = (opt.span ?? 1.75) * H; camera.fov = c[3]; camera.updateProjectionMatrix();
  const dist = span / 2 / Math.tan(THREE.MathUtils.degToRad(c[3] / 2)); const t = new THREE.Vector3(0, (opt.centerY ?? 0.5) * H, opt.centerZ ?? 0);
  camera.position.copy(new THREE.Vector3(c[0], c[1], c[2]).normalize().multiplyScalar(dist).add(t)); controls.target.copy(t); controls.update(); markUI();
}

function resize() { const w = canvas.clientWidth, h = canvas.clientHeight; if (canvas.width !== Math.floor(w * renderer.getPixelRatio()) || canvas.height !== Math.floor(h * renderer.getPixelRatio())) { renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); } }
function draw() {
  resize(); rootMotion(); if (S.helper) S.helper.visible = S.bones;
  shadow.position.x = mover.position.x; shadow.position.z = mover.position.z; shadow.scale.setScalar(S.height / 0.6 * Math.max(0.5, 1 - mover.position.y));
  if (S.toon) outline.render(scene, camera); else renderer.render(scene, camera);
  const a = S.cur && S.actions[S.cur];
  if (a) { const d = a.getClip().duration; $('hud').textContent = `${S.id} / ${S.cur}\nF ${String(Math.round(a.time * FPS)).padStart(3)} / ${Math.round(d * FPS)}   ${a.time.toFixed(3)}s`; if (document.activeElement !== $('seek')) $('seek').value = d ? a.time / d : 0; }
}
S.mixerLoops = 0;
const clock = new THREE.Clock();
function tick() { const dt = clock.getDelta(); if (S.mixer && !S.paused) step(dt * S.speed); draw(); if (!Q.has('manual')) requestAnimationFrame(tick); }
function step(dt) { const a = S.cur && S.actions[S.cur]; const before = a ? a.time : 0; S.mixer.update(dt); if (a && a.time < before - 1e-6) S.mixerLoops++; }
function setTime(t) { const a = S.actions[S.cur]; if (!a) return; for (const k in S.actions) if (k !== S.cur) S.actions[k].stop(); a.paused = false; a.enabled = true; a.setEffectiveWeight(1); a.time = Math.max(0, Math.min(t, a.getClip().duration)); S.mixer.update(0); }
function stepFrame(n) { S.paused = true; const a = S.actions[S.cur]; setTime(Math.round(a.time * FPS + n) / FPS); markUI(); }

// ---- UI ----
function btn(parent, label, on, fn) { const b = document.createElement('button'); b.textContent = label; if (on) b.className = 'on'; b.onclick = fn; parent.appendChild(b); return b; }
function buildUI() {
  $('chars').replaceChildren(); CHARS.forEach(c => btn($('chars'), c, c === S.id, () => load(c)));
  $('clips').replaceChildren(); CLIPS.filter(c => S.actions[c]).forEach(c => btn($('clips'), c, c === S.cur, () => { S.paused = false; play(c); }));
  $('speeds').replaceChildren(); [1, 0.5, 0.25, 0.1].forEach(v => btn($('speeds'), v === 1 ? '等速' : `×${v}`, v === S.speed, () => { S.speed = v; buildUI(); }));
  $('facing').replaceChildren(); [['right', '右向き'], ['left', '左向き（ミラー）'], ['left_rot', '左向き（回転）']].forEach(([k, l]) => btn($('facing'), l, k === S.facing, () => { S.facing = k; applyDisplay(); buildUI(); }));
  $('cams').replaceChildren(); [['game', 'ゲーム視点'], ['front', '正面'], ['three_quarter', '斜め'], ['back', '背面'], ['side_l', '反対側'], ['top', '上から']].forEach(([k, l]) => btn($('cams'), l, k === S.cam, () => setCamera(k)));
  let tris = 0; S.skinned.forEach(m => tris += m.geometry.index.count / 3);
  $('info').textContent = `三角形 ${tris}\nボーン ${S.skinned[0]?.skeleton.bones.length}\nクリップ ${S.gltf.animations.length}\n全高(仮) ${S.height}`;
  $('bPlay').textContent = S.paused ? '再生' : '一時停止';
}
function markUI() { if (S.gltf) buildUI(); }
$('bPlay').onclick = () => { S.paused = !S.paused; buildUI(); };
$('bPrev').onclick = () => stepFrame(-1); $('bNext').onclick = () => stepFrame(1);
$('seek').oninput = (e) => { S.paused = true; setTime(e.target.value * S.actions[S.cur].getClip().duration); buildUI(); };
$('fade').oninput = (e) => { S.fade = +e.target.value; $('fadeV').textContent = S.fade.toFixed(2) + 's'; };
for (const [id, k] of [['oBones', 'bones'], ['oWire', 'wire'], ['oToon', 'toon'], ['oRoot', 'root'], ['oReturn', 'autoReturn']]) $(id).onchange = (e) => { S[k] = e.target.checked; applyDisplay(); };
$('oGrid').onchange = (e) => { grid.visible = e.target.checked; };
window.addEventListener('error', (e) => { $('err').textContent += e.message + '\n'; });

// ---- ヘッドレス検証・キャプチャ用 API ----
window.mamo = {
  S, THREE, load, play, setTime, setCamera, draw, step, cameraRef: () => camera,
  set(o) { Object.assign(S, o); applyDisplay(); if ('grid' in o) grid.visible = o.grid; if ('bg' in o) { scene.background = o.bg === null ? null : new THREE.Color(o.bg); } if ('shadow' in o) shadow.visible = o.shadow; },
  bones() { const out = {}; S.gltf.scene.updateMatrixWorld(true); S.skinned[0].skeleton.bones.forEach(b => { const v = new THREE.Vector3(); b.getWorldPosition(v); out[b.name] = [v.x, v.y, v.z]; }); return out; },
  clips() { return S.gltf.animations.map(c => ({ name: c.name, duration: c.duration, tracks: c.tracks.length })); },
  stats() { let tris = 0, verts = 0; S.skinned.forEach(m => { tris += m.geometry.index.count / 3; verts += m.geometry.attributes.position.count; }); return { tris, verts, meshes: S.skinned.length, bones: S.skinned[0].skeleton.bones.length, morphs: Object.keys(S.skinned[0].morphTargetDictionary || {}), calls: renderer.info.render.calls }; },
  morph(name) { const m = S.skinned[0]; return m.morphTargetInfluences[m.morphTargetDictionary[name]]; },
};
load(Q.get('char') || 'moguzo').then(() => { if (Q.get('clip')) play(Q.get('clip'), { fade: 0 }); window.mamo.ready = true; tick(); }).catch(e => { $('err').textContent = String(e); window.mamo.error = String(e); });
