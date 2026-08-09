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
  all 72 ordered pairings (every character as P1 against all 8 others,
  and again as P2 against all 8 others — not just one direction per
  matchup: offline `fightStep()` genuinely routes P1 through `evq`/
  `currentP1Hold()` and P2 through `cpuEv`/AI guard state, so both
  seatings of every matchup are distinct code paths and both are now
  exercised), 3000-6000 `fightStep()` ticks per pairing across the
  several passes run this session — zero thrown exceptions, zero console
  errors, on both the pre-cleanup and post-cleanup code. (An earlier pass
  this PR only ran the 36 *unordered* pairs, which meant the character at
  the low end of the roster index was always P1 and the character at the
  high end was always P2 — a real coverage gap, caught in review and
  fixed by switching to the full 72-pair ordered matrix.)
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
  randomness enters the simulation at all) — a per-tick FNV-1a hash of
  **every** field on `B` (both full fighter objects plus all battle-level
  fields: `f`, `round`, `wins`, `timer`, `flow`, `flowF`, `hitstop`,
  `shake`, `clash`, `ultUser`, `koSide`, `result`, `pendKO`,
  `clashStreak`, `ann`), across two independent matchups and 6000 ticks
  each, is byte-identical at every single tick between the two runs of
  each matchup. The one field intentionally excluded from the hash is
  `B.fx` (decorative hit-spark/burst particle effects): a first attempt
  at hashing the **literal** complete `B` object (including `fx`) did
  diverge, and diffing the two runs at the exact divergent tick showed
  the *only* difference was the `picks` sub-array inside a `spark` fx
  entry — its `rot`/`scl` values come from `fxSpark()`'s unseeded
  `Math.random()` calls (this file already uses plain `Math.random()` for
  purely-decorative particle variety in a few places, e.g. `fxSpark`'s
  pick generator — never for anything gameplay-affecting or netcode-
  synced; each client already renders its own local sparks independently
  in the real online implementation). Confirming that `fx` is the *only*
  divergent field, and that every other field of `B` — literally
  everything gameplay/lockstep-relevant — matches on every tick, is a
  substantially stronger and more direct determinism proof than checking
  a hand-picked subset of fields would have been. (An earlier pass this
  PR checked a curated subset of fighter fields only; a review comment
  correctly pointed out that a partial snapshot can't rule out divergence
  in the omitted fields, which is exactly what testing the literal full
  object — and then explaining the one legitimate exclusion — resolves.)
  This is the first time in this vNext series that determinism was
  actually *measured* rather than argued from "no `Date.now`/
  `Math.random` call sites were added" — confirms the precondition every
  PR1-4 report relied on.
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
  - Full 72-pairing ordered crash-smoke (every character as P1 against
    all 8 others, and again as P2 against all 8 others) — zero
    exceptions, zero console errors, on both the pre- and post-Focus-
    cleanup code.
  - Round-reset field audit (§1) — zero mismatches.
  - Determinism replay (§1) — full-`B`-minus-`fx` per-tick hash
    byte-identical across two runs × two independent matchups × 6000
    ticks each, re-run again after the Focus cleanup to confirm the
    cleanup itself didn't change any tick's outcome — still identical.
  - Confirmed `focusSlowMs`/`triggerFocus` no longer exist as globals
    after cleanup (`typeof focusSlowMs==='undefined'`).
- **Not achieved this session**: a real cross-client online regression
  (`server/**`'s Cloudflare Durable Object relay + two independent
  browser clients). This was actively attempted, not just skipped on the
  usual "no 2-device environment" note every prior vNext report gives:
  `cd server && npx wrangler dev --local` was run to try to stand up a
  local relay for a genuine two-Playwright-client test, but the sandbox's
  network restrictions prevent the local Workers runtime from
  initializing correctly (`Request was cancelled` / `DOMException` errors
  fetching the `Request.cf` object, and the local port never accepted a
  connection — `curl` timed out with zero bytes received). This PR's
  seeded full-state-hash replay (above) is a strictly stronger *offline*
  determinism proof than any prior PR's reasoning-only section, and the
  relay server itself is a dumb message-forwarder with no game-state
  logic of its own (`server/wrangler.toml`'s own comment: "サーバー側では
  試合状態を再現しない"), so the offline result substantially de-risks
  online play — but it does not substitute for actually exercising
  `onlineStep()`/`netFightStep()`, slot-dependent queue mapping, real
  peer message ordering/latency, or disconnect handling, none of which
  this PR was able to test. The `all 9 online` line item in
  `NONSTOP_IMPLEMENTATION_ORDER.md`'s PR5 scope is therefore explicitly
  **not** closed by this PR — flagging for whoever has a real 2-device/
  deployed-relay environment to run it, rather than claiming a closure
  this session couldn't actually verify.

## 4. Fable5 vNext FINAL — pipeline status

| PR | Scope | Status |
|----|-------|--------|
| 1 | HANDOFF + ART/UI + SIZE | Merged (pre-session) |
| 2 | COMBAT CORE vNext | Merged (#75) |
| 3 | COMMAND / MODERN / CLASSIC | Merged (#76) |
| 4 | ABILITY (9 state machines) | Merged (#77) |
| 5 | CLOSURE | This PR — offline scope complete, online regression not achieved (§3) |

All offline-testable PR5 bullets (full offline regression, round-reset
audit, deterministic replay/hash, dist reproducibility, stale Focus UI/AI
cleanup, art manifest integrity, docs final update, out-of-scope feature
absence) are done and verified per §1/§3 above. Three items are
explicitly carried forward rather than resolved in this pipeline, none of
which affect offline gameplay correctness, combat balance, or the
*offline* determinism this PR measured: the `all 9 online` regression
item (§3 — genuinely not run, not just re-argued), Takimaru PRESSURE's
prequeue-window leniency (§2.2), and PR1's Ability UI/VFX manifest never
being wired to live battle-HUD rendering (§2.4).
