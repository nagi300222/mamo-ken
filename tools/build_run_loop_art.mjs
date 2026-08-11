#!/usr/bin/env node
// RUN-LOOP-R1(#113): 四足走行1x4アート(assets/art/run_loop_source/**、data/art/run_loop_source_manifest.json
// 準拠)から、標準MINIGAME RENDA(#102)専用の走行ループ実行時アセットを生成する。
//
// Authority boundaries:
// - input paths/checksums come from data/art/run_loop_source_manifest.json
// - this file produces presentation data only (assets/art/runtime/<id>/run_loop/**)
// - BAL, hit/reach/hurt boxes,入力・ロックステップ状態は一切読まない/書かない
// - 標準MINIGAME RENDAのみに接続する。Battle Gyuiin RENDA(stepRenda/BAL.MINIGAME.RENDA)は無関係・未変更
//
// 処理内容:
//   1) 各キャラF1-F4(768x768 RGBA)の連結成分を検出し、最大成分以外(=デリバリー時点で混入した
//      孤立alpha島。data/art/run_loop_source_manifest.jsonのcleanupFindings参照)を透明化する
//   2) キャラごとに4フレーム共通のalpha bbox(1)後)を計算し、同一クロップ窓・同一スケールで
//      揃える(フレーム間でスケール/接地線がズレないようにするため)
//   3) P1(納品時の配色そのまま)をそのまま書き出し、P2はbuild_current_art.mjsのapplyP2Palette()/
//      P2_PROFILES(既存の決定的パレット変換パイプライン)をそのまま再利用して生成する

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import sharp from 'sharp';
import { applyP2Palette } from './build_current_art.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const MANIFEST_PATH = path.join(ROOT, 'data', 'art', 'run_loop_source_manifest.json');
const OUTPUT_ROOT = path.join(ROOT, 'assets', 'art', 'runtime');

const ALPHA_THRESH = 10;
const CROP_PADDING = 12; // 連結成分クロップ後、拡縮時のエッジ欠けを避けるための余白(px、クロップ元スケール)
const OUTPUT_HEIGHT = 420; // 全キャラ・全フレーム共通の出力キャンバス高さ(下端=接地線で統一)

function sha256(buf) {
  return createHash('sha256').update(buf).digest('hex');
}

function readJson(absPath) {
  return JSON.parse(readFileSync(absPath, 'utf8'));
}

function writeJson(absPath, value) {
  mkdirSync(path.dirname(absPath), { recursive: true });
  writeFileSync(absPath, `${JSON.stringify(value, null, 2)}\n`);
}

function validateSourceChecksums(manifest) {
  let checked = 0;
  for (const [id, entry] of Object.entries(manifest.characters)) {
    const descriptors = [entry.original, entry.sheet1x4, ...Object.values(entry.frames)];
    for (const descriptor of descriptors) {
      const abs = path.join(ROOT, descriptor.path);
      if (!existsSync(abs)) throw new Error(`missing run-loop source art: ${descriptor.path}`);
      const actual = sha256(readFileSync(abs));
      if (actual !== descriptor.sha256) throw new Error(`run-loop source checksum mismatch: ${descriptor.path} (char=${id})`);
      checked += 1;
    }
  }
  return checked;
}

// 連結成分(4近傍)ラベリング。最大成分以外のpixelを透明化して返す(cleanupFindingsに載っている
// 5フレームでのみ実際に複数成分が見つかる。他31フレームは元々単一成分のため事実上no-op)。
function keepLargestComponent(data, width, height) {
  const n = width * height;
  const labels = new Int32Array(n).fill(-1);
  const sizes = [];
  const stack = [];
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = y * width + x;
      if (labels[idx] !== -1) continue;
      if (data[idx * 4 + 3] < ALPHA_THRESH) { labels[idx] = -2; continue; }
      const label = sizes.length;
      let size = 0;
      stack.push(idx);
      labels[idx] = label;
      while (stack.length) {
        const cur = stack.pop();
        const cy = Math.floor(cur / width), cx = cur % width;
        size += 1;
        const neighbors = [[cx - 1, cy], [cx + 1, cy], [cx, cy - 1], [cx, cy + 1]];
        for (const [nx, ny] of neighbors) {
          if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
          const nidx = ny * width + nx;
          if (labels[nidx] !== -1) continue;
          if (data[nidx * 4 + 3] < ALPHA_THRESH) { labels[nidx] = -2; continue; }
          labels[nidx] = label;
          stack.push(nidx);
        }
      }
      sizes.push(size);
    }
  }
  if (sizes.length <= 1) return { data, removedIslands: 0 };
  let largest = 0;
  for (let i = 1; i < sizes.length; i += 1) if (sizes[i] > sizes[largest]) largest = i;
  const out = Buffer.from(data);
  for (let idx = 0; idx < n; idx += 1) {
    if (labels[idx] >= 0 && labels[idx] !== largest) {
      out[idx * 4 + 3] = 0; out[idx * 4] = 0; out[idx * 4 + 1] = 0; out[idx * 4 + 2] = 0;
    }
  }
  return { data: out, removedIslands: sizes.length - 1 };
}

