"""マモ拳 v17 P3 必殺 r2: 対空 3 本（タキマル s2 抱え上げ / ヨミカゲ s2 昇り肘 / バレット s2 尾跳ね）の接触姿勢を前へ伸ばした版。
v17（motions_v17s.py と motion/v17/*_specials_v17.glb）は変えない。ここは 3 本の差し替えだけを持ち、残り 24 本は v17 と同じ関数をそのまま使う。
理由: v17 の実測で、3 本とも打撃部位が体の真上〜後ろにあり（前方 0.015 / 0.143 / 最大 0.041 m）、地上の相手に届く距離にならなかった。
直し方: 踏み込みと重心を前へ出し、手・肘・尾そのものを前上へ伸ばす。発生・持続・全体フレームは v17 と同じ。見えない距離の水増しはしない。"""
from . import motions_v17s as S
from .motions import neutral, merge, pel, add, foot, keyed, W, K
from .motions_v14 import P, R_, minfo, spun
from .motions_v14b import _tb, _palm
VERSION = 'v17-p3-specials-r2'; SLOTS = S.SLOTS; IDS = S.IDS; REVISED = (('takimaru', 's2'), ('yomikage', 's2'), ('bullet', 's2'), ('moguzo', 's2'), ('godan', 's2'), ('hakuma', 's3'))

def takimaru_s2(cid):
    """抱え上げ r2: 潜ってすくう→一歩踏み込み、両腕を前上へ突き上げて当てる→持続のあいだに頭上へ持ち上げ、のけぞって止める。"""
    n0 = neutral(cid); st, ac, N = 10, 7, 44
    scoop = merge(n0, pelvis=pel(n0, (0, 0.24, -0.56), (36, 0, 0)), chest=add(n0['chest'], (8, 0, 0)), neck=add(n0['neck'], (-16, 0, 0)), head=add(n0['head'], (-30, 16, 0)),
                  handL=W((-0.10, 0.80, -0.60), fwd=(0, 0.9, 0.3), back=(0, 0.3, -0.95), elbow=(0.9, -0.2, -0.2)), handR=W((-0.10, 0.80, -0.60), fwd=(0, 0.9, 0.3), back=(0, 0.3, -0.95), elbow=(0.9, -0.2, -0.2)),
                  footL=foot(n0, 'footL', (0.10, 0.46, 0), knee=0.8), footR=foot(n0, 'footR', (0.12, 0.0, 0), knee=0.8), tail=(40, 0), keys=K(n0, paw_open_L=1.0, paw_open_R=1.0, brow_angry=1.0))
    arm = lambda f, u: dict(handL=W((-0.06, f, u), fwd=(0, 0.6, 0.8), back=(0, 0.8, -0.6), elbow=(0.9, -0.1, -0.4)), handR=W((-0.06, f, u), fwd=(0, 0.6, 0.8), back=(0, 0.8, -0.6), elbow=(0.9, -0.1, -0.4)))
    feet = dict(footL=foot(n0, 'footL', (0.10, 0.46, 0), knee=0.5), footR=foot(n0, 'footR', (0.12, 0.0, 0), pitch=34))
    # 接触: 腰は前足の上でまだ低く、上体は少し前。両手は肩より前、相手の胸〜わきの下の高さ（立っている相手に当たる高さ）
    heave = merge(n0, pelvis=pel(n0, (0, 0.28, -0.16), (10, 0, 0)), spine=add(n0['spine'], (-4, 0, 0)), chest=add(n0['chest'], (-8, 0, 0)), head=add(n0['head'], (-16, 16, 0)), **arm(0.64, 0.12), **feet, tail=(-20, 0), jaw=20.0, keys=K(n0, paw_open_L=1.0, paw_open_R=1.0, brow_angry=1.0))
    # 持続の終わり: 腰が伸びて上体が起き、両手は頭より上・まだ前
    hoist = merge(n0, pelvis=pel(n0, (0, 0.30, 0.12), (-10, 0, 0)), spine=add(n0['spine'], (-8, 0, 0)), chest=add(n0['chest'], (-10, 0, 0)), head=add(n0['head'], (-12, 16, 0)), **arm(0.48, 0.90), **feet, tail=(-30, 0), jaw=20.0, keys=K(n0, paw_open_L=1.0, paw_open_R=1.0, brow_angry=1.0))
    # 止め: v17 までと同じ「のけぞって頭上」の絵（当たり判定の外）
    top = merge(n0, pelvis=pel(n0, (0, 0.28, 0.16), (-28, 0, 0)), spine=add(n0['spine'], (-12, 0, 0)), chest=add(n0['chest'], (-14, 0, 0)), head=add(n0['head'], (-10, 16, 0)),
                handL=P((0.12, 0.20, 0.96), fwd=(0, 0.4, 0.9), back=(0, 0.9, -0.4), elbow=(0.95, 0, 0)), handR=P((0.12, 0.20, 0.96), fwd=(0, 0.4, 0.9), back=(0, 0.9, -0.4), elbow=(0.95, 0, 0)),
                footL=foot(n0, 'footL', (0.10, 0.46, 0), pitch=14), footR=foot(n0, 'footR', (0.12, 0.0, 0), pitch=34), tail=(-36, 0), jaw=20.0, keys=K(n0, paw_open_L=1.0, paw_open_R=1.0, brow_angry=1.0))
    keys = [(0, n0), (6, scoop, 'out'), (7, scoop, 'lin'), (st, heave, 'in3'), (st + ac - 1, hoist, 'lin'), (st + ac + 4, top, 'out'), (26, top, 'lin'), (34, merge(n0, pelvis=pel(n0, (0, 0.20, -0.10), (4, 0, 0)), handL=P((0.6, 0.3, 0.2)), handR=P((0.6, 0.3, 0.2)), footL=foot(n0, 'footL', (0.10, 0.30, 0))), 'out'), (N, n0, 'io')]
    return dict(frames=N, loop=False, fn=keyed(keys), info=minfo(cid, 's2', '抱え上げ', st, ac, N, attack_limb='pawL+pawR', fx_anchor='pawR', anti_air=True, grounded=True,
                silhouette='深く潜って両手が膝の下(F6)→一歩踏み込み、両腕を前上へ突き上げる(F10)→そのまま頭上へ持ち上げ(F16)、のけぞって止める(F21-26)',
                note='r2: v17 は両手が頭の真上（前方 0.015m）で、地上の相手に届かなかった。踏み込みを深くし、接触は前上、止めの絵は元のまま'))

