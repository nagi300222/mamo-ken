#!/usr/bin/env node
// マモ拳（仮） モバイル配布ビルドスクリプト
//
// prototype/mamoken_prototype_v01.html が読み込む assets/ 配下の画像を全て
// 縮小＋WebP変換(quality 80)した上でbase64のdata URLとして埋め込み、単一
// ファイル dist/mamoken_mobile.html を生成する。
//
// 事前準備(初回のみ): npm install  ※sharpをdevDependencyとして使用
// 再生成手順:
//   node tools/build_mobile.mjs
//
// 生成物(dist/mamoken_mobile.html)はfile://で直接開いても全画像・全機能が
// 動作する配布物としてリポジトリにコミットする。assets/追加・変更のたびに
// このスクリプトを再実行し、dist/の再生成もあわせてコミットすること。
// node_modules/はコミットしない(sharpはビルド時のみ使用する開発依存)。
//
// 仕組み: prototype側のloadImg()の呼び出し方(リテラル/文字列結合どちらも)を
// 個別に解析するのではなく、assets/配下の画像を全て「相対パス文字列→data URL」
// のマップにして埋め込み、loadImg()内のimg.src=src;を「マップに該当キーが
// あればdata URLを、無ければ元のsrcをそのまま使う」に1行だけ差し替える。
// こうすることでポーズ/キャラ追加などプロトタイプ側の変更に追従するための
// メンテナンスが不要になる。assets/ref/ と ref_design.png はコード上どこからも
// 読み込まれないアート参考用ファイルのため埋め込み対象から除外する。
// runtime/runtime-command-shadow-browser.js はprototypeでは外部scriptとして読み込み、
// 配布版では単一HTMLを維持するため同じビルド内でinline化する。
//
// 縮小方針(カテゴリはassets/直下のサブディレクトリ名で判定): chars=高さ400px /
// portraits=高さ520px / cutin=幅1280px / bg=高さ1200px / ui・その他=原寸維持。
// いずれもWebP quality 80へ再エンコードする(元がPNGでも出力は常にimage/webp)。

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC_HTML = path.join(ROOT, 'prototype', 'mamoken_prototype_v01.html');
const ASSETS_DIR = path.join(ROOT, 'assets');
const OUT_DIR = path.join(ROOT, 'dist');
const OUT_HTML = path.join(OUT_DIR, 'mamoken_mobile.html');
const RUNTIME_SHADOW_JS = path.join(ROOT, 'runtime', 'runtime-command-shadow-browser.js');
const RUNTIME_SHADOW_TAG = '<script src="../runtime/runtime-command-shadow-browser.js"></script>';
const CHARACTER_CATALOG_BROWSER_JS = path.join(ROOT, 'runtime', 'character-catalog-browser.js');
const CHARACTER_CATALOG_BROWSER_TAG = '<script src="../runtime/character-catalog-browser.js"></script>';
const RUNTIME_EXTENDED_SHADOW_JS = path.join(ROOT, 'runtime', 'runtime-extended-command-shadow-browser.js');
const RUNTIME_EXTENDED_SHADOW_TAG = '<script src="../runtime/runtime-extended-command-shadow-browser.js"></script>';

const IMG_EXT = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp']);
const WEBP_QUALITY = 80;

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

function resizeConfigFor(relFromAssets) {
  const top = relFromAssets.split('/')[0];
  if (top === 'chars') return { height: 400 };
  if (top === 'portraits') return { height: 520 };
  if (top === 'roster3d') return { height: 256 };
  if (top === 'cutin') return { width: 1280 };
  if (top === 'bg') return { height: 1200 };
  return null; // ui / fx / その他: 原寸維持
}

async function toWebp(absPath, relFromAssets) {
  let img = sharp(absPath);
  const resize = resizeConfigFor(relFromAssets);
  if (resize) img = img.resize({ ...resize, withoutEnlargement: true });
  return img.webp({ quality: WEBP_QUALITY }).toBuffer();
}

async function buildAssetMap() {
  const files = [];
  walk(ASSETS_DIR, files);
  const map = {};
  let skipped = 0, origTotal = 0, outTotal = 0;
  for (const abs of files) {
    const relFromAssets = path.relative(ASSETS_DIR, abs).split(path.sep).join('/');
    if (isExcluded(relFromAssets)) { skipped++; continue; }
    const ext = path.extname(abs).toLowerCase();
    if (!IMG_EXT.has(ext)) { skipped++; continue; } // 画像以外の混入ファイルは無視
    const origBuf = readFileSync(abs);
    const outBuf = await toWebp(abs, relFromAssets);
    origTotal += origBuf.length; outTotal += outBuf.length;
    // prototype/*.html から見た参照パス形式('../assets/...')に合わせてキー化
    const srcKey = '../assets/' + relFromAssets;
    map[srcKey] = `data:image/webp;base64,${outBuf.toString('base64')}`;
  }
  return { map, skipped, origTotal, outTotal };
}

async function main() {
  const html = readFileSync(SRC_HTML, 'utf8');
  const runtimeShadowSource = readFileSync(RUNTIME_SHADOW_JS, 'utf8');
  const characterCatalogBrowserSource = readFileSync(CHARACTER_CATALOG_BROWSER_JS, 'utf8');
  const runtimeExtendedShadowSource = readFileSync(RUNTIME_EXTENDED_SHADOW_JS, 'utf8');
  const { map: assetMap, skipped, origTotal, outTotal } = await buildAssetMap();
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

  if (!out.includes(CHARACTER_CATALOG_BROWSER_TAG)) {
    throw new Error(`アンカー行が見つかりません: ${JSON.stringify(CHARACTER_CATALOG_BROWSER_TAG)} (character catalog browser bridgeが未適用の可能性があります)`);
  }
  out = out.replace(CHARACTER_CATALOG_BROWSER_TAG, `<script>\n${characterCatalogBrowserSource}\n</script>`);

  if (!out.includes(RUNTIME_EXTENDED_SHADOW_TAG)) {
    throw new Error(`アンカー行が見つかりません: ${JSON.stringify(RUNTIME_EXTENDED_SHADOW_TAG)} (extended command shadow hookが未適用の可能性があります)`);
  }
  out = out.replace(RUNTIME_EXTENDED_SHADOW_TAG, `<script>\n${runtimeExtendedShadowSource}\n</script>`);

  if (!out.includes(RUNTIME_SHADOW_TAG)) {
    throw new Error(`アンカー行が見つかりません: ${JSON.stringify(RUNTIME_SHADOW_TAG)} (runtime shadow hookが未適用の可能性があります)`);
  }
  out = out.replace(RUNTIME_SHADOW_TAG, `<script>\n${runtimeShadowSource}\n</script>`);

  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT_HTML, out, 'utf8');
  const sizeMB = (Buffer.byteLength(out, 'utf8') / 1024 / 1024).toFixed(2);
  const origMB = (origTotal / 1024 / 1024).toFixed(1);
  const webpMB = (outTotal / 1024 / 1024).toFixed(1);
  console.log(`dist/mamoken_mobile.html を生成しました (埋め込み画像: ${count}点 / 除外: ${skipped}件)`);
  console.log(`画像合計: ${origMB}MB → WebP変換後 ${webpMB}MB / 出力ファイルサイズ: ${sizeMB}MB`);
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
