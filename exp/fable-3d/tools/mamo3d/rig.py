"""アーマチュア（変形ボーン＋IK制御＋補助ボーン）の構築。"""
import bpy, math, numpy as np
from mathutils import Vector, Matrix
from .characters import SIDES

def bone_table(spec, extra_bones):
    J = spec.J; T = []          # (name, head, tail, parent, deform)
    A = lambda *a: T.append(a)
    A('root_ground', (0, 0, 0), (0, 0, 0.08), None, True)
    A('pelvis', J['pelvis'], J['spine'], 'root_ground', True); A('spine', J['spine'], J['chest'], 'pelvis', True)
    A('chest', J['chest'], J['neck'], 'spine', True); A('neck', J['neck'], J['head'], 'chest', True)
    A('head', J['head'], J['head_top'], 'neck', True); A('jaw', J['jaw'], J['jaw_tip'], 'head', True)
    for sn, s in SIDES:
        S, E, W = J['upper_arm.' + sn], J['forearm.' + sn], J['wrist.' + sn]
        A('shoulder.' + sn, J['shoulder.' + sn], S, 'chest', True)
        A('shoulder_fix.' + sn, S, S + (E - S) * 0.4, 'shoulder.' + sn, True)
        A('upper_arm.' + sn, S, E, 'shoulder.' + sn, True); A('forearm.' + sn, E, W, 'upper_arm.' + sn, True)
        A('forearm_twist.' + sn, (E + W) / 2, W, 'forearm.' + sn, True)
        A('wrist.' + sn, W, J['paw.' + sn], 'forearm.' + sn, True); A('paw.' + sn, J['paw.' + sn], J['paw_tip.' + sn], 'wrist.' + sn, True)
        Hp, K, An = J['thigh.' + sn], J['shin.' + sn], J['ankle.' + sn]
        A('thigh_fix.' + sn, Hp, Hp + (K - Hp) * 0.4, 'pelvis', True)
        A('thigh.' + sn, Hp, K, 'pelvis', True); A('shin.' + sn, K, An, 'thigh.' + sn, True)
        A('ankle.' + sn, An, J['foot.' + sn], 'shin.' + sn, True); A('foot.' + sn, J['foot.' + sn], J['toe.' + sn], 'ankle.' + sn, True)
        A('toe.' + sn, J['toe.' + sn], J['toe_tip.' + sn], 'foot.' + sn, True)
    A('tail_01', J['tail_01'], J['tail_02'], 'pelvis', True); A('tail_02', J['tail_02'], J['tail_03'], 'tail_01', True); A('tail_03', J['tail_03'], J['tail_tip'], 'tail_02', True)
    for name, h, t, par, dyn in extra_bones: A(name, h, t, par, True)
    return T

def pole_rest(a, b, c, dist):
    """関節 b の曲げ平面上で、b の外側にあるポール位置"""
    a, b, c = map(np.asarray, (a, b, c)); mid = a + (c - a) * ((b - a) @ (c - a)) / ((c - a) @ (c - a)); d = b - mid
    return b + d / (np.linalg.norm(d) + 1e-9) * dist

def _pole_angle(base, ik, pole):
    pn = (ik.tail - base.head).cross(pole - base.head); ppa = pn.cross(base.tail - base.head)
    x = base.x_axis; ang = x.angle(ppa)
    return ang if x.cross(ppa).angle(base.tail - base.head) < 1 else -ang

