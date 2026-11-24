# マモ拳 UI設計バイブル | v0.2 / 初回方向選択と詳細比較
> 作成日 2026-11-24／原案：ミオ。**初回方向 B/B/A/A は本人選択。細部候補・Figma完成稿・ゲーム実装は未承認。**
> 実行基準：P0〜P4改良 Draft PR #225（gameplay SHA 9ee89efafa76cb3ad80fbff46c7f56a1261baa48）。Issue #227 は全画面再設計の親課題。
>
> Figma： https://www.figma.com/design/afaB1eVmV6uOnDZR40t0Kr
> A・拳祭  https://www.figma.com/design/afaB1eVmV6uOnDZR40t0Kr?node-id=3-54
> B・山嶺  https://www.figma.com/design/afaB1eVmV6uOnDZR40t0Kr?node-id=3-222
> C・絵巻  https://www.figma.com/design/afaB1eVmV6uOnDZR40t0Kr?node-id=3-391
> ボタン・ゲージ比較  https://www.figma.com/design/afaB1eVmV6uOnDZR40t0Kr?node-id=2-2
> B全体×A戦闘の3構図  https://www.figma.com/design/afaB1eVmV6uOnDZR40t0Kr?node-id=23-170

## 本書の位置づけ
本書は「綺麗なスクリーンショット集」でも「今の画面の文字を減らすタスクリスト」でもない。**ゲームを遊ぶ人に何が起こり、どこを見て、何を押し、どう感じるか**を追跡し、全部のUI要素を一貫して決めるための設計正本を目指す。初回は広い範囲に実際の候補を出すことを優先し、決定前の案を勝手に正式仕様扱いしない。

## 目次／今後の巻構成
| 章 | 内容 | この巻の進捗 |
|---|---|---|
| [00 表現の約束](00_creative_brief.md) | 対象者・目的・参考思想・反例・プレイ体験 | 初稿 |
| [01 作品の美術方向](01_art_direction.md) | A 拳祭・B 山嶺・C 絵巻／比較と適用条件 | 3候補 |
| [02 画面アトラス](02_screen_atlas.md) | 入口、選択、対戦、連戦、練習、制作、探索、対話、VS、結果の各構図 | 候補・詳細初稿 |
| [03 遷移・状態](03_navigation_state.md) | 画面の状態遷移・キャンセル・復元・リズム | 初稿 |
| [04 文字・色・余白](04_visual_foundations.md) | 段組・タイポ・安全領域・素材体系・基準 | 初稿 |
| [05 ボタン・操作](05_buttons_controls.md) | 個々のUI操作とタップ領域、状態、応答、代替手段 | 部品候補 |
| [06 ゲージ・HUD](06_gauges_hud.md) | HP/Drive/奥義/タイマー/能力/ラウンドと配置 | 部品候補 |
| [07 演出・サウンド](07_motion_sound.md) | 画面遷移、打撃、選択、保存、音、低刺激 | 初稿 |
| [08 品質評価](08_accessibility_qa.md) | 見えること／触れること／動くこと／初見試遊 | 初稿 |
| [09 選択台帳](09_decisions.md) | 採用・保留・却下・変更理由、候補ID一覧 | 全件保留 |
| [10 実装契約](10_implementation.md) | Figma→Claude/Codex/Workへの安全な引継ぎ・版管理 | 初稿 |
| [13 初回方向 B/B/A/A](13_selected_direction.md) | 競技B×舞台Aの統合規則とBA-01/02/03 | 本人選択4件＋構図保留 |
| [14 6操作・3ゲージの詳細比較](14_controls_hud_variants.md) | 6ボタンごとの機能/状態、HP/Drive/奥義3案ずつ | 選択待ち |
| [options.json](options.json) | マシン可読な候補IDと状態 | 4方向選択・その他保留 |

## 今回つくったFigmaについて
- 3方向×6場面＝**18枚の編集可能なラフ構図**と、3方向×3状態の操作ボタン＋HP/資源ゲージの編集可能な試作コンポーネント。
- キャラクターの顔は**仮の同一サンプル**。実物のモグゾー／既存9体の3Dモデル・テクスチャを再現した素材ではない。ゲーム実装へ採用する前に正式GLBや原画に差し替え、機能と負荷を検証する。
- ここでのA/B/Cは色の選択だけではなく、画面構成・情報の出方・音・世界との関係が異なる。
- Figmaのコンポーネントは**試作部品**。タッチ・入力遅延やゲームFPSを証明しない。

## 最初に選んでほしいのはこの順
**第1回（本人の方向選択済み）**：AD=B、MENU=B、SELECT=A、BATTLE=A。**未確定：**細部とゲームへの実装。
**第2回（今回の比較対象）**：BATTLE-SUB（BA-01/02/03）、ACT（6攻撃）、HP/DRV/ULT（各ゲージ）。その他BTN/NAVは保留。
**第3回**：CRAFT（キャラクリ）、EXPLORE（探索）、PRACTICE（練習）、RUN（連戦）、RESULT（勝利）。
**第4回**：MOTION/SE、アクセシビリティ、仕様の数値・比較実機。

一度に全部決めなくてよい。候補の組合せを採用するときは、画面・部品・音の関係が切れないか**統合レビュー**する。ナギは「Aの構図、Bのゲージ、Cの音」といった要望を出せる。

## 記録方法
- 意見や選好は確認時点では *USER_PROPOSED*、明示採用で *ACCEPTED*。AI提案は *PROPOSED*、試作は *EXPERIMENTAL*、否決は *REJECTED*。
- 採用理由には「目的」「対応スクショ/Figma」「ユーザーの実機コメント」「採用日」「代替と却下理由」を添える。
- 決定は [09 選択台帳](09_decisions.md) のIDを保って更新。色やスケールが変わっても同じ意味ならIDは維持。意味が変わるなら新ID。
- 構造が未完成でも、本書を開発PRのゲートとして使う。**設計書作成だけではゲーム改修済みと宣言しない。**

## 変更禁止事項
既存9体・54通常技・27必殺・9奥義・P2交換部品26・CPU・5モード・Story保存・探索復帰・入力契約は保全。Three.js、HTML/CSS/JS、Capacitorを維持し、実機未確認を合格扱いしない。main・PR #222・PR #225の既存ブランチを無断マージ・上書きしない。P5は別レーンで可能。
