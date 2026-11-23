"""マモ拳 v17 P3（Issue #212）: 9体×6通常技の全身モーション v17_<slot>。
PR #214 の P3_FIGHT_FEEL_DIRECTION.md の演技指示に沿って、元リグへ手付け（手続き的ポーズ）で作る。既存の motions*.py と 54 本の v15 クリップには手を入れない。
性能（発生・持続・硬直・リーチ）は決めない。クリップは「構え→予備→接触→打ち抜き→戻り」の姿勢と、接触の時刻（contact_frame）だけを持ち、
ゲーム側は接触時刻を発生フレームへ写して再生する（v15.1 と同じ契約）。数値は Codex が実測 reach から決める。
姿勢の単位は motions.py と同じ。手 W=(内外, 前, 上)[腕の長さ, 肩基準・世界軸] / P=胸基準 / R_=床基準、足 (外, 前, 上)[脚の長さ]。ヨーは負でカメラ側。"""
import math
from .motions import neutral, merge, pel, add, hand, foot, keyed, sample, W, K, STYLE
from .motions_v2 import CROUCH, AIR, off, hmove
from .motions_v14 import P, R_, spun

VERSION = 'v17-p3-normals-1'
SLOTS = ('stand_weak', 'stand_heavy', 'crouch_weak', 'crouch_heavy', 'air_weak', 'air_heavy')
# クリップ内の時刻割り（60fps のフレーム）: (予備の頂点, 接触, 接触の保持, 打ち抜き, 全長)
TW = (4, 9, 3, 18, 28); TH = (9, 17, 4, 30, 46)
def tb(cid, up, side=0.0):
    nb = len(STYLE[cid]['tail_bones']); return tuple((up / nb, side / nb) for _ in range(nb))
def PUNCH(x=-0.14, y=0.98, z=0.02, fwd=(0, 1.0, 0), back=(0.2, 0, 1.0), elbow=(0.9, -0.1, -0.4)): return W((x, y, z), fwd=fwd, back=back, elbow=elbow)
def PALM(x=-0.10, y=0.95, z=0.05): return W((x, y, z), fwd=(0, 0.25, 0.97), back=(0, -1.0, 0.1), elbow=(0.9, -0.2, -0.3))        # 掌を相手へ向ける（指は上）
def KICK(out, fwd, up, pitch=-30, knee=0.05, yaw=0): return dict(pos=(out, fwd, up), yaw=yaw, pitch=pitch, knee=knee, toe=0)
def mk(cid, slot, name, base, wind, hit, follow, limb, heavy=None, t=None, spin=None, end=None, tail_follow=0.0, **meta):
    """base→wind→hit(接触の姿勢を h フレーム保持)→follow→base。spin=[(frame, 度)] は体ごと回る技（尾・回し蹴り）"""
    heavy = slot.endswith('heavy') if heavy is None else heavy; a, c, h, f, N = t or (TH if heavy else TW)
    keys = [(0, base), (a, wind, 'out'), (c, hit, 'in3' if heavy else 'in'), (c + h, hit, 'lin'), (f, follow, 'out'), (N, end or base, 'io')]
    fn = spun(cid, keys, spin) if spin else keyed(keys)
    stance = slot.split('_')[0]
    return dict(frames=N, loop=False, fn=fn, tail_follow=tail_follow, info=dict(group='normal', priority=3, start_pose={'stand': 'idle', 'crouch': 'crouch', 'air': 'air'}[stance], end_pose={'stand': 'idle', 'crouch': 'crouch', 'air': 'air'}[stance],
                v2=True, v17=True, character=cid, game_action=slot, name_jp=name, attack_limb=limb, windup_frame=a, contact_frame=c, contact_hold_frames=h, follow_frame=f,
                contact=round(c / N, 4), contact_end=round((c + h) / N, 4), **meta))

# =====================================================================  モグゾー: 万能。中心軸、正面を見せる素直な拳
def moguzo(cid):
    n0, c0, a0 = neutral(cid), CROUCH(cid), AIR(cid); B = K(n0, brow_angry=0.8); out = {}
    # 立弱: 踏み込まない前手の直線ジャブ。戻りは短い
    wind = merge(n0, chest=add(n0['chest'], (0, 8, 0)), handL=hand(n0, 'handL', (0.04, -0.14, 0.02)))
    hit = merge(n0, pelvis=pel(n0, (0, 0.06, -0.02), (4, -12, 0)), chest=add(n0['chest'], (3, -16, -2)), head=add(n0['head'], (-3, 22, 0)), handL=PUNCH(z=0.04), handR=hand(n0, 'handR', (0.0, -0.08, 0.06)), tail=(8, 8), keys=B)
    fol = merge(n0, chest=add(n0['chest'], (1, -6, 0)), handL=hand(n0, 'handL', (0.0, 0.14, 0.02)), keys=B)
    out['stand_weak'] = mk(cid, 'stand_weak', '前手の直ジャブ', n0, wind, hit, fol, 'pawL', silhouette='足は動かさず前手だけが真っすぐ出る。すぐ構えへ戻る')
    # 立強: 後ろ足で床を押して一歩踏み込む右ストレート。振り切らずに止める
    wind = merge(n0, pelvis=pel(n0, (0, -0.12, -0.08), (4, -22, 0)), chest=add(n0['chest'], (2, -20, 0)), head=add(n0['head'], (0, 34, 0)), handR=P((0.10, -0.08, -0.04), fwd=(0, 1, 0.1), back=(0.6, 0, 0.8), elbow=(0.5, -0.8, -0.3)),
                 handL=hand(n0, 'handL', (0.05, 0.06, 0.06)), footL=foot(n0, 'footL', (0, 0.06, 0.10), pitch=-10), footR=foot(n0, 'footR', pitch=12), tail=(-10, -14), keys=K(n0, brow_angry=1.0))
    hit = merge(n0, pelvis=pel(n0, (0, 0.34, -0.16), (14, 46, 0)), spine=add(n0['spine'], (4, 12, 0)), chest=add(n0['chest'], (6, 26, 0)), neck=add(n0['neck'], (0, -28, 0)), head=add(n0['head'], (-8, -50, 0)),
                handR=PUNCH(x=-0.16, z=0.0, elbow=(0.9, -0.1, -0.3)), handL=P((0.06, -0.06, 0.0), fwd=(-0.1, 0.5, 0.85), back=(0.8, 0.5, 0), elbow=(0.5, -0.7, -0.5)),
                footL=foot(n0, 'footL', (0.02, 0.58, 0), yaw=6), footR=foot(n0, 'footR', (0, 0.12, 0), pitch=38, yaw=-10), tail=(12, 22), jaw=10.0, keys=K(n0, brow_angry=1.0))
    fol = merge(hit, pelvis=pel(n0, (0, 0.26, -0.12), (10, 30, 0)), chest=add(n0['chest'], (5, 14, 0)), head=add(n0['head'], (-6, -32, 0)), handR=PUNCH(x=-0.10, y=0.62, z=-0.06), tail=(4, 10), jaw=4.0)
    out['stand_heavy'] = mk(cid, 'stand_heavy', '踏み込みストレート', n0, wind, hit, fol, 'pawR', silhouette='右肩を引いて沈む→後ろ足で押して大きく一歩、右拳が肩の高さで伸び切る→拳は止まり、腕は振り切らない')
    # 屈弱: 腰を落としたまま前手のすくい打ち。頭は下げたまま
    wind = merge(c0, handL=R_((0.10, 0.50, 0.10), fwd=(0, 0.9, -0.2), back=(0, 0.2, 1), elbow=(0.9, -0.3, 0.3)), chest=add(c0['chest'], (0, 6, 0)))
    hit = merge(c0, pelvis=off(c0, (0, 0.08, 0.0), (0, -10, 0)), chest=add(c0['chest'], (-2, -12, 0)), handL=W((-0.10, 0.94, -0.30), fwd=(0, 0.85, 0.5), back=(0, -0.5, 0.85), elbow=(0.9, -0.3, -0.2)),
                handR=hmove(c0, 'handR', (0.02, -0.06, 0.04)), tail=(8, 8), keys=K(c0, brow_angry=0.7))
    fol = merge(c0, handL=W((-0.06, 0.70, -0.10), fwd=(0, 0.7, 0.7), back=(0, -0.7, 0.7), elbow=(0.9, -0.3, -0.2)), keys=K(c0, brow_angry=0.7))
    out['crouch_weak'] = mk(cid, 'crouch_weak', 'しゃがみすくい打ち', c0, wind, hit, fol, 'pawL', silhouette='腰を落としたまま、床についた前手が低い位置から相手のすねへすくい上がる')
    # 屈強: 低い位置から横に払う右拳。頭を前へ突き出さない
    wind = merge(c0, pelvis=off(c0, (0, -0.04, 0.02), (0, -26, 0)), chest=add(c0['chest'], (0, -22, 0)), head=add(c0['head'], (0, 30, 0)), handR=P((0.55, -0.20, -0.20), fwd=(0.6, 0.6, 0), back=(0, 0, 1), elbow=(0.6, -0.7, 0.2)), tail=(-8, -16), keys=K(c0, brow_angry=1.0))
    hit = merge(c0, pelvis=off(c0, (0, 0.12, 0.02), (-4, 34, 0)), chest=add(c0['chest'], (-6, 26, 0)), head=add(c0['head'], (4, -34, 0)), handR=W((-0.30, 0.92, -0.42), fwd=(-0.5, 0.85, 0), back=(0, 0, 1), elbow=(0.7, -0.5, 0.3)),
                handL=R_((0.16, 0.50, 0.12), fwd=(0, 0.9, -0.2), back=(0, 0.2, 1), elbow=(0.9, -0.3, 0.3)), footL=foot(c0, 'footL', (0, 0.10, 0)), tail=(14, 24), jaw=8.0, keys=K(c0, brow_angry=1.0))
    fol = merge(hit, pelvis=off(c0, (0, 0.08, 0.02), (-2, 48, 0)), handR=W((-0.62, 0.60, -0.40), fwd=(-0.9, 0.3, 0), back=(0, 0, 1), elbow=(0.5, -0.7, 0.3)), jaw=3.0)
    out['crouch_heavy'] = mk(cid, 'crouch_heavy', 'しゃがみ横払い', c0, wind, hit, fol, 'pawR', silhouette='右拳を体の外へ引く→腰を回して地面すれすれを横に払う→拳は体の内側へ抜ける。頭は上がらない')
    # 空弱: 斜め下へ短く拳を差す。正面が見える
    wind = merge(a0, handL=hmove(a0, 'handL', (0.04, -0.14, 0.10)), chest=add(a0['chest'], (-4, 6, 0)))
    hit = merge(a0, pelvis=off(a0, (0, 0, 0), (10, -10, 0)), chest=add(a0['chest'], (6, -12, 0)), handL=W((-0.14, 0.88, -0.44), fwd=(0, 0.8, -0.6), back=(0.2, 0.5, 0.8), elbow=(0.9, -0.2, 0.0)), tail=(26, 0), keys=K(a0, brow_angry=0.7))
    fol = merge(a0, handL=hmove(a0, 'handL', (0.0, 0.10, -0.10)), keys=K(a0, brow_angry=0.7))
    out['air_weak'] = mk(cid, 'air_weak', '空中の差し拳', a0, wind, hit, fol, 'pawL', silhouette='空中姿勢のまま前手を斜め下へ短く差す')
    # 空強: 脚を畳んでから大きなかかと落とし
    wind = merge(a0, pelvis=off(a0, (0, -0.04, 0.04), (-14, 0, 0)), chest=add(a0['chest'], (-8, 0, 0)), footR=KICK(0.02, 0.50, 0.95, pitch=30, knee=0.9), footL=foot(a0, 'footL', (0, -0.10, -0.10)),
                 handL=hmove(a0, 'handL', (0.10, -0.10, 0.20)), handR=hmove(a0, 'handR', (0.14, -0.14, 0.24)), tail=(-12, 0), keys=K(a0, brow_angry=1.0))
    hit = merge(a0, pelvis=off(a0, (0, 0.06, 0.0), (-10, 12, 0)), chest=add(a0['chest'], (8, 0, 0)), head=add(a0['head'], (6, 0, 0)), footR=KICK(-0.02, 1.08, 0.04, pitch=-24, knee=0.0), footL=foot(a0, 'footL', (0, -0.20, 0.10), pitch=30),
                handL=hmove(a0, 'handL', (0.20, -0.10, 0.0)), handR=hmove(a0, 'handR', (0.30, -0.24, 0.06)), tail=(30, 0), jaw=10.0, keys=K(a0, brow_angry=1.0))
    fol = merge(hit, footR=KICK(0.0, 0.80, -0.20, pitch=-10, knee=0.2), jaw=3.0)
    out['air_heavy'] = mk(cid, 'air_heavy', 'かかと落とし', a0, wind, hit, fol, 'footR', silhouette='右ひざを胸まで畳む→かかとを前下へ大きく落とす。脚が体のいちばん前に出る')
    return out

