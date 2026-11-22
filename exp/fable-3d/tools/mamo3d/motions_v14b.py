"""Showtime v14 第二弾: ピスケ／ハクマ／タキマル／ヨミカゲ／バレット／ダークモグゾーの必殺 s1/s2/s3・奥義始動・奥義ムービーの演技。
書き方と決まりごとは motions_v14.py と同じ（発生・持続・硬直は balance.js の現行値、性能は変えない）。"""
import math
from . import motions as M, motions_v2 as V2
from .motions import neutral, merge, pel, add, hand, foot, keyed, sample, W, K, STYLE
from .motions_v2 import body, plain, REACT, _down, _tb, FALL
from .motions_v14 import P, R_, spun, minfo, T, cinfo14, V_, hold

def KF(pos, yaw=-20, pitch=0, knee=0.0): return dict(pos=pos, yaw=yaw, pitch=pitch, knee=knee, toe=0)       # 蹴り足（足首の位置を直接。脚の長さ単位）

# =====================================================================
# ピスケ（高速・チェイス / 風 / 脚）
# =====================================================================
def _pk(cid, pos, pit, pp, pr, arms=0.0, yawfoot=-24):
    n0 = neutral(cid)
    return merge(n0, pelvis=pel(n0, pp, pr), spine=add(n0['spine'], (-6, 8, -6)), chest=add(n0['chest'], (-8, 10, -6)), neck=add(n0['neck'], (8, -20, 6)), head=add(n0['head'], (10, -44, 8)),
                 handL=hand(n0, 'handL', (0.10 + arms, -0.15, 0.0)), handR=hand(n0, 'handR', (0.30 + arms, -0.25 - arms, -0.20)),
                 footL=foot(n0, 'footL', (-0.02, -0.10, 0), yaw=-42, pitch=6), footR=KF(pos, yawfoot, pit), tail=(25, -30), jaw=8.0, keys=K(n0, brow_angry=0.9))
def pisuke_s1(cid):
    """風の気弾: 手ではなく蹴りで出す。背中を見せるまで体を巻き、回し蹴りの足先から風の刃。"""
    n0 = neutral(cid); st, ac, N = 11, 1, 29
    wind = merge(n0, pelvis=pel(n0, (0.04, -0.06, -0.10), (4, 96, 0)), chest=add(n0['chest'], (0, 30, 0)), neck=add(n0['neck'], (0, -40, 0)), head=add(n0['head'], (0, -80, 0)),
                 handL=P((0.50, 0.10, 0.20)), handR=P((0.30, 0.40, 0.10)), footL=foot(n0, 'footL', (0, 0.0, 0), yaw=40), footR=foot(n0, 'footR', (0.10, 0.10, 0.20), pitch=30, knee=0.4), tail=(20, 50), keys=K(n0, brow_angry=0.9))
    whip = _pk(cid, (-0.30, 1.20, 0.80), -20, (-0.06, 0.24, 0.10), (-26, -30, -18), 0.3, -60)
    thru = _pk(cid, (-0.60, 0.70, 0.60), -10, (-0.04, 0.20, 0.06), (-14, -70, -10), 0.2, -90)
    keys = [(0, n0), (6, wind, 'out3'), (8, wind, 'lin'), (st, whip, 'in3'), (st + 3, whip, 'lin'), (st + 8, thru, 'out'), (N, n0, 'io')]
    return dict(frames=N, loop=False, fn=keyed(keys), info=minfo(cid, 's1', '風の気弾', st, ac, N, attack_limb='footR', fx_anchor='footR', projectile_spawn_frame=st,
                silhouette='背中が見えるまで体を巻く(F6-8)→手前の脚の回し蹴りが胸の高さで水平に伸びる(F11)→振り抜いて半身で戻る', note='旧 cmd_236（片手の掌。モグゾー系と同形）を置き換える。弾は足先から出る想定'))
def pisuke_s2(cid):
    """空牙蹴り: 跳ね上がり、手前の脚を真上まで上げて体を一直線に。頂点で止まる。"""
    n0 = neutral(cid); st, ac, N = 6, 8, 36
    dip = merge(n0, pelvis=pel(n0, (0, 0.02, -0.26), (14, 10, 0)), chest=add(n0['chest'], (8, 0, 0)), handL=P((0.3, 0.2, -0.3)), handR=P((0.3, 0.1, -0.3)), tail=(-14, 0), keys=K(n0, brow_angry=1.0))
    split = merge(n0, pelvis=pel(n0, (0, 0.12, 0.90), (-34, 20, 0)), spine=add(n0['spine'], (-10, 4, 0)), chest=add(n0['chest'], (-12, 6, 0)), neck=add(n0['neck'], (10, -10, 0)), head=add(n0['head'], (22, -30, 0)),
                  handL=P((0.55, -0.30, 0.10)), handR=P((0.60, -0.40, -0.10)), footL=foot(n0, 'footL', (0, -0.10, 0.50), pitch=60), footR=KF((-0.16, 0.42, 2.45), -15, -70), tail=(34, -10), jaw=12.0, keys=K(n0, brow_angry=1.0))
    top = merge(split, pelvis=pel(n0, (0, 0.12, 1.05), (-38, 20, 0)))
    fall = merge(n0, pelvis=pel(n0, (0, 0.06, 0.40), (-6, 10, 0)), footL=foot(n0, 'footL', (0, 0.02, 0.36), pitch=24), footR=KF((-0.05, 0.30, 0.70), 0, 10, 0.3), tail=(22, 0))
    land = merge(n0, pelvis=pel(n0, (0, 0.02, -0.20), (10, 0, 0)), tail=(-10, 0))
    keys = [(0, n0), (3, dip, 'out'), (st, split, 'in'), (st + 4, top, 'out'), (st + ac, top, 'lin'), (24, fall, 'io'), (28, land, 'in'), (N, n0, 'io')]
    return dict(frames=N, loop=False, fn=keyed(keys), info=minfo(cid, 's2', '空牙蹴り', st, ac, N, attack_limb='footR', fx_anchor='footR', anti_air=True, visual_airborne_frames=[5, 27], visual_peak_height_leg=1.05,
                silhouette='沈む(F3)→跳ねて手前の脚が頭の真上、体と脚が一本の縦線(F6-14)→着地', note='旧 cmd_623（チルカと同じ蹴り上げ）を、縦の一直線と頂点の止めで強めた'))
def pisuke_s3(cid):
    """連脚: 中段→上段→そのまま振り下ろすかかと落とし。蹴るたびに腰が前へ出る。"""
    n0 = neutral(cid); st, ac, N = 7, 9, 36
    ch = merge(n0, pelvis=pel(n0, (-0.03, 0.06, 0.06), (-6, 30, -8)), handL=P((0.2, 0.3, 0.1)), handR=P((0.3, 0.1, 0.0)), footL=foot(n0, 'footL', (-0.02, 0.0, 0), yaw=-30), footR=KF((-0.20, 0.50, 0.62), -20, 30, 0.2), tail=(15, -20), keys=K(n0, brow_angry=0.9))
    mid = _pk(cid, (-0.22, 1.20, 0.46), -10, (-0.04, 0.26, 0.06), (-10, 40, -10))
    high = _pk(cid, (-0.22, 1.02, 1.20), -32, (-0.05, 0.40, 0.14), (-24, 46, -14), 0.2)
    back = _pk(cid, (-0.20, 1.25, 0.20), 20, (-0.02, 0.56, -0.16), (16, 30, -6), 0.4)          # かかと落とし: 上段から振り下ろして前へ踏み込む
    keys = [(0, n0), (4, ch, 'out'), (st, mid, 'in'), (st + 2, mid, 'lin'), (st + 4, ch, 'io'), (st + 6, high, 'in'), (st + 8, high, 'lin'), (st + 11, back, 'io'), (st + 15, back, 'lin'), (28, merge(n0, pelvis=pel(n0, (0, 0.30, -0.06), (6, 60, 0))), 'io'), (N, n0, 'io')]
    return dict(frames=N, loop=False, fn=keyed(keys), info=minfo(cid, 's3', '連脚', st, ac, N, attack_limb='footR', fx_anchor='footR', travel_frames=[0, st + ac], hits_visual=[st, st + 6, st + 11],
                silhouette='中段の前蹴り(F7)→上段(F13)→上げた脚をそのまま振り下ろして踏み込む(F18)。3発とも足の高さが違う', note='旧 sp_double_kick（その場の二連）にかかと落としを足し、腰の前進を入れた。3発目は持続の後ろに掛かる見た目だけの追い蹴り'))
def pisuke_ult(cid):
    """音速連咆（対戦中の始動）: 低い踏み切りから体を横に倒した飛び横蹴り。当たればムービーへ。"""
    n0 = neutral(cid); st, ac, N = 5, 12, 44
    crouch = merge(n0, pelvis=pel(n0, (0, -0.06, -0.36), (30, 0, 0)), handL=R_((0.0, 1.2, 0.08)), handR=P((0.3, -0.3, 0.2)), footR=foot(n0, 'footR', (0, -0.30, 0), pitch=50), tail=(40, 0), keys=K(n0, brow_angry=1.0))
    fly = merge(_pk(cid, (-0.20, 1.45, 1.05), -20, (-0.04, 0.50, 0.55), (-40, 44, -12), 0.5), footL=foot(n0, 'footL', (0.05, 0.20, 0.75), pitch=50, knee=0.8), tail=(-10, 30), jaw=14.0)
    keys = [(0, n0), (3, crouch, 'out3'), (st, fly, 'in3'), (st + ac, fly, 'lin'), (28, merge(n0, pelvis=pel(n0, (0, 0.30, -0.24), (14, 0, 0))), 'in'), (N, n0, 'io')]
    return dict(frames=N, loop=False, fn=keyed(keys), info=minfo(cid, 'ultimate', '音速連咆', st, ac, N, attack_limb='footR', fx_anchor='footR', movie_on_hit='manifest/pisuke_ultimate.json',
                silhouette='片手を床について沈む(F3)→宙で体を後ろへ倒し、手前の脚をまっすぐ前へ伸ばした飛び蹴り(F5-17)。奥の脚は畳む', note='旧 super（その場の四連蹴り）を、突撃の一発目に絞った。連続の突撃とサマーソルトは命中後のムービー側'))

# =====================================================================
# ハクマ（守勢・鉄壁 / 雪 / 掌）
# =====================================================================
def _palm(o=-0.10, f=0.95, u=0.06): return dict(space='world', pos=(o, f, u), fwd=(0, 0.25, 1.0), back=(0, -1.0, 0.25), elbow=(0.8, -0.2, -0.5))
def hakuma_s1(cid):
    """雪壁掌: 半身で前の掌を壁のように立てて受け、その内側から後ろの掌を踏み込みと一緒に重ねる。体は下がらない。"""
    n0 = neutral(cid); st, ac, N = 11, 6, 39
    wall = merge(n0, pelvis=pel(n0, (0, 0.04, -0.18), (2, -40, 0)), chest=add(n0['chest'], (-2, -20, 0)), neck=add(n0['neck'], (0, 26, 0)), head=add(n0['head'], (-4, 50, 0)),
                 handL=_palm(0.0, 0.80, 0.40), handR=P((0.30, -0.40, -0.20), fwd=(0, 0.5, 0.85), back=(0.9, 0, 0.3), elbow=(0.5, -0.85, 0)), footL=foot(n0, 'footL', (0.04, 0.20, 0), knee=0.5), footR=foot(n0, 'footR', (0.08, -0.10, 0), knee=0.5),
                 tail=(-8, 0), keys=K(n0, paw_open_L=1.0, paw_open_R=1.0, brow_angry=0.8))
    lift = merge(wall, footL=foot(n0, 'footL', (0.04, 0.30, 0.40), pitch=-20, knee=0.4), pelvis=pel(n0, (0, 0.0, -0.10), (-4, -44, 0)))
    press = merge(n0, pelvis=pel(n0, (0, 0.40, -0.34), (10, 30, 0)), spine=add(n0['spine'], (2, 6, 0)), chest=add(n0['chest'], (4, 16, 0)), neck=add(n0['neck'], (0, -18, 0)), head=add(n0['head'], (-8, -34, 0)),
                  handR=_palm(-0.14, 0.97, 0.10), handL=_palm(-0.02, 0.86, 0.36), footL=foot(n0, 'footL', (0.06, 0.66, 0), knee=0.7), footR=foot(n0, 'footR', (0.08, 0.0, 0), pitch=30), tail=(-20, 0), jaw=14.0, keys=K(n0, paw_open_L=1.0, paw_open_R=1.0, brow_angry=1.0))
    keys = [(0, n0), (5, wall, 'out3'), (8, lift, 'io'), (st, press, 'in3'), (st + ac, merge(press, pelvis=pel(n0, (0, 0.44, -0.36), (11, 32, 0))), 'lin'), (28, merge(press, pelvis=pel(n0, (0, 0.24, -0.16), (4, 10, 0)), jaw=2.0), 'out'), (N, n0, 'io')]
    return dict(frames=N, loop=False, fn=keyed(keys), info=minfo(cid, 's1', '雪壁掌', st, ac, N, attack_limb='pawR', fx_anchor='pawR',
                silhouette='半身になり前の掌を顔の高さに立てる(F5)→前足を上げ(F8)→踏み下ろしと同時に後ろの掌が前の掌の下へ重なる(F11)。二枚の掌が縦に並ぶ', note='旧 cmd_236（両手の押し出し。奥義と同形だった）を「受けてから押す」二段に替えた'))
def hakuma_s2(cid):
    """白峰対空: 跳ばない。腹を出してのけぞり、片手の開いた掌を斜め上へ突き上げる。反対の手は帯。"""
    n0 = neutral(cid); st, ac, N = 8, 7, 39
    load = merge(n0, pelvis=pel(n0, (0, 0.0, -0.36), (16, -30, 0)), chest=add(n0['chest'], (8, -16, 0)), head=add(n0['head'], (-20, 40, 0)), handR=P((0.30, -0.10, -0.50), fwd=(0, 0.6, 0.8), back=(0.9, 0, 0.3), elbow=(0.5, -0.85, 0)), handL=P((0.10, 0.20, -0.40)),
                 footL=foot(n0, 'footL', (0.08, 0.10, 0), knee=0.7), footR=foot(n0, 'footR', (0.10, 0, 0), knee=0.7), tail=(30, 0), keys=K(n0, paw_open_R=1.0, brow_angry=1.0))
    slap = merge(n0, pelvis=pel(n0, (0, 0.24, 0.16), (-22, 34, 0)), spine=add(n0['spine'], (-10, 6, 0)), chest=add(n0['chest'], (-12, 18, 0)), neck=add(n0['neck'], (-10, -16, 0)), head=add(n0['head'], (-22, -30, 0)),
                 handR=W((-0.10, 0.62, 0.78), fwd=(0, -0.3, 0.95), back=(0, -0.95, -0.3), elbow=(0.8, 0.1, -0.5)), handL=P((0.10, 0.15, -0.45), fwd=(-0.5, 0.5, -0.5), back=(0.8, 0.5, 0)),
                 footL=foot(n0, 'footL', (0.08, 0.30, 0), pitch=24), footR=foot(n0, 'footR', (0.10, 0, 0), pitch=34), tail=(-30, 0), jaw=16.0, keys=K(n0, paw_open_R=1.0, brow_angry=1.0))
    keys = [(0, n0), (4, load, 'out'), (5, load, 'lin'), (st, slap, 'in3'), (st + ac, merge(slap, pelvis=pel(n0, (0, 0.26, 0.20), (-24, 36, 0))), 'lin'), (27, merge(n0, pelvis=pel(n0, (0, 0.12, -0.10), (4, 10, 0)), handR=P((0.5, 0.3, 0.3))), 'out'), (N, n0, 'io')]
    return dict(frames=N, loop=False, fn=keyed(keys), info=minfo(cid, 's2', '白峰対空', st, ac, N, attack_limb='pawR', fx_anchor='pawR', anti_air=True, grounded=True,
                silhouette='沈んで掌を腰に引く(F4)→腹を突き出してのけぞり、片手の開いた掌を斜め上へ(F8-15)。足は地面のまま', note='旧 cmd_623 の強化。ゴダンの岩砕き（両拳・真上）と分けるため、片手・開いた掌・斜め上・のけぞり'))
