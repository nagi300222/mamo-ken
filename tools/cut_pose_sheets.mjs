#!/usr/bin/env node
// マモ拳（仮） 2Dポーズシート統合パイプライン (P1 (2))
//
// art/pose-sheets-raw ブランチのart_raw/{PACKAGE}/POSE_SHEET_MANIFEST.jsonを
// 駆動源として、9キャラ×6シート(2x2/シート=共通24ポーズ)+9マスターから
//   assets/chars/{charId}/{poseId}.png          … 9キャラ×24ポーズ(既存3キャラも上書き)
//   assets/ui/facesq_{charId}.png                … 新6キャラの選択画面用顔アイコン(自動クロップ)
// を生成する。既存3キャラ(モグゾー/ピスケ/ゴダン)のfacesqは現行アイコンを維持するため対象外。
//
// 使い方(art_raw/はこのリポジトリのブランチには含めない。別ブランチから取得して指す):
//   git archive origin/art/pose-sheets-raw art_raw | tar -x -C /tmp/art_raw_src
//   node tools/cut_pose_sheets.mjs --src=/tmp/art_raw_src/art_raw/MAMOKEN_2D_POSE_SHEETS_COMPLETE_v1.0_2026-08-07
//
// 背景透過: 各セル(または顔クロップ元のマスター全体)の外周ピクセルを起点に、
// 「明度(R+G+B)/3が200以上 かつ 低彩度((max-min)<=40)」の隣接ピクセルへ4連結で
// flood fillし、到達した範囲だけをalpha=0にする(=大面積・外周連結の背景のみ除去)。
// 内部で孤立した明るい領域(白っぽい毛など)は外周と繋がっていない限り保持される。
// 実ファイルはJPEGの可能性を考慮し、manifestのfilenameは拡張子を無視したベース名で
// 照合し、.png/.jpg/.jpeg のいずれにも対応する。
//
// 統一キャンバス: キャラごとに24ポーズ全ての背景除去後bboxを求め、
// 幅=最大bboxW+SIDE_MARGIN*2、高さ=最大bboxH+TOP_MARGIN+BOTTOM_MARGINの
// キャンバスへ、各ポーズを「下端はキャンバス下端からBOTTOM_MARGIN(=20px)」
// 「水平中央」でアンカーして配置する(=既存chars/*の下端-20px規約と同じ)。

import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CHARS_DIR = path.join(ROOT, 'assets', 'chars');
const UI_DIR = path.join(ROOT, 'assets', 'ui');

const BOTTOM_MARGIN = 20; // 下端アンカー(既存chars/*規約と同じ)
const TOP_MARGIN = 24;
const SIDE_MARGIN = 40;
const BG_BRIGHTNESS_MIN = 200; // 背景判定: 明度200以上
const BG_SAT_SPREAD_MAX = 40;  // 背景判定: 低彩度((max-min)<=40)
const FACESQ_SIZE = 256;
const FACESQ_HEAD_SIDE_RATIO = 0.36; // マスターbboxHに対する正方形クロップ辺の比率(自動)
const FACESQ_HEAD_BAND_RATIO = 0.22; // 頭部重心を求める帯の高さ(bboxHに対する比率、bbox最上部から)

// manifestのslug(表記ゆれあり)→本ゲームのcharId
const SLUG_TO_CHAR_ID = {
  moguzo: 'moguzo',
  piske: 'pisuke',
  godan: 'godan',
  hakuma: 'hakuma',
  chilka: 'chirka',
  takimaru: 'takimaru',
  yomikage: 'yomikage',
  bullet: 'bullet',
  dark_moguzo: 'dark_moguzo',
};
// 既存3キャラ(現行アイコン維持。facesq自動生成の対象外)
const EXISTING_CHAR_IDS = new Set(['moguzo', 'pisuke', 'godan']);

