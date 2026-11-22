// ピスケ奥義「音速連咆」命中後ムービー 10.0秒版の絵コンテ（編集用の正本）。座標・単位・hitstop の扱いは moguzo.mjs の冒頭と同じ。
// 本人指定: 蹴り突撃の反復、最後はサマーソルトで締める。速さ最優先。
// カメラの文法: 「速さ」。突撃ごとにカメラの置き場所を変える（並走／相手越しの奥行き／地面の滑走／真上）。六回の突撃のあとに一度だけ遅い顔の寄りを置き、サマーソルトを際立たせる。
const D = 0.46, AX = -D / 2;
const k = (t, pos, look, fov, roll = 0, ease) => ({ t, pos, look, fov, roll, ease });
const ry = (dx, dz) => Math.round(Math.atan2(dx, dz) * 180 / Math.PI);          // 進行方向 → rotY
const C1 = [0.24, 0.30, 0], C2 = [0.44, 0.30, -0.12], C3 = [0.24, 0, 0.10], C4 = [0.38, 0.78, -0.04], C5 = [0.34, 0.92, 0.04], C6 = [0.40, 1.02, 0];      // 六回の当たり位置
const P1 = [-0.30, 0, 0], P2 = [1.50, 0, 0], P3 = [1.30, 0, -1.30], P4 = [-0.60, 0, 1.10], P5 = [0.90, 0, -0.80], P6 = [-0.55, 0, 0.70], P7 = [1.10, 0, -0.50], P8 = [-0.55, 0, 0.20];
const streak = (at, a, b, y = 0.3) => ({ at, type: 'vfx', key: 'streak', from: [a[0], a[1] + y, a[2]], to: [b[0], b[1] + y, b[2]], dur: 0.7, width: 0.07, color: 0x9fe6ff });
const hit = (at, pos, size = 0.5) => [{ at, type: 'vfx', key: 'impact_burst', offset: [pos[0], pos[1] + 0.25, pos[2] + 0.05], size, color: 0xd8f6ff }, { at, type: 'shake', dur: 0.2, amp: 0.035 }, { at, type: 'sfx', key: 'ult_hit_kick' }, { at, type: 'hitstop', dur: 0.1, strength: 'light' }];
export default {
  characterId: 'pisuke', displayName: '音速連咆', durationSeconds: 10.0,
  concept: '短く吠えて踏み切り、六方向から蹴り抜ける。宙に浮かせた相手の真下で止まり、後方宙返りの蹴り上げで締める。',
  stage: { contactDistance: D, backdrop: 0x12283a, fog: 0x12283a, fogNear: 5, fogFar: 18, sky: 0xd8f0ff, ground: 0x24384a, ambient: 1.4, key: 0xe8f6ff, keyPower: 2.7, rim: 0x5cc8ff, rimPower: 2.2,
    floor: 0x35505f, mountain: 0x1c3446, post: 0x3a5668, accent: 0x86dcff, accentCss: '#86dcff', clouds: [{ y: 2.4, count: 6, radius: 2.4, x: 0.4, color: 0xbfe8ff, opacity: 0.14 }] },
  actors: {
    attacker: { segments: [{ start: 0, clip: 'cin_pisuke_atk' }], pivotHeight: 0.45, root: [
      { t: 0, pos: [AX, 0, 0], rotY: 90 }, { t: 0.36, pos: P1, rotY: 90, ease: 'outQuad' }, { t: 0.92, pos: P1, rotY: 90, ease: 'hold' },
      { t: 1.20, pos: C1, rotY: 90, ease: 'inQuad' }, { t: 1.44, pos: P2, rotY: 90, ease: 'linear' }, { t: 1.80, pos: P3, rotY: ry(P4[0] - P3[0], P4[2] - P3[2]), ease: 'inOutQuad' },
      { t: 2.15, pos: C2, rotY: ry(P4[0] - P3[0], P4[2] - P3[2]), ease: 'inQuad' }, { t: 2.42, pos: P4, rotY: ry(P4[0] - P3[0], P4[2] - P3[2]), ease: 'linear' }, { t: 2.62, pos: P4, rotY: ry(P5[0] - P4[0], P5[2] - P4[2]), ease: 'inOutQuad' },
      { t: 2.95, pos: C3, rotY: ry(P5[0] - P4[0], P5[2] - P4[2]), ease: 'inQuad' }, { t: 3.30, pos: P5, rotY: ry(P5[0] - P4[0], P5[2] - P4[2]), ease: 'outQuad' }, { t: 3.42, pos: P5, rotY: ry(P6[0] - P5[0], P6[2] - P5[2]), ease: 'inOutQuad' },
      { t: 3.60, pos: C4, rotY: ry(P6[0] - P5[0], P6[2] - P5[2]), ease: 'linear' }, { t: 3.78, pos: [P6[0], 0.2, P6[2]], rotY: ry(P6[0] - P5[0], P6[2] - P5[2]), ease: 'linear' }, { t: 3.80, pos: [P6[0], 0.2, P6[2]], rotY: ry(P7[0] - P6[0], P7[2] - P6[2]), ease: 'hold' },
      { t: 3.90, pos: C5, rotY: ry(P7[0] - P6[0], P7[2] - P6[2]), ease: 'linear' }, { t: 4.06, pos: [P7[0], 0.2, P7[2]], rotY: ry(P7[0] - P6[0], P7[2] - P6[2]), ease: 'linear' }, { t: 4.08, pos: [P7[0], 0.2, P7[2]], rotY: ry(P8[0] - P7[0], P8[2] - P7[2]), ease: 'hold' },
      { t: 4.20, pos: C6, rotY: ry(P8[0] - P7[0], P8[2] - P7[2]), ease: 'linear' }, { t: 4.44, pos: P8, rotY: ry(P8[0] - P7[0], P8[2] - P7[2]), ease: 'linear' }, { t: 4.70, pos: [-0.30, 0, 0], rotY: 90, ease: 'outCubic' }, { t: 5.60, pos: [-0.06, 0, 0], rotY: 90, ease: 'inOutQuad' },
      { t: 5.90, pos: [-0.06, 0, 0], rotY: 90, ease: 'hold' }, { t: 6.00, pos: [0.04, 0.30, 0], rotY: 90, rotZ: 50, ease: 'inQuad' }, { t: 6.60, pos: [0.04, 0.34, 0], rotY: 90, rotZ: 62, ease: 'linear' },
      { t: 7.00, pos: [-0.10, 0.95, 0], rotY: 90, rotZ: 220, ease: 'outQuad' }, { t: 7.50, pos: [-0.34, 0, 0], rotY: 90, rotZ: 360, ease: 'inQuad' }, { t: 10.0, pos: [-0.34, 0, 0], rotY: 90, rotZ: 360 }] },
    target: { segments: [{ start: 0, clip: 'cinv_pisuke' }], pivotHeight: 0.45, root: [
      { t: 0, pos: [D / 2, 0, 0], rotY: -90 }, { t: 0.40, pos: [0.32, 0, 0], rotY: -90, ease: 'outCubic' }, { t: 1.20, pos: [0.32, 0, 0], rotY: -90, ease: 'hold' },
      { t: 1.70, pos: [0.52, 0, -0.10], rotY: -90 - 540, ease: 'outCubic' }, { t: 2.15, pos: [0.52, 0, -0.10], rotY: -90 - 720, ease: 'outQuad' }, { t: 2.55, pos: [0.30, 0, 0.14], rotY: -90 - 720 + 40, ease: 'outCubic' },
      { t: 2.95, pos: [0.30, 0, 0.14], rotY: -90 - 720, ease: 'inOutQuad' }, { t: 3.40, pos: [0.34, 0.66, 0.04], rotY: -810, rotZ: -100, ease: 'outQuad' }, { t: 3.60, pos: [0.34, 0.70, 0.02], rotY: -810, rotZ: -130, ease: 'linear' },
      { t: 3.90, pos: [0.26, 0.86, 0.10], rotY: -810, rotZ: -250, ease: 'outQuad' }, { t: 4.20, pos: [0.42, 0.98, -0.02], rotY: -810, rotZ: -380, ease: 'outQuad' }, { t: 4.80, pos: [0.36, 1.30, 0], rotY: -810, rotZ: -560, ease: 'outQuad' },
      { t: 6.00, pos: [0.36, 0.52, 0], rotY: -810, rotZ: -720, ease: 'inQuad' }, { t: 6.60, pos: [0.37, 0.58, 0], rotY: -810, rotZ: -720, ease: 'linear' }, { t: 7.40, pos: [0.50, 3.30, 0], rotY: -810, rotZ: -1250, ease: 'outQuad' },
      { t: 8.50, pos: [1.20, 0, -0.25], rotY: -810, rotZ: -1440, ease: 'inQuad' }, { t: 8.64, pos: [1.27, 0.14, -0.25], rotY: -810, rotZ: -1440, ease: 'outQuad' }, { t: 8.80, pos: [1.32, 0, -0.25], rotY: -810, rotZ: -1440, ease: 'inQuad' }, { t: 10.0, pos: [1.32, 0, -0.25], rotY: -810, rotZ: -1440 }] },
  },
  shots: [
    { id: '01-howl', title: '吠える', start: 0, end: 0.9, intent: 'かかとの後ろ・地面の高さ。着地して両手をつき、短く吠える。奥に相手',
      actorPose: { attacker: '飛び蹴りから着地→両手をついて低く構え、短く吠える', target: 'のけぞり→構え直す' },
      camera: { rig: 'heels-low-behind', move: '低い背後から、吠えで少し揺れる', keys: [k(0, ['target.chest', -0.30, 0.04, 1.20], ['target.chest', -0.12, 0, 0], 34, -6), k(0.30, ['stage', -0.95, 0.09, 0.50], ['target.chest', 0, -0.05, 0], 50, 5, 'outExpo'), k(0.90, ['stage', -1.00, 0.08, 0.46], ['target.chest', 0, -0.05, 0], 52, 3, 'linear')] },
      cues: [{ at: 0, type: 'vfx', key: 'flash', dur: 0.1, opacity: 0.4 }, { at: 0, type: 'vfx', key: 'impact_burst', anchor: 'target.chest', size: 0.5, color: 0xd8f6ff }, { at: 0, type: 'sfx', key: 'ult_hit_kick' }, { at: 0, type: 'shake', dur: 0.25, amp: 0.03 },
        { at: 0.72, type: 'vfx', key: 'shock_ring', anchor: 'attacker.head', plane: 'camera', radius: 0.9, dur: 0.3, color: 0xbfeaff }, { at: 0.72, type: 'vfx', key: 'shock_ring', anchor: 'attacker.root', radius: 1.2, dur: 0.35, color: 0xbfeaff }, { at: 0.72, type: 'shake', dur: 0.2, amp: 0.03 }, { at: 0.72, type: 'sfx', key: 'howl_short' }] },
    { id: '02-charge-side', title: '突撃1・真横', start: 0.9, end: 1.8, intent: 'ピスケと同じ速さで並走する真横。相手を蹴り抜け、相手はこまのように回る',
      actorPose: { attacker: '飛び蹴りで相手を抜け、向こう側で滑って止まる', target: '横殴りで体ごと回る' },
      camera: { rig: 'parallel-run', move: '被写体と並走', keys: [k(0.90, ['attacker.chest', -0.30, 0.02, 1.80], ['attacker.chest', 0.40, 0, 0], 40, 3), k(1.20, ['attacker.chest', -0.10, 0.02, 1.70], ['attacker.chest', 0.20, 0, 0], 38, 0, 'linear'), k(1.80, ['stage', 0.75, 0.25, 1.90], ['target.chest', 0.20, 0, 0], 44, -3, 'outCubic')] },
      cues: [{ at: 0.92, type: 'vfx', key: 'dust', offset: P1, count: 8, spread: 0.4 }, { at: 0.92, type: 'sfx', key: 'dash' }, streak(0.94, P1, P2), ...hit(1.20, C1)] },
    { id: '03-charge-depth', title: '突撃2・奥から', start: 1.8, end: 2.6, intent: '回る相手の肩越し。画面の奥からこちらへ蹴り抜けてくる',
      actorPose: { attacker: '奥から手前へ飛び蹴り', target: '回りながら背中を蹴られて弓なり、手前へよろめく' },
      camera: { rig: 'over-shoulder-depth', move: '相手の手前で固定。ピスケが奥から迫って抜ける', keys: [k(1.80, ['stage', -0.20, 0.42, 1.25], ['attacker.chest', 0, 0, 0], 46, -8), k(2.15, ['stage', -0.18, 0.40, 1.20], ['target.chest', 0, 0, 0], 42, -6, 'linear'), k(2.60, ['stage', -0.10, 0.38, 1.50], ['target.chest', 0, 0, 0], 44, -2, 'outQuad')] },
      cues: [streak(1.84, P3, P4), { at: 1.84, type: 'sfx', key: 'dash' }, ...hit(2.15, C2)] },
    { id: '04-charge-slide', title: '突撃3・滑り込み', start: 2.6, end: 3.4, intent: '地面すれすれ・滑走路の真横。伸ばした脚が相手の足元に入る接触点を画面中央に置き、払われた相手が浮くまで同じ低さで見る',
      actorPose: { attacker: '低い滑り込み蹴り', target: '足を払われて体が水平に浮く' },
      camera: { rig: 'ground-slide-skim', move: '滑走の真横・地面の高さで固定。ピスケを追って振り、接触点で止め、浮く相手に合わせて引く', keys: [k(2.60, ['stage', 1.45, 0.07, 1.10], ['attacker.chest', 0, -0.04, 0], 44, 8), k(2.90, ['stage', 1.45, 0.07, 1.10], ['stage', 0.20, 0.13, 0.12], 40, 8, 'linear'), k(3.06, ['stage', 1.45, 0.07, 1.10], ['stage', 0.24, 0.14, 0.10], 38, 8, 'linear'), k(3.40, ['stage', 1.50, 0.08, 1.15], ['target.pelvis', 0.10, -0.22, 0], 48, 5, 'outQuad')] },
      cues: [streak(2.66, P4, P5, 0.06), { at: 2.66, type: 'sfx', key: 'slide' }, { at: 2.75, type: 'vfx', key: 'dust', anchor: 'attacker.root', count: 10, spread: 0.4 }, ...hit(2.95, C3)] },
    { id: '05-juggle-overhead', title: '突撃4〜6・真上から', start: 3.4, end: 4.6, intent: '真上からの俯瞰。浮いた相手を三方向から蹴り抜け、残像の筋が星形に重なる',
      actorPose: { attacker: '膝・飛び蹴り・膝で、三方向から宙の相手を抜ける', target: '宙で三方向へ弾かれ、少しずつ高くなる' },
      camera: { rig: 'overhead-star', move: '真上でゆっくり回る', keys: [k(3.40, ['stage', 0.35, 4.6, 0.25], ['stage', 0.35, 0.8, 0], 44, 0), k(4.60, ['stage', 0.35, 4.2, 0.25], ['stage', 0.35, 0.8, 0], 42, 50, 'linear')] },
      cues: [streak(3.44, P5, P6, 0.6), ...hit(3.60, C4), streak(3.80, P6, P7, 0.8), ...hit(3.90, C5), streak(4.08, P7, P8, 0.9), ...hit(4.20, C6), { at: 3.44, type: 'sfx', key: 'dash_triple' }] },
    { id: '06-look-up', title: '見上げる', start: 4.6, end: 5.6, intent: 'ここだけ遅い。滑って止まった顔の寄りから、落ちてくる相手へ視線を上げる',
      actorPose: { attacker: '片手をついて止まり、真上を見上げる', target: '力が抜けて落ちてくる' },
      camera: { rig: 'slow-face-tilt', move: '顔の寄り→ゆっくり上を向く', keys: [k(4.60, ['attacker.head', 0.55, 0.02, 0.80], ['attacker.head', 0, 0, 0], 26, 4), k(5.10, ['attacker.head', 0.50, 0.00, 0.74], ['attacker.head', 0, 0.02, 0], 24, 2, 'outQuad'), k(5.36, ['stage', -0.55, 0.10, 1.25], ['attacker.head', 0.10, 0.10, 0], 36, -3, 'inOutQuad'), k(5.60, ['stage', -0.75, 0.10, 1.30], ['stage', 0.06, 0.42, 0], 44, -6, 'inOutQuad')] },
      cues: [{ at: 4.70, type: 'vfx', key: 'dust', anchor: 'attacker.root', count: 8, spread: 0.4 }, { at: 4.7, type: 'sfx', key: 'skid_stop' }, { at: 4.9, type: 'sfx', key: 'tension_hold' }] },
    { id: '07-somersault', title: 'サマーソルト', start: 5.6, end: 7.4, intent: '真横の低い位置。沈んでから後方宙返り、足先が弧を描いて相手を真上へ。止めのあと、上がる相手を追う',
      actorPose: { attacker: '深く沈む→後方宙返りの蹴り上げ→止め→回りきる', target: '蹴り上げに体が折れる→止め→真上へ' },
      camera: { rig: 'side-arc-follow-up', move: '真横で待つ→当たりで寄る→上昇する相手に合わせて上を向く', keys: [k(5.60, ['stage', 0.20, 0.14, 2.00], ['stage', 0.20, 0.42, 0], 40, 0), k(5.96, ['stage', 0.20, 0.14, 1.95], ['stage', 0.20, 0.42, 0], 38, 0, 'linear'),
        k(6.04, ['stage', 0.22, 0.20, 1.60], ['target.pelvis', -0.08, -0.08, 0], 30, -8, 'outExpo'), k(6.60, ['stage', 0.22, 0.20, 1.50], ['target.pelvis', -0.08, -0.08, 0], 28, -10, 'linear'), k(7.40, ['stage', 0.30, 0.50, 2.30], ['target.pelvis', 0, -0.5, 0], 50, -4, 'outCubic')] },
      cues: [{ at: 5.9, type: 'vfx', key: 'dust', anchor: 'attacker.root', count: 8, spread: 0.4 }, { at: 5.9, type: 'sfx', key: 'jump' }, { at: 6.00, type: 'hitstop', dur: 0.6, strength: 'max' }, { at: 6.00, type: 'vfx', key: 'dim', dur: 0.6, opacity: 0.32 }, { at: 6.00, type: 'vfx', key: 'flash', dur: 0.1, opacity: 0.45 },
        { at: 6.00, type: 'vfx', key: 'slash_arc', anchor: 'attacker.footR', size: 1.1, angle: -110, sweep: 2.2, arc: 1.3, dur: 0.6, color: 0xbfeaff }, { at: 6.00, type: 'vfx', key: 'impact_burst', anchor: 'attacker.footR', size: 0.65, rays: 16, color: 0xe6faff },
        { at: 6.00, type: 'shake', dur: 0.6, amp: 0.06 }, { at: 6.00, type: 'sfx', key: 'ult_hit_somersault' }, { at: 6.60, type: 'vfx', key: 'speed_lines', dur: 0.4, opacity: 0.45 }, { at: 6.60, type: 'sfx', key: 'launch' }] },
    { id: '08-air', title: '宙', start: 7.4, end: 8.6, intent: '落ちてくる相手に付いて下がる引き。相手が画面の中で小さくなりすぎない距離を保ち、着地でピスケも入る',
      actorPose: { attacker: '片足で軽く着地', target: '頂点から回りながら落ちる' },
      camera: { rig: 'wide-fall-follow', move: '引きで相手の落下を追う', keys: [k(7.40, ['target.pelvis', -1.10, -0.70, 2.00], ['target.pelvis', -0.25, -0.45, 0], 46, 4), k(8.20, ['target.pelvis', -1.10, -0.20, 2.00], ['target.pelvis', -0.40, -0.10, 0], 44, 2, 'linear'), k(8.50, ['stage', -0.30, 0.40, 2.30], ['target.pelvis', -0.60, 0.05, 0], 44, 0, 'inOutQuad'), k(8.60, ['stage', -0.30, 0.40, 2.30], ['target.pelvis', -0.60, 0.05, 0], 44, 0, 'linear')] },
      cues: [{ at: 7.50, type: 'vfx', key: 'dust', anchor: 'attacker.root', count: 6, spread: 0.3 }, { at: 7.50, type: 'sfx', key: 'land_light' }, { at: 8.50, type: 'shake', dur: 0.4, amp: 0.05 }, { at: 8.50, type: 'vfx', key: 'dust', anchor: 'target.root', count: 12, spread: 0.6 },
        { at: 8.50, type: 'vfx', key: 'shock_ring', anchor: 'target.root', radius: 1.4, dur: 0.45, color: 0xbfeaff }, { at: 8.50, type: 'sfx', key: 'body_land' }] },
    { id: '09-step', title: '軽い足', start: 8.6, end: 10.0, intent: '正面の低い位置。片ひざを上げた構えで小さく弾む。倒れた相手は奥',
      actorPose: { attacker: 'こちらへ体を開き、片ひざを上げて二度弾む', target: '奥で仰向け' },
      camera: { rig: 'low-front-bounce', move: '低い正面からゆっくり寄る', keys: [k(8.60, ['stage', -0.20, 0.16, 1.60], ['attacker.chest', 0.10, 0.06, 0], 38, -4), k(10.0, ['stage', -0.28, 0.20, 1.38], ['attacker.chest', 0.08, 0.08, 0], 35, 0, 'outQuad')] },
      cues: [{ at: 9.00, type: 'sfx', key: 'finish_pose' }, { at: 9.00, type: 'caption', dur: 0.8, text: '音速連咆', sub: 'ピスケ' }, { at: 9.40, type: 'sfx', key: 'step_tap' }, { at: 9.80, type: 'sfx', key: 'step_tap' }] },
  ],
  reducedMotion: { useShots: ['05-juggle-overhead', '07-somersault', '09-step'], disable: ['shake', 'flash', 'speed_lines', 'dim'], note: '3 カットを固定カメラ（各ショットの最初のキー）で見せる。残像の筋は残す。役者とキューの時刻は変えない' },
};
