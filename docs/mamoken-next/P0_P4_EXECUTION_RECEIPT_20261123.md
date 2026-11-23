# P0〜P4 実装・本人確認への引き渡し

基準PR209 `8ab8972295d059426b858d9b8edabfda6068a7a3`、設計PR214 `15c4897f3dee625dcbeaeacea8a422c33638c8aa`。9体すべてマーモット。以下は実装成果と検証範囲の記録で、P2承認やmainマージを意味しない。

|工程|実成果|状態・証拠|
|---|---|---|
|P0/P1|[Draft215](https://github.com/nagi300222/mamo-ken/pull/215)|独立左右タッチ・追従カメラ・共通戦闘操作・背景停止・Capacitor iOSソース。本人確認待ち|
|P3制作|[Claude Draft216](https://github.com/nagi300222/mamo-ken/pull/216) `9751524`|54通常/27必殺、別版r2変更7本、編集用Python、9比較動画/左右シート、7修正比較動画|
|P3実装|[Draft219](https://github.com/nagi300222/mamo-ken/pull/219)|実測表・実GLBを全5モードの共通供給元へ接続、CPU/接触音/FX/停止/当て身を実装。最終WebGL全8成功|
|P4原画|[Claude Draft218](https://github.com/nagi300222/mamo-ken/pull/218) `0ce8721`|27オリジナルSVG、tokens/manifest、編集用Python。静止構図案と実装を区別|
|P4実装|[Draft217](https://github.com/nagi300222/mamo-ken/pull/217) `4f26a5c`|5モードの実UI、9体の選択/プロフィール、実3Dエディター/探索HUD。CI全5成功・20画像レビュー済み|
|P2|[Issue211](https://github.com/nagi300222/mamo-ken/issues/211)|調査・設計のみ。本人のP1確認まで実装/部品GLB再生成/統合禁止|

## P1の試用

[固定Web版](https://a6e0733b.mamoken-3d.pages.dev)はPR215 `3e652811`の配信。iOS手順は同ブランチの `native/README.md` と `native/IPHONE_REVIEW.md`。

Macにリポジトリを取得し、`feat/mamoken-p0-p1-integration`を選択して実行する。

```sh
npm ci --prefix native
npm --prefix native run ios:sync
npm --prefix native run ios:open
```

XcodeのApp schemeでiPhone Simulatorを選びRunする。物理iPhoneへ入れる場合は本人のMac/Xcode・Signing Team設定が必要。Simulator用App.appは物理iPhone用IPAではなく、TestFlight配布は未実施。

- [WebGL45135863151](https://github.com/nagi300222/mamo-ken/actions/runs/45135863151)：5ジョブ成功。実CSS envの安全領域を59/62pxで測定し、Storyの実対戦画面でHUDと8操作ボタンの非重複を確認。
- [Mac45135863119](https://github.com/nagi300222/mamo-ken/actions/runs/45135863119)：Xcode26.6/iOS26.5 SDK、iPhone17 Simulatorへ実install/launch、PID生存、UIKit LandscapeRight、安全領域内の入口PNGを確認。[artifact14800910416](https://github.com/nagi300222/mamo-ken/actions/runs/45135863119/artifacts/14800910416)。
- P1の実行コード9be662d、検証追加12c31d4、記録追加3e652811を区別。149ローカルファイル/107,723,393bytes、remote server.urlなし。P3追加後のnative bundleは201ファイル/112,824,860bytesであり、P1単体の数値と混同しない。
- 物理iPhoneのインストール・タッチ・復帰・音・FPS・発熱・電池は未検証。Simulator起動とChrome WebGLの証拠を実機ゲームプレイの代用にしない。

## P3の実接続と性能の分離

54通常技は持続の各実フレーム・左右・足接地を検査。カスタムは既存81体格/スタイルの486技を実スキン/モーフで測り、未計測の別スタイルは拒否する。27必殺も実選択クリップ・射出骨・実接触表を照合し、既存モデルの自前の実測面/ソケットを優先する。P2の新しい部品互換は追加していない。

19近接必殺のhitstun候補は別表。発生/持続/硬直/威力/属性/キャンセルを保全し、実測面に合わせた9体別の中距離コンボと従来s2の壁際コンボを記録した。音/FXは実ヒット/ガードから一度だけ提示する。9奥義・勝利映像は元データを保持。

実WebGLで発見した壁際の座標ずれは、技性能の調整と分けて `docs/mamoken-p3/IMPACT_POSITION_FIX.md` に記録。停止中の根元座標を保持し、押し合い・相打ち・後続飛び道具による移動後も新規の実面エフェクト位置を同期する。飛び道具自身の世界座標は変更しない。

新旧各1,458ラウンドのCPU比較と修正後再計測を保存。最終ランタイムで勝敗/HP/試合長/timeoutの変化は全件0。固定CPUで速いキャラが優位な傾向は残り、人間の対戦バランス認証ではない。表面の正確さ・音の波形・見た目の主観評価・スマホ性能を別々に扱う。

最終コード `e10c823b` の [WebGL45146238314](https://github.com/nagi300222/mamo-ken/actions/runs/45146238314) は**全8ジョブ成功**。Node211戦闘/34自作探索共通UI/14native、原77素材保全を確認済み。実採用の54通常211接触点、27必殺の実スキン/射出点と50接触ケース・タキマル下段6条件、Dojo/Storyの当て身成功/中断/空振り・投げ16ケースが成功。既存9奥義/勝利/5モード・探索からBattle/復帰・native回帰も通過した。

[P3固定Web版](https://e726fd23.mamoken-3d.pages.dev)はこの検証済み実行コード。P1確認用の固定URLとは別の独立レーン。special [artifact14804372067](https://github.com/nagi300222/mamo-ken/actions/runs/45146238314/artifacts/14804372067)には27/50/6と16実consumerのreport/PNGがある。いずれもerrors空、物理端末未検証を明記。Chirka曲線の左右実表示・8音声WAV・自作両手の18描画は各独立レビュー記録にも保存した。

## P4と統合時の引き継ぎ

[WebGL45131376271](https://github.com/nagi300222/mamo-ken/actions/runs/45131376271) は全5成功。720×320、852×393、縦画面CSS横持ちで、5モード入口のスクロール、44px操作、選択プロフィール、Practice実対戦、3Dエディター、探索を確認。原画から37派生SVGを生成して出自を保持。最終20画像を独立レビューした。

これは独立UIレーンの検証。最新P1 native safe-rect・P2部品・P3実測の全積み版は、P1確認→P2実装/承認の後に統合する。Story main、AvatarFactory、共通HUDではP3の実測/反応とP4のタブ/旅札/入力表示を両方維持し、安全領域を再検査する。

`PRODUCTION_GATE.json` はP1本人確認pending、P2/P5/main merge falseのまま。本人の「P1確認OK」または具体的FBを受けてP2へ進む。P4全体の本人試遊後にP5へ。mainも既存Draftもマージしていない。

GHA画像/バイナリの保持は原則14日。GLB・比較動画・編集ソース・検証器・テキスト記録は各GitHub Draftに保存し、原成果物の実行SHA/ハッシュを残している。
