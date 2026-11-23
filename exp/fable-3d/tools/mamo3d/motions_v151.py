"""マモ拳 v15.1 Presentation（Issue #201）: 9体それぞれの勝利モーション victory_v151。
既存の motions*.py には手を入れない。勝者専用の新規クリップで、敗者用の ko は流用しない。対戦の性能・判定とは無関係（見た目だけ）。
姿勢の単位は motions.py と同じ: pelvis=pel(n0,(横,前,上)[脚の長さ],(前傾,ヨー,ロール)[度])  ヨーは負でカメラ側（本人の右）へ体を開く。
手は P(胸基準) / W(世界軸) / R_(床基準) の (外,前,上)。足は foot(n0,'footL',(外,前,上),pitch=,yaw=,knee=)。"""
import math
from .motions import neutral, merge, pel, add, hand, foot, keyed, sample, W, K, STYLE
from .motions_v14 import P, R_, spun, T

VERSION = 'v151-victory-1'
N = 240                      # 4.0 秒（60fps）。終わりの姿勢で止まる（ゲーム側は末尾で保持）
def info(cid, name, beats, short_from, **kw):
    return dict(group='victory', priority=3, start_pose='idle', end_pose='victory_hold', v2=True, v151=True, character=cid, name_jp=name,
                beats=beats, short_from_frame=short_from, loop=False, **kw)
def tb(cid, up, side=0.0):
    nb = len(STYLE[cid]['tail_bones']); return tuple((up / nb, side / nb) for _ in range(nb))
def breathe(pose, f, f0, amp=0.012, rate=0.055):
    """最後の決めポーズで、止め絵にならない程度の呼吸（骨盤の上下と胸）"""
    a = math.sin((f - f0) * rate * 2 * math.pi / 3.2) * min(1.0, max(0.0, (f - f0) / 20.0))
    return merge(pose, pelvis=dict(pos=add(pose['pelvis']['pos'], (0, 0, amp * a)), rot=pose['pelvis']['rot']), chest=add(pose['chest'], (1.2 * a, 0, 0)))
def held(keys, f0):
    base = keyed(keys); last = keys[-1][1]
    return lambda f: breathe(last, f, f0) if f >= keys[-1][0] else base(f)

# ---------------------------------------------------------------- モグゾー: 拳を天へ
def moguzo(cid):
    n0 = neutral(cid)
    breath = merge(n0, pelvis=pel(n0, (0, -0.04, -0.10), (10, -8, 0)), chest=add(n0['chest'], (8, 0, 0)), head=add(n0['head'], (10, 0, 0)), handL=P((0.20, 0.30, -0.25)), handR=P((0.20, 0.25, -0.25)), tail=(-8, 0), keys=K(n0, blink=1.0))
    coil = merge(n0, pelvis=pel(n0, (0, 0.0, -0.36), (16, -34, 0)), chest=add(n0['chest'], (12, -14, 0)), head=add(n0['head'], (-4, -10, 0)),
                 handR=R_((0.30, -0.10, 0.25), fwd=(0, 0.5, 0.85), back=(0.4, -0.85, 0.2), elbow=(0.7, -0.6, -0.3)), handL=P((0.22, 0.30, -0.15)), tail=(-16, 0), keys=K(n0, brow_angry=1.0))
    up = merge(n0, pelvis=pel(n0, (0, 0.04, 0.55), (-10, -52, 0)), spine=add(n0['spine'], (-8, 0, 0)), chest=add(n0['chest'], (-14, -8, 0)), neck=add(n0['neck'], (-6, 0, 0)), head=add(n0['head'], (-22, -24, 0)),
               handR=W((0.10, 0.10, 1.45), fwd=(0, 0.1, 1.0), back=(0.3, -0.95, 0.1), elbow=(0.8, 0.1, -0.5)), handL=P((0.30, -0.10, -0.30), fwd=(0, 0.3, -0.95), back=(0.9, 0.3, 0), elbow=(0.6, -0.7, 0)),
               footL=foot(n0, 'footL', (0, 0.02, 0.42), pitch=30), footR=foot(n0, 'footR', (0.04, 0.02, 0.50), pitch=40, knee=0.3), tail=(30, 0), jaw=16.0, keys=K(n0, brow_angry=0.4))
    land = merge(n0, pelvis=pel(n0, (0, 0.02, -0.16), (4, -58, 0)), chest=add(n0['chest'], (-6, -10, 0)), head=add(n0['head'], (-10, -30, 0)),
                 handR=W((0.12, 0.06, 1.40), fwd=(0, 0.1, 1.0), back=(0.3, -0.95, 0.1), elbow=(0.8, 0.1, -0.5)), handL=P((0.34, 0.05, -0.35), fwd=(0, 0.3, -0.95), back=(0.9, 0.3, 0), elbow=(0.6, -0.7, 0)),
                 footL=foot(n0, 'footL', (0.06, 0.04, 0)), footR=foot(n0, 'footR', (0.08, -0.04, 0)), tail=(-10, 0), jaw=10.0)
    pose = merge(land, pelvis=pel(n0, (0, 0.02, 0.0), (-4, -62, 0)), chest=add(n0['chest'], (-10, -10, 0)), head=add(n0['head'], (-14, -34, 4)), tail=(14, 0), jaw=12.0)
    keys = [(0, n0), (34, breath, 'io'), (52, breath, 'lin'), (78, coil, 'io'), (86, coil, 'lin'), (98, up, 'in'), (112, up, 'out'), (124, land, 'in'), (150, pose, 'out3')]
    return dict(frames=N, loop=False, fn=held(keys, 150), info=info(cid, '拳を天へ', dict(breath=34, coil=78, launch=98, land=124, pose=150), 70,
                silhouette='深く息を吐く→右へ沈む→跳んで右拳を真上へ→着地して拳を掲げたままカメラへ胸を開く'))

