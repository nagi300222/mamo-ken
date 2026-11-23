#!/usr/bin/env node
// v17 必殺 27 本の接触メタデータとキューをまとめる。実測は sample_clips.mjs（specials_as_v15_pack.py の写しを --pack で読ませたもの）の曲線、
// 時刻・役割・重さ・キューは specials_v17.json（編集正本から）。
//   node contacts_specials_v17.mjs [--dir ../audit_specials]  → ../special-contacts-v17.js, ../special_contacts_v17.json, ../SPECIAL_TABLE_V17.md
// reach = 攻撃側 root から打撃部位表面までの前方距離 [m]（相手の hurt radius は含まない）。飛び道具は「放つ手（尾）の位置」で、弾の射程ではない。
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url)), V17 = path.resolve(HERE, '..');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i < 0 ? d : process.argv[i + 1]; };
const dir = path.resolve(arg('dir', path.join(V17, 'audit_specials'))); const META = JSON.parse(fs.readFileSync(path.join(V17, 'specials_v17.json')));
const KEY = { s1: 'new:stand_weak', s2: 'new:stand_heavy', s3: 'new:crouch_weak' }; const GROUPS = ['armL', 'armR', 'legL', 'legR', 'tail', 'head', 'body']; const r3 = x => +x.toFixed(3);
// 肩当ては肩と上体が打撃面なので、shoulder は腕（肩）と胴の両方を打撃部位に数える
const PARTS = limb => limb.split('+').flatMap(l => /^shoulder/.test(l) ? ['arm' + l.at(-1), 'body'] : /^paw|^elbow/.test(l) ? ['arm' + l.at(-1)] : /^foot|^knee/.test(l) ? ['leg' + l.at(-1)] : l === 'body' || l === 'chest' ? ['body', 'head'] : [l]);
const OUT = {}, rows = [], notes = [];
for (const [id, moves] of Object.entries(META.characters)) { const file = path.join(dir, id + '_curves.json'); if (!fs.existsSync(file)) { notes.push(id + ': 未計測'); continue; } const C = JSON.parse(fs.readFileSync(file)); OUT[id] = {};
  for (const [slot, m] of Object.entries(moves)) { const S = C[KEY[slot]].samples, N = S.length - 1, parts = PARTS(m.attack_limb);
    const at = (i, p, k = 0) => S[i][p]?.[k] ?? (k ? 0 : -9); const lerp = (u, p, k = 0) => { const x = Math.max(0, Math.min(N, u * N)), i = Math.min(N - 1, Math.floor(x)); return at(i, p, k) + (at(i + 1, p, k) - at(i, p, k)) * (x - i); };
    // 持続の間でいちばん前へ出た瞬間を見る（突進・多段・対空は持続中に伸びる）
    let best = { v: -9, u: m.contact, p: parts[0] }; for (let k = 0; k <= 8; k++) { const u = m.contact + (m.contact_end - m.contact) * k / 8; for (const p of parts) { const v = lerp(u, p); if (v > best.v) best = { v, u, p }; } }
    const atContact = Math.max(...parts.map(p => lerp(m.contact, p))); const front = GROUPS.map(p => [p, lerp(best.u, p)]).sort((a, b) => b[1] - a[1])[0];
    const projectile = m.kind === 'projectile', issues = [];
    // 前方への先行を見るのは「前へ打つ技」だけ。対空は上へ打つ技なので高さで見る。ゴダンの地割りは足元の踏み割りで、前へ伸びる部位が無い
    const upward = m.kind === 'antiair' || (id === 'godan' && slot === 's1');
    if (!projectile && m.kind !== 'counter' && !upward) { if (!parts.includes(front[0]) && front[1] - best.v > .04) issues.push(`${front[0]} が ${r3(front[1] - best.v)}m 先に出ている`); if (best.v < .12) issues.push('打撃部位が体より前に出ていない'); }
    const activeReach = [0, .5, 1].map(ph => { const u = m.contact + (m.contact_end - m.contact) * ph; const p = parts.map(q => [q, lerp(u, q)]).sort((a, b) => b[1] - a[1])[0]; return { phase: ph, reach: r3(p[1]), height: r3(Math.max(0, lerp(u, p[0], 1))) }; });
    OUT[id][slot] = { clip: m.clip, name: m.name_jp, origin: m.origin, kind: m.kind, weight: m.weight, role: m.role, frames: m.frames, contactSeconds: m.contactSeconds, contact: m.contact, contactEnd: m.contact_end,
      attackPart: best.p, attackLimb: m.attack_limb, reach: r3(atContact), reachPeak: r3(best.v), reachPeakPhase: r3((best.u - m.contact) / Math.max(1e-6, m.contact_end - m.contact)), height: r3(Math.max(0, lerp(best.u, best.p, 1))),
      reachMeans: projectile ? 'release point (not projectile range)' : 'striking surface', activeReach, referenceFrames: { startup: m.startup, active: m.active, recovery: m.recovery },
      heightPeak: r3(Math.max(...Array.from({ length: 9 }, (_, k) => Math.max(...parts.map(p => lerp(m.contact + (m.contact_end - m.contact) * k / 8, p, 1)))))), strikeAxis: upward ? 'upward' : 'forward',
      airborneFrames: m.visual_airborne_frames, projectileSpawnFrame: m.projectile_spawn_frame, cueTrack: m.cue_track, hitstopSuggest: m.hitstop_suggest, status: issues.length ? 'fix' : 'ok', issues: issues.length ? issues : undefined };
    if (issues.length) notes.push(`${id}/${slot}（${m.name_jp}）: ${issues.join(' / ')}`);
    rows.push(`| ${id} | ${slot} | ${m.name_jp} | ${m.origin === 'v17 revised' ? '作り直し' : '据え置き'} | ${m.kind} / ${m.weight} | ${m.attack_limb} | ${r3(atContact).toFixed(2)} | ${r3(best.v).toFixed(2)} | ${r3(Math.max(0, lerp(best.u, best.p, 1))).toFixed(2)} | ${m.contactSeconds} | ${m.cue_track.length} | ${issues.join(' / ')} |`); } }
