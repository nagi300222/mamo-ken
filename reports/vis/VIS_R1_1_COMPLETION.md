# VIS-R1.1 完了報告 — 選択画面の仕上げ（実機スクショレビュー反映）

OWNER: FABLE5_CODE
branch: `feature/vis-r1-1-select-polish`（BGM-R1.2マージ後のmain SHA `4189da107095e9c7de483e80da2b3391383f896e`から分岐）

## 1. scoped diff

| ファイル | 内容 |
|---|---|
| `tools/facesq_manual_table.mjs`（新規） | 9体分の手動クロップテーブル(FACESQ_MANUAL_TABLE: cx/cy/r)。素材更新時も同じ切り出しを再現できるようtools側に定義 |
| `tools/gen_facesq.mjs` | ソースを`assets/chars/`(戦闘スプライト)から`assets/portraits/`へ変更。自動顔検出(`face_metrics.mjs`)を一次ソースから外し、手動テーブル未登録キャラのみのフォールバックに降格 |
| `assets/ui/facesq_*.png`(9点) | 手動テーブルで再生成(256px正方形) |
| `prototype/mamoken_prototype_v01.html` | `PORTRAIT_NOSE_X_RATIO`/`PORTRAIT_NOSE_Y_RATIO`を手動テーブルの値に統一。`BAL.PORTRAIT_SCALE`(0.82)・`BAL.PORTRAIT_OFFSET_X`(初期値全員0)新設。`drawHeroArtByHeight()`に鼻Xの基準線(52%)・スケール係数・オフセットを適用。`rSelect()`の`NOSE_BASE_Y_RATIO`を0.30→0.26(基準ラインをやや上へ)。左プレビューのclip処理に素の矩形clipを追加(防御的対策) |
| `reports/vis/facesq_check_sheet.png`/`facesq_regen_report.md` | 再生成 |
| `reports/vis/select_preview_9char_check.png`（新規） | 9体分の左プレビュースクリーンショット(本タスクの検収用) |

`src/core/*`・`server/*`・戦闘バランス(BAL-R1)・当たり判定・オンライン同期には触れていない
(`git diff HEAD -- src/core server`で無変更を確認済み。今回の変更は表示層・選択画面アセットのみ)。

## 2. (1) facesq_{id}.png 手動テーブル決め打ち化

自動顔検出(VIS-R1で導入)は、フィギュア調の`assets/portraits/`素材で拳・爪の暗色を鼻と誤検出する
ケースがあり、9体すべてで安定したクロップが作れなかった。発注者が実機スクリーンショットで検収した
鼻位置・クロップ半径(`FACESQ_MANUAL_TABLE`、中心x比・中心y比・半径/高さ比)を`tools/facesq_manual_table.mjs`
に固定値として保持し、`tools/gen_facesq.mjs`はこれを一次ソースとしてクロップする
(自動検出は将来テーブル未登録キャラが増えた場合のみのフォールバックに降格)。

再生成した9体のチェックシート: `reports/vis/facesq_check_sheet.png`(添付)。全員鼻を中心に顔全体が
入った正方形アイコンになっていることを目視確認済み。

## 3. (2) 左プレビューの配置とスケール調整

- **鼻座標の一本化**: `FACESQ_MANUAL_TABLE`の(cx,cy)は発注者検収済みの鼻位置のため、選択画面
  左プレビューの`PORTRAIT_NOSE_X_RATIO`/`PORTRAIT_NOSE_Y_RATIO`もこの値に統一した(旧VIS-R1の
  自動検出実測値から差し替え)。`tools/face_metrics.mjs`の自動検出はプレビュー配置では使用しない。
- **縦**: `NOSE_BASE_Y_RATIO`を0.30→0.26に変更し、基準ラインをやや上へ移動した。
- **横**: 新設の`PORTRAIT_NOSE_X_BASE_RATIO`(=0.52)を`drawHeroArtByHeight()`に適用し、鼻Xを
  箱幅の52%の基準線に揃えるよう変更(旧仕様は中央50%固定)。微調整用に`BAL.PORTRAIT_OFFSET_X`
  (px単位、初期値は全員0)を新設し、キャラ毎の個別調整を後から1行で追加できるようにした。
