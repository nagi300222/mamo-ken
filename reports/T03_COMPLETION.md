# T03 Completion — Input / Command Parser v1

## PR / branch / base

- Branch: `feature/command-parser-v1`
- Intended base: latest `origin/main` after T02 merge commit `66b13bcbeb5bd53a41d63e8236cd53b1a16ca48c`
- Local environment blocker: `origin` fetch/reset and push are blocked by HTTPS CONNECT 403, so the implementation is committed locally from the available T02-equivalent workspace state.
- PR: new Draft PR required; creation/push blocked locally by the same GitHub HTTPS 403 and no `make_pr` tool being exposed.

## Exact changed files

- `package.json`
- `src/core/command-types.ts`
- `src/core/input-events.ts`
- `src/core/command-parser.ts`
- `src/core/index.ts`
- `test/command-parser.test.mjs`
- `reports/T03_COMPLETION.md`
- `reports/FABLE5_ROLLUP.md`

## Parser API summary

- `NormalizedInputEvent` represents direction press/release, attack, grab, frame, player, and explicit same-frame order.
- `CommandParserState` owns only direction history and hold state; it does not own fighter phases or runtime transitions.
- `currentCommandDefinitions(characterId)` derives the existing 9 command definitions from `CURRENT_CONTRACT.bal.CMD.moves`.
- `resolveCommand` returns command / direction fallback / normal attack fallback / normal grab fallback / rejected.
- `resolvePrebuffer` returns immediate / queued / rejected and uses supplied actionable frame without owning phase transitions.

## Current vs provisional timing separation

- Current compatibility profile: `directionHistoryF = 24`, `commandPrebufferF = 12`, latest 2-direction command matching.
- Target/provisional profile: separate object with 3/4-direction totals, max adjacent gap, final-button grace, same-direction anti-chatter, hold detection, and charge completion. These are not wired into current runtime.

## Conflict-resolution contract

1. active conditional command
2. longer completed direction sequence
3. higher explicit specificity
4. normal command
5. direction fallback
6. normal attack/grab fallback
7. stable definition order final tie-break

A false conditional command with `blocksOverlappingFallback` rejects overlapping accidental fallback into a shorter command.

## Required fixture results

- Current 9 commands: all recognized from `CURRENT_CONTRACT.bal.CMD.moves`.
- Wrong trigger: rejected to normal attack fallback.
- Current direction history boundary: 23F and 24F accepted, 25F rejected.
- Prebuffer boundary: 11F queued, 12F queued, 13F rejected; 0F immediate.
- P1/P2 logical-direction fixture: same logical directions produce the same command without parser-side visual mirroring.
- 10,000F independent parser replay hash: `f45738c9`.
- Changed event/order negative case divergence frame: 731.

## Runtime / BAL / protocol diff

- Runtime HTML behavior: unchanged.
- Existing BAL values and 9 command move definitions: unchanged.
- Online protocol/server/UI/assets/dist behavior: unchanged.
- Final scoped diff command is expected to be empty for `prototype/mamoken_prototype_v01.html`, `index.html`, `dist/mamoken_mobile.html`, `server`, and `assets`.

## Known constraints / T04-T05 handoff

- T03 is a pure parser layer only; it does not rewire `prototype/mamoken_prototype_v01.html`.
- T04 can consume command matches but must own combo/MoveSpec behavior separately.
- T05 can consume direction/hold history for defense work without changing current parser compatibility profile.
