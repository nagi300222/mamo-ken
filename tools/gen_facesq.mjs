#!/usr/bin/env node
// マモ拳（仮） VIS-R1 (1): 選択アイコン facesq_{id}.png の再生成
//
// tools/face_metrics.mjs の顔検出を使い、各キャラの「鼻を中心に顔全体」が入る
// 正方形クロップ(比率不変・正方形→正方形)でfacesq_{id}.pngを再生成する。
//
// ソース: assets/chars/{id}/*.png (戦闘用24ポーズ素材。フラットな線画+ベタ塗り
// スタイルで顔検出の精度が高い。art_raw由来の「master」原稿は本リポジトリに
// 存在しないため、既存の戦闘アセットの中から検出に成功するポーズを使う)。
// 優先ポーズ順に試し、最初に検出成功したポーズを採用する。全ポーズで検出できない
// 場合のみ、旧cut_pose_sheets.mjs方式(bbox最上部帯の重心)へフォールバックする。
//
// クロップサイズ: 頭サイズ(headSize)×2.2〜2.6の範囲で、顔検出時に測った
// 「顔中心を通る帯の前景幅(=ハチマキ/スカーフ/ロープ等の装身具を含む見た目の幅)」
// を基準に自動調整する(帯幅が広いキャラほど大きめの倍率を採る)。

import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { detectFace } from './face_metrics.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CHARS_DIR = path.join(ROOT, 'assets', 'chars');
const UI_DIR = path.join(ROOT, 'assets', 'ui');
const REPORTS_DIR = path.join(ROOT, 'reports', 'vis');

const FACESQ_SIZE = 256;
const MULT_MIN = 2.2;
const MULT_MAX = 2.6;
const BAND_MARGIN = 1.18; // 帯幅→枠倍率への安全マージン

// 検出を試すポーズの優先順(正面向き・表情が安定しているものを優先)。
// standing.png/ref_design.pngは既存3キャラのみに残る旧作風(フォトリアル)の
// 参考素材で、実プレイでは使われていない・9体で作風が揃わないため対象外とする。
const POSE_PRIORITY = [
  'idle', 'guard', 'win', 'crouch_atk', 'grab_reach', 'grabbed',
  'lunge', 'grab_lift', 'sway', 'getup', 'crouch', 'tele_mid', 'mikiri',
  'hurt', 'tele_high', 'tele_low', 'roar_charge', 'atk_mid', 'atk_high', 'atk_low',
];

const CHAR_IDS = ['moguzo', 'pisuke', 'godan', 'hakuma', 'chirka', 'takimaru', 'yomikage', 'bullet', 'dark_moguzo'];

async function loadRawRgba(absPath) {
  const img = sharp(absPath).ensureAlpha();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
}

// 顔中心を通る水平帯の前景幅(=装身具を含む見た目の頭部幅)を測る
function bandForegroundWidth(data, width, height, centerY, halfBand) {
  const y0 = Math.max(0, Math.round(centerY - halfBand));
  const y1 = Math.min(height - 1, Math.round(centerY + halfBand));
  let minX = width, maxX = -1;
  for (let y = y0; y <= y1; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] === 0) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
    }
  }
  if (maxX < minX) return 0;
  return maxX - minX + 1;
}

// 旧cut_pose_sheets.mjs方式: 背景除去済み前景bbox最上部22%帯の重心を頭部中心とみなす
function bandCentroidFallback(data, width, height) {
  let minX = width, maxX = -1, minY = height, maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] === 0) continue;
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
  }
  if (maxX < minX) return null;
  const bboxH = maxY - minY + 1;
  const bandBottom = minY + Math.round(bboxH * 0.22);
  let sumX = 0, sumY = 0, count = 0;
  for (let y = minY; y <= bandBottom; y++) {
    for (let x = minX; x <= maxX; x++) {
      if (data[(y * width + x) * 4 + 3] === 0) continue;
      sumX += x; sumY += y; count++;
    }
  }
  if (!count) return null;
  return { centerX: sumX / count, centerY: sumY / count, headSize: bboxH * 0.18 };
}

function buildCandidate(charId, poseId, abs, data, width, height, r) {
  const halfBand = r.headSize * 0.75;
  const bandWidth = bandForegroundWidth(data, width, height, r.faceCenterY, halfBand);
  let mult = Math.min(MULT_MAX, Math.max(MULT_MIN, (bandWidth * BAND_MARGIN) / r.headSize));
  let side = Math.round(r.headSize * mult);
  side = Math.min(side, width, height);
  let x0 = Math.round(r.faceCenterX - side / 2), y0 = Math.round(r.faceCenterY - side / 2);
  x0 = Math.max(0, Math.min(width - side, x0));
  y0 = Math.max(0, Math.min(height - side, y0));
  return { charId, sourcePose: poseId, abs, x0, y0, side, mult, headSize: r.headSize, candCount: r.candidates.length, fallback: false };
}

