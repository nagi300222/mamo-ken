# PRESENTATION-R1 (A): Ability UI/Gauge/VFX Live Connection

Wires `data/art/ability_ui_manifest.json` (47 curated icon/gauge/VFX assets,
`runtime/ability-ui-manifest-browser.js`) into live battle-HUD rendering for
all 9 characters. Closes the gap `docs/implementation/vnext/CLOSURE_STATUS.md`
flagged as "Known gap carried forward: Ability UI/VFX not wired" from vNext
PR1/PR5.

## 1. Scope and layout

All new code lives in `prototype/mamoken_prototype_v01.html`'s rendering
layer only (`gauges()`/`rHUD()` and the new `abilityGaugeDescriptor()`/
`abilityStatusDescriptor()`/`drawAbilityGauge()`/`drawAbilityStatus()`/
`updateAbilityPresentation()` functions). Nothing added here is read by
`fightStep()`, `advance()`, `hitApply()`, or any other combat-logic
function — the data flow is one-directional (`f.*` combat fields → UI),
exactly as `ABILITY_UI_MANIFEST`'s own `presentationOnly:true` declares.

Placement: `gauges()` already had a documented, intentionally-empty 27px
gap at `y+22..y+49` (between the Guard bar and the Ult-stock icons), left
over from PR2's Focus-gauge removal. This PR uses it, split into two rows,
so the ability UI never overlaps HP/Guard/S/Ult:

- **y+22 row — persistent gauge**: the character's quantifiable resource
  (segmented stock/charge bar, or a single mapped-phase icon for Dark
  Moguzo). Read directly from `f.*` every frame — no external state.
