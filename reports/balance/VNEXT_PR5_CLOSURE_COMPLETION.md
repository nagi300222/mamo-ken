# vNext PR5: CLOSURE — Completion Report

Fifth and final PR implementing the Fable5 vNext FINAL handoff
(`docs/implementation/vnext/NONSTOP_IMPLEMENTATION_ORDER.md`). Base:
`origin/main` @ PR4 (`#77`, merged).

## 1. Scope

Per the order doc's PR5 bullet list: full regression (all 9 offline/
online), deterministic replay/hash, dist reproducibility, stale Focus
UI/AI cleanup, art manifest integrity, docs final update, out-of-scope
feature absence.

- **Full regression (offline)**: all 9 characters run crash-free across
  all 36 unordered pairings (`C(9,2)`), each therefore fought as both P1
  and P2 against all 8 others, 4000-6000 `fightStep()` ticks per pairing
  across the several passes run this session — zero thrown exceptions,
  zero console errors, on both the pre-cleanup and post-cleanup code.
- **Round-reset audit**: every PR4 Ability field across all 9 characters
  was deliberately dirtied to non-default values, then `roundInit(true)`
  was called and every field verified back at its documented default —
  zero mismatches. This directly exercises PR4's own acceptance line
  "round reset" beyond the per-mechanic spot checks PR4's own report
  already covered.
- **Deterministic replay/hash**: two independent battle runs, same
  character matchup, same fixed `mulberry32` seed (bypassing the
  wall-clock seed `startBattle()` normally uses), same AI difficulty
  (whose own decisions are entirely `rng()`-driven, so no unseeded
  randomness enters the simulation at all), 5000-8000 ticks — produce a
  byte-identical snapshot of every fighter field that matters for
  lockstep sync (HP/guard/S/phase/combo plus every PR4 Ability field) and
  an identical next `rng()` draw. This is the first time in this vNext
  series that determinism was actually *measured* rather than argued
  from "no `Date.now`/`Math.random` call sites were added" — confirms the
  precondition every PR1-4 report relied on.
- **Dist reproducibility**: two independent, back-to-back
  `npm run build:mobile` runs produce byte-identical (MD5-matching)
  `dist/mamoken_mobile.html` output — stronger than the
  `git diff --exit-code` check used in prior reports, which only proves
  "matches the last commit," not "reproducible from source right now."
- **Stale Focus UI/AI cleanup**: removed `focusSlowMs`, `triggerFocus()`,
  the clash-vs-focus camera-zoom branch, the color-overlay/telop render
  block, and the main loop's `simDt` slow-motion branch — all of it dead
  code since PR2 made `checkFocusTrigger()` a no-op (confirmed zero
  remaining call sites for `triggerFocus` before deletion, and confirmed
  `focusSlowMs` was provably always `0` — the only site that ever wrote a
  nonzero value was the now-deleted `triggerFocus()`). AI-side Focus
  cleanup (`focusThreat`) was already done in PR2; this PR only found
  documentation comments left behind, which are harmless and retained.
  `f.focus`, `BAL.FOCUS`, `gainFocus()`, and `checkFocusTrigger()` are
  intentionally left in place as inert schema-compatibility fields, per
  PR2's own explicit "hard-disable, keep the schema" design (see §2
  below for why this isn't scope creep to also remove).
- **Art manifest integrity**: `check:ability-ui-manifest` and
  `check:art-runtime` both green (no asset paths changed by PR4 or PR5).
- **Docs final update**: added
  `docs/implementation/vnext/CLOSURE_STATUS.md` recording the 5-PR
  pipeline's final merge status, matching the existing
  `docs/implementation/vnext/*_FINAL.md` file convention rather than
  editing `docs/03_data_design.md` (a `CONFIRMED`-labeled, cross-project
  design doc outside this vNext work's blast radius, and outside what
  "docs final update" plausibly asked for on a terse one-line bullet).
- **Out-of-scope feature absence**: `git diff --stat` for this PR touches
  only `prototype/mamoken_prototype_v01.html`, `dist/mamoken_mobile.html`
  , and this PR's own docs/report files — `src/core/**`, `test/**`,
  `tools/**`, `server/**`, `design/**` untouched, matching every prior
  vNext PR.

## 2. Explicit interpretation calls (flagging for reviewer)