# =====================================================================  ピスケ: 最速。つま先で軽く、蹴りは背面まで回す
def pisuke(cid):
    n0, c0, a0 = neutral(cid), CROUCH(cid), AIR(cid); B = K(n0, brow_angry=0.7); out = {}
    # 立弱: 軽い前手の2段拍子（1拍目は見せ、判定は2拍目の1回）
    wind = merge(n0, pelvis=pel(n0, (0, 0.02, 0.04), (0, -6, 0)), handL=PUNCH(y=0.58, z=0.10), footL=foot(n0, 'footL', (0, 0.04, 0.06), pitch=-12), tail=(14, 0), keys=B)
    hit = merge(n0, pelvis=pel(n0, (0, 0.10, -0.02), (5, -16, 0)), chest=add(n0['chest'], (3, -18, 0)), head=add(n0['head'], (-3, 24, 0)), handL=PUNCH(z=0.06), handR=hand(n0, 'handR', (0.02, -0.10, 0.08)), footL=foot(n0, 'footL', (0, 0.10, 0)), tail=(10, 10), keys=B)
    fol = merge(n0, pelvis=pel(n0, (0, 0.04, 0.03), (0, -4, 0)), handL=hand(n0, 'handL', (0, 0.12, 0.04)), footL=foot(n0, 'footL', (0, 0.04, 0.04), pitch=-8), keys=B)
    out['stand_weak'] = mk(cid, 'stand_weak', '二拍子の前手', n0, wind, hit, fol, 'pawL', silhouette='つま先で弾みながら前手を半分出す（見せ）→同じ手がそのまま伸び切る。判定は1回')
    # 立強: 大きな後ろ足の回し蹴り。背中が見えるまで腰を回す
    wind = merge(n0, pelvis=pel(n0, (0, -0.06, -0.10), (6, -34, 0)), chest=add(n0['chest'], (4, -24, 0)), head=add(n0['head'], (0, 44, 0)), footR=foot(n0, 'footR', (0.06, -0.06, 0.16), pitch=30, knee=0.5),
                 handL=P((0.30, 0.20, 0.10)), handR=P((0.34, -0.20, -0.05)), tail=(-14, -20), keys=K(n0, brow_angry=1.0))
    hit = merge(n0, pelvis=pel(n0, (0.04, 0.20, 0.06), (-16, 96, 8)), spine=add(n0['spine'], (-6, 14, 0)), chest=add(n0['chest'], (-14, 24, 6)), neck=add(n0['neck'], (0, -40, 0)), head=add(n0['head'], (2, -70, 0)),
                footR=KICK(-0.34, 1.34, 0.92, pitch=-34, knee=0.0, yaw=-70), footL=foot(n0, 'footL', (0.02, 0.10, 0), yaw=-70, pitch=8), handL=P((0.46, -0.10, 0.06)), handR=P((0.50, -0.30, -0.10)), tail=(20, 30), jaw=10.0, keys=K(n0, brow_angry=1.0))
    fol = merge(hit, pelvis=pel(n0, (0.02, 0.14, 0.02), (-8, 130, 4)), footR=KICK(-0.60, 0.70, 0.50, pitch=-10, knee=0.4, yaw=-100), head=add(n0['head'], (0, -90, 0)), jaw=3.0)
    out['stand_heavy'] = mk(cid, 'stand_heavy', '背面回し蹴り', n0, wind, hit, fol, 'footR', silhouette='後ろ足を引いて沈む→腰を大きく回し、背中をカメラへ見せながら後ろ足が胸の高さを横切る→足は相手の向こうへ抜ける')
    # 屈弱: 片手を地面近くへ差して素早く払う
    wind = merge(c0, handR=hmove(c0, 'handR', (0.20, -0.10, -0.10)), chest=add(c0['chest'], (0, -8, 0)))
    hit = merge(c0, pelvis=off(c0, (0, 0.08, 0), (2, 12, 0)), chest=add(c0['chest'], (2, 12, 0)), handR=W((-0.20, 0.94, -0.58), fwd=(-0.4, 0.9, 0), back=(0, 0, 1), elbow=(0.8, -0.4, 0.3)), tail=(8, 10), keys=K(c0, brow_angry=0.7))
    fol = merge(c0, handR=W((-0.46, 0.66, -0.52), fwd=(-0.8, 0.5, 0), back=(0, 0, 1), elbow=(0.7, -0.5, 0.3)), keys=K(c0, brow_angry=0.7))
    out['crouch_weak'] = mk(cid, 'crouch_weak', '地すれの手払い', c0, wind, hit, fol, 'pawR', silhouette='しゃがんだまま右手を床すれすれへ差し、内側へ素早く払う')
    # 屈強: 低姿勢から後ろ足の長い掃き蹴り
    wind = merge(c0, pelvis=off(c0, (0, -0.04, 0.02), (0, -18, 0)), chest=add(c0['chest'], (0, -12, 0)), footR=foot(c0, 'footR', (0.06, -0.12, 0.06)), tail=(-8, -18), keys=K(c0, brow_angry=0.9))
    hit = merge(c0, pelvis=off(c0, (-0.04, 0.12, 0.03), (-8, 50, -8)), spine=add(c0['spine'], (0, 8, 0)), chest=add(c0['chest'], (-6, 16, -4)), head=add(c0['head'], (0, -44, 0)), handR=hmove(c0, 'handR', (0.28, -0.22, -0.10)),
                footL=foot(c0, 'footL', (0, -0.04, 0), yaw=-30), footR=KICK(-0.34, 1.36, 0.08, pitch=-18, yaw=-40), tail=(14, 28), jaw=8.0, keys=K(c0, brow_angry=0.9))
    fol = merge(c0, pelvis=off(c0, (0, 0.04, 0.02), (0, 22, 0)), footR=KICK(-0.12, 0.56, 0.10, pitch=10, knee=0.2, yaw=-20))
    out['crouch_heavy'] = mk(cid, 'crouch_heavy', '長い掃き蹴り', c0, wind, hit, fol, 'footR', silhouette='左手を床についたまま腰を回し、後ろ足が床すれすれを長く掃く→すぐ畳んで戻る')
    # 空弱: 前足を引き付けて斜め下へ拳
    wind = merge(a0, footL=foot(a0, 'footL', (0, 0.10, 0.22), knee=0.9), handL=hmove(a0, 'handL', (0.04, -0.14, 0.12)))
    hit = merge(a0, pelvis=off(a0, (0, 0, 0), (12, -12, 0)), chest=add(a0['chest'], (8, -14, 0)), footL=foot(a0, 'footL', (0, 0.14, 0.30), knee=0.95), handL=W((-0.14, 0.86, -0.48), fwd=(0, 0.75, -0.65), back=(0.2, 0.5, 0.8), elbow=(0.9, -0.2, 0)), tail=(28, 0), keys=K(a0, brow_angry=0.7))
    fol = merge(a0, handL=hmove(a0, 'handL', (0, 0.10, -0.10)), keys=K(a0, brow_angry=0.7))
    out['air_weak'] = mk(cid, 'air_weak', '膝を畳んだ差し拳', a0, wind, hit, fol, 'pawL', silhouette='前足のひざを胸へ引き付け、その下から前手を斜め下へ差す')
    # 空強: 後ろ足の鋭いかかと落とし。蹴り足を頂点で一度止める
    wind = merge(a0, pelvis=off(a0, (0, -0.04, 0.04), (-18, 20, 0)), chest=add(a0['chest'], (-10, 0, 0)), footR=KICK(0.04, 0.70, 1.20, pitch=40, knee=0.25), footL=foot(a0, 'footL', (0, -0.14, -0.06)),
                 handL=hmove(a0, 'handL', (0.14, -0.10, 0.16)), handR=hmove(a0, 'handR', (0.20, -0.20, 0.10)), tail=(-14, 0), keys=K(a0, brow_angry=1.0))
    hit = merge(a0, pelvis=off(a0, (0, 0.08, 0), (-8, 30, 0)), chest=add(a0['chest'], (10, 6, 0)), head=add(a0['head'], (6, -26, 0)), footR=KICK(-0.08, 1.24, 0.02, pitch=-30, knee=0.0), footL=foot(a0, 'footL', (0, -0.24, 0.12), pitch=34),
                handL=hmove(a0, 'handL', (0.22, -0.12, 0.02)), handR=hmove(a0, 'handR', (0.34, -0.26, 0.06)), tail=(32, -10), jaw=10.0, keys=K(a0, brow_angry=1.0))
    fol = merge(hit, footR=KICK(-0.04, 0.90, -0.24, pitch=-10, knee=0.2), jaw=3.0)
    out['air_heavy'] = mk(cid, 'air_heavy', '止めて落とすかかと', a0, wind, hit, fol, 'footR', t=(11, 17, 4, 30, 46), silhouette='後ろ足を頭の高さまで振り上げて一拍止める→かかとを前下へ鋭く落とす')
    return out

