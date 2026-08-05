# T18 Completion — Coreコマンドcanary実行監査

## Status

Completed on top of T17 main:

- Base: `a63e957ef619272a36976fbfcf1f60aa73c35d2b`
- Pull request: #40
- Normal gameplay authority remains the legacy runtime.
- Online gameplay authority remains the legacy runtime.
- Core-compatible command authority remains explicit-query, offline-only canary behavior.

## Activation boundary

Unchanged from T17:

| Launch mode | Shadow observation | Core-compatible command authority |
| --- | --- | --- |
| Normal launch | Off | Off |
| `?mamokenShadow=1` | On | Off |
| `?mamokenCoreCommand=1` | On | Offline current-command canary only |
| Online battle with either query | On when requested | Off |

No UI toggle, storage flag, automatic rollout, server flag, or default activation was added.

## Added

### Deterministic canary execution audit

`runtime/runtime-command-shadow-browser.js`

- Observer version: `runtime-command-shadow-browser-v4`
- Report schema: `mamoken-command-shadow-report-v2`
- Maximum canary event ring: 256
- Attempt IDs are positive, strictly increasing within exported ring order.

Each canary attempt records:

- `attemptId`
- frame
- player
- current character
- trigger
- resolved Core-compatible decision, or `null` for a pre-resolution rollback
- final outcome:
  - `command`
  - `fallback`
  - `rollback`
  - `pending`
- stable rollback reason code, only when outcome is `rollback`

Canary summary contains:

- attempt count
- command count
- fallback count
- rollback count
- pending count
- deterministic event hash
- first and last frame
- counts by player
- counts by current character
- counts by trigger
- counts by rollback reason

New browser API:

- `completeCanaryAttempt(attemptId, outcome)`
- `failCanaryAttempt(attemptId, payload, reason, error)`
- `canaryAudit()`
- `canaryHash()`

Existing `resolveTrigger(payload)` now returns an `attemptId` and creates a pending audit event. It does not count as successfully applied until the runtime confirms `command` or `fallback`.

### Runtime finalization and rollback audit

`prototype/mamoken_prototype_v01.html`

The T17 canary helper now:

1. Builds the current runtime payload once.
2. Resolves the Core-compatible decision.
3. Retains the returned attempt ID.
4. Confirms fallback only before returning the normal attack/grab path.
5. Revalidates command slot, name, command ID, move type, and trigger against current BAL.
6. Confirms command only after all validation succeeds.
7. Records a rollback and returns the same-input legacy candidate if resolution or runtime validation fails.

Stable rollback codes:

- `resolve-error`
- `runtime-validation-failed`

Online guard remains:

```js
lastMatchOnline || NET.active
```

Online play never calls the canary resolver or canary audit lifecycle.

### Report schema v2

`window.__MAMOKEN_COMMAND_SHADOW__.report()` and `exportReport()` now include:

- `requestedShadow`
- `requestedCanary`
- `canary.requested`
- `canary.enabled`
- `canary.disabledReason`
- `canary.summary`
- `canary.events`

The report still intentionally contains no:

- timestamp
- URL or query string
- user agent
- device information
- localStorage data
- network data

### Comparator compatibility

`tools/compare_runtime_shadow_reports.mjs`

- Reads and validates report schema v1.
- Reads and validates report schema v2.
- Compares v1 with v1.
- Compares v2 with v2, including canary events.
- Treats v1 versus v2 as incompatible.
- Detects canary history differences even when shadow observations are identical.
- Reports the first differing canary event and canary count deltas.

The comparator rejects:

- unsupported report schema
- invalid observation hash or summary
- invalid canary event hash or summary
- count or bucket tampering
- invalid character, trigger, player, or outcome
- command/fallback outcome incompatible with its decision
- unstable rollback reason codes
- non-increasing attempt IDs
- more than 256 observation or canary events

## Verification

GitHub Actions `Core contract check` run #44 completed successfully before the completion report commit.

### T18 fixtures

- Observation-only report hash: `d9de0a18`
- Empty canary event hash: `a13f9c61`
- Current 9-command canary audit hash: `8b467596`
- Command/fallback/rollback fixture hash: `891c41f9`
- 300-attempt bounded ring hash: `9119fc70`
- Bounded ring retained events: 256
- Ring attempt IDs: 45 through 300
- CLI exit contract: 0 identical / 1 different / 2 invalid
- v1 report compatibility: preserved
- v1/v2 cross comparison: incompatible

### Existing deterministic regression hashes

- Core deterministic hash: `7a28953f`
- Command parser hash: `f5a7abc5`
- Combat hash: `7fab5c7a`
- Defense hash: `99b1f043`
- Gyuiin draw hash: `3ad4dad9`
- Sprite pipeline hash: `e2da0b40`
- Runtime adapter hash: `2f2f6296`
- Runtime input bridge hash: `a989a2c7`
- Runtime command shadow hash: `2553e560`
- Browser shadow long-run hash under observer v4: `8aa54d59`

### Current implementation audit

Before and after mobile build:

- Phase count: 24
- Flow count: 7
- Current command move count: 9
- RNG call count: 50
- localStorage count: 0
- BAL parity: true
- Character parity: true
- Pose ID parity: true
- Entry redirects to dist: true
- Runtime browser script is included by build: true
- Server relay command contract present: true

### Mobile distribution

- Embedded images: 119
- Excluded files: 4
- Original image total: 42.8 MB
- WebP image total: 3.3 MB
- Distribution size: 4.57 MB
- Rebuild diff: none

## Changed files

- `.github/workflows/core-check.yml`
- `dist/mamoken_mobile.html`
- `package.json`
- `prototype/mamoken_prototype_v01.html`
- `reports/T18_COMPLETION.md`
- `runtime/runtime-command-shadow-browser.js`
- `test/runtime-canary-audit.test.mjs`
- `test/runtime-command-canary.test.mjs`
- `test/runtime-shadow-export.test.mjs`
- `test/runtime-shadow-hook.test.mjs`
- `tools/apply_t18_runtime_canary_audit.mjs`
- `tools/compare_runtime_shadow_reports.mjs`

## Non-changes

- `index.html`
- Current BAL values
- Existing 9 command definitions and inputs
- Command move execution functions
- Normal launch authority
- Shadow-only authority
- Online protocol or server
- Online deterministic authority
- UI drawing or controls
- Assets
- Provisional moves or timings
- Network, persistence, download, or telemetry behavior

## Rollback

Remove:

- T18 canary event lifecycle and report v2 fields from the browser observer
- T18 completion/failure calls from the runtime canary helper
- T18 patcher and audit tests
- v2 canary validation/comparison from the report comparator
- T18 package and CI entries

Then regenerate `dist/mamoken_mobile.html` from the T17 prototype/build path. T17 remains an explicit-query, offline-only canary and normal/online gameplay remains legacy-controlled.
