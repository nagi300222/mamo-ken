"""ポーズ記述 → リグの制御ボーンへのキー。胴体のFKは自前で計算し、腕と脚は Blender の IK に任せる。
尻尾・垂れ布はバネの二次動作を自動で焼く。"""
import bpy, math, numpy as np
from mathutils import Matrix, Quaternion, Vector
from .characters import SIDES
from . import rig as rigmod

def Rx(a): c, s = math.cos(a), math.sin(a); return np.array([[1, 0, 0], [0, c, -s], [0, s, c]])
def Ry(a): c, s = math.cos(a), math.sin(a); return np.array([[c, 0, s], [0, 1, 0], [-s, 0, c]])
def Rz(a): c, s = math.cos(a), math.sin(a); return np.array([[c, -s, 0], [s, c, 0], [0, 0, 1]])
def pyr(v):
    """(pitch 前傾+, yaw 本人の左向き+, roll 本人の左へ傾く+) 度 → アーマチュア軸の回転行列"""
    p, y, r = np.radians(v); return Rz(y) @ Rx(p) @ Ry(r)
def axis_rot(ax, a):
    return np.array(Matrix.Rotation(a, 3, Vector(ax)))
def nrm(v): v = np.asarray(v, float); return v / (np.linalg.norm(v) + 1e-12)
def frame_xz(x, z):
    x = nrm(x); z = nrm(np.asarray(z, float) - x * (x @ np.asarray(z, float))); return np.stack([x, np.cross(z, x), z], 1)
def side_vec(v, s): return np.array([s * v[0], -v[1], v[2]], float)      # (外, 前, 上) → アーマチュア座標
def quat(m3): return Matrix(m3.tolist()).to_quaternion()
def slerp_m(a, b, w):
    return np.array(quat(a).slerp(quat(b), float(w)).to_matrix())
def M4(R, t):
    m = np.eye(4); m[:3, :3] = R; m[:3, 3] = t; return m

EASE = {'lin': lambda u: u, 'io': lambda u: u * u * (3 - 2 * u), 'in': lambda u: u * u, 'out': lambda u: 1 - (1 - u) ** 2,
        'in3': lambda u: u ** 3, 'out3': lambda u: 1 - (1 - u) ** 3, 'hold': lambda u: 0.0 if u < 1 else 1.0}
LIMBS = ('handL', 'handR', 'footL', 'footR')
SETTLE = 8

def merge(base, **over):
    """ポーズ辞書の上書き（1階層下まで）"""
    out = {k: (dict(v) if isinstance(v, dict) else v) for k, v in base.items()}
    for k, v in over.items():
        if isinstance(v, dict) and isinstance(out.get(k), dict): out[k] = dict(out[k], **v)
        else: out[k] = v
    return out

def _lerp(a, b, w):
    if isinstance(a, dict): return {k: _lerp(a[k], b.get(k, a[k]), w) for k in a}
    return tuple(np.asarray(a, float) * (1 - w) + np.asarray(b, float) * w) if not np.isscalar(a) else a * (1 - w) + b * w

def sample(keys, f):
    """keys: [(frame, pose, ease)] → フレーム f の補間ポーズ。手足は [(spec, 重み)] の混合リストにする。"""
    if f <= keys[0][0]: a = b = keys[0]; w = 0.0
    elif f >= keys[-1][0]: a = b = keys[-1]; w = 0.0
    else:
        i = max(k for k in range(len(keys)) if keys[k][0] <= f); a, b = keys[i], keys[i + 1]
        w = EASE[b[2] if len(b) > 2 else 'io']((f - a[0]) / (b[0] - a[0]))
    pa, pb = a[1], b[1]; out = {}
    for k in pa:
        if k in LIMBS: out[k] = [(pa[k], 1 - w), (pb[k], w)] if w > 0 else [(pa[k], 1.0)]
        else: out[k] = _lerp(pa[k], pb[k], w)
    return out

