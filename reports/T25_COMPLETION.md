# T25 Completion Report — Core3 Command Overlap Contract v1

## Scope

- Added Core command definitions for all 21 confirmed commands of Moguzo, Pisuke, and Godan.
- Preserved the authority split: nine `current_impl` definitions and twelve `design_confirmed` definitions.
- Added an explicit condition ID for Pisuke slot 6 / すり抜け足: `pisuke.lunge-success`.
- Added deterministic suffix-overlap auditing within the same character and trigger.
- Formalized the candidate resolution policy as `longest-command-first`.

## Confirmed overlaps

1. Pisuke
   - Shorter: `→→＋中` / 二連牙 / current implementation
   - Longer: `↓→→＋中` / つむじ返し / design confirmed

2. Godan
   - Shorter: `↓→＋中` / 岩砕き / design confirmed
   - Longer: `←↓→＋中` / 大山押し / design confirmed

For a complete longer sequence, the longer command wins. The shorter standalone sequence continues to resolve to the shorter command.

## Condition behavior

- すり抜け足 resolves only when `pisuke.lunge-success` is active.
- Condition failure falls back to the normal low attack.
- It does not block a shorter command because no same-trigger suffix command exists for that input.

## Authority boundary

- This task adds a Core input contract only.
- `TARGET_PROVISIONAL_PROFILE` timing values remain provisional and unchanged.
- Runtime authority remains the existing nine commands.
- No MoveSpec, damage, startup, active, recovery, hitbox, command pose, CPU, online, or server behavior was added for slots 4–7.
- Prototype and dist are unchanged.

## Validation

- Definitions: 21
- Current implementation: 9
- Design confirmed: 12
- Suffix overlaps: 2
- Conditional definitions: 1
- Priority policy: longest command first
- Deterministic contract hash: `3194066f`
- Existing command parser hash remains `f5a7abc5`.
- Existing combat, runtime, shadow, canary, authority, UI, roster, catalog, and mobile reproducibility checks passed.