def yomikage_s2(cid):
    """昇り肘 r2: 払い下げ→深く一歩入り、体ごと前へ寄せて肘を前上へ突き上げる。跳ばない。"""
    n0 = neutral(cid); st, ac, N = 8, 7, 40
    parry = merge(n0, pelvis=pel(n0, (0, 0.14, -0.26), (10, -20, 0)), chest=add(n0['chest'], (6, -12, 0)), handL=W((0.05, 0.70, -0.20), fwd=(0, 0.6, -0.8), back=(0, 0.8, 0.6)), handR=P((0.20, -0.20, -0.40)), footL=foot(n0, 'footL', (0, 0.26, 0)), tail=(-10, 0), keys=K(n0, paw_open_L=1.0, brow_angry=0.8))
    elbow = lambda f, u, lean: merge(n0, pelvis=pel(n0, (0, f, u), (lean, 40, 0)), spine=add(n0['spine'], (-4, 8, 0)), chest=add(n0['chest'], (-6, 20, 0)), neck=add(n0['neck'], (-6, -20, 0)), head=add(n0['head'], (-16, -40, 0)),
                  handR=W((-0.30, 0.30, 0.58), fwd=(-0.4, -0.3, 0.85), back=(0.6, 0.8, 0), elbow=(0.0, 0.8, 0.6)), handL=W((0.05, 0.50, -0.56), fwd=(0, 0.6, -0.8), back=(0, 0.8, 0.6)),
                  footL=foot(n0, 'footL', (0, 0.70, 0), knee=0.5), footR=foot(n0, 'footR', (0, 0.10, 0), pitch=44), tail=(-26, 0), jaw=8.0, keys=K(n0, paw_open_L=1.0, brow_angry=1.0))
    keys = [(0, n0), (4, parry, 'out'), (st, elbow(0.62, 0.04, 2), 'in3'), (st + ac, elbow(0.64, 0.12, -6), 'lin'), (28, merge(n0, pelvis=pel(n0, (0, 0.30, -0.06), (0, 10, 0)), footL=foot(n0, 'footL', (0, 0.44, 0))), 'out'), (N, n0, 'io')]
    return dict(frames=N, loop=False, fn=keyed(keys), info=minfo(cid, 's2', '昇り肘', st, ac, N, attack_limb='elbowR', fx_anchor='pawR', anti_air=True, grounded=True,
                silhouette='奥の手で払い下げる(F4)→深く一歩入り、腰ごと前へ寄せて手前の肘を前上へ突き上げる。拳は耳の横(F8-15)。払った手は下に残る',
                note='r2: v17 は肘が体の真上寄り（前方 0.143m）。踏み込みを深くして腰を前足へ乗せ、肘の向きを前上にした'))

