# P1 iOS Simulator：safe-area修正後の実表示確認

2026年11月23日、実iOS Simulatorへアプリをインストール・起動し、原PNGとUIKitログを確認した。前回の入口カードとDynamic Islandの重なりは、この実行で解消した。**本人の物理iPhone確認は未実施で、P1本人確認ゲートは解除しない。**

| 確認対象 | 実測・実際の結果 |
| --- | --- |
| ソース | `9be662d33107d341a8c8daa406ce9d4a088884b7` |
| macOS実行 | [run 45130530972](https://github.com/nagi300222/mamo-ken/actions/runs/45130530972)、job `137544732663`、全工程成功 |
| コンパイル | Xcode 26.6 / build 17F113、iPhoneSimulator SDK 26.5、署名資格情報を用いないビルド成功 |
| 実行先 | iPhone 17 Simulator / iOS 26.5 |
| インストール・起動 | `jp.nagi.mamoken.poc`を実インストール、PID `20469`で起動し、撮影前にUIKitアプリプロセスの生存を確認 |
| 入口の実表示 | 5モード、各説明、モグゾー画像、フッターが表示。Dynamic Islandは余白内に収まり、通常対戦カードの説明先頭を覆わない |
| 原PNGの実寸 | 2枚とも1206 × 2622ピクセル。縦長の物理画面座標に横向き内容が入った原画像を、そのまま確認 |
| UIKitの実方向 | 下記の実ログで`UIInterfaceOrientationLandscapeRight`を確認。PNGの縦横比と区別する |
| 端末用素材 | artifact内`native-assets.json`で149ファイル / 107,723,393バイト、remote server URLなし |
| 別枠のWebGL回帰 | [run 45130530922](https://github.com/nagi300222/mamo-ken/actions/runs/45130530922)のnative / story / avatar / custom / core全5ジョブが実render・操作工程を含め成功 |

実UIKitログ：

```text
2026-11-23 07:34:14.315 Scene updated orientation preferences: none -> ( Ll Lr )
2026-11-23 07:34:14.636 [Interface Orientation] was:Interface Unknown now:UIInterfaceOrientationLandscapeRight reason:Using key window scene
```

今回も初回bootはデータ移行中に180秒へ達した。異なる移行処理の進行が実ログに残ったため、一度だけ条件付きで延長し、追加約294秒でbootを完了した。その後の実install・launch・2枚の画面保存が成功した。タイムアウトを成功に置換した結果ではない。

## 原証拠

[artifact 14797784262](https://github.com/nagi300222/mamo-ken/actions/runs/45130530972/artifacts/14797784262)に、署名不要のSimulator用アプリと証拠を保存している。Simulator用`.app`は物理iPhone用IPAではない。

| ファイル | 内容・SHA256 |
| --- | --- |
| ZIP全体 | `2ba16783e8a43600cf82342f87a0ab03e628f2d6c0130b46ab35b1b36cb417e3` |
| `evidence/simulator/01-native-launcher.png` | 原PNG。`d6fac1be2a29c9ccd721cf4ed0bdaf29ffe8fddce5011091e9fe552609c606ee` |
| `evidence/simulator/02-native-launcher-stable.png` | 2枚目の原PNG。同一ハッシュで表示の安定を確認 |
| `evidence/simulator/report.json` | 実Simulator、boot段階、起動PID、原PNG寸法、未検証項目 |
| `evidence/simulator/commands.log` | 実行コマンド、boot移行、install・launch・撮影の実出力 |
| `evidence/simulator/unified-app.log` | UIKit方向、WKWebViewの実ログ |

原画像の回転・切り抜き・加工はしていない。Actions artifactの保存期間は7日で、将来のダウンロードを保証しない。上記ハッシュは保存された原証拠を特定するための記録である。

前回の不具合と修正案の履歴は[native側の初回検証記録](../../native/verification/SIMULATOR_20261123.md)に残す。今回の追補が、入口safe-area修正後の結果である。

## 検証範囲

今回の実Simulator画像で確認したのは**入口の表示とノッチ回避**。Storyの編集・探索・対戦・movieの各操作画面を実Simulatorのタッチで巡回したわけではない。

Storyはアプリ全体を4辺のsafe-areaから作る共通矩形へ収めた。別のChromium fixtureでは、左右片側・両側62pxと下21pxを明示的に入力し、入口・editor・stick・movie-skipの実DOM境界とWeb表示への非干渉を検証した。これは模擬insetによるブラウザ検証で、UIKitの`env()`値そのものの実測とは区別する。

未検証：物理iPhoneへのインストール、実機タッチの快適性、実機の回転・背景復帰・音・永続保存、実機WebGL対戦、発熱・メモリ圧迫・FPS。後続のP3/P4や別デザインの画面は、このソースSHAの原PNGだけで合格とは扱わない。mainのマージとP2着手は行っていない。
