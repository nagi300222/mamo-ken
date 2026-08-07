#!/usr/bin/env node
// マモ拳（仮） VIS-R1 (3): 戦闘モーションの身長再設計
//
// 全9体×24共通ポーズ(+存在するcmdポーズ)をtools/face_metrics.mjsで再計測し、
// キャラ内で頭サイズが一定になるようポーズ別スケール補正を自動算出する。
//
// 基準(reference headSize): 現行spriteScale()がidle.pngのbboxHを基準に per-char の
// 表示倍率を決めているため、本補正もidle.pngのheadSizeをキャラ内の基準とし、他ポーズは
// 「基準/そのポーズのheadSize」でクランプ0.85〜1.20の補正を掛ける(idle自身の補正は常に1.0)。
// idleの検出に失敗したキャラ(godan/dark_moguzo)は、そのキャラで検出に成功した他ポーズの
// headSizeの中央値を基準の代用とする(その旨をCSV/レポートに明記)。
//
// 信頼性: 検出候補が2件以上(鼻+目)取れたポーズのみ補正を適用する。1件のみ・検出不能な
// ポーズは「現状維持」(補正1.0)とする(片目/閉じ目由来の誤検出を補正に混ぜないため)。

import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { detectFace } from './face_metrics.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CHARS_DIR = path.join(ROOT, 'assets', 'chars');
const REPORTS_DIR = path.join(ROOT, 'reports', 'vis');

const CHAR_IDS = ['moguzo', 'pisuke', 'godan', 'hakuma', 'chirka', 'takimaru', 'yomikage', 'bullet', 'dark_moguzo'];
const CLAMP_MIN = 0.85, CLAMP_MAX = 1.20;
const EXCLUDE_FILES = new Set(['standing.png', 'ref_design.png', 'cmd_spare.png']); // 旧作風/未使用の参考素材は対象外

function median(arr) {
  const s = [...arr].sort((a, b) => a - b);
  const n = s.length;
  return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
}

async function loadRawRgba(absPath) {
  const img = sharp(absPath).ensureAlpha();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
}

async function main() {
  const allRows = [];
  const perCharSummary = [];
  for (const charId of CHAR_IDS) {
    const dir = path.join(CHARS_DIR, charId);
    const files = readdirSync(dir).filter((f) => f.endsWith('.png') && !EXCLUDE_FILES.has(f));
    const measured = [];
    for (const file of files) {
      const poseId = file.replace(/\.png$/, '');
      const abs = path.join(dir, file);
      const { data, width, height } = await loadRawRgba(abs);
      const r = detectFace(data, width, height);
      const reliable = r.detected && r.candidates.length >= 2;
      measured.push({ charId, poseId, detected: r.detected, candCount: r.detected ? r.candidates.length : 0, headSize: reliable ? r.headSize : null, reliable });
    }
    const reliableSizes = measured.filter((m) => m.reliable).map((m) => m.headSize);
    const idleRow = measured.find((m) => m.poseId === 'idle');
    let reference, referenceSource;
    if (idleRow && idleRow.reliable) { reference = idleRow.headSize; referenceSource = 'idle'; }
    else if (reliableSizes.length) { reference = median(reliableSizes); referenceSource = 'median(fallback: idle unreliable)'; }
    else { reference = null; referenceSource = 'none(全ポーズ検出不能)'; }

    for (const m of measured) {
      let scale = 1.0, note = '';
      if (!m.reliable || reference == null) {
        note = m.detected ? `候補${m.candCount}件のみ(弱)・現状維持` : '検出不能・現状維持';
      } else {
        const raw = reference / m.headSize;
        scale = Math.min(CLAMP_MAX, Math.max(CLAMP_MIN, raw));
        if (Math.abs(raw - scale) > 1e-9) note = `クランプ前${raw.toFixed(3)}`;
      }
      allRows.push({ ...m, reference, referenceSource, scale, note });
    }
    perCharSummary.push({ charId, reference, referenceSource, poseCount: measured.length, reliableCount: reliableSizes.length });
  }

  mkdirSync(REPORTS_DIR, { recursive: true });
  const csvLines = ['charId,poseId,detected,candCount,headSize,reference,referenceSource,scale,note'];
  for (const r of allRows) {
    csvLines.push([
      r.charId, r.poseId, r.detected, r.candCount,
      r.headSize != null ? r.headSize.toFixed(2) : '',
      r.reference != null ? r.reference.toFixed(2) : '',
      r.referenceSource, r.scale.toFixed(4), r.note,
    ].map((v) => String(v).includes(',') ? `"${v}"` : v).join(','));
  }
  const csvPath = path.join(REPORTS_DIR, 'pose_scale_corrections.csv');
  writeFileSync(csvPath, csvLines.join('\n') + '\n');

  const big = allRows.filter((r) => Math.abs(r.scale - 1) > 0.10);
  const reportLines = [
    '# VIS-R1 (3) ポーズ別スケール補正レポート',
    '',
    '## キャラ別基準(reference headSize)',
    '',
    '| charId | reference | source | 計測ポーズ数 | 信頼できたポーズ数 |',
    '|---|---|---|---|---|',
    ...perCharSummary.map((s) => `| ${s.charId} | ${s.reference != null ? s.reference.toFixed(2) : '-'} | ${s.referenceSource} | ${s.poseCount} | ${s.reliableCount} |`),
    '',
    `## ±10%超の補正が入ったポーズ(${big.length}件)`,
    '',
    '| charId | poseId | headSize | scale | note |',
    '|---|---|---|---|---|',
    ...big.map((r) => `| ${r.charId} | ${r.poseId} | ${r.headSize != null ? r.headSize.toFixed(1) : '-'} | ${r.scale.toFixed(3)} | ${r.note} |`),
    '',
    `全データ: \`reports/vis/pose_scale_corrections.csv\``,
  ];
  writeFileSync(path.join(REPORTS_DIR, 'pose_scale_report.md'), reportLines.join('\n') + '\n');

  // 埋め込み用JSスニペット(scale!=1.0のみ。疎な補正テーブルとしてprototypeへ貼る)
  const nonTrivial = allRows.filter((r) => Math.abs(r.scale - 1) > 0.005);
  const byChar = {};
  for (const r of nonTrivial) (byChar[r.charId] ??= []).push(`${r.poseId}:${r.scale.toFixed(3)}`);
  const jsLines = ['const POSE_SCALE_CORRECTION={'];
  for (const charId of CHAR_IDS) {
    if (!byChar[charId] || !byChar[charId].length) continue;
    jsLines.push(`  ${charId}:{${byChar[charId].join(',')}},`);
  }
  jsLines.push('};');
  writeFileSync(path.join(REPORTS_DIR, 'pose_scale_correction_snippet.js'), jsLines.join('\n') + '\n');

  console.log(`計測完了: ${allRows.length}件 / ±10%超補正: ${big.length}件 / 補正あり(scale!=1.0): ${nonTrivial.length}件`);
  console.log('CSV:', csvPath);
  console.log('JSスニペット:', path.join(REPORTS_DIR, 'pose_scale_correction_snippet.js'));
  return allRows;
}

main().catch((e) => { console.error(e); process.exit(1); });
