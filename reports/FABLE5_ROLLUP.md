# Fable5 Rollup — T00 / T00.1 / T02

## PRs and SHAs

| Task | PR | SHA / state | Purpose |
|---|---:|---|---|
| T00 | #17 | merged | Audit tool and generated current implementation reports. |
| T00.1 | #18 | merged | Correct source/dist comparison source for audit reports. |
| T02 | #21 | Draft; Codex import head `16bfa2753eddaa1105324e2b3a45ea2ebeaa4f0a` | Core types, current constants, validation, stable serialization, hash, and determinism fixtures. |

Superseded T02 drafts #19 and #20 were closed without merge.

## Tests / verification inputs

- GitHub Actions `Core contract check` — clean Linux checkout with Node.js 24.
- `npm ci` — validates `package-lock.json` and installs local TypeScript / Sharp dependencies.
- `npm run check:core` — TypeScript strict check plus core snapshot/determinism tests.
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

## T03 / T06 handoff material

- T03 can build on `Current*` types and validators without treating planned/provisional IDs as current runtime facts.
- T06 should consume preserved Gyuiin/minigame legacy values from T00 snapshot; T02 intentionally does not rebalance them.
- Runtime, online protocol, server, assets, and dist behavior remain unchanged by T02.

## Preliminary gate

- T02: `MERGE_GO` only after PR #21 `Core contract check` passes.
- T03: `GO` after T02 merge.
- T06 inputs: preserved and accepted as audit facts, not yet behavior changes.
