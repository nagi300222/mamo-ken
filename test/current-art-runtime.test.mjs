import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { removeExteriorConnectedBackground } from '../tools/build_current_art.mjs';

await import('../runtime/current-art-runtime-browser.js');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const manifest = JSON.parse(readFileSync(path.join(ROOT, 'data', 'art', 'runtime_art_manifest.json'), 'utf8'));
const sourceManifest = JSON.parse(readFileSync(path.join(ROOT, 'data', 'art', 'art_manifest.json'), 'utf8'));
const runtime = globalThis.MAMOKEN_CURRENT_ART_RUNTIME;
const expectedCharacters = ['moguzo', 'pisuke', 'godan', 'hakuma', 'chirka', 'takimaru', 'yomikage', 'bullet', 'dark_moguzo'];

assert.equal(manifest.version, 'current-art-runtime-v1');
assert.equal(manifest.sourceManifestVersion, sourceManifest.version);
assert.equal(manifest.buildId, 'mamoken-art-current-v1-2026-08-08');
assert.deepEqual(Object.keys(manifest.characters).sort(), [...expectedCharacters].sort());
assert.equal(manifest.policies.alphaIsAuthoritative, true);
assert.equal(manifest.policies.legacyWhitenAssetAllowed, false);
assert.equal(manifest.policies.poseScaleCorrectionAllowed, false);
assert.equal(manifest.policies.bodyBoundsAffectCombat, false);
assert.equal(manifest.policies.frameTimingAuthority, 'BAL phase/pf');
assert.equal(manifest.importer.verifiedSourceCount, 193);

for (const characterId of expectedCharacters) {
  const character = manifest.characters[characterId];
  assert.equal(Object.keys(character.poses).length, 13, `${characterId}: 8 current + 5 legacy poses`);
  assert.equal(Object.keys(character.actions).length, 13, `${characterId}: 6 common + 7 commands`);
  assert.equal(Object.values(character.actions).reduce((sum, action) => sum + action.frames.length, 0), 52);
  for (let index = 0; index < 7; index += 1) {
    const actionId = runtime.commandActionId(index);
    assert.equal(character.actions[actionId].frames.length, 4, `${characterId}:${actionId}`);
  }
  for (const poseId of ['idle', 'guard', 'flinch', 'victory', 'down', 'getup', 'ko', 'ult_charge', 'grabbed', 'crouch', 'sway', 'lunge', 'crouch_atk']) {
    assert.ok(character.poses[poseId], `${characterId}:${poseId}`);
  }
  const allFrames = [
    ...Object.values(character.poses),
    ...Object.values(character.actions).flatMap((action) => action.frames),
  ];
  for (const frame of allFrames) {
    assert.equal(frame.renderOnly, true);
    assert.ok(frame.bodyBounds.width > 0 && frame.bodyBounds.height > 0);
    assert.ok(frame.visualBounds.width > 0 && frame.visualBounds.height > 0);
    assert.equal(frame.battleScale, 0.5);
    for (const palette of ['p1', 'p2']) {
      const variant = frame.variants[palette];
      assert.ok(variant.path.startsWith(`assets/art/runtime/${characterId}/${palette}/`));
      assert.equal(existsSync(path.join(ROOT, variant.path)), true, variant.path);
      assert.ok(statSync(path.join(ROOT, variant.path)).size > 0, `${variant.path} must not be empty`);
    }
  }
}

assert.equal(Object.values(manifest.characters).reduce((sum, character) => (
  sum + Object.keys(character.poses).length + Object.values(character.actions).reduce((count, action) => count + action.frames.length, 0)
), 0), 585);
assert.equal(9 * 7, 63);

// BAL-synchronized four-frame semantics: startup halves, active key pose, recovery.
const timing = { startupF: 14, activeF: 3, recoveryF: 15 };
assert.equal(runtime.selectFourFrame(timing, 0), 0);
assert.equal(runtime.selectFourFrame(timing, 7), 0);
assert.equal(runtime.selectFourFrame(timing, 8), 1);
assert.equal(runtime.selectFourFrame(timing, 14), 1);
assert.equal(runtime.selectFourFrame(timing, 15), 2);
assert.equal(runtime.selectFourFrame(timing, 17), 2);
assert.equal(runtime.selectFourFrame(timing, 18), 3);
assert.equal(runtime.resolveFrame(manifest, {
  kind: 'timed', characterId: 'moguzo', actionId: 'mid', phaseFrame: 15, timing,
}).frameId, 'F3');