def hakuma_s3(cid):
    """連続突っ張り: 一発ごとに一歩。肩ごと掌を出し、左・右・左、最後は両手。"""
    n0 = neutral(cid); st, ac, N = 12, 9, 46
    def thr(lead, d, both=False):
        sg = 1 if lead == 'L' else -1; o = 'R' if lead == 'L' else 'L'
        return merge(n0, pelvis=pel(n0, (0.04 * sg, 0.10 + d, -0.22), (10, -30 * sg * (0 if both else 1), 0)), chest=add(n0['chest'], (6, -22 * sg * (0 if both else 1), 0)), head=add(n0['head'], (-8, 30 * sg * (0 if both else 1), 0)),
                     footL=foot(n0, 'footL', (0.06, d + (0.16 if lead == 'L' else 0), 0), knee=0.6), footR=foot(n0, 'footR', (0.08, d * 0.6 + (0.30 if lead == 'R' else 0), 0), pitch=0 if lead == 'R' else 20, knee=0.6), tail=(-10, 10 * sg), jaw=12.0 if both else 6.0,
                     keys=K(n0, paw_open_L=1.0, paw_open_R=1.0, brow_angry=1.0), **{'hand' + lead: _palm(-0.14, 0.97, 0.10), 'hand' + o: _palm(-0.2, 0.96, 0.04) if both else P((0.30, -0.40, -0.10), fwd=(0, 0.5, 0.85), back=(0.9, 0, 0.3), elbow=(0.5, -0.85, 0))})
    keys = [(0, n0), (4, thr('L', 0.0), 'in'), (6, thr('L', 0.0), 'lin'), (8, thr('R', 0.10), 'io'), (10, thr('R', 0.10), 'lin'), (st, thr('L', 0.22), 'io'), (st + 3, thr('L', 0.22), 'lin'), (st + 5, thr('R', 0.34), 'io'), (st + 7, thr('R', 0.34), 'lin'),
            (st + ac, thr('L', 0.48, True), 'io'), (st + ac + 5, thr('L', 0.50, True), 'lin'), (36, merge(n0, pelvis=pel(n0, (0, 0.30, -0.10), (4, 0, 0))), 'out'), (N, n0, 'io')]
    return dict(frames=N, loop=False, fn=keyed(keys), info=minfo(cid, 's3', '連続突っ張り', st, ac, N, attack_limb='pawL+pawR', fx_anchor='pawR', travel_frames=[0, st + ac],
                silhouette='左(F4)・右(F8)・左(F12)・右(F17)と肩ごと掌が出て、そのたび足が一歩進む→最後に両手(F21)', note='旧 sp_harite の強化。手だけでなく肩と足が一緒に出る'))
def hakuma_ult(cid):
    """白峰不動掌（対戦中の始動）: 掌を体の横へ大きく引き、横殴りの張り手。当たればムービーへ。"""
    n0 = neutral(cid); st, ac, N = 11, 10, 55
    back_ = merge(n0, pelvis=pel(n0, (0, -0.08, -0.20), (0, -56, 0)), chest=add(n0['chest'], (-4, -30, 0)), neck=add(n0['neck'], (0, 34, 0)), head=add(n0['head'], (0, 70, 0)),
                  handR=P((0.75, -0.50, 0.30), fwd=(0.6, -0.3, 0.7), back=(0.3, -0.9, 0), elbow=(0.8, -0.5, 0)), handL=_palm(0.0, 0.70, 0.20), footL=foot(n0, 'footL', (0.06, 0.16, 0), knee=0.5), tail=(10, 30), keys=K(n0, paw_open_L=1.0, paw_open_R=1.0, brow_angry=1.0))
    slap = merge(n0, pelvis=pel(n0, (0, 0.44, -0.30), (8, 50, 0)), chest=add(n0['chest'], (2, 26, 0)), neck=add(n0['neck'], (0, -30, 0)), head=add(n0['head'], (-6, -50, 0)),
                 handR=W((-0.30, 0.92, 0.22), fwd=(-0.5, 0.4, 0.75), back=(0.5, -0.85, 0), elbow=(0.8, -0.3, -0.4)), handL=P((0.30, -0.40, -0.20)), footL=foot(n0, 'footL', (0.06, 0.70, 0), knee=0.7), footR=foot(n0, 'footR', (0.08, 0, 0), pitch=30),
                 tail=(-10, -30), jaw=16.0, keys=K(n0, paw_open_L=1.0, paw_open_R=1.0, brow_angry=1.0))
    keys = [(0, n0), (7, back_, 'out3'), (8, back_, 'lin'), (st, slap, 'in3'), (st + ac, merge(slap, pelvis=pel(n0, (0, 0.48, -0.32), (8, 54, 0))), 'lin'), (36, merge(slap, pelvis=pel(n0, (0, 0.26, -0.16), (4, 20, 0)), jaw=2.0), 'out'), (N, n0, 'io')]
    return dict(frames=N, loop=False, fn=keyed(keys), info=minfo(cid, 'ultimate', '白峰不動掌', st, ac, N, attack_limb='pawR', fx_anchor='pawR', movie_on_hit='manifest/hakuma_ultimate.json',
                silhouette='掌を体の真横・後ろまで引く(F7)→踏み込んで顔の高さを横から張る(F11-21)', note='旧 super（押し出し。s1 と同形）を横殴りの張り手に替えた'))

# =====================================================================
# タキマル（投げ・接近 / 組み）
# =====================================================================
def takimaru_s1(cid):
    """大地走り: 小さく跳んで両腕を頭上に振りかぶり、着地と同時に両拳を床へ。予備動作が大きい現行の良さは残す。"""
    n0 = neutral(cid); st, ac, N = 20, 1, 51
    up = lambda h: P((0.20, 0.0, h), fwd=(0, -0.1, 1.0), back=(0.3, -0.9, 0.2), elbow=(0.9, -0.2, 0.1))
    crouch = merge(n0, pelvis=pel(n0, (0, 0, -0.30), (14, 0, 0)), handL=P((0.4, 0.2, -0.4)), handR=P((0.4, 0.2, -0.4)), tail=(-10, 0), keys=K(n0, brow_angry=1.0))
    hop = merge(n0, pelvis=pel(n0, (0, 0.06, 0.50), (-18, 0, 0)), chest=add(n0['chest'], (-14, 0, 0)), head=add(n0['head'], (6, 16, 0)), handL=up(0.98), handR=up(0.98), footL=foot(n0, 'footL', (0.06, 0.0, 0.42), pitch=30), footR=foot(n0, 'footR', (0.08, -0.10, 0.36), pitch=40), tail=(-26, 0), jaw=14.0, keys=K(n0, brow_angry=1.0))
    slam = merge(n0, pelvis=pel(n0, (0, 0.30, -0.60), (38, 0, 0)), spine=add(n0['spine'], (10, 0, 0)), chest=add(n0['chest'], (10, 0, 0)), neck=add(n0['neck'], (-14, 0, 0)), head=add(n0['head'], (-28, 16, 0)),
                 handL=R_((-0.20, 1.50, 0.08), fwd=(0, 0.3, -0.95), back=(0, 0.95, 0.3), elbow=(0.9, -0.2, 0.4)), handR=R_((-0.15, 1.50, 0.08), fwd=(0, 0.3, -0.95), back=(0, 0.95, 0.3), elbow=(0.9, -0.2, 0.4)),
                 footL=foot(n0, 'footL', (0.10, 0.30, 0), knee=0.8), footR=foot(n0, 'footR', (0.12, 0.10, 0), knee=0.8), tail=(40, 0), jaw=18.0, keys=K(n0, brow_angry=1.0))
    keys = [(0, n0), (6, crouch, 'out'), (12, hop, 'out'), (16, merge(hop, pelvis=pel(n0, (0, 0.10, 0.56), (-22, 0, 0))), 'lin'), (st, slam, 'in3'), (st + 8, slam, 'lin'), (38, merge(slam, pelvis=pel(n0, (0, 0.2, -0.3), (16, 0, 0))), 'out'), (N, n0, 'io')]
    return dict(frames=N, loop=False, fn=keyed(keys), info=minfo(cid, 's1', '大地走り', st, ac, N, attack_limb='pawL+pawR', fx_anchor='pawR', projectile_spawn_frame=st, visual_airborne_frames=[9, 19],
                silhouette='沈む(F6)→小さく跳んで両腕を頭上へ(F12-16)→着地と同時に両拳を床へ叩きつける(F20)', note='区分は維持。現行 cmd_236 の「腕を上げてから床を打つ」を、跳躍と両拳で一段大きくした'))
def takimaru_s2(cid):
    """抱え上げ: 低く潜って両腕ですくい、のけぞって頭上で止める。"""
    n0 = neutral(cid); st, ac, N = 10, 7, 44
    scoop = merge(n0, pelvis=pel(n0, (0, 0.20, -0.56), (36, 0, 0)), chest=add(n0['chest'], (8, 0, 0)), neck=add(n0['neck'], (-16, 0, 0)), head=add(n0['head'], (-30, 16, 0)),
                  handL=W((-0.10, 0.80, -0.60), fwd=(0, 0.9, 0.3), back=(0, 0.3, -0.95), elbow=(0.9, -0.2, -0.2)), handR=W((-0.10, 0.80, -0.60), fwd=(0, 0.9, 0.3), back=(0, 0.3, -0.95), elbow=(0.9, -0.2, -0.2)),
                  footL=foot(n0, 'footL', (0.10, 0.40, 0), knee=0.8), footR=foot(n0, 'footR', (0.12, 0.0, 0), knee=0.8), tail=(40, 0), keys=K(n0, paw_open_L=1.0, paw_open_R=1.0, brow_angry=1.0))
    lift = merge(n0, pelvis=pel(n0, (0, 0.20, 0.14), (-30, 0, 0)), spine=add(n0['spine'], (-12, 0, 0)), chest=add(n0['chest'], (-14, 0, 0)), head=add(n0['head'], (-10, 16, 0)),
                 handL=P((0.12, 0.20, 0.96), fwd=(0, 0.4, 0.9), back=(0, 0.9, -0.4), elbow=(0.95, 0, 0)), handR=P((0.12, 0.20, 0.96), fwd=(0, 0.4, 0.9), back=(0, 0.9, -0.4), elbow=(0.95, 0, 0)),
                 footL=foot(n0, 'footL', (0.10, 0.40, 0), pitch=20), footR=foot(n0, 'footR', (0.12, 0.0, 0), pitch=30), tail=(-36, 0), jaw=20.0, keys=K(n0, paw_open_L=1.0, paw_open_R=1.0, brow_angry=1.0))
    keys = [(0, n0), (6, scoop, 'out'), (7, scoop, 'lin'), (st, lift, 'in3'), (st + ac + 4, merge(lift, pelvis=pel(n0, (0, 0.20, 0.18), (-34, 0, 0))), 'lin'), (32, merge(n0, pelvis=pel(n0, (0, 0.14, -0.10), (4, 0, 0)), handL=P((0.6, 0.3, 0.2)), handR=P((0.6, 0.3, 0.2))), 'out'), (N, n0, 'io')]
    return dict(frames=N, loop=False, fn=keyed(keys), info=minfo(cid, 's2', '抱え上げ', st, ac, N, attack_limb='pawL+pawR', fx_anchor='pawR', anti_air=True, grounded=True,
                silhouette='深く潜って両手が膝の下(F6)→のけぞりながら両腕で頭上へすくい上げ、止める(F10-21)', note='旧 cmd_623 の強化。頭上で止める時間を伸ばした'))
def takimaru_s3(cid):
    """抱え込み（つかみにいく動き）: 両腕を左右いっぱいに広げて踏み込み、胸の前で閉じる。空振りならつんのめる。成立後は既存の throw_hit / thrown。"""
    n0 = neutral(cid); st, ac, N = 9, 3, 49
    wide = merge(n0, pelvis=pel(n0, (0, 0.10, -0.10), (-8, 0, 0)), chest=add(n0['chest'], (-10, 0, 0)), handL=P((0.95, 0.20, 0.30), fwd=(0.5, 0.8, 0.2), back=(0.8, -0.5, 0), elbow=(0.5, -0.6, -0.5)), handR=P((0.95, 0.20, 0.30), fwd=(0.5, 0.8, 0.2), back=(0.8, -0.5, 0), elbow=(0.5, -0.6, -0.5)),
                 footL=foot(n0, 'footL', (0.06, 0.20, 0.16), pitch=-10), tail=(-10, 0), jaw=14.0, keys=K(n0, paw_open_L=1.0, paw_open_R=1.0, brow_angry=1.0))
    clamp = merge(n0, pelvis=pel(n0, (0, 0.50, -0.26), (22, 0, 0)), chest=add(n0['chest'], (10, 0, 0)), head=add(n0['head'], (-16, 16, 0)), handL=W((-0.44, 0.80, 0.0), fwd=(-0.6, 0.8, 0), back=(0.7, 0.6, 0.3), elbow=(0.9, -0.1, -0.3)), handR=W((-0.44, 0.80, 0.0), fwd=(-0.6, 0.8, 0), back=(0.7, 0.6, 0.3), elbow=(0.9, -0.1, -0.3)),
                  footL=foot(n0, 'footL', (0.06, 0.70, 0), knee=0.6), footR=foot(n0, 'footR', (0.08, 0.10, 0), pitch=30), tail=(20, 0), jaw=8.0, keys=K(n0, paw_open_L=0.3, paw_open_R=0.3, brow_angry=1.0))
    trip = merge(n0, pelvis=pel(n0, (0, 0.60, -0.40), (40, 0, 0)), handL=R_((0.0, 1.6, 0.1)), handR=P((0.3, 0.4, -0.4)), footL=foot(n0, 'footL', (0.06, 0.76, 0), knee=0.6), footR=foot(n0, 'footR', (0.08, 0.30, 0), pitch=20), tail=(-30, 0), keys=K(n0, paw_open_L=1.0, brow_angry=0.4))
    keys = [(0, n0), (5, wide, 'out3'), (6, wide, 'lin'), (st, clamp, 'in3'), (st + ac, clamp, 'lin'), (24, trip, 'out'), (34, trip, 'lin'), (N, n0, 'io')]
    return dict(frames=N, loop=False, fn=keyed(keys), info=minfo(cid, 's3', '抱え込み', st, ac, N, attack_limb='pawL+pawR', fx_anchor='chest', on_hit_clips=['throw_hit', 'thrown'],
                silhouette='両腕を左右いっぱいに広げる(F5)→踏み込んで胸の前で閉じる(F9-12)→空振りなら片手を床についてつんのめる(F24)', note='区分は維持。つかんだ後の投げ（既存 throw_hit / thrown）は変えていない。つかみにいく動きと空振りだけを作り直した'))
def takimaru_ult(cid):
    """天地落とし（対戦中の始動）: 片手を高く上げて威嚇し、低く踏み込んで襟首をつかむ。成立すればムービーへ。"""
    n0 = neutral(cid); st, ac, N = 13, 8, 56
    loom = merge(n0, pelvis=pel(n0, (0, -0.06, 0.10), (-12, -20, 0)), chest=add(n0['chest'], (-10, -10, 0)), handR=P((0.30, 0.10, 0.98), fwd=(0, 0.3, 0.95), back=(0, -0.95, 0.3), elbow=(0.9, -0.2, 0)), handL=P((0.40, 0.30, -0.10)), footL=foot(n0, 'footL', (0.06, 0.10, 0.20), pitch=-10),
                 tail=(-20, 0), jaw=20.0, keys=K(n0, paw_open_L=1.0, paw_open_R=1.0, brow_angry=1.0))
    snatch = merge(n0, pelvis=pel(n0, (0, 0.56, -0.30), (24, 30, 0)), chest=add(n0['chest'], (8, 16, 0)), neck=add(n0['neck'], (-8, -16, 0)), head=add(n0['head'], (-16, -20, 0)),
                   handR=W((-0.16, 0.97, 0.12), fwd=(0, 0.9, -0.3), back=(0.3, 0.3, 0.9), elbow=(0.9, -0.3, 0.1)), handL=P((0.40, -0.30, -0.10)), footL=foot(n0, 'footL', (0.06, 0.80, 0), knee=0.6), footR=foot(n0, 'footR', (0.08, 0.0, 0), pitch=36),
                   tail=(20, 0), jaw=10.0, keys=K(n0, paw_open_R=0.2, paw_open_L=1.0, brow_angry=1.0))
    keys = [(0, n0), (7, loom, 'out3'), (9, loom, 'lin'), (st, snatch, 'in3'), (st + ac, merge(snatch, handR=W((-0.20, 0.80, 0.16), fwd=(0, 0.9, -0.3), back=(0.3, 0.3, 0.9), elbow=(0.9, -0.3, 0.1))), 'lin'), (36, merge(n0, pelvis=pel(n0, (0, 0.3, -0.16), (10, 0, 0))), 'out'), (N, n0, 'io')]
    return dict(frames=N, loop=False, fn=keyed(keys), info=minfo(cid, 'ultimate', '天地落とし', st, ac, N, attack_limb='pawR', fx_anchor='pawR', movie_on_hit='manifest/takimaru_ultimate.json',
                silhouette='片手を頭上に上げて伸び上がる(F7)→低く踏み込み、その手で襟首をつかむ(F13-21)', note='旧（s3 と同じ throw_hit を使っていた）を別の動きにした。ゲーム側が奥義成立時に throw_hit へ切り替える場合は、ムービーが優先される想定'))


