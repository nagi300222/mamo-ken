import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  DEFAULT_SPRITE_PIPELINE_CONFIG,
  alphaBounds,
  buildSpriteManifest,
  computePlacement,
  removeExteriorConnectedWhite,
  splitGrid2x2,
  spriteArtifactHash,
  validateSpriteManifest,
} from '../src/core/sprite-pipeline.ts';
import { REQUIRED_POSE_IDS } from '../src/core/sprite-types.ts';

function image(width, height, pixels) {
  const data = new Array(width * height * 4).fill(255);
  for (const [x, y, rgba] of pixels) {
    const index = (y * width + x) * 4;
    data.splice(index, 4, ...rgba);
  }
  return { width, height, data };
}

// Black ring encloses one white center pixel. Exterior-connected white must disappear,
// while the enclosed white (eye/tooth/belly analogue) remains opaque.
const ringPixels = [];
for (let x = 1; x <= 3; x += 1) {
  ringPixels.push([x, 1, [0, 0, 0, 255]], [x, 3, [0, 0, 0, 255]]);
}
ringPixels.push([1, 2, [0, 0, 0, 255]], [3, 2, [0, 0, 0, 255]]);
const cleaned = removeExteriorConnectedWhite(image(5, 5, ringPixels));
assert.equal(cleaned.data[3], 0);
assert.equal(cleaned.data[((2 * 5 + 2) * 4) + 3], 255);
assert.deepEqual(cleaned.data.slice((2 * 5 + 2) * 4, (2 * 5 + 2) * 4 + 4), [255, 255, 255, 255]);

assert.deepEqual(splitGrid2x2(image(8, 6, [])), [
  { x: 0, y: 0, width: 4, height: 3 },
  { x: 4, y: 0, width: 4, height: 3 },
  { x: 0, y: 3, width: 4, height: 3 },
  { x: 4, y: 3, width: 4, height: 3 },
]);
assert.throws(() => splitGrid2x2(image(7, 6, [])), /even/);

const opaque = image(6, 6, [
  [2, 1, [20, 20, 20, 255]],
  [3, 1, [20, 20, 20, 255]],
  [2, 2, [20, 20, 20, 255]],
  [3, 4, [20, 20, 20, 255]],
]);
// Set all unspecified pixels transparent for bounding-box fixture.
const transparentData = [...opaque.data];
for (let i = 0; i < transparentData.length; i += 4) {
  const isDark = transparentData[i] === 20;
  transparentData[i + 3] = isDark ? 255 : 0;
}
const transparent = { width: 6, height: 6, data: transparentData };
assert.deepEqual(alphaBounds(transparent), { x: 2, y: 1, width: 2, height: 4 });

const placement = computePlacement(
  { x: 10, y: 20, width: 80, height: 150 },
  { x: 25, y: 20, width: 50, height: 40 },
);
assert.equal(placement.normalizedHeadHeight, DEFAULT_SPRITE_PIPELINE_CONFIG.targetHeadHeight);
assert.equal(placement.groundY, DEFAULT_SPRITE_PIPELINE_CONFIG.groundY);

const entries = REQUIRED_POSE_IDS.map((poseId, index) => {
  const bounds = { x: 4, y: 4, width: poseId === 'down' || poseId === 'ko' ? 180 : 90, height: poseId === 'down' || poseId === 'ko' ? 70 : 180 };
  const head = { x: 20, y: 5, width: 40, height: 40 };
  return {
    poseId,
    sourceRect: { x: (index % 4) * 128, y: Math.floor(index / 4) * 128, width: 128, height: 128 },
    bounds,
    placement: computePlacement(bounds, head),
  };
});
const manifest = buildSpriteManifest(entries, { moguzo: { x: 1 } });
assert.equal(manifest.poses.length, 24);
assert.deepEqual(manifest.poses.slice(-4).map((pose) => pose.poseId), ['crouch', 'sway', 'lunge', 'crouch_atk']);
assert.equal(manifest.poses.find((pose) => pose.poseId === 'down').orientation, 'horizontal');
assert.equal(manifest.poses.find((pose) => pose.poseId === 'ko').orientation, 'horizontal');
assert.ok(manifest.poses.filter((pose) => pose.orientation === 'standing').every((pose) => pose.placement.groundY === manifest.canvas.groundY));

assert.throws(() => validateSpriteManifest({ ...manifest, poses: manifest.poses.slice(0, 23) }), /24 poses/);
const duplicate = [...manifest.poses];
duplicate[23] = { ...duplicate[23], poseId: 'idle' };
assert.throws(() => validateSpriteManifest({ ...manifest, poses: duplicate }), /duplicate/);
const wrongOrientation = manifest.poses.map((pose) => pose.poseId === 'down' ? { ...pose, orientation: 'standing' } : pose);
assert.throws(() => validateSpriteManifest({ ...manifest, poses: wrongOrientation }), /orientation/);

const hashA = spriteArtifactHash(cleaned, manifest);
const hashB = spriteArtifactHash({ ...cleaned, data: [...cleaned.data] }, manifest);
const changedData = [...cleaned.data];
changedData[((2 * 5 + 2) * 4)] = 254;
const hashChanged = spriteArtifactHash({ ...cleaned, data: changedData }, manifest);
assert.equal(hashA, hashB);
assert.notEqual(hashA, hashChanged);

const source = readFileSync(new URL('../src/core/sprite-pipeline.ts', import.meta.url), 'utf8');
for (const forbidden of ['Math.random', 'Date.now', 'localeCompare', 'document.', 'window.', 'setTimeout', 'setInterval']) {
  assert.equal(source.includes(forbidden), false, `forbidden API: ${forbidden}`);
}

console.log(`sprite pipeline tests passed; poses=24; hash=${hashA}; changed=${hashChanged}`);
