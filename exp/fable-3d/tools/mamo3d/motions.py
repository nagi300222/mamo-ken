"""モーション定義。ポーズは体格に依存しない単位で書く:
  pelvis.pos / foot.pos … 脚の長さを1とした (外, 前, 上)。pelvis はレスト位置から、foot はレストの足位置からの差。
  hand.pos … 腕の長さを1とした、肩関節からの (外, 前, 上)。space='chest' なら胸に付いて動く。'root' は地面基準。
  回転 … 度。(pitch 前傾+, yaw 本人の左向き+, roll 本人の左へ傾く+)。
  fwd / back … 拳の「指の付け根が向く方向」と「手の甲が向く方向」。
先に出す側（リード）は左。右向き（1P側）で胸がカメラへ開く構え。
新しいモーションは、neutral を merge() で上書きしたキーポーズを並べるだけで追加できる。"""
import math
from .anim import merge, sample

# ---- キャラごとの構えの個性 ----
STYLE = {
    'moguzo': dict(yaw=-26, low=-0.10, lean=5, lead=(0.06, 0.42), rear=(0.22, -0.36), lead_yaw=-8, rear_yaw=30,
                   handL=(-0.12, 0.60, -0.02), handR=(-0.26, 0.42, 0.10), idle_n=72, bob=0.014, walk_n=40, stride=0.50),
    'pisuke': dict(yaw=-34, low=-0.06, lean=7, lead=(0.02, 0.56), rear=(0.16, -0.50), lead_yaw=-8, rear_yaw=38,
                   handL=(-0.10, 0.62, 0.10), handR=(-0.24, 0.46, 0.16), idle_n=44, bob=0.030, walk_n=30, stride=0.58),
    'godan': dict(yaw=-14, low=-0.16, lean=7, lead=(0.34, 0.26), rear=(0.42, -0.24), lead_yaw=8, rear_yaw=30,
                  handL=(0.10, 0.52, -0.14), handR=(0.06, 0.44, -0.10), idle_n=96, bob=0.012, walk_n=52, stride=0.40),
}

def neutral(cid):
    s = STYLE[cid]; y = s['yaw']
    wide = cid == 'godan'
    return dict(
        pelvis=dict(pos=(0, 0, s['low']), rot=(s['lean'], y, 0)),
        spine=(3, y * 0.15, 0), chest=(4, y * 0.25, 0), neck=(-2, -y * 0.45, 0), head=(-6, -y * 0.80, 0), jaw=0.0,
        handL=dict(pos=s['handL'], fwd=(-0.10, 0.30, 0.95), back=(0.80, 0.60, 0.0) if not wide else (0.95, 0.30, 0.0), elbow=(0.55, -0.25, -0.8) if not wide else (0.9, -0.2, -0.4)),
        handR=dict(pos=s['handR'], fwd=(-0.10, 0.30, 0.95), back=(0.80, 0.60, 0.0) if not wide else (0.95, 0.30, 0.0), elbow=(0.55, -0.25, -0.8) if not wide else (0.9, -0.2, -0.4)),
        footL=dict(pos=(s['lead'][0], s['lead'][1], 0), yaw=s['lead_yaw'], pitch=0, knee=0.25),
        footR=dict(pos=(s['rear'][0], s['rear'][1], 0), yaw=s['rear_yaw'], pitch=0, knee=0.45),
        tail=(0, 0), keys=dict(paw_open_L=0.0, paw_open_R=0.0, blink=0.0, brow_angry=0.0),
    )

def add(v, d): return tuple(a + b for a, b in zip(v, d))
def hand(base, key, dpos=None, **kw):
    h = dict(base[key], **kw)
    if dpos: h['pos'] = add(base[key]['pos'], dpos)
    return h
def pel(base, dpos=(0, 0, 0), drot=(0, 0, 0)):
    return dict(pos=add(base['pelvis']['pos'], dpos), rot=add(base['pelvis']['rot'], drot))
def foot(base, key, dpos=(0, 0, 0), **kw):
    f = dict(base[key], **kw); f['pos'] = add(base[key]['pos'], dpos); return f
def keyed(keys):
    return lambda f: sample(keys, f)

