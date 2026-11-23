"""符号付き距離関数(SDF)のプリミティブと合成。numpy のみ。座標系は Blender（Z上、正面 -Y、本人の左 +X）。"""
import numpy as np

def _v(a): return np.asarray(a, dtype=np.float64)
def norm(a):
    a = _v(a); return a / (np.linalg.norm(a) + 1e-12)
def smin(a, b, k):
    if k <= 0: return np.minimum(a, b)
    h = np.maximum(k - np.abs(a - b), 0.0) / k
    return np.minimum(a, b) - h * h * k * 0.25
def smax(a, b, k):
    return -smin(-a, -b, k)
def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0 + 1e-12), 0, 1); return t * t * (3 - 2 * t)

class Prim:
    """kind: 'ell'(center, radii, R) / 'cap'(a, b, ra, rb) / 'box'(center, half, r, R)
    group: 色・毛・スキンの属性づけに使う名前。 k: この形状を合成するときのなめらかさ。
    op: 'add' or 'sub'。 fur: 毛束の対象か。 knots: [(t, {bone: w})] 軸(a→b)に沿ったウェイト分布。"""
    def __init__(self, name, kind, group, k=0.02, op='add', fur=True, knots=None, axis=None, tuft=0.0, flow='v', **kw):
        self.name, self.kind, self.group, self.k, self.op, self.fur = name, kind, group, k, op, fur
        self.tuft, self.flow = tuft, flow
        self.knots, self.axis = knots, axis
        self.p = {n: (_v(v) if not np.isscalar(v) else float(v)) for n, v in kw.items() if v is not None}
        if 'R' not in self.p: self.p['R'] = np.eye(3)
        if kind == 'cap' and axis is None: self.axis = (self.p['a'], self.p['b'])
    def bbox(self, margin):
        p = self.p
        if self.kind == 'cap':
            r = max(p['ra'], p['rb']); lo = np.minimum(p['a'], p['b']) - r; hi = np.maximum(p['a'], p['b']) + r
        else:
            ext = p['radii'] if self.kind == 'ell' else p['half'] + p.get('r', 0.0)
            e = np.abs(p['R']) @ ext; lo = p['center'] - e; hi = p['center'] + e
        return lo - margin, hi + margin
    def eval(self, P):
        p = self.p
        if self.kind == 'cap':
            a, b = p['a'], p['b']; ab = b - a; L2 = float(ab @ ab) + 1e-12
            t = np.clip(((P - a) @ ab) / L2, 0, 1)
            return np.linalg.norm(P - (a + t[:, None] * ab), axis=1) - (p['ra'] + (p['rb'] - p['ra']) * t)
        q = (P - p['center']) @ p['R']          # ローカル座標（R の列がローカル軸）
        if self.kind == 'ell':
            r = p['radii']; k0 = np.linalg.norm(q / r, axis=1); k1 = np.linalg.norm(q / (r * r), axis=1) + 1e-9
            return np.where(k0 < 1e-6, -r.min(), k0 * (k0 - 1.0) / k1)
        d = np.abs(q) - p['half']
        return np.linalg.norm(np.maximum(d, 0), axis=1) + np.minimum(d.max(axis=1), 0) - p.get('r', 0.0)
    def tparam(self, P):
        a, b = _v(self.axis[0]), _v(self.axis[1]); ab = b - a
        return np.clip(((P - a) @ ab) / (float(ab @ ab) + 1e-12), 0, 1)

def rot_from_axes(x=None, y=None, z=None):
    """与えた2軸から直交基底(列ベクトル)を作る。"""
    if x is not None and z is not None:
        x = norm(x); z = norm(_v(z) - x * (x @ _v(z))); y = np.cross(z, x)
    elif y is not None and z is not None:
        y = norm(y); z = norm(_v(z) - y * (y @ _v(z))); x = np.cross(y, z)
    elif x is not None and y is not None:
        x = norm(x); y = norm(_v(y) - x * (x @ _v(y))); z = np.cross(x, y)
    return np.stack([x, y, z], axis=1)

class Grid:
    def __init__(self, lo, hi, h):
        self.h = h; self.lo = _v(lo); self.n = np.ceil((_v(hi) - self.lo) / h).astype(int) + 1
        self.shape = tuple(self.n)
    def points(self, i0, i1):
        ax = [self.lo[d] + self.h * np.arange(i0[d], i1[d]) for d in range(3)]
        X, Y, Z = np.meshgrid(*ax, indexing='ij'); return np.stack([X.ravel(), Y.ravel(), Z.ravel()], axis=1)
    def idx_range(self, lo, hi):
        i0 = np.clip(np.floor((lo - self.lo) / self.h).astype(int), 0, self.n)
        i1 = np.clip(np.ceil((hi - self.lo) / self.h).astype(int) + 1, 0, self.n); return i0, i1

def eval_field(prims, grid, far=0.05):
    """prims を順に合成した距離場（グリッド）。各プリミティブは自分の外接箱の中だけ評価する。"""
    F = np.full(grid.shape, far, dtype=np.float32)
    for pr in prims:
        lo, hi = pr.bbox(max(pr.k, 0.0) + 2 * grid.h + 0.004)
        i0, i1 = grid.idx_range(lo, hi)
        if np.any(i1 <= i0): continue
        d = pr.eval(grid.points(i0, i1)).reshape(tuple(i1 - i0)).astype(np.float32)
        sl = tuple(slice(i0[k], i1[k]) for k in range(3))
        F[sl] = smin(F[sl], d, pr.k) if pr.op == 'add' else smax(F[sl], -d, pr.k)
    return F

def eval_points(prims, P):
    """点群での合成距離（グリッドと同じ順序・同じ k で合成）。"""
    f = np.full(len(P), 0.05)
    for pr in prims:
        d = pr.eval(P); f = smin(f, d, pr.k) if pr.op == 'add' else smax(f, -d, pr.k)
    return f

def hash3(i, j, k, seed=0):
    n = (i * 73856093) ^ (j * 19349663) ^ (k * 83492791) ^ (seed * 2654435761)
    n = (n ^ (n >> 13)) * 1274126177; n = n ^ (n >> 16)
    return (n & 0xFFFFFF) / float(0xFFFFFF)
def vnoise(P, freq, seed=0):
    """3次元バリューノイズ 0..1。freq はスカラーか3成分。"""
    q = P * _v(freq); i = np.floor(q).astype(np.int64); f = q - i; f = f * f * (3 - 2 * f); out = 0
    for dx in (0, 1):
        for dy in (0, 1):
            for dz in (0, 1):
                w = (f[:, 0] if dx else 1 - f[:, 0]) * (f[:, 1] if dy else 1 - f[:, 1]) * (f[:, 2] if dz else 1 - f[:, 2])
                out = out + w * hash3(i[:, 0] + dx, i[:, 1] + dy, i[:, 2] + dz, seed)
    return out
