#!/usr/bin/env python3
"""マモ拳 v17 P3: 9体×6通常技（v17_<slot>）を、既存の chars/<id>/<id>.blend の元リグに焼いてアニメ専用 GLB にする。
元 GLB / .blend は読み取りだけ。既存の 54 本（normal/v15 の v15_<slot>）も変更しない。

  python3 exp/fable-3d/tools/build_motion_v17.py [--only moguzo,pisuke]

出力: exp/fable-3d/motion/v17/<id>_normals_v17.glb（6 クリップ）と normals_v17.json（接触時刻・攻撃部位・演技メモ）
編集正本: tools/mamo3d/motions_v17.py     必要: pip install bpy scikit-image scipy xatlas pillow numpy"""
import sys, os, json, argparse, time
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import bpy
from mamo3d import model, anim, motions_v2, motions_v17
from build_all import export_glb
from make_anim_glb import make as make_anim
ROOT = os.path.normpath(os.path.join(HERE, '..')); OUT = os.path.join(ROOT, 'motion', 'v17')

def build(cid, args):
    t0 = time.time(); src = os.path.join(ROOT, 'chars', cid)
    bpy.ops.wm.open_mainfile(filepath=os.path.join(src, cid + '.blend'))
    arm = bpy.data.objects['Rig_' + cid]; ob = bpy.data.objects['Mamo_' + cid]
    old = [t.strips[0].action for t in arm.animation_data.nla_tracks]
    A = model.build_arrays(cid, os.path.join(args.scratch, 'v14tex_' + cid), log=lambda *a: None, cache_dir=args.scratch)
    an = anim.Animator(arm, ob, A['spec'], A['extra_bones'])
    tmp, _ = an.bake('idle', motions_v2.make(cid, 'idle')); bpy.data.actions.remove(tmp)
    acts = []; meta = {}; moves = motions_v17.MOVES[cid](cid)
    for slot in motions_v17.SLOTS:
        clip = moves[slot]; name = motions_v17.clip_name(slot); act, warn = an.bake(name, clip); acts.append(act)
        meta[slot] = dict(clip=name, frames=clip['frames'], fps=60, duration_sec=round(clip['frames'] / 60, 4), **clip['info'])
        if warn: meta[slot]['warnings'] = warn[:8]
    anim.to_nla(arm, ob, old + acts); bpy.context.scene.frame_end = int(max(a.frame_range[1] for a in old + acts)); bpy.context.scene.frame_set(0)
    full = os.path.join(args.scratch, 'v17_full_' + cid + '.glb'); export_glb(full, arm, ob)
    os.makedirs(OUT, exist_ok=True); out = os.path.join(OUT, cid + '_normals_v17.glb'); make_anim(full, out, [motions_v17.clip_name(s) for s in motions_v17.SLOTS]); os.remove(full)
    print('[%s] %.1fs  %s  %.0f KB' % (cid, time.time() - t0, os.path.relpath(out, ROOT), os.path.getsize(out) / 1e3))
    return meta

if __name__ == '__main__':
    ap = argparse.ArgumentParser(); ap.add_argument('--only', default=','.join(motions_v17.MOVES)); ap.add_argument('--scratch', default=os.path.join(ROOT, '_scratch'))
    args = ap.parse_args(); path = os.path.join(OUT, 'normals_v17.json')
    meta = json.load(open(path, encoding='utf-8')) if os.path.exists(path) else dict(authoring='tools/mamo3d/motions_v17.py', build='tools/build_motion_v17.py', characters={})
    for cid in args.only.split(','): meta['characters'][cid] = build(cid, args)
    meta['version'] = motions_v17.VERSION; meta['blender'] = bpy.app.version_string
    os.makedirs(OUT, exist_ok=True); json.dump(meta, open(path, 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