# =====================================================================
# 奥義ムービー（約10秒）: 攻撃側 cin_<id>_atk と、9体ぶん焼く相手役 cinv_<id>
# =====================================================================
def _vx(cid):
    """相手役の追加ポーズ（第二弾用）"""
    v = V_(cid); n0 = v['n0']; d = v['d']
    v['side'] = merge(v['reel'], pelvis=pel(n0, (-0.16, -0.20, -0.06), (-8, 60, -22)), chest=add(n0['chest'], (-6, 30, -14)), head=add(n0['head'], (-10, 50, -24)), jaw=26.0)
    v['limp'] = merge(v['air'], pelvis=pel(n0, (0, 0, 0.20), (-48, 0, 0)), head=add(n0['head'], (-30, 0, 14)), handL=P((0.45, -0.30, -0.30)), handR=P((0.50, -0.35, -0.35)), jaw=14.0)
    v['bent'] = merge(v['curl'], pelvis=pel(n0, (0, 0, 0.25), (46, 0, 0)), head=add(n0['head'], (30, 0, 0)), handL=P((0.30, 0.60, -0.50)), handR=P((0.30, 0.55, -0.55)), jaw=26.0)
    v['star'] = merge(v['air'], pelvis=pel(n0, (0, 0, 0.20), (-20, 0, 0)), handL=P((0.90, 0.0, 0.40), fwd=(0.8, 0, 0.5), back=(0, -1, 0)), handR=P((0.90, 0.0, 0.40), fwd=(0.8, 0, 0.5), back=(0, -1, 0)))
    v['stag'] = merge(v['reel'], pelvis=pel(n0, (0, -0.14, -0.14), (12, 6, 0)), head=add(n0['head'], (10, 0, 6)), keys=K(n0, blink=0.5))
    # 押されて踏ん張る: 前のめりに体重を掛け、両足を後ろへ突っ張る
    v['brace'] = merge(n0, pelvis=pel(n0, (0, 0.10, -0.30), (30, 0, 0)), chest=add(n0['chest'], (10, 0, 0)), head=add(n0['head'], (-10, 0, 0)), handL=P((0.10, 0.60, 0.10), fwd=(0, 0.3, 0.95), back=(0, -0.95, 0.3)), handR=P((0.10, 0.56, 0.06), fwd=(0, 0.3, 0.95), back=(0, -0.95, 0.3)),
                       footL=foot(n0, 'footL', (0.06, -0.30, 0), pitch=30, knee=0.4), footR=foot(n0, 'footR', (0.08, -0.50, 0), pitch=40, knee=0.4), tail=(40, 0), jaw=14.0, keys=K(n0, blink=0.7, paw_open_L=1.0, paw_open_R=1.0))
    v['pushed'] = merge(v['brace'], pelvis=pel(n0, (0, -0.20, -0.20), (-16, 0, 0)), chest=add(n0['chest'], (-14, 0, 0)), head=add(n0['head'], (-24, 0, 0)), handL=P((0.60, 0.10, 0.40)), handR=P((0.60, 0.10, 0.40)), jaw=24.0, keys=K(n0, blink=1.0, paw_open_L=1.0, paw_open_R=1.0))
    # 仰向けで腕が頭の先へ流れる（振り回される・引きずられる）
    arm = lambda: dict(d['handL'], pos=(d['handL']['pos'][0] * 0.4, d['handL']['pos'][1] - 0.30, 0.06))
    v['flung'] = merge(d, handL=arm(), handR=arm(), head=(-14, 0, 0), jaw=24.0, keys=K(n0, blink=0.0, paw_open_L=1.0, paw_open_R=1.0))
    v['groan'] = merge(d, head=(26, 0, 14), jaw=12.0, keys=K(n0, blink=1.0, paw_open_L=1.0, paw_open_R=1.0))
    return v

# ---------------- ピスケ「音速連咆」 10.0s: 多方向の蹴り突撃 → サマーソルト ----------------
PISUKE_SHOTS = [0, T(0.9), T(1.8), T(2.6), T(3.4), T(4.6), T(5.6), T(7.4), T(8.6), T(10.0)]
def cin_pisuke_atk(cid):
    n0 = neutral(cid); N = T(10.0); fly = plain(pisuke_ult(cid)['fn'](12))
    sprint = merge(n0, pelvis=pel(n0, (0, 0.10, -0.44), (44, 0, 0)), chest=add(n0['chest'], (6, 0, 0)), neck=add(n0['neck'], (-20, 0, 0)), head=add(n0['head'], (-30, 30, 0)), handL=R_((0.0, 1.30, 0.06)), handR=R_((0.05, 1.20, 0.06)),
                   footL=foot(n0, 'footL', (0.04, 0.10, 0), pitch=30), footR=foot(n0, 'footR', (0.04, -0.60, 0), pitch=60), tail=(50, 0), jaw=2.0, keys=K(n0, paw_open_L=1.0, paw_open_R=1.0, brow_angry=1.0))
    howl = merge(sprint, pelvis=pel(n0, (0, 0.10, -0.36), (30, 0, 0)), neck=add(n0['neck'], (-30, 0, 0)), head=add(n0['head'], (-44, 30, 0)), jaw=26.0, tail=(64, 0))
    kickf = merge(_pk(cid, (-0.20, 1.45, 0.95), -20, (-0.04, 0.50, 0.30), (-38, 44, -12), 0.5), footL=foot(n0, 'footL', (0.05, 0.20, 0.50), pitch=50, knee=0.8), tail=(-10, 30), jaw=14.0)
    knee = merge(n0, pelvis=pel(n0, (0, 0.40, 0.30), (-10, 30, 0)), chest=add(n0['chest'], (10, 10, 0)), head=add(n0['head'], (-10, -30, 0)), handL=P((0.4, 0.5, 0.3)), handR=P((0.5, -0.4, 0.2)),
                 footL=foot(n0, 'footL', (0.05, -0.50, 0.40), pitch=60), footR=KF((-0.10, 0.90, 0.95), -20, 60, 0.9), tail=(-20, 0), jaw=14.0, keys=K(n0, brow_angry=1.0))
    slide = merge(n0, pelvis=pel(n0, (0, 0.30, -0.66), (-50, 30, 0)), chest=add(n0['chest'], (20, 0, 0)), head=add(n0['head'], (30, -30, 0)), handL=R_((0.30, -0.70, 0.08), fwd=(0, -1, 0)), handR=P((0.5, -0.2, 0.3)),
                  footL=foot(n0, 'footL', (0.06, 0.60, 0.10), pitch=20, knee=0.8), footR=KF((-0.10, 1.50, 0.06), -20, -30), tail=(-30, 0), jaw=10.0, keys=K(n0, brow_angry=1.0))
    skid = merge(n0, pelvis=pel(n0, (0, -0.10, -0.40), (10, -30, 0)), handL=R_((0.10, 0.90, 0.06)), handR=P((0.5, -0.3, 0.3)), footL=foot(n0, 'footL', (0.04, 0.50, 0), pitch=-10), footR=foot(n0, 'footR', (0.06, -0.40, 0), pitch=40), tail=(40, 20), keys=K(n0, paw_open_L=1.0, brow_angry=1.0))
    lookup = merge(skid, neck=add(n0['neck'], (-26, 0, 0)), head=add(n0['head'], (-50, 30, 0)), jaw=2.0)
    coil = merge(n0, pelvis=pel(n0, (0, 0.0, -0.56), (26, 0, 0)), neck=add(n0['neck'], (-26, 0, 0)), head=add(n0['head'], (-46, 30, 0)), handL=P((0.4, -0.2, -0.4)), handR=P((0.4, -0.2, -0.4)), footL=foot(n0, 'footL', (0.06, 0.10, 0), knee=0.7), footR=foot(n0, 'footR', (0.06, 0.0, 0), knee=0.7), tail=(50, 0), keys=K(n0, brow_angry=1.0))
    flash = merge(n0, pelvis=pel(n0, (0, 0.10, 0.30), (-30, 30, 0)), spine=add(n0['spine'], (-12, 0, 0)), chest=add(n0['chest'], (-16, 0, 0)), head=add(n0['head'], (-20, -30, 0)), handL=P((0.70, -0.30, 0.30)), handR=P((0.75, -0.40, 0.10)),
                  footL=foot(n0, 'footL', (0.05, -0.20, 0.20), pitch=60, knee=0.5), footR=KF((-0.14, 1.10, 1.90), -15, -60), tail=(-40, 0), jaw=18.0, keys=K(n0, paw_open_L=1.0, paw_open_R=1.0, brow_angry=1.0))
    tuck = merge(n0, pelvis=pel(n0, (0, 0, 0.30), (30, 0, 0)), chest=add(n0['chest'], (16, 0, 0)), handL=P((0.2, 0.5, -0.3)), handR=P((0.2, 0.5, -0.3)), footL=foot(n0, 'footL', (0.08, 0.40, 0.70), pitch=20, knee=0.6), footR=foot(n0, 'footR', (0.08, 0.30, 0.62), pitch=30, knee=0.6), tail=(-30, 0), keys=K(n0, brow_angry=0.8))
    light = merge(n0, pelvis=pel(n0, (0, 0.0, -0.16), (6, -40, 0)), handL=P((0.7, 0.1, 0.3)), handR=P((0.7, 0.0, 0.3)), footL=foot(n0, 'footL', (0.0, 0.0, 0), pitch=20), footR=foot(n0, 'footR', (0.0, 0.2, 0.40), pitch=30, knee=0.5), tail=(30, 0), keys=K(n0, paw_open_L=1.0, paw_open_R=1.0, brow_angry=0.4))
    pose = lambda b: merge(n0, pelvis=pel(n0, (0, 0.0, 0.04 + b), (-6, -40, 0)), chest=add(n0['chest'], (-6, -14, 0)), neck=add(n0['neck'], (0, 10, 0)), head=add(n0['head'], (-4, 20, 8)), handL=P((0.10, 0.50, 0.20)), handR=P((0.20, 0.40, 0.40), fwd=(0, 0.2, 1.0), back=(1, 0, 0)),
                           footL=foot(n0, 'footL', (0.0, 0.0, b * 0.5), pitch=10), footR=KF((0.05, 0.50, 0.90), -10, 50, 0.9), tail=(40, 20 if b else -20), jaw=6.0, keys=K(n0, brow_angry=0.2))
    k = [(0, fly), (T(.20), fly, 'lin'), (T(.36), sprint, 'in'), (T(.62), sprint, 'lin'), (T(.72), howl, 'out3'), (T(.86), howl, 'lin'), (T(.96), kickf, 'in3'), (T(1.38), kickf, 'lin'), (T(1.50), skid, 'out'), (T(1.76), skid, 'lin'),
         (T(1.86), kickf, 'in3'), (T(2.36), kickf, 'lin'), (T(2.46), skid, 'out'), (T(2.60), skid, 'lin'), (T(2.70), slide, 'in3'), (T(3.24), slide, 'lin'), (T(3.36), skid, 'out'), (T(3.46), knee, 'in3'), (T(3.76), knee, 'lin'),
         (T(3.82), kickf, 'io'), (T(4.04), kickf, 'lin'), (T(4.12), knee, 'io'), (T(4.36), knee, 'lin'), (T(4.56), skid, 'out'), (T(4.80), lookup, 'io'), (T(5.50), lookup, 'lin'), (T(5.80), coil, 'io'), (T(5.90), coil, 'lin')]
    hold(k, 6.00, 6.60, flash, 'in3')
    k += [(T(6.90), tuck, 'io'), (T(7.30), tuck, 'lin'), (T(7.50), light, 'in'), (T(7.90), light, 'lin'), (T(8.60), merge(n0, pelvis=pel(n0, (0, 0, 0), (0, -30, 0))), 'io'), (T(9.00), pose(0.0), 'io'), (T(9.20), pose(0.10), 'out'), (T(9.40), pose(0.0), 'in'), (T(9.60), pose(0.08), 'out'), (T(9.80), pose(0.0), 'in'), (N, pose(0.0), 'lin')]
    return dict(frames=N, loop=False, fn=keyed(k), info=cinfo14('attacker', 'pisuke_ultimate', N, PISUKE_SHOTS, name_jp='音速連咆・命中後（10秒版）',
                beats=dict(howl=T(.72), charge1=T(1.20), charge2=T(2.15), charge3_slide=T(2.95), charge4=T(3.60), charge5=T(3.90), charge6=T(4.20), look_up=T(4.80), somersault_contact=T(6.00), somersault_hitstop=[T(6.00), T(6.60)], landing=T(7.50), pose=T(9.00)),
                note='着地して短く吠える→飛び蹴り・飛び蹴り・滑り込み・膝・飛び蹴り・膝の六回の突撃（向きは root）→止まって見上げる→後方宙返りの蹴り上げ（止め）→軽い着地、片ひざを上げた構えで弾む'))
def cinv_pisuke(cid):
    v = _vx(cid); n0 = v['n0']; d = v['d']; N = T(10.0)
    spinny = merge(v['reel'], handL=P((0.85, 0.0, 0.30), fwd=(0.8, 0, 0.5), back=(0, -1, 0)), handR=P((0.85, 0.0, 0.30), fwd=(0.8, 0, 0.5), back=(0, -1, 0)), head=add(n0['head'], (-10, 0, 20)), jaw=20.0)
    k = [(0, v['reel']), (T(.40), v['stag'], 'io'), (T(.80), merge(v['look'](0, 0, 0.6, 0.0, 14.0), pelvis=pel(n0, (0, -0.14, -0.08), (4, 0, 0))), 'io'), (T(1.16), v['G'], 'io')]
    hold(k, 1.20, 1.30, v['side'], 'in3')
    k += [(T(1.60), spinny, 'io'), (T(2.10), spinny, 'lin')]
    hold(k, 2.15, 2.25, v['arch'], 'in3')
    k += [(T(2.60), v['stag'], 'io'), (T(2.90), v['look'](-40, 0, 0.8, 0.0, 16.0), 'io')]
    hold(k, 2.95, 3.05, merge(v['air'], pelvis=pel(n0, (0, 0, 0.2), (-60, 0, 0))), 'in3')
    k += [(T(3.56), v['limp'], 'io')]
    hold(k, 3.60, 3.68, v['bent'], 'in3'); hold(k, 3.90, 3.98, v['arch'], 'in3'); hold(k, 4.20, 4.30, v['side'], 'in3')
    k += [(T(4.80), v['limp'], 'io'), (T(5.40), merge(v['limp'], pelvis=pel(n0, (0, 0, 0.2), (-30, 0, 0))), 'io'), (T(5.94), v['limp'], 'io')]
    hold(k, 6.00, 6.60, v['bent'], 'in3')
    k += [(T(6.90), v['star'], 'out'), (T(7.50), v['curl'], 'io'), (T(8.10), v['star'], 'io'), (T(8.44), v['limp'], 'io'), (T(8.50), d, 'in'), (T(8.64), v['dflop'], 'out'), (T(8.80), d, 'in'), (N, d, 'lin')]
    return dict(frames=N, loop=False, fn=keyed(k), **FALL, info=cinfo14('target', 'pisuke_ultimate', N, PISUKE_SHOTS, name_jp='音速連咆を受ける側（10秒版）',
                beats=dict(hit1=T(1.20), spin=T(1.60), hit2=T(2.15), swept=T(2.95), juggle=[T(3.60), T(3.90), T(4.20)], fall=T(4.80), somersault=T(6.00), ground=T(8.50)),
                note='横殴りでこまのように回る→背中を蹴られて弓なり→足を払われて宙に浮く→空中で三方向から弾かれる→力が抜けて落ちる→蹴り上げで折れ、真上へ→落ちて跳ねる'))

