# マモ拳 P4 UI アート v18（磨き r1・Claude 制作）

P4 の独立評価（Issue #220）を受けた素材の作り直し。基準は PR #222 の `1391c49`。`ui-art/v17` は読むだけで変更していない。
ここにあるのは**素材と決めごとだけ**で、ゲームの JS / CSS は含まない（実 UI の実装は Codex 担当）。文字は素材に焼き込んでいない。キャラは全員マーモット。

## 入っているもの

| 種類 | ファイル | 用途 |
|---|---|---|
| モードの絵 5 種 | `png/mode-{vs,practice,arcade,survival,story}.webp`（1280×480、透過） | モードカードの絵。表示の基準は 640×240 |
| 大きい対戦カード用 | `png/mode-vs-large.webp`（960×720、透過） | 4:3 の大きい対戦カード。表示の基準は 480×360 |
| 予備 | `png/mode-*.png`（1 倍の透過 PNG） | WebP を使わない場合 |
| 縮小確認 | `png/mode-*@thumb.png`（180×80） | 縮小しても見分けられるかの確認用。小さな枠にそのまま使ってもよい |
| 記号 6 種 | `svg/sym-{select,confirm,back,disabled,save,paw}.svg`（24×24、`currentColor`） | 選択・決定・戻る・使用不可・保存、前足カーソル |
| 状態の装飾 5 種 | `svg/state-{focus,selected,pressed,disabled,saved}.svg`（96×64、9 スライス） | 色ではなく形で区別する枠 |
| UI 音 4 種 | `audio/ui-{select,confirm,back,save}.wav`（モノラル 44.1kHz 16bit） | 選択・決定・戻る・保存 |
| 決めごと | `tokens.json` `motion.json` `manifest.json` `audio/audio.json` | 色・寸法・状態、動きと音の対応、全素材の一覧（用途・寸法・バイト数・sha256） |
| 編集元 | `source/mode-*.svg` `source/cutouts/*.png` `tools/` | 作り直し用 |
| 合成イメージ | `preview/menu_720x320.png` `menu_852x393.png` `menu_720x320_states.png` `originals_sheet.png` | 使い方の見本と原画一覧 |

配る分（モードの絵 WebP 6 枚・記号・装飾・音）の合計は 193,709 バイト。

## モードの絵

5 枚とも構図・主役・色が違う（同じ札の色替えではない）。主役は元の 9 体の GLB から描いた切り抜き。

| モード | 絵 | 主役 | 180×80 で残る特徴 |
|---|---|---|---|
| 対戦 `vs` | 土俵で 2 体が向き合い、あいだで前足がぶつかる火花。両陣の旗（赤い三角・青い四角） | モグゾー × ゴダン | 向き合う 2 体と火花、橙 |
| 稽古 `practice` | 朝の道場の庭。巻き藁（稽古柱）の的へ打ち込む。数え札、竹垣 | ピスケ | 1 体と的の柱、緑 |
| 連戦 `arcade` | 山道の石段を上へ。段ごとに次の相手と灯ろう（点の数 1・2・3）、山頂の旗 | チルカ（相手: バレット・ヨミカゲ・タキマル） | 斜めに上がる階段と並ぶ相手、紫 |
| サバイバル `survival` | 夕日の中、ひとりを黒い影が囲む。足もとに倒した数の刻み | ハクマ（影: 4 体） | 夕日の丸と囲む黒い影、赤 |
| 旅 `story` | 朝日へ続く山道を歩く後ろ姿。道しるべ、旅札、足あと | モグゾー（後ろ姿） | 朝日と道と後ろ姿、橙〜青緑 |

置き方（`tokens.json` の `modeArt`）:

- 横長のカード（8:3 前後）: 左の x 20〜300・y 18〜222（640×240 基準）が**文字を置く範囲**。絵は低密度で、左ほど濃いうす暗がりを重ねてある。主役は x 310 より右。
- 幅が狭いカード（9:5 前後）: `background-size: cover; background-position: right center` で右寄せに切り、文字は下辺に置いて下から上への暗いグラデーションを重ねる（顔は上 6 割にある）。`preview/menu_*.png` の 4 枚の小カードがこの置き方。
- 大きい対戦カード: `mode-vs-large` を使う。文字は左上（x 18〜228・y 16〜136、480×360 基準）、ボタンは左下（x 14〜174・y 292〜346）。`background-position: right bottom`。
- 角は半径 16（640 基準）で透過にしてある。CSS で角丸を付け直してもよい。

## 記号と状態

記号は線と形で意味を分けている: 選択 = 前足が指す矢印、決定 = 丸い判の中の前足、戻る = 巻いて引き返す矢印、使用不可 = 斜線の入った札、保存 = 刻みの入った旅札。16px まで使える。

状態は色に頼らず形が違う（`preview/originals_sheet.png` の下に白黒にした比較がある）:

| 状態 | 形 | 重ね方 |
|---|---|---|
| focus | 四隅の角金具（辺の中央は空く）＋左外に前足カーソル `sym-paw` | 枠の外側 4px、`border-image: … 26 stretch`、1.03 倍 |
| selected | 全周の二重線＋右上の丸い判（チェック） | `border-image-slice: 28 30 14 14` |
| pressed | 上と左に濃い内影 | `slice: 14`、0.97 倍 |
| disabled | 破線の枠＋右上の「−」の丸。絵は彩度と明るさを落とす | `slice: 28 30 14 14`、`border-image-repeat: round` |
| saved | 下辺の線＋右下の小さな旅札 | `slice: 10 30 22 12` |

## 動きと音

`motion.json` に、focus 120ms／press 80ms／release 110ms／confirm 160ms／back 140ms／画面の出入り 180ms・120ms／使えない項目 160ms／保存 180ms の値と、`prefers-reduced-motion: reduce` で外すもの（拡大・移動・揺れ。色・枠・記号の切り替えだけ残す）を書いた。動きは見た目だけで、入力は動きの終わりを待たない。

音は数式だけで作った木札・木の拍子・小さな鈴の音（録音素材や他作品の音は使っていない）。ピークは −12〜−15dBFS、長さは 70〜340ms。1 回の操作で鳴らす音は 1 つ。

## 作り直し方

```bash
cd exp/fable-3d/ui-art/v18
node tools/render_cutouts.mjs        # 元の GLB から切り抜きを描く（tools/cutouts.json の一覧）
python3 tools/build_ui_art_v18.py    # source/mode-*.svg、svg/*.svg、tokens.json
node tools/render_outputs.mjs        # png/*.webp と *.png
python3 tools/make_ui_sounds.py      # audio/*.wav
python3 tools/finalize.py            # manifest.json
node tools/render_preview.mjs        # preview/*.png
```

`manifest.json` の `file` はこのフォルダ（`exp/fable-3d/ui-art/v18/`）からの相対パス。

## 確認したこと・していないこと

- 確認した: 640×240・180×80・90×40 の縮小表示を目で見て、5 枚が別物に見えること。720×320 と 852×393 の合成イメージで、日本語の題と説明が主役の顔に重ならないこと。状態 5 種が白黒でも区別できること。音は波形の数値（長さ・ピーク・終わりの無音）だけ。
- していない: **音を耳で聴く確認**（この環境では再生できない。音色と大きさは実機で要確認）。ゲームへの組み込み、実機での表示。合成イメージは見本で、実 UI ではない。
- 既知: 合成イメージの前足カーソルは画面の左端で少し切れている（見本側の置き位置の問題）。16px の `sym-select` は前足の細部がつぶれる（矢印の形は残る）。
