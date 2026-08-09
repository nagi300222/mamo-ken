#!/usr/bin/env node
// Build the delivered current-art sheets into runtime alpha sprites.
//
// Authority boundaries:
// - input paths/layout/order come from data/art/art_manifest.json
// - this file produces presentation data only
// - BAL, hit/reach/hurt boxes, input and lockstep state are never read or written

import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SOURCE_MANIFEST_PATH = path.join(ROOT, 'data', 'art', 'art_manifest.json');
const RUNTIME_MANIFEST_PATH = path.join(ROOT, 'data', 'art', 'runtime_art_manifest.json');
const BROWSER_MANIFEST_PATH = path.join(ROOT, 'runtime', 'current-art-manifest-browser.js');
const OUTPUT_ROOT = path.join(ROOT, 'assets', 'art', 'runtime');

const SOURCE_TO_RUNTIME_ID = Object.freeze({
  moguzo: 'moguzo',
  piske: 'pisuke',
  godan: 'godan',
  hakuma: 'hakuma',
  chilka: 'chirka',
  takimaru: 'takimaru',
  yomikage: 'yomikage',
  bullet: 'bullet',
  dark_moguzo: 'dark_moguzo',
});

const RUNTIME_TO_SOURCE_ID = Object.freeze(Object.fromEntries(
  Object.entries(SOURCE_TO_RUNTIME_ID).map(([source, runtime]) => [runtime, source]),
));

const CURRENT_ACTIONS = Object.freeze([
  'common_basic', 'high', 'mid', 'low', 'mikiri', 'roar', 'grab',
  'cmd_01', 'cmd_02', 'cmd_03', 'cmd_04', 'cmd_05', 'cmd_06', 'cmd_07',
  'downset',
]);
const DARK_COMMON_ACTIONS = new Set(['common_basic', 'high', 'mid', 'low', 'mikiri', 'roar', 'grab', 'downset']);
const LEGACY_RUNTIME_POSES = new Set(['grabbed', 'crouch', 'sway', 'lunge', 'crouch_atk']);
const POSE_ACTIONS = new Set(['common_basic', 'downset']);
const DISPLAY_BASE_HEIGHT = 172;
const RUNTIME_PIXELS_PER_DISPLAY_PIXEL = 2;
const OUTPUT_PADDING = 3;
const BACKGROUND_BRIGHTNESS_MIN = 200;
const BACKGROUND_CHROMA_MAX = 48;
const ALPHA_VISIBLE_MIN = 8;

const PRESENTATION_SCALE_PATH = path.join(ROOT, 'data', 'art', 'presentation_scale_corrections.json');

const P2_PROFILES = Object.freeze({
  moguzo: { furHue: -12, saturation: 0.92, light: -0.035, accessory: 'red_to_blue' },
  pisuke: { furHue: -8, saturation: 0.88, light: -0.025, accessory: 'blue_to_teal' },
  godan: { furHue: 8, saturation: 1.02, light: -0.025, accessory: 'dark_to_navy' },
  hakuma: { furHue: 8, saturation: 0.88, light: 0.01, accessory: 'green_to_burgundy' },
  chirka: { furHue: -6, saturation: 0.82, light: 0.035, accessory: 'purple_to_teal' },
  takimaru: { furHue: -12, saturation: 0.82, light: -0.005, accessory: 'yellow_to_rust' },
  yomikage: { furHue: -14, saturation: 0.78, light: -0.025, accessory: 'white_to_tan' },
  bullet: { furHue: 8, saturation: 1.03, light: -0.045, accessory: 'gold_to_teal' },
  dark_moguzo: { furHue: -18, saturation: 0.88, light: -0.035, accessory: 'wine_to_indigo' },
});

function round(value, digits = 6) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function sha256(data) {
  return createHash('sha256').update(data).digest('hex');
}

function readJson(absPath) {
  return JSON.parse(readFileSync(absPath, 'utf8'));
}

function stableObject(value) {
  if (Array.isArray(value)) return value.map(stableObject);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableObject(value[key])]));
}

function writeJson(absPath, value) {
  mkdirSync(path.dirname(absPath), { recursive: true });
  writeFileSync(absPath, `${JSON.stringify(stableObject(value), null, 2)}\n`);
}

function validateSourceChecksums(manifest) {
  const checked = new Set();
  const descriptors = [];
  for (const character of Object.values(manifest.characters)) {
    descriptors.push(
      character.master,
      character.cutin,
      ...Object.values(character.actions),
      ...(character.legacyCommon24 || []),
      ...Object.values(character.poseOverrides || {}),
    );
  }
  for (const descriptor of descriptors) {
    if (!descriptor?.path || !descriptor.sha256 || checked.has(descriptor.path)) continue;
    const abs = path.join(ROOT, descriptor.path);
    if (!existsSync(abs)) throw new Error(`missing source art: ${descriptor.path}`);
    const actual = sha256(readFileSync(abs));
    if (actual !== descriptor.sha256) throw new Error(`source checksum mismatch: ${descriptor.path}`);
    checked.add(descriptor.path);
  }
  return checked.size;
}

// vNext SIZE_NORMALIZATION_FINAL: per-frame presentation-only face-scale correction.
// Values are visually derived (manual landmark measurement / montage review), never
// from automated single-template face matching (validated unreliable for this art
// style: candidate corrections disagreed with manual measurement by up to 4.5x even
// at >0.9 match confidence). Missing entries default to 1.0 (no correction / KEEP).
// This never touches BAL, hitbox/hurtbox, or timing -- resize-only, applied on top of
// the existing per-character uniform resizeScale.
function loadPresentationScaleCorrections() {
  if (!existsSync(PRESENTATION_SCALE_PATH)) return { characters: {} };
  return readJson(PRESENTATION_SCALE_PATH);
}

