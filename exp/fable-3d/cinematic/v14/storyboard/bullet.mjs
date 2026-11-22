// バレット奥義「超圧縮・弾丸頭突き」命中後ムービー 10.2秒版の絵コンテ（編集用の正本）。座標・単位・hitstop の扱いは moguzo.mjs の冒頭と同じ。
// 本人指定: 尻尾主体の重い打撃を浴びせ、爆発する木の実を投げる。最後は振り向き、背後で相手が爆発する。
// カメラの文法: 「尻尾が主役、木の実が脇役」。前半は尻尾の先を追う低いカメラ。中盤は木の実に付いて飛ぶカメラ。最後は爆発に背を向けた正面で動かない。
// 現行の技名は「頭突き」で、この内容と合わない。改名案は README / PR に書いた（実装名は変えていない）。
const D = 0.50, AX = -D / 2, SIT = 1.62;
const k = (t, pos, look, fov, roll = 0, ease) => ({ t, pos, look, fov, roll, ease });
const blow = (at, dur, size, where) => [{ at, type: 'hitstop', dur, strength: dur > 0.35 ? 'max' : 'heavy' }, { at, type: 'vfx', key: 'flash', dur: 0.1, opacity: 0.4 }, { at, type: 'vfx', key: 'impact_burst', anchor: where, size, color: 0xffe2a8 }, { at, type: 'shake', dur, amp: 0.055 }, { at, type: 'sfx', key: 'ult_hit_tail' }];
export default {
  characterId: 'bullet', displayName: '超圧縮・弾丸頭突き', durationSeconds: 10.2,
  concept: '尻尾の横薙ぎ・叩きつけ・すくい上げで座り込ませ、木の実をひざの上へ放り、背を向けたところで爆発させる。',
  stage: { contactDistance: D, backdrop: 0x2a1c10, fog: 0x2a1c10, fogNear: 5, fogFar: 18, sky: 0xffe6c0, ground: 0x4a3420, ambient: 1.35, key: 0xffdca8, keyPower: 2.8, rim: 0xff9a30, rimPower: 2.2,
    floor: 0x5c4630, mountain: 0x3a2a1a, post: 0x6e5030, accent: 0xffb045, accentCss: '#ffb045' },
  actors: {
    attacker: { segments: [{ start: 0, clip: 'cin_bullet_atk' }], pivotHeight: 0.45, root: [
      { t: 0, pos: [AX, 0, 0], rotY: 90 }, { t: 1.50, pos: [AX, 0, 0], rotY: 90, ease: 'hold' }, { t: 1.60, pos: [AX + 0.12, 0, 0], rotY: 90, ease: 'inQuad' }, { t: 2.50, pos: [0.10, 0, 0], rotY: 90, ease: 'inOutQuad' },
      { t: 3.50, pos: [0.14, 0, 0], rotY: 90, ease: 'linear' }, { t: 3.60, pos: [0.22, 0, 0], rotY: 90, ease: 'inQuad' }, { t: 7.00, pos: [0.22, 0, 0], rotY: 90, ease: 'hold' }, { t: 7.50, pos: [0.14, 0, 0], rotY: -70, ease: 'inOutCubic' }, { t: 10.2, pos: [0.14, 0, 0], rotY: -70 }] },
    target: { segments: [{ start: 0, clip: 'cinv_bullet' }], pivotHeight: 0.45, root: [
      { t: 0, pos: [D / 2, 0, 0], rotY: -90 }, { t: 1.20, pos: [0.36, 0, 0], rotY: -90, ease: 'outCubic' }, { t: 1.60, pos: [0.36, 0, 0], rotY: -90, ease: 'hold' }, { t: 1.90, pos: [0.40, 0, -0.03], rotY: -90, ease: 'linear' }, { t: 2.40, pos: [0.78, 0, -0.10], rotY: -90, ease: 'outCubic' },
      { t: 3.60, pos: [0.78, 0, -0.10], rotY: -90, ease: 'hold' }, { t: 4.00, pos: [0.82, 0.14, -0.10], rotY: -90, ease: 'linear' }, { t: 4.36, pos: [1.25, 0.62, -0.06], rotY: -90, rotZ: -40, ease: 'outQuad' }, { t: 4.70, pos: [SIT, 0, 0], rotY: -90, rotZ: 0, ease: 'inQuad' },
      { t: 7.60, pos: [SIT, 0, 0], rotY: -90, ease: 'hold' }, { t: 8.40, pos: [2.60, 1.70, 0.20], rotY: -90, rotZ: -420, ease: 'outQuad' }, { t: 9.10, pos: [3.40, 0, 0.30], rotY: -90, rotZ: -720, ease: 'inQuad' }, { t: 9.24, pos: [3.50, 0.13, 0.30], rotY: -90, rotZ: -720, ease: 'outQuad' },
      { t: 9.40, pos: [3.58, 0, 0.30], rotY: -90, rotZ: -720, ease: 'inQuad' }, { t: 10.2, pos: [3.58, 0, 0.30], rotY: -90, rotZ: -720 }] },
  },
  shots: [
    { id: '01-tail-tip', title: '尻尾の先', start: 0, end: 1.2, intent: '尻尾の先の高さ・背後の低い位置。持ち上がって揺れる尻尾の向こうに、よろめく相手',
      actorPose: { attacker: '尻尾を引き戻し、高く持ち上げて構える', target: 'のけぞり、構え直す' },
      camera: { rig: 'tail-tip-low-behind', move: '尻尾の先に付いて少し上がる', keys: [k(0, ['target.chest', -0.34, 0.04, 1.30], ['target.chest', -0.14, 0, 0], 36, -5), k(0.36, ['attacker.tail', -0.50, 0.02, 0.50], ['target.chest', 0, -0.05, 0], 48, 6, 'outExpo'), k(1.20, ['attacker.tail', -0.46, 0.06, 0.46], ['target.chest', 0, -0.04, 0], 46, 4, 'linear')] },
      cues: [{ at: 0, type: 'vfx', key: 'flash', dur: 0.1, opacity: 0.4 }, { at: 0, type: 'vfx', key: 'impact_burst', anchor: 'target.chest', size: 0.5, color: 0xffe2a8 }, { at: 0, type: 'shake', dur: 0.25, amp: 0.04 }, { at: 0, type: 'sfx', key: 'ult_hit_tail' }, { at: 0.9, type: 'sfx', key: 'tail_swish' }] },
    { id: '02-sweep', title: '一打・横薙ぎ', start: 1.2, end: 2.2, intent: '真横の低い引き。半回転した体から尻尾が横に回り込み、相手を体ごと持っていく',
      actorPose: { attacker: '体をひねって引く→半回転して尻尾の横薙ぎ→止め', target: '横から打たれて体ごと流れる→止め→滑る' },
      camera: { rig: 'low-side-sweep', move: '低い真横。当たりで寄り、滑る相手に付く', keys: [k(1.20, ['stage', 0.20, 0.14, 1.95], ['stage', 0.10, 0.30, 0], 42, 3), k(1.62, ['stage', 0.26, 0.14, 1.80], ['target.chest', -0.10, -0.04, 0], 34, 0, 'inExpo'), k(1.90, ['stage', 0.28, 0.14, 1.74], ['target.chest', -0.10, -0.04, 0], 32, -2, 'linear'), k(2.20, ['stage', 0.50, 0.16, 1.90], ['target.chest', -0.16, 0, 0], 40, 0, 'outCubic')] },
      cues: [...blow(1.60, 0.3, 0.6, 'target.chest'), { at: 1.60, type: 'vfx', key: 'slash_arc', anchor: 'target.chest', size: 0.9, angle: 0, sweep: 1.6, color: 0xffc070 }, { at: 1.92, type: 'vfx', key: 'dust', anchor: 'target.root', count: 9, spread: 0.4 }] },
    { id: '03-slam', title: '二打・叩きつけ', start: 2.2, end: 3.2, intent: '相手の斜め上から。背中越しに振り下ろされる尻尾が頭上から落ち、相手がひざから潰れる。地面にひび',
      actorPose: { attacker: '尻尾を体の下へ巻く→前へ折れて背中越しに叩きつける→止め', target: '見上げる→ひざから潰れる→止め' },
      camera: { rig: 'high-angle-slam', move: '斜め上で受け、叩きつけで沈む', keys: [k(2.20, ['stage', 1.30, 0.95, 1.10], ['target.head', -0.20, 0, 0], 44, -6), k(2.62, ['stage', 1.25, 0.70, 1.05], ['target.head', -0.10, -0.06, 0], 38, -8, 'inExpo'), k(3.20, ['stage', 1.25, 0.62, 1.05], ['target.chest', -0.10, 0, 0], 38, -6, 'linear')] },
      cues: [...blow(2.60, 0.3, 0.65, 'target.head'), { at: 2.60, type: 'vfx', key: 'shock_ring', anchor: 'target.root', radius: 1.3, dur: 0.45, color: 0xffd9a0 }, { at: 2.60, type: 'vfx', key: 'debris', anchor: 'target.root', count: 12, power: 1.5 },
        { at: 2.62, type: 'vfx', key: 'ground_crack', from: [0.78, -0.10], to: [1.40, 0.30], dur: 0.2, hold: 2.0, color: 0xffa040 }, { at: 2.62, type: 'vfx', key: 'ground_crack', from: [0.78, -0.10], to: [0.30, -0.60], dur: 0.2, hold: 2.0, color: 0xffa040 }] },
    { id: '04-scoop', title: '三打・すくい上げ', start: 3.2, end: 4.4, intent: '地面の高さの引き。下から回ってきた尻尾が相手をすくい上げ、いちばん長い止めのあと、相手が弧を描いて飛ぶ',
      actorPose: { attacker: '尻尾を背中の上に溜める→背を向けて下からすくい上げる→止め', target: 'ひざをついたまま→すくい上げられて弓なり→止め→弧を描いて飛ぶ' },
      camera: { rig: 'ground-wide-arc', move: '地面の高さで固定し、飛ぶ相手に合わせて少し上を向く', keys: [k(3.20, ['stage', 0.60, 0.07, 2.20], ['stage', 0.55, 0.36, 0], 44, 4), k(3.60, ['stage', 0.60, 0.07, 2.10], ['target.pelvis', -0.10, 0.04, 0], 38, 2, 'inQuad'), k(4.00, ['stage', 0.62, 0.07, 2.04], ['target.pelvis', -0.10, 0.04, 0], 36, 0, 'linear'), k(4.40, ['stage', 0.80, 0.10, 2.30], ['target.pelvis', -0.20, -0.10, 0], 46, -3, 'outCubic')] },
      cues: [...blow(3.60, 0.4, 0.75, 'target.pelvis'), { at: 3.60, type: 'vfx', key: 'slash_arc', anchor: 'target.pelvis', size: 1.0, angle: -80, sweep: 2.0, color: 0xffc070 }, { at: 4.00, type: 'vfx', key: 'speed_lines', dur: 0.3, opacity: 0.4 }, { at: 4.00, type: 'sfx', key: 'launch' }] },
    { id: '05-nut', title: '木の実', start: 4.4, end: 5.8, intent: '手元の寄り。相手が尻もちで座り込む音だけが奥でして、バレットは木の実を一度放って受け、下手で投げる',
      actorPose: { attacker: '木の実を一度放って受ける→下手で投げる', target: '尻もちで座り込み、目を回す（奥）' },
      camera: { rig: 'paw-close-toss', move: '手元の寄り。放った木の実に合わせて上下', keys: [k(4.40, ['attacker.pawR', 0.40, 0.04, 0.62], ['attacker.pawR', 0.04, 0.04, 0], 26, 3), k(4.95, ['attacker.pawR', 0.40, 0.08, 0.62], ['attacker.pawR', 0.04, 0.10, 0], 26, 3, 'linear'), k(5.30, ['attacker.pawR', 0.44, 0.02, 0.70], ['attacker.pawR', 0.10, 0.02, 0], 30, 0, 'linear'), k(5.80, ['stage', 0.55, 0.40, 0.95], ['stage', 1.20, 0.50, 0], 40, -4, 'outCubic')] },
      cues: [{ at: 4.70, type: 'vfx', key: 'dust', anchor: 'target.root', count: 9, spread: 0.45 }, { at: 4.70, type: 'shake', dur: 0.25, amp: 0.03 }, { at: 4.70, type: 'sfx', key: 'body_land' }, { at: 4.95, type: 'sfx', key: 'nut_toss' }, { at: 5.10, type: 'sfx', key: 'nut_catch' },
        { at: 5.32, type: 'vfx', key: 'nut', from: [0.42, 0.50, 0.06], toAnchor: 'target.pelvis', to: [-0.06, 0.12, 0], fly: 1.45, stick: 0.85, arc: 0.55, size: 0.04 }, { at: 5.32, type: 'sfx', key: 'nut_lob' }] },
    { id: '06-nut-flight', title: '木の実の飛行', start: 5.8, end: 7.0, intent: '木の実と同じ速さで飛ぶ。ゆっくり回りながら近づく先で、相手が首をかしげ、ひざの上に落ちた実を見下ろす',
      actorPose: { attacker: '投げた手を下ろして見ている（画面外）', target: '首をかしげる→ひざの上の木の実を見下ろす' },
      camera: { rig: 'nut-chase', move: '木の実の軌道に沿って相手のひざまで進む', keys: [k(5.80, ['stage', 0.62, 0.72, 0.34], ['target.head', 0, -0.04, 0], 42, -6), k(6.40, ['stage', 1.05, 0.70, 0.30], ['target.head', 0, -0.06, 0], 38, -3, 'linear'), k(6.77, ['stage', 1.26, 0.50, 0.30], ['target.pelvis', -0.04, 0.10, 0], 34, 0, 'linear'), k(7.00, ['stage', 1.28, 0.46, 0.32], ['target.pelvis', -0.04, 0.10, 0], 32, 0, 'outQuad')] },
      cues: [{ at: 6.20, type: 'sfx', key: 'huh' }, { at: 6.77, type: 'sfx', key: 'nut_land_tick' }, { at: 6.80, type: 'sfx', key: 'fuse_beep' }] },
    { id: '07-turn-and-boom', title: '背を向ける', start: 7.0, end: 8.6, intent: 'バレットの正面・低い位置で固定。こちらへ向き直って腕を下ろした背後で大爆発。爆炎が輪郭を縁取る。振り返らない',
      actorPose: { attacker: '背を向けて腕を下ろす。尻尾だけがゆっくり揺れ、爆風でも振り返らない', target: '慌てて両手を上げる→爆発で吹き飛ぶ' },
      camera: { rig: 'front-locked-backlit', move: '固定。爆風で揺れるだけ', keys: [k(7.00, ['stage', -1.05, 0.16, 0.42], ['attacker.chest', 0.10, 0.05, 0], 42, 0), k(8.60, ['stage', -1.10, 0.16, 0.44], ['attacker.chest', 0.10, 0.06, 0], 40, 0, 'linear')] },
      cues: [{ at: 7.30, type: 'sfx', key: 'fuse_beep_fast' }, { at: 7.60, type: 'hitstop', dur: 0.12, strength: 'max' }, { at: 7.60, type: 'vfx', key: 'explosion', offset: [SIT, 0.35, 0], size: 1.5, count: 22, dur: 1.5 }, { at: 7.60, type: 'vfx', key: 'flash', dur: 0.2, opacity: 0.6, color: 0xffe0a0 },
        { at: 7.60, type: 'shake', dur: 0.9, amp: 0.10 }, { at: 7.60, type: 'vfx', key: 'shock_ring', offset: [SIT, 0, 0], radius: 3.2, dur: 0.7, color: 0xffc070 }, { at: 7.60, type: 'vfx', key: 'debris', offset: [SIT, 0.1, 0], count: 26, power: 3.0 },
        { at: 7.60, type: 'sfx', key: 'explosion_big' }, { at: 7.72, type: 'vfx', key: 'dust', anchor: 'attacker.root', count: 10, spread: 0.6 }, { at: 7.9, type: 'vfx', key: 'explosion', offset: [SIT + 0.3, 0.7, -0.3], size: 0.9, count: 12, dur: 1.0 }] },
    { id: '08-calm', title: '落ち着いた顔', start: 8.6, end: 10.2, intent: '顔の寄りから少し引く。目を閉じた顔と、ゆっくり揺れる尻尾。奥で相手が煙を上げて落ちる',
      actorPose: { attacker: '目を閉じ、尻尾をゆっくり揺らす', target: '奥に落ちて跳ね、止まる' },
      camera: { rig: 'face-to-tail-ease', move: '顔の寄りからゆっくり引く', keys: [k(8.60, ['attacker.head', -0.50, 0.02, 0.52], ['attacker.head', 0, -0.02, 0], 28, 3), k(10.2, ['attacker.head', -0.95, 0.02, 0.80], ['attacker.chest', 0.10, 0.04, 0], 36, 0, 'inOutQuad')] },
      cues: [{ at: 9.10, type: 'vfx', key: 'dust', anchor: 'target.root', count: 10, spread: 0.5, color: 0x3a3028 }, { at: 9.10, type: 'sfx', key: 'body_land' }, { at: 9.10, type: 'shake', dur: 0.25, amp: 0.03 }, { at: 9.40, type: 'sfx', key: 'finish_pose' }, { at: 9.30, type: 'caption', dur: 0.75, text: '超圧縮・弾丸頭突き', sub: 'バレット' }] },
  ],
  reducedMotion: { useShots: ['04-scoop', '07-turn-and-boom', '08-calm'], disable: ['shake', 'flash', 'speed_lines'], note: '3 カットを固定カメラ（各ショットの最初のキー）で見せる。爆発は残す。役者とキューの時刻は変えない' },
};
