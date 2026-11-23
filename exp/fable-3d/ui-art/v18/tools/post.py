#!/usr/bin/env python3
"""render_outputs.mjs の後処理。Chromium が描いた 2 倍の透過 PNG（1280x480）から配布用を作る。
  mode-<id>.webp        1280x480  透過 WebP（主に使う。小さい）
  mode-<id>.png         640x240   透過 PNG（WebP を使わない場合の予備。フルカラー）
  mode-<id>@thumb.png   180x80    縮小しても見分けられるかの確認用（右寄せで切ってから縮小）
  mode-vs-large は 960x720 / 480x360（大きい対戦カード用。thumb なし）
減色（256 色）はグラデーションに縞が出たのでやめた。"""
import os
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, '..', 'png')
for m, (w, h) in dict(vs=(640, 240), practice=(640, 240), arcade=(640, 240), survival=(640, 240), story=(640, 240), **{'vs-large': (480, 360)}).items():
    raw = os.path.join(OUT, 'mode-%s.raw.png' % m); im = Image.open(raw).convert('RGBA'); assert im.size == (w * 2, h * 2), im.size
    im.save(os.path.join(OUT, 'mode-%s.webp' % m), 'WEBP', quality=84, method=6)
    im.resize((w, h), Image.LANCZOS).save(os.path.join(OUT, 'mode-%s.png' % m), optimize=True); out = ['.webp', '.png']
    if h == 240: im.crop((1280 - 1080, 0, 1280, 480)).resize((180, 80), Image.LANCZOS).save(os.path.join(OUT, 'mode-%s@thumb.png' % m), optimize=True); out.append('@thumb.png')
    print(m, *[os.path.getsize(os.path.join(OUT, 'mode-%s%s' % (m, e))) for e in out])
