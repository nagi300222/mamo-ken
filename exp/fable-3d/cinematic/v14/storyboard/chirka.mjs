// チルカ奥義「百面本命打ち」命中後ムービー 10.0秒版の絵コンテ（編集用の正本）。座標・単位・hitstop の扱いは moguzo.mjs の冒頭と同じ。
// 本人指定: 分身で撹乱し、多方向からの連撃、紫の爪痕と毒々しさ。その一方で顔アップなど可愛らしさも見せる。
// カメラの文法: 「可愛い ⇄ 毒」。正面の顔の寄りで始め、分身の輪をすり抜け、四方向の連撃は1発ごとに型を変える（あおり／俯瞰／横の振り）。
// 本体は「カメラのすぐ前に下から顔を出す」形で戻ってくる。分身 4 体は攻撃側 GLB の複製（半透明）で、当たり判定もダメージも持たない。
const D = 0.46, AX = -D / 2, TX = 0.36;
const k = (t, pos, look, fov, roll = 0, ease) => ({ t, pos, look, fov, roll, ease });
const ring = (deg, r = 0.85) => [TX - r * Math.cos(deg * Math.PI / 180), 0, r * Math.sin(deg * Math.PI / 180)];      // 0度 = 相手の正面(-X側)、90度 = カメラ側(+Z)
const face = (deg) => -deg;                         // 輪を左回りに走るときの rotY（進行方向を向く）
const run = (a0) => [0, 56, 112, 168, 225].map((d, i) => ({ t: 2.1 + i * 0.225, pos: ring(a0 + d), rotY: face(a0 + d), ease: 'linear' }));
const SPAWN = [AX - 0.27, 0, 0];
const clone = (a0, extra, vis, fade, segs) => ({ cloneOf: 'attacker', material: 'illusion', pivotHeight: 0.45, visible: vis, opacity: fade,
  segments: [{ start: 0, clip: 'cin_chirka_atk', clipStart: 1.42 }, { start: 2.1, clip: 'walk_f', loop: true, rate: 2.4 }, ...segs],
  root: [{ t: 0, pos: SPAWN, rotY: 90 }, { t: 1.42, pos: SPAWN, rotY: 90, ease: 'hold' }, { t: 2.1, pos: ring(a0), rotY: face(a0), ease: 'outCubic' }, ...run(a0).slice(1), ...extra] });
