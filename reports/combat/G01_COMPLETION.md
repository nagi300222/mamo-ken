# G01 Completion Report — BattleState V2 / Full MoveSpec V2 Schema v0.2

## Scope

- Added BattleState V2 as an orthogonal, deterministic, shadow-only state contract.
- Added Full MoveSpec V2 with tagged OPEN/resolved values.
- Added ActionStart, Position, Contact, and FrameBatch Intent/Result types.
- Added stable resolution reason codes.
- Added pure factories, validators, clock progression, P1/P2 batch swap, and deterministic hashes.
- Converted all 21 G00 move closures into Full MoveSpec V2 open skeletons without inventing numeric values.

## Authority

```text
status                 PROTOTYPE_CANDIDATE
authority              shadow_only
live runtime authority false
```

G01 adds no resolver, legacy adapter, runtime hook, or authority switch.

## BattleState V2

The state keeps separate:

- BattleFlow
- FighterControlState
- PostureState
- ActionState
- DefenseState
- AbilityState
- SpatialPairState
- RoundState
- FreezeState
- InputHoldState
- BulletChargeState

### Main invariants

- Idle actions have no action ID, move ID, or start frame.
- Fighter action clocks match the current action frame.
- DOWN/KO control requires DOWN posture.
- Bullet alone owns BulletChargeState.
- Non-Bullet fighters keep `bulletCharge=null`.
- Resource values remain within `0..max`.
- Input holds cannot start in a future simulation frame.
- CLINCH requires both fighters in CLINCH posture and a positive timer.
- Current contract keeps `sideSwap=false`.

## Current gauge correction

G01.1 current gauge schema correction. The BattleState resource schema now matches the current runtime gauge source:

- S gauge
- focus gauge
- ultimate stock
- Bullet charge in separate BulletChargeState

The unsupported standalone roar gauge fields were removed. ContactResult now exposes separate S, focus, ultimate, and Bullet-charge deltas.

## Three clocks

- `simulationFrame`
- `combatFrame`
- `fighterActionFrame[P1/P2]`

Validated progression:

- NONE: simulation, combat, and active fighter-action clocks advance.
- HITSTOP: simulation advances; combat and action clocks stop.
- ULTIMATE_FREEZE: simulation advances; combat and action clocks stop.
- PAUSE: all three clocks stop.

## Full MoveSpec V2

Full schema includes:

- identity / status / authority
- moveKind / contactKind
- timing
- contact schedule
- reach and target postures
- movement and result positions
- down and wake policy
- damage and hitstop
- advantage policy
- cancel windows
- armor
- invulnerability
- resource policy
- tags

### OPEN vs explicit absence

G01 distinguishes unresolved values from explicit `null`:

- `armor.status=OPEN` means armor presence is unresolved.
- resolved `armor.value=null` means armor is explicitly absent.
- a non-down move uses `wakeProfileId=null`.
- a down move with unresolved wake behavior uses a tagged OPEN value.

A FORMAL MoveSpec is rejected if any tagged OPEN value remains.

## 21-move conversion

- Move skeletons: 21
- Unique IDs: 21
- Status: PROTOTYPE_CANDIDATE
- Authority: shadow_only
- Numeric timing fields: OPEN for all 21
- Numeric damage fields: OPEN for all 21
- Reach import: OPEN for all 21
- Result positions: OPEN for all 21
- Armor/invulnerability presence: OPEN for all 21

Preserved from G00:

- tagged contact kind
- contact schedule structure
- movement kind
- `maximumApproachSteps=2` for つむじ返し
- down/follow-up policy
- cancel-window structure
- resource-policy reference
- advantage applicability

Actual numeric import remains G08 work.

## Intent / Result

Defined types:

- ActionStartIntent / ActionStartResult
- PositionIntent / PositionResult
- ContactIntent / ContactResult
- FrameBatchIntent / FrameBatchResult

Every intent carries batch identity, source frame, player identity, and pre-state hash. G01 validates same-batch consistency but does not resolve combat.

## Resolution reasons

- Stable reason codes: 23
- Prefix classes: `OK_`, `REJECT_`, `RESULT_`
- Includes `REJECT_FAIL_CLOSED`
- Includes `RESULT_TRADE`

## Symmetry and determinism

- P1/P2 FrameBatch swap is validated.
- Double swap returns the original batch.
- BattleState deterministic hash: `c8da27a2`
- MoveSpec hash changes when a resolved field changes.

## Validation

- BattleState V2 dedicated schema test passed.
- Full MoveSpec V2 validator passed for all 21 open skeletons.
- FORMAL-with-OPEN rejection passed.
- Invalid reach/posture, chase bound, throw advantage, Bullet charge, CLINCH, clock, freeze, and batch cases are rejected.
- G01 scoped-diff gate passed.
- G00 combat contract gate passed.
- P00 product contract validation passed with the product-only scoped-diff fix.
- Existing Core/runtime/UI/mobile workflow passed.

## Scoped diff

G01 CI enforces no changes under:

```text
prototype/
dist/
runtime/
server/
assets/
src/product/
design/product/
```

## Non-goals

- No legacy runtime adapter
- No frame or contact resolver
- No position resolver
- No throw resolver
- No down/wake resolver
- No resource/ability resolver
- No online protocol change
- No runtime authority change
- No numeric candidate promotion

## Next

G02: read-only legacy runtime adapter to BattleState V2.
