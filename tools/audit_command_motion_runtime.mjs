// vNext PRESENTATION-R1 (E): 9キャラ×7 Command = 63技すべてについて、Classic/Modern/Ability
// いずれの発動経路でも専用Command motion(cmd_01..cmd_07)が選ばれ、Normal motionへfallbackしないことを
// 実runtime(prototype/mamoken_prototype_v01.htmlそのもの)で機械的に検査する。
//
// 静的データ(BAL/manifestのJSON形状)だけを見るtools/audit_current_impl.mjsとは異なり、これは
// currentArtRequest()/CURRENT_ART_RUNTIME.resolveFrame()という「実際に毎フレーム呼ばれる関数」を
// 本物のブラウザ上で動かして検証する(canvas/Image読み込み等が絡むため純Node vm評価では代替不可。
// 既存の全PR検証で使ってきたPlaywright方式を踏襲)。CIの`npm run check:*`には未接続(playwrightは
// package.jsonのdevDependenciesに無い=このリポジトリのCIはインストールしない)。手動/セッション内実行用。
//
// 使い方: node tools/audit_command_motion_runtime.mjs [--out reports/presentation/COMMAND_MOTION_AUDIT.md]
import { chromium } from 'playwright';
import path from 'node:path';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const outArg = process.argv.indexOf('--out');
const OUT_PATH = outArg >= 0 ? path.resolve(ROOT, process.argv[outArg + 1]) : null;

const file = 'file://' + path.resolve(ROOT, 'prototype/mamoken_prototype_v01.html');
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM || '/opt/pw-browsers/chromium' });
const page = await browser.newPage();
const pageErrors = [];
page.on('pageerror', (e) => pageErrors.push(e.message));
page.on('console', (msg) => { if (msg.type() === 'error') pageErrors.push('CONSOLE.ERROR: ' + msg.text()); });
await page.goto(file);
await page.waitForTimeout(300);

