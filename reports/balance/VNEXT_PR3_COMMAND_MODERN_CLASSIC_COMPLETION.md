# vNext PR3: Command R2 / Modern R4 / Classic Cancel — Completion Report

Third of 5 PRs implementing the Fable5 vNext FINAL handoff
(`docs/implementation/vnext/NONSTOP_IMPLEMENTATION_ORDER.md`), against
`docs/implementation/vnext/COMBAT_VNEXT_FINAL.md` §8, §9, and §13. Base:
`origin/main` @ `a881eaa` (PR2, #75, already merged).

## 1. Scope

- **Command R2 (§13)**: full numeric rewrite of all 63 Command moves (7 per
  character × 9 characters) — Frames(S/A/R), Damage, GuardDamage, and
  HIT/BLOCK-advantage-derived hitstun/blockstun via the same
  `advantage = stun - (active-1) - recovery` formula PR2 used for Normals.
  All 63 moves now use `exactDmg:true` (final per-character values, no `dMul`
  double-application), matching the Normal R2 precedent (`specForLv` already
  didn't apply `dMul` either).
- **Modern R4 (§8)**: new mechanic, didn't exist before this PR. Each fighter
  tracks `modernHist` — a rolling record of qualifying Normal (mid/high/low,
  not crouch) HIT/BLOCK outcomes with a 45F lazy timeout. When a qualifying
  Normal is about to *start* and the trailing history + that level completes
  one of the character's declared patterns (`MODERN_PATTERNS`, §8's per-char
  pattern list), the engine substitutes the matching Command move instead of
  the plain Normal (`tryModernReplace()`). History resets on WHIFF, EVADE (own
  dodge), being hit, being thrown, own Roar/Ult, own Command, Down, and Round
  start — one shared `resetModernHist()` call-site list.
- **Takimaru Modern Grab (§8)**: H→L completing into 丸抱え is a grab, so it
  can't just "start" if the target isn't throw-eligible. If eligible at
  completion time, it starts immediately; otherwise it goes into
  `f.pendingModernGrab`, checked every tick (`tickPendingModernGrab()`) and
  fired the instant the opponent becomes throw-eligible while Takimaru is
  still idle. Any other action, being hit, or a Round change cancels the
  pending grab (implemented as: pending clears the moment `f.phase!=='idle'`
  is observed).
- **Classic Cancel (§9)**: new mechanic. Any Command HIT (`hitApply`'s
  unmitigated-hit branch, and the Command Grab slam in `grabHit`) opens a
  window (`f.ccActive` / `f.ccWindowUntil = B.f + move.ccWindow`) sized
  16/16/14/12F per the move's declared class (Quick/Standard both store `16`
  — they're numerically identical, so no behavioral distinction was needed
  between them; see §5 below). While the window is open and the fighter is
  still in `cmdAtk`/`grab`/`grabrec`/`grabHit`, a **direct** formal input
  match (`cm` from `detectCommandMove`/`runtimeCommandCanaryResolve` — never
  a Modern substitution) for a *different* move than the currently-active one
  interrupts into the new Command with `combo`/`comboCounter` preserved
  (`startCmdAtk`/`startCmdGrab` gained a `preserveCombo` param). Same-command
  direct-loop is rejected by comparing `cm.move !== f.cmdMove` (object
  identity — `commandMovesFor()` always returns the same array, so this is
  safe). Command Grabs are valid cancel targets. Blocked Commands do **not**
  open a window (§9 "Command HITのみ").
- **`specForCmd()`**: removed the legacy fallback that silently gave every
  `trigger:'low'` Command move `lightDown` when `m.down` was unset. §13 only
  gives an explicit down-type to the Commands that should have one; the rest
  are now plain no-down hits (mirrors §4's removal of Normal LOW's common
  lightDown).
