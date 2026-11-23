// マモ拳 v15.1 Presentation（Issue #201）の演出データ。9体それぞれの勝利ムービー（台詞・カメラ・光・音・揺れ）と、
// VS 画面／顔アップの設定。Three.js にも DOM にも依存しない（Node でテストできる）。編集はこのファイルだけで足りる。
//
// カメラの座標: o = [前, 上, 手前]（単位 m）。「前」は勝者が試合中に向いていた方向（相手側）、「手前」は対戦カメラ側。
//   a = 'root'（足元）| 'head'（頭ボーン）| 'chest' を基準に、その時刻の骨の位置へ足す。
//   cut:true のキーはそこで切り替える（前のキーから補間しない）。ease は行き先のキーに付ける。
// 勝利クリップは presentation/v151/<id>_victory.glb の victory_v151（4.0 秒、末尾で保持）。編集正本は tools/mamo3d/motions_v151.py。
export const VICTORY_CLIP = 'victory_v151';
export const VICTORY_CAMERA_DISTANCE = 1.6;   // 全カメラ共通の引き（注視点からの距離の倍率）。寄りすぎて頭が切れないための安全側
export const VICTORY_PACK = id => `../presentation/v151/${id}_victory.glb`;
const K = (t, pa, po, la, lo, fov, extra = {}) => Object.freeze({ t, pos: Object.freeze({ a: pa, o: Object.freeze(po) }), look: Object.freeze({ a: la, o: Object.freeze(lo) }), fov, ...extra });
const C = (t, type, key, extra = {}) => Object.freeze({ t, type, key, ...extra });
export const VICTORY = Object.freeze({
  moguzo: Object.freeze({
    title: '拳を天へ', line: 'まだまだ掘り足りないぜ！', sub: '大地の拳',
    light: { bg: 0x6b4a2c, sun: 0xffd9a0, sunPower: 3.1, hemi: 2.0 },
    // 低い位置から、跳躍に合わせて見上げる煽りへ
    camera: [K(0, 'root', [.55, .34, 1.55], 'chest', [0, .02, 0], 34), K(1.25, 'root', [.42, .30, 1.30], 'chest', [0, .02, 0], 33, { ease: 'inOut' }),
      K(1.75, 'root', [.30, .12, 1.05], 'head', [0, .10, 0], 38, { ease: 'out' }), K(2.5, 'root', [.24, .10, .98], 'head', [0, .04, 0], 36, { ease: 'inOut' }), K(5, 'root', [.16, .09, .86], 'head', [0, .03, 0], 34, { ease: 'inOut' })],
    cues: [C(.55, 'sfx', 'breath'), C(1.6, 'sfx', 'wind'), C(1.68, 'sfx', 'special'), C(2.08, 'sfx', 'clinch'), C(2.08, 'shake', .012), C(2.5, 'sfx', 'chime'), C(1.68, 'fx', 'special', { a: 'root', o: [0, .05, 0] })],
    shortFrom: 70 / 60
  }),
  pisuke: Object.freeze({
    title: '風切り一回転', line: '速すぎて見えなかった？', sub: '疾風の蹴り',
    light: { bg: 0x1f5a70, sun: 0xd8f6ff, sunPower: 3.0, hemi: 2.4 },
    // 横から入り、回転に合わせて回り込む
    camera: [K(0, 'root', [-.95, .36, 1.25], 'chest', [0, 0, 0], 36), K(.85, 'root', [-.60, .34, 1.30], 'chest', [0, 0, 0], 36, { ease: 'inOut' }),
      K(1.0, 'root', [.70, .22, 1.10], 'chest', [.05, 0, 0], 40, { cut: true }), K(1.55, 'root', [.20, .30, 1.45], 'chest', [0, .08, 0], 40, { ease: 'out' }),
      K(2.15, 'root', [-.35, .34, 1.25], 'chest', [0, .04, 0], 36, { ease: 'inOut' }), K(5, 'root', [-.12, .30, .95], 'head', [0, -.02, 0], 33, { ease: 'inOut' })],
    cues: [C(.17, 'sfx', 'tap'), C(.5, 'sfx', 'tap'), C(.87, 'sfx', 'wind'), C(.9, 'sfx', 'hit'), C(1.6, 'sfx', 'wind'), C(1.75, 'sfx', 'wind'), C(2.1, 'sfx', 'tap'), C(2.55, 'sfx', 'chime')],
    shortFrom: 76 / 60
  }),
  godan: Object.freeze({
    distance: 1.45, title: '四股・押忍', line: '押忍。……稽古は続く。', sub: '岩の構え',
    light: { bg: 0x4a3526, sun: 0xffc48a, sunPower: 3.4, hemi: 1.7 },
    // 正面・低い位置の固定気味。踏み下ろしで揺らす
    camera: [K(0, 'root', [.05, .22, 1.75], 'chest', [0, 0, 0], 34), K(1.2, 'root', [.02, .18, 1.60], 'chest', [0, .02, 0], 34, { ease: 'inOut' }),
      K(1.62, 'root', [0, .10, 1.42], 'chest', [0, -.02, 0], 37, { ease: 'in' }), K(2.3, 'root', [0, .14, 1.30], 'chest', [0, .02, 0], 35, { ease: 'out' }), K(5, 'root', [.03, .20, 1.08], 'head', [0, -.06, 0], 33, { ease: 'inOut' })],
    cues: [C(.5, 'sfx', 'grunt'), C(1.22, 'sfx', 'breath'), C(1.63, 'sfx', 'crash'), C(1.63, 'shake', .034), C(1.63, 'fx', 'roar', { a: 'root', o: [0, .03, 0] }), C(1.7, 'sfx', 'crack'), C(2.66, 'sfx', 'grunt'), C(2.7, 'sfx', 'clinch')],
    shortFrom: 60 / 60
  }),
  hakuma: Object.freeze({
    title: '柏手・一礼', line: 'ありがとうございました。', sub: '雪山の礼',
    light: { bg: 0x7fa6b8, sun: 0xf2fbff, sunPower: 2.7, hemi: 2.7 },
    // 高い引きから静かに降りる。お辞儀は少し上から
    camera: [K(0, 'root', [.10, .95, 1.90], 'chest', [0, 0, 0], 32), K(.9, 'root', [.06, .62, 1.55], 'chest', [0, .02, 0], 32, { ease: 'inOut' }),
      K(1.5, 'root', [.02, .42, 1.25], 'chest', [0, .03, 0], 32, { ease: 'inOut' }), K(2.4, 'root', [0, .62, 1.12], 'chest', [0, 0, .06], 32, { ease: 'inOut' }), K(3.0, 'root', [0, .44, 1.05], 'head', [0, -.05, 0], 31, { ease: 'inOut' }), K(5, 'root', [-.05, .36, .92], 'head', [0, -.03, 0], 30, { ease: 'inOut' })],
    cues: [C(.6, 'sfx', 'breath'), C(.93, 'sfx', 'block'), C(1.23, 'sfx', 'block'), C(.93, 'fx', 'block', { a: 'chest', o: [0, .08, .12] }), C(1.23, 'fx', 'block', { a: 'chest', o: [0, .08, .12] }), C(2.0, 'sfx', 'breath'), C(2.95, 'sfx', 'chime')],
    shortFrom: 48 / 60
  }),
  chirka: Object.freeze({
    title: 'くるり・爪先のご挨拶', line: 'えへへ、引っかかった？', sub: '紫の爪',
    light: { bg: 0x4b2a72, sun: 0xf0c8ff, sunPower: 2.8, hemi: 2.3 },
    // 引き→回転で一段寄る→顔のすぐ近くまで
    camera: [K(0, 'root', [.30, .34, 1.70], 'chest', [0, 0, 0], 36), K(.95, 'root', [.22, .32, 1.55], 'chest', [0, 0, 0], 36, { ease: 'inOut' }),
      K(1.0, 'root', [-.20, .40, 1.20], 'chest', [0, .08, 0], 38, { cut: true }), K(1.85, 'root', [-.10, .36, 1.12], 'chest', [0, .04, 0], 38, { ease: 'inOut' }),
      K(2.35, 'root', [.10, .30, .80], 'head', [0, -.02, 0], 34, { ease: 'out' }), K(5, 'root', [.06, .28, .62], 'head', [0, -.01, 0], 32, { ease: 'inOut' })],
    cues: [C(.27, 'sfx', 'tap'), C(.53, 'sfx', 'tap'), C(.8, 'sfx', 'tap'), C(1.2, 'sfx', 'wind'), C(1.45, 'sfx', 'wind'), C(1.83, 'sfx', 'tap'), C(2.33, 'sfx', 'chime'), C(2.63, 'sfx', 'bubble'), C(3.23, 'sfx', 'bubble'), C(2.33, 'fx', 'special', { a: 'head', o: [0, 0, .1] })],
    shortFrom: 100 / 60
  }),
  takimaru: Object.freeze({
    distance: 1.45, title: '力こぶ・胸叩き', line: 'もう一丁、来るか？', sub: '剛腕の圧',
    light: { bg: 0x5a3e2a, sun: 0xffd08a, sunPower: 3.3, hemi: 1.9 },
    // 正面の煽り。胸を叩くたびに一段寄り、最後は肩越しに相手を入れる
    camera: [K(0, 'root', [.10, .16, 1.60], 'chest', [0, .04, 0], 36), K(1.4, 'root', [.06, .14, 1.38], 'chest', [0, .05, 0], 36, { ease: 'inOut' }),
      K(1.6, 'root', [.04, .16, 1.20], 'chest', [0, .05, 0], 35, { ease: 'out' }), K(1.87, 'root', [.03, .17, 1.08], 'chest', [0, .05, 0], 35, { ease: 'out' }), K(2.13, 'root', [.02, .18, .96], 'chest', [0, .05, 0], 35, { ease: 'out' }),
      K(2.4, 'root', [-.55, .50, .95], 'chest', [.35, -.06, 0], 40, { cut: true }), K(5, 'root', [-.48, .46, .82], 'chest', [.40, -.08, 0], 38, { ease: 'inOut' })],
    cues: [C(.47, 'sfx', 'grunt'), C(1.17, 'sfx', 'grunt'), C(1.6, 'sfx', 'clinch'), C(1.87, 'sfx', 'clinch'), C(2.13, 'sfx', 'clinch'), C(1.6, 'shake', .010), C(1.87, 'shake', .012), C(2.13, 'shake', .014), C(2.77, 'sfx', 'roar')],
    shortFrom: 86 / 60
  }),
  yomikage: Object.freeze({
    distance: 1.0, title: '血振り・納め', line: '……終わりだ。', sub: '月影の一閃',
    light: { bg: 0x10283c, sun: 0xa8dcff, sunPower: 2.3, hemi: 1.25 },
    // 真横の長い引き。ほとんど動かない。最後だけ背中へ静かに寄る
    camera: [K(0, 'root', [-.05, .34, 2.10], 'chest', [0, 0, 0], 30), K(1.2, 'root', [-.02, .34, 2.02], 'chest', [0, 0, 0], 30, { ease: 'inOut' }),
      K(1.55, 'root', [0, .32, 1.92], 'chest', [0, -.02, 0], 30, { ease: 'out' }), K(2.8, 'root', [.12, .34, 1.55], 'chest', [0, .02, 0], 30, { ease: 'inOut' }), K(5, 'root', [.20, .36, 1.10], 'head', [0, -.05, 0], 30, { ease: 'inOut' })],
    cues: [C(1.2, 'sfx', 'wind'), C(1.22, 'sfx', 'counter'), C(1.22, 'fx', 'slash', { a: 'chest', o: [.2, -.1, .1] }), C(2.75, 'sfx', 'tap'), C(3.1, 'sfx', 'aura')],
    shortFrom: 64 / 60
  }),
  bullet: Object.freeze({
    distance: 1.4, title: '尾鳴らし・尾の腰掛け', line: '一発で十分さ。', sub: '尾と木の実',
    light: { bg: 0x6a4420, sun: 0xffc070, sunPower: 3.2, hemi: 2.0 },
    // 後ろの尾から入り、正面へ切り替え、最後は低い位置から
    camera: [K(0, 'root', [-1.05, .26, .85], 'root', [-.35, .16, 0], 40), K(1.0, 'root', [-.95, .22, .95], 'root', [-.30, .14, 0], 40, { ease: 'inOut' }),
      K(1.15, 'root', [.25, .36, 1.45], 'chest', [0, .10, 0], 36, { cut: true }), K(1.75, 'root', [.18, .30, 1.35], 'head', [0, .16, 0], 38, { ease: 'out' }), K(2.2, 'root', [.14, .32, 1.25], 'chest', [0, .06, 0], 36, { ease: 'inOut' }), K(5, 'root', [.22, .16, .98], 'chest', [0, .03, 0], 34, { ease: 'inOut' })],
    cues: [C(.5, 'sfx', 'crash'), C(.5, 'shake', .016), C(.87, 'sfx', 'crash'), C(.87, 'shake', .02), C(.5, 'fx', 'roar', { a: 'root', o: [-.4, .03, 0] }), C(.87, 'fx', 'roar', { a: 'root', o: [-.4, .03, 0] }), C(1.43, 'sfx', 'wind'), C(1.95, 'sfx', 'tap'), C(2.87, 'sfx', 'grunt')],
    shortFrom: 70 / 60
  }),
  dark_moguzo: Object.freeze({
    distance: 1.15, title: '背を向ける', line: '…………。', sub: '暗連・無言',
    light: { bg: 0x140f24, sun: 0xb48cff, sunPower: 2.0, hemi: .95 },
    // 握る拳へ寄ったあと、背を向ける間ゆっくり引いていく
    camera: [K(0, 'root', [.45, .30, 1.30], 'chest', [0, 0, 0], 34), K(1.15, 'root', [.30, .28, .92], 'chest', [.02, -.04, .04], 32, { ease: 'inOut' }), K(1.6, 'root', [.28, .27, .88], 'chest', [.02, -.04, .04], 32, { ease: 'inOut' }),
      K(2.7, 'root', [.10, .32, 1.30], 'chest', [0, .02, 0], 33, { ease: 'inOut' }), K(3.3, 'root', [.02, .34, 1.50], 'head', [0, -.06, 0], 33, { ease: 'inOut' }), K(5, 'root', [-.05, .38, 1.95], 'chest', [0, .02, 0], 33, { ease: 'inOut' })],
    cues: [C(.3, 'sfx', 'aura'), C(1.17, 'sfx', 'crack'), C(1.17, 'fx', 'special', { a: 'chest', o: [.05, -.02, .1] }), C(2.0, 'sfx', 'breath'), C(2.95, 'sfx', 'aura'), C(3.77, 'sfx', 'aura')],
    shortFrom: 100 / 60
  })
});
const EASE = { linear: u => u, in: u => u * u, out: u => 1 - (1 - u) ** 2, inOut: u => (u < .5 ? 2 * u * u : 1 - 2 * (1 - u) ** 2) };
// 時刻 t のカメラ区間を返す: {a,b,u}。行き先が cut のときは直前のキーで止める（a===b, u=0）。
export function cameraSegment(keys, t) {
  if (t <= keys[0].t) return { a: keys[0], b: keys[0], u: 0 };
  const last = keys[keys.length - 1]; if (t >= last.t) return { a: last, b: last, u: 0 };
  let i = 0; while (keys[i + 1].t <= t) i++;
  const a = keys[i], b = keys[i + 1]; if (b.cut) return { a, b: a, u: 0 };
  return { a, b, u: (EASE[b.ease] || EASE.inOut)((t - a.t) / (b.t - a.t)) };
}
// 短縮版（サバイバル等）: クリップの shortFrom から再生する。カメラ・キューは同じ時刻表をそのまま使う（＝後半の決めだけ見せる）。
export function victoryPlan(id, variant = 'full', clipSeconds = 4) {
  const v = VICTORY[id]; if (!v) throw Error('victory data missing: ' + id);
  const from = variant === 'short' ? v.shortFrom : 0, hold = variant === 'short' ? .5 : 1.0;
  return { from, length: +(clipSeconds - from + hold).toFixed(3), clipSeconds };
}
// ---- VS 画面と顔アップ ----
export const VS_TEXT = Object.freeze({ dark: '闇の力が高まっている……！', loading: 'LOADING…', ready: 'タップでスキップ' });
// 顔アップのカメラ（頭ボーン基準）。dist は身長 0.60m のときの距離で、身長に比例させる。耳と額が切れない余白を取る。
export const FACE_SHOT = Object.freeze({ fov: 30, dist: .98, side: .55, up: .04, lookUp: .02, lookForward: .055, pushIn: .10, tallRef: .60, minAspectFov: 1.25 });
export function faceCamera(head, facing, height, u, aspect = 1.8) {
  const s = Math.max(.85, height / FACE_SHOT.tallRef), d = FACE_SHOT.dist * s * (1 + FACE_SHOT.pushIn * (1 - Math.min(1, Math.max(0, u))));
  const n = Math.hypot(FACE_SHOT.side, 1), fx = FACE_SHOT.side / n, fz = 1 / n;
  // 画面が正方形に近いときは縦に余るので、横が切れないよう画角を広げる
  const fov = aspect >= FACE_SHOT.minAspectFov ? FACE_SHOT.fov : FACE_SHOT.fov * Math.min(1.6, FACE_SHOT.minAspectFov / Math.max(.5, aspect));
  // 頭ボーンは首の付け根寄りなので、注視点を鼻先の方向へ少し送る（大きい顔でも鼻・耳・額が入る）
  const lx = head[0] + facing * FACE_SHOT.lookForward * s;
  return { pos: [lx + facing * fx * d, head[1] + FACE_SHOT.up * s, head[2] + fz * d], look: [lx, head[1] + FACE_SHOT.lookUp * s, head[2]], fov };
}
