# T27 Completion Report — Additional Move Readiness Gate v1

## Scope

- Added a deterministic readiness gate for the twelve design-confirmed command moves in current-character slots 4–7.
- Evaluated each move across design, input, schema, MoveSpec, runtime integration, verification, and authority stages.
- Added explicit implementation drafts that keep unresolved numeric and runtime fields as `null` instead of inventing provisional authority values.
- Added required capability and balance-constraint tracking per move.
- Added pose, sound, CPU, online-determinism, mobile-smoke, and runtime-integration requirements before authority can be granted.

## Initial readiness result

- Total moves: 12
- Design ready: 12
- Input ready: 12
- Schema ready: 10
- MoveSpec ready: 0
- Runtime ready: 0
- Verification ready: 0
- Authority ready: 0
- Deterministic report hash: `e1766787`
- Command contract hash: `d39133f3`

## Unsupported capabilities

The current CombatMoveSpec/runtime schema cannot yet express:

1. `forward_movement`
   - Pisuke slot 7 / つむじ返し
2. `down_on_hit`
   - Godan slot 6 / 根こそぎ

These moves cannot gain authority merely by filling frame and damage numbers. Their missing runtime schema must be added first.

## Existing supported capability requirements

- Moguzo slot 7: combo limitation
- Pisuke slot 6: conditional command after successful lunge
- Pisuke slot 7: combo end, in addition to unsupported forward movement
- Godan slot 4: one-hit armor and armor timing fields
- Godan slot 7: guard pressure

## Authority boundary

- No damage, frame, advantage, knockback, combo, pose, sound, or runtime behavior values were guessed.
- All twelve moves remain without execution authority.
- Existing nine runtime commands remain unchanged.
- Prototype, dist, UI, character availability, online protocol, server, and assets were not changed.

## Validation

- The initial blocked state and a future single-move pass path are both tested.
- Authority assertion fails while any blocker remains.
- Duplicate or incomplete twelve-move draft sets fail closed.
- Full Core, command, combat, defense, gauge, ability, sprite, CPU, UI, roster, catalog, runtime, shadow, authority, audit, and mobile reproducibility workflow passed.
- Existing deterministic gameplay/runtime hashes remained unchanged.
