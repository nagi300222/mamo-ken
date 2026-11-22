"""Showtime v14（Issue #177）: 必殺 s1/s2/s3 の作り直しと、奥義ヒット後ムービー用の演技クリップ。
既存の motions.py / motions_v2.py には手を入れない。発生・持続・硬直は balance.js の現行値に合わせてあり、性能は変えない。"""
import math
from . import motions as M, motions_v2 as V2, characters
from .motions import neutral, merge, pel, add, hand, foot, keyed, sample, W, K, STYLE
from .motions_v2 import body, plain, off, hmove, REACT, _down, _tb, FALL

VERSION = 'v14-wave1'
def vinfo(group, **kw): return dict(group=group, priority=3, start_pose='idle', end_pose='idle', v2=True, v14=True, provisional=True, **kw)


# ---------- 共通の道具 ----------
def P(pos, fwd=(0, 0.3, 0.95), back=(0.8, 0.6, 0.0), elbow=(0.55, -0.25, -0.8)): return dict(pos=pos, fwd=fwd, back=back, elbow=elbow)                # 胸について動く手
def R_(pos, fwd=(0, 1, -0.2), back=(0, 0.2, 1.0), elbow=(0.9, -0.3, 0.3)): return dict(space='root', pos=pos, fwd=fwd, back=back, elbow=elbow)      # 床基準の手（脚の長さ単位）
def _spin_foot(cid, key, f, deg):
    """足の指定を、体の鉛直軸まわりに deg 度（本人の左回り+）回す。跳びながら回る技で、足が体について回るようにする"""
    B = body(cid); s = 1.0 if key == 'footL' else -1.0; A = B.J['ankle.' + key[-1]]; leg = B.M.leg
    x, y, z = A[0] + s * f['pos'][0] * leg, A[1] - f['pos'][1] * leg, f['pos'][2]
    c, sn = math.cos(math.radians(deg)), math.sin(math.radians(deg)); x2, y2 = c * x - sn * y, sn * x + c * y
    return dict(f, pos=(s * (x2 - A[0]) / leg, -(y2 - A[1]) / leg, z), yaw=f.get('yaw', 0) + s * deg)
def spun(cid, keys, spin):
    """keys を補間した結果に、spin=[(frame, 度, 緩急)] の回転を骨盤と両足へ足す。宙で回る技用（接地中は 0 か 360 の倍数にする）"""
    sk = [(f, dict(a=d), *e) for f, d, *e in spin]
    def fn(f):
        p = sample(keys, f); a = sample(sk, f)['a']
        if abs(a) < 1e-6: return p
        p = dict(p); p['pelvis'] = dict(pos=p['pelvis']['pos'], rot=add(p['pelvis']['rot'], (0, a, 0)))
        for k in ('footL', 'footR'): p[k] = [(_spin_foot(cid, k, sp, a), w) for sp, w in p[k]] if isinstance(p[k], list) else _spin_foot(cid, k, p[k], a)
        return p
    return fn
def minfo(cid, slot, name, st, ac, N, **kw):
    return vinfo('special' if slot != 'ultimate' else 'ultimate_ingame', character=cid, move_id=slot, name_jp=name, startup=st, active=ac, recovery=N - st - ac,
                 contact_frame=st, balance_frames_total=N, **kw)

# =====================================================================
# モグゾー（万能・根性 / 大地）
# =====================================================================
def moguzo_s1(cid):
    """大地の波: 後ろ手を高く振りかぶり、踏み込みながら地面すれすれを前へすくい上げて土の波を送り出す（下手投げ）。"""
    n0 = neutral(cid); st, ac, N = 13, 2, 35
    wind = merge(n0, pelvis=pel(n0, (0, -0.20, 0.08), (-12, -34, 0)), spine=add(n0['spine'], (-6, -10, 0)), chest=add(n0['chest'], (-10, -24, 0)), neck=add(n0['neck'], (0, 20, 0)), head=add(n0['head'], (2, 34, 0)),
                 handR=P((0.22, -0.22, 0.95), fwd=(0, -0.2, 1.0), back=(0.3, -0.9, 0.2), elbow=(0.9, -0.2, 0.1)), handL=W((-0.05, 0.78, 0.12), fwd=(0, 1, 0.2), back=(0, -0.2, 1.0), elbow=(0.8, -0.2, -0.5)),
                 footL=foot(n0, 'footL', (0, 0.16, 0.34), pitch=-18, knee=0.3), footR=foot(n0, 'footR', (0, -0.08, 0)), tail=(34, 0), jaw=6.0, keys=K(n0, paw_open_R=1.0, paw_open_L=1.0, brow_angry=1.0))
    drop = merge(n0, pelvis=pel(n0, (0, 0.22, -0.38), (24, -16, 0)), chest=add(n0['chest'], (14, -12, 0)), head=add(n0['head'], (-22, 14, 0)),
                 handR=R_((0.30, -0.95, 0.16), fwd=(0, 0.5, -0.85), back=(0, -0.85, -0.5), elbow=(0.7, -0.7, 0.3)), handL=P((0.25, 0.10, -0.15)),
                 footL=foot(n0, 'footL', (0, 0.62, 0)), footR=foot(n0, 'footR', (0, -0.10, 0), pitch=34), tail=(10, 0), keys=K(n0, paw_open_R=1.0, brow_angry=1.0))
    scoop = merge(n0, pelvis=pel(n0, (0, 0.50, -0.40), (32, 28, 0)), spine=add(n0['spine'], (8, 8, 0)), chest=add(n0['chest'], (10, 22, 0)), neck=add(n0['neck'], (-8, -16, 0)), head=add(n0['head'], (-26, -30, 0)),
                  handR=W((-0.12, 0.95, -0.42), fwd=(0, 0.75, 0.65), back=(0, 0.65, -0.75), elbow=(0.9, -0.2, -0.3)), handL=P((0.50, -0.60, 0.25), fwd=(0.3, -0.8, 0.3), back=(0.8, 0.3, 0.3), elbow=(0.8, -0.5, 0.0)),
                  footL=foot(n0, 'footL', (0, 0.70, 0)), footR=foot(n0, 'footR', (0, 0.02, 0), pitch=44, knee=0.2), tail=(-22, 0), jaw=16.0, keys=K(n0, paw_open_R=1.0, paw_open_L=0.0, brow_angry=1.0))
    follow = merge(scoop, pelvis=pel(n0, (0, 0.46, -0.30), (22, 34, 0)), handR=W((-0.12, 0.80, 0.34), fwd=(0, 0.35, 0.95), back=(0, 0.95, -0.35), elbow=(0.9, -0.2, -0.3)), jaw=8.0, tail=(-8, 0))
    keys = [(0, n0), (6, wind, 'out3'), (8, wind, 'lin'), (11, drop, 'in'), (st, scoop, 'lin'), (st + ac, follow, 'out'), (22, follow, 'lin'), (N, n0, 'io')]
    return dict(frames=N, loop=False, fn=keyed(keys), info=minfo(cid, 's1', '大地の波', st, ac, N, attack_limb='pawR', projectile_spawn_frame=st, fx_anchor='pawR',
                silhouette='後ろ手を背中側へ高く振りかぶる(F6-8)→深い踏み込みで地面すれすれの下手すくい(F13)→手が胸の高さへ抜ける(F15)',
                note='旧 cmd_236（両手を前へ突き出す波動型）を置き換える。弾の発生フレーム・性能は現行のまま'))

def moguzo_s2(cid):
    """昇り拳: 右へ体を巻いて沈み、左回りに一回転しながら跳ぶ右アッパー。前ひざを突き上げる。"""
    n0 = neutral(cid); st, ac, N = 6, 8, 40; y0 = n0['pelvis']['rot'][1]
    coil = merge(n0, pelvis=pel(n0, (0, 0.02, -0.34), (18, -30, 0)), chest=add(n0['chest'], (10, -18, 0)), head=add(n0['head'], (-8, 40, 0)),
                 handR=R_((0.25, 0.10, 0.20), fwd=(0, 0.6, 0.8), back=(0.3, -0.9, 0.3), elbow=(0.6, -0.7, -0.3)), handL=P((0.10, 0.35, 0.10)), tail=(-14, 0), keys=K(n0, brow_angry=1.0))
    up = merge(n0, pelvis=pel(n0, (0, 0.16, 0.95), (-10, 0, 0)), spine=add(n0['spine'], (-8, 0, 0)), chest=add(n0['chest'], (-12, 10, 0)), head=add(n0['head'], (-18, 0, 0)),
               handR=W((-0.10, 0.30, 0.94), fwd=(0, 0.15, 1.0), back=(0.2, -1.0, 0.1), elbow=(0.7, 0.2, -0.6)), handL=P((0.10, -0.25, -0.30), fwd=(0, 0.2, -1.0), back=(0.9, 0.3, 0), elbow=(0.6, -0.8, 0)),
               footL=foot(n0, 'footL', (0, 0.30, 1.25), pitch=30, knee=0.2), footR=foot(n0, 'footR', (0, -0.05, 0.70), pitch=55), tail=(28, 0), jaw=14.0, keys=K(n0, brow_angry=1.0))
    peak = merge(up, pelvis=pel(n0, (0, 0.18, 1.10), (-6, 0, 0)), footR=foot(n0, 'footR', (0, -0.10, 0.92), pitch=60))
    fall = merge(n0, pelvis=pel(n0, (0, 0.12, 0.45), (4, 0, 0)), handR=W((-0.05, 0.40, 0.50), fwd=(0, 0.3, 1.0), back=(0.4, -0.8, 0.2), elbow=(0.7, -0.2, -0.6)),
                 footL=foot(n0, 'footL', (0, 0.10, 0.40), pitch=20), footR=foot(n0, 'footR', (0, 0.0, 0.34), pitch=30), tail=(22, 0))
    land = merge(n0, pelvis=pel(n0, (0, 0.06, -0.24), (14, 0, 0)), handR=P((0.15, 0.30, -0.10)), handL=P((0.20, 0.30, -0.15)), tail=(-12, 0))
    keys = [(0, n0), (3, coil, 'out'), (st, up, 'in'), (st + 4, peak, 'out'), (st + ac, peak, 'lin'), (22, fall, 'in'), (27, land, 'in'), (N, n0, 'io')]
    spin = [(0, 0), (3, 0, 'lin'), (st, 150, 'in'), (st + ac, 300, 'lin'), (22, 360, 'out'), (N, 360, 'lin')]
    return dict(frames=N, loop=False, fn=spun(cid, keys, spin), info=minfo(cid, 's2', '昇り拳', st, ac, N, attack_limb='pawR', anti_air=True, fx_anchor='pawR', visual_airborne_frames=[5, 26], visual_peak_height_leg=1.10,
                silhouette='右へ巻いて沈む(F3)→左回りに回りながら跳び、右拳は真上・前ひざは腹まで上がる(F6-14)→着地で深く沈む(F27)',
                note='旧 sp_rising_upper は小さく跳ねるだけだった。跳躍と回転はクリップ内の見た目で、当たり判定・無敵は現行のまま'))

def moguzo_s3(cid):
    """地走り: 体を地面と平行まで倒し、両手で土をかき分けて進み、最後に下から両の掌を突き上げる。"""
    n0 = neutral(cid); st, ac, N = 12, 5, 36
    def dig(lf, rf, lead):       # lf / rf: 左右の手の前後（脚の長さ単位）。lead: 前へ出ている足
        return merge(n0, pelvis=pel(n0, (0, 0.10, -0.52), (62, 0, 6 if lead == 'L' else -6)), spine=add(n0['spine'], (6, 0, 0)), chest=add(n0['chest'], (4, 10 if lf > rf else -10, 0)), neck=add(n0['neck'], (-26, 0, 0)), head=add(n0['head'], (-34, 24, 0)),
                     handL=R_((0.05, lf, 0.10 if lf > 1 else 0.42), fwd=(0, 1, -0.3), back=(0, 0.3, 1.0), elbow=(0.9, -0.3, 0.5)), handR=R_((0.10, rf, 0.10 if rf > 1 else 0.42), fwd=(0, 1, -0.3), back=(0, 0.3, 1.0), elbow=(0.9, -0.3, 0.5)),
                     footL=foot(n0, 'footL', (0.06, 0.30 if lead == 'L' else -0.45, 0), pitch=10 if lead == 'L' else 50), footR=foot(n0, 'footR', (0.06, 0.20 if lead == 'R' else -0.50, 0), pitch=10 if lead == 'R' else 50),
                     tail=(40, 0), jaw=4.0, keys=K(n0, paw_open_L=1.0, paw_open_R=1.0, brow_angry=1.0))
    a, b = dig(1.75, 0.55, 'L'), dig(0.55, 1.75, 'R')
    load = merge(a, pelvis=pel(n0, (0, 0.22, -0.48), (46, 0, 0)), handL=R_((-0.10, 0.80, 0.30), fwd=(0, 0.8, 0.6), back=(0, -0.6, 0.8)), handR=R_((-0.05, 0.80, 0.30), fwd=(0, 0.8, 0.6), back=(0, -0.6, 0.8)))
    burst = merge(n0, pelvis=pel(n0, (0, 0.52, -0.16), (20, 0, 0)), spine=add(n0['spine'], (4, 0, 0)), chest=add(n0['chest'], (6, 0, 0)), head=add(n0['head'], (-14, 24, 0)),
                  handL=W((-0.22, 0.90, 0.20), fwd=(0, 0.45, 0.9), back=(0, -0.9, 0.45), elbow=(0.85, -0.2, -0.45)), handR=W((-0.22, 0.94, 0.14), fwd=(0, 0.45, 0.9), back=(0, -0.9, 0.45), elbow=(0.85, -0.2, -0.45)),
                  footL=foot(n0, 'footL', (0, 0.62, 0)), footR=foot(n0, 'footR', (0, -0.05, 0), pitch=42), tail=(-18, 0), jaw=16.0, keys=K(n0, paw_open_L=1.0, paw_open_R=1.0, brow_angry=1.0))
    keys = [(0, n0), (2, a, 'out'), (5, b, 'io'), (8, a, 'io'), (10, load, 'out'), (st, burst, 'in'), (st + ac, merge(burst, pelvis=pel(n0, (0, 0.56, -0.12), (16, 0, 0))), 'lin'), (26, merge(burst, pelvis=pel(n0, (0, 0.30, -0.10), (10, 0, 0)), jaw=2.0), 'out'), (N, n0, 'io')]
    return dict(frames=N, loop=False, fn=keyed(keys), info=minfo(cid, 's3', '地走り', st, ac, N, attack_limb='pawL+pawR', fx_anchor='pawR', travel_frames=[0, st + ac],
                silhouette='体が地面と平行になるまで倒れ、左右の手で交互に土をかく(F2-8)→下から伸び上がって両の掌(F12)',
                note='旧 cmd_214（フック→裏拳。技名「地走り」と動きが合っていなかった）を置き換える。前進量はゲーム側の travel のまま'))