# ---------------------------------------------------------------- ピスケ: 回転蹴りから片足立ち
def pisuke(cid):
    n0 = neutral(cid)
    hop = merge(n0, pelvis=pel(n0, (0, 0, 0.16), (2, 0, 0)), footL=foot(n0, 'footL', (0, 0, 0.14), pitch=20), footR=foot(n0, 'footR', (0, 0, 0.12), pitch=24), handL=P((0.18, 0.40, 0.0)), handR=P((0.18, 0.34, 0.0)), tail=(14, 0))
    kick1 = merge(n0, pelvis=pel(n0, (0, 0.04, 0.02), (-12, -20, 0)), chest=add(n0['chest'], (-10, 0, 0)), footR=foot(n0, 'footR', (0.05, 0.72, 0.62), pitch=-40, knee=0.05), handL=P((0.30, 0.20, 0.10)), handR=P((0.30, -0.10, -0.10)), tail=(-20, 0), jaw=8.0, keys=K(n0, brow_angry=0.6))
    crouch = merge(n0, pelvis=pel(n0, (0, 0, -0.34), (14, -10, 0)), handL=P((0.25, 0.20, -0.25)), handR=P((0.25, 0.15, -0.25)), tail=(-18, 0))
    air = merge(n0, pelvis=pel(n0, (0, 0, 0.95), (-6, 0, 0)), chest=add(n0['chest'], (-8, 0, 0)), footR=foot(n0, 'footR', (0.30, 0.50, 1.20), pitch=-30, knee=0.05), footL=foot(n0, 'footL', (0, -0.10, 0.80), pitch=40, knee=0.5),
                handL=P((0.45, 0.0, 0.20)), handR=P((0.45, -0.10, 0.10)), tail=(24, 0), jaw=12.0, keys=K(n0, brow_angry=0.4))
    land = merge(n0, pelvis=pel(n0, (0, 0, -0.22), (10, -50, 0)), handL=P((0.30, 0.20, -0.20)), handR=P((0.30, 0.15, -0.20)), footL=foot(n0, 'footL', (0.04, 0.04, 0)), footR=foot(n0, 'footR', (0.06, -0.04, 0)), tail=(-12, 0))
    crane = merge(n0, pelvis=pel(n0, (0, 0.02, 0.10), (-4, -64, 0)), chest=add(n0['chest'], (-8, -8, 0)), head=add(n0['head'], (-10, -30, -6)),
                  footL=foot(n0, 'footL', (0.02, 0.02, 0), yaw=-10), footR=foot(n0, 'footR', (0.04, 0.34, 0.62), pitch=-10, knee=0.55),
                  handL=W((0.62, 0.0, 0.42), fwd=(1, 0, 0.2), back=(0, 0, 1), elbow=(0.6, -0.3, -0.6)), handR=W((0.62, 0.05, 0.42), fwd=(1, 0, 0.2), back=(0, 0, 1), elbow=(0.6, -0.3, -0.6)), tail=(22, 0), jaw=10.0, keys=K(n0, paw_open_L=1.0, paw_open_R=1.0))
    keys = [(0, n0), (10, hop, 'out'), (20, n0, 'in'), (30, hop, 'out'), (40, n0, 'in'), (52, kick1, 'in3'), (60, kick1, 'lin'), (76, crouch, 'io'), (84, crouch, 'lin'), (96, air, 'in'), (112, air, 'lin'), (126, land, 'in'), (152, crane, 'out3')]
    spin = [(0, 0), (84, 0, 'lin'), (96, 150, 'in'), (112, 330, 'lin'), (126, 360, 'out'), (N, 360, 'lin')]
    base = spun(cid, keys, spin); last = crane
    return dict(frames=N, loop=False, fn=lambda f: breathe(last, f, 152) if f >= 152 else base(f), info=info(cid, '風切り一回転', dict(hops=30, kick=52, jump=96, land=126, pose=152), 76,
                silhouette='軽く2回跳ねる→前蹴り→沈んで一回転の跳び回し蹴り→着地から片足立ちで両手を広げる'))

