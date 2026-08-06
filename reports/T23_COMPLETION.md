# T23 Completion Report — Current Three Catalog Parity v1

## Scope

- Rebuilt the current-three Core roster command definitions from the T21 confirmed character catalog.
- Preserved the nine commands that are already implemented in the runtime and continued auditing them against the runtime contract.
- Replaced twelve T11-era provisional command concepts with the confirmed slot 4–7 designs for Moguzo, Pisuke, and Godan.
- Added confirmed attribute, Reach, role, condition, and balance-constraint fields to the Core roster command contract.
- Removed invented damage authority from the twelve design-only commands; unresolved damage is represented as `null`.
- Retired fifteen speculative combo routes and restored five explicit `unverified_move_spec` categories per character.

## Retired provisional command names

- Moguzo: 踏み掌 / 伏せ返し / 岩走り / 根性連掌
- Pisuke: 風切り / 尾返し / 潜り牙 / 追走連牙
- Godan: 岩肩 / 叩き落とし / 踏み潰し / 大岩返し

## Authority boundary

- Runtime authority: slots 1–3 only, nine commands total.
- Design-confirmed Core data: slots 4–7, twelve commands total.
- Balance authority for slots 4–7: unresolved.
- Combo routes and measured damage: unresolved.
- Character ability hooks remain provisional and have zero Gyuiin effect.

## Validation

- Current-three catalog parity: 21/21 commands.
- Runtime parity: 9/9 commands.
- Design-only commands: 12/12 with `estimatedDamage: null`.
- Combo categories: 15/15 explicitly unverified, with no route or damage data.
- Retired provisional names: zero remaining.
- Core3 deterministic hash: `382efe51`.
- Existing Core, command, combat, defense, gauge, sprite, CPU, UI, runtime, online-authority, mobile-build, and detail-panel regressions passed.
- Prototype, dist, server, assets, UI behavior, and battle behavior were not changed by this task.