def moguzo_ult(cid):
    """大地烈掌（対戦中の始動）: 腰に右の掌を引き、深く踏み込んで胸へ掌底。当たればここからムービーへ。"""
    n0 = neutral(cid); st, ac, N = 8, 10, 50
    chamber = merge(n0, pelvis=pel(n0, (0, -0.10, -0.26), (10, -36, 0)), chest=add(n0['chest'], (4, -22, 0)), head=add(n0['head'], (-4, 46, 0)),
                    handR=P((0.12, -0.20, -0.42), fwd=(0, 0.9, 0.3), back=(0.9, 0, 0.3), elbow=(0.5, -0.8, -0.2)), handL=W((-0.08, 0.82, 0.10), fwd=(0, 0.5, 0.85), back=(0, -0.85, 0.5), elbow=(0.8, -0.2, -0.5)),
                    footL=foot(n0, 'footL', (0, 0.10, 0)), tail=(26, 0), keys=K(n0, paw_open_L=1.0, paw_open_R=1.0, brow_angry=1.0))
    palm = merge(n0, pelvis=pel(n0, (0, 0.52, -0.30), (14, 44, 0)), spine=add(n0['spine'], (2, 8, 0)), chest=add(n0['chest'], (4, 22, 0)), neck=add(n0['neck'], (0, -24, 0)), head=add(n0['head'], (-8, -44, 0)),
                 handR=W((-0.16, 0.97, 0.02), fwd=(0, 0.3, 0.95), back=(0, -0.95, 0.3), elbow=(0.85, -0.2, -0.45)), handL=P((0.15, -0.30, -0.35), fwd=(0, 0.9, 0.3), back=(0.9, 0, 0.3), elbow=(0.5, -0.8, -0.2)),
                 footL=foot(n0, 'footL', (0, 0.72, 0)), footR=foot(n0, 'footR', (0, 0.0, 0), pitch=30, knee=0.2), tail=(-16, 0), jaw=14.0, keys=K(n0, paw_open_R=1.0, paw_open_L=0.0, brow_angry=1.0))
    push = merge(palm, pelvis=pel(n0, (0, 0.58, -0.32), (16, 46, 0)))
    keys = [(0, n0), (5, chamber, 'out3'), (6, chamber, 'lin'), (st, palm, 'in'), (st + ac, push, 'lin'), (30, merge(palm, pelvis=pel(n0, (0, 0.30, -0.16), (8, 20, 0)), jaw=2.0), 'out'), (N, n0, 'io')]
    return dict(frames=N, loop=False, fn=keyed(keys), info=minfo(cid, 'ultimate', '大地烈掌', st, ac, N, attack_limb='pawR', fx_anchor='pawR', movie_on_hit='manifest/moguzo_ultimate.json',
                silhouette='右の掌を腰に引く(F5)→深い前屈立ちの掌底(F8-18)', note='旧 super（その場で跳んで両手を床へ）を置き換える。命中後のムービー1カット目はこの掌底の姿勢から始まる'))

# =====================================================================
# ゴダン（重量・装甲 / 岩）
# =====================================================================
def godan_s1(cid):
    """地割り: 両拳を腰に引いてのけぞり、手前の脚を前へ高く上げてから、一歩踏み下ろす。攻撃部位は足。"""
    n0 = neutral(cid); st, ac, N = 21, 5, 54
    arm = lambda o, f, u, op: P((o, f, u), fwd=(0.5, 0.3, 0.8), back=(0.3, -0.5, 0.8), elbow=(0.8, -0.3, -0.5))
    hip = lambda: P((0.42, -0.20, -0.30), fwd=(0, 0.9, 0.3), back=(0.9, 0, 0.3), elbow=(0.6, -0.8, 0.0))
    shift = merge(n0, pelvis=pel(n0, (0.10, -0.14, -0.20), (10, -8, 4)), chest=add(n0['chest'], (6, -4, 0)), handL=hip(), handR=hip(),
                  footR=foot(n0, 'footR', (0.05, 0.10, 0.10), pitch=20), tail=(-10, 0), keys=K(n0, brow_angry=1.0))
    high = merge(n0, pelvis=pel(n0, (0.14, -0.22, 0.22), (-24, -16, 6)), spine=add(n0['spine'], (-8, 0, 0)), chest=add(n0['chest'], (-12, -6, 0)), neck=add(n0['neck'], (-6, 8, 0)), head=add(n0['head'], (-16, 16, 0)),
                 handL=hip(), handR=hip(), footR=foot(n0, 'footR', (0.12, 0.80, 0.95), yaw=0, pitch=-30, knee=0.15, toe=0), footL=foot(n0, 'footL', (0, -0.04, 0), pitch=18, knee=0.2), tail=(-24, 0), jaw=12.0, keys=K(n0, brow_angry=1.0))
    top = merge(high, pelvis=pel(n0, (0.16, -0.26, 0.28), (-28, -18, 8)), footR=foot(n0, 'footR', (0.12, 0.92, 1.10), yaw=0, pitch=-36, knee=0.15, toe=0), jaw=18.0)
    stomp = merge(n0, pelvis=pel(n0, (-0.06, 0.40, -0.52), (26, 6, 0)), spine=add(n0['spine'], (8, 0, 0)), chest=add(n0['chest'], (10, 0, 0)), neck=add(n0['neck'], (-10, 0, 0)), head=add(n0['head'], (-26, 14, 0)),
                  handL=W((0.10, 0.62, -0.62), fwd=(0, 0.3, -0.95), back=(0, 0.95, 0.3), elbow=(0.9, -0.2, 0.3)), handR=W((0.10, 0.66, -0.62), fwd=(0, 0.3, -0.95), back=(0, 0.95, 0.3), elbow=(0.9, -0.2, 0.3)),
                  footR=foot(n0, 'footR', (0.30, 0.92, 0), yaw=14, knee=0.7), footL=foot(n0, 'footL', (0.10, 0.02, 0), knee=0.7), tail=(30, 0), jaw=18.0, keys=K(n0, brow_angry=1.0))
    rise = merge(stomp, pelvis=pel(n0, (-0.03, 0.30, -0.30), (14, 4, 0)), handL=P((0.40, 0.30, -0.25)), handR=P((0.40, 0.30, -0.25)), jaw=4.0, tail=(6, 0))
    keys = [(0, n0), (5, shift, 'out'), (12, high, 'out'), (18, top, 'lin'), (st, stomp, 'in3'), (st + ac, stomp, 'lin'), (40, rise, 'out'), (N, n0, 'io')]
    return dict(frames=N, loop=False, fn=keyed(keys), info=minfo(cid, 's1', '地割り', st, ac, N, attack_limb='footR', fx_anchor='footR', low_attack=True,
                silhouette='両拳を腰に引き、のけぞって立ち上がりながら手前の脚を前へ高く上げる(F12-18)→一歩前へ踏み下ろし、腰が落ちて両拳も下へ(F21)',
                note='旧 cmd_236（拳を床へ）を置き換える。下段・発生21Fは現行のまま。脚を上げる長い予備動作が発生の遅さと一致する'))

def godan_s2(cid):
    """岩砕き: 跳ばない対空。深くしゃがんで両拳を股の間へ下ろし、足を地面に付けたまま真上へ振り上げる。"""
    n0 = neutral(cid); st, ac, N = 11, 7, 49
    load = merge(n0, pelvis=pel(n0, (0, 0.06, -0.58), (34, 10, 0)), spine=add(n0['spine'], (10, 0, 0)), chest=add(n0['chest'], (12, 0, 0)), neck=add(n0['neck'], (-14, 0, 0)), head=add(n0['head'], (-30, 14, 0)),
                 handL=R_((-0.45, 0.75, 0.22), fwd=(-0.3, 0.3, -0.9), back=(0, 0.95, 0.3), elbow=(0.9, 0, 0.3)), handR=R_((-0.45, 0.80, 0.22), fwd=(-0.3, 0.3, -0.9), back=(0, 0.95, 0.3), elbow=(0.9, 0, 0.3)),
                 footL=foot(n0, 'footL', (0.12, 0.08, 0), knee=0.8), footR=foot(n0, 'footR', (0.12, 0, 0), knee=0.8), tail=(34, 0), keys=K(n0, brow_angry=1.0))
    crush = merge(n0, pelvis=pel(n0, (0, 0.26, 0.22), (-16, 10, 0)), spine=add(n0['spine'], (-10, 0, 0)), chest=add(n0['chest'], (-14, 0, 0)), neck=add(n0['neck'], (-6, 0, 0)), head=add(n0['head'], (-20, 14, 0)),
                  handL=W((-0.42, 0.42, 0.92), fwd=(-0.2, 0.25, 0.95), back=(0.2, -0.95, 0.2), elbow=(0.9, 0.3, -0.2)), handR=W((-0.42, 0.46, 0.92), fwd=(-0.2, 0.25, 0.95), back=(0.2, -0.95, 0.2), elbow=(0.9, 0.3, -0.2)),
                  footL=foot(n0, 'footL', (0.10, 0.20, 0), pitch=34), footR=foot(n0, 'footR', (0.10, 0, 0), pitch=40), tail=(-26, 0), jaw=18.0, keys=K(n0, brow_angry=1.0))
    spread = merge(n0, pelvis=pel(n0, (0, 0.14, -0.14), (6, 4, 0)), handL=P((0.85, 0.10, 0.30), fwd=(0.6, 0.2, 0.7), back=(0.3, -0.6, 0.7), elbow=(0.7, -0.5, -0.4)), handR=P((0.85, 0.10, 0.30), fwd=(0.6, 0.2, 0.7), back=(0.3, -0.6, 0.7), elbow=(0.7, -0.5, -0.4)),
                   footL=foot(n0, 'footL', (0.10, 0.12, 0)), footR=foot(n0, 'footR', (0.10, 0, 0)), tail=(8, 0), jaw=4.0, keys=K(n0, brow_angry=1.0))
    keys = [(0, n0), (6, load, 'out'), (8, load, 'lin'), (st, crush, 'in'), (st + ac, merge(crush, pelvis=pel(n0, (0, 0.28, 0.26), (-18, 10, 0))), 'lin'), (30, spread, 'out'), (N, n0, 'io')]
    return dict(frames=N, loop=False, fn=keyed(keys), info=minfo(cid, 's2', '岩砕き', st, ac, N, attack_limb='pawL+pawR', fx_anchor='pawR', anti_air=True, grounded=True,
                silhouette='股の間へ両拳を落として深くしゃがむ(F6-8)→かかとだけ浮かせ、背を反らせて両拳を頭上へ(F11-18)。足は地面から離れない',
                note='旧 cmd_623（跳び上がりアッパー。モグゾーの昇り拳と同型だった）を置き換える。装甲つき対空に合わせて「跳ばずに受けて砕く」形にした'))

