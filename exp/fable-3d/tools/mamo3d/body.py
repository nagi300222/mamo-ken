"""SDF → メッシュ（マーチングキューブ）→ 毛束の凹凸 → 目・装飾の追加。"""
import numpy as np
from scipy import ndimage
from skimage import measure
from .sdf import Grid, eval_field, eval_points, smoothstep, hash3, norm, rot_from_axes
from .characters import V, SIDES

TAU = 0.010   # 属性づけの柔らかさ

def attribution(prims, P, tau=TAU):
    """各点での「どのプリミティブに属するか」の重み [N, n_prims]（op='add' のみ）"""
    D = np.stack([pr.eval(P) if pr.op == 'add' else np.full(len(P), 9.0) for pr in prims], axis=1)
    W = np.exp(-(D - D.min(axis=1, keepdims=True)) / tau)
    return W / W.sum(axis=1, keepdims=True), D

def _layer(a, v, seed):
    c = np.floor(a).astype(np.int64); x = 2 * (a - c) - 1
    v2 = v + hash3(c, c * 0 + 7, c * 0 + 3, seed) * 1.0
    r = np.floor(v2).astype(np.int64); b = v2 - r
    A = 0.6 + 0.4 * hash3(c, r, c * 0 + 11, seed)
    w = 0.45 + 0.55 * np.sqrt(b)
    return A * (1 - b) * np.minimum(1.0, b * 6 + 0.35) * np.maximum(0, 1 - (x / w) ** 2)

def pattern(a, v, seed=1):
    """毛束の高さ 0..1。a: 横方向（列単位、整数周期）、v: 流れと逆向き（行単位）。先端が v の小さい側。"""
    return np.maximum(_layer(a, v, seed), _layer(a + 0.5, v + 0.37, seed + 5))

class Fur:
    """毛の流れの座標系。メッシュの凹凸とテクスチャの陰影で同じものを使う。"""
    def __init__(self, spec):
        P, J = spec.P, spec.J
        self.P = P; self.yc = P.belly_c[1]; self.groups = {}
        self.ncol_v = max(8, int(round(2 * np.pi * P.belly_r[0] * 0.85 / P.tuft_w)))
        for sn, s in SIDES:
            a, b = J['upper_arm.' + sn], J['wrist.' + sn]
            self.groups['a' + sn] = (a, norm(b - a), max(5, int(round(2 * np.pi * P.arm_r[1] / P.tuft_w))))
        a = J['tail_01']; self.groups['t'] = (a, norm(J['tail_tip'] - a), max(5, int(round(2 * np.pi * P.tail_r[0] / P.tuft_w))))
        self.flows = ['v', 'aL', 'aR', 't']
    def coords(self, P, g, scale=1.0):
        Ph = self.P.tuft_h / scale
        if g == 'v':
            th = np.arctan2(P[:, 0], -(P[:, 1] - self.yc)); n = int(round(self.ncol_v * scale))
            return th / (2 * np.pi) * n, P[:, 2] / Ph
        a, d, n = self.groups[g]; n = int(round(n * scale))
        q = P - a; t = q @ d; perp = q - t[:, None] * d
        e1 = norm(np.cross(d, V(0, 1, 0.3))); e2 = np.cross(d, e1)
        return np.arctan2(perp @ e1, perp @ e2) / (2 * np.pi) * n, -t / Ph
    def height(self, P, FW, scale=1.0, seed=1):
        """FW: [N,4] 流れグループの重み。"""
        h = 0
        for i, g in enumerate(self.flows):
            if FW[:, i].max() < 1e-3: continue
            a, v = self.coords(P, g, scale); h = h + FW[:, i] * pattern(a, v, seed + i * 3)
        return h
    def flow_weights(self, prims, Wp):
        idx = {g: i for i, g in enumerate(self.flows)}; FW = np.zeros((Wp.shape[0], 4))
        for j, pr in enumerate(prims): FW[:, idx[pr.flow]] += Wp[:, j]
        return FW

