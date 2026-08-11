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
//
// BGM(R1追加): assets/bgm/配下の.mp3は画像と同じ__ASSET_MAP__に、音質を変えない
// ため無変換・原本バイトのままdata:audio/mpeg;base64として埋め込む(prototype側の
// bgmAssetSrc()が同じマップを参照するため、埋め込み用の文字列差し替えは不要)。

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
const CURRENT_ART_MANIFEST_JS = path.join(ROOT, 'runtime', 'current-art-manifest-browser.js');
const CURRENT_ART_MANIFEST_TAG = '<script src="../runtime/current-art-manifest-browser.js"></script>';
const CURRENT_ART_RUNTIME_JS = path.join(ROOT, 'runtime', 'current-art-runtime-browser.js');
const CURRENT_ART_RUNTIME_TAG = '<script src="../runtime/current-art-runtime-browser.js"></script>';
const ABILITY_UI_MANIFEST_JS = path.join(ROOT, 'runtime', 'ability-ui-manifest-browser.js');
const ABILITY_UI_MANIFEST_TAG = '<script src="../runtime/ability-ui-manifest-browser.js"></script>';
// BGM(R2): 闘技場(昼)のWeb Audio実装がfile://下でのfetch/XHR不可を回避するために
// prototype専用で読み込むbase64ペイロード。distは同じ音源を__ASSET_MAP__のdata URLで
// 既に持っているため不要 → タグ自体を除去する(残すと単体配布時に404で壊れた参照になる)。
const ARENA_BGM_B64_TAG = '<script src="../runtime/bgm-b64.js"></script>'; // BGM-R1.2: 旧arena-bgm-b64.js→全曲統一のbgm-b64.js

const IMG_EXT = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp']);
const AUDIO_MIME = { '.mp3': 'audio/mpeg' }; // BGM(R1): 音質を変えないため再エンコードせず原本バイトのまま埋め込む
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
  // Current-art source delivery stays in GitHub, while dist embeds only derived alpha runtime
  // frames and the presentation cut-ins. This prevents opaque source sheets/archive/fallback
  // packages from being duplicated into the standalone HTML.
  if (relFromAssets.startsWith('art/current/')) return true;
  if (relFromAssets.startsWith('art/legacy_common24/')) return true;
  if (relFromAssets.startsWith('art/archive/')) return true;
  // vNext PR1: raw pose-override source deliveries (e.g. Godan's flinch replacement)
  // are build-time-only inputs to build_current_art.mjs -- the runtime only ever
  // loads the derived art/runtime/** output, same reasoning as art/current/ above.
  if (relFromAssets.startsWith('art/overrides/')) return true;
  // RUN-LOOP-R1(#113): delivered quadruped run-loop source (originals/sheets/frames + contact
  // sheet/report, see data/art/run_loop_source_manifest.json) is a build-time-only input to
  // tools/build_run_loop_art.mjs -- the runtime only ever loads the derived
  // art/runtime/<id>/run_loop/** output, same reasoning as art/current/ above.
  if (relFromAssets.startsWith('art/run_loop_source/')) return true;
  // STAGE-ART-IMPORT: bg/source/ holds the untouched original stage/minigame background
  // deliveries (see data/art/stage_source_manifest.json). The runtime only ever loads the
  // derived assets/bg/*.png siblings placed alongside stage_day.png, same reasoning as
  // art/current/ above -- source stays in GitHub, dist embeds only the derived copy.
  if (relFromAssets.startsWith('bg/source/')) return true;
  return false;
}

function resizeConfigFor(relFromAssets) {
  const top = relFromAssets.split('/')[0];
  if (top === 'chars') return { height: 400 };
  if (top === 'portraits') return { height: 520 };
  if (top === 'roster3d') return { height: 256 };
  if (top === 'cutin') return { width: 1280 };
  if (top === 'bg') return { height: 1200 };
  if (top === 'title') return { width: 720 };
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
  let skipped = 0, origTotal = 0, outTotal = 0, audioTotal = 0, audioCount = 0;
  for (const abs of files) {
    const relFromAssets = path.relative(ASSETS_DIR, abs).split(path.sep).join('/');
    if (isExcluded(relFromAssets)) { skipped++; continue; }
    const ext = path.extname(abs).toLowerCase();
    const srcKey = '../assets/' + relFromAssets; // prototype/*.html から見た参照パス形式に合わせてキー化
    if (AUDIO_MIME[ext]) { // BGM(R1): 縮小・再エンコードなしで原本バイトのままdata URL化
      const buf = readFileSync(abs);
      audioTotal += buf.length; audioCount++;
      map[srcKey] = `data:${AUDIO_MIME[ext]};base64,${buf.toString('base64')}`;
      continue;
    }
    if (!IMG_EXT.has(ext)) { skipped++; continue; } // 画像・音声以外の混入ファイルは無視
    const origBuf = readFileSync(abs);
    const outBuf = await toWebp(abs, relFromAssets);
    origTotal += origBuf.length; outTotal += outBuf.length;
    map[srcKey] = `data:image/webp;base64,${outBuf.toString('base64')}`;
  }
  return { map, skipped, origTotal, outTotal, audioTotal, audioCount };
}

