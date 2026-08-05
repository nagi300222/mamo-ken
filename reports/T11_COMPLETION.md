# T11 Completion — モグゾー・ピスケ・ゴダン再設計データ

## PR / scope

- PR: #33
- Branch: `feature/roster-core3-v1`
- Base: main after T10 (`5103c18557addbbc6fba516452349d3831e19c54`)
- Runtime integration: none
- Runtime / existing BAL / online protocol / server / UI / assets / dist behavior diff: 0

## Shared structure

Each current character has:

- exactly seven command-move slots;
- one provisional ability special;
- five recommended combo records;
- one matching CPU Persona ID;
- a 24-pose canonical-to-current asset mapping plus `cmd1..3` mapping;
- an audited current HP/Guard/damage/startup/S-gain table.

Existing command slots 1–3 are generated from `CURRENT_CONTRACT.bal.CMD.moves`. Their names, direction sequences, triggers and types are not copied into a second source and are not changed.

Slots 4–7 and specials remain `provisional`. This PR makes them reviewable data but does not activate them in the HTML runtime or alter existing BAL.

## Character data

### モグゾー / standard

- Existing slots: 地走り / 昇撃 / 引き寄せ投げ.
- Provisional slots: 踏み掌 / 伏せ返し / 岩走り / 根性連掌.
- Special: 根性 (`guts`).
- Difficulty distribution: beginner 4 / intermediate 2 / advanced 1.

### ピスケ / rush

- Existing slots: 二連牙 / スライディング / 宙返り蹴.
- Provisional slots: 風切り / 尾返し / 潜り牙 / 追走連牙.
- Special: チェイス (`chase`).
- Difficulty distribution: beginner 3 / intermediate 2 / advanced 2.

### ゴダン / power

- Existing slots: 地割れ / 山掴み / 巌の構え.
- Provisional slots: 岩肩 / 叩き落とし / 踏み潰し / 大岩返し.
- Special: ヘビーアーマー (`heavy_armor`).
- Difficulty distribution: beginner 4 / intermediate 2 / advanced 1.

## Recommended combos

Each character has five records. Normal-route estimates stay at or below 320 damage and conditional-route estimates stay at or below 360 damage. These are data/review targets, not active runtime rewrites.

## Asset mapping

The T08 canonical 24 pose IDs are mapped to the audited current runtime tokens. Notable aliases:

- `flinch -> hurt`
- `victory -> win`
- `*_telegraph -> tele_*`
- `*_attack -> atk_*`
- `roar_inhale -> roar_charge`
- `roar_release -> roar`
- `grab -> grab_reach`

D-02 S6 remains `crouch / sway / lunge / crouch_atk`. Existing command poses remain `cmd1 / cmd2 / cmd3`.

## Verification

- 3 characters / 21 command records / 15 combo records.
- Slots 1–3 match the audited current definitions exactly.
- Slots 4–7 and specials are provisional.
- Per-character inputs and IDs are unique.
- Difficulty distributions match character difficulty.
- Combo target caps pass.
- Persona IDs match archetypes.
- Every mapped pose exists in the audited current pose list.
- Every ability has neutral Gyuiin effect.
- Stable roster serialization/hash and changed-data divergence.
- Full Core CI, audit, mobile build and scoped runtime diff are the merge gate.

## Remaining integration boundary

T03–T11 now provide the target Core contracts and roster data. Replacing the legacy monolithic HTML runtime, enabling new slots 4–7, applying candidate BAL, converting actual images and changing online wire/state flow require explicit integration PRs with long-run desync and gameplay regression tests.