const FADE_IN = [{ t: 1.42, v: 0 }, { t: 1.62, v: 1 }];
const mark = (at, off, angle) => ({ at, type: 'vfx', key: 'claw_mark', offset: off, size: 0.5, angle, dur: 0.1, convergeAt: 7.02, convergeTo: 'target.chest', color: 0xb04cff });
const M1 = [TX + 0.02, 0.40, 0.22], M2 = [TX, 0.62, 0.02], M3 = [TX - 0.20, 0.26, 0.02], M4 = [TX + 0.16, 0.50, 0.10];
export default {
  characterId: 'chirka', displayName: '百面本命打ち', durationSeconds: 10.0,
  concept: '可愛い顔で油断させて分身と入れ替わり、四方向からの爪で紫の爪痕を重ねる。毒でふらつく相手の前に本体が顔を出し、爪痕を一つに集めて打ち抜く。',
  stage: { contactDistance: D, backdrop: 0x1a1232, fog: 0x1a1232, fogNear: 4, fogFar: 15, sky: 0xe6d8ff, ground: 0x2c2440, ambient: 1.35, key: 0xf0d8ff, keyPower: 2.5, rim: 0xb46cff, rimPower: 2.4,
    floor: 0x3b3454, mountain: 0x241c3c, post: 0x4a3a5c, accent: 0xdd9aff, accentCss: '#dd9aff', illusion: { color: 0xa860ff, opacity: 0.62, glow: 0.6 } },
  actors: {
    attacker: { pivotHeight: 0.45, visible: [[0, 3.05], [5.6, 10.01]],
      segments: [{ start: 0, clip: 'cin_chirka_atk' }, { start: 2.1, clip: 'walk_f', loop: true, rate: 2.4 }, { start: 3.0, clip: 'cin_chirka_atk', clipStart: 3.0 }],
      root: [{ t: 0, pos: [AX, 0, 0], rotY: 90 }, { t: 1.30, pos: [AX, 0, 0], rotY: 90, ease: 'hold' }, { t: 1.44, pos: [AX - 0.20, 0.13, 0], rotY: 90, ease: 'outQuad' }, { t: 1.60, pos: SPAWN, rotY: 90, ease: 'inQuad' },
        { t: 2.1, pos: ring(0), rotY: face(0), ease: 'inOutQuad' }, ...run(0).slice(1), { t: 3.05, pos: ring(240), rotY: face(240), ease: 'linear' },
        { t: 5.60, pos: [TX + 0.02, 0, 1.10], rotY: 0, ease: 'hold' }, { t: 6.40, pos: [TX + 0.02, 0, 1.10], rotY: 0, ease: 'hold' }, { t: 6.58, pos: [TX + 0.02, 0, 1.08], rotY: 180, ease: 'inOutQuad' }, { t: 7.05, pos: [TX + 0.02, 0, 1.08], rotY: 180, ease: 'hold' },
        { t: 7.30, pos: [TX + 0.02, 0.30, 0.34], rotY: 180, ease: 'inQuad' }, { t: 7.90, pos: [TX + 0.02, 0.36, 0.30], rotY: 180, ease: 'linear' }, { t: 8.45, pos: [TX + 0.30, 0, 0.10], rotY: 180, ease: 'inQuad' },
        { t: 8.60, pos: [TX + 0.30, 0, 0.10], rotY: 180, ease: 'hold' }, { t: 9.25, pos: [TX + 0.30, 0, 0.10], rotY: 105, ease: 'inOutCubic' }, { t: 10.0, pos: [TX + 0.30, 0, 0.10], rotY: 105 }] },
    target: { segments: [{ start: 0, clip: 'cinv_chirka' }], pivotHeight: 0.45, root: [
      { t: 0, pos: [D / 2, 0, 0], rotY: -90 }, { t: 0.45, pos: [TX, 0, 0], rotY: -90, ease: 'outCubic' }, { t: 2.1, pos: [TX, 0, 0], rotY: -90, ease: 'hold' },
      { t: 2.4, pos: [TX, 0, 0], rotY: -150, ease: 'inOutQuad' }, { t: 2.7, pos: [TX, 0, 0], rotY: -30, ease: 'inOutQuad' }, { t: 3.1, pos: [TX, 0, 0], rotY: 0, ease: 'inOutQuad' },
      { t: 3.30, pos: [TX, 0, 0], rotY: 0, ease: 'hold' }, { t: 3.60, pos: [TX, 0, -0.10], rotY: 40, ease: 'outCubic' }, { t: 4.10, pos: [TX, 0, -0.10], rotY: 20, ease: 'inOutQuad' },
      { t: 4.80, pos: [TX, 0, -0.08], rotY: -90, ease: 'inOutQuad' }, { t: 5.00, pos: [TX + 0.08, 0, -0.06], rotY: -100, ease: 'outCubic' }, { t: 5.10, pos: [TX + 0.06, 0.05, -0.06], rotY: 90, ease: 'inOutQuad' },
      { t: 5.28, pos: [TX + 0.02, 0.18, -0.04], rotY: 90, ease: 'outQuad' }, { t: 5.55, pos: [TX, 0, 0], rotY: 60, ease: 'inQuad' }, { t: 6.80, pos: [TX, 0, 0], rotY: 150, ease: 'inOutQuad' }, { t: 7.30, pos: [TX, 0, 0], rotY: 180, ease: 'inOutQuad' },
      { t: 7.90, pos: [TX, 0.03, -0.03], rotY: 180, ease: 'linear' }, { t: 8.30, pos: [TX - 0.35, 0.85, -0.70], rotY: 180, rotX: -200, ease: 'outQuad' }, { t: 8.62, pos: [TX - 0.55, 0, -1.15], rotY: 180, rotX: -360, ease: 'inQuad' },
      { t: 8.76, pos: [TX - 0.58, 0.12, -1.22], rotY: 180, rotX: -360, ease: 'outQuad' }, { t: 8.90, pos: [TX - 0.60, 0, -1.26], rotY: 180, rotX: -360, ease: 'inQuad' }, { t: 10.0, pos: [TX - 0.60, 0, -1.26], rotY: 180, rotX: -360 }] },
    // 分身A: カメラ側から地を這って引っかける（影引き爪）。当たり 3.30
    cloneA: clone(40, [{ t: 3.08, pos: [TX + 0.04, 0, 0.72], rotY: 180, ease: 'outQuad' }, { t: 3.30, pos: [TX + 0.04, 0, 0.42], rotY: 180, ease: 'inQuad' }, { t: 3.75, pos: [TX + 0.04, 0, 0.50], rotY: 180, ease: 'outQuad' }, { t: 4.4, pos: ring(70, 0.95), rotY: 200, ease: 'inOutQuad' }, { t: 7.0, pos: ring(70, 0.95), rotY: 200 }],
      [[1.42, 7.0]], [...FADE_IN, { t: 6.70, v: 1 }, { t: 6.98, v: 0 }], [{ start: 3.0, clip: 'idle', loop: true }, { start: 3.08, clip: 's3_v14', clipStart: 0 }, { start: 3.75, clip: 'idle', loop: true }]),
    // 分身B: 頭上から逆さに降って両手の爪。当たり 4.10
    cloneB: clone(-50, [{ t: 3.6, pos: [TX + 0.3, 0, -0.95], rotY: 0, ease: 'outQuad' }, { t: 3.80, pos: [TX + 0.3, 0, -0.95], rotY: 0, ease: 'hold' }, { t: 3.81, pos: [TX, 2.4, 0.02], rotY: 0, rotZ: 180, ease: 'hold' }, { t: 4.10, pos: [TX, 1.28, 0.02], rotY: 0, rotZ: 180, ease: 'inQuad' },
        { t: 4.30, pos: [TX, 1.30, 0.02], rotY: 0, rotZ: 180, ease: 'linear' }, { t: 4.70, pos: ring(-70, 0.95), rotY: -20, rotZ: 360, ease: 'inOutQuad' }, { t: 7.0, pos: ring(-70, 0.95), rotY: -20, rotZ: 360 }],
      [[1.42, 7.0]], [...FADE_IN, { t: 6.50, v: 1 }, { t: 6.78, v: 0 }], [{ start: 3.0, clip: 'idle', loop: true }, { start: 3.80, clip: 'cin_chirka_dive' }, { start: 4.70, clip: 'idle', loop: true }]),
    // 分身C: 相手の正面から低い貫手（だまし突き）。当たり 4.80
    cloneC: clone(130, [{ t: 3.6, pos: [TX - 0.80, 0, -0.10], rotY: 90, ease: 'outQuad' }, { t: 4.58, pos: [TX - 0.62, 0, -0.08], rotY: 90, ease: 'linear' }, { t: 4.80, pos: [TX - 0.50, 0, -0.08], rotY: 90, ease: 'inQuad' }, { t: 5.3, pos: [TX - 0.85, 0, -0.30], rotY: 80, ease: 'inOutQuad' }, { t: 7.0, pos: [TX - 0.85, 0, -0.30], rotY: 80 }],
      [[1.42, 7.0]], [...FADE_IN, { t: 6.30, v: 1 }, { t: 6.58, v: 0 }], [{ start: 3.0, clip: 'idle', loop: true }, { start: 4.60, clip: 's1_v14', clipStart: 0 }, { start: 5.20, clip: 'idle', loop: true }]),
    // 分身D: 背後から回転の跳ね爪で突き上げる。当たり 5.10
    cloneD: clone(-140, [{ t: 3.6, pos: [TX + 0.85, 0, -0.25], rotY: -90, ease: 'outQuad' }, { t: 4.90, pos: [TX + 0.48, 0, -0.06], rotY: -90, ease: 'inOutQuad' }, { t: 5.60, pos: [TX + 0.50, 0, -0.06], rotY: -90, ease: 'linear' }, { t: 6.0, pos: [TX + 0.90, 0, -0.35], rotY: -70, ease: 'inOutQuad' }, { t: 7.0, pos: [TX + 0.90, 0, -0.35], rotY: -70 }],
      [[1.42, 7.0]], [...FADE_IN, { t: 6.10, v: 1 }, { t: 6.38, v: 0 }], [{ start: 3.0, clip: 'idle', loop: true }, { start: 5.00, clip: 's2_v14', clipStart: 0 }, { start: 5.67, clip: 'idle', loop: true }]),
  },
  shots: [
    { id: '01-cute', title: '可愛い顔', start: 0, end: 1.3, intent: '正面寄りの顔アップ。顔を隠した手が下り、首をかしげてまばたき、反対へかしげて両手を頬に',
      actorPose: { attacker: '手を下ろす→首をかしげてまばたき→反対へかしげ、両手を頬へ', target: 'のけぞり→構え直して首をかしげる（画面外）' },
      camera: { rig: 'cute-face-front', move: '顔の正面寄りで、ゆっくり寄りながら傾きを戻す', keys: [
        k(0, ['attacker.head', 0.20, 0.03, 0.90], ['attacker.head', 0.02, -0.02, 0], 22, 8), k(0.40, ['attacker.head', 0.10, 0.03, 0.82], ['attacker.head', 0.02, -0.02, 0], 21, 4, 'outQuad'), k(1.30, ['attacker.head', -0.02, 0.02, 0.72], ['attacker.head', 0.02, -0.03, 0], 20, -4, 'inOutQuad')] },
      cues: [{ at: 0, type: 'vfx', key: 'flash', dur: 0.1, opacity: 0.4, color: 0xe8c8ff }, { at: 0, type: 'sfx', key: 'ult_hit_light' }, { at: 0.40, type: 'sfx', key: 'cute_chime' }, { at: 0.68, type: 'sfx', key: 'blink_pop' }, { at: 0.98, type: 'sfx', key: 'cute_chime_up' },
        { at: 0.70, type: 'vfx', key: 'sparks', anchor: 'attacker.head', offset: [0.10, 0.06, 0.10], count: 8, power: 0.3, up: 0.5, dur: 0.5, size: 0.45, color: 0xffc8f0 }] },
    { id: '02-split', title: '分かれる', start: 1.3, end: 2.1, intent: '相手の肩越しの引き。跳び下がったチルカが 5 体に分かれて扇に広がる',
      actorPose: { attacker: '跳び下がり、低く構える。分身 4 体が左右へ', target: '分身を目で追い始める' },
      camera: { rig: 'over-target-shoulder-wide', move: '相手の背後で少し持ち上がる', keys: [
        k(1.30, ['stage', 1.28, 0.52, 0.42], ['stage', -0.35, 0.25, 0], 46, -4), k(2.10, ['stage', 1.38, 0.66, 0.30], ['stage', -0.30, 0.20, 0], 44, 0, 'outQuad')] },
      cues: [{ at: 1.42, type: 'sfx', key: 'illusion_split' }, { at: 1.44, type: 'vfx', key: 'puff', anchor: 'attacker.root', offset: [0, 0.2, 0], count: 14 }, { at: 1.44, type: 'vfx', key: 'shock_ring', offset: SPAWN, radius: 0.9, dur: 0.45, color: 0xc890ff },
        { at: 1.5, type: 'vfx', key: 'poison_mist', offset: [TX, 0.3, 0], radius: 0.9, count: 18, dur: 5.6, color: 0x7a2cd8 }] },
    { id: '03-weave', title: '輪をすり抜ける', start: 2.1, end: 3.0, intent: '走る分身の輪の外から内へ、分身のあいだをすり抜けて相手の顔まで入る。相手は視線が泳ぐ',
      actorPose: { attacker: '分身と同じ走りで周回', target: '体ごと向きを変えながら目で追う' },
      camera: { rig: 'weave-through-ring', move: '輪の外→分身の間を抜けて内側へ。回り込みながら低く', keys: [
        k(2.10, ['target.root', -0.60, 0.50, 1.75], ['target.head', 0, -0.05, 0], 44, 8), k(2.50, ['target.root', -1.25, 0.34, 0.70], ['target.head', 0, -0.05, 0], 44, 4, 'linear'),
        k(2.80, ['target.root', -0.80, 0.26, -0.30], ['target.head', 0, -0.03, 0], 42, 0, 'linear'), k(3.00, ['target.root', -0.52, 0.24, -0.42], ['target.head', 0, -0.02, 0], 38, -4, 'outQuad')] },
      cues: [{ at: 2.1, type: 'sfx', key: 'footsteps_circle' }, { at: 2.15, type: 'vfx', key: 'speed_lines', dur: 0.8, opacity: 0.2, color: 0xd8b0ff }] },
    { id: '04-hit-side', title: '連撃1・横から', start: 3.0, end: 3.8, intent: '強く傾けた低いあおり。カメラ側から地を這う分身の爪が入り、爪痕が空間に残る',
      actorPose: { attacker: '画面外', target: 'カメラ側へ身構える→打たれて反対へ崩れる', cloneA: '地を這う踏み込みで引っかけ、引き戻す' },
      camera: { rig: 'dutch-low-attack', move: '分身に付いて相手へ振り、当たりで止まる', keys: [
        k(3.00, ['stage', TX + 0.95, 0.10, 1.35], ['cloneA.chest', 0, 0, 0], 46, -18), k(3.30, ['stage', TX + 0.85, 0.12, 1.15], ['target.chest', 0, -0.04, 0.10], 38, -14, 'inQuad'), k(3.48, ['stage', TX + 0.84, 0.12, 1.12], ['target.chest', 0, -0.04, 0.10], 36, -13, 'linear'), k(3.80, ['stage', TX + 0.80, 0.16, 1.20], ['target.chest', 0, 0, 0], 40, -8, 'outQuad')] },
      cues: [{ at: 3.08, type: 'sfx', key: 'claw_whoosh' }, { at: 3.30, type: 'hitstop', dur: 0.18, strength: 'light' }, mark(3.30, M1, -30), { at: 3.30, type: 'vfx', key: 'slash_arc', offset: M1, size: 0.6, angle: -30, color: 0xd9a6ff }, { at: 3.30, type: 'vfx', key: 'flash', dur: 0.08, opacity: 0.3, color: 0xd8b0ff },
        { at: 3.30, type: 'shake', dur: 0.25, amp: 0.035 }, { at: 3.30, type: 'sfx', key: 'ult_hit_claw' }] },
    { id: '05-hit-above', title: '連撃2・上から', start: 3.8, end: 4.5, intent: '真上の俯瞰を傾けて。逆さに降ってくる分身の両手の爪で、相手がひざから潰れる',
      actorPose: { attacker: '画面外', target: '見上げて頭をかばう→打たれてひざから潰れる', cloneB: '逆さまに落ちてきて両手の爪' },
      camera: { rig: 'rolled-overhead', move: '俯瞰のまま回転しつつ下がる', keys: [
        k(3.80, ['target.root', 0.02, 3.5, 0.30], ['target.head', 0, 0, 0], 40, 80), k(4.10, ['target.root', 0.02, 2.9, 0.34], ['target.head', 0, 0, 0], 42, 50, 'inQuad'), k(4.50, ['target.root', 0.02, 2.7, 0.36], ['target.head', 0, 0, 0], 42, 40, 'outQuad')] },
      cues: [{ at: 3.82, type: 'sfx', key: 'claw_whoosh' }, { at: 4.10, type: 'hitstop', dur: 0.18, strength: 'light' }, mark(4.10, M2, 85), { at: 4.10, type: 'vfx', key: 'slash_arc', offset: M2, size: 0.6, angle: 85, color: 0xd9a6ff }, { at: 4.10, type: 'vfx', key: 'flash', dur: 0.08, opacity: 0.3, color: 0xd8b0ff },
        { at: 4.10, type: 'shake', dur: 0.25, amp: 0.04 }, { at: 4.10, type: 'sfx', key: 'ult_hit_claw' }, { at: 4.12, type: 'vfx', key: 'shock_ring', anchor: 'target.root', radius: 0.8, dur: 0.35, color: 0xb070ff }] },
    { id: '06-hit-low-rising', title: '連撃3・4 下と突き上げ', start: 4.5, end: 5.4, intent: '真横の低い位置。正面からの低い貫手で折れ、すぐ背後からの跳ね爪で突き上げられる。カメラは左右へ振られる',
      actorPose: { attacker: '画面外', target: '腹を突かれて折れる→背後から突き上げられて浮く', cloneC: '正面から低い貫手', cloneD: '背後から回転の跳ね爪' },
      camera: { rig: 'side-whip-pair', move: '左（分身C）→相手→右（分身D）へ素早く振る', keys: [
        k(4.50, ['stage', TX - 0.30, 0.20, 1.60], ['cloneC.chest', 0.10, 0, 0], 40, 8), k(4.80, ['stage', TX - 0.10, 0.20, 1.50], ['target.chest', -0.06, -0.06, 0], 36, 10, 'inQuad'), k(4.95, ['stage', TX - 0.08, 0.20, 1.48], ['target.chest', -0.06, -0.06, 0], 35, 10, 'linear'),
        k(5.10, ['stage', TX + 0.20, 0.18, 1.50], ['target.chest', 0.06, 0.02, 0], 36, -10, 'inOutQuad'), k(5.40, ['stage', TX + 0.24, 0.20, 1.55], ['target.chest', 0.04, 0.06, 0], 38, -12, 'outQuad')] },
      cues: [{ at: 4.62, type: 'sfx', key: 'claw_whoosh' }, { at: 4.80, type: 'hitstop', dur: 0.15, strength: 'light' }, mark(4.80, M3, 10), { at: 4.80, type: 'vfx', key: 'slash_arc', offset: M3, size: 0.55, angle: 10, color: 0xd9a6ff }, { at: 4.80, type: 'shake', dur: 0.2, amp: 0.035 }, { at: 4.80, type: 'sfx', key: 'ult_hit_claw' },
        { at: 5.10, type: 'hitstop', dur: 0.18, strength: 'light' }, mark(5.10, M4, -70), { at: 5.10, type: 'vfx', key: 'slash_arc', offset: M4, size: 0.65, angle: -70, sweep: 1.5, color: 0xd9a6ff }, { at: 5.10, type: 'vfx', key: 'flash', dur: 0.08, opacity: 0.3, color: 0xd8b0ff },
        { at: 5.10, type: 'shake', dur: 0.25, amp: 0.045 }, { at: 5.10, type: 'sfx', key: 'ult_hit_claw' }] },
    { id: '07-peekaboo', title: '本体はここ', start: 5.4, end: 6.6, intent: '四つの爪痕と毒の霧の中でふらつく相手へゆっくり寄る。そのレンズのすぐ前に、下から本体が顔を出して片目をつぶる。分身が一体ずつ霧に戻る',
      actorPose: { attacker: 'カメラの前に下から顔を出し、両手を頬に、片目をつぶる→振り向く', target: '毒でふらつく。左右に揺れ、目は半開き', cloneD: '霧に戻る', cloneC: '霧に戻る' },
      camera: { rig: 'slow-push-foreground-reveal', move: '相手へのゆっくりした寄り。手前に本体が入ってくる', keys: [
        k(5.40, ['stage', TX + 0.10, 0.36, 2.55], ['target.chest', 0, 0.02, 0], 32, 3), k(6.00, ['stage', TX + 0.08, 0.36, 2.35], ['stage', TX + 0.03, 0.34, 0.6], 31, 0, 'inOutQuad'), k(6.60, ['stage', TX + 0.06, 0.36, 2.25], ['stage', TX + 0.03, 0.34, 0.6], 30, -3, 'inOutQuad')] },
      cues: [{ at: 5.5, type: 'vfx', key: 'poison_mist', anchor: 'target.chest', radius: 0.3, count: 16, dur: 1.9, color: 0xa040ff }, { at: 5.5, type: 'sfx', key: 'poison_bubble' }, { at: 6.00, type: 'sfx', key: 'peekaboo_pop' }, { at: 6.28, type: 'sfx', key: 'wink_chime' },
        { at: 6.28, type: 'vfx', key: 'sparks', anchor: 'attacker.head', offset: [0.08, 0.04, 0.1], count: 8, power: 0.3, up: 0.5, dur: 0.5, size: 0.45, color: 0xffc8f0 }, { at: 6.12, type: 'vfx', key: 'puff', anchor: 'cloneD.chest', count: 10 }, { at: 6.32, type: 'vfx', key: 'puff', anchor: 'cloneC.chest', count: 10 }, { at: 6.12, type: 'sfx', key: 'illusion_vanish' }] },
    { id: '08-real', title: '本命', start: 6.6, end: 8.4, intent: '本体の背後・地面の高さ。尻を振って狙い、爪痕が相手の一点に集まった瞬間に回転の跳ね爪。長い止めのあと相手が奥へ飛ぶ',
      actorPose: { attacker: '四つ足で尻を振る→一回転しながら跳ね爪→止め→着地', target: '振り向きかける→背中を打たれて弓なり→止め→奥へ飛ばされて落ちる', cloneA: '霧に戻る', cloneB: '霧に戻る' },
      camera: { rig: 'behind-pounce-to-impact', move: '地面すれすれで待つ→跳躍に合わせて寄り上がる→飛ぶ相手を追う', keys: [
        k(6.60, ['stage', TX + 0.50, 0.08, 1.95], ['target.pelvis', 0, 0, 0], 40, 5), k(7.05, ['stage', TX + 0.46, 0.08, 1.88], ['target.pelvis', 0, 0, 0], 38, 3, 'linear'),
        k(7.32, ['stage', TX + 0.85, 0.30, 1.10], ['target.chest', 0, 0, 0.12], 30, -10, 'inQuad'), k(7.90, ['stage', TX + 0.82, 0.30, 1.02], ['target.chest', 0, 0, 0.12], 27, -12, 'linear'), k(8.40, ['stage', TX + 0.95, 0.40, 1.45], ['target.pelvis', 0, 0, 0], 40, -4, 'outCubic')] },
      cues: [{ at: 6.6, type: 'sfx', key: 'tension_hold' }, { at: 6.72, type: 'vfx', key: 'puff', anchor: 'cloneB.chest', count: 10 }, { at: 6.92, type: 'vfx', key: 'puff', anchor: 'cloneA.chest', count: 10 }, { at: 7.02, type: 'sfx', key: 'marks_converge' }, { at: 7.05, type: 'sfx', key: 'pounce' },
        { at: 7.06, type: 'vfx', key: 'dust', anchor: 'attacker.root', count: 8, spread: 0.35 }, { at: 7.30, type: 'hitstop', dur: 0.6, strength: 'max' }, { at: 7.30, type: 'vfx', key: 'dim', dur: 0.6, opacity: 0.34, color: 0x0a0418 }, { at: 7.30, type: 'vfx', key: 'flash', dur: 0.1, opacity: 0.45, color: 0xf0d0ff },
        { at: 7.30, type: 'vfx', key: 'impact_burst', anchor: 'target.chest', size: 0.6, rays: 16, color: 0xf6dcff }, { at: 7.30, type: 'vfx', key: 'claw_mark', anchor: 'target.chest', offset: [0, 0, 0.14], size: 0.6, angle: -40, dur: 0.1, hold: 0.9, color: 0xc060ff },
        { at: 7.30, type: 'vfx', key: 'slash_arc', anchor: 'target.chest', size: 0.7, angle: 60, sweep: 1.6, color: 0xe2b4ff }, { at: 7.30, type: 'shake', dur: 0.6, amp: 0.06 }, { at: 7.30, type: 'sfx', key: 'ult_hit_slash' },
        { at: 7.90, type: 'vfx', key: 'speed_lines', dur: 0.3, opacity: 0.45, color: 0xf0d8ff }, { at: 7.90, type: 'sfx', key: 'launch' }] },
    { id: '09-zanshin', title: '残心', start: 8.4, end: 10.0, intent: '傾けた正面。奥で相手が落ち、チルカはこちらへ向き直って爪をなめ、片目をつぶる',
      actorPose: { attacker: '着地→向き直って爪をなめ、尻尾を振り、片目をつぶる', target: '奥で落ちて跳ね、仰向けで止まる' },
      camera: { rig: 'dutch-front-push', move: '傾けたままゆっくり寄る', keys: [
        k(8.40, ['stage', TX + 0.62, 0.20, 1.60], ['attacker.chest', -0.10, 0.02, 0], 36, -9), k(10.0, ['stage', TX + 0.56, 0.24, 1.28], ['attacker.chest', -0.06, 0.05, 0], 31, -7, 'inOutQuad')] },
      cues: [{ at: 8.62, type: 'vfx', key: 'dust', anchor: 'target.root', count: 8, spread: 0.45 }, { at: 8.62, type: 'sfx', key: 'body_land' }, { at: 8.7, type: 'vfx', key: 'poison_mist', anchor: 'target.chest', radius: 0.3, count: 12, dur: 1.3, color: 0xa040ff },
        { at: 9.20, type: 'caption', dur: 0.75, text: '百面本命打ち', sub: 'チルカ' }, { at: 9.25, type: 'sfx', key: 'finish_pose' }, { at: 9.70, type: 'sfx', key: 'wink_chime' }] },
  ],
  reducedMotion: { useShots: ['01-cute', '08-real', '09-zanshin'], disable: ['shake', 'flash', 'speed_lines', 'dim'], note: '3 カットを固定カメラ（各ショットの最初のキー）で見せる。分身と爪痕は残す。役者とキューの時刻は変えない' },
};
