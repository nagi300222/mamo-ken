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
    'moguzo': dict(yaw=-24, low=0.02, lean=5, lead=(0.00, 0.17), rear=(0.03, -0.15), lead_yaw=-8, rear_yaw=28,
                   handL=(0.12, 0.55, 0.00), handR=(0.10, 0.44, 0.06), idle_n=72, bob=0.014, walk_n=40, stride=0.42),
    'pisuke': dict(yaw=-34, low=0.06, lean=7, lead=(0.00, 0.30), rear=(0.04, -0.26), lead_yaw=-8, rear_yaw=36,
                   handL=(0.08, 0.60, 0.10), handR=(0.06, 0.46, 0.16), idle_n=44, bob=0.030, walk_n=30, stride=0.50),
    'godan': dict(yaw=-14, low=-0.02, lean=7, lead=(0.14, 0.14), rear=(0.18, -0.12), lead_yaw=8, rear_yaw=30,
                  handL=(0.30, 0.48, -0.14), handR=(0.28, 0.40, -0.10), idle_n=96, bob=0.012, walk_n=52, stride=0.34),
    # --- roster9 で追加した6体。heavy=強攻撃の型, heavy_k=その時間倍率, big=重量級の移動, crouch=(沈み, 前傾, 手の届く距離) ---
    'hakuma': dict(yaw=-12, low=-0.02, lean=4, lead=(0.10, 0.12), rear=(0.14, -0.10), lead_yaw=8, rear_yaw=28,
                   handL=(0.30, 0.50, -0.16), handR=(0.28, 0.42, -0.12), idle_n=104, bob=0.012, walk_n=58, stride=0.30,
                   wide=True, paw_open=0.85, big=True, heavy='straight', heavy_k=1.25, light=(6, 3, 22), crouch=(-0.22, 20, 0.55)),
    'chirka': dict(yaw=-38, low=0.0, lean=11, lead=(0.00, 0.30), rear=(0.05, -0.28), lead_yaw=-8, rear_yaw=38,
                   handL=(0.04, 0.62, -0.06), handR=(0.02, 0.40, 0.14), idle_n=40, bob=0.024, walk_n=28, stride=0.52,
                   brow=0.45, heel=10, heavy='kick', light=(3, 3, 14), crouch=(-0.34, 28, 0.42)),
    'takimaru': dict(yaw=-16, low=0.0, lean=6, lead=(0.12, 0.16), rear=(0.16, -0.14), lead_yaw=8, rear_yaw=30,
                     handL=(0.36, 0.62, 0.00), handR=(0.34, 0.52, 0.02), idle_n=88, bob=0.012, walk_n=50, stride=0.36,
                     wide=True, paw_open=1.0, big=True, heavy='hammer', light=(6, 3, 22), crouch=(-0.26, 22, 0.50)),
    'yomikage': dict(yaw=-40, low=0.03, lean=2, lead=(0.00, 0.26), rear=(0.04, -0.24), lead_yaw=-8, rear_yaw=40,
                     handL=(0.00, 0.50, 0.22), handR=(0.08, 0.42, -0.12), idle_n=110, bob=0.008, walk_n=44, stride=0.40,
                     heavy='straight', heavy_k=0.95, light=(4, 3, 17), crouch=(-0.34, 28, 0.42)),
    'bullet': dict(yaw=-22, low=0.02, lean=4, lead=(0.02, 0.20), rear=(0.06, -0.18), lead_yaw=-8, rear_yaw=28,
                   handL=(0.12, 0.55, 0.00), handR=(0.10, 0.44, 0.06), idle_n=64, bob=0.014, walk_n=38, stride=0.44,
                   heavy='straight', light=(4, 3, 18), crouch=(-0.30, 26, 0.48),
                   tail_bones=((-8, 10), (-4, 12), (4, 12), (12, 10), (16, 8), (14, 6))),
    'dark_moguzo': dict(yaw=-30, low=-0.02, lean=9, lead=(0.02, 0.24), rear=(0.05, -0.20), lead_yaw=-8, rear_yaw=32,
                        handL=(0.10, 0.58, 0.04), handR=(0.08, 0.46, 0.10), idle_n=56, bob=0.018, walk_n=34, stride=0.48,
                        brow=0.6, heavy='straight', heavy_k=0.85, light=(3, 3, 16), crouch=(-0.30, 26, 0.48)),
}
_HEAVY = dict(moguzo='straight', pisuke='kick', godan='hammer')
_BIG = ('godan',)
def is_big(cid): return STYLE[cid].get('big', cid in _BIG)

def neutral(cid):
    s = STYLE[cid]; y = s['yaw']
    wide = s.get('wide', cid == 'godan'); po = s.get('paw_open', 0.0)
    out = dict(
        pelvis=dict(pos=(0, 0, s['low']), rot=(s['lean'], y, 0)),
        spine=(3, y * 0.15, 0), chest=(4, y * 0.25, 0), neck=(-2, -y * 0.45, 0), head=(-6, -y * 0.80, 0), jaw=0.0,
        handL=dict(pos=s['handL'], fwd=(-0.10, 0.30, 0.95), back=(0.80, 0.60, 0.0) if not wide else (0.95, 0.30, 0.0), elbow=(0.55, -0.25, -0.8) if not wide else (0.9, -0.2, -0.4)),
        handR=dict(pos=s['handR'], fwd=(-0.10, 0.30, 0.95), back=(0.80, 0.60, 0.0) if not wide else (0.95, 0.30, 0.0), elbow=(0.55, -0.25, -0.8) if not wide else (0.9, -0.2, -0.4)),
        footL=dict(pos=(s['lead'][0], s['lead'][1], 0), yaw=s['lead_yaw'], pitch=0, knee=0.05),
        footR=dict(pos=(s['rear'][0], s['rear'][1], 0), yaw=s['rear_yaw'], pitch=0, knee=0.15),
        tail=(0, 0), keys=dict(paw_open_L=po, paw_open_R=po, blink=0.0, brow_angry=s.get('brow', 0.65 if cid == 'godan' else 0.0)),
    )
    if 'tail_bones' in s: out['tail_bones'] = s['tail_bones']
    return out

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
    n0 = neutral(cid); s = STYLE[cid]; N = s['idle_n']; b = s['bob']; ts = 0.4 if 'tail_bones' in s else 1.0
    def fn(f):
        p = 2 * math.pi * f / N; a = math.sin(p); c = math.sin(p - 0.9) + math.sin(0.9); blink = 1.0 if (cid != 'godan' and N * 0.55 <= f <= N * 0.55 + 4) else 0.0
        heel = max(0.0, a) * s.get('heel', 14 if cid == 'pisuke' else 0)
        return merge(n0, pelvis=pel(n0, (0, 0, b * a), (0.8 * a, 0, 0)), chest=add(n0['chest'], (1.5 * c, 0, 0)), head=add(n0['head'], (-1.2 * c, 0, 0)),
                     handL=hand(n0, 'handL', (0, 0.01 * c, 0.018 * c)), handR=hand(n0, 'handR', (0, 0.008 * c, 0.022 * c)),
                     footR=foot(n0, 'footR', pitch=heel), tail=(3 * a * ts, 4 * math.sin(p * 1) * ts),
                     keys=dict(n0['keys'], blink=blink))
    return dict(frames=N, loop=True, fn=fn, info=dict(note='待機。呼吸で上下する'))