- **y+35 row — status icon/VFX**: one icon at a time, either a live
  boolean/window condition (e.g. Pisuke's CHASE ready window) or a
  fixed-duration flash triggered by an edge detected in
  `updateAbilityPresentation()` (e.g. Moguzo's GUTS activation).

Both rows use the same P1/P2 mirroring (`flip`) as the existing HP/S/Guard
bars, so online-slot orientation is automatically correct without new code.

## 2. Per-character bindings implemented

| Character | Persistent gauge (y+22) | Status icon/VFX (y+35) | Live condition read from `f.*` |
|---|---|---|---|
| Moguzo | `guts_active.icon` while `gutsActive`, else `grit_available.icon` while `gritAvailable` | `guts_active.vfx` flash on `gutsActive` edge false→true; `grit_trigger.vfx` flash on `gritAvailable` edge true→false | `f.gutsActive`, `f.gritAvailable` |
| Pisuke | — (no numeric resource) | `chase_active.vfx` while `f.chaseActive`; else `chase_ready.icon` while `B.f<=f.chaseReadyUntilF` | `f.chaseActive`, `f.chaseReadyUntilF` |
| Godan | `armor_stock` 3-segment off/on from `f.armorStock` | `hyper_armor_active.vfx` or `armor_active.vfx` while `f.pf` is inside the current Command move's `armorStartF..armorEndF` window | `f.armorStock`, `f.cmdMove.armorStartF/armorEndF/hyperArmor`, `f.pf` |
| Hakuma | `iron_wall` 1-segment off/on from `f.ironWallReady` | `iron_wall_ready.vfx` flash on `ironWallReady` edge false→true | `f.ironWallReady` |
| Chirka | — | Priority: `delayed_unblockable.vfx` (via the existing `cmdUnblockable()`) > `feint_success.vfx` (`trickChoice==='feint'&&trickResolved&&trickSuccess`) > `delay.vfx` (`trickChoice==='delay'`) | `f.trickChoice/trickResolved/trickSuccess`, `f.cmdMove` |
| Takimaru | — | `armor_throw.vfx` during 大回転落とし's armor window; else `pressure_ready.icon` while `pressureState==='ready'` (full alpha) or `'throwQueued'` (55% alpha — no distinct queued asset exists in the manifest) | `f.pressureState`, `f.cmdMove`, `f.pf` |
| Yomikage | — | `just_return.icon` while `f.yomiFiredJust`; else `return_ready.icon` while `yomiState==='ready'` | `f.yomiFiredJust`, `f.yomiState` |
| Bullet | `charge` 3-segment off/on from `f.charge`, `+MAX` badge when `charge>=3` | Priority: `unblockable.vfx` during 弾丸頭突き's startup; `overcharge.vfx` flash on charge reaching 3; `tackle_armor.vfx` during 蓄圧タックル's armor window; `pressure_release.vfx` flash when 圧抜き掌's Guard+15 actually restores guard | `f.charge`, `f.cmdMove`, `f.pf`, `f.guard` edge |
| Dark Moguzo | `dark_gauge` mapped-phase icon from `presentationMap` (`darkGauge` bucketed to 0/30/60/90/100, or `BODY`) | Priority: `dark_hit_trail.vfx` / `dark_chain.vfx` flash on a `darkChainUses` increment; else while `f.darkBody`, alternate `dark_body.vfx`/`dark_afterimage.vfx` every 6 frames | `f.darkGauge`, `f.darkBody`, `f.darkChainUses` |

## 3. Interpretation notes (flagging, not guessing new BAL/spec)

1. **No 9-slice calibration for the new gauge "frame" assets.** Unlike
   `HP_FRAME_WIN`/`SG_FRAME_WIN` (manually measured transparent-window
   ratios for the HP/S gauge frames in earlier PRs), `ability_ui_manifest.
   json` ships `frame`/`off`/`on` triples with no such window data.
   Measuring 9-slice windows for the new frame images is an art-calibration
   task, not something derivable from the manifest or any spec doc.
   Segments are drawn as a row of the curated `off`/`on` icons (each already
   has its own border art) without an additional frame overlay; a plain
   colored/stroked rect is the fallback when an asset fails to load — the
   same fallback convention every other UI element in this file already
   uses.
2. **Bullet's `charge` gauge has no reachable "OVER" state.** `f.charge` is
   hard-capped at 3 by `chargeGainOnHit()` (`Math.min(3,f.charge+1)`); no
   code path ever exceeds it. The manifest's `charge.over` asset is
   therefore wired into `abilityAsset()`'s lookup surface (reachable if a
   future PR ever changes the cap) but never rendered by current code,
   since doing so would require inventing an "overcharge beyond 3" BAL rule
   this task explicitly prohibits guessing. Only `charge.max` (charge===3)
   is used.
3. **Takimaru's `throwQueued` pressure state reuses `pressure_ready`** at
   55% alpha rather than a separate asset — the manifest has exactly one
   Takimaru pressure icon/VFX pair (`pressure_ready`), not a distinct
   "queued" asset.
4. **Dark Moguzo's `dark_afterimage` trigger cadence is a cosmetic choice,
   not a spec value.** No document specifies exactly when/how often the
   afterimage should appear (unlike `dark_chain`'s clear trigger — the
   `darkChainUses` increment — or `dark_body`'s clear duration —
   `f.darkBody`). Implemented as a 6-frame alternation with `dark_body`
   while `f.darkBody` is true, purely a presentation flourish with zero
   effect on combat/hash. Flagging per instruction (5)'s spirit even though
   this is a rendering-cadence choice, not a gameplay value.
5. **Godan/Takimaru/Bullet's armor VFX window reuses the same
   `armorStartF/armorEndF` fields `hitApply()`'s armor-piercing check
   already reads** (`armorWindowActive()`) — no new timing was invented; it
   mirrors combat-authoritative values read-only.

## 4. Hash-invariance proof (presentation-only requirement)

`presentation_r1_a_hash_verify.mjs` (deleted after use, run this session)
computed a per-tick FNV-1a hash of the entire `B` object minus `B.fx` (the
same established decorative-`Math.random()` exclusion PR5 proved) across
two versions of the prototype — `origin/main` (pre-connection, saved to a
temp `prototype/_baseline_presentation_r1_a.html`) and the current working
tree (post-connection) — using `startBattle()` + a `mulberry32` seed
override (same technique as vNext PR5's determinism proof) for 5 matchups
covering all 9 characters, 4000 `fightStep()` ticks each (20,000 ticks
total per side):

| Matchup | Seed | Ticks | Hash identical every tick? |
|---|---|---|---|
| godan vs hakuma | 777 | 4000 | Yes |
| bullet vs dark_moguzo | 4242 | 4000 | Yes |
| moguzo vs takimaru | 99001 | 4000 | Yes |
| pisuke vs chirka | 55 | 4000 | Yes |
| yomikage vs dark_moguzo | 313131 | 4000 | Yes |

Result: **byte-identical at all 20,000 compared ticks across both
versions, zero divergence, zero page errors.** This is a direct measured
proof (not reasoning-from-absence), consistent with vNext PR5's own
methodology — the only fields ever read by the new code are read, never
written, by any function ability rendering added.

## 5. Render-path smoke test

The hash script above never calls `render()`/`gauges()`/`rHUD()` (it only
drives `fightStep()`), so it cannot catch exceptions or asset-resolution
bugs in the new drawing code. `presentation_r1_a_render_smoke.mjs` (deleted
after use) separately drove all 9 characters through the field values that
trigger every documented gauge/status binding above, then called `render()`
directly:

- **0 exceptions** across all 9 characters' scenarios plus 30 consecutive
  real `fightStep()`+`render()` frames.
- **All 8 triggered status-VFX asset paths resolved and were already
  loaded** (`assetReady()` true) by the time of first use, confirming
  `preloadAbilityUiAssets()`'s eager load of all 47 manifest assets at
  page load succeeds before any battle can start.
- HP/Guard/S/Ult HUD elements draw every frame exactly as before (`gauges()`
  /`hpBar()`/Ult-stock loop untouched; only the previously-empty y+22..y+49
  gap gained new content).

## 6. Verification

- `node --check`-equivalent syntax check on the extracted `<script>` body: OK.
- All 35 `npm run check:*` scripts: green.
- Hash-invariance proof (§4): identical.
- Render-path smoke test (§5): 0 exceptions, all assets resolved.
- `tools/audit_command_motion_runtime.mjs` (PRESENTATION-R1 (E), merged in
  `#80`) re-run unaffected by this PR's changes — this PR does not touch
  `currentArtRequest()`/motion resolution at all, only `gauges()`/`rHUD()`.

## 7. Out of scope / carried forward

- 9-slice calibration for the new gauge frame art (§3.1) — cosmetic
  refinement, not required by any acceptance test line.
- `charge.over` asset — unreachable given the current `charge` cap; wiring
  it further would require a new BAL rule this task prohibits inventing.
- The rest of Issue #79 (わざ表 COMMAND/MODERN/COMBO/ABILITY pages,
  engine-verified combo routes, remaining 未結線/TODO audit, final
  regression report) is tracked separately and continues per the standing
  nonstop policy.
