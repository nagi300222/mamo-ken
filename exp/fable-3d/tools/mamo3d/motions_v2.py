"""モーション拡張 v2（Issue #147 / #148）。既存の motions.py には手を入れず、ここに追加クリップだけを書く。
ゲーム側（PR #143 の dojo/battle.js・models.js）のクリップ名と発生・持続フレームに合わせてある。
技名・フレーム・性能はすべて仮の値で、本人未確定。"""
import math
from functools import lru_cache
from . import motions as M, characters
from .motions import neutral, merge, pel, add, hand, foot, keyed, sample, W, K, STYLE, is_big
from .anim import LIMBS

@lru_cache(maxsize=None)
def body(cid): return characters.build(cid)
def plain(pose):
    """sample() の結果（手足が [(spec, 重み)]）を、上書きできる普通のポーズ辞書へ戻す"""
    return {k: (v[0][0] if (k in LIMBS and isinstance(v, list)) else v) for k, v in pose.items()}
@lru_cache(maxsize=None)
def _ref(cid, name, f): return plain(M.make(cid, name)['fn'](f))
def GUARD(cid): return _ref(cid, 'guard_stand', 5)
def CROUCH(cid): return _ref(cid, 'crouch', 12)
def AIR(cid):
    j = M.make(cid, 'jump_n')['info']; return _ref(cid, 'jump_n', j['airborne'][0] + (j['airborne'][1] - j['airborne'][0]) // 2)
def off(p, dpos=(0, 0, 0), drot=(0, 0, 0)): return dict(pos=add(p['pelvis']['pos'], dpos), rot=add(p['pelvis']['rot'], drot))
def hmove(p, key, dpos, **kw): h = dict(p[key], **kw); h['pos'] = add(p[key]['pos'], dpos); return h

# ---- キャラごとの反応の個性 ----
# mass: 被弾やガードで体が動く量（重いほど小さい） / roar: 咆哮の型 / calm: 動きの抑え（ヨミカゲ）
REACT = dict(
    moguzo=dict(mass=1.0, roar='chest'), pisuke=dict(mass=1.25, roar='sharp'), godan=dict(mass=0.7, roar='stomp'),
    hakuma=dict(mass=0.62, roar='belly'), chirka=dict(mass=1.3, roar='hiss'), takimaru=dict(mass=0.7, roar='tower'),
    yomikage=dict(mass=0.9, roar='still'), bullet=dict(mass=1.0, roar='tail'), dark_moguzo=dict(mass=0.95, roar='feral'))
def info(group, pri, frm='idle', to='idle', **kw): return dict(group=group, priority=pri, start_pose=frm, end_pose=to, v2=True, provisional=True, **kw)

# ================= 咆哮 =================
def roar(cid):
    n0 = neutral(cid); y = STYLE[cid]['yaw']; kind = REACT[cid]['roar']; st, ac, N = 16, 7, 50
    # 型ごとの数値: 溜めの沈み, 腕を広げる高さ, 腕の開き, 前傾, 口, 尻尾, 踏み込み
    low, ah, aw, lean, jaw, tl, step = dict(chest=(-0.10, -0.20, 0.78, 14, 26, 25, 0.30), sharp=(-0.06, -0.05, 0.60, 18, 22, 30, 0.34), stomp=(-0.16, -0.30, 0.85, 12, 28, 18, 0.22),
        belly=(-0.10, -0.38, 0.88, 4, 26, 15, 0.16), hiss=(-0.22, -0.30, 0.55, 30, 20, 35, 0.30), tower=(0.06, 0.45, 0.70, 2, 30, 20, 0.20),
        still=(-0.04, -0.30, 0.45, 8, 16, 10, 0.18), tail=(-0.10, -0.15, 0.70, 16, 24, 55, 0.26), feral=(-0.20, -0.35, 0.80, 26, 30, 28, 0.34))[kind]
    arm = lambda w_, h_, f_: dict(pos=(w_, f_, h_), fwd=(0.5, 0.6, -0.5 if h_ < 0.2 else 0.6), back=(0.4, -0.3, 0.85), elbow=(0.7, -0.6, -0.3))
    inhale = merge(n0, pelvis=pel(n0, (0, -0.10, low * 0.5), (-10, -y * 0.3, 0)), chest=add(n0['chest'], (-12, 0, 0)), head=add(n0['head'], (-8, y * 0.3, 0)),
                   handL=arm(0.30, ah - 0.15, 0.05), handR=arm(0.30, ah - 0.15, 0.05), footL=foot(n0, 'footL', (0, step * 0.4, 0.10), pitch=-8), tail=(-10, 0), jaw=4.0, keys=K(n0, paw_open_L=0.6, paw_open_R=0.6, brow_angry=1.0))
    def burst(u):   # u: 0..1 の震え
        return merge(n0, pelvis=pel(n0, (0, 0.20, low + 0.012 * u), (lean, -y * 0.6, 0)), spine=add(n0['spine'], (2, -y * 0.1, 0)), chest=add(n0['chest'], (lean * 0.4 + 2 * u, -y * 0.2, 0)),
                     neck=add(n0['neck'], (-4, y * 0.25, 0)), head=add(n0['head'], (-lean * 0.5 - 4, y * 0.5, 0)), handL=arm(aw, ah, 0.10), handR=arm(aw, ah, 0.10),
                     footL=foot(n0, 'footL', (0, step, 0)), footR=foot(n0, 'footR', (0, step * 0.3, 0), pitch=16), tail=(tl, 0), jaw=float(jaw), keys=K(n0, paw_open_L=1.0, paw_open_R=1.0, brow_angry=1.0))
    after = merge(n0, pelvis=pel(n0, (0, 0.10, low * 0.6), (lean * 0.4, -y * 0.3, 0)), handL=arm(aw * 0.6, ah - 0.1, 0.25), handR=arm(aw * 0.6, ah - 0.1, 0.25), footL=foot(n0, 'footL', (0, step * 0.7, 0)), jaw=8.0, tail=(tl * 0.4, 0), keys=K(n0, paw_open_L=0.5, paw_open_R=0.5, brow_angry=0.6))
    def fn(f):
        if f <= st: return sample([(0, n0), (10, inhale, 'out'), (12, inhale, 'lin'), (st, burst(0), 'in')], f)
        if f <= st + ac + 3: return burst(math.sin((f - st) * 2.1))
        return sample([(st + ac + 3, burst(0)), (st + ac + 14, after, 'out'), (N, n0, 'io')], f)
    return dict(frames=N, loop=False, fn=fn, info=info('universal', 1, startup=st, active=ac, recovery=N - st - ac, game_action='roar', roar_style=kind,
                note='溜め(F0-12)→踏み込んで胸と腕を広げ口を開ける(F16-26)→反動→構え。受け止め中も足は接地したまま。咆哮返しも同じクリップ'))

def roar_hit(cid):
    n0 = neutral(cid); m = REACT[cid]['mass']; N = 28
    hit = merge(n0, pelvis=pel(n0, (0, -0.30 * m, -0.02), (-14 * m, 8, 0)), spine=add(n0['spine'], (-8 * m, 0, 0)), chest=add(n0['chest'], (-14 * m, 8, 3)), head=add(n0['head'], (-10 * m, 10, 6)),
                handL=hand(n0, 'handL', (0.25, -0.25, 0.15)), handR=hand(n0, 'handR', (0.30, -0.20, 0.10)), footL=foot(n0, 'footL', (0, -0.10 * m, 0), pitch=-14), footR=foot(n0, 'footR', (0, -0.12 * m, 0)),
                tail=(30, 15), jaw=14.0, keys=K(n0, blink=1.0, brow_angry=0.4))
    stag = merge(n0, pelvis=pel(n0, (0, -0.16 * m, -0.12), (10, 4, 0)), chest=add(n0['chest'], (8, 0, 0)), head=add(n0['head'], (10, 0, 0)), handL=hand(n0, 'handL', (0.05, -0.10, -0.12)), handR=hand(n0, 'handR', (0.05, -0.08, -0.14)),
                 footL=foot(n0, 'footL', (0, -0.06 * m, 0)), footR=foot(n0, 'footR', (0, -0.08 * m, 0)), keys=K(n0, blink=0.5))
    return dict(frames=N, loop=False, fn=keyed([(0, n0), (4, hit, 'out'), (10, hit, 'lin'), (19, stag, 'io'), (N, n0, 'io')]), info=info('reaction', 1, game_reaction='roar_hit', note='咆哮を受けた重い反応。大きくのけぞって足を引きずり、前かがみで持ち直す'))

# ================= ギュイーン（前進）→ 組み合い → 弾き戻し =================
def gyuiin(cid):
    n0 = neutral(cid); y = STYLE[cid]['yaw']; st, ac, N = 8, 14, 46
    arm = lambda w_, f_, h_: dict(pos=(w_, f_, h_), fwd=(0.1, 0.9, 0.4), back=(0.8, -0.2, 0.5), elbow=(0.8, -0.4, -0.4))
    coil = merge(n0, pelvis=pel(n0, (0, -0.05, -0.22), (18, -y * 0.5, 0)), chest=add(n0['chest'], (8, -y * 0.2, 0)), head=add(n0['head'], (-16, y * 0.5, 0)), handL=arm(0.35, 0.10, -0.40), handR=arm(0.35, 0.05, -0.42),
                 footR=foot(n0, 'footR', pitch=20), tail=(-15, 0), keys=K(n0, paw_open_L=0.8, paw_open_R=0.8, brow_angry=1.0))
    def go(u):
        return merge(n0, pelvis=pel(n0, (0, 0.16, -0.16 + 0.015 * u), (16, -y * 0.7, 0)), spine=add(n0['spine'], (4, -y * 0.1, 0)), chest=add(n0['chest'], (8, -y * 0.2, 0)), neck=add(n0['neck'], (-8, y * 0.3, 0)), head=add(n0['head'], (-20, y * 0.5, 0)),
                     handL=arm(0.42, 0.66, 0.08), handR=arm(0.42, 0.62, 0.04), footL=foot(n0, 'footL', (0, 0.34, 0)), footR=foot(n0, 'footR', (0, 0.14, 0), pitch=30), tail=(22, 0), jaw=8.0, keys=K(n0, paw_open_L=1.0, paw_open_R=1.0, brow_angry=1.0))
    whiff = merge(n0, pelvis=pel(n0, (0, 0.36, -0.20), (30, -y * 0.4, 0)), chest=add(n0['chest'], (10, 0, 0)), head=add(n0['head'], (-10, 0, 0)), handL=arm(0.25, 0.55, -0.35), handR=arm(0.25, 0.50, -0.38),
                  footL=foot(n0, 'footL', (0, 0.40, 0)), footR=foot(n0, 'footR', (0, 0.20, 0), pitch=20), tail=(10, 0), keys=K(n0, paw_open_L=0.6, paw_open_R=0.6))
    def fn(f):
        if f <= st: return sample([(0, n0), (5, coil, 'out'), (st, go(0), 'in')], f)
        if f <= st + ac: return go(math.sin((f - st) * 1.9))
        return sample([(st + ac, go(0)), (st + ac + 8, whiff, 'out'), (N, n0, 'io')], f)
    return dict(frames=N, loop=False, fn=fn, info=info('universal', 1, startup=st, active=ac, recovery=N - st - ac, game_action='gyuiin', armor_frames=[2, st + ac], move_note='前進量はゲーム側（travel 0.32m を F0-22 に配分）',
                note='沈んで溜め(F0-5)→両手を開いて低く前へ押し出る(F8-22)→空振りならつんのめって戻る。相手に触れたらゲーム側で clinch_hold へ切り替える'))

CLINCH = dict(spacing_m=0.36, palm=(0.07, 0.175, 0.33))    # 2体の原点間隔(ゲーム側の値)と、手を合わせる位置（横, 前, 高さ m）
def _lock(cid, push=0.0, strain=0.0, shake=0.0):
    n0 = neutral(cid); m = REACT[cid]['mass']; px, pf, pz = CLINCH['palm']
    palm = lambda: dict(space='abs', pos=(px, pf + 0.004 * push, pz + 0.006 * shake), fwd=(0, 0.25, 1.0), back=(0, -1.0, 0.25), elbow=(0.85, -0.3, -0.45))
    # 2体の間隔は0.36mしかないので、上体は起こして腰を少し引き、腕を伸ばして押す（前傾すると頭や胴が相手にめり込む）
    return merge(n0, pelvis=dict(pos=(0, -0.26 + 0.04 * push, -0.10 - 0.03 * strain + 0.008 * shake), rot=(5 + 4 * strain, 0, 0)), spine=(2 + 2 * strain, 0, 0), chest=(3 + 2 * shake, 0, 0), neck=(-2, 4, 4), head=(-4 - 3 * strain, 6, 7),
                 handL=palm(), handR=palm(), footL=dict(pos=(0.10, 0.10, 0), yaw=0, pitch=0, knee=0.3), footR=dict(pos=(0.12, -0.34, 0), yaw=18, pitch=26 + 8 * strain, knee=0.4),
                 tail=(18 + 14 * strain, 0), jaw=4.0 + 8 * strain, keys=K(n0, paw_open_L=1.0, paw_open_R=1.0, brow_angry=0.7 + 0.3 * strain))
def clinch_hold(cid):
    N = 34; amp = 1.0 / REACT[cid]['mass'] ** 0.5
    def fn(f):
        u = f / N; push = min(1.0, f / 5.0); strain = max(0.0, (f - 22) / 12.0); shake = math.sin(f * 1.7) * (0.4 + 0.6 * u) * amp * (1 - max(0.0, (f - 30) / 4.0))   # 終端は震えを止め、clinch_recoil の始めと一致させる
        return _lock(cid, push, strain, shake)
    return dict(frames=N, loop=False, fn=fn, info=info('universal', 1, 'clinch', 'clinch_end', game_state='clinch', sync='両者が同じフレームで再生する', pair_spacing_m=CLINCH['spacing_m'], palm_contact_m=list(CLINCH['palm']),
                note='両手のひらを相手と同じ位置（原点の前0.175m・高さ0.33m）で合わせて押し合う。どちらも相手にダメージを与える動きはしない。F0-5 で押し込み、震えながら力み、F22以降で限界まで力む'))
def clinch_recoil(cid):
    n0 = neutral(cid); m = REACT[cid]['mass']; N = 26
    burst = merge(n0, pelvis=pel(n0, (0, -0.30 * m, 0.02), (-16, 0, 0)), chest=add(n0['chest'], (-12, 0, 0)), head=add(n0['head'], (-6, 0, 0)), handL=dict(pos=(0.55, 0.20, 0.50), fwd=(0.3, 0.3, 0.9), back=(0.3, -0.9, 0.2), elbow=(0.9, -0.3, 0.0)),
                  handR=dict(pos=(0.55, 0.15, 0.45), fwd=(0.3, 0.3, 0.9), back=(0.3, -0.9, 0.2), elbow=(0.9, -0.3, 0.0)), footL=foot(n0, 'footL', (0, -0.14 * m, 0.05), pitch=-12), footR=foot(n0, 'footR', (0, -0.16 * m, 0)),
                  tail=(28, 0), jaw=12.0, keys=K(n0, paw_open_L=1.0, paw_open_R=1.0, blink=0.6))
    skid = merge(n0, pelvis=pel(n0, (0, -0.18 * m, -0.16), (12, 0, 0)), chest=add(n0['chest'], (8, 0, 0)), handL=hand(n0, 'handL', (0.15, -0.05, -0.20)), handR=hand(n0, 'handR', (0.15, -0.05, -0.22)),
                 footL=foot(n0, 'footL', (0.04, -0.06 * m, 0)), footR=foot(n0, 'footR', (0.04, -0.10 * m, 0)), tail=(-12, 0), keys=K(n0, brow_angry=0.8))
    return dict(frames=N, loop=False, fn=keyed([(0, _lock(cid, 1, 1, 0)), (3, burst, 'out'), (7, burst, 'lin'), (15, skid, 'io'), (N, n0, 'io')]), info=info('universal', 1, 'clinch_end', 'idle', game_state='clinch_recoil',
                note='組み合いから両者が同時に弾かれ、腕が跳ね上がって後ろへ滑り、低く踏ん張って構えへ戻る。後退の移動量はゲーム側'))

# ================= ガード =================
def _ghit(g, m, big):
    k = (2.2 if big else 1.0) * m
    return merge(g, pelvis=off(g, (0, -0.06 * k, -0.03 * k), (-6 * k, 0, 0)), chest=add(g['chest'], (-6 * k, 0, 0)), head=add(g['head'], (5 * k, 0, 0)),
                 handL=hmove(g, 'handL', (0.03 * k, -0.07 * k, -0.02)), handR=hmove(g, 'handR', (0.03 * k, -0.07 * k, -0.02)), footR=foot(g, 'footR', (0, -0.03 * k, 0)), tail=(14 * k, 0))
def guard_hit(cid):
    g = GUARD(cid); N = 12
    return dict(frames=N, loop=False, fn=keyed([(0, g), (3, _ghit(g, REACT[cid]['mass'], False), 'out3'), (5, _ghit(g, REACT[cid]['mass'] * 0.8, False), 'lin'), (N, g, 'io')]),
                info=info('reaction', 1, 'guard', 'guard', game_reaction='guard_hit', note='立ちガード中に打撃を受けた衝撃。上半身が後ろへ揺れて戻る。始めと終わりは guard_stand の保持姿勢'))
def guard_impact(cid):
    g = GUARD(cid); m = REACT[cid]['mass']; N = 22; h = _ghit(g, m, True)
    h = merge(h, footL=foot(g, 'footL', (0, -0.08 * m, 0), pitch=-10), footR=foot(g, 'footR', (0, -0.10 * m, 0)), handL=hmove(g, 'handL', (0.14, -0.10, 0.04)), handR=hmove(g, 'handR', (0.14, -0.10, 0.02)), keys=K(g, blink=0.7))
    return dict(frames=N, loop=False, fn=keyed([(0, g), (4, h, 'out3'), (9, h, 'lin'), (N, g, 'io')]), info=info('reaction', 1, 'guard', 'guard', game_reaction='guard_impact', note='咆哮など重い攻撃をガードした反応。腕が開きかけ、両足が後ろへ滑る'))
def _gcrouch(cid, br=0.0):
    c = CROUCH(cid); g = GUARD(cid)
    return merge(c, pelvis=off(c, (0, -0.04, 0.02 + 0.006 * br), (-8, 0, -4)), chest=add(c['chest'], (-4, 0, -3)), head=add(c['head'], (6, 0, 4)), handL=g['handL'], handR=g['handR'], tail=(-8, 0), keys=K(c, paw_open_L=0.0, brow_angry=0.5))
def guard_crouch(cid):
    n0 = neutral(cid); ent = 6; N = 30
    def fn(f):
        if f <= ent: return sample([(0, n0), (ent, _gcrouch(cid), 'out')], f)
        return _gcrouch(cid, math.sin(2 * math.pi * (f - ent) / (N - ent)))
    return dict(frames=N, loop=False, fn=fn, info=info('reaction', 1, 'idle', 'guard_crouch', enter_frames=ent, loop_from=ent, note='しゃがみガードの入りと保持。しゃがんだまま両手を顔の前へ上げる（しゃがみの地面についた手は離す）'))
def guard_crouch_hit(cid):
    g = _gcrouch(cid); N = 12
    return dict(frames=N, loop=False, fn=keyed([(0, g), (3, _ghit(g, REACT[cid]['mass'] * 0.8, False), 'out3'), (5, _ghit(g, REACT[cid]['mass'] * 0.6, False), 'lin'), (N, g, 'io')]),
                info=info('reaction', 1, 'guard_crouch', 'guard_crouch', game_reaction='guard_crouch_hit', note='しゃがみガード中に打撃を受けた衝撃'))

# ================= 強被弾 =================
def hurt_heavy(cid):
    n0 = neutral(cid); m = REACT[cid]['mass']; N = 32
    hit = merge(n0, pelvis=pel(n0, (0, -0.24 * m, -0.04), (-12 * m, 22, -4)), spine=add(n0['spine'], (-6 * m, 6, 0)), chest=add(n0['chest'], (-12 * m, 18, 4)), neck=add(n0['neck'], (-4, 6, 0)), head=add(n0['head'], (-12 * m, 22, 8)),
                handL=hand(n0, 'handL', (0.20, -0.30, -0.15)), handR=hand(n0, 'handR', (0.25, -0.15, -0.20)), footL=foot(n0, 'footL', (0, -0.04, 0), pitch=-10), footR=foot(n0, 'footR', (0.02, -0.22 * m, 0)),
                tail=(26, 20), jaw=16.0, keys=K(n0, blink=1.0, brow_angry=0.5))
    fold = merge(n0, pelvis=pel(n0, (0, -0.16 * m, -0.12), (14, 8, 0)), chest=add(n0['chest'], (10, 4, 0)), head=add(n0['head'], (12, 0, 0)), handL=hand(n0, 'handL', (0.05, -0.12, -0.18)), handR=hand(n0, 'handR', (0.02, -0.05, -0.22)),
                 footR=foot(n0, 'footR', (0.02, -0.14 * m, 0)), tail=(-8, 0), keys=K(n0, blink=0.5, brow_angry=0.6))
    return dict(frames=N, loop=False, fn=keyed([(0, n0), (4, hit, 'out3'), (9, hit, 'lin'), (19, fold, 'io'), (N, n0, 'io')]), info=info('reaction', 1, game_reaction='hurt_heavy',
                note='強攻撃を受けた反応。体をひねってのけぞり、後ろ足を一歩引いて前かがみになってから戻る。足は床から離れない。hurt_light より大きく長い'))

# ================= ダウン・起き上がり・KO =================
def _down(cid, limp=1.0):
    """仰向けに寝た姿勢（頭が後ろ）。体格から骨盤の高さを決める"""
    n0 = neutral(cid); B = body(cid); P = B.P; leg = B.M.leg; zc = P.belly_r[1] * 0.90; up = (zc - P.z_pelvis) / leg; nt = len(B.tail_names)
    shy = 0.30 * leg + (P.sh_z - P.z_pelvis) * 0.98        # 寝たときの肩の位置（原点から後ろへ m）
    arm = lambda: dict(space='abs', pos=(P.sh_x + (P.ua + P.fa) * 0.78, -shy - 0.02, 0.045), fwd=(0.7, -0.6, 0.0), back=(0, 0.2, -1.0), elbow=(0.6, 0.6, -0.5))
    lg = lambda fw, o: dict(pos=(o, fw, 0.03), yaw=18, pitch=-58, knee=0.3, toe=0, pivot='ankle')      # かかとを床につけ、つま先を上へ
    out = merge(n0, pelvis=dict(pos=(0, -0.30, up), rot=(-84, 0, 0)), spine=(2, 0, 0), chest=(4, 0, 0), neck=(8, 0, 0), head=(10, 0, 10 * limp), handL=arm(), handR=arm(),
                footL=lg(0.60, 0.02), footR=lg(0.86, 0.04), tail=(0, 64),      # 尻尾は体の横（本人の右）へ倒して床に置く
                 jaw=6.0 * limp, keys=K(n0, paw_open_L=1.0, paw_open_R=1.0, blink=limp, brow_angry=0.0))
    if 'tail_bones' in out:            # 長い尻尾は付け根で折って床に沿わせる（各ボーンに配ると途中が床へ潜る）
        out['tail'] = (0, 0); out['tail_bones'] = ((0, 100),) + tuple((0, 0) for _ in out['tail_bones'][1:])      # 体の横（本人の右）へ倒して床に置く。下を回すと床を突き抜ける
    return out
def _tb(pose, deg):
    """長い尻尾（tail_bones を持つキャラ）の付け根の角度を上書きする"""
    if 'tail_bones' in pose: pose = dict(pose, tail=(0, 0), tail_bones=((0, deg),) + tuple((0, 0) for _ in pose['tail_bones'][1:]))
    return pose
FALL = dict(tail_follow=0.8, tail_stiff=3.0)      # 倒れる動きでは尻尾をキーの形へ寄せ、遅れて床へ潜るのを防ぐ
def _fallkeys(cid, n0, t0):
    m = REACT[cid]['mass']; d = _down(cid)
    tip = merge(n0, pelvis=pel(n0, (0, -0.30, -0.10), (-34, 0, 0)), chest=add(n0['chest'], (-12, 0, 0)), head=add(n0['head'], (10, 0, 0)), handL=hand(n0, 'handL', (0.35, -0.10, 0.25)), handR=hand(n0, 'handR', (0.35, -0.10, 0.20)),
                footL=foot(n0, 'footL', (0, 0.10, 0), pitch=-20), footR=foot(n0, 'footR', (0, 0.25, 0.04), pitch=-25), tail=(-20, 0), jaw=14.0, keys=K(n0, blink=1.0, paw_open_L=0.8, paw_open_R=0.8))
    sit = merge(d, pelvis=dict(pos=(0, -0.34, d['pelvis']['pos'][2] + 0.10), rot=(-58, 0, 0)), head=(22, 0, 0))
    bounce = merge(d, pelvis=dict(pos=add(d['pelvis']['pos'], (0, 0, 0.10 * m)), rot=(-80, 0, 0)), head=(18, 0, 0))
    tip = _tb(tip, 78); sit = _tb(sit, 98); bounce = _tb(bounce, 104)
    return [(t0, tip, 'out'), (t0 + 7, sit, 'in'), (t0 + 12, d, 'in'), (t0 + 16, bounce, 'out'), (t0 + 21, d, 'in')], d
def down(cid):
    n0 = neutral(cid); ks, d = _fallkeys(cid, n0, 7); N = 40
    return dict(frames=N, loop=False, fn=keyed([(0, n0)] + ks + [(N, d, 'lin')]), **FALL, info=info('reaction', 1, 'idle', 'down', game_state='down', note='後ろへ倒れて尻→背中の順に床へつき、小さく弾んで仰向けで止まる。最後の姿勢のまま保持'))
def ko(cid):
    n0 = neutral(cid); m = REACT[cid]['mass']; N = 64
    reel = merge(n0, pelvis=pel(n0, (0, -0.14, -0.06), (-10, 14, -4)), chest=add(n0['chest'], (-12, 12, 4)), head=add(n0['head'], (-14, 16, 10)), handL=hand(n0, 'handL', (0.15, -0.25, -0.25)), handR=hand(n0, 'handR', (0.20, -0.15, -0.30)),
                 footR=foot(n0, 'footR', (0, -0.14, 0)), tail=(20, 10), jaw=16.0, keys=K(n0, blink=1.0))
    sag = merge(n0, pelvis=pel(n0, (0, -0.10, -0.30), (12, 4, 0)), chest=add(n0['chest'], (12, 0, 0)), head=add(n0['head'], (24, 0, 0)), handL=hand(n0, 'handL', (0.10, -0.10, -0.45)), handR=hand(n0, 'handR', (0.10, -0.08, -0.48)),
                footR=foot(n0, 'footR', (0, -0.10, 0), pitch=20), tail=(-15, 0), jaw=10.0, keys=K(n0, blink=1.0, paw_open_L=0.7, paw_open_R=0.7))
    ks, d = _fallkeys(cid, n0, 30)
    return dict(frames=N, loop=False, fn=keyed([(0, n0), (6, reel, 'out3'), (12, reel, 'lin'), (24, sag, 'io')] + ks + [(N, d, 'lin')]), **FALL, info=info('reaction', 1, 'idle', 'down', game_state='ko',
                note='のけぞる→ひざが抜けて沈む→後ろへ倒れる→仰向けで脱力して止まる。目を閉じ、手を開く。最後の姿勢のまま保持'))
def wakeup(cid):
    n0 = neutral(cid); d = _down(cid, 0.3); B = body(cid); P = B.P; N = 40
    sit = merge(d, pelvis=dict(pos=(0, -0.28, d['pelvis']['pos'][2] + 0.06), rot=(-30, 0, 0)), chest=(14, 0, 0), head=(6, 0, 0),
                handL=dict(space='abs', pos=(P.sh_x + 0.09, -0.16, 0.05), fwd=(0.3, 0.9, 0.0), back=(0, 0.2, 1.0), elbow=(0.8, -0.6, 0.2)), handR=dict(space='abs', pos=(P.sh_x + 0.09, -0.16, 0.05), fwd=(0.3, 0.9, 0.0), back=(0, 0.2, 1.0), elbow=(0.8, -0.6, 0.2)),
                footL=dict(pos=(0.04, 0.36, 0.02), yaw=10, pitch=-10, knee=0.4), footR=dict(pos=(0.06, 0.50, 0.02), yaw=14, pitch=-10, knee=0.4), tail=(0, 44), keys=K(n0, paw_open_L=1.0, paw_open_R=1.0, blink=0.3))   # 上体を起こす途中も尻尾を足側へ寝かせ、床へ沈ませない
    squat = merge(n0, pelvis=pel(n0, (0, -0.06, -0.32), (26, 0, 0)), chest=add(n0['chest'], (10, 0, 0)), head=add(n0['head'], (-14, 0, 0)), handL=hand(n0, 'handL', (0.10, 0.0, -0.40)), handR=hand(n0, 'handR', (0.10, 0.0, -0.42)), tail=(-10, 0))
    sit = _tb(sit, 85)
    return dict(frames=N, loop=False, fn=keyed([(0, d), (4, d, 'lin'), (14, sit, 'io'), (26, squat, 'io'), (N, n0, 'io')]), **FALL, info=info('reaction', 1, 'down', 'idle', note='仰向けから手をついて上体を起こし、しゃがみを経て構えへ戻る'))

# ================= 掴み・投げ =================
def _reach(cid, shut=0.0):
    n0 = neutral(cid); y = STYLE[cid]['yaw']
    arm = lambda: dict(space='world', pos=(-0.02 - 0.26 * shut, 0.86 - 0.10 * shut, -0.05), fwd=(-0.3 - 0.4 * shut, 0.9, 0.0), back=(0.8, 0.3, 0.4), elbow=(0.9, -0.2, -0.3))
    return merge(n0, pelvis=pel(n0, (0, 0.22, -0.08), (14, -y * 0.5, 0)), chest=add(n0['chest'], (8, -y * 0.2, 0)), head=add(n0['head'], (-10, y * 0.4, 0)), handL=arm(), handR=arm(),
                 footL=foot(n0, 'footL', (0, 0.30, 0)), footR=foot(n0, 'footR', (0, 0.08, 0), pitch=22), tail=(14, 0), keys=K(n0, paw_open_L=1.0 - 0.7 * shut, paw_open_R=1.0 - 0.7 * shut, brow_angry=0.8))
def throw_reach(cid):
    n0 = neutral(cid); st, ac, N = 6, 3, 34
    stumble = merge(n0, pelvis=pel(n0, (0, 0.30, -0.16), (24, 0, 0)), chest=add(n0['chest'], (8, 0, 0)), handL=hand(n0, 'handL', (0.0, 0.10, -0.25)), handR=hand(n0, 'handR', (0.0, 0.05, -0.28)), footL=foot(n0, 'footL', (0, 0.34, 0)), footR=foot(n0, 'footR', (0, 0.14, 0), pitch=16))
    return dict(frames=N, loop=False, fn=keyed([(0, n0), (st, _reach(cid, 0), 'in'), (st + ac, _reach(cid, 1), 'lin'), (st + ac + 9, stumble, 'out'), (N, n0, 'io')]),
                info=info('universal', 1, startup=st, active=ac, recovery=N - st - ac, game_action='grab', note='踏み込んで両手を開いて伸ばし(F6)、閉じる(F9)。空振りならつんのめって戻る。つかんだらF9で throw_hit へ'))
def throw_hit(cid):
    n0 = neutral(cid); y = STYLE[cid]['yaw']; N = 48
    pull = merge(n0, pelvis=pel(n0, (0, 0.06, -0.10), (-6, 20, 0)), chest=add(n0['chest'], (-8, 14, 0)), handL=dict(pos=(-0.25, 0.42, -0.05), fwd=(-0.4, 0.8, 0.2), back=(0.8, 0.3, 0.4), elbow=(0.8, -0.5, -0.3)),
                 handR=dict(pos=(-0.25, 0.38, -0.10), fwd=(-0.4, 0.8, 0.2), back=(0.8, 0.3, 0.4), elbow=(0.8, -0.5, -0.3)), footL=foot(n0, 'footL', (0, 0.20, 0)), keys=K(n0, paw_open_L=0.3, paw_open_R=0.3, brow_angry=1.0))
    hoist = merge(n0, pelvis=pel(n0, (0, 0.0, 0.04), (-14, 48, 0)), spine=add(n0['spine'], (-4, 10, 0)), chest=add(n0['chest'], (-10, 26, 0)), head=add(n0['head'], (0, -40, 0)),
                  handL=dict(pos=(0.05, 0.25, 0.72), fwd=(0, 0.3, 0.95), back=(0.3, -0.9, 0.2), elbow=(0.9, 0.1, -0.2)), handR=dict(pos=(0.05, 0.20, 0.68), fwd=(0, 0.3, 0.95), back=(0.3, -0.9, 0.2), elbow=(0.9, 0.1, -0.2)),
                  footL=foot(n0, 'footL', (0, 0.12, 0)), footR=foot(n0, 'footR', pitch=14), tail=(-14, 0), jaw=10.0, keys=K(n0, paw_open_L=0.3, paw_open_R=0.3, brow_angry=1.0))
    slam = merge(n0, pelvis=pel(n0, (0, 0.28, -0.20), (32, -y * 0.6, 0)), chest=add(n0['chest'], (12, -y * 0.2, 0)), head=add(n0['head'], (-18, y * 0.4, 0)), handL=W((-0.10, 0.82, -0.52), fwd=(0, 0.8, -0.6), back=(0.2, 0.5, 0.85), elbow=(0.9, -0.3, 0.1)),
                 handR=W((-0.10, 0.80, -0.55), fwd=(0, 0.8, -0.6), back=(0.2, 0.5, 0.85), elbow=(0.9, -0.3, 0.1)), footL=foot(n0, 'footL', (0, 0.36, 0)), footR=foot(n0, 'footR', (0, 0.12, 0), pitch=28), tail=(24, 0), jaw=14.0, keys=K(n0, paw_open_L=1.0, paw_open_R=1.0, brow_angry=1.0))
    return dict(frames=N, loop=False, fn=keyed([(0, _reach(cid, 1)), (8, pull, 'out'), (18, hoist, 'io'), (20, hoist, 'lin'), (26, slam, 'in'), (30, slam, 'lin'), (N, n0, 'io')]),
                info=info('universal', 1, 'throw_reach@9', 'idle', release_frame=26, pair_clip='thrown', note='つかんだ姿勢から引き込み(F8)、頭上へ抱え上げ(F18)、前へ叩きつける(F26)。相手側は thrown を同じフレームで再生する想定'))
def thrown(cid):
    n0 = neutral(cid); d = _down(cid); m = REACT[cid]['mass']; N = 44
    held = merge(n0, pelvis=pel(n0, (0, 0.16, 0.04), (14, 0, 0)), chest=add(n0['chest'], (8, 0, 0)), head=add(n0['head'], (-10, 0, 0)), handL=hand(n0, 'handL', (0.25, -0.10, 0.10)), handR=hand(n0, 'handR', (0.25, -0.10, 0.10)),
                 footL=foot(n0, 'footL', (0, 0.05, 0.04), pitch=20), footR=foot(n0, 'footR', (0, 0.05, 0.06), pitch=24), jaw=10.0, keys=K(n0, blink=0.6, paw_open_L=0.8, paw_open_R=0.8))
    lifted = merge(d, pelvis=dict(pos=(0, 0.0, 0.80), rot=(-50, 0, 0)), head=(-6, 0, 0), handL=hand(n0, 'handL', (0.45, -0.10, 0.30)), handR=hand(n0, 'handR', (0.45, -0.10, 0.30)),
                   footL=dict(pos=(0.06, 0.55, 0.95), yaw=10, pitch=10, knee=0.3, toe=0, pivot='ankle'), footR=dict(pos=(0.06, 0.75, 1.05), yaw=10, pitch=10, knee=0.3, toe=0, pivot='ankle'), tail=(-30, 0), jaw=16.0)
    bounce = _tb(merge(d, pelvis=dict(pos=add(d['pelvis']['pos'], (0, 0, 0.14 * m)), rot=(-78, 0, 0)), head=(20, 0, 0)), 104); lifted = _tb(lifted, 70)
    return dict(frames=N, loop=False, **FALL, fn=keyed([(0, n0), (8, held, 'out'), (18, lifted, 'io'), (20, lifted, 'lin'), (27, d, 'in'), (31, bounce, 'out'), (36, d, 'in'), (N, d, 'lin')]),
                info=info('reaction', 1, 'idle', 'down', pair_clip='throw_hit', note='引き寄せられ(F8)、持ち上げられ(F18)、床へ叩きつけられて弾み(F27-36)、仰向けで止まる。持ち上げの高さはクリップに含む。前後の移動はゲーム側'))

# ================= 着地・ダッシュ制動・後ろダッシュ =================
def land(cid):
    n0 = neutral(cid); a = AIR(cid); N = 12
    sq = merge(n0, pelvis=pel(n0, (0, 0, -0.24), (14, 0, 0)), chest=add(n0['chest'], (9, 0, 0)), handL=hand(n0, 'handL', (0.06, -0.06, -0.18)), handR=hand(n0, 'handR', (0.06, -0.08, -0.20)), tail=(-18, 0))
    return dict(frames=N, loop=False, fn=keyed([(0, a), (3, sq, 'in'), (5, sq, 'lin'), (N, n0, 'io')]), info=info('universal', 2, 'air', 'idle', note='空中姿勢から着地の沈み込み(F3-5)を経て構えへ。空中技のあとなどに使う'))
def dash_stop(cid):
    n0 = neutral(cid); N = 14
    brake = merge(n0, pelvis=pel(n0, (0, -0.12, -0.16), (-10, 0, 0)), chest=add(n0['chest'], (-6, 0, 0)), head=add(n0['head'], (8, 0, 0)), handL=hand(n0, 'handL', (0.20, 0.10, -0.10)), handR=hand(n0, 'handR', (0.20, 0.10, -0.12)),
                  footL=foot(n0, 'footL', (0, 0.22, 0), pitch=-16), footR=foot(n0, 'footR', (0, 0.16, 0), pitch=-10), tail=(26, 0))
    return dict(frames=N, loop=False, fn=keyed([(0, n0), (4, brake, 'out'), (7, brake, 'lin'), (N, n0, 'io')]), info=info('universal', 2, note='ダッシュの制動。かかとで踏ん張って上体を後ろへ残し、尻尾が前へ流れる'))
def dash_b(cid):
    n0 = neutral(cid); big = is_big(cid); N = 22 if not big else 28; k = N / 22.0; F = lambda x: int(round(x * k))
    anti = merge(n0, pelvis=pel(n0, (0, 0.06, -0.14), (10, 0, 0)), chest=add(n0['chest'], (6, 0, 0)), footL=foot(n0, 'footL', pitch=-10))
    fly = merge(n0, pelvis=pel(n0, (0, -0.10, 0.0), (-10, 0, 0)), chest=add(n0['chest'], (-6, 0, 0)), head=add(n0['head'], (8, 0, 0)), handL=hand(n0, 'handL', (0.05, 0.10, 0.05)), handR=hand(n0, 'handR', (0.05, 0.08, 0.05)),
                footL=foot(n0, 'footL', (0, 0.18, 0.14), pitch=-10), footR=foot(n0, 'footR', (0, -0.26, 0.10), pitch=10), tail=(-20, 0))
    landp = merge(n0, pelvis=pel(n0, (0, -0.06, -0.12), (8, 0, 0)), footL=foot(n0, 'footL', (0, -0.04, 0)), footR=foot(n0, 'footR', (0, -0.10, 0)), tail=(16, 0))
    return dict(frames=N, loop=False, fn=keyed([(0, n0), (F(3), anti, 'out'), (F(8), fly, 'out'), (F(13), fly, 'lin'), (F(16), landp, 'in'), (N, n0, 'io')]),
                info=info('universal', 2, move_total_leg=-1.8 if not big else -1.4, move_frames=[F(3), F(16)], note='後ろへ小さく跳ぶバックダッシュ。移動はゲーム側'))

# ================= 第2段: 通常技（しゃがみ・空中） =================
def _spd(cid, heavy=False):
    """キャラの速さ。弱は既存 stand_light の発生、強は重量級かどうかで決める"""
    if heavy: return 1.15 if is_big(cid) else (0.9 if STYLE[cid].get('heavy', M._HEAVY.get(cid)) == 'kick' or cid == 'dark_moguzo' else 1.0)
    return max(0.8, min(1.3, STYLE[cid].get('light', dict(moguzo=(4,), pisuke=(3,), godan=(6,)).get(cid))[0] / 4.0))
def _scaled(keys, k):
    sc = lambda f: int(round(f * k)); out = [(sc(x[0]),) + tuple(x[1:]) for x in keys]
    for i in range(1, len(out)):
        if out[i][0] <= out[i - 1][0]: out[i] = (out[i - 1][0] + 1,) + tuple(out[i][1:])
    return out
def _kicker(cid): return STYLE[cid].get('heavy', M._HEAVY.get(cid)) == 'kick'

def crouch_light(cid):
    c = CROUCH(cid); k = _spd(cid); st, ac, N = 6, 3, 22
    hit = merge(c, pelvis=off(c, (0, 0.06, 0.0), (2, -10, 0)), chest=add(c['chest'], (0, -12, 0)), handR=W((-0.12, 0.95, -0.16), fwd=(0, 1.0, -0.1), back=(0.2, 0.1, 1.0), elbow=(0.9, -0.2, -0.3)), tail=(8, 10), keys=K(c, brow_angry=0.7))
    wind = merge(c, handR=hmove(c, 'handR', (0.05, -0.12, -0.05)), chest=add(c['chest'], (0, 6, 0)))
    keys = _scaled([(0, c), (st - 3, wind, 'out'), (st, hit, 'in'), (st + ac, hit, 'lin'), (N, c, 'io')], k); st2 = keys[2][0]; ac2 = keys[3][0] - st2; N2 = keys[-1][0]
    return dict(frames=N2, loop=False, fn=keyed(keys), info=info('normal', 2, 'crouch', 'crouch', startup=st2, active=ac2, recovery=N2 - st2 - ac2, game_action='crouch_weak', hand='R', level='low',
                note='しゃがんだまま（左手は床）右手で低く突く。始めと終わりは crouch の保持姿勢'))
def crouch_heavy(cid):
    c = CROUCH(cid); k = _spd(cid, True); st, ac, N = 12, 4, 39
    wind = merge(c, pelvis=off(c, (0, -0.04, 0.02), (0, -16, 0)), chest=add(c['chest'], (0, -10, 0)), footR=foot(c, 'footR', (0.05, -0.10, 0.05)), tail=(-8, -16), keys=K(c, brow_angry=0.9))
    sweep = merge(c, pelvis=off(c, (-0.04, 0.10, 0.03), (-6, 46, -8)), spine=add(c['spine'], (0, 8, 0)), chest=add(c['chest'], (-4, 14, -4)), head=add(c['head'], (0, -40, 0)), handR=hmove(c, 'handR', (0.25, -0.20, -0.10)),
                  footL=foot(c, 'footL', (0, -0.04, 0), yaw=-30), footR=dict(pos=(-0.30, 1.18, 0.10), yaw=-40, pitch=-18, knee=0.0, toe=0), tail=(14, 26), keys=K(c, brow_angry=0.9))
    back = merge(c, pelvis=off(c, (0, 0.04, 0.02), (0, 20, 0)), footR=dict(pos=(-0.10, 0.50, 0.10), yaw=-20, pitch=10, knee=0.2, toe=0))
    keys = _scaled([(0, c), (st - 5, wind, 'out'), (st, sweep, 'in'), (st + ac, sweep, 'lin'), (st + ac + 9, back, 'io'), (N, c, 'io')], k); st2 = keys[2][0]; ac2 = keys[3][0] - st2; N2 = keys[-1][0]
    return dict(frames=N2, loop=False, fn=keyed(keys), info=info('normal', 2, 'crouch', 'crouch', startup=st2, active=ac2, recovery=N2 - st2 - ac2, game_action='crouch_heavy', limb='footR', level='low',
                note='左手を床についたまま、後ろ脚で低く払う足払い。腰を回して脚を伸ばす'))
def air_light(cid):
    a = AIR(cid); k = _spd(cid); st, ac, N = 6, 5, 23
    if _kicker(cid):
        hit = merge(a, pelvis=off(a, (0, 0, 0), (-10, 0, 0)), footL=dict(pos=(0.0, 0.85, 0.30), yaw=0, pitch=-25, knee=0.1, toe=0), handL=hmove(a, 'handL', (0.15, -0.15, 0.0)), tail=(26, 0), keys=K(a, brow_angry=0.7)); what = '前脚を斜め下へ突き出す蹴り'
    else:
        hit = merge(a, pelvis=off(a, (0, 0, 0), (12, -12, 0)), chest=add(a['chest'], (6, -12, 0)), handL=W((-0.14, 0.86, -0.42), fwd=(0, 0.8, -0.6), back=(0.2, 0.5, 0.8), elbow=(0.9, -0.2, 0.0)), tail=(26, 0), keys=K(a, brow_angry=0.7)); what = '前手を斜め下へ突き出す'
    keys = _scaled([(0, a), (st, hit, 'in'), (st + ac, hit, 'lin'), (N, a, 'io')], k); st2 = keys[1][0]; ac2 = keys[2][0] - st2; N2 = keys[-1][0]
    return dict(frames=N2, loop=False, fn=keyed(keys), info=info('normal', 2, 'air', 'air', startup=st2, active=ac2, recovery=N2 - st2 - ac2, game_action='air_weak', level='air', note='空中姿勢のまま' + what + '。上下移動は含まない'))
def air_heavy(cid):
    a = AIR(cid); k = _spd(cid, True); st, ac, N = 10, 6, 33
    if _kicker(cid):
        wind = merge(a, pelvis=off(a, (0, 0, 0.02), (8, 20, 0)), footR=foot(a, 'footR', (0, -0.10, 0.10), pitch=30))
        hit = merge(a, pelvis=off(a, (0, 0.06, 0.0), (-18, 40, -6)), chest=add(a['chest'], (-8, 10, 0)), head=add(a['head'], (8, -40, 0)), footR=dict(pos=(-0.20, 1.10, 0.02), yaw=-20, pitch=34, knee=0.0, toe=-10),
                    handL=hmove(a, 'handL', (0.20, -0.15, 0.05)), handR=hmove(a, 'handR', (0.30, -0.20, 0.0)), tail=(30, -20), keys=K(a, brow_angry=1.0)); what = '後ろ脚を伸ばして斜め下へ飛び込む蹴り'
    else:
        up = dict(pos=(0.10, 0.15, 0.85), fwd=(0, 0.2, 1.0), back=(0.3, -0.9, 0.1), elbow=(0.9, 0.1, 0.1))
        wind = merge(a, pelvis=off(a, (0, 0, 0.02), (-10, 0, 0)), chest=add(a['chest'], (-10, 0, 0)), handL=up, handR=up, tail=(-10, 0), keys=K(a, brow_angry=1.0))
        dn = lambda: W((-0.16, 0.78, -0.55), fwd=(0, 0.7, -0.7), back=(0.2, 0.6, 0.75), elbow=(0.9, -0.3, 0.1))
        hit = merge(a, pelvis=off(a, (0, 0.04, 0.0), (26, 0, 0)), chest=add(a['chest'], (12, 0, 0)), head=add(a['head'], (-16, 0, 0)), handL=dn(), handR=dn(), tail=(32, 0), jaw=10.0, keys=K(a, brow_angry=1.0)); what = '両手を頭上から振り下ろす'
    keys = _scaled([(0, a), (st - 4, wind, 'out'), (st, hit, 'in'), (st + ac, hit, 'lin'), (N, a, 'io')], k); st2 = keys[2][0]; ac2 = keys[3][0] - st2; N2 = keys[-1][0]
    return dict(frames=N2, loop=False, fn=keyed(keys), info=info('normal', 2, 'air', 'air', startup=st2, active=ac2, recovery=N2 - st2 - ac2, game_action='air_heavy', level='air', note='空中姿勢から' + what + '。上下移動は含まない'))

# ================= 第2段: コマンド技（236 / 623 / 214 / 236236）。型は共通、見た目はキャラ別 =================
def cinfo(cmd, name, **kw): return info('command', 3, command=cmd, name_jp=name + '（仮称）', **kw)
def cmd_hadou(cid, name, two=True, open_=1.0, st=13, N=44, spread=-0.30, hgt=0.0, step=0.20):
    """両手（または片手）を腰に溜めて前へ突き出す。飛び道具・押し出しの共通型"""
    n0 = neutral(cid); y = STYLE[cid]['yaw']
    chg = merge(n0, pelvis=pel(n0, (0, -0.08, -0.14), (6, 14, 0)), chest=add(n0['chest'], (4, 16, 0)), head=add(n0['head'], (0, -28, 0)), handR=dict(pos=(0.05, 0.05, -0.45), fwd=(0, 0.9, 0.3), back=(0.9, 0, 0.3), elbow=(0.5, -0.8, -0.2)),
                handL=dict(pos=(-0.70, 0.25, -0.40), fwd=(-0.4, 0.8, 0.2), back=(0, 0.3, 0.95), elbow=(0.7, -0.3, -0.6)) if two else hand(n0, 'handL', (0.05, -0.05, 0.05)), tail=(-12, -10), keys=K(n0, paw_open_L=open_, paw_open_R=open_, brow_angry=1.0))
    palm = lambda dz: W((spread, 0.92, hgt + dz), fwd=(0, 0.45, 0.9), back=(0, -0.9, 0.45), elbow=(0.85, -0.2, -0.45))
    fire = merge(n0, pelvis=pel(n0, (0, step, -0.12), (10, -y * 0.7 if two else 30, 0)), spine=add(n0['spine'], (2, 0 if two else 8, 0)), chest=add(n0['chest'], (6, -y * 0.2 if two else 20, 0)), neck=add(n0['neck'], (0, 0 if two else -22, 0)), head=add(n0['head'], (-8, y * 0.5 if two else -34, 0)),
                 handR=palm(0.0), handL=palm(0.02) if two else dict(pos=(0.10, -0.05, -0.10), fwd=(-0.1, 0.5, 0.85), back=(0.8, 0.5, 0.0), elbow=(0.5, -0.7, -0.5)),
                 footL=foot(n0, 'footL', (0, step * 1.4, 0)), footR=foot(n0, 'footR', (0, step * 0.4, 0), pitch=24), tail=(18, 8), jaw=10.0, keys=K(n0, paw_open_L=1.0 if two else 0.0, paw_open_R=1.0, brow_angry=1.0))
    rec = merge(fire, pelvis=pel(n0, (0, step * 0.6, -0.08), (6, 0, 0)), jaw=2.0)
    keys = [(0, n0), (st - 4, chg, 'out'), (st - 2, chg, 'lin'), (st, fire, 'in'), (st + 6, fire, 'lin'), (st + 16, rec, 'out'), (N, n0, 'io')]
    return dict(frames=N, loop=False, fn=keyed(keys), info=cinfo('236', name, startup=st, active=4, recovery=N - st - 4, projectile_spawn_frame=st, note=('両手' if two else '片手') + 'を腰に溜めて前へ突き出す。弾や衝撃の発生はゲーム側'))
def cmd_kikou(cid, name, low=0.0):
    n0 = neutral(cid); st, N = 9, 34
    chg = merge(n0, pelvis=pel(n0, (0, -0.04, -0.10 - low), (8, 16, 0)), chest=add(n0['chest'], (4, 14, 0)), head=add(n0['head'], (0, -26, 0)), handR=dict(pos=(0.10, 0.0, -0.35), fwd=(0, 0.9, 0.3), back=(0.9, 0, 0.3), elbow=(0.5, -0.8, -0.2)), tail=(-10, -12), keys=K(n0, paw_open_R=1.0, brow_angry=0.9))
    fire = merge(n0, pelvis=pel(n0, (0, 0.24, -0.12 - low), (14 + low * 40, 34, 0)), chest=add(n0['chest'], (6, 22, 0)), neck=add(n0['neck'], (0, -24, 0)), head=add(n0['head'], (-8, -38, 0)), handR=W((-0.14, 0.95, 0.05 - low), fwd=(0, 0.4, 0.9), back=(0, -0.9, 0.4), elbow=(0.85, -0.2, -0.45)),
                 handL=hand(n0, 'handL', (0.05, -0.15, 0.0)), footL=foot(n0, 'footL', (0, 0.30, 0)), footR=foot(n0, 'footR', (0, 0.10, 0), pitch=28), tail=(16, 16), keys=K(n0, paw_open_R=1.0, brow_angry=1.0))
    return dict(frames=N, loop=False, fn=keyed([(0, n0), (st - 3, chg, 'out'), (st, fire, 'in'), (st + 5, fire, 'lin'), (N, n0, 'io')]), info=cinfo('236', name, startup=st, active=4, recovery=N - st - 4, projectile_spawn_frame=st, note='片手の掌を素早く前へ押し出す。短い弾や崩しの発生はゲーム側'))
def cmd_wave(cid, name):
    n0 = neutral(cid); s = STYLE[cid]; st, N = 16, 50
    wind = merge(n0, pelvis=pel(n0, (0, -0.08, 0.02), (-8, -14, 0)), chest=add(n0['chest'], (-10, -8, 0)), handR=dict(pos=(0.15, 0.10, 0.93), fwd=(0, -0.3, 0.95), back=(0.3, -0.9, -0.2), elbow=(0.9, 0.0, 0.3)), footL=foot(n0, 'footL', (0, 0.04, 0.10), pitch=-8), tail=(-14, 0), jaw=6.0, keys=K(n0, brow_angry=1.0))
    slam = merge(n0, pelvis=pel(n0, (0.02, 0.18, -0.30), (30, 20, 6)), spine=add(n0['spine'], (14, 4, 0)), chest=add(n0['chest'], (14, 10, 4)), neck=add(n0['neck'], (-12, -10, 0)), head=add(n0['head'], (-26, -14, 0)),
                 handR=dict(space='root', pos=(-0.30, s['lead'][1] + 0.80, 0.22), fwd=(0, 0.9, -0.4), back=(0.2, 0.4, 0.9), elbow=(0.9, -0.3, 0.3)), handL=hand(n0, 'handL', (0.10, -0.10, -0.10)),
                 footL=foot(n0, 'footL', (0.06, 0.22, 0), knee=0.6), footR=foot(n0, 'footR', (0.04, 0.06, 0), pitch=18, knee=0.6), tail=(24, 8), jaw=12.0, keys=K(n0, brow_angry=1.0))
    return dict(frames=N, loop=False, fn=keyed([(0, n0), (10, wind, 'out'), (12, wind, 'lin'), (st, slam, 'in'), (st + 8, slam, 'lin'), (st + 20, merge(slam, pelvis=pel(n0, (0, 0.10, -0.16), (14, 8, 0))), 'out'), (N, n0, 'io')]),
                info=cinfo('236', name, startup=st, active=5, recovery=N - st - 5, projectile_spawn_frame=st, note='右拳を振りかぶって床へ叩きつける。地面を伝う衝撃波の発生はゲーム側'))
def cmd_sonic(cid, name):
    n0 = neutral(cid); st, N = 11, 38
    cross = lambda: dict(pos=(-0.78, 0.42, 0.10), fwd=(-0.7, 0.3, 0.6), back=(0.2, 0.9, 0.3), elbow=(0.4, 0.2, -0.9))
    wide = lambda: dict(pos=(0.50, 0.74, 0.02), fwd=(0.5, 0.85, 0.0), back=(-0.4, 0.3, 0.85), elbow=(0.8, -0.5, -0.2))
    chg = merge(n0, pelvis=pel(n0, (0, -0.06, -0.06), (-2, 0, 0)), chest=add(n0['chest'], (-4, 0, 0)), handL=cross(), handR=cross(), tail=(-8, 0), keys=K(n0, brow_angry=0.6))
    fire = merge(n0, pelvis=pel(n0, (0, 0.16, -0.08), (8, 0, 0)), chest=add(n0['chest'], (6, 0, 0)), head=add(n0['head'], (-6, 0, 0)), handL=wide(), handR=wide(), footL=foot(n0, 'footL', (0, 0.22, 0)), footR=foot(n0, 'footR', (0, 0.06, 0), pitch=18), tail=(12, 0), keys=K(n0, paw_open_L=1.0, paw_open_R=1.0, brow_angry=0.9))
    return dict(frames=N, loop=False, fn=keyed([(0, n0), (st - 4, chg, 'out'), (st - 2, chg, 'lin'), (st, fire, 'in'), (st + 6, fire, 'lin'), (N, n0, 'io')]), info=cinfo('236', name, startup=st, active=4, recovery=N - st - 4, projectile_spawn_frame=st, note='胸の前で両腕を交差させ、外へ切り開く。弾の発生はゲーム側'))
def cmd_tail_arc(cid, name, cmd, arc, lean, hop, st, N):
    """bullet: 尻尾を縦に振る。arc=尻尾全体の反り（度、上・前向き）"""
    n0 = neutral(cid); nb = len(STYLE[cid]['tail_bones']); tb = lambda d: tuple((d / nb, 0) for _ in range(nb))
    coil = merge(n0, pelvis=pel(n0, (0, -0.06, -0.16), (lean * 0.4, 0, 0)), chest=add(n0['chest'], (6, 0, 0)), handL=hand(n0, 'handL', (0.10, -0.05, -0.15)), handR=hand(n0, 'handR', (0.10, -0.05, -0.15)), tail=(0, 0), tail_bones=tb(-40), keys=K(n0, brow_angry=0.9))
    snap = merge(n0, pelvis=pel(n0, (0, 0.14, -0.10 + hop), (lean, 0, 0)), spine=add(n0['spine'], (lean * 0.2, 0, 0)), chest=add(n0['chest'], (lean * 0.2, 0, 0)), head=add(n0['head'], (-lean * 0.9, 0, 0)), handL=hand(n0, 'handL', (0.25, 0.05, -0.20)), handR=hand(n0, 'handR', (0.25, 0.05, -0.22)),
                 footL=foot(n0, 'footL', (0, 0.10, hop * 0.8), pitch=20 if hop else 0), footR=foot(n0, 'footR', (0, 0.10, hop), pitch=30 if hop else 14), tail=(0, 0), tail_bones=tb(arc), jaw=8.0, keys=K(n0, brow_angry=1.0))
    keys = [(0, n0), (st - 5, coil, 'out'), (st - 3, coil, 'lin'), (st, snap, 'in'), (st + 6, snap, 'lin'), (st + 16, merge(n0, pelvis=pel(n0, (0, 0.06, -0.12), (lean * 0.3, 0, 0))), 'io'), (N, n0, 'io')]
    return dict(frames=N, loop=False, fn=keyed(keys), tail_stiff=3.0, tail_follow=0.65, measure_tail=True, info=cinfo(cmd, name, startup=st + 2, active=5, recovery=N - st - 7, reach_part='tail', projectile_spawn_frame=st + 2 if cmd == '236' else None,
                note='尻尾を下へ巻いて溜め、背中越しに縦に振り上げる。' + ('頭上を越えて前へ弾き出す（弾の発生はゲーム側）' if cmd == '236' else '小さく跳びながら頭上を打つ対空')))
def cmd_upper(cid, name, hand_='R', open_=0.0, k=1.0):
    """沈み込みから跳び上がるアッパー（対空）。hand_ で打つ手を選ぶ"""
    n0 = neutral(cid); st, ac, N = 6, 8, 46; o = 'L' if hand_ == 'R' else 'R'; sg = 1 if hand_ == 'R' else -1; H, O = 'hand' + hand_, 'hand' + o
    dip = merge(n0, pelvis=pel(n0, (0, 0.04, -0.22), (14, 10 * sg, 0)), chest=add(n0['chest'], (8, 10 * sg, 0)), tail=(-12, 0), keys=K(n0, brow_angry=1.0, **{'paw_open_' + hand_: open_}),
                **{H: W((0.05, 0.30, -0.55), fwd=(0, 0.6, 0.8), back=(0.3, -0.9, 0.3), elbow=(0.6, -0.7, -0.3)), O: hand(n0, O, (0, -0.10, 0.05))})
    up = merge(n0, pelvis=pel(n0, (0, 0.14, 0.30), (-8, 34 * sg, 0)), spine=add(n0['spine'], (-6, 8 * sg, 0)), chest=add(n0['chest'], (-10, 16 * sg, 0)), head=add(n0['head'], (-14, -40 * sg, 0)),
               footL=foot(n0, 'footL', (0, 0.06, 0.22), pitch=35), footR=foot(n0, 'footR', (0, 0.10, 0.30), pitch=45), tail=(25, 0), jaw=12.0, keys=K(n0, brow_angry=1.0, **{'paw_open_' + hand_: open_}),
               **{H: W((-0.12, 0.42, 0.86), fwd=(0, 0.15, 1.0), back=(0.2, -1.0, 0.1), elbow=(0.7, 0.2, -0.6)), O: hand(n0, O, (0.05, -0.15, -0.10))})
    fall = merge(n0, pelvis=pel(n0, (0, 0.10, 0.12), (0, 14 * sg, 0)), footL=foot(n0, 'footL', (0, 0.04, 0.08), pitch=20), footR=foot(n0, 'footR', (0, 0.06, 0.10), pitch=25), tail=(20, 0), **{H: W((-0.05, 0.40, 0.45), fwd=(0, 0.3, 1.0), back=(0.4, -0.8, 0.2), elbow=(0.7, -0.2, -0.6))})
    land_ = merge(n0, pelvis=pel(n0, (0, 0.04, -0.16), (10, 4, 0)), tail=(-10, 0))
    keys = _scaled([(0, n0), (st - 2, dip, 'out'), (st + 2, up, 'in'), (st + ac, up, 'lin'), (st + ac + 10, fall, 'io'), (st + ac + 16, land_, 'in'), (N, n0, 'io')], k); st2 = keys[2][0] - 2
    return dict(frames=keys[-1][0], loop=False, fn=keyed(keys), info=cinfo('623', name, startup=st2, active=keys[3][0] - st2, recovery=keys[-1][0] - keys[3][0], hand=hand_, anti_air=True, hop_frames=[st2, keys[4][0] + 4], note='沈み込みから体ごと跳び上がって突き上げる対空。小さな跳躍はクリップに含む'))
def cmd_flipkick(cid, name):
    n0 = neutral(cid); st, N = 6, 42
    dip = merge(n0, pelvis=pel(n0, (0, 0.02, -0.20), (12, 10, 0)), chest=add(n0['chest'], (8, 0, 0)), tail=(-12, 0), keys=K(n0, brow_angry=0.9))
    kick = merge(n0, pelvis=pel(n0, (0, 0.10, 0.36), (-30, 30, 0)), spine=add(n0['spine'], (-8, 6, 0)), chest=add(n0['chest'], (-10, 8, 0)), head=add(n0['head'], (16, -34, 0)), handL=hand(n0, 'handL', (0.30, -0.20, 0.10)), handR=hand(n0, 'handR', (0.35, -0.25, 0.0)),
                 footL=foot(n0, 'footL', (0, 0.0, 0.34), pitch=40), footR=dict(pos=(-0.18, 0.72, 1.60), yaw=-15, pitch=-55, knee=0.0, toe=0), tail=(30, -10), keys=K(n0, brow_angry=1.0))
    fall = merge(n0, pelvis=pel(n0, (0, 0.06, 0.14), (-6, 10, 0)), footL=foot(n0, 'footL', (0, 0.02, 0.10), pitch=24), footR=dict(pos=(-0.05, 0.30, 0.50), yaw=0, pitch=10, knee=0.3, toe=0), tail=(22, 0))
    land_ = merge(n0, pelvis=pel(n0, (0, 0.02, -0.16), (10, 0, 0)), tail=(-10, 0))
    return dict(frames=N, loop=False, fn=keyed([(0, n0), (st - 2, dip, 'out'), (st + 2, kick, 'in'), (st + 9, kick, 'lin'), (st + 19, fall, 'io'), (st + 25, land_, 'in'), (N, n0, 'io')]),
                info=cinfo('623', name, startup=st, active=9, recovery=N - st - 9, limb='footR', anti_air=True, hop_frames=[st, st + 23], note='沈み込みから跳び上がり、後ろ脚を真上へ蹴り上げる対空'))
def cmd_lift(cid, name):
    n0 = neutral(cid); st, N = 9, 44
    low = lambda: W((-0.20, 0.86, -0.52), fwd=(0, 0.9, -0.3), back=(0.2, -0.3, -0.9), elbow=(0.9, -0.3, 0.0)); hi = lambda: dict(pos=(0.08, 0.34, 0.86), fwd=(0, 0.2, 1.0), back=(0.2, 1.0, -0.1), elbow=(0.9, 0.2, -0.2))
    scoop = merge(n0, pelvis=pel(n0, (0, 0.20, -0.24), (26, 0, 0)), chest=add(n0['chest'], (10, 0, 0)), head=add(n0['head'], (-20, 0, 0)), handL=low(), handR=low(), footL=foot(n0, 'footL', (0, 0.26, 0)), footR=foot(n0, 'footR', (0, 0.06, 0), pitch=20), tail=(-12, 0), keys=K(n0, paw_open_L=1.0, paw_open_R=1.0, brow_angry=0.9))
    heave = merge(n0, pelvis=pel(n0, (0, 0.14, 0.14), (-12, 0, 0)), spine=add(n0['spine'], (-6, 0, 0)), chest=add(n0['chest'], (-12, 0, 0)), head=add(n0['head'], (-10, 0, 0)), handL=hi(), handR=hi(), footL=foot(n0, 'footL', (0, 0.22, 0), pitch=20), footR=foot(n0, 'footR', (0, 0.06, 0), pitch=30),
                  tail=(26, 0), jaw=14.0, keys=K(n0, paw_open_L=1.0, paw_open_R=1.0, brow_angry=1.0))
    return dict(frames=N, loop=False, fn=keyed([(0, n0), (st - 2, scoop, 'out'), (st + 4, heave, 'in'), (st + 12, heave, 'lin'), (N, n0, 'io')]), info=cinfo('623', name, startup=st, active=8, recovery=N - st - 8, anti_air=True, note='両手を低く差し入れ、頭上まで一気にすくい上げる対空'))
def cmd_hook2(cid, name):
    """moguzo の214: 踏み込みながら左フック→右の裏拳"""
    n0 = neutral(cid); N = 44
    h1 = merge(n0, pelvis=pel(n0, (0, 0.18, -0.10), (10, -34, 0)), chest=add(n0['chest'], (6, -30, -4)), head=add(n0['head'], (-6, 52, 0)), handL=W((-0.34, 0.80, 0.02), fwd=(-0.6, 0.8, 0.0), back=(0.5, 0.3, 0.8), elbow=(0.95, -0.2, 0.1)), handR=hand(n0, 'handR', (0.0, -0.18, 0.0)),
               footL=foot(n0, 'footL', (0, 0.26, 0)), footR=foot(n0, 'footR', (0, 0.08, 0), pitch=22), tail=(10, -20), keys=K(n0, brow_angry=1.0))
    h2 = merge(n0, pelvis=pel(n0, (0, 0.38, -0.14), (10, 62, 0)), spine=add(n0['spine'], (0, 14, 0)), chest=add(n0['chest'], (4, 34, 4)), neck=add(n0['neck'], (0, -30, 0)), head=add(n0['head'], (-6, -62, 0)), handR=W((0.10, 0.96, 0.04), fwd=(0.3, 0.95, 0.0), back=(-0.9, 0.3, 0.3), elbow=(0.6, -0.3, -0.7)),
               handL=hand(n0, 'handL', (0.10, -0.25, -0.05)), footL=foot(n0, 'footL', (0.02, 0.50, 0), yaw=8), footR=foot(n0, 'footR', (0, 0.26, 0), pitch=32, yaw=-12), tail=(14, 26), jaw=10.0, keys=K(n0, brow_angry=1.0))
    keys = [(0, n0), (7, h1, 'in'), (10, h1, 'lin'), (17, h2, 'in'), (21, h2, 'lin'), (31, merge(h2, pelvis=pel(n0, (0, 0.24, -0.10), (8, 30, 0))), 'out'), (N, n0, 'io')]
    return dict(frames=N, loop=False, fn=keyed(keys), info=cinfo('214', name, startup=7, hits=[[7, 10], [17, 21]], recovery=N - 21, move_total_leg=1.0, move_frames=[3, 21], note='踏み込みながら左フック、腰を返して右の裏拳。前進はゲーム側'))

# ---- 奥義（236236）。溜め→キャラごとの決め技 ----
def _charge(cid, n0):
    return merge(n0, pelvis=pel(n0, (0, -0.10, -0.24), (14, 0, 0)), chest=add(n0['chest'], (8, 0, 0)), head=add(n0['head'], (-14, 0, 0)), handL=hand(n0, 'handL', (0.25, -0.25, -0.30)), handR=hand(n0, 'handR', (0.25, -0.25, -0.30)), tail=(30, 0), jaw=6.0, keys=K(n0, brow_angry=1.0))
def _sinfo(name, st, ac, N, **kw): return info('command', 3, command='236236', name_jp=name + '（仮称）', super=True, flash_frames=[0, 10], startup=st, active=ac, recovery=N - st - ac, **kw)
def super_moguzo(cid):
    n0 = neutral(cid); s = STYLE[cid]; N = 64
    palm = lambda: dict(space='root', pos=(-0.20, s['lead'][1] + 0.85, 0.22), fwd=(0, 0.95, -0.2), back=(0, 0.2, 1.0), elbow=(0.9, -0.3, 0.3))
    leap = merge(n0, pelvis=pel(n0, (0, 0.10, 0.34), (-6, 26, 0)), chest=add(n0['chest'], (-10, 10, 0)), handL=dict(pos=(0.10, 0.15, 0.90), fwd=(0, 0.2, 1.0), back=(0.3, -0.9, 0.1), elbow=(0.9, 0.1, 0.1)), handR=dict(pos=(0.10, 0.15, 0.90), fwd=(0, 0.2, 1.0), back=(0.3, -0.9, 0.1), elbow=(0.9, 0.1, 0.1)),
                 footL=foot(n0, 'footL', (0, 0.10, 0.30), pitch=30), footR=foot(n0, 'footR', (0, 0.10, 0.36), pitch=40), tail=(-10, 0), keys=K(n0, paw_open_L=1.0, paw_open_R=1.0, brow_angry=1.0))
    slam = merge(n0, pelvis=pel(n0, (0, 0.20, -0.34), (34, 26, 0)), spine=add(n0['spine'], (14, 0, 0)), chest=add(n0['chest'], (14, 0, 0)), head=add(n0['head'], (-30, -26, 0)), handL=palm(), handR=palm(), footL=foot(n0, 'footL', (0.08, 0.20, 0), knee=0.7), footR=foot(n0, 'footR', (0.08, 0.10, 0), knee=0.8, pitch=10),
                 tail=(34, 0), jaw=16.0, keys=K(n0, paw_open_L=1.0, paw_open_R=1.0, brow_angry=1.0))
    return dict(frames=N, loop=False, fn=keyed([(0, n0), (8, _charge(cid, n0), 'out'), (10, _charge(cid, n0), 'lin'), (16, leap, 'out'), (20, slam, 'in'), (32, slam, 'lin'), (46, merge(slam, pelvis=pel(n0, (0, 0.10, -0.18), (14, 10, 0))), 'out'), (N, n0, 'io')]),
                info=_sinfo('大地烈掌', 20, 10, N, hop_frames=[12, 20], note='溜めて跳び、両手のひらを床へ叩きつける'))
def super_pisuke(cid):
    n0 = neutral(cid); N = 60
    def kick(pos, pit, yw):
        return merge(n0, pelvis=pel(n0, (-0.04, 0.22, 0.08), (-14, yw, -10)), spine=add(n0['spine'], (-6, 8, -6)), chest=add(n0['chest'], (-8, 10, -6)), neck=add(n0['neck'], (8, -20, 6)), head=add(n0['head'], (10, -44, 8)), handL=hand(n0, 'handL', (0.10, -0.15, 0.0)), handR=hand(n0, 'handR', (0.30, -0.25, -0.20)),
                     footL=foot(n0, 'footL', (-0.02, -0.10, 0), yaw=-42, pitch=6), footR=dict(pos=pos, yaw=-24, pitch=pit, knee=0.0, toe=0), tail=(25, -30), keys=K(n0, brow_angry=1.0))
    ch = merge(n0, pelvis=pel(n0, (-0.03, 0.06, 0.06), (-6, 30, -8)), handL=hand(n0, 'handL', (0.05, -0.12, 0.05)), handR=hand(n0, 'handR', (0.20, -0.20, -0.10)), footL=foot(n0, 'footL', (-0.02, -0.10, 0), yaw=-30), footR=dict(pos=(-0.20, 0.50, 0.62), yaw=-20, pitch=30, knee=0.2, toe=0), tail=(15, -20), keys=K(n0, brow_angry=1.0))
    lo, mi, hi = kick((-0.22, 1.10, 0.30), -6, 38), kick((-0.22, 1.12, 0.66), -16, 42), kick((-0.22, 0.98, 1.04), -32, 46)
    keys = [(0, n0), (8, _charge(cid, n0), 'out'), (10, _charge(cid, n0), 'lin'), (13, lo, 'in'), (15, lo, 'lin'), (18, ch, 'io'), (21, mi, 'in'), (23, mi, 'lin'), (26, ch, 'io'), (29, mi, 'in'), (31, mi, 'lin'), (35, ch, 'io'), (39, hi, 'in'), (43, hi, 'lin'), (50, ch, 'io'), (N, n0, 'io')]
    return dict(frames=N, loop=False, fn=keyed(keys), info=_sinfo('音速連脚', 13, 30, N, hits=[[13, 15], [21, 23], [29, 31], [39, 43]], limb='footR', note='溜めから下段・中段・中段・上段の四連蹴り'))
def super_hammer(cid, name):
    n0 = neutral(cid); N = 72
    up = lambda: dict(pos=(0.10, 0.12, 0.93), fwd=(0, -0.2, 1.0), back=(0.3, -0.9, -0.2), elbow=(0.9, 0.0, 0.3)); dn = lambda: W((-0.16, 0.86, -0.46), fwd=(0, 0.8, -0.6), back=(0.2, 0.55, 0.8), elbow=(0.9, -0.3, 0.2))
    rear = merge(n0, pelvis=pel(n0, (0, -0.10, 0.08), (-14, 0, 0)), spine=add(n0['spine'], (-8, 0, 0)), chest=add(n0['chest'], (-14, 0, 0)), head=add(n0['head'], (8, 0, 0)), handL=up(), handR=up(), footL=foot(n0, 'footL', (0, 0.06, 0.16), pitch=-10), tail=(-18, 0), jaw=10.0, keys=K(n0, brow_angry=1.0))
    smash = merge(n0, pelvis=pel(n0, (0, 0.24, -0.20), (22, 0, 0)), spine=add(n0['spine'], (10, 0, 0)), chest=add(n0['chest'], (14, 0, 0)), neck=add(n0['neck'], (-10, 0, 0)), head=add(n0['head'], (-18, 0, 0)), handL=dn(), handR=dn(), footL=foot(n0, 'footL', (0.04, 0.36, 0)), footR=foot(n0, 'footR', (0.02, 0.08, 0), pitch=24),
                  tail=(30, 0), jaw=18.0, keys=K(n0, brow_angry=1.0))
    keys = [(0, n0), (8, _charge(cid, n0), 'out'), (10, _charge(cid, n0), 'lin'), (18, rear, 'out'), (22, rear, 'lin'), (26, smash, 'in'), (36, smash, 'lin'), (52, merge(smash, pelvis=pel(n0, (0, 0.14, -0.10), (10, 0, 0))), 'out'), (N, n0, 'io')]
    return dict(frames=N, loop=False, fn=keyed(keys), info=_sinfo(name, 26, 10, N, note='溜めて大きくのけぞり、両拳を頭上から体重ごと振り下ろす'))
def super_hakuma(cid):
    c = cmd_hadou(cid, '白峰不動掌', two=True, st=22, N=70, spread=-0.10, hgt=0.02, step=0.42); n0 = neutral(cid); base = c['fn']
    def fn(f): return sample([(0, n0), (8, _charge(cid, n0), 'out'), (10, _charge(cid, n0), 'lin'), (16, plain(base(18)), 'io')], f) if f <= 16 else base(f)
    return dict(frames=70, loop=False, fn=fn, info=_sinfo('白峰不動掌', 22, 8, 70, move_total_leg=0.9, move_frames=[16, 26], note='溜めから大きく踏み込み、両手のひらで体ごと押し出す'))
def super_chirka(cid):
    n0 = neutral(cid); N = 62
    def claw(side, pos, yw, low):
        H = 'hand' + side; O = 'hand' + ('R' if side == 'L' else 'L')
        return merge(n0, pelvis=pel(n0, (0, 0.14 + low * 0.3, -0.08 - low), (10 + low * 60, yw, 0)), chest=add(n0['chest'], (6, yw * 0.6, 0)), head=add(n0['head'], (-8 - low * 40, -yw * 1.2, 0)), footL=foot(n0, 'footL', (0, 0.20 + low, 0)), footR=foot(n0, 'footR', (0, 0.06, 0), pitch=24),
                     tail=(16, -yw * 0.5), keys=K(n0, brow_angry=1.0, **{'paw_open_' + side: 1.0}), **{H: W(pos, fwd=(0, 0.9, -0.3), back=(0.3, 0.4, 0.85), elbow=(0.9, -0.3, 0.1)), O: hand(n0, O, (0.05, -0.20, 0.0))})
    a, b, c_, d = claw('L', (-0.16, 0.92, 0.30), -30, 0.0), claw('R', (-0.15, 0.90, -0.40), 30, 0.16), claw('L', (-0.16, 0.94, 0.0), -30, 0.04), claw('R', (-0.12, 0.96, -0.10), 44, 0.20)
    keys = [(0, n0), (8, _charge(cid, n0), 'out'), (10, _charge(cid, n0), 'lin'), (13, a, 'in'), (15, a, 'lin'), (19, b, 'in'), (21, b, 'lin'), (25, c_, 'in'), (27, c_, 'lin'), (30, merge(n0, pelvis=pel(n0, (0, -0.16, 0.02), (-10, 0, 0))), 'io'), (36, d, 'in'), (42, d, 'lin'), (N, n0, 'io')]
    return dict(frames=N, loop=False, fn=keyed(keys), info=_sinfo('百面本命打ち', 13, 29, N, hits=[[13, 15], [19, 21], [25, 27], [36, 42]], move_total_leg=1.0, move_frames=[10, 40], note='上・下・中と爪で惑わし、いったん引いてから低い本命の一撃'))
def super_takimaru(cid):
    n0 = neutral(cid); N = 76
    op = dict(pos=(0.80, 0.35, 0.25), fwd=(0.3, 0.9, 0.2), back=(0.9, -0.3, 0.0), elbow=(0.5, -0.6, -0.5)); sh = dict(space='world', pos=(-0.42, 0.80, 0.0), fwd=(-0.6, 0.8, 0.0), back=(0.7, 0.6, 0.3), elbow=(0.9, -0.1, -0.3))
    hi = dict(pos=(0.06, 0.20, 0.90), fwd=(0, 0.2, 1.0), back=(0.3, -0.9, 0.2), elbow=(0.9, 0.1, -0.2)); dn = W((-0.12, 0.84, -0.55), fwd=(0, 0.8, -0.6), back=(0.2, 0.5, 0.85), elbow=(0.9, -0.3, 0.1))
    wide = merge(n0, pelvis=pel(n0, (0, -0.05, 0.03), (-4, 14, 0)), chest=add(n0['chest'], (-6, 14, 0)), handL=op, handR=op, jaw=12.0, keys=K(n0, paw_open_L=1.0, paw_open_R=1.0, brow_angry=1.0))
    shut = merge(n0, pelvis=pel(n0, (0, 0.30, -0.10), (16, 14, 0)), chest=add(n0['chest'], (10, 14, 0)), head=add(n0['head'], (-12, -14, 0)), handL=sh, handR=sh, footL=foot(n0, 'footL', (0, 0.35, 0)), footR=foot(n0, 'footR', (0, 0.10, 0), pitch=20), keys=K(n0, paw_open_L=0.3, paw_open_R=0.3, brow_angry=1.0))
    hoist = merge(n0, pelvis=pel(n0, (0, 0.10, 0.30), (-16, 14, 0)), spine=add(n0['spine'], (-6, 0, 0)), chest=add(n0['chest'], (-12, 0, 0)), handL=hi, handR=hi, footL=foot(n0, 'footL', (0, 0.20, 0.20), pitch=30), footR=foot(n0, 'footR', (0, 0.10, 0.26), pitch=40), tail=(-16, 0), jaw=14.0, keys=K(n0, paw_open_L=0.3, paw_open_R=0.3, brow_angry=1.0))
    slam = merge(n0, pelvis=pel(n0, (0, 0.30, -0.28), (34, 14, 0)), spine=add(n0['spine'], (12, 0, 0)), chest=add(n0['chest'], (14, 0, 0)), head=add(n0['head'], (-24, -14, 0)), handL=dn, handR=dn, footL=foot(n0, 'footL', (0.06, 0.40, 0)), footR=foot(n0, 'footR', (0.04, 0.12, 0), pitch=24), tail=(30, 0), jaw=18.0, keys=K(n0, paw_open_L=1.0, paw_open_R=1.0, brow_angry=1.0))
    keys = [(0, n0), (8, wide, 'out'), (10, wide, 'lin'), (14, shut, 'in'), (18, shut, 'lin'), (30, hoist, 'io'), (36, hoist, 'lin'), (42, slam, 'in'), (52, slam, 'lin'), (64, merge(slam, pelvis=pel(n0, (0, 0.16, -0.12), (14, 14, 0))), 'out'), (N, n0, 'io')]
    return dict(frames=N, loop=False, fn=keyed(keys), info=_sinfo('天地落とし', 14, 4, N, throw=True, hop_frames=[24, 42], release_frame=42, note='抱え込んで頭上まで持ち上げ、跳んで床へ叩きつける。回転は入れていない（足を接地したままの全回転は破綻するため）'))
def super_yomikage(cid):
    n0 = neutral(cid); N = 62
    st_ = merge(n0, pelvis=pel(n0, (0, -0.10, -0.04), (-2, -8, 0)), chest=add(n0['chest'], (-2, -6, 0)), handL=dict(pos=(-0.25, 0.52, 0.20), fwd=(0, 0.05, 1.0), back=(0.1, 1.0, 0.0), elbow=(0.3, 0.2, -0.9)), handR=dict(pos=(0.25, 0.20, 0.80), fwd=(0, 0.3, 0.95), back=(0.9, 0, 0.3), elbow=(0.9, -0.2, 0.2)), tail=(-6, 0), keys=K(n0, brow_angry=0.6, paw_open_R=1.0))
    cut = merge(n0, pelvis=pel(n0, (0, 0.52, -0.20), (16, 44, 0)), spine=add(n0['spine'], (4, 10, 0)), chest=add(n0['chest'], (8, 26, 0)), neck=add(n0['neck'], (0, -30, 0)), head=add(n0['head'], (-10, -44, 0)), handR=W((-0.20, 0.92, -0.30), fwd=(0, 0.9, -0.4), back=(-0.9, 0, 0.4), elbow=(0.8, -0.4, 0.3)),
                handL=dict(pos=(0.05, 0.0, -0.10), fwd=(-0.1, 0.5, 0.85), back=(0.8, 0.5, 0.0), elbow=(0.5, -0.7, -0.5)), footL=foot(n0, 'footL', (0, 0.62, 0)), footR=foot(n0, 'footR', (0, 0.30, 0), pitch=34), tail=(16, 18), keys=K(n0, brow_angry=1.0, paw_open_R=1.0))
    keys = [(0, n0), (8, st_, 'out'), (16, st_, 'lin'), (20, cut, 'in'), (40, cut, 'lin'), (N, n0, 'io')]
    return dict(frames=N, loop=False, fn=keyed(keys), info=_sinfo('後の先・月断', 20, 4, N, zanshin_frames=[24, 40], move_total_leg=1.4, move_frames=[16, 20], note='手刀を高く構えて静止し、一歩で間合いを詰めて斜めに断つ。打った姿勢のまま残心'))
def super_bullet(cid):
    n0 = neutral(cid); N = 64; nb = len(STYLE[cid]['tail_bones']); tb = lambda d: tuple((d / nb, 0) for _ in range(nb))
    coil = merge(_charge(cid, n0), pelvis=pel(n0, (0, -0.12, -0.30), (30, 0, 0)), head=add(n0['head'], (-30, 0, 0)), tail=(0, 0), tail_bones=tb(70))
    arm = lambda: dict(pos=(0.25, -0.35, -0.45), fwd=(0, -0.8, -0.6), back=(0.9, 0, 0.3), elbow=(0.6, -0.8, 0.0))
    dart = merge(n0, pelvis=pel(n0, (0, 0.55, 0.20), (64, 0, 0)), spine=add(n0['spine'], (6, 0, 0)), chest=add(n0['chest'], (4, 0, 0)), neck=add(n0['neck'], (-20, 0, 0)), head=add(n0['head'], (-40, 0, 0)), handL=arm(), handR=arm(),
                 footL=dict(pos=(0.0, -0.60, 0.80), yaw=0, pitch=60, knee=0.1, toe=0, pivot='ankle'), footR=dict(pos=(0.0, -0.60, 0.80), yaw=0, pitch=60, knee=0.1, toe=0, pivot='ankle'), tail=(0, 0), tail_bones=tb(-56), jaw=4.0, keys=K(n0, brow_angry=1.0, blink=0.5))
    land_ = merge(n0, pelvis=pel(n0, (0, 0.20, -0.28), (30, 0, 0)), chest=add(n0['chest'], (10, 0, 0)), handL=hand(n0, 'handL', (0.10, 0.10, -0.40)), handR=hand(n0, 'handR', (0.10, 0.10, -0.42)), tail=(0, 0), tail_bones=tb(30))
    keys = [(0, n0), (9, coil, 'out'), (12, coil, 'lin'), (16, dart, 'in'), (28, dart, 'lin'), (38, land_, 'io'), (N, n0, 'io')]
    return dict(frames=N, loop=False, fn=keyed(keys), tail_stiff=3.0, tail_follow=0.6, info=_sinfo('超圧縮・弾丸頭突き', 16, 12, N, hop_frames=[13, 36], move_total_leg=3.4, move_frames=[13, 30], note='体を丸めて溜め、頭から水平に飛び出す。尻尾は後ろへ真っすぐ伸ばす。前進はゲーム側'))
def super_dark(cid):
    n0 = neutral(cid); r = M.sp_dark_rush(cid)['fn']; u = cmd_upper(cid, '', 'L')['fn']; N = 74
    def fn(f): return r(f) if f <= 22 else (sample([(22, plain(r(22))), (27, plain(u(4)), 'io')], f) if f <= 27 else (u(f - 23) if f - 23 <= 46 else n0))
    return dict(frames=N - 5, loop=False, fn=fn, info=_sinfo('暗連・黒天烈掌', 4, 30, N - 5, hits=[[4, 6], [11, 13], [19, 22], [29, 36]], hop_frames=[29, 47], note='暗連の三連から、沈んで左の跳び上がりアッパーで締める'))

CMD236 = dict(moguzo=lambda c: cmd_hadou(c, '波動掌'), dark_moguzo=lambda c: cmd_hadou(c, '黒波動', two=False, st=11, N=40, spread=-0.16), hakuma=lambda c: cmd_hadou(c, '雪壁掌', st=11, N=39, spread=-0.05, hgt=0.04, step=0.26),
              pisuke=lambda c: cmd_kikou(c, '疾風掌'), chirka=lambda c: cmd_kikou(c, '毒気掌', low=0.10), godan=lambda c: cmd_wave(c, '地割り'), takimaru=lambda c: cmd_wave(c, '大地走り'),
              yomikage=lambda c: cmd_sonic(c, '影断ち'), bullet=lambda c: cmd_tail_arc(c, '尾弾き', '236', 150, 34, 0.0, 14, 44))
CMD623 = dict(godan=lambda c: cmd_upper(c, '岩砕き', 'R', k=1.2), hakuma=lambda c: cmd_upper(c, '白峰対空', 'R', open_=1.0, k=1.15), yomikage=lambda c: cmd_upper(c, '昇り肘', 'L', k=0.95), dark_moguzo=lambda c: cmd_upper(c, '逆昇撃', 'L', k=0.9),
              pisuke=lambda c: cmd_flipkick(c, '空牙蹴り'), chirka=lambda c: cmd_flipkick(c, '跳ね爪'), takimaru=lambda c: cmd_lift(c, '抱え上げ'), bullet=lambda c: cmd_tail_arc(c, '尾跳ね', '623', 105, 22, 0.22, 8, 40))
CMD214 = dict(moguzo=lambda c: cmd_hook2(c, '旋回二連'))
SUPER = dict(moguzo=super_moguzo, pisuke=super_pisuke, godan=lambda c: super_hammer(c, '山崩し'), hakuma=super_hakuma, chirka=super_chirka, takimaru=super_takimaru, yomikage=super_yomikage, bullet=super_bullet, dark_moguzo=super_dark)
# 入力→クリップ名。既存の固有モーション（sp_*）はそのまま使い、足りない枠だけ新規に作った
def command_map(cid):
    sp = M.UNIQUE[cid][0]
    return {'236': 'cmd_236', '623': 'cmd_623' if cid in CMD623 else sp, '214': 'cmd_214' if cid in CMD214 else sp, '236236': 'super'}
PHASE2 = dict(crouch_light=crouch_light, crouch_heavy=crouch_heavy, air_light=air_light, air_heavy=air_heavy, cmd_236=CMD236, cmd_623=CMD623, cmd_214=CMD214, super=SUPER)

PHASE1 = dict(roar=roar, roar_hit=roar_hit, gyuiin=gyuiin, clinch_hold=clinch_hold, clinch_recoil=clinch_recoil, guard_hit=guard_hit, guard_impact=guard_impact, guard_crouch=guard_crouch,
              guard_crouch_hit=guard_crouch_hit, hurt_heavy=hurt_heavy, down=down, wakeup=wakeup, ko=ko, throw_reach=throw_reach, throw_hit=throw_hit, thrown=thrown, land=land, dash_stop=dash_stop, dash_b=dash_b)
CLIPS_V2 = dict(PHASE1, **PHASE2)
def clips_for(cid): return M.clips_for(cid) + [c for c in CLIPS_V2 if not isinstance(CLIPS_V2[c], dict) or cid in CLIPS_V2[c]]
def make(cid, name):
    if name in CLIPS_V2:
        f = CLIPS_V2[name]; return (f[cid] if isinstance(f, dict) else f)(cid)
    return M.make(cid, name)
