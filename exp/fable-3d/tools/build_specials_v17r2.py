#!/usr/bin/env python3
"""マモ拳 v17 P3 必殺 r2: 対空 3 本を直した 3 体（takimaru / yomikage / bullet）の必殺パックを、v17 とは別の場所へ焼く。motion/v17 は読みも書きもしない。
  python3 exp/fable-3d/tools/build_specials_v17r2.py [--only takimaru]
出力: exp/fable-3d/motion/v17r2/<id>_specials_v17r2.glb（クリップ s1_v17 / s2_v17r2 / s3_v17。s1・s3 は v17 と同じ関数）と specials_v17r2.json
編集正本: tools/mamo3d/motions_v17s_r2.py（直した 3 本）。残りは motions_v17s.py と同じ"""
import sys, os, json, argparse, time
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import bpy
from mamo3d import model, anim, motions_v2, motions_v17s_r2 as S
from build_all import export_glb
from make_anim_glb import make as make_anim
ROOT = os.path.normpath(os.path.join(HERE, '..')); OUT = os.path.join(ROOT, 'motion', 'v17r2')
def build(cid, args):
    t0 = time.time(); src = os.path.join(ROOT, 'chars', cid); bpy.ops.wm.open_mainfile(filepath=os.path.join(src, cid + '.blend'))
    arm = bpy.data.objects['Rig_' + cid]; ob = bpy.data.objects['Mamo_' + cid]; old = [t.strips[0].action for t in arm.animation_data.nla_tracks]
    A = model.build_arrays(cid, os.path.join(args.scratch, 'v14tex_' + cid), log=lambda *a: None, cache_dir=args.scratch); an = anim.Animator(arm, ob, A['spec'], A['extra_bones'])
    tmp, _ = an.bake('idle', motions_v2.make(cid, 'idle')); bpy.data.actions.remove(tmp); acts = []; meta = {}
    for slot in S.SLOTS:
        clip = S.make(cid, slot); name = S.clip_name(cid, slot); act, warn = an.bake(name, clip); acts.append(act); I = clip['info']
        meta[slot] = dict(clip=name, frames=clip['frames'], fps=60, duration_sec=round(clip['frames'] / 60, 4), contactSeconds=round(I.get('contact_frame', I['startup']) / 60, 4),
                          **{k: v for k, v in I.items() if k not in ('group', 'priority', 'v2', 'v14', 'provisional', 'warnings')})
        if an.measure: meta[slot]['measure'] = an.measure
    anim.to_nla(arm, ob, old + acts); bpy.context.scene.frame_end = int(max(a.frame_range[1] for a in old + acts)); bpy.context.scene.frame_set(0)
    full = os.path.join(args.scratch, 'v17r2_full_' + cid + '.glb'); export_glb(full, arm, ob)
    os.makedirs(OUT, exist_ok=True); out = os.path.join(OUT, cid + '_specials_v17r2.glb'); make_anim(full, out, [S.clip_name(cid, s) for s in S.SLOTS]); os.remove(full)
    print('[%s] %.1fs  %s  %.0f KB' % (cid, time.time() - t0, os.path.relpath(out, ROOT), os.path.getsize(out) / 1e3)); return meta
if __name__ == '__main__':
    ap = argparse.ArgumentParser(); ap.add_argument('--only', default=','.join(sorted({c for c, _ in S.REVISED}))); ap.add_argument('--scratch', default=os.path.join(ROOT, '_scratch')); args = ap.parse_args()
    path = os.path.join(OUT, 'specials_v17r2.json'); meta = json.load(open(path, encoding='utf-8')) if os.path.exists(path) else dict(authoring='tools/mamo3d/motions_v17s_r2.py', build='tools/build_specials_v17r2.py', characters={})
    for cid in args.only.split(','): meta['characters'][cid] = build(cid, args)
    meta['version'] = S.VERSION; meta['blender'] = bpy.app.version_string
    meta['cue_contract'] = "cue_track[] = {at: クリップ秒, type: sfx|vfx|shake, key, trigger: movement|contact, on: always|hit|guard, bone?}。movement は時刻で必ず鳴らす動作音（溜め・風切り・着地・弾を放つ瞬間）。contact は時刻では鳴らさず、Battle が実際に出したヒット／ガードのイベントで Battle 側のフィードバックが使う（空振りでは鳴らない）。key は combat-audio.js / main.js の既存の種類。hitstop_suggest は提案値（採否は戦闘側）"
    json.dump(meta, open(path, 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