# ---- 各モーション。戻り値: dict(frames, loop, fn, info) ----
def idle(cid):
    n0 = neutral(cid); s = STYLE[cid]; N = s['idle_n']; b = s['bob']
    def fn(f):
        p = 2 * math.pi * f / N; a = math.sin(p); c = math.sin(p - 0.9) + math.sin(0.9); blink = 1.0 if (cid != 'godan' and N * 0.55 <= f <= N * 0.55 + 4) else 0.0
        heel = max(0.0, a) * (14 if cid == 'pisuke' else 0)
        return merge(n0, pelvis=pel(n0, (0, 0, b * a), (0.8 * a, 0, 0)), chest=add(n0['chest'], (1.5 * c, 0, 0)), head=add(n0['head'], (-1.2 * c, 0, 0)),
                     handL=hand(n0, 'handL', (0, 0.01 * c, 0.018 * c)), handR=hand(n0, 'handR', (0, 0.008 * c, 0.022 * c)),
                     footR=foot(n0, 'footR', pitch=heel), tail=(3 * a, 4 * math.sin(p * 1)),
                     keys=dict(n0['keys'], blink=blink, brow_angry=0.0))
    return dict(frames=N, loop=True, fn=fn, info=dict(note='待機。呼吸で上下する'))

def walk(cid, direction):
    n0 = neutral(cid); s = STYLE[cid]; N = s['walk_n'] if direction > 0 else int(s['walk_n'] * 1.15); stride = s['stride'] * (1.0 if direction > 0 else 0.8); duty = 0.62
    def cyc(u):                       # u:0..1 → (前後 -0.5..0.5, 持ち上げ 0..1)
        u = u % 1.0
        if u < duty: return 0.5 - u / duty, 0.0
        t = (u - duty) / (1 - duty); e = t * t * (3 - 2 * t); return -0.5 + e, math.sin(math.pi * t)
    def fn(f):
        u = f / N * direction; (a, la), (b, lb) = cyc(u), cyc(u + 0.5); p = 2 * math.pi * f / N
        bobz = -0.018 * math.cos(2 * p) ; lift = 0.14 if cid != 'godan' else 0.10
        return merge(n0, pelvis=pel(n0, (0.02 * math.sin(p), 0, bobz + 0.01), (2.0 * direction, 3 * math.sin(p), 1.5 * math.sin(p))),
                     chest=add(n0['chest'], (0, -4 * math.sin(p), 0)), head=add(n0['head'], (0, 1.5 * math.sin(p), 0)),
                     footL=foot(n0, 'footL', (0, a * stride, la * lift), pitch=la * 18 * direction),
                     footR=foot(n0, 'footR', (0, b * stride, lb * lift), pitch=lb * 18 * direction),
                     handL=hand(n0, 'handL', (0, 0.02 * math.sin(p), 0.015 * math.cos(2 * p))), handR=hand(n0, 'handR', (0, -0.02 * math.sin(p), 0.015 * math.cos(2 * p))),
                     tail=(4, 8 * math.sin(p)))
    dist = stride / duty
    return dict(frames=N, loop=True, fn=fn, info=dict(move_per_loop_leg=round(dist * direction, 4), note='足の接地中は一定速で後ろへ流れる。ゲーム側でこの速度で前進させれば滑らない'))

def dash_f(cid):
    n0 = neutral(cid); N = 22 if cid != 'godan' else 28; k = N / 22.0; F = lambda x: int(round(x * k))
    anti = merge(n0, pelvis=pel(n0, (0, -0.06, -0.14), (8, 0, 0)), chest=add(n0['chest'], (6, 0, 0)), handL=hand(n0, 'handL', (0, -0.08, -0.05)), handR=hand(n0, 'handR', (0, -0.10, -0.05)),
                 footR=foot(n0, 'footR', pitch=18))
    fly = merge(n0, pelvis=pel(n0, (0, 0.10, -0.02), (16, 0, 0)), spine=add(n0['spine'], (4, 0, 0)), chest=add(n0['chest'], (8, 0, 0)), head=add(n0['head'], (-14, 0, 0)),
                handL=hand(n0, 'handL', (0, 0.10, -0.05)), handR=hand(n0, 'handR', (0.05, -0.20, -0.20)),
                footL=foot(n0, 'footL', (0, 0.30, 0.10), pitch=-14), footR=foot(n0, 'footR', (0, -0.22, 0.16), pitch=40), tail=(22, 0))
    land = merge(n0, pelvis=pel(n0, (0, 0.04, -0.12), (10, 0, 0)), chest=add(n0['chest'], (5, 0, 0)), footL=foot(n0, 'footL', (0, 0.10, 0)), footR=foot(n0, 'footR', (0, 0.05, 0), pitch=10), tail=(-8, 0))
    keys = [(0, n0), (F(4), anti, 'out'), (F(9), fly, 'out'), (F(14), fly, 'lin'), (F(17), land, 'in'), (N, n0, 'io')]
    return dict(frames=N, loop=False, fn=keyed(keys), info=dict(move_total_leg=2.2 if cid != 'godan' else 1.7, move_frames=[F(4), F(17)], note='F4で踏み切り、F17で着地。移動はこの区間に配分する'))