# =====================================================================  ゴダン: 重量。沈んだ腰、腕は太く、短い技でも体ごと
def godan(cid):
    n0, c0, a0 = neutral(cid), CROUCH(cid), AIR(cid); B = K(n0, brow_angry=1.0); out = {}
    # 立弱: 腕を体の前へ出す短い牽制（前腕で押す）
    wind = merge(n0, pelvis=pel(n0, (0, -0.04, -0.03), (2, 6, 0)), handL=hand(n0, 'handL', (0.04, -0.10, 0.06)), keys=B)
    hit = merge(n0, pelvis=pel(n0, (0, 0.10, -0.06), (8, -8, 0)), chest=add(n0['chest'], (6, -10, 0)), head=add(n0['head'], (-4, 12, 0)), handL=W((-0.20, 0.86, 0.02), fwd=(-0.5, 0.85, 0.1), back=(0, 0, 1), elbow=(0.9, -0.3, 0.1)),
                handR=hand(n0, 'handR', (0, -0.06, 0.06)), footL=foot(n0, 'footL', (0, 0.10, 0)), tail=(6, 6), keys=B)
    fol = merge(n0, pelvis=pel(n0, (0, 0.06, -0.04), (5, -4, 0)), handL=hand(n0, 'handL', (0, 0.10, 0.02)), keys=B)
    out['stand_weak'] = mk(cid, 'stand_weak', '前腕の押し', n0, wind, hit, fol, 'pawL', t=(5, 11, 4, 21, 32), silhouette='拳ではなく前腕を横にして体の前へ押し出す。短いが肩ごと動く')
    # 立強: 腰を回して大きく踏み込む重い右拳（上から打ち下ろす）
    wind = merge(n0, pelvis=pel(n0, (0, -0.16, -0.10), (-4, -30, 0)), chest=add(n0['chest'], (-8, -26, 0)), head=add(n0['head'], (0, 40, 0)), handR=P((0.36, -0.36, 0.62), fwd=(0, 0.3, 0.95), back=(0.5, -0.8, 0), elbow=(0.9, -0.2, 0.3)),
                 handL=hand(n0, 'handL', (0.06, 0.10, 0.06)), footL=foot(n0, 'footL', (0, 0.10, 0.14), pitch=-12), tail=(-12, -16), keys=B)
    hit = merge(n0, pelvis=pel(n0, (0, 0.40, -0.20), (10, 44, 0)), spine=add(n0['spine'], (3, 12, 0)), chest=add(n0['chest'], (5, 26, 0)), neck=add(n0['neck'], (-4, -28, 0)), head=add(n0['head'], (-8, -46, 0)),
                handR=W((-0.20, 0.96, -0.18), fwd=(0, 0.95, -0.3), back=(0.2, 0.3, 0.95), elbow=(0.9, -0.1, 0.2)), handL=P((0.10, -0.10, -0.06)), footL=foot(n0, 'footL', (0.02, 0.62, 0), yaw=6), footR=foot(n0, 'footR', (0, 0.10, 0), pitch=40, yaw=-10),
                tail=(14, 22), jaw=14.0, keys=B)
    fol = merge(hit, pelvis=pel(n0, (0, 0.36, -0.24), (14, 40, 0)), handR=W((-0.20, 0.80, -0.40), fwd=(0, 0.8, -0.6), back=(0.2, 0.6, 0.8), elbow=(0.9, -0.1, 0.2)), jaw=6.0)
    out['stand_heavy'] = mk(cid, 'stand_heavy', '踏み込み重拳', n0, wind, hit, fol, 'pawR', t=(11, 21, 5, 36, 54), silhouette='右拳を頭の後ろまで振りかぶる→腰を回して深く一歩、拳が肩の高さから相手の胸へ落ちる→体重が前足に乗ったまま止まる')
    # 屈弱: ひざを深く曲げた低い押し払い（前腕）
    wind = merge(c0, handR=hmove(c0, 'handR', (0.10, -0.12, -0.06)), chest=add(c0['chest'], (0, -8, 0)))
    hit = merge(c0, pelvis=off(c0, (0, 0.10, -0.02), (2, 10, 0)), chest=add(c0['chest'], (2, 10, 0)), handR=W((-0.24, 0.88, -0.40), fwd=(-0.6, 0.8, 0), back=(0, 0, 1), elbow=(0.9, -0.3, 0.3)), tail=(6, 8), keys=K(c0, brow_angry=1.0))
    fol = merge(c0, handR=W((-0.44, 0.66, -0.38), fwd=(-0.8, 0.5, 0), back=(0, 0, 1), elbow=(0.8, -0.4, 0.3)), keys=K(c0, brow_angry=1.0))
    out['crouch_weak'] = mk(cid, 'crouch_weak', '低い押し払い', c0, wind, hit, fol, 'pawR', t=(5, 11, 4, 21, 32), silhouette='深く沈んだまま、太い前腕を横にして相手のすねを押し払う')
    # 屈強: しゃがみから肩と前腕ごと押し上げる
    wind = merge(c0, pelvis=off(c0, (0, -0.10, -0.04), (8, 0, 0)), chest=add(c0['chest'], (8, 0, 0)), handL=R_((0.20, 0.36, 0.14)), handR=hmove(c0, 'handR', (0.06, -0.10, -0.08)), tail=(-10, 0), keys=K(c0, brow_angry=1.0))
    hit = merge(c0, pelvis=off(c0, (0, 0.30, 0.10), (-6, 30, 0)), chest=add(c0['chest'], (-10, 22, 0)), head=add(c0['head'], (6, -30, 0)), handR=W((-0.26, 0.90, -0.06), fwd=(-0.6, 0.6, 0.5), back=(0, -0.5, 0.85), elbow=(0.9, -0.3, 0.2)),
                handL=W((0.10, 0.60, -0.20), fwd=(-0.3, 0.9, 0.2), back=(0, 0, 1), elbow=(0.9, -0.3, 0.2)), footL=foot(c0, 'footL', (0, 0.26, 0)), tail=(12, 16), jaw=12.0, keys=K(c0, brow_angry=1.0))
    fol = merge(hit, pelvis=off(c0, (0, 0.24, 0.06), (-2, 26, 0)), handR=W((-0.26, 0.74, 0.10), fwd=(-0.6, 0.5, 0.6), back=(0, -0.5, 0.85), elbow=(0.9, -0.3, 0.2)), jaw=5.0)
    out['crouch_heavy'] = mk(cid, 'crouch_heavy', '肩ごとの押し上げ', c0, wind, hit, fol, 'pawR', t=(11, 21, 5, 36, 54), silhouette='さらに沈んで溜める→前足を出しながら肩と前腕で下から押し上げる→腕を上げたまま止まる（隙）')
    # 空弱: 短い肘打ち
    wind = merge(a0, handR=P((0.40, -0.10, 0.30), fwd=(0, 0.3, 0.95), back=(0.8, 0, 0.5), elbow=(0.9, -0.3, 0.3)), chest=add(a0['chest'], (-4, -10, 0)))
    hit = merge(a0, pelvis=off(a0, (0, 0.04, 0), (-4, 20, 0)), chest=add(a0['chest'], (-8, 22, 0)), head=add(a0['head'], (6, -20, 0)), handR=P((0.02, 0.52, 0.02), fwd=(-0.9, 0.2, 0.3), back=(0, 1, 0), elbow=(0.2, 0.9, -0.3)), handL=hmove(a0, 'handL', (0.10, -0.16, 0.02)), tail=(22, 0), keys=K(a0, brow_angry=1.0))
    fol = merge(a0, handR=hmove(a0, 'handR', (0, 0.04, -0.04)), keys=K(a0, brow_angry=1.0))
    out['air_weak'] = mk(cid, 'air_weak', '空中の肘', a0, wind, hit, fol, 'elbowR', t=(5, 11, 4, 21, 32), silhouette='右ひじを畳んだまま体の前へ打ち下ろす。腕は伸ばさない')
    # 空強: 全身を落とす体重攻撃（腹から）
    wind = merge(a0, pelvis=off(a0, (0, -0.04, 0.06), (-20, 0, 0)), chest=add(a0['chest'], (-12, 0, 0)), handL=P((0.70, 0.0, 0.50)), handR=P((0.70, 0.0, 0.50)), footL=foot(a0, 'footL', (0.10, -0.10, 0.10)), footR=foot(a0, 'footR', (0.10, -0.16, 0.10)), tail=(-16, 0), keys=K(a0, brow_angry=1.0))
    hit = merge(a0, pelvis=off(a0, (0, 0.10, -0.06), (46, 0, 0)), spine=add(a0['spine'], (10, 0, 0)), chest=add(a0['chest'], (12, 0, 0)), neck=add(a0['neck'], (-20, 0, 0)), head=add(a0['head'], (-30, 0, 0)),
                handL=P((0.80, 0.20, -0.10), fwd=(0.3, 0.9, 0), back=(0, 0, 1), elbow=(0.8, -0.5, 0.2)), handR=P((0.80, 0.20, -0.10), fwd=(0.3, 0.9, 0), back=(0, 0, 1), elbow=(0.8, -0.5, 0.2)),
                footL=foot(a0, 'footL', (0.16, -0.40, 0.30), pitch=50), footR=foot(a0, 'footR', (0.16, -0.46, 0.30), pitch=50), tail=(34, 0), jaw=16.0, keys=K(a0, brow_angry=1.0))
    fol = merge(hit, pelvis=off(a0, (0, 0.10, -0.12), (52, 0, 0)), jaw=8.0)
    out['air_heavy'] = mk(cid, 'air_heavy', '全身の落とし', a0, wind, hit, fol, 'body', t=(11, 21, 6, 36, 54), silhouette='両腕を広げて反る→腹を下にして全身を落とす。横へは伸びず、真下へ重い')
    return out