# ---------------------------------------------------------------- ゴダン: 四股と押忍
def godan(cid):
    n0 = neutral(cid)
    wide = merge(n0, pelvis=pel(n0, (0, 0, -0.22), (6, -66, 0)), chest=add(n0['chest'], (4, 0, 0)), head=add(n0['head'], (0, -30, 0)), footL=foot(n0, 'footL', (0.20, 0.0, 0), yaw=-20), footR=foot(n0, 'footR', (0.22, 0.0, 0), yaw=20),
                 handL=P((0.34, 0.10, -0.40)), handR=P((0.34, 0.10, -0.40)), tail=(-6, 0), keys=K(n0, brow_angry=1.0))
    lift = merge(wide, pelvis=pel(n0, (0.10, 0, -0.06), (4, -66, -16)), chest=add(n0['chest'], (0, 0, 10)), footR=foot(n0, 'footR', (0.62, 0.0, 0.86), yaw=20, pitch=-10, knee=0.35),
                 handL=P((0.40, 0.05, -0.30)), handR=R_((0.55, 0.0, 0.62), fwd=(1, 0, 0), back=(0, 0, 1), elbow=(0.3, -0.6, -0.7)), tail=(8, 0), jaw=6.0)
    stomp = merge(wide, pelvis=pel(n0, (0, 0, -0.46), (10, -66, 0)), chest=add(n0['chest'], (10, 0, 0)), head=add(n0['head'], (6, -30, 0)), footR=foot(n0, 'footR', (0.30, 0.0, 0), yaw=24),
                  handL=R_((0.36, 0.10, 0.52), fwd=(0, 0.3, -0.9), back=(1, 0, 0), elbow=(0.9, -0.3, 0.2)), handR=R_((0.36, 0.10, 0.52), fwd=(0, 0.3, -0.9), back=(1, 0, 0), elbow=(0.9, -0.3, 0.2)), tail=(-18, 0), jaw=14.0)
    rise = merge(wide, pelvis=pel(n0, (0, 0, -0.10), (2, -70, 0)), chest=add(n0['chest'], (-8, 0, 0)), head=add(n0['head'], (-4, -30, 0)),
                 handL=P((0.10, 0.34, 0.10), fwd=(-0.6, 0.2, 0.7), back=(0.3, 0.9, 0), elbow=(0.9, -0.2, -0.3)), handR=P((0.10, 0.30, 0.10), fwd=(-0.6, 0.2, 0.7), back=(0.3, 0.9, 0), elbow=(0.9, -0.2, -0.3)), tail=(0, 0))
    osu = merge(rise, pelvis=pel(n0, (0, 0, -0.04), (0, -72, 0)), chest=add(n0['chest'], (-10, 0, 0)), head=add(n0['head'], (4, -30, 0)),
                handL=P((0.30, 0.12, -0.42), fwd=(0, 0.2, -1.0), back=(1, 0.2, 0), elbow=(0.9, -0.3, 0.1)), handR=P((0.30, 0.10, -0.42), fwd=(0, 0.2, -1.0), back=(1, 0.2, 0), elbow=(0.9, -0.3, 0.1)), jaw=8.0, tail=(6, 0))
    keys = [(0, n0), (30, wide, 'io'), (40, wide, 'lin'), (74, lift, 'out3'), (88, lift, 'lin'), (98, stomp, 'in3'), (112, stomp, 'lin'), (136, rise, 'io'), (148, rise, 'lin'), (160, osu, 'in'), (172, osu, 'out')]
    return dict(frames=N, loop=False, fn=held(keys, 172), info=info(cid, '四股・押忍', dict(stance=30, lift=74, stomp=98, cross=136, osu=160), 60,
                silhouette='カメラへ正対して腰を割る→右脚を高く上げる→踏み下ろし（地響き）→胸の前で拳を交差→両拳を腰へ引き切って押忍', impact_frames=[98]))