# ---------------- ハクマ「白峰不動掌」 10.2s: 雪山・張り手で押し出す → 逆方向へ背負い投げ ----------------
HAKUMA_SHOTS = [0, T(1.3), T(2.4), T(3.4), T(4.6), T(5.8), T(7.4), T(8.6), T(10.2)]
def cin_hakuma_atk(cid):
    n0 = neutral(cid); N = T(10.2); slap = plain(hakuma_ult(cid)['fn'](20)); s3 = hakuma_s3(cid)['fn']
    side = lambda: P((0.50, -0.10, -0.40), fwd=(0.3, 0.5, 0.8), back=(0.9, 0, 0.3), elbow=(0.6, -0.8, 0))
    fudo = merge(n0, pelvis=pel(n0, (0, 0.20, -0.22), (4, 0, 0)), chest=add(n0['chest'], (-2, 0, 0)), head=add(n0['head'], (-4, 12, 0)), handL=side(), handR=side(), footL=foot(n0, 'footL', (0.14, 0.30, 0), knee=0.6), footR=foot(n0, 'footR', (0.16, 0.10, 0), knee=0.6), tail=(0, 0), jaw=0.0, keys=K(n0, paw_open_L=1.0, paw_open_R=1.0, brow_angry=0.8))
    breath = merge(fudo, pelvis=pel(n0, (0, 0.20, -0.18), (0, 0, 0)), chest=add(n0['chest'], (-8, 0, 0)), jaw=6.0)
    def thr(lead, wind=False, both=False):
        sg = 1 if lead == 'L' else -1; o = 'R' if lead == 'L' else 'L'; w = -1 if wind else 1
        q = merge(n0, pelvis=pel(n0, (0.04 * sg, 0.20 + (0.34 if not wind else -0.04), -0.30), (12 if not wind else 0, (-34 * sg * w) * (0 if both else 1), 0)), chest=add(n0['chest'], (6 if not wind else -6, -24 * sg * w * (0 if both else 1), 0)), head=add(n0['head'], (-8, 30 * sg * w * (0 if both else 1), 0)),
                  footL=foot(n0, 'footL', (0.10, 0.30 + (0.36 if (lead == 'L' and not wind) else 0.1), 0), knee=0.6), footR=foot(n0, 'footR', (0.12, 0.10 + (0.36 if (lead == 'R' and not wind) else 0.0), 0), pitch=0 if lead == 'R' else 24, knee=0.6), tail=(-16 if not wind else 16, 10 * sg), jaw=16.0 if not wind else 4.0,
                  keys=K(n0, paw_open_L=1.0, paw_open_R=1.0, brow_angry=1.0))
        back_ = P((0.60, -0.50, 0.10), fwd=(0.3, 0.3, 0.9), back=(0.6, -0.8, 0), elbow=(0.6, -0.8, 0))
        if wind: q['hand' + lead] = back_ if not both else back_; q['hand' + o] = _palm(0.0, 0.70, 0.20) if not both else back_
        else: q['hand' + lead] = _palm(-0.14, 0.97, 0.12); q['hand' + o] = _palm(-0.20, 0.96, 0.06) if both else back_
        return q
    def step(lf, rf, sink): return merge(fudo, pelvis=pel(n0, (0, 0.20, sink), (8, 0, 0)), footL=foot(n0, 'footL', (0.14, lf[0], lf[1]), knee=0.6), footR=foot(n0, 'footR', (0.16, rf[0], rf[1]), knee=0.6))
    grip = lambda u: dict(space='chest', pos=(-0.20, 0.30, u), fwd=(-0.5, 0.3, 0.8), back=(0.3, 0.9, 0.2), elbow=(0.8, 0.2, -0.5))
    load = merge(n0, pelvis=pel(n0, (0, 0.10, -0.50), (30, 0, 0)), chest=add(n0['chest'], (12, 0, 0)), neck=add(n0['neck'], (-10, 0, 0)), head=add(n0['head'], (-10, 12, 0)), handL=grip(0.62), handR=grip(0.56), footL=foot(n0, 'footL', (0.14, 0.20, 0), knee=0.8), footR=foot(n0, 'footR', (0.16, 0.0, 0), knee=0.8),
                 tail=(30, 0), jaw=8.0, keys=K(n0, paw_open_L=0.2, paw_open_R=0.2, brow_angry=1.0))
    strain = merge(load, pelvis=pel(n0, (0, 0.10, -0.58), (36, 0, 0)), jaw=20.0)
    throw = merge(n0, pelvis=pel(n0, (0, 0.30, -0.30), (72, 0, 0)), spine=add(n0['spine'], (10, 0, 0)), chest=add(n0['chest'], (12, 0, 0)), neck=add(n0['neck'], (-30, 0, 0)), head=add(n0['head'], (-40, 12, 0)), handL=W((-0.20, 0.70, -0.70), fwd=(0, 0.5, -0.85), back=(0, 0.85, 0.5)), handR=W((-0.20, 0.70, -0.70), fwd=(0, 0.5, -0.85), back=(0, 0.85, 0.5)),
                  footL=foot(n0, 'footL', (0.14, 0.40, 0), knee=0.7), footR=foot(n0, 'footR', (0.16, 0.0, 0), pitch=30, knee=0.7), tail=(-50, 0), jaw=26.0, keys=K(n0, paw_open_L=1.0, paw_open_R=1.0, brow_angry=1.0))
    watch = merge(fudo, pelvis=pel(n0, (0, 0.20, -0.10), (6, 0, 0)), head=add(n0['head'], (-6, 12, 0)), jaw=2.0)
    scarf = merge(fudo, pelvis=pel(n0, (0, 0.20, -0.06), (-4, 0, 0)), handR=P((-0.20, 0.36, 0.42), fwd=(-0.6, 0.2, 0.7), back=(0.2, 0.9, 0.2), elbow=(0.8, -0.3, -0.5)), handL=side(), keys=K(n0, paw_open_L=1.0, paw_open_R=0.4, brow_angry=0.5))
    still = merge(fudo, pelvis=pel(n0, (0, 0.20, -0.10), (-4, 0, 0)), handL=P((-0.26, 0.42, -0.10), fwd=(-0.8, 0.2, 0.5), back=(0, 0.9, 0.3), elbow=(0.8, 0.0, -0.6)), handR=P((-0.26, 0.40, -0.16), fwd=(-0.8, 0.2, 0.5), back=(0, 0.9, 0.3), elbow=(0.8, 0.0, -0.6)), head=add(n0['head'], (0, 12, 0)),
                  keys=K(n0, paw_open_L=1.0, paw_open_R=1.0, brow_angry=0.4, blink=1.0))
    k = [(0, slap), (T(.30), slap, 'lin'), (T(.90), fudo, 'io'), (T(1.20), breath, 'io'), (T(1.40), fudo, 'io'), (T(1.62), thr('R', True), 'out')]
    hold(k, 1.70, 2.00, thr('R'), 'in3')
    k += [(T(2.40), fudo, 'io'), (T(2.72), thr('L', True), 'out')]
    hold(k, 2.80, 3.10, thr('L'), 'in3')
    k += [(T(3.40), fudo, 'io'), (T(3.72), thr('L', True, True), 'out')]
    hold(k, 3.80, 4.25, thr('L', False, True), 'in3')
    k += [(T(4.60), fudo, 'io'), (T(4.78), step((0.50, 0.14), (0.0, 0), -0.16), 'io'), (T(4.95), step((0.60, 0), (0.0, 0), -0.30), 'in'), (T(5.12), step((0.30, 0), (0.50, 0.14), -0.16), 'io'), (T(5.28), step((0.30, 0), (0.56, 0), -0.30), 'in'),
          (T(5.50), load, 'io'), (T(5.78), strain, 'lin'), (T(6.00), throw, 'in3'), (T(6.40), throw, 'lin'), (T(7.20), watch, 'io'), (T(8.60), watch, 'lin'), (T(9.10), scarf, 'io'), (T(9.40), scarf, 'lin'), (T(9.80), still, 'io'), (N, still, 'lin')]
    return dict(frames=N, loop=False, fn=keyed(k), info=cinfo14('attacker', 'hakuma_ultimate', N, HAKUMA_SHOTS, name_jp='白峰不動掌・命中後（10秒版）',
                beats=dict(stance=T(.90), harite1=T(1.70), harite2=T(2.80), harite3_both=T(3.80), hitstops=[[T(1.70), T(2.00)], [T(2.80), T(3.10)], [T(3.80), T(4.25)]], steps=[T(4.95), T(5.28)], turn_in=T(5.50), strain=[T(5.50), T(5.78)], throw=T(6.00), still=T(9.80)),
                note='足を開いて腰を落とす→右・左・両手の張り手（一発ごとに踏み込む）→二歩詰めて懐へ入り、相手を背負って力む→前へ深く折れて投げる（向きの反転は root）→襟巻きを直し、腹の前で両手を重ねて目を閉じる'))
def cinv_hakuma(cid):
    v = _vx(cid); n0 = v['n0']; d = v['d']; N = T(10.2)
    wob = lambda r: merge(v['stag'], pelvis=pel(n0, (0.08 * r, -0.14, -0.14), (10, 0, 8 * r)), head=add(n0['head'], (12, 0, 14 * r)), keys=K(n0, blink=0.7))
    draped = merge(v['curl'], pelvis=pel(n0, (0, 0.20, 0.25), (60, 0, 0)), handL=P((0.2, 0.9, 0.2)), handR=P((0.2, 0.9, 0.2)), jaw=22.0, keys=K(n0, blink=0.0, paw_open_L=1.0, paw_open_R=1.0))
    k = [(0, v['side']), (T(.30), v['pushed'], 'out'), (T(1.20), v['brace'], 'io'), (T(1.64), v['brace'], 'lin')]
    hold(k, 1.70, 2.00, v['pushed'], 'in3')
    k += [(T(2.50), v['brace'], 'io'), (T(2.74), v['brace'], 'lin')]
    hold(k, 2.80, 3.10, v['pushed'], 'in3')
    k += [(T(3.50), v['brace'], 'io'), (T(3.74), merge(v['brace'], keys=K(n0, blink=0.0, paw_open_L=1.0, paw_open_R=1.0)), 'lin')]
    hold(k, 3.80, 4.25, merge(v['pushed'], pelvis=pel(n0, (0, -0.30, -0.10), (-26, 0, 0))), 'in3')
    k += [(T(4.60), wob(1), 'io'), (T(4.95), wob(-1), 'io'), (T(5.30), wob(1), 'io'), (T(5.50), merge(v['fold'], pelvis=pel(n0, (0, 0.20, -0.10), (30, 0, 0)), keys=K(n0, blink=0.0)), 'io'), (T(5.78), merge(v['fold'], pelvis=pel(n0, (0, 0.26, 0.0), (40, 0, 0)), keys=K(n0, blink=0.0), jaw=22.0), 'lin'),
          (T(6.00), draped, 'in'), (T(6.30), v['star'], 'io'), (T(6.90), v['curl'], 'io'), (T(7.34), v['star'], 'io'), (T(7.40), d, 'in'), (T(7.54), v['dflop'], 'out'), (T(7.70), d, 'in'), (N, d, 'lin')]
    return dict(frames=N, loop=False, fn=keyed(k), **FALL, info=cinfo14('target', 'hakuma_ultimate', N, HAKUMA_SHOTS, name_jp='白峰不動掌を受ける側（10秒版）',
                beats=dict(brace=T(1.20), pushed=[T(1.70), T(2.80), T(3.80)], wobble=T(4.60), pulled_in=T(5.50), over_shoulder=T(6.00), snow_impact=T(7.40)),
                note='踏ん張る（前のめりで両足を後ろへ突っ張る）⇄ 張り手でのけぞる、を三回→ふらつく→懐へ引き込まれる→肩の上で折れる→反対方向へ飛ばされ、雪に落ちて跳ねる'))

# ---------------- タキマル「天地落とし」 10.4s: 前へ投げる → 見下ろして煽る → 拾い上げてジャイアントスイング ----------------
TAKIMARU_SHOTS = [0, T(1.4), T(2.6), T(3.3), T(4.0), T(5.0), T(5.8), T(6.6), T(7.4), T(8.6), T(10.4)]
def cin_takimaru_atk(cid):
    n0 = neutral(cid); N = T(10.4); snatch = plain(takimaru_ult(cid)['fn'](21))
    yank = merge(n0, pelvis=pel(n0, (0, 0.10, -0.20), (-10, -50, 0)), chest=add(n0['chest'], (-8, -30, 0)), head=add(n0['head'], (0, 60, 0)), handR=P((0.30, -0.50, 0.10), fwd=(0, -0.8, 0.3), back=(0.9, 0, 0.3)), handL=P((0.10, 0.60, 0.10)), footL=foot(n0, 'footL', (0.06, 0.30, 0), knee=0.6), tail=(20, 30), jaw=10.0, keys=K(n0, paw_open_R=0.2, brow_angry=1.0))
    hurl = merge(n0, pelvis=pel(n0, (0, 0.60, -0.20), (26, 40, 0)), chest=add(n0['chest'], (10, 24, 0)), neck=add(n0['neck'], (-10, -20, 0)), head=add(n0['head'], (-20, -40, 0)), handR=W((-0.10, 0.90, 0.40), fwd=(0, 0.8, 0.6), back=(0, 0.6, -0.8)), handL=P((0.50, -0.50, 0.20)),
                 footL=foot(n0, 'footL', (0.06, 0.90, 0), knee=0.6), footR=foot(n0, 'footR', (0.08, 0.0, 0), pitch=40), tail=(-30, -20), jaw=24.0, keys=K(n0, paw_open_L=1.0, paw_open_R=1.0, brow_angry=1.0))
    def sw(lead, sink):          # 肩を揺らして歩く
        sg = 1 if lead == 'L' else -1
        return merge(n0, pelvis=pel(n0, (0.06 * sg, 0.20, sink), (-4, 14 * sg, 6 * sg)), chest=add(n0['chest'], (-6, 16 * sg, 6 * sg)), head=add(n0['head'], (6, 16, 0)), handL=P((0.50, 0.30 * -sg, -0.30)), handR=P((0.50, 0.30 * sg, -0.30)),
                     footL=foot(n0, 'footL', (0.12, 0.50 if lead == 'L' else 0.0, 0), pitch=-10 if lead == 'L' else 20), footR=foot(n0, 'footR', (0.14, 0.50 if lead == 'R' else 0.0, 0), pitch=-10 if lead == 'R' else 20), tail=(10, 20 * sg), jaw=4.0, keys=K(n0, paw_open_L=0.3, paw_open_R=0.3, brow_angry=0.7))
    hips = lambda: P((0.36, -0.10, -0.36), fwd=(-0.5, 0.5, -0.5), back=(0.8, 0.5, 0), elbow=(0.5, -0.85, 0))
    loom = merge(n0, pelvis=pel(n0, (0, 0.30, -0.10), (34, 0, 0)), chest=add(n0['chest'], (12, 0, 0)), neck=add(n0['neck'], (10, 0, 0)), head=add(n0['head'], (24, 16, 8)), handL=hips(), handR=hips(), footL=foot(n0, 'footL', (0.16, 0.30, 0)), footR=foot(n0, 'footR', (0.18, 0.20, 0)), tail=(30, 0), jaw=12.0, keys=K(n0, brow_angry=0.3))
    beck = lambda c: merge(loom, handR=W((-0.10, 0.60, -0.30 + 0.25 * c), fwd=(0, -0.2 - 0.6 * c, 0.9), back=(0, -0.9, -0.3), elbow=(0.8, -0.3, -0.4)), head=add(n0['head'], (24, 16, -10)), jaw=16.0, keys=K(n0, paw_open_R=1.0 - 0.6 * c, brow_angry=0.2))
    grabf = merge(n0, pelvis=pel(n0, (0, 0.40, -0.60), (40, 0, 0)), chest=add(n0['chest'], (10, 0, 0)), head=add(n0['head'], (-20, 16, 0)), handL=R_((-0.05, 1.90, 0.20), fwd=(0, 1, 0), back=(0.9, 0, 0.3)), handR=R_((0.0, 1.90, 0.20), fwd=(0, 1, 0), back=(0.9, 0, 0.3)), footL=foot(n0, 'footL', (0.14, 0.40, 0), knee=0.8), footR=foot(n0, 'footR', (0.16, 0.10, 0), knee=0.8),
                  tail=(40, 0), jaw=6.0, keys=K(n0, paw_open_L=0.2, paw_open_R=0.2, brow_angry=1.0))
    def swing(lead, lean=-26):
        return merge(n0, pelvis=pel(n0, (0, 0.10, -0.24), (lean, 0, 0)), spine=add(n0['spine'], (-8, 0, 0)), chest=add(n0['chest'], (-10, 0, 0)), neck=add(n0['neck'], (-6, 0, 0)), head=add(n0['head'], (-10, 16, 0)),
                     handL=W((-0.22, 0.97, -0.10), fwd=(0, 1, 0), back=(0.9, 0, 0.3), elbow=(0.9, -0.1, -0.3)), handR=W((-0.22, 0.97, -0.10), fwd=(0, 1, 0), back=(0.9, 0, 0.3), elbow=(0.9, -0.1, -0.3)),
                     footL=foot(n0, 'footL', (0.26, 0.20, 0.16 if lead == 'L' else 0), knee=0.6), footR=foot(n0, 'footR', (0.28, 0.0, 0.16 if lead == 'R' else 0), knee=0.6), tail=(-40, 30), jaw=26.0, keys=K(n0, paw_open_L=0.2, paw_open_R=0.2, brow_angry=1.0))
    release = merge(swing('L', -10), handL=P((0.95, 0.20, 0.30), fwd=(0.5, 0.8, 0.2), back=(0.8, -0.5, 0)), handR=P((0.95, 0.20, 0.30), fwd=(0.5, 0.8, 0.2), back=(0.8, -0.5, 0)), keys=K(n0, paw_open_L=1.0, paw_open_R=1.0, brow_angry=1.0))
    dust = lambda a: merge(n0, pelvis=pel(n0, (0, 0.20, 0.0), (0, 0, 0)), handL=P((-0.20, 0.50, 0.10 + 0.12 * a), fwd=(-0.8, 0.3, 0.3), back=(0, 0.9, 0.3), elbow=(0.8, 0, -0.6)), handR=P((-0.20, 0.50, 0.10 - 0.12 * a), fwd=(-0.8, 0.3, 0.3), back=(0, 0.9, 0.3), elbow=(0.8, 0, -0.6)), jaw=4.0, keys=K(n0, paw_open_L=1.0, paw_open_R=1.0, brow_angry=0.4))
    flex = merge(n0, pelvis=pel(n0, (0, 0.20, 0.06), (-10, 0, 0)), chest=add(n0['chest'], (-12, 0, 0)), neck=add(n0['neck'], (-6, 0, 0)), head=add(n0['head'], (-12, 16, 6)), handL=hips(), handR=hips(), footL=foot(n0, 'footL', (0.16, 0.24, 0)), footR=foot(n0, 'footR', (0.18, 0.16, 0)), tail=(20, 0), jaw=14.0, keys=K(n0, brow_angry=0.3))
    k = [(0, snatch), (T(.20), snatch, 'lin'), (T(.50), yank, 'out3'), (T(.70), hurl, 'in3'), (T(1.10), hurl, 'lin'), (T(1.50), sw('L', -0.06), 'io'), (T(1.76), sw('R', -0.16), 'io'), (T(2.02), sw('L', -0.06), 'io'), (T(2.28), sw('R', -0.16), 'io'), (T(2.54), sw('L', -0.08), 'io'),
         (T(2.95), loom, 'io'), (T(3.30), loom, 'lin'), (T(3.46), beck(0), 'io'), (T(3.58), beck(1), 'io'), (T(3.70), beck(0), 'io'), (T(3.82), beck(1), 'io'), (T(3.96), beck(0), 'io'), (T(4.40), grabf, 'io'), (T(4.60), grabf, 'lin'), (T(5.00), swing('L', -14), 'io')]
    t = 5.0
    for i in range(1, 15): t = 5.0 + 2.4 * math.sqrt(i / 14.0); k.append((T(t), swing('LR'[i % 2], -18 - i * 0.8), 'io'))
    k += [(T(7.48), release, 'out3'), (T(7.80), release, 'lin'), (T(8.30), merge(n0, pelvis=pel(n0, (0, 0.2, -0.06), (4, 0, 0))), 'io'), (T(8.80), dust(1), 'io'), (T(8.96), dust(-1), 'io'), (T(9.12), dust(1), 'io'), (T(9.28), dust(-1), 'io'), (T(9.70), flex, 'io'), (N, flex, 'lin')]
    return dict(frames=N, loop=False, fn=keyed(k), info=cinfo14('attacker', 'takimaru_ultimate', N, TAKIMARU_SHOTS, name_jp='天地落とし・命中後（10秒版）',
                beats=dict(yank=T(.50), hurl_release=T(.70), swagger=[T(1.50), T(2.54)], loom=T(2.95), beckon=[T(3.58), T(3.82)], grab_ankles=T(4.40), swing=[T(5.00), T(7.40)], release=T(7.40), dust_hands=T(8.80), flex=T(9.70)),
                note='襟首を引き寄せて前へ放り投げる→肩を揺らして歩み寄る→腰に手を当てて覗き込み、指で「来い」と煽る→足首をつかむ→のけぞって振り回す（回転は root。足は交互に踏み替える）→放す→手をはたき、腰に手を当てて胸を張る'))
