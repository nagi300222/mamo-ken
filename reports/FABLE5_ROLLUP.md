# Fable5 Rollup — T00 / T00.1 / T02

## PRs and SHAs

| Task | PR | SHA / state | Purpose |
|---|---:|---|---|
| T00 | #17 | merged before T02 | Audit tool and generated current implementation reports. |
| T00.1 | #18 | merged before T02 | Correct source/dist comparison source for audit reports. |
| T02 | #20 | see final response commit SHA | Core type, current constants, validation, stable serialization, hash, determinism fixtures. |

## Tests / verification inputs

- `npm ci` — required clean-clone check; blocked locally by registry 403 for TypeScript package fetch.
- `npm run check:core` — TypeScript strict check plus core snapshot/determinism tests.
- `node tools/audit_current_impl.mjs` — T00 snapshot and source/dist contract audit.
- `npm run build:mobile` — blocked after failed `npm ci` removed local `sharp`; had passed before dependency removal in this environment.
- `git diff --check` — whitespace/diff sanity.
- `git diff --stat -- prototype/mamoken_prototype_v01.html index.html dist/mamoken_mobile.html server assets` — must remain empty for T02.

## T02 judgment material

- Current constants are referenced from T00 `reports/current_impl_constants.json` rather than manually re-copied.
- Current phase and flow lists are compared against T00 `reports/current_impl_phases.json`.
- Validators cover normal move specs, command move specs, and current character combat fields.
- Determinism fixtures cover same-seed replay, negative seed/input divergence, and P1/P2 swap mirror equivalence through 10,000F.

## T03 / T06 handoff material

- T03 can build on `Current*` types and validators without treating planned/provisional IDs as current runtime facts.
- T06 should consume preserved Gyuiin/minigame legacy values from T00 snapshot; T02 intentionally does not rebalance them.
- Runtime, online protocol, server, assets, and dist behavior remain unchanged by T02.
