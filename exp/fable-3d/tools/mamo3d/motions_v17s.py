"""マモ拳 v17 P3（Issue #212）: 9体×3必殺 s1_v17 / s2_v17 / s3_v17。
既存の v14 必殺（motions_v14.py / motions_v14b.py）を評価し、直す技だけここで作り直す。直さない技は同じ演技のまま v17 の名前で書き出す。
v14 との違い（全技共通）: 対戦用の時間詰め（当たり姿勢を 2F 早める _lead）は掛けない。v17 は接触時刻を発生フレームへ写す再生契約なので、
クリップは「接触の姿勢が contact_frame にちょうど来る」素の時間で持つ。性能（発生・持続・硬直）は現行 balance.js の値を参照として記録するだけで、変更しない。
各技には役割・重さ・キュー（音／エフェクト／揺れ。ヒット・ガード・空振りで出し分ける）を付ける。"""
from . import motions_v14 as A, motions_v14b as Bm
VERSION = 'v17-p3-specials-1'
SLOTS = ('s1', 's2', 's3'); IDS = ('moguzo', 'pisuke', 'godan', 'hakuma', 'chirka', 'takimaru', 'yomikage', 'bullet', 'dark_moguzo')
# 役割と重さ（P3_FIGHT_FEEL_DIRECTION.md 3章）。kind: strike / projectile / antiair / rush / grab / counter、weight: light / mid / heavy
ROLE = dict(
    moguzo=dict(s1=('projectile', 'mid', '中距離の牽制'), s2=('antiair', 'mid', '切り返し対空'), s3=('rush', 'mid', '前進圧力')),
    pisuke=dict(s1=('projectile', 'light', '軽い飛び道具'), s2=('antiair', 'light', '上方向への迎撃'), s3=('rush', 'light', '前進連撃')),
    godan=dict(s1=('strike', 'heavy', '遅い下段大技'), s2=('antiair', 'heavy', '装甲つき対空'), s3=('rush', 'heavy', '高リスク突進')),
    hakuma=dict(s1=('strike', 'mid', '近中距離の押し返し'), s2=('antiair', 'mid', '受ける対空'), s3=('rush', 'mid', 'ライン回復')),
    chirka=dict(s1=('strike', 'light', '可変タイミング'), s2=('antiair', 'light', '対空'), s3=('rush', 'mid', '裏をかく前進')),
    takimaru=dict(s1=('projectile', 'mid', '掴み接近の布石'), s2=('antiair', 'heavy', '迎撃／掴み距離'), s3=('grab', 'heavy', '近距離の拘束')),
    yomikage=dict(s1=('projectile', 'light', '距離を整える弾'), s2=('antiair', 'mid', '対空'), s3=('counter', 'mid', '読み勝つ当て身')),
    bullet=dict(s1=('projectile', 'mid', '長距離牽制'), s2=('antiair', 'mid', '長尾対空'), s3=('strike', 'heavy', '長距離決定打')),
    dark_moguzo=dict(s1=('projectile', 'light', '高速牽制'), s2=('antiair', 'mid', '連携後の切返し'), s3=('rush', 'light', '高速連携の起点')))