// split-first exterior flood fill preserves enclosed white pixels.
const width = 5;
const height = 5;
const data = Buffer.alloc(width * height * 4, 255);
for (let x = 1; x <= 3; x += 1) {
  for (const y of [1, 3]) data.fill(0, (y * width + x) * 4, (y * width + x) * 4 + 3);
}
for (let y = 1; y <= 3; y += 1) {
  for (const x of [1, 3]) data.fill(0, (y * width + x) * 4, (y * width + x) * 4 + 3);
}
const cleaned = removeExteriorConnectedBackground({ width, height, data });
assert.equal(cleaned.data[3], 0, 'exterior white must become transparent');
assert.deepEqual([...cleaned.data.slice((2 * width + 2) * 4, (2 * width + 2) * 4 + 4)], [255, 255, 255, 255]);

async function alphaHash(relPath) {
  const { data: rgba, info } = await sharp(path.join(ROOT, relPath)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const alpha = Buffer.alloc(info.width * info.height);
  for (let pixel = 0; pixel < alpha.length; pixel += 1) alpha[pixel] = rgba[pixel * 4 + 3];
  return createHash('sha256').update(Buffer.concat([Buffer.from(`${info.width}x${info.height}:`), alpha])).digest('hex');
}

// Representative decoded files prove build-time P2 keeps alpha byte-for-byte.
for (const characterId of expectedCharacters) {
  const character = manifest.characters[characterId];
  for (const frame of [character.poses.idle, character.actions.high.frames[2], character.actions.cmd_07.frames[3]]) {
    assert.equal(await alphaHash(frame.variants.p1.path), frame.geometryHash);
    assert.equal(await alphaHash(frame.variants.p2.path), frame.geometryHash);
  }
}

// Dark common and legacy geometry must be exactly Moguzo-derived; unique commands stay Dark-owned.
const moguzo = manifest.characters.moguzo;
const dark = manifest.characters.dark_moguzo;
for (const poseId of Object.keys(moguzo.poses)) assert.equal(dark.poses[poseId].geometryHash, moguzo.poses[poseId].geometryHash, poseId);
for (const actionId of ['high', 'mid', 'low', 'mikiri', 'roar', 'grab']) {
  assert.deepEqual(dark.actions[actionId].frames.map((frame) => frame.geometryHash), moguzo.actions[actionId].frames.map((frame) => frame.geometryHash));
}
assert.notEqual(dark.actions.cmd_01.frames[0].variants.p1.sha256, moguzo.actions.cmd_01.frames[0].variants.p1.sha256);

// Bullet's tail remains visual but cannot shrink the body normalization bounds.
const bulletIdle = manifest.characters.bullet.poses.idle;
assert.ok(bulletIdle.bodyBounds.width < bulletIdle.visualBounds.width * 0.9);

const prototype = readFileSync(path.join(ROOT, 'prototype', 'mamoken_prototype_v01.html'), 'utf8');
const dist = readFileSync(path.join(ROOT, 'dist', 'mamoken_mobile.html'), 'utf8');
const browserRuntime = readFileSync(path.join(ROOT, 'runtime', 'current-art-runtime-browser.js'), 'utf8');
assert.ok(prototype.includes("loadImg(key,'../'+variant.path,true)"));
assert.ok(prototype.includes('drawCurrentArtFighter(f,ox,oy,currentSprite,currentFrame)'));
assert.ok(prototype.includes("currentArtTimedRequest(f,f.atkLv,{startupF:A.s,activeF:A.a,recoveryF:A.r})"));
assert.ok(prototype.includes("return actionId?currentArtTimedRequest(f,actionId,{startupF:A.s,activeF:A.a,recoveryF:A.r}):null"));
assert.ok(prototype.includes("const BUILD_ID='mamoken-art-current-v1-2026-08-08'"));
assert.ok(dist.includes("const BUILD_ID='mamoken-art-current-v1-2026-08-08'"));
assert.ok(dist.includes('globalThis.MAMOKEN_CURRENT_ART_MANIFEST='));
assert.ok(dist.includes('globalThis.MAMOKEN_CURRENT_ART_RUNTIME'));
assert.ok(dist.includes('"../assets/art/runtime/moguzo/p1/common_basic/idle.png":"data:image/webp;base64,'));
assert.equal(dist.includes('"../assets/art/current/'), false, 'opaque current source sheets must not be embedded in dist');
assert.equal(dist.includes('"../assets/art/legacy_common24/'), false, 'legacy source sheets must not be embedded in dist');
assert.equal(browserRuntime.includes('performance.now'), false);
assert.equal(browserRuntime.includes('Date.now'), false);
assert.equal(browserRuntime.includes('Math.random'), false);

console.log(`current art runtime tests passed; chars=9; frames=585; variants=1170; artifact=${manifest.artifactHash}`);
