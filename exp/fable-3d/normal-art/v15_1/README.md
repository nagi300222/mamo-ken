# マモ拳 v15.1｜54通常技の演技・接触姿勢の仕上げ（Claude 制作レーン）

PR #195（`b92717c`、実機好評版）を採用ベースにした**差分仕上げ**。作り直しではない。元9GLB・既存奥義・横持ち・プラクティスには触れない。

## 何を直したか
実ゲームのページ上でスキン後の頂点を実測したところ、54技中30技で「狙った部位が先頭に来ていない」ことが分かった
（元クリップの左ジャブや右足払いが勝ってしまう／尾が体の後ろのまま、など）。その30技だけ、局所回転・重心・contact時刻を直した。
残り24技の角度データは PR195 のまま（`thigh_fix.*` が腿の半分だけ追従するようにした点だけ全技共通で、腿を動かす技の股関節の潰れを防ぐ）。

## 編集正本と再生成
| 役割 | ファイル |
|---|---|
| 修正指定（接触時に先端をどこへ置くか・どの肢の元の動きを止めるか） | `source/fixes_v151.mjs` |
| 指定 → 局所回転を元リグの FK で解いて書き戻す | `tools/solve_fixes.mjs --write` → `dojo/normal-motifs-v15.js` |
| 54クリップのビルド（PR195 のビルダーに `$mute` / `$move` / thigh_fix 追従を追加。既定データでは従来と同じ規則） | `dojo/normal-clip-builder-v15.mjs`, `dojo/pack-normals-v15.mjs` |
| 実測（クリップ正規化時刻ごとの部位別前方到達） | `tools/sample_clips.mjs` → `audit/<版>/<id>_curves.json` |
| 接触メタデータ生成 | `tools/build_contacts.mjs` → `audit/<版>/normal_contacts.json`, `dojo/normal-contacts-v151.js` |
| 実ゲームでの発生〜硬直の毎フレーム実測とヒット撮影 | `tools/measure_normals.mjs` |
| 対戦カメラでの接触姿勢の静止撮影 | `tools/pose_shots.mjs` |

```bash
node exp/fable-3d/normal-art/v15_1/tools/solve_fixes.mjs --write      # 指定 → GESTURES/MOTIFS
node exp/fable-3d/dojo/pack-normals-v15.mjs                           # 9パック再生成
node exp/fable-3d/normal-art/v15_1/tools/sample_clips.mjs --out exp/fable-3d/normal-art/v15_1/audit/v151
node exp/fable-3d/normal-art/v15_1/tools/build_contacts.mjs --dir exp/fable-3d/normal-art/v15_1/audit/v151 --js exp/fable-3d/dojo/normal-contacts-v151.js
```
計測ツールは Playwright + Chromium が必要。`npm --prefix exp/fable-3d/dojo run build:pages`（または `pack-showtime.mjs` と `pack-normals-v15.mjs`）で生成物を揃えてから実行する。

## NORMAL_CONTACTS の定義（Codex との同期契約）
- **前方向** = 元モデルの +Z（ゲームでは facing 方向）。距離はすべて**攻撃側 root（足元の x）から**測る。
- `contact` / `contactEnd` = **クリップ正規化時刻 0..1**。`contact` は打撃部位の前方到達がピークになる時刻。
  `contactEnd` はピークから 2cm 以内を保っている最後の時刻を、`contact+.06 〜 contact+.12` に収めた値。
- `reach` = `contact` の時点で、打撃部位の**スキン後メッシュ表面の最前頂点**までの前方距離 [m]。相手の hurt radius 0.16m は含まない（判定側で加算）。
- `activeReach` = `contact`→`contactEnd` を `phase` 0→1 としたときの同じ量。3点（0 / .5 / 1）。
- `height` = その最前頂点の床からの高さ [m]（地上クリップで測った値。空中技は root の高さを足す）。
- `attackPart` = armL / armR / legL / legR / tail / head。`attackBone` は代表ボーン名。`bothHands` は両手技。
- `status:'fix'` と `issues` は、まだ見た目の不一致が残っている技の印（値は現状の実測）。

## 監査結果
- `audit/v15/` = PR195 そのまま（before）の実測。`audit/v151/` = 修正後（after）。
- `curve_summary.json` に、技ごとの意図部位・ピーク時刻・前方距離・実際に最前だった部位を記録。
