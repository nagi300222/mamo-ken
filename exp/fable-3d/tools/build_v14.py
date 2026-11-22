#!/usr/bin/env python3
"""Showtime v14: 既存の chars/<id>/<id>.blend を開き、新クリップだけを焼き足して別パスへ書き出す。
元の GLB / .blend / motions.json は読み取りだけで、上書きしない（造形・リグ・既存37クリップはそのまま）。

  python3 exp/fable-3d/tools/build_v14.py                    # 9体すべて
  python3 exp/fable-3d/tools/build_v14.py --only chirka      # 1体
  python3 exp/fable-3d/tools/build_v14.py --only moguzo --save-blend

出力: exp/fable-3d/cinematic/v14/<id>/<id>_v14.glb, <id>_v14_motions.json（--save-blend で <id>_v14.blend も）
必要: pip install bpy scikit-image scipy xatlas pillow numpy   （Blender 5.3 の bpy で確認）
"""
import sys, os, json, argparse, time, struct, hashlib
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import bpy
from mamo3d import model, anim, motions_v2, motions_v14, characters

ROOT = os.path.normpath(os.path.join(HERE, '..')); OUT = os.path.join(ROOT, 'cinematic', 'v14')
from build_all import export_glb, glb_json


def _glb(path):
    b = bytearray(open(path, 'rb').read()); n = struct.unpack_from('<I', b, 12)[0]; return b, json.loads(bytes(b[20:20 + n]).decode('utf8')), 20 + n + 8
def _span(J, off, i):
    a = J['accessors'][i]; v = J['bufferViews'][a['bufferView']]; n = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}[a['type']] * {5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4}[a['componentType']]
    st = off + v.get('byteOffset', 0) + a.get('byteOffset', 0); return st, st + a['count'] * n
def restore_base_clips(base_path, out_path):
    """既存クリップのキー値を元 GLB と同じバイト列にする。再書き出しで値が変わったチャンネルがあれば、元の値を新しいアクセサとして末尾に足して差し替え、何を戻したかを返す。
    例: yomikage の idle は元 GLB の先頭2フレームだけ blink=1 になっている（元の書き出し時の状態に由来）。直さず、元のまま残す。
    （書き出し側は同じ中身のアクセサを共有するので、その場で上書きすると別クリップまで変わる。必ず新しいアクセサにする）"""
    A, JA, oa = _glb(base_path); B, JB, ob = _glb(out_path); nb = {a['name']: a for a in JB['animations']}; fixed = []; binb = bytearray(B[ob:ob + JB['buffers'][0]['byteLength']])
    for a in JA['animations']:
        b = nb.get(a['name'])
        if not b: continue
        cb = {(JB['nodes'][c['target']['node']]['name'], c['target']['path']): b['samplers'][c['sampler']] for c in b['channels']}
        for c in a['channels']:
            key = (JA['nodes'][c['target']['node']]['name'], c['target']['path']); sa = a['samplers'][c['sampler']]; sb = cb.get(key)
            if not sb: continue
            for io in ('input', 'output'):
                x0, x1 = _span(JA, oa, sa[io]); y0, y1 = _span(JB, ob, sb[io])
                if A[x0:x1] == B[y0:y1]: continue
                while len(binb) % 4: binb.append(0)
                JB['bufferViews'].append(dict(buffer=0, byteOffset=len(binb), byteLength=x1 - x0)); binb += A[x0:x1]
                acc = {k: v for k, v in JA['accessors'][sa[io]].items() if k != 'byteOffset'}; acc['bufferView'] = len(JB['bufferViews']) - 1; JB['accessors'].append(acc); sb[io] = len(JB['accessors']) - 1
                fixed.append('%s:%s.%s.%s' % (a['name'], key[0], key[1], io))
    if fixed:
        while len(binb) % 4: binb.append(0)
        JB['buffers'][0]['byteLength'] = len(binb); js = json.dumps(JB, separators=(',', ':'), ensure_ascii=False).encode('utf8'); js += b' ' * (-len(js) % 4)
        out = bytearray(b'glTF') + struct.pack('<II', 2, 12 + 8 + len(js) + 8 + len(binb)) + struct.pack('<I4s', len(js), b'JSON') + js + struct.pack('<I4s', len(binb), b'BIN\x00') + binb
        open(out_path, 'wb').write(out)
    return fixed

