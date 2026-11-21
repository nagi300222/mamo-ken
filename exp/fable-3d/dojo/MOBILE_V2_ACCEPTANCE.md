# マモ拳3D スマホ v0.2 受け入れ結果

2026年11月21日（JST）。[Issue #150](https://github.com/nagi300222/mamo-ken/issues/150) の対応。基準は [Draft PR #143](https://github.com/nagi300222/mamo-ken/pull/143) の `8e6449b6`。修正は同 PR のブランチを取り込み先とする [独立 Draft PR #151](https://github.com/nagi300222/mamo-ken/pull/151) に収録。

## 試遊と検証環境

- 既存 Cloudflare Pages プロジェクト `mamoken-3d` の [ブランチプレビュー](https://fix-mobile-v2-acceptance-150.mamoken-3d.pages.dev/dojo/)。
- `node build-pages.mjs` が `exp/fable-3d/_pages/` に静的ファイルを生成。合計53ファイル、9 GLBで15.07 MiB。ルートから `/dojo/` へ遷移。Chromiumでアプリ・アセットの失敗リクエストと未処理JSエラーは0件。
- ローカル検証は配信用ディレクトリをHTTP配信し、Linux Chromium 156のWebGLとCDPタッチ入力を使用。Android Chrome相当の横画面寸法、iPhone相当の横画面寸法とセーフエリア、狭い横画面をエミュレートした。
- 公開URLのデプロイは [CloudflareのPR通知](https://github.com/nagi300222/mamo-ken/pull/151#issuecomment-7059553402) で確認できる。GitHub Actionsの Chromium 試験は、公開URLの配信ファイル6点がチェックアウトから生成したファイルと一致してから、同じブラウザ手順を実行する。結果と配信時のキャプチャは [PRのChecks](https://github.com/nagi300222/mamo-ken/pull/151/checks) に記録する。
- iOS Safari・Android Chromeの物理端末、iOS SafariのWebKit動作、端末固有ジェスチャー・FPS・発熱は未検証。Cloud環境から公開URLへの直接HTTPS接続はプロキシで403、WebKit取得も配布ドメインの制限で403だった。

## ブラウザと対戦の結果

| 項目 | 確認内容 |
| --- | --- |
| 横画面 | 568×320、800×360、852×393 CSS pxで中央ビューと左右操作が非重複。852×393で左右47px・下21pxを予約。5ボタンは幅42px以上で、4コマンドの案内は折り返して表示。 |
| 同時タッチ | スティック＋弱＋ギュイーンを3つのPointerIdで認識。スティック外へスライドしても捕捉し、リリース後は全ボタンの押下表示を解除。フレーム間で完結する短いボタン入力も次の対戦フレームに反映。 |
| コマンド | 実タッチ経路で19ケース。236／623／214／236236を両向きで入力し、ニュートラル・斜め省略・長押しを検証。奥義ゲージ100＋強で236236が優先。不足時または弱では236にフォールバック。無関係な方向への切り替え後は通常技。専用必殺ボタンは0個。 |
| 高ジャンプ | 対戦テストで9×9×左右の162通りが飛び越え、着地後に向きと後ろガードが反転。アリーナ範囲外は0件。ブラウザのモグゾー対ゴダンでもタッチで飛び越え。測定した上昇描画フレームでキャラの投影がキャンバス外に出た回数は0。 |
| 咆哮 | ブラウザでタッチ起動、Drive 35消費、敵弾消去、後出しの咆哮返しを確認。対戦テストで通常打撃への装甲、同時咆哮の相殺、保持による再発動防止を確認。 |
| ギュイーン | ブラウザでヒットストップ中にタッチ起動し、Drive 60消費、双方同時の仮クリップ、HP維持と距離1.35の仕切り直しを確認。対戦テストで通常打撃・敵弾・投げ・奥義・咆哮に対する超装甲、毒の一時停止とニュートラル復帰後の再開、自弾維持、遠距離空振り、Drive回復と保持による再発動防止を確認。 |
| 対戦と再戦 | CPU 81組すべて決着。左35勝／右35勝／引分11。チルカの毒とバレットの尾先補間を対戦テストで確認。ブラウザでタッチ攻撃のKO、再戦時のHP・Drive・奥義ゲージ初期化、キャラ再選択を確認。 |
| モデル | ブラウザのGLTFLoaderで9体各11、計99クリップを読み込み、各キャラの対戦を開始。バレットのモーションJSONから尾先軌跡を読み込み。 |

## 追加モーションの接続

9体とも旧GLBの共通10＋固有1クリップを保持。現在のGLBに不足するクリップは次のとおり。

| 追加予定 | 現在の表示／接続 |
| --- | --- |
| `roar` | `guard_stand` |
| `gyuiin` | `stand_heavy` |
| `clinch_hold` | 両者の `guard_stand` |
| `clinch_recoil` | `hurt_light` |
| `roar_hit`、`hurt_heavy` | `hurt_light` |
| `guard_hit`、`guard_impact`、`guard_crouch_hit`、`guard_crouch` | `guard_stand` |
| `crouch_light`、`crouch_heavy`、`air_light`、`air_heavy` | `stand_light`／`stand_heavy` |
| `throw_reach` | `stand_heavy` |
| `throw_hit`、着地、ダッシュ制動 | 専用のゲーム状態との接続は後続作業。既存の掴み・移動・待機姿勢で表示。 |

Codex担当は `dojo/commands.js`・`battle.js` の入力と状態処理、`main.js`・`models.js` の描画接続、`index.html`・`style.css` のセーフエリア・狭幅の回帰修正、テストと配信検証。Claudeの [#148](https://github.com/nagi300222/mamo-ken/issues/148) は `exp/fable-3d/chars/` のGLB・モーションメタデータ。Astraの [#149](https://github.com/nagi300222/mamo-ken/issues/149) はHUD・操作レイアウトの改善で、差分を重ねる際はセーフエリアと中央ビューの矩形検証を使う。技の数値を管理する `balance.js` はPR #143の版を使用。

## 証拠と再実行

- [Node 36件とPagesビルドの出力](acceptance/node-and-pages.txt)
- [ローカルChromiumの出力](acceptance/browser.txt)
- [横画面 568×320](acceptance/chromium-narrow.png)・[Android寸法 800×360](acceptance/chromium-android-layout.png)・[iPhone寸法とセーフエリア 852×393](acceptance/chromium-iphone-layout.png)
- [ギュイーンの仮クリンチ](acceptance/chromium-clinch.png)・[KOと再戦メニュー](acceptance/chromium-ko.png)

ローカル再検証は `exp/fable-3d/dojo` で `npm test` と `npm run build:pages` を実行し、別ターミナルで `python3 -m http.server 4180 --directory ../_pages` を起動する。

```sh
npm install --prefix /tmp/mamoken-browser playwright-core@1.65.1
NODE_PATH=/tmp/mamoken-browser/node_modules CHROMIUM_PATH=/usr/bin/chromium \
  MAMOKEN_EVIDENCE=/tmp node acceptance/browser.mjs
```

同じスクリプトに `MAMOKEN_URL` を渡すと公開プレビューを試験できる。CPUの行動・距離・ゲージなどの前提は必要な箇所で固定し、入力はブラウザのタッチ経路を使用する。
