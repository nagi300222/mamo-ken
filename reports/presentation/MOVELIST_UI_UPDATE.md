# PRESENTATION-R1 (B): わざ表 COMMAND/MODERN/ABILITY Tabs

Replaces the old single-page わざ表 (`rMovelistOverlay()`: 3 hardcoded Command
techniques + the shared, stale `COMBO_ROUTES` 4-route list) with a scrollable,
tabbed UI generated live from the same data the battle engine itself reads —
`BAL.CMD.moves`, `MODERN_PATTERNS`, and a new `ABILITY_DESCRIPTIONS` text
table. Addresses Issue #79 item (3) for the COMMAND/MODERN/ABILITY portions.

## Scope note: split from the original (B+C+G) grouping

This PR ships the わざ表 tab rework only (item B). The character-select
detail screen sync (item C: HP/Guard/Normal Chain Limit/stat/Modern/Classic
Cancel sync; item G: removing stale 3-technique/old-damage/old-combo/old-Focus
references) targets a separate, much larger generated system —
`window.__MAMOKEN_CHARACTER_CATALOG__` (built by
`tools/build_character_catalog_browser.mjs` from its own source data, not
`BAL.CMD.moves`) — and touching both systems in one PR would make review and
rollback harder than necessary. Per the standing "split into safe multiple
PRs" policy, that sync is tracked as an immediate follow-up PR. The COMBO tab
is deferred to PRESENTATION-R1 (D), which replaces `COMBO_ROUTES` with
per-character engine-verified routes (measured damage, not theoretical) —
adding a COMBO tab now would either duplicate that work or ship the same
stale/unverified numbers this task explicitly told us not to display.

## What changed

- **Tab framework**: `MOVELIST_TABS` (`COMMAND`/`MODERN`/`ABILITY`),
  `movelistTab`/`movelistScroll`/`movelistMaxScroll` state, `movelistTabRect()`
  — same tab-bar/scroll-button pattern already proven in the existing
  `rCharacterDetail()` screen (`characterDetailTab`/`characterDetailScroll`),
  reused for visual and interaction consistency rather than inventing a new
  pattern.
- **COMMAND tab** (`drawMovelistCommand()`): all 7 of the active character's
  Command moves, live from `commandMovesFor(c)` — input sequence, name,
  frame data (startup/active/recovery, or the stance-type
  startup/counter-window/fail-recovery triple, or the grab-type
  startup/whiff-recovery pair), damage, guard damage, hitstun/blockstun,
  Classic Cancel window, and a badge row (`moveBadges()`) surfacing every
  gate/special field already on the move object (Modern-eligible, resource
  cost, armor window + damage-reduction %, Iron Wall alt, Feint/Delay window,
  unblockable, Pressure-only, Charge-gain, Guard-restore, Finisher/comboEnd,
  multi-hit) as short player-facing text instead of the old raw internal
  `tags` strings (some of which contain dev-only annotations like
  "小Pushback(未結線)").
- **MODERN tab** (`drawMovelistModern()`): every entry of
  `MODERN_PATTERNS[charId]` (the actual R4 substitution table the engine's
  `tryModernReplace()` reads), rendered as its H/M/L sequence → resulting
  move name, with a one-line mechanic explainer quoting the real
  `MODERN_HIST_TIMEOUT_F` constant (45F).
- **ABILITY tab** (`drawMovelistAbility()`): each character's ability name
  (from `ROSTER[].ability`) plus a trigger-condition/effect description from
  the new `ABILITY_DESCRIPTIONS` table. This table is prose, not new logic —
  every number it quotes (30% HP threshold, 3 Armor Stock, 12F CHASE window,
  100 DARK gauge, 360F BODY duration, etc.) is copied from the already-live
  vNext PR4 ability state-machine code, not invented. See §3 for the
  code-location mapping.
- **Fixed a display bug found while building the COMMAND tab**: 巌の構え
  (Godan's stance-type move) has no `ccWindow` field at all (stance-type
  moves aren't Classic-Cancelable) — the naive `'CC受付'+m.ccWindow+'F'`
  concatenation would have printed "CC受付undefinedF". Caught via a
  screenshot smoke check before commit; fixed by gating the line on
  `m.ccWindow!=null`.

## 3. ABILITY_DESCRIPTIONS → code mapping (no invented values)

| Character | Trigger constants quoted | Source |
|---|---|---|
| Moguzo | HP≤30%, +10% dmg, 1/round grit-save | `f.hp<=maxHpFor(f.c)*0.30`, `gutsOutgoing()` ×1.10, `gritAvailable`/HP1 save in `applyChip`-adjacent damage resolution |
| Pisuke | Hitstop-end+12F window | `att.chaseReadyUntilF=B.f+B.hitstop+12` |
| Godan | Stock 3, armor % per move, Hyper Armor | `armorStock:3`, each move's `armorDmgMul`/`hyperArmor` |
| Hakuma | Gain on Mikiri/Guard success, no timeout | `ironWallReady=true` at the Mikiri-success and Guard-success call sites |
| Chirka | trickWindow s/e per move, recovery 6/12, Delay +8F | each move's `trickWindow`, `specForCmd()`'s `feintResolved?6:12` and delay `+8` |
| Takimaru | Pressure window = stun+12F | `pressureUntilF=B.f+A.hitstun+12` (HIT) / `+A1.blockstun+12` (BLOCK) |
| Yomikage | Dodge recovery prebuffer, Just window 5-9F, ±2F/×1.10 | `yomiQueuedLv` set during `dodge` phase, `yomiJust=(def.pf>=5&&def.pf<=9)`, `specForCmd()`'s Just `-2`/`×1.10` |
| Bullet | Charge cap 3, same-move no-gain | `chargeGainOnHit()`'s `Math.min(3,...)` + `chargeLastMove` check |
| Dark Moguzo | +30/hit, cap 2/3, 100→READY, BODY 360F, startup -1/-2, +8% | `darkChainTrigger()`'s `+30`/cap, `darkBody=true;darkBodyRemainingF=360`, the Normal/Command `-1`/`-2` startup snapshots, `darkBodyOutgoing()` ×1.08 |

## 4. Verification

- Syntax check on the extracted `<script>` body: OK.
- All 35 `npm run check:*` scripts: green.
- Render-path smoke test (`presentation_r1_b_movelist_smoke.mjs`, deleted
  after use): all 9 characters × all 3 tabs rendered via the real
  `rMovelistOverlay()`, scrolled to the bottom via the real
  `movelistPress()` scroll-button hit-test, tab-clicked via the real
  press-routing, and backed out to the pause screen — 0 exceptions, 0 page
  errors.
- Manual screenshot review (Godan/Chirka/Bullet/Dark Moguzo COMMAND tabs,
  Godan MODERN/ABILITY tabs) confirmed no text overflow/overlap and caught
  the `ccWindow` bug above before commit.
- This screen only renders while `game.screen==='movelist'` (a paused,
  non-simulating state) and reads `B.p[...]`/`BAL.CMD.moves`/
  `MODERN_PATTERNS` read-only — no `fightStep()`/`advance()`/`hitApply()`
  code path was touched, so no combat/hash-invariance test was needed for
  this PR (unlike PRESENTATION-R1 (A), which added always-on per-frame HUD
  reads during live battle).

## 5. Follow-up (tracked separately, not this PR)

- Character-select detail screen sync (items C/G) — separate PR.
- COMBO tab with engine-verified per-character routes — PRESENTATION-R1 (D).
