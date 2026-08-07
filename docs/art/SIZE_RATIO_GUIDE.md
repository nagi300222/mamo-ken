# キャラクター表示サイズ比・bodyBounds方針

基準: モグゾー = height 1.00 / width reference 1.00。

| Character | Height | Width reference | 扱い |
|---|---:|---:|---|
| Moguzo | 1.00 | 1.00 | 基準 |
| Piske | 1.03 | 0.90 | 初期候補。少し高く細身 |
| Godan | 1.08 | 1.25 | 幅広・低重心の見た目目標 |
| Hakuma | 1.05 | 1.18 | 固定 |
| Chilka | 0.98 | 1.00 | 固定 |
| Takimaru | 1.07 | 1.14 | 固定 |
| Yomikage | 1.00 | 0.95 | 固定 |
| Bullet | 1.03 | 1.10 | 尾を除くbodyBounds基準 |
| Dark Moguzo | 1.00 | 1.00 | Moguzoと完全同体格 |

## 実装ルール

1. まず等比 `battleScale` で身長感を合わせる。
2. 足元anchorを統一する。
3. `visualBounds` は見えている全要素、`bodyBounds` はキャラクター本体として別々に持つ。
4. width referenceは「見た目の目標」。数値へ合わせるために横方向へ強制stretchしない。
5. 非等比補正は必要な時だけ。目標±2%、最大±4%。
6. 旧 `POSE_SCALE_CORRECTION` を新素材へ二重適用しない。legacy fallback専用に寄せる。
7. bodyBoundsは描画補正専用。当たり判定・reach・hurtboxへ逆流させない。

## Bullet

長い尾はvisualBoundsへ含めるが、bodyBoundsから除外する。
尾込みの全幅に合わせてスプライトを縮小してはいけない。

## Yomikage

頭を小さくする、胴脚を伸ばす方向の補正は禁止。
画像側の軽い頭身揺れは強いlocal warpで直さず、全体scale/anchorで吸収し、残りは後日差し替える。