def bullet_s2(cid):
    """尾跳ね r2: 沈んで尾を巻く→前へ折れて小さく跳ね、尾を背中越しに前上へ打ち出す（さそりの形）。先端は頭より前・頭より高い。"""
    n0 = neutral(cid); st, ac, N = 9, 7, 43
    coil = merge(n0, pelvis=pel(n0, (0, -0.02, -0.26), (14, 0, 0)), handL=P((0.2, 0.2, -0.3)), handR=P((0.2, 0.1, -0.3)), tail=(0, 0), tail_bones=_tb(cid, -60), keys=K(n0, brow_angry=0.9))
    spike = lambda f, u, p, t: merge(n0, pelvis=pel(n0, (0, f, u), (p, 0, 0)), spine=add(n0['spine'], (10, 0, 0)), chest=add(n0['chest'], (12, 0, 0)), head=add(n0['head'], (-24, 20, 0)), handL=P((0.5, 0.3, -0.2)), handR=P((0.5, 0.2, -0.2)),
                  footL=foot(n0, 'footL', (0, 0.10, 0.36), pitch=40), footR=foot(n0, 'footR', (0, -0.04, 0.42), pitch=50), tail=(0, 0), tail_bones=_tb(cid, t), jaw=10.0, keys=K(n0, brow_angry=1.0))
    keys = [(0, n0), (4, coil, 'out'), (st - 2, spike(0.06, 0.42, 60, 150), 'in3'), (st, spike(0.08, 0.52, 68, 158), 'out'), (st + ac + 3, spike(0.10, 0.58, 66, 150), 'lin'), (30, merge(n0, pelvis=pel(n0, (0, 0.14, -0.18), (10, 0, 0))), 'in'), (N, n0, 'io')]
    return dict(frames=N, loop=False, fn=keyed(keys), tail_stiff=3.0, tail_follow=0.9, info=minfo(cid, 's2', '尾跳ね', st, ac, N, attack_limb='tail', fx_anchor='tail', anti_air=True, visual_airborne_frames=[7, 28],
                silhouette='沈んで尾を巻く(F4)→前へ折れて小さく跳ね、尾が背中越しに前上へ出る(F9-19)。先端は頭より前で頭より高い',
                note='r2: v17 は尾が真上（接触時は体の後ろ −0.10m、ばねの遅れで持続の最後に 0.04m）。体を前へ深く折り、尾を前上へ。尾は接触フレームに間に合うよう早めに振り出す'))