# ---------------------------------------------------------------- ハクマ: 柏手と一礼
def hakuma(cid):
    n0 = neutral(cid)
    open_ = merge(n0, pelvis=pel(n0, (0, 0, -0.06), (0, -62, 0)), chest=add(n0['chest'], (-10, 0, 0)), head=add(n0['head'], (-8, -30, 0)),
                  handL=W((0.80, 0.10, 0.30), fwd=(1, 0, 0.1), back=(0, -1, 0), elbow=(0.3, -0.4, -0.8)), handR=W((0.80, 0.10, 0.30), fwd=(1, 0, 0.1), back=(0, -1, 0), elbow=(0.3, -0.4, -0.8)), tail=(8, 0), keys=K(n0, paw_open_L=1.0, paw_open_R=1.0))
    clap = merge(open_, chest=add(n0['chest'], (-2, 0, 0)), head=add(n0['head'], (2, -30, 0)),
                 handL=P((0.02, 0.46, 0.14), fwd=(-0.3, 0.3, 0.9), back=(1, 0, 0), elbow=(0.9, -0.2, -0.4)), handR=P((0.02, 0.46, 0.14), fwd=(-0.3, 0.3, 0.9), back=(1, 0, 0), elbow=(0.9, -0.2, -0.4)), jaw=4.0, keys=K(n0, paw_open_L=1.0, paw_open_R=1.0))
    bow = merge(clap, pelvis=pel(n0, (0, -0.06, -0.08), (34, -62, 0)), spine=add(n0['spine'], (10, 0, 0)), chest=add(n0['chest'], (16, 0, 0)), neck=add(n0['neck'], (8, 0, 0)), head=add(n0['head'], (16, -30, 0)), tail=(-14, 0), keys=K(n0, paw_open_L=1.0, paw_open_R=1.0, blink=1.0))
    up = merge(clap, pelvis=pel(n0, (0, 0, 0.0), (-2, -64, 0)), chest=add(n0['chest'], (-8, 0, 0)), head=add(n0['head'], (-6, -32, 5)),
               handL=P((0.02, 0.40, 0.04), fwd=(-0.3, 0.3, 0.9), back=(1, 0, 0), elbow=(0.9, -0.2, -0.4)), handR=P((0.02, 0.40, 0.04), fwd=(-0.3, 0.3, 0.9), back=(1, 0, 0), elbow=(0.9, -0.2, -0.4)), tail=(10, 0), jaw=6.0, keys=K(n0, paw_open_L=1.0, paw_open_R=1.0))
    keys = [(0, n0), (36, open_, 'io'), (48, open_, 'lin'), (56, clap, 'in3'), (66, open_, 'out'), (74, clap, 'in3'), (90, clap, 'lin'), (120, bow, 'io'), (150, bow, 'lin'), (176, up, 'io')]
    return dict(frames=N, loop=False, fn=held(keys, 176), info=info(cid, '柏手・一礼', dict(open=36, clap1=56, clap2=74, bow=120, rise=176), 48,
                silhouette='カメラへ正対して両掌を左右へ大きく開く→柏手を2回→合掌のまま深く一礼→顔を上げて静かに微笑む', impact_frames=[56, 74]))

