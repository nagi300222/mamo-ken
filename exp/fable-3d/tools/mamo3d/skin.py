"""スキンウェイト: プリミティブへの帰属 × 軸に沿ったボーン分布 → 平滑化 → 4影響に制限。"""
import numpy as np
from scipy import sparse
from scipy.spatial import cKDTree
from .body import attribution

def knot_weights(pr, P, bone_index, nb):
    t = pr.tparam(P) if pr.axis is not None else np.zeros(len(P))
    ks = pr.knots; out = np.zeros((len(P), nb)); ts = [k[0] for k in ks]
    for b in {b for _, d in ks for b in d}:
        out[:, bone_index[b]] = np.interp(t, ts, [d.get(b, 0.0) for _, d in ks])
    return out

def body_weights(prims, verts, faces, bone_names, rigid_groups=('fist', 'fingers', 'fclaws'), smooth_iter=4):
    bi = {b: i for i, b in enumerate(bone_names)}; nb = len(bone_names)
    Wp, D = attribution(prims, verts, tau=0.012)
    W = np.zeros((len(verts), nb))
    for j, pr in enumerate(prims):
        if pr.op != 'add' or Wp[:, j].max() < 1e-4: continue
        W += Wp[:, j:j + 1] * knot_weights(pr, verts, bi, nb)
    W /= W.sum(axis=1, keepdims=True)
    # ラプラシアン平滑化（拳は固いままにする）
    n = len(verts); e = np.concatenate([faces[:, [0, 1]], faces[:, [1, 2]], faces[:, [2, 0]]]); e = np.concatenate([e, e[:, ::-1]])
    A = sparse.coo_matrix((np.ones(len(e)), (e[:, 0], e[:, 1])), shape=(n, n)).tocsr(); A.data[:] = 1
    deg = np.asarray(A.sum(axis=1)).ravel(); A = sparse.diags(1.0 / np.maximum(deg, 1)) @ A
    rigid = np.zeros(n)
    for j, pr in enumerate(prims):
        if any(pr.group.startswith(g) for g in rigid_groups): rigid += Wp[:, j]
    lam = 0.6 * (1 - np.clip(rigid * 1.5, 0, 1))[:, None]
    for _ in range(smooth_iter): W = W + lam * (A @ W - W)
    return limit4(W), Wp

def limit4(W):
    idx = np.argsort(-W, axis=1)[:, 4:]
    W = W.copy(); np.put_along_axis(W, idx, 0.0, axis=1); W[W < 0.01] = 0
    return W / W.sum(axis=1, keepdims=True)

def part_weights(part, body_verts, body_W, bone_names, prims=None):
    bi = {b: i for i, b in enumerate(bone_names)}; nb = len(bone_names); v = part['verts']; w = part['weights']
    out = np.zeros((len(v), nb))
    if isinstance(w, dict):
        for b, x in w.items(): out[:, bi[b]] = x
    elif isinstance(w, tuple) and w[0] == 'prim':        # 指定プリミティブの軸方向の分布だけを使う（帯: 腕や脚の影響を受けない）
        pr = [p for p in prims if p.name == w[1]][0]; out = knot_weights(pr, v, bi, nb)
    elif w == 'transfer':
        d, ix = cKDTree(body_verts).query(v, k=4); ww = 1.0 / (d + 1e-4)
        out = (body_W[ix] * ww[:, :, None]).sum(axis=1) / ww.sum(axis=1, keepdims=True)
    else:                                   # ('chain', 中心線, [bone...], anchor)
        _, cl, names, anchor = w; seg = np.linalg.norm(np.diff(cl, axis=0), axis=1); s = np.concatenate([[0], np.cumsum(seg)]) / seg.sum()
        _, ix = cKDTree(cl).query(v); t = s[ix]; nbn = len(names)
        knots_t = [0.0, 0.12] + [(i + 0.5) / nbn for i in range(nbn)][1:] + [1.0]
        chain = [anchor] + names
        # t=0 は付け根(anchor)、以降は各ボーンへ
        for k, b in enumerate(chain):
            centers = [0.0] + [(i + 0.35) / nbn for i in range(nbn)]
            ys = [1.0 if i == k else 0.0 for i in range(len(chain))]
            out[:, bi[b]] = np.interp(t, centers, ys)
    return limit4(out / out.sum(axis=1, keepdims=True))
