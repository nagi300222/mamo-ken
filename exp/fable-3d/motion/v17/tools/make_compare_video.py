#!/usr/bin/env python3
"""capture_compare.mjs の連番から、キャラごとの通常技 before | after 比較動画を作る（60fps = 仮想時間の 1/60 秒刻み。実機の fps ではない）。
左 = 現行の 54 本（v15_<slot>）、右 = v17。相手は両方とも「v17 の実測 reach + 0.16m」に立たせている。
  make_compare_video.py --before DIR --after DIR --contacts normal_contacts_v17.json --meta normals_v17.json --out DIR [--ids ...]"""
import sys, os, json, subprocess, tempfile, glob
from PIL import Image, ImageDraw, ImageFont
a = sys.argv; g = lambda k, d=None: a[a.index('--' + k) + 1] if '--' + k in a else d
B, A, OUT = g('before'), g('after'), g('out'); os.makedirs(OUT, exist_ok=True); C = json.load(open(g('contacts'))); M = json.load(open(g('meta')))['characters']
ids = g('ids', ','.join(C)).split(','); SLOTS = 'stand_weak stand_heavy crouch_weak crouch_heavy air_weak air_heavy'.split()
JP = dict(stand_weak='立ち弱', stand_heavy='立ち強', crouch_weak='しゃがみ弱', crouch_heavy='しゃがみ強', air_weak='空中弱', air_heavy='空中強')
F = ImageFont.truetype('/usr/share/fonts/opentype/ipafont-gothic/ipag.ttf', 17)
for i in ids:
    with tempfile.TemporaryDirectory() as td:
        n = 0
        for s in SLOTS:
            fb = sorted(glob.glob(f'{B}/{i}/{s}/*.png')); fa = sorted(glob.glob(f'{A}/{i}/{s}/*.png'))
            if not fb or not fa: print('missing', i, s); continue
            c = C[i][s]; m = M[i][s]; ca = 6 + m['contact_frame']; L = max(len(fb), len(fa)); w, h = Image.open(fa[0]).size
            for k in list(range(L)) + [L - 1] * 10:
                fr = Image.new('RGB', (w * 2 + 4, h + 30), (16, 22, 30)); d = ImageDraw.Draw(fr)
                fr.paste(Image.open(fb[min(k, len(fb) - 1)]).convert('RGB'), (0, 30)); fr.paste(Image.open(fa[min(k, len(fa) - 1)]).convert('RGB'), (w + 4, 30))
                hit = ca <= k <= ca + m['contact_hold_frames']
                d.text((6, 6), f'{i} {JP[s]}  現行 v15', fill=(190, 200, 215), font=F)
                d.text((w + 10, 6), f"v17「{m['name_jp']}」 {c['attackLimb']} reach {c['reach']:.2f}m" + ('  ◀ 接触' if hit else ''), fill=(255, 220, 140), font=F)
                fr.save(f'{td}/{n:05d}.png'); n += 1
                if hit and k == ca:
                    for _ in range(18): fr.save(f'{td}/{n:05d}.png'); n += 1          # 接触の瞬間は 0.3 秒止めて見せる（映像上の静止。クリップの長さではない）
        out = f'{OUT}/{i}_normals_v15_vs_v17.mp4'
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', '60', '-i', f'{td}/%05d.png', '-vf', 'pad=ceil(iw/2)*2:ceil(ih/2)*2', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '24', out], check=True)
        print(i, n, 'frames', os.path.getsize(out) // 1000, 'KB')
