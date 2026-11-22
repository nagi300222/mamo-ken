// ダークモグゾー奥義「暗連・黒天烈掌」命中後ムービー 10.0秒版の絵コンテ（編集用の正本）。座標・単位・hitstop の扱いは moguzo.mjs の冒頭と同じ。
// 本人指定: 闇のオーラで連撃し、最後に重い一撃。ラストは後ろ姿。
// カメラの文法: 「速 → 静 → 重」。連打は 2 発ごとに反対側へ切り替える 4 カット（各 0.7〜0.8 秒）。そこから一転して 1.6 秒の動かない溜め、打ち下ろしで一気に寄る。最後は相手越しの後ろ姿。
// 暗いが見える: 闇は紫の霧と弱い dim で作り、打撃のたびに紫の光で輪郭を出す。真っ暗な点滅にはしない。モグゾー（地面・拳を空へ・正面の決め）と逆に、こちらは背を向けて終わる。
const D = 0.46, AX = -D / 2, TX = 0.30;
const k = (t, pos, look, fov, roll = 0, ease) => ({ t, pos, look, fov, roll, ease });
const HITS = [1.40, 1.72, 2.20, 2.52, 2.98, 3.24, 3.68, 3.96];
const hit = (at, i) => [{ at, type: 'hitstop', dur: 0.1, strength: 'light' }, { at, type: 'vfx', key: 'impact_burst', anchor: 'target.chest', offset: [-0.05, [0.02, -0.02, 0.12, -0.14, 0.2, 0.1, 0.06, 0][i], 0.06], size: 0.42, color: 0xd8a8ff }, { at, type: 'vfx', key: 'flash', dur: 0.07, opacity: 0.28, color: 0xb070ff },
  { at, type: 'shake', dur: 0.14, amp: 0.03 }, { at, type: 'sfx', key: 'ult_hit_rapid' }];