# ---------------------------------------------------------------- チルカ: くるりと回って爪先でご挨拶
def chirka(cid):
    n0 = neutral(cid)
    sway1 = merge(n0, pelvis=pel(n0, (0.06, 0, 0.04), (0, -40, 8)), head=add(n0['head'], (0, -20, 12)), handL=P((0.26, 0.20, 0.05)), handR=P((0.26, 0.15, 0.05)), tail=(20, 14))
    sway2 = merge(n0, pelvis=pel(n0, (-0.06, 0, 0.04), (0, -50, -8)), head=add(n0['head'], (0, -24, -12)), handL=P((0.26, 0.20, 0.05)), handR=P((0.26, 0.15, 0.05)), tail=(20, -14))
    dip = merge(n0, pelvis=pel(n0, (0, 0, -0.24), (10, -30, 0)), handL=P((0.30, 0.10, -0.20)), handR=P((0.30, 0.05, -0.20)), tail=(-10, 0))
    twirl = merge(n0, pelvis=pel(n0, (0, 0, 0.34), (-4, 0, 0)), handL=W((0.55, 0, 0.40), fwd=(1, 0, 0.3), back=(0, 0, 1), elbow=(0.5, -0.3, -0.7)), handR=W((0.55, 0, 0.40), fwd=(1, 0, 0.3), back=(0, 0, 1), elbow=(0.5, -0.3, -0.7)),
                  footL=foot(n0, 'footL', (0, 0, 0.30), pitch=30), footR=foot(n0, 'footR', (0, 0.10, 0.44), pitch=40, knee=0.4), tail=(34, 0), jaw=8.0, keys=K(n0, paw_open_L=1.0, paw_open_R=1.0))
    lean = merge(n0, pelvis=pel(n0, (0, 0.06, -0.10), (18, -78, 0)), spine=add(n0['spine'], (6, 0, 0)), chest=add(n0['chest'], (8, 0, 0)), neck=add(n0['neck'], (-10, 0, 0)), head=add(n0['head'], (-16, -36, 14)),
                 handR=P((0.16, 0.34, 0.34), fwd=(0, 0.2, 1.0), back=(0, 1, 0), elbow=(0.9, -0.3, -0.2)), handL=P((0.30, 0.0, -0.36), fwd=(0, -0.2, -1.0), back=(1, 0, 0), elbow=(0.7, -0.6, 0)),
                 footL=foot(n0, 'footL', (0.04, 0.02, 0)), footR=foot(n0, 'footR', (0.06, -0.06, 0), pitch=30), tail=(40, 0), jaw=10.0, keys=K(n0, paw_open_R=1.0))
    wave = merge(lean, head=add(n0['head'], (-16, -36, -10)), handR=P((0.26, 0.30, 0.38), fwd=(0.3, 0.2, 0.95), back=(0, 1, 0), elbow=(0.9, -0.3, -0.2)), tail=(40, 12), keys=K(n0, paw_open_R=1.0, blink=1.0))
    keys = [(0, n0), (16, sway1, 'io'), (32, sway2, 'io'), (48, sway1, 'io'), (60, dip, 'io'), (72, twirl, 'in'), (96, twirl, 'lin'), (110, dip, 'in'), (140, lean, 'out3'), (158, wave, 'io'), (176, lean, 'io'), (194, wave, 'io'), (212, lean, 'io')]
    spin = [(0, 0), (60, 0, 'lin'), (72, 90, 'in'), (96, 630, 'lin'), (110, 720, 'out'), (N, 720, 'lin')]
    base = spun(cid, keys, spin)
    return dict(frames=N, loop=False, fn=lambda f: breathe(lean, f, 212, amp=0.008) if f >= 212 else base(f), info=info(cid, 'くるり・爪先のご挨拶', dict(sway=48, twirl=72, lean=140, wave=158), 100,
                silhouette='左右に体を揺らす→沈んでくるくると2回転→カメラへ身を乗り出し、頬の横で爪をひらひら振る（首をかしげる）'))

