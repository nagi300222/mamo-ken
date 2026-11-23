#!/usr/bin/env python3
"""スクリーンショットを格子に並べる: grid.py OUT.jpg COLS WIDTH file1 file2 ...（ファイル名をラベルにする）"""
import sys, os
from PIL import Image, ImageDraw, ImageFont
out, cols, W = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]); files = sys.argv[4:]
F = ImageFont.truetype('/usr/share/fonts/opentype/ipafont-gothic/ipag.ttf', 14) if os.path.exists('/usr/share/fonts/opentype/ipafont-gothic/ipag.ttf') else ImageFont.load_default()
ims = [Image.open(f).convert('RGB') for f in files]; H = int(W * ims[0].size[1] / ims[0].size[0]); rows = (len(ims) + cols - 1) // cols
sheet = Image.new('RGB', (cols * W, rows * (H + 18)), (16, 22, 30)); d = ImageDraw.Draw(sheet)
for i, (im, f) in enumerate(zip(ims, files)):
    x, y = (i % cols) * W, (i // cols) * (H + 18); sheet.paste(im.resize((W, H)), (x, y + 18)); d.text((x + 4, y + 2), os.path.splitext(os.path.basename(f))[0], fill=(255, 220, 140), font=F)
sheet.save(out, quality=86); print(out, sheet.size)
