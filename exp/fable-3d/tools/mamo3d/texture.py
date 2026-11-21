"""UV展開（xatlas）と、位置ベースの手続き的な毛並みテクスチャの焼き込み（numpy）。Cycles のベイクは使わない。"""
import numpy as np, xatlas
from .sdf import smoothstep, vnoise, norm
from .body import attribution, Fur, PART
from .characters import V, SIDES

def unwrap(verts, faces, res=1024, padding=3):
    atlas = xatlas.Atlas(); atlas.add_mesh(verts.astype(np.float32), faces.astype(np.uint32))
    po = xatlas.PackOptions(); po.padding = padding; po.resolution = res; po.bilinear = True
    atlas.generate(pack_options=po)
    vmap, idx, uvs = atlas[0]
    assert np.array_equal(vmap[idx], faces), 'xatlas が面の順序を変えた'
    return uvs[idx]                                   # [F,3,2] 面の角ごとのUV

def rasterize(face_uv, T):
    fid = np.full((T, T), -1, dtype=np.int32); bary = np.zeros((T, T, 3), dtype=np.float32)
    uv = face_uv * T
    for f in range(len(uv)):
        a, b, c = uv[f]; x0 = max(int(np.floor(min(a[0], b[0], c[0]) - 1)), 0); x1 = min(int(np.ceil(max(a[0], b[0], c[0]) + 1)), T - 1)
        y0 = max(int(np.floor(min(a[1], b[1], c[1]) - 1)), 0); y1 = min(int(np.ceil(max(a[1], b[1], c[1]) + 1)), T - 1)
        if x1 < x0 or y1 < y0: continue
        xs, ys = np.meshgrid(np.arange(x0, x1 + 1) + 0.5, np.arange(y0, y1 + 1) + 0.5)
        den = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1])
        if abs(den) < 1e-12: continue
        w0 = ((b[1] - c[1]) * (xs - c[0]) + (c[0] - b[0]) * (ys - c[1])) / den
        w1 = ((c[1] - a[1]) * (xs - c[0]) + (a[0] - c[0]) * (ys - c[1])) / den; w2 = 1 - w0 - w1
        e = -0.75 / max(np.sqrt(abs(den)), 1e-6)       # 境界を少しはみ出して塗る
        m = (w0 >= e) & (w1 >= e) & (w2 >= e)
        yy, xx = np.nonzero(m); Y = yy + y0; X = xx + x0
        fid[Y, X] = f; bary[Y, X, 0] = w0[m]; bary[Y, X, 1] = w1[m]; bary[Y, X, 2] = w2[m]
    return fid, bary

def dilate(img, mask, it=8):
    img = img.copy(); mask = mask.copy()
    for _ in range(it):
        acc = np.zeros_like(img); cnt = np.zeros(mask.shape)
        for dy, dx in ((0, 1), (0, -1), (1, 0), (-1, 0)):
            sm = np.roll(mask, (dy, dx), (0, 1)); acc += np.roll(img, (dy, dx), (0, 1)) * sm[..., None]; cnt += sm
        new = (~mask) & (cnt > 0); img[new] = acc[new] / cnt[new][:, None]; mask |= new
    return img

def mouth_lines(spec, field):
    """口の線（鼻の下の縦線＋左右へ下がる線）を表面上の折れ線で返す"""
    P = spec.P; hc = V(*P.head_c); nz = hc[2] + P.nose_off[2] - P.nose_r[2] * 0.9; mz = hc[2] + P.muzzle_off[2] - P.muzzle_r[2] * 0.42
    def surf(x, z):
        ys = np.linspace(hc[1] - 0.2, hc[1], 240); pts = np.stack([np.full(240, x), ys, np.full(240, z)], axis=1)
        k = np.argmax(field(pts) < 0); return pts[k]
    segs = []; ph = [surf(0, z) for z in np.linspace(nz, mz, 5)]; segs.append(np.array(ph))
    mw = P.muzzle_r[0] * P.__dict__.get('mouth_w', 0.72); curve = P.__dict__.get('mouth_curve', -0.5)   # 負=への字
    for s in (1, -1):
        xs = np.linspace(0, mw, 9); segs.append(np.array([surf(s * x, mz + curve * P.muzzle_r[2] * 0.5 * (x / mw) ** 1.6 + 0.004 * np.sin(x / mw * np.pi)) for x in xs]))
    return segs