def build_body_mesh(spec, log=print):
    P = spec.P; prims = spec.prims; h = P.voxel
    lo = np.min([pr.bbox(0.03)[0] for pr in prims], axis=0); hi = np.max([pr.bbox(0.03)[1] for pr in prims], axis=0)
    lo[2] = min(lo[2], -0.03)
    grid = Grid(lo, hi, h); log('  grid', grid.shape)
    F = eval_field(prims, grid)
    # 表面近くだけ毛束ぶん膨らませる
    fur = Fur(spec); band = P.tuft_amp * 1.6 + 2 * h
    ii = np.argwhere(np.abs(F) < band)
    tuft = np.array([pr.tuft for pr in prims])
    for c0 in range(0, len(ii), 150000):
        ix = ii[c0:c0 + 150000]; pts = grid.lo + ix * h
        Wp, _ = attribution(prims, pts)
        amp = (Wp @ tuft) * P.tuft_amp
        hh = fur.height(pts, fur.flow_weights(prims, Wp))
        big = 0.5 + 0.5 * np.sin(pts[:, 2] * 38 + np.arctan2(pts[:, 0], -pts[:, 1]) * 5)      # ゆるい大きなうねり
        F[ix[:, 0], ix[:, 1], ix[:, 2]] -= (amp * (0.25 + hh) * (0.8 + 0.2 * big)).astype(np.float32)
    F = np.maximum(F, -(grid.lo[2] + np.arange(grid.shape[2]) * h)[None, None, :].astype(np.float32) - 0.0005)   # 床より下は切る（足裏を平らに）
    verts, faces, _, _ = measure.marching_cubes(F, level=0.0, spacing=(h, h, h))
    verts = verts + grid.lo
    v0, v1, v2 = verts[faces[:, 0]], verts[faces[:, 1]], verts[faces[:, 2]]
    if np.einsum('ij,ij->i', v0, np.cross(v1, v2)).sum() < 0: faces = faces[:, ::-1]
    log('  marching cubes: %d verts %d tris' % (len(verts), len(faces)))
    return verts, faces, grid, F

class Field:
    """完成した距離場グリッドを点でサンプルする（装飾の配置用）"""
    def __init__(self, grid, F): self.g, self.F = grid, F
    def __call__(self, P):
        c = ((np.atleast_2d(P) - self.g.lo) / self.g.h).T
        return ndimage.map_coordinates(self.F, c, order=1, mode='nearest')
    def grad(self, P, e=0.004):
        P = np.atleast_2d(P); g = np.stack([self(P + V(*d) * e) - self(P - V(*d) * e) for d in ((1, 0, 0), (0, 1, 0), (0, 0, 1))], axis=1)
        return g / (np.linalg.norm(g, axis=1, keepdims=True) + 1e-9)
    def push_out(self, P, margin, it=6):
        P = np.array(P, dtype=np.float64)
        for _ in range(it):
            d = self(P); m = d < margin
            if not m.any(): break
            P[m] += self.grad(P[m]) * (margin - d[m])[:, None]
        return P

def decimate(verts, faces, target, sym=True):
    import bpy
    me = bpy.data.meshes.new('tmp'); me.from_pydata(verts.tolist(), [], faces.tolist()); me.update()
    ob = bpy.data.objects.new('tmp', me); bpy.context.scene.collection.objects.link(ob)
    bpy.context.view_layer.objects.active = ob
    m = ob.modifiers.new('sm', 'SMOOTH'); m.factor = 0.5; m.iterations = 2
    m = ob.modifiers.new('dec', 'DECIMATE'); m.ratio = min(1.0, target / len(faces)); m.use_symmetry = sym; m.symmetry_axis = 'X'
    dg = bpy.context.evaluated_depsgraph_get(); ev = ob.evaluated_get(dg); m2 = bpy.data.meshes.new_from_object(ev)
    m2.calc_loop_triangles()
    v = np.empty(len(m2.vertices) * 3); m2.vertices.foreach_get('co', v)
    f = np.empty(len(m2.loop_triangles) * 3, dtype=np.int32); m2.loop_triangles.foreach_get('vertices', f)
    bpy.data.objects.remove(ob); bpy.data.meshes.remove(me); bpy.data.meshes.remove(m2)
    return v.reshape(-1, 3), f.reshape(-1, 3)

