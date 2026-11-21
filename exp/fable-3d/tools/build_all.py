#!/usr/bin/env python3
"""マモ拳 3Dキャラの一括生成。
  python3 exp/fable-3d/tools/build_all.py                 # 3体すべて（.blend / .glb / テクスチャ / モーションJSON）
  python3 exp/fable-3d/tools/build_all.py --only moguzo   # 1体だけ
  python3 exp/fable-3d/tools/build_all.py --only moguzo --clips idle,crouch --pose-check idle:0,crouch:30
必要: pip install bpy scikit-image scipy xatlas pillow numpy
"""
import sys, os, json, argparse, time, struct
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import bpy, numpy as np
from mamo3d import model, rig, anim, motions, render

ROOT = os.path.normpath(os.path.join(HERE, '..'))

def export_glb(path, arm, ob):
    for o in bpy.context.scene.objects: o.select_set(o in (arm, ob))
    bpy.context.view_layer.objects.active = arm
    bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', use_selection=True, export_yup=True,
        export_animations=True, export_animation_mode='NLA_TRACKS', export_force_sampling=True, export_frame_step=1,
        export_def_bones=True, export_skins=True, export_all_influences=False, export_influence_nb=4,
        export_morph=True, export_morph_normal=False, export_morph_animation=True, export_try_sparse_sk=True,
        export_optimize_animation_size=True, export_optimize_animation_keep_anim_armature=True, export_optimize_animation_keep_anim_object=False,
        export_image_format='JPEG', export_jpeg_quality=88, export_materials='EXPORT', export_cameras=False, export_lights=False,
        export_apply=False, export_tangents=False, export_reset_pose_bones=True, export_anim_slide_to_zero=False)

def glb_json(path):
    with open(path, 'rb') as f:
        f.read(12); n, _ = struct.unpack('<I4s', f.read(8)); return json.loads(f.read(n))

def build_char(cid, clips, args):
    t0 = time.time(); out = os.path.join(ROOT, 'chars', cid); os.makedirs(out, exist_ok=True)
    bpy.ops.wm.read_factory_settings(use_empty=True); sc = bpy.context.scene; sc.render.fps = 60; sc.frame_start = 0
    print('[%s] mesh + texture' % cid); A = model.build_arrays(cid, out, cache_dir=args.scratch if args.cache else None); spec = A['spec']
    ob = model.make_object(cid, A)
    arm, rest_err = rig.build(spec, A['extra_bones'], 'Rig_' + cid); print('[%s] rig built, IK rest error(deg)=%s' % (cid, rest_err))
    ob.parent = arm; m = ob.modifiers.new('Armature', 'ARMATURE'); m.object = arm
    an = anim.Animator(arm, ob, spec, A['extra_bones']); acts = []; meta = {}
    for name in clips:
        clip = motions.make(cid, name); act, warn = an.bake(name, clip); acts.append(act)
        meta[name] = dict(frames=clip['frames'], fps=60, duration_sec=round(clip['frames'] / 60, 4), loop=clip['loop'], **clip['info'])
        if warn: meta[name]['warnings'] = warn; print('   warn', name, warn[:4])
    print('[%s] %d clips baked (%.1fs)' % (cid, len(acts), time.time() - t0))
    if args.pose_check:
        render.setup(sc, (520, 560), 16); S = args.scratch; os.makedirs(S, exist_ok=True); H = spec.P.H
        for item in args.pose_check.split(','):
            nm, fr = item.split(':'); anim.assign(arm, ob, bpy.data.actions[nm]); sc.frame_set(int(fr)); ps = []
            for vw in args.views.split(','):
                p = os.path.join(S, 'pose_%s_%s_%s_%s.png' % (cid, nm, fr, vw)); render.shot(sc, p, vw, center=(0, -0.03, H * 0.48), span=H * 1.45); ps.append(p)
            render.sheet(ps, os.path.join(S, 'pose_%s_%s_%s.png' % (cid, nm, fr)))
            for p in ps: os.remove(p)
    # .blend（テクスチャは相対パス参照。idle をアクティブにし、全クリップを NLA に積む）
    for o in [o for o in bpy.data.objects if o.name in ('Floor', 'RCam', 'KeyL', 'FillL', 'RimL')]: bpy.data.objects.remove(o)
    anim.to_nla(arm, ob, acts); sc.frame_end = int(max(a.frame_range[1] for a in acts)) if acts else 1; sc.frame_set(0)
    blend = os.path.join(out, cid + '.blend'); bpy.ops.wm.save_as_mainfile(filepath=blend, compress=True)
    bpy.ops.file.make_paths_relative(); bpy.ops.wm.save_mainfile(compress=True)
    if os.path.exists(blend + '1'): os.remove(blend + '1')
    glb = os.path.join(out, cid + '.glb'); export_glb(glb, arm, ob)
    J = glb_json(glb)
    info = dict(id=cid, height=spec.P.H, unit='Blender単位（メートル扱い）。全高は耳を除く頭頂まで', fps=60, forward='glTF/Three.js では +Z が正面、+Y が上、+X が本人の左',
                metrics=dict(leg=round(spec.M.leg, 4), arm=round(spec.M.arm, 4), note='移動量の *_leg は脚の長さ(leg)を1とした値。実距離 = 値 × leg'),
                clips=meta)
    json.dump(info, open(os.path.join(out, cid + '_motions.json'), 'w'), indent=1, ensure_ascii=False)
    print('[%s] done %.1fs  glb=%.2fMB  anims=%s' % (cid, time.time() - t0, os.path.getsize(glb) / 1e6, [a['name'] for a in J.get('animations', [])]))

if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--only', default='moguzo,pisuke,godan'); ap.add_argument('--clips', default=','.join(motions.CLIPS))
    ap.add_argument('--pose-check', default=''); ap.add_argument('--views', default='side,three_quarter,front,back34')
    ap.add_argument('--cache', action='store_true', help='メッシュ生成結果を _scratch に保存して再利用')
    ap.add_argument('--scratch', default=os.path.join(ROOT, '_scratch'))
    args = ap.parse_args()
    for cid in args.only.split(','): build_char(cid, args.clips.split(','), args)