def build(spec, extra_bones, name):
    J = spec.J; ad = bpy.data.armatures.new(name + '_rigdata'); arm = bpy.data.objects.new(name, ad)
    bpy.context.scene.collection.objects.link(arm); bpy.context.view_layer.objects.active = arm
    ad.display_type = 'STICK'
    bpy.ops.object.mode_set(mode='EDIT'); EB = ad.edit_bones
    for nm, h, t, par, deform in bone_table(spec, extra_bones):
        b = EB.new(nm); b.head = Vector(h); b.tail = Vector(t); b.use_deform = deform
        if par: b.parent = EB[par]
    poles = {}; angles = {}
    for sn, s in SIDES:
        for ctl, src in (('ik_hand.' + sn, 'wrist.' + sn), ('ik_foot.' + sn, 'ankle.' + sn)):
            b = EB.new(ctl); b.head = EB[src].head; b.tail = EB[src].tail; b.roll = EB[src].roll; b.use_deform = False; b.parent = EB['root_ground']
        for pn, (a, bb, c), dist in (('pole_elbow.' + sn, (J['upper_arm.' + sn], J['forearm.' + sn], J['wrist.' + sn]), 0.15),
                                     ('pole_knee.' + sn, (J['thigh.' + sn], J['shin.' + sn], J['ankle.' + sn]), 0.20)):
            p = pole_rest(a, bb, c, dist); b = EB.new(pn); b.head = Vector(p); b.tail = Vector(p) + Vector((0, 0, 0.03)); b.use_deform = False; b.parent = EB['root_ground']
            poles[pn] = p
        angles['forearm.' + sn] = _pole_angle(EB['upper_arm.' + sn], EB['forearm.' + sn], Vector(poles['pole_elbow.' + sn]))
        angles['shin.' + sn] = _pole_angle(EB['thigh.' + sn], EB['shin.' + sn], Vector(poles['pole_knee.' + sn]))
    bpy.ops.object.mode_set(mode='POSE'); PB = arm.pose.bones
    for pb in PB: pb.rotation_mode = 'QUATERNION'
    for sn, s in SIDES:
        for bone, tgt, pole in (('forearm.' + sn, 'ik_hand.' + sn, 'pole_elbow.' + sn), ('shin.' + sn, 'ik_foot.' + sn, 'pole_knee.' + sn)):
            c = PB[bone].constraints.new('IK'); c.name = 'IK'; c.target = arm; c.subtarget = tgt; c.pole_target = arm; c.pole_subtarget = pole
            c.chain_count = 2; c.use_stretch = False; c.pole_angle = angles[bone]; c.iterations = 200
        for bone, tgt in (('wrist.' + sn, 'ik_hand.' + sn), ('ankle.' + sn, 'ik_foot.' + sn)):
            c = PB[bone].constraints.new('COPY_ROTATION'); c.name = 'FollowIK'; c.target = arm; c.subtarget = tgt
        c = PB['shoulder_fix.' + sn].constraints.new('COPY_ROTATION'); c.name = 'HalfArm'; c.target = arm; c.subtarget = 'upper_arm.' + sn
        c.target_space = 'LOCAL'; c.owner_space = 'LOCAL'; c.influence = 0.5
        c = PB['thigh_fix.' + sn].constraints.new('COPY_ROTATION'); c.name = 'HalfThigh'; c.target = arm; c.subtarget = 'thigh.' + sn
        c.target_space = 'LOCAL'; c.owner_space = 'LOCAL'; c.influence = 0.5
        c = PB['forearm_twist.' + sn].constraints.new('TRANSFORM'); c.name = 'HalfTwist'; c.target = arm; c.subtarget = 'wrist.' + sn
        c.target_space = 'LOCAL'; c.owner_space = 'LOCAL'; c.map_from = 'ROTATION'; c.map_to = 'ROTATION'; c.from_rotation_mode = 'SWING_TWIST_Y'
        c.from_min_y_rot = -math.pi; c.from_max_y_rot = math.pi; c.map_to_y_from = 'Y'; c.to_min_y_rot = -math.pi * 0.5; c.to_max_y_rot = math.pi * 0.5
        c.to_euler_order = 'XYZ'; c.mix_mode_rot = 'REPLACE'
    bpy.ops.object.mode_set(mode='OBJECT')
    # レスト姿勢で IK を有効にしてもボーンが動かないことを確認し、ずれるならポール角を補正
    report = {}
    bpy.context.view_layer.update()
    def rest_err(bone):
        bpy.context.view_layer.update(); up = PB[bone].parent
        return max(up.matrix.to_quaternion().rotation_difference(up.bone.matrix_local.to_quaternion()).angle,
                   PB[bone].matrix.to_quaternion().rotation_difference(PB[bone].bone.matrix_local.to_quaternion()).angle)
    for bone in angles:
        con = PB[bone].constraints['IK']; best = None
        for step, span in ((math.radians(6), math.pi), (math.radians(1), math.radians(8)), (math.radians(0.1), math.radians(1.2))):
            c0 = best[1] if best else 0.0
            for k in range(int(round(-span / step)), int(round(span / step)) + 1):
                con.pole_angle = c0 + k * step; e = rest_err(bone)
                if best is None or e < best[0]: best = (e, c0 + k * step)
        con.pole_angle = best[1]; report[bone] = round(math.degrees(best[0]), 3)
    bpy.context.view_layer.update()
    return arm, report

def rest_data(arm):
    """モーション計算用: 各ボーンのレスト行列（アーマチュア空間 4x4）と親"""
    R = {}; par = {}
    for b in arm.data.bones:
        R[b.name] = np.array(b.matrix_local); par[b.name] = b.parent.name if b.parent else None
    return R, par
