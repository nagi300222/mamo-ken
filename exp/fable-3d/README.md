# マモ拳 3Dキャラクター実験（exp/fable-3d）

オリジナル格闘ゲーム「マモ拳」の全9キャラ（moguzo / pisuke / godan / hakuma / chirka / takimaru / yomikage / bullet / dark_moguzo）を、
スクリプトだけで再生成できるスタイライズド3Dモデルとして作る実験。骨格と、共通10モーション＋キャラ固有モーション1つ入りの GLB を Three.js で再生できる。
正本は [Issue #140](https://github.com/nagi300222/mamo-ken/issues/140)。

今回は「9体のモーションを比べられる初版」で、**造形の完成ではない**。再現度と残課題は [REPORT.md](REPORT.md) にある。3体だけだった時点の報告は [docs/REPORT_3chars_2026-11-21.md](docs/REPORT_3chars_2026-11-21.md)。

## 中身

| 場所 | 内容 |
|---|---|
| `chars/{id}/{id}.glb` | リグ・スキニング・共通10クリップ＋固有モーション入り（Three.js 用の納品物） |
| `chars/{id}/{id}.blend` | 編集可能な Blender ファイル（IK制御つき。Blender 5.3 で保存） |
| `chars/{id}/{id}_albedo.jpg` | テクスチャ（1024×1024、1枚） |
| `chars/{id}/{id}_motions.json` | モーション定義（フレーム数、発生・持続・硬直、移動量、ループ可否） |
| `chars/{id}/renders/` | 正面・横・斜め・背面、元絵との比較、トゥーン表示、左右の向き |
| `chars/{id}/motions/` | クリップごとの MP4 と、10本をつないだ `all.mp4` |
| `roster/` | 9体まとめ: 同じ縮尺の並び、元絵比較の一覧、四方向の一覧、並べて再生した動画 |
| `preview/` | Three.js プレビュー（GLTFLoader + AnimationMixer）。`index.html` は1体ずつ、`lineup.html` は9体を並べて同時再生 |
| `tools/` | 生成・書き出し・検証・撮影のスクリプト |
| `validation/` | GLB のデータ検証結果（JSON）と、変形確認の画像 |
| `docs/` | 参照画像の分析、リグ仕様書、モーションの追加方法 |

## 再生成の手順

必要なもの: Python 3.13、Node 22、ffmpeg、Chromium（Playwright）。Blender 本体は不要で、`bpy` を Python モジュールとして使う。

```bash
pip install bpy scikit-image scipy xatlas pillow numpy
```

9体の `.blend` / `.glb` / テクスチャ / モーションJSON を作り直す（1コマンド。1体あたり約20〜32秒、9体で約4分）:

```bash
python3 exp/fable-3d/tools/build_all.py
```

GLB を検証する（データの検査と、ヘッドレスブラウザでの再生確認。結果は `validation/*.json`）:

```bash
node exp/fable-3d/tools/validate.mjs
```

プレビューの操作パネル（キャラ選択、1フレーム送り、クロスフェード、トゥーン切替など）を実際にクリックして確かめる:

```bash
node exp/fable-3d/tools/ui_check.mjs
```

画像と動画を撮り直す（Three.js プレビュー経由。変形確認シートには `--deform-test` つきのビルドが必要）:

```bash
python3 exp/fable-3d/tools/build_all.py --cache --deform-test
```

```bash
node exp/fable-3d/tools/capture.mjs
```

よく使うオプション:

- `build_all.py --only moguzo` … 1体だけ（`--only hakuma,bullet` のように複数も可）
- `build_all.py --cache` … メッシュとテクスチャを `_scratch/` に保存して再利用する。モーションだけ直すときは1体3秒ほどで終わる
- `build_all.py --clips idle,crouch` … 一部のクリップだけ（省略時は共通10種＋そのキャラの固有モーション）
- `shots.mjs --char moguzo --poses stand_light:4,crouch:30` … 任意のフレームを4方向から撮る（調整用）

`_scratch/` は中間ファイル置き場で、コミットしない。

## プレビューの開き方

`preview/` は相対パスで `chars/` を読むので、`exp/fable-3d` を静的サーバーで配信して開く。

```bash
python3 -m http.server 8765 --directory exp/fable-3d
```

ブラウザで `http://localhost:8765/preview/index.html`（1体ずつ）か `http://localhost:8765/preview/lineup.html`（9体を並べて同時再生）を開く。Three.js は `preview/vendor/` に同梱してあり、外部への通信はない。

できること: キャラ選択、アニメーション選択、一時停止、スロー（×0.5 / ×0.25 / ×0.1）、1フレーム送り、シーク、
クロスフェード時間の調整、単発モーション後に idle へ戻す、移動量の適用、ボーン表示、ワイヤーフレーム、トゥーン表示、
左右の向き（ミラー／回転）、カメラ角度の切替とドラッグでの回転。

## 制約として守ったこと

- 参照したのは `assets/portraits/{id}.png`、`assets/roster3d/{id}.webp`、`assets/ui/facesq_{id}.png` だけ。旧 `assets/chars` は使っていない。
- 既存の `src` / `assets` / `dist` などは変更していない。成果物はすべて `exp/fable-3d/` 以下。
- 使ったのは無料のローカルツールだけ（bpy, numpy, scipy, scikit-image, xatlas, Pillow, three.js, Playwright, ffmpeg）。画像を外部サービスへ送っていない。