- **Godan's 巌の構え (stance)**: reworked from a single `stanceF` window into
  the three phases §13 actually specifies — `startupF`(5, open target)
  →`counterActiveF`(8, the actual auto-counter window, unchanged mechanic)
  →`failRecF`(22, vulnerable recovery if nothing happened). Previously *every*
  frame 1–12 was counter-active; now only frames 6–13 are, and whiffing the
  window costs 22F of recovery it never used to.
- **`unblockable` (new field/mechanic)**: Bullet's 弾丸頭突き is the one base
  move §13 marks `unblockable`; `attackResolve()`'s `guarded` check now
  excludes it so it hits through guard/blockstun-held.
- **`throwEligible()`**: factored the grab-success condition (previously
  inlined in `grabResolve`) into one function, shared with the Takimaru
  pending-grab tick — no behavior change to plain/Command grabs, just removed
  duplication ahead of adding a second call site.

## 2. Explicit interpretation calls (flagging for reviewer)

§13's prose is terse in places; these are the calls I made, each chosen to
match the nearest existing precedent or the dominant pattern already in the
data, and each is a real behavioral delta worth a second look:

1. **Command Grab down-type normalized to `throwDown`.** 7 of 9 characters'
   basic single-target Command Grabs already had explicit `down:'throwDown'`
   from CMD-R1; only Moguzo's 引き寄せ投げ and Godan's 山掴み didn't (the
   "旧9技無変更" carve-out that no longer applies once this PR rewrites all
   63 moves anyway). §13 doesn't annotate down-type for *any* grab, so I
   brought those two in line with the other 7 rather than leaving an
   unexplained inconsistency.
2. **`comboEnd` narrowed to only the moves §13 explicitly pairs with
   "Finisher".** Previously every character's 7th Command move ended the
   combo unconditionally (CMD-R1 convention). §13 only writes
   "Finisher"+"comboEnd" together for Moguzo's 土煙突き, Pisuke's つむじ返し,
   and Dark's 黒煙突き — the other 6 characters' slot-7 moves (including
   Godan's "Hyper"-tagged 大山押し, which is *not* one of the four declared
   CC-window classes) are silent on both. I removed `comboEnd` from those 6.
   **This is the single biggest balance-visible change in this PR** — 6
   characters' heaviest Command move no longer resets their combo scaling.
3. **Classic Cancel window defaults to Quick(16F) when §13 doesn't label a
   move.** Only Heavy(14F) and Finisher(12F) are ever named explicitly in the
   text; "Standard" appears exactly twice and is numerically identical to
   Quick (both 16F), so which of the two an unlabeled move "should" be tagged
   doesn't change any current behavior — only the raw `ccWindow:16` matters
   until/unless a future PR needs the class label itself (e.g. an Ability
   that reacts to "was that a Quick move").
