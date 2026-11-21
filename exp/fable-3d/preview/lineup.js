// 9体を同じ縮尺・同じ光で横に並べ、同じクリップを同時に再生して比べる。
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
const CHARS = ['moguzo', 'pisuke', 'godan', 'hakuma', 'chirka', 'takimaru', 'yomikage', 'bullet', 'dark_moguzo'];
const COMMON = ['idle', 'walk_f', 'walk_b', 'dash_f', 'crouch', 'jump_n', 'stand_light', 'stand_heavy', 'guard_stand', 'hurt_light'];
const Q = new URLSearchParams(location.search); const $ = (id) => document.getElementById(id); const SPACING = 0.78;
if (Q.has('bare')) { $('bar').style.display = 'none'; $('wrap').style.height = '100%'; }
const renderer = new THREE.WebGLRenderer({ canvas: $('c'), antialias: true, preserveDrawingBuffer: true }); renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x23262e);
scene.add(new THREE.HemisphereLight(0xe6ecff, 0x6a5a4c, 2.3)); const key = new THREE.DirectionalLight(0xfff2e0, 2.6); key.position.set(-1.2, 2.4, 2.0); scene.add(key);
const grid = new THREE.GridHelper(10, 100, 0x555b68, 0x343944); scene.add(grid);
const camera = new THREE.PerspectiveCamera(12, 1, 0.1, 100);
const S = { items: [], clip: 'idle', paused: false, speed: 1, view: 'side', time: 0 };

function place() { S.items.forEach((it, i) => { it.root.position.x = (i - (CHARS.length - 1) / 2) * SPACING; it.root.rotation.y = S.view === 'side' ? Math.PI / 2 : (S.view === 'front' ? 0 : Math.PI / 5); }); }
function play(name) {
  S.clip = name; S.time = 0;
  for (const it of S.items) { const n = name === 'unique' ? it.meta.unique_clips[0] : name; const a = it.actions[n]; it.mixer.stopAllAction(); if (!a) continue; const info = it.meta.clips[n];
    a.reset(); a.setLoop(info.loop ? THREE.LoopRepeat : THREE.LoopOnce, Infinity); a.clampWhenFinished = true; a.play(); it.cur = a; it.curName = n; it.mixer.update(0); }
  ui();
}
function setTime(t) { S.time = t; for (const it of S.items) if (it.cur) { const d = it.cur.getClip().duration; it.cur.paused = false; it.cur.time = it.meta.clips[it.curName].loop ? t % d : Math.min(t, d); it.mixer.update(0); } }
function resize() { const c = $('c'); const w = c.clientWidth, h = c.clientHeight; if (c.width !== Math.floor(w * renderer.getPixelRatio()) || c.height !== Math.floor(h * renderer.getPixelRatio())) { renderer.setSize(w, h, false); }
  camera.aspect = w / h; const span = CHARS.length * SPACING + 0.3; const hfov = 2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect); const dist = span / 2 / Math.tan(hfov / 2);
  camera.position.set(0, 0.42 + dist * 0.035, dist); camera.lookAt(0, 0.40, 0); camera.updateProjectionMatrix(); }
function draw() { resize(); renderer.render(scene, camera); $('hud').textContent = `${S.clip}  F ${Math.round(S.time * 60)}`; }
const clock = new THREE.Clock();
function tick() { const dt = clock.getDelta(); if (!S.paused) { S.time += dt * S.speed; for (const it of S.items) it.mixer.update(dt * S.speed);
    if (S.clip !== 'idle' && S.items.every(it => !it.cur || (!it.meta.clips[it.curName].loop && !it.cur.isRunning())) && S.time > 0.4) { if (!S.hold) S.hold = S.time; if (S.time - S.hold > 0.5) { S.hold = 0; play(S.clip); } } }
  draw(); if (!Q.has('manual')) requestAnimationFrame(tick); }
function btn(p, label, on, fn) { const b = document.createElement('button'); b.textContent = label; if (on) b.className = 'on'; b.onclick = fn; p.appendChild(b); }
function ui() {
  $('clips').replaceChildren(); COMMON.forEach(c => btn($('clips'), c, c === S.clip, () => play(c))); btn($('clips'), '★ 固有モーション', S.clip === 'unique', () => play('unique'));
  $('ctl').replaceChildren(); btn($('ctl'), S.paused ? '再生' : '一時停止', false, () => { S.paused = !S.paused; ui(); });
  [1, 0.25].forEach(v => btn($('ctl'), v === 1 ? '等速' : '×0.25', S.speed === v, () => { S.speed = v; ui(); }));
  [['side', '横（ゲーム視点）'], ['q', '斜め'], ['front', '正面']].forEach(([k, l]) => btn($('ctl'), l, S.view === k, () => { S.view = k; place(); ui(); }));
}
const loader = new GLTFLoader();
Promise.all(CHARS.map(async (id) => { const [gltf, meta] = await Promise.all([loader.loadAsync(`../chars/${id}/${id}.glb`), fetch(`../chars/${id}/${id}_motions.json`).then(r => r.json())]);
  gltf.scene.traverse(o => { if (o.isSkinnedMesh) o.frustumCulled = false; }); const mixer = new THREE.AnimationMixer(gltf.scene); const actions = {}; gltf.animations.forEach(c => actions[c.name] = mixer.clipAction(c));
  const root = new THREE.Group(); root.add(gltf.scene); scene.add(root); return { id, root, mixer, actions, meta }; }))
  .then((items) => { S.items = items; place(); $('names').replaceChildren(...items.map(it => { const s = document.createElement('span'); s.textContent = `${it.id}（全高 ${it.meta.height}）`; return s; }));
    play(Q.get('clip') || 'idle'); window.lineup = { S, play, setTime, draw, place, ready: true, maxFrames: (name) => Math.max(...items.map(it => it.meta.clips[name === 'unique' ? it.meta.unique_clips[0] : name].frames)) }; tick(); })
  .catch(e => { $('hud').textContent = String(e); window.lineup = { error: String(e) }; });