def cinv_takimaru(cid):
    v = _vx(cid); n0 = v['n0']; d = v['d']; N = T(10.4)
    crawl = lambda a: merge(d, head=(-20, 0, 10 * a), handL=dict(d['handL'], pos=(d['handL']['pos'][0] * 0.5, d['handL']['pos'][1] - 0.30 - 0.1 * a, 0.06)), jaw=16.0, keys=K(n0, blink=0.0, paw_open_L=1.0, paw_open_R=1.0))
    up = merge(d, head=(-34, 0, 0), jaw=22.0, keys=K(n0, blink=0.0, paw_open_L=1.0, paw_open_R=1.0))
    legs = merge(v['flung'], footL=dict(pos=(0.04, 0.80, 0.30), yaw=10, pitch=10, knee=0.1, toe=0, pivot='ankle'), footR=dict(pos=(0.06, 0.80, 0.30), yaw=10, pitch=10, knee=0.1, toe=0, pivot='ankle'))
    k = [(0, merge(v['fold'], pelvis=pel(n0, (0, 0.20, -0.10), (30, 0, 0)), keys=K(n0, blink=0.0))), (T(.50), merge(v['fold'], pelvis=pel(n0, (0, 0.30, 0.0), (40, 0, 0)), jaw=24.0), 'out'), (T(.74), v['star'], 'in3'), (T(1.14), v['curl'], 'io'), (T(1.20), d, 'in'), (T(1.34), v['dflop'], 'out'), (T(1.50), v['groan'], 'in'),
         (T(2.20), v['groan'], 'lin'), (T(2.60), up, 'io'), (T(3.30), up, 'lin'), (T(3.50), crawl(1), 'io'), (T(3.75), crawl(-1), 'io'), (T(4.00), crawl(1), 'io'), (T(4.40), merge(up, jaw=26.0), 'io'), (T(5.00), legs, 'io'), (T(7.40), legs, 'lin'),
         (T(7.60), v['star'], 'out'), (T(8.04), v['curl'], 'io'), (T(8.10), d, 'in'), (T(8.24), v['dflop'], 'out'), (T(8.40), d, 'in'), (N, d, 'lin')]
    return dict(frames=N, loop=False, fn=keyed(k), **FALL, info=cinfo14('target', 'takimaru_ultimate', N, TAKIMARU_SHOTS, name_jp='天地落としを受ける側（10秒版）',
                beats=dict(thrown=T(.74), ground=T(1.20), groan=T(1.50), look_up=T(2.60), crawl=T(3.50), ankles_grabbed=T(4.40), swung=[T(5.00), T(7.40)], released=T(7.40), crash=T(8.10)),
                note='つかまれて前へ放られ、地面で跳ねる→うめく→近づく相手を見上げる→這って逃げようとする→足首をつかまれ、仰向けのまま腕が頭の先へ流れて振り回される→放り出されて落ちる'))


# =====================================================================
# ヨミカゲ（反撃・見切り / 月）
# =====================================================================
def _blade(pos, fwd=(0, 1, 0), back=(1, 0, 0)): return dict(space='world', pos=pos, fwd=fwd, back=back, elbow=(0.8, -0.3, -0.4))        # 手刀
def yomikage_s1(cid):
    """残月の波: 体は横向きのまま動かさず、手刀を頭上から足元まで振り下ろして半月を描く。"""
    n0 = neutral(cid); st, ac, N = 13, 1, 37
    top = merge(n0, pelvis=pel(n0, (0, -0.04, 0.06), (-8, -30, 0)), chest=add(n0['chest'], (-8, -16, 0)), neck=add(n0['neck'], (0, 20, 0)), head=add(n0['head'], (0, 40, 0)),
                handR=P((0.10, -0.10, 1.00), fwd=(0, -0.2, 1.0), back=(1, 0, 0), elbow=(0.9, -0.2, 0.1)), handL=P((0.10, 0.40, -0.30)), tail=(10, 0), keys=K(n0, paw_open_R=1.0, brow_angry=0.4, blink=1.0))
    mid = merge(n0, pelvis=pel(n0, (0, 0.20, -0.12), (6, 10, 0)), chest=add(n0['chest'], (4, 6, 0)), handR=_blade((-0.10, 0.98, 0.10)), handL=P((0.20, -0.30, -0.30)), footL=foot(n0, 'footL', (0, 0.30, 0)), tail=(-10, 0), jaw=4.0, keys=K(n0, paw_open_R=1.0, brow_angry=0.8))
    low = merge(n0, pelvis=pel(n0, (0, 0.24, -0.30), (20, 30, 0)), chest=add(n0['chest'], (10, 16, 0)), neck=add(n0['neck'], (-6, -16, 0)), head=add(n0['head'], (-14, -30, 0)), handR=_blade((-0.10, 0.60, -0.80), (0, 0.4, -0.9)), handL=P((0.30, -0.40, -0.10)),
                footL=foot(n0, 'footL', (0, 0.34, 0)), footR=foot(n0, 'footR', (0, 0, 0), pitch=20), tail=(-20, 0), keys=K(n0, paw_open_R=1.0, brow_angry=0.8))
    keys = [(0, n0), (7, top, 'out3'), (10, top, 'lin'), (st, mid, 'in3'), (st + 3, low, 'out'), (24, low, 'lin'), (N, n0, 'io')]
    return dict(frames=N, loop=False, fn=keyed(keys), info=minfo(cid, 's1', '残月の波', st, ac, N, attack_limb='pawR', fx_anchor='pawR', projectile_spawn_frame=st,
                silhouette='目を閉じて手刀を真上に掲げる(F7-10)→振り下ろしの途中、腕が水平のとき波が出る(F13)→足元まで振り切って止まる(F16-24)', note='旧 cmd_236（腕を前へ出す）を、頭上から足元までの縦の半月に替えた'))
def yomikage_s2(cid):
    """昇り肘: 跳ばない。一歩入って反対の手で払い下げ、肘を真上へ突き上げる。"""
    n0 = neutral(cid); st, ac, N = 8, 7, 40
    parry = merge(n0, pelvis=pel(n0, (0, 0.10, -0.26), (10, -20, 0)), chest=add(n0['chest'], (6, -12, 0)), handL=W((0.05, 0.70, -0.20), fwd=(0, 0.6, -0.8), back=(0, 0.8, 0.6)), handR=P((0.20, -0.20, -0.40)), footL=foot(n0, 'footL', (0, 0.20, 0)), tail=(-10, 0), keys=K(n0, paw_open_L=1.0, brow_angry=0.8))
    elbow = merge(n0, pelvis=pel(n0, (0, 0.40, 0.14), (-14, 40, 0)), spine=add(n0['spine'], (-6, 8, 0)), chest=add(n0['chest'], (-10, 20, 0)), neck=add(n0['neck'], (-6, -20, 0)), head=add(n0['head'], (-16, -40, 0)),
                  handR=P((-0.20, 0.25, 0.42), fwd=(-0.4, -0.5, 0.8), back=(0.6, 0.8, 0), elbow=(0.1, 0.6, 0.8)), handL=W((0.05, 0.60, -0.50), fwd=(0, 0.6, -0.8), back=(0, 0.8, 0.6)),
                  footL=foot(n0, 'footL', (0, 0.56, 0), pitch=20), footR=foot(n0, 'footR', (0, 0.06, 0), pitch=40), tail=(-26, 0), jaw=8.0, keys=K(n0, paw_open_L=1.0, brow_angry=1.0))
    keys = [(0, n0), (4, parry, 'out'), (st, elbow, 'in3'), (st + ac, merge(elbow, pelvis=pel(n0, (0, 0.42, 0.18), (-16, 42, 0))), 'lin'), (28, merge(n0, pelvis=pel(n0, (0, 0.20, -0.06), (0, 10, 0))), 'out'), (N, n0, 'io')]
    return dict(frames=N, loop=False, fn=keyed(keys), info=minfo(cid, 's2', '昇り肘', st, ac, N, attack_limb='elbowR', fx_anchor='pawR', anti_air=True, grounded=True,
                silhouette='奥の手で払い下げる(F4)→一歩入り、手前の肘が頭より高く上がる。拳は耳の横(F8-15)。払った手は下に残る', note='旧 cmd_623（小さく跳ねる肘）を、踏み込みと払い手つきの地上技にした'))
def yomikage_s3(cid):
    """受け返し: 片手を下ろして目を閉じ、後ろ足に体重を乗せて待つ。受付のあいだ、その姿勢が見える。"""
    n0 = neutral(cid); st, ac, N = 7, 13, 51
    wait = lambda b: merge(n0, pelvis=pel(n0, (0, -0.22, -0.10 + 0.01 * b), (-8, -16, 0)), chest=add(n0['chest'], (-6, -8, 0)), neck=add(n0['neck'], (6, 0, 0)), head=add(n0['head'], (10, 10, 0)),
                           handL=W((0.0, 0.50, 0.30), fwd=(0, 0.1, 1.0), back=(0.1, 1.0, 0), elbow=(0.3, 0.2, -0.9)), handR=P((0.30, 0.0, -0.60), fwd=(0, 0.2, -1.0), back=(1, 0, 0), elbow=(0.6, -0.6, -0.4)),
                           footL=foot(n0, 'footL', (0, 0.10, 0), pitch=-14), footR=foot(n0, 'footR', (0.04, -0.20, 0), knee=0.5), tail=(-16, 0), keys=K(n0, paw_open_L=1.0, paw_open_R=1.0, brow_angry=0.0, blink=1.0))
    open_ = merge(wait(0), head=add(n0['head'], (0, 10, 0)), keys=K(n0, paw_open_L=1.0, paw_open_R=1.0, brow_angry=0.6, blink=0.0))
    keys = [(0, n0), (4, wait(0), 'out3'), (st, wait(1), 'lin'), (st + ac, wait(0), 'lin'), (st + ac + 5, open_, 'io'), (36, open_, 'lin'), (N, n0, 'io')]
    return dict(frames=N, loop=False, fn=keyed(keys), info=minfo(cid, 's3', '受け返し', st, ac, N, attack_limb='pawL', fx_anchor='pawL', counter_window_frames=[st, st + ac],
                silhouette='後ろ足に体重を移し、手前の手をだらりと下げて目を閉じる(F4-20)。奥の掌だけを顔の前に立てる→受付が終わると目を開ける',
                note='旧 sp_counter は構えがほとんど変わらず、空振り時に何も見えなかった。「無防備に見える待ち」を見せる。反撃が成立したときの動きはゲーム側の扱いに従う（未確認）'))
def yomikage_ult(cid):
    """後の先・月断（対戦中の始動）: 低く踏み込み、手刀を横一文字に払って相手の脇を抜ける構え。当たればムービーへ。"""
    n0 = neutral(cid); st, ac, N = 7, 10, 50
    draw = merge(n0, pelvis=pel(n0, (0, -0.06, -0.30), (14, 50, 0)), chest=add(n0['chest'], (6, 30, 0)), neck=add(n0['neck'], (0, -30, 0)), head=add(n0['head'], (-6, -60, 0)), handR=P((-0.50, 0.30, -0.10), fwd=(-0.9, 0.3, 0), back=(0, 0, 1), elbow=(0.5, 0.5, -0.6)), handL=P((0.20, 0.10, -0.40)),
                 tail=(20, -30), keys=K(n0, paw_open_R=1.0, brow_angry=1.0))
    cut = merge(n0, pelvis=pel(n0, (0, 0.60, -0.36), (16, -50, 0)), chest=add(n0['chest'], (6, -30, 0)), neck=add(n0['neck'], (0, 30, 0)), head=add(n0['head'], (-10, 50, 0)), handR=dict(space='world', pos=(0.50, 0.80, 0.02), fwd=(0.7, 0.7, 0), back=(0, 0, 1), elbow=(0.2, -0.8, -0.4)), handL=P((0.10, -0.40, -0.30)),
               footL=foot(n0, 'footL', (0, 0.90, 0), knee=0.6), footR=foot(n0, 'footR', (0, 0.0, 0), pitch=44), tail=(-20, 30), jaw=4.0, keys=K(n0, paw_open_R=1.0, brow_angry=1.0))
    keys = [(0, n0), (4, draw, 'out3'), (5, draw, 'lin'), (st, cut, 'in3'), (st + ac, cut, 'lin'), (32, merge(cut, pelvis=pel(n0, (0, 0.30, -0.16), (6, -20, 0))), 'out'), (N, n0, 'io')]
    return dict(frames=N, loop=False, fn=keyed(keys), info=minfo(cid, 'ultimate', '後の先・月断', st, ac, N, attack_limb='pawR', fx_anchor='pawR', movie_on_hit='manifest/yomikage_ultimate.json',
                silhouette='手刀を反対の腰に引く(F4)→低く深く踏み込み、横一文字に振り抜いて腕が体の外へ開く(F7-17)', note='旧 super（片手を上げる）を横の抜き打ちに替えた。二つの閃きは命中後のムービー側'))

# =====================================================================
# バレット（長射程・長尾）
# =====================================================================
def _tb(cid, up, side=0.0):
    nb = len(STYLE[cid]['tail_bones']); return tuple((up / nb, side / nb) for _ in range(nb))
