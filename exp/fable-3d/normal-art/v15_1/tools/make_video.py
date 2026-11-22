#!/usr/bin/env python3
"""pose_shots の連番（--us で 13 点）から、キャラごとの before | after 比較動画を作る。
make_video.py --before DIR --after DIR --out DIR [--ids ...]   相手は両方とも「after の実測 reach + 0.16m」に立たせて撮る。"""
import sys, os, subprocess, tempfile, json
from PIL import Image, ImageDraw, ImageFont
a = sys.argv; g = lambda k, d=None: a[a.index('--' + k) + 1] if '--' + k in a else d
B, A, OUT = g('before'), g('after'), g('out'); os.makedirs(OUT, exist_ok=True)
ids = g('ids', 'moguzo,pisuke,godan,hakuma,chirka,takimaru,yomikage,bullet,dark_moguzo').split(',')
US = '0,0.08,0.16,0.24,0.32,0.4,0.48,0.56,0.64,0.72,0.8,0.9,1'.split(','); SLOTS = 'stand_weak,stand_heavy,crouch_weak,crouch_heavy,air_weak,air_heavy'.split(',')
JP = dict(stand_weak='立ち弱', stand_heavy='立ち強', crouch_weak='しゃがみ弱', crouch_heavy='しゃがみ強', air_weak='空中弱', air_heavy='空中強')
C = json.load(open(g('contacts'))); BOX = (470, 200, 1110, 720); W, H = 480, 390
F = ImageFont.truetype('/usr/share/fonts/opentype/ipafont-gothic/ipag.ttf', 20)
for i in ids:
    with tempfile.TemporaryDirectory() as td:
        n = 0
        for s in SLOTS:
            c = C[i][s]
            for u in US + [US[-1]] * 2:
                fr = Image.new('RGB', (W * 2, H + 36), (18, 24, 34)); d = ImageDraw.Draw(fr)
                for k, D in enumerate((B, A)):
                    p = f'{D}/{i}/{s}_{u}.png'
                    if os.path.exists(p): fr.paste(Image.open(p).convert('RGB').crop(BOX).resize((W, H)), (k * W, 36))
                hit = c['contact'] - .04 <= float(u) <= c['contactEnd'] + .04
                d.text((8, 7), f'{i} {JP[s]}  before（PR195）', fill=(190, 200, 215), font=F)
                d.text((W + 8, 7), f"after（v15.1） {c['attackPart']} reach {c['reach']:.2f}m" + ('  ◀ contact' if hit else ''), fill=(255, 220, 140), font=F)
                fr.save(f'{td}/{n:04d}.png'); n += 1
                if hit:
                    for _ in range(3): fr.save(f'{td}/{n:04d}.png'); n += 1
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', '9', '-i', f'{td}/%04d.png', '-vf', 'pad=ceil(iw/2)*2:ceil(ih/2)*2', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '27', f'{OUT}/{i}_normals_before_after.mp4'], check=True)
        print(i, n, 'frames')