def godan_s3(cid):
    """肩当て突進: 腕を胸の前で組んで受け(装甲)、後ろ足で地面をかいてから、頭を下げて肩から突っ込む。止まるときは前足で踏ん張る。"""
    n0 = neutral(cid); st, ac, N = 18, 7, 57
    brace = merge(n0, pelvis=pel(n0, (0, -0.22, -0.10), (-4, -6, 0)), chest=add(n0['chest'], (-2, -6, 0)), handL=P((-0.30, 0.42, 0.20), fwd=(-0.8, 0.2, 0.6), back=(0.2, 0.95, 0.2), elbow=(0.7, 0.3, -0.6)), handR=P((-0.30, 0.36, 0.05), fwd=(-0.8, 0.2, 0.6), back=(0.2, 0.95, 0.2), elbow=(0.7, 0.3, -0.6)),
                  footL=foot(n0, 'footL', (0, 0.06, 0)), footR=foot(n0, 'footR', (0, -0.20, 0)), tail=(-8, 0), keys=K(n0, brow_angry=1.0))
    paw = merge(brace, pelvis=pel(n0, (0, -0.10, -0.34), (24, -18, 0)), chest=add(n0['chest'], (10, -10, 0)), neck=add(n0['neck'], (-6, 14, 0)), head=add(n0['head'], (-4, 24, 0)),
                footR=foot(n0, 'footR', (0, -0.62, 0.12), pitch=46), tail=(20, 0))
    paw2 = merge(paw, footR=foot(n0, 'footR', (0, -0.20, 0), pitch=10), pelvis=pel(n0, (0, -0.04, -0.38), (28, -22, 0)))
    ram = merge(n0, pelvis=pel(n0, (0, 0.56, -0.34), (40, -44, -8)), spine=add(n0['spine'], (8, -10, 0)), chest=add(n0['chest'], (8, -18, -6)), neck=add(n0['neck'], (-6, 24, 0)), head=add(n0['head'], (-6, 44, 0)),
                handL=P((-0.34, 0.30, 0.02), fwd=(-0.3, 0.2, 0.9), back=(0.5, 0.85, 0.0), elbow=(0.6, 0.5, -0.6)), handR=P((0.30, -0.80, -0.05), fwd=(0, -0.9, -0.3), back=(0.9, 0, 0.3), elbow=(0.6, -0.7, 0.2)),
                footL=foot(n0, 'footL', (0, 0.70, 0)), footR=foot(n0, 'footR', (0, -0.10, 0), pitch=48), tail=(26, 0), jaw=12.0, keys=K(n0, brow_angry=1.0))
    skid = merge(n0, pelvis=pel(n0, (0, 0.30, -0.30), (2, -10, 0)), chest=add(n0['chest'], (-6, 0, 0)), handL=P((0.60, 0.25, 0.05)), handR=P((0.60, 0.20, 0.05)),
                 footL=foot(n0, 'footL', (0.06, 0.74, 0), pitch=-12), footR=foot(n0, 'footR', (0.10, 0.20, 0)), tail=(-22, 0), jaw=4.0, keys=K(n0, paw_open_L=1.0, paw_open_R=1.0, brow_angry=1.0))
    keys = [(0, n0), (5, brace, 'out'), (9, paw, 'io'), (13, paw2, 'io'), (st, ram, 'in'), (st + ac, merge(ram, pelvis=pel(n0, (0, 0.62, -0.36), (42, -46, -8))), 'lin'), (34, skid, 'out'), (42, skid, 'lin'), (N, n0, 'io')]
    return dict(frames=N, loop=False, fn=keyed(keys), info=minfo(cid, 's3', '肩当て突進', st, ac, N, attack_limb='shoulderL', fx_anchor='chest', travel_frames=[0, st + ac], armor_tell_frames=[3, st],
                silhouette='腕を胸の前で組む(F5)→後ろ足で地面をかく(F9-13)→頭を下げ、後ろ手を真後ろへ伸ばして肩から突っ込む(F18-25)→前足で踏ん張って止まる(F34)',
                note='旧 sp_shoulder_charge の強化。溜めの見せ場（腕組み＋足かき）と停止の踏ん張りを足した'))

def godan_ult(cid):
    """山崩し（対戦中の始動）: 後ろの拳を頭の後ろまで担ぎ、踏み込んで鉄槌を振り下ろす。当たればムービーへ。"""
    n0 = neutral(cid); st, ac, N = 10, 9, 57
    shoulder = merge(n0, pelvis=pel(n0, (0, -0.12, 0.06), (-12, -30, 0)), spine=add(n0['spine'], (-6, -8, 0)), chest=add(n0['chest'], (-10, -18, 0)), head=add(n0['head'], (0, 40, 0)),
                     handR=P((0.25, -0.35, 0.95), fwd=(0, -0.5, 0.85), back=(0.5, -0.8, -0.2), elbow=(0.8, -0.2, 0.5)), handL=W((0.0, 0.70, 0.20), fwd=(0, 0.6, 0.8), back=(0, -0.8, 0.6), elbow=(0.8, -0.2, -0.5)),
                     footL=foot(n0, 'footL', (0, 0.20, 0.30), pitch=-16, knee=0.3), tail=(26, 0), jaw=8.0, keys=K(n0, paw_open_L=1.0, brow_angry=1.0))
    hammer = merge(n0, pelvis=pel(n0, (0, 0.48, -0.36), (30, 30, 0)), spine=add(n0['spine'], (8, 6, 0)), chest=add(n0['chest'], (10, 16, 0)), neck=add(n0['neck'], (-8, -14, 0)), head=add(n0['head'], (-22, -26, 0)),
                   handR=W((-0.16, 0.90, -0.08), fwd=(0, 0.2, -1.0), back=(0, 1.0, 0.2), elbow=(0.9, -0.2, 0.3)), handL=P((0.30, -0.40, -0.20)),
                   footL=foot(n0, 'footL', (0, 0.78, 0), knee=0.5), footR=foot(n0, 'footR', (0, 0.0, 0), pitch=36), tail=(-20, 0), jaw=18.0, keys=K(n0, brow_angry=1.0))
    keys = [(0, n0), (6, shoulder, 'out3'), (7, shoulder, 'lin'), (st, hammer, 'in3'), (st + ac, merge(hammer, pelvis=pel(n0, (0, 0.50, -0.42), (32, 30, 0))), 'lin'), (36, merge(hammer, pelvis=pel(n0, (0, 0.30, -0.20), (14, 10, 0)), jaw=2.0), 'out'), (N, n0, 'io')]
    return dict(frames=N, loop=False, fn=keyed(keys), info=minfo(cid, 'ultimate', '山崩し', st, ac, N, attack_limb='pawR', fx_anchor='pawR', movie_on_hit='manifest/godan_ultimate.json',
                silhouette='拳を頭の後ろまで担いで前足を上げる(F6)→踏み込んで鉄槌を胸の高さへ振り下ろす(F10-19)', note='旧 super（両拳の振り下ろし）を片手の鉄槌に変えた。命中後のムービーはこの姿勢から続く'))

# =====================================================================
# チルカ（奇襲・フェイント / 幻惑）
# =====================================================================
def chirka_s1(cid):
    """だまし突き: 手前の手を高く掲げて見せ（おとり）、その下から奥の手の貫手を低く突き刺す。"""
    n0 = neutral(cid); st, ac, N = 13, 4, 36
    decoy = merge(n0, pelvis=pel(n0, (0, -0.10, 0.10), (-14, -10, 0)), spine=add(n0['spine'], (-4, 0, 0)), chest=add(n0['chest'], (-8, -10, 0)), neck=add(n0['neck'], (-10, 0, 0)), head=add(n0['head'], (-22, 20, -10)),
                  handR=P((0.34, 0.25, 0.98), fwd=(0, 0.5, 0.85), back=(0, -0.85, 0.5), elbow=(0.9, -0.2, -0.2)), handL=P((0.10, -0.15, -0.50), fwd=(0, 0.9, -0.2), back=(0.9, 0, 0.3), elbow=(0.5, -0.8, -0.2)),
                  footL=foot(n0, 'footL', (0, -0.06, 0), pitch=14), tail=(40, 20), jaw=6.0, keys=K(n0, paw_open_R=1.0, paw_open_L=1.0, brow_angry=0.0))
    wiggle = merge(decoy, handR=P((0.20, 0.42, 0.92), fwd=(0.3, 0.5, 0.8), back=(0, -0.85, 0.5), elbow=(0.9, -0.2, -0.2)), head=add(n0['head'], (-24, 20, 12)), tail=(40, -20))
    stab = merge(n0, pelvis=pel(n0, (0, 0.52, -0.24), (16, -40, 0)), spine=add(n0['spine'], (4, -6, 0)), chest=add(n0['chest'], (2, -16, 0)), neck=add(n0['neck'], (-6, 14, 0)), head=add(n0['head'], (-12, 34, 14)),
                handL=W((-0.06, 0.98, -0.16), fwd=(0, 1.0, 0), back=(0, 0, 1.0), elbow=(0.9, -0.2, -0.3)), handR=P((0.50, -0.25, 0.80), fwd=(0.3, -0.2, 0.9), back=(0, -0.9, 0.3), elbow=(0.9, -0.3, -0.1)),
                footL=foot(n0, 'footL', (0, 0.62, 0)), footR=foot(n0, 'footR', (0, 0.0, 0), pitch=46), tail=(-24, 0), jaw=10.0, keys=K(n0, paw_open_L=1.0, paw_open_R=1.0, brow_angry=1.0))
    back_ = merge(n0, pelvis=pel(n0, (0, 0.22, -0.18), (14, -14, 0)), handL=P((0.10, 0.50, -0.20)), handR=P((0.30, 0.10, 0.40)), footL=foot(n0, 'footL', (0, 0.36, 0)), tail=(10, 10), keys=K(n0, paw_open_L=0.5, paw_open_R=0.5, brow_angry=0.6))
    keys = [(0, n0), (4, decoy, 'out3'), (7, wiggle, 'io'), (10, decoy, 'io'), (st, stab, 'in3'), (st + ac, merge(stab, pelvis=pel(n0, (0, 0.56, -0.26), (18, -42, 0))), 'lin'), (26, back_, 'out'), (N, n0, 'io')]
    return dict(frames=N, loop=False, fn=keyed(keys), info=minfo(cid, 's1', 'だまし突き', st, ac, N, attack_limb='pawL', fx_anchor='pawL', decoy_limb='pawR', feint_window_frames=[2, st - 1],
                silhouette='背伸びして手前の手を頭上で開いて見せる(F4-10)→一気に沈み、奥の手の貫手が腹の高さへ伸びる(F13)。掲げた手は上に残る',
                note='旧 cmd_236（低い片手の掌）を置き換える。フェイント受付(F2〜発生前)の間は「掲げた手」だけが見える'))

def chirka_s2(cid):
    """跳ね爪: 四つ足まで沈み、ばねのように跳ねて一回転しながら爪を下から上へかき上げる。"""
    n0 = neutral(cid); st, ac, N = 8, 7, 40
    four = merge(n0, pelvis=pel(n0, (0, 0.0, -0.50), (58, 0, 0)), chest=add(n0['chest'], (6, 0, 0)), neck=add(n0['neck'], (-24, 0, 0)), head=add(n0['head'], (-34, 30, 0)),
                 handL=R_((0.0, 1.45, 0.08), fwd=(0, 1, -0.2), back=(0, 0.2, 1.0), elbow=(0.9, -0.3, 0.5)), handR=R_((0.05, 1.30, 0.08), fwd=(0, 1, -0.2), back=(0, 0.2, 1.0), elbow=(0.9, -0.3, 0.5)),
                 footL=foot(n0, 'footL', (0.05, -0.10, 0), pitch=40), footR=foot(n0, 'footR', (0.05, 0.0, 0), pitch=44), tail=(60, 0), keys=K(n0, paw_open_L=1.0, paw_open_R=1.0, brow_angry=1.0))
    rake = merge(n0, pelvis=pel(n0, (0, 0.18, 1.05), (-14, 0, 0)), spine=add(n0['spine'], (-8, 0, 0)), chest=add(n0['chest'], (-12, 0, 0)), head=add(n0['head'], (-16, 0, 0)),
                 handR=W((-0.05, 0.38, 0.92), fwd=(0, 0.5, 0.85), back=(0, -0.85, 0.5), elbow=(0.8, 0.2, -0.5)), handL=P((0.30, -0.10, -0.40), fwd=(0, 0.3, -0.9), back=(0.9, 0.3, 0)),
                 footL=foot(n0, 'footL', (0.10, 0.20, 1.05), pitch=40, knee=0.6), footR=foot(n0, 'footR', (0.10, -0.10, 0.80), pitch=60, knee=0.6), tail=(-30, 0), jaw=12.0, keys=K(n0, paw_open_R=1.0, paw_open_L=1.0, brow_angry=1.0))
    top = merge(rake, pelvis=pel(n0, (0, 0.20, 1.22), (-8, 0, 0)), handR=W((0.25, -0.10, 0.90), fwd=(0, -0.3, 0.95), back=(0, -0.95, -0.3), elbow=(0.8, 0.2, -0.5)), footR=foot(n0, 'footR', (0.10, -0.10, 1.00), pitch=60, knee=0.6), tail=(10, 0))
    fall = merge(n0, pelvis=pel(n0, (0, 0.10, 0.50), (10, 0, 0)), handL=P((0.40, 0.20, 0.30)), handR=P((0.40, 0.20, 0.30)), footL=foot(n0, 'footL', (0, 0.10, 0.45), pitch=20), footR=foot(n0, 'footR', (0, 0, 0.40), pitch=30), tail=(30, 0), keys=K(n0, paw_open_L=1.0, paw_open_R=1.0))
    land = merge(four, pelvis=pel(n0, (0, 0.04, -0.40), (44, 0, 0)), tail=(-10, 0))
    keys = [(0, n0), (4, four, 'out'), (5, four, 'lin'), (st, rake, 'in'), (st + 4, top, 'out'), (st + ac, top, 'lin'), (23, fall, 'in'), (27, land, 'in'), (31, land, 'lin'), (N, n0, 'io')]
    spin = [(0, 0), (5, 0, 'lin'), (st, 110, 'in'), (st + ac, 290, 'lin'), (23, 360, 'out'), (N, 360, 'lin')]
    return dict(frames=N, loop=False, fn=spun(cid, keys, spin), info=minfo(cid, 's2', '跳ね爪', st, ac, N, attack_limb='pawR', fx_anchor='pawR', anti_air=True, visual_airborne_frames=[6, 26], visual_peak_height_leg=1.22,
                silhouette='両手を床について四つ足(F4)→跳ねて一回転、開いた爪が下から頭上へ(F8-15)→四つ足で着地(F27)',
                note='旧 cmd_623（蹴り上げ）を置き換える。モグゾーの昇り拳（拳・ひざ）と分けるため、始まりと終わりが四つ足で、手は開いた爪'))

