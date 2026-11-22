// タキマル奥義「天地落とし」命中後ムービー 10.4秒版の絵コンテ（編集用の正本）。座標・単位・hitstop の扱いは moguzo.mjs の冒頭と同じ。
// 本人指定: 最初に前方へ投げ、煽るように相手を見下ろす。再び拾い上げてジャイアントスイング。荒々しさ。
// カメラの文法: 「やられる側の目線」。投げられて落ちる位置、倒れた相手の頭の横、真下からの見上げ、振り回される相手に付いたカメラ。攻撃側の大きさを相手の低さで見せる。
const D = 0.50, AX = -D / 2, CX = 1.20, R = 0.32, TURNS = 3, T0 = 5.0, T1 = 7.4;
const k = (t, pos, look, fov, roll = 0, ease) => ({ t, pos, look, fov, roll, ease });
// ジャイアントスイング: 回転角 φ は時間の二乗で増える（加速）。攻撃側は rotY = 90 + φ、相手は手の先（半径 R）で足を攻撃側へ向ける
const swingA = [], swingT = []; const STEPS = TURNS * 8;
for (let i = 0; i <= STEPS; i++) { const phi = 360 * TURNS * i / STEPS, t = T0 + (T1 - T0) * Math.sqrt(i / STEPS), th = (90 + phi) * Math.PI / 180, h = 0.30 + 0.16 * i / STEPS;
  swingA.push({ t, pos: [CX, 0, 0], rotY: 90 + phi, ease: 'linear' }); swingT.push({ t, pos: [CX + R * Math.sin(th), h, R * Math.cos(th)], rotY: 90 + phi + 180, ease: 'linear' }); }
