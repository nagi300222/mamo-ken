#!/usr/bin/env python3
"""capture_specials.mjs の連番から、キャラごとの監査用コンタクトシート（s1/s2/s3/奥義 × 8コマ）を作る。
  audit_sheet.py CAPTURE_DIR OUT_DIR [ids]"""
import sys, os, json
from PIL import Image, ImageDraw
cap, out = sys.argv[1], sys.argv[2]; log = json.load(open(os.path.join(cap, 'capture_log.json')))['log']; os.makedirs(out, exist_ok=True)
ids = sys.argv[3].split(',') if len(sys.argv) > 3 else sorted({e['id'] for e in log}, key=[e['id'] for e in log].index)
CROP = (152, 44, 640, 376); W = 244; N = 8
for cid in ids:
    rows = []
    for e in [e for e in log if e['id'] == cid]:
        d = os.path.join(cap, cid, e['mv']); fs = sorted(os.listdir(d)); tot = e['startup'] + e['active'] + e['recovery']
        if e['mv'] == 'ultimate' and e.get('movie'): idx = [0, e['startup'], e['startup'] + 4] + [round(e['startup'] + 8 + i * (len(fs) - 1 - e['startup'] - 8) / 4) for i in range(5)]
        else:
            st = e['startup']; idx = sorted({0, max(1, st // 2), max(2, st - 2), st + 1, st + e['active'], st + e['active'] + e['recovery'] // 3, st + e['active'] + 2 * e['recovery'] // 3, min(len(fs) - 1, tot + (30 if e['kind'] == 'projectile' else 2))})
            while len(idx) < N: idx.append(idx[-1])
        ims = []
        for i in idx[:N]:
            im = Image.open(os.path.join(d, fs[min(i, len(fs) - 1)])).convert('RGB')
            im = im.crop(CROP) if not (e['mv'] == 'ultimate' and e.get('movie') and i > e['startup'] + 3) else im
            im = im.resize((W, round(W * 332 / 488))); dr = ImageDraw.Draw(im); dr.rectangle((0, 0, 44, 11), fill=(0, 0, 0)); dr.text((2, 0), 'F%d' % i, fill=(255, 255, 0)); ims.append(im)
        rows.append((e, ims))
    H = rows[0][1][0].height; S = Image.new('RGB', (W * N, (H + 14) * len(rows)), (16, 18, 22)); dr = ImageDraw.Draw(S)
    for j, (e, ims) in enumerate(rows):
        dr.text((4, j * (H + 14) + 1), '%s %s  kind=%s  startup=%d active=%d recovery=%d  clip=%s  dist=%.2f' % (cid, e['mv'], e['kind'], e['startup'], e['active'], e['recovery'], e.get('clip'), e['dist']), fill=(230, 230, 230))
        for i, im in enumerate(ims): S.paste(im, (i * W, j * (H + 14) + 14))
    p = os.path.join(out, cid + '.jpg'); S.save(p, quality=84); print(p, S.size)
