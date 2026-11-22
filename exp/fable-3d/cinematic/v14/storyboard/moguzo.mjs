// モグゾー奥義「大地烈掌」命中後ムービー 10.0秒版の絵コンテ（編集用の正本）。 node tools/build_manifest.mjs moguzo で manifest/ へ書き出す。
// 本人指定（ULTIMATE_10S_DIRECTION.md）: アッパーから始動 → 追い打ちのアッパーで高く打ち上げ。エフェクトは派手、ヒットストップ長め。
// 位置は m、時刻はムービー秒。+X = 攻撃側の向き、+Z = 対戦カメラ側。役者の rotY は Three.js の rotation.y（度）: 90 で +X 向き、-90 で -X 向き。
// カメラの文法: 「縦」。拳の高さの寄り → 真下からのあおり → 上昇に並走して回り込む → 遠景で高さを見せる → 地面へ戻る。
// ヒットストップは役者クリップ側に焼き込み済み（同じ姿勢が続く）。hitstop キューは音・FX・カメラの同期用で、再生を止める指示ではない。
const D = 0.46, AX = -D / 2;
const k = (t, pos, look, fov, roll = 0, ease) => ({ t, pos, look, fov, roll, ease });
export default {
  characterId: 'moguzo', displayName: '大地烈掌', durationSeconds: 10.0,
  concept: '掌底で止めた相手を、足を地に付けたままの一段目で跳ね上げ、回転しながら跳ぶ二段目で空の高さまで打ち上げる。',
  stage: { contactDistance: D, backdrop: 0x2b1e16, fog: 0x2b1e16, fogNear: 6, fogFar: 26, sky: 0xffe2b8, ground: 0x4a3524, ambient: 1.35, key: 0xffd9a0, keyPower: 2.9, rim: 0xff8a3c, rimPower: 1.9,
    floor: 0x5b4a38, mountain: 0x3b2b20, post: 0x6b4a36, accent: 0xffc878, accentCss: '#ffc878',
    clouds: [{ y: 2.6, count: 6, radius: 2.4, x: 0.3, color: 0xffd9a8, opacity: 0.18 }, { y: 4.4, count: 6, radius: 2.8, x: 0.3, color: 0xffe6c4, opacity: 0.16 }, { y: 6.4, count: 7, radius: 3.2, x: 0.3, color: 0xfff0d8, opacity: 0.14 }] },
  actors: {
    attacker: { segments: [{ start: 0, clip: 'cin_moguzo_atk' }], pivotHeight: 0.45, root: [
      { t: 0, pos: [AX, 0, 0], rotY: 90 }, { t: 0.30, pos: [AX, 0, 0], rotY: 90, ease: 'hold' }, { t: 0.90, pos: [-0.08, 0, 0], rotY: 90, ease: 'inOutQuad' }, { t: 3.50, pos: [-0.08, 0, 0], rotY: 90, ease: 'hold' },
      { t: 3.70, pos: [0.16, 0.66, 0], rotY: 90, ease: 'inQuad' }, { t: 4.10, pos: [0.16, 0.70, 0], rotY: 90, ease: 'linear' }, { t: 5.80, pos: [0.22, 5.20, 0], rotY: 90, ease: 'outQuad' }, { t: 6.60, pos: [0.22, 5.34, 0], rotY: 90, ease: 'outQuad' },
      { t: 7.60, pos: [-0.10, 0, 0], rotY: 90, ease: 'inQuad' }, { t: 10.0, pos: [-0.10, 0, 0], rotY: 90 }] },
    target: { segments: [{ start: 0, clip: 'cinv_moguzo' }], pivotHeight: 0.45, root: [
      { t: 0, pos: [D / 2, 0, 0], rotY: -90 }, { t: 0.50, pos: [0.34, 0, 0], rotY: -90, ease: 'outCubic' }, { t: 1.44, pos: [0.34, 0, 0], rotY: -90, ease: 'hold' },
      { t: 1.50, pos: [0.36, 0.12, 0], rotY: -90, ease: 'inQuad' }, { t: 2.00, pos: [0.37, 0.16, 0], rotY: -90, ease: 'linear' }, { t: 3.00, pos: [0.42, 1.02, 0], rotY: -90, rotZ: -170, ease: 'outQuad' },
      { t: 3.70, pos: [0.38, 0.90, 0], rotY: -90, rotZ: -360, ease: 'inOutQuad' }, { t: 4.10, pos: [0.38, 0.95, 0], rotY: -90, rotZ: -360, ease: 'linear' },
      { t: 5.80, pos: [0.46, 6.55, 0], rotY: -90, rotZ: -1000, ease: 'outQuad' }, { t: 6.60, pos: [0.46, 6.75, 0], rotY: -90, rotZ: -1080, ease: 'outQuad' },
      { t: 8.22, pos: [1.25, 0, -0.35], rotY: -90, rotZ: -1440, ease: 'inQuad' }, { t: 8.36, pos: [1.32, 0.16, -0.35], rotY: -90, rotZ: -1440, ease: 'outQuad' }, { t: 8.52, pos: [1.36, 0, -0.35], rotY: -90, rotZ: -1440, ease: 'inQuad' }, { t: 10.0, pos: [1.36, 0, -0.35], rotY: -90, rotZ: -1440 }] },
  },
  shots: [
    { id: '01-low-fist', title: '低い拳', start: 0, end: 1.1, intent: '掌底のあと、地面近くまで引かれる拳の寄り。足元にひびが入り、カメラは拳から顔へ上がる',
      actorPose: { attacker: '掌を引き、一歩詰めて深く沈む。拳は地面すれすれ', target: '腹を折って下がり、低く構える相手に気づく' },
      camera: { rig: 'fist-level-close', move: '拳に寄り、顔へ上がる', keys: [
        k(0, ['target.chest', -0.30, 0.02, 1.15], ['target.chest', -0.12, 0, 0], 34, -6), k(0.30, ['target.chest', -0.34, 0.02, 1.05], ['target.chest', -0.14, 0, 0], 32, -4, 'outExpo'),
        k(0.90, ['attacker.pawR', 0.20, 0.05, 1.00], ['attacker.pawR', 0.10, 0.08, 0], 30, 4, 'inOutCubic'), k(1.10, ['attacker.pawR', 0.24, 0.12, 0.98], ['attacker.head', 0.06, -0.10, 0], 30, 6, 'inOutQuad')] },
      cues: [{ at: 0, type: 'vfx', key: 'flash', dur: 0.1, opacity: 0.45 }, { at: 0, type: 'vfx', key: 'impact_burst', anchor: 'target.chest', offset: [-0.06, 0, 0.05], size: 0.5, color: 0xffe2a8 }, { at: 0, type: 'shake', dur: 0.3, amp: 0.03 }, { at: 0, type: 'sfx', key: 'ult_hit_heavy' },
        { at: 0.85, type: 'vfx', key: 'ground_crack', from: [-0.10, 0.05], to: [-0.55, 0.40], dur: 0.2, hold: 2.6, width: 0.03, color: 0xffa040 }, { at: 0.85, type: 'vfx', key: 'ground_crack', from: [-0.10, 0.05], to: [0.20, 0.50], dur: 0.2, hold: 2.6, width: 0.03, color: 0xffa040 },
        { at: 0.85, type: 'vfx', key: 'dust', anchor: 'attacker.root', count: 8, spread: 0.35 }, { at: 0.85, type: 'sfx', key: 'foot_plant' }, { at: 0.9, type: 'vfx', key: 'aura', anchor: 'attacker.root', dur: 0.6, color: 0xffb050, height: 0.7 }, { at: 0.9, type: 'sfx', key: 'charge' }] },
    { id: '02-upper-one', title: '一段目', start: 1.1, end: 2.3, intent: '拳と一緒に上がるカメラ。あごが跳ね上がり、首と上体が反る瞬間で長く止める',
      actorPose: { attacker: '足を地に付けたまま、全身を伸ばす右の突き上げ→止め', target: 'あごを跳ね上げられ、つま先が浮く→止め' },
      camera: { rig: 'fist-ride-to-chin', move: '拳に乗って上昇→あごの高さで止まり、止めの間じわりと寄る', keys: [
        k(1.10, ['attacker.pawR', -0.10, -0.04, 1.00], ['attacker.pawR', 0.10, 0.06, 0], 36, 8), k(1.50, ['target.head', -0.55, -0.16, 1.10], ['target.head', -0.20, -0.12, 0], 36, -10, 'inExpo'),
        k(2.00, ['target.head', -0.50, -0.14, 0.98], ['target.head', -0.20, -0.12, 0], 33, -13, 'linear'), k(2.30, ['target.head', -0.60, -0.05, 1.30], ['target.chest', -0.12, 0, 0], 36, -6, 'outCubic')] },
      cues: [{ at: 1.50, type: 'hitstop', dur: 0.5, strength: 'heavy' }, { at: 1.50, type: 'vfx', key: 'flash', dur: 0.12, opacity: 0.5 }, { at: 1.50, type: 'vfx', key: 'dim', dur: 0.5, opacity: 0.32 },
        { at: 1.50, type: 'vfx', key: 'impact_burst', anchor: 'target.head', offset: [-0.04, -0.06, 0.05], size: 0.6, rays: 14, color: 0xffe2a8 }, { at: 1.50, type: 'vfx', key: 'sparks', anchor: 'target.head', offset: [0, -0.05, 0], count: 20, power: 1.2 },
        { at: 1.50, type: 'shake', dur: 0.5, amp: 0.05 }, { at: 1.50, type: 'sfx', key: 'ult_hit_upper1' }, { at: 1.50, type: 'vfx', key: 'shock_ring', anchor: 'attacker.root', radius: 1.3, dur: 0.5, color: 0xffd9a0 },
        { at: 1.52, type: 'vfx', key: 'ground_crack', from: [-0.05, 0], to: [0.95, 0.35], dur: 0.25, hold: 2.2, color: 0xffa040 }, { at: 1.52, type: 'vfx', key: 'ground_crack', from: [-0.05, 0], to: [-0.85, -0.30], dur: 0.25, hold: 2.2, color: 0xffa040 },
        { at: 1.52, type: 'vfx', key: 'debris', anchor: 'attacker.root', count: 12, power: 1.6 }, { at: 2.00, type: 'sfx', key: 'hitstop_release' }] },
    { id: '03-float-and-coil', title: '浮きと溜め', start: 2.3, end: 3.4, intent: '低い引き。力の抜けた相手が頭上へ浮き、その真下でモグゾーが体を巻いて沈む。二人の上下関係を1枚で見せる',
      actorPose: { attacker: '振り抜いた腕を下ろし、右へ体を巻いて一段目より深く沈む。拳は後ろの地面', target: '力が抜けて後ろへゆっくり回りながら浮く' },
      camera: { rig: 'low-wide-two-level', move: 'ほぼ固定でわずかに寄る', keys: [
        k(2.30, ['stage', 0.30, 0.10, 2.25], ['stage', 0.18, 0.56, 0], 46, 4), k(3.40, ['stage', 0.22, 0.08, 1.95], ['stage', 0.16, 0.52, 0], 44, 0, 'inOutQuad')] },
      cues: [{ at: 2.75, type: 'vfx', key: 'aura', anchor: 'attacker.root', dur: 0.75, color: 0xffb050, height: 1.2, opacity: 0.34 }, { at: 2.75, type: 'sfx', key: 'charge_big' }, { at: 2.8, type: 'vfx', key: 'dust', anchor: 'attacker.root', count: 10, spread: 0.6, dur: 0.8 },
        { at: 3.0, type: 'vfx', key: 'sparks', anchor: 'attacker.root', count: 14, power: 0.8, up: 1.4, dur: 0.5 }] },
    { id: '04-upper-two', title: '二段目', start: 3.4, end: 4.6, intent: '真下からのあおり。回りながら跳ぶ拳が、宙の相手を突き上げて止まる',
      actorPose: { attacker: '回転しながら跳び、右拳を真上へ。前ひざが上がる→止め', target: '拳の上で体が折れ曲がる→止め' },
      camera: { rig: 'worms-eye-vertical', move: '足元から真上を見上げ、止めのあと一緒に浮き上がる', keys: [
        k(3.40, ['stage', 0.40, 0.05, 0.95], ['target.pelvis', -0.08, -0.35, 0], 58, 16), k(3.70, ['stage', 0.42, 0.06, 0.92], ['target.pelvis', -0.06, -0.20, 0], 54, 22, 'inQuad'),
        k(4.10, ['stage', 0.44, 0.10, 0.88], ['target.pelvis', -0.06, -0.16, 0], 48, 26, 'linear'), k(4.60, ['attacker.root', 0.30, -0.55, 0.75], ['attacker.chest', 0, 0.10, 0], 50, 14, 'inQuad')] },
      cues: [{ at: 3.52, type: 'vfx', key: 'shock_ring', anchor: 'attacker.root', radius: 1.1, dur: 0.35 }, { at: 3.52, type: 'vfx', key: 'rock_spikes', offset: [-0.08, 0, 0], count: 7, height: 0.34, radius: 0.34, hold: 1.2 }, { at: 3.52, type: 'vfx', key: 'dust', offset: [-0.08, 0, 0], count: 12, spread: 0.6 }, { at: 3.52, type: 'sfx', key: 'jump' },
        { at: 3.70, type: 'hitstop', dur: 0.4, strength: 'heavy' }, { at: 3.70, type: 'vfx', key: 'flash', dur: 0.12, opacity: 0.5 }, { at: 3.70, type: 'vfx', key: 'impact_burst', anchor: 'attacker.pawR', offset: [0, 0.08, 0], size: 0.7, rays: 16, color: 0xffe2a8 },
        { at: 3.70, type: 'vfx', key: 'shock_ring', anchor: 'attacker.pawR', plane: 'camera', radius: 0.9, dur: 0.4 }, { at: 3.70, type: 'shake', dur: 0.4, amp: 0.06 }, { at: 3.70, type: 'sfx', key: 'ult_hit_upper2' }, { at: 4.10, type: 'vfx', key: 'speed_lines', dur: 0.5, opacity: 0.45 }, { at: 4.10, type: 'sfx', key: 'launch' }] },
    { id: '05-vertical-chase', title: '縦の追尾', start: 4.6, end: 5.8, intent: '上昇するモグゾーに並走しながら半周回り込む。雲が下へ流れ、相手は頭上を先に飛んでいく',
      actorPose: { attacker: '拳を上げたまま回転しつつ上昇', target: '大の字と丸まりを繰り返しながら先行して上昇' },
      camera: { rig: 'ascending-orbit', move: '上昇に並走しつつ左回りに 180 度', keys: [
        k(4.60, ['attacker.chest', 1.00, -0.45, 1.10], ['attacker.chest', 0, 0.18, 0], 50, 10), k(5.20, ['attacker.chest', -0.15, -0.20, 1.55], ['attacker.chest', 0, 0.22, 0], 50, 0, 'linear'), k(5.80, ['attacker.chest', -1.05, 0.10, 0.95], ['attacker.chest', 0, 0.30, 0], 48, -10, 'linear')] },
      cues: [{ at: 4.60, type: 'vfx', key: 'speed_lines', dur: 1.2, opacity: 0.32 }, { at: 4.7, type: 'vfx', key: 'sparks', anchor: 'attacker.pawR', count: 16, power: 0.9, up: -0.6, dur: 0.6 }, { at: 5.2, type: 'vfx', key: 'sparks', anchor: 'attacker.pawR', count: 16, power: 0.9, up: -0.6, dur: 0.6 }, { at: 4.6, type: 'sfx', key: 'rise_wind' }] },
    { id: '06-apex', title: '頂点', start: 5.8, end: 7.2, intent: '遠景。地面から空へ抜ける光の柱の先に二人。いちばん長い止めのあと、落ちていくモグゾーを追って下を向く',
      actorPose: { attacker: '拳を突き上げきって体が反る→止め→落下', target: 'さらに上で大の字→止め→落下開始' },
      camera: { rig: 'distant-pillar-silhouette', move: '遠景固定→止めの後、落下を追ってティルトダウン', keys: [
        k(5.80, ['stage', -0.9, 5.0, 2.5], ['stage', 0.32, 5.95, 0], 42, -6), k(6.60, ['stage', -0.8, 5.1, 2.3], ['stage', 0.32, 6.0, 0], 40, -3, 'linear'), k(7.20, ['stage', -1.2, 2.2, 3.4], ['attacker.chest', 0, 0, 0], 42, 0, 'inOutCubic')] },
      cues: [{ at: 5.90, type: 'hitstop', dur: 0.7, strength: 'max' }, { at: 5.90, type: 'vfx', key: 'energy_pillar', offset: [0.3, 0, 0], height: 8.5, radius: 0.5, dur: 1.2, color: 0xffb648 }, { at: 5.90, type: 'vfx', key: 'flash', dur: 0.16, opacity: 0.55 },
        { at: 5.90, type: 'vfx', key: 'shock_ring', anchor: 'attacker.pawR', plane: 'camera', radius: 3.4, dur: 0.8, color: 0xffe2a8 }, { at: 6.05, type: 'vfx', key: 'shock_ring', anchor: 'target.pelvis', plane: 'camera', radius: 2.2, dur: 0.7, color: 0xffffff },
        { at: 5.90, type: 'vfx', key: 'sparks', anchor: 'attacker.pawR', count: 40, power: 3.2, dur: 1.0 }, { at: 5.90, type: 'shake', dur: 0.7, amp: 0.07 }, { at: 5.90, type: 'sfx', key: 'ult_apex_blast' }, { at: 5.92, type: 'vfx', key: 'shock_ring', offset: [0.3, 0, 0], radius: 3.0, dur: 0.8 }, { at: 6.60, type: 'sfx', key: 'hitstop_release' }] },
    { id: '07-landing', title: '着地と墜落', start: 7.2, end: 8.6, intent: '地面すれすれ。モグゾーが拳をついて着地し、目を閉じたままの背後に相手が落ちてくる',
      actorPose: { attacker: '片拳を地面について着地。目を閉じ、振り返らない', target: '回りながら落ち、奥で跳ねて止まる' },
      camera: { rig: 'ground-landing-rack', move: '低い位置で着地を受け、奥の墜落へ少し振る', keys: [
        k(7.20, ['stage', -0.80, 0.09, 1.25], ['attacker.chest', 0.10, -0.04, 0], 50, 5), k(7.60, ['stage', -0.80, 0.08, 1.25], ['attacker.chest', 0.10, -0.04, 0], 42, 3, 'linear'), k(8.60, ['stage', -0.68, 0.10, 1.12], ['attacker.chest', 0.30, 0, 0], 40, 0, 'inOutQuad')] },
      cues: [{ at: 7.60, type: 'shake', dur: 0.4, amp: 0.05 }, { at: 7.60, type: 'vfx', key: 'shock_ring', anchor: 'attacker.root', radius: 1.4, dur: 0.45 }, { at: 7.60, type: 'vfx', key: 'dust', anchor: 'attacker.root', count: 12, spread: 0.7 }, { at: 7.60, type: 'sfx', key: 'land_heavy' },
        { at: 8.22, type: 'shake', dur: 0.5, amp: 0.06 }, { at: 8.22, type: 'vfx', key: 'rock_spikes', offset: [1.30, 0, -0.55], count: 7, height: 0.3, radius: 0.4, hold: 1.6 }, { at: 8.22, type: 'vfx', key: 'debris', anchor: 'target.root', count: 18, power: 2.0 },
        { at: 8.22, type: 'vfx', key: 'dust', anchor: 'target.root', count: 14, spread: 0.8, dur: 1.1 }, { at: 8.22, type: 'vfx', key: 'shock_ring', anchor: 'target.root', radius: 1.8, dur: 0.5 }, { at: 8.22, type: 'sfx', key: 'ground_slam_big' }] },
    { id: '08-finish', title: '決め', start: 8.6, end: 10.0, intent: '正面の低いあおり。立ち上がって体を開き、拳を空へ。倒れた相手は奥に残す',
      actorPose: { attacker: '立ち上がる→こちらへ体を開いて拳を突き上げる', target: '仰向けで動かない' },
      camera: { rig: 'low-hero-arc', move: 'ゆっくり回り込みながら寄る', keys: [
        k(8.60, ['stage', 0.30, 0.08, 1.20], ['attacker.chest', 0.10, -0.04, 0], 38, -5), k(9.20, ['stage', 0.12, 0.10, 1.05], ['attacker.chest', 0.10, 0.06, 0], 36, -2, 'inOutQuad'), k(10.0, ['stage', -0.05, 0.13, 1.00], ['attacker.chest', 0.10, 0.10, 0], 34, 0, 'outQuad')] },
      cues: [{ at: 9.20, type: 'vfx', key: 'shock_ring', anchor: 'attacker.pawR', plane: 'camera', radius: 0.5, dur: 0.4, color: 0xffd9a0 }, { at: 9.20, type: 'sfx', key: 'finish_pose' }, { at: 9.15, type: 'caption', dur: 0.8, text: '大地烈掌', sub: 'モグゾー' }] },
  ],
  reducedMotion: { useShots: ['02-upper-one', '06-apex', '08-finish'], disable: ['shake', 'flash', 'speed_lines', 'dim'], note: 'OSの「視差効果を減らす」/FX OFF では 3 カットを固定カメラ（各ショットの最初のキー）で見せる。役者とキューの時刻は変えない' },
};
