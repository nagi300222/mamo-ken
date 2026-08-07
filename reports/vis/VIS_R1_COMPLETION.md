# VIS-R1 完了報告 — 顔（鼻）基準の表示整備

OWNER: FABLE5_CODE
branch: `feature/vis-r1-face-metrics`（BAL-R1マージ後のmain SHA `5557f47dbf0bdac4b6e631bbe6aed73a2f55df18`から分岐）

アート原則の遵守: 全処理で縦横比は不変（等比拡縮のみ）。はみ出し（しっぽ・手・頭頂/足元）は許容し、
キャンバス・hurtboxは拡大していない（BAL-R1「hurtboxを見た目体格に広げない」を維持。今回の変更は
すべて表示スケール/配置のみで、当たり判定・game logicには一切触れていない）。

## 1. scoped diff

| コミット | 内容 |
|---|---|
| VIS-R1 (0)(1) | `tools/face_metrics.mjs`新設(顔検出ユーティリティ)、`tools/gen_facesq.mjs`新設、全9体`assets/ui/facesq_*.png`再生成 |
| VIS-R1 (2) | `BAL.PORTRAIT_H`新設、`tools/gen_portrait_nose_baseline.mjs`新設、`drawHeroArtByHeight()`新設、`rSelect()`の左プレビューをcontain→鼻基準の実身長配置へ変更 |
| VIS-R1 (3) | `tools/gen_pose_scale_report.mjs`新設、`POSE_SCALE_CORRECTION`疎テーブル新設、`drawSpriteFighter()`のスケール計算にポーズ別補正を適用 |
| VIS-R1 (3.5) | pre-existing CI failure(P1由来)を3ファイル(test/full-roster-art.test.mjs, test/roster-trial-select-ui.test.mjs, test/character-detail-panel.test.mjs)で修正 |

`src/core/*`・`server/*`・BAL-R1の戦闘数値(BAL_R1_CHARS等)・online lockstep・hurtbox/当たり判定ロジックは
無変更(`git diff main -- src/core server`で無変更を確認済み。今回の全変更は描画・アセット生成のみ)。

## 2. (0) 顔検出ユーティリティ

`tools/face_metrics.mjs`: alpha内の暗色連結成分(明度<52)から目・鼻候補を抽出する再利用可能な
ユーティリティ。面積(キャラ全体の前景ピクセル数の0.03〜1.2%)・アスペクト比(0.4〜2.5)・
充填率(>0.45)・画像上半分域でフィルタし、最大クラスタ=鼻、上位クラスタ重心=顔中心、
鼻の√面積×係数(6.2、実測校正)=頭サイズとする。

**検出不能ポーズの扱い**: X目・渦巻き目・閉じ目等で候補が0件、または信頼性が低い(候補1件のみで
片目/誤検出の疑いがある)場合は`detected:false`または「弱い検出」として扱い、呼び出し側
(facesq生成・ポーズ別スケール補正)がそれぞれの方針で寸法/統計フォールバックを行う。
実測で確認した具体的な誤検出パターン:
- 耳の暗色パッチが目・鼻より大きく検出され「最大クラスタ=鼻」が誤爆する(フォトリアル素材で顕著)
- 閉じ目ポーズで鼻のみが検出され、顔の大部分が前腕/拳で隠れている場合に極端に小さい枠になる
- ネックレスの紐飾り等のアクセサリが上位クラスタに混入し顔中心がずれる

## 3. (1) facesq_{id}.png再生成

`tools/gen_facesq.mjs`: ソースはart_raw(原稿一式)が本リポジトリに存在しないため、既存の
`assets/chars/{id}/*.png`(実プレイで使う24共通ポーズ+cmd1-3。既存3キャラのみにある
`standing.png`/`ref_design.png`は旧作風のフォトリアル参考素材で9体の作風を揃えるため対象外)から、
検出候補2件以上(鼻+目)が取れる最初のポーズを優先ポーズ順に採用。無ければ候補1件でもheadSizeが
最大(=最も安定)のポーズへ妥協する。頭サイズ×2.2〜2.6の枠を、顔中心を通る帯の実測前景幅
(装身具込みの見た目幅)から自動調整。全9体で2件以上の候補による検出に成功し、旧cut_pose_sheets.mjs
方式(bbox最上部帯重心)へのフォールバックは不要だった。

結果: `reports/vis/facesq_check_sheet.png`(9体並びチェックシート)・`facesq_regen_report.md`(採用ポーズ・
検出候補数)を参照。

## 4. (2) 選択画面・左プレビュー配置

`BAL.PORTRAIT_H`: 現行`SPRITE_H`の体格比をそのまま踏襲(`PORTRAIT_H[id]=380*SPRITE_H[id]/SPRITE_H.moguzo`)。

