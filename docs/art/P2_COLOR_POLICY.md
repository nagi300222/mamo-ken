# 2Pカラー Code実装仕様

目的: 形状・顔・毛束・装身具位置を一切変えず、毛色と装身具色だけでP1/P2を瞬時に区別する。奇抜・蛍光・不自然な動物色にはしない。

## 共通ルール
- geometry/alpha/lineart/shading境界はP1と完全同一。
- 変更対象: main fur / secondary fur / permanent accessory color。
- 原則維持: eyes, nose, claws, outlines。木の実等の自然素材は小変化まで。
- fur hue shiftは概ね20°以内、Value ±10%程度、Saturation ±15%程度を初期上限。
- 装身具は識別性のため大きめの色相変更を許可するが、彩度を上げすぎない。
- 全フレームで同一のdeterministic palette transform。
- VFX色はこの処理に含めない。

## 推奨P2方向
- Moguzo: 毛を少しcool walnut、赤ハチマキ→muted deep blue。
- Piske: 砂色を少しwarm gray/tan、青リストバンド→muted teal / violet。
- Godan: chocolate→slightly red-russet dark brown、黒帯→very dark navy/burgundy。
- Hakuma: gray-beige→slightly warmer taupe、deep-green scarf→muted burgundy/navy。
- Chilka: straw gold→slightly pale golden-beige、purple cord→muted teal。
- Takimaru: silver-gray→cool blue-gray、yellow rope→muted brick/rust。
- Yomikage: gray-brown→cool slate-brown、white wrapはoff-white/light tan程度（奇抜色禁止）。
- Bullet: red-chestnut→deeper copper/russet、cord→muted teal。木の実はnatural woodを維持。
- Dark Moguzo: black-purple→deep blue-black、gray-taupe chest→cool gray、wine-red headband→muted indigo/dark crimson差分。

実機でP1/P2を並べ、顔が別人に見えたら変換量を下げる。