# ---------------------------------------------------------------- タキマル: 力こぶと胸叩き
def takimaru(cid):
    n0 = neutral(cid)
    flex = merge(n0, pelvis=pel(n0, (0, 0, -0.10), (-4, -66, 0)), chest=add(n0['chest'], (-12, 0, 0)), head=add(n0['head'], (-10, -30, 0)), footL=foot(n0, 'footL', (0.14, 0, 0), yaw=-16), footR=foot(n0, 'footR', (0.16, 0, 0), yaw=16),
                 handL=W((0.50, 0.0, 0.62), fwd=(-0.5, 0, 0.85), back=(0, -1, 0), elbow=(0.2, -0.2, -0.95)), handR=W((0.50, 0.0, 0.62), fwd=(-0.5, 0, 0.85), back=(0, -1, 0), elbow=(0.2, -0.2, -0.95)), tail=(10, 0), jaw=14.0, keys=K(n0, brow_angry=1.0))
    flex2 = merge(flex, pelvis=pel(n0, (0, 0, -0.16), (-8, -66, 0)), chest=add(n0['chest'], (-16, 0, 0)), handL=W((0.44, 0.0, 0.70), fwd=(-0.6, 0, 0.8), back=(0, -1, 0), elbow=(0.2, -0.2, -0.95)), handR=W((0.44, 0.0, 0.70), fwd=(-0.6, 0, 0.8), back=(0, -1, 0), elbow=(0.2, -0.2, -0.95)), jaw=18.0)
    beatR = merge(flex, chest=add(n0['chest'], (-8, 0, 0)), handR=P((0.04, 0.30, 0.02), fwd=(-0.8, 0.2, 0.3), back=(0, 1, 0), elbow=(0.9, -0.3, -0.2)), handL=W((0.56, 0.0, 0.30), fwd=(0.6, 0, 0.6), back=(0, -1, 0), elbow=(0.4, -0.3, -0.8)), jaw=10.0)
    beatL = merge(flex, chest=add(n0['chest'], (-8, 0, 0)), handL=P((0.04, 0.30, 0.02), fwd=(-0.8, 0.2, 0.3), back=(0, 1, 0), elbow=(0.9, -0.3, -0.2)), handR=W((0.56, 0.0, 0.30), fwd=(0.6, 0, 0.6), back=(0, -1, 0), elbow=(0.4, -0.3, -0.8)), jaw=10.0)
    point = merge(n0, pelvis=pel(n0, (0, 0.10, -0.12), (12, -30, 0)), chest=add(n0['chest'], (8, 10, 0)), head=add(n0['head'], (4, 0, 0)),
                  handL=W((0.05, 0.86, 0.02), fwd=(0, 1, -0.25), back=(0, 0.25, 1), elbow=(0.9, -0.2, -0.3)), handR=P((0.34, -0.05, -0.36), fwd=(0, 0.2, -1), back=(1, 0, 0), elbow=(0.8, -0.5, 0)),
                  footL=foot(n0, 'footL', (0.04, 0.16, 0)), footR=foot(n0, 'footR', (0.10, -0.10, 0)), tail=(-6, 0), jaw=16.0, keys=K(n0, brow_angry=1.0))
    keys = [(0, n0), (28, flex, 'io'), (40, flex2, 'out'), (56, flex, 'io'), (70, flex2, 'out'), (86, flex, 'io'), (96, beatR, 'in3'), (104, flex, 'out'), (112, beatL, 'in3'), (120, flex, 'out'), (128, beatR, 'in3'), (140, flex, 'out'), (166, point, 'io')]
    return dict(frames=N, loop=False, fn=held(keys, 166), info=info(cid, '力こぶ・胸叩き', dict(flex=28, pump=70, beat=96, point=166), 86,
                silhouette='カメラへ正対して両腕で力こぶ（2回締める）→胸を左右交互に3回叩く→相手の方へ踏み出して指さす（見下ろし）', impact_frames=[96, 112, 128]))

