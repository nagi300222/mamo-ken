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

SPECIALS_B = dict(s1_v14=dict(pisuke=pisuke_s1, hakuma=hakuma_s1, takimaru=takimaru_s1), s2_v14=dict(pisuke=pisuke_s2, hakuma=hakuma_s2, takimaru=takimaru_s2),
                  s3_v14=dict(pisuke=pisuke_s3, hakuma=hakuma_s3, takimaru=takimaru_s3), ult_v14=dict(pisuke=pisuke_ult, hakuma=hakuma_ult, takimaru=takimaru_ult))
CINE_ATK_B = dict(cin_pisuke_atk=dict(pisuke=cin_pisuke_atk), cin_hakuma_atk=dict(hakuma=cin_hakuma_atk), cin_takimaru_atk=dict(takimaru=cin_takimaru_atk))
CINE_VICTIM_B = dict(cinv_pisuke=cinv_pisuke, cinv_hakuma=cinv_hakuma, cinv_takimaru=cinv_takimaru)
