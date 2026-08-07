# G02 Completion Report — Read-Only Legacy Adapter (shadow_only)

## Scope

G02 adds `src/core/legacy-adapter-v2.ts` (+ `src/core/legacy-adapter-v2-types.ts`), a pure,
read-only adapter that converts today's live legacy battle-frame snapshot (the same `B`/fighter
shape G01's `runtime-adapter.ts` already reads) into a fully re-validated `BattleStateV2`
(`design/combat/contracts/MAMOKEN_BATTLE_STATE_AND_MOVESPEC_V2_v0.1.md`).

```text
status                 PROTOTYPE_CANDIDATE (adapter output re-validated against BattleStateV2)
authority               shadow_only
live runtime authority  false
writeBack               false
```

G02 adds no resolver, no runtime hook, no authority switch, and does not touch `prototype/`,
`dist/`, `runtime/`, `server/`, `assets/`, `src/product/`, or `design/product/` (confirmed by
`git diff --exit-code main -- prototype dist runtime server assets src/product design/product`).

## Re-audit of the legacy snapshot (source-of-truth check, per the task instruction)

The handover research from before this task assumed a "v1 snapshot" close to `src/core/types.ts`'s
`BattleState`/`FighterState`. Re-auditing the actual live source (`prototype/mamoken_prototype_v01.html`,
post-CMD-R1) turned up several real differences, all reflected in the adapter's design rather than
papered over:

- **No live `posture` field.** The fighter object only has `phase` (a single string covering both
  control-state and posture) plus `dodgeType`. This adapter derives `(controlState, postureState)`
  from `phase` (+`dodgeType` for `dodge`, +`atkLv` for the one crouch-attack case) via an explicit,
  exhaustive mapping table — anything outside that table is rejected, not guessed.
- **No live `bulletCharge`/charge-gauge field at all**, for any character, including `bullet`. See
  "Bullet fails closed" below.
- **No single `Action`-named field.** Action state is scattered across `phase`/`pf`/`atkLv`/
  `cmdMove`/`hasHit`/`landedHit`. This adapter synthesizes `ActionStateV2` from those fields (see
  "Action mapping is intentionally coarse" below).
- **`B` (not `game`) holds `round`/`wins`.** `wins` is a plain 2-element array (`[0,0]`), not the
  `Record<PlayerIdV2, number>` shape `RoundStateV2.wins` expects. The adapter converts the array to
  a `{0,1}` record; it never reads or writes `game`.
- **`tools/audit_current_impl.mjs`'s `fighterPhases` scan is over-broad.** Its regex does not
  distinguish a fighter's own `phase` field from the clash minigame's `B.clash.phase`. Confirmed by
  direct grep: `'in'`, `'select'`, `'reveal'` are *only* ever assigned to `B.clash.phase`, never to
  `f.phase`. `CURRENT_FIGHTER_PHASE_SET` (used by G01's `runtime-adapter.ts` and inherited by
  `reports/current_impl_phases.json`) therefore contains 3 values that can never legitimately occur
  on a real fighter object. This is a pre-existing characteristic of the already-merged G01 contract,
  not something G02 introduces or fixes (fixing the shared audit tool is out of scope for a
  read-only G02 adapter and would ripple into G01's own reviewed contract). G02 uses its own,
  narrower, verified 21-value phase set (`LEGACY_FIGHTER_PHASES_V2`) instead of reusing
  `CURRENT_PHASE_REPORT.fighterPhases`, and explicitly rejects `'in'`/`'select'`/`'reveal'` as
  "unknown phase" (tested).
- **Per-character max resource values (`maxHp`/`maxGuard`/...) are not mirrored into
  `src/core/constants.ts`.** The live `maxHpFor(c)`/`maxGuardFor(c)` read from `BAL_R1_CHARS`, a
  top-level `const` that is *not* nested inside `BAL` and is therefore not captured by
  `reports/current_impl_constants.json`'s `bal`/`characters` fields (`characters[i].gMax` exists but
  is a different, currently-unused value; there is no `characters[i].hp` at all). The live runtime
  itself never stores a fighter's max values per-frame either — `newFighter()` only stores the
  *current* `hp`/`guard`, looking the max up once from `BAL_R1_CHARS` at battle start and discarding
  it. Fabricating these from `BAL.HP` (a single legacy top-level constant, apparently stale since
  `maxHpFor` no longer reads it) would silently produce wrong per-character values. G02 instead
  requires the caller to supply them via `LegacyAdapterV2Context.fighterSeeds` — exactly the same
  precedent G01 already established for `rngState`/`aiRngState` (values a single frame snapshot
  never carries). Missing/invalid seed data is a **missing resource** rejection.