def walk(cid, direction):
    n0 = neutral(cid); s = STYLE[cid]; N = s['walk_n'] if direction > 0 else int(s['walk_n'] * 1.15); stride = s['stride'] * (1.0 if direction > 0 else 0.8); duty = 0.62
    def cyc(u):                       # u:0..1 → (前後 -0.5..0.5, 持ち上げ 0..1)
        u = u % 1.0
        if u < duty: return 0.5 - u / duty, 0.0
        t = (u - duty) / (1 - duty); e = t * t * (3 - 2 * t); return -0.5 + e, math.sin(math.pi * t)
    def fn(f):
        u = f / N * direction; (a, la), (b, lb) = cyc(u), cyc(u + 0.5); p = 2 * math.pi * f / N
        bobz = -0.018 * math.cos(2 * p) ; lift = 0.14 if not is_big(cid) else 0.10
        return merge(n0, pelvis=pel(n0, (0.02 * math.sin(p), 0, bobz + 0.01), (2.0 * direction, 3 * math.sin(p), 1.5 * math.sin(p))),
                     chest=add(n0['chest'], (0, -4 * math.sin(p), 0)), head=add(n0['head'], (0, 1.5 * math.sin(p), 0)),
                     footL=foot(n0, 'footL', (0, a * stride, la * lift), pitch=la * 18 * direction),
                     footR=foot(n0, 'footR', (0, b * stride, lb * lift), pitch=lb * 18 * direction),
                     handL=hand(n0, 'handL', (0, 0.02 * math.sin(p), 0.015 * math.cos(2 * p))), handR=hand(n0, 'handR', (0, -0.02 * math.sin(p), 0.015 * math.cos(2 * p))),
                     tail=(4, 8 * math.sin(p)))
    dist = stride / duty
    return dict(frames=N, loop=True, fn=fn, info=dict(move_per_loop_leg=round(dist * direction, 4), note='足の接地中は一定速で後ろへ流れる。ゲーム側でこの速度で前進させれば滑らない'))

def dash_f(cid):
    n0 = neutral(cid); N = 22 if not is_big(cid) else 28; k = N / 22.0; F = lambda x: int(round(x * k))
    anti = merge(n0, pelvis=pel(n0, (0, -0.06, -0.14), (8, 0, 0)), chest=add(n0['chest'], (6, 0, 0)), handL=hand(n0, 'handL', (0, -0.08, -0.05)), handR=hand(n0, 'handR', (0, -0.10, -0.05)),
                 footR=foot(n0, 'footR', pitch=18))
    fly = merge(n0, pelvis=pel(n0, (0, 0.10, -0.02), (16, 0, 0)), spine=add(n0['spine'], (4, 0, 0)), chest=add(n0['chest'], (8, 0, 0)), head=add(n0['head'], (-14, 0, 0)),
                handL=hand(n0, 'handL', (0, 0.10, -0.05)), handR=hand(n0, 'handR', (0.05, -0.20, -0.20)),
                footL=foot(n0, 'footL', (0, 0.30, 0.10), pitch=-14), footR=foot(n0, 'footR', (0, -0.22, 0.16), pitch=40), tail=(22, 0))
    land = merge(n0, pelvis=pel(n0, (0, 0.04, -0.12), (10, 0, 0)), chest=add(n0['chest'], (5, 0, 0)), footL=foot(n0, 'footL', (0, 0.10, 0)), footR=foot(n0, 'footR', (0, 0.05, 0), pitch=10), tail=(-8, 0))
    keys = [(0, n0), (F(4), anti, 'out'), (F(9), fly, 'out'), (F(14), fly, 'lin'), (F(17), land, 'in'), (N, n0, 'io')]
    return dict(frames=N, loop=False, fn=keyed(keys), info=dict(move_total_leg=2.2 if not is_big(cid) else 1.7, move_frames=[F(4), F(17)], note='F4で踏み切り、F17で着地。移動はこの区間に配分する'))

def crouch(cid):
    n0 = neutral(cid); s = STYLE[cid]; deep, lean, reach = s.get('crouch', dict(moguzo=(-0.30, 26, 0.48), pisuke=(-0.42, 32, 0.40), godan=(-0.24, 20, 0.55)).get(cid))
    def low(br):
        return merge(n0, pelvis=pel(n0, (0.03, 0.06, deep + br * 0.012), (lean, 4, 7)), spine=add(n0['spine'], (lean * 0.55 + br, 0, 4)), chest=add(n0['chest'], (lean * 0.55, 6, 8)), neck=add(n0['neck'], (-lean * 0.5, 0, -6)), head=add(n0['head'], (-lean * 1.1, 0, -9)),
                     handL=dict(space='root', pos=(0.10, s['lead'][1] + reach, 0.17), fwd=(0.05, 0.95, -0.30), back=(0.0, 0.25, 1.0), elbow=(0.9, -0.2, 0.3)),
                     handR=hand(n0, 'handR', (0.02, -0.04, 0.02)),
                     footL=foot(n0, 'footL', (0.10, -0.04, 0), knee=0.7), footR=foot(n0, 'footR', (0.08, 0.10, 0), knee=0.9, pitch=6),
                     tail=(-10, 0), keys=dict(n0['keys'], paw_open_L=1.0))
    N = 48; ent = 12
    def fn(f):
        if f <= ent: return sample([(0, n0), (ent, low(0), 'io')], f)
        return low(math.sin(2 * math.pi * (f - ent) / (N - ent)))
    return dict(frames=N, loop=False, fn=fn, info=dict(enter_frames=ent, loop_from=ent, note='F12まででしゃがみ切り、F12〜F48は呼吸の保持ループ。リード手（左）を地面につく'))

