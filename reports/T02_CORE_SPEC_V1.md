# T02 Core型・定数レイヤー 実装記録

## Scope

T02では、既存ランタイム挙動を変更せずに、将来のDOM非依存core移行で参照する型・定数・決定論ヘルパーの土台を追加した。

## Added

- `src/core/types.ts`: `docs/03_data_design.md` §2.1〜2.3 の基本ID、phase、flow、入力、状態型。
- `src/core/constants.ts`: `reports/current_impl_constants.json` および `docs/03_data_design.md` §16 の現行BAL値を固定したcore定数。
- `src/core/determinism.ts`: seed更新を返す `mulberry32`、キー順を固定する `stableStringify`、状態hash用 `fnv1a32` / `stateHash`。
- `test/core-spec.test.mjs`: 現行実装snapshotとcore定数の同期、決定論ヘルパーの禁止API境界を検査。

## Non-goals

- `prototype/`, `dist/`, `server/`, `assets/` は変更しない。
- ランタイム挙動、BAL値、オンラインプロトコル、生成済みdistは変更しない。