def crouch(cid):
    n0 = neutral(cid); s = STYLE[cid]; deep = dict(moguzo=-0.36, pisuke=-0.40, godan=-0.34)[cid]
    def low(br):
        return merge(n0, pelvis=pel(n0, (0.02, 0.06, deep + br * 0.012), (30, 4, 5)), spine=add(n0['spine'], (15 + br, 0, 3)), chest=add(n0['chest'], (13, 4, 5)), neck=add(n0['neck'], (-16, 0, -4)), head=add(n0['head'], (-32, 0, -6)),
                     handL=dict(space='root', pos=(0.10, s['lead'][1] + 1.10, 0.20), fwd=(0.05, 0.95, -0.30), back=(0.0, 0.25, 1.0), elbow=(0.9, -0.2, 0.3)),
                     handR=hand(n0, 'handR', (0.02, -0.04, 0.02)),
                     footL=foot(n0, 'footL', (0.14, 0.02, 0), knee=0.6), footR=foot(n0, 'footR', (0.10, 0.06, 0), knee=0.8, pitch=8),
                     tail=(-10, 0), keys=dict(n0['keys'], paw_open_L=1.0))
    N = 48; ent = 12
    def fn(f):
        if f <= ent: return sample([(0, n0), (ent, low(0), 'io')], f)
        return low(math.sin(2 * math.pi * (f - ent) / (N - ent)))
    return dict(frames=N, loop=False, fn=fn, info=dict(enter_frames=ent, loop_from=ent, note='F12まででしゃがみ切り、F12〜F48は呼吸の保持ループ。リード手（左）を地面につく'))

