#!/usr/bin/env node
// 実測曲線（sample_clips.mjs）から Codex との同期データ NORMAL_CONTACTS を作る。
//   contact / contactEnd : クリップ正規化時刻（0..1）。打撃部位の前方到達がピークになる時刻と、ピーク-2cm 以内を保つ終わり（contact+.06〜+.12 に丸める）
//   reach               : 攻撃側 root（足元 x）から打撃部位の表面までの前方距離 [m]。相手の hurt radius 0.16m は判定側で別途加算
//   activeReach          : contact〜contactEnd を phase 0..1 としたときの実測の伸縮
//   attackPart/attackBone/height : 打撃部位・最前頂点の支配ボーン・床からの高さ
//   status 'ok' | 'fix'  : fix = 見た目の不一致があり、v15.1 でモーションを直す対象（reach は現状の実測のまま＝暫定）
//   node build_contacts.mjs [--dir audit/v15] [--motifs path] [--js out.js] [--json out.json] [--override overrides.json]
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath, pathToFileURL } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i < 0 ? d : process.argv[i + 1]; };
const dir = path.resolve(arg('dir', path.join(HERE, '../audit/v15')));
const { MOTIFS, GESTURES } = await import(pathToFileURL(path.resolve(arg('motifs', path.join(HERE, '../../../dojo/normal-motifs-v15.js')))).href);
const { intended } = await import('./analyze_curves.mjs').catch(() => ({}));
const OVR = arg('override', null) ? JSON.parse(fs.readFileSync(arg('override'))) : {};
// 修正指定（source/fixes_v151.mjs）にある技は、そこで指定した打撃部位を正とする（--nofix で無効。before の監査用）
const PART = t => t === 'tail' || t === 'head' ? t : (t.startsWith('toe') ? 'leg' : 'arm') + t.at(-1);
if (!process.argv.includes('--nofix')) { const { FIXES } = await import('../source/fixes_v151.mjs'); for (const [id, mv] of Object.entries(FIXES)) for (const [slot, F] of Object.entries(mv)) if (MOTIFS[id][slot].gesture === F.gesture) (OVR[id] ||= {})[slot] = { parts: [PART(F.tip), ...(F.tip2 ? [PART(F.tip2)] : [])], ...(OVR[id]?.[slot] || {}) }; }
const SLOTS = ['stand_weak', 'stand_heavy', 'crouch_weak', 'crouch_heavy', 'air_weak', 'air_heavy'];
const BONE = { armL: 'paw.L', armR: 'paw.R', legL: 'foot.L', legR: 'foot.R', tail: 'tail', head: 'head', body: 'chest' };
const r3 = x => +x.toFixed(3);
const OUT = {}, notes = [];
for (const id of Object.keys(MOTIFS)) { const C = JSON.parse(fs.readFileSync(path.join(dir, id + '_curves.json'))); OUT[id] = {};
  for (const slot of SLOTS) { const spec = MOTIFS[id][slot], o = OVR[id]?.[slot] || {}, want = o.parts || (o.part ? [o.part] : intended(GESTURES[spec.gesture])); const S = C['new:' + slot].samples, N = S.length - 1;
    const at = (i, p) => S[i][p]?.[0] ?? -9, parts = ['armL', 'armR', 'legL', 'legR', 'tail', 'head', 'body'];
    const lerp = (u, p) => { const x = Math.max(0, Math.min(N, u * N)), i = Math.min(N - 1, Math.floor(x)); return at(i, p) + (at(i + 1, p) - at(i, p)) * (x - i); };
    // 意図部位のピーク（0.12 以降。構えの初期値を拾わない）
    let pk = { v: -9 }; for (let i = Math.ceil(.12 * N); i <= Math.floor(.9 * N); i++) for (const p of want) if (at(i, p) > pk.v) pk = { v: at(i, p), i, p };
    const front = parts.map(p => [p, at(pk.i, p)]).sort((a, b) => b[1] - a[1])[0];
    const idle = at(0, pk.p), travel = pk.v - idle, y = S[pk.i][pk.p][1];
    const why = [];
    if (front[0] !== pk.p && !want.includes(front[0]) && front[1] - pk.v > .03) why.push(`${front[0]} が ${r3(front[1] - pk.v)}m 先に出ている`);
    if (travel < .08) why.push(`打撃部位の前進が ${r3(travel)}m しかない`);
    if (pk.v < .12) why.push('打撃部位が体より前に出ていない');
    if (y < -.01) why.push(`打撃部位が床下 ${r3(y)}m`);
    const contact = o.contact ?? pk.i / N; let e = pk.i; while (e < N && at(e + 1, pk.p) >= pk.v - .02) e++;
    const contactEnd = o.contactEnd ?? Math.min(.94, Math.max(contact + .06, Math.min(contact + .12, e / N)));
    const lerpY = (u, p) => { const x = Math.max(0, Math.min(N, u * N)), i = Math.min(N - 1, Math.floor(x)); return S[i][p][1] + (S[i + 1][p][1] - S[i][p][1]) * (x - i); };
    const activeReach = [0, .5, 1].map(ph => { const u = contact + (contactEnd - contact) * ph; return { phase: ph, reach: r3(lerp(u, pk.p)), height: r3(Math.max(0, lerpY(u, pk.p))) }; });
    OUT[id][slot] = { contact: r3(contact), contactEnd: r3(contactEnd), attackPart: pk.p, attackBone: BONE[pk.p], bothHands: want.length > 1 || undefined, reach: r3(lerp(contact, pk.p)), height: r3(Math.max(0, lerpY(contact, pk.p))), activeReach,
      status: why.length ? 'fix' : 'ok', issues: why.length ? why : undefined, gesture: spec.gesture, motifContact: spec.contact };
    if (why.length) notes.push(`${id}/${slot} (${spec.gesture}): ${why.join(' / ')}`); } }