def moguzo_s2(cid):
    """昇り拳 r2: 巻いて沈む→まだ足が地面にあるうちに、低い右アッパーを前へ打ち上げて当てる→そのまま回りながら跳び、拳が真上へ抜ける。"""
    n0 = neutral(cid); st, ac, N = 6, 8, 40
    coil = merge(n0, pelvis=pel(n0, (0, 0.06, -0.34), (18, -30, 0)), chest=add(n0['chest'], (10, -18, 0)), head=add(n0['head'], (-8, 40, 0)),
                 handR=R_((0.25, 0.10, 0.20), fwd=(0, 0.6, 0.8), back=(0.3, -0.9, 0.3), elbow=(0.6, -0.7, -0.3)), handL=P((0.10, 0.35, 0.10)), footL=foot(n0, 'footL', (0, 0.16, 0), knee=0.6), tail=(-14, 0), keys=K(n0, brow_angry=1.0))
    # 接触: 前足で踏み切る直前。腰は前足の上へ出て伸び上がりはじめ、右拳は相手の胸〜あごの高さで前
    low = merge(n0, pelvis=pel(n0, (0, 0.30, 0.06), (4, 16, 0)), spine=add(n0['spine'], (-4, 0, 0)), chest=add(n0['chest'], (-6, 14, 0)), head=add(n0['head'], (-12, -20, 0)),
                handR=W((-0.16, 0.80, 0.22), fwd=(0, 0.35, 0.95), back=(0.2, -0.95, 0.3), elbow=(0.5, -0.3, -0.8)), handL=P((0.10, -0.25, -0.30), fwd=(0, 0.2, -1.0), back=(0.9, 0.3, 0), elbow=(0.6, -0.8, 0)),
                footL=foot(n0, 'footL', (0, 0.34, 0), pitch=16), footR=foot(n0, 'footR', (0, 0.02, 0.14), pitch=30), tail=(10, 0), jaw=14.0, keys=K(n0, brow_angry=1.0))
    up = merge(n0, pelvis=pel(n0, (0, 0.26, 0.95), (-10, 0, 0)), spine=add(n0['spine'], (-8, 0, 0)), chest=add(n0['chest'], (-12, 10, 0)), head=add(n0['head'], (-18, 0, 0)),
               handR=W((-0.10, 0.30, 0.94), fwd=(0, 0.15, 1.0), back=(0.2, -1.0, 0.1), elbow=(0.7, 0.2, -0.6)), handL=P((0.10, -0.25, -0.30), fwd=(0, 0.2, -1.0), back=(0.9, 0.3, 0), elbow=(0.6, -0.8, 0)),
               footL=foot(n0, 'footL', (0, 0.30, 1.25), pitch=30, knee=0.2), footR=foot(n0, 'footR', (0, -0.05, 0.70), pitch=55), tail=(28, 0), jaw=14.0, keys=K(n0, brow_angry=1.0))
    peak = merge(up, pelvis=pel(n0, (0, 0.26, 1.10), (-6, 0, 0)), footR=foot(n0, 'footR', (0, -0.10, 0.92), pitch=60))
    fall = merge(n0, pelvis=pel(n0, (0, 0.16, 0.45), (4, 0, 0)), handR=W((-0.05, 0.40, 0.50), fwd=(0, 0.3, 1.0), back=(0.4, -0.8, 0.2), elbow=(0.7, -0.2, -0.6)),
                 footL=foot(n0, 'footL', (0, 0.10, 0.40), pitch=20), footR=foot(n0, 'footR', (0, 0.0, 0.34), pitch=30), tail=(22, 0))
    land = merge(n0, pelvis=pel(n0, (0, 0.06, -0.24), (14, 0, 0)), handR=P((0.15, 0.30, -0.10)), handL=P((0.20, 0.30, -0.15)), tail=(-12, 0))
    keys = [(0, n0), (3, coil, 'out'), (st, low, 'in'), (st + 5, up, 'lin'), (st + ac, peak, 'out'), (st + ac + 3, peak, 'lin'), (23, fall, 'in'), (28, land, 'in'), (N, n0, 'io')]
    spin = [(0, 0), (st, 0, 'lin'), (st + ac, 250, 'in'), (23, 360, 'out'), (N, 360, 'lin')]
    return dict(frames=N, loop=False, fn=spun(cid, keys, spin), info=minfo(cid, 's2', '昇り拳', st, ac, N, attack_limb='pawR', anti_air=True, fx_anchor='pawR', visual_airborne_frames=[7, 27], visual_peak_height_leg=1.10,
                silhouette='右へ巻いて沈む(F3)→前足で踏み切りながら低い右アッパーを前へ(F6)→左回りに回って跳び、右拳は真上・前ひざは腹まで(F11-17)→着地で深く沈む(F28)',
                note='r2: v17 は接触の瞬間にもう跳んで回っていて、拳が高さ 0.80m にあり地上の相手に当たらなかった。接触を「低いアッパー」の姿勢にし、回転と上昇はその後へ送った。発生・持続・全体は同じ'))