# =====================================================================  ハクマ: 守勢。軸を立てたまま掌の面で押す
def hakuma(cid):
    n0, c0, a0 = neutral(cid), CROUCH(cid), AIR(cid); B = K(n0, paw_open_L=1.0, paw_open_R=1.0, brow_angry=0.5); out = {}
    wind = merge(n0, handL=hand(n0, 'handL', (0.04, -0.10, 0.06)), keys=B)
    hit = merge(n0, pelvis=pel(n0, (0, 0.06, -0.03), (2, -8, 0)), chest=add(n0['chest'], (0, -10, 0)), head=add(n0['head'], (0, 14, 0)), handL=PALM(z=0.06), handR=hand(n0, 'handR', (0, -0.04, 0.10)), tail=(6, 6), keys=B)
    fol = merge(n0, handL=hand(n0, 'handL', (0, 0.12, 0.04)), keys=B)
    out['stand_weak'] = mk(cid, 'stand_weak', '短い張り手', n0, wind, hit, fol, 'pawL', silhouette='予備をほとんど見せず、開いた掌の面が真っすぐ出る。体の軸は立ったまま')
    wind = merge(n0, pelvis=pel(n0, (0, -0.10, -0.12), (6, 0, 0)), chest=add(n0['chest'], (4, 0, 0)), handL=P((0.26, 0.10, -0.06)), handR=P((0.26, 0.10, -0.06)), tail=(-10, 0), keys=B)
    hit = merge(n0, pelvis=pel(n0, (0, 0.30, -0.14), (10, 0, 0)), spine=add(n0['spine'], (4, 0, 0)), chest=add(n0['chest'], (4, 0, 0)), head=add(n0['head'], (-8, 0, 0)), handL=PALM(x=0.04, z=0.02), handR=PALM(x=0.04, z=0.02),
                footL=foot(n0, 'footL', (0.04, 0.46, 0)), footR=foot(n0, 'footR', (0.04, 0.04, 0), pitch=20), tail=(10, 0), jaw=10.0, keys=B)
    fol = merge(hit, pelvis=pel(n0, (0, 0.26, -0.10), (6, 0, 0)), handL=PALM(x=0.04, y=0.74, z=0.0), handR=PALM(x=0.04, y=0.74, z=0.0), jaw=4.0)
    out['stand_heavy'] = mk(cid, 'stand_heavy', '踏み込み両掌突き', n0, wind, hit, fol, 'pawL+pawR', silhouette='両掌を胸の前に引いて沈む→前足を踏み込み、両掌を揃えて突き出す。後ろ足は床に残して踏ん張る')
    wind = merge(c0, handR=hmove(c0, 'handR', (0.14, -0.08, -0.04)), keys=K(c0, paw_open_R=1.0))
    hit = merge(c0, pelvis=off(c0, (0, 0.06, 0), (0, 8, 0)), handR=W((-0.20, 0.90, -0.46), fwd=(-0.5, 0.85, 0), back=(0, -0.2, 1), elbow=(0.9, -0.3, 0.2)), tail=(6, 6), keys=K(c0, paw_open_R=1.0, brow_angry=0.5))
    fol = merge(c0, handR=hmove(c0, 'handR', (0.0, 0.06, 0.0)), keys=K(c0, paw_open_R=1.0))
    out['crouch_weak'] = mk(cid, 'crouch_weak', '守りの払い', c0, wind, hit, fol, 'pawR', silhouette='しゃがみの構えを崩さず、右の掌だけが低く払う。すぐ胸の前へ戻る')
    wind = merge(c0, pelvis=off(c0, (0, -0.06, 0), (0, -20, 0)), chest=add(c0['chest'], (0, -16, 0)), handR=P((0.36, -0.10, 0.10), fwd=(0, 0.3, 0.95), back=(0.8, 0, 0.5), elbow=(0.9, -0.3, 0.3)), tail=(-8, -12), keys=K(c0, brow_angry=0.8))
    hit = merge(c0, pelvis=off(c0, (0, 0.22, 0.0), (4, 26, 0)), chest=add(c0['chest'], (2, 22, 0)), head=add(c0['head'], (0, -26, 0)), handR=P((0.02, 0.42, -0.16), fwd=(-0.9, 0.2, 0.2), back=(0, 1, 0), elbow=(0.2, 0.95, -0.3)),
                footL=foot(c0, 'footL', (0, 0.20, 0)), tail=(10, 14), jaw=6.0, keys=K(c0, brow_angry=0.8))
    fol = merge(hit, pelvis=off(c0, (0, 0.16, 0.0), (2, 16, 0)), jaw=2.0)
    out['crouch_heavy'] = mk(cid, 'crouch_heavy', '足元への肘', c0, wind, hit, fol, 'elbowR', silhouette='右ひじを外へ引く→前足を寄せ、畳んだひじを相手の足元へ突き出す。首と胴の軸は真っすぐ')
    wind = merge(a0, handL=hmove(a0, 'handL', (0.04, -0.12, 0.06)), keys=K(a0, paw_open_L=1.0))
    hit = merge(a0, pelvis=off(a0, (0, 0, 0), (6, -8, 0)), handL=W((-0.10, 0.92, -0.24), fwd=(0, 0.5, 0.85), back=(0, -0.85, 0.5), elbow=(0.9, -0.2, -0.2)), tail=(20, 0), keys=K(a0, paw_open_L=1.0, brow_angry=0.5))
    fol = merge(a0, handL=hmove(a0, 'handL', (0, 0.08, -0.04)), keys=K(a0, paw_open_L=1.0))
    out['air_weak'] = mk(cid, 'air_weak', '空中の前掌', a0, wind, hit, fol, 'pawL', silhouette='落下の姿勢を保ったまま、前の掌を斜め下へ出す')
    up = dict(pos=(0.10, 0.10, 0.90), fwd=(0, 0.2, 1.0), back=(0.3, -0.9, 0.1), elbow=(0.9, 0.1, 0.1))
    wind = merge(a0, pelvis=off(a0, (0, 0, 0.02), (-12, 0, 0)), chest=add(a0['chest'], (-10, 0, 0)), handL=up, handR=up, tail=(-10, 0), keys=K(a0, paw_open_L=1.0, paw_open_R=1.0, brow_angry=0.8))
    dn = lambda: W((-0.04, 0.84, -0.50), fwd=(0, 0.6, 0.8), back=(0, -0.8, 0.6), elbow=(0.9, -0.3, 0.1))
    hit = merge(a0, pelvis=off(a0, (0, 0.04, 0), (22, 0, 0)), chest=add(a0['chest'], (10, 0, 0)), head=add(a0['head'], (-14, 0, 0)), handL=dn(), handR=dn(), tail=(28, 0), jaw=8.0, keys=K(a0, paw_open_L=1.0, paw_open_R=1.0, brow_angry=0.8))
    fol = merge(hit, pelvis=off(a0, (0, 0.04, -0.04), (26, 0, 0)), jaw=3.0)
    out['air_heavy'] = mk(cid, 'air_heavy', '合わせ降り掌', a0, wind, hit, fol, 'pawL+pawR', silhouette='両掌を頭上で合わせる→揃えたまま前下へ降ろす。着地でしっかり止まる')
    return out

