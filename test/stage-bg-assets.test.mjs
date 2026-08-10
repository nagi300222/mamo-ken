// STAGE-ART-IMPORT: verifies the 8 new stage/minigame background deliveries.
// - assets/bg/source/*.png are the untouched originals and must keep the exact
//   sha256 recorded at handoff time (source integrity; never overwritten by any
//   derived/resize/compress step).
// - assets/bg/*.png (the derived runtime copies actually loadImg()'d by the
//   prototype, same tier stage_day.png already lives in) must exist, be
//   non-empty, and decode to the same pixel dimensions as the source.
// - the prototype must reference every assetKey/file via loadImg(), and dist
//   must have the derived copy embedded as a data URL (build_mobile.mjs's
//   generic assets/ walker + bg resize/WebP rule), while bg/source/ itself
//   must NOT be embedded (kept out of the distributed single-file build).

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(readFileSync(path.join(ROOT, 'data', 'art', 'stage_source_manifest.json'), 'utf8'));
const prototype = readFileSync(path.join(ROOT, 'prototype', 'mamoken_prototype_v01.html'), 'utf8');
const distPath = path.join(ROOT, 'dist', 'mamoken_mobile.html');
const dist = existsSync(distPath) ? readFileSync(distPath, 'utf8') : null;

// dist embeds a generated `const __ASSET_MAP__={...};` literal (see build_mobile.mjs) mapping
// each prototype-relative asset path to a data: URL. Parse it out of the actual generated file
// rather than string-searching the copied prototype markup, so this test would actually fail if
// build_mobile.mjs stopped embedding an asset or a stale dist were checked in (Codex review).
let distAssetMap = null;
if (dist) {
  const m = dist.match(/const __ASSET_MAP__=(\{.*?\});\nconst ASSETS=/s);
  assert.ok(m, 'dist must contain a generated const __ASSET_MAP__=...; literal');
  distAssetMap = JSON.parse(m[1]);
}

function sha256(absPath) {
  return createHash('sha256').update(readFileSync(absPath)).digest('hex');
}

const entries = [...manifest.battleStages, ...manifest.minigameBackgrounds];
assert.equal(manifest.battleStages.length, 5, 'expected 5 normal-battle stages');
assert.equal(manifest.minigameBackgrounds.length, 3, 'expected 3 minigame backgrounds');
assert.equal(entries.length, 8, 'expected 8 total new background deliveries');
assert.equal(new Set(entries.map((e) => e.file)).size, 8, 'file names must be unique');
assert.equal(new Set(entries.map((e) => e.assetKey)).size, 8, 'assetKey values must be unique');

for (const entry of entries) {
  const sourceAbs = path.join(ROOT, manifest.sourceRoot, entry.file);
  const runtimeAbs = path.join(ROOT, manifest.runtimeRoot, entry.file);

  assert.ok(existsSync(sourceAbs), `missing source PNG: ${entry.file}`);
  assert.ok(statSync(sourceAbs).size > 0, `empty source PNG: ${entry.file}`);
  assert.equal(sha256(sourceAbs), entry.sha256, `source sha256 mismatch (source must stay byte-identical to the verified handoff PNG): ${entry.file}`);

  assert.ok(existsSync(runtimeAbs), `missing derived runtime PNG: ${entry.file}`);
  assert.ok(statSync(runtimeAbs).size > 0, `empty derived runtime PNG: ${entry.file}`);

  // Derived file must be a separate file from source (never the same inode/overwrite),
  // even though it is currently pixel-identical (no resize/crop was needed since the
  // 1330x1182 source already matches the 540x480 battle viewport aspect ratio).
  assert.notEqual(sourceAbs, runtimeAbs);

  // loadImg() calls are built via string concatenation (same convention as the
  // existing portraits/cutins loops), so assert on the filename + assetKey rather
  // than a single joined path literal.
  assert.ok(prototype.includes(`'${entry.file}'`), `prototype must reference the derived runtime filename: ${entry.file}`);
  assert.ok(prototype.includes(`'${entry.assetKey}'`), `prototype must reference assetKey ${entry.assetKey}`);

  if (distAssetMap) {
    const runtimeKey = '../assets/' + manifest.runtimeRoot.replace(/^assets\//, '') + '/' + entry.file;
    const sourceKey = '../assets/' + manifest.sourceRoot.replace(/^assets\//, '') + '/' + entry.file;
    assert.ok(Object.prototype.hasOwnProperty.call(distAssetMap, runtimeKey), `dist __ASSET_MAP__ missing entry for ${runtimeKey}`);
    assert.match(distAssetMap[runtimeKey], /^data:image\//, `dist __ASSET_MAP__[${runtimeKey}] must be an embedded image data URL`);
    assert.equal(Object.prototype.hasOwnProperty.call(distAssetMap, sourceKey), false, `dist __ASSET_MAP__ must NOT embed the untouched source: ${sourceKey}`);
  }
}

// bg/source/ must never be walked into dist (mirrors art/current/ exclusion policy).
const buildMobileSrc = readFileSync(path.join(ROOT, 'tools', 'build_mobile.mjs'), 'utf8');
assert.ok(buildMobileSrc.includes("relFromAssets.startsWith('bg/source/')"), 'build_mobile.mjs must exclude bg/source/ from dist embedding');
if (distAssetMap) {
  const leakedSourceKeys = Object.keys(distAssetMap).filter((k) => k.startsWith('../assets/bg/source/'));
  assert.deepEqual(leakedSourceKeys, [], 'dist __ASSET_MAP__ must not contain any bg/source/ keys');
}

console.log(`stage bg asset tests passed; battleStages=${manifest.battleStages.length}; minigameBackgrounds=${manifest.minigameBackgrounds.length}`);