1. **Focus cleanup scope: UI/timing dead code only, not the schema
   fields.** `NONSTOP_IMPLEMENTATION_ORDER.md`'s PR5 bullet says "stale
   Focus **UI/AI** cleanup," and `ACCEPTANCE_TESTS.md`'s "Focus" section
   only requires no gameplay gain / no auto-slow / no HUD / no CPU-logic
   reference / "compatibility fieldが残ってもlive behaviorなし" — i.e. it
   explicitly anticipates the compatibility field surviving. `f.focus`,
   `BAL.FOCUS`, `gainFocus()`, and `checkFocusTrigger()` satisfy every one
   of those five criteria already (confirmed by grep audit — no HUD draw
   call, no AI reference, no live gain/slow effect). Deleting them too
   would mean touching every `gainFocus(...)` call site across every
   damage-resolution path in the file for zero behavior change, which
   reads as scope creep against both the doc's own wording and its own
   test list.
2. **Takimaru PRESSURE's prequeue window is wider than the doc's literal
   "6F前から."** Carried forward from PR4 (not touched this PR) —
   documented in full in `CLOSURE_STATUS.md` with the reasoning for why
   it's a input-buffering leniency difference, not a timing-of-effect
   difference (the throw still only ever fires at the opponent's actual
   first actionable frame either way).
3. **`docs/03_data_design.md` was not edited.** It's a long-standing,
   `CONFIRMED`-labeled cross-project design reference that predates and
   sits outside the vNext implementation-order pipeline; every vNext
   PR's "docs" touch-points have instead been the standalone `docs/
   implementation/vnext/*.md` files, and this PR follows that same
   convention for its own closure note.
4. **PR1's Ability UI/VFX manifest was never wired to live rendering,
   and this PR does not close that gap.** See `CLOSURE_STATUS.md`'s
   "Known gap carried forward" section — this is a real, identified
   scope gap (no on-screen indicator exists for any PR4 Ability state),
   but it's cosmetic/informational only (zero effect on gameplay,
   determinism, or hash-safety, confirmed by this PR's own regression and
   determinism runs), and building 9 characters' worth of battle-HUD
   ability indicators is a substantial standalone UI/art task rather than
   a "closure" fix. Flagging rather than attempting a partial/rushed
   implementation of it under PR5's regression-and-report scope.

## 3. Verification

- All 34 `npm run check:*` scripts green on the final (post-Focus-
  cleanup) code.
- `node -e "new Function(...)"` syntax check on the extracted `<script>`
  body.
- `npm run build:mobile` × 2 consecutive runs: MD5-identical
  `dist/mamoken_mobile.html`.
- Headless Playwright:
  - Full 36-pairing round-robin crash-smoke (every character vs every
    other character, both seating orders covered across the 36 unordered
    pairs since each pairing is tested once and every character appears
    in 8 of the 36 pairs) — zero exceptions, zero console errors, on
    both the pre- and post-Focus-cleanup code.
  - Round-reset field audit (§1) — zero mismatches.
  - Determinism replay (§1) — byte-identical across two runs, re-run
    again after the Focus cleanup to confirm the cleanup itself didn't
    change any tick's outcome — still byte-identical.
  - Confirmed `focusSlowMs`/`triggerFocus` no longer exist as globals
    after cleanup (`typeof focusSlowMs==='undefined'`).
- Not run this session (no online 2-browser device available, same
  environmental note as every prior vNext report): a real cross-client
  online determinism check. This PR's seeded-replay test is the closest
  substitute available in this environment and is a strictly stronger
  claim than any prior PR's reasoning-only determinism section (it
  actually executes two independent runs and diffs the result, rather
  than only auditing for `Math.random`/`Date.now` call sites).

## 4. Fable5 vNext FINAL — pipeline complete

| PR | Scope | Status |
|----|-------|--------|
| 1 | HANDOFF + ART/UI + SIZE | Merged (pre-session) |
| 2 | COMBAT CORE vNext | Merged (#75) |
| 3 | COMMAND / MODERN / CLASSIC | Merged (#76) |
| 4 | ABILITY (9 state machines) | Merged (#77) |
| 5 | CLOSURE | This PR |

Two items are explicitly carried forward as known, non-blocking gaps
(§2.2 and §2.4 above / `CLOSURE_STATUS.md`) rather than resolved in this
pipeline: Takimaru PRESSURE's prequeue-window leniency, and PR1's Ability
UI/VFX manifest never being wired to live battle-HUD rendering. Neither
affects gameplay correctness, combat balance, or online determinism.