def chirka_s3(cid):
    """影引き爪: 大きくのけぞって下がる（誘い）→地を這う長い踏み込みで爪を引っかけ、体ごと手前へ引き戻す。"""
    n0 = neutral(cid); st, ac, N = 13, 5, 40
    sway = merge(n0, pelvis=pel(n0, (0, -0.40, 0.06), (-30, 14, 0)), spine=add(n0['spine'], (-8, 0, 0)), chest=add(n0['chest'], (-12, 8, 0)), neck=add(n0['neck'], (8, 0, 0)), head=add(n0['head'], (10, -10, -12)),
                 handL=P((0.45, 0.10, 0.50), fwd=(0.3, 0.3, 0.9), back=(0.8, -0.5, 0)), handR=P((0.50, 0.00, 0.55), fwd=(0.3, 0.3, 0.9), back=(0.8, -0.5, 0)),
                 footL=foot(n0, 'footL', (0, -0.05, 0.14), pitch=-24), footR=foot(n0, 'footR', (0, -0.20, 0)), tail=(26, 30), keys=K(n0, paw_open_L=0.6, paw_open_R=0.6, brow_angry=0.0))
    hook = merge(n0, pelvis=pel(n0, (0, 0.66, -0.50), (50, 34, 0)), spine=add(n0['spine'], (10, 8, 0)), chest=add(n0['chest'], (10, 18, 0)), neck=add(n0['neck'], (-20, -16, 0)), head=add(n0['head'], (-36, -30, 0)),
                 handR=W((-0.12, 0.98, -0.20), fwd=(0, 0.8, -0.6), back=(0.3, 0.5, 0.8), elbow=(0.9, -0.3, 0.1)), handL=P((0.40, -0.70, 0.10), fwd=(0, -0.9, 0.2), back=(0.9, 0, 0.3)),
                 footL=foot(n0, 'footL', (0, 0.80, 0)), footR=foot(n0, 'footR', (0, -0.12, 0), pitch=50), tail=(30, -20), jaw=10.0, keys=K(n0, paw_open_R=1.0, paw_open_L=1.0, brow_angry=1.0))
    pull = merge(n0, pelvis=pel(n0, (0, 0.26, -0.22), (8, -30, 0)), chest=add(n0['chest'], (-4, -24, 0)), head=add(n0['head'], (-8, 50, 0)),
                 handR=P((-0.10, 0.05, 0.10), fwd=(-0.6, 0.2, 0.7), back=(0.2, 0.9, 0.2), elbow=(0.7, -0.6, -0.3)), handL=P((0.30, 0.30, 0.20)),
                 footL=foot(n0, 'footL', (0, 0.50, 0)), footR=foot(n0, 'footR', (0, -0.05, 0), pitch=20), tail=(-10, 30), jaw=2.0, keys=K(n0, paw_open_R=0.0, paw_open_L=0.6, brow_angry=1.0))
    keys = [(0, n0), (6, sway, 'out3'), (9, merge(sway, pelvis=pel(n0, (0, -0.44, 0.04), (-32, 14, 0))), 'lin'), (st, hook, 'in3'), (st + 2, hook, 'lin'), (st + ac + 2, pull, 'out'), (28, pull, 'lin'), (N, n0, 'io')]
    return dict(frames=N, loop=False, fn=keyed(keys), info=minfo(cid, 's3', '影引き爪', st, ac, N, attack_limb='pawR', fx_anchor='pawR', travel_frames=[0, st + ac], feint_window_frames=[2, st - 1],
                silhouette='のけぞって後ろへ下がる(F6-9)→体が床と平行になるほど低く長い踏み込みで爪が届く(F13)→爪を胸元へ引き戻しながら体を返す(F20)',
                note='旧 sp_feint_claw の作り直し。「引き」の名前どおり、当ててから引き戻す動きを足した'))

def chirka_ult(cid):
    """百面本命打ち（対戦中の始動）: 奥の手で顔を隠し（面）、横向きに踏み込んで手前の掌を突き出す。当たればムービーへ。"""
    n0 = neutral(cid); st, ac, N = 9, 11, 50
    mask = merge(n0, pelvis=pel(n0, (0, -0.06, -0.10), (4, 30, 0)), chest=add(n0['chest'], (0, 14, 0)), head=add(n0['head'], (4, -30, 0)),
                 handL=P((-0.30, 0.50, 0.50), fwd=(-0.3, 0.1, 0.95), back=(0.2, 0.95, 0.1), elbow=(0.8, 0.1, -0.5)), handR=P((0.20, -0.30, -0.30), fwd=(0, 0.9, 0.3), back=(0.9, 0, 0.3), elbow=(0.5, -0.8, -0.2)),
                 tail=(36, -24), keys=K(n0, paw_open_L=1.0, paw_open_R=1.0, blink=1.0, brow_angry=0.0))
    strike = merge(n0, pelvis=pel(n0, (0, 0.52, -0.26), (10, 62, 0)), chest=add(n0['chest'], (2, 24, 0)), neck=add(n0['neck'], (0, -30, 0)), head=add(n0['head'], (-6, -50, 0)),
                   handR=W((-0.10, 0.97, 0.06), fwd=(0, 0.35, 0.94), back=(0, -0.94, 0.35), elbow=(0.85, -0.2, -0.45)), handL=P((-0.30, 0.45, 0.48), fwd=(-0.3, 0.1, 0.95), back=(0.2, 0.95, 0.1), elbow=(0.8, 0.1, -0.5)),
                   footL=foot(n0, 'footL', (0, 0.66, 0)), footR=foot(n0, 'footR', (0, 0.0, 0), pitch=38), tail=(-20, 20), jaw=6.0, keys=K(n0, paw_open_L=1.0, paw_open_R=1.0, brow_angry=1.0))
    keys = [(0, n0), (5, mask, 'out3'), (6, mask, 'lin'), (st, strike, 'in3'), (st + ac, merge(strike, pelvis=pel(n0, (0, 0.56, -0.28), (10, 64, 0))), 'lin'), (32, merge(strike, pelvis=pel(n0, (0, 0.28, -0.14), (6, 20, 0)), handL=P((0.10, 0.40, 0.10))), 'out'), (N, n0, 'io')]
    return dict(frames=N, loop=False, fn=keyed(keys), info=minfo(cid, 'ultimate', '百面本命打ち', st, ac, N, attack_limb='pawR', fx_anchor='pawR', movie_on_hit='manifest/chirka_ultimate.json',
                silhouette='奥の手で顔を隠して目を閉じる(F5)→横向きに踏み込み、手前の掌を胸の高さへ(F9-20)。顔を隠す手はそのまま',
                note='旧 super（三連のまどわし→本命）を、命中確認用の一撃に絞った。分身と本命の芝居は命中後のムービー側で行う'))


# =====================================================================
# 奥義ヒット後ムービー用の演技（クリップ時刻 = ムービー秒 × 60）。
# 役者はその場で演技し、ステージ上の移動・上昇・宙返りは manifest の actorTracks.root が受け持つ。
# 受け手（cinv_*）は体格に依らない書き方なので 9 体すべてに同じ芝居が入る。
# =====================================================================
def T(sec): return int(round(sec * 60))
def cinfo14(role, movie, N, shots, **kw):
    return dict(group='cinematic', priority=3, start_pose='contact', end_pose='finish' if role == 'attacker' else 'down', v2=True, v14=True, provisional=True,
                role=role, movie=movie, sync='clip_time = movie_seconds', root_motion='manifest actorTracks', shot_frames=shots, **kw)

# ---- 受け手の共通ポーズ ----
def V_(cid):
    n0 = neutral(cid); d = _down(cid); G = V2.GUARD(cid)
    fold = merge(n0, pelvis=pel(n0, (0, -0.22, -0.16), (32, 6, 0)), spine=add(n0['spine'], (14, 0, 0)), chest=add(n0['chest'], (18, 0, 0)), neck=add(n0['neck'], (10, 0, 0)), head=add(n0['head'], (24, 0, 0)),
                 handL=P((-0.20, 0.42, -0.42), fwd=(-0.7, 0.3, -0.3), back=(0, 0.9, 0.3), elbow=(0.9, -0.2, -0.2)), handR=P((-0.20, 0.38, -0.46), fwd=(-0.7, 0.3, -0.3), back=(0, 0.9, 0.3), elbow=(0.9, -0.2, -0.2)),
                 footL=foot(n0, 'footL', (0, -0.14, 0), pitch=-12), footR=foot(n0, 'footR', (0, -0.22, 0)), tail=(34, 0), jaw=20.0, keys=K(n0, blink=1.0, brow_angry=0.0, paw_open_L=0.6, paw_open_R=0.6))
    reel = merge(n0, pelvis=pel(n0, (0, -0.28, -0.04), (-20, 18, -4)), spine=add(n0['spine'], (-8, 6, 0)), chest=add(n0['chest'], (-14, 14, 4)), neck=add(n0['neck'], (-6, 6, 0)), head=add(n0['head'], (-18, 20, 8)),
                 handL=P((0.45, -0.10, 0.45), fwd=(0.4, 0.2, 0.9), back=(0.8, -0.5, 0)), handR=P((0.55, -0.20, 0.30), fwd=(0.4, 0.2, 0.9), back=(0.8, -0.5, 0)),
                 footL=foot(n0, 'footL', (0, -0.06, 0), pitch=-14), footR=foot(n0, 'footR', (0.02, -0.26, 0)), tail=(26, 20), jaw=18.0, keys=K(n0, blink=1.0, brow_angry=0.0, paw_open_L=1.0, paw_open_R=1.0))
    air = merge(n0, pelvis=pel(n0, (0, 0, 0.20), (-34, 0, 0)), spine=add(n0['spine'], (-10, 0, 0)), chest=add(n0['chest'], (-16, 0, 0)), head=add(n0['head'], (-22, 0, 10)),
                handL=P((0.75, 0.10, 0.55), fwd=(0.6, 0.2, 0.7), back=(0.3, -0.9, 0)), handR=P((0.80, -0.05, 0.40), fwd=(0.6, 0.2, 0.7), back=(0.3, -0.9, 0)),
                footL=foot(n0, 'footL', (0.20, 0.45, 0.55), pitch=30, knee=0.5), footR=foot(n0, 'footR', (0.25, -0.05, 0.40), pitch=50, knee=0.5), tail=(44, 0), jaw=22.0, keys=K(n0, blink=1.0, brow_angry=0.0, paw_open_L=1.0, paw_open_R=1.0))
    curl = merge(n0, pelvis=pel(n0, (0, 0, 0.25), (30, 0, 0)), spine=add(n0['spine'], (16, 0, 0)), chest=add(n0['chest'], (18, 0, 0)), head=add(n0['head'], (20, 0, 0)),
                 handL=P((0.10, 0.55, -0.25)), handR=P((0.10, 0.50, -0.30)), footL=foot(n0, 'footL', (0.10, 0.50, 0.85), pitch=20, knee=0.6), footR=foot(n0, 'footR', (0.10, 0.35, 0.75), pitch=30, knee=0.6),
                 tail=(-30, 0), jaw=10.0, keys=K(n0, blink=1.0, brow_angry=0.3))
    knees = merge(n0, pelvis=pel(n0, (0, 0.04, -0.60), (30, 0, 0)), spine=add(n0['spine'], (12, 0, 0)), chest=add(n0['chest'], (14, 0, 0)), neck=add(n0['neck'], (8, 0, 0)), head=add(n0['head'], (22, 0, 8)),
                  handL=R_((0.10, 1.00, 0.06), fwd=(0, 1, 0), back=(0, 0, 1.0), elbow=(0.9, -0.2, 0.4)), handR=R_((0.15, 0.90, 0.06), fwd=(0, 1, 0), back=(0, 0, 1.0), elbow=(0.9, -0.2, 0.4)),
                  footL=foot(n0, 'footL', (0.08, -0.20, 0), pitch=50), footR=foot(n0, 'footR', (0.08, -0.30, 0), pitch=55), tail=(40, 0), jaw=16.0, keys=K(n0, blink=1.0, brow_angry=0.0, paw_open_L=1.0, paw_open_R=1.0))
    def look(yaw, pit=0, arms=0.0, eyes=0.0, jaw=6.0):        # きょろきょろ: yaw 左+ / pit 上が負 / arms 0=構え 1=腕を開いて戸惑う
        return merge(n0, pelvis=pel(n0, (0, -0.06, -0.06), (-4, yaw * 0.25, 0)), chest=add(n0['chest'], (-4, yaw * 0.3, 0)), neck=add(n0['neck'], (pit * 0.4, yaw * 0.25, 0)), head=add(n0['head'], (pit * 0.6, yaw * 0.45, -yaw * 0.12)),
                     handL=hand(n0, 'handL', (0.30 * arms, -0.20 * arms, -0.10 * arms)), handR=hand(n0, 'handR', (0.35 * arms, -0.15 * arms, -0.15 * arms)), tail=(20, yaw * 0.4), jaw=jaw,
                     keys=K(n0, blink=eyes, brow_angry=0.0, paw_open_L=arms, paw_open_R=arms))
    over = merge(n0, pelvis=pel(n0, (0, -0.04, -0.26), (-10, 0, 0)), chest=add(n0['chest'], (-10, 0, 0)), neck=add(n0['neck'], (-14, 0, 0)), head=add(n0['head'], (-30, 0, 0)),          # 頭上をかばう
                 handL=P((-0.10, 0.30, 0.85), fwd=(-0.8, 0.1, 0.5), back=(0, -0.3, 0.95), elbow=(0.9, 0.2, -0.2)), handR=P((-0.10, 0.36, 0.80), fwd=(-0.8, 0.1, 0.5), back=(0, -0.3, 0.95), elbow=(0.9, 0.2, -0.2)), tail=(-20, 0), jaw=12.0, keys=K(n0, blink=1.0))
    arch = merge(n0, pelvis=pel(n0, (0, 0.22, 0.10), (-36, 0, 0)), spine=add(n0['spine'], (-16, 0, 0)), chest=add(n0['chest'], (-20, 0, 0)), neck=add(n0['neck'], (-10, 0, 0)), head=add(n0['head'], (-26, 0, 0)),           # 背中を打たれて弓なり
                 handL=P((0.60, -0.50, 0.20), fwd=(0.3, -0.8, 0.3), back=(0.8, 0.3, 0.3)), handR=P((0.65, -0.55, 0.10), fwd=(0.3, -0.8, 0.3), back=(0.8, 0.3, 0.3)),
                 footL=foot(n0, 'footL', (0.05, -0.20, 0.20), pitch=40), footR=foot(n0, 'footR', (0.08, -0.40, 0.30), pitch=50), tail=(50, 0), jaw=24.0, keys=K(n0, blink=1.0, paw_open_L=1.0, paw_open_R=1.0))
    dflop = merge(d, pelvis=dict(pos=add(d['pelvis']['pos'], (0, 0, 0.16)), rot=(-74, 0, 0)), head=(22, 0, 0), jaw=20.0)       # 仰向けで手足が跳ねる
    dv = merge(d, pelvis=dict(pos=add(d['pelvis']['pos'], (0, 0, 0.10)), rot=(-84, 0, 0)), spine=(20, 0, 0), chest=(24, 0, 0), head=(30, 0, 0), jaw=24.0,           # 宙で仰向け・くの字（上から叩かれた瞬間）
               footL=dict(pos=(0.10, 0.50, 0.75), yaw=10, pitch=10, knee=0.3, toe=0, pivot='ankle'), footR=dict(pos=(0.12, 0.70, 0.85), yaw=10, pitch=10, knee=0.3, toe=0, pivot='ankle'))
    return dict(n0=n0, d=d, G=G, fold=fold, reel=reel, air=air, curl=curl, knees=knees, look=look, over=over, arch=arch, dflop=dflop, dv=dv)

