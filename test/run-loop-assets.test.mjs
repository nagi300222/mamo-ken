// RUN-LOOP-R1(#113): verifies the delivered quadruped run-loop art (9 characters, F1-F4 loop).
// - assets/art/run_loop_source/<id>/{original,sheet_1x4,frames/f1-4}.png are the untouched
//   originals and must keep the exact sha256 recorded in data/art/run_loop_source_manifest.json
//   (source integrity; never overwritten by tools/build_run_loop_art.mjs).
// - assets/art/runtime/<id>/run_loop/p1|p2/f{1-4}.png (the derived runtime frames actually
//   loadImg()'d by the prototype) must exist, be non-empty PNGs, and p1/p2 must share identical
//   alpha geometry (P2 recolor never changes silhouette, same invariant as build_current_art.mjs).
// - the flagged extraction-artifact frames (bullet F2/F4, takimaru F1/F2/F3) must decode to a
//   single connected alpha component in the derived output (islands removed).
// - the prototype must reference every run_loop assetKey via loadImg(), and dist must embed the
//   derived copies as data URLs while art/run_loop_source/ itself must NOT be embedded.
// - standalone MINIGAME RENDA must call the new draw path; battle Gyuiin RENDA
//   (stepRenda/BAL.MINIGAME.RENDA) must stay untouched.

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(readFileSync(path.join(ROOT, 'data', 'art', 'run_loop_source_manifest.json'), 'utf8'));
const prototype = readFileSync(path.join(ROOT, 'prototype', 'mamoken_prototype_v01.html'), 'utf8');
const distPath = path.join(ROOT, 'dist', 'mamoken_mobile.html');
const dist = existsSync(distPath) ? readFileSync(distPath, 'utf8') : null;

let distAssetMap = null;
if (dist) {
  const m = dist.match(/const __ASSET_MAP__=(\{.*?\});\nconst ASSETS=/s);
  assert.ok(m, 'dist must contain a generated const __ASSET_MAP__=...; literal');
  distAssetMap = JSON.parse(m[1]);
}

function sha256(absPath) {
  return createHash('sha256').update(readFileSync(absPath)).digest('hex');
}

