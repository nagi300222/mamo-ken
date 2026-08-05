# Fable5 Rollup — T00 / T00.1 / T02 / T03

## PRs and SHAs

| Task | PR | SHA / state | Purpose |
|---|---:|---|---|
| T00 | #17 | merged | Audit tool and generated current implementation reports. |
| T00.1 | #18 | merged | Correct source/dist comparison source for audit reports. |
| T02 | #21 | merged as `66b13bcbeb5bd53a41d63e8236cd53b1a16ca48c` | Core types, current constants, validation, stable serialization, hash, and determinism fixtures. |
| T03 | #25 | Draft; implementation head before reports `e8fe11c954098a6169e68a235488a2e009816a69` | Pure normalized input history, command matching, conflict resolution, and command prebuffer contracts. |

Superseded T02 drafts #19 and #20 were closed without merge. Issue #23 preserves the unpublished first T03 attempt as a comparison checkpoint; PR #25 is the GitHub-tracked reconstruction and merge candidate.

## Tests / verification inputs

- GitHub Actions `Core contract check` — clean Linux checkout with Node.js 24.
- `npm ci` — validates `package-lock.json` and installs local TypeScript / Sharp dependencies.
- `npm run check:core` — TypeScript strict check plus Core snapshot/determinism tests.
- `npm run check:command` — T03 input-history, matching, conflict, timing, P1/P2, and 10,000F tests.
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
- Conflict resolution covers active conditional derivation, longest complete sequence, explicit specificity, stable definition order, conditional-false overlap blocking, direction fallback, and normal attack/grab fallback.
- Prebuffer boundary: `0F immediate`, `11F queued`, `12F queued`, `13F rejected`.
- Parser 10,000F hash: `f5a7abc5`; changed same-frame order diverges at frame `731`.
- P1/P2 fixture consumes logical directions and does not mirror inside the parser.
- Runtime, BAL, current nine moves, online protocol, server, UI, assets, and dist behavior remain unchanged by T03.

## T04 / T05 / T06 handoff material

- T04 can consume T03 command matches for MoveSpec/combo work while preserving current/provisional timing separation.
- T05 can consume deterministic direction fallback and command prebuffer decisions; runtime integration remains a separate scoped change.
- T06 should consume preserved Gyuiin/minigame legacy values from T00 snapshot; T02 and T03 intentionally do not rebalance them.

## Gate

- T02: merged after `Core contract check` success.
- T03: `MERGE_GO` only after PR #25 `Core contract check` passes and scoped review confirms runtime/BAL/protocol diff 0.
- T04/T05: start only after T03 merge unless explicitly split against the T03 branch.
- T06 inputs: preserved and accepted as audit facts, not yet behavior changes.