export default {
  characterId: 'dark_moguzo', displayName: '暗連・黒天烈掌', durationSeconds: 10.0,
  concept: '喉をつかんだ間合いのまま、闇の中で八発。揺れる相手の前でゆっくり拳を沈め、真上から一撃。倒れた相手を残して背を向ける。',
  stage: { contactDistance: D, backdrop: 0x100818, fog: 0x100818, fogNear: 4, fogFar: 14, sky: 0xc8a8ff, ground: 0x160c22, ambient: 1.0, key: 0xe0c8ff, keyPower: 2.0, rim: 0x9a40ff, rimPower: 3.0,
    floor: 0x2a2038, mountain: 0x160e22, post: 0x30223e, accent: 0xbe78ff, accentCss: '#be78ff' },
  actors: {
    attacker: { segments: [{ start: 0, clip: 'cin_dark_moguzo_atk' }], pivotHeight: 0.45, root: [
      { t: 0, pos: [AX, 0, 0], rotY: 90 }, { t: 1.20, pos: [AX + 0.02, 0, 0], rotY: 90, ease: 'linear' }, { t: 4.20, pos: [AX + 0.10, 0, 0], rotY: 90, ease: 'linear' }, { t: 6.20, pos: [AX + 0.06, 0, 0], rotY: 90, ease: 'inOutQuad' },
      { t: 6.30, pos: [AX + 0.16, 0, 0], rotY: 90, ease: 'inQuad' }, { t: 8.40, pos: [AX + 0.16, 0, 0], rotY: 90, ease: 'hold' }, { t: 8.80, pos: [AX + 0.16, 0, 0.02], rotY: 196, ease: 'inOutCubic' }, { t: 9.70, pos: [AX + 0.02, 0, -0.50], rotY: 196, ease: 'linear' }, { t: 10.0, pos: [AX + 0.02, 0, -0.50], rotY: 196 }] },
    target: { segments: [{ start: 0, clip: 'cinv_dark_moguzo' }], pivotHeight: 0.45, root: [
      { t: 0, pos: [D / 2, 0, 0], rotY: -90 }, { t: 1.20, pos: [TX, 0, 0], rotY: -90, ease: 'outCubic' }, ...HITS.map((t, i) => ({ t: t + 0.12, pos: [TX + 0.02 * (i + 1), 0, [0.03, -0.03, 0.04, 0, 0, -0.04, 0.05, 0][i]], rotY: -90, ease: 'outCubic' })),
      { t: 6.30, pos: [TX + 0.18, 0, 0], rotY: -90, ease: 'linear' }, { t: 7.00, pos: [TX + 0.20, 0, 0], rotY: -90, ease: 'linear' }, { t: 10.0, pos: [TX + 0.20, 0, 0], rotY: -90 }] },
  },
  shots: [
    { id: '01-darkness', title: '闇が広がる', start: 0, end: 1.2, intent: '喉をつかんだ手元から、ダークモグゾーの目へ。足元から紫の霧が広がり、画面の周りが落ちる',
      actorPose: { attacker: '喉をつかんだまま腰を落とす', target: 'のけぞったまま動けない' },
      camera: { rig: 'grip-to-eyes', move: 'つかんだ手から目へ寄せる', keys: [k(0, ['target.chest', -0.30, 0.06, 1.15], ['target.chest', -0.14, 0.04, 0], 34, -6), k(0.40, ['attacker.pawR', -0.10, 0.02, 0.70], ['attacker.pawR', 0, 0, 0], 28, 4, 'outExpo'), k(1.20, ['attacker.head', 0.30, 0.02, 0.62], ['attacker.head', 0.02, 0, 0], 24, 8, 'inOutCubic')] },
      cues: [{ at: 0, type: 'vfx', key: 'flash', dur: 0.1, opacity: 0.35, color: 0xb070ff }, { at: 0, type: 'sfx', key: 'grab' }, { at: 0, type: 'shake', dur: 0.2, amp: 0.03 }, { at: 0.2, type: 'vfx', key: 'dim', dur: 4.1, opacity: 0.24, color: 0x06020c },
        { at: 0.2, type: 'vfx', key: 'poison_mist', offset: [0.05, 0.3, 0], radius: 0.8, count: 22, dur: 4.2, color: 0x7a2cd8 }, { at: 0.3, type: 'vfx', key: 'shock_ring', anchor: 'attacker.root', radius: 1.6, dur: 0.8, color: 0x9a40ff }, { at: 0.3, type: 'sfx', key: 'dark_aura' }] },
    { id: '02-rush-a', title: '連打 1・2', start: 1.2, end: 2.0, intent: '手前側の寄り。左突き、右突き。相手が左右へ弾かれる',
      actorPose: { attacker: '左突き→右突き', target: '左へ、右へ弾かれる' },
      camera: { rig: 'rush-near-side', move: '固定の寄り。打撃で揺れる', keys: [k(1.20, ['stage', 0.06, 0.34, 0.95], ['target.chest', -0.12, 0, 0], 34, -8), k(2.00, ['stage', 0.08, 0.34, 0.90], ['target.chest', -0.12, 0, 0], 33, -8, 'linear')] },
      cues: [...hit(HITS[0], 0), ...hit(HITS[1], 1)] },
    { id: '03-rush-b', title: '連打 3・4', start: 2.0, end: 2.8, intent: '反対側（奥側）へ切り替え、傾きも逆。左の鉤突き、右の低い突き。相手が折れる',
      actorPose: { attacker: '左の鉤突き→沈んで右の低い突き', target: '横へ流れる→腹を突かれて折れる' },
      camera: { rig: 'rush-far-side', move: '奥側から。固定の寄り', keys: [k(2.00, ['stage', 0.10, 0.30, -0.95], ['target.chest', -0.12, -0.02, 0], 34, 9), k(2.80, ['stage', 0.12, 0.28, -0.90], ['target.chest', -0.12, -0.04, 0], 33, 9, 'linear')] },
      cues: [...hit(HITS[2], 2), ...hit(HITS[3], 3)] },
    { id: '04-rush-c', title: '連打 5・6', start: 2.8, end: 3.5, intent: '足元からのあおり。突き上げで相手のあごが跳ね、右の鉤で横へ',
      actorPose: { attacker: '左の突き上げ→右の鉤突き', target: 'あごを跳ね上げられる→横へ弾かれる' },
      camera: { rig: 'rush-low-up', move: '足元から見上げる', keys: [k(2.80, ['stage', 0.20, 0.06, 0.62], ['target.head', -0.14, -0.10, 0], 50, -12), k(3.50, ['stage', 0.22, 0.07, 0.58], ['target.head', -0.14, -0.10, 0], 48, -12, 'linear')] },
      cues: [...hit(HITS[4], 4), ...hit(HITS[5], 5)] },
    { id: '05-rush-d', title: '連打 7・8', start: 3.5, end: 4.2, intent: '真上から。左の裏拳、右の突き。足元の霧が打撃のたびに輪になって散る',
      actorPose: { attacker: '左の裏拳→右突き', target: '体が回りかけ、最後の一発でのけぞる' },
      camera: { rig: 'rush-overhead', move: '真上で少し回る', keys: [k(3.50, ['stage', 0.12, 2.6, 0.25], ['stage', 0.12, 0.3, 0], 40, 20), k(4.20, ['stage', 0.12, 2.5, 0.25], ['stage', 0.12, 0.3, 0], 40, 34, 'linear')] },
      cues: [...hit(HITS[6], 6), ...hit(HITS[7], 7), { at: HITS[6], type: 'vfx', key: 'shock_ring', anchor: 'target.root', radius: 0.9, dur: 0.3, color: 0x9a40ff }, { at: HITS[7], type: 'vfx', key: 'shock_ring', anchor: 'target.root', radius: 1.2, dur: 0.35, color: 0xbe78ff }] },
    { id: '06-sink', title: '沈む拳', start: 4.2, end: 5.8, intent: 'ここで止まる。引いた拳と肩の寄り。拳がゆっくり高く上がり、腰が沈む。奥で相手が立ったまま揺れる。音は消す',
      actorPose: { attacker: '拳を後ろへ引き、ゆっくり腰を沈める', target: '立ったまま左右に揺れる' },
      camera: { rig: 'fist-shoulder-still', move: '動かない。拳にだけごくわずか寄る', keys: [k(4.20, ['attacker.pawR', -0.55, 0.02, 1.05], ['attacker.pawR', 0.22, -0.06, 0], 32, 4), k(5.80, ['attacker.pawR', -0.50, 0.02, 0.96], ['attacker.pawR', 0.22, -0.06, 0], 30, 4, 'linear')] },
      cues: [{ at: 4.3, type: 'sfx', key: 'silence' }, { at: 4.6, type: 'vfx', key: 'aura', anchor: 'attacker.root', dur: 1.5, color: 0x8a30ff, height: 0.7, opacity: 0.12 }, { at: 5.0, type: 'vfx', key: 'sparks', anchor: 'attacker.pawR', count: 10, power: 0.3, up: 0.8, dur: 0.8, size: 0.5, color: 0xc890ff }, { at: 5.2, type: 'sfx', key: 'charge_low' }] },
    { id: '07-heavy', title: '黒天', start: 5.8, end: 7.4, intent: '低い引きで二人を入れ、踏み込みと同時に一気に寄る。真上からの打ち下ろしで相手がひざから地面へ。いちばん長い止め',
      actorPose: { attacker: '踏み込んで真上から打ち下ろす→止め', target: 'ひざから潰れる→止め→地面に伏す' },
      camera: { rig: 'low-wide-to-crash', move: '低い引き→当たりで寄る→止めの間は動かない', keys: [k(5.80, ['stage', 0.30, 0.10, 2.20], ['stage', 0.12, 0.36, 0], 42, 0), k(6.24, ['stage', 0.30, 0.10, 2.14], ['stage', 0.14, 0.34, 0], 40, 0, 'linear'), k(6.34, ['stage', 0.40, 0.14, 1.50], ['target.chest', -0.10, -0.04, 0], 28, -8, 'outExpo'), k(7.00, ['stage', 0.40, 0.14, 1.44], ['target.chest', -0.10, -0.04, 0], 26, -9, 'linear'), k(7.40, ['stage', 0.36, 0.12, 1.80], ['stage', 0.30, 0.20, 0], 36, -4, 'outCubic')] },
      cues: [{ at: 6.30, type: 'hitstop', dur: 0.7, strength: 'max' }, { at: 6.30, type: 'vfx', key: 'dim', dur: 0.7, opacity: 0.36, color: 0x000000 }, { at: 6.30, type: 'vfx', key: 'flash', dur: 0.12, opacity: 0.5, color: 0xd8a8ff }, { at: 6.30, type: 'vfx', key: 'impact_burst', anchor: 'target.head', offset: [-0.04, 0.02, 0.06], size: 0.8, rays: 18, color: 0xe6c8ff },
        { at: 6.30, type: 'vfx', key: 'shock_ring', anchor: 'target.root', radius: 2.4, dur: 0.7, color: 0xbe78ff }, { at: 6.30, type: 'shake', dur: 0.7, amp: 0.08 }, { at: 6.30, type: 'sfx', key: 'ult_hit_heavy_dark' },
        { at: 6.32, type: 'vfx', key: 'ground_crack', from: [TX + 0.18, 0], to: [1.20, 0.40], dur: 0.2, hold: 2.6, color: 0x9a40ff }, { at: 6.32, type: 'vfx', key: 'ground_crack', from: [TX + 0.18, 0], to: [0.10, -0.80], dur: 0.2, hold: 2.6, color: 0x9a40ff },
        { at: 6.32, type: 'vfx', key: 'ground_crack', from: [TX + 0.18, 0], to: [1.10, -0.50], dur: 0.2, hold: 2.6, color: 0x9a40ff }, { at: 7.00, type: 'sfx', key: 'hitstop_release' }, { at: 7.30, type: 'vfx', key: 'dust', anchor: 'target.root', count: 10, spread: 0.5, color: 0x4a3860 }] },
    { id: '08-afterglow', title: '残光', start: 7.4, end: 8.6, intent: '倒れた相手の上をゆっくり上がるカメラ。地面のひびから黒紫の光が細く立ち、ダークモグゾーが立ち上がる',
      actorPose: { attacker: '打ち下ろしたまま→ゆっくり立つ', target: '地面に伏して動かない' },
      camera: { rig: 'slow-crane-up', move: 'ゆっくり上昇', keys: [k(7.40, ['stage', 0.95, 0.10, 0.95], ['target.chest', 0, 0.02, 0], 40, 5), k(8.60, ['stage', 0.90, 0.62, 1.05], ['stage', 0.30, 0.26, 0], 40, 2, 'inOutQuad')] },
      cues: [{ at: 7.5, type: 'vfx', key: 'energy_pillar', offset: [TX + 0.18, 0, 0], height: 3.5, radius: 0.10, dur: 1.4, color: 0x8a30ff }, { at: 7.5, type: 'vfx', key: 'poison_mist', anchor: 'target.chest', radius: 0.35, count: 14, dur: 2.4, color: 0x7a2cd8 }, { at: 7.5, type: 'sfx', key: 'afterglow_hum' }] },
    { id: '09-back', title: '後ろ姿', start: 8.6, end: 10.0, intent: '倒れた相手を手前に置いた低い位置。背を向けて三歩あるき、止まる。振り返らない。ハチマキの端だけが揺れる',
      actorPose: { attacker: '背を向けて三歩あるき、止まって目を閉じる', target: '手前で伏したまま' },
      camera: { rig: 'over-fallen-to-back', move: '固定。遠ざかる背中を見送る', keys: [k(8.60, ['stage', 0.70, 0.12, 1.25], ['attacker.chest', 0, 0.04, 0], 40, -3), k(10.0, ['stage', 0.72, 0.13, 1.30], ['attacker.chest', 0, 0.06, 0], 38, -2, 'linear')] },
      cues: [{ at: 8.80, type: 'sfx', key: 'step_slow' }, { at: 9.10, type: 'sfx', key: 'step_slow' }, { at: 9.40, type: 'sfx', key: 'step_slow' }, { at: 9.70, type: 'sfx', key: 'finish_pose_quiet' }, { at: 9.20, type: 'caption', dur: 0.7, text: '暗連・黒天烈掌', sub: 'ダークモグゾー' }] },
  ],
  reducedMotion: { useShots: ['02-rush-a', '07-heavy', '09-back'], disable: ['shake', 'flash', 'speed_lines'], note: '3 カットを固定カメラ（各ショットの最初のキー）で見せる。打撃ごとの紫の光は消し、暗転（dim）は弱めて残す。役者とキューの時刻は変えない' },
};
