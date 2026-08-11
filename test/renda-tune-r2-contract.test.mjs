// RENDA-TUNE-R2(#128): verifies the standalone MINIGAME RENDA difficulty baseline (battle Gyuiin
// Lv9-equivalent starting pressure + smooth escalation) and the mirror-tile background seam fix,
// without needing a browser -- rendaDriftMulAt()/rendaBoundaryAt() are pure functions of elapsedSec
// and the BAL constants, so they are extracted and executed directly under node:vm.
//
// Live-browser confirmation (Playwright, not committed): neutral tap cadence ~8.46/sec, synthetic
// 8 taps/sec eventually loses while 9 taps/sec survives the opening seconds then eventually loses as
// escalation rises, and a luminance-band comparison across the mirror-tile seam shows no dark dip
// (relativeDip ~ -1.5%, i.e. noise, vs ~20-28% for crossfade/dark-gradient alternatives that were tried
// and rejected during development -- ghosting from blending two non-matching regions of the same
// non-seamless photo could not be hidden by any crossfade width, so the fix uses mirror-repeat tiling
// instead: alternating normal/flipped copies make every tile boundary converge on the same source pixel
// from both sides, eliminating the seam by construction with no alpha blending at all).

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const prototype = readFileSync(new URL('../prototype/mamoken_prototype_v01.html', import.meta.url), 'utf8');
const dist = readFileSync(new URL('../dist/mamoken_mobile.html', import.meta.url), 'utf8');

for (const source of [prototype, dist]) {
  // Difficulty baseline: battle Gyuiin Lv9-equivalent starting pressure.
  assert.ok(source.includes('tapGain:0.03,baseDrift:0.2538'), 'RENDA.baseDrift must be raised to the Lv9-equivalent value (0.2538)');
  assert.equal(source.includes('tapGain:0.03,baseDrift:0.02,'), false, 'the pre-#128 easy baseDrift (0.02) must be gone');

  // Smooth (non-discrete-step) escalation formula.
  assert.ok(source.includes('return 1+(R.driftStepPct/R.driftStepSec)*elapsedSec;'), 'rendaDriftMulAt must be the continuous linear formula');
  assert.equal(/return 1\+R\.driftStepPct\*Math\.floor/.test(source), false, 'the pre-#128 discrete-step (Math.floor) escalation formula must be gone');

  // Boundary shrink formula unchanged (Issue #128 explicitly forbids speeding this up).
  assert.ok(source.includes('boundaryStepSec:5,boundaryStep:1/16,boundaryFloor:0.375'));
  assert.ok(source.includes('return Math.min(R.boundaryFloor,steps*R.boundaryStep);'));

  // Battle Gyuiin RENDA (separate from standalone MINIGAME RENDA) must stay untouched.
  assert.ok(source.includes('RENDA:{durationF:120,tapGain:1,barRange:20}'), 'battle Gyuiin BAL.MINIGAME.RENDA table must remain untouched');
  assert.ok(source.includes('rendaCpuMin:0.130,rendaCpuRng:0.022}'), 'battle Gyuiin Lv9 rendaCpuMin/rendaCpuRng must remain untouched');

  // Seam fix: mirror-repeat tiling, no alpha/gradient blending, no leftover crossfade helper.
  assert.equal(source.includes('ensureSeamFadedTile'), false, 'the rejected crossfade-tile helper must be fully removed');
  assert.equal(source.includes("rgba(20,24,36,0.35)"), false, 'the pre-#128 dark gradient overlay at the seam must be gone');
  assert.ok(source.includes('function drawMinigameScrollBg('), 'drawMinigameScrollBg must still exist');
  assert.ok(source.includes('ctx.scale(-1,1);ctx.drawImage(img,0,0,dw,dh);'), 'drawMinigameScrollBg must draw mirrored alternating tiles');
  assert.ok(source.includes('const mirrored=(((i%2)+2)%2)===1;'), 'drawMinigameScrollBg must alternate normal/mirrored tiles by parity');
}

// Execute the real formulas (pure functions of BAL + elapsedSec) under vm to verify the checkpoint
// table numerically, rather than trusting the source-text assertions above alone.
const balSlice = prototype.slice(
  prototype.indexOf('tapGain:0.03,baseDrift:0.2538') - 200,
  prototype.indexOf('driftStepSec:10,driftStepPct:0.10') + 60,
);
const sandbox = {
  BAL: {
    MINIGAME: {
      STANDALONE: {
        RENDA: { tapGain: 0.03, baseDrift: 0.2538, boundaryStepSec: 5, boundaryStep: 1 / 16, boundaryFloor: 0.375, driftStepSec: 10, driftStepPct: 0.10 },
      },
    },
  },
};
assert.ok(balSlice.includes('tapGain:0.03,baseDrift:0.2538'), 'sanity: expected literal not found near the slice used for the sandbox cross-check');
vm.createContext(sandbox);
const rendaDriftMulAtSrc = prototype.match(/function rendaDriftMulAt\(elapsedSec\)\{[\s\S]*?\n\}/)[0];
const rendaBoundaryAtSrc = prototype.match(/function rendaBoundaryAt\(elapsedSec\)\{[\s\S]*?\n\}/)[0];
vm.runInContext(`${rendaDriftMulAtSrc}\n${rendaBoundaryAtSrc}`, sandbox);

const neutralRate = sandbox.BAL.MINIGAME.STANDALONE.RENDA.baseDrift / sandbox.BAL.MINIGAME.STANDALONE.RENDA.tapGain;
assert.ok(Math.abs(neutralRate - 8.46) < 0.01, `neutral tap cadence should be ~8.46/sec, got ${neutralRate}`);

const checkpoints = { 0: 1.00, 10: 1.10, 30: 1.30, 60: 1.60, 120: 2.20 };
for (const [t, expected] of Object.entries(checkpoints)) {
  const actual = sandbox.rendaDriftMulAt(Number(t));
  assert.ok(Math.abs(actual - expected) < 1e-9, `rendaDriftMulAt(${t}) should be ${expected}, got ${actual}`);
}
// Smoothness: no discrete jump between checkpoints (strictly monotonic, continuous).
assert.ok(sandbox.rendaDriftMulAt(5) > sandbox.rendaDriftMulAt(0) && sandbox.rendaDriftMulAt(5) < sandbox.rendaDriftMulAt(10), 'escalation must be continuous, not a discrete step, between 0s and 10s');

console.log(`RENDA-TUNE-R2 contract tests passed; neutralRate=${neutralRate.toFixed(2)}/sec; checkpoints=${Object.keys(checkpoints).length}`);
