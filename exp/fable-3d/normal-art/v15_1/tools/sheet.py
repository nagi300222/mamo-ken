#!/usr/bin/env python3
"""before/after の接触姿勢シートを作る。 sheet.py OUT.jpg --rows id[,id] --before DIR --after DIR [--slots ...]
before = 実ゲームで最大間合いヒットさせたヒットストップ画（measure_normals の *_hit.png）、after = pose_shots の *_c.png"""
import sys, os, json
from PIL import Image, ImageDraw, ImageFont
a = sys.argv; out = a[1]; g = lambda k, d=None: a[a.index('--' + k) + 1] if '--' + k in a else d
ids = g('rows').split(','); slots = g('slots', 'stand_weak,stand_heavy,crouch_weak,crouch_heavy,air_weak,air_heavy').split(',')
B, A = g('before'), g('after'); cb = json.load(open(g('cbefore'))) if g('cbefore') else None; ca = json.load(open(g('cafter'))) if g('cafter') else None
BOX = (500, 230, 1090, 720); W, H = 295, 245
F = ImageFont.truetype('/usr/share/fonts/opentype/ipafont-gothic/ipag.ttf', 15) if os.path.exists('/usr/share/fonts/opentype/ipafont-gothic/ipag.ttf') else ImageFont.load_default()
cols = [c for c in ((B, 'before', cb), (A, 'after', ca)) if c[0]]
sheet = Image.new('RGB', (len(slots) * W * len(cols) // (1 if len(ids) > 1 else 1), len(ids) * (H + 22)), (18, 24, 34)) if False else Image.new('RGB', (len(slots) * W, len(ids) * len(cols) * (H + 22)), (18, 24, 34))
d = ImageDraw.Draw(sheet)
for r, i in enumerate(ids):
    for ci, (D, tag, C) in enumerate(cols):
        y = (r * len(cols) + ci) * (H + 22)
        for s, slot in enumerate(slots):
            f = next((p for p in (f'{D}/{i}/{slot}_c.png', f'{D}/{i}/{slot}_hit.png', f'{D}/{i}/{slot}_nohit.png') if os.path.exists(p)), None)
            if f: sheet.paste(Image.open(f).convert('RGB').crop(BOX).resize((W, H)), (s * W, y + 22))
            m = C[i][slot] if C else None
            t = f'{i} {slot} [{tag}]' + (f"  {m['attackPart']} {m['reach']:.2f}m" + (' !' if m.get('status') == 'fix' else '') if m else '') + (' NOHIT' if f and 'nohit' in f else '')
            d.text((s * W + 4, y + 3), t, fill=(255, 220, 140) if tag == 'after' else (190, 200, 215), font=F)
sheet.save(out, quality=88); print(out, sheet.size)
