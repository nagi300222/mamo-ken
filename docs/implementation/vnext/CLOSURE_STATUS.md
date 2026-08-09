# Fable5 vNext FINAL — Closure Status

Final status note for `NONSTOP_IMPLEMENTATION_ORDER.md`'s 5-PR pipeline.
All 5 PRs are merged to `main`. This file records the closure state; it
does not change any spec ("仕様自体は変えない" — `NONSTOP_IMPLEMENTATION_
ORDER.md` line 4 — is honored throughout).

## PR status

| PR | Scope | PR # | Status |
|----|-------|------|--------|
| 1 | HANDOFF + ART/UI + SIZE | (pre-session) | Merged |
| 2 | COMBAT CORE vNext | #75 | Merged |
| 3 | COMMAND / MODERN / CLASSIC | #76 | Merged |
| 4 | ABILITY (9 state machines) | #77 | Merged |
| 5 | CLOSURE | (this PR) | See below |

## PR5 closure work

- Full regression: all 9 characters run crash-free across all 36
  unordered pairings (each character therefore fought as both P1 and P2
  against every other character), 6000 `fightStep()` ticks each — zero
  exceptions, zero console errors.
- Round-reset audit: every PR4 Ability field (`gutsActive`,
  `gritAvailable`, `chaseReadyUntilF`, `chaseActive`, `armorStock`,
  `ironWallReady`, `trickMove/trickChoice/trickResolved/trickSuccess`,
  `pressureState/pressureUntilF/pressureQueuedMove/pressureQueuedIdx`,
  `yomiState/yomiJust/yomiQueuedLv/yomiReadyUntilF/yomiFiredJust`,
  `charge/chargeLastMove`, all 9 `dark*` fields) was deliberately dirtied
  then confirmed to return to its documented default after
  `roundInit(true)` — zero mismatches.
- Deterministic replay: two independent runs seeded with the same
  `mulberry32` seed, same character matchup, same AI difficulty (which is
  itself driven entirely by the shared seeded `rng()` — no
  `Math.random`/`Date.now`/`performance.now` anywhere in the battle
  simulation), 8000 ticks each, produce a byte-identical snapshot of
  every hash-relevant field on both fighters (HP/guard/S/phase/combo, and
  every PR4 Ability field) plus an identical next `rng()` draw — confirms
  the lockstep-determinism precondition every prior vNext PR reasoned
  about is actually true, not just argued.
- `npm run build:mobile`: reproducible (byte-identical `dist/
  mamoken_mobile.html` across two independent, back-to-back builds — MD5
  match, not just `git diff --exit-code`, which only proves "matches the
  last commit," not "reproducible right now").
- All 34 `npm run check:*` scripts green.
- Stale Focus UI/AI cleanup: PR2 intentionally left Focus's
  auto-slow/HUD-overlay code in place as dead code (guarded by
  `focusSlowMs>0`, and `focusSlowMs` was never incremented anywhere since
  its only writer, `triggerFocus()`, had zero remaining call sites after
  `checkFocusTrigger()` became a no-op) — explicitly deferred to this PR
  per its own comments ("恒久的に未使用"). Removed: `focusSlowMs`, `
  triggerFocus()`, the camera-zoom branch, the color-overlay/telop render
  block, and the main-loop's slow-motion `simDt` branch. Left in place
  (intentionally, matching PR2's documented "schema compatibility"
  posture and `ACCEPTANCE_TESTS.md`'s "Focus" section, which only
  requires no gameplay gain / no auto-slow / no HUD / no CPU-logic
  reference / no live behavior from the compatibility field — not that
  the field itself must be deleted): `f.focus`, `BAL.FOCUS`, `gainFocus()`
  , `checkFocusTrigger()`.
- Art manifest integrity: `check:ability-ui-manifest` and
  `check:art-runtime` both green; `MAMOKEN_ABILITY_UI_MANIFEST` asset
  paths are unchanged and still resolve (PR4 added no new asset
  references, only gameplay state — see the note below on the one
  confirmed gap this session did **not** close).
- Out-of-scope feature absence: `git diff --stat` for both PR4 and PR5
  touches only `prototype/mamoken_prototype_v01.html`, `dist/
  mamoken_mobile.html`, and this PR's own report/doc files —
  `src/core/**`, `test/**`, `tools/**`, `server/**`, `design/**` are
  untouched by either PR, matching every prior vNext PR's posture.

## Known gap carried forward (not a blocker)

PR1's `MAMOKEN_ABILITY_UI_MANIFEST` (icon/gauge/VFX asset paths per
character ability state) has never been wired to live rendering code —
no draw call in `prototype/mamoken_prototype_v01.html` reads any PR4
Ability field (`chaseReadyUntilF`, `armorStock`, `ironWallReady`,
`pressureState`, `yomiState`, `charge`, `darkGauge`/`darkBody`, etc.) to
display a corresponding icon, gauge segment, or VFX during a battle. The
manifest itself is structurally valid and asset-complete (confirmed by
`check:ability-ui-manifest`), and every PR4 Ability mechanic is fully
live and correct in gameplay — this gap is purely "the player currently
has no on-screen indicator of these Ability states," not a gameplay,
determinism, or hash-safety issue. Building 9 characters' worth of
battle-HUD ability indicators (icon placement, gauge segment logic,
VFX trigger timing) is a substantial art/UI implementation task in its
own right, distinct from PR4/PR5's state-machine and regression scope,
and is left for a future UI-focused pass.

## Explicit interpretation note carried forward from PR4

Takimaru PRESSURE's Grab input is accepted for the fighter's entire
`pressureState==='ready'` window (from the triggering HIT/BLOCK through
`pressureUntilF`), rather than only the doc's literal "6F前から" (last 6
frames before the opponent's actionable frame). Because `throwEligible()`
is false for `phase==='hitstun'`/`'blockstun'-held`, an early press can
only ever *queue* (never fire early), and `tickPressureQueue()` still
only fires the throw at the opponent's actual first actionable frame —
so the resulting *timing of the throw* is identical either way; the only
difference is that this implementation accepts the input slightly
earlier than the doc's literal window. Left as a more lenient (not more
powerful) input-buffering choice, consistent with this codebase's general
"buffer generously" convention (e.g. `BAL.CMD.buffer`) elsewhere.
