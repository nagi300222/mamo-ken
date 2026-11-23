// マモ拳 v15.1 Presentation flow（Issue #201）。
// SELECT → VS → FACE INTRO → ROUND(FIGHT) → KO / TIME UP → (NEXT ROUND | VICTORY) → RESULT の表示側の状態機械。
// Three.js・DOM・Battle には依存しない純ロジック。Battle の 60Hz 判定には一切触れず、「いま戦闘を進めてよいか」と
// 「表示だけをどれだけ遅くするか」を返すだけ。時間は実時間の秒（update(dt) に渡した分だけ進む。非表示中は呼ばない）。
export const FLOW_TIMING = Object.freeze({
  vsMin: .9,          // ロード完了後、これ未満ではスキップ不可（誤タップで飛ばさない）
  vsAuto: 2.4,        // ロード完了後に自動で先へ進むまで
  face: 1.15,         // 顔アップ 1 人ぶん
  faceReduced: .7,
  wide: .55,          // 対戦カメラへ戻る引き
  call: .75,          // ROUND n / FIGHT の表示（この終わりで入力解禁）
  roundIntro: 1.1,    // 2 ラウンド目以降の短い導入（顔アップなし）
  ko: 2.6, koUltimate: 1.5, double: 2.8, timeup: 1.7,
  koFreeze: .28,      // 当たった瞬間の静止
  koSlowUntil: 1.75,  // ここまでスロー、以降は等速へ戻す
  koSlow: .22,        // スロー中の再生倍率（表示クロックだけ）
  victory: 5.0, victoryShort: 2.4
});
export const KO_TEXT = Object.freeze({
  ko: { title: 'K.O.', sub: '' }, double_ko: { title: 'DOUBLE K.O.', sub: '相打ち' },
  timeout: { title: 'TIME UP', sub: '' }, timeout_draw: { title: 'TIME UP', sub: 'DRAW' }
});
// reason: 'ko' | 'double_ko' | 'timeout'。winner: 0 | 1 | -1（引き分け）
export function classifyRoundEnd({ winner, timedOut }) {
  if (timedOut) return winner < 0 ? 'timeout_draw' : 'timeout';
  return winner < 0 ? 'double_ko' : 'ko';
}
export function createPresentationFlow({ reduced = false, onRoundEnd = null, onChange = null } = {}) {
  const T = FLOW_TIMING;
  let state = 'select', t = 0, loaded = false, ctx = null, serial = 0, reducedMotion = !!reduced, roundHook = onRoundEnd;
  const log = [];
  function go(next, extra = {}) {
    const from = state; state = next; t = 0; ctx = { ...(ctx || {}), ...extra }; log.push(next); if (log.length > 64) log.shift();
    onChange?.(next, from, api);
  }
  const faceTime = () => (reducedMotion ? T.faceReduced : T.face);
  const introLength = () => (ctx?.introKind === 'round' ? T.roundIntro : faceTime() * 2 + T.wide + T.call);
  const koLength = () => (ctx?.kind === 'ko' ? (ctx.viaUltimate ? T.koUltimate : T.ko) : ctx?.kind === 'double_ko' ? T.double : T.timeup);
  const victoryLength = () => ctx?.victoryLength ?? (ctx?.victoryVariant === 'short' ? T.victoryShort : T.victory);
  function decide() {
    const info = { winner: ctx.winner, reason: ctx.kind, round: ctx.round ?? 1, viaUltimate: !!ctx.viaUltimate };
    let next = roundHook ? roundHook(info) : null;
    if (typeof next === 'object' && next) { ctx = { ...ctx, ...next }; next = next.next; }
    if (!['nextRound', 'victory', 'result'].includes(next)) next = info.winner >= 0 ? 'victory' : 'result';
    if (next === 'victory' && !(info.winner >= 0)) next = 'result';      // 引き分けに勝利ムービーは出さない
    if (next === 'nextRound') go('await_round'); else go(next);
  }
  const api = {
    get state() { return state; }, get time() { return t; }, get context() { return ctx; }, get loaded() { return loaded; }, get serial() { return serial; },
    get log() { return log.slice(); },
    set reduced(v) { reducedMotion = !!v; }, get reduced() { return reducedMotion; },
    set onRoundEnd(fn) { roundHook = fn; },
    // ---- 進行 ----
    // 対戦組合せ確定。instant=true（プラクティス・演出確認）は VS と顔アップを通らず、ロード完了ですぐ FIGHT。
    begin({ ids, instant = false, round = 1, roundLabel = null, victoryVariant = 'full', vsVariant = 'full' } = {}) {
      serial++; loaded = false; ctx = { ids, instant, round, roundLabel, victoryVariant, vsVariant }; go(instant ? 'loading' : 'vs');
    },
    assetsLoaded() { if (loaded) return; loaded = true; if (state === 'loading') go('fight'); else if (state === 'vs') t = 0; },
    loadFailed() { loaded = false; ctx = null; go('select'); },
    // 次ラウンドの Battle を作り終えたら呼ぶ（連戦コントローラ用）。顔アップは出さず短い導入だけ。
    beginRound({ round, roundLabel = null, face = false } = {}) {
      if (state !== 'await_round' && state !== 'result' && state !== 'select') return false;
      ctx = { ...ctx, round, roundLabel, introKind: face ? 'face' : 'round', kind: undefined, winner: undefined, viaUltimate: false }; go('intro'); return true;
    },
    // Battle が決着した（奥義ムービー中は呼ばない＝ムービー終了後に 1 回だけ）。fight 以外では無視するので二重発火しない。
    roundEnd({ winner, timedOut = false, viaUltimate = false } = {}) {
      if (state !== 'fight') return false;
      go('ko', { kind: classifyRoundEnd({ winner, timedOut }), winner, viaUltimate, timedOut }); return true;
    },
    // スキップ（タップ／キー）。飛ばせたら true。Battle を先へ進めることはない。
    skip() {
      if (state === 'vs') { if (!loaded || t < T.vsMin) return false; go('intro', { introKind: 'face', skippedVs: true }); return true; }
      if (state === 'intro') { const start = introLength() - T.call; if (t >= start) return false; t = start; return true; }
      if (state === 'ko') { t = koLength(); decide(); return true; }
      if (state === 'victory') { go('result', { victorySkipped: true }); return true; }
      return false;
    },
    reset() { serial++; loaded = false; ctx = null; go('select'); },
    update(dt) {
      if (!(dt > 0)) return state;
      if (state === 'vs') { if (loaded) { t += dt; if (t >= (ctx.vsVariant === 'short' ? T.vsMin : T.vsAuto)) go('intro', { introKind: 'face' }); } return state; }
      if (state === 'intro') { t += dt; if (t >= introLength()) go('fight'); return state; }
      if (state === 'ko') { t += dt; if (t >= koLength()) decide(); return state; }
      if (state === 'victory') { t += dt; if (t >= victoryLength()) go('result'); return state; }
      if (state === 'fight') t += dt;
      return state;
    },
    // ---- 表示側が読む値 ----
    get battleRunning() { return state === 'fight'; },          // true の間だけ Battle.tick と入力を通す
    get inputEnabled() { return state === 'fight'; },
    get introPhase() {
      if (state !== 'intro') return null;
      if (ctx.introKind === 'round') return { phase: t < T.roundIntro - T.call ? 'wide' : 'call', u: Math.min(1, t / T.roundIntro), slot: -1 };
      const f = faceTime();
      if (t < f) return { phase: 'face', slot: 0, u: t / f };
      if (t < 2 * f) return { phase: 'face', slot: 1, u: (t - f) / f };
      if (t < 2 * f + T.wide) return { phase: 'wide', slot: -1, u: (t - 2 * f) / T.wide };
      return { phase: 'call', slot: -1, u: (t - 2 * f - T.wide) / T.call };
    },
    get roundCall() { const r = ctx?.round ?? 1; return ctx?.roundLabel || 'ROUND ' + r; },
    // KO 中の表示クロックの倍率。Battle は止まっているので、役者のミキサーとエフェクトだけがこの倍率で進む。
    get koSlow() {
      if (state !== 'ko') return 1;
      if (ctx.kind === 'timeout' || ctx.kind === 'timeout_draw') return 1;
      if (reducedMotion) return 1;                                 // 低刺激: スローにしない
      if (ctx.viaUltimate) return .6;                              // ムービーで見せた後なので軽く
      if (t < T.koFreeze) return 0;
      if (t < T.koSlowUntil) return T.koSlow;
      return Math.min(1, T.koSlow + (1 - T.koSlow) * (t - T.koSlowUntil) / .45);
    },
    get koText() { return state === 'ko' ? KO_TEXT[ctx.kind] : null; },
    get koProgress() { return state === 'ko' ? Math.min(1, t / koLength()) : 0; },
    get victory() { return state === 'victory' ? { slot: ctx.winner, variant: ctx.victoryVariant || 'full', t, length: victoryLength() } : null; },
    setVictoryLength(seconds) { if (ctx) ctx.victoryLength = seconds; }
  };
  return api;
}
