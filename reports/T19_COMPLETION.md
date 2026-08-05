# T19 Completion — オフライン現行コマンドのCore判定を既定化

## Status

Completed on top of T18 main:

- Base: `522bceb968f001ea319419d7351310f7761dbcdf`
- Pull request: #41
- Offline current-command authority is now Core-compatible by default.
- Online command authority remains the legacy runtime.
- Existing current BAL and the current 9 command definitions remain unchanged.

## Authority matrix

| Launch / battle mode | Shadow observation | Current-command authority |
| --- | --- | --- |
| Normal offline launch | Off | Core-compatible default |
| `?mamokenShadow=1` offline | On | Core-compatible default |
| `?mamokenCoreCommand=1` offline | On | Core-compatible default |
| `?mamokenLegacyCommand=1` offline | Off unless shadow also requested | Legacy override |
| Both Core and legacy queries | On because Core diagnostic was requested | Legacy override wins |
| Any online battle | As explicitly requested | Legacy authority |
| Canary/runtime validation failure | Existing observations retained | Same-input legacy rollback |

Emergency offline rollback query:

```text
?mamokenLegacyCommand=1
```

The previous explicit Core query remains supported for compatibility:

```text
?mamokenCoreCommand=1
```

It now requests diagnostic observation rather than being required to grant offline Core authority.

## Browser authority contract

`runtime/runtime-command-shadow-browser.js`

- Observer version: `runtime-command-shadow-browser-v5`
- Report schema: `mamoken-command-shadow-report-v3`
- Normal shadow observation remains disabled unless explicitly requested.
- `canaryEnabled` is true by default unless:
  - the legacy override query is present, or
  - the observer has been disabled after a validation/resolution failure.
- `offlineAuthority` resolves to:
  - `core-default`
  - `legacy-override`
  - `legacy-rollback`
- Online authority is declared and tested as `legacy`.

Added browser state:

- `requestedLegacy`
- `offlineAuthority`
- canary status `defaultEnabled`
- canary status `legacyOverride`

## Runtime boundary

The T17/T18 runtime helper is reused without adding a new gameplay connection point.

Existing guard remains unchanged:

```js
lastMatchOnline || NET.active
```

Consequences:

- Offline attack/grab command triggers use the Core-compatible result by default.
- Online attack/grab command triggers return the already-computed legacy candidate before calling the Core resolver.
- A legacy override also causes the helper to return the already-computed legacy candidate.
- Core fallback still flows into the existing normal attack/grab behavior.
- A Core command still must pass current BAL slot, name, command ID, move type, and trigger validation before execution.
- Any resolution or runtime validation error records a rollback and returns the same-input legacy candidate.

No attack, grab, stance, command buffering, or command execution function was rewritten.

## Report schema v3

Report v3 adds:

- top-level `requestedLegacy`
- `authority.offline`
- `authority.online`
- `canary.defaultEnabled`
- `canary.legacyOverride`

The report still contains no:

- timestamp
- URL or query string
- user agent or device data
- localStorage data
- network data
- automatic download or telemetry

## Comparator compatibility

`tools/compare_runtime_shadow_reports.mjs`

- Reads and validates report v1, v2, and v3.
- Preserves v1-with-v1 and v2-with-v2 comparison.
- Validates v3 offline authority against legacy override and disabled state.
- Requires v3 online authority to remain `legacy`.
- Validates default-enabled and legacy-override canary metadata.
- Adds `authorityIdentical` to comparison results.
- Treats authority differences as report differences even when observation and canary event arrays are identical.
- Cross-schema comparisons remain incompatible.

## Verification

GitHub Actions `Core contract check` run #51 completed successfully with all 28 workflow steps.

### T19 authority verification

- Normal offline launch: `core-default`
- Normal shadow observation: off
- Explicit shadow mode: Core authority preserved
- Explicit Core query: compatibility preserved
- Legacy override query: disables Core authority
- Core + legacy query: legacy override wins
- Forced canary failure: `legacy-rollback`
- Reset after failure: returns to `core-default`
- Online runtime guard: unchanged
- Report authority differences: detected
- Historical report v2 normalization: preserved

### T19 deterministic fixtures

- Browser shadow long-run hash under observer v5: `f781bbb2`
- Report v3 observation hash: `6cee1407`
- Empty canary event hash: `0e1c0aba`
- Current 9-command canary audit hash: `1e6a073d`
- Command/fallback/rollback fixture hash: `f5f8b052`
- 300-attempt bounded ring hash: `2428735f`

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
- Runtime browser script included by build: true
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
- `reports/T19_COMPLETION.md`
- `runtime/runtime-command-shadow-browser.js`
- `test/runtime-canary-audit.test.mjs`
- `test/runtime-command-authority.test.mjs`
- `test/runtime-command-canary.test.mjs`
- `test/runtime-shadow-export.test.mjs`
- `test/runtime-shadow-hook.test.mjs`
- `tools/apply_t19_offline_core_default.mjs`
- `tools/compare_runtime_shadow_reports.mjs`

## Non-changes

- `prototype/mamoken_prototype_v01.html`
- `index.html`
- Current BAL values
- Existing 9 command definitions, sequences, triggers, names, and slots
- Command move execution functions
- Command buffering behavior
- Online protocol or server
- Online deterministic authority
- UI drawing or controls
- Assets
- Provisional moves or timings
- Network, persistence, download, or telemetry behavior

## Instant rollback

Operational rollback without a rebuild:

```text
?mamokenLegacyCommand=1
```

Code rollback:

1. Restore browser observer v4 and report v2 authority conditions.
2. Remove report v3 authority fields and v3 comparator validation.
3. Remove the T19 authority test, package/CI entries, patcher, and completion report.
4. Rebuild `dist/mamoken_mobile.html`.

This returns to T18 behavior: explicit-query, offline-only Core canary with normal and online gameplay using legacy authority.
