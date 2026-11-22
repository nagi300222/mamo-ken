#!/usr/bin/env python3
"""連番PNGからコンタクトシートを作る: sheet.py DIR OUT.jpg [--n 8] [--crop x,y,w,h] [--frames 0,5,9] [--w 320]"""
import sys, os, argparse
from PIL import Image, ImageDraw
ap = argparse.ArgumentParser(); ap.add_argument('dir'); ap.add_argument('out'); ap.add_argument('--n', type=int, default=8); ap.add_argument('--crop', default='')
ap.add_argument('--frames', default=''); ap.add_argument('--w', type=int, default=320); ap.add_argument('--cols', type=int, default=4); ap.add_argument('--upto', type=int, default=0)
a = ap.parse_args(); fs = sorted(f for f in os.listdir(a.dir) if f.endswith('.png'))
if a.upto: fs = fs[:a.upto]
idx = [int(x) for x in a.frames.split(',')] if a.frames else [round(i * (len(fs) - 1) / (a.n - 1)) for i in range(a.n)]
ims = []
for i in idx:
    im = Image.open(os.path.join(a.dir, fs[min(i, len(fs) - 1)])).convert('RGB')
    if a.crop: x, y, w, h = map(int, a.crop.split(',')); im = im.crop((x, y, x + w, y + h))
    im = im.resize((a.w, round(im.height * a.w / im.width))); ImageDraw.Draw(im).text((4, 2), 'f%d' % i, fill=(255, 255, 0)); ims.append(im)
rows = (len(ims) + a.cols - 1) // a.cols; W, H = ims[0].size; S = Image.new('RGB', (W * a.cols, H * rows), (20, 20, 20))
for k, im in enumerate(ims): S.paste(im, ((k % a.cols) * W, (k // a.cols) * H))
os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True); S.save(a.out, quality=85); print(a.out, S.size)
