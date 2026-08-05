# T07 Completion — 固有能力フック

## Scope

- Branch: `feature/ability-hooks-v1`
- Eight isolated hooks; no runtime integration.
- Gyuiin weights, timing and rewards remain identical for every hook.
- Runtime / BAL / online protocol / server / UI / assets / dist behavior diff: 0.

## Hooks

1. `guts`: three distinct moves prepare +0.05 command starter-scale relief; HP30% below gives dealt +3% / taken -3%.
2. `chase`: hit-only Knockback 0 step-cancel route and candidate limit 2.
3. `heavy_armor`: selected tagged moves, frame 4+, one strike only; grab, Mikiri and dedicated counter bypass; absorbed starter scale 0.85.
4. `iron_wall`: guard/correct dodge/just step grants one 600F token; next non-grab move gets startup -2F or guard damage ×1.15.
5. `feint`: telegraph-only, once per sequence, dedicated 8–12F recovery.
6. `pressure`: tagged hit may branch to throw; no guaranteed throw; whiff 28–34F; follow-up starter scale 0.60.
7. `just`: correct dodge/just step only, 22F follow-up token; idle waiting grants nothing.
8. `overcharge`: active success sources only, Charge 0–3, MAX release consumes all; time and Gyuiin grant nothing.

## Tests

All activation, expiry, bypass, failure-recovery, limit and Gyuiin-isolation boundaries are covered by `test/ability-hooks.test.mjs`.
