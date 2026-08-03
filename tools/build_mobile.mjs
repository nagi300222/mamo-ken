#!/usr/bin/env node
// マモ拳（仮） モバイル配布ビルドスクリプト
//
// prototype/mamoken_prototype_v01.html が読み込む assets/ 配下の画像を全て
// base64のdata URLとして埋め込み、単一ファイル dist/mamoken_mobile.html を
// 生成する。Node標準モジュールのみを使用(npm install不要)。
//
// 再生成手順:
//   node tools/build_mobile.mjs
//
// 生成物(dist/mamoken_mobile.html)はfile://で直接開いても全画像・全機能が
// 動作する配布物としてリポジトリにコミットする。assets/追加・変更のたびに
// このスクリプトを再実行し、dist/の再生成もあわせてコミットすること。
//
// 仕組み: prototype側のloadImg()の呼び出し方(リテラル/文字列結合どちらも)を
// 個別に解析するのではなく、assets/配下の画像を全て「相対パス文字列→data URL」
// のマップにして埋め込み、loadImg()内のimg.src=src;を「マップに該当キーが
// あればdata URLを、無ければ元のsrcをそのまま使う」に1行だけ差し替える。
// こうすることでポーズ/キャラ追加などプロトタイプ側の変更に追従するための
// メンテナンスが不要になる。assets/ref/ と ref_design.png はコード上どこからも
// 読み込まれないアート参考用ファイルのため埋め込み対象から除外する。

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC_HTML = path.join(ROOT, 'prototype', 'mamoken_prototype_v01.html');
const ASSETS_DIR = path.join(ROOT, 'assets');
const OUT_DIR = path.join(ROOT, 'dist');
const OUT_HTML = path.join(OUT_DIR, 'mamoken_mobile.html');

const MIME_BY_EXT = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
};

function walk(dir, out) {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else out.push(full);
  }
}

function isExcluded(relFromAssets) {
  // アート参考用(ゲームコードから未参照)。埋め込み対象から除外。
  if (relFromAssets.startsWith('ref/')) return true;
  if (path.basename(relFromAssets) === 'ref_design.png') return true;
  return false;
}

function buildAssetMap() {
  const files = [];
  walk(ASSETS_DIR, files);
  const map = {};
  let skipped = 0;
  for (const abs of files) {
    const relFromAssets = path.relative(ASSETS_DIR, abs).split(path.sep).join('/');
    if (isExcluded(relFromAssets)) { skipped++; continue; }
    const ext = path.extname(abs).toLowerCase();
    const mime = MIME_BY_EXT[ext];
    if (!mime) { skipped++; continue; } // 画像以外の混入ファイルは無視
    // prototype/*.html から見た参照パス形式('../assets/...')に合わせてキー化
    const srcKey = '../assets/' + relFromAssets;
    const b64 = readFileSync(abs).toString('base64');
    map[srcKey] = `data:${mime};base64,${b64}`;
  }
  return { map, skipped };
}

function main() {
  const html = readFileSync(SRC_HTML, 'utf8');
  const { map: assetMap, skipped } = buildAssetMap();
  const count = Object.keys(assetMap).length;

  const anchor = 'const ASSETS={};';
  if (!html.includes(anchor)) {
    throw new Error(`アンカー行が見つかりません: ${JSON.stringify(anchor)} (prototype側のASSETS定義が変更された可能性があります)`);
  }
  const mapLiteral = `const __ASSET_MAP__=${JSON.stringify(assetMap)};\n`;
  let out = html.replace(anchor, mapLiteral + anchor);

  const srcLine = '  img.src=src;';
  if (!out.includes(srcLine)) {
    throw new Error(`アンカー行が見つかりません: ${JSON.stringify(srcLine)} (loadImg()の実装が変更された可能性があります)`);
  }
  out = out.replace(
    srcLine,
    '  img.src=Object.prototype.hasOwnProperty.call(__ASSET_MAP__,src)?__ASSET_MAP__[src]:src;'
  );

  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT_HTML, out, 'utf8');
  const sizeMB = (Buffer.byteLength(out, 'utf8') / 1024 / 1024).toFixed(2);
  console.log(`dist/mamoken_mobile.html を生成しました (埋め込み画像: ${count}点 / 除外: ${skipped}件 / サイズ: ${sizeMB}MB)`);
}

main();