def jump_n(cid):
    n0 = neutral(cid); pre = 4 if not is_big(cid) else 6; air = 36 if not is_big(cid) else 34; landf = 8; N = pre + air + landf
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
    return dict(frames=N, loop=False, fn=keyed(keys), info=dict(prejump=pre, airborne=[a0, a1], land_recovery=landf, jump_height_leg=2.6 if not is_big(cid) else 2.0,
                note='上下移動は含まない（ルートは地面のまま）。airborne の区間にゲーム側で放物線の高さを与える'))

def stand_light(cid):
    n0 = neutral(cid); st, ac, N = STYLE[cid].get('light', dict(moguzo=(4, 3, 18), pisuke=(3, 3, 15), godan=(6, 3, 22)).get(cid))
    wind = merge(n0, pelvis=pel(n0, (0, -0.03, -0.02), (0, 6, 0)), chest=add(n0['chest'], (0, 8, 0)), handL=hand(n0, 'handL', (0.04, -0.12, 0.02)))
    hit = merge(n0, pelvis=pel(n0, (0, 0.10, -0.04), (6, -14, 0)), spine=add(n0['spine'], (2, -6, 0)), chest=add(n0['chest'], (4, -16, -3)), head=add(n0['head'], (-4, 26, 0)),
                handL=dict(space='world', pos=(-0.14, 0.96, 0.02), fwd=(0.0, 1.0, 0.0), back=(0.2, 0.0, 1.0), elbow=(0.9, -0.1, -0.4)), handR=hand(n0, 'handR', (0.0, -0.10, 0.04)),
                footL=foot(n0, 'footL', (0, 0.08, 0)), footR=foot(n0, 'footR', pitch=14), tail=(10, 12), keys=dict(n0['keys'], brow_angry=0.7))
    keys = [(0, n0), (max(1, st - 2), wind, 'out'), (st, hit, 'in'), (st + ac, hit, 'lin'), (N, n0, 'io')]
    return dict(frames=N, loop=False, fn=keyed(keys), info=dict(startup=st, active=ac, recovery=N - st - ac, hand='L', note='前手（左）のジャブ'))