from .motions import neutral, merge, pel, add, hand, foot, keyed, W, K
from .motions_v14 import P, R_, minfo
# ---- 評価で作り直した 3 本（2026-11-23）。発生・持続・全長は現行のまま ----
def godan_s3(cid):
    """肩当て突進: 左肩を相手へ向けて沈み、体ごと斜め前へ預ける。腕は畳んで胸に付け、肩がいちばん前に出る。当たったあとも前のめりで止まる（被ガードの隙が見える）"""
    n0 = neutral(cid); st, ac, N = 18, 7, 57; B = K(n0, brow_angry=1.0)
    wind = merge(n0, pelvis=pel(n0, (0, -0.16, -0.20), (14, -46, 0)), chest=add(n0['chest'], (10, -20, 0)), neck=add(n0['neck'], (0, 30, 0)), head=add(n0['head'], (-6, 50, 0)),
                 handL=P((0.10, 0.20, -0.20), fwd=(-0.6, 0.6, 0.3), back=(0, 0, 1), elbow=(0.4, 0.6, -0.6)), handR=P((0.30, -0.10, -0.40), fwd=(0, 0.2, -1), back=(1, 0, 0), elbow=(0.8, -0.5, 0)), footL=foot(n0, 'footL', (0, 0.10, 0.10), pitch=-10), tail=(-14, -10), keys=B)
    hit = merge(n0, pelvis=pel(n0, (0, 1.10, -0.20), (6, -74, -30)), spine=add(n0['spine'], (0, -6, -8)), chest=add(n0['chest'], (0, -8, -10)), neck=add(n0['neck'], (0, 34, 10)), head=add(n0['head'], (-4, 60, 10)),
                handL=P((0.06, 0.16, -0.30), fwd=(-0.6, 0.6, 0.3), back=(0, 0, 1), elbow=(0.4, 0.6, -0.6)), handR=P((0.30, -0.10, -0.44), fwd=(0, 0.2, -1), back=(1, 0, 0), elbow=(0.8, -0.5, 0)), footL=foot(n0, 'footL', (0.02, 0.66, 0), yaw=-30), footR=foot(n0, 'footR', (0, 0.20, 0), pitch=44),
                tail=(18, 10), jaw=14.0, keys=B)
    stuck = merge(hit, pelvis=pel(n0, (0, 1.06, -0.26), (8, -70, -34)), jaw=6.0)
    rec = merge(n0, pelvis=pel(n0, (0, 0.50, -0.10), (8, -40, -10)), footL=foot(n0, 'footL', (0.02, 0.60, 0)), footR=foot(n0, 'footR', (0, 0.16, 0)), keys=B)
    keys = [(0, n0), (9, wind, 'out3'), (st, hit, 'in3'), (st + ac, hit, 'lin'), (st + ac + 12, stuck, 'out'), (46, rec, 'io'), (N, n0, 'io')]
    return dict(frames=N, loop=False, fn=keyed(keys), info=minfo(cid, 's3', '肩当て突進', st, ac, N, attack_limb='shoulderL', fx_anchor='shoulderL',
                silhouette='左肩を相手へ向けて深く沈む(F9)→体を斜め前へ預け、畳んだ左肩が体のいちばん前でぶつかる(F18)→前のめりのまま止まる(F37)',
                note='v14 は腕を振り上げた姿が目立ち、肩で当たって見えなかった。前進距離は現行どおりゲーム側'))
