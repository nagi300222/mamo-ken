# P0〜P4 実制作管理

基準PR209 `8ab89722`、詳細設計PR214 `15c4897f`。2026-11-23本人による一括制作指示。

- Codex P0: 探索独立カメラ/共通入力HUDとVS不要文言を実装。179 Node/77アセット保全/実WebGL4レーン成功（02323fc、Actions45123063619）。読み込み中Native停止の追補を次のP1CIで追加検証。
- Codex P1: 固定依存Capacitor/iOS project/横向き/lifecycle/端末手順を実装、Linuxで実素材同梱・ios sync・native9テスト成功。macOS unsigned compileとnative-adapterシミュレートの実WebGLをCIで検証する。iPhone実機は未実施。
- Codex P3: 技カタログ/実ヒット感・音・CPU測定、Claude成果の統合を実装中。
- Codex P4: 全5モードの実UI/デザイントークンと共有HUDを実装中。
- Claude Code: 54通常・27必殺の3D素材をDraft216へ保存。独立QA指摘を受け0ce6b852で全active時刻の正確な接触表・符号付き高さ・発射socket・比較動画9本・左右シート9枚を提出。P4独自SVG27点はDraft218、実UIはDraft217へ接続済み。
- P2: P1本人確認待ち。設計調査のみ許可、実装・GLB再生成・統合は未着手。

P1本人ゲートは本ファイルやPR作成・CI成功では解除しない。本人の実試用・確認の記録が必要。P3/P4は別Draftで継続制作し、P4統合版の本人試遊前にP5を実装しない。原モデル・通常54・必殺27・奥義9・5モードを保持。mainや既存Draftのマージは行わない。

P0不要表示の原因は `fillVsScreen()` が、Darkの参加時に `VS_TEXT.dark` を毎回出すこと。ここだけ隠して空文字化し、Arcade `run-dialogue.js` の旧版台詞・Dark固有能力は維持する。

## P1の本人確認へ渡せる実成果（2026-11-23）

- P0/P1コード9be662d：WebGL [45130530922](https://github.com/nagi300222/mamo-ken/actions/runs/45130530922) 全5ジョブ成功、native14テストと149ファイル107,723,393bytesの同梱を確認。
- Mac [45130530972](https://github.com/nagi300222/mamo-ken/actions/runs/45130530972) 成功。Xcode26.6／iOS26.5のiPhone17 Simulatorへ実インストール・起動・撮影。UIKit LandscapeRightログと5モード入口の実画面、Dynamic Islandの文章重なり解消を確認。詳細は[原画像・証拠](../mamoken-p1/SIMULATOR_SAFE_AREA_20261123.md)。
- 実iPhone・Storyの実Simulatorタッチ巡回・実機FPS／熱／電池は未確認。P1本人ゲートはpending、P2は未着手。
- P4実UI4f26a5c：[45131376271](https://github.com/nagi300222/mamo-ken/actions/runs/45131376271) 全5ジョブ成功。3viewportの下段到達、選択プロフィール、旅札保存、模擬安全領域を実画像で独立確認。P1とは別HEADであり、上記Simulator画像をP4へ流用しない。
- P3実統合Draft219：81技監査・命中/ガード/空振り・音・新素材読込を実装。実WebGLで54通常の時計/左右/足接地、27必殺測定と14ケースを実行。接触表補間の不一致を修正し再検証中、対空の地上初段/CPU到達判断も調整中。未完成を完成扱いしない。