def stand_heavy(cid):
    n0 = neutral(cid); kind = STYLE[cid].get('heavy', _HEAVY.get(cid)); tk = STYLE[cid].get('heavy_k', 1.0)
    if kind == 'straight':    # 踏み込みストレート（後ろ手＝右）
        st, ac, N = 12, 4, 40
        wind = merge(n0, pelvis=pel(n0, (0, -0.10, -0.08), (4, -20, 0)), chest=add(n0['chest'], (2, -18, 0)), head=add(n0['head'], (0, 30, 0)),
                     handR=dict(pos=(0.10, -0.05, -0.05), fwd=(0.0, 1.0, 0.1), back=(0.6, 0.0, 0.8), elbow=(0.5, -0.8, -0.3)), handL=hand(n0, 'handL', (0.05, 0.05, 0.05)),
                     footL=foot(n0, 'footL', (0, 0.05, 0.10), pitch=-10), footR=foot(n0, 'footR', pitch=10), tail=(-10, -15), keys=dict(n0['keys'], brow_angry=1.0))
        hit = merge(n0, pelvis=pel(n0, (0, 0.30, -0.16), (14, 48, 0)), spine=add(n0['spine'], (4, 12, 0)), chest=add(n0['chest'], (6, 26, 0)), neck=add(n0['neck'], (0, -30, 0)), head=add(n0['head'], (-10, -52, 0)),
                    handR=dict(space='world', pos=(-0.16, 0.96, 0.0), fwd=(0.0, 1.0, 0.0), back=(0.2, 0.0, 1.0), elbow=(0.9, -0.1, -0.3)), handL=dict(pos=(0.05, -0.05, -0.02), fwd=(-0.1, 0.5, 0.85), back=(0.8, 0.5, 0.0), elbow=(0.5, -0.7, -0.5)),
                    footL=foot(n0, 'footL', (0.02, 0.55, 0), yaw=6), footR=foot(n0, 'footR', (0, 0.10, 0), pitch=38, yaw=-10), tail=(12, 22), keys=dict(n0['keys'], brow_angry=1.0), jaw=10.0)
        rec = merge(n0, pelvis=pel(n0, (0, 0.18, -0.12), (10, 26, 0)), chest=add(n0['chest'], (5, 12, 0)), head=add(n0['head'], (-6, -30, 0)),
                    handR=dict(space='world', pos=(-0.10, 0.70, 0.0), fwd=(-0.05, 0.9, 0.4), back=(0.6, 0.2, 0.7), elbow=(0.7, -0.2, -0.6)), footL=foot(n0, 'footL', (0.02, 0.40, 0)), footR=foot(n0, 'footR', (0, 0.08, 0), pitch=20))
        keys = [(0, n0), (7, wind, 'out'), (st, hit, 'in'), (st + ac, hit, 'lin'), (st + ac + 8, rec, 'out'), (N, n0, 'io')]
        info = dict(startup=st, active=ac, recovery=N - st - ac, hand='R', note='左足で踏み込み、腰の回転で後ろ手（右）のストレート')
    elif kind == 'kick':      # 後ろ脚（右）の速いキック
        st, ac, N = 9, 3, 30
        chamber = merge(n0, pelvis=pel(n0, (-0.03, 0.02, 0.06), (-6, 30, -8)), spine=add(n0['spine'], (-4, 6, -4)), chest=add(n0['chest'], (-6, 8, -4)), head=add(n0['head'], (4, -34, 6)),
                        handL=hand(n0, 'handL', (0.05, -0.12, 0.05)), handR=hand(n0, 'handR', (0.20, -0.20, -0.10)),
                        footL=foot(n0, 'footL', (-0.02, -0.10, 0), yaw=-30), footR=dict(pos=(-0.20, 0.50, 0.62), yaw=-20, pitch=30, knee=0.2, toe=0), tail=(15, -20))
        hit = merge(n0, pelvis=pel(n0, (-0.04, 0.22, 0.10), (-16, 44, -12)), spine=add(n0['spine'], (-6, 8, -6)), chest=add(n0['chest'], (-8, 10, -6)), neck=add(n0['neck'], (8, -20, 6)), head=add(n0['head'], (10, -44, 8)),
                    handL=hand(n0, 'handL', (0.10, -0.15, 0.0)), handR=hand(n0, 'handR', (0.30, -0.25, -0.20)),
                    footL=foot(n0, 'footL', (-0.02, -0.10, 0), yaw=-42, pitch=6), footR=dict(pos=(-0.22, 1.12, 0.78), yaw=-24, pitch=-20, knee=0.0, toe=0), tail=(25, -30), keys=dict(n0['keys'], brow_angry=0.8))
        keys = [(0, n0), (5, chamber, 'out'), (st, hit, 'in'), (st + ac, hit, 'lin'), (st + ac + 6, chamber, 'io'), (N, n0, 'io')]
        info = dict(startup=st, active=ac, recovery=N - st - ac, limb='footR', note='後ろ脚（右）を抱え込んでから前へ蹴り出す。軸足（左）は外へ回す')
    else:                     # godan: 大きく構えて振り下ろす
        st, ac, N = 18, 5, 52
        wind = merge(n0, pelvis=pel(n0, (0, -0.10, 0.02), (-10, -16, 0)), spine=add(n0['spine'], (-8, -4, 0)), chest=add(n0['chest'], (-12, -10, 0)), head=add(n0['head'], (6, 14, 0)),
                     handR=dict(pos=(0.15, 0.10, 0.93), fwd=(0.0, -0.3, 0.95), back=(0.3, -0.9, -0.2), elbow=(0.9, 0.0, 0.3)), handL=dict(pos=(-0.10, 0.75, 0.25), fwd=(0.0, 0.8, 0.6), back=(0.8, 0.0, 0.6), elbow=(0.8, -0.2, -0.5)),
                     footL=foot(n0, 'footL', (0, 0.04, 0.12), pitch=-8), tail=(-15, 0), keys=dict(n0['keys'], brow_angry=1.0), jaw=6.0)
        hit = merge(n0, pelvis=pel(n0, (0, 0.18, -0.12), (13, 26, 0)), spine=add(n0['spine'], (8, 6, 0)), chest=add(n0['chest'], (10, 14, 0)), neck=add(n0['neck'], (-8, -14, 0)), head=add(n0['head'], (-14, -22, 0)),
                    handR=dict(space='world', pos=(-0.16, 0.90, -0.32), fwd=(0.0, 0.85, -0.5), back=(0.15, 0.5, 0.85), elbow=(0.9, -0.3, 0.2)), handL=dict(pos=(0.10, 0.05, -0.10), fwd=(-0.1, 0.5, 0.85), back=(0.9, 0.4, 0.0), elbow=(0.7, -0.6, -0.4)),
                    footL=foot(n0, 'footL', (0.02, 0.30, 0)), footR=foot(n0, 'footR', (0, 0.06, 0), pitch=22), tail=(20, 10), keys=dict(n0['keys'], brow_angry=1.0), jaw=14.0)
        keys = [(0, n0), (11, wind, 'out'), (14, wind, 'lin'), (st, hit, 'in'), (st + ac, hit, 'lin'), (st + ac + 12, merge(hit, pelvis=pel(n0, (0, 0.12, -0.08), (9, 14, 0))), 'out'), (N, n0, 'io')]
        info = dict(startup=st, active=ac, recovery=N - st - ac, hand='R', note='右拳を頭上へ振りかぶり、体重を乗せて振り下ろす')
    if tk != 1.0:             # キャラごとの速さ（型は同じで時間だけ伸縮）
        sc = lambda f: int(round(f * tk)); keys = [(sc(k[0]),) + tuple(k[1:]) for k in keys]; N = keys[-1][0]
        st2 = sc(info['startup']); ac2 = max(2, sc(info['active'])); info = dict(info, startup=st2, active=ac2, recovery=N - st2 - ac2)
    return dict(frames=N, loop=False, fn=keyed(keys), info=info)

def guard_stand(cid):
    n0 = neutral(cid); ent = 5; N = 29
    def g(br):
        return merge(n0, pelvis=pel(n0, (0, -0.06, -0.08 + 0.006 * br), (-2, 4, 0)), spine=add(n0['spine'], (6, 0, 0)), chest=add(n0['chest'], (8, 2, 0)), head=add(n0['head'], (10, 0, 0)),
                     handL=dict(pos=(-0.36, 0.52, 0.16), fwd=(-0.15, 0.10, 1.0), back=(0.25, 0.95, 0.0), elbow=(0.35, 0.3, -0.9)),
                     handR=dict(pos=(-0.36, 0.48, 0.12), fwd=(-0.15, 0.10, 1.0), back=(0.25, 0.95, 0.0), elbow=(0.35, 0.3, -0.9)),
                     footR=foot(n0, 'footR', (0, -0.04, 0)), tail=(-8, 0), keys=dict(n0['keys'], brow_angry=0.5))
    def fn(f):
        if f <= ent: return sample([(0, n0), (ent, g(0), 'out')], f)
        return g(math.sin(2 * math.pi * (f - ent) / (N - ent)))
    return dict(frames=N, loop=False, fn=fn, info=dict(enter_frames=ent, loop_from=ent, note='F5でガード姿勢。F5〜F29は保持ループ'))

def hurt_light(cid):
    n0 = neutral(cid); N = 20
    hit = merge(n0, pelvis=pel(n0, (0, -0.16, 0.0), (-5, 6, 0)), spine=add(n0['spine'], (-5, 2, 0)), chest=add(n0['chest'], (-9, 6, 2)), neck=add(n0['neck'], (-3, 0, 0)), head=add(n0['head'], (-5, 8, 4)),
                handL=hand(n0, 'handL', (0.12, -0.20, -0.06)), handR=hand(n0, 'handR', (0.14, -0.12, -0.10)),
                footL=foot(n0, 'footL', (0, -0.04, 0), pitch=-12), footR=foot(n0, 'footR', (0, -0.06, 0)), tail=(20, 10), keys=dict(n0['keys'], blink=1.0, brow_angry=0.6), jaw=10.0)
    back = merge(n0, pelvis=pel(n0, (0, -0.10, -0.06), (2, 2, 0)), chest=add(n0['chest'], (-2, 2, 0)), handL=hand(n0, 'handL', (0.05, -0.08, -0.02)), handR=hand(n0, 'handR', (0.05, -0.05, -0.04)),
                 keys=dict(n0['keys'], blink=0.4, brow_angry=0.4))
    keys = [(0, n0), (3, hit, 'out3'), (6, hit, 'lin'), (13, back, 'io'), (N, n0, 'io')]
    return dict(frames=N, loop=False, fn=keyed(keys), info=dict(hitstun=N, note='のけぞり。足は接地したまま、体は縮めない'))

