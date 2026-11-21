"""1キャラぶんのメッシュ一式（体＋目＋装飾）を作り、Blender のオブジェクトにする。"""
import numpy as np, os, bpy
from PIL import Image
from . import characters, body, skin, texture
from .sdf import smoothstep, norm
from .characters import V, SIDES
from .body import PART

DEFORM = ['root_ground', 'pelvis', 'spine', 'chest', 'neck', 'head', 'jaw'] + \
    [b + '.' + s for s in 'LR' for b in ('shoulder', 'shoulder_fix', 'upper_arm', 'forearm', 'forearm_twist', 'wrist', 'paw', 'thigh_fix', 'thigh', 'shin', 'ankle', 'foot', 'toe')] + \
    ['tail_01', 'tail_02', 'tail_03']

def vertex_normals(v, f):
    n = np.zeros_like(v); fn = np.cross(v[f[:, 1]] - v[f[:, 0]], v[f[:, 2]] - v[f[:, 0]])
    for k in range(3): np.add.at(n, f[:, k], fn)
    return n / (np.linalg.norm(n, axis=1, keepdims=True) + 1e-12)

def rot2(x, z, px, pz, ang):
    c, s = np.cos(ang), np.sin(ang); dx, dz = x - px, z - pz
    return px + dx * c - dz * s, pz + dx * s + dz * c

def shape_keys(spec, verts, Wp, ranges):
    """シェイプキー（差分 [N,3]）: paw_open.L/R, blink, brow_angry"""
    P, J, prims = spec.P, spec.J, spec.prims; nb = ranges['body'][1]; out = {}
    def g(*names): return sum(Wp[:, j] for j, pr in enumerate(prims) if pr.group in names)
    def gp(prefix): return sum(Wp[:, j] for j, pr in enumerate(prims) if pr.name.startswith(prefix))
    L, Wd, Hh = P.fist
    for sn, s in SIDES:
        R = J['hand_R.' + sn]; W = J['wrist.' + sn]; q = (verts[:nb] - W) @ R; x, y, z = q[:, 0].copy(), q[:, 1].copy(), q[:, 2].copy()
        mf = smoothstep(0.15, 0.6, g('fingers' + sn, 'fclaws' + sn)); thumb = gp('thumb.' + sn)
        wB = np.clip((gp('fingB') + gp('claw')) / (gp('fingA') + gp('fingB') + gp('claw') + 1e-6), 0, 1); wB = smoothstep(0.3, 0.7, wB)
        x1, z1 = rot2(x, z, 0.97 * L, -0.04 * Hh, np.radians(95) * wB)
        x2, z2 = rot2(x1, z1, 0.66 * L, 0.30 * Hh, np.radians(38))
        tm = smoothstep(0.3, 0.7, thumb / (g('fingers' + sn, 'fclaws' + sn) + 1e-6))
        nx = x + (x2 - x) * (1 - tm) + tm * 0.10 * L; ny = y + tm * 0.22 * Wd; nz = z + (z2 - z) * (1 - tm) + tm * 0.25 * Hh
        nz = nz - 0.10 * Hh * (1 - tm)                       # 開いた指は少し下げて平たく
        d = (np.stack([nx, ny, nz], 1) - q) * mf[:, None]
        D = np.zeros_like(verts); D[:nb] = d @ R.T; out['paw_open.' + sn] = D
    D = np.zeros_like(verts); B = np.zeros_like(verts)
    for (sn, s), c in zip(SIDES, spec.eye_centers):
        a, b = ranges['eye.' + sn]; D[a:b, 2] = (c[2] - verts[a:b, 2]) * 0.88; D[a:b, 1] = P.eye_r * 0.10
        a, b = ranges['shine.' + sn]; D[a:b] = (c - verts[a:b]) * 0.95
        r = np.linalg.norm(verts[:nb] - c, axis=1); up = verts[:nb, 2] - c[2]
        fo = (1 - smoothstep(P.eye_r * 0.9, P.eye_r * 2.1, r)) * smoothstep(-0.2 * P.eye_r, 0.5 * P.eye_r, up)
        D[:nb, 2] -= fo * np.maximum(up, 0) * 0.8
        q0 = c + V(-s * P.eye_r * 0.7, 0, P.eye_r * 1.25); r2 = np.linalg.norm(verts[:nb] - q0, axis=1)
        fo = (1 - smoothstep(P.eye_r * 0.4, P.eye_r * 2.6, r2)) * smoothstep(-0.1 * P.eye_r, 0.6 * P.eye_r, up)
        B[:nb] += fo[:, None] * V(-s * 0.30, -0.25, -0.80) * P.eye_r
    out['blink'] = D; out['brow_angry'] = B
    return out

