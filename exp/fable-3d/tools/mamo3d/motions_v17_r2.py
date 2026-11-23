"""マモ拳 v17 P3 通常技 r2: タキマルのしゃがみ強「すくい上げ」だけを直した版。v17（motions_v17.py と motion/v17/*_normals_v17.glb）は変えない。
理由: 性能は下段（level: low）なのに、v17 の接触は腕が上がりきった後の保持（F17→F21、高さ 0.61m）で、しゃがんだ相手の大半に当たらなかった。
直し方: 「下から腕を上げる大きい払い」はそのまま、接触を最初の低いすくいの姿勢（F15、両手が床の近くで体より前）に置き、持続のあいだに腕が上がる（F19）。全長 46F は同じ。属性は変えない。"""
from . import motions_v17 as M
from .motions import merge, add, foot, keyed, W, K
from .motions_v2 import CROUCH, off
from .motions_v14 import R_
VERSION = 'v17-p3-normals-r2'; SLOTS = M.SLOTS; REVISED = (('takimaru', 'crouch_heavy'),)

def takimaru_crouch_heavy(cid):
    c0 = CROUCH(cid); a, c, h, f, N = 9, 15, 4, 30, 46; O = K(c0, paw_open_L=1.0, paw_open_R=1.0)
    up_ = dict(fwd=(0, 0.5, 0.85), back=(0, -0.85, 0.5), elbow=(0.9, -0.3, -0.2)); lo_ = dict(fwd=(0, 0.95, 0.3), back=(0, 0.3, -0.95), elbow=(0.9, -0.3, -0.1))
    wind = merge(c0, pelvis=off(c0, (0, 0.06, -0.06), (10, 0, 0)), chest=add(c0['chest'], (8, 0, 0)), handL=R_((0.34, 0.60, 0.10)), handR=R_((0.34, 0.50, 0.10)), tail=(-10, 0), keys=O)
    # 接触: 密着の一歩。腰は低いまま前へ、頭は引いて、両手を床の近くで相手の足もとへ差し入れる（掌は上）
    scoop = merge(c0, pelvis=off(c0, (0, 0.14, -0.02), (0, 0, 0)), chest=add(c0['chest'], (-2, 0, 0)), head=add(c0['head'], (-10, 0, 0)), handL=W((0.04, 0.80, -0.52), **lo_), handR=W((0.04, 0.80, -0.52), **lo_),
                  footL=foot(c0, 'footL', (0, 0.22, 0)), footR=foot(c0, 'footR', (0, 0.08, 0)), tail=(4, 0), jaw=8.0, keys=O)
    lift = merge(scoop, pelvis=off(c0, (0, 0.18, 0.04), (-2, 0, 0)), handL=W((0.04, 0.82, -0.34), **lo_), handR=W((0.04, 0.82, -0.34), **lo_))          # 持続 2F 目: まだ低い
    hit = merge(c0, pelvis=off(c0, (0, 0.30, 0.30), (-14, 0, 0)), chest=add(c0['chest'], (-16, 0, 0)), head=add(c0['head'], (10, 0, 0)), handL=W((0.06, 0.90, 0.30), **up_), handR=W((0.06, 0.90, 0.30), **up_),
                footL=foot(c0, 'footL', (0, 0.30, 0)), footR=foot(c0, 'footR', (0, 0.16, 0)), tail=(14, 0), jaw=12.0, keys=O)                               # v17 の接触姿勢（腕が上がりきった形）。持続の終わり
    fol = merge(hit, handL=W((0.10, 0.70, 0.62), fwd=(0, 0.3, 0.95), back=(0, -0.95, 0.3), elbow=(0.9, -0.3, -0.2)), handR=W((0.10, 0.70, 0.62), fwd=(0, 0.3, 0.95), back=(0, -0.95, 0.3), elbow=(0.9, -0.3, -0.2)), jaw=4.0)
    keys = [(0, c0), (a, wind, 'out'), (c, scoop, 'in3'), (c + 1.4, lift, 'lin'), (c + h, hit, 'in'), (f, fol, 'out'), (N, c0, 'io')]
    return dict(frames=N, loop=False, fn=keyed(keys), tail_follow=0.0, info=dict(group='normal', priority=3, start_pose='crouch', end_pose='crouch', v2=True, v17=True, revision='r2', character=cid, game_action='crouch_heavy', name_jp='すくい上げ',
                attack_limb='pawL+pawR', windup_frame=a, contact_frame=c, contact_hold_frames=h, follow_frame=f, contact=round(c / N, 4), contact_end=round((c + h) / N, 4),
                silhouette='両手を引いて構える→密着の一歩と一緒に、両手を床の近くで相手の足もとへ差し入れる（接触）→そのまま下から両腕ですくい上げ、腕が頭上まで上がる',
                r2_note='r1（v17_crouch_heavy）は接触が腕の上がりきった後で、下段なのに高さ 0.61m。接触を低いすくいの姿勢に置き、持続中に上がる形にした。全長と属性は同じ'))

OVERRIDE_R2 = {('takimaru', 'crouch_heavy'): takimaru_crouch_heavy}
def clip_name(cid, slot): return ('v17r2_' if (cid, slot) in OVERRIDE_R2 else 'v17_') + slot
def moves(cid):
    m = dict(M.MOVES[cid](cid))
    for (c, slot), fn in OVERRIDE_R2.items():
        if c == cid: m[slot] = fn(cid)
    return m
