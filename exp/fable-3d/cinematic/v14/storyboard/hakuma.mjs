// ハクマ奥義「白峰不動掌」命中後ムービー 10.2秒版の絵コンテ（編集用の正本）。座標・単位・hitstop の扱いは moguzo.mjs の冒頭と同じ。
// 本人指定: 雪山。張り手で相手を押し出していき、最後は背負い投げで反対方向へ。とにかく重さを表現。
// カメラの文法: 「押す方向と投げる方向」。前半は +X へ押す動きを横・足元・肩越しで積み、背負い投げでカメラごと回って -X へ返す。
// 雪山・降雪はムービー内だけの舞台装置（stage の色と vfx 'snowfall'）。
const D = 0.50, AX = -D / 2;
const k = (t, pos, look, fov, roll = 0, ease) => ({ t, pos, look, fov, roll, ease });
const SNOW = 0xf4f8ff, spray = (at, anchor, n = 10, sp = 0.5) => ({ at, type: 'vfx', key: 'dust', anchor, count: n, spread: sp, color: SNOW, dur: 0.9 });
const harite = (at, dur, strength, size) => [{ at, type: 'hitstop', dur, strength }, { at, type: 'vfx', key: 'flash', dur: 0.1, opacity: 0.4 }, { at, type: 'vfx', key: 'impact_burst', anchor: 'target.chest', offset: [-0.06, 0.02, 0.05], size, color: 0xeaf6ff },
  { at, type: 'vfx', key: 'shock_ring', anchor: 'target.chest', plane: 'camera', radius: size * 1.4, dur: 0.4, color: 0xffffff }, { at, type: 'shake', dur, amp: 0.05 }, { at, type: 'sfx', key: 'ult_hit_harite' }, spray(at + dur, 'target.root', 12, 0.5), { at: at + dur, type: 'sfx', key: 'snow_slide' }];
