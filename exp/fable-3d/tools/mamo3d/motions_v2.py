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
                footL=lg(0.60, 0.02), footR=lg(0.86, 0.04), tail=(-78 / (0.6 + 0.35 * (nt - 1)), 0), jaw=6.0 * limp, keys=K(n0, paw_open_L=1.0, paw_open_R=1.0, blink=limp, brow_angry=0.0))
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
                footL=dict(pos=(0.04, 0.36, 0.02), yaw=10, pitch=-10, knee=0.4), footR=dict(pos=(0.06, 0.50, 0.02), yaw=14, pitch=-10, knee=0.4), tail=(-30, 0), keys=K(n0, paw_open_L=1.0, paw_open_R=1.0, blink=0.3))
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

PHASE1 = dict(roar=roar, roar_hit=roar_hit, gyuiin=gyuiin, clinch_hold=clinch_hold, clinch_recoil=clinch_recoil, guard_hit=guard_hit, guard_impact=guard_impact, guard_crouch=guard_crouch,
              guard_crouch_hit=guard_crouch_hit, hurt_heavy=hurt_heavy, down=down, wakeup=wakeup, ko=ko, throw_reach=throw_reach, throw_hit=throw_hit, thrown=thrown, land=land, dash_stop=dash_stop, dash_b=dash_b)
CLIPS_V2 = dict(PHASE1)
def clips_for(cid): return M.clips_for(cid) + [c for c in CLIPS_V2 if not isinstance(CLIPS_V2[c], dict) or cid in CLIPS_V2[c]]
def make(cid, name):
    if name in CLIPS_V2:
        f = CLIPS_V2[name]; return (f[cid] if isinstance(f, dict) else f)(cid)
    return M.make(cid, name)
