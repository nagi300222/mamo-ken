// Showtime v14 参照プレイヤーの VFX。すべて「キューからの経過秒 age」の純関数で、巻き戻し・コマ送りしても同じ絵になる。
// キューの key と params の意味は MANIFEST_SPEC.md の「VFX 語彙」。ゲーム側は同じ key を自前の表現へ対応づければよい。
export function createFx(THREE, scene, camera, manifest) {
  const group = new THREE.Group(); scene.add(group);
  const overlay = new THREE.Group(); camera.add(overlay);          // 画面に貼るもの（フラッシュ・集中線）
  const rnd = (seed) => { let s = seed * 9301 + 49297; return () => ((s = (s * 9301 + 49297) % 233280) / 233280); };
  const V = THREE.Vector3, col = (c, d) => new THREE.Color(c ?? d);
  const add = (geo, mat, parent = group) => { const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; parent.add(m); return m; };
  const basic = (color, o = {}) => new THREE.MeshBasicMaterial({ color, transparent: true, depthWrite: false, ...o });
  const lit = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: .95, flatShading: true, ...o });
  const out3 = u => 1 - (1 - u) ** 3, clamp01 = u => Math.max(0, Math.min(1, u));
  const P = (ctx, c) => ctx.anchorPos({ anchor: c.anchor || 'stage', offset: c.offset || [0, 0, 0] }, new V());
  const sx = (ctx) => (ctx.mirror ? -1 : 1);

  const BUILD = {
    // 地面を走る亀裂: from→to へ dur 秒で伸び、hold 秒残って消える
    ground_crack(c, ctx) {
      const r = rnd(c.at * 100 + 3), a = new V(sx(ctx) * c.from[0], .004, sx(ctx) * c.from[1]), b = new V(sx(ctx) * c.to[0], .004, sx(ctx) * c.to[1]);
      const n = 14, pts = [], w = c.width ?? .05, dir = b.clone().sub(a).normalize(), side = new V(-dir.z, 0, dir.x);
      for (let i = 0; i <= n; i++) { const p = a.clone().lerp(b, i / n).addScaledVector(side, (i === 0 || i === n ? 0 : (r() - .5) * w * 3.2)); pts.push(p); }
      const mk = (wd, y) => { const pos = []; for (let i = 0; i <= n; i++) { const t = Math.sin(Math.PI * Math.min(1, i / n * 1.15)) * .7 + .3; pos.push(...pts[i].clone().addScaledVector(side, wd * t).setY(y).toArray(), ...pts[i].clone().addScaledVector(side, -wd * t).setY(y).toArray()); }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); const idx = []; for (let i = 0; i < n; i++) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2); g.setIndex(idx); return g; };
      const dark = add(mk(w, .004), basic(0x1a120c, { side: THREE.DoubleSide })), glow = add(mk(w * .42, .006), basic(col(c.color, 0xffb45a), { side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
      const dur = c.dur ?? .35, hold = c.hold ?? 1.2;
      return { objs: [dark, glow], life: dur + hold, update(age) { const k = Math.floor(clamp01(age / dur) * n) * 6; dark.geometry.setDrawRange(0, k); glow.geometry.setDrawRange(0, k);
        const f = clamp01((dur + hold - age) / .3); dark.material.opacity = .9 * f; glow.material.opacity = f * (.55 + .45 * Math.sin(age * 30)); } };
    },
    // 地面から突き出す岩: count 本が中心から外へ順に生える
    rock_spikes(c, ctx) {
      const r = rnd(c.at * 77 + 1), p0 = P(ctx, c), n = c.count ?? 5, objs = [], H = c.height ?? .5, R = c.radius ?? .18, mat = lit(col(c.color, 0x8a7458));
      const line = c.line ? new V(sx(ctx) * c.line[0], 0, sx(ctx) * c.line[1]) : null;
      for (let i = 0; i < n; i++) { const h = H * (.55 + .6 * r()) * (i === 0 ? 1.25 : 1), g = new THREE.ConeGeometry(h * .2, h, 5, 1); g.translate(0, h / 2, 0); const m = add(g, mat);
        const ang = r() * 6.28, rad = i === 0 ? 0 : R * (.4 + r() * .8); if (line) m.position.copy(p0).addScaledVector(line, i / Math.max(1, n - 1)).add(new V((r() - .5) * R, 0, (r() - .5) * R)); else m.position.set(p0.x + Math.cos(ang) * rad, 0, p0.z + Math.sin(ang) * rad);
        m.position.y = 0; m.rotation.set((r() - .5) * .5, r() * 6, (r() - .5) * .5); m.userData.d = (line ? i / n * (c.stagger ?? .25) : i * .025); objs.push(m); }
      const hold = c.hold ?? .9;
      return { objs, life: hold + .5, update(age) { for (const m of objs) { const a = age - m.userData.d; const up = a < 0 ? 0 : EASEBACK(clamp01(a / .14)); const dn = clamp01((age - hold) / .45); m.scale.set(1, Math.max(.001, up * (1 - dn)), 1); m.visible = a >= 0; } } };
    },
    // 広がる輪: plane='ground'（地面）| 'camera'（カメラ正対）
    shock_ring(c, ctx) {
      const p = P(ctx, c), g = new THREE.RingGeometry(.82, 1, 48), m = add(g, basic(col(c.color, 0xfff2c8), { side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
      m.position.copy(p); if ((c.plane || 'ground') === 'ground') { m.rotation.x = -Math.PI / 2; m.position.y = Math.max(.008, p.y); }
      const dur = c.dur ?? .5, R = c.radius ?? 1.2;
      return { objs: [m], life: dur, update(age) { const u = age / dur; m.scale.setScalar(.05 + R * out3(u)); m.material.opacity = (1 - u) ** 1.5 * (c.opacity ?? .9); if (c.plane === 'camera') m.quaternion.copy(camera.quaternion); } };
    },
    // 打撃の火花: 放射状のトゲ＋光の玉（カメラ正対）
    impact_burst(c, ctx) {
      const p = P(ctx, c), r = rnd(c.at * 31 + 9), n = c.rays ?? 12, S = c.size ?? .5, pos = [];
      for (let i = 0; i < n; i++) { const a = i / n * 6.283 + r() * .3, l = S * (.55 + r() * .6), w = .05 * S; pos.push(Math.cos(a - w) * .12 * S, Math.sin(a - w) * .12 * S, 0, Math.cos(a + w) * .12 * S, Math.sin(a + w) * .12 * S, 0, Math.cos(a) * l, Math.sin(a) * l, 0); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      const star = add(g, basic(col(c.color, 0xfff6d8), { side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthTest: false })), core = add(new THREE.SphereGeometry(.07 * S, 16, 12), basic(0xffffff, { blending: THREE.AdditiveBlending, depthTest: false }));
      star.position.copy(p); core.position.copy(p); star.renderOrder = core.renderOrder = 20; const dur = c.dur ?? .28;
      return { objs: [star, core], life: dur, update(age) { const u = age / dur; star.quaternion.copy(camera.quaternion); star.rotateZ(c.at * 3); star.scale.setScalar(.35 + 1.25 * out3(u)); star.material.opacity = (1 - u) ** 1.2; core.scale.setScalar(1 + 1.6 * out3(u)); core.material.opacity = .8 * (1 - u) ** 2; } };
    },
    // 土煙: 丸い塊が広がって薄れる
    dust(c, ctx) {
      const p = P(ctx, c), r = rnd(c.at * 53 + 5), n = c.count ?? 9, objs = [], S = c.spread ?? .45, mat0 = col(c.color, 0xcbb89a);
      for (let i = 0; i < n; i++) { const m = add(new THREE.IcosahedronGeometry(.022 + r() * .028, 1), basic(mat0, { opacity: .4 })); const a = r() * 6.283; m.userData = { v: new V(Math.cos(a) * S * (.4 + r()), .04 + r() * (c.rise ?? .22), Math.sin(a) * S * (.4 + r()) * .8), s: .8 + r() * 1.2 }; objs.push(m); }
      const dur = c.dur ?? .9;
      return { objs, life: dur, update(age) { const u = age / dur, e = out3(u); for (const m of objs) { m.position.copy(p).addScaledVector(m.userData.v, e); m.position.y = Math.max(.03, p.y * (1 - e) + m.userData.v.y * e); m.scale.setScalar(m.userData.s * (.6 + 1.9 * e) * (c.size ?? 1)); m.material.opacity = .42 * (1 - u) ** 1.3; } } };
    },
    // 飛び散る破片（放物線）
    debris(c, ctx) {
      const p = P(ctx, c), r = rnd(c.at * 91 + 2), n = c.count ?? 14, objs = [], pw = c.power ?? 1.6, mat = lit(col(c.color, 0x7b684f));
      for (let i = 0; i < n; i++) { const s = (.02 + r() * .045) * (c.size ?? 1), m = add(new THREE.DodecahedronGeometry(s, 0), mat); const a = r() * 6.283, sp = pw * (.35 + r() * .8); m.userData = { v: new V(Math.cos(a) * sp * .6, sp * (.8 + r() * .8), Math.sin(a) * sp * .5), w: new V(r() * 9, r() * 9, r() * 9) }; objs.push(m); }
      const dur = c.dur ?? 1.2, G = 5.5;
      return { objs, life: dur, update(age) { for (const m of objs) { const v = m.userData.v; let y = p.y + v.y * age - .5 * G * age * age; const hit = y < .02; if (hit) y = .02; m.position.set(p.x + v.x * age * (hit ? .8 : 1), y, p.z + v.z * age * (hit ? .8 : 1)); m.rotation.set(m.userData.w.x * age, m.userData.w.y * age, m.userData.w.z * age); m.scale.setScalar(clamp01((dur - age) / .25)); } } };
    },
    // 浮き上がる巨岩 → fallAt で落下
    boulders(c, ctx) {
      const p = P(ctx, c), r = rnd(c.at * 13 + 4), n = c.count ?? 6, objs = [], mat = lit(col(c.color, 0x6f6257));
      for (let i = 0; i < n; i++) { const s = (.07 + r() * .12) * (c.size ?? 1), m = add(new THREE.DodecahedronGeometry(s, 0), mat); const a = i / n * 6.283 + r(), rad = (c.radius ?? .9) * (.45 + r() * .7); m.userData = { x: p.x + Math.cos(a) * rad, z: p.z + Math.sin(a) * rad * .7 - .15, h: (c.height ?? .9) * (.45 + r() * .8), d: r() * .25, w: r() * 3 + 1, s }; objs.push(m); }
      const rise = c.rise ?? .6, fallAt = c.fallAt ?? 1.6, dur = fallAt + .8;
      return { objs, life: dur, update(age) { for (const m of objs) { const d = m.userData, a = age - d.d; let y; if (age < fallAt) y = d.h * out3(clamp01(a / rise)) + Math.sin(age * d.w) * .015; else { const f = age - fallAt; y = Math.max(d.s * .5, d.h - 6 * f * f); }
        m.visible = a > 0; m.position.set(d.x, y, d.z); m.rotation.set(age * d.w * .5, age * d.w * .3, 0); m.scale.setScalar(clamp01((dur - age) / .2)); } } };
    },
    // 役者を包む気の柱（溜め）
    aura(c, ctx) {
      const g = new THREE.CylinderGeometry(.16, .24, 1, 20, 1, true); g.translate(0, .5, 0); const m = add(g, basic(col(c.color, 0xffc878), { side: THREE.DoubleSide, blending: THREE.AdditiveBlending })); const dur = c.dur ?? .6;
      return { objs: [m], life: dur, update(age, ctx2) { const p = P(ctx2, c); m.position.set(p.x, 0, p.z); const u = age / dur; m.scale.set((c.radius ?? 1) * (1 + .25 * Math.sin(age * 40)), (c.height ?? 1) * (.3 + out3(u)), (c.radius ?? 1) * (1 + .25 * Math.sin(age * 40))); m.material.opacity = (c.opacity ?? .28) * Math.sin(Math.PI * clamp01(u)); m.rotation.y = age * 6; } };
    },
    // 爪・拳の軌跡（三日月）: 役者位置に、カメラ正対の弧
    slash_arc(c, ctx) {
      const p = P(ctx, c), g = new THREE.RingGeometry(.78, 1, 40, 1, 0, Math.PI * (c.arc ?? 1.1)), m = add(g, basic(col(c.color, 0xf1c8ff), { side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthTest: false }));
      m.position.copy(p); m.renderOrder = 19; const dur = c.dur ?? .26, S = c.size ?? .5;
      return { objs: [m], life: dur, update(age) { const u = age / dur; m.quaternion.copy(camera.quaternion); m.rotateZ(THREE.MathUtils.degToRad(c.angle ?? 30) + out3(u) * (c.sweep ?? 1.2)); m.scale.setScalar(S * (.8 + .5 * out3(u))); m.material.opacity = (1 - u) ** 1.3; } };
    },
    // 煙になって消える（分身の消滅）
    puff(c, ctx) {
      const r = rnd(c.at * 17 + 8), n = c.count ?? 10, objs = [], color = col(c.color, 0xd9a6ff);
      for (let i = 0; i < n; i++) { const m = add(new THREE.IcosahedronGeometry(.03 + r() * .03, 1), basic(color, { blending: THREE.AdditiveBlending })); m.userData = { o: new V((r() - .5) * .22, .1 + r() * .45, (r() - .5) * .22), v: new V((r() - .5) * .5, .2 + r() * .4, (r() - .5) * .5) }; objs.push(m); }
      const dur = c.dur ?? .5; let p0 = null;
      return { objs, life: dur, update(age, ctx2) { if (!p0) p0 = P(ctx2, c); const u = age / dur; for (const m of objs) { m.position.copy(p0).add(m.userData.o).addScaledVector(m.userData.v, out3(u)); m.scale.setScalar(.6 + 2.0 * u); m.material.opacity = .6 * (1 - u) ** 1.5; } } };
    },
    // 岩壁: breakAt 秒までは立っていて、その瞬間に +X 側へ砕け散る（相手の背後の岩ごと壊す演出）
    rock_wall(c, ctx) {
      const r = rnd(c.at * 7 + 21), p0 = P(ctx, c), W = c.width ?? 1.6, H = c.height ?? 1.5, D = c.depth ?? 0.5, nx = 2, ny = 5, nz = 6, objs = [], mat = lit(col(c.color, 0x6a5f58)), dark = lit(0x4a423e);
      for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) for (let k2 = 0; k2 < nz; k2++) {
        const taper = 1 - .45 * (j / ny) ** 1.5, sy = H / ny, sz = W / nz * taper, sxz = D / nx; if (r() < .12 * j / ny) continue;
        const g = new THREE.DodecahedronGeometry(.62, 0); g.scale(sxz * 1.25, sy * 1.2, sz * 1.25); const m = add(g, r() < .3 ? dark : mat);
        const home = new V(p0.x + sx(ctx) * (i - .5) * sxz, sy * (j + .5), p0.z + (k2 - nz / 2 + .5) * sz + (r() - .5) * .04); m.rotation.set(r() * .5, r() * 6, r() * .5);
        m.userData = { home, rx: m.rotation.x, rz: m.rotation.z, v: new V(sx(ctx) * (1.2 + r() * 3.2) * (c.power ?? 1), .6 + r() * 3.0, (r() - .5) * 3.4), w: new V(r() * 8 - 4, r() * 8 - 4, r() * 8 - 4), d: Math.hypot(home.y - (c.hitHeight ?? .45), home.z - p0.z) * .05 }; objs.push(m); }
      const br = c.breakAt ?? 1e9, life = (c.life ?? 12), G = 6.5;
      return { objs, life, update(age) { for (const m of objs) { const u = m.userData, a = age - br - u.d; if (a <= 0) { const q = age > br - (c.crackLead ?? 0) ? Math.sin(age * 90 + u.home.y * 9) * .006 : 0; m.position.set(u.home.x + q, u.home.y, u.home.z); m.rotation.x = u.rx; m.rotation.z = u.rz; m.scale.setScalar(1); m.visible = true; continue; }
        let y = u.home.y + u.v.y * a - .5 * G * a * a; const fl = y < .05; if (fl) y = .05; const k = fl ? .55 : 1; m.position.set(u.home.x + u.v.x * a * k, y, u.home.z + u.v.z * a * k); const spinTime = Math.min(a, (u.v.y + Math.sqrt(u.v.y ** 2 + 2 * G * Math.max(0, u.home.y - .05))) / G); m.rotation.x = u.rx + u.w.x * spinTime; m.rotation.z = u.rz + u.w.z * spinTime; m.scale.setScalar(Math.max(.25, 1 - a * .18)); } } };
    },
    // 空間に残る三本の爪痕。hold 秒残り、convergeTo があれば最後にそこへ吸い込まれる
    claw_mark(c, ctx) {
      const p = P(ctx, c), S = c.size ?? .45, objs = [], color = col(c.color, 0xb04cff);
      for (let i = -1; i <= 1; i++) { const pts = []; for (let k2 = 0; k2 <= 14; k2++) { const u = k2 / 14, w = Math.sin(Math.PI * u) * .035 * S * (i === 0 ? 1.25 : 1), x = (u - .5) * S * 1.5, y = Math.sin(u * 2.4 - .6) * .22 * S + i * .13 * S; pts.push(x, y + w, 0, x, y - w, 0); }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); const idx = []; for (let k2 = 0; k2 < 14; k2++) idx.push(k2 * 2, k2 * 2 + 1, k2 * 2 + 2, k2 * 2 + 1, k2 * 2 + 3, k2 * 2 + 2); g.setIndex(idx);
        const glow = add(g, basic(color, { side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthTest: false })), core = add(g.clone(), basic(0x2a0840, { side: THREE.DoubleSide, depthTest: false })); glow.renderOrder = 18; core.renderOrder = 17; core.scale.setScalar(1.25); objs.push(glow, core); }
      const dur = c.dur ?? .12, hold = c.hold ?? 2, cv = c.convergeAt != null ? c.convergeAt - c.at : null, life = cv != null ? cv + .3 : dur + hold; const tgt = new V();
      return { objs, life, update(age, ctx2) { const grow = clamp01(age / dur), fade = clamp01((life - age) / .25); let pos = p, sc = 1;
        if (cv != null && age > cv) { const u = clamp01((age - cv) / .28); ctx2.anchorPos({ anchor: c.convergeTo, offset: [0, 0, 0] }, tgt); pos = p.clone().lerp(tgt, u * u); sc = 1 - .7 * u; }
        objs.forEach((m, i) => { m.position.copy(pos); m.quaternion.copy(camera.quaternion); m.rotateZ(THREE.MathUtils.degToRad(c.angle ?? -35)); const base = i % 2 ? 1.25 : 1; m.scale.set(base * sc * (.2 + .8 * out3(grow)), base * sc, 1); m.geometry.setDrawRange(0, Math.floor(grow * 14) * 6);
          m.material.opacity = (i % 2 ? .55 : .75 + .25 * Math.sin(age * 22 + i)) * fade; }); } };
    },
    // 毒の霧: 役者のまわりに紫の泡が湧き続ける
    poison_mist(c, ctx) {
      const r = rnd(c.at * 19 + 3), n = c.count ?? 16, objs = [], color = col(c.color, 0x9a3cff);
      for (let i = 0; i < n; i++) { const m = add(new THREE.IcosahedronGeometry(.02 + r() * .03, 1), basic(color, { blending: THREE.AdditiveBlending })); m.userData = { a: r() * 6.283, rad: .1 + r() * (c.radius ?? .32), ph: r(), sp: .5 + r() * .8, h: .25 + r() * .5 }; objs.push(m); }
      const dur = c.dur ?? 2; const p = new V();
      return { objs, life: dur, update(age, ctx2) { ctx2.anchorPos({ anchor: c.anchor || 'stage', offset: c.offset || [0, 0, 0] }, p); const env = Math.min(1, age * 3, (dur - age) * 3); for (const m of objs) { const d = m.userData, u = (age * d.sp + d.ph) % 1; m.position.set(p.x + Math.cos(d.a + age * .8) * d.rad, p.y - .25 + u * d.h * 1.6, p.z + Math.sin(d.a + age * .8) * d.rad); m.scale.setScalar(.6 + 1.8 * u); m.material.opacity = .5 * env * Math.sin(Math.PI * u); } } };
    },
    // 地面から空へ抜ける気の柱（打ち上げの頂点）
    energy_pillar(c, ctx) {
      const p = P(ctx, c), H = c.height ?? 7, g = new THREE.CylinderGeometry(1, 1, 1, 24, 1, true); g.translate(0, .5, 0);
      const a = add(g, basic(col(c.color, 0xffc060), { side: THREE.DoubleSide, blending: THREE.AdditiveBlending })), b = add(g.clone(), basic(0xffffff, { side: THREE.DoubleSide, blending: THREE.AdditiveBlending })); const dur = c.dur ?? 1.2, R = c.radius ?? .5;
      return { objs: [a, b], life: dur, update(age) { const u = age / dur, grow = out3(clamp01(age / .18)), k = Math.sin(Math.PI * clamp01(u)) ** .5; for (const [m, rr, o] of [[a, R, .42], [b, R * .35, .7]]) { m.position.set(p.x, 0, p.z); m.scale.set(rr * (1 + .12 * Math.sin(age * 50)) * (1.4 - .4 * grow), H * grow, rr * (1 + .12 * Math.sin(age * 50)) * (1.4 - .4 * grow)); m.material.opacity = o * k; m.rotation.y = age * 5; } } };
    },
    // 爆ぜる光の粒（上向きに噴き上がる。打ち上げ・頂点用）
    sparks(c, ctx) {
      const p = P(ctx, c), r = rnd(c.at * 23 + 11), n = c.count ?? 24, objs = [], color = col(c.color, 0xffd080);
      for (let i = 0; i < n; i++) { const m = add(new THREE.OctahedronGeometry(.006 + r() * .009, 0), basic(color, { blending: THREE.AdditiveBlending })); const a = r() * 6.283, sp = (c.power ?? 1.5) * (.4 + r()); m.userData = { v: new V(Math.cos(a) * sp * .7, (c.up ?? .6) * sp + r() * .5, Math.sin(a) * sp * .7) }; objs.push(m); }
      const dur = c.dur ?? .7;
      return { objs, life: dur, update(age) { const u = age / dur; for (const m of objs) { m.position.copy(p).addScaledVector(m.userData.v, age).setY(p.y + m.userData.v.y * age - 2.2 * age * age); m.scale.setScalar((c.size ?? 1) * (1 + 1.2 * (1 - u))); m.material.opacity = (1 - u) ** 1.2; } } };
    },
    // 残像の筋: from→to を結ぶ帯（高速移動の軌跡）。カメラに正対し、dur 秒で細く消える
    streak(c, ctx) {
      const a = new V(sx(ctx) * c.from[0], c.from[1], sx(ctx) * c.from[2]), b = new V(sx(ctx) * c.to[0], c.to[1], sx(ctx) * c.to[2]);
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(18), 3));
      const m = add(g, basic(col(c.color, 0x9fe6ff), { side: THREE.DoubleSide, blending: THREE.AdditiveBlending })), dur = c.dur ?? .5, grow = c.grow ?? .12, W = c.width ?? .05, side = new V(), dir = b.clone().sub(a).normalize(), eye = new V();
      return { objs: [m], life: dur, update(age) { const head = a.clone().lerp(b, clamp01(age / grow)), w = W * (1 - age / dur) ** .7; camera.getWorldPosition(eye); side.crossVectors(dir, eye.sub(head)).normalize().multiplyScalar(w);
        const P2 = m.geometry.attributes.position.array, put = (i, v) => { P2[i * 3] = v.x; P2[i * 3 + 1] = v.y; P2[i * 3 + 2] = v.z; };
        put(0, a); put(1, head.clone().add(side)); put(2, head.clone().sub(side)); put(3, a); put(4, head.clone().sub(side)); put(5, head.clone().add(side)); m.geometry.attributes.position.needsUpdate = true; m.material.opacity = (c.opacity ?? .8) * (1 - age / dur); } };
    },
    // 降る雪: カメラのまわりの箱の中を落ち続ける（舞台装置。dur 秒）
    snowfall(c) {
      const r = rnd(c.at * 3 + 77), n = c.count ?? 220, pos = new Float32Array(n * 3), seed = []; for (let i = 0; i < n; i++) seed.push([r() * 6 - 3, r() * 3.5, r() * 6 - 3, .25 + r() * .35, r() * 6.28]);
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); const m = new THREE.Points(g, new THREE.PointsMaterial({ color: col(c.color, 0xffffff), size: c.size ?? .022, transparent: true, opacity: .85, depthWrite: false })); m.frustumCulled = false; group.add(m);
      const dur = c.dur ?? 10, eye = new V();
      return { objs: [m], life: dur, update(age) { camera.getWorldPosition(eye); for (let i = 0; i < n; i++) { const s2 = seed[i], wrap = (v, c0, span) => c0 + ((((v - c0) % span) + span * 1.5) % span) - span / 2;
        pos[i * 3] = wrap(s2[0] + Math.sin(age * .7 + s2[4]) * .12 + age * (c.wind ?? .25), eye.x, 6); pos[i * 3 + 1] = (((s2[1] - age * s2[3]) % 3.5) + 3.5) % 3.5; pos[i * 3 + 2] = wrap(s2[2], eye.z, 6); } g.attributes.position.needsUpdate = true; } };
    },
    // 黒い一閃: 黒い三日月の帯と白い芯。grow 秒で走り、hold 秒残る（カメラ正対）
    ink_slash(c, ctx) {
      const p = P(ctx, c), S = c.size ?? 1.2, n = 20, mk = (w) => { const pts = []; for (let i = 0; i <= n; i++) { const u = i / n, x = (u - .5) * S * 2, y = Math.sin(Math.PI * u) * (c.bow ?? .18) * S, t = Math.sin(Math.PI * u) ** .7 * w * S; pts.push(x, y + t, 0, x, y - t, 0); }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); const idx = []; for (let i = 0; i < n; i++) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2); g.setIndex(idx); return g; };
      const dark = add(mk(.085), basic(col(c.color, 0x05030a), { side: THREE.DoubleSide, depthTest: false })), core = add(mk(.012), basic(col(c.core, 0xffffff), { side: THREE.DoubleSide, depthTest: false })); dark.renderOrder = 30; core.renderOrder = 31;
      const grow = c.grow ?? .06, hold = c.hold ?? .6, life = grow + hold;
      return { objs: [dark, core], life, update(age) { const g = clamp01(age / grow), f = clamp01((life - age) / .25); for (const m of [dark, core]) { m.position.copy(p); m.quaternion.copy(camera.quaternion); m.rotateZ(THREE.MathUtils.degToRad(c.angle ?? 0)); m.geometry.setDrawRange(0, Math.floor(g * n) * 6); }
        dark.material.opacity = .95 * f; core.material.opacity = f; dark.scale.set(1, 1 + .6 * (1 - f), 1); } };
    },
    // 木の実: from から to へ放物線で飛び、stick 秒そこに残って点滅する（爆発は別キュー）
    nut(c, ctx) {
      const a = new V(sx(ctx) * c.from[0], c.from[1], sx(ctx) * c.from[2]), m = add(new THREE.SphereGeometry(c.size ?? .035, 12, 10), lit(col(c.color, 0x8a5a2a))), glow = add(new THREE.SphereGeometry((c.size ?? .035) * 1.5, 10, 8), basic(0xff7a20, { blending: THREE.AdditiveBlending }));
      const fly = c.fly ?? 1, stick = c.stick ?? 1, b = new V();
      return { objs: [m, glow], life: fly + stick, update(age, ctx2) { ctx2.anchorPos({ anchor: c.toAnchor || 'stage', offset: c.to || [0, 0, 0] }, b); const u = clamp01(age / fly); m.position.lerpVectors(a, b, u); m.position.y += Math.sin(Math.PI * u) * (c.arc ?? .5); m.rotation.set(age * 9, age * 7, 0); glow.position.copy(m.position);
        const blink = age > fly ? (Math.sin((age - fly) ** 1.6 * 40) > 0 ? 1 : .15) : .25; glow.material.opacity = .7 * blink; glow.scale.setScalar(1 + (age > fly ? .6 * blink : 0)); } };
    },
    // 爆発: 火の玉・煙・破片
    explosion(c, ctx) {
      const p = P(ctx, c), r = rnd(c.at * 29 + 17), S = c.size ?? 1, objs = [], n = c.count ?? 16;
      for (let i = 0; i < n; i++) { const fire = i < n * .6, m = add(new THREE.IcosahedronGeometry(.10 + r() * .10, 1), basic(fire ? [0xffe08a, 0xffa030, 0xff5a18][i % 3] : 0x2a2420, fire ? { blending: THREE.AdditiveBlending } : { opacity: .7 }));
        const a = r() * 6.283, e = r() * 1.2 - .1; m.userData = { v: new V(Math.cos(a) * Math.cos(e), Math.abs(Math.sin(e)) + .2, Math.sin(a) * Math.cos(e)).multiplyScalar((.5 + r()) * S * (fire ? 1 : 1.4)), fire, d: fire ? 0 : .08 + r() * .15 }; objs.push(m); }
      const core = add(new THREE.SphereGeometry(.3 * S, 16, 12), basic(0xffffff, { blending: THREE.AdditiveBlending })); objs.push(core); const dur = c.dur ?? 1.3;
      return { objs, life: dur, update(age) { const u = age / dur; core.position.copy(p); core.scale.setScalar(.3 + 3.2 * out3(clamp01(age / .25))); core.material.opacity = Math.max(0, 1 - age / .3);
        for (const m of objs) { if (m === core) continue; const d = m.userData, a = age - d.d; m.visible = a > 0; if (a <= 0) continue; const e = out3(clamp01(a / (d.fire ? .5 : 1.1))); m.position.copy(p).addScaledVector(d.v, e); m.position.y += d.fire ? 0 : a * .35; m.scale.setScalar(S * (d.fire ? 1 + 2.4 * e : 1.2 + 3.2 * e)); m.material.opacity = d.fire ? Math.max(0, 1 - a / .6) : .65 * Math.max(0, 1 - u) ** 1.2; } } };
    },
    // 画面フラッシュ
    flash(c) {
      const m = add(new THREE.PlaneGeometry(40, 40), basic(col(c.color, 0xffffff), { depthTest: false, blending: c.additive ? THREE.AdditiveBlending : THREE.NormalBlending }), overlay); m.position.z = -1; m.renderOrder = 50; const dur = c.dur ?? .16;
      return { objs: [m], life: dur, update(age) { m.material.opacity = (c.opacity ?? .5) * (1 - age / dur) ** 2; } };
    },
    // 集中線（画面の縁から中心へ）
    speed_lines(c) {
      const r = rnd(c.at * 41 + 6), n = c.count ?? 46, pos = [];
      for (let i = 0; i < n; i++) { const a = r() * 6.283, r0 = .42 + r() * .25, r1 = 1.9, w = .006 + r() * .012; pos.push(Math.cos(a - w) * r1, Math.sin(a - w) * r1, 0, Math.cos(a + w) * r1, Math.sin(a + w) * r1, 0, Math.cos(a) * r0, Math.sin(a) * r0, 0); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); const m = add(g, basic(col(c.color, 0xffffff), { depthTest: false, side: THREE.DoubleSide }), overlay); m.position.z = -1; m.renderOrder = 49; const dur = c.dur ?? .5;
      return { objs: [m], life: dur, update(age) { const u = age / dur; m.scale.set(1.25 * (camera.aspect || 2), 1.25, 1); m.rotation.z = Math.floor(age * 30) * 1.3; m.material.opacity = (c.opacity ?? .55) * Math.sin(Math.PI * clamp01(u)) ** .6; } };
    },
    // 画面を暗く落とす（決めの一瞬・見切りの間）
    dim(c) {
      const m = add(new THREE.PlaneGeometry(40, 40), basic(col(c.color, 0x05060c), { depthTest: false }), overlay); m.position.z = -1.2; m.renderOrder = 5; const dur = c.dur ?? .6;
      return { objs: [m], life: dur, update(age) { const u = age / dur; m.material.opacity = (c.opacity ?? .6) * Math.min(1, u * 8, (1 - u) * 6); } };
    },
  };
  function EASEBACK(u) { return 1 + 2.70158 * (u - 1) ** 3 + 1.70158 * (u - 1) ** 2; }

  const live = new Map(), expired = new Set();
  let previousTime = -1;
  const cues = manifest.cues.filter(c => c.type === 'vfx');
  function update(t, ctx) {
    if(t < previousTime)expired.clear();
    previousTime=t;
    for (const c of cues) {
      if(expired.has(c))continue;
      const age = t - c.at; let e = live.get(c);
      if (age < 0 || (e && age > e.life)) { if (e) { for (const o of e.objs) { o.parent.remove(o); o.geometry.dispose(); o.material.dispose(); } live.delete(c); if(age > e.life)expired.add(c); } continue; }
      if (!e) { const b = BUILD[c.key]; if (!b) { if (!c._warned) { console.warn('未対応の VFX key: ' + c.key); c._warned = 1; } continue; } e = b(c, ctx); if (age > e.life) { for (const o of e.objs) { o.parent.remove(o); o.geometry.dispose(); o.material.dispose(); } expired.add(c); continue; } live.set(c, e); }
      e.update(age, ctx);
    }
  }
  function dispose() { for (const e of live.values()) for (const o of e.objs) { o.parent.remove(o); o.geometry.dispose(); o.material.dispose(); } live.clear(); scene.remove(group); camera.remove(overlay); }
  return { update, dispose, keys: Object.keys(BUILD) };
}
