#!/usr/bin/env node
// v17 の通常 54 本・必殺 27 本を、**正確なクリップ時刻**（接触 contact・中間・終わり contactEnd）で実測する。
// 実ゲームのページ（WebGL）で元 GLB のスキンメッシュの全頂点を見て、部位ごとの最前頂点の前方距離と高さを取る。補間はしない。
// 高さは root（足元）基準の符号付きのまま保存する（空中技で尾や足が root より下へ来る演技は負になる）。
//   node measure_exact.mjs --kind normals|specials --pack DIR --out DIR [--ids ..]
//   --pack : as_v15_pack.py / specials_as_v15_pack.py が作った「現行ゲームの名前に付け替えた写し」。ゲームのソースと normal/v15 の実ファイルは変えない。
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { serve, launch, openGame, ALL, arg } from '../../../presentation/v151/tools/lib.mjs';
const HERE = path.dirname(fileURLToPath(import.meta.url)), V17 = path.resolve(HERE, '..');
const kind = String(arg('kind', 'normals')), pack = path.resolve(String(arg('pack'))), out = path.resolve(String(arg('out'))), ids = String(arg('ids', ALL.join(','))).split(',');
const META = JSON.parse(fs.readFileSync(path.join(V17, kind === 'normals' ? 'normals_v17.json' : 'specials_v17.json'))).characters;
// Battle の持続フレーム数（通常技は Codex の明示表 normal-balance-v151.js、必殺は現行 balance の写し）。各 active フレーム i の phase=i/(active-1) に対応する正確時刻を測る
const { NORMAL_BALANCE } = await import(path.join(V17, '../../dojo/normal-balance-v151.js'));
const ANCHOR = { pawL: 'pawL', pawR: 'pawR', footL: 'footL', footR: 'footR', tail: 'tail_03', chest: 'chest', elbowR: 'forearmR', shoulderL: 'shoulderL' };
const GAME = kind === 'normals' ? s => 'v15_' + s : s => ({ s1: 'v15_stand_weak', s2: 'v15_stand_heavy', s3: 'v15_crouch_weak' })[s];
const IN_PAGE = () => {
  const part = n => { const side = /[a-z]L$/.test(n) ? 'L' : /[a-z]R$/.test(n) ? 'R' : '', s = n.toLowerCase();
    if (/paw|hand|wrist|elbow|shoulder|clav|forearm|upper_?arm|arm/.test(s)) return 'arm' + side; if (/foot|shin|thigh|knee|ankle|leg|toe/.test(s)) return 'leg' + side;
    if (/tail/.test(s)) return 'tail'; if (/head|jaw|ear|neck|snout|nose|beak/.test(s)) return 'head'; return 'body'; };
  const a = mamoken3d.actors[0]; const ms = [];
  a.gltf.scene.traverse(o => { if (!o.isSkinnedMesh) return; const g = o.geometry, si = g.attributes.skinIndex, sw = g.attributes.skinWeight, n = g.attributes.position.count, grp = new Array(n), bone = new Array(n);
    for (let i = 0; i < n; i++) { let b = 0, w = -1; for (let k = 0; k < 4; k++) { const x = sw.getComponent(i, k); if (x > w) { w = x; b = si.getComponent(i, k); } } bone[i] = o.skeleton.bones[b].name; grp[i] = part(bone[i]); } ms.push({ o, n, grp, bone }); });
  const v = new (ms[0].o.position.constructor)();
  window.__exact = (name, seconds, boneName) => { const p = mamoken3d.battle.fighters[0], act = a.actions[name]; if (!act) return null;
    for (const k in a.actions) if (a.actions[k] !== act) a.actions[k].stop();
    act.reset(); act.enabled = true; act.setEffectiveWeight(1); act.setEffectiveTimeScale(1); act.clampWhenFinished = true; act.play(); act.paused = true; const d = act.getClip().duration; act.time = Math.min(d - 1e-5, Math.max(0, seconds)); a.mixer.update(0);
    a.holder.position.set(p.x, 0, 0); a.holder.updateMatrixWorld(true); const r = {};
    for (const m of ms) for (let i = 0; i < m.n; i++) { m.o.getVertexPosition(i, v); v.applyMatrix4(m.o.matrixWorld); const f = (v.x - p.x) * p.facing, g = m.grp[i];
      const c = r[g]; if (!c || f > c.fwd) r[g] = { fwd: f, y: v.y, bone: m.bone[i] }; const t = r[g + ':top']; if (!t || v.y > t.y) r[g + ':top'] = { fwd: f, y: v.y }; const lo = r[g + ':low']; if (!lo || v.y < lo.y) r[g + ':low'] = { fwd: f, y: v.y }; }
    for (const k in r) { r[k].fwd = +r[k].fwd.toFixed(4); r[k].y = +r[k].y.toFixed(4); }
    let socket = null; if (boneName) { const b = a.gltf.scene.getObjectByName(boneName); if (b) { b.getWorldPosition(v); socket = { bone: boneName, forward: +((v.x - p.x) * p.facing).toFixed(4), height: +v.y.toFixed(4), side: +v.z.toFixed(4) }; } }
    return { duration: +d.toFixed(5), time: +act.time.toFixed(5), r, socket }; };
};
const { srv, url } = await serve(); const browser = await launch(); fs.mkdirSync(out, { recursive: true });
for (const id of ids) {
  const g = await openGame(browser, url, { scale: 1 });
  await g.page.route(/\/normal\/v15\/(\w+)_normals\.glb/, r => { const c = r.request().url().match(/\/(\w+)_normals\.glb/)[1]; r.fulfill({ contentType: 'model/gltf-binary', body: fs.readFileSync(path.join(pack, c + '_normals.glb')) }); });
  await g.start(id, id === 'moguzo' ? 'pisuke' : 'moguzo'); await g.until('fight', 900); await g.step(10);
  await g.page.evaluate(() => { const [p, t] = mamoken3d.battle.fighters; p.x = -.9; t.x = .9; p.facing = 1; }); await g.page.evaluate(IN_PAGE);
  const R = {};
  for (const [slot, m] of Object.entries(META[id])) { const N = m.frames, cf = m.contact_frame, ce = kind === 'normals' ? cf + m.contact_hold_frames : cf + Math.max(1, m.active) - 1;
    const times = { contact: cf / 60, mid: (cf + ce) / 120, end: ce / 60 }; const S = {}; const bone = ANCHOR[m.fx_anchor] || (m.attack_limb && ANCHOR[m.attack_limb.split('+')[0]]) || null;
    for (const [k, t] of Object.entries(times)) S[k] = await g.page.evaluate(([n, t, b]) => __exact(n, t, b), [GAME(slot), t, bone]);
    // Battle の各 active フレーム: phase = i/(active-1)。通常技はクリップの contact→contactEnd へ線形に写る時刻、必殺は素の時間なので接触フレーム + i
    const A = kind === 'normals' ? NORMAL_BALANCE[id][slot].active : Math.max(1, m.active); const active = [];
    for (let i = 0; i < A; i++) { const phase = A > 1 ? i / (A - 1) : 0; const t = kind === 'normals' ? (cf + (ce - cf) * phase) / 60 : (cf + i) / 60; active.push({ i, phase: +phase.toFixed(4), ...(await g.page.evaluate(([n, t, b]) => __exact(n, t, b), [GAME(slot), t, bone])) }); }
    // 接触の前後 ±3F も 1F 刻みで取り、ピークが接触時刻に来ているかを見る
    const around = []; for (let f = Math.max(0, cf - 3); f <= Math.min(N, ce + 3); f++) around.push({ frame: f, ...(await g.page.evaluate(([n, t]) => __exact(n, t), [GAME(slot), f / 60])) });
    R[slot] = { clip: m.clip, frames: N, contact_frame: cf, end_frame: ce, battleActive: A, exact: S, active, around }; }
  fs.writeFileSync(path.join(out, id + '.json'), JSON.stringify(R)); console.log(id, 'ok', Object.keys(R).length, g.errors[0] || ''); await g.ctx.close();
}
await browser.close(); srv.close();
