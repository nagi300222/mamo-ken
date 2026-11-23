"""マモ拳 P2 交換モジュールの中身。host の体に donor の実メッシュ（頂点・三角形そのもの）を載せ替える。

やること（1 モジュール = host × slot × donor）:
  1. donor の slot の三角形を custom/v16/assets/<donor>_parts.glb からそのまま取り出す（頂点数・面の張り方は donor のまま）。
  2. 骨ごとの変換 host のバインド × donor の逆バインド を、donor のスキンウェイトで混ぜて頂点へ掛け、host の骨格のバインド姿勢へ移す（骨名で対応）。
  3. host の同じ slot が他の slot と接していた境界ループ（host の既存境界）を求める。donor 側の境界ループを、その内側 BAND 幅の位置へ寄せる。
     寄せる量は donor メッシュの上で調和関数（ラプラス方程式）として広げ、縁から離れるほど 0 になる。スキンウェイトとモーフも同じ重みで host の境界値へつなぐ。
  4. host の境界頂点の写し（位置・法線・スキンウェイト・4 モーフが host と同じ）を新しく置き、donor の縁との間を三角形の帯でつなぐ（接合帯）。
  5. donor の slot に元からあった開いた穴は、モジュールの中でふたをする（記録する）。
元の GLB と custom/v16/assets は読むだけ。寸法の付け替えではなく、出力の面は donor の面 + 接合帯 + ふた。"""
import collections, hashlib, json, os
import numpy as np
import scipy.sparse as sp
import scipy.sparse.linalg as spl
from scipy.sparse.csgraph import dijkstra
from glbio import unpack, array, Writer

HERE = os.path.dirname(os.path.abspath(__file__)); P2 = os.path.normpath(os.path.join(HERE, '..')); V16 = os.path.normpath(os.path.join(P2, '..', 'v16', 'assets'))
SLOTS = ['body', 'head', 'ears', 'hands', 'feet', 'tail', 'accessory']; MORPHS = ['paw_open.L', 'paw_open.R', 'blink', 'brow_angry']
SOCKET = dict(head='head', ears='head', hands='chest', feet='pelvis', tail='pelvis')
PALETTE_KEYS = ['fur', 'belly', 'muzzle', 'paw', 'foot', 'ear', 'tail', 'accent']
TOL = 0.00002          # 実行時の一致許容 [m]（0.02mm）
WELD = 6               # 位置の溶接は小数 6 桁（1µm）

def sha(b): return hashlib.sha256(b).hexdigest()