async function rawRgba(absPath) {
  const { data, info } = await sharp(absPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
}

function alphaGeometrySignature(data, width, height, alphaThresh = 10) {
  const bits = Buffer.alloc(width * height);
  for (let pixel = 0; pixel < bits.length; pixel += 1) bits[pixel] = data[pixel * 4 + 3] >= alphaThresh ? 1 : 0;
  return createHash('sha256').update(bits).digest('hex');
}

function connectedComponentCount(data, width, height, alphaThresh = 10) {
  const n = width * height;
  const seen = new Uint8Array(n);
  let components = 0;
  const stack = [];
  for (let start = 0; start < n; start += 1) {
    if (seen[start] || data[start * 4 + 3] < alphaThresh) continue;
    components += 1;
    stack.push(start);
    seen[start] = 1;
    while (stack.length) {
      const cur = stack.pop();
      const cy = Math.floor(cur / width), cx = cur % width;
      const neighbors = [[cx - 1, cy], [cx + 1, cy], [cx, cy - 1], [cx, cy + 1]];
      for (const [nx, ny] of neighbors) {
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
        const nidx = ny * width + nx;
        if (seen[nidx] || data[nidx * 4 + 3] < alphaThresh) continue;
        seen[nidx] = 1;
        stack.push(nidx);
      }
    }
  }
  return components;
}

const RUNTIME_IDS = Object.keys(manifest.characters);
assert.equal(RUNTIME_IDS.length, 9, 'expected 9 characters in run_loop_source_manifest.json');
assert.deepEqual(
  new Set(RUNTIME_IDS),
  new Set(['moguzo', 'pisuke', 'godan', 'hakuma', 'chirka', 'takimaru', 'yomikage', 'bullet', 'dark_moguzo']),
  'runtime IDs must match the existing ASCII character ID convention',
);

for (const id of RUNTIME_IDS) {
  const entry = manifest.characters[id];
  const sourceDescriptors = [entry.original, entry.sheet1x4, ...Object.values(entry.frames)];
  for (const descriptor of sourceDescriptors) {
    const abs = path.join(ROOT, descriptor.path);
    assert.ok(existsSync(abs), `missing run-loop source file: ${descriptor.path}`);
    assert.ok(statSync(abs).size > 0, `empty run-loop source file: ${descriptor.path}`);
    assert.equal(sha256(abs), descriptor.sha256, `source sha256 mismatch (must stay byte-identical to delivered ZIP): ${descriptor.path}`);
  }
}

for (const id of RUNTIME_IDS) {
  assert.ok(prototype.includes(`'run_loop_'+charId+'_'+palette+'_f'+`) || prototype.includes('runLoopAssetKey'), 'prototype must build run_loop asset keys via runLoopAssetKey()');
  for (const pal of ['p1', 'p2']) {
    for (let fi = 1; fi <= 4; fi += 1) {
      const relFromAssets = `art/runtime/${id}/run_loop/${pal}/f${fi}.png`;
      const abs = path.join(ROOT, 'assets', relFromAssets);
      assert.ok(existsSync(abs), `missing derived run_loop frame: ${relFromAssets}`);
      assert.ok(statSync(abs).size > 0, `empty derived run_loop frame: ${relFromAssets}`);
      if (distAssetMap) {
        const key = '../assets/' + relFromAssets;
        assert.ok(Object.prototype.hasOwnProperty.call(distAssetMap, key), `dist __ASSET_MAP__ missing entry for ${key}`);
        assert.match(distAssetMap[key], /^data:image\//, `dist __ASSET_MAP__[${key}] must be an embedded image data URL`);
      }
    }
  }
}

// P1/P2 must preserve alpha geometry (silhouette) exactly, same invariant as
// build_current_art.mjs's applyP2Palette() usage -- recolor must never touch shape.
for (const id of RUNTIME_IDS) {
  for (let fi = 1; fi <= 4; fi += 1) {
    const p1Abs = path.join(ROOT, 'assets', 'art', 'runtime', id, 'run_loop', 'p1', `f${fi}.png`);
    const p2Abs = path.join(ROOT, 'assets', 'art', 'runtime', id, 'run_loop', 'p2', `f${fi}.png`);
    const p1 = await rawRgba(p1Abs), p2 = await rawRgba(p2Abs);
    assert.equal(p1.width, p2.width, `p1/p2 width mismatch: ${id} f${fi}`);
    assert.equal(p1.height, p2.height, `p1/p2 height mismatch: ${id} f${fi}`);
    assert.equal(
      alphaGeometrySignature(p1.data, p1.width, p1.height),
      alphaGeometrySignature(p2.data, p2.width, p2.height),
      `P2 palette must not change silhouette geometry: ${id} f${fi}`,
    );
  }
}

// Flagged extraction-artifact frames (data/art/run_loop_source_manifest.json cleanupFindings)
// must decode to a single connected alpha component after tools/build_run_loop_art.mjs cleanup.
const CLEANED_FRAMES = [['bullet', 2], ['bullet', 4], ['takimaru', 1], ['takimaru', 2], ['takimaru', 3]];
for (const [id, fi] of CLEANED_FRAMES) {
  const abs = path.join(ROOT, 'assets', 'art', 'runtime', id, 'run_loop', 'p1', `f${fi}.png`);
  const { data, width, height } = await rawRgba(abs);
  assert.equal(connectedComponentCount(data, width, height), 1, `expected extraction-artifact island removed: ${id} f${fi}`);
}
// Spot-check a couple of always-clean frames stay single-component too (sanity, not exhaustive).
for (const [id, fi] of [['godan', 1], ['moguzo', 3]]) {
  const abs = path.join(ROOT, 'assets', 'art', 'runtime', id, 'run_loop', 'p1', `f${fi}.png`);
  const { data, width, height } = await rawRgba(abs);
  assert.equal(connectedComponentCount(data, width, height), 1, `expected single component: ${id} f${fi}`);
}

// prototype/build_mobile wiring.
assert.ok(prototype.includes('function drawMinigameRunLoop('), 'prototype must define drawMinigameRunLoop()');
assert.ok(prototype.includes('drawMinigameRunLoop(MG.charIdx,MG.palette,160,runY)'), 'rMiniRenda() must call drawMinigameRunLoop() for the standalone MINIGAME runner');
assert.equal(prototype.includes("Math.sin(MG.scrollX*0.08)*10"), false, 'the pre-#113 placeholder sine bounce must be removed now that real run-loop frames are wired in');

const buildMobileSrc = readFileSync(path.join(ROOT, 'tools', 'build_mobile.mjs'), 'utf8');
assert.ok(buildMobileSrc.includes("relFromAssets.startsWith('art/run_loop_source/')"), 'build_mobile.mjs must exclude art/run_loop_source/ from dist embedding');
if (distAssetMap) {
  const leakedSourceKeys = Object.keys(distAssetMap).filter((k) => k.startsWith('../assets/art/run_loop_source/'));
  assert.deepEqual(leakedSourceKeys, [], 'dist __ASSET_MAP__ must not contain any art/run_loop_source/ keys');
}

// Battle Gyuiin RENDA (separate from standalone MINIGAME RENDA) must stay untouched.
assert.ok(prototype.includes('function stepRenda(c,cmds0,cmds1){'), 'battle Gyuiin stepRenda() must remain intact');
assert.ok(prototype.includes('RENDA:{durationF:120,tapGain:1,barRange:20}'), 'battle Gyuiin BAL.MINIGAME.RENDA table must remain untouched');

console.log(`run-loop asset tests passed; characters=${RUNTIME_IDS.length}; framesPerCharacter=4; palettes=2; cleanedFrames=${CLEANED_FRAMES.length}`);
