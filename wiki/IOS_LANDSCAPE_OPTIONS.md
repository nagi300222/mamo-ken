# マモ拳：真の横画面専用アプリ化（提案のみ／未実装）

## v15.1で残っている課題

既存のWeb版は、iPhoneのSafari/Chromeを縦方向で起動しているとき、DOMの `#app` だけをCSSで `rotate(90deg)` している。ゲームの中身は横画面だが、iOS本体のメニューやSafariのブラウザUI・システムジェスチャーは縦画面用のまま。

**Webコンテンツを回しても、iOS自体やブラウザのUIの向きは変えられない。** Web SafariにOS画面回転ロックを確実に上書きする保証はない。単に動画やcanvasを全画面表示する修正で解決したとしない。

## 比較

| 方式 | 本当にOSに横画面アプリとして扱わせるか | 既存Three.jsを活用 | 備考 |
|---|---|---|---|
| Safari/Chrome内のCSS回転 | いいえ | そのまま | 現状。ボタン/ステージは回るがiOS操作は縦 |
| ホーム画面に追加したPWA＋orientation宣言 | iOSでは保証しない | そのまま | ブラウザのツールバーが減る可能性はあるが、iOSのシステムUIや方向制御まで保証しない。iPhone実機で事前検証 |
| CapacitorなどのネイティブiOSアプリラッパー | **iOSのランドスケープ専用設定で制御できる** | WebView内で移植可能 | 推奨。Xcode/署名/端末実機テストが必要。現在のWeb版を維持しつつ別枝で着手 |

## 私の推奨（未採用案）

v15.1の対戦・技Wikiで仕様を確認してから、**ゲームを最初からUnityに作り直すより、現在のThree.jsをCapacitorのWKWebViewに載せる別プロジェクト／別PR**が最も低リスク。

Apple/iOS側で`UISupportedInterfaceOrientations`（またはXcodeのSupported Interface Orientations）を横方向に制限し、画面回転ロックがONの端末で起動・終了／通知センター／ホームに戻る／Bluetooth音声／安全領域／プルダウンを試験する。iPadの画面構成は別に確認する。

- Capacitor公式：<https://next.capacitorjs.com/docs/apis/screen-orientation>
- iOSのOrientation設定：<https://capacitorjs.jp/docs/next/guides/screen-orientation>

**今回の依頼ではアプリへの変更は一切行わない。** 本文は次期アプリ化の意思決定用資料で、iOS対応版を配布・ビルド・公開したことを意味しない。