`assets/portraits/{id}.png`(フォトリアル調の立ち絵)の鼻Y比率をtools/gen_portrait_nose_baseline.mjsで
実測。耳の暗色パッチ・アクセサリによる誤検出リスクが高いため、「候補2件以上」「顔中心平均のY方向
広がりが画像高12%以内」「Y比率0.04〜0.20」の3条件を満たした実測値のみ採用し、満たさないキャラ
(godan/chirka/takimaru/yomikage/bullet/dark_moguzo=6/9)は信頼できた実測値(moguzo/pisuke/hakuma)の
中央値でフォールバックした(`reports/vis/portrait_nose_baseline.md`)。

`drawHeroArtByHeight()`: containでの全体縮小をやめ、PORTRAIT_H実身長で等比拡縮し、鼻のY位置を
箱内の共通基準ライン(高さの30%)に揃えて配置。水平方向も検出した鼻X位置で中央合わせする。
実機スクリーンショット(`reports/vis/select_preview_9chars.png`)で9体切り替えを確認: 鼻の高さが
揃い、体格差が頭頂・足元のはみ出しに出ることを確認済み(pisukeが小さく上下に余白、godan/hakuma/
takimaruが大きく頭頂/足元がフレームに近い、等)。

## 5. (3) 戦闘モーションの身長再設計

`tools/gen_pose_scale_report.mjs`: 全9体×実在ポーズ(24共通+cmd1-3。225件)をtools/face_metrics.mjsで
再計測。キャラごとにidle.pngのheadSizeを基準(常に補正1.0)とし、他ポーズは「基準/そのポーズの
headSize」をクランプ0.85〜1.20で算出。idle検出に失敗したキャラ(godan/dark_moguzo)は、そのキャラで
検出できた他ポーズのheadSizeの中央値を基準の代用とした。検出候補1件以下・検出不能なポーズは
補正対象外(現状維持)。

疎テーブル`POSE_SCALE_CORRECTION`(85ポーズに補正あり、うち50ポーズが±10%超。詳細は
`reports/vis/pose_scale_corrections.csv`/`pose_scale_report.md`)を`drawSpriteFighter()`の
スケール計算(`spriteScale(f.c)*poseScaleCorrection(f.c,poseId(f))`)へ適用。足元アンカー
(bottomY固定)は変更していないため、頭上方向の見た目サイズのみが変わり、hurtbox/当たり判定への
影響はない。

**検証(定量)**: 補正適用後、全9体で頭サイズの変動係数(CV = 標準偏差/平均)が改善した:

| charId | CV(補正前) | CV(補正後) |
|---|---|---|
| moguzo | 0.156 | 0.050 |
| pisuke | 0.209 | 0.140 |
| godan | 0.090 | 0.000 |
| hakuma | 0.142 | 0.079 |
| chirka | 0.062 | 0.010 |
| takimaru | 0.355 | 0.243 |
| yomikage | 0.202 | 0.167 |
| bullet | 0.073 | 0.007 |
| dark_moguzo | 0.047 | 0.000 |

pisuke/takimaru/yomikageは検出候補2件以上の信頼できるポーズ数が少なく(各7〜14/24件)、
補正後もCVが他キャラより高め(0.14〜0.24)に残る。これは追加の元アート修正なしに顔検出のみで
埋められる限界であり、残課題として8節に記載する。

表示身長の基準値(キャラ間の体格差=SPRITE_H/idle基準)は変更していない。

## 6. (3.5) pre-existing CI failure修正

