// ゴダン奥義「山崩し」命中後ムービー 10.2秒版の絵コンテ（編集用の正本）。座標・単位・hitstop の扱いは moguzo.mjs の冒頭と同じ。
// 本人指定: 渾身の三連撃。武道のような構え → 足元の強い踏み込み → 一撃ずつの重さ。最後の一撃で背後の岩ごと破壊。
// カメラの文法: 「重さ」。カットは長く、動きは遅い。足元→掌の縦移動／地面の震脚／真横／相手の肩越し／後退ドリー／当たりで一気のズーム。
// 岩壁はムービー内だけの舞台装置（vfx 'rock_wall'）。通常の対戦ステージには置かない。
const D = 0.50, AX = -D / 2, WALL = 2.28;
const k = (t, pos, look, fov, roll = 0, ease) => ({ t, pos, look, fov, roll, ease });
export default {
  characterId: 'godan', displayName: '山崩し', durationSeconds: 10.2,
  concept: '鉄槌で下がらせた相手に、構え・震脚から、正拳・裏拳・両の掌の三撃。三撃目は相手ごと背後の岩壁を砕く。',
  stage: { contactDistance: D, backdrop: 0x1d1b21, fog: 0x1d1b21, fogNear: 5, fogFar: 18, sky: 0xd8dcf0, ground: 0x3a3230, ambient: 1.25, key: 0xffd0a8, keyPower: 2.8, rim: 0xff7a3a, rimPower: 2.2,
    floor: 0x4a4541, mountain: 0x2c2a30, post: 0x4d3b33, posts: 0, accent: 0xffa369, accentCss: '#ffa369' },
  actors: {
    attacker: { segments: [{ start: 0, clip: 'cin_godan_atk' }], pivotHeight: 0.45, root: [
      { t: 0, pos: [AX, 0, 0], rotY: 90 }, { t: 1.62, pos: [AX, 0, 0], rotY: 90, ease: 'hold' }, { t: 1.70, pos: [AX + 0.08, 0, 0], rotY: 90, ease: 'inQuad' }, { t: 2.42, pos: [AX + 0.08, 0, 0], rotY: 90, ease: 'hold' },
      { t: 2.50, pos: [0.06, 0, 0], rotY: 90, ease: 'inQuad' }, { t: 3.90, pos: [0.10, 0, 0], rotY: 90, ease: 'inOutQuad' }, { t: 4.00, pos: [0.42, 0, 0], rotY: 90, ease: 'inQuad' }, { t: 5.00, pos: [0.46, 0, 0], rotY: 90, ease: 'inOutQuad' },
      { t: 5.48, pos: [0.78, 0, 0], rotY: 90, ease: 'inOutQuad' }, { t: 5.98, pos: [1.12, 0, 0], rotY: 90, ease: 'inOutQuad' }, { t: 7.08, pos: [1.14, 0, 0], rotY: 90, ease: 'hold' }, { t: 7.20, pos: [1.36, 0, 0], rotY: 90, ease: 'inQuad' }, { t: 10.2, pos: [1.36, 0, 0], rotY: 90 }] },
    target: { segments: [{ start: 0, clip: 'cinv_godan' }], pivotHeight: 0.45, root: [
      { t: 0, pos: [D / 2, 0, 0], rotY: -90 }, { t: 1.20, pos: [0.60, 0, 0], rotY: -90, ease: 'outCubic' }, { t: 2.50, pos: [0.60, 0, 0], rotY: -90, ease: 'hold' }, { t: 2.90, pos: [0.64, 0, 0], rotY: -90, ease: 'linear' },
      { t: 3.40, pos: [1.00, 0, 0], rotY: -90, ease: 'outCubic' }, { t: 4.00, pos: [1.00, 0, 0], rotY: -90, ease: 'hold' }, { t: 4.45, pos: [1.04, 0.02, 0], rotY: -90, ease: 'linear' },
      { t: 4.80, pos: [1.90, 0.20, 0], rotY: -90, ease: 'linear' }, { t: 5.00, pos: [1.90, 0.18, 0], rotY: -90, ease: 'linear' }, { t: 5.50, pos: [1.90, 0, 0], rotY: -90, ease: 'inQuad' }, { t: 7.20, pos: [1.90, 0, 0], rotY: -90, ease: 'hold' },
      { t: 7.90, pos: [1.94, 0.04, 0], rotY: -90, ease: 'linear' }, { t: 8.30, pos: [3.10, 0.80, 0.10], rotY: -90, rotZ: -260, ease: 'outQuad' }, { t: 8.72, pos: [3.85, 0, 0.15], rotY: -90, rotZ: -360, ease: 'inQuad' },
      { t: 8.86, pos: [3.95, 0.13, 0.15], rotY: -90, rotZ: -360, ease: 'outQuad' }, { t: 9.00, pos: [4.00, 0, 0.15], rotY: -90, rotZ: -360, ease: 'inQuad' }, { t: 10.2, pos: [4.00, 0, 0.15], rotY: -90, rotZ: -360 }] },
  },
  shots: [
    { id: '01-kamae', title: '構え', start: 0, end: 1.3, intent: '足元の寄りから、前に立てた掌と目へゆっくり上がる。音を消して「静」を作る',
      actorPose: { attacker: '鉄槌を引き、足を開いて腰を落とし、掌を前に立てる', target: 'よろめいて下がり、目を開ける' },
      camera: { rig: 'foot-to-palm-crane', move: '足元→掌へ、遅い縦移動', keys: [
        k(0, ['stage', 0.55, 0.06, 0.95], ['attacker.head', 0.14, -0.14, 0], 52, 8), k(0.30, ['stage', 0.52, 0.06, 0.92], ['attacker.head', 0.14, -0.14, 0], 50, 7, 'outQuad'),
        k(0.70, ['attacker.footL', 0.30, 0.05, 1.00], ['attacker.footL', 0, 0.08, 0], 34, 0, 'inOutCubic'), k(1.30, ['attacker.pawL', 0.50, 0.04, 1.10], ['attacker.pawL', -0.10, -0.04, 0], 32, -3, 'inOutCubic')] },
      cues: [{ at: 0, type: 'vfx', key: 'flash', dur: 0.1, opacity: 0.4 }, { at: 0, type: 'vfx', key: 'impact_burst', anchor: 'target.head', size: 0.55, color: 0xffd0a0 }, { at: 0, type: 'shake', dur: 0.4, amp: 0.05 }, { at: 0, type: 'sfx', key: 'ult_hit_heavy' },
        { at: 0, type: 'vfx', key: 'rock_wall', offset: [WALL, 0, 0], width: 2.2, height: 1.7, depth: 0.5, breakAt: 7.9, crackLead: 0.7, hitHeight: 0.4, power: 1.2, life: 10.2 },
        { at: 0.6, type: 'sfx', key: 'silence_breath' }, { at: 1.1, type: 'vfx', key: 'dust', anchor: 'attacker.footL', count: 5, spread: 0.2 }] },
    { id: '02-shinkyaku', title: '震脚', start: 1.3, end: 2.2, intent: '地面の高さ。上がった前足が踏み下ろされ、ひびが相手の足元まで走る。相手が跳ねる',
      actorPose: { attacker: '前足を上げて踏み下ろし、さらに腰を落とす', target: '構え直したところを地面の揺れで跳ねる' },
      camera: { rig: 'ground-stomp-low', move: '固定。踏み下ろしで揺れる', keys: [
        k(1.30, ['stage', 0.36, 0.045, 0.80], ['attacker.footL', 0.05, 0.10, 0], 50, 7), k(2.20, ['stage', 0.40, 0.05, 0.76], ['attacker.footL', 0.12, 0.12, 0], 48, 5, 'outQuad')] },
      cues: [{ at: 1.70, type: 'shake', dur: 0.6, amp: 0.075 }, { at: 1.70, type: 'sfx', key: 'shinkyaku' }, { at: 1.70, type: 'vfx', key: 'shock_ring', anchor: 'attacker.footL', radius: 1.8, dur: 0.55, color: 0xffc090 }, { at: 1.70, type: 'vfx', key: 'dust', anchor: 'attacker.footL', count: 12, spread: 0.6 },
        { at: 1.70, type: 'vfx', key: 'debris', anchor: 'attacker.footL', count: 10, power: 1.3 }, { at: 1.72, type: 'vfx', key: 'ground_crack', from: [-0.02, 0.0], to: [0.70, 0.06], dur: 0.2, hold: 4.5, color: 0xff7a3a },
        { at: 1.72, type: 'vfx', key: 'ground_crack', from: [-0.02, 0.0], to: [0.35, 0.60], dur: 0.2, hold: 4.5, color: 0xff7a3a }, { at: 1.72, type: 'vfx', key: 'ground_crack', from: [-0.02, 0.0], to: [-0.50, 0.45], dur: 0.2, hold: 4.5, color: 0xff7a3a }] },
    { id: '03-strike-one', title: '第一撃・正拳', start: 2.2, end: 3.6, intent: '真横の中景。まっすぐの右正拳が腹に入り、止めのあと相手が足を滑らせて一歩ぶん下がる',
      actorPose: { attacker: '拳を引き絞る→踏み込んで右正拳→止め→構えへ戻る', target: '腹を打たれて折れる→止め→折れたまま後ろへ滑る' },
      camera: { rig: 'side-medium-punch-in', move: '真横。当たりで少し寄り、滑る相手に付いていく', keys: [
        k(2.20, ['stage', 0.30, 0.30, 1.95], ['stage', 0.30, 0.34, 0], 40, 0), k(2.50, ['stage', 0.36, 0.30, 1.80], ['target.chest', -0.16, -0.04, 0], 31, -3, 'inExpo'),
        k(2.90, ['stage', 0.38, 0.30, 1.72], ['target.chest', -0.16, -0.04, 0], 29, -4, 'linear'), k(3.60, ['stage', 0.62, 0.30, 1.95], ['target.chest', -0.24, -0.02, 0], 38, 0, 'outCubic')] },
      cues: [{ at: 2.50, type: 'hitstop', dur: 0.4, strength: 'heavy' }, { at: 2.50, type: 'vfx', key: 'flash', dur: 0.1, opacity: 0.4 }, { at: 2.50, type: 'vfx', key: 'impact_burst', anchor: 'attacker.pawR', offset: [0.06, 0, 0.04], size: 0.6, color: 0xffd8a8 },
        { at: 2.50, type: 'vfx', key: 'shock_ring', anchor: 'attacker.pawR', plane: 'camera', radius: 0.7, dur: 0.4 }, { at: 2.50, type: 'shake', dur: 0.4, amp: 0.05 }, { at: 2.50, type: 'sfx', key: 'ult_hit_strike1' },
        { at: 2.92, type: 'vfx', key: 'dust', anchor: 'target.root', count: 9, spread: 0.4, dur: 0.7 }, { at: 2.92, type: 'sfx', key: 'slide' }] },
    { id: '04-strike-two', title: '第二撃・裏拳', start: 3.6, end: 5.0, intent: '相手の肩越し。逆へ体を巻いたゴダンの裏拳が横から来る。止めのあと、飛ばされた相手を追って岩壁まで振る',
      actorPose: { attacker: '体を逆へ巻く→踏み込んで左の裏拳（横の軌道）→止め', target: '横殴りで体ごと持っていかれる→止め→飛ばされて岩壁に張り付く' },
      camera: { rig: 'over-target-shoulder-whip', move: '肩越し→当たりで止まる→飛ぶ相手を追って岩壁へ振る', keys: [
        k(3.60, ['target.head', 0.50, 0.10, 0.52], ['attacker.head', 0, -0.06, 0], 42, 6), k(4.00, ['target.head', 0.46, 0.08, 0.50], ['attacker.pawL', 0, 0, 0], 38, 9, 'inQuad'),
        k(4.45, ['target.head', 0.44, 0.08, 0.48], ['attacker.pawL', 0, 0, 0], 36, 10, 'linear'), k(4.80, ['stage', 1.05, 0.42, 1.75], ['target.chest', 0, 0, 0], 44, -4, 'outExpo'), k(5.00, ['stage', 1.08, 0.40, 1.70], ['target.chest', 0, 0, 0], 42, -2, 'outQuad')] },
      cues: [{ at: 4.00, type: 'hitstop', dur: 0.45, strength: 'heavy' }, { at: 4.00, type: 'vfx', key: 'flash', dur: 0.1, opacity: 0.45 }, { at: 4.00, type: 'vfx', key: 'impact_burst', anchor: 'target.head', offset: [-0.06, -0.04, 0.04], size: 0.7, rays: 14, color: 0xffd8a8 },
        { at: 4.00, type: 'vfx', key: 'slash_arc', anchor: 'attacker.pawL', size: 0.7, angle: 0, sweep: 1.4, color: 0xffb070 }, { at: 4.00, type: 'shake', dur: 0.45, amp: 0.06 }, { at: 4.00, type: 'sfx', key: 'ult_hit_strike2' },
        { at: 4.46, type: 'vfx', key: 'speed_lines', dur: 0.3, opacity: 0.4 }, { at: 4.80, type: 'shake', dur: 0.4, amp: 0.05 }, { at: 4.80, type: 'vfx', key: 'dust', anchor: 'target.chest', count: 12, spread: 0.5 }, { at: 4.80, type: 'vfx', key: 'debris', anchor: 'target.chest', count: 10, power: 1.2 }, { at: 4.80, type: 'sfx', key: 'wall_slam' }] },
    { id: '05-advance', title: '歩み寄る', start: 5.0, end: 6.6, intent: 'ゴダンの正面・低い位置から、歩みに合わせて後ろへ下がるカメラ。一歩ごとに画面が揺れる',
      actorPose: { attacker: '両拳を腰に引き、重い二歩で詰める', target: '岩壁からずり落ちて座り込む（画面外）' },
      camera: { rig: 'retreating-low-front', move: '被写体と同じ速さで後退', keys: [
        k(5.00, ['attacker.root', 0.95, 0.12, 0.34], ['attacker.head', 0, -0.10, 0], 38, 3), k(5.98, ['attacker.root', 0.90, 0.10, 0.30], ['attacker.head', 0, -0.10, 0], 40, 0, 'linear'), k(6.60, ['attacker.root', 0.72, 0.08, 0.26], ['attacker.head', 0, -0.12, 0], 44, -3, 'inOutQuad')] },
      cues: [{ at: 5.48, type: 'shake', dur: 0.3, amp: 0.04 }, { at: 5.48, type: 'vfx', key: 'dust', anchor: 'attacker.footR', count: 7, spread: 0.3 }, { at: 5.48, type: 'sfx', key: 'heavy_step' },
        { at: 5.98, type: 'shake', dur: 0.3, amp: 0.045 }, { at: 5.98, type: 'vfx', key: 'dust', anchor: 'attacker.footL', count: 7, spread: 0.3 }, { at: 5.98, type: 'sfx', key: 'heavy_step' }, { at: 6.2, type: 'vfx', key: 'aura', anchor: 'attacker.root', dur: 0.9, color: 0xff9050, height: 1.1, opacity: 0.24 }, { at: 6.2, type: 'sfx', key: 'charge_big' }] },
    { id: '06-strike-three', title: '第三撃・双掌', start: 6.6, end: 8.2, intent: '真横の引きでゴダン・相手・岩壁を1枚に入れ、当たりで一気に寄って最長の止め。止めが解けると同時に岩壁が砕け、引く',
      actorPose: { attacker: 'いちばん深く沈む→両の掌を押し込む→止めの間さらに押す', target: '両手をかざす→押し潰されて折れる→止め→岩壁ごと吹き飛ぶ' },
      camera: { rig: 'wide-side-crash-zoom', move: '引き→一気に寄る→砕ける瞬間に引く', keys: [
        k(6.60, ['stage', 1.45, 0.34, 2.75], ['stage', 1.62, 0.44, 0], 42, 0), k(7.14, ['stage', 1.48, 0.34, 2.70], ['stage', 1.66, 0.42, 0], 40, 0, 'linear'), k(7.26, ['stage', 1.50, 0.32, 2.55], ['target.chest', -0.16, -0.02, 0], 26, -5, 'outExpo'),
        k(7.90, ['stage', 1.50, 0.32, 2.45], ['target.chest', -0.16, -0.02, 0], 23, -6, 'linear'), k(8.20, ['stage', 1.70, 0.40, 2.95], ['stage', 2.30, 0.50, 0], 50, 3, 'outExpo')] },
      cues: [{ at: 7.20, type: 'hitstop', dur: 0.7, strength: 'max' }, { at: 7.20, type: 'vfx', key: 'flash', dur: 0.12, opacity: 0.5 }, { at: 7.20, type: 'vfx', key: 'dim', dur: 0.7, opacity: 0.34 }, { at: 7.20, type: 'vfx', key: 'impact_burst', anchor: 'target.chest', offset: [-0.05, 0, 0.05], size: 0.55, rays: 18, color: 0xffd8a8 },
        { at: 7.20, type: 'vfx', key: 'shock_ring', anchor: 'target.chest', plane: 'camera', radius: 1.2, dur: 0.6 }, { at: 7.20, type: 'shake', dur: 0.7, amp: 0.06 }, { at: 7.20, type: 'sfx', key: 'ult_hit_strike3' }, { at: 7.25, type: 'sfx', key: 'rock_cracking' },
        { at: 7.90, type: 'vfx', key: 'flash', dur: 0.16, opacity: 0.55 }, { at: 7.90, type: 'shake', dur: 0.9, amp: 0.10 }, { at: 7.90, type: 'sfx', key: 'rock_wall_break' }, { at: 7.90, type: 'vfx', key: 'shock_ring', offset: [WALL, 0, 0], radius: 3.0, dur: 0.7, color: 0xffc090 },
        { at: 7.90, type: 'vfx', key: 'dust', offset: [WALL, 0.2, 0], count: 22, spread: 1.4, dur: 1.4, size: 1.6 }, { at: 7.90, type: 'vfx', key: 'debris', offset: [WALL, 0.5, 0], count: 26, power: 3.0 }, { at: 7.92, type: 'vfx', key: 'speed_lines', dur: 0.3, opacity: 0.45 }] },
    { id: '07-collapse', title: '崩壊', start: 8.2, end: 9.0, intent: '岩壁の向こう側・高い位置からの広角。岩の破片と相手がこちらへ飛び、奥に掌を出したままのゴダン',
      actorPose: { attacker: '両の掌を出したまま動かない', target: '破片と一緒に飛ばされ、落ちて跳ねる' },
      camera: { rig: 'behind-wall-high-wide', move: '高い位置で固定。破片が手前へ抜ける', keys: [
        k(8.20, ['stage', 4.9, 1.55, 1.9], ['stage', 2.5, 0.35, 0], 50, -5), k(9.00, ['stage', 5.0, 1.45, 2.0], ['stage', 2.9, 0.25, 0], 48, -3, 'outQuad')] },
      cues: [{ at: 8.72, type: 'vfx', key: 'dust', anchor: 'target.root', count: 10, spread: 0.5 }, { at: 8.72, type: 'vfx', key: 'debris', anchor: 'target.root', count: 10, power: 1.3 }, { at: 8.72, type: 'shake', dur: 0.3, amp: 0.035 }, { at: 8.72, type: 'sfx', key: 'body_land' }, { at: 8.4, type: 'sfx', key: 'rubble_rain' }] },
    { id: '08-zanshin', title: '残心', start: 9.0, end: 10.2, intent: '正面の低い位置。粉塵の中でゆっくり立ち、拳を掌に収めて一礼',
      actorPose: { attacker: '立ち上がり、拳を掌に当てて小さく礼', target: '遠くで仰向け' },
      camera: { rig: 'low-front-pullback', move: '低い正面からゆっくり引く', keys: [
        k(9.00, ['stage', 1.95, 0.14, 1.05], ['attacker.chest', 0.14, 0.00, 0], 38, 4), k(10.2, ['stage', 2.10, 0.18, 1.40], ['attacker.chest', 0.20, 0.02, 0], 35, 0, 'outQuad')] },
      cues: [{ at: 9.40, type: 'sfx', key: 'finish_pose' }, { at: 9.35, type: 'caption', dur: 0.75, text: '山崩し', sub: 'ゴダン' }, { at: 9.0, type: 'vfx', key: 'dust', offset: [2.0, 0, -0.3], count: 12, spread: 1.0, dur: 1.2 }] },
  ],
  reducedMotion: { useShots: ['03-strike-one', '06-strike-three', '08-zanshin'], disable: ['shake', 'flash', 'speed_lines', 'dim'], note: '3 カットを固定カメラ（各ショットの最初のキー）で見せる。岩壁の破壊は残す。役者とキューの時刻は変えない' },
};