export default {
  characterId: 'takimaru', displayName: '天地落とし', durationSeconds: 10.4,
  concept: '襟首をつかんで前へ放り、倒れた相手を覗き込んで煽り、足首をつかんで三回転のジャイアントスイングから放り出す。',
  stage: { contactDistance: D, backdrop: 0x2a2118, fog: 0x2a2118, fogNear: 5, fogFar: 18, sky: 0xffe8c8, ground: 0x4a3a28, ambient: 1.35, key: 0xffdcae, keyPower: 2.8, rim: 0xffb060, rimPower: 2.0,
    floor: 0x5a4c3a, mountain: 0x3a2e22, post: 0x6a5238, accent: 0xffd695, accentCss: '#ffd695' },
  actors: {
    attacker: { segments: [{ start: 0, clip: 'cin_takimaru_atk' }], pivotHeight: 0.45, root: [
      { t: 0, pos: [AX, 0, 0], rotY: 90 }, { t: 0.50, pos: [AX, 0, 0], rotY: 90, ease: 'hold' }, { t: 0.70, pos: [AX + 0.14, 0, 0], rotY: 90, ease: 'inQuad' }, { t: 1.40, pos: [AX + 0.14, 0, 0], rotY: 90, ease: 'hold' },
      { t: 2.60, pos: [0.98, 0, 0], rotY: 90, ease: 'linear' }, { t: 4.00, pos: [0.98, 0, 0], rotY: 90, ease: 'hold' }, { t: 4.40, pos: [CX, 0, 0], rotY: 90, ease: 'inOutQuad' }, ...swingA.slice(1),
      { t: 8.60, pos: [CX, 0, 0], rotY: 90 + 360 * TURNS, ease: 'hold' }, { t: 9.40, pos: [CX, 0, 0], rotY: 90 + 360 * TURNS - 76, ease: 'inOutCubic' }, { t: 10.4, pos: [CX, 0, 0], rotY: 90 + 360 * TURNS - 76 }] },
    target: { segments: [{ start: 0, clip: 'cinv_takimaru' }], pivotHeight: 0.45, root: [
      { t: 0, pos: [D / 2, 0, 0], rotY: -90 }, { t: 0.50, pos: [0.10, 0.05, 0], rotY: -90, ease: 'inOutQuad' }, { t: 0.70, pos: [0.30, 0.30, 0], rotY: -90, ease: 'inQuad' }, { t: 0.95, pos: [1.00, 0.62, 0], rotY: -90, rotZ: -150, ease: 'linear' },
      { t: 1.20, pos: [1.50, 0, 0], rotY: -90, rotZ: -360, ease: 'inQuad' }, { t: 1.34, pos: [1.60, 0.13, 0], rotY: -90, rotZ: -360, ease: 'outQuad' }, { t: 1.50, pos: [1.66, 0, 0], rotY: -90, rotZ: -360, ease: 'inQuad' }, { t: 3.40, pos: [1.66, 0, 0], rotY: -90, rotZ: -360, ease: 'hold' },
      { t: 4.00, pos: [1.74, 0, 0], rotY: -90, rotZ: -360, ease: 'inOutQuad' }, { t: 4.40, pos: [1.72, 0, 0], rotY: -90, rotZ: -360, ease: 'linear' }, { t: 5.00, pos: [CX + R, 0.30, 0], rotY: -90 + 360, rotZ: -360, ease: 'inOutQuad' },
      ...swingT.slice(1).map(q => ({ ...q, rotY: q.rotY, rotZ: -360 })),
      { t: 8.10, pos: [4.00, 0, 0.10], rotY: 90 + 360 * TURNS + 180 + 540, rotZ: -360, ease: 'linear' }, { t: 8.24, pos: [4.14, 0.13, 0.10], rotY: 90 + 360 * TURNS + 180 + 540, rotZ: -360, ease: 'outQuad' }, { t: 8.40, pos: [4.25, 0, 0.10], rotY: 90 + 360 * TURNS + 180 + 540, rotZ: -360, ease: 'inQuad' },
      { t: 10.4, pos: [4.25, 0, 0.10], rotY: 90 + 360 * TURNS + 180 + 540, rotZ: -360 }] },
  },
  shots: [
    { id: '01-toss', title: '前へ放る', start: 0, end: 1.4, intent: '落ちる位置の地面の高さで待つカメラ。引き寄せて放られた相手が、こちらへ飛んできて目の前に落ちる',
      actorPose: { attacker: '襟首を引き寄せ、体をひねって前へ放り投げる', target: '引かれて前のめり→放られて回り、地面で跳ねる' },
      camera: { rig: 'landing-spot-low', move: '固定。相手が手前へ飛び込んでくる', keys: [k(0, ['stage', 0.60, 0.30, 1.50], ['stage', 0.0, 0.34, 0], 40, -4), k(0.50, ['stage', 1.20, 0.14, 1.20], ['attacker.chest', 0.20, 0, 0], 46, 4, 'outExpo'), k(0.95, ['stage', 1.95, 0.08, 0.90], ['target.pelvis', 0, 0, 0], 50, 8, 'inOutQuad'), k(1.40, ['stage', 2.10, 0.07, 0.85], ['target.pelvis', 0, 0.04, 0], 50, 6, 'outQuad')] },
      cues: [{ at: 0, type: 'vfx', key: 'flash', dur: 0.1, opacity: 0.35 }, { at: 0, type: 'sfx', key: 'grab' }, { at: 0, type: 'shake', dur: 0.2, amp: 0.03 }, { at: 0.70, type: 'sfx', key: 'throw_whoosh' }, { at: 0.72, type: 'vfx', key: 'speed_lines', dur: 0.4, opacity: 0.35 },
        { at: 1.20, type: 'hitstop', dur: 0.1, strength: 'heavy' }, { at: 1.20, type: 'shake', dur: 0.5, amp: 0.07 }, { at: 1.20, type: 'vfx', key: 'dust', anchor: 'target.root', count: 14, spread: 0.7 }, { at: 1.20, type: 'vfx', key: 'debris', anchor: 'target.root', count: 12, power: 1.5 },
        { at: 1.20, type: 'vfx', key: 'shock_ring', anchor: 'target.root', radius: 1.3, dur: 0.4 }, { at: 1.20, type: 'sfx', key: 'body_slam' }] },
    { id: '02-approach', title: '歩み寄る', start: 1.4, end: 2.6, intent: '倒れた相手の頭の横・地面の高さ。肩を揺らして歩いてくるタキマルが、一歩ごとに大きくなる',
      actorPose: { attacker: '肩を揺らして五歩で歩み寄る', target: 'うめき、近づく相手に気づいて頭を起こす' },
      camera: { rig: 'victim-level-approach', move: '固定。一歩ごとに揺れる', keys: [k(1.40, ['target.head', 0.50, 0.03, 0.42], ['attacker.chest', 0, 0.05, 0], 46, 7), k(2.60, ['target.head', 0.46, 0.03, 0.38], ['attacker.head', 0, -0.10, 0], 44, 5, 'linear')] },
      cues: [1.76, 2.02, 2.28, 2.54].flatMap(t => [{ at: t, type: 'shake', dur: 0.22, amp: 0.03 }, { at: t, type: 'vfx', key: 'dust', anchor: 'attacker.root', count: 5, spread: 0.25 }, { at: t, type: 'sfx', key: 'heavy_step' }]) },
    { id: '03-look-up', title: '見上げる', start: 2.6, end: 3.3, intent: '相手の目の位置から真上を見上げる。腰に手を当てて覗き込む顔が画面を覆う',
      actorPose: { attacker: '腰に手を当て、上体を倒して覗き込む', target: '仰向けで見上げる（カメラ位置）' },
      camera: { rig: 'worms-eye-pov', move: '見上げたまま、覗き込みに合わせて少し下がる', keys: [k(2.60, ['target.head', 0.02, 0.10, 0.06], ['attacker.head', 0, 0.05, 0], 62, -8), k(3.30, ['target.head', 0.04, 0.08, 0.08], ['attacker.head', 0, 0, 0], 56, -4, 'outQuad')] },
      cues: [{ at: 2.95, type: 'sfx', key: 'taunt_grunt' }] },
    { id: '04-taunt', title: '煽る', start: 3.3, end: 4.0, intent: 'タキマルの頭の上から見下ろす。指で「来い」と煽る手と、這って逃げようとする相手',
      actorPose: { attacker: '覗き込んだまま、指で二度「来い」', target: '這って逃げようとする' },
      camera: { rig: 'over-head-high-angle', move: '頭越しの見下ろし', keys: [k(3.30, ['attacker.head', -0.34, 0.42, 0.34], ['target.chest', -0.10, 0, 0], 48, 6), k(4.00, ['attacker.head', -0.30, 0.40, 0.30], ['target.chest', -0.06, 0, 0], 46, 3, 'linear')] },
      cues: [{ at: 3.58, type: 'sfx', key: 'taunt_beckon' }, { at: 3.82, type: 'sfx', key: 'taunt_beckon' }, { at: 3.5, type: 'vfx', key: 'dust', anchor: 'target.root', count: 4, spread: 0.2 }] },
    { id: '05-ankles', title: '足首', start: 4.0, end: 5.0, intent: '手元の寄り。しゃがんで両足首をつかみ、のけぞって引き上げる',
      actorPose: { attacker: 'しゃがんで足首をつかむ→のけぞって持ち上げる', target: '足をつかまれ、体が浮き始める' },
      camera: { rig: 'hands-close-rise', move: '手元の寄りから、持ち上げに合わせて引く', keys: [k(4.00, ['stage', 1.50, 0.16, 0.95], ['attacker.pawR', 0.05, 0, 0], 32, -4), k(4.50, ['stage', 1.50, 0.16, 0.92], ['attacker.pawR', 0.05, 0, 0], 30, -2, 'linear'), k(5.00, ['stage', 1.45, 0.34, 1.40], ['attacker.chest', 0.10, 0, 0], 40, 4, 'outQuad')] },
      cues: [{ at: 4.40, type: 'sfx', key: 'grab' }, { at: 4.40, type: 'hitstop', dur: 0.2, strength: 'light' }, { at: 4.42, type: 'vfx', key: 'dust', anchor: 'target.root', count: 6, spread: 0.3 }] },
    { id: '06-swing-top', title: 'スイング・真上', start: 5.0, end: 5.8, intent: '真上から。回り始め。足の踏み替えと、相手の体が外へ伸びるのが分かる',
      actorPose: { attacker: 'のけぞって回り始める。足は交互に踏み替え', target: '仰向けのまま腕が頭の先へ流れる' },
      camera: { rig: 'overhead-spin', move: '真上。回転と同じ向きにゆっくり回る', keys: [k(5.00, ['stage', CX, 3.4, 0.2], ['stage', CX, 0.3, 0], 42, 0), k(5.80, ['stage', CX, 3.0, 0.2], ['stage', CX, 0.3, 0], 42, -50, 'linear')] },
      cues: [{ at: 5.0, type: 'sfx', key: 'swing_whoosh_slow' }, { at: 5.0, type: 'vfx', key: 'dust', offset: [CX, 0, 0], count: 8, spread: 0.5 }] },
    { id: '07-swing-victim', title: 'スイング・相手に付いたカメラ', start: 5.8, end: 6.6, intent: '振り回される相手の胸の上にカメラを付ける。タキマルの顔は止まって見え、背景だけが流れる',
      actorPose: { attacker: '回転が速くなる。吠える', target: '遠心力で体が伸びきる' },
      camera: { rig: 'victim-mounted-whirl', move: '相手に固定。背景が回る', keys: [k(5.80, ['target.chest', 0, 0.30, 0], ['attacker.head', 0, -0.05, 0], 62, 10), k(6.60, ['target.chest', 0, 0.34, 0], ['attacker.head', 0, -0.05, 0], 66, -10, 'linear')] },
      cues: [{ at: 5.8, type: 'vfx', key: 'speed_lines', dur: 0.8, opacity: 0.4 }, { at: 5.8, type: 'sfx', key: 'swing_whoosh_fast' }] },
    { id: '08-swing-wide', title: 'スイング・全景', start: 6.6, end: 7.4, intent: '低い引き。最高速。土煙が輪になり、放す向きへ相手が来る',
      actorPose: { attacker: '最高速で回る', target: '水平に伸びたまま回る' },
      camera: { rig: 'low-wide-spin', move: '低い引きで固定', keys: [k(6.60, ['stage', CX - 0.2, 0.12, 2.60], ['stage', CX, 0.40, 0], 44, 3), k(7.40, ['stage', CX, 0.12, 2.50], ['stage', CX + 0.2, 0.42, 0], 44, 0, 'linear')] },
      cues: [{ at: 6.6, type: 'vfx', key: 'dust', offset: [CX, 0, 0], count: 16, spread: 0.9, dur: 0.9 }, { at: 6.6, type: 'vfx', key: 'shock_ring', offset: [CX, 0, 0], radius: 1.2, dur: 0.8 }, { at: 7.0, type: 'vfx', key: 'shock_ring', offset: [CX, 0, 0], radius: 1.4, dur: 0.5 }, { at: 6.6, type: 'sfx', key: 'swing_whoosh_max' }] },
    { id: '09-release', title: '放り出す', start: 7.4, end: 8.6, intent: '放す瞬間から、飛んでいく相手を追って一気に振る。遠くの地面に激突',
      actorPose: { attacker: '手を放し、両腕を開いたまま回転が残る', target: '水平に回りながら飛び、遠くで地面に落ちて跳ねる' },
      camera: { rig: 'release-whip-follow', move: '放す瞬間に寄り、相手を追って振る', keys: [k(7.40, ['stage', CX + 0.3, 0.40, 1.90], ['attacker.chest', 0.3, 0, 0], 40, -8), k(7.60, ['stage', CX + 0.6, 0.42, 2.00], ['target.pelvis', 0, 0, 0], 42, -6, 'outQuad'), k(8.10, ['stage', 2.90, 0.34, 2.20], ['target.pelvis', 0, 0, 0], 44, 0, 'linear'), k(8.60, ['stage', 3.00, 0.30, 2.10], ['target.pelvis', 0, 0.05, 0], 42, 2, 'outQuad')] },
      cues: [{ at: 7.40, type: 'hitstop', dur: 0.1, strength: 'heavy' }, { at: 7.40, type: 'vfx', key: 'flash', dur: 0.1, opacity: 0.4 }, { at: 7.40, type: 'sfx', key: 'throw_release' }, { at: 7.42, type: 'vfx', key: 'speed_lines', dur: 0.5, opacity: 0.45 }, { at: 7.42, type: 'vfx', key: 'streak', from: [CX + 0.4, 0.5, 0], to: [3.6, 0.5, 0.08], dur: 0.7, width: 0.08, color: 0xffe0a8 },
        { at: 8.10, type: 'shake', dur: 0.7, amp: 0.09 }, { at: 8.10, type: 'vfx', key: 'rock_spikes', offset: [4.05, 0, -0.2], count: 6, height: 0.3, radius: 0.4, hold: 1.6 }, { at: 8.10, type: 'vfx', key: 'debris', anchor: 'target.root', count: 22, power: 2.4 },
        { at: 8.10, type: 'vfx', key: 'dust', anchor: 'target.root', count: 18, spread: 1.0, dur: 1.2 }, { at: 8.10, type: 'vfx', key: 'shock_ring', anchor: 'target.root', radius: 2.0, dur: 0.5 }, { at: 8.10, type: 'sfx', key: 'ground_slam_big' }] },
    { id: '10-flex', title: '手をはたく', start: 8.6, end: 10.4, intent: '正面の低い位置。手をはたき、腰に手を当てて胸を張る。相手ははるか奥',
      actorPose: { attacker: 'こちらへ向き直り、手を四度はたく→腰に手を当てて胸を張る', target: '遠くで仰向け' },
      camera: { rig: 'low-front-swagger', move: '低い正面からゆっくり寄る', keys: [k(8.60, ['stage', CX + 0.25, 0.16, 2.30], ['attacker.chest', 0.05, 0.08, 0], 40, -4), k(10.4, ['stage', CX + 0.18, 0.20, 2.00], ['attacker.chest', 0.04, 0.10, 0], 36, 0, 'outQuad')] },
      cues: [8.80, 8.96, 9.12, 9.28].map(t => ({ at: t, type: 'sfx', key: 'hands_dust' })).concat([{ at: 8.9, type: 'vfx', key: 'dust', anchor: 'attacker.pawR', count: 5, spread: 0.15 }, { at: 9.70, type: 'sfx', key: 'finish_pose' }, { at: 9.60, type: 'caption', dur: 0.7, text: '天地落とし', sub: 'タキマル' }]) },
  ],
  reducedMotion: { useShots: ['01-toss', '08-swing-wide', '10-flex'], disable: ['shake', 'flash', 'speed_lines', 'dim'], note: '3 カットを固定カメラ（各ショットの最初のキー）で見せる。回転する相手に付いたカメラ（07）は使わない。役者とキューの時刻は変えない' },
};
