# T12 Completion — Core / legacy runtime read-only adapter

## PR / scope

- PR: #34
- Branch: `feature/runtime-adapter-v1`
- Base: main after T11 (`d683ecd77498e9b8207827f0c1675121eaf24df0`)
- Runtime behavior integration: none
- Runtime / existing BAL / online protocol / server / UI / assets / dist behavior diff: 0

## Added boundary

T12 adds the first explicit boundary between the legacy monolithic HTML runtime and the Core contracts.

`adaptLegacyRuntimeBattle()` copies the audited current runtime battle state into a Core `BattleState` snapshot. It does not mutate the source, write data back to the runtime, replace runtime logic, or activate provisional values.

The adapter reads:

- battle: `B.f`, `B.flow`, `B.timer`, `B.p[2]`;
- fighter: `c.id`, `phase`, `hp`, `guard`, `s`, `ult`, `focus`, `combo`, `pf`;
- explicit external context: simulation PRNG state and AI PRNG state.

The external PRNG context is a required future integration seam. T12 does not inject it into the current HTML runtime and does not change current RNG consumption.

## Current / provisional boundary

The adapter accepts only:

- the three audited current character IDs;
- fighter phases from `CURRENT_PHASE_REPORT`;
- battle flows from `CURRENT_PHASE_REPORT`;
- finite non-negative current numeric state;
- unsigned 32-bit PRNG state.

Provisional fighter phases, provisional battle flows, planned/boss character IDs, missing fields and invalid numeric values fail fast with a path-specific `RuntimeAdapterError`.

## Contract flags

`RUNTIME_ADAPTER_CONTRACT` records:

- direction: `legacy-runtime-to-core-snapshot`;
- write-back: `false`;
- provisional activation: `false`;
- audited source: `prototype/mamoken_prototype_v01.html`.

## Verification

- TypeScript strict: success.
- Existing Core test suites: success.
- Runtime adapter fixture hash: `2f2f6296`.
- All audited current fighter phases accepted.
- All audited current battle flows accepted.
- Snapshot remains independent after source mutation.
- Invalid/provisional/missing state rejection tests pass.
- Current implementation audit before build: success.
- Mobile build: success.
- Current implementation audit after build: success.
- Scoped diff check for runtime HTML, index, generated dist, server and assets: success.

## Non-changes

This PR does not change:

- `prototype/mamoken_prototype_v01.html`;
- `index.html`;
- `dist/mamoken_mobile.html`;
- current BAL values;
- existing nine command moves;
- online protocol or server;
- current UI rendering;
- source assets;
- current gameplay behavior.

## Next boundary

T13 can add a passive runtime observation hook that calls this adapter behind an off-by-default switch, or proceed to normalized input bridging. Either change must remain isolated from MoveSpec execution and provisional activation.