// 被弾範囲（root 基準の高さ [m]）。sample_clips.mjs の <id>_bounds.json から。
const HURT = {}; for (const id of Object.keys(MOTIFS)) { const f = path.join(dir, id + '_bounds.json'); if (!fs.existsSync(f)) continue; const b = JSON.parse(fs.readFileSync(f)); const top = k => b[k] ? Math.max(...b[k].samples.map(x => x.p98)) : null;
  const cr = [top('crouch'), top('guard_crouch')].filter(x => x != null);
  HURT[id] = { stand: { bottom: 0, top: r3(Math.max(top('stand'), top('guard_stand') ?? 0)) }, crouch: { bottom: 0, top: r3(Math.max(...cr)) }, detail: { idleTop: top('stand'), guardStandTop: top('guard_stand'), crouchTop: top('crouch'), guardCrouchTop: top('guard_crouch'), idleTopMax: Math.max(...b.stand.samples.map(x => x.max)) } }; }
fs.writeFileSync(path.join(dir, 'normal_hurt_bounds.json'), JSON.stringify(HURT, null, 1) + '\n');
const json = arg('json', path.join(dir, 'normal_contacts.json')); fs.writeFileSync(json, JSON.stringify(OUT, null, 1) + '\n');
const js = arg('js', null);
if (js) fs.writeFileSync(js, `// v15.1 通常技の接触同期データ（Claude 制作・実測）。生成: normal-art/v15_1/tools/build_contacts.mjs — 手で編集しない。
// contact/contactEnd = クリップ正規化時刻。reach = 攻撃側 root から打撃部位表面までの前方距離 [m]（相手の hurt radius .16 は判定側で加算）。
// activeReach = contact〜contactEnd を phase 0..1 としたときの実測の伸縮。各点の height はその時刻の打撃表面（最前頂点）の高さ [m]（root 基準、地上クリップで測定。空中技は攻撃側の y を足す）。
// status 'fix' は見た目の不一致が残る暫定値。
// NORMAL_HURT_BOUNDS = 相手側の被弾範囲の高さ [m]（root 基準）。元GLBのスキン後頂点のうち body+head+leg（腕と尾は除く）の高さ分布から、
//   top = 98パーセンタイル（耳先など上位2%の突起を除く）、bottom = 0（足裏）。stand は idle（4時刻）と guard_stand の高い方、crouch は crouch と guard_crouch の高い方。detail に内訳。
export const NORMAL_CONTACTS_VERSION=${JSON.stringify(arg('ver', '15.1-audit'))};
export const NORMAL_CONTACTS=Object.freeze(${JSON.stringify(OUT, null, 1)});
export const NORMAL_HURT_BOUNDS=Object.freeze(${JSON.stringify(HURT, null, 1)});
`);
console.log('ok', Object.values(OUT).flatMap(Object.values).filter(x => x.status === 'ok').length, '/ fix', notes.length); console.log(notes.join('\n'));