def godan_s2(cid):
    """岩砕き r2: 跳ばない対空。深くしゃがんで両拳を股の間へ下ろし、半歩出て前上へ振り上げる。"""
    n0 = neutral(cid); st, ac, N = 11, 7, 49
    load = merge(n0, pelvis=pel(n0, (0, 0.10, -0.58), (34, 10, 0)), spine=add(n0['spine'], (10, 0, 0)), chest=add(n0['chest'], (12, 0, 0)), neck=add(n0['neck'], (-14, 0, 0)), head=add(n0['head'], (-30, 14, 0)),
                 handL=R_((-0.45, 0.75, 0.22), fwd=(-0.3, 0.3, -0.9), back=(0, 0.95, 0.3), elbow=(0.9, 0, 0.3)), handR=R_((-0.45, 0.80, 0.22), fwd=(-0.3, 0.3, -0.9), back=(0, 0.95, 0.3), elbow=(0.9, 0, 0.3)),
                 footL=foot(n0, 'footL', (0.12, 0.14, 0), knee=0.8), footR=foot(n0, 'footR', (0.12, 0, 0), knee=0.8), tail=(34, 0), keys=K(n0, brow_angry=1.0))
    crush = lambda f, u, lean, hf, hu: merge(n0, pelvis=pel(n0, (0, f, u), (lean, 10, 0)), spine=add(n0['spine'], (-8, 0, 0)), chest=add(n0['chest'], (-12, 0, 0)), neck=add(n0['neck'], (-6, 0, 0)), head=add(n0['head'], (-20, 14, 0)),
                  handL=W((-0.42, hf, hu), fwd=(-0.2, 0.4, 0.9), back=(0.2, -0.9, 0.35), elbow=(0.9, 0.2, -0.3)), handR=W((-0.42, hf + 0.04, hu), fwd=(-0.2, 0.4, 0.9), back=(0.2, -0.9, 0.35), elbow=(0.9, 0.2, -0.3)),
                  footL=foot(n0, 'footL', (0.10, 0.34, 0), pitch=20), footR=foot(n0, 'footR', (0.10, 0, 0), pitch=40), tail=(-26, 0), jaw=18.0, keys=K(n0, brow_angry=1.0))
    spread = merge(n0, pelvis=pel(n0, (0, 0.18, -0.14), (6, 4, 0)), handL=P((0.85, 0.10, 0.30), fwd=(0.6, 0.2, 0.7), back=(0.3, -0.6, 0.7), elbow=(0.7, -0.5, -0.4)), handR=P((0.85, 0.10, 0.30), fwd=(0.6, 0.2, 0.7), back=(0.3, -0.6, 0.7), elbow=(0.7, -0.5, -0.4)),
                   footL=foot(n0, 'footL', (0.10, 0.22, 0)), footR=foot(n0, 'footR', (0.10, 0, 0)), tail=(8, 0), jaw=4.0, keys=K(n0, brow_angry=1.0))
    keys = [(0, n0), (6, load, 'out'), (8, load, 'lin'), (st, crush(0.34, 0.04, 4, 0.70, 0.30), 'in'), (st + ac, crush(0.36, 0.26, -14, 0.52, 0.92), 'lin'), (30, spread, 'out'), (N, n0, 'io')]
    return dict(frames=N, loop=False, fn=keyed(keys), info=minfo(cid, 's2', '岩砕き', st, ac, N, attack_limb='pawL+pawR', fx_anchor='pawR', anti_air=True, grounded=True,
                silhouette='股の間へ両拳を落として深くしゃがむ(F6-8)→半歩出て、両拳を前上へ振り上げる(F11)→背を反らせて頭上へ(F18)。足は地面から離れない',
                note='r2: v17 は両拳の前方が 0.172m で、最小の押し合い距離にわずかに届かなかった。半歩の踏み込みと、前上への振り上げにした'))

