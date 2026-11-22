// Showtime v14 参照プレイヤーのページ本体。2つの使い方がある。
//  1) ムービー:  index.html?movie=moguzo&target=pisuke[&mirror=1][&bare=1][&t=1.2]
//  2) クリップ確認: index.html?clip=s1_v14&id=moguzo[&foe=pisuke&dist=0.5][&view=match|34|front|top][&base=1]
// 撮影スクリプトからは window.cine.seek(t) / window.cine.frame(n) を呼ぶ（描画まで同期で終える）。
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';
import { createCinePlayer } from './cine-player.js';
import { createFx } from './fx.js';

const Q = new URLSearchParams(location.search), $ = id => document.getElementById(id);
if (Q.get('bare')) document.body.classList.add('bare');
const canvas = $('c'), renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.setPixelRatio(+Q.get('dpr') || 1);
const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(40, 2, .02, 60); scene.add(camera);
const loader = new GLTFLoader(), V14 = new URL('../', import.meta.url).href, CHARS = new URL('../../../chars/', import.meta.url).href;

// ---- 舞台（参照用の簡易セット。ゲームの道場と同じ寸法感: 床・円・遠景の山） ----
function buildStage(st = {}) {
  const g = new THREE.Group(); scene.add(g);
  scene.background = new THREE.Color(st.backdrop ?? 0x1b2530); scene.fog = new THREE.Fog(st.fog ?? st.backdrop ?? 0x1b2530, st.fogNear ?? 5, st.fogFar ?? 16);
  const hemi = new THREE.HemisphereLight(st.sky ?? 0xdfeeff, st.ground ?? 0x4b3f38, st.ambient ?? 1.5); g.add(hemi);
  const key = new THREE.DirectionalLight(st.key ?? 0xffe6c4, st.keyPower ?? 2.6); key.position.set(-1.6, 3, 2.6); g.add(key);
  const rim = new THREE.DirectionalLight(st.rim ?? 0x88b4ff, st.rimPower ?? 1.6); rim.position.set(2.2, 1.6, -3); g.add(rim);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(14, 64), new THREE.MeshStandardMaterial({ color: st.floor ?? 0x4d5650, roughness: .96 })); floor.rotation.x = -Math.PI / 2; floor.position.y = -.002; g.add(floor);
  const line = (r, c, o) => { const m = new THREE.Mesh(new THREE.RingGeometry(r - .012, r + .012, 96), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o })); m.rotation.x = -Math.PI / 2; m.position.y = .001; g.add(m); };
  line(1.9, st.accent ?? 0xffc878, .55); line(1.2, 0xffffff, .12); line(3.2, 0xffffff, .08);
  const grid = new THREE.GridHelper(12, 48, 0x8a9088, 0x3d4640); grid.position.y = .0005; grid.material.transparent = true; grid.material.opacity = .35; g.add(grid);
  let s = 7; const r = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  const mm = new THREE.MeshStandardMaterial({ color: st.mountain ?? 0x39424b, roughness: 1, flatShading: true });
  for (let i = 0; i < (st.mountains === false ? 0 : 22); i++) { const a = i / 22 * 6.283 + r() * .2, R = 6.5 + r() * 3, h = 1.6 + r() * 2.6; const m = new THREE.Mesh(new THREE.ConeGeometry(h * (.5 + r() * .3), h, 5), mm); m.position.set(Math.cos(a) * R, h / 2 - .05, Math.sin(a) * R); m.rotation.y = r() * 6; g.add(m); }
  for (const c of st.clouds || []) { const cm = new THREE.MeshBasicMaterial({ color: c.color ?? 0xffffff, transparent: true, opacity: c.opacity ?? .16, depthWrite: false });       // 高さの手がかり（縦に追うカメラ用）
    for (let i = 0; i < (c.count ?? 8); i++) { const a = i / (c.count ?? 8) * 6.283 + r(), R = (c.radius ?? 2.2) * (.6 + r() * .8), m = new THREE.Mesh(new THREE.SphereGeometry(.5, 10, 8), cm); m.scale.set(.9 + r() * .9, .16 + r() * .1, .6 + r() * .6); m.position.set(Math.cos(a) * R + (c.x ?? 0), c.y + (r() - .5) * .5, Math.sin(a) * R * .8 - .4); g.add(m); } }
  if (st.moon) { const mo = new THREE.Mesh(new THREE.CircleGeometry(st.moon.r ?? 1.4, 48), new THREE.MeshBasicMaterial({ color: st.moon.color ?? 0xdfe8ff, fog: false })); mo.position.set(...st.moon.pos); mo.lookAt(0, 0.5, 0); g.add(mo); }      // 月（ムービー内だけの舞台装置）
  const pm = new THREE.MeshStandardMaterial({ color: st.post ?? 0x6b4a36, roughness: .9 });          // 近景の柱（カメラが動いたときの奥行きの手がかり）
  for (let i = 0; i < (st.posts ?? 10); i++) { const a = i / 10 * 6.283 + .3, m = new THREE.Mesh(new THREE.CylinderGeometry(.045, .055, .9, 8), pm); m.position.set(Math.cos(a) * 2.6, .45, Math.sin(a) * 2.6); g.add(m);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(.07, 10, 8), new THREE.MeshBasicMaterial({ color: st.accent ?? 0xffc878 })); cap.position.set(m.position.x, .93, m.position.z); g.add(cap); }
  return g;
}
async function loadActor(id, { v14 = true, illusion = null, share = null } = {}) {
  let gltf, meta;
  if (share) { gltf = { scene: cloneSkinned(share.scene), animations: share.animations }; meta = share.meta; }
  else { const u = v14 ? `${V14}${id}/${id}_v14` : `${CHARS}${id}/${id}`; [gltf, meta] = await Promise.all([loader.loadAsync(u + '.glb'), fetch(u + '_motions.json').then(r => r.json())]); }
  const root = new THREE.Group(); root.add(gltf.scene); scene.add(root); const mats = [];
  gltf.scene.traverse(o => { if (o.isSkinnedMesh) { o.frustumCulled = false; if (illusion) { o.material = (Array.isArray(o.material) ? o.material : [o.material]).map(m => { const c = m.clone(); c.transparent = true; c.opacity = illusion.opacity ?? .6; c.emissive = new THREE.Color(illusion.color ?? 0xb070ff); c.emissiveIntensity = illusion.glow ?? .55; c.depthWrite = true; return c; }); if (o.material.length === 1) o.material = o.material[0]; }
    mats.push(...(Array.isArray(o.material) ? o.material : [o.material])); } });
  const base = mats.map(m => m.opacity);
  return { id, root, scene: gltf.scene, animations: gltf.animations, meta, height: meta.height, mixer: new THREE.AnimationMixer(gltf.scene), clips: Object.fromEntries(gltf.animations.map(c => [c.name, c])),
    setOpacity(v) { mats.forEach((m, i) => { m.transparent = illusion || v < 1; m.opacity = base[i] * v; }); root.visible = v > .01; } };
}
function resize() { const w = +Q.get('w') || innerWidth, h = +Q.get('h') || innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();

const cine = window.cine = { ready: false, error: null };
try {
  if (Q.get('movie')) await movieMode(); else await clipMode();
  cine.ready = true;
} catch (e) { cine.error = String(e.stack || e); console.error(e); $('hud').textContent = cine.error; }

async function movieMode() {
  const id = Q.get('movie'), targetId = Q.get('target') || 'pisuke', mirror = !!+Q.get('mirror');
  const M = await fetch(`${V14}manifest/${id}_ultimate.json`).then(r => r.json()); cine.manifest = M;
  buildStage(M.stage); document.body.style.setProperty('--k', M.stage?.accentCss || '#ffc878');
  const actors = { attacker: await loadActor(id), target: await loadActor(targetId) };
  for (const [name, tr] of Object.entries(M.actorTracks)) if (tr.cloneOf) actors[name] = await loadActor(id, { share: actors[tr.cloneOf], illusion: tr.material === 'illusion' ? (M.stage?.illusion || {}) : null });
  const fx = createFx(THREE, scene, camera, M), cp = createCinePlayer(THREE, { scene, camera, manifest: M, actors, mirror, fx });
  const caps = M.cues.filter(c => c.type === 'caption');
  cine.duration = M.durationSeconds;
  cine.seek = (t) => { const r = cp.seek(t, { reducedMotion: !!+Q.get('reduced') }); const c = caps.find(c => t >= c.at && t < c.at + c.dur);
    $('cap').innerHTML = c ? `<span class="s">${c.sub || ''}</span><span class="t">${c.text}</span>` : ''; if (c) { const u = (t - c.at) / c.dur; $('cap').style.opacity = Math.min(1, u * 8, (1 - u) * 6); $('cap').style.transform = `scale(${1 + .25 * Math.max(0, 1 - u * 10)})`; }
    $('hud').textContent = `${id} → ${targetId}${mirror ? ' (mirror)' : ''}\n${t.toFixed(3)}s  ${r.shot}`; renderer.render(scene, camera); return r; };
  let t = +Q.get('t') || 0, playing = !Q.get('t') && !Q.get('bare'), last = performance.now(); cine.seek(t);
  $('seek').max = M.durationSeconds; $('play').onclick = () => { playing = !playing; last = performance.now(); };
  $('seek').oninput = e => { t = +e.target.value; playing = false; cine.seek(t); };
  const loop = (now) => { requestAnimationFrame(loop); if (!playing) return; t += (now - last) / 1000 * +$('rate').value; last = now; if (t > M.durationSeconds + .6) t = 0; cine.seek(Math.min(t, M.durationSeconds)); $('seek').value = t; $('time').textContent = t.toFixed(2); };
  requestAnimationFrame(loop);
}
async function clipMode() {
  // 対戦カメラ（dojo/camera-frame.js と同じ正投影・同じ仰角）で 1 クリップを見る。技の見た目の確認用。
  document.body.classList.add('nobars'); buildStage({ backdrop: 0x758993, fog: 0x758993, fogNear: 30, fogFar: 60, floor: 0x6e776a, ambient: 2.25, posts: 0 });
  const id = Q.get('id') || 'moguzo', v14 = !+Q.get('base'), a = await loadActor(id, { v14 }), foeId = Q.get('foe'), dist = +Q.get('dist') || .5;
  a.root.position.x = foeId ? -dist / 2 : 0; a.root.rotation.y = Math.PI / 2; let foe = null;
  if (foeId) { foe = await loadActor(foeId, { v14: false }); foe.root.position.x = dist / 2; foe.root.rotation.y = -Math.PI / 2; foe.mixer.clipAction(foe.clips.idle).play(); foe.mixer.update(0); }
  const view = Q.get('view') || 'match', H = a.height; let cam = camera;
  if (view === 'match') { const hw = +Q.get('hw') || 1.3, asp = camera.aspect; cam = new THREE.OrthographicCamera(-hw, hw, hw / asp, -hw / asp, .01, 30); cam.position.set(0, .5 + .70, 5.5); cam.lookAt(0, .5, 0); }
  else { const P = { '34': [1.25, .55, 1.45], front: [1.9, .4, 0], top: [.01, 2.4, .3], side: [0, .4, 2.0], back34: [-1.3, .6, 1.3] }[view] || [1.2, .5, 1.4]; camera.position.set(P[0] + a.root.position.x, P[1], P[2]); camera.lookAt(a.root.position.x + .1, H * .55, 0); camera.fov = 30; camera.updateProjectionMatrix(); }
  if (Q.get('anim')) { const extra = await loader.loadAsync(new URL(Q.get('anim'), V14).href); for (const c of extra.animations) a.clips[c.name] = c; }      // アニメ専用 GLB のクリップを、いま読んだモデルへ名前で結び付けて再生する
  let act = null, name = null;
  cine.bones = () => { const o = {}; a.scene.traverse(n => { if (n.isBone) { const v = new THREE.Vector3(); n.getWorldPosition(v); o[n.name] = [v.x, v.y, v.z]; } }); let w = null; a.scene.traverse(n => { if (n.isSkinnedMesh && n.morphTargetInfluences) w = [...n.morphTargetInfluences]; }); return { bones: o, weights: w }; };
  cine.clips = Object.keys(a.clips); cine.meta = a.meta;
  cine.frame = (n, clip = Q.get('clip') || 'idle') => { if (clip !== name) { if (act) act.stop(); act = a.mixer.clipAction(a.clips[clip]); act.setLoop(THREE.LoopOnce, 1); act.clampWhenFinished = true; act.play(); name = clip; }
    act.paused = true; act.time = Math.min(a.clips[clip].duration, n / 60); a.mixer.update(0); if (Q.get('dx')) a.root.position.x = (foeId ? -dist / 2 : 0) + (+Q.get('dx')) * Math.min(1, n / (+Q.get('dn') || 1));
    $('hud').textContent = `${id} ${clip} F${n}`; renderer.render(scene, cam); };
  cine.frame(+Q.get('f') || 0);
}
