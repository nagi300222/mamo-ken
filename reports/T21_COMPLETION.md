# T21 Completion — 9体63技と性能カタログ

## Status

- Base main: `ece0973b40f0270229e8384c02e13a83906e56c8`
- Pull request: #44
- Character catalog version: `character-catalog-v1`
- Characters: 9
- Basic command moves: 63
- Current runtime moves linked: 9
- Combo classification slots: 45, all unverified until MoveSpec measurement
- Deterministic catalog hash: `3dc9690b`

## Imported confirmed design

The read-only Core catalog now contains, for all nine characters:

- stable ID, name, species, style and concept
- win condition and weakness
- ATK / SPD / DEF / TEC / BRK display values
- operation and decision difficulty
- seven command moves
- command notation, direction sequence and trigger
- HIGH / MID / LOW / GRAB attribute
- Reach 0–3
- role and input difficulty
- conditions and future balance constraints
- one or two special abilities
- roar and ultimate
- CPU behavior plan
- beginner / basic / practical / advanced / maximum combo categories

No unmeasured combo route was invented. Every combo category remains `unverified_move_spec` with an empty route until the related MoveSpec is implemented and measured.

## Source precedence decisions

- Move names, commands, Reach and roles follow `design/MAMOKEN_CHARACTER_DESIGN_v1.0.md`.
- Display stats follow the fixed Combat Bible / current decisions table.
- Dark Moguzo therefore uses the fixed `4 / 4 / 3 / 5 / 3`, difficulty 5 table rather than the separately labelled selection candidate.
- Takimaru's `追い抱き` remains a candidate; all other listed special systems are confirmed.
- Piske intentionally has no command GRAB among the seven moves and relies on the universal grab action. No eighth move was invented.

## Runtime parity

The current three characters retain their existing three implemented commands exactly:

- Moguzo: 地走り / 昇撃 / 引き寄せ投げ
- Piske: 二連牙 / スライディング / 宙返り蹴
- Godan: 地割れ / 山掴み / 巌の構え

The catalog parity check compares:

- slot
- move name
- direction sequence
- attack / grab trigger
- runtime kind: attack / grab / stance

## Validation

GitHub Actions `Core contract check` run #63 completed successfully with all 30 workflow steps.

T21-specific checks:

- exactly nine catalog characters
- exactly seven moves per character
- exactly 63 moves in total
- exactly nine `current_runtime` moves
- exact move names and command notation for all 63 moves
- exact display stat and difficulty table
- Reach 3 moves contain at least two explicit future constraints
- five ordered combo categories for every character
- all 45 combo routes remain empty and unverified
- roar definitions cannot affect Gyuiin
- full-roster names, styles and ultimate names match
- current runtime command parity succeeds
- deterministic export and hash are stable
- malformed Reach 3 data is rejected

Regression checks retained:

- Core deterministic hash: `7a28953f`
- command parser hash: `f5a7abc5`
- combat hash: `7fab5c7a`
- defense hash: `99b1f043`
- gauge hash: `3ad4dad9`
- sprite hash: `e2da0b40`
- current Core-three roster hash: `9b2b349d`
- runtime adapter hash: `2f2f6296`
- runtime input hash: `a989a2c7`
- current phases: 24
- current flows: 7
- current runtime commands: 9
- RNG call count: 50
- localStorage count: 0
- BAL parity: true
- character parity: true
- pose-ID parity: true

## Distribution and scope

- Mobile distribution rebuild: no diff
- Prototype: unchanged
- Distribution source: unchanged
- Server and online protocol: unchanged
- Assets and images: unchanged
- Current playable roster: unchanged
- BAL and combat behavior: unchanged
- Input authority and T19 rollback behavior: unchanged

## Next task

T22 may consume this catalog to add a smartphone character-detail panel with:

- 性能
- わざ
- コンボ

Information visibility must remain separate from battle availability. The six combat-pending characters stay preview-only.