class Char:
    """<id>_parts.glb を読み、slot ごとの頂点配列と骨格を持つ"""
    def __init__(self, cid):
        self.id = cid; self.path = os.path.join(V16, cid + '_parts.glb'); j, b, raw = unpack(self.path); self.j, self.b, self.raw_sha = j, b, sha(raw)
        sk = j['skins'][0]; self.joints = [j['nodes'][k]['name'] for k in sk['joints']]; self.joint_nodes = sk['joints']
        self.ibm_raw = array(j, b, sk['inverseBindMatrices']).astype(np.float32); self.ibm = self.ibm_raw.reshape(-1, 4, 4).transpose(0, 2, 1).astype(np.float64); self.bind = np.linalg.inv(self.ibm)
        self.parent = {}
        for n in j['nodes']:
            for c in n.get('children', []): self.parent[j['nodes'][c]['name']] = n['name']
        m = j['meshes'][0]; self.mesh_weights = m.get('weights', [0, 0, 0, 0]); assert m['extras']['targetNames'] == MORPHS, m['extras']
        self.prims = []
        for pr in m['primitives']:
            mat = j['materials'][pr['material']]; A = pr['attributes']
            self.prims.append(dict(slot=mat['extras']['avatarPart'], eye='baseColorTexture' not in mat['pbrMetallicRoughness'], material=mat,
                pos=array(j, b, A['POSITION']).astype(np.float64), nrm=array(j, b, A['NORMAL']).astype(np.float64), uv=array(j, b, A['TEXCOORD_0']).astype(np.float32),
                jn=array(j, b, A['JOINTS_0']).astype(np.int64), w=array(j, b, A['WEIGHTS_0']).astype(np.float64), region=array(j, b, A['_AVATAR_REGION']).ravel().astype(np.float32),
                part=array(j, b, A['_AVATAR_PART']).ravel().astype(np.uint8), idx=array(j, b, pr['indices']).reshape(-1, 3).astype(np.int64),
                morph=[array(j, b, t['POSITION']).astype(np.float64) for t in pr['targets']]))
        # 全体の溶接（同じ位置の頂点 = UV の継ぎ目や slot の境界で重なっている頂点を 1 つに見る）
        allpos = np.concatenate([p['pos'] for p in self.prims]); _, inv = np.unique(np.round(allpos, WELD), axis=0, return_inverse=True); off = 0; self.edge_use = collections.defaultdict(list)
        for pi, p in enumerate(self.prims):
            p['gid'] = inv[off:off + len(p['pos'])]; off += len(p['pos'])
            for f in p['gid'][p['idx']]:
                for a, c in ((f[0], f[1]), (f[1], f[2]), (f[2], f[0])): self.edge_use[(min(a, c), max(a, c))].append(pi)
        img = j['images'][0]; v = j['bufferViews'][img['bufferView']]; self.image = bytes(b[v.get('byteOffset', 0):v.get('byteOffset', 0) + v['byteLength']]); self.image_mime = img['mimeType']
        self.sampler = j.get('samplers', [None])[0]
    def slot_prims(self, slot): return [i for i, p in enumerate(self.prims) if p['slot'] == slot]
    def loops(self, slot):
        """slot の境界ループ。seam = 他の slot と接する閉ループ（頂点は溶接 id の順列）、open = どこにもつながらない元からの穴"""
        mine = set(self.slot_prims(slot)); seam, opn = [], []
        for e, ps in self.edge_use.items():
            k = sum(1 for x in ps if x in mine)
            if k == 0: continue
            if len(ps) == 1: opn.append(e)
            elif k == 1 and len(ps) == 2: seam.append(e)
            elif not (k == 2 and len(ps) == 2): raise ValueError('non-manifold edge in %s %s' % (self.id, slot))
        return self._cycles(seam), self._cycles(opn)
    @staticmethod
    def _cycles(edges):
        adj = collections.defaultdict(list)
        for a, c in edges: adj[a].append(c); adj[c].append(a)
        assert all(len(v) == 2 for v in adj.values()), 'boundary is not a set of simple closed loops'
        seen, out = set(), []
        for s in sorted(adj):
            if s in seen: continue
            cyc = [s]; seen.add(s); prev, cur = None, s
            while True:
                nx = [y for y in adj[cur] if y != prev][0] if prev is not None else adj[cur][0]
                if nx == s: break
                cyc.append(nx); seen.add(nx); prev, cur = cur, nx
            out.append(cyc)
        return out
    def gid_vertex(self, slot):
        """溶接 id -> その slot のプリミティブ内の (prim, 頂点番号) の一覧"""
        d = collections.defaultdict(list)
        for pi in self.slot_prims(slot):
            for vi, g in enumerate(self.prims[pi]['gid']): d[g].append((pi, vi))
        return d
    def palette(self):
        """実際の donor の色（v16 の manifest と同じ値）"""
        m = json.load(open(os.path.join(V16, 'manifest.json'), encoding='utf-8'))['bases'][self.id]['palette']; return {k: m[k] for k in PALETTE_KEYS}

def closed_param(pts):
    """閉じた折れ線の各頂点の弧長パラメータ [0,1) と全長"""
    seg = np.linalg.norm(np.roll(pts, -1, axis=0) - pts, axis=1); L = seg.sum(); return np.concatenate([[0], np.cumsum(seg)[:-1]]) / L, L