// manifestのcell名→現行poseId
const CELL_TO_POSE_ID = {
  idle: 'idle',
  guard: 'guard',
  flinch: 'hurt',
  victory: 'win',
  tele_high: 'tele_high',
  tele_mid: 'tele_mid',
  tele_low: 'tele_low',
  attack_mid: 'atk_mid',
  attack_high: 'atk_high',
  attack_low: 'atk_low',
  mikiri: 'mikiri',
  roar_charge: 'roar_charge',
  roar_release: 'roar',
  grab_reach: 'grab_reach',
  grab_lift: 'grab_lift',
  grabbed: 'grabbed',
  down: 'down',
  getup: 'getup',
  ko: 'ko',
  ult_charge: 'ult_charge',
  crouch: 'crouch',
  sway: 'sway',
  lunge: 'lunge',
  crouch_atk: 'crouch_atk',
};

function parseArgs(argv) {
  const out = {};
  for (const a of argv) {
    const m = a.match(/^--([^=]+)=(.*)$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

function resolveSourceFile(srcDir, newFilename) {
  // 拡張子を無視したベース名で照合し、.png/.jpg/.jpeg いずれにも対応する
  const base = newFilename.replace(/\.[^.]+$/, '');
  const files = readdirSync(srcDir);
  for (const ext of ['.png', '.jpg', '.jpeg']) {
    const hit = files.find((f) => f.toLowerCase() === (base + ext).toLowerCase());
    if (hit) return path.join(srcDir, hit);
  }
  // 前方一致(拡張子以外は完全一致の想定だが念のため)
  const hit = files.find((f) => f.toLowerCase().startsWith(base.toLowerCase() + '.'));
  if (hit) return path.join(srcDir, hit);
  throw new Error(`ソースファイルが見つかりません: ${newFilename} (in ${srcDir})`);
}

function isBackgroundPixel(r, g, b) {
  const brightness = (r + g + b) / 3;
  if (brightness < BG_BRIGHTNESS_MIN) return false;
  const spread = Math.max(r, g, b) - Math.min(r, g, b);
  return spread <= BG_SAT_SPREAD_MAX;
}

// 外周ピクセルを起点に背景色を4連結flood fillし、到達領域のalphaを0にする。
// 戻り値: {data,width,height}(RGBA, 背景はalpha=0) と 前景(alpha>0)のtight bbox。
function removeBackgroundFloodFill(rgba, width, height) {
  const data = Buffer.from(rgba); // コピー(元バッファを破壊しない)
  const n = width * height;
  const visited = new Uint8Array(n);
  const isBg = new Uint8Array(n);
  const queue = new Int32Array(n);
  let qh = 0, qt = 0;
  const idxOf = (x, y) => y * width + x;
  const pushIfBg = (x, y) => {
    const idx = idxOf(x, y);
    if (visited[idx]) return;
    const o = idx * 4;
    if (!isBackgroundPixel(data[o], data[o + 1], data[o + 2])) return;
    visited[idx] = 1;
    isBg[idx] = 1;
    queue[qt++] = idx;
  };
  for (let x = 0; x < width; x++) { pushIfBg(x, 0); pushIfBg(x, height - 1); }
  for (let y = 0; y < height; y++) { pushIfBg(0, y); pushIfBg(width - 1, y); }
  while (qh < qt) {
    const idx = queue[qh++];
    const x = idx % width, y = (idx / width) | 0;
    if (x > 0) pushIfBg(x - 1, y);
    if (x < width - 1) pushIfBg(x + 1, y);
    if (y > 0) pushIfBg(x, y - 1);
    if (y < height - 1) pushIfBg(x, y + 1);
  }
  let minX = width, maxX = -1, minY = height, maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = idxOf(x, y);
      if (isBg[idx]) { data[idx * 4 + 3] = 0; continue; }
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
  }
  if (maxX < minX || maxY < minY) { minX = 0; minY = 0; maxX = width - 1; maxY = height - 1; }
  return { data, width, height, bbox: { minX, minY, maxX, maxY, w: maxX - minX + 1, h: maxY - minY + 1 } };
}

async function loadRawRgba(absPath) {
  const img = sharp(absPath).ensureAlpha();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
}

// シート全体を4連結の連結成分に分解する(背景除去後の前景のみ)。
// ポーズ同士は隙間(背景)で分離されているのが通常だが、上げた腕などの
// 描画がセルの幾何的な半分境界をわずかに越えることがあるため、幾何分割ではなく
// 「各成分の重心がどちらの半分に属するか」で属するセルを決める(P1 (2))。
function labelComponents(isBg, width, height) {
  const n = width * height;
  const label = new Int32Array(n).fill(-1);
  const queue = new Int32Array(n);
  const components = [];
  for (let start = 0; start < n; start++) {
    if (isBg[start] || label[start] !== -1) continue;
    const compId = components.length;
    let qh = 0, qt = 0;
    queue[qt++] = start; label[start] = compId;
    let minX = width, maxX = -1, minY = height, maxY = -1, sumX = 0, sumY = 0, count = 0;
    while (qh < qt) {
      const idx = queue[qh++];
      const x = idx % width, y = (idx / width) | 0;
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minY = Math.min(minY, y); maxY = Math.max(maxY, y);
      sumX += x; sumY += y; count++;
      const tryPush = (nx, ny) => {
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) return;
        const nIdx = ny * width + nx;
        if (isBg[nIdx] || label[nIdx] !== -1) return;
        label[nIdx] = compId; queue[qt++] = nIdx;
      };
      tryPush(x - 1, y); tryPush(x + 1, y); tryPush(x, y - 1); tryPush(x, y + 1);
    }
    components.push({ id: compId, minX, maxX, minY, maxY, cx: sumX / count, cy: sumY / count, count });
  }
  return { label, components };
}

async function processCharacter(charEntry, srcDir) {
  const charId = SLUG_TO_CHAR_ID[charEntry.slug];
  if (!charId) throw new Error(`未知のslug: ${charEntry.slug}`);
  const charDir = path.join(srcDir, `${charEntry.id}_${charEntry.slug}`);

  // 1パス目: 6シート×2x2=24ポーズを分割・背景除去・bbox計測(メモリ上に保持)
  const poseCrops = {}; // poseId -> {data,width,height}
  for (const sheet of charEntry.sheets) {
    const abs = resolveSourceFile(charDir, sheet.new_filename);
    const { data, width, height } = await loadRawRgba(abs);
    const removed = removeBackgroundFloodFill(data, width, height); // 背景全体を1回だけ除去(隙間含め全て連結)
    const isBg = new Uint8Array(width * height);
    for (let i = 0; i < width * height; i++) isBg[i] = removed.data[i * 4 + 3] === 0 ? 1 : 0;
    const { label, components } = labelComponents(isBg, width, height);
    const halfW = width / 2, halfH = height / 2;
    const quadKeyOf = (cx, cy) => (cy < halfH ? 'top' : 'bottom') + '_' + (cx < halfW ? 'left' : 'right');
    const byQuad = { top_left: [], top_right: [], bottom_left: [], bottom_right: [] };
    for (const c of components) byQuad[quadKeyOf(c.cx, c.cy)].push(c);

    for (const [pos, cellName] of Object.entries(sheet.cells)) {
      const comps = byQuad[pos];
      const poseId = CELL_TO_POSE_ID[cellName];
      if (!poseId) throw new Error(`未知のcell名: ${cellName}`);
      if (!comps.length) throw new Error(`${sheet.new_filename} の ${pos}(${cellName}) に前景成分が見つかりません`);
      let minX = width, maxX = -1, minY = height, maxY = -1;
      for (const c of comps) { minX = Math.min(minX, c.minX); maxX = Math.max(maxX, c.maxX); minY = Math.min(minY, c.minY); maxY = Math.max(maxY, c.maxY); }
      const w = maxX - minX + 1, h = maxY - minY + 1;
      const compIds = new Set(comps.map((c) => c.id));
      const out = Buffer.alloc(w * h * 4);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const srcIdx = (minY + y) * width + (minX + x);
          if (!compIds.has(label[srcIdx])) continue; // このセルの成分以外(隙間や隣セルの越境分)は透過のまま
          const srcOff = srcIdx * 4, dstOff = (y * w + x) * 4;
          removed.data.copy(out, dstOff, srcOff, srcOff + 4);
        }
      }
      poseCrops[poseId] = { data: out, width: w, height: h };
    }
  }

  // 2パス目: 統一キャンバスを決定し、各ポーズを下端-20px・水平中央でコンポジット
  let maxW = 0, maxH = 0;
  for (const p of Object.values(poseCrops)) { if (p.width > maxW) maxW = p.width; if (p.height > maxH) maxH = p.height; }
  const canvasW = maxW + SIDE_MARGIN * 2;
  const canvasH = maxH + TOP_MARGIN + BOTTOM_MARGIN;

  const outDir = path.join(CHARS_DIR, charId);
  mkdirSync(outDir, { recursive: true });
  let written = 0;
  for (const [poseId, crop] of Object.entries(poseCrops)) {
    const left = Math.round((canvasW - crop.width) / 2);
    const top = canvasH - BOTTOM_MARGIN - crop.height;
    const cellPng = await sharp(crop.data, { raw: { width: crop.width, height: crop.height, channels: 4 } }).png().toBuffer();
    const canvas = sharp({ create: { width: canvasW, height: canvasH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
      .composite([{ input: cellPng, left, top }]);
    const outPath = path.join(outDir, `${poseId}.png`);
    await canvas.png().toFile(outPath);
    written++;
  }
  return { charId, written, canvasW, canvasH };
}

async function generateFacesq(charEntry, srcDir) {
  const charId = SLUG_TO_CHAR_ID[charEntry.slug];
  if (EXISTING_CHAR_IDS.has(charId)) return null; // 既存3キャラは現行アイコン維持
  const charDir = path.join(srcDir, `${charEntry.id}_${charEntry.slug}`);
  const abs = resolveSourceFile(charDir, charEntry.master.new_filename);
  const { data, width, height } = await loadRawRgba(abs);
  const removed = removeBackgroundFloodFill(data, width, height);
  const { bbox } = removed;
  // 頭部中心の推定: bboxの水平中央(=胴体含む全身の中心)は頭の位置とずれるため、
  // bbox最上部の帯(頭・耳が収まる範囲)だけに絞った前景ピクセルの重心を頭部中心とする(自動)
  const bandBottom = bbox.minY + Math.round(bbox.h * FACESQ_HEAD_BAND_RATIO);
  let sumX = 0, sumY = 0, count = 0;
  for (let y = bbox.minY; y <= bandBottom; y++) {
    for (let x = bbox.minX; x <= bbox.maxX; x++) {
      if (removed.data[(y * width + x) * 4 + 3] === 0) continue;
      sumX += x; sumY += y; count++;
    }
  }
  const centerX = count ? sumX / count : bbox.minX + bbox.w / 2;
  const centerY = count ? sumY / count : bbox.minY + bbox.h * 0.1;
  const side = Math.round(bbox.h * FACESQ_HEAD_SIDE_RATIO);
  let x0 = Math.round(centerX - side / 2), y0 = Math.round(centerY - side / 2);
  x0 = Math.max(0, Math.min(width - side, x0));
  y0 = Math.max(0, Math.min(height - side, y0));
  mkdirSync(UI_DIR, { recursive: true });
  const outPath = path.join(UI_DIR, `facesq_${charId}.png`);
  await sharp(abs)
    .extract({ left: x0, top: y0, width: side, height: side })
    .resize(FACESQ_SIZE, FACESQ_SIZE)
    .png()
    .toFile(outPath);
  return { charId, outPath };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.src) {
    console.error('使い方: node tools/cut_pose_sheets.mjs --src=<POSE_SHEET_MANIFEST.jsonのあるディレクトリ>');
    process.exit(1);
  }
  const srcDir = path.resolve(args.src);
  const manifestPath = path.join(srcDir, 'POSE_SHEET_MANIFEST.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

  let totalPoses = 0, totalFace = 0;
  for (const charEntry of manifest.characters) {
    const r = await processCharacter(charEntry, srcDir);
    console.log(`chars/${r.charId}: ${r.written} poses (canvas ${r.canvasW}x${r.canvasH})`);
    totalPoses += r.written;
    const f = await generateFacesq(charEntry, srcDir);
    if (f) { console.log(`ui/facesq_${f.charId}.png`); totalFace++; }
  }
  console.log(`完了: ${manifest.characters.length}キャラ / ポーズ${totalPoses}枚 / facesq${totalFace}枚`);
}

main().catch((e) => { console.error(e); process.exit(1); });