def sha(path): return hashlib.sha256(open(path, 'rb').read()).hexdigest()

def build_char(cid, args):
    t0 = time.time(); src = os.path.join(ROOT, 'chars', cid); out = os.path.join(args.out or OUT, cid); os.makedirs(out, exist_ok=True)
    bpy.ops.wm.open_mainfile(filepath=os.path.join(src, cid + '.blend'))
    arm = bpy.data.objects['Rig_' + cid]; ob = bpy.data.objects['Mamo_' + cid]
    old = [t.strips[0].action for t in arm.animation_data.nla_tracks]          # 既存37本（順番を保つ）
    A = model.build_arrays(cid, os.path.join(args.scratch, 'v14tex_' + cid), log=lambda *a: None, cache_dir=args.scratch)   # 揺れものの設定（extra_bones）だけ使う。メッシュは .blend のもの
    spec = A['spec']; an = anim.Animator(arm, ob, spec, A['extra_bones'])
    tmp, _ = an.bake('idle', motions_v2.make(cid, 'idle')); bpy.data.actions.remove(tmp)      # 長い尻尾の終端合わせ用に idle の揺れ姿勢だけ取る
    names = motions_v14.clips_for(cid) if not args.clips else args.clips.split(','); acts = []; meta = {}
    for name in names:
        clip = motions_v14.make(cid, name); act, warn = an.bake(name, clip); acts.append(act)
        meta[name] = dict(frames=clip['frames'], fps=60, duration_sec=round(clip['frames'] / 60, 4), loop=clip['loop'], **clip['info'])
        if an.measure: meta[name].update(an.measure)
        if warn: meta[name]['warnings'] = warn; print('   warn', name, warn[:6])
    anim.to_nla(arm, ob, old + acts); bpy.context.scene.frame_end = int(max(a.frame_range[1] for a in old + acts)); bpy.context.scene.frame_set(0)
    glb = os.path.join(out, cid + '_v14.glb'); export_glb(glb, arm, ob); restored = restore_base_clips(os.path.join(src, cid + '.glb'), glb); J = glb_json(glb)
    if restored: print('   restored base clip data:', restored)
    if args.save_blend:
        blend = os.path.join(out, cid + '_v14.blend'); bpy.ops.wm.save_as_mainfile(filepath=blend, compress=True, copy=True)
    base = json.load(open(os.path.join(src, cid + '_motions.json'), encoding='utf-8'))
    info = dict(base); info['clips'] = dict(base['clips'], **meta); info['v14_clips'] = list(meta)
    info['command_map'] = dict(base['command_map'], **motions_v14.command_map(cid))
    info['v14'] = dict(version=motions_v14.VERSION, base_glb='chars/%s/%s.glb' % (cid, cid), base_glb_sha256=sha(os.path.join(src, cid + '.glb')), base_blend_sha256=sha(os.path.join(src, cid + '.blend')),
                       base_command_map=base['command_map'], authoring='tools/mamo3d/motions_v14.py', build='tools/build_v14.py', blender=bpy.app.version_string, base_clip_channels_restored=restored,
                       note='base の造形・リグ・既存37クリップに v14 クリップを足した別ファイル。command_map の v14 割当は見た目だけの差し替え案で、技の性能（balance.js）は変えない')
    json.dump(info, open(os.path.join(out, cid + '_v14_motions.json'), 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
    print('[%s] +%d clips  %.1fs  glb=%.2fMB  anims=%d' % (cid, len(acts), time.time() - t0, os.path.getsize(glb) / 1e6, len(J.get('animations', []))))

if __name__ == '__main__':
    ap = argparse.ArgumentParser(); ap.add_argument('--only', default=','.join(characters.ROSTER)); ap.add_argument('--clips', default='')
    ap.add_argument('--out', default='', help='出力先（既定は cinematic/v14）。仕上げ用の一時ビルドなどで別の場所へ出すとき');
    ap.add_argument('--save-blend', action='store_true'); ap.add_argument('--scratch', default=os.path.join(ROOT, '_scratch'))
    args = ap.parse_args()
    for cid in args.only.split(','): build_char(cid, args)