TAILFX = dict(tail_stiff=3.0, tail_follow=0.65)
def bullet_s1(cid):
    """木の実弾: 尻尾を体の下へ深く巻き、背中越しに縦に弾く。現行の良さ（尻尾が主役）を残し、巻きを深く・振りを大きく。"""
    n0 = neutral(cid); st, ac, N = 17, 1, 46
    coil = merge(n0, pelvis=pel(n0, (0, -0.10, -0.26), (14, 0, 0)), chest=add(n0['chest'], (8, 0, 0)), head=add(n0['head'], (-10, 20, 0)), handL=P((0.2, 0.2, -0.3)), handR=P((0.2, 0.1, -0.3)), tail=(0, 0), tail_bones=_tb(cid, -70), keys=K(n0, brow_angry=0.9))
    snap = merge(n0, pelvis=pel(n0, (0, 0.20, -0.06), (30, 0, 0)), spine=add(n0['spine'], (8, 0, 0)), chest=add(n0['chest'], (8, 0, 0)), head=add(n0['head'], (-30, 20, 0)), handL=P((0.5, 0.1, -0.2)), handR=P((0.5, 0.0, -0.2)),
                 footL=foot(n0, 'footL', (0, 0.20, 0)), footR=foot(n0, 'footR', (0, 0.10, 0), pitch=20), tail=(0, 0), tail_bones=_tb(cid, 170), jaw=10.0, keys=K(n0, brow_angry=1.0))
    keys = [(0, n0), (10, coil, 'out'), (13, coil, 'lin'), (st, snap, 'in3'), (st + 7, snap, 'lin'), (34, merge(n0, pelvis=pel(n0, (0, 0.08, -0.10), (8, 0, 0))), 'io'), (N, n0, 'io')]
    return dict(frames=N, loop=False, fn=keyed(keys), **TAILFX, info=minfo(cid, 's1', '木の実弾', st, ac, N, attack_limb='tail', fx_anchor='tail', projectile_spawn_frame=st,
                silhouette='尻尾を体の下へ巻き込んで沈む(F10-13)→前へ折れながら尻尾が背中越しに頭の前まで弧を描く(F17)', note='区分は維持。現行 cmd_236 の巻きと振りを大きくした'))
def bullet_s2(cid):
    """尾跳ね: 小さく跳ねて尻尾を真上へ突き立て、先端が頭上で止まる。"""
    n0 = neutral(cid); st, ac, N = 9, 7, 43
    coil = merge(n0, pelvis=pel(n0, (0, -0.04, -0.24), (10, 0, 0)), handL=P((0.2, 0.2, -0.3)), handR=P((0.2, 0.1, -0.3)), tail=(0, 0), tail_bones=_tb(cid, -50), keys=K(n0, brow_angry=0.9))
    spike = merge(n0, pelvis=pel(n0, (0, 0.10, 0.50), (40, 0, 0)), spine=add(n0['spine'], (8, 0, 0)), chest=add(n0['chest'], (10, 0, 0)), head=add(n0['head'], (-40, 20, 0)), handL=P((0.5, 0.3, -0.2)), handR=P((0.5, 0.2, -0.2)),
                  footL=foot(n0, 'footL', (0, 0.0, 0.40), pitch=40), footR=foot(n0, 'footR', (0, -0.10, 0.44), pitch=50), tail=(0, 0), tail_bones=_tb(cid, 110), jaw=10.0, keys=K(n0, brow_angry=1.0))
    keys = [(0, n0), (5, coil, 'out'), (st, spike, 'in3'), (st + ac + 3, merge(spike, pelvis=pel(n0, (0, 0.10, 0.56), (42, 0, 0))), 'lin'), (30, merge(n0, pelvis=pel(n0, (0, 0.04, -0.18), (10, 0, 0))), 'in'), (N, n0, 'io')]
    return dict(frames=N, loop=False, fn=keyed(keys), **TAILFX, info=minfo(cid, 's2', '尾跳ね', st, ac, N, attack_limb='tail', fx_anchor='tail', anti_air=True, visual_airborne_frames=[7, 28],
                silhouette='沈む(F5)→前へ折れて小さく跳ね、尻尾が背中から真上へ立つ(F9-19)。先端は頭より高い', note='旧 cmd_623 の強化。頂点で止める時間を伸ばした'))
def bullet_ult(cid):
    """超圧縮・弾丸頭突き（対戦中の始動）: 体をひねって尻尾を横から叩きつける重い一打。当たればムービーへ。"""
    n0 = neutral(cid); st, ac, N = 12, 9, 55
    wind = merge(n0, pelvis=pel(n0, (0, -0.06, -0.14), (4, -60, 0)), chest=add(n0['chest'], (0, -20, 0)), neck=add(n0['neck'], (0, 40, 0)), head=add(n0['head'], (0, 80, 0)), handL=P((0.4, 0.3, 0.1)), handR=P((0.4, 0.0, 0.1)), tail=(10, 0), tail_bones=_tb(cid, 20, -90), keys=K(n0, brow_angry=1.0))
    lash = merge(n0, pelvis=pel(n0, (0, 0.30, -0.20), (10, 150, 0)), chest=add(n0['chest'], (4, 20, 0)), neck=add(n0['neck'], (0, -60, 0)), head=add(n0['head'], (-6, -110, 0)), handL=P((0.6, 0.1, 0.1)), handR=P((0.6, -0.1, 0.1)),
                footL=foot(n0, 'footL', (0.04, 0.30, 0), yaw=100), footR=foot(n0, 'footR', (0.06, 0.10, 0), yaw=-100, pitch=20), tail=(10, 0), tail_bones=_tb(cid, 10, 60), jaw=12.0, keys=K(n0, brow_angry=1.0))
    keys = [(0, n0), (7, wind, 'out3'), (8, wind, 'lin'), (st, lash, 'in3'), (st + ac, merge(lash, tail_bones=_tb(cid, 10, 90)), 'lin'), (38, merge(n0, pelvis=pel(n0, (0, 0.14, -0.10), (4, 40, 0))), 'io'), (N, n0, 'io')]
    return dict(frames=N, loop=False, fn=keyed(keys), **TAILFX, info=minfo(cid, 'ultimate', '超圧縮・弾丸頭突き', st, ac, N, attack_limb='tail', fx_anchor='tail', movie_on_hit='manifest/bullet_ultimate.json',
                silhouette='体を反対へひねって尻尾を後ろへ引く(F7)→半回転して背を向け、尻尾が横から前へ回り込む(F12-21)', note='旧 super（頭から飛ぶ）を、本人指定（尻尾主体）に合わせて尻尾の横打ちに替えた。技名「頭突き」と合わなくなるので改名を別途提案'))

# =====================================================================
# ダークモグゾー（高速連携・低耐久 / 闇）
# =====================================================================
def dark_s1(cid):
    """黒い地走波: 地面を打たない。逆手を足元から頭上まで引き裂くように振り上げ、体が弓なりに反る。"""
    n0 = neutral(cid); st, ac, N = 11, 1, 31
    dip = merge(n0, pelvis=pel(n0, (0, 0.06, -0.44), (30, 30, 0)), chest=add(n0['chest'], (10, 16, 0)), head=add(n0['head'], (-20, -30, 0)), handR=R_((0.10, 0.90, 0.08), fwd=(0, 0.5, -0.85), back=(0, -0.85, -0.5)), handL=P((0.3, -0.3, 0.1)), tail=(30, 0), keys=K(n0, paw_open_R=1.0, brow_angry=1.0))
    rip = merge(n0, pelvis=pel(n0, (0, 0.20, 0.14), (-26, -20, 0)), spine=add(n0['spine'], (-12, 0, 0)), chest=add(n0['chest'], (-16, -10, 0)), neck=add(n0['neck'], (10, 10, 0)), head=add(n0['head'], (14, 20, 0)),
               handR=P((0.10, 0.20, 1.00), fwd=(0, -0.3, 0.95), back=(0, -0.95, -0.3), elbow=(0.9, -0.2, 0.1)), handL=P((0.5, -0.5, -0.2)), footL=foot(n0, 'footL', (0, 0.30, 0), pitch=20), footR=foot(n0, 'footR', (0, 0, 0), pitch=34), tail=(-36, 0), jaw=18.0, keys=K(n0, paw_open_R=1.0, brow_angry=1.0))
    keys = [(0, n0), (6, dip, 'out3'), (8, dip, 'lin'), (st, rip, 'in3'), (st + 6, merge(rip, pelvis=pel(n0, (0, 0.20, 0.18), (-30, -20, 0))), 'lin'), (N, n0, 'io')]
    return dict(frames=N, loop=False, fn=keyed(keys), info=minfo(cid, 's1', '黒い地走波', st, ac, N, attack_limb='pawR', fx_anchor='pawR', projectile_spawn_frame=st,
                silhouette='低く沈んで開いた爪を足元へ(F6-8)→背を反らせ、爪を頭上まで一気に振り上げる(F11-17)', note='旧 cmd_236（片手を前へ）を置き換える。モグゾーの大地の波（前へ低くすくう）と逆に、上へ引き裂いて反る'))
def dark_s2(cid):
    """逆昇撃: 背を向けるまで体を巻き、振り向きざまに奥の拳を裏拳で突き上げる。"""
    n0 = neutral(cid); st, ac, N = 5, 8, 44
    turn = merge(n0, pelvis=pel(n0, (0, 0.04, -0.30), (14, 110, 0)), chest=add(n0['chest'], (6, 30, 0)), neck=add(n0['neck'], (0, -40, 0)), head=add(n0['head'], (-6, -90, 0)), handL=P((-0.30, 0.30, -0.30)), handR=P((0.3, 0.2, 0.0)), tail=(10, 40), keys=K(n0, brow_angry=1.0))
    upper = merge(n0, pelvis=pel(n0, (0, 0.24, 0.50), (-14, -40, 0)), chest=add(n0['chest'], (-12, -20, 0)), neck=add(n0['neck'], (-6, 20, 0)), head=add(n0['head'], (-14, 40, 0)), handL=W((0.10, 0.40, 0.92), fwd=(0, 0.15, 1.0), back=(-0.2, 1.0, 0.1), elbow=(0.7, 0.2, -0.6)), handR=P((0.4, -0.4, -0.3)),
                 footL=foot(n0, 'footL', (0, 0.20, 0.40), pitch=40), footR=foot(n0, 'footR', (0, 0.0, 0.46), pitch=50), tail=(-30, -30), jaw=16.0, keys=K(n0, brow_angry=1.0))
    keys = [(0, n0), (3, turn, 'out3'), (st, upper, 'in3'), (st + ac + 2, merge(upper, pelvis=pel(n0, (0, 0.26, 0.58), (-16, -40, 0))), 'lin'), (28, merge(n0, pelvis=pel(n0, (0, 0.10, -0.24), (12, 0, 0))), 'in'), (N, n0, 'io')]
    return dict(frames=N, loop=False, fn=keyed(keys), info=minfo(cid, 's2', '逆昇撃', st, ac, N, attack_limb='pawL', fx_anchor='pawL', anti_air=True, visual_airborne_frames=[4, 26],
                silhouette='背中が見えるまで巻く(F3)→逆回りに振り向きながら跳ね、奥の拳が頭上へ(F5-15)', note='旧 cmd_623（左のアッパー）に、背を向ける巻きと逆回りの振り向きを足した。モグゾーの昇り拳（右・左回り）と左右も回転も逆'))
def dark_s3(cid):
    """暗連: 低い突き→中段の逆突き→高い打ち下ろしの三発。一発ごとに体の高さが変わる。"""
    n0 = neutral(cid); st, ac, N = 7, 9, 40
    lowp = merge(n0, pelvis=pel(n0, (0, 0.30, -0.50), (30, -30, 0)), chest=add(n0['chest'], (10, -16, 0)), head=add(n0['head'], (-20, 30, 0)), handL=W((-0.10, 0.96, -0.40), fwd=(0, 1, 0), back=(0, 0, 1)), handR=P((0.3, -0.4, -0.2)), footL=foot(n0, 'footL', (0, 0.50, 0), knee=0.6), tail=(30, 0), jaw=8.0, keys=K(n0, brow_angry=1.0))
    midp = merge(n0, pelvis=pel(n0, (0, 0.50, -0.24), (10, 40, 0)), chest=add(n0['chest'], (4, 22, 0)), head=add(n0['head'], (-8, -40, 0)), handR=W((-0.14, 0.98, 0.04), fwd=(0, 1, 0), back=(0, 0, 1)), handL=P((0.3, -0.4, -0.2)), footL=foot(n0, 'footL', (0, 0.70, 0)), footR=foot(n0, 'footR', (0, 0.10, 0), pitch=30), tail=(-10, 0), jaw=10.0, keys=K(n0, brow_angry=1.0))
    highp = merge(n0, pelvis=pel(n0, (0, 0.70, 0.10), (20, -20, 0)), chest=add(n0['chest'], (12, -10, 0)), head=add(n0['head'], (-20, 20, 0)), handL=W((-0.10, 0.90, 0.30), fwd=(0, 0.6, -0.8), back=(0, 0.8, 0.6)), handR=P((0.5, -0.5, 0.3)), footL=foot(n0, 'footL', (0, 0.90, 0), pitch=20), footR=foot(n0, 'footR', (0, 0.30, 0), pitch=40),
                   tail=(-30, 0), jaw=16.0, keys=K(n0, brow_angry=1.0))
    keys = [(0, n0), (4, lowp, 'in3'), (st - 1, lowp, 'lin'), (st + 2, midp, 'io'), (st + 4, midp, 'lin'), (st + 7, highp, 'io'), (st + ac + 4, highp, 'lin'), (30, merge(n0, pelvis=pel(n0, (0, 0.40, -0.10), (6, 0, 0))), 'out'), (N, n0, 'io')]
    return dict(frames=N, loop=False, fn=keyed(keys), info=minfo(cid, 's3', '暗連', st, ac, N, attack_limb='pawL+pawR', fx_anchor='pawR', travel_frames=[0, st + ac], hits_visual=[4, st + 2, st + 7],
                silhouette='地面すれすれの低い突き(F4)→伸び上がって中段の逆突き(F9)→跳ね気味の打ち下ろし(F14)。低・中・高', note='旧 sp_dark_rush（踏み込みの突き一発）を三発に分けた。見た目の三発で、当たりは現行の一回のまま'))
def dark_ult(cid):
    """暗連・黒天烈掌（対戦中の始動）: 低く滑り込み、開いた爪で喉元をつかむ。当たればムービーへ。"""
    n0 = neutral(cid); st, ac, N = 5, 13, 50
    low = merge(n0, pelvis=pel(n0, (0, 0.10, -0.50), (30, 0, 0)), head=add(n0['head'], (-30, 24, 0)), handL=P((0.5, -0.3, -0.2)), handR=P((0.5, -0.4, -0.2)), tail=(40, 0), keys=K(n0, paw_open_L=1.0, paw_open_R=1.0, brow_angry=1.0))
    seize = merge(n0, pelvis=pel(n0, (0, 0.60, -0.34), (16, 30, 0)), chest=add(n0['chest'], (6, 16, 0)), neck=add(n0['neck'], (-6, -16, 0)), head=add(n0['head'], (-16, -30, 0)), handR=W((-0.14, 0.98, 0.20), fwd=(0, 0.6, 0.8), back=(0.8, 0, 0.6)), handL=P((0.5, -0.5, -0.1)),
                 footL=foot(n0, 'footL', (0, 0.90, 0), knee=0.6), footR=foot(n0, 'footR', (0, 0.10, 0), pitch=40), tail=(-10, 0), jaw=14.0, keys=K(n0, paw_open_R=0.6, paw_open_L=1.0, brow_angry=1.0))
    keys = [(0, n0), (3, low, 'out3'), (st, seize, 'in3'), (st + ac, seize, 'lin'), (32, merge(n0, pelvis=pel(n0, (0, 0.30, -0.16), (8, 0, 0))), 'out'), (N, n0, 'io')]
    return dict(frames=N, loop=False, fn=keyed(keys), info=minfo(cid, 'ultimate', '暗連・黒天烈掌', st, ac, N, attack_limb='pawR', fx_anchor='pawR', movie_on_hit='manifest/dark_moguzo_ultimate.json',
                silhouette='両腕を後ろへ流して低く沈む(F3)→滑り込み、開いた爪が喉の高さへ(F5-18)', note='旧 super（連打→アッパー）を、間合いへ入る一手に絞った。連打と重い一撃は命中後のムービー側'))

