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

## Held due to insufficient spec (PRESENTATION-R1 (F))

A sweep of `prototype/mamoken_prototype_v01.html`'s `BAL.CMD.moves` for
`(未結線)`-tagged fields (internal-only annotations on the `tags` array —
never rendered to players; `moveBadges()` reads individual named fields
like `m.cost`/`m.armorStartF`/`m.unblockable`, never the raw `tags` array,
so none of the text below has ever leaked into any UI) found exactly 4
moves across 2 characters with unimplemented gated behavior noted in-line.
Per this session's standing instruction — "一意に決まらないものは実装せ
ず`CLOSURE_STATUS.md`へ列挙して残す" — none of the 4 are implemented by
this PR; each is held here with the specific reason no unique
implementation exists.

- **Moguzo 胴押し** (`小Pushback(未結線)`) / **Hakuma 不動押し**
  (`小Pushback(未結線)`): `COMBAT_VNEXT_FINAL.md` §13 confirms Pushback is
  a real, intentional exception to the "Normal common root knockback=0"
  rule (§6, "投げ/Roar/Ult/Gyuiin/down/明示Pushbackのみ例外") and tags both
  moves qualitatively as "small Pushback"/"small push" — but no doc or
  code anywhere gives an exact magnitude. There is no `BAL.KB` tier table
  or named "small"/"large" knockback constant in the engine at all (every
  other knockback-bearing effect in the codebase is an ad-hoc per-call-site
  `f.kb=N` literal); a grep for `KB\.|kb:\d|BAL\.KB` across the prototype
  confirms this. Picking any specific pixel/frame value to satisfy "small"
  would be inventing a new BAL value under a qualitative label the spec
  never quantified — exactly what the standing directive prohibits.
  Deferred until a doc or contract states the exact magnitude.
- **Pisuke すり抜け足** (`Hit→CLINCH(未結線)`) / **Pisuke つむじ返し**
  (`CHASE_TO_CONTACT(未結線)`, `maximumApproachSteps2(未結線)`): unlike the
  Pushback items, exact values genuinely exist —
  `design/combat/contracts/MAMOKEN_CURRENT_3_CHARACTERS_MOVESPEC_CLOSURE_
  v0.2.json` specifies `"forwardMovement":"ENTER_CLINCH"` for すり抜け足
  and `"forwardMovement":"CHASE_TO_CONTACT","maximumApproachSteps":2` for
  つむじ返し. But this contract (`MAMOKEN_COMBAT_CONTRACT_v0.2.md`)
  describes a CLINCH posture and a stepwise opponent-approach mechanic that
  the live engine has no architecture for at all: combat resolution here
  is purely phase/state-machine driven (`striking()`/`attackResolve()`/
  `resolveHits()`), with zero position- or distance-based gating anywhere
  — `baseX` exists only for FX/visual placement, never read by any hit- or
  movement-resolution function. Implementing either flag would mean
  building a new spatial/movement subsystem from scratch, not filling in a
  parameter on an existing one. That is disproportionate scope for a
  presentation-only safe-fix pass and falls under this session's
  "structurally impossible without a larger architecture change" stop
  condition. Deferred; a dedicated PR scoped explicitly to adding
  position/distance mechanics would be the right place to pick this up.
- **Also flagged for consistency (not previously `(未結線)`-tagged)**:
  Godan's 大山押し is tagged "small push" in the same `COMBAT_VNEXT_FINAL.
  md` §13 table (line ~303) as 胴押し/不動押し, but its code entry (`tags:
  ['Quick16','Modern','Stock2','Hyper']`) carries no `(未結線)` marker. Same
  reasoning as the two Pushback items above applies (no numeric magnitude
  exists anywhere) — noted here for completeness/honesty rather than left
  silently inconsistent, but not implemented for the same reason.

No code behavior changes result from this section. The one related fix
made in this PR is a correction to a now-stale code *comment* (not a
behavior change): `hardDown`'s inline note previously read "現状どの技か
らも未結線" ("currently unused by any move") — no longer true since Godan's
天蓋落とし and 弾丸頭突き both set `down:'hardDown'`. Corrected to say so.

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