function presentationScaleFor(corrections, runtimeCharId, kind, id, frameIndex) {
  // Dark Moguzo's common poses/actions are byte-identical clones of Moguzo's own
  // frames (see cloneMoguzoCommonForDark) -- they must use Moguzo's own correction,
  // not an independent measurement, so the two never drift apart. Dark's unique
  // cmd_01-07 art is Dark-only and always uses dark_moguzo's own table.
  const isDarkUniqueCommand = runtimeCharId === 'dark_moguzo' && kind === 'action' && id.startsWith('cmd_');
  const sourceCharId = (runtimeCharId === 'dark_moguzo' && !isDarkUniqueCommand) ? 'moguzo' : runtimeCharId;
  const table = corrections.characters?.[sourceCharId];
  if (!table) return 1.0;
  if (kind === 'pose') return table.poses?.[id] ?? 1.0;
  const entry = table.actions?.[id];
  if (entry === undefined) return 1.0;
  if (Array.isArray(entry)) return entry[frameIndex] ?? 1.0;
  return entry; // single scalar applied to all frames of this action
}

async function loadRgba(absPath) {
  const { data, info } = await sharp(absPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data: Buffer.from(data), width: info.width, height: info.height };
}

function splitRects(width, height, layout) {
  if (layout === '1x4') {
    return Array.from({ length: 4 }, (_, index) => {
      const x0 = Math.round((width * index) / 4);
      const x1 = Math.round((width * (index + 1)) / 4);
      return { x: x0, y: 0, width: x1 - x0, height };
    });
  }
  if (layout === '2x2') {
    const x1 = Math.round(width / 2);
    const y1 = Math.round(height / 2);
    return [
      { x: 0, y: 0, width: x1, height: y1 },
      { x: x1, y: 0, width: width - x1, height: y1 },
      { x: 0, y: y1, width: x1, height: height - y1 },
      { x: x1, y: y1, width: width - x1, height: height - y1 },
    ];
  }
  throw new Error(`unsupported sheet layout: ${layout}`);
}

function cropRgba(image, rect) {
  const out = Buffer.alloc(rect.width * rect.height * 4);
  for (let y = 0; y < rect.height; y += 1) {
    const srcStart = ((rect.y + y) * image.width + rect.x) * 4;
    const dstStart = y * rect.width * 4;
    image.data.copy(out, dstStart, srcStart, srcStart + rect.width * 4);
  }
  return { data: out, width: rect.width, height: rect.height };
}

function isExteriorBackgroundPixel(data, offset) {
  if (data[offset + 3] === 0) return false;
  const r = data[offset];
  const g = data[offset + 1];
  const b = data[offset + 2];
  const brightness = (r + g + b) / 3;
  const chroma = Math.max(r, g, b) - Math.min(r, g, b);
  return brightness >= BACKGROUND_BRIGHTNESS_MIN && chroma <= BACKGROUND_CHROMA_MAX;
}

export function removeExteriorConnectedBackground(image) {
  const data = Buffer.from(image.data);
  const pixelCount = image.width * image.height;
  const visited = new Uint8Array(pixelCount);
  const queue = new Int32Array(pixelCount);
  let head = 0;
  let tail = 0;
  const enqueue = (x, y) => {
    const flat = y * image.width + x;
    if (visited[flat]) return;
    if (!isExteriorBackgroundPixel(data, flat * 4)) return;
    visited[flat] = 1;
    queue[tail++] = flat;
  };
  for (let x = 0; x < image.width; x += 1) {
    enqueue(x, 0);
    enqueue(x, image.height - 1);
  }
  for (let y = 0; y < image.height; y += 1) {
    enqueue(0, y);
    enqueue(image.width - 1, y);
  }
  while (head < tail) {
    const flat = queue[head++];
    const x = flat % image.width;
    const y = Math.floor(flat / image.width);
    data[flat * 4 + 3] = 0;
    if (x > 0) enqueue(x - 1, y);
    if (x + 1 < image.width) enqueue(x + 1, y);
    if (y > 0) enqueue(x, y - 1);
    if (y + 1 < image.height) enqueue(x, y + 1);
  }
  return { data, width: image.width, height: image.height, removedPixelCount: tail };
}

