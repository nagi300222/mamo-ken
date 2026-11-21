"""capture.mjs から呼ばれる画像合成（Pillow）。"""
import sys, os, json
from PIL import Image, ImageDraw, ImageFont
ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')); REPO = os.path.normpath(os.path.join(ROOT, '..', '..'))
def font(sz):
    for p in ('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc', '/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc', '/usr/share/fonts/opentype/ipafont-gothic/ipag.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'):
        if os.path.exists(p): return ImageFont.truetype(p, sz)
    return ImageFont.load_default()
def label(im, text, sz=16):
    d = ImageDraw.Draw(im); d.rectangle([0, 0, im.width, sz + 10], fill=(18, 20, 26)); d.text((8, 4), text, fill=(230, 232, 236), font=font(sz)); return im
def hstack(ims, bg=(35, 38, 46)):
    h = max(i.height for i in ims); out = Image.new('RGB', (sum(i.width for i in ims), h), bg); x = 0
    for i in ims: out.paste(i, (x, 0)); x += i.width
    return out
mode = sys.argv[1]
if mode == 'turnaround':
    cid, out = sys.argv[2:4]; ims = [label(Image.open(os.path.join(out, n + '.png')).convert('RGB'), t) for n, t in (('front', 'front'), ('side', 'side (game view)'), ('three_quarter', 'three quarter'), ('back', 'back'))]
    hstack(ims).save(os.path.join(out, 'turnaround.png'))
elif mode == 'compare':
    cid, tmp, out = sys.argv[2:5]; ref = Image.open(os.path.join(REPO, 'assets', 'portraits', cid + '.png')).convert('RGBA'); H = 600
    bg = Image.new('RGBA', ref.size, (35, 38, 46, 255)); bg.alpha_composite(ref); r = bg.convert('RGB'); r = r.resize((int(r.width * (H - 40) / r.height), H - 40), Image.LANCZOS)
    cell = Image.new('RGB', (max(r.width + 20, 480), H), (35, 38, 46)); cell.paste(r, ((cell.width - r.width) // 2, 34))
    a = Image.open(os.path.join(tmp, cid + '_refangle.png')).convert('RGB'); g = Image.open(os.path.join(out, 'side.png')).convert('RGB')
    hstack([label(cell, '元絵 assets/portraits/%s.png' % cid), label(a, '3D（元絵に近い角度・idle F0）'), label(g, '3D ゲーム視点（横・idle F0）')]).save(os.path.join(out, 'compare.png'))
elif mode == 'facing':
    cid, tmp, out = sys.argv[2:5]
    hstack([label(Image.open(os.path.join(tmp, '%s_%s.png' % (cid, n))).convert('RGB'), t) for n, t in (('right', '右向き（1P）'), ('left_mirror', '左向き: ミラー scale.z=-1'), ('left_rot', '左向き: 回転 rotation.y=π'))]).save(os.path.join(out, 'facing.png'))
elif mode == 'sheet':
    cid, title, rows, out = sys.argv[2:6]; rows = json.loads(rows); strips = []
    for text, files in rows: strips.append(label(hstack([Image.open(f).convert('RGB') for f in files]), text, 15))
    W = strips[0].width; S = Image.new('RGB', (W, sum(s.height for s in strips) + 34), (18, 20, 26)); ImageDraw.Draw(S).text((8, 6), '%s  %s%s' % (cid, title, '' if '左から' in title else '   （左から: ゲーム視点 / 斜め前 / 正面 / 斜め後ろ）'), fill=(224, 161, 58), font=font(17)); y = 34
    for s in strips: S.paste(s, (0, y)); y += s.height
    S.save(out, optimize=True)
    for _, files in rows:
        for f in files: os.remove(f)
elif mode == 'tojpg':            # リポジトリを重くしないよう、確認用画像は JPEG にする
    d = sys.argv[2]
    for f in sorted(os.listdir(d)):
        if f.endswith('.png'):
            im = Image.open(os.path.join(d, f)).convert('RGB')
            if os.path.basename(os.path.normpath(d)) == 'deform' and im.width > 1080: im = im.resize((1080, int(im.height * 1080 / im.width)), Image.LANCZOS)   # 変形シートは枚数が多いので縮小
            im.save(os.path.join(d, f[:-4] + '.jpg'), quality=82 if 'deform' in d else 88, optimize=True); os.remove(os.path.join(d, f))
elif mode == 'grid':             # 9体ぶんの比較画像・四方向画像を1枚にまとめる
    kind, out = sys.argv[2:4]; ids = ['moguzo', 'pisuke', 'godan', 'hakuma', 'chirka', 'takimaru', 'yomikage', 'bullet', 'dark_moguzo']; ims = []
    for cid in ids:
        im = Image.open(os.path.join(ROOT, 'chars', cid, 'renders', kind + '.jpg')).convert('RGB'); W = 1100 if kind == 'compare' else 1200
        im = im.resize((W, int(im.height * W / im.width)), Image.LANCZOS); d = ImageDraw.Draw(im); d.rectangle([W - 190, 0, W, 26], fill=(224, 161, 58)); d.text((W - 182, 4), cid, fill=(20, 16, 0), font=font(16)); ims.append(im)
    cols = 1 if kind == 'turnaround' else 3; rows = (len(ims) + cols - 1) // cols; w = ims[0].width; h = max(i.height for i in ims); S = Image.new('RGB', (w * cols, h * rows), (35, 38, 46))
    for i, im in enumerate(ims): S.paste(im, ((i % cols) * w, (i // cols) * h))
    S.save(os.path.join(out, kind + '_all.jpg'), quality=86, optimize=True)
elif mode == 'cells':            # ラベルつきの小さな画像を格子に並べる（モーションv2の一覧）
    cid, cells, out = sys.argv[2:5]; cells = json.loads(cells); ims = []
    for text, f in cells:
        im = Image.open(f).convert('RGB'); d = ImageDraw.Draw(im); d.rectangle([0, 0, im.width, 22], fill=(18, 20, 26)); d.text((6, 3), text, fill=(230, 232, 236), font=font(13)); ims.append(im); os.remove(f)
    cols = 7; w, h = ims[0].size; rows = (len(ims) + cols - 1) // cols; S = Image.new('RGB', (w * cols, h * rows + 30), (18, 20, 26)); ImageDraw.Draw(S).text((8, 6), '%s  モーションv2 一覧（ゲーム視点、各クリップの要所1フレーム）' % cid, fill=(224, 161, 58), font=font(16))
    for i, im in enumerate(ims): S.paste(im, ((i % cols) * w, 30 + (i // cols) * h))
    S.save(out, quality=84, optimize=True)