# ---------------------------------------------------------------- ヨミカゲ: 血振り・納め
def yomikage(cid):
    n0 = neutral(cid)
    still = merge(n0, pelvis=pel(n0, (0, 0, 0.02), (0, 0, 0)), handR=P((0.34, 0.30, 0.10), fwd=(0.3, 0.9, 0.1), back=(0, 0, 1), elbow=(0.8, -0.4, -0.3)), tail=(0, 0), keys=K(n0, paw_open_R=1.0))
    flick = merge(n0, pelvis=pel(n0, (0, 0, -0.06), (4, -20, 0)), chest=add(n0['chest'], (4, -14, 0)), head=add(n0['head'], (6, 10, 0)),
                  handR=W((0.50, -0.30, -0.30), fwd=(0.6, -0.4, -0.7), back=(0, 0.3, 0.9), elbow=(0.6, -0.7, 0.2)), handL=P((0.10, 0.30, -0.10)), tail=(-8, 0), keys=K(n0, paw_open_R=1.0, brow_angry=0.6))
    turn = merge(n0, pelvis=pel(n0, (0, -0.04, -0.02), (2, 70, 0)), chest=add(n0['chest'], (0, 10, 0)), neck=add(n0['neck'], (4, -10, 0)), head=add(n0['head'], (10, -30, 0)),
                 handR=P((0.26, 0.10, -0.30), fwd=(0, 0.6, -0.8), back=(1, 0, 0), elbow=(0.8, -0.5, 0.1)), handL=P((0.20, 0.16, -0.26), fwd=(0, 0.6, -0.8), back=(1, 0, 0), elbow=(0.8, -0.5, 0.1)),
                 footL=foot(n0, 'footL', (0.02, -0.02, 0), yaw=40), footR=foot(n0, 'footR', (0.04, -0.10, 0), yaw=60), tail=(6, 0), keys=K(n0, paw_open_R=1.0))
    sheath = merge(turn, handR=P((0.06, 0.24, -0.34), fwd=(-0.7, 0.3, -0.6), back=(0.3, 0.9, 0), elbow=(0.9, -0.3, 0.1)), handL=P((0.10, 0.22, -0.36), fwd=(-0.2, 0.5, -0.8), back=(1, 0, 0), elbow=(0.8, -0.5, 0.1)), head=add(n0['head'], (16, -24, 0)), keys=K(n0, blink=1.0))
    rest = merge(sheath, pelvis=pel(n0, (0, -0.04, 0.02), (0, 76, 0)), head=add(n0['head'], (8, -52, 0)), neck=add(n0['neck'], (2, -22, 0)), handR=P((0.30, 0.04, -0.40), fwd=(0, 0.2, -1), back=(1, 0, 0), elbow=(0.8, -0.5, 0)), handL=P((0.28, 0.04, -0.40), fwd=(0, 0.2, -1), back=(1, 0, 0), elbow=(0.8, -0.5, 0)), tail=(10, 0), keys=K(n0, blink=0.0))
    keys = [(0, n0), (40, still, 'io'), (64, still, 'lin'), (72, flick, 'in3'), (92, flick, 'lin'), (136, turn, 'io'), (166, sheath, 'io'), (186, sheath, 'lin'), (214, rest, 'io')]
    return dict(frames=N, loop=False, fn=held(keys, 214), info=info(cid, '血振り・納め', dict(still=40, flick=72, turn=136, sheath=166, glance=214), 64,
                silhouette='手刀を構えたまま静止→鋭く斜め下へ払う（血振り）→相手に背を向け、手刀を腰へ納める→肩越しに一度だけ振り返る'))

# ---------------------------------------------------------------- バレット: 尾で床を鳴らし、尾に腰掛ける
def bullet(cid):
    n0 = neutral(cid)
    up1 = merge(n0, pelvis=pel(n0, (0, 0, 0.04), (-4, -50, 0)), head=add(n0['head'], (-6, -24, 0)), handL=P((0.26, 0.20, 0.0)), handR=P((0.26, 0.16, 0.0)), tail=(0, 0), tail_bones=tb(cid, 120), jaw=6.0)
    slap = merge(n0, pelvis=pel(n0, (0, 0, -0.08), (6, -50, 0)), head=add(n0['head'], (2, -24, 0)), handL=P((0.26, 0.20, -0.05)), handR=P((0.26, 0.16, -0.05)), tail=(0, 0), tail_bones=tb(cid, -46), jaw=10.0, keys=K(n0, brow_angry=0.5))
    toss = merge(n0, pelvis=pel(n0, (0, 0, 0.06), (-8, -58, 0)), chest=add(n0['chest'], (-10, 0, 0)), head=add(n0['head'], (-24, -26, 0)),
                 handR=W((0.16, 0.20, 0.92), fwd=(0, 0.2, 1), back=(0.3, -0.9, 0), elbow=(0.8, 0, -0.5)), handL=P((0.28, 0.10, -0.20)), tail=(0, 0), tail_bones=tb(cid, 60), jaw=12.0, keys=K(n0, paw_open_R=1.0))
    catch = merge(n0, pelvis=pel(n0, (0, 0, -0.04), (0, -60, 0)), head=add(n0['head'], (-8, -28, 6)),
                  handR=P((0.20, 0.36, 0.10), fwd=(0, 0.3, 0.95), back=(0, 1, 0), elbow=(0.9, -0.3, -0.2)), handL=P((0.28, 0.10, -0.20)), tail=(0, 0), tail_bones=tb(cid, 30), keys=K(n0, paw_open_R=0.0))
    sit = merge(n0, pelvis=pel(n0, (0, -0.16, -0.18), (-22, -62, 0)), spine=add(n0['spine'], (-4, 0, 0)), chest=add(n0['chest'], (-2, 0, 0)), neck=add(n0['neck'], (8, 0, 0)), head=add(n0['head'], (12, -30, 6)),
                handL=P((0.06, 0.32, -0.06), fwd=(-0.9, 0.2, 0.1), back=(0, 1, 0), elbow=(0.9, -0.3, -0.3)), handR=P((0.04, 0.34, 0.00), fwd=(-0.9, 0.2, 0.1), back=(0, 1, 0), elbow=(0.9, -0.3, -0.3)),
                footL=foot(n0, 'footL', (0.04, 0.26, 0.02), pitch=-24), footR=foot(n0, 'footR', (0.06, 0.20, 0.02), pitch=-24), tail=(0, 0), tail_bones=tb(cid, -80), jaw=6.0)
    keys = [(0, n0), (22, up1, 'out'), (30, slap, 'in3'), (44, up1, 'out'), (52, slap, 'in3'), (70, n0, 'io'), (86, toss, 'out3'), (104, toss, 'lin'), (116, catch, 'in'), (130, catch, 'lin'), (172, sit, 'io')]
    return dict(frames=N, loop=False, fn=held(keys, 172), info=info(cid, '尾鳴らし・尾の腰掛け', dict(slap1=30, slap2=52, toss=86, catch=116, sit=172), 70,
                silhouette='太い尾を高く上げて床を2回叩く→木の実を真上へ放り上げて片手で受ける→丸めた尾に腰掛けて腕を組む', impact_frames=[30, 52]))