# ================= キャラ固有モーション（roster9）。技名・フレーム・性能はすべてAIの仮案で、本人未確定 =================
def W(pos, fwd=(0, 1.0, 0), back=(0.2, 0, 1.0), elbow=(0.9, -0.1, -0.4)):
    return dict(space='world', pos=pos, fwd=fwd, back=back, elbow=elbow)
def K(n0, **kw): return dict(n0['keys'], **kw)

def sp_rising_upper(cid):        # moguzo: 沈み込みから跳び上がるアッパー（対空）
    n0 = neutral(cid); st, ac, N = 6, 8, 46
    dip = merge(n0, pelvis=pel(n0, (0, 0.04, -0.22), (14, 10, 0)), chest=add(n0['chest'], (8, 10, 0)), handR=W((0.05, 0.30, -0.55), fwd=(0, 0.6, 0.8), back=(0.3, -0.9, 0.3), elbow=(0.6, -0.7, -0.3)),
                handL=hand(n0, 'handL', (0, -0.10, 0.05)), tail=(-12, 0), keys=K(n0, brow_angry=1.0))
    up = merge(n0, pelvis=pel(n0, (0, 0.14, 0.30), (-8, 34, 0)), spine=add(n0['spine'], (-6, 8, 0)), chest=add(n0['chest'], (-10, 16, 0)), head=add(n0['head'], (-14, -40, 0)),
               handR=W((-0.12, 0.42, 0.86), fwd=(0, 0.15, 1.0), back=(0.2, -1.0, 0.1), elbow=(0.7, 0.2, -0.6)), handL=hand(n0, 'handL', (0.05, -0.15, -0.10)),
               footL=foot(n0, 'footL', (0, 0.06, 0.22), pitch=35), footR=foot(n0, 'footR', (0, 0.10, 0.30), pitch=45), tail=(25, 0), jaw=12.0, keys=K(n0, brow_angry=1.0))
    fall = merge(n0, pelvis=pel(n0, (0, 0.10, 0.12), (0, 14, 0)), handR=W((-0.05, 0.40, 0.45), fwd=(0, 0.3, 1.0), back=(0.4, -0.8, 0.2), elbow=(0.7, -0.2, -0.6)),
                 footL=foot(n0, 'footL', (0, 0.04, 0.08), pitch=20), footR=foot(n0, 'footR', (0, 0.06, 0.10), pitch=25), tail=(20, 0))
    land = merge(n0, pelvis=pel(n0, (0, 0.04, -0.16), (10, 4, 0)), tail=(-10, 0))
    keys = [(0, n0), (st - 2, dip, 'out'), (st + 2, up, 'in'), (st + ac, up, 'lin'), (st + ac + 10, fall, 'io'), (st + ac + 16, land, 'in'), (N, n0, 'io')]
    return dict(frames=N, loop=False, fn=keyed(keys), info=dict(name_jp='昇り拳（仮称）', startup=st, active=ac, recovery=N - st - ac, hand='R', anti_air=True, hop_frames=[st, st + ac + 14],
                note='沈み込みから体ごと跳び上がる右アッパー。小さな跳躍はクリップに含む'))

def sp_double_kick(cid):         # pisuke: 中段→上段の二連蹴り
    n0 = neutral(cid); N = 40
    def kick(pos, pit, pp, pr):
        return merge(n0, pelvis=pel(n0, pp, pr), spine=add(n0['spine'], (-6, 8, -6)), chest=add(n0['chest'], (-8, 10, -6)), neck=add(n0['neck'], (8, -20, 6)), head=add(n0['head'], (10, -44, 8)),
                     handL=hand(n0, 'handL', (0.10, -0.15, 0.0)), handR=hand(n0, 'handR', (0.30, -0.25, -0.20)),
                     footL=foot(n0, 'footL', (-0.02, -0.10, 0), yaw=-42, pitch=6), footR=dict(pos=pos, yaw=-24, pitch=pit, knee=0.0, toe=0), tail=(25, -30), keys=K(n0, brow_angry=0.8))
    chamber = merge(n0, pelvis=pel(n0, (-0.03, 0.02, 0.06), (-6, 30, -8)), spine=add(n0['spine'], (-4, 6, -4)), chest=add(n0['chest'], (-6, 8, -4)), head=add(n0['head'], (4, -34, 6)),
                    handL=hand(n0, 'handL', (0.05, -0.12, 0.05)), handR=hand(n0, 'handR', (0.20, -0.20, -0.10)),
                    footL=foot(n0, 'footL', (-0.02, -0.10, 0), yaw=-30), footR=dict(pos=(-0.20, 0.50, 0.62), yaw=-20, pitch=30, knee=0.2, toe=0), tail=(15, -20))
    mid = kick((-0.22, 1.12, 0.46), -10, (-0.04, 0.20, 0.06), (-10, 40, -10)); high = kick((-0.22, 0.98, 1.02), -32, (-0.05, 0.22, 0.12), (-22, 46, -14))
    keys = [(0, n0), (5, chamber, 'out'), (8, mid, 'in'), (10, mid, 'lin'), (14, chamber, 'io'), (18, high, 'in'), (21, high, 'lin'), (28, chamber, 'io'), (N, n0, 'io')]
    return dict(frames=N, loop=False, fn=keyed(keys), info=dict(name_jp='連脚（仮称）', startup=8, hits=[[8, 10], [18, 21]], recovery=N - 21, limb='footR', note='後ろ脚で中段→上段の二連蹴り'))

