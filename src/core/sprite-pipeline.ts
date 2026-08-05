import { fnv1a32, stableStringify } from './determinism.ts';
import { REQUIRED_POSE_IDS } from './sprite-types.ts';
import type {
  PixelRect,
  PoseId,
  RgbaImage,
  SpritePipelineConfig,
  SpritePlacement,
  SpritePoseEntry,
  SpriteSheetManifest,
} from './sprite-types.ts';

export const DEFAULT_SPRITE_PIPELINE_CONFIG: SpritePipelineConfig = Object.freeze({
  whiteThreshold: 248,
  targetHeadHeight: 64,
  canvasWidth: 256,
  canvasHeight: 256,
  groundY: 232,
});

function assertImage(image: RgbaImage): void {
  if (!Number.isInteger(image.width) || !Number.isInteger(image.height) || image.width <= 0 || image.height <= 0) {
    throw new RangeError('image dimensions must be positive integers');
  }
  if (image.data.length !== image.width * image.height * 4) throw new RangeError('RGBA data length mismatch');
  for (const value of image.data) {
    if (!Number.isInteger(value) || value < 0 || value > 255) throw new RangeError('RGBA values must be bytes');
  }
}

function pixelIndex(image: RgbaImage, x: number, y: number): number {
  return (y * image.width + x) * 4;
}

function isNearWhite(data: readonly number[], index: number, threshold: number): boolean {
  return data[index + 3] > 0 && data[index] >= threshold && data[index + 1] >= threshold && data[index + 2] >= threshold;
}

export function removeExteriorConnectedWhite(
  image: RgbaImage,
  threshold = DEFAULT_SPRITE_PIPELINE_CONFIG.whiteThreshold,
): RgbaImage {
  assertImage(image);
  const data = [...image.data];
  const visited = new Uint8Array(image.width * image.height);
  const queue: number[] = [];
  const enqueue = (x: number, y: number): void => {
    const flat = y * image.width + x;
    if (visited[flat]) return;
    const index = flat * 4;
    if (!isNearWhite(data, index, threshold)) return;
    visited[flat] = 1;
    queue.push(flat);
  };
  for (let x = 0; x < image.width; x += 1) {
    enqueue(x, 0);
    enqueue(x, image.height - 1);
  }
  for (let y = 0; y < image.height; y += 1) {
    enqueue(0, y);
    enqueue(image.width - 1, y);
  }
  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const flat = queue[cursor];
    const x = flat % image.width;
    const y = Math.floor(flat / image.width);
    data[flat * 4 + 3] = 0;
    if (x > 0) enqueue(x - 1, y);
    if (x + 1 < image.width) enqueue(x + 1, y);
    if (y > 0) enqueue(x, y - 1);
    if (y + 1 < image.height) enqueue(x, y + 1);
  }
  return Object.freeze({ width: image.width, height: image.height, data: Object.freeze(data) });
}

export function splitGrid2x2(image: RgbaImage): readonly PixelRect[] {
  assertImage(image);
  if (image.width % 2 !== 0 || image.height % 2 !== 0) throw new RangeError('2x2 source dimensions must be even');
  const width = image.width / 2;
  const height = image.height / 2;
  return Object.freeze([
    Object.freeze({ x: 0, y: 0, width, height }),
    Object.freeze({ x: width, y: 0, width, height }),
    Object.freeze({ x: 0, y: height, width, height }),
    Object.freeze({ x: width, y: height, width, height }),
  ]);
}

export function alphaBounds(image: RgbaImage, rect: PixelRect = Object.freeze({ x: 0, y: 0, width: image.width, height: image.height })): PixelRect {
  assertImage(image);
  let minX = rect.x + rect.width;
  let minY = rect.y + rect.height;
  let maxX = rect.x - 1;
  let maxY = rect.y - 1;
  for (let y = rect.y; y < rect.y + rect.height; y += 1) {
    for (let x = rect.x; x < rect.x + rect.width; x += 1) {
      if (image.data[pixelIndex(image, x, y) + 3] === 0) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  if (maxX < minX || maxY < minY) throw new Error('pose cell contains no opaque pixels');
  return Object.freeze({ x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 });
}

export function computePlacement(
  bounds: PixelRect,
  headBounds: PixelRect,
  config: SpritePipelineConfig = DEFAULT_SPRITE_PIPELINE_CONFIG,
): SpritePlacement {
  if (headBounds.height <= 0 || bounds.height <= 0) throw new RangeError('bounds must be non-empty');
  const scale = config.targetHeadHeight / headBounds.height;
  const scaledWidth = bounds.width * scale;
  const scaledBottom = (bounds.y + bounds.height) * scale;
  return Object.freeze({
    scale,
    x: (config.canvasWidth - scaledWidth) / 2 - bounds.x * scale,
    y: config.groundY - scaledBottom,
    groundY: config.groundY,
    normalizedHeadHeight: headBounds.height * scale,
  });
}

function expectedOrientation(poseId: PoseId): 'standing' | 'horizontal' {
  return poseId === 'down' || poseId === 'ko' ? 'horizontal' : 'standing';
}

export function buildSpriteManifest(
  entries: readonly Omit<SpritePoseEntry, 'orientation'>[],
  overrides: SpriteSheetManifest['overrides'] = Object.freeze({}),
  config: SpritePipelineConfig = DEFAULT_SPRITE_PIPELINE_CONFIG,
): SpriteSheetManifest {
  const manifest = Object.freeze({
    version: 'sprite-sheet-v1' as const,
    canvas: Object.freeze({ width: config.canvasWidth, height: config.canvasHeight, groundY: config.groundY }),
    poses: Object.freeze(entries.map((entry) => Object.freeze({ ...entry, orientation: expectedOrientation(entry.poseId) }))),
    overrides,
  });
  validateSpriteManifest(manifest);
  return manifest;
}

export function validateSpriteManifest(manifest: SpriteSheetManifest): void {
  if (manifest.poses.length !== REQUIRED_POSE_IDS.length) throw new Error('manifest must contain exactly 24 poses');
  const ids = manifest.poses.map((pose) => pose.poseId);
  if (new Set(ids).size !== ids.length) throw new Error('duplicate poseId');
  for (const required of REQUIRED_POSE_IDS) if (!ids.includes(required)) throw new Error(`missing poseId: ${required}`);
  for (const pose of manifest.poses) {
    if (pose.orientation !== expectedOrientation(pose.poseId)) throw new Error(`invalid orientation: ${pose.poseId}`);
    if (pose.placement.groundY !== manifest.canvas.groundY) throw new Error(`ground mismatch: ${pose.poseId}`);
  }
}

export function spriteArtifactHash(image: RgbaImage, manifest: SpriteSheetManifest): string {
  assertImage(image);
  validateSpriteManifest(manifest);
  return fnv1a32(stableStringify({ image, manifest }));
}