def sample_closed(pts, t):
    """閉じた折れ線を弧長パラメータ t（配列）で読む。戻り値 (点, 区間番号, 区間内の比)"""
    u, L = closed_param(pts); t = np.mod(t, 1.0); k = np.searchsorted(u, t, side='right') - 1; nxt = (k + 1) % len(pts); u1 = np.where(nxt == 0, 1.0, u[nxt]); f = (t - u[k]) / np.maximum(u1 - u[k], 1e-12)
    return pts[k] * (1 - f)[:, None] + pts[nxt] * f[:, None], k, f

def top4(names_w):
    """{骨名: 重み} → 上位 4 本に絞って正規化"""
    it = sorted(names_w.items(), key=lambda x: -x[1])[:4]; s = sum(w for _, w in it); return [(n, w / s) for n, w in it if w > 0]

def build_module(H, D, slot, band_scale=0.6, radius=None, scale=None):
    """host H の slot を donor D の実メッシュで置き換えるモジュールを作る。戻り値 dict(meshes=[...], report=...)"""
    rep = dict(host=H.id, donor=D.id, slot=slot); part_id = SLOTS.index(slot)
    hname = {n: i for i, n in enumerate(H.joints)}
    def to_host(n):                                   # donor の骨名 → host にある骨名（無ければ親をたどる）
        while n not in hname: n = D.parent[n]
        return n
    dmap = np.array([hname[to_host(n)] for n in D.joints])
    # ---- 1. donor の slot を取り出す（毛のプリミティブと目のプリミティブ）
    dp = [D.prims[i] for i in D.slot_prims(slot)]; fur = [p for p in dp if not p['eye']]; eye = [p for p in dp if p['eye']]; assert len(fur) == 1 and len(eye) <= 1
    F = fur[0]; nv = len(F['pos'])
    # ---- 2. 骨ごとの変換を混ぜて host のバインド姿勢へ
    hloops, hopen = H.loops(slot); dloops, dopen = D.loops(slot); assert len(hloops) == len(dloops), (len(hloops), len(dloops))
    hg = H.gid_vertex(slot); dg = D.gid_vertex(slot)
    hpos_g = lambda g: H.prims[hg[g][0][0]]['pos'][hg[g][0][1]]
    dfur_index = D.slot_prims(slot)[dp.index(F)]
    dvid = lambda g: [vi for pi, vi in dg[g] if pi == dfur_index]
    if scale is None:                                 # 大きさ: 境界ループの周長比（host / donor）。donor の形はそのまま、host の付け根に合う大きさにする
        hl = sum(closed_param(np.array([hpos_g(g) for g in lp]))[1] for lp in hloops); dl = sum(closed_param(np.array([F['pos'][dvid(g)[0]] for g in lp]))[1] for lp in dloops); scale = float(np.clip(hl / dl, 0.8, 1.25))
    rep['scale'] = round(scale, 4)
    S = np.diag([scale, scale, scale, 1.0]); M = np.einsum('nij,jk,nkl->nil', H.bind[dmap], S, D.ibm)          # donor の骨 n ごとの 4x4
    def retarget(p):
        Mv = np.einsum('vk,vkij->vij', p['w'], M[p['jn']]); pos = np.einsum('vij,vj->vi', Mv[:, :3, :3], p['pos']) + Mv[:, :3, 3]
        nrm = np.einsum('vij,vj->vi', Mv[:, :3, :3], p['nrm']); nrm /= np.maximum(np.linalg.norm(nrm, axis=1, keepdims=True), 1e-12)
        morph = [np.einsum('vij,vj->vi', Mv[:, :3, :3], m) for m in p['morph']]
        W = [collections.defaultdict(float) for _ in range(len(pos))]
        for v in range(len(pos)):
            for k in range(4):
                if p['w'][v, k] > 0: W[v][H.joints[dmap[p['jn'][v, k]]]] += p['w'][v, k]
        return pos, nrm, morph, W
    pos, nrm, morph, W = retarget(F)
    # ---- slot 内の溶接グラフ（毛のプリミティブ）
    key, wid = np.unique(F['gid'], return_inverse=True); nw = len(key); gid2w = {g: i for i, g in enumerate(key)}; wpos = np.zeros((nw, 3)); cnt = np.zeros(nw)
    np.add.at(wpos, wid, pos); np.add.at(cnt, wid, 1); wpos /= cnt[:, None]
    tri = wid[F['idx']]; E = np.unique(np.sort(np.concatenate([tri[:, [0, 1]], tri[:, [1, 2]], tri[:, [2, 0]]]), axis=1), axis=0)
    elen = np.linalg.norm(wpos[E[:, 0]] - wpos[E[:, 1]], axis=1); G = sp.coo_matrix((elen, (E[:, 0], E[:, 1])), shape=(nw, nw)); G = (G + G.T).tocsr()
    # ---- 3. ループの対応づけと、donor の縁の行き先
    hl_pts = [np.array([hpos_g(g) for g in lp]) for lp in hloops]; dl_w = [np.array([gid2w[g] for g in lp]) for lp in dloops]
    used = set(); pairs = []
    for di, dw in enumerate(dl_w):                    # いちばん近い重心どうし
        c = wpos[dw].mean(axis=0); hi = min((i for i in range(len(hloops)) if i not in used), key=lambda i: np.linalg.norm(hl_pts[i].mean(axis=0) - c)); used.add(hi); pairs.append((di, hi))
    # host の境界頂点ごとの「slot の内側へ向かう向き」: host の slot の面の上で、境界に乗っていない隣の頂点への向きの平均
    hslot = [H.prims[i] for i in H.slot_prims(slot) if not H.prims[i]['eye']][0]; hgid = hslot['gid']; hnb = collections.defaultdict(set)
    for f in hgid[hslot['idx']]:
        for a, c in ((f[0], f[1]), (f[1], f[2]), (f[2], f[0])): hnb[a].add(c); hnb[c].add(a)
    hpos_of = {}
    for vi, g in enumerate(hgid): hpos_of.setdefault(g, hslot['pos'][vi])
    target = {}; phi_fix = {}; seam_w = {}; seam_m = {}; loops_out = []; maxd = 0.0
    for di, hi in pairs:
        hp = hl_pts[hi]; hlp = hloops[hi]; dw = dl_w[di]; dpnt = wpos[dw]; onloop = set(hlp)
        inward = np.zeros_like(hp)
        for k, g in enumerate(hlp):
            nb = [hpos_of[x] - hp[k] for x in hnb[g] if x not in onloop]
            if nb: v = np.mean(nb, axis=0); inward[k] = v / max(np.linalg.norm(v), 1e-9)
        for k in range(len(hlp)):                     # 内側の隣が無い頂点は前後から補う
            if not inward[k].any(): inward[k] = inward[k - 1] if inward[k - 1].any() else inward[(k + 1) % len(hlp)]
        hedge = np.linalg.norm(np.roll(hp, -1, axis=0) - hp, axis=1); band = band_scale * float(np.median(hedge))
        # 向きと開始位置: donor の縁を弧長で host のループへ写し、ずれが最小になる回し方を選ぶ
        td, _ = closed_param(dpnt); best = None
        for flip in (False, True):
            tt = (1 - td) if flip else td
            for off in np.linspace(0, 1, 96, endpoint=False):
                q, _, _ = sample_closed(hp, tt + off); e = float(((q - dpnt) ** 2).sum())
                if best is None or e < best[0]: best = (e, flip, off)
        _, flip, off = best; tt = np.mod(((1 - td) if flip else td) + off, 1.0)
        q, k, f = sample_closed(hp, tt); nxt = (k + 1) % len(hp); inw = inward[k] * (1 - f)[:, None] + inward[nxt] * f[:, None]; inw /= np.maximum(np.linalg.norm(inw, axis=1, keepdims=True), 1e-9)
        goal = q + inw * band
        # host の境界値（スキンウェイト・モーフ）を弧長で読む
        hv = [hg[g][0] for g in hlp]; hw = []
        for pi, vi in hv:
            d = collections.defaultdict(float); p = H.prims[pi]
            for c in range(4):
                if p['w'][vi, c] > 0: d[H.joints[p['jn'][vi, c]]] += p['w'][vi, c]
            hw.append(d)
        hm = [np.array([H.prims[pi]['morph'][t][vi] for pi, vi in hv]) for t in range(4)]
        for n, w_ in enumerate(dw):
            target[w_] = goal[n] - wpos[w_]; phi_fix[w_] = 1.0; a, b_ = k[n], nxt[n]; d = collections.defaultdict(float)
            for nm, x in hw[a].items(): d[nm] += x * (1 - f[n])
            for nm, x in hw[b_].items(): d[nm] += x * f[n]
            seam_w[w_] = d; seam_m[w_] = [hm[t][a] * (1 - f[n]) + hm[t][b_] * f[n] for t in range(4)]
            maxd = max(maxd, float(np.linalg.norm(target[w_])))
        loops_out.append(dict(hi=hi, di=di, hlp=hlp, dw=dw, tt=tt, band=band, flip=flip))
    # ---- 調和関数で広げる。縁 = 決めた値、縁から R より遠い頂点 = 0（動かさない）
    src = np.array(sorted(target)); dist = dijkstra(G, indices=src, min_only=True)
    ext = float(np.linalg.norm(wpos.max(axis=0) - wpos.min(axis=0))); R = radius if radius else float(np.clip(2.5 * maxd + 0.02, 0.03, 0.09)); R = min(R, 0.75 * float(dist[np.isfinite(dist)].max()))
    far = np.flatnonzero(~(dist < R)); fixed = np.zeros(nw, bool); fixed[src] = True; fixed[far] = True; free = np.flatnonzero(~fixed)
    val = np.zeros((nw, 4));
    for w_ in src: val[w_, :3] = target[w_]; val[w_, 3] = 1.0
    A = sp.coo_matrix((np.ones(len(E) * 2), (np.r_[E[:, 0], E[:, 1]], np.r_[E[:, 1], E[:, 0]])), shape=(nw, nw)).tocsr(); deg = np.asarray(A.sum(axis=1)).ravel(); Lp = sp.diags(deg) - A
    if len(free):
        rhs = -Lp[free][:, np.flatnonzero(fixed)] @ val[fixed]; lu = spl.splu(Lp[free][:, free].tocsc()); val[free] = lu.solve(rhs)
    disp_w, phi_w = val[:, :3], np.clip(val[:, 3], 0, 1)
    rep.update(seam_max_shift_m=round(maxd, 5), falloff_radius_m=round(R, 4), moved_vertices=int((np.linalg.norm(disp_w, axis=1) > 1e-6).sum()), donor_vertices=int(nv), donor_triangles=int(len(F['idx'])))
    pos = pos + disp_w[wid]; phi = phi_w[wid]
    # スキンウェイトとモーフを host の境界値へつなぐ: 縁の値を、いちばん近い縁の頂点から借りて phi で混ぜる
    _, pred, srcs = dijkstra(G, indices=src, min_only=True, return_predecessors=True)
    for v in range(nv):
        ph = phi[v]
        if ph <= 1e-4: continue
        s_ = srcs[wid[v]]
        if s_ < 0: continue
        d = collections.defaultdict(float)
        for nm, x in W[v].items(): d[nm] += x * (1 - ph)
        for nm, x in seam_w[s_].items(): d[nm] += x * ph
        W[v] = d
        for t in range(4): morph[t][v] = morph[t][v] * (1 - ph) + seam_m[s_][t] * ph
    # ---- 4. 接合帯: host の境界頂点の写しを置き、donor の縁と三角形でつなぐ
    V = dict(pos=[*pos], nrm=[*nrm], uv=[*F['uv']], region=[*F['region']], W=[top4(w) for w in W], morph=[[*m] for m in morph]); tris = [*map(tuple, F['idx'])]; seam_vertices = []; bridge = 0; first_of = {}
    for vi in range(nv): first_of.setdefault(wid[vi], vi)
    for L in loops_out:
        hlp, dw, tt = L['hlp'], L['dw'], L['tt']; hp = np.array([hpos_g(g) for g in hlp]); uh, _ = closed_param(hp)
        hidx = []
        for g in hlp:                                 # host の境界頂点の写し（host の値そのまま）
            pi, vi = hg[g][0]; p = H.prims[pi]; near = first_of[dw[np.argmin(np.linalg.norm(wpos[dw] + disp_w[dw] - p['pos'][vi], axis=1))]]
            V['pos'].append(p['pos'][vi].copy()); V['nrm'].append(p['nrm'][vi].copy()); V['uv'].append(F['uv'][near]); V['region'].append(F['region'][near])
            V['W'].append([(H.joints[p['jn'][vi, c]], p['w'][vi, c]) for c in range(4) if p['w'][vi, c] > 0])
            for t in range(4): V['morph'][t].append(p['morph'][t][vi].copy())
            hidx.append(len(V['pos']) - 1); seam_vertices.append(dict(index=len(V['pos']) - 1, hostPrim=pi, hostVertex=vi))
        # donor の縁を、パラメータの小さい順に並べ直す
        order = np.argsort(tt); dv = [first_of[dw[i]] for i in order]; dt = tt[order]; n, m = len(dv), len(hidx); i = j = 0; strip = []
        while i < n or j < m:                         # はしご状に進める: 次のパラメータが小さい側を 1 つ進めて三角形を 1 枚
            ti = dt[i % n] + (i // n); tj = uh[j % m] + (j // m)
            if j >= m or (i < n and ti <= tj): strip.append((dv[i % n], dv[(i + 1) % n], hidx[j % m])); i += 1
            else: strip.append((hidx[j % m], dv[i % n], hidx[(j + 1) % m])); j += 1
        # 表向きにそろえる: 帯の法線と、頂点法線の平均の内積で決める
        P_ = np.array(V['pos']); N_ = np.array(V['nrm']); s_ = 0.0
        for a, b_, c in strip: s_ += float(np.dot(np.cross(P_[b_] - P_[a], P_[c] - P_[a]), N_[a] + N_[b_] + N_[c]))
        if s_ < 0: strip = [(a, c, b_) for a, b_, c in strip]
        tris += strip; bridge += len(strip)
    # ---- 5. donor に元からあった穴にふたをする（中心に 1 頂点を足して扇形）
    caps = []
    for lp in dopen:
        vs = [first_of[gid2w[g]] for g in lp]; P_ = np.array(V['pos']); c = P_[vs].mean(axis=0); ci = len(V['pos']); d = collections.defaultdict(float)
        for v in vs:
            for nm, x in V['W'][v]: d[nm] += x / len(vs)
        nn = np.mean([V['nrm'][v] for v in vs], axis=0); nn /= max(np.linalg.norm(nn), 1e-9)
        V['pos'].append(c); V['nrm'].append(nn); V['uv'].append(np.mean([V['uv'][v] for v in vs], axis=0)); V['region'].append(V['region'][vs[0]]); V['W'].append(top4(d))
        for t in range(4): V['morph'][t].append(np.mean([V['morph'][t][v] for v in vs], axis=0))
        fan = [(vs[k], vs[(k + 1) % len(vs)], ci) for k in range(len(vs))]; s_ = sum(float(np.dot(np.cross(P_[b_] - P_[a], c - P_[a]), nn)) for a, b_, _ in fan)
        if s_ < 0: fan = [(b_, a, c_) for a, b_, c_ in fan]
        tris += fan; caps.append(dict(edges=len(vs), centerVertex=ci, triangles=len(fan)))
    # 動かした範囲の法線は面から作り直す（host の境界頂点の写しは host の法線のまま）
    P_ = np.array(V['pos']); T_ = np.array(tris); fn = np.cross(P_[T_[:, 1]] - P_[T_[:, 0]], P_[T_[:, 2]] - P_[T_[:, 0]]); _, wall = np.unique(np.round(P_, WELD), axis=0, return_inverse=True); acc = np.zeros((wall.max() + 1, 3))
    for c in range(3): np.add.at(acc, wall[T_[:, c]], fn)
    newn = acc[wall]; newn /= np.maximum(np.linalg.norm(newn, axis=1, keepdims=True), 1e-12); keep = {s['index'] for s in seam_vertices}; N_ = np.array(V['nrm'])
    for v in range(len(P_)):
        if v in keep: continue
        ph = phi[v] if v < nv else 1.0
        if ph > 1e-4: x = N_[v] * (1 - ph) + newn[v] * ph; N_[v] = x / max(np.linalg.norm(x), 1e-12)
    V['nrm'] = N_
    rep.update(bridge_triangles=bridge, caps=caps, host_seam_vertices=len(seam_vertices), seam_loops=[dict(hostVertices=len(L['hlp']), donorVertices=len(L['dw']), bandWidth_m=round(L['band'], 5)) for L in loops_out],
               host_original_open_boundaries=[len(l) for l in hopen], donor_original_open_boundaries=[len(l) for l in dopen], module_open_boundary='host seam loops only (donor の元の穴はふたをした)' if dopen else 'host seam loops only')
    meshes = [dict(kind='fur', V=V, tris=np.array(tris), seam=seam_vertices, material=F['material'], part=part_id)]
    if eye:                                           # 目は閉じた別メッシュ。骨の変換だけで host へ移す
        e = eye[0]; ep, en, em, eW = retarget(e)
        meshes.append(dict(kind='eyes', V=dict(pos=ep, nrm=en, uv=e['uv'], region=e['region'], W=[top4(w) for w in eW], morph=em), tris=e['idx'], seam=[], material=e['material'], part=part_id))
    return dict(meshes=meshes, report=rep)

def write_module(H, D, slot, built, path):
    """モジュールだけの GLB を書く: host の骨格ノード + host の skin（骨名・順番・逆バインドは host のまま）+ モジュールのメッシュ"""
    W = Writer(); j = W.j; hj = H.j; keep = sorted(set(H.joint_nodes) | {i for i, n in enumerate(hj['nodes']) if any(c in H.joint_nodes for c in n.get('children', []))})
    # host のノードのうち、骨と、その親（Rig_<host>）だけを写す
    remap = {o: k for k, o in enumerate(keep)}; j['nodes'] = []
    for o in keep:
        n = hj['nodes'][o]; x = {k: v for k, v in n.items() if k in ('name', 'translation', 'rotation', 'scale')}; ch = [remap[c] for c in n.get('children', []) if c in remap]
        if ch: x['children'] = ch
        j['nodes'].append(x)
    roots = [remap[o] for o in keep if not any(o in hj['nodes'][p].get('children', []) for p in keep)]
    j['skins'] = [dict(joints=[remap[o] for o in H.joint_nodes], inverseBindMatrices=W.acc(H.ibm_raw, 'MAT4', 5126))]
    if 'skeleton' in hj['skins'][0] and hj['skins'][0]['skeleton'] in remap: j['skins'][0]['skeleton'] = remap[hj['skins'][0]['skeleton']]
    j['samplers'] = [D.sampler] if D.sampler else [{}]; j['images'] = [dict(name=D.id + '_albedo', mimeType=D.image_mime, bufferView=W.view(D.image))]; j['textures'] = [dict(sampler=0, source=0)]
    j['materials'] = []; j['meshes'] = []; names = []; jix = {n: i for i, n in enumerate(H.joints)}
    for mesh in built['meshes']:
        V = mesh['V']; n = len(V['pos']); name = 'p2_%s_%s_for_%s' % (slot, D.id, H.id) + ('_eyes' if mesh['kind'] == 'eyes' else ''); names.append(name)
        JN = np.zeros((n, 4), np.uint8); WT = np.zeros((n, 4), np.float32)
        for v, ws in enumerate(V['W']):
            for c, (nm, x) in enumerate(ws): JN[v, c] = jix[nm]; WT[v, c] = x
        for s in mesh['seam']:                       # host の境界頂点の写しは、host の配列の値をそのまま（順番も）入れる
            p = H.prims[s['hostPrim']]; JN[s['index']] = p['jn'][s['hostVertex']]; WT[s['index']] = p['w'][s['hostVertex']]
        keepw = np.array([s['index'] for s in mesh['seam']], int); mask = np.ones(n, bool); mask[keepw] = False; WT[mask] /= WT[mask].sum(axis=1, keepdims=True)
        mat = {k: v for k, v in mesh['material'].items() if k != 'extras'}; mat['name'] = 'p2_%s_%s' % (slot, 'eye' if mesh['kind'] == 'eyes' else 'fur'); mat['extras'] = dict(avatarPart=slot, sourceBase=D.id, targetBase=H.id, p2Module=True)
        if 'baseColorTexture' in mat.get('pbrMetallicRoughness', {}): mat['pbrMetallicRoughness'] = dict(mat['pbrMetallicRoughness'], baseColorTexture=dict(index=0))
        j['materials'].append(mat)
        attr = dict(POSITION=W.acc(np.asarray(V['pos'], np.float32), 'VEC3', 5126, minmax=True, target=34962), NORMAL=W.acc(np.asarray(V['nrm'], np.float32), 'VEC3', 5126, target=34962), TEXCOORD_0=W.acc(np.asarray(V['uv'], np.float32), 'VEC2', 5126, target=34962),
                    JOINTS_0=W.acc(JN, 'VEC4', 5121, target=34962), WEIGHTS_0=W.acc(WT, 'VEC4', 5126, target=34962), _AVATAR_REGION=W.acc(np.asarray(V['region'], np.float32), 'SCALAR', 5126, target=34962),
                    _AVATAR_PART=W.acc(np.full(n, mesh['part'], np.uint8), 'SCALAR', 5121, target=34962))
        targets = [dict(POSITION=W.acc(np.asarray(m, np.float32), 'VEC3', 5126, minmax=True, target=34962)) for m in V['morph']]
        j['meshes'].append(dict(name=name, primitives=[dict(attributes=attr, indices=W.acc(np.asarray(mesh['tris'], np.uint32).reshape(-1), 'SCALAR', 5125, target=34963), material=len(j['materials']) - 1, targets=targets, mode=4)],
                                weights=list(H.mesh_weights), extras=dict(targetNames=MORPHS, p2=dict(host=H.id, donor=D.id, slot=slot, kind=mesh['kind']))))
        j['nodes'].append(dict(name=name, mesh=len(j['meshes']) - 1, skin=0)); roots.append(len(j['nodes']) - 1)
    j['scenes'] = [dict(name='p2_module', nodes=roots)]; j['scene'] = 0
    j['extras'] = dict(p2Module=dict(id='%s-%s-%s' % (H.id, slot, D.id), targetBaseId=H.id, donorId=D.id, slot=slot, meshNames=names, hostPartsSha256=H.raw_sha, donorPartsSha256=D.raw_sha))
    raw = W.glb(); os.makedirs(os.path.dirname(path), exist_ok=True); open(path, 'wb').write(raw); return raw, names