const result = await page.evaluate(() => {
  const rows = [];

  function setupSolo(charId) {
    const idx = CHARS.findIndex((c) => c.id === charId);
    game.p1 = idx; game.p2 = (idx + 1) % CHARS.length;
    aiDifficulty = 'HARD';
    startBattle();
    B.flow = 'fight';
    return B.p[0];
  }

  // Direct-call audit: bypass input timing entirely and start each Command move via the same
  // start*() functions every entry path (Classic/Modern/Ability) ultimately calls, then walk pf
  // across the move's full duration sampling all 4 selectFourFrame() boundaries.
  function auditMove(charId, idx, m) {
    const f = setupSolo(charId);
    const expectedActionId = CURRENT_ART_RUNTIME.commandActionId(idx);
    // cost-gated moves (Godan ARMOR STOCK / Bullet CHARGE) start at 0 on a fresh round;
    // pre-fill the resource so the audit exercises the motion, not the resource gate itself
    // (resource gating is already covered by vNext PR4's own tests, not this tool's scope).
    if (m.cost) f[m.cost.res] = m.cost.amt;
    let started;
    if (m.type === 'grab') started = startCmdGrab(f, m, idx);
    else if (m.type === 'stance') started = startCmdStance(f, m, idx);
    else started = startCmdAtk(f, m, idx);
    if (started === false) {
      return { charId, idx, name: m.name, type: m.type, expectedActionId, pass: false, reason: 'start*() returned false (resource gate) - could not enter Command phase for a fresh/ungated fighter', frames: [] };
    }
    // total duration in pf per phase type, matching advance()'s own completion checks
    let total;
    if (m.type === 'stance') total = m.startupF + m.counterActiveF + m.failRecF;
    else if (m.type === 'grab') total = grabStartup(f) + BAL.GRAB.a + 2 + grabRecFor(f);
    else total = spec(f).s + spec(f).a + spec(f).r + (whiffExtraFor(f) || 0);
    const frames = [];
    let sawNonCommandActionId = null;
    let sawNullFrame = false;
    const sampleCount = Math.max(8, Math.min(40, total));
    const step = Math.max(1, Math.floor(total / sampleCount));
    for (let t = 0; t <= total && f.phase !== 'idle'; t += step) {
      while (f.pf < t && f.phase !== 'idle') advance(f);
      if (f.phase === 'idle') break;
      const req = currentArtRequest(f);
      const frame = currentArtFrame(f);
      const actionId = req && req.actionId;
      if (req && req.kind === 'pose') { sawNonCommandActionId = 'pose:' + req.poseId; }
      else if (actionId && actionId !== expectedActionId) { sawNonCommandActionId = actionId; }
      if (!frame) sawNullFrame = true;
      let frameIndex = null;
      if (req) {
        if (req.kind === 'timed') frameIndex = CURRENT_ART_RUNTIME.selectFourFrame(req.timing, req.phaseFrame);
        else if (req.kind === 'frame') frameIndex = req.frameIndex;
      }
      frames.push({ pf: f.pf, phase: f.phase, kind: req && req.kind, actionId, frameIndex, hasFrame: !!frame });
    }
    const pass = !sawNonCommandActionId && !sawNullFrame && frames.length > 0;
    return { charId, idx, name: m.name, type: m.type, expectedActionId, pass, reason: pass ? 'ok' : (sawNonCommandActionId ? `resolved non-command request: ${sawNonCommandActionId}` : 'resolveFrame() returned null at some sampled pf'), frames };
  }

  const ids = CHARS.map((c) => c.id);
  for (const charId of ids) {
    const c = CHARS.find((cc) => cc.id === charId);
    const moves = commandMovesFor(c);
    moves.forEach((m, idx) => rows.push(auditMove(charId, idx, m)));
  }

  // Entry-path parity spot-check: for every modern:true move, drive the actual Modern pattern
  // input sequence (seeding modernHist directly, exactly as tryModernReplace() expects it) and
  // confirm the resulting cmdIdx/actionId matches the direct-call result above.
  const modernRows = [];
  for (const charId of ids) {
    const c = CHARS.find((cc) => cc.id === charId);
    const patterns = MODERN_PATTERNS[charId] || [];
    for (const p of patterns) {
      const f = setupSolo(charId);
      const opp = B.p[1 - f.side];
      f.modernHist.length = 0;
      const seq = p.seq.slice(0, -1);
      const finalLv = p.seq[p.seq.length - 1];
      for (const lv of seq) f.modernHist.push({ lv, f: B.f });
      const mr = tryModernReplace(f, finalLv);
      const ok = !!mr && mr.move.name === p.move;
      let actionMatches = false;
      let note = '';
      if (ok && !mr.grab) {
        const idx = mr.idx;
        startCmdAtk(f, mr.move, idx);
        const req = currentArtRequest(f);
        actionMatches = !!(req && req.actionId === CURRENT_ART_RUNTIME.commandActionId(idx));
      } else if (ok && mr.grab) {
        // Takimaru Modern Grab pending path: drive it through the actual pendingModernGrab/
        // tickPendingModernGrab() flow a non-throw-eligible opponent takes (not just an
        // assertion on the descriptive move name), then verify the resulting phase/cmdMove/
        // actionId once the opponent becomes throw-eligible and the pending grab fires.
        opp.phase = 'attack'; opp.atkLv = 'mid'; opp.pf = 1; // deliberately not throw-eligible yet
        f.modernHist.length = 0;
        if (throwEligible(opp)) startCmdGrab(f, mr.move, mr.idx);
        else f.pendingModernGrab = { move: mr.move, idx: mr.idx };
        opp.phase = 'idle'; // now throw-eligible
        tickPendingModernGrab(f, opp);
        const req = currentArtRequest(f);
        actionMatches = f.phase === 'grab' && f.cmdMove === mr.move && !!(req && req.actionId === CURRENT_ART_RUNTIME.commandActionId(mr.idx));
        note = 'via pendingModernGrab/tickPendingModernGrab()';
      }
      modernRows.push({ charId, seq: p.seq.join('-'), expectedMove: p.move, replaced: ok, actionMatches, note });
    }
  }
  const modernFailCount = modernRows.filter((r) => !(r.replaced && r.actionMatches)).length;

  return { rows, modernRows, modernFailCount };
});