def build_arrays(cid, out_dir, log=print, cache_dir=None):
    """cache_dir を渡すと、造形系ソースが変わっていない限りメッシュ一式を再利用する（モーション調整の反復用）"""
    import hashlib, pickle
    if cache_dir:
        here = os.path.dirname(os.path.abspath(__file__)); h = hashlib.sha1()
        for fn in ('characters.py', 'body.py', 'skin.py', 'texture.py', 'sdf.py', 'model.py'): h.update(open(os.path.join(here, fn), 'rb').read())
        cp = os.path.join(cache_dir, 'mesh_%s_%s.pkl' % (cid, h.hexdigest()[:12]))
        if os.path.exists(cp) and os.path.exists(os.path.join(out_dir, cid + '_albedo.jpg')):
            log('  (mesh cache hit)'); return pickle.load(open(cp, 'rb'))
        A = build_arrays(cid, out_dir, log); os.makedirs(cache_dir, exist_ok=True); pickle.dump(A, open(cp, 'wb')); return A
    spec = characters.build(cid); P = spec.P
    v, f, grid, F = body.build_body_mesh(spec, log)
    v, f = body.decimate(v, f, P.tris)
    field = body.Field(grid, F)
    parts, extra_bones = body.build_extras(spec, field)
    bone_names = DEFORM + [b[0] for b in extra_bones]
    Wb, Wp = skin.body_weights(spec.prims, v, f, bone_names)
    verts = [v]; faces = [f]; fpart = [np.zeros(len(f), int)]; Ws = [Wb]; ranges = {'body': (0, len(v))}; off = len(v)
    for p in parts:
        verts.append(p['verts']); faces.append(p['faces'] + off); fpart.append(np.full(len(p['faces']), PART[p['part']]))
        Ws.append(skin.part_weights(p, v, Wb, bone_names, spec.prims)); ranges[p['tag']] = (off, off + len(p['verts'])); off += len(p['verts'])
    verts = np.concatenate(verts); faces = np.concatenate(faces); fpart = np.concatenate(fpart); W = np.concatenate(Ws)
    vn = vertex_normals(verts, faces)
    spec.mouth = texture.mouth_lines(spec, field)
    face_uv, img = texture.bake(spec, field, verts, faces, vn, fpart, log=log)
    os.makedirs(out_dir, exist_ok=True); tex_path = os.path.join(out_dir, cid + '_albedo.jpg')
    Image.fromarray((img[::-1] * 255 + 0.5).astype(np.uint8)).save(tex_path, quality=92)
    sk = shape_keys(spec, verts, Wp, ranges)
    return dict(spec=spec, verts=verts, faces=faces, fpart=fpart, W=W, bone_names=bone_names, face_uv=face_uv, tex_path=tex_path,
                shape_keys=sk, extra_bones=extra_bones, ranges=ranges, field=field)

def make_materials(cid, tex_path):
    m = bpy.data.materials.new(cid + '_body'); m.use_nodes = True; nt = m.node_tree; b = nt.nodes['Principled BSDF']
    img = bpy.data.images.load(tex_path); img.name = os.path.basename(tex_path)
    t = nt.nodes.new('ShaderNodeTexImage'); t.image = img; nt.links.new(t.outputs['Color'], b.inputs['Base Color'])
    b.inputs['Roughness'].default_value = 0.82; b.inputs['Metallic'].default_value = 0.0
    e = bpy.data.materials.new(cid + '_eye'); e.use_nodes = True; be = e.node_tree.nodes['Principled BSDF']
    be.inputs['Base Color'].default_value = (0.012, 0.010, 0.010, 1); be.inputs['Roughness'].default_value = 0.08
    return m, e

def make_object(cid, A):
    me = bpy.data.meshes.new(cid + '_mesh'); me.from_pydata(A['verts'].tolist(), [], A['faces'].tolist()); me.update()
    ob = bpy.data.objects.new('Mamo_' + cid, me); bpy.context.scene.collection.objects.link(ob)
    me.polygons.foreach_set('use_smooth', np.ones(len(me.polygons), bool))
    uv = me.uv_layers.new(name='UVMap'); uv.data.foreach_set('uv', A['face_uv'].reshape(-1, 2).ravel().astype(np.float32))
    mb, mey = make_materials(cid, A['tex_path']); me.materials.append(mb); me.materials.append(mey)
    me.polygons.foreach_set('material_index', (A['fpart'] == PART['eye']).astype(np.int32))
    W = A['W']
    for j, bn in enumerate(A['bone_names']):
        vg = ob.vertex_groups.new(name=bn); col = W[:, j]
        for i in np.nonzero(col > 0)[0]: vg.add([int(i)], float(col[i]), 'REPLACE')
    ob.shape_key_add(name='Basis')
    for name, D in A['shape_keys'].items():
        k = ob.shape_key_add(name=name); k.value = 0.0; k.data.foreach_set('co', (A['verts'] + D).ravel())
    me.update()
    return ob
