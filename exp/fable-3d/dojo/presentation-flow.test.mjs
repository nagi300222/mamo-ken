// v15.1 Presentation（Issue #201）: 表示側の状態機械とデータの受入テスト。Battle には触れない純ロジック。
import test from 'node:test'; import assert from 'node:assert/strict'; import { readFileSync, existsSync } from 'node:fs';
import { createPresentationFlow, FLOW_TIMING as T, classifyRoundEnd, KO_TEXT } from './presentation-flow.js';
import { VICTORY, VICTORY_CLIP, VICTORY_PACK, cameraSegment, victoryPlan, faceCamera } from './presentation-data.js';
import { IDS, ROSTER } from './balance.js';
import { Battle } from './battle.js';
const run = (flow, seconds, dt = 1 / 60) => { for (let t = 0; t < seconds - 1e-9; t += dt) flow.update(dt); };
const toFight = flow => { flow.begin({ ids: ['moguzo', 'godan'] }); flow.assetsLoaded(); run(flow, T.vsAuto + T.face * 2 + T.wide + T.call + .1); };

test('SELECT → VS → 顔アップ(1P→CPU) → 引き → FIGHT の順で、FIGHT まで入力と Battle を止める', () => {
  const flow = createPresentationFlow(); assert.equal(flow.state, 'select');
  flow.begin({ ids: ['moguzo', 'godan'] }); assert.equal(flow.state, 'vs'); assert.equal(flow.battleRunning, false);
  run(flow, 5); assert.equal(flow.state, 'vs', 'ロード完了まで VS から進まない'); assert.equal(flow.skip(), false, 'ロード中はスキップ不可');
  flow.assetsLoaded(); run(flow, T.vsAuto + .02); assert.equal(flow.state, 'intro');
  assert.deepEqual([flow.introPhase.phase, flow.introPhase.slot], ['face', 0]); run(flow, T.face); assert.deepEqual([flow.introPhase.phase, flow.introPhase.slot], ['face', 1]);
  run(flow, T.face); assert.equal(flow.introPhase.phase, 'wide'); run(flow, T.wide); assert.equal(flow.introPhase.phase, 'call'); assert.equal(flow.inputEnabled, false);
  run(flow, T.call + .02); assert.equal(flow.state, 'fight'); assert.equal(flow.inputEnabled, true); assert.equal(flow.battleRunning, true);
  assert.deepEqual(flow.log, ['vs', 'intro', 'fight']);
});
test('VS のスキップはロード完了後だけ。顔アップのスキップは FIGHT 表示へ飛ぶだけで、いきなり操作可能にはしない', () => {
  const flow = createPresentationFlow(); flow.begin({ ids: ['pisuke', 'chirka'] }); flow.assetsLoaded();
  assert.equal(flow.skip(), false, '誤タップ防止の最短時間'); run(flow, T.vsMin + .02); assert.equal(flow.skip(), true); assert.equal(flow.state, 'intro');
  assert.equal(flow.skip(), true); assert.equal(flow.introPhase.phase, 'call'); assert.equal(flow.inputEnabled, false); assert.equal(flow.skip(), false);
  run(flow, T.call + .02); assert.equal(flow.state, 'fight');
});
test('プラクティス／演出確認は VS と顔アップを通らず、ロード完了ですぐ FIGHT', () => {
  const flow = createPresentationFlow(); flow.begin({ ids: ['moguzo', 'godan'], instant: true }); assert.equal(flow.state, 'loading'); assert.equal(flow.battleRunning, false);
  flow.assetsLoaded(); assert.equal(flow.state, 'fight'); assert.deepEqual(flow.log, ['loading', 'fight']);
});
test('決着の種類: K.O. / DOUBLE K.O. / TIME UP / TIME UP・DRAW を取り違えない', () => {
  assert.equal(classifyRoundEnd({ winner: 0, timedOut: false }), 'ko'); assert.equal(classifyRoundEnd({ winner: -1, timedOut: false }), 'double_ko');
  assert.equal(classifyRoundEnd({ winner: 1, timedOut: true }), 'timeout'); assert.equal(classifyRoundEnd({ winner: -1, timedOut: true }), 'timeout_draw');
  assert.equal(KO_TEXT.ko.title, 'K.O.'); assert.equal(KO_TEXT.timeout.title, 'TIME UP'); assert.notEqual(KO_TEXT.timeout_draw.title, 'K.O.'); assert.equal(KO_TEXT.double_ko.title, 'DOUBLE K.O.');
  for (const [end, text, next] of [[{ winner: 0 }, 'K.O.', 'victory'], [{ winner: -1 }, 'DOUBLE K.O.', 'result'], [{ winner: 1, timedOut: true }, 'TIME UP', 'victory'], [{ winner: -1, timedOut: true }, 'TIME UP', 'result']]) {
    const flow = createPresentationFlow(); toFight(flow); assert.equal(flow.roundEnd(end), true); assert.equal(flow.koText.title, text); run(flow, 3.2); assert.equal(flow.state, next, text + ' の次');
  }
});
test('KO は 1 回だけ。hud から毎フレーム報告されても、奥義ムービー後でもスキップ後でも重複しない', () => {
  const flow = createPresentationFlow(); toFight(flow);
  assert.equal(flow.roundEnd({ winner: 0, viaUltimate: true }), true); for (let i = 0; i < 20; i++) assert.equal(flow.roundEnd({ winner: 0, viaUltimate: true }), false);
  assert.equal(flow.log.filter(s => s === 'ko').length, 1); assert.equal(flow.skip(), true); assert.equal(flow.state, 'victory'); assert.equal(flow.roundEnd({ winner: 0 }), false);
  assert.equal(flow.skip(), true); assert.equal(flow.state, 'result'); assert.equal(flow.skip(), false); assert.equal(flow.roundEnd({ winner: 0 }), false);
  assert.deepEqual(flow.log, ['vs', 'intro', 'fight', 'ko', 'victory', 'result']);
});
test('KO スローは表示クロックの倍率だけ: 静止 → スロー → 等速。時間切れ・低刺激ではスローにしない', () => {
  const flow = createPresentationFlow(); toFight(flow); assert.equal(flow.koSlow, 1); flow.roundEnd({ winner: 1 });
  assert.equal(flow.koSlow, 0); run(flow, T.koFreeze + .05); assert.equal(flow.koSlow, T.koSlow); assert.equal(flow.battleRunning, false, 'KO 中は Battle を進めない');
  run(flow, T.koSlowUntil); assert.ok(flow.koSlow > T.koSlow && flow.koSlow <= 1);
  const time = createPresentationFlow(); toFight(time); time.roundEnd({ winner: 0, timedOut: true }); run(time, .5); assert.equal(time.koSlow, 1);
  const calm = createPresentationFlow({ reduced: true }); toFight(calm); calm.roundEnd({ winner: 0 }); run(calm, .5); assert.equal(calm.koSlow, 1);
  const ult = createPresentationFlow(); toFight(ult); ult.roundEnd({ winner: 0, viaUltimate: true }); run(ult, T.koUltimate + .05); assert.equal(ult.state, 'victory', '奥義 KO 後は短い K.O. の後に勝利へ');
});
test('ラウンドフック: nextRound / victory / result を連戦側が決められる。引き分けに勝利ムービーは出さない', () => {
  const seen = []; const flow = createPresentationFlow({ onRoundEnd: info => { seen.push(info); return info.round < 2 ? 'nextRound' : { next: 'victory', victoryVariant: 'short' }; } });
  toFight(flow); flow.roundEnd({ winner: 0 }); run(flow, 3); assert.equal(flow.state, 'await_round'); assert.equal(flow.battleRunning, false);
  assert.equal(flow.beginRound({ round: 2, roundLabel: 'FINAL ROUND' }), true); assert.equal(flow.state, 'intro'); assert.equal(flow.introPhase.phase, 'wide'); assert.equal(flow.roundCall, 'FINAL ROUND');
  run(flow, T.roundIntro + .02); assert.equal(flow.state, 'fight'); flow.roundEnd({ winner: 0 }); run(flow, 3); assert.equal(flow.state, 'victory'); assert.equal(flow.victory.variant, 'short');
  assert.deepEqual(seen.map(s => [s.winner, s.reason, s.round]), [[0, 'ko', 1], [0, 'ko', 2]]);
  const draw = createPresentationFlow({ onRoundEnd: () => 'victory' }); toFight(draw); draw.roundEnd({ winner: -1 }); run(draw, 3.2); assert.equal(draw.state, 'result');
});
test('表示クロックは Battle を進めない: 導入・KO・勝利の間に何秒経っても Battle.frame と HP は不変', () => {
  const battle = new Battle('moguzo', 'godan', 1), flow = createPresentationFlow(); flow.begin({ ids: ['moguzo', 'godan'] }); flow.assetsLoaded();
  const tick = seconds => { for (let t = 0; t < seconds; t += 1 / 60) { flow.update(1 / 60); if (flow.battleRunning && battle.phase === 'fight') battle.tick({}, {}); } };
  tick(T.vsAuto + T.face * 2 + T.wide + T.call - .1); assert.equal(battle.frame, 0); tick(.3); assert.ok(battle.frame > 0);
  battle.fighters[1].hp = 0; battle.fighters[1].ko = true; battle.phase = 'ko'; battle.winner = 0; const frame = battle.frame, hp = battle.fighters[0].hp;
  flow.roundEnd({ winner: 0 }); tick(12); assert.equal(flow.state, 'result'); assert.equal(battle.frame, frame); assert.equal(battle.fighters[0].hp, hp);
});
test('勝利ムービー: 9体すべてに固有の題・台詞・光・カメラ・音があり、クリップは敗者用 ko ではない', () => {
  assert.deepEqual(Object.keys(VICTORY).sort(), [...IDS].sort()); assert.equal(VICTORY_CLIP, 'victory_v151'); assert.notEqual(VICTORY_CLIP, 'ko');
  const sig = key => new Set(IDS.map(id => JSON.stringify(VICTORY[id][key])));
  for (const key of ['title', 'line', 'light', 'camera', 'cues']) assert.equal(sig(key).size, 9, key + ' が 9 通り');
  const meta = JSON.parse(readFileSync(new URL('../presentation/v151/victory_motions.json', import.meta.url), 'utf8'));
  for (const id of IDS) {
    const v = VICTORY[id], m = meta.clips[id]; assert.ok(m, id + ' のクリップ記録'); assert.equal(m.clip, VICTORY_CLIP); assert.equal(m.group, 'victory');
    assert.ok(existsSync(new URL(VICTORY_PACK(id), import.meta.url)), id + ' の勝利 GLB'); assert.ok(m.duration_sec >= 3 && m.duration_sec <= 6);
    assert.ok(v.camera.length >= 4 && v.cues.filter(c => c.type === 'sfx').length >= 3); assert.ok(v.camera.every((k, i) => !i || k.t > v.camera[i - 1].t));
    assert.equal(+(m.short_from_frame / 60).toFixed(4), +v.shortFrom.toFixed(4), id + ' 短縮版の開始が編集元と一致');
    const full = victoryPlan(id, 'full', m.duration_sec), short = victoryPlan(id, 'short', m.duration_sec); assert.ok(short.length < full.length - 1 && short.from > 0 && full.from === 0);
    assert.ok(ROSTER[id]);
  }
  assert.equal(new Set(IDS.map(id => meta.clips[id].name_jp)).size, 9);
});
test('カメラ: カット指定は補間しない。顔アップは頭ボーン基準で左右対称、狭い画面では画角を広げる', () => {
  const keys = VICTORY.pisuke.camera, cut = keys.findIndex(k => k.cut); const before = cameraSegment(keys, keys[cut].t - .01); assert.equal(before.a, before.b); assert.equal(before.u, 0);
  assert.equal(cameraSegment(keys, keys[cut].t).a, keys[cut]); const mid = cameraSegment(keys, (keys[0].t + keys[1].t) / 2); assert.ok(mid.u > 0 && mid.u < 1);
  const a = faceCamera([-.7, .5, 0], 1, .62, 1, 1.8), b = faceCamera([.7, .5, 0], -1, .62, 1, 1.8);
  assert.ok(Math.abs(a.pos[0] + b.pos[0]) < 1e-9 && a.pos[2] === b.pos[2]); assert.ok(a.pos[0] > -.7, '1P は相手側（顔の前）から'); assert.ok(b.pos[0] < .7);
  assert.ok(faceCamera([0, .5, 0], 1, .62, 0, 1.8).pos[2] > a.pos[2], '寄っていく'); assert.ok(faceCamera([0, .5, 0], 1, .62, 1, .9).fov > a.fov);
});
test('ゲーム本体への接続: 決着は Presentation へ 1 回渡し、Battle.tick は fight 中だけ。旧来の即時リザルトは無い', () => {
  const main = readFileSync(new URL('./main.js', import.meta.url), 'utf8'), html = readFileSync(new URL('./index.html', import.meta.url), 'utf8'), build = readFileSync(new URL('./build-pages.mjs', import.meta.url), 'utf8');
  assert.match(main, /battle\.phase==='fight'&&!movie\.active&&flow\.battleRunning/); assert.match(main, /if\(reportRoundEnd\(\)\)finishShown=true/);
  assert.ok(!/finishShown=true;playing=false;\$\('game-over'\)/.test(main)); assert.match(main, /if\(movie\.active\|\|!flow\.inputEnabled\)return/);
  for (const id of ['vs-screen', 'intro-plate', 'round-call', 'ko-banner', 'victory-banner', 'presentation-skip']) assert.equal((html.match(new RegExp('id="' + id + '"', 'g')) || []).length, 1, id);
  // 表示は実経過時間（elapsed）で進め、勝利クリップは表示時計へ同期。Battle 用の delta 上限とは別
  assert.match(main, /const present=Math\.min\(\.25,elapsed\)/); assert.match(main, /flow\.update\(present\)/); assert.ok(!/flow\.update\(delta\)/.test(main));
  assert.match(main, /actor\.victory\.action\.time=Math\.min\(actor\.victory\.duration-1e-4,time\)/); assert.match(main, /if\(!document\.hidden\)\{lastFrame=0;return;\}/);
  assert.match(build, /presentation-flow\.js/); assert.match(build, /_victory\.glb/);
});
