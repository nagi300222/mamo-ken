# Codex Cloud T03起動指示 — 入力・コマンドパーサ v1

## Current baseline

- Repository: `nagi300222/mamo-ken`
- Base: latest `main`
- T01 / T00 / T00.1 / T02: merged
- T02 merge commit: `66b13bcbeb5bd53a41d63e8236cd53b1a16ca48c`
- Canonical spec: `docs/03_data_design.md v2.7`
- Current runtime source: `prototype/mamoken_prototype_v01.html`
- T03 status: GO

## Branch / PR

- Branch: `feature/command-parser-v1`
- Base: latest `origin/main`
- PR: Draft
- Do not merge

## Objective

Implement a deterministic, DOM / Canvas / Audio independent input-history and command-resolution layer under `src/core/`.

T03 builds the reusable parser for later T04–T11 work. **Do not replace or rewire the current HTML runtime command handling in this PR.** The existing 9 command moves and current gameplay must remain unchanged.

## Sources of truth

Read before implementation:

- `docs/03_data_design.md` sections 2.4–2.5 and 4–5
- `reports/current_impl_constants.json`
- `reports/current_impl_phases.json`
- `reports/T02_COMPLETION.md`
- existing `src/core/*`
- current runtime functions around `pushDirBuf`, `detectCommandMove`, `stunRemaining`, and `cmdBufMove`

Current runtime facts to preserve as compatibility fixtures:

- `BAL.CMD.bufF = 24`: current direction history window
- `BAL.CMD.buffer = 12`: current command prebuffer
- existing parser checks the latest two direction presses in the 24F window
- direction presses are also dodge inputs
- existing 9 command move definitions remain slots 1–3 and must all be recognized by a current-compatibility profile

## Required architecture

Add a pure parser API, preferably in files such as:

- `src/core/input-events.ts`
- `src/core/command-parser.ts`
- `src/core/command-types.ts` or equivalent
- tests under `test/`

Exact file split is flexible, but responsibilities must remain separated:

1. normalized input events
2. direction/hold history state
3. command definitions
4. command matching
5. conflict resolution
6. prebuffer resolution

No raw pointer coordinates or browser APIs in core.

## Normalized event requirements

Provide a deterministic event contract supporting at least:

- direction press
- direction release, required for charge/hold recognition
- attack trigger: `high | mid | low`
- grab trigger
- frame number
- stable order within the same frame
- player identity where needed by fixtures

Multiple events in the same frame must resolve by explicit stable order, never object iteration order, locale, wall-clock time, or pointer arrival timing.

Logical direction must already be normalized before parser entry. Do not add device/P2 visual mirroring inside the parser.

## Command definition requirements

Support configurable command definitions for:

- 2-direction beginner commands
- 3-direction intermediate commands
- 4-direction advanced commands
- repeated directions
- charge/hold commands
- conditional derivations
- attack-ended and grab-ended commands

A command definition must have stable identity and deterministic tie-break fields. Use an explicit `specificity` or equivalent field rather than hidden heuristics.

## Timing profiles

Do not merge all timing values into one `INPUT_BUFFER`.

### Current compatibility profile

Must reproduce current behavior for the existing 9 commands:

- direction history: 24F
- command prebuffer: 12F
- latest matching 2 directions
- no new provisional gap/charge restriction applied to current runtime fixtures

### Target/provisional profile

Represent these separately and do not enable them in current runtime:

- `directionGapMaxF = 18`
- `commandTotal3F = 28`
- `commandTotal4F = 38`
- `finalButtonGraceF = 10`
- `sameDirectionMinGapF = 2`
- `holdDetectF = 30`
- `chargeCompleteF = 45`

Status boundaries must be explicit: confirmed/current_impl/provisional/legacy must not be mixed.

## Resolution order

At the trigger frame, select only from commands already complete. Do not wait extra frames for a possible longer command.

Deterministic priority:

