# G00 Completion Report — Combat Contract Closure v0.2

## Scope

- Integrated the four combat contracts and additional design returns into a v0.2 shadow-only boundary.
- Preserved all v0.1 sources as history.
- Added typed contract metadata, pure validation/audit functions, a 21-move schema-closure overlay, tests, and isolated CI.
- Did not change live combat behavior.

## Authority

```text
statusTag              PROTOTYPE_CANDIDATE
authority              shadow_only
liveRuntimeAuthority   false
formalBalanceAuthority false
```

No candidate was promoted to FORMAL.

## G-F01 CPU matchup plan

- Roster entries: 9
- Non-mirror unordered pairs: 36
- Mirror pairs: 9
- Total pair definitions: 45
- Side-swapped symmetry required for every pair

## G-F02 contact tagged union

- Move definitions: 21
- Strike: tagged with HIGH/MID/LOW
- Throw: tagged with authoritative throwRange
- Stance: tagged with stanceId
- Throw/down/stance: excluded from the standard contact-advantage formula

## G-F03 approach bound

- Pisuke slot 7 / つむじ返し
- Forward movement: CHASE_TO_CONTACT
- maximumApproachSteps: 2
- Status remains PROTOTYPE_CANDIDATE

## G-F04 contact schedule

- All 21 moves have a materialized contact schedule.
- Pisuke slot 1 / 二連牙: 2 contacts
- Pisuke slot 4 / かすみ連打: 3 contacts
- Their exact active offsets are `OPEN_TIMING`; G00 does not invent missing frame values.

## G-F05 cancel windows

- Required fields: basis, startOffsetF, endOffsetF, allowedMoveIds, oncePerCombo, statusTag
- Existing window-length candidates are represented from FIRST_CONTACT.
- Cancel graph cycle audit: 0 cycles in the candidate set.
- A synthetic two-node cycle is detected by the test.

## G-F06 resource policy

- Fixed per-move S gain is not copied into the v0.2 closure schema.
- All moves reference `resource.action-contact-v0.2`.
- Numeric resource policy remains non-FORMAL.

## Contract closure

- Posture states: NORMAL / SWAY_SHALLOW / SWAY_DEEP / CROUCH / LUNGE / CLINCH / DOWN
- Separate input normalization and action-priority constants
- Separate InputHoldState and BulletChargeState
- Three clock types
- Hitstop/global-freeze progression policy
- CLINCH: standard 24F, simultaneous-forward 18F candidates
- Reach 0–3 posture sets
- P1/P2 pair swap contract
- Deterministic closure hash: `d10f623d`

## Candidate JSON strategy

`MAMOKEN_CURRENT_3_CHARACTERS_MOVESPEC_CLOSURE_v0.2.json` is a closure overlay. It inherits numeric candidates from `MAMOKEN_CURRENT_3_CHARACTERS_MOVESPEC_v0.1.json` and adds only the required schema corrections. This avoids silently reconstructing or changing source values.

## Validation

- 21 unique moves
- 7 moves for each current character
- 9 current-anchor translations
- 12 design-confirmed numeric candidates
- Tagged-contact validation passed
- Throw/down/stance advantage exclusion passed
- Multi-hit schedule validation passed
- Cancel-window validation passed
- maximumApproach validation passed
- Resource-policy validation passed
- 36+9 matchup validation passed
- P1/P2 symmetric pair test passed
- Deterministic hash test passed
- Dedicated scoped-diff gate passed
- Existing 40-step Core/runtime/UI/mobile workflow passed

## Scoped diff

The dedicated CI verifies no changes under:

```text
prototype/
dist/
runtime/
server/
assets/
```

No live BAL, online protocol, rendering, or runtime authority was changed.

## Next

- P00 Product Source-of-Truth / Naming / Diff Governance in a separate PR
- G01 BattleState V2 and full MoveSpec V2 types after P00 or on a non-colliding branch
