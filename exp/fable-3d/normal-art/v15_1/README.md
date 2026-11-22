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

## 相互レビュー記録（制作側 → Codex 統合候補）
対象：`feat/mamoken-v151-reviewed-integration` @ `cbd1da1`（PR #197 系 `33f73a2` ＋ 本ブランチ `99c6c7d`）。

**確認できたこと**
- `normalMove` は `NORMAL_CONTACTS[id][slot].reach / activeReach` を、`normalClipTime` は同じ `contact / contactEnd` を読む。制作データ3ファイル（motifs / builder / contacts）は本ブランチと差分なし。
- 前方向と原点の解釈が一致（root からの前方距離、hurt radius 0.16 は判定側で加算、`(t.x-a.x)*a.facing<0` で背後ヒットなし）。
- `normalReachAt` の phase（発生F=0 → 持続最終F=1）は、`normalClipTime` が同じ区間を `contact → contactEnd` に写す定義と一致。
- 制作側の独立実測（`tools/measure_normals.mjs` を PR197 `f71b812` ＋ 本ブランチの結合ツリーで実行、結果は `tools/check_integration.py` で照合）：
  発生フレームの打撃部位の実測前方距離が契約 reach と一致し、前方到達のピークも発生フレームに来る。結果は `evidence/INTEGRATION_CHECK.txt`。

**残る懸念（数値は Codex 判断）**
1. 縦方向は root 同士の高さ差（`|a.y-t.y|<.58`）だけで、`NORMAL_CONTACTS.height`（打点の高さ）は未使用。床すれすれの技（バレット屈強 0.01m、足払い系）が跳んでいる相手に当たり得る／高い打点がしゃがみに当たり得る。必要なら `height` を使ってほしい。
2. 実測に合わせた結果、蹴り技のリーチは手技より短い（ピスケ立強 0.34 < 立弱 0.38、空強 0.33、ダークモグゾー空強 0.27、モグゾー空強 0.30）。脚が短い体型の実寸どおりで透明リーチは無いが、「強なのに弱より届かない」組み合わせが出る。演技側で踏み込み（骨盤移動）を足して実寸を伸ばす余地はあるので、必要なら制作側で対応する。
3. バレットの尾（0.55〜0.66）とタキマルの手（0.54〜0.62）は旧判定より長い。見た目どおりなので判定は正しいが、発生・硬直側でリスクを付ける前提。
4. PR195 から角度を変えていない24技のうち、屈強の数技（モグゾー `groundPound`、ゴダン `doubleGroundPound` など）は頭が拳とほぼ同じ前方位置にある（差 1cm 未満）。契約上は ok だが、接触の読みやすさは次の仕上げ候補。
5. 空中技は跳躍頂点から出すと高さ条件で当たりが遅れる／当たらない（制作側試験の条件によるもの。契約の不一致ではない）。
