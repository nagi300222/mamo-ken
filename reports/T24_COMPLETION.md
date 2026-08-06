# T24 Completion Report — Extended 21-Command Shadow v1

## Scope

- Added an off-by-default browser diagnostic for the confirmed 21 command inputs of Moguzo, Pisuke, and Godan.
- Compared the unchanged current runtime rule (nine implemented commands, latest two directions, 24-frame history) against a catalog candidate rule for all 21 confirmed inputs.
- Added deterministic classification, summary, hash, snapshot, report, and JSON export APIs.
- Added a 256-observation ring and grouped conflict counts by character and trigger.
- Integrated the observer into prototype input observation without granting command execution authority.
- Inlined the observer into the single-file mobile distribution.

## Enable and inspect

Open:

`dist/mamoken_mobile.html?mamokenExtendedShadow=1`

Console:

- `window.__MAMOKEN_EXTENDED_COMMAND_SHADOW__.summary()`
- `window.__MAMOKEN_EXTENDED_COMMAND_SHADOW__.report()`
- `window.__MAMOKEN_EXTENDED_COMMAND_SHADOW__.exportReport()`
- `window.__MAMOKEN_EXTENDED_COMMAND_SHADOW__.conflictCount()`

## Synthetic 21-input audit

- Current-command parity: 9
- Design-only candidates: 11
- Longer design input overriding a current short input: 1
- Other conflict classes: 0
- Deterministic observation hash: `939b32bb`
- Ring capacity: 256

## Confirmed input conflict

Pisuke `↓→→＋中` / つむじ返し contains the current `→→＋中` / 二連牙 input as its suffix.

Under the unchanged current runtime rule, the input resolves as 二連牙. Under the 21-command candidate rule, longest-command priority resolves it as つむじ返し.

T24 records this conflict but does not choose a new authoritative behavior. Resolution belongs to the next input-contract task.

## Authority and privacy boundary

- Runtime authority remains the current nine commands.
- Catalog candidate authority is none.
- Default launch remains disabled.
- No BAL, MoveSpec, damage, frame, hitbox, CPU, online protocol, server, UI, or character availability changes.
- No localStorage, sessionStorage, network, clipboard, timestamps, random values, or automatic export.

## Validation

- Full Core, command, combat, defense, gauge, ability, sprite, CPU, UI, roster, catalog, runtime, canary, authority, detail-panel, audit, and mobile reproducibility workflow passed.
- Existing deterministic combat/runtime hashes remained unchanged.
- Prototype uses an external diagnostic script; dist contains the same source inline and remains a single HTML file.