1. complete conditional derivation whose condition is active
2. longer complete direction sequence
3. higher explicit specificity
4. normal command
5. direction/dodge fallback
6. normal attack/grab fallback
7. stable definition order as final tie-break

If a longer conditional command pattern is fully entered but its condition is false, it must be able to block accidental fallback into an overlapping shorter command. Cover this explicitly in the API and tests.

## Prebuffer contract

The parser must expose immediate / queued / rejected resolution without owning fighter phase transitions.

Boundary requirements:

- recovery remaining 11F: queue allowed
- 12F: queue allowed
- 13F: queue rejected
- queued command executes at the supplied actionable frame
- normal attack buffer and command prebuffer remain distinct concepts

## Current command fixtures

Generate or validate definitions from `CURRENT_CONTRACT.bal.CMD.moves`; do not hand-copy the 9 move values into a second source.

All existing commands must pass:

- Moguzo: 地走り / 昇撃 / 引き寄せ投げ
- Pisuke: 二連牙 / スライディング / 宙返り蹴
- Godan: 地割れ / 山掴み / 巌の構え

## Mandatory tests

Add a dedicated package script, for example `npm run check:command`, and include it in CI.

Tests must cover at least:

1. all existing 9 command patterns and triggers
2. wrong trigger rejection
3. direction history 23 / 24 / 25F boundary
4. adjacent direction gap boundary for target profile
5. total 3-direction boundary
6. total 4-direction boundary
7. final-button grace boundary
8. same-direction anti-chatter boundary
9. charge incomplete / exact / complete boundary
10. conditional command success
11. conditional false does not misfire overlapping short command
12. longest complete match wins without added input delay
13. equal-length specificity tie-break
14. stable definition-order final tie-break
15. 11 / 12 / 13F command prebuffer
16. direction input remains available as dodge fallback
17. multiple inputs in one frame use explicit order
18. P1/P2 logical-direction fixture
19. independent two-parser 10,000F deterministic replay
20. changed event/order negative case diverges at the expected frame
21. no `Math.random`, `Date`, locale-dependent comparison, DOM, Canvas, Audio, or timers in the parser

Use code-unit comparison or numeric order; do not use `localeCompare` in deterministic paths.

## CI / verification

Update the existing Core contract workflow rather than creating overlapping workflows.

Required commands:

```bash
npm ci
npm run check:core
npm run check:command
node tools/audit_current_impl.mjs
npm run build:mobile
node tools/audit_current_impl.mjs
git diff --check
git diff --stat -- prototype/mamoken_prototype_v01.html index.html dist/mamoken_mobile.html server assets
```

The final scoped diff command must be empty.

## Completion report

Add `reports/T03_COMPLETION.md` with:

- PR / branch / base / head SHA
- exact changed files
- parser API summary
- current vs provisional timing separation
- conflict-resolution contract
- current 9-command fixture result
- 11/12/13F result
- 10,000F hash and negative divergence result
- P1/P2 result
- runtime/BAL/online/server/assets/dist diff
- known constraints and T04/T05 handoff

Update `reports/FABLE5_ROLLUP.md` with a concise T03 section.

## Prohibited changes

Do not change:

- current runtime input behavior
- existing command move definitions or numbers
- BAL values
- attack/guard/dodge/grab/roar behavior
- fighter phase transition order
- CPU decisions
- online message schema
- server
- UI
- assets
- generated dist behavior

Do not implement T04 combo/MoveSpec behavior, T05 defense changes, or T06 gauge/Gyuiin changes.

## Stop conditions

Stop with HOLD and report evidence if implementation requires:

- runtime behavior change
- online/server schema change
- interpretation that conflicts with v2.7
- unresolved nondeterminism
- duplication of runtime BAL/command data

## Final response

Report:

- summary
- commit SHA
- exact files
- test results
- 10,000F result
- prebuffer boundary result
- current 9-command result
- P1/P2 result
- runtime/BAL/protocol diff
- Draft PR URL

Keep the PR Draft and do not merge.
