#!/usr/bin/env python3
"""計測・試写用: v17 の通常技パックを、現行ゲームが読むファイル名とクリップ名（<id>_normals.glb / v15_<slot>）に付け替えた写しを作る。
中身のキーは同じ。ゲームのソースも normal/v15 の実ファイルも変えず、計測ツールの --pack で差し替えて読ませるためだけのもの。
  python3 as_v15_pack.py OUT_DIR"""
import sys, os, json, struct
HERE = os.path.dirname(os.path.abspath(__file__)); SRC = os.path.abspath(sys.argv[2]) if len(sys.argv) > 2 else os.path.normpath(os.path.join(HERE, '..')); SUF = sys.argv[3] if len(sys.argv) > 3 else '_normals_v17.glb'; out = sys.argv[1]; os.makedirs(out, exist_ok=True)      # r2: OUT ../../v17r2 _normals_v17r2.glb
for f in sorted(os.listdir(SRC)):
    if not f.endswith(SUF): continue
    b = open(os.path.join(SRC, f), 'rb').read(); n = struct.unpack_from('<I', b, 12)[0]; J = json.loads(b[20:20 + n]); rest = b[20 + n:]
    for a in J['animations']: a['name'] = a['name'].replace('v17r2_', 'v15_').replace('v17_', 'v15_')
    js = json.dumps(J, separators=(',', ':'), ensure_ascii=False).encode('utf8'); js += b' ' * (-len(js) % 4)
    open(os.path.join(out, f.replace(SUF, '_normals.glb')), 'wb').write(b'glTF' + struct.pack('<II', 2, 12 + 8 + len(js) + len(rest)) + struct.pack('<I4s', len(js), b'JSON') + js + rest)
print('packs', len([f for f in os.listdir(out) if f.endswith('.glb')]))