await browser.close();

const lines = [];
lines.push('| charId | idx | move | type | expected actionId | PASS/FAIL | detail |');
lines.push('|---|---|---|---|---|---|---|');
let failCount = 0;
for (const r of result.rows) {
  if (!r.pass) failCount++;
  lines.push(`| ${r.charId} | ${r.idx} | ${r.name} | ${r.type} | ${r.expectedActionId} | ${r.pass ? 'PASS' : 'FAIL'} | ${r.reason} |`);
}
console.log(lines.join('\n'));
console.log('');
console.log('Frame-index progression for every stance-type move (regression check for the PR3 stanceF removal):');
for (const r of result.rows.filter((x) => x.type === 'stance')) {
  console.log(`  ${r.charId} ${r.name}: pf/frameIndex = ${r.frames.map((fr) => `${fr.pf}:${fr.frameIndex}`).join(', ')}`);
}
console.log('');
console.log(`Total: ${result.rows.length}, PASS: ${result.rows.length - failCount}, FAIL: ${failCount}`);
console.log('');
console.log(`Modern entry-path parity (${result.modernRows.length - result.modernFailCount}/${result.modernRows.length} PASS):`);
for (const r of result.modernRows) {
  const pass = r.replaced && r.actionMatches;
  console.log(`  [${pass ? 'PASS' : 'FAIL'}] ${r.charId} ${r.seq} -> ${r.expectedMove} replaced=${r.replaced} actionMatches=${r.actionMatches}${r.note ? ' (' + r.note + ')' : ''}`);
}
if (pageErrors.length) {
  console.log('PAGE ERRORS:', pageErrors.length);
  for (const e of pageErrors.slice(0, 20)) console.log(e);
}

if (OUT_PATH) {
  const md = [
    '# Command Motion Runtime Audit (PRESENTATION-R1)',
    '',
    'Generated by tools/audit_command_motion_runtime.mjs. 63/63 direct-call rows plus a Modern entry-path parity spot-check.',
    '',
    ...lines,
    '',
    `Total: ${result.rows.length}, PASS: ${result.rows.length - failCount}, FAIL: ${failCount}`,
    '',
    '## Stance-type frame-index progression',
    '',
    '(regression check for the PR3 `stanceF` field removal — `cmdStance` used to compute a',
    'permanently-`NaN` half-window off the no-longer-existent `m.stanceF`, which happened to still',
    'resolve *a* valid frame via `frameAt()`\'s index clamp, silently masking the bug from a plain',
    '"does some frame resolve" check. This shows the fixed F1→F2→F3→F4 progression explicitly.)',
    '',
    ...result.rows.filter((r) => r.type === 'stance').map((r) => `- ${r.charId} ${r.name}: pf/frameIndex = ${r.frames.map((fr) => `${fr.pf}:${fr.frameIndex}`).join(', ')}`),
    '',
    `## Modern entry-path parity (${result.modernRows.length - result.modernFailCount}/${result.modernRows.length} PASS)`,
    '',
    '(Takimaru\'s grab-type pattern is driven through the actual `pendingModernGrab`/',
    '`tickPendingModernGrab()` flow a non-throw-eligible opponent takes, not just asserted by move name.)',
    '',
    '| charId | seq | expected move | replaced | actionId matches | PASS/FAIL | note |',
    '|---|---|---|---|---|---|---|',
    ...result.modernRows.map((r) => `| ${r.charId} | ${r.seq} | ${r.expectedMove} | ${r.replaced} | ${r.actionMatches} | ${r.replaced && r.actionMatches ? 'PASS' : 'FAIL'} | ${r.note} |`),
  ].join('\n');
  writeFileSync(OUT_PATH, md);
  console.log('Wrote', OUT_PATH);
}

process.exit(failCount || result.modernFailCount || pageErrors.length ? 1 : 0);
