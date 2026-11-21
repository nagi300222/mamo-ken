# モーションの追加・修正のしかた

モーションは Blender を手で操作せず、`tools/mamo3d/motions.py` に「キーポーズの並び」を書いて作る。
ビルドすると、ポーズが IK 制御ボーンのキーになり、尻尾や垂れ布の揺れが自動で足され、GLB に焼き込まれる。

## 全体の流れ

1. `motions.py` に関数を1つ足す（下の例）。
2. `make()` の辞書に登録する。納品GLBに入れるなら `CLIPS` にも足す（検証スクリプトの期待本数も合わせる）。
3. ビルドして、気になるフレームを撮って確認する。

```bash
python3 exp/fable-3d/tools/build_all.py --only moguzo --cache
```

```bash
node exp/fable-3d/tools/shots.mjs --char moguzo --poses stand_light:4,stand_light:10 --out exp/fable-3d/_scratch/shots
```

`--cache` をつけると造形とテクスチャを使い回すので、1体3秒ほどで GLB まで出る。
動きはプレビュー（`preview/index.html`）でスロー再生・1フレーム送りして確認する。

## ポーズの書き方

基準は `neutral(cid)`（構え）。そこから変えたい部分だけを `merge()` で上書きする。
数値は体格に依存しない単位なので、同じ記述が3体（と今後のキャラ）にそのまま使える。

| 項目 | 単位と意味 |
|---|---|
| `pelvis=pel(n0, (横, 前, 上), (前傾, 左向き, 左傾き))` | 位置は脚の長さを1とした差分、回転は度の差分 |
| `spine` / `chest` / `neck` / `head` | (前傾, 左向き, 左傾き) 度。`add(n0['chest'], (...))` で構えからの差分にする |
| `handL` / `handR` の `pos` | 肩から (外, 前, 上)。腕の長さを1とする。0.97 でほぼ伸び切り |
| `hand` の `space` | 省略時は胸について動く。`'world'` は体の向きに関係なく正面基準（攻撃の狙い）。`'root'` は床基準（手を地面につく） |
| `hand` の `fwd` / `back` | 拳の「指の付け根が向く方向」と「手の甲が向く方向」。`back=(0,0,1)` 付近で横拳 |
| `hand` の `elbow` | 肘を逃がす方向 |
| `footL` / `footR` | `foot(n0, 'footL', (外, 前, 上), yaw=, pitch=, knee=)`。`pitch` はかかとを上げる角度（つま先は接地したまま） |
| `tail=(上げ, 左右)` | 尻尾の基本角度。揺れは自動 |
| `keys=dict(n0['keys'], blink=1.0, ...)` | シェイプキー（`paw_open_L`, `paw_open_R`, `blink`, `brow_angry`） |

左右の手足は同じ書き方で対称になる（「外」は体の中心から離れる向き）。

## 例: 前手のジャブ（`stand_light` を簡略化したもの）

```python
def stand_light(cid):
    n0 = neutral(cid); st, ac, N = 4, 3, 18          # 発生4F・持続3F・全体18F
    wind = merge(n0, pelvis=pel(n0, (0, -0.03, -0.02), (0, 6, 0)), chest=add(n0['chest'], (0, 8, 0)),
                 handL=hand(n0, 'handL', (0.04, -0.12, 0.02)))
    hit = merge(n0, pelvis=pel(n0, (0, 0.10, -0.04), (6, -14, 0)), chest=add(n0['chest'], (4, -16, -3)),
                handL=dict(space='world', pos=(-0.14, 0.96, 0.02), fwd=(0, 1, 0), back=(0.2, 0, 1), elbow=(0.9, -0.1, -0.4)),
                footR=foot(n0, 'footR', pitch=14))
    keys = [(0, n0), (st - 2, wind, 'out'), (st, hit, 'in'), (st + ac, hit, 'lin'), (N, n0, 'io')]
    return dict(frames=N, loop=False, fn=keyed(keys), info=dict(startup=st, active=ac, recovery=N - st - ac))
```

- キーは `(フレーム, ポーズ, 入りの緩急)`。緩急は `lin` / `io`（ゆっくり入りゆっくり止まる）/ `in`（加速）/ `out`（減速）。
- 最初と最後を `n0` にすれば、idle から始まり idle に戻る。
- 腰と胸の回転、後ろ足のかかと上げを一緒に入れておくと、腕だけが伸びる動きにならない。
- 歩きのような周期運動は、キーの代わりに `fn(frame)` を直接書く（`walk()` を参照）。

## キャラごとの差

- 構えの違い（腰の向き、足幅、手の位置、呼吸の速さ、歩幅）は `STYLE[cid]` の数値だけで分けている。
- 動きそのものを変えるとき（`stand_heavy` のように内容が別物）は `if cid == ...` で分岐する。

## 自動でやってくれること／やってくれないこと

| 自動 | 手で気にする |
|---|---|
| 肘・膝の IK、手が届かないときの補正（ビルドログに `warn ... reach` が出る） | 手や足を体にめり込ませない位置決め（貫通チェックは無い） |
| 手を上げ・前へ出したときの肩（鎖骨）の持ち上げ | 重心の説得力、緩急 |
| 尻尾・ハチマキ・帯の揺れと、ループの継ぎ目・終端の収束 | ポーズが体型に合っているかの確認（特に重量級のしゃがみ） |
| 補助ボーン（肩・股・前腕のひねり） | |
| ループの継ぎ目・idle への復帰・足が床より下へ行かないことの検証（`validate.mjs`） | |

## 所要時間の目安（今回の実績ベース）

- 3〜5個のキーポーズで作る単発モーション1本: 記述に10〜20分、撮って直す反復が3〜6回（1回あたりビルド3秒＋撮影10秒＋目視）。
  1キャラ目で30〜60分、同じ動きを他キャラへ広げるのは体型に合わせた微調整で1キャラ10〜20分。
- 歩きのような周期運動や、手を床につくような接地の多い動き: 1〜2時間。
- 動きの良し悪しを判断する時間は別。数値でポーズを書くので、ひねりの効いた動きや見栄えのする中割りは、
  手付けのアニメーターが Blender で作るより試行回数が要る。

## roster9 での追加

- キャラ固有モーションは `sp_` で始まる名前にし、`UNIQUE` 辞書へ `キャラID: (クリップ名, 関数)` で登録する。ビルドは共通10種＋固有を自動で入れる。
- キャラの個性は `STYLE[cid]` に足す。`heavy`（強攻撃の型: `straight` / `kick` / `hammer`）、`heavy_k`（その時間倍率）、`light`（弱攻撃の発生・持続・全体）、
  `big`（重量級の移動）、`crouch`（沈み・前傾・手の届く距離）、`paw_open`（手を開いて構える）、`brow`（眉の初期値）、`wide`（肘を張る）。
- 長い尻尾は `tail_bones`（ボーンごとの上げ・左右の角度）で形を決める。攻撃で尻尾をキーの形へ寄せたいときは、クリップに `tail_follow`（0〜1）と `tail_stiff` を付ける。
  `measure_tail=True` を付けると、尻尾先端の軌道と最大リーチが `{id}_motions.json` に記録される。
- 既存キャラの動きを変えていないことは次で確認できる（共通コードを触ったあとに使う）。

```bash
node exp/fable-3d/tools/regress.mjs save exp/fable-3d/_scratch/regress_base.json
```

```bash
node exp/fable-3d/tools/regress.mjs compare exp/fable-3d/_scratch/regress_base.json
```