def sp_shoulder_charge(cid):     # godan: 低く構えて肩からぶつかる突進
    n0 = neutral(cid); st, ac, N = 14, 8, 48
    load = merge(n0, pelvis=pel(n0, (0, -0.12, -0.14), (10, -10, 0)), chest=add(n0['chest'], (8, -8, 0)), handL=hand(n0, 'handL', (-0.20, -0.15, 0.10)), handR=hand(n0, 'handR', (-0.10, -0.20, -0.10)),
                 footL=foot(n0, 'footL', (0, 0.02, 0.10), pitch=-8), tail=(-10, 0), keys=K(n0, brow_angry=1.0))
    ram = merge(n0, pelvis=pel(n0, (0, 0.42, -0.20), (26, -34, -6)), spine=add(n0['spine'], (8, -10, 0)), chest=add(n0['chest'], (8, -18, -6)), neck=add(n0['neck'], (-6, 20, 0)), head=add(n0['head'], (-16, 40, 0)),
                handL=dict(pos=(-0.30, 0.35, 0.05), fwd=(-0.3, 0.2, 0.9), back=(0.5, 0.85, 0.0), elbow=(0.6, 0.5, -0.6)), handR=hand(n0, 'handR', (0.10, -0.25, -0.15)),
                footL=foot(n0, 'footL', (0, 0.50, 0)), footR=foot(n0, 'footR', (0, 0.20, 0), pitch=30), tail=(18, 0), keys=K(n0, brow_angry=1.0))
    keys = [(0, n0), (9, load, 'out'), (st, ram, 'in'), (st + ac, ram, 'lin'), (st + ac + 12, merge(ram, pelvis=pel(n0, (0, 0.20, -0.10), (12, -14, 0))), 'out'), (N, n0, 'io')]
    return dict(frames=N, loop=False, fn=keyed(keys), info=dict(name_jp='肩当て突進（仮称）', startup=st, active=ac, recovery=N - st - ac, move_total_leg=1.6, move_frames=[9, st + ac], armor_frames=[6, st + ac],
                note='左肩を前に出して体ごとぶつかる。アーマー区間は仮案'))

def sp_harite(cid):              # hakuma: 開いた手の連続突っ張り
    n0 = neutral(cid); N = 42
    palm = dict(space='world', pos=(-0.12, 0.95, 0.06), fwd=(0, 0.25, 1.0), back=(0, -1.0, 0.25), elbow=(0.8, -0.2, -0.5))
    def thr(lead, d):
        sg = 1 if lead == 'L' else -1; o = 'R' if lead == 'L' else 'L'
        return merge(n0, pelvis=pel(n0, (0, 0.08 + d, -0.06), (6, -16 * sg, 0)), chest=add(n0['chest'], (4, -18 * sg, 0)), head=add(n0['head'], (-4, 30 * sg, 0)),
                     footL=foot(n0, 'footL', (0, d, 0)), footR=foot(n0, 'footR', (0, d * 0.5, 0), pitch=12),
                     keys=K(n0, paw_open_L=1.0, paw_open_R=1.0, brow_angry=0.6), **{'hand' + lead: palm, 'hand' + o: hand(n0, 'hand' + o, (0.0, -0.25, 0.0))})
    keys = [(0, n0), (6, thr('L', 0.05), 'in'), (9, thr('L', 0.05), 'lin'), (14, thr('R', 0.12), 'io'), (17, thr('R', 0.12), 'lin'), (22, thr('L', 0.20), 'io'), (25, thr('L', 0.20), 'lin'), (N, n0, 'io')]
    return dict(frames=N, loop=False, fn=keyed(keys), info=dict(name_jp='連続突っ張り（仮称）', startup=6, hits=[[6, 9], [14, 17], [22, 25]], recovery=N - 25, move_total_leg=0.5, move_frames=[6, 25], note='開いた手で左・右・左と押し込む'))

def sp_feint_claw(cid):          # chirka: 身を引くフェイントから低い爪払い
    n0 = neutral(cid); N = 40
    sway = merge(n0, pelvis=pel(n0, (0, -0.22, 0.04), (-12, 8, 0)), chest=add(n0['chest'], (-8, 6, 0)), head=add(n0['head'], (6, 0, -8)), handL=hand(n0, 'handL', (0.10, -0.20, 0.15)), handR=hand(n0, 'handR', (0.15, -0.10, 0.20)),
                 footL=foot(n0, 'footL', (0, -0.12, 0.04), pitch=-10), tail=(15, 20))
    lunge = merge(n0, pelvis=pel(n0, (0, 0.40, -0.24), (30, 30, 0)), spine=add(n0['spine'], (10, 8, 0)), chest=add(n0['chest'], (10, 18, 0)), neck=add(n0['neck'], (-12, -16, 0)), head=add(n0['head'], (-24, -30, 0)),
                  handR=dict(space='world', pos=(-0.15, 0.92, -0.50), fwd=(0, 0.9, -0.4), back=(0.3, 0.4, 0.85), elbow=(0.9, -0.3, 0.1)), handL=hand(n0, 'handL', (0.05, -0.20, -0.10)),
                  footL=foot(n0, 'footL', (0, 0.45, 0)), footR=foot(n0, 'footR', (0, 0.12, 0), pitch=35), tail=(20, -20), keys=K(n0, paw_open_R=1.0, brow_angry=1.0))
    keys = [(0, n0), (9, sway, 'out'), (12, sway, 'lin'), (17, lunge, 'in'), (20, lunge, 'lin'), (29, merge(lunge, pelvis=pel(n0, (0, 0.20, -0.12), (14, 12, 0)), keys=K(n0, paw_open_R=0.4)), 'out'), (N, n0, 'io')]
    return dict(frames=N, loop=False, fn=keyed(keys), info=dict(name_jp='影引き爪（仮称）', feint_frames=[0, 12], startup=17, active=3, recovery=N - 20, hand='R', low_attack=True, move_total_leg=0.9, move_frames=[12, 20],
                note='いったん身を引いて誘い、低く踏み込んで開いた右手で払う。毒などの効果は未定義'))

