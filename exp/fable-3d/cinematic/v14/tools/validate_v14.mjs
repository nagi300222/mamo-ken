#!/usr/bin/env node
// v14 第一弾の自動検証をまとめて走らせ、validation/summary.json と DELIVERY_MANIFEST.json を書く。
//   node validate_v14.mjs        （先に build_v14.py・build_manifest.mjs・capture_specials.mjs を済ませておく）
import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto'; import { fileURLToPath } from 'node:url'; import { execFileSync } from 'node:child_process';
const HERE = path.dirname(fileURLToPath(import.meta.url)), V14 = path.resolve(HERE, '..'), ROOT = path.resolve(V14, '../..');
const B = await import(path.join(ROOT, 'dojo/balance.js')); const { chooseClip } = await import(path.join(ROOT, 'dojo/models.js'));
const ALL0 = ['moguzo', 'pisuke', 'godan', 'hakuma', 'chirka', 'takimaru', 'yomikage', 'bullet', 'dark_moguzo'];
const HEROES = ALL0.filter(id => fs.existsSync(path.join(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), 'storyboard', id + '.mjs'))), ALL = ['moguzo', 'pisuke', 'godan', 'hakuma', 'chirka', 'takimaru', 'yomikage', 'bullet', 'dark_moguzo'];
const sha = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'); const J = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const checks = []; const ck = (name, pass, detail) => { checks.push({ name, pass: !!pass, detail }); console.log(pass ? 'PASS' : 'FAIL', name, detail ?? ''); };
const run = (file, args = []) => { try { execFileSync('node', [path.join(HERE, file), ...args], { stdio: 'pipe' }); return true; } catch { return false; } };

ck('元GLBと一致（造形・骨格・テクスチャ・既存37クリップ）9体', run('verify_glb.mjs'), 'validation/glb_identity.json');
ck('manifest 3本の形式・クリップ・骨・相手役9体ぶん', run('build_manifest.mjs'), 'manifest/*.json');
// 対戦用クリップの長さと発生・持続が balance.js の現行値と同じか
for (const id of HEROES) { const m = J(path.join(V14, id, id + '_v14_motions.json'));
  for (const [slot, clip, mv] of [['s1', 's1_v14', B.specialMove(id, 0)], ['s2', 's2_v14', B.specialMove(id, 1)], ['s3', 's3_v14', B.specialMove(id, 2)], ['ultimate', 'ult_v14', B.ultimateMove(id)]]) {
    const c = m.clips[clip], tot = mv.startup + mv.active + mv.recovery;
    ck(`${id} ${slot}: クリップ長=総フレーム、発生・持続が balance.js と同じ`, c && c.frames === tot && c.startup === mv.startup && c.active === mv.active, `${clip} ${c?.frames}F / balance ${mv.startup}+${mv.active}+${mv.recovery}=${tot}F`);
    const got = chooseClip({ action: { id: slot, kind: mv.kind, anim: mv.anim } }, Object.keys(m.clips), m.command_map);
    ck(`${id} ${slot}: 現行の models.js chooseClip が新クリップを選ぶ`, got === clip, got); } }
// 実ゲーム撮影: 新クリップで当たり、相手の残り体力が旧と同じ
const oldLog = path.join(V14, 'evidence/audit_before/capture_log.json'), newLog = path.join(V14, 'evidence/audit_after/capture_log.json');
if (fs.existsSync(oldLog) && fs.existsSync(newLog)) { const o = J(oldLog).log, n = J(newLog).log;
  for (const e of n) { const p = o.find(x => x.id === e.id && x.mv === e.mv); const want = e.mv === 'ultimate' ? 'ult_v14' : e.mv + '_v14';
    ck(`実ゲーム ${e.id} ${e.mv}: ${want} が再生され、相手の残り体力が旧と同じ`, e.clip === want && p && p.hpAfter === e.hpAfter, `clip=${e.clip} hp 旧${p?.hpAfter} 新${e.hpAfter}`); }
  ck('実ゲームで 36 技を撮影済み', o.length === 36, o.length + ' 技'); ck('新クリップの実ゲーム撮影が制作済みキャラすべてにある', HEROES.every(id => ['s1', 's2', 's3', 'ultimate'].every(mv => n.some(e => e.id === id && e.mv === mv))), HEROES.length + ' 体'); } else ck('実ゲーム撮影ログ', false, 'evidence/audit_*/capture_log.json が無い');
// ムービーの中身
for (const id of HEROES) { const M = J(path.join(V14, 'manifest', id + '_ultimate.json')); const rigs = M.shots.map(s => s.camera.rig);
  ck(`${id} ムービー: 9〜11秒・6〜10カット・カメラの型がすべて別`, M.durationSeconds >= 9 && M.durationSeconds <= 11 && M.shots.length >= 6 && M.shots.length <= 10 && new Set(rigs).size === rigs.length, `${M.durationSeconds}s / ${M.shots.length} カット`);
  ck(`${id} ムービー: 相手役の移動キーが 8 以上（棒立ちでない）`, M.actorTracks.target.root.length >= 8, M.actorTracks.target.root.length + ' キー');
  ck(`${id} ムービー: 動くカメラ（2キー以上）のカットが過半`, M.shots.filter(s => s.camera.keys.length >= 2).length > M.shots.length / 2, M.shots.map(s => s.camera.keys.length).join('/')); }
