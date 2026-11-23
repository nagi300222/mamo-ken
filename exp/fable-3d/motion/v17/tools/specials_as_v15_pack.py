#!/usr/bin/env python3
"""計測用: v17 の必殺 3 本を、通常技パックの形（<id>_normals.glb / v15_<slot> ×6）に載せ替えた写しを作る。
s1→stand_weak, s2→stand_heavy, s3→crouch_weak（残り 3 枠は同じクリップの重複）。既存の実測ツール（sample_clips.mjs --pack）を必殺にも使うためだけのもの。
  python3 specials_as_v15_pack.py OUT_DIR [SRC_DIR SUFFIX]     # 既定は motion/v17 と _specials_v17.glb。r2 は ../../v17r2 と _specials_v17r2.glb"""
import sys, os, json, struct, copy
HERE = os.path.dirname(os.path.abspath(__file__)); SRC = os.path.abspath(sys.argv[2]) if len(sys.argv) > 2 else os.path.normpath(os.path.join(HERE, '..')); SUF = sys.argv[3] if len(sys.argv) > 3 else '_specials_v17.glb'; out = sys.argv[1]; os.makedirs(out, exist_ok=True)
MAP = [('s1', 'v15_stand_weak'), ('s2', 'v15_stand_heavy'), ('s3', 'v15_crouch_weak'), ('s1', 'v15_crouch_heavy'), ('s2', 'v15_air_weak'), ('s3', 'v15_air_heavy')]      # クリップ名の先頭（s1_v17 / s2_v17r2 など）で対応
for f in sorted(os.listdir(SRC)):
    if not f.endswith(SUF): continue
    b = open(os.path.join(SRC, f), 'rb').read(); n = struct.unpack_from('<I', b, 12)[0]; J = json.loads(b[20:20 + n]); rest = b[20 + n:]
    by = {a['name'].split('_')[0]: a for a in J['animations']}; J['animations'] = [dict(copy.deepcopy(by[s]), name=d) for s, d in MAP]
    js = json.dumps(J, separators=(',', ':'), ensure_ascii=False).encode('utf8'); js += b' ' * (-len(js) % 4)
    open(os.path.join(out, f.replace(SUF, '_normals.glb')), 'wb').write(b'glTF' + struct.pack('<II', 2, 12 + 8 + len(js) + len(rest)) + struct.pack('<I4s', len(js), b'JSON') + js + rest)
print('packs', len([f for f in os.listdir(out) if f.endswith('.glb')]))