function alphaBBox(data, width, height) {
  let minX = width, maxX = -1, minY = height, maxY = -1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (data[(y * width + x) * 4 + 3] >= ALPHA_THRESH) {
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) throw new Error('frame has no visible pixels');
  return { minX, minY, maxX, maxY };
}

async function writePng(absPath, rgba, width, height) {
  mkdirSync(path.dirname(absPath), { recursive: true });
  const png = await sharp(rgba, { raw: { width, height, channels: 4 } })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer();
  writeFileSync(absPath, png);
}

async function loadRawRgba(absPath) {
  const { data, info } = await sharp(absPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data: Buffer.from(data), width: info.width, height: info.height };
}

async function processCharacter(runtimeId, entry) {
  const cleaned = [];
  let totalRemovedIslands = 0;
  for (const frameKey of ['F1', 'F2', 'F3', 'F4']) {
    const abs = path.join(ROOT, entry.frames[frameKey].path);
    const raw = await loadRawRgba(abs);
    const { data, removedIslands } = keepLargestComponent(raw.data, raw.width, raw.height);
    totalRemovedIslands += removedIslands;
    cleaned.push({ data, width: raw.width, height: raw.height });
  }

  // 4フレーム共通の crop 窓(union bbox + padding)を決め、全フレームへ同一クロップ・同一スケールを
  // 適用する(フレームごとに別々のbboxで揃えると、ループ再生時に接地線/縮尺がガタつくため)。
  let unionMinX = Infinity, unionMinY = Infinity, unionMaxX = -Infinity, unionMaxY = -Infinity;
  const bboxes = cleaned.map((frame) => {
    const bbox = alphaBBox(frame.data, frame.width, frame.height);
    unionMinX = Math.min(unionMinX, bbox.minX); unionMinY = Math.min(unionMinY, bbox.minY);
    unionMaxX = Math.max(unionMaxX, bbox.maxX); unionMaxY = Math.max(unionMaxY, bbox.maxY);
    return bbox;
  });
  const { width: fullW, height: fullH } = cleaned[0];
  const cropX = Math.max(0, unionMinX - CROP_PADDING);
  const cropY = Math.max(0, unionMinY - CROP_PADDING);
  const cropRight = Math.min(fullW, unionMaxX + CROP_PADDING + 1);
  const cropBottom = Math.min(fullH, unionMaxY + CROP_PADDING + 1);
  const cropW = cropRight - cropX, cropH = cropBottom - cropY;

  const scale = OUTPUT_HEIGHT / cropH;
  const outW = Math.max(1, Math.round(cropW * scale));

  const framesOut = [];
  for (let i = 0; i < cleaned.length; i += 1) {
    const frame = cleaned[i];
    const cropped = await sharp(frame.data, { raw: { width: frame.width, height: frame.height, channels: 4 } })
      .extract({ left: cropX, top: cropY, width: cropW, height: cropH })
      .resize({ width: outW, height: OUTPUT_HEIGHT, kernel: sharp.kernel.lanczos3 })
      .raw().toBuffer();
    const p1 = Buffer.from(cropped);
    const bodyMask = Buffer.alloc(outW * OUTPUT_HEIGHT, 1); // 全pixel対象。透明/暗部除外はapplyP2Palette内部で行う
    const p2 = applyP2Palette(p1, bodyMask, runtimeId);
    framesOut.push({ p1, p2, width: outW, height: OUTPUT_HEIGHT, frameKey: `F${i + 1}` });
  }

  for (const frame of framesOut) {
    const frameSlug = frame.frameKey.toLowerCase();
    await writePng(path.join(OUTPUT_ROOT, runtimeId, 'run_loop', 'p1', `${frameSlug}.png`), frame.p1, frame.width, frame.height);
    await writePng(path.join(OUTPUT_ROOT, runtimeId, 'run_loop', 'p2', `${frameSlug}.png`), frame.p2, frame.width, frame.height);
  }

  return { runtimeId, removedIslands: totalRemovedIslands, outW, outH: OUTPUT_HEIGHT, crop: { cropX, cropY, cropW, cropH }, bboxes };
}

export async function buildRunLoopArt() {
  const manifest = readJson(MANIFEST_PATH);
  const checkedCount = validateSourceChecksums(manifest);
  const results = [];
  for (const [runtimeId, entry] of Object.entries(manifest.characters)) {
    results.push(await processCharacter(runtimeId, entry));
  }
  return { checkedCount, results };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  buildRunLoopArt().then(({ checkedCount, results }) => {
    console.log(`RUN-LOOP-R1: verified ${checkedCount} source files; generated ${results.length} characters x 4 frames x 2 palettes.`);
    for (const r of results) {
      console.log(`  ${r.runtimeId}: removedIslands=${r.removedIslands} out=${r.outW}x${r.outH}`);
    }
  }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