fs.writeFileSync(path.join(V17, 'special_contacts_v17.json'), JSON.stringify(OUT, null, 1) + '\n');
fs.writeFileSync(path.join(V17, 'special-contacts-v17.js'), `// v17 P3 必殺 27 本の接触同期データとキュー（Claude 制作・実測）。生成: motion/v17/tools/contacts_specials_v17.mjs — 手で編集しない。
// clip は motion/v17/<id>_specials_v17.glb の中のクリップ名。contact/contactEnd = クリップ正規化時刻、contactSeconds = 接触のクリップ秒。
// reach = 接触時刻の、root から打撃部位表面までの前方距離 [m]（相手の hurt radius は含まない）。reachPeak は持続中の最大。飛び道具は放つ手（尾）の位置。
// cueTrack[] = {at: クリップ秒, type: sfx|vfx|shake, key, trigger: movement|contact, on: always|hit|guard, bone?}。
//   movement = 動作音（溜め・風切り・着地・弾を放つ瞬間）で、時刻で必ず鳴らす。contact = 打撃音・接触エフェクト・揺れで、時刻では鳴らさず Battle の実ヒット／ガードに委譲（空振りでは鳴らない）。
// hitstopSuggest は提案値。referenceFrames は現行 balance.js の値の写し（変更していない）。
export const SPECIAL_CONTACTS_V17_VERSION=${JSON.stringify(META.version)};
export const SPECIAL_CONTACTS_V17=Object.freeze(${JSON.stringify(OUT, null, 1)});
`);
fs.writeFileSync(path.join(V17, 'SPECIAL_TABLE_V17.md'), ['# v17 P3｜27必殺の評価・接触実測表', '', '「据え置き」は v14 の演技をそのまま v17 の契約（素の時間・キュー付き）で書き出したもの、「作り直し」は評価で直した技。',
  'reach は接触時刻の root から打撃部位表面までの前方距離 [m]、「最大」は持続中のいちばん前。飛び道具は放つ手（尾）の位置で、弾の射程ではない。', '',
  '| キャラ | 技 | 名前 | 扱い | 種類 / 重さ | 攻撃部位 | reach | 最大 | 高さ | 接触 秒 | キュー数 | 注意 |', '|---|---|---|---|---|---|---|---|---|---|---|---|', ...rows, ''].join('\n'));
console.log('ok', rows.filter(r => r.endsWith('|  |')).length, '/ fix', notes.filter(n => !n.endsWith('未計測')).length, '/ 未計測', notes.filter(n => n.endsWith('未計測')).length); console.log(notes.join('\n'));
