# T14 Completion — current command shadow observer

## PR / scope

- PR: #36
- Branch: `feature/runtime-command-shadow-v1`
- Base: main after T13 (`ef25c23d3d12ab9628c0a63492c4072e0c1b8493`)
- Runtime injection: none
- Runtime / BAL / online protocol / server / UI / assets / dist behavior diff: 0

## Added boundary

T14 adds an observation-only command shadow between the T13 legacy input bridge and the T03 current-compatible command parser.

For each runtime-shaped input packet, the shadow:

1. converts mapped legacy commands to normalized Core input events;
2. maintains independent P1/P2 direction histories and frame/order cursors;
3. reproduces the current legacy `detectCommandMove` selection rule;
4. resolves the same trigger through the Core current-compatible parser;
5. records command/fallback decisions and whether they match.

The shadow never executes a move, mutates the runtime, changes the packet, writes back a decision, or activates provisional definitions.

## Authority contract

- execution authority: `legacy-runtime`;
- Core authority: `observation-only`;
- runtime injection: `false`;
- write-back: `false`;
- provisional activation: `false`;
- parser profile: `current-compat`.

## Current compatibility

All nine current commands are checked from `CURRENT_CONTRACT.bal.CMD.moves`:

- モグゾー: 地走り / 昇撃 / 引き寄せ投げ;
- ピスケ: 二連牙 / スライディング / 宙返り蹴;
- ゴダン: 地割れ / 山掴み / 巌の構え.

Command observations contain the current command ID, slot and name. Normal attack/grab fallbacks are also compared.

## Logging / determinism

- P1/P2 histories and order cursors are isolated;
- passthrough inputs and guard hold do not affect command history;
- the observation log has a configurable positive maximum and drops only the oldest entries;
- state hashing uses stable serialization;
- fixed 10,000F fixture hash: `2553e560`;
- fixture observations: `360`;
- legacy/Core mismatches: `0`;
- a changed trigger produces a different hash.

## Verification

- TypeScript strict: success;
- existing Core suites: success;
- all nine current commands: legacy/Core match;
- P1/P2 logical input equivalence: success;
- same-frame passthrough/order continuation: success;
- mismatched trigger fallback parity: success;
- 24F direction expiry parity: success;
- log cap and source-copy independence: success;
- invalid current character / regressing frame / invalid log size rejection: success;
- 10,000F deterministic shadow run: success;
- current implementation audit before build: success;
- mobile build: success;
- current implementation audit after build: success;
- runtime scoped diff: success.

The first CI run exposed only an incorrect test expectation that the 10,000F fixture would fill all 512 log slots. The scripted fixture creates 360 trigger observations, so the assertion was corrected to the actual deterministic count. No production logic changed for that correction.

## Non-changes

This PR does not change:

- `prototype/mamoken_prototype_v01.html`;
- `index.html`;
- `dist/mamoken_mobile.html`;
- current BAL or existing nine command moves;
- input execution or current command execution;
- online protocol or server;
- current UI / assets / gameplay;
- provisional moves, timing or values.

## Next boundary

T15 can inject an off-by-default diagnostic hook into the monolithic runtime. The hook should feed the exact local/CPU/online packets into this shadow and expose only bounded diagnostics. Core decisions must remain non-authoritative, and command execution switching must remain a later separate PR.
