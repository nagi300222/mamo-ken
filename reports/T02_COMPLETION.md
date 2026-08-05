# T02 Completion — Core型・定数レイヤー

## PR / commit

- PR: #21 (`codex/-t02-core-0ltp2r`, Draft)
- Codex implementation source commit: `09d7845e2fb5cd96fd3473fea854251d71ffbf6e`
- GitHub import head before Hub corrections: `16bfa2753eddaa1105324e2b3a45ea2ebeaa4f0a`
- Source of truth: `docs/03_data_design.md` v2.7, T00 reports, and the PR #20 HOLD review carried forward into PR #21.
- Superseded drafts: #19, #20 (closed without merge).

## Exact changed files

- `.github/workflows/core-check.yml`
- `package.json`
- `package-lock.json`
- `tsconfig.json`
- `src/core/constants.ts`
- `src/core/determinism.ts`
- `src/core/index.ts`
- `src/core/types.ts`
- `src/core/validation.ts`
- `test/core-spec.test.mjs`
- `reports/T02_COMPLETION.md`
- `reports/FABLE5_ROLLUP.md`

## Numeric / runtime / protocol diff

- Runtime behavior diff: 0. `prototype/mamoken_prototype_v01.html`, `index.html`, `dist/mamoken_mobile.html`, `server`, `assets` are not intentionally changed by T02.
- Existing BAL numeric diff: 0. Core `BAL` references `reports/current_impl_constants.json` instead of maintaining a second hand-copied BAL source.
- Online protocol diff: 0. Server and wire protocol are unchanged.
- Server/assets/dist diff: 0 after reverting audit/build side effects.
- Gyuiin legacy values: preserved as T00 snapshot data for T06 input; not rebalanced in T02.

## Required fixes completed

- Added current phase `clash` and checks `reports/current_impl_phases.json` fighter phases / battle flows structurally.
- Split archetypes into `CurrentArchetypeId = standard | rush | power` and `PlannedArchetypeId = defense | tricky | grappler | counter | charge`.
- Added `MoveSpec`, `CommandMoveSpec`, `CharacterCombatSpec`, and validators for current normal attacks, current `CMD.moves`, and current characters.
- Single-sourced current runtime constants from `reports/current_impl_constants.json` with typed exports.
- Added TypeScript as a devDependency and lockfile entry for clean-clone reproducibility.
- Hardened `stable-json-v1` to reject Date, Map, Set, class instances, sparse arrays, symbol keys, and other ambiguous values.
- Added P1/P2 swap fixture: fighter tuple swap + input player 0/1 mapping must remain mirror-equivalent after normalization for 10,000F.
- Hash target excludes `lastHash` through `HashableBattleState` / `toHashableBattleState`.
- Added GitHub Actions `Core contract check` so `npm ci`, core tests, audit, mobile build, and scoped-diff checks run in a clean Linux environment.

## 10,000F / negative / swap results

- Baseline 10,000F final hash: `7a28953f`.
- P1/P2 swap normalized hash: `7a28953f`.
- Changed seed final hash: `4727347e`; divergence frame: 1.
- Changed input final hash: `f11b781c`; divergence frame: 4096.

## source/dist specVersion handling

- T02 adds `CORE_SPEC_VERSION = core-spec-v1` only in `src/core/constants.ts`.
- Runtime source and generated dist are not changed; no source/dist runtime specVersion is introduced in T02.

## Preserved legacy / blockers

- Legacy phase names remain isolated in `LegacyFighterPhase`; they are not added to current hashable state.
- Codex sandbox-only limitations: npm registry and direct GitHub push returned 403. These do not alter repository scope or runtime behavior.
- Merge gate: GitHub Actions `Core contract check` must pass on PR #21 before merge.
