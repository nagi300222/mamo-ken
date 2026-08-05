# Fable5 Rollup — T00 / T00.1 / T02 / T03 / T04

## PRs and SHAs

| Task | PR | SHA / state | Purpose |
|---|---:|---|---|
| T00 | #17 | merged | Audit tool and generated current implementation reports. |
| T00.1 | #18 | merged | Correct source/dist comparison source for audit reports. |
| T02 | #21 | merged as `66b13bcbeb5bd53a41d63e8236cd53b1a16ca48c` | Core types, current constants, validation, stable serialization, hash, and determinism fixtures. |
| T03 | #25 | merged as `090c7ffe2f7bad3e88db342e83e801fffe43a0df` | Pure normalized input history, command matching, conflict resolution, and command prebuffer contracts. |
| T04 | #26 | Draft; implementation head before reports `a12095f53024fe3433009cb92921e974536b38c5` | MoveSpec migration, current combo compatibility, provisional Capacity/repeat/height contracts, and deterministic combo evaluator. |

Superseded T02 drafts #19 and #20 were closed without merge. Issue #23 preserved the unpublished first T03 attempt and was closed after PR #25 merged.

## Tests / verification inputs

- GitHub Actions `Core contract check` — clean Linux checkout with Node.js 24.
- `npm ci` — validates `package-lock.json` and installs local TypeScript / Sharp dependencies.
- `npm run check:core` — TypeScript strict check plus Core snapshot/determinism tests.
- `npm run check:command` — T03 input-history, matching, conflict, timing, P1/P2, and 10,000F tests.
- `npm run check:combat` — T04 MoveSpec migration, combo compatibility, provisional rules, validators, and 10,000F tests.
- `node tools/audit_current_impl.mjs` — T00 snapshot and source/dist contract audit, before and after build.
- `npm run build:mobile` — validates the existing mobile build path without committing generated differences.
- `git diff --check` — whitespace/diff sanity.
- Scoped diff check for `prototype/mamoken_prototype_v01.html`, `index.html`, `dist/mamoken_mobile.html`, `server`, and `assets`.

## T02 judgment material

- Current constants are referenced from T00 `reports/current_impl_constants.json` rather than manually re-copied.
- Current phase and flow lists are compared against T00 `reports/current_impl_phases.json`.
- Validators cover normal move specs, command move specs, and current character combat fields.
- Determinism fixtures cover same-seed replay, negative seed/input divergence, and P1/P2 swap mirror equivalence through 10,000F.
- Baseline and normalized swap hash: `7a28953f`.
- Changed-seed hash: `4727347e` (divergence frame 1).
- Changed-input hash: `f11b781c` (divergence frame 4096).

## T03 judgment material

- Normalized input events carry numeric `frame`, `order`, and `player` fields.
- Direction press/release updates pure direction and hold histories; parser code has no DOM, Canvas, Audio, timer, locale, wall-clock, or random dependency.
- Current timing remains `24F` direction history and `12F` command prebuffer, sourced from `CURRENT_CONTRACT.bal.CMD`.
- Provisional timing is isolated: gap `18F`, 3-direction `28F`, 4-direction `38F`, final grace `10F`, same-direction gap `2F`, hold detect `30F`, charge complete `45F`.
- Current nine commands are generated from `CURRENT_CONTRACT.bal.CMD.moves`, not hand-copied.
- Prebuffer boundary: `0F immediate`, `11F queued`, `12F queued`, `13F rejected`.
- Parser 10,000F hash: `f5a7abc5`; changed same-frame order diverges at frame `731`.
- P1/P2 fixture consumes logical directions and does not mirror inside the parser.
- Runtime, BAL, current nine moves, online protocol, server, UI, assets, and dist behavior remain unchanged by T03.

## T04 judgment material

- `CombatMoveSpec` and `CombatCharacterSpec` represent the v2.7 target contracts without replacing T02's audited runtime types.
- Current crouch/mid/high/low records source Startup, Active, Recovery, Damage, Telegraph, runtime weight, S gains, and chain constants from `CURRENT_CONTRACT.bal`.
- Current contact-frame audit is fixed as `startupF + 1`: crouch 11F, mid 15F, high 23F, low 31F.
- Current chain compatibility remains max 3Hit, 14F cancel window, ascending runtime weight, scales `[1.0, 0.9, 0.8]`, counter route `[1.0, 1.0, 0.9]`, and one 0.5 down followup.
- Current route fixtures: `中→上→下 = 280`, `しゃがみ→中→上 = 193`, counter `中→上→下 = 323`, low down followup `75`.
- Capacity, Weight classes, target Hit scales, minimum scale, repeat damage/hitstun/roar decay, and style height limits remain isolated in `provisional` profiles.
- Reach/Knockback conceptual mappings, crouch target level mapping, and per-move target cancel arrays are not silently promoted to confirmed runtime behavior.
- Combat 10,000F hash: `7fab5c7a`; changed route hash `b9bd6d05`; divergence frame `731`.
- Runtime, BAL, current normals/combo, command moves, online protocol, server, UI, assets, and dist behavior remain unchanged by T04.

## T05 / T06 handoff material

- T05 can consume T03 input resolution and T04 MoveSpec/combo contracts while preserving current/provisional separation.
- Crouch target level mapping and Reach/Knockback migration should be resolved with defense/evasion/contact semantics, not by editing current BAL in T04.
- Runtime integration remains a separate scoped PR with online long-run determinism regression.
- T06 should consume preserved Gyuiin/minigame legacy values from T00 snapshot; T02–T04 intentionally do not rebalance them.

## Gate

- T02: merged after `Core contract check` success.
- T03: merged after PR #25 `Core contract check` success and scoped runtime/BAL/protocol diff 0.
- T04: `MERGE_GO` only after PR #26 `Core contract check` passes and scoped review confirms runtime/BAL/protocol diff 0.
- T05: start after T04 merge.
- T06 inputs: preserved and accepted as audit facts, not yet behavior changes.
