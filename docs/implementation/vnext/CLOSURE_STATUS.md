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

- Full offline regression: all 9 characters run crash-free across all 72
  ordered pairings (every character as P1 against all 8 others, and again
  as P2 against all 8 others — offline `fightStep()` routes P1 through
  `evq`/`currentP1Hold()` and P2 through `cpuEv`/AI guard state, genuinely
  different code paths, so both seatings of every matchup are exercised
  separately), 3000-6000 `fightStep()` ticks each — zero exceptions, zero
  console errors. (Online regression — see "Known gap" below.)
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
  simulation), 6000 ticks each across two matchups, compared with a
  per-tick FNV-1a hash of the **entire** `B` object minus `fx` (decorative
  hit-spark particles — confirmed by direct diff to be the sole source of
  divergence when `fx` is included, since `fxSpark()`'s particle
  rotation/scale come from unseeded `Math.random()` used only for local
  visual variety, never fed back into gameplay logic) — byte-identical at
  every tick. Confirms the lockstep-determinism precondition every prior
  vNext PR reasoned about is actually true, not just argued, and that the
  *entire* gameplay-relevant state (not a hand-picked subset) matches.
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

## Known gap carried forward: online regression not run

`NONSTOP_IMPLEMENTATION_ORDER.md`'s PR5 scope explicitly lists "all 9
online" as part of "full regression." This was actively attempted this
session — `cd server && npx wrangler dev --local` was run to try to stand
up a local Cloudflare Durable Object relay for a genuine two-Playwright-
client test — but the sandbox's network restrictions prevented the local
Workers runtime from initializing correctly (`Request was cancelled`
fetching `Request.cf`, and the local port never accepted a connection).
The relay server itself only forwards raw messages between two connected
clients and never reconstructs match state (`server/wrangler.toml`'s own
comment), so this PR's offline full-state-hash determinism proof
substantially de-risks online play, but it does not exercise
`onlineStep()`/`netFightStep()`, slot-dependent queue mapping, real peer
message ordering/latency, or disconnect handling. This item is left
**open**, not claimed complete — whoever has a real 2-device or deployed-
relay environment should run it before treating vNext FINAL as fully
closed end-to-end.

## Closed: Ability UI/VFX now wired (PRESENTATION-R1 (A))

PR1's `MAMOKEN_ABILITY_UI_MANIFEST` is now live-connected to
`prototype/mamoken_prototype_v01.html`'s HUD rendering
(`gauges()`/`rHUD()` and the new `abilityGaugeDescriptor()`/
`abilityStatusDescriptor()`/`drawAbilityGauge()`/`drawAbilityStatus()`
functions) — all 9 characters now show a persistent gauge/stock icon and
a status icon/VFX for their PR4 Ability state, placed in the HUD gap this
section previously identified as unused. Presentation-only: the new code
only reads `f.*` combat fields, never writes them, and a measured
per-tick full-state hash comparison (pre- vs post-connection, 5 matchups
covering all 9 characters, 4000 ticks each) confirmed zero divergence.
See `reports/presentation/ABILITY_UI_VFX_CONNECTION.md` for the full
binding table, interpretation notes (no 9-slice frame calibration data
exists for the new gauge frame assets; Bullet's `charge.over` asset is
unreachable given the current cap-3 rule; Dark Moguzo's afterimage cadence
is a documented cosmetic choice), and verification results.

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
