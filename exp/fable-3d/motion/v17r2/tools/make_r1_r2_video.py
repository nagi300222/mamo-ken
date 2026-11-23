#!/usr/bin/env python3
"""r2 で直した 7 本の「修正前 r1（v17）| 修正後 r2」比較動画と、接触フレームの静止画シートを作る。
素材は motion/v17/tools/capture_compare.mjs の連番（実ゲームの対戦カメラ、1/60 秒刻み = 仮想時間の 60fps。実機の fps ではない）。
相手の位置は左右同じ: 対空 5 本は地上の最小の押し合い距離 0.34m、ハクマ s3 とタキマルしゃがみ強は r2 の実測 reach + 0.16m。
  make_r1_r2_video.py CAPTURE_DIR OUT_DIR      # CAPTURE_DIR/{r1,r2}/<id>/<slot>（必殺）と {n1,n2}/takimaru/crouch_heavy（通常）"""
import sys, os, json, glob, subprocess, tempfile
from PIL import Image, ImageDraw, ImageFont
CAP, OUT = sys.argv[1], sys.argv[2]; HERE = os.path.dirname(os.path.abspath(__file__)); R2 = os.path.join(HERE, '..'); os.makedirs(OUT, exist_ok=True)
S = json.load(open(os.path.join(R2, 'special_contacts_v17r2.json'))); N = json.load(open(os.path.join(R2, 'normal_contacts_v17r2.json')))
S1 = json.load(open(os.path.join(R2, '..', 'v17', 'special_contacts_v17.json'))); N1 = json.load(open(os.path.join(R2, '..', 'v17', 'normal_contacts_v17.json')))
F = ImageFont.truetype('/usr/share/fonts/opentype/ipafont-gothic/ipag.ttf', 13)
# (id, 撮影時の枠, 表示名, r1 の項目, r2 の項目, 素材の場所 r1/r2, 相手の距離の説明)
ITEMS = [(i, 'stand_heavy', 's2', S1[i]['s2'], S[i]['s2'], 'r1', 'r2', '相手は最小距離 0.34m') for i in ('moguzo', 'godan', 'takimaru', 'yomikage', 'bullet')]
ITEMS += [('hakuma', 'crouch_weak', 's3', S1['hakuma']['s3'], S['hakuma']['s3'], 'r1', 'r2', '相手は r2 reach+0.16m'), ('takimaru', 'crouch_heavy', 'しゃがみ強', N1['takimaru']['crouch_heavy'], N['takimaru']['crouch_heavy'], 'n1', 'n2', '相手は r2 reach+0.16m')]
def label(c): a = c['activeReach']; return f"接触 reach {c['reach']:.3f} 高さ {c['height']:.3f} → 持続終わり {a[-1]['reach']:.3f} / {a[-1]['height']:.3f}"
stills = []; HD = 58
with tempfile.TemporaryDirectory() as td:
    n = 0
    for cid, slot, nm, c1, c2, d1, d2, foe in ITEMS:
        fb = sorted(glob.glob(f'{CAP}/{d1}/{cid}/{slot}/*.png')); fa = sorted(glob.glob(f'{CAP}/{d2}/{cid}/{slot}/*.png'))
        if not fb or not fa: print('missing', cid, slot); continue
        w, h = Image.open(fa[0]).size; L = max(len(fb), len(fa)); k1 = 6 + round(c1['contactSeconds'] * 60); k2 = 6 + round(c2['contactSeconds'] * 60)       # 連番は 6F の構えから始まる
        def frame(k, mark):
            fr = Image.new('RGB', (w * 2 + 4, h + HD), (16, 22, 30)); d = ImageDraw.Draw(fr)
            fr.paste(Image.open(fb[min(k, len(fb) - 1)]).convert('RGB'), (0, HD)); fr.paste(Image.open(fa[min(k, len(fa) - 1)]).convert('RGB'), (w + 4, HD))
            for x, col, ver, c, kk in ((6, (190, 200, 215), '修正前 r1（v17）', c1, k1), (w + 10, (255, 220, 140), '修正後 r2', c2, k2)):
                d.text((x, 3), f"{ver}  {cid} {nm}「{c['name']}」", fill=col, font=F); d.text((x, 21), f"clip {c['clip']}   {foe}", fill=col, font=F); d.text((x, 39), label(c) + ('  ◀ 接触' if mark and k == kk else ''), fill=col, font=F)
            return fr
        for k in list(range(L)) + [L - 1] * 12:
            fr = frame(k, True); fr.save(f'{td}/{n:05d}.png'); n += 1
            if k in (k1, k2):
                for _ in range(24): fr.save(f'{td}/{n:05d}.png'); n += 1          # 接触の瞬間は 0.4 秒止めて見せる（映像上の静止。クリップの長さではない）
        # 静止画: 左 = r1 の接触フレーム、右 = r2 の接触フレーム（それぞれ自分の接触時刻）
        st = Image.new('RGB', (w * 2 + 4, h + HD), (16, 22, 30)); a = frame(k1, False); b = frame(k2, False); st.paste(a.crop((0, 0, w, h + HD)), (0, 0)); st.paste(b.crop((w + 4, 0, w * 2 + 4, h + HD)), (w + 4, 0)); stills.append(st)
    out = f'{OUT}/r1_vs_r2_7clips.mp4'
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', '60', '-i', f'{td}/%05d.png', '-vf', 'pad=ceil(iw/2)*2:ceil(ih/2)*2', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '24', out], check=True); print(n, 'frames', os.path.getsize(out) // 1000, 'KB')
if stills:
    sc = 1.0; ts = [s.resize((int(s.size[0] * sc), int(s.size[1] * sc)), Image.LANCZOS) for s in stills]; sh = Image.new('RGB', (ts[0].size[0], sum(t.size[1] for t in ts)), (16, 22, 30)); y = 0
    for t in ts: sh.paste(t, (0, y)); y += t.size[1]
    sh.save(f'{OUT}/r1_vs_r2_contact_frames.jpg', quality=86); print('sheet', sh.size)
