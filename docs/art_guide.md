# マモ拳（仮） アート制作ガイド v1.0

キャラアートの制作ルートと、画像生成AI用プロンプト（3キャラ分）をまとめる。

## 制作ルートの使い分け（推奨）

| 用途 | 推奨手段 | 理由 |
|---|---|---|
| 戦闘中のキャラ表示 | **現行のプログラム描画を維持** | 全モーション自在・容量ゼロ・色替え/拡縮自由。スプライト画像化するとポーズ枚数×3キャラ分の作画/管理コストが跳ねる |
| 立ち絵・キャラ選択・カットイン・キービジュ | **画像生成AI（無料枠）** or 同梱SVG | 一枚絵の質はAI生成が最も高い。SVGは軽量・編集自由で当面の代用に十分 |
| ストア用アイコン/バナー | 画像生成AI → 手動トリミング | |

Claude（このチャット）で作れるのはSVG＝ベクターイラストまで。写真調・厚塗り・手描き風の「絵」は画像生成AIの領分。

## 無料で使える画像生成ツール

| ツール | 無料枠 | 向き |
|---|---|---|
| **Bing Image Creator / Copilot** | 実質無制限（ブースト制） | 手軽。プロンプト貼るだけ。まずここで試す |
| **Leonardo.ai** | 毎日150クレジット | ゲームアセット系プリセットが充実。キャラ一貫性機能あり |
| **Recraft** | 無料枠あり | ベクター/ゲームアセット出力可。SVG書き出しできるのが独自 |
| **Stable Diffusion（ローカル）** | 完全無料・無制限 | PCがあるナギ向き。ComfyUI/A1111 + IPAdapter/Reference でポーズ差分のキャラ一貫性が最強。導入コストは高め |

## IP注意（04実装指示書の方針と同じ）

- ©YELLフィギュアの**写真を直接img2imgに入れない**。特徴を言語化した下記プロンプトでオリジナルとして生成する（方向性参照のみ）
- 生成物は商用利用可否を各ツールの規約で確認（Bingは商用不可条項に注意、Leonardo/SD系は基本OK）

## 共通スタイル（全キャラのベース）

```
chibi marmot fighter mascot, round bullet-shaped plump body, tiny round ears,
big sparkling black eyes, two prominent white front teeth, chubby cheeks,
short stubby arms and legs, vinyl toy figure style, glossy soft plastic texture,
thick clean outlines, soft studio lighting, simple flat background, full body,
front three-quarter view, game character concept art, cute but determined
```

```
Negative: realistic photo, human, extra limbs, long tail, thin realistic rodent,
text, watermark, logo, blurry, dark horror, hyperrealistic fur
```

## キャラ別プロンプト

### モグゾー（バランス）
```
(共通スタイル), light warm brown fur, cream belly, red headband with flowing
tails, classic boxer fighting stance with both fists raised, balanced sturdy build
```

### ピスケ（スピード）
```
(共通スタイル), pale sandy beige fur, slim taller build, blue wristbands,
leaning forward speedy jab pose with one paw thrust out, confident smirk,
subtle motion lines
```

### ゴダン（パワー）
```
(共通スタイル), dark chocolate brown fur, extra wide heavy low build,
black karate belt with knot, massive oversized fists held low, thick angry
eyebrows, gritted teeth, sumo-like grounded stance
```

## ポーズ差分の作り方

1. まず立ち絵1枚を「これ」と決める
2. 同じプロンプトの構図部分だけ差し替えて生成:
   - 攻撃: `throwing a straight punch toward camera, dynamic action pose`
   - ガード: `blocking with both paws crossed in front of face, braced`
   - やられ: `knocked back, dizzy spiral eyes, comical damage pose`
   - つかみ: `lunging forward with both open paws, grabbing motion`
   - 咆哮: `puffed up cheeks, mouth wide open roaring, shockwave effect`
   - 奥義: `dramatic finishing move, glowing aura, epic low angle`
3. 顔や色がブレるときは、決定した立ち絵を **reference/キャラ一貫性機能**（Leonardo: Character Reference / SD: IPAdapter）に入れて差分生成
4. 背景は `simple flat background` → 透過が必要なら remove.bg 等の無料背景除去

## ゲームへの組み込み（画像化する場合）

- 1キャラ = 立ち絵1 + 戦闘ポーズ6〜8枚 × 3キャラ ≒ 20〜27枚
- PNG（透過）512px程度で書き出し → `assets/chars/{id}/{pose}.png`
- ただし v1 は現行プログラム描画のままで問題なし。画像差し替えは描画関数の中身をdrawImageに置き換えるだけの設計にしてある（04実装指示書の描画分離方針どおり）
