# T26 Completion Report — Browser Command Contract v1

## Scope

- Added a deterministic Core3 command contract object containing all 21 confirmed definitions, both timing profiles, longest-command priority, and the two declared suffix overlaps.
- Added a Core command-contract hash and included the contract in the generated browser character catalog.
- Updated the extended browser command shadow to v2 so it reads definitions, timing values, conditions, priority, overlaps, and contract hash from the generated Core contract.
- Removed duplicated handwritten 24F / 38F / gap / total-window values from the browser shadow.
- Added the Pisuke lunge-success diagnostic condition from current runtime state without granting execution authority.

## Contract

- Version: `core3-command-catalog-v1`
- Hash: `d39133f3`
- Definitions: 21
- Current implementation definitions: 9
- Design-confirmed definitions: 12
- Priority: `longest-command-first`
- Timing profiles: `current-compat` and `target-provisional`
- Declared suffix overlaps: 2

## Extended shadow v2

- Observer version: `runtime-extended-command-shadow-browser-v2`
- Report version: `mamoken-extended-command-shadow-report-v2`
- Deterministic observation hash: `e9407d8d`
- Synthetic observations: 21
- Observed runtime-vs-catalog conflicts: 1
- Declared contract overlaps: 2
  - `current_impl -> design_confirmed`: 1
  - `design_confirmed -> design_confirmed`: 1
- Ring capacity: 256

## Conditional input

Pisuke slot 6 / すり抜け足 receives `pisuke.lunge-success` only while the current runtime fighter has `clinchF > 0`. Without that condition, the diagnostic candidate falls back to the normal low attack.

## Authority boundary

- Runtime execution authority remains the existing nine commands.
- The browser command contract and extended shadow have no execution authority.
- No BAL, MoveSpec, damage, startup, active, recovery, hitbox, CPU, online protocol, server, selection availability, or UI behavior changes.
- Default launch remains disabled unless `?mamokenExtendedShadow=1` is present.
- No localStorage, sessionStorage, network, clipboard, timestamp, random value, or automatic export behavior.

## Validation

- Core command contract, generated browser contract, and browser deep-freeze data match exactly.
- Generated browser catalog is reproducible.
- Prototype condition hook and single-file dist are reproducible.
- Existing Core, command parser, combat, defense, gauge, ability, sprite, CPU, UI, roster, character catalog, runtime, canary, authority, and character-detail regressions passed.
- Existing deterministic gameplay/runtime hashes remained unchanged.