# =====================================================================  チルカ: 幻惑。見せる手と打つ手をずらす（偽の動きと本当の打点は別の手）
def chirka(cid):
    n0, c0, a0 = neutral(cid), CROUCH(cid), AIR(cid); B = K(n0, paw_open_L=1.0, paw_open_R=1.0); out = {}
    wind = merge(n0, handR=P((0.30, 0.30, 0.50), fwd=(0, 0.3, 0.95), back=(0, 1, 0), elbow=(0.9, -0.3, 0)), head=add(n0['head'], (-6, -10, 8)), tail=(20, 10), keys=B)
    hit = merge(n0, pelvis=pel(n0, (0, 0.08, -0.04), (6, -14, 0)), chest=add(n0['chest'], (4, -14, 0)), head=add(n0['head'], (0, 10, -8)), handR=P((0.34, 0.24, 0.56), fwd=(0, 0.3, 0.95), back=(0, 1, 0), elbow=(0.9, -0.3, 0)),
                handL=W((-0.12, 0.96, -0.12), fwd=(0, 1, -0.1), back=(0, 0.1, 1), elbow=(0.9, -0.2, -0.3)), tail=(24, -8), keys=B)
    fol = merge(n0, handL=hand(n0, 'handL', (0, 0.10, 0)), handR=P((0.26, 0.26, 0.30)), keys=B)
    out['stand_weak'] = mk(cid, 'stand_weak', 'ずらし爪', n0, wind, hit, fol, 'pawL', silhouette='右手を顔の横へ高く見せる（見せ）→その下から左の爪が腹の高さへ出る（打点）。打つのは見せていない方の手')
    wind = merge(n0, pelvis=pel(n0, (0, -0.06, -0.06), (4, 56, 0)), chest=add(n0['chest'], (0, 30, 0)), head=add(n0['head'], (0, 30, 0)), handR=P((0.50, -0.30, 0.30), fwd=(0.5, 0.3, 0.8), back=(0, 1, 0), elbow=(0.8, -0.5, 0)), handL=P((0.20, 0.30, 0.0)), tail=(10, 30), keys=B)
    hit = merge(n0, pelvis=pel(n0, (0, 0.30, -0.10), (10, 30, 0)), spine=add(n0['spine'], (4, 8, 0)), chest=add(n0['chest'], (6, 18, 0)), neck=add(n0['neck'], (0, -20, 0)), head=add(n0['head'], (-6, -30, 0)),
                handR=W((-0.18, 0.98, 0.06), fwd=(-0.3, 0.95, 0), back=(0, 0, 1), elbow=(0.8, -0.4, 0.3)), handL=P((0.30, -0.10, -0.10)), footL=foot(n0, 'footL', (0, 0.40, 0)), footR=foot(n0, 'footR', (0, 0.08, 0), pitch=30),
                tail=(30, -30), jaw=10.0, keys=K(n0, paw_open_L=1.0, paw_open_R=1.0, brow_angry=0.8))
    fol = merge(hit, pelvis=pel(n0, (0, 0.28, -0.08), (8, 50, 0)), handR=W((-0.60, 0.62, -0.06), fwd=(-0.9, 0.4, 0), back=(0, 0, 1), elbow=(0.6, -0.6, 0.4)), jaw=3.0)
    out['stand_heavy'] = mk(cid, 'stand_heavy', '逆ひねり爪', n0, wind, hit, fol, 'pawR', silhouette='いったん相手に背を向けるほど逆へひねる→ほどけるように踏み込み、右の爪が胸の高さを大きく横切る')
    wind = merge(c0, head=add(c0['head'], (10, -24, 0)), handL=R_((0.10, 0.44, 0.12)), keys=K(c0, paw_open_L=1.0))
    hit = merge(c0, pelvis=off(c0, (0, 0.08, 0), (0, -8, 0)), head=add(c0['head'], (10, -10, 0)), handL=W((-0.10, 0.96, -0.52), fwd=(0, 1, -0.1), back=(0, 0.1, 1), elbow=(0.9, -0.3, 0.2)), tail=(14, 8), keys=K(c0, paw_open_L=1.0))
    fol = merge(c0, handL=R_((0.10, 0.56, 0.14)), keys=K(c0, paw_open_L=1.0))
    out['crouch_weak'] = mk(cid, 'crouch_weak', '視線先行の足元爪', c0, wind, hit, fol, 'pawL', silhouette='目線だけ先に相手の足元へ落ちる→遅れて左の爪が床すれすれに伸びる')
    wind = merge(c0, pelvis=off(c0, (0, -0.06, 0.02), (0, 24, 0)), chest=add(c0['chest'], (0, 16, 0)), footL=foot(c0, 'footL', (0.04, -0.10, 0.10), knee=0.9), tail=(-8, 20), keys=K(c0, brow_angry=0.6))
    hit = merge(c0, pelvis=off(c0, (0.06, 0.10, 0.04), (-10, -40, 10)), chest=add(c0['chest'], (-8, -16, 6)), head=add(c0['head'], (0, 36, 0)), footL=KICK(0.10, 1.30, 0.14, pitch=-10, yaw=40), footR=foot(c0, 'footR', (0, 0, 0), yaw=40),
                handL=R_((0.30, -0.10, 0.14)), handR=hmove(c0, 'handR', (0.20, -0.20, 0.0)), tail=(16, -26), jaw=6.0, keys=K(c0, brow_angry=0.6))
    fol = merge(c0, footL=KICK(0.06, 0.60, 0.12, pitch=6, knee=0.4, yaw=20))
    out['crouch_heavy'] = mk(cid, 'crouch_heavy', '低い横蹴り', c0, wind, hit, fol, 'footL', silhouette='体をいったん逆へ寄せる→腰を開いて前足のかかとが床の少し上を真横に突く。蹴り足ははっきり伸び切る')
    wind = merge(a0, handR=P((0.34, 0.20, 0.60), fwd=(0, 0.3, 0.95), back=(0, 1, 0), elbow=(0.9, -0.3, 0)), keys=K(a0, paw_open_R=1.0))
    hit = merge(a0, pelvis=off(a0, (0, 0, 0), (10, -12, 0)), chest=add(a0['chest'], (6, -12, 0)), handR=P((0.36, 0.16, 0.62), fwd=(0, 0.3, 0.95), back=(0, 1, 0), elbow=(0.9, -0.3, 0)),
                handL=W((-0.12, 0.86, -0.46), fwd=(0, 0.8, -0.6), back=(0.2, 0.5, 0.8), elbow=(0.9, -0.2, 0)), tail=(30, 0), keys=K(a0, paw_open_L=1.0, paw_open_R=1.0))
    fol = merge(a0, handL=hmove(a0, 'handL', (0, 0.08, -0.08)), keys=K(a0, paw_open_L=1.0))
    out['air_weak'] = mk(cid, 'air_weak', '空中のずらし爪', a0, wind, hit, fol, 'pawL', silhouette='右手を高く見せたまま、左の爪が斜め下へ出る')
    wind = merge(a0, pelvis=off(a0, (0, -0.04, 0.04), (-16, -30, 0)), chest=add(a0['chest'], (-10, -20, 0)), handR=P((0.50, -0.30, 0.70), fwd=(0.3, 0.2, 0.9), back=(0, 1, 0), elbow=(0.8, -0.5, 0.2)), handL=hmove(a0, 'handL', (0.10, 0, 0.10)), tail=(-14, -20), keys=K(a0, paw_open_R=1.0, brow_angry=0.8))
    hit = merge(a0, pelvis=off(a0, (0, 0.06, 0), (18, 30, 0)), chest=add(a0['chest'], (12, 22, 0)), head=add(a0['head'], (-10, -30, 0)), handR=W((-0.26, 0.90, -0.50), fwd=(-0.4, 0.7, -0.6), back=(0, 0.6, 0.8), elbow=(0.7, -0.5, 0.3)),
                handL=hmove(a0, 'handL', (0.24, -0.20, 0.06)), tail=(34, 20), jaw=10.0, keys=K(a0, paw_open_R=1.0, brow_angry=0.8))
    fol = merge(hit, handR=W((-0.60, 0.50, -0.60), fwd=(-0.8, 0.3, -0.5), back=(0, 0.6, 0.8), elbow=(0.6, -0.6, 0.3)), jaw=3.0)
    out['air_heavy'] = mk(cid, 'air_heavy', '溜め振り爪', a0, wind, hit, fol, 'pawR', t=(12, 18, 4, 31, 46), silhouette='右の爪を頭の後ろに構えて一拍ためる→斜め下へ大きく振り下ろす')
    return out

