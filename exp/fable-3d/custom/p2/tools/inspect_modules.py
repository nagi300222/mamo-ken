#!/usr/bin/env python3
"""P2 交換モジュールの GLB 検査。ビルダーの中間データは使わず、出来上がった GLB と host / donor の <id>_parts.glb だけを読んで確かめる。
  python3 exp/fable-3d/custom/p2/tools/inspect_modules.py     → ../assets/inspection.json（1 つでも不合格なら終了コード 1）
見ること:
  骨格   … 骨名と順番、逆バインド行列、骨ノードの rest（TRS）が host と同じ
  属性   … POSITION/NORMAL/TEXCOORD_0/JOINTS_0/WEIGHTS_0/_AVATAR_REGION/_AVATAR_PART と 4 モーフ（順番と名前）。ウェイトは合計 1、骨番号は範囲内
  境界   … モジュールの開いた辺が、host のその slot の境界ループ（他 slot との継ぎ目）とちょうど一致。それ以外の開いた辺が無い（新しい穴が無い）
  接合   … 境界頂点が、host の隣の slot の同じ場所の頂点と 位置 / 法線 / スキンウェイト / 4 モーフ で一致（許容 0.02mm、上限 0.1mm）
  実メッシュ … donor の slot の三角形（頂点番号の組）がそのまま全部入っている。足した面は接合帯とふただけ
  manifest … bytes / sha256 / meshNames / jointNames が実ファイルと一致"""
import collections, json, os, sys
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
from glbio import unpack, array
import p2lib as L
ASSETS = os.path.join(L.P2, 'assets'); TOL, HARD = 0.00002, 0.0001
def read_mesh(j, b, mesh):
    pr = mesh['primitives'][0]; A = pr['attributes']
    return dict(pos=array(j, b, A['POSITION']).astype(np.float64), nrm=array(j, b, A['NORMAL']).astype(np.float64), jn=array(j, b, A['JOINTS_0']).astype(int), w=array(j, b, A['WEIGHTS_0']).astype(np.float64),
                idx=array(j, b, pr['indices']).reshape(-1, 3).astype(int), morph=[array(j, b, t['POSITION']).astype(np.float64) for t in pr.get('targets', [])], attrs=sorted(A), region=array(j, b, A['_AVATAR_REGION']).ravel(), part=array(j, b, A['_AVATAR_PART']).ravel())
def open_edges(pos, idx):
    _, inv = np.unique(np.round(pos, 6), axis=0, return_inverse=True); use = collections.Counter()
    for f in inv[idx]:
        for a, c in ((f[0], f[1]), (f[1], f[2]), (f[2], f[0])): use[(min(a, c), max(a, c))] += 1
    rep = {}
    for i, g in enumerate(inv): rep.setdefault(g, i)
    return [(rep[a], rep[c]) for (a, c), n in use.items() if n == 1], sum(1 for n in use.values() if n > 2), inv
def wdict(names, jn, w): 
    d = collections.defaultdict(float)
    for c in range(4):
        if w[c] > 0: d[names[jn[c]]] += float(w[c])
    return d
