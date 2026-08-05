# Fable5 Rollup — T00 / T00.1 / T02 / T03

## PRs and SHAs

| Task | PR | SHA / state | Purpose |
|---|---:|---|---|
| T00 | #17 | merged before T02 | Audit tool and generated current implementation reports. |
| T00.1 | #18 | merged before T02 | Correct source/dist comparison source for audit reports. |
| T02 | #21 | merged to main | Core type, current constants, validation, stable serialization, hash, determinism fixtures. |
| T03 | new Draft PR | local commit recorded in final response | Pure input event, direction history, command matching, conflict resolution, and prebuffer parser layer. |

## Tests / verification inputs

- `npm ci` — required clean-clone check; blocked locally by registry 403 for TypeScript package fetch.
- `npm run check:core` — TypeScript strict check plus core snapshot/determinism tests.
- `npm run check:command` — TypeScript strict check plus T03 parser fixtures.
- `node tools/audit_current_impl.mjs` — T00 snapshot and source/dist contract audit.
- `npm run build:mobile` — blocked locally after failed `npm ci` removed `sharp`; should pass in a clean dependency environment.
- `git diff --check` — whitespace/diff sanity.
- `git diff --stat -- prototype/mamoken_prototype_v01.html index.html dist/mamoken_mobile.html server assets` — must remain empty for T03.

## T03 judgment material

- Current parser profile preserves `BAL.CMD.bufF = 24`, `BAL.CMD.buffer = 12`, latest two directions, and all 9 current commands.
- Provisional/target timing values are represented separately and are not enabled in current runtime.
- Parser uses explicit event order and numeric/code-unit deterministic comparisons only.
- Direction input remains available as dodge fallback.
- Prebuffer exposes immediate / queued / rejected without owning fighter phase transitions.
- 10,000F parser replay hash: `f45738c9`; changed event/order divergence frame: 731.

## T04 / T05 / T06 handoff material

- T04 should consume command resolution results for combo/MoveSpec behavior without moving command data out of `CURRENT_CONTRACT`.
- T05 can use direction release/hold state for defense and charge-related work.
- T06 should consume preserved Gyuiin/minigame legacy values from T00 snapshot; T03 intentionally does not rebalance gauges or Gyuiin.
- Runtime, online protocol, server, UI, assets, and dist behavior remain unchanged by T03.