# ---------------- ヨミカゲ「後の先・月断」 10.0s: 闇夜で見失う → 背後の黒い一閃 → うずくまる相手に二閃目 ----------------
YOMIKAGE_SHOTS = [0, T(1.4), T(2.8), T(3.8), T(5.0), T(6.4), T(7.6), T(8.8), T(10.0)]
def cin_yomikage_atk(cid):
    n0 = neutral(cid); N = T(10.0); cut = plain(yomikage_ult(cid)['fn'](17))
    stand = merge(n0, pelvis=pel(n0, (0, 0.10, 0.04), (-4, 20, 0)), chest=add(n0['chest'], (-4, 10, 0)), head=add(n0['head'], (0, -20, 0)), handL=P((0.26, 0.05, -0.50), fwd=(0, 0.2, -1.0), back=(1, 0, 0)), handR=P((0.26, 0.0, -0.52), fwd=(0, 0.2, -1.0), back=(1, 0, 0)), footL=foot(n0, 'footL', (0.02, 0.10, 0)), footR=foot(n0, 'footR', (0.04, 0.0, 0)),
                  tail=(-10, 0), jaw=0.0, keys=K(n0, paw_open_L=1.0, paw_open_R=1.0, brow_angry=0.0, blink=1.0))
    eyes = merge(stand, keys=K(n0, paw_open_L=1.0, paw_open_R=1.0, brow_angry=0.9, blink=0.0))
    ready = merge(n0, pelvis=pel(n0, (0, 0.0, -0.34), (14, 50, 0)), chest=add(n0['chest'], (6, 30, 0)), neck=add(n0['neck'], (0, -30, 0)), head=add(n0['head'], (-6, -60, 0)), handR=P((-0.50, 0.30, -0.10), fwd=(-0.9, 0.3, 0), back=(0, 0, 1), elbow=(0.5, 0.5, -0.6)), handL=P((0.20, 0.10, -0.40)),
                  tail=(20, -30), keys=K(n0, paw_open_R=1.0, brow_angry=1.0))
    raise_ = merge(n0, pelvis=pel(n0, (0, 0.10, 0.08), (-10, -24, 0)), chest=add(n0['chest'], (-10, -14, 0)), neck=add(n0['neck'], (4, 16, 0)), head=add(n0['head'], (10, 30, 0)), handR=P((0.10, -0.10, 1.00), fwd=(0, -0.2, 1.0), back=(1, 0, 0), elbow=(0.9, -0.2, 0.1)), handL=P((0.26, 0.05, -0.50), fwd=(0, 0.2, -1.0), back=(1, 0, 0)),
                   footL=foot(n0, 'footL', (0.02, 0.20, 0)), tail=(10, 0), keys=K(n0, paw_open_L=1.0, paw_open_R=1.0, brow_angry=1.0))
    down = merge(n0, pelvis=pel(n0, (0, 0.30, -0.44), (30, 20, 0)), chest=add(n0['chest'], (12, 10, 0)), neck=add(n0['neck'], (-10, -10, 0)), head=add(n0['head'], (-20, -20, 0)), handR=_blade((-0.10, 0.62, -0.84), (0, 0.4, -0.9)), handL=P((0.30, -0.40, -0.10)),
                 footL=foot(n0, 'footL', (0.02, 0.50, 0), knee=0.6), footR=foot(n0, 'footR', (0.04, 0, 0), pitch=34), tail=(-24, 0), jaw=2.0, keys=K(n0, paw_open_L=1.0, paw_open_R=1.0, brow_angry=1.0))
    lower = merge(stand, handR=P((0.30, 0.20, -0.20), fwd=(0, 0.5, -0.85), back=(1, 0, 0)), keys=K(n0, paw_open_L=1.0, paw_open_R=1.0, brow_angry=0.2, blink=1.0))
    k = [(0, cut), (T(.30), cut, 'lin'), (T(1.10), stand, 'io'), (T(3.40), stand, 'lin'), (T(3.70), eyes, 'io'), (T(4.08), ready, 'io')]
    hold(k, 4.20, 4.55, cut, 'in3')
    k += [(T(5.20), stand, 'io'), (T(5.70), stand, 'lin'), (T(5.95), eyes, 'io'), (T(6.40), eyes, 'lin'), (T(6.80), raise_, 'io'), (T(6.94), raise_, 'lin')]
    hold(k, 7.00, 7.60, down, 'in3')
    k += [(T(8.60), down, 'lin'), (T(9.30), lower, 'io'), (N, stand, 'io')]
    return dict(frames=N, loop=False, fn=keyed(k), info=cinfo14('attacker', 'yomikage_ultimate', N, YOMIKAGE_SHOTS, name_jp='後の先・月断・命中後（10秒版）',
                beats=dict(vanish=T(1.10), appear_behind=T(3.00), eyes_open=T(3.70), slash1_contact=T(4.20), slash1_hitstop=[T(4.20), T(4.55)], eyes_again=T(5.95), raise_blade=T(6.80), slash2_contact=T(7.00), slash2_hitstop=[T(7.00), T(7.60)], lower=T(9.30)),
                note='振り抜いたまま闇に消える（表示は root の opacity）→相手の背後に目を閉じて立つ→目を開け、横一文字の一閃で相手の前へ抜ける→静かに立ち、目を開く→手刀を真上に掲げ、縦の一閃を足元まで→目を閉じ、手を下ろす'))
def cinv_yomikage(cid):
    v = _vx(cid); n0 = v['n0']; d = v['d']; L = v['look']; N = T(10.0)
    peer = lambda yaw: merge(L(yaw, 0, 0.5, 0.0, 8.0), pelvis=pel(n0, (0, -0.06, -0.14), (6, yaw * 0.3, 0)))
    crouch = merge(v['knees'], pelvis=pel(n0, (0, 0.0, -0.58), (40, 0, 0)), handL=P((-0.2, 0.4, -0.45)), handR=P((-0.2, 0.36, -0.5)), head=add(n0['head'], (30, 0, 10)), jaw=14.0, keys=K(n0, blink=1.0, paw_open_L=0.6, paw_open_R=0.6))
    gasp = merge(crouch, head=add(n0['head'], (10, 0, -10)), jaw=20.0, keys=K(n0, blink=0.3, paw_open_L=0.6, paw_open_R=0.6))
    topple = merge(d, pelvis=dict(pos=add(d['pelvis']['pos'], (0, 0.10, 0.30)), rot=(-40, 0, 0)), head=(10, 0, 0), jaw=22.0)
    k = [(0, v['side']), (T(.40), v['stag'], 'io'), (T(1.00), v['G'], 'io'), (T(1.40), peer(0), 'io'), (T(1.75), peer(50), 'io'), (T(2.10), peer(-50), 'io'), (T(2.45), peer(30), 'io'), (T(2.80), peer(-20), 'io'), (T(3.40), peer(10), 'io'), (T(4.14), peer(-30), 'io')]
    hold(k, 4.20, 4.55, merge(v['fold'], pelvis=pel(n0, (0, -0.10, -0.10), (40, 0, 0)), jaw=26.0), 'in3')
    k += [(T(5.00), crouch, 'io'), (T(5.60), gasp, 'io'), (T(6.20), crouch, 'io'), (T(6.94), gasp, 'io')]
    hold(k, 7.00, 7.60, merge(crouch, pelvis=pel(n0, (0, 0.0, -0.50), (20, 0, 0)), head=add(n0['head'], (-30, 0, 0)), jaw=28.0), 'in3')
    k += [(T(8.10), topple, 'io'), (T(8.50), d, 'in'), (T(8.62), v['dflop'], 'out'), (T(8.76), d, 'in'), (N, d, 'lin')]
    return dict(frames=N, loop=False, fn=keyed(k), **FALL, info=cinfo14('target', 'yomikage_ultimate', N, YOMIKAGE_SHOTS, name_jp='後の先・月断を受ける側（10秒版）',
                beats=dict(search=[T(1.40), T(4.14)], slash1=T(4.20), crouch=T(5.00), slash2=T(7.00), topple=T(8.10), ground=T(8.50)),
                note='構え直して左右を探す（見失う）→背後からの一閃で体が折れる→腹を抱えてうずくまり、息をつく→二閃目で頭が跳ね上がる→ゆっくり後ろへ崩れて倒れる'))

# ---------------- バレット「超圧縮・弾丸頭突き」 10.2s: 尻尾の重い三打 → 爆発する木の実 → 振り向いた背後で大爆発 ----------------
BULLET_SHOTS = [0, T(1.2), T(2.2), T(3.2), T(4.4), T(5.8), T(7.0), T(8.6), T(10.2)]
def cin_bullet_atk(cid):
    n0 = neutral(cid); N = T(10.2); lash = plain(bullet_ult(cid)['fn'](21)); tb = lambda u, s_=0.0: _tb(cid, u, s_)
    face = merge(n0, pelvis=pel(n0, (0, 0.10, -0.10), (4, 0, 0)), handL=P((0.3, 0.3, -0.1)), handR=P((0.3, 0.2, -0.1)), tail=(10, 0), tail_bones=tb(60), keys=K(n0, brow_angry=0.9))
    windS = merge(n0, pelvis=pel(n0, (0, 0.0, -0.16), (4, -60, 0)), chest=add(n0['chest'], (0, -20, 0)), neck=add(n0['neck'], (0, 40, 0)), head=add(n0['head'], (0, 80, 0)), handL=P((0.4, 0.3, 0.1)), handR=P((0.4, 0.0, 0.1)), tail=(10, 0), tail_bones=tb(20, -90), keys=K(n0, brow_angry=1.0))
    sweep = merge(n0, pelvis=pel(n0, (0, 0.34, -0.22), (10, 160, 0)), chest=add(n0['chest'], (4, 20, 0)), neck=add(n0['neck'], (0, -60, 0)), head=add(n0['head'], (-6, -110, 0)), handL=P((0.6, 0.1, 0.1)), handR=P((0.6, -0.1, 0.1)),
                 footL=foot(n0, 'footL', (0.04, 0.30, 0), yaw=100), footR=foot(n0, 'footR', (0.06, 0.10, 0), yaw=-100, pitch=20), tail=(10, 0), tail_bones=tb(10, 80), jaw=14.0, keys=K(n0, brow_angry=1.0))
    coilU = merge(n0, pelvis=pel(n0, (0, 0.10, -0.30), (14, 0, 0)), chest=add(n0['chest'], (8, 0, 0)), head=add(n0['head'], (-10, 20, 0)), handL=P((0.2, 0.2, -0.3)), handR=P((0.2, 0.1, -0.3)), tail=(0, 0), tail_bones=tb(-80), keys=K(n0, brow_angry=1.0))
    slamT = merge(n0, pelvis=pel(n0, (0, 0.34, -0.20), (50, 0, 0)), spine=add(n0['spine'], (10, 0, 0)), chest=add(n0['chest'], (10, 0, 0)), head=add(n0['head'], (-40, 20, 0)), handL=R_((0.0, 1.5, 0.08)), handR=R_((0.05, 1.5, 0.08)),
                 footL=foot(n0, 'footL', (0, 0.30, 0), knee=0.6), footR=foot(n0, 'footR', (0, 0.10, 0), pitch=30), tail=(0, 0), tail_bones=tb(210), jaw=18.0, keys=K(n0, paw_open_L=1.0, paw_open_R=1.0, brow_angry=1.0))
    coilD = merge(n0, pelvis=pel(n0, (0, 0.20, -0.46), (30, 0, 0)), head=add(n0['head'], (-30, 20, 0)), handL=P((0.3, 0.3, -0.3)), handR=P((0.3, 0.2, -0.3)), tail=(0, 0), tail_bones=tb(150), keys=K(n0, brow_angry=1.0))
    scoop = merge(n0, pelvis=pel(n0, (0, 0.44, 0.30), (-30, 180, 0)), chest=add(n0['chest'], (-10, 0, 0)), neck=add(n0['neck'], (0, -60, 0)), head=add(n0['head'], (10, -120, 0)), handL=P((0.7, 0.0, 0.3)), handR=P((0.7, 0.0, 0.3)),
                 footL=foot(n0, 'footL', (0.04, 0.30, 0.20), yaw=120, pitch=30), footR=foot(n0, 'footR', (0.06, 0.20, 0.26), yaw=-120, pitch=40), tail=(0, 0), tail_bones=tb(-60), jaw=20.0, keys=K(n0, paw_open_L=1.0, paw_open_R=1.0, brow_angry=1.0))
    nut = lambda u, f=0.30: P((-0.10, f, u), fwd=(0, 0.3, 0.95), back=(0, 1, 0), elbow=(0.8, -0.3, -0.5))
    hold_ = merge(n0, pelvis=pel(n0, (0, 0.10, 0.0), (0, 0, 0)), handR=nut(0.10), handL=P((0.3, 0.1, -0.3)), tail=(10, 0), tail_bones=tb(70, 20), jaw=2.0, keys=K(n0, paw_open_R=0.6, brow_angry=0.2))
    tossU = merge(hold_, handR=nut(0.50), head=add(n0['head'], (-16, 0, 0)), tail_bones=tb(70, -20))
    under = merge(n0, pelvis=pel(n0, (0, 0.0, -0.20), (10, -30, 0)), handR=P((0.20, -0.50, -0.50), fwd=(0, -0.6, -0.8), back=(1, 0, 0)), handL=P((0.2, 0.5, 0.1)), tail=(10, 0), tail_bones=tb(40, 30), keys=K(n0, paw_open_R=0.6, brow_angry=0.6))
    lob = merge(n0, pelvis=pel(n0, (0, 0.30, -0.06), (6, 30, 0)), chest=add(n0['chest'], (0, 16, 0)), handR=W((-0.10, 0.80, 0.50), fwd=(0, 0.6, 0.8), back=(0, 0.8, -0.6)), handL=P((0.4, -0.3, 0.0)), footL=foot(n0, 'footL', (0, 0.40, 0)), tail=(10, 0), tail_bones=tb(90, -30), jaw=6.0, keys=K(n0, paw_open_R=1.0, brow_angry=0.4))
    watch = merge(n0, pelvis=pel(n0, (0, 0.20, 0.0), (0, 10, 0)), handR=P((0.3, 0.3, 0.1)), handL=P((0.3, 0.2, -0.1)), tail=(10, 0), tail_bones=tb(80, 0), keys=K(n0, brow_angry=0.2))
    back_ = lambda sway: merge(n0, pelvis=pel(n0, (0, 0.20, 0.04), (-6, 0, 0)), chest=add(n0['chest'], (-6, 0, 0)), head=add(n0['head'], (4, 22, 0)), handL=P((0.34, -0.10, -0.40), fwd=(0, 0.2, -1.0), back=(1, 0, 0)), handR=P((0.34, -0.10, -0.40), fwd=(0, 0.2, -1.0), back=(1, 0, 0)),
                               footL=foot(n0, 'footL', (0.02, 0.20, 0)), footR=foot(n0, 'footR', (0.04, 0.10, 0)), tail=(10, 0), tail_bones=tb(100, sway), jaw=0.0, keys=K(n0, brow_angry=0.1, blink=1.0 if sway < 0 else 0.0))
    k = [(0, lash), (T(.30), lash, 'lin'), (T(.90), face, 'io'), (T(1.30), windS, 'out'), (T(1.50), windS, 'lin')]
    hold(k, 1.60, 1.90, sweep, 'in3', merge(sweep, tail_bones=tb(10, 100)))
    k += [(T(2.30), coilU, 'io'), (T(2.50), coilU, 'lin')]
    hold(k, 2.60, 2.90, slamT, 'in3')
    k += [(T(3.30), coilD, 'io'), (T(3.50), coilD, 'lin')]
    hold(k, 3.60, 4.00, scoop, 'in3')
    k += [(T(4.50), hold_, 'io'), (T(4.80), hold_, 'lin'), (T(4.95), tossU, 'out'), (T(5.10), hold_, 'in'), (T(5.20), under, 'out'), (T(5.32), lob, 'in3'), (T(5.70), lob, 'lin'), (T(6.40), watch, 'io'), (T(7.00), watch, 'lin'),
          (T(7.50), back_(30), 'io'), (T(8.20), back_(-30), 'io'), (T(8.90), back_(30), 'io'), (T(9.60), back_(-30), 'io'), (N, back_(20), 'io')]
    return dict(frames=N, loop=False, fn=keyed(k), **TAILFX, info=cinfo14('attacker', 'bullet_ultimate', N, BULLET_SHOTS, name_jp='超圧縮・弾丸頭突き・命中後（10秒版）',
                beats=dict(tail_sweep=T(1.60), tail_slam=T(2.60), tail_scoop=T(3.60), hitstops=[[T(1.60), T(1.90)], [T(2.60), T(2.90)], [T(3.60), T(4.00)]], nut_toss_up=T(4.95), nut_lob_release=T(5.32), turn_away=T(7.00), explosion_behind=T(7.60)),
                note='尻尾の横薙ぎ→背中越しの叩きつけ→すくい上げ、の三打（どれも体の向きと尻尾の軌道が違う）→木の実を一度放って受け、下手で投げる→背を向けて腕を下ろす。爆発のあいだも振り返らず、尻尾だけがゆっくり揺れる'))