function alphaBounds(image, mask = null) {
  let minX = image.width;
  let minY = image.height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      const flat = y * image.width + x;
      const visible = mask ? mask[flat] !== 0 : image.data[flat * 4 + 3] > ALPHA_VISIBLE_MIN;
      if (!visible) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  if (maxX < minX || maxY < minY) throw new Error('art frame has no foreground');
  return { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

function largestComponentMask(image) {
  const count = image.width * image.height;
  const labels = new Int32Array(count);
  labels.fill(-1);
  const queue = new Int32Array(count);
  const components = [];
  for (let start = 0; start < count; start += 1) {
    if (labels[start] !== -1 || image.data[start * 4 + 3] <= ALPHA_VISIBLE_MIN) continue;
    const id = components.length;
    labels[start] = id;
    let head = 0;
    let tail = 0;
    let pixels = 0;
    queue[tail++] = start;
    while (head < tail) {
      const flat = queue[head++];
      pixels += 1;
      const x = flat % image.width;
      const y = Math.floor(flat / image.width);
      const visit = (nx, ny) => {
        if (nx < 0 || nx >= image.width || ny < 0 || ny >= image.height) return;
        const next = ny * image.width + nx;
        if (labels[next] !== -1 || image.data[next * 4 + 3] <= ALPHA_VISIBLE_MIN) return;
        labels[next] = id;
        queue[tail++] = next;
      };
      visit(x - 1, y);
      visit(x + 1, y);
      visit(x, y - 1);
      visit(x, y + 1);
    }
    components.push({ id, pixels });
  }
  if (!components.length) throw new Error('art frame has no connected foreground');
  components.sort((a, b) => b.pixels - a.pixels || a.id - b.id);
  const mainId = components[0].id;
  const mask = Buffer.alloc(count);
  for (let index = 0; index < count; index += 1) if (labels[index] === mainId) mask[index] = 255;
  return mask;
}

function removeBoundaryForegroundFragments(image, mainMask) {
  const data = Buffer.from(image.data);
  const count = image.width * image.height;
  const visited = new Uint8Array(count);
  const queue = new Int32Array(count);
  for (let start = 0; start < count; start += 1) {
    if (visited[start] || mainMask[start] || data[start * 4 + 3] <= ALPHA_VISIBLE_MIN) continue;
    let head = 0;
    let tail = 0;
    let touchesBoundary = false;
    const pixels = [];
    visited[start] = 1;
    queue[tail++] = start;
    while (head < tail) {
      const flat = queue[head++];
      pixels.push(flat);
      const x = flat % image.width;
      const y = Math.floor(flat / image.width);
      if (x === 0 || x === image.width - 1 || y === 0 || y === image.height - 1) touchesBoundary = true;
      const visit = (nx, ny) => {
        if (nx < 0 || nx >= image.width || ny < 0 || ny >= image.height) return;
        const next = ny * image.width + nx;
        if (visited[next] || mainMask[next] || data[next * 4 + 3] <= ALPHA_VISIBLE_MIN) return;
        visited[next] = 1;
        queue[tail++] = next;
      };
      visit(x - 1, y);
      visit(x + 1, y);
      visit(x, y - 1);
      visit(x, y + 1);
    }
    if (touchesBoundary) for (const flat of pixels) data[flat * 4 + 3] = 0;
  }
  return { ...image, data };
}

function bulletBodyBounds(image, mainMask) {
  const main = alphaBounds(image, mainMask);
  const density = new Float64Array(image.width);
  for (let x = main.x; x < main.x + main.width; x += 1) {
    let sum = 0;
    for (let y = main.y; y < main.y + main.height; y += 1) if (mainMask[y * image.width + x]) sum += 1;
    density[x] = sum;
  }
  const smooth = new Float64Array(image.width);
  for (let x = main.x; x < main.x + main.width; x += 1) {
    let sum = 0;
    let samples = 0;
    for (let dx = -5; dx <= 5; dx += 1) {
      if (x + dx < 0 || x + dx >= image.width) continue;
      sum += density[x + dx];
      samples += 1;
    }
    smooth[x] = sum / samples;
  }
  let peak = 0;
  for (const value of smooth) peak = Math.max(peak, value);
  const threshold = peak * 0.22;
  let minX = image.width;
  let maxX = -1;
  for (let x = main.x; x < main.x + main.width; x += 1) {
    if (smooth[x] < threshold) continue;
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
  }
  if (maxX < minX || maxX - minX + 1 < main.width * 0.3) return main;
  return { x: minX, y: main.y, width: maxX - minX + 1, height: main.height };
}

function analyzeFrame(cell, runtimeCharId, sourceRect, frameId) {
  let cleaned = removeExteriorConnectedBackground(cell);
  let mainMask = largestComponentMask(cleaned);
  cleaned = removeBoundaryForegroundFragments(cleaned, mainMask);
  mainMask = largestComponentMask(cleaned);
  const visualBounds = alphaBounds(cleaned);
  const bodyBounds = runtimeCharId === 'bullet'
    ? bulletBodyBounds(cleaned, mainMask)
    : alphaBounds(cleaned, mainMask);
  return {
    data: cleaned.data,
    mainMask,
    width: cleaned.width,
    height: cleaned.height,
    visualBounds,
    bodyBounds,
    sourceRect,
    frameId,
    removedPixelCount: cleaned.removedPixelCount,
    deriveDarkPalette: false,
  };
}

async function readActionFrames(descriptor, runtimeCharId) {
  const source = await loadRgba(path.join(ROOT, descriptor.path));
  const rects = splitRects(source.width, source.height, descriptor.layout);
  if (rects.length !== descriptor.frameOrder.length) throw new Error(`frame count mismatch: ${descriptor.path}`);
  return rects.map((rect, index) => analyzeFrame(
    cropRgba(source, rect),
    runtimeCharId,
    rect,
    descriptor.frameOrder[index],
  ));
}

async function readLegacyFrames(character, runtimeCharId) {
  const poses = new Map();
  for (const sheet of character.legacyCommon24 || []) {
    const source = await loadRgba(path.join(ROOT, sheet.path));
    const rects = splitRects(source.width, source.height, sheet.layout);
    for (let index = 0; index < rects.length; index += 1) {
      const poseId = sheet.cellSemantics[index];
      if (!LEGACY_RUNTIME_POSES.has(poseId)) continue;
      const rect = rects[index];
      poses.set(poseId, analyzeFrame(cropRgba(source, rect), runtimeCharId, rect, poseId));
    }
  }
  for (const poseId of LEGACY_RUNTIME_POSES) if (!poses.has(poseId)) throw new Error(`missing legacy pose ${runtimeCharId}:${poseId}`);
  return poses;
}

// vNext PR1: a standalone full-canvas replacement for one pose within a sheet-split
// action (currently: Godan's flinch). The override image is already alpha-cut, so it
// flows through the same analyzeFrame pipeline as any other sheet cell (background
// removal is a no-op on already-transparent pixels).
async function analyzeOverrideFrame(overridePath, runtimeCharId, frameId) {
  const source = await loadRgba(path.join(ROOT, overridePath));
  const rect = { x: 0, y: 0, width: source.width, height: source.height };
  const frame = analyzeFrame(cropRgba(source, rect), runtimeCharId, rect, frameId);
  // A pose-override image is its own standalone canvas, not a cell cut from the same
  // sheet as its sibling frames -- their bodyBounds live in unrelated coordinate
  // spaces/scales. It must never feed the sheet-shared actionGroundY() below, or it
  // silently drags idle/guard/victory's ground anchor onto the override's canvas.
  return { ...frame, isOverride: true };
}

async function applyPoseOverrides(character, runtimeCharId, actions) {
  const overrides = character.poseOverrides;
  if (!overrides) return;
  const commonFrames = actions.get('common_basic');
  if (!commonFrames) throw new Error(`poseOverrides require common_basic frames: ${runtimeCharId}`);
  for (const [poseId, descriptor] of Object.entries(overrides)) {
    const index = commonFrames.findIndex((frame) => frame.frameId === poseId);
    if (index === -1) throw new Error(`poseOverride target not found in common_basic: ${runtimeCharId}:${poseId}`);
    commonFrames[index] = await analyzeOverrideFrame(descriptor.path, runtimeCharId, poseId);
  }
}

async function collectCharacterFrames(character, sourceCharId, runtimeCharId) {
  const actions = new Map();
  for (const actionId of CURRENT_ACTIONS) {
    const descriptor = character.actions[actionId];
    if (!descriptor) continue;
    actions.set(actionId, await readActionFrames(descriptor, runtimeCharId));
  }
  await applyPoseOverrides(character, runtimeCharId, actions);
  const legacyPoses = sourceCharId === 'dark_moguzo' ? new Map() : await readLegacyFrames(character, runtimeCharId);
  return { actions, legacyPoses };
}

function cloneFrame(frame, deriveDarkPalette) {
  return {
    ...frame,
    data: Buffer.from(frame.data),
    mainMask: Buffer.from(frame.mainMask),
    sourceRect: { ...frame.sourceRect },
    visualBounds: { ...frame.visualBounds },
    bodyBounds: { ...frame.bodyBounds },
    deriveDarkPalette,
  };
}

function cloneMoguzoCommonForDark(moguzoFrames, darkFrames) {
  for (const actionId of DARK_COMMON_ACTIONS) {
    const sourceFrames = moguzoFrames.actions.get(actionId);
    if (!sourceFrames) throw new Error(`missing Moguzo common action for Dark: ${actionId}`);
    darkFrames.actions.set(actionId, sourceFrames.map((frame) => cloneFrame(frame, true)));
  }
  for (const [poseId, frame] of moguzoFrames.legacyPoses) darkFrames.legacyPoses.set(poseId, cloneFrame(frame, true));
}

function rgbToHsl(rByte, gByte, bByte) {
  const r = rByte / 255;
  const g = gByte / 255;
  const b = bByte / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const light = (max + min) / 2;
  if (max === min) return [0, 0, light];
  const delta = max - min;
  const saturation = light > 0.5 ? delta / (2 - max - min) : delta / (max + min);
  let hue;
  if (max === r) hue = ((g - b) / delta + (g < b ? 6 : 0)) / 6;
  else if (max === g) hue = ((b - r) / delta + 2) / 6;
  else hue = ((r - g) / delta + 4) / 6;
  return [hue * 360, saturation, light];
}

function hueToRgb(p, q, tInput) {
  let t = tInput;
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
}

function hslToRgb(hueDegrees, saturation, light) {
  const hue = ((hueDegrees % 360) + 360) % 360 / 360;
  if (saturation === 0) {
    const value = Math.round(light * 255);
    return [value, value, value];
  }
  const q = light < 0.5 ? light * (1 + saturation) : light + saturation - light * saturation;
  const p = 2 * light - q;
  return [
    Math.round(hueToRgb(p, q, hue + 1 / 3) * 255),
    Math.round(hueToRgb(p, q, hue) * 255),
    Math.round(hueToRgb(p, q, hue - 1 / 3) * 255),
  ];
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function transformAccessory(profileId, hue, saturation, light) {
  if (profileId === 'red_to_blue' && (hue < 20 || hue > 340) && saturation > 0.35) return [215, saturation * 0.78, light * 0.82];
  if (profileId === 'blue_to_teal' && hue >= 175 && hue <= 260 && saturation > 0.22) return [174, saturation * 0.82, light * 0.92];
  if (profileId === 'green_to_burgundy' && hue >= 70 && hue <= 175 && saturation > 0.16) return [345, saturation * 0.82, light * 0.82];
  if (profileId === 'purple_to_teal' && hue >= 245 && hue <= 330 && saturation > 0.18) return [175, saturation * 0.76, light * 0.92];
  if (profileId === 'yellow_to_rust' && hue >= 35 && hue <= 75 && saturation > 0.3) return [16, saturation * 0.82, light * 0.82];
  if (profileId === 'wine_to_indigo' && (hue < 25 || hue > 325) && saturation > 0.2) return [245, saturation * 0.72, light * 0.84];
  if (profileId === 'white_to_tan' && saturation < 0.16 && light > 0.62) return [38, 0.16, Math.min(0.88, light * 0.92)];
  if (profileId === 'gold_to_teal' && hue >= 35 && hue <= 62 && saturation > 0.5 && light < 0.52) return [178, saturation * 0.55, light * 0.85];
  if (profileId === 'dark_to_navy' && light < 0.16 && saturation < 0.25) return [225, 0.22, Math.min(0.18, light + 0.025)];
  return null;
}

function applyP2Palette(rgba, bodyMask, runtimeCharId) {
  const profile = P2_PROFILES[runtimeCharId];
  if (!profile) throw new Error(`missing P2 profile: ${runtimeCharId}`);
  const out = Buffer.from(rgba);
  for (let pixel = 0; pixel < bodyMask.length; pixel += 1) {
    if (!bodyMask[pixel]) continue;
    const offset = pixel * 4;
    if (out[offset + 3] <= ALPHA_VISIBLE_MIN) continue;
    const [hue, saturation, light] = rgbToHsl(out[offset], out[offset + 1], out[offset + 2]);
    if (light < 0.075) continue; // outlines, eyes and nose stay authoritative
    const accessory = transformAccessory(profile.accessory, hue, saturation, light);
    const next = accessory || [hue + profile.furHue, saturation * profile.saturation, light + profile.light];
    const [r, g, b] = hslToRgb(next[0], clamp01(next[1]), clamp01(next[2]));
    out[offset] = r;
    out[offset + 1] = g;
    out[offset + 2] = b;
  }
  return out;
}

async function buildDarkPaletteTransfer(manifest) {
  const sourceDescriptor = manifest.characters.moguzo.master;
  const targetDescriptor = manifest.characters.dark_moguzo.master;
  const source = removeExteriorConnectedBackground(await loadRgba(path.join(ROOT, sourceDescriptor.path)));
  const target = removeExteriorConnectedBackground(await loadRgba(path.join(ROOT, targetDescriptor.path)));
  if (source.width !== target.width || source.height !== target.height) throw new Error('Dark/Moguzo masters must share geometry');
  const sourceAlpha = Buffer.alloc(source.width * source.height);
  const targetAlpha = Buffer.alloc(target.width * target.height);
  for (let pixel = 0; pixel < sourceAlpha.length; pixel += 1) {
    sourceAlpha[pixel] = source.data[pixel * 4 + 3];
    targetAlpha[pixel] = target.data[pixel * 4 + 3];
  }
  let sharedForeground = 0;
  let foregroundUnion = 0;
  for (let index = 0; index < sourceAlpha.length; index += 1) {
    const sourceVisible = sourceAlpha[index] > ALPHA_VISIBLE_MIN;
    const targetVisible = targetAlpha[index] > ALPHA_VISIBLE_MIN;
    if (sourceVisible && targetVisible) sharedForeground += 1;
    if (sourceVisible || targetVisible) foregroundUnion += 1;
  }
  const geometryAgreement = sharedForeground / foregroundUnion;
  // The two supplied masters have the same composition but slightly different antialiased
  // edge coverage. Runtime Dark common frames still retain the Moguzo alpha byte-for-byte.
  if (geometryAgreement < 0.95) throw new Error(`Dark/Moguzo master geometry agreement too low: ${geometryAgreement}`);

  const bins = new Map();
  for (let pixel = 0; pixel < sourceAlpha.length; pixel += 1) {
    if (sourceAlpha[pixel] <= ALPHA_VISIBLE_MIN || targetAlpha[pixel] <= ALPHA_VISIBLE_MIN) continue;
    const offset = pixel * 4;
    const key = `${source.data[offset] >> 3},${source.data[offset + 1] >> 3},${source.data[offset + 2] >> 3}`;
    const value = bins.get(key) || { r: 0, g: 0, b: 0, count: 0 };
    value.r += target.data[offset];
    value.g += target.data[offset + 1];
    value.b += target.data[offset + 2];
    value.count += 1;
    bins.set(key, value);
  }
  const palette = [...bins.entries()].filter(([, value]) => value.count >= 2).map(([key, value]) => {
    const [r5, g5, b5] = key.split(',').map(Number);
    return {
      r5, g5, b5,
      r: Math.round(value.r / value.count),
      g: Math.round(value.g / value.count),
      b: Math.round(value.b / value.count),
    };
  });
  const cache = new Map();
  // ART-PRESENTATION-R1 (B): nearest-bucket master-to-master transfer faithfully reproduces the
  // Dark master photo's shadow-toned fur pixels, which carry a wine-red tint that reads as
  // blood rather than the intended dark brown/black-purple fur. Every Moguzo-common query pixel
  // finds a confident bucket match (no unmapped fallback), so this is not a missing-coverage bug
  // -- it is the master's own authored shadow tone being carried through unchanged. Since a global
  // hue shift would also desaturate the genuinely-red source elements (headband/accessory, which
  // must "match the Dark master" per spec and stay untouched), the correction is scoped to exactly
  // the failure mode observed: an originally non-red Moguzo fur pixel (hue outside the vivid-red
  // band, i.e. not already an accessory-like color) whose transferred output lands in the
  // wine/red band. Only those get pulled toward a low-saturation dark brown/black-purple; true
  // blacks (outlines/eyes/nose) and already-red source pixels (accessory) are left authoritative.
  const WINE_HUE_MAX = 20, WINE_HUE_MIN = 330, WINE_SAT_MIN = 0.22;
  const ACCESSORY_HUE_MAX = 20, ACCESSORY_HUE_MIN = 330, ACCESSORY_SAT_MIN = 0.5;
  const isWineHue = (hue, sat) => (hue < WINE_HUE_MAX || hue >= WINE_HUE_MIN) && sat > WINE_SAT_MIN;
  const isAccessoryLike = (hue, sat) => (hue < ACCESSORY_HUE_MAX || hue >= ACCESSORY_HUE_MIN) && sat > ACCESSORY_SAT_MIN;
  const correctWineFur = (mappedRgb, sourceR, sourceG, sourceB) => {
    const [mHue, mSat, mLight] = rgbToHsl(mappedRgb[0], mappedRgb[1], mappedRgb[2]);
    if (mLight < 0.08) return mappedRgb; // true blacks (outlines/eyes/nose) stay authoritative
    if (!isWineHue(mHue, mSat)) return mappedRgb;
    const [sHue, sSat] = rgbToHsl(sourceR, sourceG, sourceB);
    if (isAccessoryLike(sHue, sSat)) return mappedRgb; // already-red source (accessory) carries through as-is
    return hslToRgb(268, Math.min(mSat * 0.5, 0.32), Math.max(0.05, mLight * 0.88));
  };
  const mapColor = (r, g, b) => {
    // The bucket-level cache holds only the raw nearest-palette lookup (which is legitimately
    // bucket-scoped -- it only depends on r5/g5/b5). correctWineFur() must run on every exact
    // source pixel, not be cached at the bucket level: two exact colors sharing a bucket (e.g. a
    // fur shadow and an accessory edge) can classify differently, and caching the corrected
    // result would let whichever pixel hit the bucket first decide the outcome for the rest
    // (Codex review finding on PR #96).
    const cacheKey = `${r >> 3},${g >> 3},${b >> 3}`;
    let rawMapped = cache.get(cacheKey);
    if (!rawMapped) {
      const [r5, g5, b5] = cacheKey.split(',').map(Number);
      let best = null;
      let bestDistance = Infinity;
      for (const entry of palette) {
        const distance = (entry.r5 - r5) ** 2 + (entry.g5 - g5) ** 2 + (entry.b5 - b5) ** 2;
        if (distance < bestDistance) {
          bestDistance = distance;
          best = entry;
        }
      }
      rawMapped = best && bestDistance <= 42 ? [best.r, best.g, best.b] : [r, g, b];
      cache.set(cacheKey, rawMapped);
    }
    return correctWineFur(rawMapped, r, g, b);
  };
  const transform = (rgba, bodyMask) => {
    const out = Buffer.from(rgba);
    for (let pixel = 0; pixel < bodyMask.length; pixel += 1) {
      if (!bodyMask[pixel]) continue;
      const offset = pixel * 4;
      if (out[offset + 3] <= ALPHA_VISIBLE_MIN) continue;
      const [r, g, b] = mapColor(out[offset], out[offset + 1], out[offset + 2]);
      out[offset] = r;
      out[offset + 1] = g;
      out[offset + 2] = b;
    }
    return out;
  };
  return { transform, geometryAgreement: round(geometryAgreement), paletteBinCount: palette.length };
}

function cropWithPadding(frame) {
  const x = Math.max(0, frame.visualBounds.x - OUTPUT_PADDING);
  const y = Math.max(0, frame.visualBounds.y - OUTPUT_PADDING);
  const right = Math.min(frame.width, frame.visualBounds.x + frame.visualBounds.width + OUTPUT_PADDING);
  const bottom = Math.min(frame.height, frame.visualBounds.y + frame.visualBounds.height + OUTPUT_PADDING);
  const rect = { x, y, width: right - x, height: bottom - y };
  const image = cropRgba(frame, rect);
  const maskData = Buffer.alloc(rect.width * rect.height);
  for (let row = 0; row < rect.height; row += 1) {
    const sourceStart = (rect.y + row) * frame.width + rect.x;
    frame.mainMask.copy(maskData, row * rect.width, sourceStart, sourceStart + rect.width);
  }
  return { image, maskData, rect };
}

async function resizeFrame(cropped, resizeScale) {
  const width = Math.max(1, Math.round(cropped.image.width * resizeScale));
  const height = Math.max(1, Math.round(cropped.image.height * resizeScale));
  const { data, info } = await sharp(cropped.image.data, {
    raw: { width: cropped.image.width, height: cropped.image.height, channels: 4 },
  }).resize({ width, height, kernel: sharp.kernel.lanczos3 }).raw().toBuffer({ resolveWithObject: true });
  const { data: rawMask, info: maskInfo } = await sharp(cropped.maskData, {
    raw: { width: cropped.image.width, height: cropped.image.height, channels: 1 },
  }).resize({ width, height, kernel: sharp.kernel.nearest }).raw().toBuffer({ resolveWithObject: true });
  const mask = Buffer.alloc(width * height);
  for (let pixel = 0; pixel < mask.length; pixel += 1) mask[pixel] = rawMask[pixel * maskInfo.channels];
  return { data: Buffer.from(data), mask, width: info.width, height: info.height };
}

function scaleRect(rect, cropRect, scaleX, scaleY) {
  const x0 = Math.round((rect.x - cropRect.x) * scaleX);
  const y0 = Math.round((rect.y - cropRect.y) * scaleY);
  const x1 = Math.round((rect.x + rect.width - cropRect.x) * scaleX);
  const y1 = Math.round((rect.y + rect.height - cropRect.y) * scaleY);
  return { x: x0, y: y0, width: Math.max(1, x1 - x0), height: Math.max(1, y1 - y0) };
}

function alphaGeometryHash(rgba, width, height) {
  const alpha = Buffer.alloc(width * height);
  for (let pixel = 0; pixel < alpha.length; pixel += 1) alpha[pixel] = rgba[pixel * 4 + 3];
  return sha256(Buffer.concat([Buffer.from(`${width}x${height}:`), alpha]));
}

async function writePng(absPath, rgba, width, height) {
  mkdirSync(path.dirname(absPath), { recursive: true });
  const png = await sharp(rgba, { raw: { width, height, channels: 4 } })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer();
  if (!png.length) throw new Error(`PNG encoder returned an empty artifact: ${absPath}`);
  writeFileSync(absPath, png);
}

function actionGroundY(frames) {
  const sheetFrames = frames.filter((frame) => !frame.isOverride);
  if (!sheetFrames.length) throw new Error('actionGroundY has no sheet-sourced frames to anchor on');
  return Math.max(...sheetFrames.map((frame) => frame.bodyBounds.y + frame.bodyBounds.height));
}

async function emitFrame({
  frame,
  runtimeCharId,
  actionId,
  groundY,
  resizeScale,
  battleScale,
  darkTransfer,
  presentationScale = 1.0,
}) {
  const cropped = cropWithPadding(frame);
  const resized = await resizeFrame(cropped, resizeScale * presentationScale);
  const p1 = frame.deriveDarkPalette ? darkTransfer.transform(resized.data, resized.mask) : resized.data;
  const p2 = applyP2Palette(p1, resized.mask, runtimeCharId);
  const geometryHash = alphaGeometryHash(p1, resized.width, resized.height);
  if (alphaGeometryHash(p2, resized.width, resized.height) !== geometryHash) throw new Error(`P2 geometry changed: ${runtimeCharId}:${actionId}:${frame.frameId}`);

  const frameSlug = frame.frameId.replace(/[^A-Za-z0-9_-]+/g, '_').toLowerCase();
  const relP1 = `assets/art/runtime/${runtimeCharId}/p1/${actionId}/${frameSlug}.png`;
  const relP2 = `assets/art/runtime/${runtimeCharId}/p2/${actionId}/${frameSlug}.png`;
  await writePng(path.join(ROOT, relP1), p1, resized.width, resized.height);
  await writePng(path.join(ROOT, relP2), p2, resized.width, resized.height);

  const scaleX = resized.width / cropped.image.width;
  const scaleY = resized.height / cropped.image.height;
  const visualBounds = scaleRect(frame.visualBounds, cropped.rect, scaleX, scaleY);
  const bodyBounds = scaleRect(frame.bodyBounds, cropped.rect, scaleX, scaleY);
  const groundAnchorY = round((groundY - cropped.rect.y) * scaleY, 3);
  const centerX = round(bodyBounds.x + bodyBounds.width / 2, 3);
  return {
    frameId: frame.frameId,
    sourceRect: frame.sourceRect,
    width: resized.width,
    height: resized.height,
    visualBounds,
    bodyBounds,
    battleScale,
    presentationScale: round(presentationScale, 4),
    offset: { x: round(-centerX, 3), y: round(-groundAnchorY, 3) },
    footAnchor: { x: centerX, y: groundAnchorY },
    renderOnly: true,
    geometryHash,
    variants: {
      p1: { path: relP1, sha256: sha256(readFileSync(path.join(ROOT, relP1))) },
      p2: { path: relP2, sha256: sha256(readFileSync(path.join(ROOT, relP2))) },
    },
  };
}

function findIdleFrame(frames) {
  return frames.actions.get('common_basic')?.find((frame) => frame.frameId === 'idle');
}

async function emitCharacter({ sourceCharId, runtimeCharId, character, frames, darkTransfer, corrections }) {
  const idle = findIdleFrame(frames);
  if (!idle) throw new Error(`missing current idle frame: ${runtimeCharId}`);
  const heightRatio = character.sizeTarget.heightRatioToMoguzo;
  const targetRuntimeBodyHeight = DISPLAY_BASE_HEIGHT * heightRatio * RUNTIME_PIXELS_PER_DISPLAY_PIXEL;
  const resizeScale = targetRuntimeBodyHeight / idle.bodyBounds.height;
  const normalizedIdleBodyHeight = idle.bodyBounds.height * resizeScale;
  const battleScale = round((DISPLAY_BASE_HEIGHT * heightRatio) / normalizedIdleBodyHeight);
  const output = {
    sourceCharId,
    runtimeCharId,
    displayName: character.displayName,
    generatedCommonFrom: character.generatedCommonFrom?.charId || null,
    sizeTarget: character.sizeTarget,
    boundsPolicy: character.boundsPolicy,
    referenceBodyHeight: round(normalizedIdleBodyHeight, 3),
    battleScale,
    poses: {},
    actions: {},
    cutin: { ...character.cutin, path: character.cutin.path },
    p2Profile: P2_PROFILES[runtimeCharId],
  };

  for (const [actionId, actionFrames] of [...frames.actions.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))) {
    const groundY = actionGroundY(actionFrames);
    const records = [];
    for (const [frameIndex, frame] of actionFrames.entries()) {
      const presentationScale = POSE_ACTIONS.has(actionId)
        ? presentationScaleFor(corrections, runtimeCharId, 'pose', frame.frameId)
        : presentationScaleFor(corrections, runtimeCharId, 'action', actionId, frameIndex);
      const frameGroundY = frame.isOverride ? frame.bodyBounds.y + frame.bodyBounds.height : groundY;
      const record = await emitFrame({ frame, runtimeCharId, actionId, groundY: frameGroundY, resizeScale, battleScale, darkTransfer, presentationScale });
      records.push(record);
      if (POSE_ACTIONS.has(actionId)) output.poses[frame.frameId] = record;
    }
    if (!POSE_ACTIONS.has(actionId)) {
      output.actions[actionId] = {
        category: character.actions[actionId]?.category || (DARK_COMMON_ACTIONS.has(actionId) ? 'common-derived' : 'command'),
        displayName: character.actions[actionId]?.displayName || actionId,
        frameOrder: records.map((record) => record.frameId),
        frames: records,
      };
    }
  }

  for (const [poseId, frame] of [...frames.legacyPoses.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))) {
    const actionId = `legacy_${poseId}`;
    const record = await emitFrame({
      frame,
      runtimeCharId,
      actionId,
      groundY: frame.bodyBounds.y + frame.bodyBounds.height,
      resizeScale,
      battleScale,
      darkTransfer,
      presentationScale: presentationScaleFor(corrections, runtimeCharId, 'pose', poseId),
    });
    output.poses[poseId] = record;
  }

  const requiredPoses = ['idle', 'guard', 'flinch', 'victory', 'down', 'getup', 'ko', 'ult_charge', ...LEGACY_RUNTIME_POSES];
  for (const poseId of requiredPoses) if (!output.poses[poseId]) throw new Error(`missing runtime pose ${runtimeCharId}:${poseId}`);
  for (const actionId of ['high', 'mid', 'low', 'mikiri', 'roar', 'grab', 'cmd_01', 'cmd_02', 'cmd_03', 'cmd_04', 'cmd_05', 'cmd_06', 'cmd_07']) {
    if (output.actions[actionId]?.frames.length !== 4) throw new Error(`missing runtime action ${runtimeCharId}:${actionId}`);
  }
  return output;
}

function runtimeManifestHash(manifest) {
  const withoutHash = structuredClone(manifest);
  delete withoutHash.artifactHash;
  return sha256(JSON.stringify(stableObject(withoutHash)));
}

export async function buildCurrentArt() {
  const sourceManifest = readJson(SOURCE_MANIFEST_PATH);
  const verifiedSourceCount = validateSourceChecksums(sourceManifest);
  const corrections = loadPresentationScaleCorrections();
  const darkTransfer = await buildDarkPaletteTransfer(sourceManifest);
  rmSync(OUTPUT_ROOT, { recursive: true, force: true });
  mkdirSync(OUTPUT_ROOT, { recursive: true });

  const collected = new Map();
  for (const [sourceCharId, character] of Object.entries(sourceManifest.characters)) {
    if (sourceCharId === 'dark_moguzo') continue;
    const runtimeCharId = SOURCE_TO_RUNTIME_ID[sourceCharId];
    collected.set(sourceCharId, await collectCharacterFrames(character, sourceCharId, runtimeCharId));
  }
  const darkCharacter = sourceManifest.characters.dark_moguzo;
  const darkFrames = await collectCharacterFrames(darkCharacter, 'dark_moguzo', 'dark_moguzo');
  cloneMoguzoCommonForDark(collected.get('moguzo'), darkFrames);
  collected.set('dark_moguzo', darkFrames);

  const runtimeManifest = {
    version: 'current-art-runtime-v1',
    sourceManifestVersion: sourceManifest.version,
    buildId: 'mamoken-art-current-v2-2026-08-09',
    sourceToRuntimeId: SOURCE_TO_RUNTIME_ID,
    runtimeToSourceId: RUNTIME_TO_SOURCE_ID,
    policies: {
      alphaIsAuthoritative: true,
      legacyWhitenAssetAllowed: false,
      // vNext SIZE_NORMALIZATION_FINAL: per-frame presentation-only face-scale
      // correction is now allowed (data/art/presentation_scale_corrections.json),
      // applied strictly on top of the existing per-character uniform resizeScale.
      // It never touches bodyBoundsAffectCombat/frameTimingAuthority below.
      poseScaleCorrectionAllowed: true,
      bodyBoundsAffectCombat: false,
      frameTimingAuthority: 'BAL phase/pf',
      p2Transform: 'build-time deterministic',
      darkCommonTransform: 'build-time deterministic from Moguzo',
    },
    importer: {
      backgroundRemoval: {
        method: 'exterior-connected near-white flood fill after split',
        brightnessMinimum: BACKGROUND_BRIGHTNESS_MIN,
        maximumChroma: BACKGROUND_CHROMA_MAX,
      },
      verifiedSourceCount,
      darkMasterGeometryAgreement: darkTransfer.geometryAgreement,
      darkPaletteBinCount: darkTransfer.paletteBinCount,
      runtimePixelsPerDisplayPixel: RUNTIME_PIXELS_PER_DISPLAY_PIXEL,
    },
    characters: {},
  };

  for (const sourceCharId of Object.keys(sourceManifest.characters)) {
    const character = sourceManifest.characters[sourceCharId];
    const runtimeCharId = SOURCE_TO_RUNTIME_ID[sourceCharId];
    runtimeManifest.characters[runtimeCharId] = await emitCharacter({
      sourceCharId,
      runtimeCharId,
      character,
      frames: collected.get(sourceCharId),
      darkTransfer,
      corrections,
    });
  }

  runtimeManifest.artifactHash = runtimeManifestHash(runtimeManifest);
  writeJson(RUNTIME_MANIFEST_PATH, runtimeManifest);
  mkdirSync(path.dirname(BROWSER_MANIFEST_PATH), { recursive: true });
  const browserSource = [
    '/* Generated by tools/build_current_art.mjs. Do not edit by hand. */',
    `globalThis.MAMOKEN_CURRENT_ART_MANIFEST=${JSON.stringify(stableObject(runtimeManifest))};`,
    '',
  ].join('\n');
  writeFileSync(BROWSER_MANIFEST_PATH, browserSource);
  return runtimeManifest;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  buildCurrentArt().then((manifest) => {
    const characterCount = Object.keys(manifest.characters).length;
    const frameCount = Object.values(manifest.characters).reduce((sum, character) => (
      sum
      + Object.keys(character.poses).length
      + Object.values(character.actions).reduce((actionSum, action) => actionSum + action.frames.length, 0)
    ), 0);
    console.log(`current art runtime generated: characters=${characterCount} frames=${frameCount} variants=${frameCount * 2}`);
    console.log(`artifactHash=${manifest.artifactHash}`);
  }).catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