export default {
  characterId: 'hakuma', displayName: '白峰不動掌', durationSeconds: 10.2,
  concept: '雪の上を三発の張り手で押し出し、懐へ入って背負い、押してきた方向と逆へ投げ返す。',
  stage: { contactDistance: D, backdrop: 0x9fb6cc, fog: 0xb8cbdc, fogNear: 4, fogFar: 15, sky: 0xffffff, ground: 0xb8c8d8, ambient: 1.7, key: 0xfff4e6, keyPower: 2.2, rim: 0x9fd0ff, rimPower: 1.8,
    floor: 0xe6eef6, mountain: 0xd4e0ec, post: 0x8a9aa8, posts: 0, accent: 0xb7f8d8, accentCss: '#b7f8d8' },
  actors: {
    attacker: { segments: [{ start: 0, clip: 'cin_hakuma_atk' }], pivotHeight: 0.45, root: [
      { t: 0, pos: [AX, 0, 0], rotY: 90 }, { t: 1.62, pos: [AX, 0, 0], rotY: 90, ease: 'hold' }, { t: 1.70, pos: [0.04, 0, 0], rotY: 90, ease: 'inQuad' }, { t: 2.72, pos: [0.06, 0, 0], rotY: 90, ease: 'linear' },
      { t: 2.80, pos: [0.52, 0, 0], rotY: 90, ease: 'inQuad' }, { t: 3.72, pos: [0.54, 0, 0], rotY: 90, ease: 'linear' }, { t: 3.80, pos: [1.02, 0, 0], rotY: 90, ease: 'inQuad' }, { t: 4.60, pos: [1.04, 0, 0], rotY: 90, ease: 'linear' },
      { t: 4.95, pos: [1.40, 0, 0], rotY: 90, ease: 'inOutQuad' }, { t: 5.28, pos: [1.74, 0, 0], rotY: 90, ease: 'inOutQuad' }, { t: 5.50, pos: [1.80, 0, 0], rotY: -90, ease: 'inOutQuad' }, { t: 8.40, pos: [1.80, 0, 0], rotY: -90, ease: 'hold' },
      { t: 9.10, pos: [1.80, 0, 0], rotY: -6, ease: 'inOutCubic' }, { t: 10.2, pos: [1.80, 0, 0], rotY: -6 }] },
    target: { segments: [{ start: 0, clip: 'cinv_hakuma' }], pivotHeight: 0.45, root: [
      { t: 0, pos: [D / 2, 0, 0], rotY: -90 }, { t: 1.20, pos: [0.50, 0, 0], rotY: -90, ease: 'outCubic' }, { t: 1.70, pos: [0.50, 0, 0], rotY: -90, ease: 'hold' }, { t: 2.00, pos: [0.54, 0, 0], rotY: -90, ease: 'linear' },
      { t: 2.60, pos: [1.00, 0, 0], rotY: -90, ease: 'outCubic' }, { t: 2.80, pos: [1.00, 0, 0], rotY: -90, ease: 'hold' }, { t: 3.10, pos: [1.04, 0, 0], rotY: -90, ease: 'linear' }, { t: 3.60, pos: [1.50, 0, 0], rotY: -90, ease: 'outCubic' },
      { t: 3.80, pos: [1.50, 0, 0], rotY: -90, ease: 'hold' }, { t: 4.25, pos: [1.56, 0, 0], rotY: -90, ease: 'linear' }, { t: 4.80, pos: [2.20, 0, 0], rotY: -90, ease: 'outCubic' }, { t: 5.30, pos: [2.20, 0, 0], rotY: -90, ease: 'hold' },
      { t: 5.50, pos: [2.04, 0, 0], rotY: -90, ease: 'inOutQuad' }, { t: 5.78, pos: [2.00, 0.06, 0], rotY: -90, ease: 'linear' }, { t: 6.00, pos: [1.80, 0.86, 0], rotY: -90, rotZ: 120, ease: 'inQuad' }, { t: 6.30, pos: [1.20, 1.05, 0], rotY: -90, rotZ: 230, ease: 'linear' },
      { t: 7.40, pos: [-1.60, 0, 0], rotY: -90, rotZ: 360, ease: 'inQuad' }, { t: 7.54, pos: [-1.70, 0.14, 0], rotY: -90, rotZ: 360, ease: 'outQuad' }, { t: 7.70, pos: [-1.78, 0, 0], rotY: -90, rotZ: 360, ease: 'inQuad' }, { t: 10.2, pos: [-1.78, 0, 0], rotY: -90, rotZ: 360 }] },
  },
  shots: [
    { id: '01-snow-stance', title: '雪の立ち姿', start: 0, end: 1.3, intent: '雪の降る中、正面の低い位置から。足を開いて腰を落とし、大きな両掌を開く。白い息',
      actorPose: { attacker: '張り手を引き、足を開いて腰を落とす。両掌を開いて息を吐く', target: '張られてのけぞり、雪の上で踏ん張る' },
      camera: { rig: 'low-front-heavy', move: 'ほぼ固定でじわりと寄る', keys: [k(0, ['target.chest', -0.34, 0.04, 1.30], ['target.chest', -0.14, 0, 0], 34, -5), k(0.30, ['stage', 0.55, 0.10, 1.15], ['attacker.chest', 0.10, -0.02, 0], 42, 3, 'outExpo'), k(1.30, ['stage', 0.48, 0.10, 1.00], ['attacker.chest', 0.10, 0.0, 0], 38, 0, 'linear')] },
      cues: [{ at: 0, type: 'vfx', key: 'snowfall', dur: 10.2, count: 240 }, { at: 0, type: 'vfx', key: 'flash', dur: 0.1, opacity: 0.4 }, { at: 0, type: 'vfx', key: 'impact_burst', anchor: 'target.head', size: 0.55, color: 0xeaf6ff }, { at: 0, type: 'shake', dur: 0.3, amp: 0.04 }, { at: 0, type: 'sfx', key: 'ult_hit_harite' },
        spray(0.3, 'target.root', 8, 0.4), { at: 0.4, type: 'sfx', key: 'wind_cold' }, { at: 1.20, type: 'vfx', key: 'puff', anchor: 'attacker.head', offset: [0.10, -0.03, 0.04], count: 5, color: 0xffffff }] },
    { id: '02-harite-one', title: '張り手一', start: 1.3, end: 2.4, intent: '真横。右の張り手が入り、止めのあと相手が雪を削って滑る。カメラは相手に付いていく',
      actorPose: { attacker: '右を引き絞る→踏み込んで張る→止め', target: '踏ん張る→のけぞる→止め→雪を削って下がる' },
      camera: { rig: 'side-push-pan', move: '真横。当たりで寄り、滑る相手に付く', keys: [k(1.30, ['stage', 0.20, 0.30, 2.10], ['stage', 0.20, 0.32, 0], 40, 0), k(1.72, ['stage', 0.30, 0.30, 1.90], ['target.chest', -0.16, -0.02, 0], 32, -3, 'inExpo'), k(2.00, ['stage', 0.32, 0.30, 1.84], ['target.chest', -0.16, -0.02, 0], 30, -4, 'linear'), k(2.40, ['stage', 0.70, 0.30, 2.00], ['target.chest', -0.22, -0.02, 0], 38, 0, 'outCubic')] },
      cues: [...harite(1.70, 0.3, 'heavy', 0.55), spray(1.70, 'attacker.footR', 6, 0.3)] },
    { id: '03-harite-two', title: '張り手二', start: 2.4, end: 3.4, intent: '相手の足元・雪面の高さ。突っ張る足が雪を掘り、その向こうからハクマが迫る',
      actorPose: { attacker: '左を引き絞る→踏み込んで張る→止め', target: '足を突っ張る→のけぞる→止め→さらに下がる' },
      camera: { rig: 'feet-plow-low', move: '相手の足元に付いて後退', keys: [k(2.40, ['target.footL', 0.60, 0.05, 0.55], ['target.footL', -0.10, 0.10, 0], 50, 6), k(2.80, ['target.footL', 0.55, 0.05, 0.50], ['target.pelvis', -0.20, 0, 0], 48, 8, 'linear'), k(3.40, ['target.footL', 0.60, 0.06, 0.55], ['target.pelvis', -0.25, 0, 0], 48, 4, 'linear')] },
      cues: [...harite(2.80, 0.3, 'heavy', 0.6), spray(2.80, 'attacker.footL', 6, 0.3), spray(3.3, 'target.root', 8, 0.4)] },
    { id: '04-harite-three', title: '張り手三・両手', start: 3.4, end: 4.6, intent: 'ハクマの肩越し。両の掌が相手の胸を押し、いちばん長い止めのあと、相手が遠くまで滑ってふらつく',
      actorPose: { attacker: '両手を引く→両の掌で押す→止め', target: '大きくのけぞる→止め→遠くまで滑ってふらつく' },
      camera: { rig: 'over-attacker-shoulder-push', move: '肩越しで当たりを受け、遠ざかる相手を見送る', keys: [k(3.40, ['attacker.head', -0.66, 0.22, 0.80], ['target.chest', -0.10, 0, 0], 44, -5), k(3.82, ['attacker.head', -0.56, 0.20, 0.74], ['target.chest', -0.10, 0, 0], 38, -7, 'inExpo'), k(4.25, ['attacker.head', -0.54, 0.20, 0.72], ['target.chest', -0.10, 0, 0], 36, -8, 'linear'), k(4.60, ['attacker.head', -0.66, 0.22, 0.80], ['target.chest', -0.10, 0, 0], 42, -4, 'outQuad')] },
      cues: [...harite(3.80, 0.45, 'max', 0.75), { at: 3.80, type: 'vfx', key: 'dim', dur: 0.45, opacity: 0.2, color: 0x203040 }, spray(3.80, 'attacker.root', 10, 0.5)] },
    { id: '05-turn-in', title: '懐へ', start: 4.6, end: 5.8, intent: '相手側からの寄り。重い二歩で詰め、くるりと背を向けて懐に入る。投げる前の一瞬の力み',
      actorPose: { attacker: '二歩で詰める→背を向けて相手を担ぎ、沈んで力む', target: 'ふらつく→引き込まれて前のめり' },
      camera: { rig: 'shoulder-level-strain', move: '肩の高さの寄りから、低い位置へ沈む', keys: [k(4.60, ['stage', 2.75, 0.40, 1.05], ['attacker.head', 0, -0.06, 0], 38, 4), k(5.30, ['stage', 2.55, 0.36, 0.95], ['attacker.head', 0, -0.08, 0], 34, 2, 'linear'), k(5.80, ['stage', 2.35, 0.12, 0.85], ['attacker.chest', 0.05, 0.02, 0], 30, -6, 'inOutCubic')] },
      cues: [{ at: 4.95, type: 'shake', dur: 0.25, amp: 0.035 }, spray(4.95, 'attacker.footL', 6, 0.3), { at: 4.95, type: 'sfx', key: 'heavy_step_snow' }, { at: 5.28, type: 'shake', dur: 0.25, amp: 0.04 }, spray(5.28, 'attacker.footR', 6, 0.3), { at: 5.28, type: 'sfx', key: 'heavy_step_snow' },
        { at: 5.50, type: 'sfx', key: 'grab' }, { at: 5.50, type: 'hitstop', dur: 0.28, strength: 'heavy' }, { at: 5.55, type: 'vfx', key: 'aura', anchor: 'attacker.root', dur: 0.4, color: 0xd8f0ff, height: 1.0, opacity: 0.22 }, { at: 5.55, type: 'sfx', key: 'strain' }] },
    { id: '06-seoi', title: '背負い投げ', start: 5.8, end: 7.4, intent: '投げの弧に合わせてカメラも回る。相手が頭上を越え、画面が +X 側から -X 側へ返る。そのまま飛んでいく相手を追う',
      actorPose: { attacker: '前へ深く折れて投げ切る', target: '肩の上で折れ→頭上を越え→反対側へ長く飛ぶ' },
      camera: { rig: 'throw-arc-orbit', move: '投げと同じ向きに回り込み、飛ぶ相手を追う', keys: [k(5.80, ['stage', 2.60, 0.30, 1.30], ['target.pelvis', 0, 0, 0], 40, -6), k(6.10, ['stage', 2.10, 0.90, 1.60], ['target.pelvis', 0, -0.2, 0], 46, 6, 'inOutQuad'), k(6.50, ['stage', 1.30, 0.95, 1.80], ['target.pelvis', 0.15, -0.2, 0], 48, 10, 'linear'), k(7.40, ['stage', -0.50, 0.55, 1.90], ['target.pelvis', 0, -0.05, 0], 44, 2, 'outQuad')] },
      cues: [{ at: 6.00, type: 'sfx', key: 'throw_whoosh' }, { at: 6.00, type: 'vfx', key: 'slash_arc', offset: [1.80, 0.75, 0.05], size: 1.2, angle: 20, sweep: 2.2, dur: 0.45, color: 0xffffff }, spray(6.0, 'attacker.root', 12, 0.6), { at: 6.05, type: 'vfx', key: 'speed_lines', dur: 0.5, opacity: 0.35 }] },
    { id: '07-snow-impact', title: '着雪', start: 7.4, end: 8.6, intent: '落ちる側の引き。重い衝撃と白い飛沫。奥に投げ切った姿勢のハクマ',
      actorPose: { attacker: '投げ切った姿勢からゆっくり起きる', target: '雪に落ちて跳ね、止まる' },
      camera: { rig: 'impact-side-wide', move: '固定。衝撃で揺れる', keys: [k(7.40, ['stage', -2.70, 0.28, 1.70], ['stage', -1.55, 0.20, 0], 46, -4), k(8.60, ['stage', -2.80, 0.32, 1.85], ['stage', -1.45, 0.22, 0], 44, -2, 'outQuad')] },
      cues: [{ at: 7.40, type: 'hitstop', dur: 0.12, strength: 'heavy' }, { at: 7.40, type: 'shake', dur: 0.7, amp: 0.09 }, { at: 7.40, type: 'vfx', key: 'flash', dur: 0.12, opacity: 0.4 }, { at: 7.40, type: 'vfx', key: 'shock_ring', offset: [-1.60, 0, 0], radius: 2.4, dur: 0.6, color: 0xffffff },
        { at: 7.40, type: 'vfx', key: 'dust', offset: [-1.60, 0.05, 0], count: 26, spread: 1.3, dur: 1.4, size: 1.5, color: SNOW }, { at: 7.40, type: 'vfx', key: 'debris', offset: [-1.60, 0.05, 0], count: 26, power: 2.4, color: 0xffffff }, { at: 7.40, type: 'sfx', key: 'snow_slam_big' }] },
    { id: '08-immovable', title: '不動', start: 8.6, end: 10.2, intent: '正面の低い位置。襟巻きを直し、腹の前で両手を重ねて目を閉じる。雪だけが降る',
      actorPose: { attacker: 'こちらへ向き直り、襟巻きを直す→両手を腹の前に重ねて目を閉じる', target: '遠くで仰向け（画面外）' },
      camera: { rig: 'low-front-still', move: 'ごくゆっくり引く', keys: [k(8.60, ['stage', 1.95, 0.16, 1.50], ['attacker.chest', 0, 0.08, 0], 38, 3), k(10.2, ['stage', 2.00, 0.18, 1.70], ['attacker.chest', 0, 0.10, 0], 35, 0, 'outQuad')] },
      cues: [{ at: 9.10, type: 'sfx', key: 'scarf_rustle' }, { at: 9.80, type: 'sfx', key: 'finish_pose' }, { at: 9.40, type: 'caption', dur: 0.7, text: '白峰不動掌', sub: 'ハクマ' }, { at: 9.8, type: 'vfx', key: 'puff', anchor: 'attacker.head', offset: [0.02, -0.03, 0.10], count: 5, color: 0xffffff }] },
  ],
  reducedMotion: { useShots: ['04-harite-three', '06-seoi', '08-immovable'], disable: ['shake', 'flash', 'speed_lines', 'dim'], note: '3 カットを固定カメラ（各ショットの最初のキー）で見せる。降雪は残す。役者とキューの時刻は変えない' },
};