def cinv_bullet(cid):
    v = _vx(cid); n0 = v['n0']; d = v['d']; L = v['look']; N = T(10.2)
    sit = merge(n0, pelvis=pel(n0, (0, -0.20, -0.60), (-16, 0, 0)), chest=add(n0['chest'], (10, 0, 0)), head=add(n0['head'], (20, 0, 10)), handL=P((0.3, 0.2, -0.6)), handR=P((0.35, 0.15, -0.62)), footL=foot(n0, 'footL', (0.10, 0.50, 0), pitch=-30, knee=0.4), footR=foot(n0, 'footR', (0.14, 0.60, 0), pitch=-30, knee=0.4),
                tail=(-50, 0), jaw=10.0, keys=K(n0, blink=1.0, paw_open_L=1.0, paw_open_R=1.0))
    huh = merge(sit, head=add(n0['head'], (-6, 0, 16)), jaw=6.0, keys=K(n0, blink=0.0, paw_open_L=1.0, paw_open_R=1.0))
    lap = merge(sit, head=add(n0['head'], (34, 0, 0)), handL=P((-0.1, 0.5, -0.4)), handR=P((-0.1, 0.46, -0.44)), jaw=4.0, keys=K(n0, blink=0.0, paw_open_L=1.0, paw_open_R=1.0))
    panic = merge(sit, pelvis=pel(n0, (0, -0.26, -0.50), (-26, 0, 0)), head=add(n0['head'], (-10, 0, 0)), handL=P((0.8, 0.2, 0.5)), handR=P((0.8, 0.2, 0.5)), jaw=28.0, keys=K(n0, blink=0.0, paw_open_L=1.0, paw_open_R=1.0))
    k = [(0, v['side']), (T(.40), v['stag'], 'io'), (T(1.20), v['G'], 'io'), (T(1.54), v['G'], 'lin')]
    hold(k, 1.60, 1.90, v['side'], 'in3')
    k += [(T(2.30), v['stag'], 'io'), (T(2.54), L(0, -40, 0.4, 0.0, 14.0), 'io')]
    hold(k, 2.60, 2.90, v['knees'], 'in3')
    k += [(T(3.40), merge(v['knees'], head=add(n0['head'], (-10, 0, 0)), keys=K(n0, blink=0.4)), 'io'), (T(3.54), merge(v['knees'], head=add(n0['head'], (-20, 0, 0))), 'lin')]
    hold(k, 3.60, 4.00, merge(v['arch'], pelvis=pel(n0, (0, -0.10, 0.24), (-30, 0, 0)), head=add(n0['head'], (-40, 0, 0))), 'in3')
    k += [(T(4.30), v['air'], 'out'), (T(4.62), v['curl'], 'io'), (T(4.70), sit, 'in'), (T(5.60), sit, 'lin'), (T(6.20), huh, 'io'), (T(6.76), huh, 'lin'), (T(6.90), lap, 'io'), (T(7.30), lap, 'lin'), (T(7.50), panic, 'out3'), (T(7.58), panic, 'lin'),
          (T(7.80), v['star'], 'out3'), (T(8.40), v['curl'], 'io'), (T(8.90), v['star'], 'io'), (T(9.04), v['limp'], 'io'), (T(9.10), d, 'in'), (T(9.24), v['dflop'], 'out'), (T(9.40), d, 'in'), (N, d, 'lin')]
    return dict(frames=N, loop=False, fn=keyed(k), **FALL, info=cinfo14('target', 'bullet_ultimate', N, BULLET_SHOTS, name_jp='超圧縮・弾丸頭突きを受ける側（10秒版）',
                beats=dict(swept=T(1.60), crushed=T(2.60), scooped=T(3.60), sit=T(4.70), notice_nut=T(6.20), look_at_lap=T(6.90), panic=T(7.50), blown=T(7.60), ground=T(9.10)),
                note='横薙ぎで体ごと持っていかれる→叩きつけでひざから潰れる→すくい上げで跳ね、尻もちで座り込む→飛んでくる木の実に首をかしげる→ひざの上の木の実を見る→慌てて両手を上げる→爆発で吹き飛び、落ちて止まる'))

# ---------------- ダークモグゾー「暗連・黒天烈掌」 10.0s: 闇の高速連打 → 重い最後の一撃 → 後ろ姿 ----------------
DARK_SHOTS = [0, T(1.2), T(2.0), T(2.8), T(3.5), T(4.2), T(5.8), T(7.4), T(8.6), T(10.0)]
DARK_HITS = [1.40, 1.72, 2.20, 2.52, 2.98, 3.24, 3.68, 3.96]
def cin_dark_atk(cid):
    n0 = neutral(cid); N = T(10.0); seize = plain(dark_ult(cid)['fn'](18))
    def hit(handk, pos, yaw, low, pitch=8, fwd=(0, 1, 0), back=(0, 0, 1), step=0.5):
        o = 'handL' if handk == 'handR' else 'handR'
        return merge(n0, pelvis=pel(n0, (0, step, low), (pitch, yaw, 0)), chest=add(n0['chest'], (pitch * 0.4, yaw * 0.5, 0)), neck=add(n0['neck'], (0, -yaw * 0.5, 0)), head=add(n0['head'], (-pitch, -yaw * 0.9, 0)),
                     footL=foot(n0, 'footL', (0, step + 0.2, 0), knee=0.5), footR=foot(n0, 'footR', (0, step - 0.3, 0), pitch=30), tail=(-10, -yaw * 0.5), jaw=12.0, keys=K(n0, brow_angry=1.0),
                     **{handk: dict(space='world', pos=pos, fwd=fwd, back=back, elbow=(0.8, -0.3, -0.4)), o: P((0.34, -0.36, -0.10), fwd=(0, 0.9, 0.2), back=(0.9, 0, 0.3), elbow=(0.6, -0.8, 0))})
    H = [hit('handL', (-0.10, 0.97, 0.10), -30, -0.20), hit('handR', (-0.14, 0.98, 0.00), 40, -0.24), hit('handL', (-0.20, 0.90, 0.30), -60, -0.10, 0, (-0.6, 0.8, 0)), hit('handR', (-0.12, 0.92, -0.40), 46, -0.44, 24),
         hit('handL', (-0.10, 0.60, 0.80), -30, 0.10, -16, (0, 0.2, 1.0), (-0.2, 1, 0)), hit('handR', (-0.20, 0.90, 0.34), 70, -0.10, 0, (-0.6, 0.8, 0)), hit('handL', (0.10, 0.96, 0.14), -80, -0.20, 4, (0.4, 0.9, 0), (-0.9, 0.4, 0)), hit('handR', (-0.14, 0.98, 0.10), 50, -0.26, 10)]
    load = merge(n0, pelvis=pel(n0, (0, 0.40, -0.40), (10, -50, 0)), chest=add(n0['chest'], (-4, -30, 0)), neck=add(n0['neck'], (0, 30, 0)), head=add(n0['head'], (0, 60, 0)), handR=P((0.40, -0.50, 0.50), fwd=(0, -0.3, 0.95), back=(0.6, -0.8, 0), elbow=(0.8, -0.5, 0.1)), handL=W((-0.02, 0.70, 0.10), fwd=(0, 0.5, 0.85), back=(0, -0.85, 0.5)),
                 footL=foot(n0, 'footL', (0, 0.60, 0), knee=0.6), footR=foot(n0, 'footR', (0, 0.0, 0), knee=0.5), tail=(30, 30), jaw=0.0, keys=K(n0, paw_open_L=1.0, brow_angry=1.0))
    sink = merge(load, pelvis=pel(n0, (0, 0.36, -0.56), (14, -56, 0)), handR=P((0.40, -0.50, 0.90), fwd=(0, -0.3, 0.95), back=(0.6, -0.8, 0), elbow=(0.9, -0.3, 0.2)))
    smash = merge(n0, pelvis=pel(n0, (0, 0.80, -0.52), (40, 30, 0)), spine=add(n0['spine'], (10, 6, 0)), chest=add(n0['chest'], (12, 16, 0)), neck=add(n0['neck'], (-14, -16, 0)), head=add(n0['head'], (-26, -30, 0)), handR=W((-0.14, 0.80, -0.56), fwd=(0, 0.4, -0.9), back=(0, 0.9, 0.4)), handL=P((0.5, -0.6, 0.2)),
                  footL=foot(n0, 'footL', (0, 1.00, 0), knee=0.7), footR=foot(n0, 'footR', (0, 0.10, 0), pitch=44), tail=(-30, 0), jaw=22.0, keys=K(n0, paw_open_R=1.0, brow_angry=1.0))
    rise = merge(n0, pelvis=pel(n0, (0, 0.60, -0.10), (4, 0, 0)), handL=P((0.3, 0.2, -0.3)), handR=P((0.3, 0.2, -0.3)), footL=foot(n0, 'footL', (0, 0.70, 0)), footR=foot(n0, 'footR', (0, 0.40, 0)), jaw=0.0, keys=K(n0, brow_angry=0.8))
    def walk(lead, sink_): return merge(n0, pelvis=pel(n0, (0, 0.50, sink_), (2, 24, 0)), chest=add(n0['chest'], (-2, 0, 0)), neck=add(n0['neck'], (0, 20, 0)), head=add(n0['head'], (4, 24, 0)), handL=P((0.30, 0.0, -0.46), fwd=(0, 0.2, -1.0), back=(1, 0, 0)), handR=P((0.30, 0.0, -0.46), fwd=(0, 0.2, -1.0), back=(1, 0, 0)),
                                    footL=foot(n0, 'footL', (0.02, 0.80 if lead == 'L' else 0.40, 0), pitch=-8 if lead == 'L' else 20), footR=foot(n0, 'footR', (0.04, 0.80 if lead == 'R' else 0.40, 0), pitch=-8 if lead == 'R' else 20), tail=(0, 10 if lead == 'L' else -10), jaw=0.0, keys=K(n0, brow_angry=0.6))
    still = merge(walk('L', 0.0), footL=foot(n0, 'footL', (0.02, 0.60, 0)), footR=foot(n0, 'footR', (0.04, 0.50, 0)), head=add(n0['head'], (8, 24, 0)), keys=K(n0, brow_angry=0.4, blink=1.0))
    k = [(0, seize), (T(.50), seize, 'lin'), (T(1.20), merge(seize, pelvis=pel(n0, (0, 0.50, -0.40), (16, 0, 0))), 'io')]
    for i, t in enumerate(DARK_HITS): k += [(T(t), H[i], 'in3'), (T(t + 0.12), H[i], 'lin')]
    k += [(T(4.60), load, 'io'), (T(5.60), sink, 'lin'), (T(6.20), sink, 'lin')]
    hold(k, 6.30, 7.00, smash, 'in3')
    k += [(T(7.60), smash, 'lin'), (T(8.40), rise, 'io'), (T(8.80), walk('L', -0.06), 'io'), (T(9.10), walk('R', -0.06), 'io'), (T(9.40), walk('L', -0.04), 'io'), (T(9.70), still, 'io'), (N, still, 'lin')]
    return dict(frames=N, loop=False, fn=keyed(k), info=cinfo14('attacker', 'dark_moguzo_ultimate', N, DARK_SHOTS, name_jp='暗連・黒天烈掌・命中後（10秒版）',
                beats=dict(hits=[T(t) for t in DARK_HITS], load=T(4.60), sink=T(5.60), smash_contact=T(6.30), smash_hitstop=[T(6.30), T(7.00)], walk_away=[T(8.80), T(9.40)], back_still=T(9.70)),
                note='つかんだ間合いのまま八発（左突き・右突き・左鉤・右の低い突き・左の突き上げ・右鉤・左裏拳・右突き。毎回こぶしと体の向きが違う）→拳を後ろへ引いてゆっくり沈む→踏み込んで真上から打ち下ろす（止め）→立ち、三歩あるいて止まる。向きを変えて背を見せるのは root'))
def cinv_dark(cid):
    v = _vx(cid); n0 = v['n0']; d = v['d']; N = T(10.0)
    def rx(yaw, roll, pitch, low=-0.06):
        return merge(v['reel'], pelvis=pel(n0, (0.08 * (1 if roll > 0 else -1), -0.20, low), (pitch, yaw, roll)), chest=add(n0['chest'], (pitch * 0.6, yaw * 0.5, roll * 0.6)), head=add(n0['head'], (pitch, yaw * 0.8, roll)), jaw=22.0)
    Rs = [rx(30, 14, -16), rx(-40, -16, -10), rx(60, 22, -6), merge(v['fold'], pelvis=pel(n0, (0, -0.26, -0.14), (40, 0, 0)), jaw=26.0), rx(0, 0, -40, 0.20), rx(-70, -24, -8), rx(80, 20, -12), rx(-20, -8, -28)]
    sway = lambda r: merge(v['stag'], pelvis=pel(n0, (0.10 * r, -0.14, -0.20), (14, 0, 10 * r)), head=add(n0['head'], (20, 0, 18 * r)), handL=P((0.3, 0.2, -0.55)), handR=P((0.34, 0.14, -0.58)), keys=K(n0, blink=0.8, paw_open_L=1.0, paw_open_R=1.0), jaw=14.0)
    flat = merge(d, head=(26, 0, 0), jaw=24.0)
    k = [(0, merge(v['reel'], head=add(n0['head'], (-30, 0, 0)))), (T(1.20), merge(v['reel'], head=add(n0['head'], (-24, 0, 0)), keys=K(n0, blink=0.0)), 'io')]
    for i, t in enumerate(DARK_HITS): k += [(T(t), Rs[i], 'in3'), (T(t + 0.12), Rs[i], 'lin')]
    k += [(T(4.50), sway(1), 'io'), (T(5.00), sway(-1), 'io'), (T(5.50), sway(1), 'io'), (T(6.00), sway(-0.6), 'io'), (T(6.24), merge(sway(0), head=add(n0['head'], (-20, 0, 0)), keys=K(n0, blink=0.0)), 'io')]
    hold(k, 6.30, 7.00, merge(v['knees'], pelvis=pel(n0, (0, 0.0, -0.66), (50, 0, 0)), head=add(n0['head'], (40, 0, 0)), jaw=28.0), 'in3')
    k += [(T(7.30), flat, 'io'), (T(7.44), v['dflop'], 'out'), (T(7.60), d, 'in'), (N, d, 'lin')]
    return dict(frames=N, loop=False, fn=keyed(k), **FALL, info=cinfo14('target', 'dark_moguzo_ultimate', N, DARK_SHOTS, name_jp='暗連・黒天烈掌を受ける側（10秒版）',
                beats=dict(hits=[T(t) for t in DARK_HITS], sway=T(4.50), smashed=T(6.30), ground=T(7.30)),
                note='喉をつかまれてのけぞる→八発のたびに別の向きへ弾かれる（左右・前屈・突き上げ）→立ったまま左右に揺れる→真上からの一撃でひざから潰れ、そのまま地面に伏す'))

SPECIALS_B = dict(s1_v14=dict(pisuke=pisuke_s1, hakuma=hakuma_s1, takimaru=takimaru_s1, yomikage=yomikage_s1, bullet=bullet_s1, dark_moguzo=dark_s1),
                  s2_v14=dict(pisuke=pisuke_s2, hakuma=hakuma_s2, takimaru=takimaru_s2, yomikage=yomikage_s2, bullet=bullet_s2, dark_moguzo=dark_s2),
                  s3_v14=dict(pisuke=pisuke_s3, hakuma=hakuma_s3, takimaru=takimaru_s3, yomikage=yomikage_s3, dark_moguzo=dark_s3),        # バレットの s3（尾薙ぎ）は現行 sp_tail_whip のまま（下の COMMAND_KEEP）
                  ult_v14=dict(pisuke=pisuke_ult, hakuma=hakuma_ult, takimaru=takimaru_ult, yomikage=yomikage_ult, bullet=bullet_ult, dark_moguzo=dark_ult))
# バレットの尾薙ぎは、当たりの間合いがクリップの尻尾先端の軌道（tail_tip_path）と結び付いている（balance.js の tailTipAt / battle.js の tailTipSamples）。
# 見た目を替えると判定の根拠がずれるので、s3 は現行クリップを維持し、command_map の 214 を書き換えない。
COMMAND_KEEP = dict(bullet=('214',))
CINE_ATK_B = dict(cin_pisuke_atk=dict(pisuke=cin_pisuke_atk), cin_hakuma_atk=dict(hakuma=cin_hakuma_atk), cin_takimaru_atk=dict(takimaru=cin_takimaru_atk),
                  cin_yomikage_atk=dict(yomikage=cin_yomikage_atk), cin_bullet_atk=dict(bullet=cin_bullet_atk), cin_dark_moguzo_atk=dict(dark_moguzo=cin_dark_atk))
CINE_VICTIM_B = dict(cinv_pisuke=cinv_pisuke, cinv_hakuma=cinv_hakuma, cinv_takimaru=cinv_takimaru, cinv_yomikage=cinv_yomikage, cinv_bullet=cinv_bullet, cinv_dark_moguzo=cinv_dark)