4. **`reach` dropped except where §13 explicitly gives a number** (Moguzo's
   土煙突き Reach3, Chirka's つんのめり Reach0). This field has never been
   read by any gameplay code (confirmed via search — the only other `reach`
   consumer is the unrelated character-catalog UI's own `move.reach`, a
   different data structure entirely), so this is purely a documentation
   change with zero behavioral effect either way.
5. **Ability-resource-gated variants left as always-on base moves, gate
   deferred to PR4.** Stock1/Stock2/cost1/cost3/ArmorStock1/Iron Wall
   consume/Just-input alternates/Delay+unblockable variant/Feint/Pressure/
   Charge gain/暗連(Dark Chain) are all real per-character Ability mechanics
   named in §13 alongside the base numbers, but the state machines that would
   gate/trigger them are PR4 scope (`ABILITY_STATE_MACHINES_FINAL.md`, not
   yet read this PR). Every such move works today as its *unconditional base
   version* with a `(未結線)`-tagged note in `tags` pointing at the
   alternate/gated value from §13, mirroring PR2's Focus-removal-with-schema-
   kept split and PR1's ability-asset-connected-but-trigger-deferred split.
   Concretely this means: Godan's 山掴み armor and 岩砕き's armor window are
   currently *always* active (not stock-gated), Hakuma's Iron-Wall alt-damage
   numbers are inert, Chirka's Delay/Feint don't change timing yet, Yomikage's
   Just-input alt-damage doesn't trigger, Bullet's Charge-gain/cost doesn't
   accumulate/spend, Dark's 暗連 chain-compatibility list isn't enforced.
   None of this blocks Command R2/Modern R4/Classic Cancel — it's the
   intended PR4 seam.
6. **Takimaru's 大回転落とし "Classic-only armor"** and Chirka's あと出し頭突き
   "Delay版 unblockable" alt-stats are likewise left as descriptive tags, not
   enforced — both depend on that same PR4 Ability/state-provenance tracking.

## 3. Verification

- `npm run build:mobile`: reproducible, `git diff --exit-code -- dist/mamoken_mobile.html`
  clean after rebuild.
- All 34 `npm run check:*` scripts green, hashes unchanged from PR2 (they
  exercise `src/core/**`'s frozen shadow/design-catalog layer, which this PR
  does not touch — matches the documented "intentionally frozen shadow
  contract" posture from BAL-R1/NORMAL-CHAIN-R1/PR2).
- `git diff --stat`: only `prototype/mamoken_prototype_v01.html`,
  `dist/mamoken_mobile.html`, and this report changed — `src/core/**`,
  `test/**`, `tools/**`, `server/**`, `design/**` untouched.
- Headless Playwright functional checks against the live prototype (this
  session had a working Chromium, unlike the prior two vNext PRs' sandboxes):
  - CPU-vs-CPU smoke run, 5 character pairings × 15000 logic ticks each
    (75000 total `fightStep()` calls) at HARD AI difficulty — zero thrown
    exceptions, zero console errors; Command moves fired and landed in 2/5
    pairings within the observed window (Classic Cancel windows observed
    opening at least once), consistent with `cmdMoveRate` being probabilistic
    rather than a bug in move availability.
  - Targeted mechanic tests, each isolating one behavior via direct engine
    calls (bypassing RNG so the exact scenario is exercised, not hoped-for):
    1. Modern pattern completion: seeding `modernHist=[H,L]` then inputting
       `mid` on Moguzo correctly substitutes 地走り instead of a plain mid
       Normal.
    2. 45F timeout: an aged history entry is correctly wiped before pattern
       matching, falling back to the plain Normal.
    3. Classic Cancel: a landed 地走り (opens `ccWindowUntil=B.f+16`,
       confirmed) canceled into 昇撃 via 昇撃's own formal direction input,
       with `combo` preserved across the cancel (3→3, not reset to 0/1).
    4. Same-command direct-loop ban: re-feeding 地走り's own sequence during
       its own cancel window is rejected (`f.pf`/`f.cmdMove` unchanged).
    5. Takimaru Modern Grab pending: H→L against a non-throw-eligible
       opponent sets `pendingModernGrab` without starting anything; flipping
       the opponent to `idle` and ticking starts 丸抱え immediately.
- Not run this session (no online 2-browser device available, same
  environmental note as PR1/PR2's completion reports): a real cross-client
  online determinism check for Command/Modern/Classic-Cancel paths. Nothing
  in this PR reads `Date.now`/`Math.random`/`performance.now`, and no `rng()`
  call-site count or order changed (Modern/Classic decisions are all derived
  from existing deterministic state — `B.f`, `modernHist`, `dirBuf`, phase —
  never randomness), so the reasoning-level case for determinism holds, but
  flagging per the vNext report format for whoever has real-device access.

## 4. Explicitly out of scope for this PR (flagging for the orchestrator before merge)

- The 9 character Ability state machines and all resource-gating listed in
  §2.5/§2.6 above — PR4.
- Online protocol/rollback mechanics — not redesigned; only reasoned about
  above for determinism.
- `src/core/**`'s shadow contract — intentionally frozen, not resynced
  (matches PR2/BAL-R1 precedent).