class Animator:
    def __init__(self, arm, mesh_ob, spec, extra_bones):
        self.arm, self.ob, self.spec, self.M, self.J = arm, mesh_ob, spec, spec.M, spec.J
        self.R, self.par = rigmod.rest_data(arm); self.Ri = {k: np.linalg.inv(v) for k, v in self.R.items()}
        self.tail = list(spec.tail_names); nt = len(self.tail)
        tp = [dict(stiff=170, damp=17), dict(stiff=130, damp=14), dict(stiff=110, damp=12)] if nt == 3 else \
             [dict(stiff=150 - 9 * i, damp=15 - 0.6 * i, max=40) for i in range(nt)]
        self.chains = [(self.tail, 'pelvis', tp)]
        by = {}
        for name, h, t, par, dyn in extra_bones: by.setdefault(name.rsplit('_', 1)[0], []).append((name, par, dyn))
        for k, lst in by.items(): self.chains.append(([x[0] for x in lst], lst[0][1], [x[2] for x in lst]))
        self.warn = []; self.idle_dyn = None

    # ---- 1フレームぶんを解く ----
    def solve(self, pose):
        R, Ri, M, J = self.R, self.Ri, self.M, self.J; B = {}; W = {}
        pose = {k: ([(v, 1.0)] if (k in LIMBS and isinstance(v, dict)) else v) for k, v in pose.items()}
        def fk(name, D=None, loc=None):
            Rb = R[name][:3, :3]; b = np.eye(4)
            if D is not None: b[:3, :3] = Rb.T @ D @ Rb
            if loc is not None: b[:3, 3] = Rb.T @ np.asarray(loc)
            p = self.par[name]; W[name] = (W[p] @ Ri[p] if p else np.eye(4)) @ R[name] @ b; B[name] = b
        fk('root_ground')
        pv = pose['pelvis']; fk('pelvis', pyr(pv['rot']), side_vec(pv['pos'], 1.0) * M.leg * np.array([1, 1, 1]))
        for n in ('spine', 'chest', 'neck', 'head'): fk(n, pyr(pose[n]))
        fk('jaw', Rx(math.radians(pose.get('jaw', 0.0))))
        tp = pose.get('tail', (0, 0))
        tb = pose.get('tail_bones')             # 長い尻尾用: ボーンごとの (上げ, 左右) 度。あれば tail に足す
        for i, n in enumerate(self.tail):
            ex = tb[i] if tb is not None and i < len(tb) else (0, 0)
            fk(n, Rz(math.radians(tp[1] * 0.5 + ex[1])) @ Rx(math.radians(tp[0] * (0.6 if i == 0 else 0.35) + ex[0])))
        def carry(space):       # レスト座標 → その骨に付いて動いた後の座標
            return np.eye(4) if space in ('root', 'world') else W[space] @ Ri[space]
        out = {'B': B, 'W': W, 'keys': dict(pose.get('keys', {}))}
        for sn, s in SIDES:
            # --- 手 ---
            S0 = J['upper_arm.' + sn]; restF = frame_xz(J['hand_R.' + sn][:, 0], J['hand_R.' + sn][:, 2])
            acc_p = np.zeros(3); acc_e = np.zeros(3); Dm = None; wsum = 0
            for sp, w in pose['hand' + sn]:
                space = sp.get('space', 'chest'); C = carry(space)
                if space == 'root': p0 = np.array([s * (M.hip_x + sp['pos'][0] * M.leg), -sp['pos'][1] * M.leg, sp['pos'][2] * M.leg])
                else: p0 = S0 + side_vec(sp['pos'], s) * M.arm
                p = C[:3, :3] @ p0 + C[:3, 3]
                if space == 'world':          # 肩の現在位置から、体の向きに関係なく正面基準で狙う（攻撃用）
                    Cc0 = W['chest'] @ Ri['chest']; p = Cc0[:3, :3] @ S0 + Cc0[:3, 3] + side_vec(sp['pos'], s) * M.arm
                D = C[:3, :3] @ frame_xz(side_vec(sp['fwd'], s), side_vec(sp['back'], s)) @ restF.T
                e = W['chest'][:3, :3] @ R['chest'][:3, :3].T @ side_vec(sp.get('elbow', (0.5, -0.25, -0.85)), s)
                acc_p += w * p; acc_e += w * e; wsum += w; Dm = D if Dm is None else slerp_m(Dm, D, w / wsum)
            # 自動の肩（鎖骨）: 手が上・前にあるほど肩を上げて前へ出す
            Cc = W['chest'] @ Ri['chest']; v = (np.linalg.inv(Cc) @ np.append(acc_p, 1))[:3] - S0
            up = np.clip(v[2] / M.arm, -0.4, 1.0); fw = np.clip(-v[1] / M.arm, -0.5, 1.0); ex = pose.get('shoulder' + sn, (0, 0))
            fk('shoulder.' + sn, Ry(-s * math.radians(up * 24 + ex[1])) @ Rz(-s * math.radians(fw * 20 + ex[0])))
            sh = (W['shoulder.' + sn] @ Ri['shoulder.' + sn] @ R['upper_arm.' + sn])[:3, 3]
            d = acc_p - sh; L = np.linalg.norm(d)
            if L > M.arm * 0.985:
                if L > M.arm * 1.03: self.warn.append('hand%s reach %.3f > %.3f' % (sn, L, M.arm))
                acc_p = sh + d / L * M.arm * 0.985
            ik = 'ik_hand.' + sn; B[ik] = Ri[ik] @ M4(Dm @ R[ik][:3, :3], acc_p)
            pole = 'pole_elbow.' + sn; pp = (sh + acc_p) / 2 + nrm(acc_e) * 0.25
            B[pole] = M4(np.eye(3), R[pole][:3, :3].T @ (pp - R[pole][:3, 3]))
            # --- 足 ---
            A0 = J['ankle.' + sn]; b0 = J['toe.' + sn] * np.array([1, 1, 0]); fd = J['foot_dir.' + sn]; fs = np.cross(fd, [0, 0, 1])
            acc_p = np.zeros(3); acc_k = np.zeros(3); Dm = None; wsum = 0; toe = 0
            for sp, w in pose['foot' + sn]:
                T = side_vec(sp['pos'], s) * M.leg; yaw = Rz(s * math.radians(sp.get('yaw', 0))); pit = axis_rot(fs, -math.radians(sp.get('pitch', 0)))
                Ag = A0 * np.array([1, 1, 0]); ball = Ag + yaw @ (b0 - Ag) + T
                D = yaw @ pit; p = ball + D @ (A0 - b0)
                kd = nrm(yaw @ fd + side_vec((sp.get('knee', 0.35), 0, 0.25), s))
                acc_p += w * p; acc_k += w * kd; wsum += w; Dm = D if Dm is None else slerp_m(Dm, D, w / wsum)
                toe += w * sp.get('toe', max(sp.get('pitch', 0), 0) if sp['pos'][2] < 0.02 else 0.0)
            hip = (W['pelvis'] @ Ri['pelvis'] @ R['thigh.' + sn])[:3, 3]; d = acc_p - hip; L = np.linalg.norm(d)
            if L > M.leg * 0.985:
                if L > M.leg * 1.03: self.warn.append('foot%s reach %.3f > %.3f' % (sn, L, M.leg))
                acc_p = hip + d / L * M.leg * 0.985
            ik = 'ik_foot.' + sn; B[ik] = Ri[ik] @ M4(Dm @ R[ik][:3, :3], acc_p)
            pole = 'pole_knee.' + sn; pp = (hip + acc_p) / 2 + nrm(acc_k) * 0.35
            B[pole] = M4(np.eye(3), R[pole][:3, :3].T @ (pp - R[pole][:3, 3]))
            Rb = R['toe.' + sn][:3, :3]; b = np.eye(4); b[:3, :3] = Rb.T @ axis_rot(fs, math.radians(toe)) @ Rb; B['toe.' + sn] = b
            pw = pose.get('paw' + sn, 0.0); Rb = R['paw.' + sn][:3, :3]; b = np.eye(4)
            b[:3, :3] = Rb.T @ axis_rot(J['hand_R.' + sn][:, 1] * s, math.radians(pw)) @ Rb; B['paw.' + sn] = b
        return out

    # ---- 二次動作（バネ） ----
    def dynamics(self, frames, loop):
        R, Ri = self.R, self.Ri; dt = 1 / 60.0
        for names, anchor, params in self.chains:
            lens = [np.linalg.norm(self.arm.data.bones[n].tail_local - self.arm.data.bones[n].head_local) for n in names]
            state = None; passes = 3 if loop else 1; seq = frames[:-1] if loop else frames
            for ps in range(passes):
                for fi, fr in enumerate(seq):
                    Mpar = fr['W'][anchor]; ppar = anchor; newstate = []
                    for i, n in enumerate(names):
                        base = fr['B'].get(n, np.eye(4)) if n.startswith('tail') else np.eye(4)
                        Mt = Mpar @ Ri[ppar] @ R[n] @ base; h = Mt[:3, 3]; ydir = Mt[:3, 1]; tgt = h + ydir * lens[i]
                        if state is None: p, v = tgt.copy(), np.zeros(3)
                        else:
                            p, v = state[i]; pr = params[i]; km = self.dyn_mult if names is self.tail else 1.0
                            v = v + (pr['stiff'] * km * (tgt - p) - pr['damp'] * (km ** 0.5) * v + np.array([0, 0, -9.8 * pr.get('grav', 0.0)])) * dt; p = p + v * dt
                            if names is self.tail and self.dyn_follow: p = p + (tgt - p) * self.dyn_follow      # 攻撃用: キーで決めた形へ強く寄せ、遅れを1フレーム程度に抑える
                            d = p - h; p = h + d / (np.linalg.norm(d) + 1e-9) * lens[i]
                            mx = math.radians(pr.get('max', 55)); cs = np.clip(((p - h) / lens[i]) @ ydir, -1, 1)
                            if math.acos(cs) > mx:            # 振れすぎを制限
                                q = Quaternion(Vector(np.cross(ydir, p - h)), mx); p = h + np.array(q @ Vector(ydir)) * lens[i]
                        if not loop and fi > len(seq) - 1 - SETTLE:      # 単発クリップは終端で揺れを収束させ、idle へつながる姿勢で終える
                            u = (fi - (len(seq) - 1 - SETTLE)) / SETTLE; u = u * u * (3 - 2 * u)
                            d = p + (tgt - p) * u - h; p = h + d / (np.linalg.norm(d) + 1e-9) * lens[i]; v = v * (1 - u)
                        newstate.append((p, v))
                        q = Vector(ydir).rotation_difference(Vector((p - h) / lens[i])); Ms = Mt.copy(); Ms[:3, :3] = np.array(q.to_matrix()) @ Mt[:3, :3]
                        if ps == passes - 1:
                            fr['B'][n] = np.linalg.inv(Mpar @ Ri[ppar] @ R[n]) @ Ms; fr['W'][n] = Ms
                        Mpar = Ms; ppar = n
                    state = newstate
            if loop: frames[-1]['B'].update({n: frames[0]['B'][n] for n in names})
            elif names is self.tail and len(names) > 3 and self.idle_dyn:      # 長い尻尾: 終端を idle 0フレーム目の揺れ姿勢へ合わせる（静止姿勢との差が大きいため）
                for k in range(SETTLE + 1):
                    fr = frames[len(frames) - 1 - SETTLE + k]; u = k / SETTLE; u = u * u * (3 - 2 * u)
                    for n in names:
                        b = fr['B'][n].copy(); b[:3, :3] = slerp_m(b[:3, :3], self.idle_dyn[n][:3, :3], u); fr['B'][n] = b

    # ---- アクションへ書き込む ----
    def bake(self, name, clip):
        """clip: dict(frames=N, loop=bool, fn=frame→pose) → Action"""
        N = clip['frames']; self.warn = []; self.dyn_mult = clip.get('tail_stiff', 1.0); self.dyn_follow = clip.get('tail_follow', 0.0)
        frames = [self.solve(clip['fn'](f)) for f in range(N + 1)]
        self.dynamics(frames, clip['loop'])
        if name == 'idle': self.idle_dyn = {n: frames[0]['B'][n].copy() for n in self.tail}
        self.measure = None
        if clip.get('measure_tail'):          # 尻尾先端の軌道（アーマチュア座標: 前=-Y）と、胴・床との余裕を記録する
            last = self.tail[-1]; L = np.linalg.norm(self.arm.data.bones[last].tail_local - self.arm.data.bones[last].head_local); tr = []; clear = 9.0
            for f, fr in enumerate(frames):
                Mt = fr['W'][last]; tip = Mt[:3, 3] + Mt[:3, 1] * L; tr.append((f, -tip[1], tip[0], tip[2]))
                a0 = fr['W']['pelvis'][:3, 3]; b0 = fr['W']['head'][:3, 3]; ab = b0 - a0
                for tn in self.tail[2:]:
                    q = fr['W'][tn][:3, 3]; t = np.clip((q - a0) @ ab / (ab @ ab), 0, 1); clear = min(clear, float(np.linalg.norm(q - (a0 + t * ab))))
            k = max(range(len(tr)), key=lambda i: tr[i][1])
            self.measure = dict(tail_tip_max_forward_m=round(tr[k][1], 4), tail_tip_max_forward_frame=tr[k][0], tail_tip_height_at_max_m=round(tr[k][3], 4), tail_tip_side_at_max_m=round(tr[k][2], 4),
                                tail_tip_min_height_m=round(min(t[3] for t in tr), 4), tail_to_body_axis_min_m=round(clear, 4),
                                tail_tip_path=[[t[0], round(t[1], 3), round(t[2], 3), round(t[3], 3)] for t in tr[::2]], tail_tip_path_columns=['frame', 'forward_m', 'left_m', 'height_m'])
        ch = {}; prevq = {}
        for f, fr in enumerate(frames):
            for bn, b in fr['B'].items():
                q = quat(b[:3, :3])
                if bn in prevq and prevq[bn].dot(q) < 0: q.negate()
                prevq[bn] = q
                for i in range(4): ch.setdefault(('pose.bones["%s"].rotation_quaternion' % bn, i), []).append((f, q[i]))
                if bn == 'pelvis' or bn.startswith(('ik_', 'pole_')):
                    for i in range(3): ch.setdefault(('pose.bones["%s"].location' % bn, i), []).append((f, b[i, 3]))
        kch = {}
        for f, fr in enumerate(frames):
            for kb in self.ob.data.shape_keys.key_blocks[1:]:
                kch.setdefault(('key_blocks["%s"].value' % kb.name, 0), []).append((f, float(fr['keys'].get(kb.name.replace('.', '_'), 0.0))))
        act = bpy.data.actions.new(name); act.use_fake_user = True
        layer = act.layers.new('Layer'); strip = layer.strips.new(type='KEYFRAME')
        for idt, idname, chans in (('OBJECT', self.arm.name, ch), ('KEY', self.ob.data.shape_keys.name, kch)):
            slot = act.slots.new(id_type=idt, name=idname); cb = strip.channelbag(slot, ensure=True)
            for (path, idx), pts in chans.items():
                fc = cb.fcurves.new(path, index=idx); fc.keyframe_points.add(len(pts))
                fc.keyframe_points.foreach_set('co', np.array(pts, dtype=np.float32).ravel())
                fc.keyframe_points.foreach_set('interpolation', np.full(len(pts), 1, dtype=np.int32)); fc.update()
        act.frame_range = (0, N); act.use_frame_range = True
        return act, sorted(set(self.warn))

def assign(arm, ob, act):
    for idb in (arm, ob.data.shape_keys):
        if idb.animation_data is None: idb.animation_data_create()
        idb.animation_data.action = act
        if act is not None:
            for s in act.slots:
                if s.target_id_type == ('OBJECT' if idb is arm else 'KEY'): idb.animation_data.action_slot = s

def to_nla(arm, ob, acts):
    for idb in (arm, ob.data.shape_keys):
        if idb.animation_data is None: idb.animation_data_create()
        idb.animation_data.action = None
        for t in list(idb.animation_data.nla_tracks): idb.animation_data.nla_tracks.remove(t)
        for act in acts:
            tr = idb.animation_data.nla_tracks.new(); tr.name = act.name; st = tr.strips.new(act.name, 0, act); st.name = act.name
            for s in act.slots:
                if s.target_id_type == ('OBJECT' if idb is arm else 'KEY'): st.action_slot = s
            tr.mute = True