def sp_bear_grab(cid):           # takimaru: 両腕を広げてつかみにいく（投げの始動）
    n0 = neutral(cid); N = 52
    arm_open = dict(pos=(0.80, 0.35, 0.25), fwd=(0.3, 0.9, 0.2), back=(0.9, -0.3, 0.0), elbow=(0.5, -0.6, -0.5))
    arm_shut = dict(space='world', pos=(-0.42, 0.80, 0.0), fwd=(-0.6, 0.8, 0.0), back=(0.7, 0.6, 0.3), elbow=(0.9, -0.1, -0.3))
    wide = merge(n0, pelvis=pel(n0, (0, -0.05, 0.03), (-4, 14, 0)), chest=add(n0['chest'], (-6, 14, 0)), head=add(n0['head'], (0, -14, 0)), handL=arm_open, handR=arm_open, jaw=12.0, tail=(-8, 0), keys=K(n0, paw_open_L=1.0, paw_open_R=1.0))
    shut = merge(n0, pelvis=pel(n0, (0, 0.30, -0.10), (16, 14, 0)), chest=add(n0['chest'], (10, 14, 0)), head=add(n0['head'], (-12, -14, 0)), handL=arm_shut, handR=arm_shut,
                 footL=foot(n0, 'footL', (0, 0.35, 0)), footR=foot(n0, 'footR', (0, 0.10, 0), pitch=20), tail=(15, 0), keys=K(n0, paw_open_L=0.3, paw_open_R=0.3, brow_angry=0.8))
    keys = [(0, n0), (10, wide, 'out'), (13, wide, 'lin'), (18, shut, 'in'), (22, shut, 'lin'), (35, merge(shut, pelvis=pel(n0, (0, 0.15, -0.05), (8, 14, 0))), 'out'), (N, n0, 'io')]
    return dict(frames=N, loop=False, fn=keyed(keys), info=dict(name_jp='抱え込み（仮称）', startup=18, active=4, recovery=N - 22, throw=True, move_total_leg=0.6, move_frames=[13, 20], note='両腕を大きく広げてから前で閉じる。つかんだ後の投げ動作は未制作'))

def sp_counter(cid):             # yomikage: 包帯の腕で受ける構え→掌底の反撃
    n0 = neutral(cid); N = 54
    def stance(br):
        return merge(n0, pelvis=pel(n0, (0, -0.10, -0.04 + 0.005 * br), (-2, -8, 0)), chest=add(n0['chest'], (-2, -6, 0)), handL=dict(pos=(-0.25, 0.52, 0.20), fwd=(0, 0.05, 1.0), back=(0.1, 1.0, 0.0), elbow=(0.3, 0.2, -0.9)),
                     handR=hand(n0, 'handR', (0.0, -0.15, -0.15)), tail=(-6, 0), keys=K(n0, brow_angry=0.3))
    strike = merge(n0, pelvis=pel(n0, (0, 0.28, -0.08), (8, 40, 0)), chest=add(n0['chest'], (6, 24, 0)), neck=add(n0['neck'], (0, -28, 0)), head=add(n0['head'], (-8, -40, 0)),
                   handR=dict(space='world', pos=(-0.16, 0.96, 0.10), fwd=(0, 0.3, 1.0), back=(0, -1.0, 0.3), elbow=(0.8, -0.2, -0.5)), handL=dict(pos=(0.05, 0.05, -0.05), fwd=(-0.1, 0.5, 0.85), back=(0.8, 0.5, 0.0), elbow=(0.5, -0.7, -0.5)),
                   footL=foot(n0, 'footL', (0, 0.40, 0)), footR=foot(n0, 'footR', (0, 0.12, 0), pitch=30), tail=(14, 14), keys=K(n0, paw_open_R=1.0, brow_angry=0.9))
    def fn(f):
        if f <= 6: return sample([(0, n0), (6, stance(0), 'out')], f)
        if f <= 26: return stance(math.sin(math.pi * (f - 6) / 20))
        return sample([(26, stance(0)), (31, strike, 'in'), (35, strike, 'lin'), (N, n0, 'io')], f)
    return dict(frames=N, loop=False, fn=fn, info=dict(name_jp='受け返し（仮称）', counter_window=[6, 26], startup=31, active=4, recovery=N - 35, hand='R', note='左前腕（包帯）を立てて受ける構えを保ち、右の掌底で返す。成立条件はゲーム側で未定義'))

def sp_tail_whip(cid):           # bullet: 体を回して長い尻尾を振り抜く長リーチ打撃
    n0 = neutral(cid); st, ac, N = 16, 5, 48; Z = tuple((0, 0) for _ in STYLE[cid]['tail_bones'])
    bal = lambda: dict(handL=hand(n0, 'handL', (0.25, -0.20, 0.05)), handR=hand(n0, 'handR', (0.25, -0.15, 0.0)))
    coil = merge(n0, pelvis=pel(n0, (0, -0.06, -0.10), (8, -30, 0)), chest=add(n0['chest'], (4, -14, 0)), head=add(n0['head'], (0, 34, 0)), tail=(6, -22), tail_bones=Z, keys=K(n0, brow_angry=0.8), **bal())
    def turn(yaw, lift, fwd, tail):
        w = yaw / 150.0
        return merge(n0, pelvis=pel(n0, (0, fwd, -0.06 + lift * 0.5), (6, yaw + 22, 0)), spine=add(n0['spine'], (0, 6 * w, 0)), chest=add(n0['chest'], (4, -10 * w, 0)), neck=add(n0['neck'], (0, -50 * w, 0)), head=add(n0['head'], (-4, -70 * w, 0)),
                     footL=dict(pos=(-1.05 * w, 0.20 - 0.45 * w, lift), yaw=n0['footL']['yaw'] * (1 - w) + 150 * w, pitch=0, knee=0.05 - 0.25 * w),
                     footR=dict(pos=(-1.05 * w, -0.18 + 0.48 * w, lift), yaw=n0['footR']['yaw'] * (1 - w) - 150 * w, pitch=0, knee=0.15 - 0.35 * w),
                     tail=tail, tail_bones=Z, keys=K(n0, brow_angry=0.8), **bal())
    keys = [(0, n0), (8, coil, 'out'), (10, coil, 'lin'), (13, turn(70, 0.20, 0.10, (8, -12)), 'in'), (st, turn(150, 0.0, 0.22, (5, 4)), 'lin'), (st + ac, turn(168, 0.0, 0.24, (5, 8)), 'lin'),
            (st + ac + 6, turn(150, 0.0, 0.20, (4, 6)), 'out'), (st + ac + 13, turn(70, 0.18, 0.08, (6, 0)), 'io'), (N, n0, 'io')]
    return dict(frames=N, loop=False, fn=keyed(keys), tail_stiff=3.0, tail_follow=0.6, measure_tail=True,
                info=dict(name_jp='尾薙ぎ（仮称）', startup=19, active=6, recovery=N - 25, reach_part='tail',   # 体の回転(F16〜21)に尻尾が約3F遅れて届くので、実測の軌道に合わせた
                          proposal='AIの仮案: 発生19F・全体48Fと遅く、振る間は相手に背を向ける。尻尾の付け根側は当たらない想定にして、近距離の弱点にする',
                          note='尻尾を反対側へ巻いて溜め、体を約170度回して尻尾を水平に振り抜く。足は小さく跳んで踏み替える'))

