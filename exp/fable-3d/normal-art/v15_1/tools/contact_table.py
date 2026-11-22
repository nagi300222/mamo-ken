#!/usr/bin/env python3
"""before(audit/v15) / after(audit/v151) の接触メタデータを 54 行の表にする → evidence/CONTACT_TABLE.md"""
import json, os
H = os.path.join(os.path.dirname(__file__), '..'); b = json.load(open(f'{H}/audit/v15/normal_contacts.json')); a = json.load(open(f'{H}/audit/v151/normal_contacts.json'))
OLD = dict(stand_weak=.39, stand_heavy=.54, crouch_weak=.39, crouch_heavy=.57, air_weak=.42, air_heavy=.49)
JP = dict(armL='左手', armR='右手', legL='左足', legR='右足', tail='尾', head='頭')
N = dict(moguzo='モグゾー', pisuke='ピスケ', godan='ゴダン', hakuma='ハクマ', chirka='チルカ', takimaru='タキマル', yomikage='ヨミカゲ', bullet='バレット', dark_moguzo='ダークモグゾー')
S = dict(stand_weak='立弱', stand_heavy='立強', crouch_weak='屈弱', crouch_heavy='屈強', air_weak='空弱', air_heavy='空強')
o = ['# マモ拳 v15.1｜54通常技の接触実測表', '', '距離はすべて攻撃側 root から打撃部位の表面までの前方距離 [m]（相手の hurt radius 0.16m は含まない）。',
     '`旧判定` は PR195 時点の Battle reach。`差` = 旧判定 − 実測（正なら「見た目より判定が長い＝透明リーチ」、負なら「見た目のほうが長い」）。', '`修正` 欄が ● の技は v15.1 でモーションを直した技。', '']
for i in a:
    o += [f'## {N[i]}', '', '| 技 | 修正 | before 部位 / 前方 | after 部位 / reach | 高さ | contact → End | activeReach (0/.5/1) | 旧判定 | 差 |', '|---|---|---|---|---|---|---|---|---|']
    for s in a[i]:
        x, y = b[i][s], a[i][s]; old = OLD[s] + (.045 if i in ('godan', 'takimaru') else 0); fixed = x['gesture'] != y['gesture'] or x.get('status') == 'fix'
        o.append(f"| {S[s]} `{y['gesture']}` | {'●' if fixed else ''} | {JP[x['attackPart']]} {x['reach']:.2f}{' ⚠' if x.get('status') == 'fix' else ''} | {JP[y['attackPart']]}{'（両手）' if y.get('bothHands') else ''} **{y['reach']:.2f}** | {y['height']:.2f} | {y['contact']:.2f} → {y['contactEnd']:.2f} | {' / '.join('%.2f' % p['reach'] for p in y['activeReach'])} | {old:.3f} | {old - y['reach']:+.2f} |")
    o.append('')
open(f'{H}/evidence/CONTACT_TABLE.md', 'w').write('\n'.join(o)); print('rows', sum(len(v) for v in a.values()))
