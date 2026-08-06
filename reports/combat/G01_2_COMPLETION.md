# G01.2 Completion Report — RNG / Combo Schema Correction

## Pull request

- PR: #61
- Branch: `fix/battle-state-v2-rng-combo`
- Base main: `8f81f508e85fb241b92567edf172e8f6af14d977`
- Status: Draft
- Merge: not performed

## Scope

G01.2 corrects BattleState V2 before G02 read-only legacy adaptation. It preserves three values already present in the current v1 snapshot without discarding, renaming, guessing, or supplying defaults:

- deterministic `seed`
- deterministic `aiSeed`
- per-fighter `combo`

No RNG generation or progression logic is changed. No combo behavior is redesigned.

## Final schema

BattleState V2 version:

```text
mamoken-battle-state-v2-v0.3
```

RNG fields:

```ts
seed: number;
aiSeed: number;
```

Both fields are required unsigned 32-bit integers and retain the current v1 snapshot names directly.

Fighter combo field:

```ts
combo: Readonly<{
  count: number;
}>;
```

P1 and P2 own independent objects. This field maps only the current runtime `combo` meaning; it is not merged with chain hits, contact count, damage-taken combo state, or any other concept.

ContactResult V2 additionally exposes future-result storage without implementing a resolver:

```ts
comboCountDelta: Readonly<Record<PlayerIdV2, number>>;
```

## Factory behavior

`createInitialBattleStateV2` requires explicit `seed` and `aiSeed` inputs. Missing or invalid values throw `TypeError`. No value is supplied through `undefined`, zero, a constant seed, or any fallback.

The initial fighter combo value is structurally present as `combo.count=0` only when intentionally creating a new initial state. G02 legacy adaptation must overwrite it with each source snapshot's actual current combo value; it may not use the initial-state factory as a fallback for a legacy snapshot.

## Validator fail-closed rules

`validateBattleStateV2` rejects:

- missing `seed`
- missing `aiSeed`
- non-integer seed values
- negative seed values
- seed values above `0xffffffff`
- missing P1 `combo`
- missing P2 `combo`
- non-integer combo counts
- negative combo counts

Validation records an error and never inserts a value.

## Tests added

- BattleState V2 version v0.3
- direct preservation of distinct `seed` and `aiSeed`
- P1/P2 independent combo counts
- JSON serialize/deserialize preservation
- valid state after deserialize
- missing `seed` rejection
- missing `aiSeed` rejection
- missing P1 combo rejection
- missing P2 combo rejection
- invalid seed range rejection
- invalid aiSeed range rejection
- invalid combo range rejection
- initial factory missing-seed rejection
- same state and same seeds produce the same deterministic hash
- changed seeds/combo change the deterministic state hash
- patcher reapplication produces byte-identical generated files
- existing 21 MoveSpec open-skeleton tests remain active
- existing clock, reach, movement, down, resource, authority, and symmetry tests remain active

## Source and generated consistency

Source patcher:

```text
tools/apply_g01_rng_combo_fix.mjs
```

Generated/verified targets:

```text
src/core/v2-types/battle-state-v2.ts
src/core/v2-validation/battle-state-v2-validation.ts
test/battle-state-v2.test.mjs
design/combat/contracts/MAMOKEN_BATTLE_STATE_AND_MOVESPEC_V2_v0.1.md
reports/combat/G01_COMPLETION.md
```

The permanent BattleState workflow reruns the patcher and requires a zero diff for all targets.

## Authority boundary

Unchanged:

```text
status: PROTOTYPE_CANDIDATE
authority: shadow_only
liveRuntimeAuthority: false
```

## Scoped diff

Allowed changes are limited to the BattleState V2 schema, validator, tests, design/completion documents, patcher, and dedicated CI.

Confirmed unchanged by diff gate:

```text
prototype/**
dist/**
runtime/**
server/**
assets/**
src/product/**
design/product/**
```

## Explicit non-changes

- current runtime unchanged
- prototype connection unchanged
- mobile distribution behavior unchanged
- server protocol unchanged
- RNG algorithm unchanged
- combo rules unchanged
- BattleState authority unchanged
- no legacy adapter added in G01.2

## G02 readiness

After the final PR-head CI passes, G02 may map current v1 snapshot fields losslessly:

```text
snapshot.seed       -> BattleStateV2.seed
snapshot.aiSeed     -> BattleStateV2.aiSeed
snapshot.fighters[0].combo -> BattleStateV2.fighters[0].combo.count
snapshot.fighters[1].combo -> BattleStateV2.fighters[1].combo.count
```

G02 must remain read-only and fail-closed.