# ---------- 小物メッシュ ----------
def uv_sphere(c, r, nu=14, nv=9, R=None):
    r = np.broadcast_to(np.asarray(r, dtype=float), (3,)); vs = [(0, 0, 1)]
    for j in range(1, nv):
        ph = np.pi * j / nv
        for i in range(nu):
            th = 2 * np.pi * i / nu; vs.append((np.sin(ph) * np.cos(th), np.sin(ph) * np.sin(th), np.cos(ph)))
    vs.append((0, 0, -1)); vs = np.array(vs); fs = []
    for i in range(nu): fs.append((0, 1 + i, 1 + (i + 1) % nu))
    for j in range(nv - 2):
        for i in range(nu):
            a = 1 + j * nu + i; b = 1 + j * nu + (i + 1) % nu; c2 = a + nu; d = b + nu
            fs += [(a, c2, b), (b, c2, d)]
    last = len(vs) - 1; base = 1 + (nv - 2) * nu
    for i in range(nu): fs.append((last, base + (i + 1) % nu, base + i))
    vs = vs * r
    if R is not None: vs = vs @ np.asarray(R).T
    return vs + c, np.array(fs)

def surface_ring(field, center, n, rmax, width, thick, nseg=56, rows=5, lift=0.0015, smooth=3, mode='outer', ell=None):
    """表面に沿う帯（ハチマキ・帯・リストバンド）。戻り値: verts, faces, 外側半径関数用の情報"""
    n = norm(n); a = norm(np.cross(n, V(0.0, 1.0, 0.0)) if abs(n[1]) < 0.9 else np.cross(n, V(1.0, 0, 0))); b = np.cross(n, a)
    ws = np.linspace(-width / 2, width / 2, rows); phis = np.linspace(0, 2 * np.pi, nseg, endpoint=False)
    rs = np.linspace(rmax, 0.004, int(rmax / 0.0012)); Rin = np.zeros((nseg, rows))
    for j, w in enumerate(ws):
        for i, ph in enumerate(phis):
            d = np.cos(ph) * a + np.sin(ph) * b; pts = center + n * w + rs[:, None] * d
            f = field(pts)
            if mode == 'inner':               # 中心から外へ向かって最初に体の外へ出る位置（首や胴のように腕が近い所で使う）
                fi = f[::-1]; ri = rs[::-1]; k = np.argmax(fi > 0)
                if fi[k] <= 0: Rin[i, j] = rmax; continue
                k0 = max(k - 1, 0); t = fi[k0] / (fi[k0] - fi[k] + 1e-9) if k > 0 else 0
                Rin[i, j] = ri[k0] + (ri[k] - ri[k0]) * t
                if ell is not None: Rin[i, j] = min(Rin[i, j], 1.0 / np.linalg.norm(d / np.asarray(ell)))   # 腕や脚の方へ広がらないよう、胴の楕円で頭打ち
                continue
            k = np.argmax(f < 0)
            if f[k] >= 0: Rin[i, j] = 0.01; continue
            k0 = max(k - 1, 0); t = f[k0] / (f[k0] - f[k] + 1e-9) if k > 0 else 0
            Rin[i, j] = rs[k0] + (rs[k] - rs[k0]) * t
    for _ in range(smooth):
        Rin = (np.roll(Rin, 1, 0) + 2 * Rin + np.roll(Rin, -1, 0)) / 4
    Rin = np.maximum(Rin, Rin.max(axis=1, keepdims=True) - 0.006) + lift       # 帯は面として張る（毛の谷に沈まない）
    prof = [(ws[j], 0.0) for j in range(rows)] + [(ws[j] * 0.92, thick) for j in reversed(range(rows))]
    m = len(prof); verts = []
    for i, ph in enumerate(phis):
        d = np.cos(ph) * a + np.sin(ph) * b
        for q, (w, t) in enumerate(prof):
            j = q if q < rows else 2 * rows - 1 - q
            verts.append(center + n * w + d * (Rin[i, j] + t))
    faces = []
    for i in range(nseg):
        i2 = (i + 1) % nseg
        for q in range(m):
            q2 = (q + 1) % m; A, B, C, D = i * m + q, i * m + q2, i2 * m + q, i2 * m + q2
            faces += [(A, C, B), (B, C, D)]
    verts = np.array(verts); faces = np.array(faces)
    cen = verts.mean(axis=0); v0, v1, v2 = verts[faces[:, 0]] - cen, verts[faces[:, 1]] - cen, verts[faces[:, 2]] - cen
    if np.einsum('ij,ij->i', v0, np.cross(v1, v2)).sum() < 0: faces = faces[:, ::-1]
    def at(ph, extra=0.0):
        i = int(round(ph / (2 * np.pi) * nseg)) % nseg; d = np.cos(phis[i]) * a + np.sin(phis[i]) * b
        return center + d * (Rin[i, rows // 2] + thick + extra), d
    return verts, faces, at

def strip(p0, d, length, width, thick, wdir, field=None, nseg=7, taper=0.85, curve=None):
    """垂れ布。p0 から d 方向へ。戻り値 verts, faces, 中心線の点列"""
    d = norm(d); wdir = norm(wdir - d * (d @ wdir)); nn = np.cross(d, wdir); cl = []; verts = []
    for i in range(nseg + 1):
        t = i / nseg; c = p0 + d * length * t + (curve * np.sin(t * np.pi) if curve is not None else 0)
        cl.append(c)
    cl = np.array(cl)
    if field is not None: cl = field.push_out(cl, thick + 0.004)
    for i, c in enumerate(cl):
        t = i / nseg; w = width * (1 - (1 - taper) * (1 - t)) * 0.5
        for sx, sz in ((-1, -1), (1, -1), (1, 1), (-1, 1)): verts.append(c + wdir * w * sx + nn * thick * 0.5 * sz)
    faces = []
    for i in range(nseg):
        for q in range(4):
            q2 = (q + 1) % 4; A, B, C, D = i * 4 + q, i * 4 + q2, (i + 1) * 4 + q, (i + 1) * 4 + q2
            faces += [(A, B, C), (B, D, C)]
    e = nseg * 4; faces += [(0, 2, 1), (0, 3, 2), (e, e + 1, e + 2), (e, e + 2, e + 3)]
    verts = np.array(verts); faces = np.array(faces)
    cen = verts.mean(axis=0); v0, v1, v2 = verts[faces[:, 0]] - cen, verts[faces[:, 1]] - cen, verts[faces[:, 2]] - cen
    if np.einsum('ij,ij->i', v0, np.cross(v1, v2)).sum() < 0: faces = faces[:, ::-1]
    return verts, faces, cl

PART = dict(body=0, cloth=1, eye=2, shine=3)

def build_extras(spec, field):
    """目・装飾。戻り値: parts=[dict(verts, faces, part, weights)], bones=[(name, head, tail, parent, dyn)]
    weights: 'transfer'（近くの体表からコピー）/ {bone:1} / ('chain', 中心線, [bone...], anchor)"""
    P, J = spec.P, spec.J; parts = []; bones = []; hc = V(*P.head_c)
    # 目
    spec.eye_centers = []
    for (sn, s), e0 in zip(SIDES, P.eyes):
        ys = np.linspace(e0[1] - 0.06, e0[1] + 0.08, 200); pts = np.stack([np.full(200, e0[0]), ys, np.full(200, e0[2])], axis=1)
        k = np.argmax(field(pts) < 0); sp = pts[k]; nrm = field.grad(sp)[0]
        c = sp - nrm * P.eye_r * P.eye_sink; spec.eye_centers.append(c)
        v, f = uv_sphere(c, P.eye_r); parts.append(dict(verts=v, faces=f, part='eye', weights={'head': 1}, tag='eye.' + sn))
        hd = norm(nrm + V(s * 0.25, 0, 0.75) * 0.9); sc = c + hd * P.eye_r * 0.86
        Rm = rot_from_axes(z=hd, y=V(0, 0, 1.0) if abs(hd[2]) < 0.9 else V(0, 1.0, 0))
        v, f = uv_sphere(sc, V(P.eye_r * 0.26, P.eye_r * 0.26, P.eye_r * 0.14), nu=8, nv=4, R=Rm)
        parts.append(dict(verts=v, faces=f, part='shine', weights={'head': 1}, tag='shine.' + sn))
    acc = P.accessories
    if 'headband' in acc:
        n = norm(V(0, 0.16, 1)); c = hc + V(0, 0.0, P.head_r[2] * 0.50)
        v, f, at = surface_ring(field, c, n, 0.2, 0.027, 0.0045)
        parts.append(dict(verts=v, faces=f, part='cloth', weights={'head': 1}, tag='headband'))
        ph = np.arctan2(0.62, -0.78)                      # 本人の右・やや後ろ
        a_ = norm(np.cross(n, V(0.0, 1.0, 0.0))); b_ = np.cross(n, a_)
        # 角度は ring 内の基底(a,b)で測るので、目的の方向から逆算する
        want = norm(V(-0.80, 0.60, 0)); ph = np.arctan2(want @ b_, want @ a_) % (2 * np.pi)
        kp, kd = at(ph, 0.006)
        v, f = uv_sphere(kp, V(0.016, 0.020, 0.017), nu=10, nv=6, R=rot_from_axes(x=kd, z=n))
        parts.append(dict(verts=v, faces=f, part='cloth', weights={'head': 1}, tag='knot'))
        for i, (dv, ln, wd) in enumerate(((V(-0.42, 0.40, -0.82), 0.125, 0.034), (V(-0.12, 0.62, -0.78), 0.095, 0.030))):
            v, f, cl = strip(kp + kd * 0.004, dv, ln, wd, 0.004, np.cross(dv, kd), field)
            nm = ['band_%s_%02d' % ('ab'[i], q + 1) for q in range(2)]
            parts.append(dict(verts=v, faces=f, part='cloth', weights=('chain', cl, nm, 'head'), tag='bandtail%d' % i))
            mid = cl[len(cl) // 2]
            bones += [(nm[0], cl[0], mid, 'head', dict(stiff=90, damp=9, grav=0.35)), (nm[1], mid, cl[-1], nm[0], dict(stiff=70, damp=8, grav=0.35))]
    if 'belt' in acc:
        zb = (P.belly_c[2] + P.belly_r[2] * 0.50); c = V(0, P.belly_c[1], zb)
        v, f, at = surface_ring(field, c, V(0, 0, 1.0), P.belly_r[0] * 1.22, 0.042, 0.007, nseg=64)
        parts.append(dict(verts=v, faces=f, part='cloth', weights=('prim', 'belly'), tag='belt'))
        a_ = norm(np.cross(V(0, 0, 1.0), V(0.0, 1.0, 0.0))); b_ = np.cross(V(0, 0, 1.0), a_)
        want = V(0, -1.0, 0); ph = np.arctan2(want @ b_, want @ a_) % (2 * np.pi)
        kp, kd = at(ph, 0.008)
        v, f = uv_sphere(kp, V(0.030, 0.016, 0.026), nu=10, nv=6)
        parts.append(dict(verts=v, faces=f, part='cloth', weights=('prim', 'belly'), tag='beltknot'))
        for i, sx in enumerate((1, -1)):
            dv = V(sx * 0.40, -0.10, -0.91)
            v, f, cl = strip(kp + V(sx * 0.012, -0.006, -0.008), dv, 0.125, 0.040, 0.006, np.cross(dv, V(0, -1.0, 0)), field, taper=0.9)
            nm = ['belt_%s_%02d' % ('ab'[i], q + 1) for q in range(2)]
            parts.append(dict(verts=v, faces=f, part='cloth', weights=('chain', cl, nm, 'spine'), tag='belttail%d' % i))
            mid = cl[len(cl) // 2]
            bones += [(nm[0], cl[0], mid, 'spine', dict(stiff=110, damp=10, grav=0.5)), (nm[1], mid, cl[-1], nm[0], dict(stiff=90, damp=9, grav=0.5))]
    torso_prims = [pr for pr in spec.prims if pr.name in ('belly', 'chest', 'neckmass')]
    class _Torso:                       # 胴だけの距離場。首飾り・スカーフ・たすきが腕や脚の方へ広がらないようにする
        def __call__(self, pts): return eval_points(torso_prims, np.atleast_2d(pts)) - P.tuft_amp * 1.2
    torso = _Torso()
    def ring_angle(n, want):
        a_ = norm(np.cross(n, V(0.0, 1.0, 0.0)) if abs(n[1]) < 0.9 else np.cross(n, V(1.0, 0, 0))); b_ = np.cross(n, a_)
        return np.arctan2(want @ b_, want @ a_) % (2 * np.pi)
    if 'scarf' in acc:                      # 首に巻いた厚手の布。2本の輪を重ねて前に垂らす
        for i, (dz, tilt, wd, th) in enumerate(((0.022, -0.10, 0.060, 0.020), (-0.016, -0.36, 0.056, 0.018))):
            n = norm(V(0, tilt, 1)); c = V(0, P.neck_c[1], P.neck_c[2] + dz)
            v, f, at = surface_ring(torso, c, n, P.neck_r[0] * 1.5, wd, th, nseg=48, rows=5, lift=0.002, mode='inner')
            parts.append(dict(verts=v, faces=f, part='cloth', weights=('prim', 'neckmass'), tag='scarf%d' % i))
    if 'necklace' in acc:                   # 細いひも＋飾り。前が低くなるよう傾ける
        n = norm(V(0, -0.50, 1)); c = V(0, P.neck_c[1] + 0.010, P.neck_c[2] + 0.012)
        v, f, at = surface_ring(torso, c, n, P.neck_r[0] * 1.45, 0.007, 0.0055, nseg=44, rows=3, lift=0.002, mode='inner')
        parts.append(dict(verts=v, faces=f, part='cloth', weights=('prim', 'neckmass'), tag='necklace'))
        ph0 = ring_angle(n, norm(V(0, -1.0, -0.5)))
        if P.necklace.get('pendant') == 'beads':
            for i, da in enumerate((-0.42, -0.14, 0.14, 0.42)):
                kp, kd = at(ph0 + da, 0.004); v, f = uv_sphere(kp, 0.0115 if abs(da) < 0.2 else 0.010, nu=10, nv=6)
                parts.append(dict(verts=v, faces=f, part='cloth', weights=('prim', 'neckmass'), tag='bead%d' % i))
        else:
            kp, kd = at(ph0, 0.004)
            v, f = uv_sphere(kp + V(0, -0.002, -0.008), V(0.007, 0.007, 0.008), nu=8, nv=5); parts.append(dict(verts=v, faces=f, part='cloth', weights=('prim', 'neckmass'), tag='tassel_knot'))
            v, f = uv_sphere(kp + V(0, -0.003, -0.026), V(0.008, 0.008, 0.016), nu=8, nv=5); parts.append(dict(verts=v, faces=f, part='cloth', weights=('prim', 'neckmass'), tag='tassel'))
    if 'sash' in acc:                       # 左肩から右腰へ掛けた太い縄
        zc = (P.sh_z + P.hip_z) / 2 + 0.035; n = norm(V(-1.15, 0, 1)); c = V(0.0, P.chest_c[1], zc)
        v, f, at = surface_ring(torso, c, n, max(P.chest_r[0], P.belly_r[0]) * 1.6, 0.030, 0.020, nseg=64, rows=3, lift=0.002, mode='inner')
        parts.append(dict(verts=v, faces=f, part='cloth', weights=('prim', 'chest'), tag='sash'))
    if 'wristbands' in acc:
        wb = P.wristband
        for sn, s in SIDES:
            if sn not in wb.get('sides', 'LR'): continue
            W = J['wrist.' + sn]; d = norm(W - J['forearm.' + sn]); c = W - d * wb['width'] * 0.50
            v, f, _ = surface_ring(field, c, d, P.arm_r[2] * 2.2, wb['width'], wb['thick'], nseg=28, rows=4, lift=0.001)
            parts.append(dict(verts=v, faces=f, part='cloth', weights={'forearm_twist.' + sn: 0.6, 'wrist.' + sn: 0.4}, tag='wristband.' + sn))
    return parts, bones
