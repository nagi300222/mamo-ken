#!/usr/bin/env python3
"""統合ビルドで measure_normals.mjs を回した結果を NORMAL_CONTACTS と照合する。
check_integration.py MEASURE_DIR CONTACTS.json  → ヒットした戦闘フレーム、その瞬間の打撃部位の実測前方距離、契約 reach との差、最前部位"""
import sys, json, os
D, C = sys.argv[1], json.load(open(sys.argv[2])); bad = 0; rows = []
for i in C:
    f = f'{D}/{i}.json'
    if not os.path.exists(f): continue
    M = json.load(open(f))['moves']
    for s, c in C[i].items():
        m = M[s]; part = c['attackPart']; parts = [part] + (['armL', 'armR'] if c.get('bothHands') else [])
        fr = {x['f']: x for x in m['frames'] if x['act']}
        st = fr.get(m['startup']); 
        if not st: rows.append((i, s, 'NO STARTUP FRAME')); bad += 1; continue
        ext = max(st['ex'][p]['fwd'] for p in parts if p in st['ex']); front = max(((k, v['fwd']) for k, v in st['ex'].items() if not k.endswith('_lo')), key=lambda t: t[1])
        peak = max(((x['f'], max(x['ex'][p]['fwd'] for p in parts if p in x['ex'])) for x in fr.values()), key=lambda t: t[1])
        hit = m['hit']; d = ext - c['reach']; ok = abs(d) <= .02 and hit and hit['frame'] == m['startup'] and (front[0] in parts or front[1] - ext < .03)
        bad += not ok
        rows.append((i, s, f"S{m['startup']} hit@{hit['frame'] if hit else None} {part} 実測{ext:.3f} 契約{c['reach']:.3f} 差{d:+.3f} ピークF{peak[0]}({peak[1]:.3f}) 最前={front[0]} {front[1]:.3f} {'OK' if ok else '<<< 要確認'}"))
for r in rows: print(*r)
print('checked', len(rows), 'mismatch', bad)
