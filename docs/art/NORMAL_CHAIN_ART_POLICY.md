# Normal Chain Limit — アート実装参照

更新日: 2026-08-08

この文書は戦闘runtime側で追加される「通常打撃最大連続回数」が、
アート再生へ与える影響をまとめたもの。

**戦闘runtime / BAL / cancel timing が正。**
この文書はアート実装側の参照であり、戦闘数値のauthorityを奪わない。

## キャラ別 Normal Chain Limit

| charId | Character | Max normal-chain hits |
|---|---|---:|
| moguzo | モグゾー | 3 |
| piske | ピスケ | 4 |
| godan | ゴダン | 2 |
| hakuma | ハクマ | 2 |
| chilka | チルカ | 3 |
| takimaru | タキマル | 2 |
| yomikage | ヨミカゲ | 2 |
| bullet | バレット | 3 |
| dark_moguzo | ダークモグゾー | 4 |

対象通常打撃:
- crouch attack
- MID
- HIGH
- LOW

コマンド技の多段hit数とは別物。

## 1×4通常打撃の基本frame意味

- F1 = startup前半
- F2 = startup後半
- F3 = active / hit key pose
- F4 = recovery

この基本意味は維持する。

## Chain cancel時の重要ルール

通常打撃がHITし、合法な次の通常打撃へchain cancelした場合:

- F4を必ず最後まで見せる必要はない
- BAL / cancel timingを正として遷移する
- `F3 → 必要なrecovery表示 → 次技F1` を許可する
- recoveryが短い場合、F4は短時間表示または省略され得る
- 画像枚数に合わせてstartup / active / recovery / cancel timingを変更してはいけない

## 追加アート

Normal Chain Limit導入だけを理由に以下を作らない:

- 新規中割り
- chain専用frame
- transition専用画像

まず既存1×4 + runtime補間で成立させる。

許可:
- F3の短いhold
- F4の短縮
- 次技F1への直接遷移
- render-only offset
- position補間
- ごく軽いscale補間

実機で「身体の接続が明確に破綻し、技意図を損なう」接続だけ後日追加アート候補にする。

## Knockback / 攻守リセット

共通ノックバック量はまだ未確定。

そのためアート側では:

- 移動距離を画像へ焼き込まない
- sprite sheetのキャンバス上の移動量をgameplay distanceとして解釈しない
- runtime側のposition補間で対応できる構造を維持
- bodyBounds / visualBoundsをknockback distanceへ流用しない
- 将来の共通ノックバック仕様決定後にpresentation mappingだけ接続する

## Deterministic

chain中のframe選択も:
- simulation phase
- pf
- cancel state / simulation frame

のみから決定する。

wall-clock timerやpresentation側の独自timerでchain frameを進めない。
