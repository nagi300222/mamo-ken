# P0〜P4統合：同一HEADの回帰と独立審査

2026-11-23。今回の本人指示「改善はされてるからそのまま進めて」をP1確認・P2着手許可として、統括からP2→P4統合再開の引き継ぎを受領した。これはP4統合版の採用、G3人間テスト、G4物理iPhone、G5本人試遊の合格を意味しない。過去資料の「P1未承認ならP2未着手」という条件は履歴として保持し、現在の許可記録と区別する。

この準備作業のベースは`1d8196ac62decd07b85821a84346a107a6829b48`。**本書作成時点ではP2/P4を統合した実画面の審査を行っていない。採点は未実施。** 統括が指定する新統合Draftの固定HEADに対し、以下を実行する。main・既存Draftのマージはしない。

## 正本と取り込み

運用は[Issue #220](https://github.com/nagi300222/mamo-ken/issues/220)、手順・採点契約は[PR #221 @7b1d6995](https://github.com/nagi300222/mamo-ken/pull/221)。以下6ファイルを意味変更せず取り込み、各git blobの先頭値がPR差分と一致することを確認した。

| ファイル | blob先頭 |
| --- | --- |
| `P4_INDEPENDENT_REVIEW_PROTOCOL.md` | `e155ced5` |
| `P4_REVIEW_SCORECARD_TEMPLATE.md` | `a7325707` |
| `p4-review.example.json` | `b416395e` |
| `tools/qa/validate-p4-review.mjs` | `25f1395c` |
| `tools/qa/validate-p4-review.test.mjs` | `89cde93d` |
| `.github/workflows/mamoken-p4-review-framework.yml` | `ebea197b` |

上3ファイルは`docs/mamoken-next/`。原テンプレートの未実施値や旧ゲート記載を、今回の実施結果として流用しない。実レビューでは固定HEAD用に複製し、本人のP2許可記録を証拠URL付きで統括が紐付ける。`ownerDecision`はP4のG5判定なので、P1の肯定を`ACCEPTED`として転記しない。

## CI統合案と実装した配線

既存`.github/workflows/mamoken-runs-v16.yml`の8suiteを残し、P4 UIを9番目に追加する。P2/P4本体が揃った新統合ブランチで採用するための配線であり、欠けたP4 scriptを条件付きでskipしない。統括指定の新ブランチ名がpush対象に無い場合は許可リストへ追加するか、同ブランチを指定してworkflow_dispatchする。

| suite / job | 検査する実体 | 主なG1証拠 |
| --- | --- | --- |
| core | 対戦、Practice、Arcade、Survival、VS/勝利、既存通常技 | モード進行、実モデル、KO/再戦/スキップ |
| avatar | 部品GLBと元モデル、模様、shader | P2制作後の部位プレビュー・原GLB不変 |
| custom | 自作モデルと混成技の実戦互換 | 実接触、morph、弾、loadout |
| story | 編集→保存→探索→会話→実Battle→帰還 | P0同時タッチ、カメラ/保存、実奥義 |
| native | 端末用bundleと実Chrome、模擬native adapter | 外部素材不要、入力解除、停止/復帰、CSS env境界 |
| p3 | 実hit/guard/whiffと音、Chirka曲線 | 実イベント、接触FX、音声バッファ |
| motion | 9体×6 R2通常技 | 54技・接触面・両向き・元rig |
| special | 27 R2必殺＋反撃/投げ/例外 | 実接触、相手反応、奥義不変 |
| p4（追加） | `acceptance/p4-ui-browser.mjs` | 実5モードの原画適用・導線・表示 |
| review-framework（別job） | validator自身の6自己テストと未実施テンプレート | `HOLD`・score null・errors空を厳密確認。G2合格ではない |

各suiteの`ci-provenance.json`に実checkoutの40桁SHAとGITHUB_SHAの一致、suite、run/attempt、Node、実行OSを保存する。物理iPhone・人間テスター・本人P4判断を実行していないことも記録する。失敗時も各artifactを保存する。既存の古い素材数や異なるSHAのPASSを新HEADへ転記しない。

`review-framework`は未実施テンプレートのexit 1に加えJSONが正確に`HOLD`であることを検査する。読み込み不能や構文エラーのexit 2を「未評価なので成功」と扱わない。validatorはURL文字列等の整合確認であり、証拠URLの内容・実ユーザーの実在・独立性・SHA一致を外部から認証する機能はない。これらは担当が原artifact・PR・人物記録を読み合わせる。

## 同一HEADでの受入と独立G2

| ゲート | 今回の準備時点 | 実施・受入条件 |
| --- | --- | --- |
| G0 | UNTESTED | P0/P1/P2/P3/P4本体、5モード、許可記録、採用アセットSHAを同じ統合Draft/HEADで確認 |
| G1 | UNTESTED | 9suite＋Node/buildの実結果、9体/54通常/27必殺/9奥義/保存帰還、720×320・852×393・縦の横表示・safe areaを照合 |
| G2 | UNTESTED | 制作と別の観察者が原画固定版と実UI/短い操作動画を比較しA〜Fを根拠付き採点 |
| G3 | UNTESTED、参加者0名 | 初見・経験者に無説明T01〜T08。各2名推奨、validator最低各1名。AIの模擬人物で補わない |
| G4 | UNTESTED | 物理iPhone機種/iOSを記録し、両親指・回転・ノッチ・音/低刺激・背景復帰・10分性能/熱を実測 |
| G5 | UNTESTED | P4統合後の本人によるまとまった試用と採否。P1許可は代用しない |

G2の6軸は理解/視線誘導25、操作/反応25、独自性/統一15、試合判読性15、人への配慮10、進行/復元10。各0〜4、`Σ(重み×点/4)`が85以上・全軸3以上・重大課題0が採用候補条件。G3/G4/G5が未実施なら全体はHOLDであり、点数で上書きしない。

独立観察では「意図→実画面→人が取りたい行動→不一致→修正案」を書く。桜井氏の公式UI動画を参考にした独自審査で、桜井氏本人によるレビューと呼ばない。SF6・スマブラは行動/情報設計の比較で、素材や固有UIを複製しない。

このQA担当はP2部品/P4 UIの制作担当ではないが、過去P1 native safe-area CSSと検証fixtureに関与した。G2でその関与を開示し、native安全領域のE/F部分は自己認証だけで閉じず別担当の交差確認欄を残す。制作PR担当を唯一の採点者にしない。

## native / iPhone：過去の証拠と今回の未検証表

| 項目 | 既存の実証範囲 | P0〜P4新HEADでの扱い |
| --- | --- | --- |
| iOS source / bundle | P1のXcode26.6/SDK26.5 unsigned build、149file/107,723,393bytesは旧SHAの記録 | 新P2部品/P4 UI込みで再build/syncし素材数を測り直す |
| UIKit横向き・入口ノッチ | [45130530972](https://github.com/nagi300222/mamo-ken/actions/runs/45130530972)と[45135863119](https://github.com/nagi300222/mamo-ken/actions/runs/45135863119)の実Simulator、LandscapeRightログ、入口原PNG | 新HEADの原PNG/ログで再検証。旧画像を新UIの表示証明へ流用しない |
| native CSS env / 戦闘rail | 旧HEADの実Chrome・模擬59/62pxで9px間隔、8targetが44px以上 | P4統合後の実DOMとsafe-areaを再測定 |
| 自作キャラ/混成技 | Chromeの実WebGL・元rig/部品/接触検査 | P2の新部品を同HEADで再測定。物理端末のmorph/メモリ未確認 |
| Preferences・保存再編集 | Node plugin契約とChrome local save/reload | UIKitで編集→battle→帰還→再起動保存は未検証 |
| 背景復帰/音/低刺激 | Nodeと模擬native event、実ブラウザAudioBuffer | 実iPhoneの音漏れ・中断・スピーカー・低刺激は未検証 |
| 実SimulatorのStory操作 | 入口のinstall/launch/生存/原PNGは確認済み | 実Simulatorのタッチ巡回/対戦/帰還を確認したとはしない |
| 物理iPhone性能・操作 | 本人のP1肯定は受領。機種/iOS/測定時間付きG4記録は無い | 物理ノッチ/親指/FPS/熱/電池/回転ロック/機内モードはUNTESTED |

## 手元で確認した準備結果

- 正本validator自己テスト6/6成功。
- 未評価JSONはexit 1、`verdict:HOLD`、score null、errors/failures空。これは期待された自己テスト結果で、ゲームの採点ではない。
- UI/runtime/GLBにはこのQA準備で変更しない。実G1/G2は統括が固定した新HEADの完成後に実行し、実採点表と原証拠を別commitへ保存する。