# ---------------------------------------------------------------- ダークモグゾー: 背を向け、肩越しに一瞥
def dark_moguzo(cid):
    n0 = neutral(cid)
    lower = merge(n0, pelvis=pel(n0, (0, 0, 0.04), (-4, 0, 0)), chest=add(n0['chest'], (-6, 0, 0)), head=add(n0['head'], (10, 0, 0)), handL=P((0.30, 0.10, -0.36), fwd=(0, 0.2, -1), back=(1, 0, 0), elbow=(0.8, -0.5, 0)), handR=P((0.30, 0.06, -0.36), fwd=(0, 0.2, -1), back=(1, 0, 0), elbow=(0.8, -0.5, 0)), tail=(-4, 0), keys=K(n0, brow_angry=1.0))
    clench = merge(lower, handR=P((0.26, 0.26, 0.02), fwd=(0, 0.3, 0.95), back=(0.6, 0.8, 0), elbow=(0.9, -0.3, -0.3)), head=add(n0['head'], (14, -10, 0)), keys=K(n0, brow_angry=1.0, blink=1.0))
    away = merge(lower, pelvis=pel(n0, (0, -0.06, 0.04), (-2, 128, 0)), chest=add(n0['chest'], (-4, 12, 0)), head=add(n0['head'], (6, 16, 0)), footL=foot(n0, 'footL', (0.04, -0.06, 0), yaw=70), footR=foot(n0, 'footR', (0.06, -0.16, 0), yaw=100), tail=(8, 0))
    glance = merge(away, neck=add(n0['neck'], (0, -34, 0)), head=add(n0['head'], (2, -74, -6)), chest=add(n0['chest'], (-4, -10, 0)), keys=K(n0, brow_angry=1.0))
    gone = merge(away, pelvis=pel(n0, (0, -0.10, 0.06), (-6, 140, 0)), head=add(n0['head'], (-4, 20, 0)), handR=P((0.34, 0.0, -0.40), fwd=(0, 0.2, -1), back=(1, 0, 0), elbow=(0.8, -0.5, 0)), keys=K(n0, brow_angry=1.0))
    keys = [(0, n0), (40, lower, 'io'), (70, clench, 'io'), (90, clench, 'lin'), (110, lower, 'io'), (156, away, 'io'), (176, glance, 'io'), (200, glance, 'lin'), (226, gone, 'io')]
    return dict(frames=N, loop=False, fn=held(keys, 226), info=info(cid, '背を向ける', dict(lower=40, clench=70, turn=156, glance=176, leave=226), 100,
                silhouette='構えを解いて拳を下ろす→右拳を一度だけ握りしめる→相手にもカメラにも背を向ける→肩越しに一瞥→完全に背を向けて立つ（喜ばない）'))

VICTORY = dict(moguzo=moguzo, pisuke=pisuke, godan=godan, hakuma=hakuma, chirka=chirka, takimaru=takimaru, yomikage=yomikage, bullet=bullet, dark_moguzo=dark_moguzo)
CLIP = 'victory_v151'
def make(cid): return VICTORY[cid](cid)
