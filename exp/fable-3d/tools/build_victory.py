#!/usr/bin/env python3
"""マモ拳 v15.1 Presentation: 9体の勝利モーション victory_v151 を、既存の chars/<id>/<id>.blend の元リグに焼いて
アニメ専用 GLB（骨のキーと表情キーだけ。メッシュ・テクスチャなし）として書き出す。元 GLB / .blend は読み取りだけ。

  python3 exp/fable-3d/tools/build_victory.py                # 9体
  python3 exp/fable-3d/tools/build_victory.py --only godan   # 1体

出力: exp/fable-3d/presentation/v151/<id>_victory.glb と victory_motions.json（クリップの長さ・見せ場のフレーム）
編集正本: tools/mamo3d/motions_v151.py      必要: pip install bpy scikit-image scipy xatlas pillow numpy
"""
import sys, os, json, argparse, time
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import bpy
from mamo3d import model, anim, motions_v2, motions_v151, characters
from build_all import export_glb
from make_anim_glb import make as make_anim

ROOT = os.path.normpath(os.path.join(HERE, '..')); OUT = os.path.join(ROOT, 'presentation', 'v151')

def build(cid, args):
    t0 = time.time(); src = os.path.join(ROOT, 'chars', cid)
    bpy.ops.wm.open_mainfile(filepath=os.path.join(src, cid + '.blend'))
    arm = bpy.data.objects['Rig_' + cid]; ob = bpy.data.objects['Mamo_' + cid]
    old = [t.strips[0].action for t in arm.animation_data.nla_tracks]
    A = model.build_arrays(cid, os.path.join(args.scratch, 'v14tex_' + cid), log=lambda *a: None, cache_dir=args.scratch)
    an = anim.Animator(arm, ob, A['spec'], A['extra_bones'])
    tmp, _ = an.bake('idle', motions_v2.make(cid, 'idle')); bpy.data.actions.remove(tmp)
    clip = motions_v151.make(cid); act, warn = an.bake(motions_v151.CLIP, clip)
    if warn: print('   warn', warn[:6])
    anim.to_nla(arm, ob, old + [act]); bpy.context.scene.frame_end = int(max(a.frame_range[1] for a in old + [act])); bpy.context.scene.frame_set(0)
    full = os.path.join(args.scratch, 'victory_full_' + cid + '.glb'); export_glb(full, arm, ob)
    os.makedirs(OUT, exist_ok=True); out = os.path.join(OUT, cid + '_victory.glb'); make_anim(full, out, [motions_v151.CLIP]); os.remove(full)
    print('[%s] %.1fs  %s  %.0f KB' % (cid, time.time() - t0, os.path.relpath(out, ROOT), os.path.getsize(out) / 1e3))
    return dict(clip=motions_v151.CLIP, frames=clip['frames'], fps=60, duration_sec=round(clip['frames'] / 60, 4), **clip['info'])

if __name__ == '__main__':
    ap = argparse.ArgumentParser(); ap.add_argument('--only', default=','.join(characters.ROSTER)); ap.add_argument('--scratch', default=os.path.join(ROOT, '_scratch'))
    args = ap.parse_args(); meta_path = os.path.join(OUT, 'victory_motions.json')
    meta = json.load(open(meta_path, encoding='utf-8')) if os.path.exists(meta_path) else dict(version=motions_v151.VERSION, authoring='tools/mamo3d/motions_v151.py', build='tools/build_victory.py', clips={})
    for cid in args.only.split(','): meta['clips'][cid] = build(cid, args)
    meta['version'] = motions_v151.VERSION; meta['blender'] = bpy.app.version_string
    json.dump(meta, open(meta_path, 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