def seg_dist(P, poly):
    d = np.full(len(P), 9.0)
    for a, b in zip(poly[:-1], poly[1:]):
        ab = b - a; t = np.clip(((P - a) @ ab) / (ab @ ab + 1e-12), 0, 1); d = np.minimum(d, np.linalg.norm(P - (a + t[:, None] * ab), axis=1))
    return d

def shade(spec, field, pos, nrm, part):
    """位置・法線・部位 → 色 [N,3]（リニアではなく表示用sRGB値として扱う）"""
    P, J, prims = spec.P, spec.J, spec.prims; C = {k: np.array(v) for k, v in P.colors.items()}; N = len(pos)
    out = np.zeros((N, 3)); fur = Fur(spec)
    Wp, D = attribution(prims, pos, tau=0.006)
    def g(*prefix): return sum(Wp[:, j] for j, pr in enumerate(prims) if pr.group.startswith(prefix))
    FW = fur.flow_weights(prims, Wp); tuft = Wp @ np.array([pr.tuft for pr in prims])
    x, y, z = pos.T
    n1 = vnoise(pos, 45, 3); n2 = vnoise(pos, 140, 4)
    # 地色: 背・側面は濃く
    dark = np.clip(smoothstep(-0.35, 0.7, nrm[:, 1]) * 0.75 + smoothstep(0.3, 1.0, nrm[:, 2]) * 0.35 + (n1 - 0.5) * 0.35, 0, 1)
    col = C['fur'] * (1 - dark[:, None]) + C['fur_dark'] * dark[:, None]
    # 腹〜胸の明色
    zt = P.neck_c[2] + P.neck_r[2] * 0.2; zb = P.belly_c[2] - P.belly_r[2] * 0.95; zc = (zt + zb) / 2
    e = np.sqrt((x / (P.belly_r[0] * P.belly_w)) ** 2 + ((z - zc) / ((zt - zb) / 2)) ** 2) + (n1 - 0.5) * 0.35 + (n2 - 0.5) * 0.15
    mb = (1 - smoothstep(0.62, 1.05, e)) * smoothstep(0.05, 0.55, -nrm[:, 1]) * P.belly_patch * (1 - np.clip(g('arm', 'fist', 'fingers') * 3, 0, 1))
    col = col * (1 - mb[:, None]) + C['belly'] * mb[:, None]
    # マズル・頬・あご
    mm = np.clip(g('muzzle') + g('chin') + g('cheek') * smoothstep(0.2, 0.8, -nrm[:, 1]) * smoothstep(0.1, -0.5, nrm[:, 2]) * 0.9, 0, 1); mm = smoothstep(0.25, 0.8, mm + (n1 - 0.5) * 0.3)
    col = col * (1 - mm[:, None]) + C['muzzle'] * mm[:, None]
    if 'brow' in C:
        m = smoothstep(0.35, 0.7, g('brow')); col = col * (1 - m[:, None]) + C['brow'] * m[:, None]
    # --- roster9 の配色パターン（指定があるキャラだけ） ---
    hc = np.array(P.head_c); hr = np.array(P.head_r); gh = np.clip(g('head', 'cheek', 'muzzle', 'ear', 'brow', 'chin'), 0, 1)
    if 'tail' in C:
        m = smoothstep(0.3, 0.7, g('tail') + (n1 - 0.5) * 0.3); col = col * (1 - m[:, None]) + C['tail'] * m[:, None]
    if P.cap:                                # 頭頂の濃色。stripe があれば鼻筋へ細く下ろす
        zr = (z - hc[2]) / hr[2] + (n1 - 0.5) * 0.25 + (n2 - 0.5) * 0.1
        m = smoothstep(P.cap['z0'] - 0.12, P.cap['z0'] + 0.12, zr + 0.25 * smoothstep(-0.2, 0.6, nrm[:, 1]))
        if P.cap.get('stripe'):
            w = P.cap['stripe'] * (1 + 0.8 * np.clip((z - (hc[2] + P.nose_off[2])) / (hr[2] * 0.5), 0, 2))
            m = np.maximum(m, (1 - smoothstep(w * 0.7, w * 1.3, np.abs(x) + (n2 - 0.5) * 0.006)) * smoothstep(0.0, 0.2, -nrm[:, 1]) * smoothstep(hc[2] + P.nose_off[2] + P.nose_r[2], hc[2] + P.nose_off[2] + P.nose_r[2] + 0.012, z))
        m = m * smoothstep(0.4, 0.7, gh); col = col * (1 - m[:, None]) + C['cap'] * m[:, None]
    if P.mask:                               # 目のまわり〜下の濃い斑
        for (sn, s), ec in zip(SIDES, spec.eye_centers):
            q = ec + np.array([s * P.mask['dx'], 0, P.mask['dz']]) * P.eye_r * 2.0
            d = np.linalg.norm((pos - q) * np.array([1.0, 0.6, 1.15]), axis=1) / (P.eye_r * P.mask['r']) + (n1 - 0.5) * 0.3
            m = (1 - smoothstep(0.75, 1.1, d)) * smoothstep(0.4, 0.7, gh); col = col * (1 - m[:, None]) + C['mask'] * m[:, None]
    if P.blaze:                              # 額から鼻への白い筋
        w = P.blaze['w'] * (0.7 + 0.9 * np.clip((hc[2] + hr[2] * 0.6 - z) / (hr[2] * 0.9), 0, 1.2))
        m = (1 - smoothstep(w * 0.75, w * 1.25, np.abs(x) + (n2 - 0.5) * 0.008)) * smoothstep(0.05, 0.3, -nrm[:, 1]) * smoothstep(0.4, 0.7, gh) * smoothstep(hc[2] + P.nose_off[2] + P.nose_r[2], hc[2] + P.nose_off[2] + P.nose_r[2] + 0.01, z)
        col = col * (1 - m[:, None]) + C['blaze'] * m[:, None]
    if 'ear' in C:
        m = smoothstep(0.3, 0.6, g('ear')); col = col * (1 - m[:, None]) + C['ear'] * m[:, None]
    # 耳の内側
    m = smoothstep(0.3, 0.7, g('ear')) * smoothstep(0.1, 0.6, -nrm[:, 1]); col = col * (1 - m[:, None] * 0.8) + C['ear_in'] * m[:, None] * 0.8
    bare = np.zeros(N)
    # 拳（前腕へグラデーション）
    for sn, s in SIDES:
        W = J['wrist.' + sn]; dF = norm(J['paw_tip.' + sn] - W); t = (pos - W) @ dF
        ga = g('arm' + sn, 'fist' + sn, 'fingers' + sn, 'fclaws' + sn)
        m = smoothstep(-P.fa * P.paw_fade, P.fist[0] * 0.15, t + (n1 - 0.5) * 0.03) * smoothstep(0.3, 0.6, ga)
        col = col * (1 - m[:, None]) + C['paw'] * m[:, None]
        mf = smoothstep(0.35, 0.65, g('fist' + sn, 'fingers' + sn, 'fclaws' + sn)); bare = np.maximum(bare, mf)
        mc = smoothstep(0.45, 0.6, g('fclaws' + sn)); col = col * (1 - mc[:, None]) + C['claw'] * mc[:, None]
        # 指の溝を少し暗く
        gf = [Wp[:, j] for j, pr in enumerate(prims) if pr.group == 'fingers' + sn]
        if gf:
            top = np.sort(np.stack(gf, 1), axis=1); crease = smoothstep(0.25, 0.5, top[:, -2]) * mf
            col *= (1 - 0.35 * crease[:, None])
        # 足
        gl = g('leg' + sn, 'foot' + sn, 'toes' + sn, 'tclaws' + sn)
        m = (1 - smoothstep(P.ankle_z * 0.75, P.ankle_z * 1.45 * P.foot_fade, z + (n1 - 0.5) * 0.015)) * smoothstep(0.3, 0.6, gl)
        col = col * (1 - m[:, None]) + C['foot'] * m[:, None]
        mf = smoothstep(0.35, 0.65, g('foot' + sn, 'toes' + sn, 'tclaws' + sn)); bare = np.maximum(bare, mf)
        mc = smoothstep(0.45, 0.6, g('tclaws' + sn)); col = col * (1 - mc[:, None]) + C['claw'] * mc[:, None]
    # 毛並みの陰影
    h1 = fur.height(pos, FW, 1.0, 1); h2 = fur.height(pos, FW, 2.4, 9)
    st = FW[:, 0] * vnoise(pos, (620, 620, 60), 5) + FW[:, 1] * vnoise(pos, (60, 620, 620), 5) + FW[:, 2] * vnoise(pos, (60, 620, 620), 5) + FW[:, 3] * vnoise(pos, (620, 60, 620), 5)
    st2 = FW[:, 0] * vnoise(pos, (260, 260, 26), 6) + (1 - FW[:, 0]) * vnoise(pos, 200, 6)
    k = np.clip(0.35 + tuft * 0.75, 0, 1) * (1 - bare)
    f = 1 + k * (0.17 * (h1 - 0.45) + 0.13 * (h2 - 0.4) + P.strand * (0.26 * (st - 0.5) + 0.16 * (st2 - 0.5)))
    if P.grizzle: f = f * (1 + P.grizzle * (1 - bare) * (vnoise(pos, 420, 11) - 0.5) * 1.2)      # ごま塩毛
    f = f * (1 + bare * 0.12 * (n2 - 0.5))
    col = col * f[:, None]
    # 鼻
    m = smoothstep(0.42, 0.58, g('nose')); col = col * (1 - m[:, None]) + C['nose'] * m[:, None]
    # 口の線、目のふち
    for poly in spec.mouth:
        d = seg_dist(pos, poly); m = (1 - smoothstep(0.0012, 0.0030, d)) * 0.85; col = col * (1 - m[:, None]) + C['nose'] * 0.8 * m[:, None]
    for pr in prims:                      # 怒り眉: 盛り上がりの下に濃い線を入れる
        if pr.group == 'brow':
            off = np.array([0, -0.004, -pr.p['ra'] * 0.95]); d = seg_dist(pos, np.array([pr.p['a'] + off, pr.p['b'] + off * 0.8]))
            m = (1 - smoothstep(0.0022, 0.0048, d)) * 0.8; col = col * (1 - m[:, None]) + C['nose'] * m[:, None]
    for c in spec.eye_centers:
        d = np.linalg.norm(pos - c, axis=1); m = (1 - smoothstep(P.eye_r * 1.0, P.eye_r * 1.38, d)) * 0.45; col = col * (1 - m[:, None]) + C['nose'] * m[:, None]
    # 簡易AO（距離場から）
    ao = np.clip(field(pos + nrm * 0.014) / 0.014, 0, 1) * 0.6 + np.clip(field(pos + nrm * 0.04) / 0.04, 0, 1) * 0.4
    col = col * (0.62 + 0.38 * ao)[:, None]
    # 装飾・目
    mcl = part == PART['cloth']
    if mcl.any():
        cc = C['cloth'] * (0.88 + 0.2 * vnoise(pos[mcl], (300, 300, 300), 8) * 0.6 + 0.12 * vnoise(pos[mcl], 60, 2))[:, None]
        col[mcl] = cc * (0.75 + 0.25 * np.clip(field(pos[mcl] + nrm[mcl] * 0.02) / 0.02, 0, 1))[:, None]
    col[part == PART['shine']] = 1.0; col[part == PART['eye']] = 0.02
    return np.clip(col, 0, 1)

def bake(spec, field, verts, faces, vnormals, face_part, res=1024, log=print):
    face_uv = unwrap(verts, faces, res)
    fid, bary = rasterize(face_uv, res)
    m = fid >= 0; f = fid[m]; b = bary[m].astype(np.float64)
    pos = np.einsum('nk,nkd->nd', b, verts[faces[f]]); nr = np.einsum('nk,nkd->nd', b, vnormals[faces[f]])
    nr /= np.linalg.norm(nr, axis=1, keepdims=True) + 1e-9
    col = np.zeros((len(pos), 3))
    for c0 in range(0, len(pos), 120000):
        sl = slice(c0, c0 + 120000); col[sl] = shade(spec, field, pos[sl], nr[sl], face_part[f][sl])
    img = np.zeros((res, res, 3)); img[m] = col
    img = dilate(img, m, 10)
    log('  texture: %d texels (%.0f%% of atlas)' % (m.sum(), 100 * m.mean()))
    return face_uv, img