async function generateOne(charId) {
  const dir = path.join(CHARS_DIR, charId);
  const available = new Set(readdirSync(dir));
  // 1候補のみの検出は「片目のみ写っている」「閉じ目で鼻しか取れていない」等の誤検出リスクが
  // 高いため、全ポーズを走査した上でまず2候補以上(鼻+目)が取れたポーズ群から優先順最上位を選び、
  // 2候補以上が1件も無い場合のみ1候補群の中からheadSizeが最大のもの(=最も安定した検出)を選ぶ。
  const strong = [], weak = [];
  for (const poseId of POSE_PRIORITY) {
    const file = poseId + '.png';
    if (!available.has(file)) continue;
    const abs = path.join(dir, file);
    const { data, width, height } = await loadRawRgba(abs);
    const r = detectFace(data, width, height);
    if (!r.detected) continue;
    const candidate = buildCandidate(charId, poseId, abs, data, width, height, r);
    (r.candidates.length >= 2 ? strong : weak).push(candidate);
  }
  if (strong.length) return strong[0];
  if (weak.length) {
    weak.sort((a, b) => b.headSize - a.headSize);
    return { ...weak[0], sourcePose: weak[0].sourcePose + '(候補1件のみ・弱)' };
  }
  // 全ポーズで検出失敗: 旧方式(帯重心)でidle.pngからフォールバック
  const abs = path.join(dir, 'idle.png');
  const { data, width, height } = await loadRawRgba(abs);
  const fb = bandCentroidFallback(data, width, height);
  if (!fb) throw new Error(`${charId}: フォールバックも失敗(前景ピクセルが検出できない)`);
  const mult = 2.4;
  let side = Math.round(fb.headSize * mult);
  side = Math.min(side, width, height);
  let x0 = Math.round(fb.centerX - side / 2), y0 = Math.round(fb.centerY - side / 2);
  x0 = Math.max(0, Math.min(width - side, x0));
  y0 = Math.max(0, Math.min(height - side, y0));
  return { charId, sourcePose: 'idle(fallback:band-centroid)', abs, x0, y0, side, mult, headSize: fb.headSize, candCount: 0, fallback: true };
}

async function main() {
  mkdirSync(UI_DIR, { recursive: true });
  mkdirSync(REPORTS_DIR, { recursive: true });
  const results = [];
  for (const charId of CHAR_IDS) {
    const r = await generateOne(charId);
    const outPath = path.join(UI_DIR, `facesq_${charId}.png`);
    await sharp(r.abs)
      .extract({ left: r.x0, top: r.y0, width: r.side, height: r.side })
      .resize(FACESQ_SIZE, FACESQ_SIZE)
      .png()
      .toFile(outPath);
    results.push(r);
    console.log(`${charId}: pose=${r.sourcePose} side=${r.side} mult=${r.mult.toFixed(2)} cands=${r.candCount} fallback=${r.fallback}`);
  }

  // 9体並びチェックシート
  const cellCols = 3, cell = FACESQ_SIZE;
  const rows = Math.ceil(CHAR_IDS.length / cellCols);
  const composites = CHAR_IDS.map((id, i) => ({
    input: path.join(UI_DIR, `facesq_${id}.png`),
    left: (i % cellCols) * cell,
    top: Math.floor(i / cellCols) * cell,
  }));
  const sheetPath = path.join(REPORTS_DIR, 'facesq_check_sheet.png');
  await sharp({ create: { width: cell * cellCols, height: cell * rows, channels: 4, background: { r: 24, g: 26, b: 34, alpha: 1 } } })
    .composite(composites)
    .png()
    .toFile(sheetPath);

  const reportLines = [
    '# VIS-R1 (1) facesq_*.png 再生成レポート',
    '',
    '| charId | ソースポーズ | クロップ辺(px) | 倍率(headSize×) | 検出候補数 | フォールバック |',
    '|---|---|---|---|---|---|',
    ...results.map((r) => `| ${r.charId} | ${r.sourcePose} | ${r.side} | ${r.mult.toFixed(2)} | ${r.candCount} | ${r.fallback ? 'YES(帯重心方式)' : 'no'} |`),
    '',
    `チェックシート: \`reports/vis/facesq_check_sheet.png\``,
  ];
  writeFileSync(path.join(REPORTS_DIR, 'facesq_regen_report.md'), reportLines.join('\n') + '\n');
  console.log('チェックシート:', sheetPath);
  console.log('レポート:', path.join(REPORTS_DIR, 'facesq_regen_report.md'));
}

main().catch((e) => { console.error(e); process.exit(1); });
