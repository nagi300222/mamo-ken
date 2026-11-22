#!/usr/bin/env python3
"""アニメ専用 GLB を作る: 完全な GLB から、骨（ノード）と選んだクリップだけを取り出す。メッシュ・テクスチャ・スキンは入れない。
  python3 make_anim_glb.py IN.glb OUT.glb clip1,clip2,...
Three.js の GLTFLoader は「シェイプキーの動き（weights）」を、その名前のノードにメッシュが無いと捨ててしまう。
そこで元と同じ名前のノードに、頂点 3 つ・シェイプキー同数の極小メッシュだけを置く（描画には使わない。読み込み側は animations だけを取り、元 GLB の同名ノードへ名前で結び付く）。"""
import sys, json, struct
def load(p):
    b = open(p, 'rb').read(); n = struct.unpack_from('<I', b, 12)[0]; return json.loads(b[20:20 + n].decode('utf8')), b[20 + n + 8:]
NC = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}; CS = {5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4}
def make(src, dst, clips):
    J, B = load(src); out = bytearray(); views = []; accs = []; cache = {}
    def put(raw):
        while len(out) % 4: out.append(0)
        views.append(dict(buffer=0, byteOffset=len(out), byteLength=len(raw))); out.extend(raw); return len(views) - 1
    def acc(i):
        if i in cache: return cache[i]
        a = J['accessors'][i]; v = J['bufferViews'][a['bufferView']]; o = v.get('byteOffset', 0) + a.get('byteOffset', 0); n = a['count'] * NC[a['type']] * CS[a['componentType']]
        q = {k: a[k] for k in ('componentType', 'count', 'type', 'min', 'max') if k in a}; q['bufferView'] = put(B[o:o + n]); accs.append(q); cache[i] = len(accs) - 1; return cache[i]
    anims = []
    for name in clips:
        a = next((x for x in J['animations'] if x['name'] == name), None)
        if a is None: raise SystemExit('clip not found: ' + name)
        anims.append(dict(name=name, channels=a['channels'], samplers=[dict(s, input=acc(s['input']), output=acc(s['output'])) for s in a['samplers']]))
    nodes = [{k: v for k, v in n.items() if k not in ('skin', 'mesh')} for n in J['nodes']]; meshes = []
    for i, n in enumerate(J['nodes']):
        if 'mesh' not in n: continue
        m = J['meshes'][n['mesh']]; nt = len(m['primitives'][0].get('targets', [])); zero = put(struct.pack('<9f', *([0.0] * 9)))
        accs.append(dict(bufferView=zero, componentType=5126, count=3, type='VEC3', min=[0, 0, 0], max=[0, 0, 0])); z = len(accs) - 1
        stub = dict(name=m.get('name', 'stub'), primitives=[dict(attributes=dict(POSITION=z), targets=[dict(POSITION=z) for _ in range(nt)], mode=4)], weights=[0.0] * nt)
        if 'extras' in m: stub['extras'] = m['extras']
        meshes.append(stub); nodes[i]['mesh'] = len(meshes) - 1
    while len(out) % 4: out.append(0)
    G = dict(asset=dict(version='2.0', generator='mamoken make_anim_glb.py', extras=dict(kind='animation-only', source=src.split('/')[-1], note='骨と動きだけ。メッシュは名前合わせ用の極小の代用品で、描画しない')),
             scene=J.get('scene', 0), scenes=J['scenes'], nodes=nodes, meshes=meshes, animations=anims, accessors=accs, bufferViews=views, buffers=[dict(byteLength=len(out))])
    js = json.dumps(G, separators=(',', ':'), ensure_ascii=False).encode('utf8'); js += b' ' * (-len(js) % 4)
    open(dst, 'wb').write(b'glTF' + struct.pack('<II', 2, 12 + 8 + len(js) + 8 + len(out)) + struct.pack('<I4s', len(js), b'JSON') + js + struct.pack('<I4s', len(out), b'BIN\x00') + bytes(out))
    return len(js) + len(out) + 28
if __name__ == '__main__':
    print(sys.argv[2], make(sys.argv[1], sys.argv[2], sys.argv[3].split(',')), 'bytes')
