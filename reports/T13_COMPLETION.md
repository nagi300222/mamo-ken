# T13 Completion — legacy runtime input normalization bridge

## PR / scope

- PR: #35
- Branch: `feature/runtime-input-bridge-v1`
- Base: main after T12 (`c604633db7f5b9060b3e998e5634e1cb60450ae2`)
- Runtime injection: none
- Runtime / BAL / online protocol / server / UI / assets / dist behavior diff: 0

## Added boundary

T13 adds a pure one-way bridge from the legacy runtime input packet `{ cmds, hold }` to the T03 Core `NormalizedInputEvent` contract.

The bridge accepts an explicit deterministic context:

- simulation frame;
- logical player `0 | 1`;
- optional same-frame starting order.

It returns normalized events, ordered passthrough commands, the untouched guard hold value and the next available event order. It does not mutate the source packet or write anything back to the runtime.

## Current mapping

The audited current runtime commands map as follows:

- `dodge:sway` -> logical `left` direction press/release;
- `dodge:crouch` -> logical `down` direction press/release;
- `dodge:lunge` -> logical `right` direction press/release;
- `atk:high|mid|low` -> Core attack event;
- `grab` -> Core grab event.

A current dodge button is an immediate tap rather than a held direction. The bridge therefore emits press and release at the same frame with consecutive order values. Current command direction history is preserved, while provisional charge detection cannot mistake the input for a continuing hold.

## Explicit non-mapping

The following current inputs remain outside the T03 command-parser event union:

- guard hold;
- roar;
- mikiri;
- ult;
- Gyuiin `mgTap`, `mgHit` and `mgPick`.

They are not discarded. Guard remains in the returned `hold` field, and the other commands are returned as canonical ordered passthrough records.

## Current / provisional boundary

- No provisional direction, attack level, command or hold is accepted.
- Unknown runtime command types fail fast.
- Missing fields, invalid player/frame/order values and invalid current command payloads fail with a path-specific `RuntimeInputBridgeError`.
- The bridge does not activate command slots 4–7, ability specials, charge or any candidate BAL.

## Verification

- TypeScript strict: success.
- Runtime input fixture hash: `a989a2c7`.
- All three dodge kinds map to logical directions and close their holds in the same frame.
- Attack and grab events pass the T03 normalized-event validator.
- P1 and P2 use the same logical direction mapping.
- Same-frame calls can chain with `nextOrder` without duplicate keys.
- Output remains independent after source mutation.
- Invalid, missing and unknown input rejection tests pass.
- Bridged `lunge -> crouch -> mid` resolves through the current command parser to モグゾー「地走り」.
- Existing Core test suites: success.
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
- current touch controls or `applyInputs()`;
- online packet/wire shape;
- CPU input generation;
- current UI rendering;
- source assets;
- current gameplay behavior.

## Next boundary

T14 can connect this bridge to a passive, off-by-default runtime observation hook, or add a pure command-resolution adapter that converts normalized trigger results back to current runtime command decisions. Move execution and provisional activation remain later isolated PRs.