# =====================================================================  タキマル: 掴み。手を開いて寄る。打撃も「組みに行く」形
def takimaru(cid):
    n0, c0, a0 = neutral(cid), CROUCH(cid), AIR(cid); B = K(n0, paw_open_L=1.0, paw_open_R=1.0, brow_angry=0.6); out = {}
    wind = merge(n0, handL=hand(n0, 'handL', (0.06, -0.08, 0.10)), keys=B)
    hit = merge(n0, pelvis=pel(n0, (0, 0.10, -0.03), (4, -8, 0)), chest=add(n0['chest'], (2, -10, 0)), handL=W((-0.06, 0.92, 0.10), fwd=(0, 0.6, 0.8), back=(0, -0.8, 0.6), elbow=(0.9, -0.2, -0.3)), handR=P((0.36, 0.34, 0.10)), footL=foot(n0, 'footL', (0, 0.10, 0)), tail=(6, 6), keys=B)
    fol = merge(n0, pelvis=pel(n0, (0, 0.06, -0.02), (2, -4, 0)), handL=hand(n0, 'handL', (0, 0.10, 0.06)), keys=B)
    out['stand_weak'] = mk(cid, 'stand_weak', '探る掌', n0, wind, hit, fol, 'pawL', silhouette='指を開いた前の掌を相手の胸へ伸ばして間合いを測る。後ろの手も開いたまま')
    wind = merge(n0, pelvis=pel(n0, (0, -0.10, -0.08), (2, 0, 0)), handL=P((0.90, 0.10, 0.30)), handR=P((0.90, 0.10, 0.30)), chest=add(n0['chest'], (-8, 0, 0)), tail=(-10, 0), keys=B)
    hit = merge(n0, pelvis=pel(n0, (0, 0.40, -0.14), (16, 50, 0)), spine=add(n0['spine'], (6, 10, 0)), chest=add(n0['chest'], (10, 20, 0)), neck=add(n0['neck'], (0, -30, 0)), head=add(n0['head'], (-6, -40, 0)),
                handL=P((0.70, 0.30, 0.10)), handR=P((0.30, 0.40, -0.10), fwd=(-0.6, 0.6, 0), back=(0, 0, 1), elbow=(0.5, 0.6, -0.5)), footL=foot(n0, 'footL', (0.02, 0.60, 0)), footR=foot(n0, 'footR', (0, 0.14, 0), pitch=34), tail=(12, 20), jaw=12.0, keys=B)
    fol = merge(hit, pelvis=pel(n0, (0, 0.36, -0.12), (12, 40, 0)), jaw=4.0)
    out['stand_heavy'] = mk(cid, 'stand_heavy', '寄せる肩打ち', n0, wind, hit, fol, 'shoulderR', silhouette='両腕を大きく開く→体ごと一歩寄せ、右肩を相手の胸へぶつける。腕は抱え込む形のまま')
    wind = merge(c0, handR=hmove(c0, 'handR', (0.16, -0.08, -0.06)), keys=K(c0, paw_open_R=1.0))
    hit = merge(c0, pelvis=off(c0, (0, 0.08, 0), (0, 10, 0)), handR=W((-0.20, 0.92, -0.54), fwd=(-0.5, 0.85, 0), back=(0, 0, 1), elbow=(0.8, -0.4, 0.3)), tail=(6, 8), keys=K(c0, paw_open_R=1.0, brow_angry=0.6))
    fol = merge(c0, handR=W((-0.44, 0.60, -0.50), fwd=(-0.8, 0.5, 0), back=(0, 0, 1), elbow=(0.7, -0.5, 0.3)), keys=K(c0, paw_open_R=1.0))
    out['crouch_weak'] = mk(cid, 'crouch_weak', '足元の払い', c0, wind, hit, fol, 'pawR', silhouette='しゃがんだまま右の掌で相手の足首を内へ払う。短い')
    wind = merge(c0, pelvis=off(c0, (0, 0.06, -0.06), (10, 0, 0)), chest=add(c0['chest'], (8, 0, 0)), handL=R_((0.34, 0.60, 0.10)), handR=R_((0.34, 0.50, 0.10)), tail=(-10, 0), keys=K(c0, paw_open_L=1.0, paw_open_R=1.0))
    hit = merge(c0, pelvis=off(c0, (0, 0.30, 0.30), (-14, 0, 0)), chest=add(c0['chest'], (-16, 0, 0)), head=add(c0['head'], (10, 0, 0)), handL=W((0.06, 0.90, 0.30), fwd=(0, 0.5, 0.85), back=(0, -0.85, 0.5), elbow=(0.9, -0.3, -0.2)),
                handR=W((0.06, 0.90, 0.30), fwd=(0, 0.5, 0.85), back=(0, -0.85, 0.5), elbow=(0.9, -0.3, -0.2)), footL=foot(c0, 'footL', (0, 0.30, 0)), footR=foot(c0, 'footR', (0, 0.16, 0)), tail=(14, 0), jaw=12.0, keys=K(c0, paw_open_L=1.0, paw_open_R=1.0))
    fol = merge(hit, handL=W((0.10, 0.70, 0.62), fwd=(0, 0.3, 0.95), back=(0, -0.95, 0.3), elbow=(0.9, -0.3, -0.2)), handR=W((0.10, 0.70, 0.62), fwd=(0, 0.3, 0.95), back=(0, -0.95, 0.3), elbow=(0.9, -0.3, -0.2)), jaw=4.0)
    out['crouch_heavy'] = mk(cid, 'crouch_heavy', 'すくい上げ', c0, wind, hit, fol, 'pawL+pawR', silhouette='両手を床の近くへ差し入れる→密着の一歩と一緒に、下から両腕ですくい上げる→腕が頭上まで上がる')
    wind = merge(a0, handR=P((0.40, -0.10, 0.36), fwd=(0, 0.3, 0.95), back=(0.8, 0, 0.5), elbow=(0.9, -0.3, 0.3)), keys=K(a0, brow_angry=0.6))
    hit = merge(a0, pelvis=off(a0, (0, 0.04, 0), (-4, 20, 0)), chest=add(a0['chest'], (-8, 22, 0)), head=add(a0['head'], (6, -20, 0)), handR=P((0.04, 0.54, -0.06), fwd=(-0.9, 0.2, 0.2), back=(0, 1, 0), elbow=(0.2, 0.9, -0.4)), handL=hmove(a0, 'handL', (0.20, -0.40, 0.0)), tail=(22, 0), keys=K(a0, brow_angry=0.6))
    fol = merge(a0, handR=hmove(a0, 'handR', (0, 0.04, -0.04)), keys=K(a0, brow_angry=0.6))
    out['air_weak'] = mk(cid, 'air_weak', '落とし肘', a0, wind, hit, fol, 'elbowR', silhouette='右ひじを高く上げてから、畳んだまま真下へ落とす')
    wind = merge(a0, pelvis=off(a0, (0, 0, 0.06), (-10, 0, 0)), handL=P((0.60, 0.10, 0.40)), handR=P((0.60, 0.10, 0.40)), footL=foot(a0, 'footL', (0.06, 0, -0.10)), footR=foot(a0, 'footR', (0.06, 0, -0.10)), tail=(-10, 0), keys=B)
    hit = merge(a0, pelvis=off(a0, (0, 0.04, -0.10), (28, 0, 0)), spine=add(a0['spine'], (14, 0, 0)), chest=add(a0['chest'], (16, 0, 0)), head=add(a0['head'], (-10, 0, 0)), handL=P((0.30, 0.34, -0.30)), handR=P((0.30, 0.34, -0.30)),
                footL=foot(a0, 'footL', (0.08, 0.20, 0.30), knee=0.95), footR=foot(a0, 'footR', (0.08, 0.24, 0.30), knee=0.95), tail=(30, 0), jaw=12.0, keys=B)
    fol = merge(hit, pelvis=off(a0, (0, 0.04, -0.16), (32, 0, 0)), jaw=5.0)
    out['air_heavy'] = mk(cid, 'air_heavy', '丸めた体落とし', a0, wind, hit, fol, 'body', silhouette='腕を広げてから体幹を丸め、ひざを抱えるように真下へ体重を落とす。横へは伸びない')
    return out

# =====================================================================  ヨミカゲ: 見切り。静止から最小の動き。手刀
def yomikage(cid):
    n0, c0, a0 = neutral(cid), CROUCH(cid), AIR(cid); B = K(n0, paw_open_L=1.0, paw_open_R=1.0); out = {}
    blade = lambda x, y, z: W((x, y, z), fwd=(0, 1, 0), back=(1, 0, 0), elbow=(0.9, -0.2, -0.3))            # 手刀（掌を縦に）
    wind = merge(n0, handL=hand(n0, 'handL', (0.0, -0.04, 0.0)), keys=B)
    hit = merge(n0, chest=add(n0['chest'], (0, -6, 0)), handL=blade(-0.12, 0.90, 0.04), tail=(2, 2), keys=B)
    fol = merge(n0, handL=hand(n0, 'handL', (0, 0.10, 0)), keys=B)
    out['stand_weak'] = mk(cid, 'stand_weak', '手首返しの小突き', n0, wind, hit, fol, 'pawL', t=(3, 7, 3, 15, 24), silhouette='体はほとんど動かさず、脱力した前手の手首だけが返って小さく突く')
    wind = merge(n0, pelvis=pel(n0, (0, -0.02, 0.0), (0, 0, 0)), handR=P((0.10, 0.20, 0.20), fwd=(0, 0.3, 0.95), back=(1, 0, 0), elbow=(0.9, -0.3, 0)), keys=B)
    hit = merge(n0, pelvis=pel(n0, (0, 0.36, -0.10), (8, 40, 0)), spine=add(n0['spine'], (2, 10, 0)), chest=add(n0['chest'], (4, 22, 0)), neck=add(n0['neck'], (0, -26, 0)), head=add(n0['head'], (-4, -40, 0)),
                handR=W((-0.28, 0.94, 0.08), fwd=(-0.5, 0.85, 0), back=(0, 0, 1), elbow=(0.6, -0.6, 0.4)), handL=P((0.10, 0.10, -0.10)), footL=foot(n0, 'footL', (0.02, 0.52, 0)), footR=foot(n0, 'footR', (0, 0.10, 0), pitch=30), tail=(8, 16), keys=K(n0, paw_open_R=1.0, brow_angry=0.6))
    fol = merge(hit, handR=W((-0.56, 0.66, 0.0), fwd=(-0.9, 0.4, 0), back=(0, 0, 1), elbow=(0.5, -0.7, 0.4)))
    out['stand_heavy'] = mk(cid, 'stand_heavy', '一歩の手刀斬り', n0, wind, hit, fol, 'pawR', t=(12, 18, 4, 30, 46), silhouette='長く動かない（待ち）→一歩だけ踏み込み、右の手刀が首の高さを横に斬る→斬った腕は水平に残る')
    wind = merge(c0, handR=hmove(c0, 'handR', (0.06, -0.04, -0.04)), keys=K(c0, paw_open_R=1.0))
    hit = merge(c0, handR=W((-0.16, 0.92, -0.60), fwd=(-0.3, 0.95, 0), back=(0, 0, 1), elbow=(0.9, -0.3, 0.2)), tail=(4, 4), keys=K(c0, paw_open_R=1.0))
    fol = merge(c0, handR=hmove(c0, 'handR', (0, 0.06, 0)), keys=K(c0, paw_open_R=1.0))
    out['crouch_weak'] = mk(cid, 'crouch_weak', '足首の払い', c0, wind, hit, fol, 'pawR', t=(3, 7, 3, 15, 24), silhouette='しゃがんだ体を動かさず、右の手刀だけが足首の高さを払う')
    wind = merge(c0, pelvis=off(c0, (0, -0.06, 0.0), (0, -30, 0)), chest=add(c0['chest'], (0, -20, 0)), head=add(c0['head'], (0, 40, 0)), tail=(-6, -10), keys=K(c0, brow_angry=0.6))
    hit = merge(c0, pelvis=off(c0, (0, 0.24, 0.34), (-26, 10, 0)), chest=add(c0['chest'], (-18, 10, 0)), head=add(c0['head'], (14, -10, 0)), footL=KICK(0.02, 0.80, 0.90, pitch=40, knee=0.95), footR=foot(c0, 'footR', (0, 0.10, 0)),
                handR=P((0.10, 0.36, 0.44), fwd=(0, 0.2, 1), back=(0, 1, 0), elbow=(0.3, 0.9, 0.3)), handL=P((0.30, 0.0, -0.20)), tail=(16, 0), jaw=8.0, keys=K(c0, brow_angry=0.6))
    fol = merge(hit, pelvis=off(c0, (0, 0.16, 0.26), (-8, 6, 0)), footL=KICK(0.02, 0.44, 0.60, pitch=30, knee=0.9), jaw=3.0)
    out['crouch_heavy'] = mk(cid, 'crouch_heavy', '迎えの膝と肘', c0, wind, hit, fol, 'kneeL+elbowR', silhouette='半身に引いて迎える→立ち上がりながら前ひざと右ひじを同時に突き上げる（上へ向かう形）')
    wind = merge(a0, handL=hmove(a0, 'handL', (0.0, -0.06, 0.04)), keys=K(a0, paw_open_L=1.0))
    hit = merge(a0, handL=W((-0.10, 0.80, -0.50), fwd=(0, 0.5, 0.85), back=(0, -0.85, 0.5), elbow=(0.9, -0.2, 0)), tail=(18, 0), keys=K(a0, paw_open_L=1.0))
    fol = merge(a0, handL=hmove(a0, 'handL', (0, 0.06, -0.06)), keys=K(a0, paw_open_L=1.0))
    out['air_weak'] = mk(cid, 'air_weak', '空中の短い掌', a0, wind, hit, fol, 'pawL', t=(3, 7, 3, 15, 24), silhouette='空中の軸を崩さず、前の掌だけを下へ短く出す')
    wind = merge(a0, pelvis=off(a0, (0, -0.06, 0.04), (-6, 0, 0)), footR=foot(a0, 'footR', (0, -0.20, 0.10), knee=0.9), handR=P((0.20, -0.10, 0.50), fwd=(0, 0.3, 0.95), back=(1, 0, 0), elbow=(0.9, -0.3, 0.3)), tail=(-8, 0), keys=K(a0, paw_open_R=1.0, brow_angry=0.6))
    hit = merge(a0, pelvis=off(a0, (0, 0.04, 0), (20, 10, 0)), chest=add(a0['chest'], (12, 10, 0)), head=add(a0['head'], (-12, -10, 0)), handR=W((-0.12, 0.70, -0.74), fwd=(0, 0.5, -0.85), back=(0.3, 0.8, 0.5), elbow=(0.9, -0.2, 0.2)),
                footR=foot(a0, 'footR', (0, -0.30, 0.16), pitch=30), handL=hmove(a0, 'handL', (0.16, -0.40, 0.10)), tail=(26, 0), jaw=6.0, keys=K(a0, paw_open_R=1.0, brow_angry=0.6))
    fol = merge(hit, handR=W((-0.10, 0.60, -0.60), fwd=(0, 0.5, -0.85), back=(0.3, 0.8, 0.5), elbow=(0.9, -0.2, 0.2)), jaw=2.0)
    out['air_heavy'] = mk(cid, 'air_heavy', '下突き', a0, wind, hit, fol, 'pawR', silhouette='軸足を後ろへ引いて構える→右の手刀を真下に近い角度で突き下ろす')
    return out