def chirka_s3(cid):
    """影引き爪: 半身で背を見せて後ろへ体重を引く（逃げる素振り）→一気に踏み込み、隠していた右の爪を腹の高さへ突き出す。上体は起こしたまま"""
    n0 = neutral(cid); st, ac, N = 13, 5, 40; B = K(n0, paw_open_R=1.0, paw_open_L=1.0)
    back = merge(n0, pelvis=pel(n0, (0, -0.30, -0.06), (-6, 74, 0)), chest=add(n0['chest'], (-4, 20, 0)), neck=add(n0['neck'], (0, -30, 0)), head=add(n0['head'], (0, -50, 8)),
                 handR=P((0.20, -0.30, -0.20), fwd=(0, -0.3, -0.9), back=(1, 0, 0), elbow=(0.6, -0.7, 0)), handL=P((0.30, 0.20, 0.10)), footR=foot(n0, 'footR', (0, -0.16, 0)), footL=foot(n0, 'footL', (0, -0.10, 0.06), pitch=-10), tail=(20, 30), keys=B)
    hit = merge(n0, pelvis=pel(n0, (0, 0.56, -0.20), (18, 34, 0)), spine=add(n0['spine'], (4, 8, 0)), chest=add(n0['chest'], (6, 18, 0)), neck=add(n0['neck'], (0, -22, 0)), head=add(n0['head'], (-10, -36, 0)),
                handR=W((-0.16, 0.99, -0.16), fwd=(0, 1, -0.1), back=(0, 0.1, 1), elbow=(0.9, -0.2, -0.2)), handL=P((0.40, -0.30, 0.0)), footL=foot(n0, 'footL', (0.02, 0.80, 0)), footR=foot(n0, 'footR', (0, 0.16, 0), pitch=36),
                tail=(34, -24), jaw=10.0, keys=K(n0, paw_open_R=1.0, brow_angry=0.8))
    rec = merge(n0, pelvis=pel(n0, (0, 0.36, -0.10), (10, 16, 0)), handR=hand(n0, 'handR', (0, 0.20, -0.06)), footL=foot(n0, 'footL', (0.02, 0.50, 0)), keys=B)
    keys = [(0, n0), (6, back, 'out'), (9, back, 'lin'), (st, hit, 'in3'), (st + ac, hit, 'lin'), (30, rec, 'out'), (N, n0, 'io')]
    return dict(frames=N, loop=False, fn=keyed(keys), info=minfo(cid, 's3', '影引き爪', st, ac, N, attack_limb='pawR', fx_anchor='pawR',
                silhouette='半身で背を見せ、体重を後ろへ引く(F6-9)→一気に踏み込み、体の陰に隠していた右の爪が腹の高さへ伸びる(F13)',
                note='v14 は地面に伏せて滑る形で、突っ伏して見えた。フェイント入力（←で中断・↓で遅らせる）の受付は現行どおりゲーム側'))
def dark_s1(cid):
    """黒い地走波: 低い姿勢のまま、腰の横から右の手首だけを一瞬で前へ払って放つ。暗転や大きな振りは使わない"""
    n0 = neutral(cid); st, ac, N = 11, 1, 31; B = K(n0, brow_angry=1.0)
    low = merge(n0, pelvis=pel(n0, (0, -0.06, -0.22), (14, 16, 0)), chest=add(n0['chest'], (6, 14, 0)), head=add(n0['head'], (-14, -20, 0)), handR=P((0.30, -0.10, -0.30), fwd=(0, 0.6, -0.8), back=(1, 0, 0), elbow=(0.7, -0.6, 0)),
                handL=P((0.20, 0.30, -0.20)), footL=foot(n0, 'footL', (0, 0.10, 0)), tail=(-10, 8), keys=B)
    flick = merge(low, pelvis=pel(n0, (0, 0.14, -0.22), (16, 30, 0)), chest=add(n0['chest'], (8, 22, 0)), head=add(n0['head'], (-16, -30, 0)),
                  handR=W((-0.16, 0.98, -0.34), fwd=(0, 0.95, 0.3), back=(0, -0.3, 0.95), elbow=(0.9, -0.2, -0.2)), tail=(6, -10), keys=K(n0, brow_angry=1.0, paw_open_R=1.0))
    after = merge(flick, handR=W((-0.12, 0.86, -0.16), fwd=(0, 0.8, 0.6), back=(0, -0.6, 0.8), elbow=(0.9, -0.2, -0.2)))
    keys = [(0, n0), (6, low, 'out'), (9, low, 'lin'), (st, flick, 'in3'), (st + 4, after, 'out'), (22, low, 'io'), (N, n0, 'io')]
    return dict(frames=N, loop=False, fn=keyed(keys), info=minfo(cid, 's1', '黒い地走波', st, ac, N, attack_limb='pawR', projectile_spawn_frame=st, fx_anchor='pawR',
                silhouette='前傾のまま深く沈み、右手を腰の横へ引く(F6-9)→手首だけが床すれすれを前へ払う(F11)。体は沈んだまま',
                note='v14 は立ち上がって腕を上げる姿が目立った。弾の発生フレーム・性能は現行のまま'))