# 以下 3 本は ULTIMATE_10S_DIRECTION.md（本人指定）に合わせた約10秒版。ヒットストップ（演出上の止め）は「同じ姿勢のキーを2つ置く」ことでクリップに焼き込んである。
def hold(keys, t0, t1, pose, ease_in='in3', push=None):
    """t0 で pose に入り、t1 までほぼ止める（ヒットストップ）。push があれば止めの間にその姿勢へわずかに押し込む"""
    keys += [(T(t0), pose, ease_in), (T(t1), push or pose, 'lin')]

# ---------------- モグゾー「大地烈掌」 10.0s: 地上アッパー → 回転跳びの二段目で高く打ち上げ ----------------
MOGUZO_SHOTS = [0, T(1.1), T(2.3), T(3.4), T(4.6), T(5.8), T(7.2), T(8.6), T(10.0)]
def cin_moguzo_atk(cid):
    n0 = neutral(cid); N = T(10.0); ult = moguzo_ult(cid)['fn']; palm = plain(ult(18)); s2 = moguzo_s2(cid)['fn']
    low = merge(n0, pelvis=pel(n0, (0, 0.10, -0.56), (26, -34, 0)), chest=add(n0['chest'], (8, -20, 0)), neck=add(n0['neck'], (-16, 16, 0)), head=add(n0['head'], (-34, 44, 0)),
                handR=R_((0.35, -0.40, 0.14), fwd=(0, 0.6, 0.8), back=(0.3, -0.9, 0.3), elbow=(0.6, -0.8, 0.2)), handL=P((0.05, 0.50, 0.10)), footL=foot(n0, 'footL', (0.04, 0.40, 0), knee=0.6), footR=foot(n0, 'footR', (0.06, -0.10, 0), knee=0.6, pitch=30),
                tail=(34, 0), jaw=2.0, keys=K(n0, brow_angry=1.0))
    up1 = merge(n0, pelvis=pel(n0, (0, 0.36, 0.30), (-16, 30, 0)), spine=add(n0['spine'], (-8, 6, 0)), chest=add(n0['chest'], (-12, 16, 0)), neck=add(n0['neck'], (-8, -12, 0)), head=add(n0['head'], (-22, -30, 0)),
                handR=W((-0.12, 0.50, 0.90), fwd=(0, 0.15, 1.0), back=(0.2, -1.0, 0.1), elbow=(0.7, 0.2, -0.6)), handL=P((0.15, -0.25, -0.35), fwd=(0, 0.9, 0.2), back=(0.9, 0, 0.3), elbow=(0.6, -0.8, 0)),
                footL=foot(n0, 'footL', (0.02, 0.50, 0), pitch=34), footR=foot(n0, 'footR', (0.04, 0.05, 0), pitch=44), tail=(-26, 0), jaw=18.0, keys=K(n0, brow_angry=1.0))
    up1b = merge(up1, pelvis=pel(n0, (0, 0.38, 0.36), (-18, 32, 0)))
    follow = merge(up1, pelvis=pel(n0, (0, 0.30, 0.10), (-6, 20, 0)), handR=P((0.20, 0.10, 0.95), fwd=(0, -0.1, 1.0), back=(0.3, -0.9, 0.2), elbow=(0.9, -0.2, 0.1)), jaw=6.0)
    coil2 = merge(n0, pelvis=pel(n0, (0, 0.16, -0.66), (34, -52, 0)), spine=add(n0['spine'], (8, -8, 0)), chest=add(n0['chest'], (10, -20, 0)), neck=add(n0['neck'], (-22, 20, 0)), head=add(n0['head'], (-46, 60, 0)),
                  handR=R_((0.40, -1.00, 0.10), fwd=(0, 0.5, -0.85), back=(0, -0.85, -0.5), elbow=(0.7, -0.7, 0.3)), handL=R_((-0.05, 1.20, 0.08), fwd=(0, 1, -0.2), back=(0, 0.2, 1.0), elbow=(0.9, -0.3, 0.5)),
                  footL=foot(n0, 'footL', (0.06, 0.36, 0), knee=0.7), footR=foot(n0, 'footR', (0.08, -0.20, 0), knee=0.7, pitch=40), tail=(44, 0), jaw=4.0, keys=K(n0, paw_open_L=1.0, brow_angry=1.0))
    coil2b = merge(coil2, pelvis=pel(n0, (0, 0.16, -0.72), (36, -56, 0)))
    up2, peak, fall = plain(s2(6)), plain(s2(12)), plain(s2(22))
    for q in (up2, peak, fall): q['pelvis'] = dict(pos=(q['pelvis']['pos'][0], q['pelvis']['pos'][1], 0.30), rot=(q['pelvis']['rot'][0], n0['pelvis']['rot'][1], 0))      # 高さと回転は root と spin が受け持つ
    for q in (up2, peak): q['footL'] = foot(n0, 'footL', (0, 0.30, 0.62), pitch=30, knee=0.2); q['footR'] = foot(n0, 'footR', (0, -0.05, 0.10), pitch=55)
    fall['footL'] = foot(n0, 'footL', (0, 0.10, 0.20), pitch=20); fall['footR'] = foot(n0, 'footR', (0, 0.0, 0.10), pitch=30)
    apex = merge(peak, pelvis=dict(pos=(0, 0.10, 0.30), rot=(-22, n0['pelvis']['rot'][1], 0)), spine=add(n0['spine'], (-12, 0, 0)), chest=add(n0['chest'], (-18, 10, 0)), jaw=24.0, footR=foot(n0, 'footR', (0, -0.40, 0.05), pitch=60))
    land = merge(n0, pelvis=pel(n0, (0, 0.20, -0.62), (30, -10, 0)), chest=add(n0['chest'], (10, -6, 0)), neck=add(n0['neck'], (6, 0, 0)), head=add(n0['head'], (14, 20, 0)),
                 handR=R_((0.05, 1.30, 0.08), fwd=(0, 0.3, -0.95), back=(0, 0.95, 0.3), elbow=(0.9, -0.2, 0.4)), handL=P((0.45, -0.50, 0.10), fwd=(0.3, -0.8, 0.3), back=(0.8, 0.3, 0.3)),
                 footL=foot(n0, 'footL', (0.08, 0.50, 0), knee=0.7), footR=foot(n0, 'footR', (0.10, -0.20, 0), knee=0.7, pitch=50), tail=(30, 0), jaw=0.0, keys=K(n0, brow_angry=1.0, blink=1.0))
    stand = merge(n0, pelvis=pel(n0, (0, 0.20, -0.06), (0, -30, 0)), chest=add(n0['chest'], (-4, -16, 0)), head=add(n0['head'], (0, 10, 0)), handR=P((0.25, 0.20, -0.30)), handL=P((0.25, 0.10, -0.35)), footL=foot(n0, 'footL', (0.02, 0.30, 0)), footR=foot(n0, 'footR', (0.04, 0.10, 0)), keys=K(n0, brow_angry=0.8))
    fist = merge(n0, pelvis=pel(n0, (0, 0.20, 0.04), (-8, -58, 0)), spine=add(n0['spine'], (-4, -6, 0)), chest=add(n0['chest'], (-10, -14, 0)), neck=add(n0['neck'], (-4, 6, 0)), head=add(n0['head'], (-8, 12, 0)),
                 handR=P((0.20, 0.05, 1.00), fwd=(0, 0.1, 1.0), back=(1.0, 0, 0), elbow=(0.9, -0.3, -0.1)), handL=P((0.30, -0.10, -0.42), fwd=(0, 0.9, 0.2), back=(0.9, 0, 0.3), elbow=(0.6, -0.8, 0)),
                 footL=foot(n0, 'footL', (0.04, 0.32, 0)), footR=foot(n0, 'footR', (0.08, 0.08, 0)), tail=(24, 0), jaw=14.0, keys=K(n0, brow_angry=1.0))
    calm = merge(fist, jaw=0.0, head=add(n0['head'], (-4, 12, 0)), keys=K(n0, brow_angry=0.4), tail=(8, 0))
    keys = [(0, palm), (T(.30), palm, 'lin'), (T(.90), low, 'io'), (T(1.38), merge(low, pelvis=pel(n0, (0, 0.10, -0.62), (28, -38, 0))), 'lin')]
    hold(keys, 1.50, 2.00, up1, 'in3', up1b)
    keys += [(T(2.30), follow, 'out'), (T(2.75), coil2, 'io'), (T(3.50), coil2b, 'lin')]
    hold(keys, 3.70, 4.10, up2, 'in3')
    keys += [(T(4.60), peak, 'out'), (T(5.80), peak, 'lin')]
    hold(keys, 5.90, 6.60, apex, 'out')
    keys += [(T(7.30), fall, 'io'), (T(7.60), land, 'in'), (T(8.40), land, 'lin'), (T(8.90), stand, 'io'), (T(9.20), fist, 'out3'), (T(9.60), fist, 'lin'), (N, calm, 'io')]
    spin = [(0, 0), (T(3.50), 0, 'lin'), (T(3.70), 150, 'in'), (T(4.10), 150, 'lin'), (T(5.80), 600, 'lin'), (T(5.90), 690, 'out'), (T(6.60), 690, 'lin'), (T(7.30), 720, 'io'), (N, 720, 'lin')]
    return dict(frames=N, loop=False, fn=spun(cid, keys, spin), info=cinfo14('attacker', 'moguzo_ultimate', N, MOGUZO_SHOTS, name_jp='大地烈掌・命中後（10秒版）',
                beats=dict(low_stance=T(.90), upper1_contact=T(1.50), upper1_hitstop=[T(1.50), T(2.00)], coil2=T(2.75), upper2_contact=T(3.70), upper2_hitstop=[T(3.70), T(4.10)], apex_hitstop=[T(5.90), T(6.60)], landing=T(7.60), fist_up=T(9.20)),
                note='一段目は足を地に付けたままの突き上げ、二段目は右へ巻いた深い沈みから回転しながら跳ぶ。2つのアッパーは構えも重さも別'))