# =====================================================================  バレット: 長尾。前手は測るだけ、強は体ごと回して尾の先端で打つ
def bullet(cid):
    n0, c0, a0 = neutral(cid), CROUCH(cid), AIR(cid); B = K(n0, brow_angry=0.7); out = {}; flat = lambda up=0, side=0: tb(cid, up, side)
    wind = merge(n0, handL=hand(n0, 'handL', (0.04, -0.12, 0.02)), tail=(0, 0), tail_bones=flat(10, -30), keys=B)
    hit = merge(n0, pelvis=pel(n0, (0, 0.08, -0.02), (4, -12, 0)), chest=add(n0['chest'], (3, -14, 0)), head=add(n0['head'], (-3, 20, 0)), handL=PUNCH(z=0.04), handR=hand(n0, 'handR', (0, -0.08, 0.06)), tail=(0, 0), tail_bones=flat(10, 40), keys=B)
    fol = merge(n0, handL=hand(n0, 'handL', (0, 0.12, 0.02)), tail=(0, 0), tail_bones=flat(6, 10), keys=B)
    out['stand_weak'] = mk(cid, 'stand_weak', '測る前手', n0, wind, hit, fol, 'pawL', silhouette='前手のジャブで距離を測る。尾は手と逆の拍で左右に振れて釣り合いを取る（尾は当たらない）')
    # 立強: 胴をひねって体を回し、長い尾の先端で胸の高さを払う
    wind = merge(n0, pelvis=pel(n0, (0, -0.04, -0.08), (6, 0, 0)), chest=add(n0['chest'], (4, 30, 0)), head=add(n0['head'], (0, -20, 0)), handL=P((0.40, 0.10, 0.10)), handR=P((0.40, -0.10, 0.0)), tail=(0, 0), tail_bones=flat(20, -70), keys=K(n0, brow_angry=1.0))
    hit = merge(n0, pelvis=pel(n0, (0, 0.10, -0.06), (-10, 0, 0)), chest=add(n0['chest'], (-4, -30, 0)), neck=add(n0['neck'], (0, -40, 0)), head=add(n0['head'], (0, -60, 0)), handL=P((0.50, -0.10, 0.10)), handR=P((0.50, 0.10, 0.10)),
                tail=(0, 0), tail_bones=flat(26, 10), jaw=10.0, keys=K(n0, brow_angry=1.0))
    fol = merge(hit, tail_bones=flat(20, 60), jaw=3.0)
    out['stand_heavy'] = mk(cid, 'stand_heavy', '長尾の横払い', n0, wind, hit, fol, 'tail', tail_follow=0.9, t=(7, 20, 4, 32, 48), spin=[(0, 0), (7, -30, 'out'), (14, 172, 'in3'), (20, 182, 'out'), (24, 188, 'lin'), (33, 250, 'out'), (48, 360, 'io')], silhouette='逆へひねって尾を巻く→体を半回転させ、伸び切った尾の先端が胸の高さを横切る→そのまま一回転して構えへ')
    wind = merge(c0, handR=hmove(c0, 'handR', (0.04, -0.12, -0.02)), tail=(0, 0), tail_bones=flat(0, -20))
    hit = merge(c0, pelvis=off(c0, (0, 0.06, 0), (2, -10, 0)), chest=add(c0['chest'], (0, -12, 0)), handR=W((-0.12, 0.96, -0.20), fwd=(0, 1, -0.1), back=(0.2, 0.1, 1), elbow=(0.9, -0.2, -0.3)), tail=(0, 0), tail_bones=flat(0, 20), keys=K(c0, brow_angry=0.7))
    fol = merge(c0, handR=hmove(c0, 'handR', (0, 0.08, 0)), tail=(0, 0), tail_bones=flat(0, 0), keys=K(c0, brow_angry=0.7))
    out['crouch_weak'] = mk(cid, 'crouch_weak', '低い前手突き', c0, wind, hit, fol, 'pawR', silhouette='しゃがんだまま右手で低く突く。尾は床に置いたまま')
    wind = merge(c0, pelvis=off(c0, (0, -0.04, 0), (4, 0, 0)), chest=add(c0['chest'], (0, 24, 0)), head=add(c0['head'], (0, -16, 0)), tail=(0, 0), tail_bones=flat(-6, -70), keys=K(c0, brow_angry=1.0))
    hit = merge(c0, pelvis=off(c0, (0, 0.06, 0), (-6, 0, 0)), chest=add(c0['chest'], (-4, -26, 0)), neck=add(c0['neck'], (0, -40, 0)), head=add(c0['head'], (0, -60, 0)), tail=(0, 0), tail_bones=flat(-52, 10), jaw=8.0, keys=K(c0, brow_angry=1.0))
    fol = merge(hit, tail_bones=flat(-46, 60), jaw=3.0)
    out['crouch_heavy'] = mk(cid, 'crouch_heavy', '地すれの尾薙ぎ', c0, wind, hit, fol, 'tail', tail_follow=0.9, t=(7, 20, 4, 32, 48), spin=[(0, 0), (7, -30, 'out'), (14, 172, 'in3'), (20, 182, 'out'), (24, 188, 'lin'), (33, 250, 'out'), (48, 360, 'io')], silhouette='しゃがんだまま逆へひねる→低い姿勢で半回転し、尾が床すれすれを薙ぐ（上へは届かない）')
    wind = merge(a0, handL=hmove(a0, 'handL', (0.04, -0.14, 0.10)), tail=(0, 0), tail_bones=flat(-30, 0))
    hit = merge(a0, pelvis=off(a0, (0, 0, 0), (10, -10, 0)), chest=add(a0['chest'], (6, -12, 0)), handL=W((-0.14, 0.88, -0.40), fwd=(0, 0.8, -0.6), back=(0.2, 0.5, 0.8), elbow=(0.9, -0.2, 0)), tail=(0, 0), tail_bones=flat(-50, 0), keys=K(a0, brow_angry=0.7))
    fol = merge(a0, handL=hmove(a0, 'handL', (0, 0.10, -0.08)), tail=(0, 0), tail_bones=flat(-30, 0), keys=K(a0, brow_angry=0.7))
    out['air_weak'] = mk(cid, 'air_weak', '空中の前手', a0, wind, hit, fol, 'pawL', silhouette='前手を斜め下へ短く出す。尾は下へ垂らして姿勢の支えにする')
    wind = merge(a0, pelvis=off(a0, (0, 0, 0.04), (-10, 0, 0)), chest=add(a0['chest'], (0, 24, 0)), tail=(0, 0), tail_bones=flat(60, -40), keys=K(a0, brow_angry=1.0))
    hit = merge(a0, pelvis=off(a0, (0, 0.04, 0), (-24, 0, 0)), chest=add(a0['chest'], (0, -24, 0)), neck=add(a0['neck'], (0, -40, 0)), head=add(a0['head'], (0, -60, 0)), tail=(0, 0), tail_bones=flat(-40, 6), jaw=10.0, keys=K(a0, brow_angry=1.0))
    fol = merge(hit, tail_bones=flat(-70, 30), jaw=3.0)
    out['air_heavy'] = mk(cid, 'air_heavy', '溜め尾の振り下ろし', a0, wind, hit, fol, 'tail', tail_follow=0.9, t=(7, 20, 4, 32, 48), spin=[(0, 0), (7, -30, 'out'), (14, 172, 'in3'), (20, 182, 'out'), (24, 188, 'lin'), (33, 250, 'out'), (48, 360, 'io')], silhouette='尾を背中側へ高く溜める→空中で半回転し、尾を前下へ振り下ろす')
    return out

