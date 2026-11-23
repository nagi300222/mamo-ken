# Storyの既存奥義経路：CPUによる切り分け検証

リポジトリルートで、配信用アニメーションパックを生成してから実行する。

```sh
npm --prefix exp/fable-3d/dojo run build:pages
node --experimental-loader ./exp/fable-3d/custom/v16/tools/three-loader.mjs \
  exp/fable-3d/custom/v16/tools/verify-canonical-cinema-cpu.mjs
```

Storyの`canonicalCinemaActor`と同じく、元GLBの2プリミティブモデルを複製し、元37アニメーションと実manifestの攻撃・反応クリップをそのモデルへバインドする。編集用のモジュールアバターは映画用の役者に使わない。`createAuthoredCinematic`の9×9＝81組を生成・更新・終了・破棄し、各ショット／演技区間の開始時刻と0.5秒ごとの状態で、カメラと骨の数値、必須クリップ、終了時刻を検査する。

結果は `../evidence/canonical-cinema-cpu.json` に保存する。実行時刻や端末FPSは記録せず、再現可能な組み合わせごとの結果を保存する。

これはStoryで奥義が再生されない場合に、入力・ガード・ヒット確認と、映画構築失敗を分けるための検査。画像デコードはスタブで、WebGLコンテキストを生成しない。**GPU描画、部位ごとのMorph適用、shader、画質、スマホ性能の合格証拠にはしない。** 別の実ブラウザ検証が必要。
