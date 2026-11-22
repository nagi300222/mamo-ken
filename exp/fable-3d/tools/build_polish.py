#!/usr/bin/env python3
"""実機前の仕上げクリップを、アニメ専用 GLB（メッシュ・画像なし）として出す。
  python3 exp/fable-3d/tools/build_polish.py
完全な GLB を _scratch/polish/ に一時ビルドし（元の chars/ も cinematic/v14/<id>/ も書き換えない）、make_anim_glb.py で骨と動きだけを取り出す。
出力: cinematic/v14/anim/<id>_polish_anim.glb と <id>_polish_motions.json。検証は node cinematic/v14/tools/verify_polish.mjs"""
import os, sys, json, subprocess
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.normpath(os.path.join(HERE, '..')); S = os.path.join(ROOT, '_scratch', 'polish'); OUT = os.path.join(ROOT, 'cinematic', 'v14', 'anim')
sys.path.insert(0, HERE); from make_anim_glb import make
PACKS = dict(yomikage=['counter_success_v14'], bullet=['s3_v14'])
NOTES = dict(yomikage=dict(use='当て身（s3）成立の瞬間に、見た目だけ割り込ませる。Battle の状態・判定・ダメージには関与しない', start_from='s3_v14 の待ちの姿勢', interrupt='新しい行動・被弾で即中断'),
             bullet=dict(use="command_map の '214' を 's3_v14' へ向けると尾薙ぎの見た目が替わる。尻尾の軌道は sp_tail_whip と同じ", suggested_command_map={'214': 's3_v14'}, tail_path_source_note='main.js は meta.clips.sp_tail_whip.tail_tip_path を読む。この値は変えていない（s3_v14 にも同じ値を入れてある）'))
os.makedirs(OUT, exist_ok=True)
for cid, clips in PACKS.items():
    subprocess.check_call([sys.executable, os.path.join(HERE, 'build_v14.py'), '--only', cid, '--clips', ','.join(clips), '--out', S], stdout=subprocess.DEVNULL)
    n = make(os.path.join(S, cid, cid + '_v14.glb'), os.path.join(OUT, cid + '_polish_anim.glb'), clips); m = json.load(open(os.path.join(S, cid, cid + '_v14_motions.json'), encoding='utf-8'))
    json.dump(dict(id=cid, kind='animation-only pack', glb='cinematic/v14/anim/%s_polish_anim.glb' % cid, bind_to='chars/%s/%s.glb（または %s_v14.glb）。骨とメッシュのノード名で結び付く' % (cid, cid, cid), fps=60,
                   authoring='tools/mamo3d/motions_v14b.py', build='tools/build_polish.py', clips={c: m['clips'][c] for c in clips}, integration=NOTES[cid]), open(os.path.join(OUT, cid + '_polish_motions.json'), 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
    print(cid, clips, n, 'bytes')
