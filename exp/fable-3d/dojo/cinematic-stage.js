export function buildCinematicStage(THREE, scene, st = {}) {
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
  if (st.mountains === false) mm.dispose();
  for (const c of st.clouds || []) { const cm = new THREE.MeshBasicMaterial({ color: c.color ?? 0xffffff, transparent: true, opacity: c.opacity ?? .16, depthWrite: false });       // 高さの手がかり（縦に追うカメラ用）
    for (let i = 0; i < (c.count ?? 8); i++) { const a = i / (c.count ?? 8) * 6.283 + r(), R = (c.radius ?? 2.2) * (.6 + r() * .8), m = new THREE.Mesh(new THREE.SphereGeometry(.5, 10, 8), cm); m.scale.set(.9 + r() * .9, .16 + r() * .1, .6 + r() * .6); m.position.set(Math.cos(a) * R + (c.x ?? 0), c.y + (r() - .5) * .5, Math.sin(a) * R * .8 - .4); g.add(m); } }
  if (st.moon) { const mo = new THREE.Mesh(new THREE.CircleGeometry(st.moon.r ?? 1.4, 48), new THREE.MeshBasicMaterial({ color: st.moon.color ?? 0xdfe8ff, fog: false })); mo.position.set(...st.moon.pos); mo.lookAt(0, 0.5, 0); g.add(mo); }      // 月（ムービー内だけの舞台装置）
  const pm = new THREE.MeshStandardMaterial({ color: st.post ?? 0x6b4a36, roughness: .9 });          // 近景の柱（カメラが動いたときの奥行きの手がかり）
  for (let i = 0; i < (st.posts ?? 10); i++) { const a = i / 10 * 6.283 + .3, m = new THREE.Mesh(new THREE.CylinderGeometry(.045, .055, .9, 8), pm); m.position.set(Math.cos(a) * 2.6, .45, Math.sin(a) * 2.6); g.add(m);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(.07, 10, 8), new THREE.MeshBasicMaterial({ color: st.accent ?? 0xffc878 })); cap.position.set(m.position.x, .93, m.position.z); g.add(cap); }
  return g;
}
