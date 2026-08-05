# T02 Core型・定数レイヤー 実装記録

## Scope

T02では、既存ランタイム挙動を変更せずに、将来のDOM非依存core移行で参照する型・定数・決定論ヘルパーの土台を追加した。

## Current / provisional / legacy boundaries

- `Current*` 型はT00 snapshotおよび現行prototypeで確認済みの3キャラ、phase、flowだけを表す。
- `Provisional*` 型は `docs/03_data_design.md` の将来分解名・8アーキタイプ計画を表し、current contractへ混ぜない。
- `Legacy*` 型は旧実装・廃止概念を隔離し、現行hash対象stateには入れない。
- `CURRENT_CONTRACT` は `reports/current_impl_constants.json` から機械比較できる構造で、`BAL`, `SG`, `CLASH`, `NET`, `AIDIFF`, `CMD.moves`, current character fieldsを保持する。

## Canonical serialization / hash

- stable serialization versionは `stable-json-v1`。
- object key順はlocale非依存のUTF-16 code-unit比較で固定する。
- hash対象では `undefined`, `NaN`, `Infinity`, `BigInt`, function, symbol, cyclic referenceを拒否する。
- `BattleState.lastHash` は自己参照hash chainを避けるため `HashableBattleState` / `toHashableBattleState` で除外する。
- UI、通信待機、描画、VFX、SEなどの一時情報はT02 hashable stateに含めない。

## Tests added

- T00 snapshotと `CURRENT_CONTRACT` / `BAL` / `CURRENT_CHARACTERS` / `CURRENT_CHARACTER_IDS` の構造deepEqual。
- `tsc --noEmit` によるTypeScript strict型検査。
- `mulberry32` 既知ベクトル、`stableStringify` key順・拒否値、`fnv1a32`, `stateHash` 同値/差分、`lastHash` 除外の実行テスト。
- 独立2状態を同seed・同入力列で10,000F進める決定論テスト。
- seed変更および4096F目の入力変更でhashが分岐するnegative case。

## 10,000F result

- Baseline final hash: `7776b8f4`。
- Changed seed final hash: `e2ab513e`、divergence frame: 1。
- Changed input final hash: `1859c893`、divergence frame: 4096。

## Non-goals / known constraints

- `prototype/`, `server/`, `assets/` は変更しない。
- Runtime挙動、既存BAL値、online protocol、server、assets、生成済みdistの挙動は変更しない。
- T02のdeterministic stepはcore境界テスト用の最小pure reducerであり、現行戦闘ロジックの移植ではない。
