# T22 Completion Report — Character Detail Panel v1

## Scope

- Added a deterministic browser bridge generated from the T21 Core character catalog.
- Added a read-only character detail screen for all nine roster entries.
- Added three tabs: 性能 / わざ / コンボ.
- Preserved the selected roster slot when opening and closing details.
- Preserved current battle availability: only Moguzo, Pisuke, and Godan remain playable.
- Added explicit implementation labels for current runtime moves, design-confirmed moves, and candidate abilities.
- Kept all five combo categories explicitly marked 未検証 until MoveSpec and measured damage are implemented.
- Inlined the generated browser catalog into the single-file mobile distribution.

## Non-goals / unchanged

- No battle authority changes.
- No BAL, damage, frame, reach hitbox, input, CPU, online protocol, or server changes.
- No new playable characters.
- No localStorage, network, clipboard, or telemetry behavior.

## Validation

- Browser catalog contains 9 characters and 63 moves and matches the Core catalog hash.
- Browser catalog API and nested data are deeply frozen.
- Character detail screen exposes all nine entries and preserves selection state.
- Primary detail controls are at least 74 logical pixels high.
- Prototype uses the external generated catalog; dist inlines it and remains a single HTML file.
- UI contract advanced to `ui-contract-v2` with the detail-screen contract.
- Full Core/runtime/mobile regression workflow passes before merge.