# =====================================================================  ダークモグゾー: 連係。低い前傾、モグゾーと別の体の使い方（滑る足・振り抜き）
def dark_moguzo(cid):
    n0, c0, a0 = neutral(cid), CROUCH(cid), AIR(cid); B = K(n0, brow_angry=1.0); out = {}
    wind = merge(n0, pelvis=pel(n0, (0, -0.02, -0.06), (8, 10, 0)), handR=hand(n0, 'handR', (0.04, -0.10, -0.04)), keys=B)
    hit = merge(n0, pelvis=pel(n0, (0, 0.10, -0.12), (16, 24, 0)), chest=add(n0['chest'], (8, 20, 0)), head=add(n0['head'], (-10, -26, 0)), handR=PUNCH(x=-0.16, y=0.90, z=-0.14, elbow=(0.9, -0.1, -0.2)), handL=hand(n0, 'handL', (0.04, -0.16, 0.0)), tail=(-6, 10), keys=B)
    fol = merge(n0, pelvis=pel(n0, (0, 0.04, -0.08), (10, 8, 0)), handR=hand(n0, 'handR', (0, 0.10, -0.04)), keys=B)
    out['stand_weak'] = mk(cid, 'stand_weak', '低い差し返し', n0, wind, hit, fol, 'pawR', t=(3, 7, 3, 15, 24), silhouette='前傾を深めて、後ろの右拳を腹の高さへ短く差す（モグゾーの前手ジャブとは逆の手・低い打点）')
    wind = merge(n0, pelvis=pel(n0, (0, -0.10, -0.14), (10, 30, 0)), chest=add(n0['chest'], (6, 24, 0)), head=add(n0['head'], (0, -30, 0)), handL=P((0.60, -0.20, -0.10), fwd=(0.6, 0.6, 0), back=(0, 0, 1), elbow=(0.6, -0.7, 0.2)), footL=foot(n0, 'footL', (0, 0.10, 0)), tail=(-10, 16), keys=B)
    hit = merge(n0, pelvis=pel(n0, (0, 0.50, -0.18), (14, -40, 0)), spine=add(n0['spine'], (4, -10, 0)), chest=add(n0['chest'], (6, -24, 0)), neck=add(n0['neck'], (0, 24, 0)), head=add(n0['head'], (-6, 40, 0)),
                handL=W((-0.36, 0.90, -0.02), fwd=(-0.7, 0.7, 0), back=(0, 0, 1), elbow=(0.6, -0.6, 0.4)), handR=P((0.20, -0.10, -0.10)), footL=foot(n0, 'footL', (0.02, 0.80, 0), yaw=10), footR=foot(n0, 'footR', (0, 0.44, 0), pitch=10), tail=(10, -24), jaw=10.0, keys=B)
    fol = merge(hit, pelvis=pel(n0, (0, 0.52, -0.16), (12, -66, 0)), handL=W((-0.80, 0.40, -0.10), fwd=(-0.95, 0.1, 0), back=(0, 0, 1), elbow=(0.5, -0.7, 0.4)), head=add(n0['head'], (-4, 60, 0)), jaw=3.0)
    out['stand_heavy'] = mk(cid, 'stand_heavy', '滑り込みの振り抜き', n0, wind, hit, fol, 'pawL', silhouette='左拳を体の外へ引く→両足を滑らせて前へ出ながら、左拳を横に振り抜く（後ろ足もついて来る）→腕は体の反対側まで振り切る')
    wind = merge(c0, pelvis=off(c0, (0, 0, -0.06), (8, 0, 0)), handR=hmove(c0, 'handR', (0.04, -0.12, -0.06)), keys=K(c0, brow_angry=1.0))
    hit = merge(c0, pelvis=off(c0, (0, 0.16, -0.10), (14, 14, 0)), chest=add(c0['chest'], (6, 12, 0)), head=add(c0['head'], (-12, -14, 0)), handR=W((-0.14, 0.98, -0.34), fwd=(0, 1, 0), back=(0.2, 0, 1), elbow=(0.9, -0.2, -0.2)), tail=(-4, 8), keys=K(c0, brow_angry=1.0))
    fol = merge(c0, pelvis=off(c0, (0, 0.08, -0.06), (8, 6, 0)), handR=hmove(c0, 'handR', (0, 0.10, 0)), keys=K(c0, brow_angry=1.0))
    out['crouch_weak'] = mk(cid, 'crouch_weak', '潜り突き', c0, wind, hit, fol, 'pawR', t=(3, 7, 3, 15, 24), silhouette='しゃがみからさらに深く潜り、右の手首を低く真っすぐ突き出す')
    wind = merge(c0, pelvis=off(c0, (0, -0.04, 0), (0, 30, 0)), chest=add(c0['chest'], (0, 24, 0)), head=add(c0['head'], (0, -30, 0)), handL=P((0.60, -0.20, -0.30), fwd=(0.6, 0.6, 0), back=(0, 0, 1), elbow=(0.6, -0.7, 0.2)), tail=(-8, 16), keys=K(c0, brow_angry=1.0))
    hit = merge(c0, pelvis=off(c0, (0, 0.16, 0), (-2, -36, 0)), chest=add(c0['chest'], (-4, -28, 0)), head=add(c0['head'], (4, 36, 0)), handL=W((-0.34, 0.92, -0.56), fwd=(-0.7, 0.7, 0), back=(0, 0, 1), elbow=(0.6, -0.6, 0.4)),
                handR=hmove(c0, 'handR', (0.10, -0.10, 0)), footL=foot(c0, 'footL', (0, 0.14, 0)), tail=(12, -22), jaw=8.0, keys=K(c0, brow_angry=1.0))
    fol = merge(hit, pelvis=off(c0, (0, 0.14, 0), (0, -54, 0)), handL=W((-0.76, 0.40, -0.52), fwd=(-0.95, 0.1, 0), back=(0, 0, 1), elbow=(0.5, -0.7, 0.4)), jaw=3.0)
    out['crouch_heavy'] = mk(cid, 'crouch_heavy', '地を切る横払い', c0, wind, hit, fol, 'pawL', silhouette='左拳を外へ引く→床を切るように低く横へ払い、体の反対側まで振り切る（次の技へ流れる形）')
    wind = merge(a0, pelvis=off(a0, (0, 0, 0), (0, -24, 0)), chest=add(a0['chest'], (0, -20, 0)), handL=PUNCH(y=0.40, z=-0.20), handR=hmove(a0, 'handR', (0.06, -0.14, 0.0)), keys=K(a0, brow_angry=1.0))
    hit = merge(a0, pelvis=off(a0, (0, 0, 0), (12, 6, 0)), chest=add(a0['chest'], (8, 10, 0)), head=add(a0['head'], (-6, -8, 0)), handR=W((-0.16, 0.92, -0.40), fwd=(0, 0.8, -0.6), back=(0.2, 0.5, 0.8), elbow=(0.9, -0.2, 0)), handL=hmove(a0, 'handL', (0.16, -0.46, -0.06)), tail=(24, -10), keys=K(a0, brow_angry=1.0))
    fol = merge(a0, handR=hmove(a0, 'handR', (0, 0.10, -0.10)), keys=K(a0, brow_angry=1.0))
    out['air_weak'] = mk(cid, 'air_weak', 'ひねり差し', a0, wind, hit, fol, 'pawR', t=(3, 7, 3, 15, 24), silhouette='左手を先に半分出して体をひねる（連撃に見える）→入れ替わりに右拳が斜め下へ差す。判定は右の1回')
    wind = merge(a0, pelvis=off(a0, (0, -0.06, 0.06), (10, 0, 0)), footL=foot(a0, 'footL', (0, -0.10, 0.20), knee=0.95), footR=foot(a0, 'footR', (0, -0.10, 0.10), knee=0.9), handL=hmove(a0, 'handL', (0.10, -0.10, 0.10)), tail=(-12, 0), keys=K(a0, brow_angry=1.0))
    hit = merge(a0, pelvis=off(a0, (0, 0.10, 0), (-30, 0, 0)), spine=add(a0['spine'], (-8, 0, 0)), chest=add(a0['chest'], (10, 0, 0)), head=add(a0['head'], (16, 0, 0)), footL=KICK(0.0, 1.20, -0.30, pitch=-40, knee=0.0), footR=foot(a0, 'footR', (0, -0.30, 0.24), knee=0.9, pitch=30),
                handL=hmove(a0, 'handL', (0.20, -0.20, 0.10)), handR=hmove(a0, 'handR', (0.30, -0.30, 0.10)), tail=(30, 0), jaw=10.0, keys=K(a0, brow_angry=1.0))
    fol = merge(hit, footL=KICK(0.0, 1.00, -0.44, pitch=-30, knee=0.1), jaw=3.0)
    out['air_heavy'] = mk(cid, 'air_heavy', '斜めの蹴り下ろし', a0, wind, hit, fol, 'footL', silhouette='両ひざを畳む→体を後ろへ倒し、前足を一直線に斜め下へ蹴り下ろす（着地で前傾へつながる）')
    return out

MOVES = dict(moguzo=moguzo, pisuke=pisuke, godan=godan, hakuma=hakuma, chirka=chirka, takimaru=takimaru, yomikage=yomikage, bullet=bullet, dark_moguzo=dark_moguzo)

def make(cid, slot): return MOVES[cid](cid)[slot]
def clip_name(slot): return 'v17_' + slot