def cinv_moguzo(cid):
    v = V_(cid); n0 = v['n0']; d = v['d']; N = T(10.0)
    alarm = merge(v['look'](0, 26, 0.8, 0.0, 16.0), pelvis=pel(n0, (0, -0.16, -0.10), (10, 0, 0)))
    chin = merge(n0, pelvis=pel(n0, (0, -0.06, 0.26), (-26, 0, 0)), spine=add(n0['spine'], (-12, 0, 0)), chest=add(n0['chest'], (-16, 0, 0)), neck=add(n0['neck'], (-24, 0, 0)), head=add(n0['head'], (-40, 0, 0)),
                 handL=P((0.55, 0.20, -0.40), fwd=(0.3, 0.2, -0.9), back=(0.9, 0, 0.3)), handR=P((0.60, 0.10, -0.45), fwd=(0.3, 0.2, -0.9), back=(0.9, 0, 0.3)),
                 footL=foot(n0, 'footL', (0.05, 0.10, 0.10), pitch=40), footR=foot(n0, 'footR', (0.06, -0.10, 0.06), pitch=50), tail=(-30, 0), jaw=26.0, keys=K(n0, blink=1.0, brow_angry=0.0, paw_open_L=1.0, paw_open_R=1.0))
    limp = merge(v['air'], pelvis=pel(n0, (0, 0, 0.20), (-48, 0, 0)), head=add(n0['head'], (-30, 0, 14)), handL=P((0.45, -0.30, -0.30)), handR=P((0.50, -0.35, -0.35)), jaw=14.0)
    bent = merge(v['curl'], pelvis=pel(n0, (0, 0, 0.25), (46, 0, 0)), head=add(n0['head'], (30, 0, 0)), handL=P((0.30, 0.60, -0.50)), handR=P((0.30, 0.55, -0.55)), jaw=26.0)
    star = merge(v['air'], pelvis=pel(n0, (0, 0, 0.20), (-20, 0, 0)), handL=P((0.90, 0.0, 0.40), fwd=(0.8, 0, 0.5), back=(0, -1, 0)), handR=P((0.90, 0.0, 0.40), fwd=(0.8, 0, 0.5), back=(0, -1, 0)))
    keys = [(0, v['fold']), (T(.40), merge(v['fold'], pelvis=pel(n0, (0, -0.30, -0.20), (36, 6, 0))), 'out'), (T(1.00), alarm, 'io'), (T(1.42), alarm, 'lin')]
    hold(keys, 1.50, 2.00, chin, 'in3')
    keys += [(T(2.50), limp, 'io'), (T(3.10), merge(limp, pelvis=pel(n0, (0, 0, 0.20), (-30, 0, 0))), 'io'), (T(3.62), limp, 'io')]
    hold(keys, 3.70, 4.10, bent, 'in3')
    keys += [(T(4.50), star, 'out'), (T(5.20), v['curl'], 'io'), (T(5.80), star, 'io')]
    hold(keys, 5.90, 6.60, star, 'lin', merge(star, jaw=26.0, head=add(n0['head'], (-34, 0, 0))))
    keys += [(T(7.20), limp, 'io'), (T(7.80), v['curl'], 'io'), (T(8.16), limp, 'io'), (T(8.22), d, 'in'), (T(8.36), v['dflop'], 'out'), (T(8.52), d, 'in'), (N, d, 'lin')]
    return dict(frames=N, loop=False, fn=keyed(keys), **FALL, info=cinfo14('target', 'moguzo_ultimate', N, MOGUZO_SHOTS, name_jp='大地烈掌を受ける側（10秒版）',
                beats=dict(fold=0, chin_up=T(1.50), float=T(2.50), bent_over_fist=T(3.70), apex=T(5.90), ground=T(8.22)), note='腹を折る→低く構える相手に気づく→あごを跳ね上げられ首と上体が反る→力が抜けて浮く→二段目で拳に折れ曲がる→大の字で打ち上がる→落ちて跳ねる'))

# ---------------- ゴダン「山崩し」 10.2s: 構え → 震脚 → 重い三撃 → 背後の岩壁ごと ----------------
GODAN_SHOTS = [0, T(1.3), T(2.2), T(3.6), T(5.0), T(6.6), T(8.2), T(9.0), T(10.2)]
def cin_godan_atk(cid):
    n0 = neutral(cid); N = T(10.2); hammer = plain(godan_ult(cid)['fn'](19)); y = lambda dy: dy
    def stance(low=-0.28, fwd=0.0, yaw=-36, palm=1.0, brow=0.5):
        return merge(n0, pelvis=pel(n0, (0, fwd, low), (2, yaw, 0)), chest=add(n0['chest'], (-2, yaw * 0.4, 0)), neck=add(n0['neck'], (0, -yaw * 0.5, 0)), head=add(n0['head'], (-4, -yaw * 0.9, 0)),
                     handL=W((-0.02, 0.80, 0.12), fwd=(0, 0.25, 0.97), back=(0, -0.97, 0.25), elbow=(0.8, -0.3, -0.5)), handR=P((0.30, -0.20, -0.36), fwd=(0, 0.9, 0.2), back=(0.9, 0, 0.3), elbow=(0.6, -0.8, 0)),
                     footL=foot(n0, 'footL', (0.06, 0.46 + fwd, 0), knee=0.5), footR=foot(n0, 'footR', (0.10, -0.24 + fwd, 0), knee=0.5), tail=(0, 0), jaw=0.0, keys=K(n0, paw_open_L=palm, brow_angry=brow))
    kamae = stance()
    lift = merge(stance(-0.16, -0.06), footL=foot(n0, 'footL', (0.06, 0.40, 0.55), pitch=-20, knee=0.4), chest=add(n0['chest'], (-8, -14, 0)))
    shin = merge(stance(-0.46, 0.14, -30, 1.0, 1.0), footL=foot(n0, 'footL', (0.08, 0.72, 0), knee=0.7), jaw=8.0)
    chamber = merge(stance(-0.40, 0.04, -52, 1.0, 1.0), handR=P((0.34, -0.42, -0.30), fwd=(0, 0.9, 0.2), back=(0.9, 0, 0.3), elbow=(0.6, -0.8, 0)))
    tsuki = merge(n0, pelvis=pel(n0, (0, 0.56, -0.36), (12, 40, 0)), spine=add(n0['spine'], (2, 8, 0)), chest=add(n0['chest'], (4, 20, 0)), neck=add(n0['neck'], (0, -22, 0)), head=add(n0['head'], (-8, -40, 0)),
                  handR=W((-0.14, 0.98, -0.02), fwd=(0, 1.0, 0), back=(0, 0, 1.0), elbow=(0.9, -0.2, -0.3)), handL=P((0.30, -0.30, -0.36), fwd=(0, 0.9, 0.2), back=(0.9, 0, 0.3), elbow=(0.6, -0.8, 0)),
                  footL=foot(n0, 'footL', (0.06, 0.80, 0), knee=0.6), footR=foot(n0, 'footR', (0.08, 0.0, 0), pitch=30), tail=(-18, 0), jaw=16.0, keys=K(n0, brow_angry=1.0))
    wind2 = merge(n0, pelvis=pel(n0, (0, 0.30, -0.30), (6, 74, 0)), chest=add(n0['chest'], (0, 30, 0)), neck=add(n0['neck'], (0, -30, 0)), head=add(n0['head'], (-4, -60, 0)),
                  handL=P((-0.55, 0.30, 0.25), fwd=(-0.9, 0.2, 0.2), back=(0, 0.3, 0.95), elbow=(0.5, 0.6, -0.6)), handR=P((0.40, 0.20, -0.20)), footL=foot(n0, 'footL', (0.06, 0.60, 0), knee=0.6), footR=foot(n0, 'footR', (0.08, 0.10, 0)), tail=(20, 30), jaw=4.0, keys=K(n0, brow_angry=1.0))
    uraken = merge(n0, pelvis=pel(n0, (0, 0.60, -0.30), (8, -62, -6)), spine=add(n0['spine'], (0, -10, 0)), chest=add(n0['chest'], (0, -24, -4)), neck=add(n0['neck'], (0, 30, 0)), head=add(n0['head'], (-6, 56, 0)),
                   handL=W((0.10, 0.98, 0.14), fwd=(0.3, 0.95, 0), back=(-0.95, 0.3, 0), elbow=(0.3, -0.2, -0.9)), handR=P((0.50, -0.70, 0.10), fwd=(0, -0.9, -0.3), back=(0.9, 0, 0.3), elbow=(0.6, -0.7, 0.2)),
                   footL=foot(n0, 'footL', (0.04, 0.90, 0), knee=0.5), footR=foot(n0, 'footR', (0.10, 0.10, 0), pitch=36), tail=(-10, -40), jaw=18.0, keys=K(n0, brow_angry=1.0))
    def walk(lf, rf, sink, lead):
        return merge(n0, pelvis=pel(n0, (0.05 if lead == 'L' else -0.05, 0.10, sink), (8, -8, 3 if lead == 'L' else -3)), chest=add(n0['chest'], (4, 0, 0)), head=add(n0['head'], (-6, 8, 0)),
                     handL=P((0.34, -0.10, -0.34), fwd=(0, 0.9, 0.2), back=(0.9, 0, 0.3), elbow=(0.6, -0.8, 0)), handR=P((0.34, -0.14, -0.34), fwd=(0, 0.9, 0.2), back=(0.9, 0, 0.3), elbow=(0.6, -0.8, 0)),
                     footL=foot(n0, 'footL', (0.08, lf[0], lf[1]), pitch=lf[2], knee=0.5), footR=foot(n0, 'footR', (0.10, rf[0], rf[1]), pitch=rf[2], knee=0.5), tail=(6, 0), jaw=2.0, keys=K(n0, brow_angry=1.0))
    w = [walk((0.20, 0.0, 0), (-0.20, 0.0, 20), -0.22, 'L'), walk((0.20, 0.0, 0), (0.30, 0.30, -10), -0.12, 'L'), walk((0.0, 0.0, 16), (0.50, 0.0, 0), -0.30, 'R'), walk((0.36, 0.30, -10), (0.30, 0.0, 0), -0.12, 'R'), walk((0.56, 0.0, 0), (0.0, 0.0, 20), -0.30, 'L')]
    sink3 = merge(n0, pelvis=pel(n0, (0, 0.0, -0.62), (22, 0, 0)), chest=add(n0['chest'], (6, 0, 0)), neck=add(n0['neck'], (-12, 0, 0)), head=add(n0['head'], (-22, 14, 0)),
                  handL=P((0.34, -0.45, -0.25), fwd=(0, 0.6, 0.8), back=(0.9, 0, 0.3), elbow=(0.5, -0.85, 0)), handR=P((0.34, -0.45, -0.25), fwd=(0, 0.6, 0.8), back=(0.9, 0, 0.3), elbow=(0.5, -0.85, 0)),
                  footL=foot(n0, 'footL', (0.10, 0.30, 0), knee=0.8), footR=foot(n0, 'footR', (0.12, -0.20, 0), knee=0.8), tail=(40, 0), jaw=4.0, keys=K(n0, paw_open_L=1.0, paw_open_R=1.0, brow_angry=1.0))
    palm2 = lambda dz: W((-0.26, 0.97, dz), fwd=(0, 0.3, 0.95), back=(0, -0.95, 0.3), elbow=(0.85, -0.2, -0.45))
    sosho = merge(n0, pelvis=pel(n0, (0, 0.70, -0.40), (24, 0, 0)), spine=add(n0['spine'], (6, 0, 0)), chest=add(n0['chest'], (8, 0, 0)), neck=add(n0['neck'], (-14, 0, 0)), head=add(n0['head'], (-24, 14, 0)),
                  handL=palm2(0.04), handR=palm2(0.0), footL=foot(n0, 'footL', (0.10, 0.96, 0), knee=0.7), footR=foot(n0, 'footR', (0.12, -0.10, 0), pitch=44), tail=(-30, 0), jaw=26.0, keys=K(n0, paw_open_L=1.0, paw_open_R=1.0, brow_angry=1.0))
    sosho2 = merge(sosho, pelvis=pel(n0, (0, 0.78, -0.44), (26, 0, 0)))
    rise = merge(n0, pelvis=pel(n0, (0, 0.40, -0.10), (2, -30, 0)), handL=P((0.30, 0.30, -0.10)), handR=P((0.30, 0.25, -0.15)), footL=foot(n0, 'footL', (0.08, 0.50, 0)), footR=foot(n0, 'footR', (0.10, 0.20, 0)), jaw=2.0, keys=K(n0, brow_angry=0.8))
    rei = merge(n0, pelvis=pel(n0, (0, 0.40, 0.02), (-2, -56, 0)), chest=add(n0['chest'], (-4, -16, 0)), neck=add(n0['neck'], (0, 8, 0)), head=add(n0['head'], (-6, 14, 0)),
                handL=P((-0.30, 0.50, 0.12), fwd=(-0.3, 0.2, 0.95), back=(0, 0.95, 0.2), elbow=(0.8, 0.0, -0.6)), handR=P((-0.26, 0.46, 0.10), fwd=(-0.9, 0.3, 0.3), back=(0, 0.3, 0.95), elbow=(0.8, 0.0, -0.6)),
                footL=foot(n0, 'footL', (0.08, 0.46, 0)), footR=foot(n0, 'footR', (0.10, 0.26, 0)), tail=(4, 0), jaw=0.0, keys=K(n0, paw_open_L=1.0, brow_angry=0.7))
    bow = merge(rei, pelvis=pel(n0, (0, 0.40, 0.0), (12, -56, 0)), head=add(n0['head'], (10, 14, 0)), keys=K(n0, paw_open_L=1.0, brow_angry=0.5, blink=1.0))
    keys = [(0, hammer), (T(.30), hammer, 'lin'), (T(1.10), kamae, 'io'), (T(1.40), kamae, 'lin'), (T(1.62), lift, 'out'), (T(1.70), shin, 'in3'), (T(2.20), shin, 'lin'), (T(2.42), chamber, 'io')]
    hold(keys, 2.50, 2.90, tsuki, 'in3', merge(tsuki, pelvis=pel(n0, (0, 0.60, -0.38), (13, 42, 0))))
    keys += [(T(3.40), stance(-0.30, 0.20), 'io'), (T(3.90), wind2, 'io')]
    hold(keys, 4.00, 4.45, uraken, 'in3')
    keys += [(T(5.00), w[0], 'io'), (T(5.30), w[1], 'io'), (T(5.48), w[2], 'in'), (T(5.80), w[3], 'io'), (T(5.98), w[4], 'in'), (T(6.50), w[4], 'lin'), (T(7.08), sink3, 'io')]
    hold(keys, 7.20, 7.90, sosho, 'in3', sosho2)
    keys += [(T(8.40), sosho2, 'lin'), (T(9.00), rise, 'io'), (T(9.40), rei, 'io'), (T(9.70), bow, 'io'), (T(9.95), rei, 'io'), (N, rei, 'lin')]
    return dict(frames=N, loop=False, fn=keyed(keys), info=cinfo14('attacker', 'godan_ultimate', N, GODAN_SHOTS, name_jp='山崩し・命中後（10秒版）',
                beats=dict(kamae=T(1.10), shinkyaku=T(1.70), strike1_contact=T(2.50), strike1_hitstop=[T(2.50), T(2.90)], strike2_contact=T(4.00), strike2_hitstop=[T(4.00), T(4.45)], heavy_steps=[T(5.48), T(5.98)],
                           strike3_contact=T(7.20), strike3_hitstop=[T(7.20), T(7.90)], wall_break=T(7.90), rei=T(9.40)),
                note='掌を前に立てる構え→前足の震脚→一撃目は正面の右正拳、二撃目は体を逆へ巻いての左裏拳（横の軌道）、歩いて詰めて三撃目は両の掌の押し込み。三撃目の止めが終わる瞬間に岩壁が砕ける'))

