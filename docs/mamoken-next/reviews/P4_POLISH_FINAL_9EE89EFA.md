# マモ拳 P0〜P4改善版 — 独立UI/UX再評価

評価日：2026-11-23（Asia/Tokyo）。対象：[Draft PR #225](https://github.com/nagi300222/mamo-ken/pull/225)、実装固定SHA `9ee89efafa76cb3ad80fbff46c7f56a1261baa48`。プレビュー：[19b355a1](https://19b355a1.mamoken-3d.pages.dev/)。比較基準は [PR #222](https://github.com/nagi300222/mamo-ken/pull/222)、SHA `1391c49493eca193c3a49a22140e5b1c3d2c6417`。評価者は独立レビュー担当で、対象UI・素材・ゲーム実装を制作・変更していない。

## 判定

**6軸 81.25/100、G2はFAIL（85点条件未達）。基準56.25から25点改善。** 短画面で隠れたモード、6ボタン内の文字重複、保存CTA、安全領域での開始欠け、資源を覆う説明帯というHIGHを解消し、まとまった試遊に渡せる段階になった。商用水準の総合合格、物理iPhoneでの操作保証、本人採用とは区別する。

G1は同SHAの全11件WebGL CIとビルド/機能検証によりPASS。G3/G4/G5と人間のT01〜T08は未実施。音声出力と無音設定には機械的証拠があるが、聴感品質や保存音のライブ経路は未評価。全てを完了した扱いにはしない。点数は観察者の序数評価であり、利用者成功率の統計ではない。

## 評価方法と原証拠

基準は [Issue #220](https://github.com/nagi300222/mamo-ken/issues/220)、[PR #221](https://github.com/nagi300222/mamo-ken/pull/221) の独立評価プロトコル・採点表。参照思想は桜井政博氏の「重要情報を大きく、スタイル性と読みやすさを両立、素早い決定・戻る・スキップ」、SF6のHP/資源/時間の階層、スマブラの顔・名前・選択・確定の明瞭さ。本人の監修や認証を意味しない。

- 最終原証拠：[WebGL CI run 45193206578](https://github.com/nagi300222/mamo-ken/actions/runs/45193206578)。p4/core/ui-audio provenanceはいずれも上記9ee89efa。原画はClaude v18、旧v17構図案と基準実画面も保持する。
- Chromium/SwiftShader、720×320、852×393、393×852内のCSS回転、各模擬safe area。物理iPhone・UIKit・両親指の操作ではない。
- geometry原報告は3417件PASS、0件FAIL。これは文字の意味、紙の斜め形状内での読みやすさ、聴感や人間の迷いの自動合格を意味しない。
- 通常操作動画は38.76秒、852×392、符号化25fps、音声なし。全体を3秒刻みの時系列フレームで観察。加えて5〜14秒のVS→両者顔寄り→FIGHTを0.2秒刻み45枚で確認した。**連続通し視聴ではなく、符号化fpsをゲームFPSとして扱わない。**
- 音付きmuxは16.16秒、映像・音声の両ストリームを確認。同期は近似で、原AudioContext別ストリームが優先。聴感・音像・遅延の体感評価は行っていない。
- 基準原証拠29件のハッシュ一致は初回評価時に確認した。77資産保持、全回帰、ビルド・配信同一性は別独立検証担当の報告を参照し、この評価者が全試験を実行したとは記載しない。

## 6軸

| 軸 | 重み | 基準→改善 | 観察事実・残る改善点 |
|---|---:|---:|---|
| A 理解・視線誘導 | 25 | 2→4 | 最短画面でも5モードが同時に見える。対戦、階段状勝ち抜き、標的練習、旅札、夕景の生存という絵と行動の対応がある。9顔・得意/苦手・開始がまとまり、開始44px全体がsafe内に収まる。入口と次の行動の説得力が高い。 |
| B 操作・反応 | 25 | 2→3 | 6ボタンの主名を大きくし、方向・使用可否・理由を外guideへ分離。実動画と記録に決定/戻る/弱/強受理・実出音・mute0がある。演出中の無効な操作railは静かになった。ギュイーンの改行は残る。親指誤押し、主観レスポンス、音の気持ちよさは未測定。 |
| C 独自性・統一感 | 15 | 3→3 | 深緑・山稜・紙札・前足印とマーモットが全5モードを繋ぐ。5場面の描き分けが改善し、比較作品の直接模写は観察されない。入口の豊かな絵札とBattleの矩形操作部品の質感・文字密度の統一は、最高水準の仕上げまで未完。 |
| D 試合判読性 | 15 | 2→3 | Arcade/Survival/Practice/FIGHTの説明や進行が下端へ移りHP/Drive/奥義を遮らない。接触位置を中央に保つ。演出中の操作railも非表示となる。二次資源・下端進行の小文字と密度は残る。 |
| E 人への配慮 | 10 | 2→3 | safe内44pxの開始/保存、外guide、暗い面の12px探索案内が改善。紙の斜め切欠きでも最終baseにより長い名前の末尾まで読める。補助小文字の改善余地は残る。拡大/読上げ/色覚/親指/実ノッチ/低刺激の体感は未評価。 |
| F 進行・継続性 | 10 | 3→3 | 確認札の全4行、未保存状態、preview、保存CTAを短画面の初期に同時表示。動画でモード間進行、CIで帰還・再読込を確認。勝ち抜きや持越しの進行説明は下端小文字に依存し、初見無説明の快適さは未測定。 |

算式：`25×4/4 + 25×3/4 + 15×3/4 + 15×3/4 + 10×3/4 + 10×3/4 = 81.25`。全軸3以上でも85点条件は未達。基準と同じ物差しを使い、改善回数や閾値に合わせて加点していない。

## 改善の比較と残課題

| 課題 | 基準原証拠 | 最終の再観察 | 判定 |
|---|---|---|---|
| 下段モードが画面外 | [基準入口](../evidence/ui-polish-20261123/before-1391c494/five-modes.png) | [720入口](../evidence/ui-polish-20261123/after-9ee89efa/polish/lobby-720x320.png)で5場面とCTAが初期可視。副4枚の同じ絵反復も解消。 | HIGH解消 |
| 6ボタン内に主名/固有名/状態が密集 | [基準HUD](../evidence/ui-polish-20261123/before-1391c494/practice-hud.png) | [safe720 READY](../evidence/ui-polish-20261123/after-9ee89efa/polish/dojo-controls-safe-720x320-ready.png)で主名とguideを分離。使用不可も原画像を確認。 | HIGH解消 |
| 確認後の保存CTAが隠れる | [基準確認](../evidence/ui-polish-20261123/before-1391c494/p2-settled-confirmation.png) | [safe720確認](../evidence/ui-polish-20261123/after-9ee89efa/polish/editor-safe-720x320-tab3.png)で全4行と保存44pxが同時可視。本文12pxを維持。 | HIGH解消、紙形状MEDも解消 |
| 選択下段/開始がfooterやsafe外に欠ける | 初回改修の実画面から差し戻し | [safe720選択](../evidence/ui-polish-20261123/after-9ee89efa/polish/selection-safe-720x320.png)で9名と開始が可視。 | HIGH解消 |
| 説明/進行帯がDrive/奥義を覆う | R1〜R3実画面から差し戻し | [Arcade](../evidence/ui-polish-20261123/after-9ee89efa/ui/arcade-common-hud.png)、[Survival](../evidence/ui-polish-20261123/after-9ee89efa/ui/survival-common-hud.png)、[Practice](../evidence/ui-polish-20261123/after-9ee89efa/ui/practice-common-hud.png)で独立確認。 | HIGH解消 |
| 探索の案内が床上で薄い | 基準動画末尾 | [safe720探索](../evidence/ui-polish-20261123/after-9ee89efa/polish/exploration-safe-720x320.png)で12px暗板、stickと横分離、床上重複を解消。 | MED改善 |

| ID・優先 | 残る問題と具体的影響 | 次の改善・再評価条件 |
|---|---|---|
| FINAL-01 MEDIUM | 二次資源や下端の勝ち抜き/持越し状況が小文字に依存し、視線を試合から長く外す。Story safe720では「ドライ／ブ」「後ステ／ップ」の窮屈な改行も残る（原artifact `polish/story-controls-safe-720x320-unavailable.png`）。 | 重要数字と現在の進行を優先し、補助PC説明などと分離。最短safe画面で内容を読み取れるサイズを確保し、資源変化/次戦を動画確認。 |
| FINAL-02 MEDIUM・解消 | R5まで演出中も左右全操作railが残った。 | 最終同SHAのVS/intro/KO/victory/resultで非表示、スキップ/header/結果CTA保持、fight復帰時に表示。原PNGとdense動画で確認。 |
| FINAL-03 MEDIUM・解消 | R5では長名が矩形DD内でも紙の斜め切欠き外へ出た。 | 最終は明るいopaque紙baseが全DDを覆い、末尾まで読める。12px・全4行初期可視・44px保持を原PNGで確認。矩形検査だけでは発見できなかった実欠陥として履歴を残す。 |
| FINAL-04 LOW | 「ギュイーン」がボタン内で「ギュイ／ーン」に分かれる。外guideでは読めるが主ラベルとして滑らかでない。 | 幅配分や短い主表示/外guideの関係を整理し、正式な操作名と機能を保持。 |
| FINAL-05 証拠不足 | 音の聴感・バランス・遅延と、保存音のライブ経路は未評価。音が悪いという断定ではない。 | 同一SHAで保存→音OFF→復帰を音付き収録し、実人の聴感を記録。現在の出音RMSを「気持ちよい音」の合格へ転記しない。 |

## アニメーションと効果音の観察

0.2秒刻みの遷移列で、VS札から1P顔寄り、CPU顔寄り、対戦ワイド、FIGHT、資源HUD/操作rail復帰という段階が読める。intro中のスキップは中央右上で位置を保つ。顔の個性が見え、誰と戦うかを示す機能は成立する。最終は演出中の左右railを非表示にし、顔と勝敗への焦点を改善した。カメラ寸法や既存の演出素材・技ロジックを変える修正ではない。

[KO](../evidence/ui-polish-20261123/after-9ee89efa/core/a5-ko-slow.png)、[勝利](../evidence/ui-polish-20261123/after-9ee89efa/core/a6-victory.png)、[結果](../evidence/ui-polish-20261123/after-9ee89efa/core/a7-result.png)、[軽減設定KO](../evidence/ui-polish-20261123/after-9ee89efa/core/e1-ko-reduced-motion.png)を同SHAで確認。勝敗表示と結果の「もう一戦／キャラ選択」は明瞭。これらの静止画をKOスローやモーション軽減の体感合格としていない。通常攻撃や既存9奥義を全て連続視聴した審査でもない。元の演出素材・技ロジック保持と機能回帰は別検証に委ねる。

[音付き操作mux](../evidence/ui-polish-20261123/after-9ee89efa/audio/ui-with-audio.webm)と原報告では、選択RMS `0.01927`、決定 `0.03798`、弱 `0.000351`、強 `0.000512`、戻る `0.02670`、ミュート選択/攻撃 `0`。強入力の実受理と出音も記録される。音を数値で検出できた証拠であり、音色の好ましさ・優先順位・物理スピーカーでの聞き取りやすさを採点した数字ではない。`humanAudioQualityJudged=false`、`saveSoundLivePathTested=false`を維持する。

## ゲートと人間タスク

| ゲート | 状態 | 根拠・限界 |
|---|---|---|
| G0 統合実体 | PASS | 改善Draft #225と9ee89efa、基準#222/1391を区別。P1/P2承認ゲートと77元資産保持は別独立検証報告を参照。 |
| G1 全機能回帰 | PASS | 同SHA WebGL CI全11job成功、Node298/0、77資産保持、build/配信確認。原receiptを観察し、全試験を自分で実行したとはしない。Mac unsigned build/install/launchも成功。 |
| G2 独立6軸評価 | FAIL | 81.25、各軸3以上、未解消HIGHなし。85点条件を維持。 |
| G3 少人数人間 | UNTESTED | 初見0名、経験者0名。AIとCIを人数へ含めない。 |
| G4 物理iPhone | UNTESTED | 機種/iOS/親指/実ノッチ/10分FPS・発熱・音/低刺激未測定。 |
| G5 ナギ本人採否 | UNTESTED | 本人によるまとまった試遊と採否は未受領。 |

Simulatorは [同SHA Mac run 45193206865](https://github.com/nagi300222/mamo-ken/actions/runs/45193206865) でunsigned build、実install、PID20233起動と生存、framebuffer2枚取得が成立。独立目視でも入口の5モードが描画される。一方、取得画像は1206×2622の縦フレーム内に90度回転した横レイアウトで、`landscapePixels=false`。OSの横向き実動作・touch gameplay・物理横固定の認証ではない。前版R5のCoreLocation移行停止は失敗履歴として保持し、最終成功で消していない。

T01〜T08の人間の無説明タスクは全件UNTESTED。自動経路の成立やAIによる画像観察を人間の成功へ転記していない。商用品質の総合合格は未達だが、主要な障害を取り除いた改善を本人が試せる。mainマージ・P5実装は実施しない。