- **No live `abilityId`/ability-phase concept.** `src/core/ability-hooks.ts` is shadow-only and
  unconnected (established in G01's own research). `FighterSeedV2.abilityId` is required text; G02
  requires the caller to supply it per fighter via the same `fighterSeeds` context, rather than
  invent a character→ability naming convention unilaterally.

## Findings that shaped the mapping (owner-facing)

1. **`BattleStateV2`'s resource validator requires strictly-integer `hp`/`guard`/`sGauge`/
   `focusGauge`/`ultimateStock`, but the live runtime routinely produces fractional guard/focus/hp**
   (chip damage, guard regen, and `dMul`-scaled hits all leave fractional remainders — G01's own
   `runtime-adapter.test.mjs` fixture uses `guard:93.4`/`focus:18.5` as valid V1 values). This is a
   pre-existing V1→V2 tightening from G01/G01.2, not something G02 changes. G02 does **not** round
   fractional legacy values to fit — rounding would silently discard real precision the source
   reported, which is the same class of fabrication the task explicitly forbids for missing data.
   It rejects non-integer `hp`/`guard`/`s`/`focus` instead (tested). **In practice this means most
   real in-flight snapshots (anything with a fractional guard/focus value at the moment of capture)
   will fail adaptation** until the schema or an explicit, reviewed rounding contract is decided —
   flagged for the owner; not a decision a read-only G02 adapter should make unilaterally.
2. **Bullet fails closed.** `validateBattleStateV2` requires a valid `bulletCharge` whenever
   `characterId==='bullet'`, and forbids it (must be `null`) otherwise. The legacy source has no
   `BulletCharge` gauge implemented at all (confirmed absent from the live fighter object, and this
   was also flagged during CMD-R1 as an unwired mechanic). Any snapshot where either fighter's
   character is `bullet` is therefore rejected as a **missing resource**, rather than fabricated as
   `{value:0,...}`.
3. **Action mapping is intentionally coarse.** `ActionStateV2.phase` (`idle|telegraph|startup|
   active|recovery|completed`) is explicitly *not* G02's responsibility to resolve finely — the v0.1
   design doc's own roadmap names "G03 frame/advantage shadow" as the very next step after G02. This
   adapter maps `idle` 1:1 (rejecting if `pf!==0`, since the idle invariant requires it) and every
   other legacy phase to the single coarse value `'active'` — true in the sense that something is
   genuinely underway, but it does not yet claim which contact sub-window. `actionId` is the legacy
   phase name; `moveId` is the command move's name when one is active; `startedCombatFrame` is a real
   derived value (`frame - pf`, i.e. the frame at which `pf` was last 0), not a placeholder;
   `cancelConsumed` is mapped from the real `landedHit` flag (BAL-R1.1); `currentContactIndex` is
   always `0` (no live per-hit index exists for multi-hit moves beyond the boolean `hasHit`).
4. **`freeze` and `flow` are read as orthogonal**, matching the design doc's own framing. The legacy
   source only ever pauses everything via `B.hitstop`; which `FreezeKindV2` that pause "is" depends
   on which flow it occurs during (`ultCine`→`ULTIMATE_FREEZE`, `ko`→`KO_FREEZE`, `clash`+`in`→
   `GYUIIN_INTRO`, otherwise→`HITSTOP`). This mirrors `COMBAT_CONTRACT_V2.freezePolicy`'s own
   identical gating behavior across those four kinds — not a guess.
5. **`SWAY_SHALLOW` vs. `SWAY_DEEP` and `ultimate_freeze` (as a `flow`, not a `freeze.kind`) are
   never produced.** The legacy `dodgeType==='sway'` has no live signal distinguishing "shallow" from
   "deep" — this adapter maps it to `SWAY_DEEP` (the fuller evasion posture; BAL-R1.1's own dodge
   contract treats it as a committed evasion, not a partial lean) and documents `SWAY_SHALLOW` as
   currently unreachable via this adapter, pending a live signal. `BattleFlowV2` separately lists an
   `'ultimate_freeze'` *flow* value distinct from the `freeze.kind` of the same name; the legacy
   source has no sub-state that would ever produce it (the entire ultimate cinematic sequence is one
   flat `B.flow==='ultCine'`), so this adapter never emits it. Neither is a correctness bug — both
   are documented gaps in what a single legacy frame can distinguish, not fabricated values.
6. **`defense.mikiriWindowF` and `defense.lastResult` are always `0`/`'NONE'`.** MIKIRI's active
   window is an input-timing check, not a stored per-frame counter, and the last contact result is
   resolved and discarded inside `hitApply()`, never persisted on the fighter object. `dodgeWindowF`
   and `armorHitsRemaining`, by contrast, *are* derived from real fields (`pf` vs. `BAL.DODGE.judgeF`;
   `cmdArmorUsed`/`moveArmorStartF`/`moveArmorEndF` and the roar armor window `pf∈[4,15]`).
7. **`spatial.overextendedPlayer`, `spatial.lastPositionBatchId`, and `lastBatchId` are always
   `null`/`0`/`0`.** No live analog exists for "overextended" or for a batch-resolver at all
   (`G09 simultaneous resolver shadow` is still 7 steps away on the design doc's own roadmap); `0`/
   `null` here are the only truthful values a source with zero batches and no overextension concept
   can report, not initial-state-factory fallbacks for data that was actually available.
8. **`round.timeoutEnabled` is always `true`.** The live ruleset has no mode that disables the round
   timer; this is a documented constant fact about the current ruleset, not a per-instance guess.

## Fail-closed behavior (tested)

Rejects, via `LegacyAdapterV2Error` (one or more `{path, expected, actual}` issues):

- missing/invalid `seed` (`context.rngState`) or `aiSeed` (`context.aiRngState`)
- missing per-fighter `combo`
- unknown `phase` (including the 3 spurious `'in'/'select'/'reveal'` audit-tool entries)
- unknown posture (`dodgeType` outside `crouch|sway|lunge`)
- missing resource (`bulletCharge` for a `bullet`-character fighter; missing `fighterSeeds` entries)
- unsupported flow (`battle.flow` outside the 7 audited legacy values, or an unrecognized
  `battle.clash.phase`)
- non-integer `hp`/`guard`/`s`/`focus` (see Finding 1)
- structurally invalid source (`null`, wrong-length `battle.p`, missing required fields)
- any `validateBattleStateV2` failure on the constructed candidate state (the adapter always
  re-validates its own output before returning it — it never returns a state it hasn't itself
  checked against the existing, already-reviewed validator)

Never backfills 0/initial-state defaults for any of the above; a missing/invalid required value is
always a hard rejection.

## Determinism

`adaptLegacyBattleToV2` and `hashLegacyAdaptedBattleV2` are pure functions of `(source, context)`
with no live-clock/random dependence. The mutated-input test confirms the returned state does not
alias the source (later mutation of the source object does not change the returned state), and the
repeated-call test confirms identical `(source, context)` always produces identical state and hash.

## Tests added (`test/legacy-adapter-v2.test.mjs`)

- representative fixture → valid, independently re-validated `BattleStateV2`
- full field equality against a hand-computed expected object
- distinct P1/P2 combo counts preserved independently
- seed/aiSeed direct preservation (including a second fixture with different seed values)
- same snapshot ⇒ same `BattleStateV2` and same hash; a 1-field change ⇒ different hash
- source object is not mutated / later external mutation does not leak into the returned state
- P1/P2 swap produces the symmetric swapped output
- fail-closed: missing seed, missing combo, unknown phase (incl. the 3 spurious values), unknown
  posture, missing resource (Bullet), unsupported flow, non-integer resource, structurally invalid
  source
- clash minigame sub-phase → `gyuiin_intro`/`gyuiin_play`/`gyuiin_result`
- freeze derivation (`NONE`/`HITSTOP`/`ULTIMATE_FREEZE`)
- clinch engagement/posture override
- crouch-attack posture derivation
- no-live-import guard (source text does not `import`/`require` the prototype or `runtime/**`)

## CI wiring

- `package.json`: added `check:legacy-adapter-v2`.
- `.github/workflows/combat-v2-contract.yml`: added a "Validate G02 read-only legacy adapter" step
  and added the two new `src/core/legacy-adapter-v2*.ts` / `test/legacy-adapter-v2.test.mjs` paths to
  its trigger list. The existing "Enforce G00 scoped diff" step in this same workflow already covers
  G02's own scoped-diff requirement (no `prototype`/`dist`/`runtime`/`server`/`assets` changes).

## Changed files

```text
src/core/legacy-adapter-v2.ts            (new)
src/core/legacy-adapter-v2-types.ts      (new)
test/legacy-adapter-v2.test.mjs          (new)
package.json                             (+check:legacy-adapter-v2 script)
.github/workflows/combat-v2-contract.yml (+G02 step, +trigger paths)
reports/combat/G02_COMPLETION.md         (new, this report)
```

## Not done (by design; matches the task's explicit stop instruction)

No G03 work (frame/advantage shadow) was started. This report and the mapping/finding writeup above
are the full deliverable; G02 does not auto-cascade into G03.