def inspect(entry, chars):
    H = chars.setdefault(entry['targetBaseId'], L.Char(entry['targetBaseId'])); D = chars.setdefault(entry['donorId'], L.Char(entry['donorId'])); slot = entry['slot']; path = os.path.join(ASSETS, entry['file']); j, b, raw = unpack(path); R = dict(id=entry['id'], file=entry['file']); C = R['checks'] = {}
    C['manifest_bytes'] = len(raw) == entry['bytes']; C['manifest_sha256'] = L.sha(raw) == entry['sha256']
    # 骨格
    sk = j['skins'][0]; names = [j['nodes'][k]['name'] for k in sk['joints']]; C['joint_names_equal_host'] = names == H.joints and names == entry['jointNames']; R['joints'] = len(names)
    C['inverse_bind_equal_host'] = bool(np.array_equal(array(j, b, sk['inverseBindMatrices']).astype(np.float32), H.ibm_raw))
    hn = {n['name']: n for n in H.j['nodes']}; C['bone_rest_equal_host'] = all(all(j['nodes'][k].get(t) == hn[j['nodes'][k]['name']].get(t) for t in ('translation', 'rotation', 'scale')) for k in sk['joints'])
    C['no_animations'] = 'animations' not in j
    # メッシュ
    mesh_nodes = [n for n in j['nodes'] if 'mesh' in n]; C['mesh_names'] = [n['name'] for n in mesh_nodes] == entry['meshNames'] and [j['meshes'][n['mesh']]['name'] for n in mesh_nodes] == entry['meshNames']; C['meshes_skinned_to_host_skin'] = all(n.get('skin') == 0 for n in mesh_nodes)
    need = sorted(['POSITION', 'NORMAL', 'TEXCOORD_0', 'JOINTS_0', 'WEIGHTS_0', '_AVATAR_REGION', '_AVATAR_PART']); M = [read_mesh(j, b, j['meshes'][n['mesh']]) for n in mesh_nodes]
    C['attributes'] = all(m['attrs'] == need for m in M); C['morph_targets'] = all(len(m['morph']) == 4 for m in M) and all(j['meshes'][n['mesh']]['extras']['targetNames'] == L.MORPHS for n in mesh_nodes) and entry['morphTargets'] == L.MORPHS
    C['weights_normalized'] = all(float(np.abs(m['w'].sum(axis=1) - 1).max()) < 1e-4 for m in M); C['joint_index_in_range'] = all(int(m['jn'].max()) < len(names) for m in M); C['avatar_part_is_slot'] = all((m['part'] == L.SLOTS.index(slot)).all() for m in M)
    C['finite'] = all(np.isfinite(m['pos']).all() and np.isfinite(m['nrm']).all() for m in M); C['normals_unit'] = all(float(np.abs(np.linalg.norm(m['nrm'], axis=1) - 1).max()) < 1e-3 for m in M)
    fur = M[0]; R['vertices'] = [len(m['pos']) for m in M]; R['triangles'] = [len(m['idx']) for m in M]
    # 実メッシュ: donor の slot の三角形がそのまま先頭に入っている
    dfur = [D.prims[i] for i in D.slot_prims(slot) if not D.prims[i]['eye']][0]; nd = len(dfur['idx']); C['donor_triangles_preserved'] = bool(len(fur['idx']) >= nd and np.array_equal(fur['idx'][:nd], dfur['idx'])); R['donorTriangles'] = nd; R['addedTriangles'] = len(fur['idx']) - nd
    hfur = [H.prims[i] for i in H.slot_prims(slot) if not H.prims[i]['eye']][0]; R['hostBaseTriangles'] = len(hfur['idx']); C['not_host_topology'] = not (len(fur['idx']) == len(hfur['idx']) and np.array_equal(fur['idx'], hfur['idx']))
    if len(M) > 1:
        deye = [D.prims[i] for i in D.slot_prims(slot) if D.prims[i]['eye']][0]; C['donor_eye_triangles_preserved'] = bool(np.array_equal(M[1]['idx'], deye['idx'])); oe, nm, _ = open_edges(M[1]['pos'], M[1]['idx']); C['eyes_closed'] = len(oe) == 0 and nm == 0
    # 境界: モジュールの開いた辺 = host の slot の継ぎ目ループ
    oe, nonman, inv = open_edges(fur['pos'], fur['idx']); C['manifold'] = nonman == 0; hseam, hopen = H.loops(slot); hg = H.gid_vertex(slot)
    mine = set(H.slot_prims(slot)); nb = collections.defaultdict(list)      # host の溶接 id → 隣の slot の頂点
    for pi, p in enumerate(H.prims):
        if pi in mine: continue
        for vi, g in enumerate(p['gid']): nb[g].append((pi, vi))
    hkey = {}
    for lp in hseam:
        for g in lp: pi, vi = hg[g][0]; hkey[tuple(np.round(H.prims[pi]['pos'][vi], 6))] = g
    host_edges = set()
    for lp in hseam:
        for k in range(len(lp)): a, c = lp[k], lp[(k + 1) % len(lp)]; host_edges.add((min(a, c), max(a, c)))
    mod_edges = set(); stray = 0
    for a, c in oe:
        ga, gc = hkey.get(tuple(np.round(fur['pos'][a], 6))), hkey.get(tuple(np.round(fur['pos'][c], 6)))
        if ga is None or gc is None: stray += 1
        else: mod_edges.add((min(ga, gc), max(ga, gc)))
    C['open_boundary_equals_host_seam'] = stray == 0 and mod_edges == host_edges; R['openEdges'] = len(oe); R['hostSeamEdges'] = len(host_edges); R['strayOpenEdges'] = stray
    R['hostOriginalOpenEdges'] = sum(len(l) for l in hopen); R['donorOriginalOpenEdges'] = sum(len(l) for l in D.loops(slot)[1]); R['openBoundaryPolicy'] = 'host の継ぎ目ループだけ。donor の元の穴はモジュール内でふたをした。host の元の穴は持ち込んでいない' if R['donorOriginalOpenEdges'] or R['hostOriginalOpenEdges'] else 'host の継ぎ目ループだけ'
    # 接合: 境界頂点を host の隣の slot の頂点と比べる
    mx = dict(position=0.0, normal=0.0, weight=0.0, morph=0.0); n = 0; seen = set(); adj_slots = set()
    for a, c in oe:
        for v in (a, c):
            if v in seen: continue
            seen.add(v); g = hkey.get(tuple(np.round(fur['pos'][v], 6)))
            if g is None: continue
            for dup in np.flatnonzero(inv == inv[v]):         # 同じ位置のモジュール頂点ぜんぶ
                mw = wdict(names, fur['jn'][dup], fur['w'][dup])
                for pi, vi in nb[g]:
                    p = H.prims[pi]; adj_slots.add(p['slot']); n += 1; mx['position'] = max(mx['position'], float(np.linalg.norm(fur['pos'][dup] - p['pos'][vi]))); mx['normal'] = max(mx['normal'], float(np.linalg.norm(fur['nrm'][dup] - p['nrm'][vi])))
                    hw = wdict(H.joints, p['jn'][vi], p['w'][vi]); mx['weight'] = max(mx['weight'], max(abs(mw.get(k, 0) - hw.get(k, 0)) for k in set(mw) | set(hw)))
                    for t in range(4): mx['morph'] = max(mx['morph'], float(np.linalg.norm(fur['morph'][t][dup] - p['morph'][t][vi])))
    R['seam'] = dict(comparisons=n, boundaryVertices=len(seen), adjacentHostSlots=sorted(adj_slots), maxPositionDiff_m=mx['position'], maxNormalDiff=mx['normal'], maxWeightDiff=mx['weight'], maxMorphDiff_m=mx['morph'], tolerance_m=TOL, hardLimit_m=HARD)
    C['seam_position'] = n > 0 and mx['position'] <= TOL; C['seam_normal'] = mx['normal'] <= 1e-4; C['seam_weights'] = mx['weight'] <= 1e-6; C['seam_morph'] = mx['morph'] <= TOL
    R['ok'] = all(v is True for v in C.values()); return R
def main():
    man = json.load(open(os.path.join(ASSETS, 'manifest.json'), encoding='utf-8')); chars = {}; out = [inspect(e, chars) for e in man['modules']]
    ok = all(r['ok'] for r in out) and man['schemaVersion'] == 1 and man['version'] == 'p2-exchange-1'
    json.dump(dict(version=man['version'], ok=ok, modules=len(out), passed=sum(r['ok'] for r in out), results=out), open(os.path.join(ASSETS, 'inspection.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    for r in out: print('OK ' if r['ok'] else 'NG ', r['id'], 'tris', r['triangles'], 'donor', r['donorTriangles'], '+', r['addedTriangles'], 'seam', r['seam']['boundaryVertices'], 'pos %.2g nrm %.2g w %.2g' % (r['seam']['maxPositionDiff_m'], r['seam']['maxNormalDiff'], r['seam']['maxWeightDiff']), [k for k, v in r['checks'].items() if v is not True])
    sys.exit(0 if ok else 1)
if __name__ == '__main__': main()