def hakuma_s3(cid):
    """連続突っ張り r2: 一発ごとに一歩。3 発目（接触 F12）を、実際にいちばん深く踏み込んで肩ごと伸びた姿勢にする。"""
    n0 = neutral(cid); st, ac, N = 12, 9, 46
    def thr(lead, d, both=False, lean=10, tw=30):
        sg = 1 if lead == 'L' else -1; o = 'R' if lead == 'L' else 'L'; one = 0 if both else 1
        return merge(n0, pelvis=pel(n0, (0.04 * sg, 0.10 + d, -0.22), (lean, -tw * sg * one, 0)), chest=add(n0['chest'], (6, -22 * sg * one, 0)), head=add(n0['head'], (-8, (tw + 0) * sg * one, 0)),
                     footL=foot(n0, 'footL', (0.06, d + (0.16 if lead == 'L' else 0), 0), knee=0.6), footR=foot(n0, 'footR', (0.08, d * 0.6 + (0.30 if lead == 'R' else 0), 0), pitch=0 if lead == 'R' else 20, knee=0.6), tail=(-10, 10 * sg), jaw=12.0 if both else 6.0,
                     keys=K(n0, paw_open_L=1.0, paw_open_R=1.0, brow_angry=1.0), **{'hand' + lead: _palm(-0.14, 0.97, 0.10), 'hand' + o: _palm(-0.2, 0.96, 0.04) if both else P((0.30, -0.40, -0.10), fwd=(0, 0.5, 0.85), back=(0.9, 0, 0.3), elbow=(0.5, -0.85, 0))})
    keys = [(0, n0), (4, thr('L', 0.0), 'in'), (6, thr('L', 0.0), 'lin'), (8, thr('R', 0.14), 'io'), (10, thr('R', 0.14), 'lin'), (st, thr('L', 0.44, lean=16, tw=38), 'io'), (st + 3, thr('L', 0.46, lean=16, tw=38), 'lin'), (st + 5, thr('R', 0.52), 'io'), (st + 7, thr('R', 0.52), 'lin'),
            (st + ac, thr('L', 0.58, True), 'io'), (st + ac + 5, thr('L', 0.60, True), 'lin'), (36, merge(n0, pelvis=pel(n0, (0, 0.34, -0.10), (4, 0, 0))), 'out'), (N, n0, 'io')]
    return dict(frames=N, loop=False, fn=keyed(keys), info=minfo(cid, 's3', '連続突っ張り', st, ac, N, attack_limb='pawL+pawR', fx_anchor='pawR', travel_frames=[0, st + ac],
                silhouette='左(F4)・右(F8)と出て、3 発目の左(F12)でいちばん深く踏み込み肩ごと伸びる→右(F17)→最後に両手(F21)。そのたび足が一歩進む',
                note='r2: v17 は接触 F12 の掌の前方が 0.493m。3 発目の踏み込みを深くして、接触時刻に実際に前へ出た姿勢を置いた。発生・持続・全体は同じ'))

OVERRIDE_R2 = {('takimaru', 's2'): takimaru_s2, ('yomikage', 's2'): yomikage_s2, ('bullet', 's2'): bullet_s2, ('moguzo', 's2'): moguzo_s2, ('godan', 's2'): godan_s2, ('hakuma', 's3'): hakuma_s3}
def clip_name(cid, slot): return slot + ('_v17r2' if (cid, slot) in OVERRIDE_R2 else '_v17')
def make(cid, slot):
    if (cid, slot) not in OVERRIDE_R2: return S.make(cid, slot)
    clip = OVERRIDE_R2[(cid, slot)](cid); kind, weight, role = S.ROLE[cid][slot]; I = clip['info']; st = I.get('contact_frame', I['startup'])
    info = dict(I, v17=True, origin='v17 r2 revised', role=role, kind=kind, weight=weight, contact=round(st / clip['frames'], 4), contact_end=round((st + max(1, I.get('active', 1)) - 1) / clip['frames'], 4),
                cue_track=S.cues(I, kind, weight, clip['frames']), hitstop_suggest=dict(hit=S.HITSTOP[weight][0], guard=S.HITSTOP[weight][1]))
    for k in ('contact_pose_frame', 'ingame_lead_frames'): info.pop(k, None)
    return dict(clip, info=info)
