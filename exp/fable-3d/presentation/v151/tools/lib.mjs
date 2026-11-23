// 実ゲーム（dojo/）をヘッドレス Chromium + WebGL で開く共通部品。ゲームのソースは書き換えない（CPU を無入力にする差し替えは opt-in）。
// 時計は page.clock で止め、step() で 1/60 秒ずつ進める＝ 60fps・実時間速度のフレームを決定的に得る。
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
import { fileURLToPath } from 'node:url'; import { createRequire } from 'node:module';
const require = createRequire(import.meta.url); const pw = require('playwright');
export const HERE = path.dirname(fileURLToPath(import.meta.url)); export const REPO = path.resolve(HERE, '../../../../..'); export const FABLE = path.resolve(HERE, '../../..');
export const ALL = ['moguzo', 'pisuke', 'godan', 'hakuma', 'chirka', 'takimaru', 'yomikage', 'bullet', 'dark_moguzo'];
export const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i < 0 ? d : (process.argv[i + 1]?.startsWith('--') || process.argv[i + 1] === undefined ? true : process.argv[i + 1]); };
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.glb': 'model/gltf-binary', '.jpg': 'image/jpeg', '.png': 'image/png', '.css': 'text/css', '.webp': 'image/webp', '.svg': 'image/svg+xml' };
export async function serve(root = REPO) { const srv = await new Promise(res => { const s = http.createServer((q, r) => { let p = path.join(root, decodeURIComponent(q.url.split('?')[0])); if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, 'index.html');
  if (!p.startsWith(root) || !fs.existsSync(p)) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream', 'cache-control': 'no-store' }); fs.createReadStream(p).pipe(r); }).listen(0, '127.0.0.1', () => res(s)); });
  return { srv, url: `http://127.0.0.1:${srv.address().port}` }; }
export const launch = () => pw.chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
// opts: {viewport, scale, stubCpu, reduced, query, base}
export async function openGame(browser, base, { viewport = { width: 852, height: 393 }, scale = 1, stubCpu = true, reduced = false, query = '', mobile = true } = {}) {
  const ctx = await browser.newContext({ viewport, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: scale, reducedMotion: reduced ? 'reduce' : 'no-preference' });
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => { errors.push(e.message); console.log('JS', e.message); });
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  if (stubCpu) await page.route('**/dojo/cpu.js', r => r.fulfill({ contentType: 'text/javascript', body: 'export function cpuInput(){return {};}\nexport const CPU_LEVELS={};\n' }));
  await page.clock.install();
  await page.goto(base + '/exp/fable-3d/dojo/' + query, { waitUntil: 'domcontentloaded' }); await page.waitForFunction(() => window.mamoken3d);
  await page.locator('#selection').waitFor({ state: 'visible' });
  const step = async (n = 1) => { for (let i = 0; i < n; i++) await page.clock.runFor(1000 / 60); };
  const state = () => page.evaluate(() => ({ ...mamoken3d.presentation, context: { ...mamoken3d.presentation.context }, frame: mamoken3d.battle?.frame ?? null, phase: mamoken3d.battle?.phase ?? null, winner: mamoken3d.battle?.winner ?? null, movie: mamoken3d.cinematic.active }));
  // 選んで開始し、GLB の読み込み完了（VS がスキップ可能になる）まで実時間で待ってから時計を止める
  const start = async (p1, cpu, { mode = 'battle' } = {}) => {
    await page.selectOption('#cpu-choice', cpu); await page.selectOption('#match-mode', mode);
    await page.locator('.fighter-card').nth(ALL.indexOf(p1)).tap(); await page.locator('#start').tap();
    await page.waitForFunction(() => mamoken3d.presentation.loaded || mamoken3d.presentation.state === 'fight', null, { timeout: 90000 });
    await page.clock.pauseAt(new Date(Date.now() + 3600e3)); };
  // 進行を状態 name まで進める（最大 max フレーム）。途中の各フレームで each(frameIndex) を呼べる
  const until = async (name, max = 900, each = null) => { for (let i = 0; i < max; i++) { const s = await state(); if (s.state === name) return i; if (each) await each(i, s); await step(1); } throw Error('state ' + name + ' に到達しない: ' + JSON.stringify(await state())); };
  // 決着を作る: 判定は Battle のまま。相手の HP を 1 にして近距離で通常技を当てる（または timeout / double を作る）
  const finish = async (kind = 'ko', { winner = 0 } = {}) => page.evaluate(async ([kind, winner]) => {
    const B = await import('./balance.js'); const g = mamoken3d.battle, a = g.fighters[winner], t = g.fighters[1 - winner];
    if (kind === 'timeout') { t.hp = Math.floor(t.hp / 2); g.time = 2; return; }
    if (kind === 'timeout_draw') { g.time = 2; return; }
    a.x = winner === 0 ? -.2 : .2; t.x = winner === 0 ? .2 : -.2; a.facing = winner === 0 ? 1 : -1; t.facing = -a.facing;
    for (const f of [a, t]) { f.y = 0; f.vy = 0; f.action = null; f.stun = 0; f.stop = 0; f.dashF = 0; }
    t.hp = 1; if (kind === 'double') a.hp = 1; else { t.state = 'idle'; t.input = {}; t.action = null; t.stop = 0; t.stun = 600; }
    for (const f of [a, t]) if (f.ability && 'grit' in f.ability) f.ability.grit = false;   // モグゾーの踏ん張り（HP1 で耐える）は使用済みにして、この一撃で決着させる
    if (kind === 'ultimate') { a.super = 100; g._begin(a, { ...B.ultimateMove(a.id) }, 'ultimate'); return; }
    g._begin(a, { ...B.normalMove(a.id, 'stand_heavy') }, 'stand_heavy'); if (kind === 'double') g._begin(t, { ...B.normalMove(t.id, 'stand_heavy') }, 'stand_heavy');
  }, [kind, winner]);
  return { ctx, page, errors, step, state, start, until, finish };
}