def cinv_godan(cid):
    v = V_(cid); n0 = v['n0']; d = v['d']; G = v['G']; N = T(10.2)
    stag = merge(v['reel'], pelvis=pel(n0, (0, -0.14, -0.14), (12, 6, 0)), head=add(n0['head'], (10, 0, 6)), keys=K(n0, blink=0.5))
    jolt = merge(v['look'](0, 24, 0.9, 0.0, 16.0), pelvis=pel(n0, (0, -0.06, 0.12), (6, 0, 0)), footL=foot(n0, 'footL', (0.05, 0, 0.14), pitch=20), footR=foot(n0, 'footR', (0.05, -0.05, 0.10), pitch=20))
    gut = merge(v['fold'], pelvis=pel(n0, (0, -0.34, -0.10), (44, 0, 0)), jaw=26.0)
    side = merge(v['reel'], pelvis=pel(n0, (-0.16, -0.20, -0.06), (-8, 60, -22)), chest=add(n0['chest'], (-6, 30, -14)), head=add(n0['head'], (-10, 50, -24)), jaw=26.0)
    pinned = merge(n0, pelvis=pel(n0, (0, -0.30, 0.20), (-14, 0, 0)), chest=add(n0['chest'], (-8, 0, 0)), head=add(n0['head'], (-24, 0, 10)), handL=P((0.85, -0.20, 0.45), fwd=(0.7, 0, 0.7), back=(0, 1, 0)), handR=P((0.85, -0.20, 0.35), fwd=(0.7, 0, 0.7), back=(0, 1, 0)),
                   footL=foot(n0, 'footL', (0.12, 0.10, 0.16), pitch=30), footR=foot(n0, 'footR', (0.14, -0.05, 0.10), pitch=30), tail=(-40, 0), jaw=24.0, keys=K(n0, blink=1.0, paw_open_L=1.0, paw_open_R=1.0))
    slump = merge(n0, pelvis=pel(n0, (0, -0.34, -0.56), (-22, 0, 4)), spine=add(n0['spine'], (10, 0, 0)), chest=add(n0['chest'], (14, 0, 0)), head=add(n0['head'], (34, 0, 12)), handL=P((0.30, 0.20, -0.60)), handR=P((0.35, 0.15, -0.62)),
                  footL=foot(n0, 'footL', (0.10, 0.50, 0), pitch=-30, knee=0.4), footR=foot(n0, 'footR', (0.14, 0.60, 0), pitch=-30, knee=0.4), tail=(-50, 0), jaw=10.0, keys=K(n0, blink=1.0, paw_open_L=1.0, paw_open_R=1.0))
    dread = merge(slump, head=add(n0['head'], (-10, 0, 0)), handL=W((-0.10, 0.60, 0.30), fwd=(0, 0.3, 0.95), back=(0, 0.95, -0.3)), handR=W((-0.10, 0.60, 0.20), fwd=(0, 0.3, 0.95), back=(0, 0.95, -0.3)), jaw=22.0, keys=K(n0, blink=0.0, paw_open_L=1.0, paw_open_R=1.0))
    crushed = merge(pinned, pelvis=pel(n0, (0, -0.44, -0.10), (30, 0, 0)), spine=add(n0['spine'], (20, 0, 0)), chest=add(n0['chest'], (24, 0, 0)), head=add(n0['head'], (-30, 0, 0)), jaw=28.0)
    keys = [(0, merge(v['fold'], pelvis=pel(n0, (0, -0.10, -0.34), (34, 0, 0)))), (T(.50), stag, 'io'), (T(1.20), merge(stag, keys=K(n0, blink=0.0)), 'io'), (T(1.66), G, 'io'), (T(1.76), jolt, 'out'), (T(2.20), G, 'io'), (T(2.44), G, 'lin')]
    hold(keys, 2.50, 2.90, gut, 'in3')
    keys += [(T(3.40), merge(gut, pelvis=pel(n0, (0, -0.24, -0.20), (30, 0, 0)), jaw=14.0), 'out'), (T(3.92), merge(stag, keys=K(n0, blink=0.0)), 'io')]
    hold(keys, 4.00, 4.45, side, 'in3')
    keys += [(T(4.62), v['air'], 'out'), (T(4.80), pinned, 'in3'), (T(5.00), pinned, 'lin'), (T(5.50), slump, 'io'), (T(6.50), slump, 'lin'), (T(6.85), dread, 'io'), (T(7.14), dread, 'lin')]
    hold(keys, 7.20, 7.90, crushed, 'in3')
    keys += [(T(8.20), v['air'], 'out'), (T(8.50), v['curl'], 'io'), (T(8.72), d, 'in'), (T(8.86), v['dflop'], 'out'), (T(9.00), d, 'in'), (N, d, 'lin')]
    return dict(frames=N, loop=False, fn=keyed(keys), **FALL, info=cinfo14('target', 'godan_ultimate', N, GODAN_SHOTS, name_jp='山崩しを受ける側（10秒版）',
                beats=dict(stagger=T(.50), jolt_by_stomp=T(1.76), gut=T(2.50), side_whip=T(4.00), wall_slam=T(4.80), slump=T(5.50), dread=T(6.85), crushed=T(7.20), blown_through=T(7.90), ground=T(8.72)),
                note='よろめく→震脚で跳ねる→構え直す→腹を打たれて折れ、足を滑らせて下がる→横殴りで体ごと持っていかれ岩壁に張り付く→ずり落ちて座り込む→近づく相手に両手をかざす→押し潰され、壁ごと吹き飛ぶ'))

