# T03 Completion — 入力・コマンドパーサ v1

## PR / branch / baseline

- PR: #25 (`feature/command-parser-v1`, Draft)
- Base: `main` at `704bea1c2c3aeebfea83a6890b8bd366534155b5`
- Implementation head before completion-report commits: `e8fe11c954098a6169e68a235488a2e009816a69`
- Comparison checkpoint: Issue #23 and unpublished Codex result `e13c43de90adf04eb74734b3c36254580a524cde`
- Source of truth: `docs/03_data_design.md` v2.7, T00 reports, and T02 Core contracts.

## Exact changed files

- `.github/workflows/core-check.yml`
- `package.json`
- `src/core/types.ts`
- `src/core/command-types.ts`
- `src/core/input-events.ts`
- `src/core/command-parser.ts`
- `src/core/index.ts`
- `test/command-parser.test.mjs`
- `reports/T03_COMPLETION.md`
- `reports/FABLE5_ROLLUP.md`

`package-lock.json`, runtime HTML, server, UI, assets, and generated dist are not changed.

## Parser API summary

- `NormalizedInputEvent` separates direction press/release, attack triggers, and grab triggers.
- Every event carries numeric `frame`, `order`, and `player` fields.
- `InputHistoryState` stores accepted direction presses, active holds, and completed holds without browser APIs.
- `buildCurrentCommandDefinitions()` generates the current nine commands directly from `CURRENT_CONTRACT.bal.CMD.moves`.
- `matchCommandDefinitions()` performs suffix, timing, charge, and condition checks.
- `resolveCommandTrigger()` applies deterministic conflict resolution and fallback behavior.
- `decideCommandPrebuffer()` and `scheduleCommandMatch()` expose immediate / queued / rejected decisions without owning fighter phase transitions.

## Current / provisional timing separation

### Current compatibility profile

- Status: `current_impl`
- Direction history: `BAL.CMD.bufF = 24F`
- Command prebuffer: `BAL.CMD.buffer = 12F`
- Latest direction suffix matching
- No provisional gap, charge, or anti-chatter rules applied to current nine-command fixtures

### Target profile

- Status: `provisional`
- `directionGapMaxF = 18`
- `commandTotal3F = 28`
- `commandTotal4F = 38`
- `finalButtonGraceF = 10`
- `sameDirectionMinGapF = 2`
- `holdDetectF = 30`
- `chargeCompleteF = 45`

The target profile is not connected to the current runtime in T03.

## Conflict-resolution contract

At the trigger frame, only already-complete commands are considered. Ordering is:

1. active conditional derivation
2. longer direction sequence
3. higher explicit specificity
4. stable numeric definition order
5. direction/dodge fallback when supplied
6. normal attack/grab fallback

A fully entered longer conditional pattern may block an overlapping shorter command when its condition is false, preventing accidental short-command activation without waiting extra frames.

## Verification results

- Current command count: `9`
- Current command source: `CURRENT_CONTRACT.bal.CMD.moves`
- Current history boundary: `23F pass / 24F pass / 25F reject`
- Command prebuffer: `0F immediate / 11F queued / 12F queued / 13F rejected`
- Queued command execution frame: caller-supplied actionable frame
- P1/P2: logical directions resolve the same `地走り`; parser performs no visual mirroring
- Same-frame events: numeric `frame -> order -> player` ordering
- Duplicate same-player `frame/order` keys: rejected
- 10,000F parser replay hash: `f5a7abc5`
- Changed same-frame event order divergence: frame `731`
- Local TypeScript strict check: passed
- Local command parser suite: passed
- Forbidden parser APIs: no `Math.random`, wall-clock Date use, locale comparison, DOM, Canvas, Audio, or timers

The prior unpublished checkpoint reported hash `f45738c9`. T03 was independently reconstructed rather than hard-coding that hash; the new deterministic fixture is locked to `f5a7abc5` and retains the same required negative divergence frame `731`.

## Runtime / BAL / protocol scope

- Current runtime input behavior: diff 0
- Existing BAL numeric values: diff 0
- Existing nine move definitions: diff 0
- Attack / guard / dodge / grab / roar behavior: diff 0
- Fighter phase transition order: diff 0
- CPU decisions: diff 0
- Online message schema: diff 0
- Server / UI / assets / generated dist behavior: diff 0

## Known constraints / handoff

- T03 creates a pure Core parser but does not rewire `prototype/mamoken_prototype_v01.html`.
- T04 may consume normalized command matches for MoveSpec/combo work without altering parser timing profiles.
- T05 may consume direction/dodge fallback and prebuffer decisions while preserving the deterministic event order.
- Runtime integration requires its own scoped PR and full online determinism regression; it is not implied by T03 merge.
- GitHub Actions `Core contract check` is the merge gate for clean Node 24 install, Core tests, command tests, audit, mobile build, and scoped diff verification.