async function main() {
  const html = readFileSync(SRC_HTML, 'utf8');
  const runtimeShadowSource = readFileSync(RUNTIME_SHADOW_JS, 'utf8');
  const characterCatalogBrowserSource = readFileSync(CHARACTER_CATALOG_BROWSER_JS, 'utf8');
  const runtimeExtendedShadowSource = readFileSync(RUNTIME_EXTENDED_SHADOW_JS, 'utf8');
  const currentArtManifestSource = readFileSync(CURRENT_ART_MANIFEST_JS, 'utf8');
  const currentArtRuntimeSource = readFileSync(CURRENT_ART_RUNTIME_JS, 'utf8');
  const abilityUiManifestSource = readFileSync(ABILITY_UI_MANIFEST_JS, 'utf8');
  const { map: assetMap, skipped, origTotal, outTotal, audioTotal, audioCount } = await buildAssetMap();
  const count = Object.keys(assetMap).length - audioCount; // 画像点数(BGMは別集計)

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

  if (!out.includes(ARENA_BGM_B64_TAG)) {
    throw new Error(`アンカー行が見つかりません: ${JSON.stringify(ARENA_BGM_B64_TAG)} (BGM base64読み込みタグが変更された可能性があります)`);
  }
  out = out.replace(ARENA_BGM_B64_TAG, ''); // distは__ASSET_MAP__に同じ音源のdata URLを持つため不要(タグ自体を除去)

  if (!out.includes(CHARACTER_CATALOG_BROWSER_TAG)) {
    throw new Error(`アンカー行が見つかりません: ${JSON.stringify(CHARACTER_CATALOG_BROWSER_TAG)} (character catalog browser bridgeが未適用の可能性があります)`);
  }
  out = out.replace(CHARACTER_CATALOG_BROWSER_TAG, `<script>\n${characterCatalogBrowserSource}\n</script>`);

  if (!out.includes(RUNTIME_EXTENDED_SHADOW_TAG)) {
    throw new Error(`アンカー行が見つかりません: ${JSON.stringify(RUNTIME_EXTENDED_SHADOW_TAG)} (extended command shadow hookが未適用の可能性があります)`);
  }
  out = out.replace(RUNTIME_EXTENDED_SHADOW_TAG, `<script>\n${runtimeExtendedShadowSource}\n</script>`);

  if (!out.includes(CURRENT_ART_MANIFEST_TAG)) {
    throw new Error(`アンカー行が見つかりません: ${JSON.stringify(CURRENT_ART_MANIFEST_TAG)} (current art manifestが未適用の可能性があります)`);
  }
  out = out.replace(CURRENT_ART_MANIFEST_TAG, `<script>\n${currentArtManifestSource}\n</script>`);

  if (!out.includes(CURRENT_ART_RUNTIME_TAG)) {
    throw new Error(`アンカー行が見つかりません: ${JSON.stringify(CURRENT_ART_RUNTIME_TAG)} (current art runtimeが未適用の可能性があります)`);
  }
  out = out.replace(CURRENT_ART_RUNTIME_TAG, `<script>\n${currentArtRuntimeSource}\n</script>`);

  if (!out.includes(ABILITY_UI_MANIFEST_TAG)) {
    throw new Error(`アンカー行が見つかりません: ${JSON.stringify(ABILITY_UI_MANIFEST_TAG)} (ability UI manifestが未適用の可能性があります)`);
  }
  out = out.replace(ABILITY_UI_MANIFEST_TAG, `<script>\n${abilityUiManifestSource}\n</script>`);

  if (!out.includes(RUNTIME_SHADOW_TAG)) {
    throw new Error(`アンカー行が見つかりません: ${JSON.stringify(RUNTIME_SHADOW_TAG)} (runtime shadow hookが未適用の可能性があります)`);
  }
  out = out.replace(RUNTIME_SHADOW_TAG, `<script>\n${runtimeShadowSource}\n</script>`);

  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT_HTML, out, 'utf8');
  const sizeMB = (Buffer.byteLength(out, 'utf8') / 1024 / 1024).toFixed(2);
  const origMB = (origTotal / 1024 / 1024).toFixed(1);
  const webpMB = (outTotal / 1024 / 1024).toFixed(1);
  const audioMB = (audioTotal / 1024 / 1024).toFixed(1);
  console.log(`dist/mamoken_mobile.html を生成しました (埋め込み画像: ${count}点 / 埋め込みBGM: ${audioCount}点 / 除外: ${skipped}件)`);
  console.log(`画像合計: ${origMB}MB → WebP変換後 ${webpMB}MB / BGM合計(無変換): ${audioMB}MB / 出力ファイルサイズ: ${sizeMB}MB`);
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
