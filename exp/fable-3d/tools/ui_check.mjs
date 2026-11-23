#!/usr/bin/env node
// プレビューの操作パネルを実際にクリックして、各機能が動くことを確かめる。結果: validation/preview_ui.json
import { open, ROOT } from './lib/browser.mjs';
import fs from 'node:fs'; import path from 'node:path';
const b = await open({ width: 1180, height: 720, query: '' }); const p = b.page; const R = {}; const st = () => p.evaluate(() => { const S = window.mamo.S; return { id: S.id, cur: S.cur, paused: S.paused, speed: S.speed, toon: S.toon, wire: S.wire, bones: S.bones, facing: S.facing, cam: S.cam, root: S.root, t: S.actions[S.cur].time }; });
const click = (sel, text) => p.locator(sel, { hasText: text }).first().click();
await p.waitForTimeout(600); const t0 = (await st()).t; await p.waitForTimeout(500); R.plays_in_realtime = (await st()).t !== t0;
await click('#chars button', 'godan'); await p.waitForFunction(() => window.mamo.S.id === 'godan'); R.character_select = (await st()).id === 'godan';
await click('#clips button', 'walk_f'); R.clip_select = (await st()).cur === 'walk_f';
// クロスフェード: 0.4秒設定で切り替え、0.2秒進めた時点で両方のクリップに重みが残っていること（実時間に依存しないよう手動で進める）
const w = await p.evaluate(() => { const m = window.mamo, S = m.S; S.paused = true; S.fade = 0.4; m.play('walk_f', { fade: 0 }); m.step(0.1); m.play('stand_heavy'); m.step(0.2); const r = [S.actions.walk_f.getEffectiveWeight(), S.actions.stand_heavy.getEffectiveWeight()]; S.fade = 0.1; S.paused = false; return r; });
R.crossfade_blends = w[0] > 0.05 && w[0] < 0.95 && w[1] > 0.05 && w[1] < 0.95; R.crossfade_weights_at_half = w;
await p.waitForTimeout(1500); R.returns_to_idle_after_oneshot = (await st()).cur === 'idle';
await p.click('#bPlay'); R.pause = (await st()).paused === true; const a = (await st()).t; await p.click('#bNext'); const c = (await st()).t; R.frame_step_is_1_60 = Math.abs((c - a) - 1 / 60) < 1 / 60 + 1e-6 && c > a; await p.click('#bPrev');
await p.click('#bPlay'); await click('#speeds button', '×0.25'); R.slow = (await st()).speed === 0.25; await click('#speeds button', '等速');
for (const [id, k] of [['oBones', 'bones'], ['oWire', 'wire'], ['oToon', 'toon'], ['oRoot', 'root']]) { await p.check('#' + id); R['toggle_' + k] = (await st())[k] === true; await p.waitForTimeout(150); if (k !== 'toon') await p.uncheck('#' + id); }
await click('#facing button', 'ミラー'); R.facing_mirror = (await st()).facing === 'left'; await click('#facing button', '右向き');
await click('#cams button', '斜め'); R.camera_switch = (await st()).cam === 'three_quarter';
await p.waitForTimeout(300); await p.screenshot({ path: path.join(ROOT, 'preview', 'screenshot.jpg'), quality: 85, type: 'jpeg' });
R.console_errors = b.errors; R.all_pass = Object.entries(R).every(([k, v]) => typeof v !== 'boolean' || v) && b.errors.length === 0;
fs.writeFileSync(path.join(ROOT, 'validation', 'preview_ui.json'), JSON.stringify(R, null, 1)); console.log(JSON.stringify(R)); await b.close(); process.exit(R.all_pass ? 0 : 1);