def sp_dark_rush(cid):           # dark_moguzo: ジャブ→ストレート→ボディフックの三連
    n0 = neutral(cid); N = 46
    j = merge(n0, pelvis=pel(n0, (0, 0.10, -0.04), (6, -14, 0)), chest=add(n0['chest'], (4, -16, 0)), head=add(n0['head'], (-4, 26, 0)), handL=W((-0.14, 0.96, 0.02)), footL=foot(n0, 'footL', (0, 0.10, 0)), keys=K(n0, brow_angry=1.0))
    c = merge(n0, pelvis=pel(n0, (0, 0.24, -0.10), (10, 40, 0)), chest=add(n0['chest'], (6, 24, 0)), neck=add(n0['neck'], (0, -26, 0)), head=add(n0['head'], (-8, -46, 0)), handR=W((-0.16, 0.96, 0.0)), handL=hand(n0, 'handL', (0.05, -0.15, 0.0)),
              footL=foot(n0, 'footL', (0, 0.30, 0)), footR=foot(n0, 'footR', (0, 0.10, 0), pitch=30), tail=(10, 18), keys=K(n0, brow_angry=1.0))
    h = merge(n0, pelvis=pel(n0, (0, 0.34, -0.18), (16, -30, 0)), chest=add(n0['chest'], (8, -26, -6)), head=add(n0['head'], (-10, 50, 0)), handL=W((-0.30, 0.80, -0.25), fwd=(-0.5, 0.8, 0.3), back=(0.5, 0.3, 0.8), elbow=(0.9, -0.4, 0.0)),
              handR=hand(n0, 'handR', (0.0, -0.20, 0.0)), footL=foot(n0, 'footL', (0, 0.42, 0)), footR=foot(n0, 'footR', (0, 0.20, 0), pitch=25), tail=(12, -18), jaw=10.0, keys=K(n0, brow_angry=1.0))
    keys = [(0, n0), (4, j, 'in'), (6, j, 'lin'), (11, c, 'in'), (13, c, 'lin'), (19, h, 'in'), (22, h, 'lin'), (33, merge(h, pelvis=pel(n0, (0, 0.20, -0.10), (8, -10, 0))), 'out'), (N, n0, 'io')]
    return dict(frames=N, loop=False, fn=keyed(keys), info=dict(name_jp='暗連（仮称）', startup=4, hits=[[4, 6], [11, 13], [19, 22]], recovery=N - 22, move_total_leg=0.9, move_frames=[4, 22], note='踏み込みながら左ジャブ→右ストレート→左ボディフック'))

UNIQUE = dict(moguzo=('sp_rising_upper', sp_rising_upper), pisuke=('sp_double_kick', sp_double_kick), godan=('sp_shoulder_charge', sp_shoulder_charge), hakuma=('sp_harite', sp_harite),
              chirka=('sp_feint_claw', sp_feint_claw), takimaru=('sp_bear_grab', sp_bear_grab), yomikage=('sp_counter', sp_counter), bullet=('sp_tail_whip', sp_tail_whip), dark_moguzo=('sp_dark_rush', sp_dark_rush))
def clips_for(cid): return CLIPS + [UNIQUE[cid][0]]

def deform_test(cid):
    """変形確認用（納品GLBには含めない）: 両腕を前へ → 頭上へ → 片脚を高く → 拳の回転"""
    n0 = neutral(cid); P = lambda h: dict(space='world', pos=(-0.12, 0.96, 0.0), fwd=(0, 1.0, 0), back=h, elbow=(0.9, -0.1, -0.4))
    fwd2 = merge(n0, handL=P((0.2, 0, 1.0)), handR=P((0.2, 0, 1.0)), chest=add(n0['chest'], (4, 20, 0)))
    up2 = merge(n0, handL=dict(pos=(0.12, 0.10, 0.95), fwd=(0, 0.1, 1.0), back=(0.3, -1.0, 0), elbow=(0.9, 0.3, 0.2)), handR=dict(pos=(0.12, 0.10, 0.95), fwd=(0, 0.1, 1.0), back=(0.3, -1.0, 0), elbow=(0.9, 0.3, 0.2)),
                chest=add(n0['chest'], (-6, 20, 0)))
    leg = merge(n0, pelvis=pel(n0, (-0.10, -0.06, 0.06), (-12, 20, -8)), footL=dict(pos=(0.0, 1.25, 1.05), yaw=0, pitch=-25, knee=0.1, toe=0), tail=(20, 0))
    tw = lambda h: merge(n0, handL=P(h), chest=add(n0['chest'], (4, -16, 0)), pelvis=pel(n0, (0, 0.06, 0), (4, -12, 0)))
    keys = [(0, n0), (16, fwd2), (24, fwd2), (40, up2), (48, up2), (62, n0), (80, leg), (88, leg), (102, n0), (114, tw((0.2, 0, 1.0))), (126, tw((1.0, 0, 0.0))), (138, tw((0.0, 0, -1.0))), (150, tw((-1.0, 0, 0.1))), (164, n0)]
    return dict(frames=164, loop=False, fn=keyed(keys), info=dict(note='変形確認用', shots=dict(arms_forward=20, arms_overhead=44, leg_raise=84, fist_0=114, fist_90=126, fist_180=138, fist_270=150)))

CLIPS = ['idle', 'walk_f', 'walk_b', 'dash_f', 'crouch', 'jump_n', 'stand_light', 'stand_heavy', 'guard_stand', 'hurt_light']
def make(cid, name):
    if name.startswith('sp_'):
        c = UNIQUE[cid][1](cid); c['info'] = dict(c['info'], unique=True, provisional=True); return c
    return {'idle': idle, 'walk_f': lambda c: walk(c, 1), 'walk_b': lambda c: walk(c, -1), 'dash_f': dash_f, 'crouch': crouch, 'jump_n': jump_n,
            'stand_light': stand_light, 'stand_heavy': stand_heavy, 'guard_stand': guard_stand, 'hurt_light': hurt_light, 'deform_test': deform_test}[name](cid)