def jump_n(cid):
    n0 = neutral(cid); pre = 4 if cid != 'godan' else 6; air = 36 if cid != 'godan' else 34; landf = 8; N = pre + air + landf
    squat = merge(n0, pelvis=pel(n0, (0, 0, -0.20), (12, 0, 0)), chest=add(n0['chest'], (8, 0, 0)), handL=hand(n0, 'handL', (0.05, -0.10, -0.22)), handR=hand(n0, 'handR', (0.05, -0.10, -0.25)), tail=(-12, 0))
    rise = merge(n0, pelvis=pel(n0, (0, 0, 0.10), (-4, 0, 0)), chest=add(n0['chest'], (-6, 0, 0)), head=add(n0['head'], (-6, 0, 0)), handL=hand(n0, 'handL', (0.0, 0.0, 0.30)), handR=hand(n0, 'handR', (0.0, 0.0, 0.28)),
                 footL=foot(n0, 'footL', (-0.02, -0.12, 0.06), pitch=42), footR=foot(n0, 'footR', (-0.04, 0.10, 0.08), pitch=46), tail=(-25, 0))
    tuck = merge(n0, pelvis=pel(n0, (0, 0, 0.10), (10, 0, 0)), chest=add(n0['chest'], (6, 0, 0)), handL=hand(n0, 'handL', (0.0, 0.05, 0.10)), handR=hand(n0, 'handR', (0.0, 0.02, 0.10)),
                 footL=foot(n0, 'footL', (-0.04, -0.14, 0.50), pitch=10, knee=0.6), footR=foot(n0, 'footR', (-0.10, 0.22, 0.46), pitch=24, knee=0.7), tail=(18, 0))
    fall = merge(n0, pelvis=pel(n0, (0, 0, 0.12), (2, 0, 0)), handL=hand(n0, 'handL', (0.10, 0.0, 0.22)), handR=hand(n0, 'handR', (0.10, 0.0, 0.24)),
                 footL=foot(n0, 'footL', (0, -0.04, 0.16), pitch=28), footR=foot(n0, 'footR', (0, 0.06, 0.18), pitch=30), tail=(30, 0))
    landp = merge(n0, pelvis=pel(n0, (0, 0, -0.22), (14, 0, 0)), chest=add(n0['chest'], (9, 0, 0)), handL=hand(n0, 'handL', (0.06, -0.06, -0.18)), handR=hand(n0, 'handR', (0.06, -0.08, -0.20)), tail=(-18, 0))
    a0 = pre; a1 = pre + air
    keys = [(0, n0), (pre, squat, 'out'), (a0 + 4, rise, 'out3'), (a0 + air // 2, tuck, 'io'), (a1 - 5, fall, 'io'), (a1 + 2, landp, 'in'), (N, n0, 'io')]
    return dict(frames=N, loop=False, fn=keyed(keys), info=dict(prejump=pre, airborne=[a0, a1], land_recovery=landf, jump_height_leg=2.6 if cid != 'godan' else 2.0,
                note='上下移動は含まない（ルートは地面のまま）。airborne の区間にゲーム側で放物線の高さを与える'))

def stand_light(cid):
    n0 = neutral(cid); st, ac, N = dict(moguzo=(4, 3, 18), pisuke=(3, 3, 15), godan=(6, 3, 22))[cid]
    wind = merge(n0, pelvis=pel(n0, (0, -0.03, -0.02), (0, 6, 0)), chest=add(n0['chest'], (0, 8, 0)), handL=hand(n0, 'handL', (0.04, -0.12, 0.02)))
    hit = merge(n0, pelvis=pel(n0, (0, 0.10, -0.04), (6, -14, 0)), spine=add(n0['spine'], (2, -6, 0)), chest=add(n0['chest'], (4, -16, -3)), head=add(n0['head'], (-4, 26, 0)),
                handL=dict(pos=(-0.22, 0.97, 0.02), fwd=(-0.05, 1.0, 0.0), back=(0.25, 0.0, 1.0), elbow=(0.9, -0.1, -0.4)), handR=hand(n0, 'handR', (0.0, -0.10, 0.04)),
                footL=foot(n0, 'footL', (0, 0.08, 0)), footR=foot(n0, 'footR', pitch=14), tail=(10, 12), keys=dict(n0['keys'], brow_angry=0.7))
    keys = [(0, n0), (max(1, st - 2), wind, 'out'), (st, hit, 'in3'), (st + ac, hit, 'lin'), (N, n0, 'io')]
    return dict(frames=N, loop=False, fn=keyed(keys), info=dict(startup=st, active=ac, recovery=N - st - ac, hand='L', note='前手（左）のジャブ'))

def stand_heavy(cid):
    n0 = neutral(cid)
    if cid == 'moguzo':       # 踏み込みストレート（後ろ手＝右）
        st, ac, N = 12, 4, 40
        wind = merge(n0, pelvis=pel(n0, (0, -0.10, -0.08), (4, -20, 0)), chest=add(n0['chest'], (2, -18, 0)), head=add(n0['head'], (0, 30, 0)),
                     handR=dict(pos=(0.10, -0.05, -0.05), fwd=(0.0, 1.0, 0.1), back=(0.6, 0.0, 0.8), elbow=(0.5, -0.8, -0.3)), handL=hand(n0, 'handL', (0.05, 0.05, 0.05)),
                     footL=foot(n0, 'footL', (0, 0.05, 0.10), pitch=-10), footR=foot(n0, 'footR', pitch=10), tail=(-10, -15), keys=dict(n0['keys'], brow_angry=1.0))
        hit = merge(n0, pelvis=pel(n0, (0, 0.30, -0.16), (14, 48, 0)), spine=add(n0['spine'], (4, 12, 0)), chest=add(n0['chest'], (6, 26, 0)), neck=add(n0['neck'], (0, -30, 0)), head=add(n0['head'], (-10, -52, 0)),
                    handR=dict(pos=(-0.30, 0.97, 0.0), fwd=(0.0, 1.0, 0.0), back=(0.2, 0.0, 1.0), elbow=(0.9, -0.1, -0.3)), handL=dict(pos=(0.05, -0.05, -0.02), fwd=(-0.1, 0.5, 0.85), back=(0.8, 0.5, 0.0), elbow=(0.5, -0.7, -0.5)),
                    footL=foot(n0, 'footL', (0.02, 0.55, 0), yaw=6), footR=foot(n0, 'footR', (0, 0.10, 0), pitch=38, yaw=-10), tail=(12, 22), keys=dict(n0['keys'], brow_angry=1.0), jaw=10.0)
        rec = merge(n0, pelvis=pel(n0, (0, 0.18, -0.12), (10, 26, 0)), chest=add(n0['chest'], (5, 12, 0)), head=add(n0['head'], (-6, -30, 0)),
                    handR=dict(pos=(-0.20, 0.70, 0.0), fwd=(-0.05, 0.9, 0.4), back=(0.6, 0.2, 0.7), elbow=(0.7, -0.2, -0.6)), footL=foot(n0, 'footL', (0.02, 0.40, 0)), footR=foot(n0, 'footR', (0, 0.08, 0), pitch=20))
        keys = [(0, n0), (7, wind, 'out'), (st, hit, 'in3'), (st + ac, hit, 'lin'), (st + ac + 8, rec, 'out'), (N, n0, 'io')]
        info = dict(startup=st, active=ac, recovery=N - st - ac, hand='R', note='左足で踏み込み、腰の回転で後ろ手（右）のストレート')
    elif cid == 'pisuke':     # 後ろ脚（右）の速いキック
        st, ac, N = 9, 3, 30
        chamber = merge(n0, pelvis=pel(n0, (-0.03, 0.02, 0.06), (-6, 30, -8)), spine=add(n0['spine'], (-4, 6, -4)), chest=add(n0['chest'], (-6, 8, -4)), head=add(n0['head'], (4, -34, 6)),
                        handL=hand(n0, 'handL', (0.05, -0.12, 0.05)), handR=hand(n0, 'handR', (0.20, -0.20, -0.10)),
                        footL=foot(n0, 'footL', (-0.02, -0.10, 0), yaw=-30), footR=dict(pos=(-0.20, 0.50, 0.62), yaw=-20, pitch=30, knee=0.2, toe=0), tail=(15, -20))
        hit = merge(n0, pelvis=pel(n0, (-0.04, 0.10, 0.10), (-16, 44, -12)), spine=add(n0['spine'], (-6, 8, -6)), chest=add(n0['chest'], (-8, 10, -6)), neck=add(n0['neck'], (8, -20, 6)), head=add(n0['head'], (10, -44, 8)),
                    handL=hand(n0, 'handL', (0.10, -0.15, 0.0)), handR=hand(n0, 'handR', (0.30, -0.25, -0.20)),
                    footL=foot(n0, 'footL', (-0.02, -0.10, 0), yaw=-42, pitch=6), footR=dict(pos=(-0.26, 1.50, 0.86), yaw=-24, pitch=52, knee=0.0, toe=-10), tail=(25, -30), keys=dict(n0['keys'], brow_angry=0.8))
        keys = [(0, n0), (5, chamber, 'out'), (st, hit, 'in3'), (st + ac, hit, 'lin'), (st + ac + 6, chamber, 'io'), (N, n0, 'io')]
        info = dict(startup=st, active=ac, recovery=N - st - ac, limb='footR', note='後ろ脚（右）を抱え込んでから前へ蹴り出す。軸足（左）は外へ回す')
    else:                     # godan: 大きく構えて振り下ろす
        st, ac, N = 18, 5, 52
        wind = merge(n0, pelvis=pel(n0, (0, -0.10, 0.02), (-10, -16, 0)), spine=add(n0['spine'], (-8, -4, 0)), chest=add(n0['chest'], (-12, -10, 0)), head=add(n0['head'], (6, 14, 0)),
                     handR=dict(pos=(0.15, 0.10, 0.93), fwd=(0.0, -0.3, 0.95), back=(0.3, -0.9, -0.2), elbow=(0.9, 0.0, 0.3)), handL=dict(pos=(-0.10, 0.75, 0.25), fwd=(0.0, 0.8, 0.6), back=(0.8, 0.0, 0.6), elbow=(0.8, -0.2, -0.5)),
                     footL=foot(n0, 'footL', (0, 0.04, 0.12), pitch=-8), tail=(-15, 0), keys=dict(n0['keys'], brow_angry=1.0), jaw=6.0)
        hit = merge(n0, pelvis=pel(n0, (0, 0.20, -0.20), (26, 26, 0)), spine=add(n0['spine'], (14, 6, 0)), chest=add(n0['chest'], (16, 14, 0)), neck=add(n0['neck'], (-14, -14, 0)), head=add(n0['head'], (-24, -22, 0)),
                    handR=dict(pos=(-0.25, 0.92, -0.30), fwd=(0.0, 0.85, -0.5), back=(0.15, 0.5, 0.85), elbow=(0.9, -0.3, 0.2)), handL=dict(pos=(0.10, 0.05, -0.10), fwd=(-0.1, 0.5, 0.85), back=(0.9, 0.4, 0.0), elbow=(0.7, -0.6, -0.4)),
                    footL=foot(n0, 'footL', (0.02, 0.30, 0)), footR=foot(n0, 'footR', (0, 0.06, 0), pitch=22), tail=(20, 10), keys=dict(n0['keys'], brow_angry=1.0), jaw=14.0)
        keys = [(0, n0), (11, wind, 'out'), (14, wind, 'lin'), (st, hit, 'in3'), (st + ac, hit, 'lin'), (st + ac + 12, merge(hit, pelvis=pel(n0, (0, 0.14, -0.14), (16, 14, 0))), 'out'), (N, n0, 'io')]
        info = dict(startup=st, active=ac, recovery=N - st - ac, hand='R', note='右拳を頭上へ振りかぶり、体重を乗せて振り下ろす')
    return dict(frames=N, loop=False, fn=keyed(keys), info=info)

def guard_stand(cid):
    n0 = neutral(cid); ent = 5; N = 29
    def g(br):
        return merge(n0, pelvis=pel(n0, (0, -0.06, -0.08 + 0.006 * br), (-2, 4, 0)), spine=add(n0['spine'], (6, 0, 0)), chest=add(n0['chest'], (8, 2, 0)), head=add(n0['head'], (10, 0, 0)),
                     handL=dict(pos=(-0.42, 0.50, 0.30), fwd=(-0.15, 0.10, 1.0), back=(0.25, 0.95, 0.0), elbow=(0.35, 0.3, -0.9)),
                     handR=dict(pos=(-0.42, 0.46, 0.26), fwd=(-0.15, 0.10, 1.0), back=(0.25, 0.95, 0.0), elbow=(0.35, 0.3, -0.9)),
                     footR=foot(n0, 'footR', (0, -0.04, 0)), tail=(-8, 0), keys=dict(n0['keys'], brow_angry=0.5))
    def fn(f):
        if f <= ent: return sample([(0, n0), (ent, g(0), 'out')], f)
        return g(math.sin(2 * math.pi * (f - ent) / (N - ent)))
    return dict(frames=N, loop=False, fn=fn, info=dict(enter_frames=ent, loop_from=ent, note='F5でガード姿勢。F5〜F29は保持ループ'))

def hurt_light(cid):
    n0 = neutral(cid); N = 20
    hit = merge(n0, pelvis=pel(n0, (0, -0.16, 0.0), (-10, 6, 0)), spine=add(n0['spine'], (-8, 2, 0)), chest=add(n0['chest'], (-12, 6, 2)), neck=add(n0['neck'], (-6, 0, 0)), head=add(n0['head'], (-16, 8, 4)),
                handL=hand(n0, 'handL', (0.12, -0.20, -0.06)), handR=hand(n0, 'handR', (0.14, -0.12, -0.10)),
                footL=foot(n0, 'footL', (0, -0.04, 0), pitch=-12), footR=foot(n0, 'footR', (0, -0.06, 0)), tail=(20, 10), keys=dict(n0['keys'], blink=1.0, brow_angry=0.6), jaw=10.0)
    back = merge(n0, pelvis=pel(n0, (0, -0.10, -0.06), (2, 2, 0)), chest=add(n0['chest'], (-2, 2, 0)), handL=hand(n0, 'handL', (0.05, -0.08, -0.02)), handR=hand(n0, 'handR', (0.05, -0.05, -0.04)),
                 keys=dict(n0['keys'], blink=0.4, brow_angry=0.4))
    keys = [(0, n0), (3, hit, 'out3'), (6, hit, 'lin'), (13, back, 'io'), (N, n0, 'io')]
    return dict(frames=N, loop=False, fn=keyed(keys), info=dict(hitstun=N, note='のけぞり。足は接地したまま、体は縮めない'))

CLIPS = ['idle', 'walk_f', 'walk_b', 'dash_f', 'crouch', 'jump_n', 'stand_light', 'stand_heavy', 'guard_stand', 'hurt_light']
def make(cid, name):
    return {'idle': idle, 'walk_f': lambda c: walk(c, 1), 'walk_b': lambda c: walk(c, -1), 'dash_f': dash_f, 'crouch': crouch, 'jump_n': jump_n,
            'stand_light': stand_light, 'stand_heavy': stand_heavy, 'guard_stand': guard_stand, 'hurt_light': hurt_light}[name](cid)
