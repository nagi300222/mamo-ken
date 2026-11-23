#!/usr/bin/env node
// v17 の接触メタデータ（通常 54・必殺 27）を、measure_exact.mjs の**正確なクリップ時刻の WebGL 実測**から作る。補間した曲線は使わない。
//   node contacts_exact_v17.mjs  → ../normal-contacts-v17.js / normal_contacts_v17.json / CONTACT_TABLE_V17.md
//                                  ../special-contacts-v17.js / special_contacts_v17.json / SPECIAL_TABLE_V17.md
// reach  = 攻撃側 root（足元の x）から打撃部位のスキン後メッシュ表面の最前頂点までの前方距離 [m]（相手の hurt radius は含まない）
// height = その最前頂点の高さ [m]。**root 基準の符号付き**（丸めない）。空中技で尾や足が root より下へ来る演技は負になる。判定側は strikeY = a.y + height
// activeReach[i] = Battle の持続フレーム i（phase = i/(active-1)）に対応する正確時刻の reach / height
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url)), V17 = path.resolve(HERE, '..'); const r4 = x => +x.toFixed(4);
// --rev r2 : 必殺の r2（motion/v17r2。直した体のパックだけ別ファイル）の表を作る。v17（r1）の出力には触らない。直していない体は r1 の実測をそのまま使う
const REV = process.argv.includes('--rev') ? process.argv[process.argv.indexOf('--rev') + 1] : '', R2 = path.resolve(V17, '..', 'v17' + REV);
const rd = f => JSON.parse(fs.readFileSync(f)), R2M = REV ? { normals: rd(path.join(R2, `normals_v17${REV}.json`)), specials: rd(path.join(R2, `specials_v17${REV}.json`)) } : null;
const R1N = REV ? rd(path.join(V17, 'normal_contacts_v17.json')) : null, R1C = REV ? rd(path.join(V17, 'special_contacts_v17.json')) : null;
const GROUPS = ['armL', 'armR', 'legL', 'legR', 'tail', 'head', 'body'];
const PARTS = limb => limb.split('+').flatMap(l => /^shoulder/.test(l) ? ['arm' + l.at(-1), 'body'] : /^paw|^elbow/.test(l) ? ['arm' + l.at(-1)] : /^foot|^knee/.test(l) ? ['leg' + l.at(-1)] : l === 'body' || l === 'chest' ? ['body', 'head'] : [l]);
const pick = (s, parts) => parts.map(p => [p, s.r[p]]).filter(x => x[1]).sort((a, b) => b[1].fwd - a[1].fwd)[0];
const front = s => GROUPS.map(p => [p, s.r[p]?.fwd ?? -9]).sort((a, b) => b[1] - a[1])[0];
function build(kind) {
  const META = JSON.parse(fs.readFileSync(path.join(V17, kind === 'normals' ? 'normals_v17.json' : 'specials_v17.json'))); const OUT = {}, rows = [], notes = [];
  const R2META = REV ? R2M[kind] : null; if (REV) { Object.assign(META.characters, R2META.characters); META.version = R2META.version; }
  for (const [id, moves] of Object.entries(META.characters)) { const inR2 = !!(REV && R2META.characters[id]), file = path.join(inR2 ? R2 : V17, 'audit_exact', kind, id + '.json'); if (!fs.existsSync(file)) { notes.push(id + ': 未計測'); continue; } const E = JSON.parse(fs.readFileSync(file)); OUT[id] = {};
    for (const [slot, m] of Object.entries(moves)) { const e = E[slot], parts = PARTS(m.attack_limb), c = pick(e.exact.contact, parts), reach = c[1].fwd, height = c[1].y;
      const activeReach = e.active.map(a => { const q = pick(a, parts); return { phase: a.phase, frame: a.i, reach: r4(q[1].fwd), height: r4(q[1].y), part: q[0] }; });
      const peakActive = activeReach.reduce((a, b) => (b.reach > a.reach ? b : a)); const f = front(e.exact.contact), issues = [];
      const projectile = m.kind === 'projectile', upward = m.kind === 'antiair' || (kind === 'specials' && id === 'godan' && slot === 's1'), air = kind === 'normals' && slot.startsWith('air_');
      const extends_ = kind === 'specials' && ['rush', 'grab'].includes(m.kind);      // 持続中に前へ伸びる技は、持続中の最大で先行を見る
      const lead = extends_ ? peakActive.reach : reach;
      if (!projectile && m.kind !== 'counter' && !upward) { if (!parts.includes(f[0]) && f[1] - lead > .03) issues.push(`${f[0]} が ${r4(f[1] - lead)}m 先に出ている`); if (lead < .12) issues.push('打撃部位が体より前に出ていない'); }
      if (kind === 'normals' && !air && height < -.012) issues.push(`打撃部位が床下 ${r4(height)}m`);
      // 接触の前後 ±3F で、接触・持続の外にもっと前へ出るフレームがあるか
      const outside = e.around.filter(a => a.frame < e.contact_frame || a.frame > e.end_frame).map(a => [a.frame, pick(a, parts)[1].fwd]).sort((a, b) => b[1] - a[1])[0];
      if (!projectile && !upward && m.kind !== 'counter' && outside && outside[1] - Math.max(reach, peakActive.reach) > .03) issues.push(`F${outside[0]} のほうが ${r4(outside[1] - Math.max(reach, peakActive.reach))}m 前（接触 F${e.contact_frame}〜F${e.end_frame} の外）`);
      const base = { clip: m.clip, name: m.name_jp, contact: m.contact, contactEnd: m.contact_end, contactSeconds: r4(e.contact_frame / 60), attackPart: c[0], attackLimb: m.attack_limb, reach: r4(reach), height: r4(height),
        battleActive: e.battleActive, activeReach, status: issues.length ? 'fix' : 'ok', issues: issues.length ? issues : undefined };
      if (kind === 'normals') { OUT[id][slot] = { ...base, bothHands: m.attack_limb === 'pawL+pawR' || undefined };
        // file = このクリップが入っているパック。changedFromR1 の技だけ演技（接触の姿勢と時計）が違う
        if (REV) { const r1 = R1N[id][slot], changed = m.revision === REV; Object.assign(OUT[id][slot], { file: inR2 ? `motion/v17${REV}/${id}_normals_v17${REV}.glb` : `motion/v17/${id}_normals_v17.glb`, revision: changed ? REV : 'r1', changedFromR1: changed,
          r1: changed ? { clip: r1.clip, file: `motion/v17/${id}_normals_v17.glb`, contact: r1.contact, contactEnd: r1.contactEnd, reach: r1.reach, height: r1.height } : undefined }); } }
      else { const top = Math.max(...e.active.map(a => Math.max(...parts.map(p => a.r[p + ':top']?.y ?? -9))));
        OUT[id][slot] = { ...base, origin: m.origin, kind: m.kind, weight: m.weight, role: m.role, frames: m.frames, reachPeak: r4(peakActive.reach), reachPeakFrame: peakActive.frame, strikeAxis: upward ? 'upward' : 'forward', heightPeak: r4(top),
          reachMeans: projectile ? 'surface of the releasing limb (not projectile range; see socket)' : 'striking surface',
          socket: projectile && e.exact.contact.socket ? { bone: e.exact.contact.socket.bone, forward: e.exact.contact.socket.forward, height: e.exact.contact.socket.height, at: 'contact (projectile spawn frame)', space: 'rig root: forward = facing, height above root' } : undefined,
          referenceFrames: { startup: m.startup, active: m.active, recovery: m.recovery }, airborneFrames: m.visual_airborne_frames, projectileSpawnFrame: m.projectile_spawn_frame, cueTrack: m.cue_track, hitstopSuggest: m.hitstop_suggest };
        if (REV) { const r1 = R1C[id][slot], changed = /r2/.test(m.origin);       // file = このクリップが入っているパック。changedFromR1 の技だけ演技が違う
          Object.assign(OUT[id][slot], { file: inR2 ? `motion/v17${REV}/${id}_specials_v17${REV}.glb` : `motion/v17/${id}_specials_v17.glb`, revision: changed ? REV : 'r1', changedFromR1: changed,
            r1: changed ? { clip: r1.clip, file: `motion/v17/${id}_specials_v17.glb`, reach: r1.reach, reachPeak: r1.reachPeak, height: r1.height, heightPeak: r1.heightPeak } : undefined }); } }
      if (issues.length) notes.push(`${id}/${slot}（${m.name_jp}）: ${issues.join(' / ')}`);
      rows.push(kind === 'normals'
        ? `| ${id} | ${slot} | ${m.name_jp} | ${m.attack_limb} | ${reach.toFixed(3)} | ${height.toFixed(3)} | F${e.contact_frame}→F${e.end_frame} | ${e.battleActive} | ${activeReach.map(a => a.reach.toFixed(2)).join(' / ')} | ${activeReach.map(a => a.height.toFixed(2)).join(' / ')} | ${[...(m.revision === REV && REV ? [`${REV}: r2 で接触の姿勢と時計を調整（r1 は高さ ${R1N[id][slot].height.toFixed(3)}）`] : []), ...issues].join(' / ')} |`
        : `| ${id} | ${slot} | ${m.name_jp} | ${/r2/.test(m.origin) ? `r2 で調整（r1 は reach ${R1C[id][slot].reach.toFixed(3)} / 高さ ${R1C[id][slot].height.toFixed(3)}）` : m.origin === 'v17 revised' ? '作り直し' : '据え置き（時計を焼き直し）'} | ${m.kind} / ${m.weight} | ${m.attack_limb} | ${reach.toFixed(3)} | ${peakActive.reach.toFixed(3)} (i=${peakActive.frame}) | ${height.toFixed(3)} | ${OUT[id][slot].socket ? OUT[id][slot].socket.bone + ' ' + OUT[id][slot].socket.forward.toFixed(3) + ' / ' + OUT[id][slot].socket.height.toFixed(3) : ''} | ${e.battleActive} | ${issues.join(' / ')} |`); } }
  return { META, OUT, rows, notes };
}
const HEAD = `// 生成: motion/v17/tools/contacts_exact_v17.mjs — 手で編集しない。実ゲームのページ（WebGL）で、元 GLB のスキンメッシュを**正確なクリップ時刻**に置いて全頂点から実測（補間なし）。
// reach = 攻撃側 root から打撃部位表面の最前頂点までの前方距離 [m]（相手の hurt radius は含まない）。
// height = その頂点の高さ [m]。root 基準の**符号付き**で、0 に丸めていない（空中技で尾や足が root より下へ来る演技は負）。判定側は strikeY = a.y + height。
// activeReach[i] = Battle の持続フレーム i（phase = i/(active-1)、battleActive 枚）に対応する正確時刻の reach / height。
// contact / contactEnd = クリップ正規化時刻。再生契約は v15.1 と同じ（発生 F → contact、持続の最終 F → contactEnd）。`;
{ const { META, OUT, rows, notes } = build('normals'); const D = REV ? R2 : V17, U = REV.toUpperCase();
  fs.writeFileSync(path.join(D, `normal_contacts_v17${REV}.json`), JSON.stringify(OUT, null, 1) + '\n');
  fs.writeFileSync(path.join(D, `normal-contacts-v17${REV}.js`), `// v17 P3 通常技 54 本の接触同期データ（Claude 制作・実測）${REV ? '・' + REV + ' 版（各項目の file がそのクリップの入っているパック。changedFromR1 の技だけ演技が違う）' : ''}。clip は motion/v17/<id>_normals_v17.glb のクリップ名。battleActive は dojo/normal-balance-v151.js の active の写し。\n${HEAD}\nexport const NORMAL_CONTACTS_V17${U}_VERSION=${JSON.stringify(META.version + '-exact')};\nexport const NORMAL_CONTACTS_V17${U}=Object.freeze(${JSON.stringify(OUT, null, 1)});\n`);
  fs.writeFileSync(path.join(D, `CONTACT_TABLE_V17${U}.md`), [`# v17 P3｜54通常技の接触実測表（正確時刻・補間なし）${REV ? '｜' + REV + ' 版' : ''}`, '', '距離は攻撃側 root から打撃部位表面までの前方距離 [m]（hurt radius は含まない）。高さは root 基準の符号付き [m]（空中技は負になり得る）。持続の列は Battle の各 active フレームに対応する正確時刻の値。', '',
    '| キャラ | 技 | 名前 | 攻撃部位 | reach | 高さ | 接触→終わり | 持続F | 持続中の reach | 持続中の高さ | 注意 |', '|---|---|---|---|---|---|---|---|---|---|---|', ...rows, ''].join('\n'));
  console.log('normals ok', rows.length - notes.filter(n => !n.endsWith('未計測')).length, '/ fix', notes.filter(n => !n.endsWith('未計測')).length); console.log(notes.join('\n')); }
{ const { META, OUT, rows, notes } = build('specials');
  const D = REV ? R2 : V17, U = REV.toUpperCase(); const SRC = REV ? `motion/v17${REV}/<id>_specials_v17${REV}.glb（直した体）か motion/v17/<id>_specials_v17.glb（それ以外）。各項目の file を見る` : 'motion/v17/<id>_specials_v17.glb';
  fs.writeFileSync(path.join(D, `special_contacts_v17${REV}.json`), JSON.stringify(OUT, null, 1) + '\n');
  fs.writeFileSync(path.join(D, `special-contacts-v17${REV}.js`), `// v17 P3 必殺 27 本の接触同期データとキュー（Claude 制作・実測）${REV ? '・' + REV + ' 版' : ''}。clip は ${SRC} のクリップ名。\n${HEAD}
// 必殺はクリップが素の時間なので、持続フレーム i の時刻は (接触フレーム + i)/60 秒。reachPeak は持続中の最大。対空は strikeAxis:'upward' で heightPeak（打撃部位のいちばん高い頂点）を見る。
// 飛び道具 6 本: socket = 接触（弾の発生）時刻の fx_anchor 骨の位置 {forward, height}（リグ root 座標。前方 = 向き、高さ = root から）。reach は放つ手・尾の表面で、弾の射程でも発射点でもない。
// cueTrack[] = {at: クリップ秒, type: sfx|vfx|shake, key, trigger: movement|contact, on: always|hit|guard, bone?}。movement は時刻で必ず鳴らす動作音。contact は時刻では鳴らさず Battle の実ヒット／ガードに委譲。
// referenceFrames は現行 balance.js の発生・持続・硬直の写し（変更していない）。hitstopSuggest は提案値。
export const SPECIAL_CONTACTS_V17${U}_VERSION=${JSON.stringify(META.version + '-exact')};\nexport const SPECIAL_CONTACTS_V17${U}=Object.freeze(${JSON.stringify(OUT, null, 1)});\n`);
  fs.writeFileSync(path.join(D, `SPECIAL_TABLE_V17${U}.md`), [`# v17 P3｜27必殺の評価・接触実測表（正確時刻・補間なし）${REV ? '｜' + REV + ' 版' : ''}`, '', '「据え置き（時計を焼き直し）」は v14 と同じ演技の関数を、v17 の契約（当たり姿勢を 2F 早める時間詰めなし）で焼き直したもの。**v14 のクリップとバイト同一ではない**（キーの時刻が違う）。「作り直し」は評価で直した 3 本。',
    'reach は接触時刻、「最大」は持続中のいちばん前（i は持続フレーム）。高さは root 基準の符号付き。飛び道具の「発射ソケット」は fx_anchor 骨の 前方 / 高さ。', '',
    '| キャラ | 技 | 名前 | 扱い | 種類 / 重さ | 攻撃部位 | reach | 最大 | 高さ | 発射ソケット | 持続F | 注意 |', '|---|---|---|---|---|---|---|---|---|---|---|---|', ...rows, ''].join('\n'));
  console.log('specials ok', rows.filter(r => r.endsWith('|  |')).length, '/ fix', notes.filter(n => !n.endsWith('未計測')).length); console.log(notes.join('\n')); }
