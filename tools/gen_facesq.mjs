#!/usr/bin/env node
// マモ拳（仮） VIS-R1.1 (1): 選択アイコン facesq_{id}.png の再生成(手動テーブル方式)
//
// VIS-R1で導入した自動顔検出(tools/face_metrics.mjs)は、assets/chars/(戦闘用の
// フラットな線画素材)では安定して機能したが、本タスクの見直しでソースを
// assets/portraits/(フィギュア調の立体素材)に切り替えたところ、拳・爪の暗色を
// 鼻と誤検出するケースが目立った。そこで発注者が実機スクリーンショットで検収した
// 手動クロップテーブル(tools/facesq_manual_table.mjs)を一次ソースとし、自動検出は
// テーブルに未登録のキャラが増えた場合のみのフォールバックに降格する。
//
// クロップ: FACESQ_MANUAL_TABLEの(cx,cy,r)から正方形(比率不変)を切り出す。
// side = 2 * r * 画像高、中心 = (cx*幅, cy*高)。256px正方形にリサイズする。

import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { detectFace } from './face_metrics.mjs';
import { FACESQ_MANUAL_TABLE } from './facesq_manual_table.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PORTRAITS_DIR = path.join(ROOT, 'assets', 'portraits');
const UI_DIR = path.join(ROOT, 'assets', 'ui');
const REPORTS_DIR = path.join(ROOT, 'reports', 'vis');

const FACESQ_SIZE = 256;
const CHAR_IDS = ['moguzo', 'pisuke', 'godan', 'hakuma', 'chirka', 'takimaru', 'yomikage', 'bullet', 'dark_moguzo'];

function clampCrop(cxPx, cyPx, side, width, height) {
  side = Math.round(Math.min(side, width, height));
  let x0 = Math.round(cxPx - side / 2), y0 = Math.round(cyPx - side / 2);
  x0 = Math.max(0, Math.min(width - side, x0));
  y0 = Math.max(0, Math.min(height - side, y0));
  return { x0, y0, side };
}

// フォールバック: テーブルに未登録のキャラのみ、VIS-R1の自動顔検出(鼻=最大暗色クラスタ)を使う
async function detectFallback(charId) {
  const abs = path.join(PORTRAITS_DIR, `${charId}.png`);
  const img = sharp(abs).ensureAlpha();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const r = detectFace(data, info.width, info.height);
  if (!r.detected) throw new Error(`${charId}: 手動テーブル未登録かつ自動検出も失敗(要手動エントリ追加)`);
  const mult = 2.4;
  const { x0, y0, side } = clampCrop(r.faceCenterX, r.faceCenterY, r.headSize * mult, info.width, info.height);
  return { charId, abs, x0, y0, side, source: 'auto-detect(fallback)' };
}

async function main() {
  mkdirSync(UI_DIR, { recursive: true });
  mkdirSync(REPORTS_DIR, { recursive: true });
  const results = [];
  for (const charId of CHAR_IDS) {
    const abs = path.join(PORTRAITS_DIR, `${charId}.png`);
    const entry = FACESQ_MANUAL_TABLE[charId];
    let r;
    if (entry) {
      const meta = await sharp(abs).metadata();
      const side = 2 * entry.r * meta.height;
      const { x0, y0, side: clampedSide } = clampCrop(entry.cx * meta.width, entry.cy * meta.height, side, meta.width, meta.height);
      r = { charId, abs, x0, y0, side: clampedSide, source: `manual(cx=${entry.cx},cy=${entry.cy},r=${entry.r})` };
    } else {
      r = await detectFallback(charId);
    }
    const outPath = path.join(UI_DIR, `facesq_${charId}.png`);
    await sharp(r.abs)
      .extract({ left: r.x0, top: r.y0, width: r.side, height: r.side })
      .resize(FACESQ_SIZE, FACESQ_SIZE)
      .png()
      .toFile(outPath);
    results.push(r);
    console.log(`${charId}: source=${r.source} side=${r.side}`);
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
    '# VIS-R1.1 (1) facesq_*.png 再生成レポート(手動テーブル方式)',
    '',
    'ソース: assets/portraits/{id}.png。自動顔検出(tools/face_metrics.mjs)は拳・爪を鼻と誤検出',
    'するため、tools/facesq_manual_table.mjsの手動クロップテーブル(発注者検収済み)を一次ソースとし、',
    '未登録キャラのみ自動検出へフォールバックする。',
    '',
    '| charId | ソース | クロップ辺(px) |',
    '|---|---|---|',
    ...results.map((r) => `| ${r.charId} | ${r.source} | ${r.side} |`),
    '',
    `チェックシート: \`reports/vis/facesq_check_sheet.png\``,
  ];
  writeFileSync(path.join(REPORTS_DIR, 'facesq_regen_report.md'), reportLines.join('\n') + '\n');
  console.log('チェックシート:', sheetPath);
  console.log('レポート:', path.join(REPORTS_DIR, 'facesq_regen_report.md'));
}

main().catch((e) => { console.error(e); process.exit(1); });