OVERRIDE = {('godan', 's3'): godan_s3, ('chirka', 's3'): chirka_s3, ('dark_moguzo', 's1'): dark_s1}        # (cid, slot) -> 作り直した関数
def source(cid, slot):
    if (cid, slot) in OVERRIDE: return OVERRIDE[(cid, slot)], 'v17 revised'
    name = slot + '_v14'; f = Bm.POLISH.get(name, {}).get(cid) or A.SPECIALS[name][cid]; return f, 'v14 re-export'
ANCHOR = dict(pawL='pawL', pawR='pawR', footL='footL', footR='footR', tail='tail_03', chest='chest', elbowR='forearmR', shoulderL='shoulderL')
HITSTOP = dict(light=(4, 2), mid=(6, 3), heavy=(9, 5))          # (ヒット, ガード) の停止フレームの提案。採否と実値は戦闘側
def cues(info, kind, weight, N):
    """クリップ秒のキュー。2 種類に分ける:
      trigger='movement' … 動作の音とエフェクト（溜め・風切り・踏み切り・着地・弾を放つ瞬間）。時刻だけで必ず鳴らしてよい。空振りでも鳴る。
      trigger='contact'  … 打撃音・接触エフェクト・揺れ。**時刻では鳴らさない**。Battle が実際にヒット／ガードを出したときだけ、Battle 側のフィードバックが on（hit / guard）に合うものを使う。
    音の種類は combat-audio.js の既存キーだけを使う。at は contact キューでは「接触の姿勢の時刻」の参考値"""
    st = info.get('contact_frame', info.get('startup', 10)); f = lambda n: round(n / 60, 4); bone = ANCHOR.get(info.get('fx_anchor', 'pawR'), 'pawR'); C = []
    add = lambda at, typ, key, on='always', **kw: C.append(dict(at=f(at), type=typ, key=key, trigger='movement' if on == 'always' else 'contact', on=on, **kw))
    if weight == 'heavy': add(0, 'sfx', 'grunt')                                   # 重い技は溜めの声
    if kind == 'counter': add(0, 'sfx', 'chime')                                    # 当て身の構え
    air = info.get('visual_airborne_frames')
    if air: add(air[0], 'sfx', 'wind'); add(air[1], 'sfx', 'clinch'); add(air[1], 'vfx', 'roar', bone='root_ground') if weight != 'light' else None
    spawn = info.get('projectile_spawn_frame')
    if spawn is not None: add(spawn, 'sfx', 'special'); add(spawn, 'vfx', 'special', bone=bone)
    else:
        add(max(0, st - 3), 'sfx', 'wind', 'always')                                # 振りの風切り（空振りでもこれだけは鳴る）
        add(st, 'sfx', dict(light='hit', mid='hit', heavy='crash')[weight] if kind != 'grab' else 'clinch', 'hit'); add(st, 'vfx', 'hit' if kind != 'grab' else 'clinch', 'hit', bone=bone)
        if weight != 'light': add(st, 'shake', dict(mid=.008, heavy=.016)[weight], 'hit')
        add(st, 'sfx', 'block', 'guard'); add(st, 'vfx', 'block', 'guard', bone=bone)
        if kind == 'counter': add(st, 'sfx', 'counter', 'hit')
    return sorted([c for c in C if c], key=lambda c: c['at'])
def make(cid, slot):
    fn, origin = source(cid, slot); clip = fn(cid); kind, weight, role = ROLE[cid][slot]; I = clip['info']
    info = dict(I, v17=True, origin=origin, role=role, kind=kind, weight=weight, contact=round(I.get('contact_frame', I['startup']) / clip['frames'], 4),
                contact_end=round((I.get('contact_frame', I['startup']) + max(1, I.get('active', 1)) - 1) / clip['frames'], 4), cue_track=cues(I, kind, weight, clip['frames']),
                hitstop_suggest=dict(hit=HITSTOP[weight][0], guard=HITSTOP[weight][1]))
    for k in ('contact_pose_frame', 'ingame_lead_frames'): info.pop(k, None)
    return dict(clip, info=info)
def clip_name(slot): return slot + '_v17'
