"""GLB の読み書き（numpy だけ）。P2 交換モジュールのビルドと検査で共通に使う。"""
import json, struct
import numpy as np
DT = {5120: np.int8, 5121: np.uint8, 5122: np.int16, 5123: np.uint16, 5125: np.uint32, 5126: np.float32}
NC = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}
def unpack(path):
    raw = open(path, 'rb').read(); n = struct.unpack_from('<I', raw, 12)[0]; j = json.loads(raw[20:20 + n]); pos = 20 + n; m = struct.unpack_from('<I', raw, pos)[0]
    return j, bytes(raw[pos + 8:pos + 8 + m]), raw
def array(j, b, idx):
    a = j['accessors'][idx]; dt = np.dtype(DT[a['componentType']]); nc = NC[a['type']]
    if 'bufferView' in a:
        v = j['bufferViews'][a['bufferView']]
        r = np.ndarray((a['count'], nc), dt, buffer=b, offset=v.get('byteOffset', 0) + a.get('byteOffset', 0), strides=(v.get('byteStride', dt.itemsize * nc), dt.itemsize)).copy()
    else: r = np.zeros((a['count'], nc), dt)
    if 'sparse' in a:
        s = a['sparse']; ii = s['indices']; iv = j['bufferViews'][ii['bufferView']]; vv = s['values']; view = j['bufferViews'][vv['bufferView']]
        ind = np.frombuffer(b, dtype=DT[ii['componentType']], count=s['count'], offset=iv.get('byteOffset', 0) + ii.get('byteOffset', 0))
        val = np.frombuffer(b, dtype=dt, count=s['count'] * nc, offset=view.get('byteOffset', 0) + vv.get('byteOffset', 0)).reshape(-1, nc); r[ind] = val
    return r
class Writer:
    """bufferView / accessor を足していき、最後に GLB にする"""
    def __init__(self): self.j = dict(asset=dict(version='2.0', generator='mamoken p2 exchange module builder'), buffers=[dict(byteLength=0)], bufferViews=[], accessors=[]); self.b = bytearray()
    def view(self, raw, target=None):
        while len(self.b) % 4: self.b.append(0)
        v = dict(buffer=0, byteOffset=len(self.b), byteLength=len(raw));
        if target: v['target'] = target
        self.b.extend(raw); self.j['bufferViews'].append(v); return len(self.j['bufferViews']) - 1
    def acc(self, data, kind, comp, minmax=False, target=None, normalized=False):
        data = np.ascontiguousarray(np.asarray(data, dtype=DT[comp])); a = dict(bufferView=self.view(data.tobytes(), target), componentType=comp, count=int(data.shape[0]), type=kind)
        if minmax: a['min'] = data.reshape(len(data), -1).min(axis=0).tolist(); a['max'] = data.reshape(len(data), -1).max(axis=0).tolist()
        if normalized: a['normalized'] = True
        self.j['accessors'].append(a); return len(self.j['accessors']) - 1
    def glb(self):
        while len(self.b) % 4: self.b.append(0)
        self.j['buffers'][0]['byteLength'] = len(self.b); js = json.dumps(self.j, separators=(',', ':'), ensure_ascii=False).encode(); js += b' ' * (-len(js) % 4)
        return struct.pack('<III', 0x46546c67, 2, 12 + 8 + len(js) + 8 + len(self.b)) + struct.pack('<I4s', len(js), b'JSON') + js + struct.pack('<I4s', len(self.b), b'BIN\0') + bytes(self.b)
