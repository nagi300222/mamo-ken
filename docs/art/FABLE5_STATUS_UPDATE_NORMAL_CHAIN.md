# Fable5 / 戦闘設計側への追加共有 — Normal Chain Limit

2026-08-08

Normal Chain Limit追加をアート側へ反映済み。

## 設定
- Moguzo 3
- Piske 4
- Godan 2
- Hakuma 2
- Chilka 3
- Takimaru 2
- Yomikage 2
- Bullet 3
- Dark Moguzo 4

対象: crouch attack / MID / HIGH / LOW。
コマンド技の多段hitとは別。

## アート対応
追加画像なし。

合法chain cancel時:
F3 -> 必要なrecovery表示 -> 次技F1

を許可し、F4完走を要求しない。
BAL / cancel timingがauthority。

## Knockback
共通ノックバック / 攻守リセットの距離はまだアート側で固定しない。
画像へ移動距離を焼き込まずruntime position補間で対応する。