# ---------------- チルカ「百面本命打ち」 10.0s: 可愛い顔 → 分身の多方向連撃と爪痕 → 本体の決め ----------------
CHIRKA_SHOTS = [0, T(1.3), T(2.1), T(3.0), T(3.8), T(4.5), T(5.4), T(6.6), T(8.4), T(10.0)]
def cin_chirka_atk(cid):
    n0 = neutral(cid); N = T(10.0); strike = plain(chirka_ult(cid)['fn'](20)); s2 = chirka_s2(cid)['fn']; four = plain(s2(4)); rake = plain(s2(8)); top = plain(s2(13)); fall = plain(s2(23)); y0 = n0['pelvis']['rot'][1]
    def cute(roll, paw=1, wink=0.0, jaw=4.0):          # カメラ（本人の右）へ顔を向ける
        return merge(n0, pelvis=pel(n0, (0, 0.10, 0.04), (-4, -20, 0)), chest=add(n0['chest'], (-6, -14, 0)), neck=add(n0['neck'], (0, -20, roll * 0.4)), head=add(n0['head'], (-2, -52, roll)),
                     handR=P((-0.16, 0.34, 0.52), fwd=(-0.4, 0.1, 0.9), back=(0.3, 0.9, 0.2), elbow=(0.8, -0.4, -0.4)) if paw else P((0.20, 0.30, 0.0)),
                     handL=P((-0.10, 0.36, 0.50), fwd=(0.2, 0.1, 0.95), back=(-0.3, 0.9, 0.2), elbow=(0.8, 0.2, -0.5)) if paw == 2 else P((0.24, 0.10, -0.30)),
                     footL=foot(n0, 'footL', (0, 0.10, 0)), tail=(46, roll * 2), jaw=jaw, keys=K(n0, paw_open_L=0.8, paw_open_R=0.8, brow_angry=0.0, blink=wink))
    hop = merge(n0, pelvis=pel(n0, (0, -0.20, 0.10), (-6, 0, 0)), handL=P((0.50, 0.20, 0.30)), handR=P((0.50, 0.10, 0.35)), footL=foot(n0, 'footL', (0, 0.05, 0.25), pitch=20), footR=foot(n0, 'footR', (0, -0.10, 0.20), pitch=30), tail=(40, 0), keys=K(n0, paw_open_L=1.0, paw_open_R=1.0, brow_angry=0.3))
    prowl = merge(n0, pelvis=pel(n0, (0, 0.10, -0.34), (30, 0, 0)), chest=add(n0['chest'], (6, 0, 0)), neck=add(n0['neck'], (-16, 0, 0)), head=add(n0['head'], (-20, 30, 0)), handL=P((0.30, 0.50, -0.20), fwd=(0, 0.9, -0.3), back=(0, 0.3, 0.9)), handR=P((0.30, 0.45, -0.25), fwd=(0, 0.9, -0.3), back=(0, 0.3, 0.9)),
                   tail=(50, 20), keys=K(n0, paw_open_L=1.0, paw_open_R=1.0, brow_angry=0.6))
    peek = merge(n0, pelvis=dict(pos=(0, 0, 0.04), rot=(-4, 0, 0)), chest=(0, 0, 0), neck=(-2, 0, 6), head=(-6, 0, 14), handL=P((-0.10, 0.36, 0.50), fwd=(0.2, 0.1, 0.95), back=(-0.3, 0.9, 0.2), elbow=(0.8, 0.2, -0.5)), handR=P((-0.10, 0.36, 0.50), fwd=(0.2, 0.1, 0.95), back=(-0.3, 0.9, 0.2), elbow=(0.8, 0.2, -0.5)),
                 tail=(50, 20), jaw=5.0, keys=K(n0, paw_open_L=0.9, paw_open_R=0.9, brow_angry=0.0, blink=0.0))
    duck = merge(four, pelvis=dict(pos=add(four['pelvis']['pos'], (0, 0, -0.06)), rot=(50, 0, 0)), head=add(n0['head'], (-20, 30, 0)))
    wig = lambda r: merge(four, pelvis=dict(pos=add(four['pelvis']['pos'], (0.05 * r / 8, 0, 0.04)), rot=add(four['pelvis']['rot'], (-6, 0, r))), tail=(64, r * 4), head=add(n0['head'], (-40, 30, 0)), keys=K(n0, paw_open_L=1.0, paw_open_R=1.0, brow_angry=1.0))
    crouch = merge(four, pelvis=dict(pos=add(four['pelvis']['pos'], (0, 0.06, 0.06)), rot=add(four['pelvis']['rot'], (-10, 0, 0))), tail=(-10, 0))
    for q in (rake, top, fall): q['pelvis'] = dict(pos=(q['pelvis']['pos'][0], q['pelvis']['pos'][1], 0.30), rot=(q['pelvis']['rot'][0], y0, 0))
    rake['footL'] = foot(n0, 'footL', (0.10, 0.20, 0.30), pitch=40, knee=0.6); rake['footR'] = foot(n0, 'footR', (0.10, -0.10, 0.10), pitch=60, knee=0.6); top['footL'] = rake['footL']; top['footR'] = rake['footR']
    fall['footL'] = foot(n0, 'footL', (0, 0.10, 0.20), pitch=20); fall['footR'] = foot(n0, 'footR', (0, 0, 0.12), pitch=30)
    up = merge(n0, pelvis=pel(n0, (0, 0.10, 0.0), (0, 0, 0)), handL=P((0.30, 0.20, -0.20)), handR=P((0.30, 0.20, -0.10)), tail=(20, 0), keys=K(n0, paw_open_L=0.6, paw_open_R=0.6, brow_angry=0.3))
    lick = merge(n0, pelvis=pel(n0, (0, 0.06, 0.02), (-4, -40, 0)), spine=add(n0['spine'], (0, -10, 0)), chest=add(n0['chest'], (-6, -20, 0)), neck=add(n0['neck'], (0, -14, 0)), head=add(n0['head'], (-4, -26, -12)),
                 handR=P((-0.22, 0.42, 0.50), fwd=(-0.5, 0.2, 0.85), back=(0.3, 0.9, 0.2), elbow=(0.8, -0.3, -0.5)), handL=P((0.34, -0.10, -0.40), fwd=(0, 0.9, 0.2), back=(0.9, 0, 0.3), elbow=(0.6, -0.8, 0)),
                 footL=foot(n0, 'footL', (0.02, 0.10, 0)), footR=foot(n0, 'footR', (0.04, 0.0, 0)), tail=(46, 34), jaw=7.0, keys=K(n0, paw_open_R=0.7, paw_open_L=0.2, brow_angry=0.25, blink=0.0))
    lick2 = merge(lick, tail=(46, -34), head=add(n0['head'], (-2, -30, -16)), jaw=3.0)
    wink = merge(lick, tail=(52, 20), keys=K(n0, paw_open_R=0.7, paw_open_L=0.2, brow_angry=0.1, blink=1.0), jaw=4.0)
    keys = [(0, strike), (T(.10), strike, 'lin'), (T(.40), cute(14), 'io'), (T(.62), cute(14), 'lin'), (T(.68), cute(14, 1, 1.0), 'lin'), (T(.76), cute(14), 'lin'), (T(.98), cute(-16, 2, 0.0, 7.0), 'io'), (T(1.12), cute(-16, 2, 1.0, 7.0), 'lin'), (T(1.24), cute(-16, 2, 0.0, 6.0), 'lin'),
            (T(1.42), hop, 'out'), (T(1.60), prowl, 'in'), (T(5.60), duck, 'lin'), (T(5.86), duck, 'lin'), (T(6.00), peek, 'out3'), (T(6.22), peek, 'lin'), (T(6.28), merge(peek, keys=K(n0, paw_open_L=0.9, paw_open_R=0.9, blink=1.0), jaw=7.0), 'lin'), (T(6.40), peek, 'lin'),
            (T(6.58), four, 'io'), (T(6.70), wig(8), 'io'), (T(6.80), wig(-8), 'io'), (T(6.90), wig(8), 'io'), (T(7.00), wig(-6), 'io'), (T(7.05), four, 'lin'), (T(7.22), rake, 'in')]
    hold(keys, 7.30, 7.90, top, 'out')
    keys += [(T(8.25), fall, 'io'), (T(8.45), crouch, 'in'), (T(8.60), crouch, 'lin'), (T(8.95), up, 'io'), (T(9.25), lick, 'io'), (T(9.45), lick2, 'io'), (T(9.62), lick, 'io'), (T(9.70), wink, 'io'), (T(9.82), lick, 'io'), (N, lick2, 'io')]
    spin = [(0, 0), (T(7.05), 0, 'lin'), (T(7.30), 170, 'in'), (T(7.90), 190, 'lin'), (T(8.25), 360, 'out'), (N, 360, 'lin')]
    return dict(frames=N, loop=False, fn=spun(cid, keys, spin), info=cinfo14('attacker', 'chirka_ultimate', N, CHIRKA_SHOTS, name_jp='百面本命打ち・命中後（10秒版）',
                beats=dict(cute_tilt=T(.40), wink1=T(.68), tilt_other=T(.98), hop_back=T(1.42), peekaboo=T(6.00), wink2=T(6.28), pounce_wiggle=T(6.70), spring=T(7.05), real_contact=T(7.30), real_hitstop=[T(7.30), T(7.90)], landing=T(8.45), lick=T(9.25), wink3=T(9.70)),
                note='手を下ろして首をかしげ、まばたき、反対へかしげて両手を頬へ→跳び下がる。2.1〜3.0秒は walk_f で周回、3.0〜5.6秒は画面外。カメラのすぐ前に下から顔を出して片目をつぶり、振り向いて尻を振り、回転しながらの跳ね爪（本命）'))

def cin_chirka_dive(cid):
    """分身用: 頭から落ちてくる両手の爪（保持ポーズ）。"""
    n0 = neutral(cid); top = plain(chirka_s2(cid)['fn'](13)); N = 30
    a = merge(top, pelvis=dict(pos=(0, 0, 0.2), rot=(10, n0['pelvis']['rot'][1], 0)), handL=P((0.10, 0.30, 0.95), fwd=(0, 0.3, 0.95), back=(0, -0.95, 0.3)), handR=P((0.10, 0.36, 0.95), fwd=(0, 0.3, 0.95), back=(0, -0.95, 0.3)), tail=(-40, 0), jaw=14.0, keys=K(n0, paw_open_L=1.0, paw_open_R=1.0, brow_angry=1.0))
    b = merge(a, handL=P((0.30, 0.50, 0.80), fwd=(0, 0.6, 0.8), back=(0, -0.8, 0.6)), handR=P((-0.10, 0.60, 0.70), fwd=(0, 0.6, 0.8), back=(0, -0.8, 0.6)))
    return dict(frames=N, loop=False, fn=keyed([(0, a), (N, b, 'in')]), info=dict(cinfo14('clone', 'chirka_ultimate', N, [0, N], name_jp='分身・頭上からの爪'), end_pose='air'))

def cinv_chirka(cid):
    v = V_(cid); n0 = v['n0']; d = v['d']; G = v['G']; L = v['look']; N = T(10.0)
    hitA = merge(v['reel'], pelvis=pel(n0, (0.10, -0.26, -0.06), (-16, 30, 14)), head=add(n0['head'], (-14, 30, 20)))
    dizzy = lambda r: merge(n0, pelvis=pel(n0, (0.06 * r, -0.08, -0.16), (10, 0, 6 * r)), chest=add(n0['chest'], (8, 0, 6 * r)), head=add(n0['head'], (14, 10 * r, 16 * r)), handL=P((0.30, 0.20, -0.50)), handR=P((0.34, 0.14, -0.52)), tail=(-30, 10 * r), jaw=12.0, keys=K(n0, blink=0.6, paw_open_L=1.0, paw_open_R=1.0))
    chin = merge(v['arch'], pelvis=pel(n0, (0, -0.10, 0.24), (-30, 0, 0)), head=add(n0['head'], (-40, 0, 0)))
    keys = [(0, v['reel']), (T(.30), merge(v['reel'], pelvis=pel(n0, (0, -0.34, -0.06), (-22, 18, -4))), 'out'), (T(.70), G, 'io'), (T(1.00), L(0, 0, 0.3, 0.0, 6.0), 'io'), (T(1.30), merge(L(0, 0, 0.4, 0.0, 8.0), head=add(n0['head'], (0, 0, 16))), 'io'),
            (T(1.60), L(40, 0, 0.3), 'io'), (T(1.90), L(-44, 0, 0.4), 'io'), (T(2.20), L(50, -6, 0.6, 0, 14.0), 'io'), (T(2.50), L(-50, -6, 0.7, 0, 16.0), 'io'), (T(2.80), L(40, 0, 0.8, 0, 18.0), 'io'), (T(3.10), G, 'io'), (T(3.24), G, 'lin')]
    hold(keys, 3.30, 3.48, hitA, 'in3')
    keys += [(T(3.80), L(-20, -30, 0.8, 0.3, 16.0), 'io'), (T(4.04), v['over'], 'io')]
    hold(keys, 4.10, 4.28, v['knees'], 'in3')
    keys += [(T(4.60), merge(v['fold'], keys=K(n0, blink=0.4)), 'io'), (T(4.74), L(30, 0, 0.9, 0.2, 14.0), 'io')]
    hold(keys, 4.80, 4.95, merge(v['fold'], pelvis=pel(n0, (0, -0.30, -0.12), (40, -20, 0)), jaw=24.0), 'in3')
    hold(keys, 5.10, 5.28, chin, 'in3')
    keys += [(T(5.55), dizzy(1), 'io'), (T(5.95), dizzy(-1), 'io'), (T(6.35), dizzy(1), 'io'), (T(6.75), dizzy(-1), 'io'), (T(7.10), merge(dizzy(0.4), head=add(n0['head'], (0, 40, 0)), keys=K(n0, blink=0.0, paw_open_L=1.0, paw_open_R=1.0)), 'io'), (T(7.24), L(60, 0, 1.0, 0.0, 20.0), 'io')]
    hold(keys, 7.30, 7.90, v['arch'], 'in3')
    keys += [(T(8.20), v['air'], 'out'), (T(8.45), v['curl'], 'io'), (T(8.62), d, 'in'), (T(8.76), v['dflop'], 'out'), (T(8.90), d, 'in'), (N, d, 'lin')]
    return dict(frames=N, loop=False, fn=keyed(keys), **FALL, info=cinfo14('target', 'chirka_ultimate', N, CHIRKA_SHOTS, name_jp='百面本命打ちを受ける側（10秒版）',
                beats=dict(puzzled=T(1.30), look_around=T(1.60), hit_side=T(3.30), hit_above=T(4.10), hit_low=T(4.80), hit_rising=T(5.10), dizzy=T(5.55), notice=T(7.10), hit_real=T(7.30), ground=T(8.62)),
                note='のけぞる→構え直し、可愛い仕草に首をかしげる→分身を目で追う→横・上・下・突き上げの四方向から打たれ、そのたび別の向きへ崩れる→毒でふらつく→背後の気配に振り向きかけて背中を打たれ、飛ばされて落ちる'))

SPECIALS = dict(s1_v14=dict(moguzo=moguzo_s1, godan=godan_s1, chirka=chirka_s1), s2_v14=dict(moguzo=moguzo_s2, godan=godan_s2, chirka=chirka_s2),
                s3_v14=dict(moguzo=moguzo_s3, godan=godan_s3, chirka=chirka_s3), ult_v14=dict(moguzo=moguzo_ult, godan=godan_ult, chirka=chirka_ult))
HEROES = ('moguzo', 'godan', 'chirka')
CINE_ATK = dict(cin_moguzo_atk=dict(moguzo=cin_moguzo_atk), cin_godan_atk=dict(godan=cin_godan_atk), cin_chirka_atk=dict(chirka=cin_chirka_atk), cin_chirka_dive=dict(chirka=cin_chirka_dive))
CINE_VICTIM = dict(cinv_moguzo=cinv_moguzo, cinv_godan=cinv_godan, cinv_chirka=cinv_chirka)        # 9体すべてに入る
from . import motions_v14b as _B          # 第二弾（残り6体）。道具がすべて定義されたあとで読み込む
for _k, _v in _B.SPECIALS_B.items(): SPECIALS[_k].update(_v)
CINE_ATK.update(_B.CINE_ATK_B); CINE_VICTIM.update(_B.CINE_VICTIM_B)
CLIPS = dict(SPECIALS, **CINE_ATK, **CINE_VICTIM)
def clips_for(cid): return [c for c in CLIPS if not isinstance(CLIPS[c], dict) or cid in CLIPS[c]]
INGAME_LEAD = 2      # ゲームは技の出始めに構えから約3F混ぜる（main.js の crossFade）ので、当たりの姿勢を 2F 早めに置く。発生・持続の数値は変えない
def _lead(clip):
    """対戦用クリップの時間だけを詰める: 当たりの姿勢が (発生-2)F から 持続の終わりまで見える。長さは同じ"""
    I = clip['info']; st, ac = I['startup'], I['active']; fn = clip['fn']; c = st - INGAME_LEAD
    def warp(f):
        if f <= c: return f * st / c
        if f <= st + ac: return st + (f - c) * ac / (ac + INGAME_LEAD)
        return f
    return dict(clip, fn=lambda f: fn(warp(f)), info=dict(I, contact_pose_frame=c, ingame_lead_frames=INGAME_LEAD))
def make(cid, name):
    f = CLIPS[name]; clip = (f[cid] if isinstance(f, dict) else f)(cid)
    return _lead(clip) if name in SPECIALS else clip
def command_map(cid):
    """v14 の見た目差し替え案。models.js の chooseClip は command_map を最優先で引くので、この対応だけで新クリップが再生される"""
    return {'236': 's1_v14', '623': 's2_v14', '214': 's3_v14', '236236': 'ult_v14'} if cid in SPECIALS['s1_v14'] else {}
