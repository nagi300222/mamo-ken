#!/usr/bin/env python3
"""新旧比較の動画を作る。
  make_before_after.py specials OLD_CAPTURE NEW_CAPTURE OUT_DIR ids      … 対戦画面の必殺 s1/s2/s3（上=旧, 下=新, 0.5倍速）
  make_before_after.py ultimate OLD_CAPTURE NEW_FRAMES_DIR OUT.mp4 id    … 奥義ムービー（上=旧 v13 の実ゲーム録画, 下=新 10秒版）"""
import sys, os, json, subprocess, tempfile, shutil
from PIL import Image, ImageDraw, ImageFont
F = ImageFont.truetype('/usr/share/fonts/opentype/ipafont-gothic/ipag.ttf', 15)
def label(im, text, color=(255, 230, 120)):
    d = ImageDraw.Draw(im); w = d.textlength(text, font=F); d.rectangle((0, 0, w + 10, 20), fill=(0, 0, 0)); d.text((5, 2), text, font=F, fill=color); return im
def enc(tmp, out, fps):
    os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
    subprocess.check_call(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', str(fps), '-i', os.path.join(tmp, '%05d.png'), '-vf', 'pad=ceil(iw/2)*2:ceil(ih/2)*2', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '27', '-movflags', '+faststart', out]); print(out, os.path.getsize(out))
mode = sys.argv[1]
if mode == 'specials':
    old, new, outdir, ids = sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5].split(','); CROP = (152, 44, 640, 376)
    lo = {(e['id'], e['mv']): e for e in json.load(open(os.path.join(old, 'capture_log.json')))['log']}; ln = {(e['id'], e['mv']): e for e in json.load(open(os.path.join(new, 'capture_log.json')))['log']}
    for cid in ids:
        tmp = tempfile.mkdtemp(); n = 0
        for mv in ('s1', 's2', 's3'):
            eo, en = lo[(cid, mv)], ln[(cid, mv)]; fo = sorted(os.listdir(os.path.join(old, cid, mv))); fn = sorted(os.listdir(os.path.join(new, cid, mv))); N = min(len(fo), len(fn)); tot = eo['startup'] + eo['active'] + eo['recovery']
            for i in list(range(N)) + [N - 1] * 12:
                a = Image.open(os.path.join(old, cid, mv, fo[i])).convert('RGB').crop(CROP); b = Image.open(os.path.join(new, cid, mv, fn[i])).convert('RGB').crop(CROP)
                S = Image.new('RGB', (a.width, a.height * 2 + 4), (255, 200, 80)); S.paste(label(a, '旧  %s %s「%s」 %s  F%d/%d%s' % (cid, mv, eo['name'], eo['clip'], i, tot, '  ◀当たり' if eo['startup'] <= i < eo['startup'] + eo['active'] else '')), (0, 0))
                S.paste(label(b, '新  %s  （発生%d 持続%d 硬直%d は同じ／相手の残り体力 旧%d 新%d）' % (en['clip'], en['startup'], en['active'], en['recovery'], eo['hpAfter'], en['hpAfter']), (150, 255, 170)), (0, a.height + 4)); S.save(os.path.join(tmp, '%05d.png' % n)); n += 1
        enc(tmp, os.path.join(outdir, cid + '_specials_before_after.mp4'), 30); shutil.rmtree(tmp)
else:
    old, newdir, out, cid = sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5]; e = [x for x in json.load(open(os.path.join(old, 'capture_log.json')))['log'] if x['id'] == cid and x['mv'] == 'ultimate'][0]
    fo = sorted(f for f in os.listdir(os.path.join(old, cid, 'ultimate')) if f.endswith('.png'))[e['startup']::2]; fn = sorted(f for f in os.listdir(newdir) if f.endswith('.png')); tmp = tempfile.mkdtemp()
    for i in range(max(len(fo), len(fn))):
        a = Image.open(os.path.join(old, cid, 'ultimate', fo[min(i, len(fo) - 1)])).convert('RGB'); b = Image.open(os.path.join(newdir, fn[min(i, len(fn) - 1)])).convert('RGB')
        S = Image.new('RGB', (a.width, a.height * 2 + 4), (255, 200, 80)); S.paste(label(a, '旧  v13 実ゲーム録画（%.1f秒・共通カメラ・相手は構えのまま）%s' % (len(fo) / 30, '  ― 終了' if i >= len(fo) else '')), (0, 0))
        S.paste(label(b, '新  v14 %s「%s」命中後ムービー 約10秒版（参照プレイヤー描画）  %.2fs' % (cid, e['name'], min(i, len(fn) - 1) / 30), (150, 255, 170)), (0, a.height + 4)); S.save(os.path.join(tmp, '%05d.png' % i))
    enc(tmp, out, 30); shutil.rmtree(tmp)
