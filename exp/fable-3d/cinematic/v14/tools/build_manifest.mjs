#!/usr/bin/env node
// storyboard/<id>.mjs（人が書く絵コンテ）→ manifest/<id>_ultimate.json（ゲームが読むデータ）。
// 書き出し時に、契約どおりの形か・GLB にクリップと骨があるかを確かめる。足りなければ失敗する（黙って共通ズームへ落とさない）。
//   node build_manifest.mjs [ids]
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath, pathToFileURL } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url)), V14 = path.resolve(HERE, '..');
const ids = (process.argv[2] || fs.readdirSync(path.join(V14, 'storyboard')).filter(f => f.endsWith('.mjs') && !f.startsWith('_')).map(f => f.replace('.mjs', '')).join(',')).split(',');
const ROSTER = ['moguzo', 'pisuke', 'godan', 'hakuma', 'chirka', 'takimaru', 'yomikage', 'bullet', 'dark_moguzo'];
const BONES = ['head', 'chest', 'pelvis', 'pawL', 'pawR', 'footL', 'footR', 'jaw', 'tail', 'root'];
const glbJson = (p) => { const b = fs.readFileSync(p); return JSON.parse(b.subarray(20, 20 + b.readUInt32LE(12)).toString('utf8')); };
const r3 = (x) => Math.round(x * 1000) / 1000;
let failed = false; const fail = (id, m) => { console.error(`[${id}] NG: ${m}`); failed = true; };
const ref = (a) => Array.isArray(a) ? { anchor: a[0], offset: [a[1] || 0, a[2] || 0, a[3] || 0] } : a;
for (const id of ids) {
  const sb = (await import(pathToFileURL(path.join(V14, 'storyboard', id + '.mjs')).href + '?' + Date.now())).default;
  const cues = [], shots = sb.shots.map((s, i) => {
    const keys = s.camera.keys.map(k => ({ t: r3(k.t), pos: ref(k.pos), look: ref(k.look), fov: k.fov, roll: k.roll || 0, ease: k.ease || 'inOutCubic' }));
    const fx = (s.cues || []).filter(c => c.type === 'vfx' || c.type === 'shake' || c.type === 'hitstop'), sfx = (s.cues || []).filter(c => c.type === 'sfx');
    for (const c of s.cues || []) cues.push({ ...c, at: r3(c.at), shot: s.id });
    const k0 = keys[0];
    return { id: s.id, title: s.title, start: r3(s.start), end: r3(s.end), intent: s.intent, actorPose: s.actorPose,
      camera: { rig: s.camera.rig, projection: 'perspective', position: k0.pos, lookAt: k0.look, fov: k0.fov, rollDeg: k0.roll, easing: keys.at(-1).ease, move: s.camera.move, keys },
      fxCues: fx.map(c => ({ at: r3(c.at), key: c.key || c.type, ...c })), sfxCues: sfx.map(c => ({ at: r3(c.at), key: c.key })) };
  });
  cues.sort((a, b) => a.at - b.at);
  const actorTracks = {};
  for (const [name, tr] of Object.entries(sb.actors)) actorTracks[name] = { ...tr, segments: tr.segments.map(g => ({ ...g, start: r3(g.start) })), root: tr.root.map(k => ({ ...k, t: r3(k.t) })) };
  const M = { schemaVersion: 1, contractRevision: 'v14-wave1-10s', directionSource: 'docs/mamoken-showtime-v14/ULTIMATE_10S_DIRECTION.md', characterId: sb.characterId, moveId: 'ultimate', displayName: sb.displayName, ...(sb.nameNote ? { nameNote: sb.nameNote } : {}), trigger: 'confirmed_unblocked_ultimate_hit', runtime: 'threejs',
    durationSeconds: sb.durationSeconds, fps: 60, concept: sb.concept,
    coordinateSystem: { origin: '命中時の両者の中点・地面', x: '攻撃側の向いている方向が +X', y: '上', z: '対戦カメラ側が +Z', unit: 'm（GLBの単位）', mirror: '攻撃側が左向き（-X向き）のときはムービー全体を Y 軸まわりに 180 度回す（x・z の符号反転、rotY+180、rotZ・rotX の符号反転。カメラ roll はそのまま）' },
    stage: sb.stage,
    animationSources: { attacker: { glb: `${id}/${id}_v14.glb`, motions: `${id}/${id}_v14_motions.json`, clip: sb.actors.attacker.segments[0].clip }, target: { glbPattern: '<targetId>/<targetId>_v14.glb', clip: sb.actors.target.segments[0].clip, availableFor: ROSTER } },
    inGameStartClip: { clip: 'ult_v14', note: '命中前の始動。ここまでは通常の対戦カメラ。命中が確定した次のフレームでムービー t=0 へ' },
    actorTracks, shots, cues, reducedMotion: sb.reducedMotion, skip: { allowedFrom: 0.4, landOn: 'end', note: 'スキップ時は役者を消してからゲームの立ち位置へ戻す。ムービー中の位置を戦闘へ持ち込まない' } };
  // ---- 検証 ----
  if (shots.length < 6 || shots.length > 10) fail(id, `ショット数 ${shots.length}（6〜10 の範囲外）`);
  if (M.durationSeconds < 9 || M.durationSeconds > 11) fail(id, `尺 ${M.durationSeconds}s（9〜11 の範囲外）`);
  if (!cues.some(c => c.type === 'hitstop')) fail(id, 'hitstop キューが無い');
  shots.forEach((s, i) => { const prev = shots[i - 1]; if (i === 0 ? s.start !== 0 : Math.abs(s.start - prev.end) > 1e-6) fail(id, `${s.id} の開始が前のショットの終わりと合わない`);
    if (s.end <= s.start) fail(id, `${s.id} の長さが 0 以下`);
    for (const k of s.camera.keys) { if (k.t < s.start - 1e-6 || k.t > s.end + 1e-6) fail(id, `${s.id} のカメラキー t=${k.t} がショット外`);
      for (const a of [k.pos, k.look]) { const [an, bn] = a.anchor.split('.'); if (an !== 'stage' && !actorTracks[an]) fail(id, `${s.id}: anchor の役者 ${an} が無い`); if (bn && !BONES.includes(bn)) fail(id, `${s.id}: anchor の骨 ${bn} が別名表に無い`); }
      if (!(k.fov >= 12 && k.fov <= 80)) fail(id, `${s.id}: fov ${k.fov}`); } });
  if (Math.abs(shots.at(-1).end - M.durationSeconds) > 1e-6) fail(id, '最後のショットの終わりが durationSeconds と違う');
  const sig = shots.map(s => s.camera.rig); if (new Set(sig).size < Math.min(4, shots.length)) fail(id, 'カメラの型が 4 種類未満（同じ型の使い回し）');
  const aj = glbJson(path.join(V14, id, id + '_v14.glb')), ac = Object.fromEntries(aj.animations.map(a => [a.name, a])), nodes = new Set(aj.nodes.map(n => n.name.replace(/\./g, '')));
  const dur = (g, a) => Math.max(...a.samplers.map(s => g.accessors[s.input].max[0]));
  for (const [name, tr] of Object.entries(actorTracks)) { if (name === 'target') continue; for (const g of tr.segments) if (!ac[g.clip]) fail(id, `${name}: クリップ ${g.clip} が ${id}_v14.glb に無い`); }
  const main = ac[M.animationSources.attacker.clip]; if (main && dur(aj, main) < M.durationSeconds - 0.02) fail(id, `攻撃側クリップが ${dur(aj, main)}s でムービーより短い`);
  for (const b of ['head', 'chest', 'pelvis', 'pawL', 'pawR', 'footL', 'footR']) if (!nodes.has(b)) fail(id, `骨 ${b} が GLB に無い`);
  const tclip = M.animationSources.target.clip, missing = [];
  for (const t of ROSTER) { const f = path.join(V14, t, t + '_v14.glb'); if (!fs.existsSync(f)) { missing.push(t + '(GLB無し)'); continue; } const j = glbJson(f); const a = j.animations.find(a => a.name === tclip); if (!a) missing.push(t); else if (dur(j, a) < M.durationSeconds - 0.02) missing.push(t + '(短い)'); }
  if (missing.length) fail(id, `受け手クリップ ${tclip} が無い: ${missing.join(', ')}`);
  for (const c of cues) if (c.at < 0 || c.at > M.durationSeconds) fail(id, `キュー ${c.key || c.type} at=${c.at} が範囲外`);
  fs.writeFileSync(path.join(V14, 'manifest', id + '_ultimate.json'), JSON.stringify(M, null, 1));
  console.log(`[${id}] ${failed ? 'NG' : 'OK'}  shots=${shots.length} (${shots.map(s => (s.end - s.start).toFixed(2)).join('/')})  rigs=${sig.join(',')}  cues=${cues.length}  actors=${Object.keys(actorTracks).join(',')}`);
}
process.exit(failed ? 1 : 0);