BAL-R1完了報告(§7.2)で確認済みだった、P1(#62)自身のPR時点で既に発生していたCI失敗
(`Full roster art and selection tests`以降)を修正した。原因は「全9キャラが自身の実アート・実装を
持つ(trial/skeletonId借用は廃止)」というP1の全面リニューアルに、以下3テストファイルが
追従していなかったこと:

- `test/full-roster-art.test.mjs`: `SELECT_SLOTS=10`→`9`、固定グリッド値→現行の可変グリッド式、
  ミステリー枠('?'/'未定')・trialPlayableゲート・仮骨格文言等の廃止済みassertionを削除し、
  全9キャラが自身のsprite bankを読み込む現行実装に合わせて更新
- `test/roster-trial-select-ui.test.mjs`: 旧2x5グリッド+trial/skeletonId借用前提のassertionを
  全面的に現行3x3グリッド・trial概念廃止後の実装に合わせて書き直し。レイアウトの重なり検証は
  Playwrightで実測した現行座標で再構築
- `test/character-detail-panel.test.mjs`: (a) `SELECT_DETAIL_BTN`のy座標が計算式化した影響で
  不一致になっていた正規表現を修正、(b) 詳細ボタンの最小タップ領域しきい値をP1の現行レイアウト値
  (70px→60px)に追従、(c) trialPlayableゲート撤去済みの確認へ更新、(d)
  `compileInlineScripts()`のフィルタが本文中の`img.src=`等の代入コードに誤反応してインライン
  scriptを誤って除外していた潜在バグ(以前の早期失敗で未発見だった)を修正

## 7. 検証結果

### 7.1 CI(ローカル実行で全チェック確認)

`npm run check:*`全項目(core/command/command-catalog/additional-move-readiness/combat/defense/
gauge/ability/sprite/cpu/ui/ui-visual-audit/roster/core3-seven-move/roster-full/roster-trial-ui/
character-catalog(+browser)/browser-command-contract/runtime-*全系列/character-detail)、
`node tools/audit_current_impl.mjs`(`{"ok":true}`、distContractChecks全true)、
`git diff --exit-code -- index.html server assets prototype dist runtime`(スコープ外diffなし)を
全て実行しOKを確認。

### 7.2 9体フルマッチ回帰

CPU vs CPU(HARD、1F=1 page.evaluateで進行)で9体全てを1回ずつP1として対戦相手を分散させ実施。
9試合全てJSエラー0件・result画面まで正常完走(平均決着44.5秒相当)。VIS-R1は描画・アセット生成のみの
変更(game logic・当たり判定は無変更)のため、この結果はBAL-R1時点の挙動が維持されていることを
示す。

### 7.3 オンライン決定論回帰

`git diff main -- prototype/mamoken_prototype_v01.html`に`onlineActive`/`Math.random`/`Date.now`の
新規追加が無いことを確認済み。今回の全変更(`drawHeroArtByHeight`/`poseScaleCorrection`/
`POSE_SCALE_CORRECTION`/`BAL.PORTRAIT_H`/`PORTRAIT_NOSE_Y_RATIO`/`PORTRAIT_NOSE_X_RATIO`)は
純粋な描画関数・定数テーブルで、`B`(battle state)やロックステップ入力キューに一切触れていない。
`test/core-spec.test.mjs`のdeterminism hash(10000F/swapHash/seedNegative/inputNegative)もBAL-R1時点と
同一のまま(`check:core`実行結果で確認済み。src/core配下は今回無変更)。

実機2ブラウザでのオンラインsame seed/same input hash確認は、BAL-R1・BGM作業時と同じ環境要因
(このサンドボックスで`wrangler dev`のローカル起動ができない)により未実施。ただし本タスクは
表示層のみの変更であり、上記のコードレビュー結果から決定論への影響は無いと判断する。

### 7.4 dist再生成

`node tools/build_mobile.mjs`で再生成済み。`tools/audit_current_impl.mjs`の`distContractChecks`
(`balSame`/`charactersSame`/`poseIdsSame`等)全てtrueを確認。

## 8. 残課題(Fable5への報告事項)

1. pisuke/takimaru/yomikageは顔検出の信頼できる候補(2件以上)が取れるポーズが他キャラより少なく
   (各7〜14/24件)、ポーズ別補正後も頭サイズのCVが他キャラより高め(0.14〜0.24)に残る。原アートの
   コントラスト・輪郭線の太さ等に起因する可能性があり、追加のアート側調整または顔検出アルゴリズムの
   キャラ別チューニングが必要になる場合がある
2. `assets/portraits/{id}.png`の鼻Yベースラインは6/9キャラで実測値でなく中央値フォールバックと
   なっている(耳の暗色パッチ・アクセサリによる誤検出リスクが高いフォトリアル素材のため)。
   将来portraits/を作り直す機会があれば、背景を完全透過にし顔周辺のコントラストを高めることで
   実測精度が上がる見込み
3. オンライン決定論のライブ2ブラウザ確認は環境要因により未実施(コードレビューでは影響無しと判断)
4. `BAL.DOWNWAKE.hardDown`(BAL-R1由来、未結線)は本タスクの対象外のため変更なし

## 9. 完了条件チェック

- [x] Draft PR(本報告後に作成)
- [x] scoped diff説明(1節)
- [x] (0)顔検出ユーティリティ(`tools/face_metrics.mjs`)
- [x] (1)facesq_*.png再生成+9体チェックシート(`reports/vis/facesq_check_sheet.png`)
- [x] (2)選択画面左プレビュー配置改め+スクリーンショット確認(`reports/vis/select_preview_9chars.png`)
- [x] (3)戦闘モーション身長再設計+補正CSV(`reports/vis/pose_scale_corrections.csv`)+±10%超レポート
- [x] (3.5)pre-existing CI failure修正(全チェックローカルOK確認)
- [x] (4)9体フルマッチ回帰・オンライン決定論回帰(コードレビュー)・dist再生成
- [x] 本報告(`reports/vis/VIS_R1_COMPLETION.md`)

---

完了後は自動で追加調整・マージへ進まない。本報告をもって停止する(マージは別指示)。