- **スケール**: `BAL.PORTRAIT_SCALE`(=0.82)を新設し、`BAL.PORTRAIT_H`はそのまま維持して表示直前に
  この係数を掛ける形で全体を約0.82倍に縮小した。

9体を切り替えたスクリーンショット(`reports/vis/select_preview_9char_check.png`、添付)で確認:
- 最大キャラ(ゴダン/タキマル)は胸〜腰上まで(頭頂・拳のはみ出しあり)、目標レンジに合致
- 最小キャラ(ピスケ)は全身+足元余白が確保され、目標レンジに合致
- 9体とも鼻の高さがほぼ一定で、体格差が頭頂・足元のはみ出しに出ている(containによる縮小はしていない)
- バレットは元々右寄りの構図だったが、鼻X=52%基準の採用により枠内に収まりやすくなった
  (しっぽ等の後方はみ出しは許容範囲内)

キャラ切替時のクロスフェード(220ms)も9体全パターンで確認し、途中フレームでも見た目の破綻は
なかった(`montage_fade_v2`相当のスクリーンショットで確認)。

## 4. (3) ゴダン選択時の白い縦アーティファクト調査

**調査内容**: Playwrightで9体すべての静止状態・クロスフェード中間フレーム・繰り返し切替を
スクリーンショット(prototype/dist双方)で確認し、また`assets/portraits/godan.png`本体・
dist埋め込みWebP(quality 80)双方のアルファチャンネルを画素レベルで検査したが、
ヘッドレスChromiumでは報告された白い縦のアーティファクトを再現できなかった。

**推定原因と対策**: ユーザー提示の仮説(「プレビューのクロスフェード残骸」「描画はみ出し」)のうち
描画はみ出し方向で対策を実施した。旧仕様(鼻X=中央50%固定・スケール無調整)ではゴダンのような
大柄キャラの立ち絵が箱の外側へ大きくはみ出す配置になっており、角丸クリップ(`rr()`+`ctx.clip()`)
のみに依存していた。本タスクの(2)で導入した0.82倍スケール・52%基準線への変更により、はみ出し量
そのものが全キャラで縮小されている。加えて、角丸パスのクリップに素の矩形クリップを重ねる
防御的対策を追加した(`ctx.clip()`は複数回呼ぶと交差されるため安全に重ねられる)。これにより、
角丸パスの取り扱いに起因する何らかのレンダラー差異があっても矩形境界外への描画を確実に防ぐ。

**発注者確認事項**: 実iPhone(Safari)での実機確認はこのサンドボックス環境では行えない。上記対策後、
発注者の実機で当該アーティファクトが解消しているかご確認いただきたい。再現する場合は、発生時の
画面遷移手順(どのキャラから切り替えたか、タップの間隔等)を添えてご連絡いただけると、再現条件の
特定に役立ちます。

## 5. 検証

- ローカルCI相当チェック(`npm run check:*`全項目 + audit + build:mobile + dist再現性 + スコープ外差分なし):
  **ALL GREEN**
- Playwright: 9体それぞれについてselect→characterDetail→select、および1体(ゴダン)でselect→battle→
  pause→battle→result→selectの画面遷移を実行し、prototype/dist双方でJSエラー0件を確認
- `test/roster-trial-select-ui.test.mjs`(既存)が`drawHeroArtByHeight(`/`facesq_`の利用を検証しており、
  今回のCIでも green
- dist再生成済み(`node tools/build_mobile.mjs`)

## 6. まとめ

facesq_{id}.png選択アイコンを自動顔検出から発注者検収済みの手動クロップテーブルへ切り替え、
左プレビューの配置(鼻X 52%基準線・鼻Y基準ラインをやや上へ)とスケール(0.82倍)を実測に基づいて
調整した。ゴダンの白い縦アーティファクトはヘッドレスChromiumでは再現できなかったが、描画はみ出し
方向の対策(スケール縮小+矩形クリップの追加)を実施した。実機での解消確認は発注者確認事項として残る。
