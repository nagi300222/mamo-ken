#!/usr/bin/env node
// マモ拳（仮） VIS-R1 (2)準備: assets/portraits/{id}.pngの鼻Y比率を計測する。
//
// portraits/はフォトリアル調で、耳の暗色パッチが目・鼻より大きく検出され「鼻=最大クラスタ」が
// 誤爆しやすいこと、アクセサリ(ネックレスの紐飾り等)が上位クラスタに混ざり顔中心が
// 顔の外まで引っ張られることが実測で判明した(reports/vis/portrait_nose_baseline.mdに詳細)。
// そのため以下の信頼性フィルタを課し、通らないキャラは信頼できた実測値の中央値で
// フォールバックする(このゲーム全体の「検出不能→寸法/統計フォールバック+報告」方針と同じ扱い)。
//
// 信頼性フィルタ(3条件すべてを満たすもののみ「実測値を採用」とする):
//   - 検出候補が2件以上(片目/片耳のみの誤爆を避ける)
//   - 顔中心平均に使った上位候補のY方向の広がりが画像高の12%以内(顔から離れた
//     アクセサリ等が混ざっていないことの目安)
//   - 顔中心Y比率が[0.04, 0.20]の範囲内(耳のみを鼻と誤検出した極端に浅い値を除外)

import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { detectFace } from './face_metrics.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PORTRAITS_DIR = path.join(ROOT, 'assets', 'portraits');
const REPORTS_DIR = path.join(ROOT, 'reports', 'vis');

const CHAR_IDS = ['moguzo', 'pisuke', 'godan', 'hakuma', 'chirka', 'takimaru', 'yomikage', 'bullet', 'dark_moguzo'];
const SPREAD_MAX_RATIO = 0.12;
const PLAUSIBLE_MIN = 0.04, PLAUSIBLE_MAX = 0.20;

function median(arr) {
  const s = [...arr].sort((a, b) => a - b);
  const n = s.length;
  return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
}

async function main() {
  const rows = [];
  for (const charId of CHAR_IDS) {
    const abs = path.join(PORTRAITS_DIR, `${charId}.png`);
    const img = sharp(abs).ensureAlpha();
    const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
    const r = detectFace(data, info.width, info.height);
    if (!r.detected) { rows.push({ charId, detected: false, ratio: null, confident: false, candCount: 0, spreadRatio: null }); continue; }
    const topYs = r.candidates.slice(0, 3).map((c) => c.cy);
    const spreadRatio = (Math.max(...topYs) - Math.min(...topYs)) / info.height;
    const ratio = r.faceCenterY / info.height;
    const confident = r.candidates.length >= 2 && spreadRatio <= SPREAD_MAX_RATIO && ratio >= PLAUSIBLE_MIN && ratio <= PLAUSIBLE_MAX;
    rows.push({ charId, detected: true, ratio, confident, candCount: r.candidates.length, spreadRatio, noseXRatio: r.faceCenterX / info.width });
  }
  const confidentRatios = rows.filter((r) => r.confident).map((r) => r.ratio);
  const fallbackRatio = median(confidentRatios);
  const final = rows.map((r) => ({ ...r, finalRatio: r.confident ? r.ratio : fallbackRatio }));

  mkdirSync(REPORTS_DIR, { recursive: true });
  const lines = [
    '# VIS-R1 (2)準備: portraits/{id}.png 鼻Yベースライン計測',
    '',
    `信頼できた実測値の中央値(フォールバック値): ${fallbackRatio.toFixed(4)}`,
    '',
    '| charId | 検出 | 候補数 | Y広がり比 | 顔中心Yratio(実測) | 採用 | 採用値 |',
    '|---|---|---|---|---|---|---|',
    ...final.map((r) => `| ${r.charId} | ${r.detected} | ${r.candCount} | ${r.spreadRatio != null ? r.spreadRatio.toFixed(4) : '-'} | ${r.ratio != null ? r.ratio.toFixed(4) : '-'} | ${r.confident ? '実測' : 'フォールバック(中央値)'} | ${r.finalRatio.toFixed(4)} |`),
    '',
    '```js',
    'const PORTRAIT_NOSE_Y_RATIO = {',
    ...final.map((r) => `  ${r.charId}: ${r.finalRatio.toFixed(4)},`),
    '};',
    '```',
  ];
  writeFileSync(path.join(REPORTS_DIR, 'portrait_nose_baseline.md'), lines.join('\n') + '\n');
  console.log(lines.join('\n'));
}

main().catch((e) => { console.error(e); process.exit(1); });