const rigSets = HEROES.map(id => J(path.join(V14, 'manifest', id + '_ultimate.json')).shots.map(s => s.camera.rig));
ck('3本のムービーで同じカメラの型を共有しない', new Set(rigSets.flat()).size === rigSets.flat().length, rigSets.flat().length + ' 型');
for (const id of HEROES) { const f = fs.existsSync(path.join(V14, 'evidence/movies')) ? fs.readdirSync(path.join(V14, 'evidence/movies')).filter(x => x.startsWith(id + '_ultimate_10s_vs_') && x.endsWith('.mp4')) : []; ck('ムービー動画あり ' + id, f.length > 0, f.join(', ')); }

const pass = checks.every(c => c.pass); fs.mkdirSync(path.join(V14, 'validation'), { recursive: true });
fs.writeFileSync(path.join(V14, 'validation', 'summary.json'), JSON.stringify({ generated: new Date().toISOString().slice(0, 10), all_pass: pass, passed: checks.filter(c => c.pass).length, total: checks.length, checks }, null, 1));
// 納品一覧
const files = (dir, re) => fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => re.test(f)).sort().map(f => ({ path: path.relative(ROOT, path.join(dir, f)), bytes: fs.statSync(path.join(dir, f)).size, sha256: sha(path.join(dir, f)) })) : [];
const D = { version: 'v14-' + HEROES.length + 'chars-10s', issue: 'https://github.com/nagi300222/mamo-ken/issues/177', generated: new Date().toISOString().slice(0, 10), root: 'exp/fable-3d',
  status: { audited_moves: 36, redesign_catalog: `36（うち制作済み ${HEROES.length * 4}、案のみ ${36 - HEROES.length * 4}）`, produced_specials: HEROES.map(id => ({ id, clips: ['s1_v14', 's2_v14', 's3_v14'], ingame_ultimate_start: 'ult_v14' })),
    produced_ultimate_movies: HEROES.map(id => { const M = J(path.join(V14, 'manifest', id + '_ultimate.json')); return { id, name: M.displayName, seconds: M.durationSeconds, shots: M.shots.length, manifest: `cinematic/v14/manifest/${id}_ultimate.json`, storyboard_source: `cinematic/v14/storyboard/${id}.mjs`, attacker_clip: M.animationSources.attacker.clip, target_clip: M.animationSources.target.clip, target_clip_available_for: ALL }; }),
    not_produced: ALL.filter(id => !HEROES.includes(id)).map(id => ({ id, specials: '案のみ', ultimate_movie: '案のみ（ULTIMATE_10S_DIRECTION.md の本人指定あり）' })),
    game_integration: '未統合（Codex PR #180 側）。本ブランチはゲームのソース dojo/ を変更していない' },
  characters: Object.fromEntries(ALL.map(id => { const m = J(path.join(V14, id, id + '_v14_motions.json')); return [id, { glb: `cinematic/v14/${id}/${id}_v14.glb`, glb_sha256: sha(path.join(V14, id, id + '_v14.glb')), glb_bytes: fs.statSync(path.join(V14, id, id + '_v14.glb')).size, motions: `cinematic/v14/${id}/${id}_v14_motions.json`,
    base_glb: m.v14.base_glb, base_glb_sha256: m.v14.base_glb_sha256, editable_blend: fs.existsSync(path.join(V14, id, id + '_v14.blend')) ? `cinematic/v14/${id}/${id}_v14.blend` : null, added_clips: Object.fromEntries(m.v14_clips.map(c => [c, { frames: m.clips[c].frames, seconds: m.clips[c].duration_sec, group: m.clips[c].group }])), command_map_v14: m.command_map, command_map_base: m.v14.base_command_map }]; })),
  authoring: { motion_source: 'tools/mamo3d/motions_v14.py', build: 'python3 tools/build_v14.py [--only id] [--save-blend]', storyboard_to_manifest: 'node cinematic/v14/tools/build_manifest.mjs', reference_player: 'cinematic/v14/player/index.html?movie=<id>&target=<id>', spec: 'cinematic/v14/MANIFEST_SPEC.md' },
  evidence: { audit_before: files(path.join(V14, 'evidence/audit_before'), /\.(jpg|json)$/), audit_after: files(path.join(V14, 'evidence/audit_after'), /\.(jpg|json)$/), specials: files(path.join(V14, 'evidence/specials'), /\.mp4$/), movies: files(path.join(V14, 'evidence/movies'), /\.(mp4|jpg)$/) },
  validation: { summary: 'cinematic/v14/validation/summary.json', all_pass: pass, passed: checks.filter(c => c.pass).length, total: checks.length } };
fs.writeFileSync(path.join(V14, 'DELIVERY_MANIFEST.json'), JSON.stringify(D, null, 1));
console.log(`\n${checks.filter(c => c.pass).length}/${checks.length} ${pass ? 'ALL PASS' : 'FAILED'}`); process.exit(pass ? 0 : 1);
