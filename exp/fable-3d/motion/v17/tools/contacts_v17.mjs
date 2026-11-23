#!/usr/bin/env node
// v17 通常技の接触メタデータを作る。normal-art/v15_1/tools/sample_clips.mjs が実ゲームのページで測った
// 「クリップ正規化時刻ごとの、部位別の最前頂点（スキン後メッシュ表面）」と、編集正本が持つ接触時刻・攻撃部位から、
// v15.1 と同じ定義の NORMAL_CONTACTS を出す（reach = 攻撃側 root から打撃部位表面までの前方距離 [m]、相手の hurt radius は含まない）。
//   node contacts_v17.mjs [--dir ../audit]   → ../normal_contacts_v17.json, ../normal-contacts-v17.js, ../CONTACT_TABLE_V17.md
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url)), V17 = path.resolve(HERE, '..');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i < 0 ? d : process.argv[i + 1]; };
const dir = path.resolve(arg('dir', path.join(V17, 'audit'))); const META = JSON.parse(fs.readFileSync(path.join(V17, 'normals_v17.json')));
const SLOTS = ['stand_weak', 'stand_heavy', 'crouch_weak', 'crouch_heavy', 'air_weak', 'air_heavy'];
// 攻撃部位 → 計測の部位グループ（肩・ひじ・前腕は腕、ひざは脚）
const PARTS = limb => limb.split('+').flatMap(l => /^paw|^elbow|^shoulder/.test(l) ? ['arm' + l.at(-1)] : /^foot|^knee/.test(l) ? ['leg' + l.at(-1)] : l === 'body' ? ['body', 'head'] : [l]);   // 体ごと落とす技は胴と頭のどちらが先でも打撃面
const GROUPS = ['armL', 'armR', 'legL', 'legR', 'tail', 'head', 'body']; const r3 = x => +x.toFixed(3);
const OUT = {}, notes = [], rows = [];
for (const [id, moves] of Object.entries(META.characters)) { const file = path.join(dir, id + '_curves.json'); if (!fs.existsSync(file)) { notes.push(id + ': 未計測'); continue; }
  const C = JSON.parse(fs.readFileSync(file)); OUT[id] = {};
  for (const slot of SLOTS) { const m = moves[slot], S = C['new:' + slot].samples, N = S.length - 1, parts = PARTS(m.attack_limb);
    const at = (i, p, k = 0) => S[i][p]?.[k] ?? (k ? 0 : -9);
    const lerp = (u, p, k = 0) => { const x = Math.max(0, Math.min(N, u * N)), i = Math.min(N - 1, Math.floor(x)); return at(i, p, k) + (at(i + 1, p, k) - at(i, p, k)) * (x - i); };
    const best = u => parts.map(p => [p, lerp(u, p)]).sort((a, b) => b[1] - a[1])[0];
    const [part, reach] = best(m.contact); const front = GROUPS.map(p => [p, lerp(m.contact, p)]).sort((a, b) => b[1] - a[1])[0];
    // その部位が前へ出切る時刻（計測）と、編集正本の接触時刻のずれ
    let pk = { v: -9, u: 0 }; for (let i = 0; i <= N; i++) if (at(i, part) > pk.v) pk = { v: at(i, part), u: i / N };
    const issues = [];
    if (!parts.includes(front[0]) && front[1] - reach > .03) issues.push(`${front[0]} が ${r3(front[1] - reach)}m 先に出ている`);
    if (reach < .12) issues.push('打撃部位が体より前に出ていない');
    if (!slot.startsWith('air_') && lerp(m.contact, part, 1) < -.012) issues.push(`打撃部位が床下 ${r3(lerp(m.contact, part, 1))}m`);
    if (pk.v - reach > .03 && Math.abs(pk.u - m.contact) > .04) issues.push(`前へ出切るのは u=${r3(pk.u)}（接触 u=${m.contact} より ${r3(pk.v - reach)}m 先）`);
    const activeReach = [0, .5, 1].map(ph => { const u = m.contact + (m.contact_end - m.contact) * ph; return { phase: ph, reach: r3(lerp(u, part)), height: r3(Math.max(0, lerp(u, part, 1))) }; });
    OUT[id][slot] = { clip: m.clip, contact: m.contact, contactEnd: m.contact_end, attackPart: part, attackLimb: m.attack_limb, bothHands: m.attack_limb === 'pawL+pawR' || undefined,
      reach: r3(reach), height: r3(Math.max(0, lerp(m.contact, part, 1))), activeReach, status: issues.length ? 'fix' : 'ok', issues: issues.length ? issues : undefined, name: m.name_jp };
    if (issues.length) notes.push(`${id}/${slot}（${m.name_jp}）: ${issues.join(' / ')}`);
    rows.push([id, slot, m.name_jp, m.attack_limb, r3(reach).toFixed(2), r3(Math.max(0, lerp(m.contact, part, 1))).toFixed(2), `${m.contact} → ${m.contact_end}`, activeReach.map(a => a.reach.toFixed(2)).join(' / '), issues.length ? '⚠ ' + issues.join(' / ') : '']); } }
fs.writeFileSync(path.join(V17, 'normal_contacts_v17.json'), JSON.stringify(OUT, null, 1) + '\n');
fs.writeFileSync(path.join(V17, 'normal-contacts-v17.js'), `// v17 P3 通常技の接触同期データ（Claude 制作・実測）。生成: motion/v17/tools/contacts_v17.mjs — 手で編集しない。
// 定義は v15.1 の NORMAL_CONTACTS と同じ: contact/contactEnd = クリップ正規化時刻、reach = 攻撃側 root から打撃部位表面までの前方距離 [m]
// （相手の hurt radius は含まない）、activeReach = contact〜contactEnd を phase 0..1 としたときの実測の reach と打点の高さ。
// clip は motion/v17/<id>_normals_v17.glb の中のクリップ名。status 'fix' は見た目の不一致が残る暫定値。
export const NORMAL_CONTACTS_V17_VERSION=${JSON.stringify(META.version)};
export const NORMAL_CONTACTS_V17=Object.freeze(${JSON.stringify(OUT, null, 1)});
`);
const md = ['# v17 P3｜54通常技の接触実測表', '', '距離は攻撃側 root から打撃部位の表面までの前方距離 [m]（相手の hurt radius は含まない）。高さは床からの打点 [m]。実ゲームのページで元 GLB のスキンメッシュを測った値。', '',
  '| キャラ | 技 | 名前 | 攻撃部位 | reach | 高さ | contact → End | activeReach (0/.5/1) | 注意 |', '|---|---|---|---|---|---|---|---|---|', ...rows.map(r => '| ' + r.join(' | ') + ' |'), ''];
fs.writeFileSync(path.join(V17, 'CONTACT_TABLE_V17.md'), md.join('\n'));
console.log('ok', rows.filter(r => !r[8]).length, '/ fix', rows.filter(r => r[8]).length, '/ 未計測', notes.filter(n => n.endsWith('未計測')).length); console.log(notes.join('\n'));
