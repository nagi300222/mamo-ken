# T16 Completion — shadow診断レポートの決定論的出力とローカル比較

## Status

Completed on top of T15 main:

- Base: `d7927ba03085f764eb9283008d69353f7b36c103`
- Pull request: #38
- Legacy runtime remains the only gameplay execution authority.
- Browser shadow remains default-off and observation-only.

## Added

### Deterministic browser report

`runtime/runtime-command-shadow-browser.js`

- Observer version: `runtime-command-shadow-browser-v2`
- Report schema: `mamoken-command-shadow-report-v1`
- Opt-in remains `?mamokenShadow=1`
- Global remains `window.__MAMOKEN_COMMAND_SHADOW__`

New API:

- `reportVersion`
- `summary()`
- `report()`
- `exportReport()`

The report contains:

- Report and observer versions
- Requested/enabled/disabled state
- Observation count
- Mismatch count
- Deterministic observation hash
- First and last observed frame
- Counts and mismatch counts by player
- Counts and mismatch counts by current character
- Counts and mismatch counts by trigger
- The existing bounded ring of at most 256 observations

The report intentionally contains no:

- Timestamp
- URL or query string
- User agent
- Device information
- localStorage data
- Network data

### Local comparator

`tools/compare_runtime_shadow_reports.mjs`

Usage:

```bash
npm run compare:runtime-shadow -- left-report.json right-report.json
```

Exit codes:

- `0`: compatible and observation-identical
- `1`: both reports are valid but differ
- `2`: invalid arguments, JSON, schema, hash, count, frame, or summary bucket

Comparison output includes:

- Version compatibility
- Identical/different result
- Observation and mismatch counts for both sides
- Count deltas
- Observation hashes
- First differing index
- First differing observations

The comparator validates before comparing:

- Report schema
- Current character and trigger values
- 256-observation maximum
- Overall count and mismatch count
- Observation hash
- First and last frame
- Player summary buckets
- Character summary buckets
- Trigger summary buckets

## Manual diagnostic flow

1. Open the game with the opt-in query:

```text
?mamokenShadow=1
```

2. Play the inputs to investigate.

3. In browser DevTools Console, inspect the summary:

```js
window.__MAMOKEN_COMMAND_SHADOW__.summary()
```

4. Copy the deterministic JSON report:

```js
copy(window.__MAMOKEN_COMMAND_SHADOW__.exportReport())
```

5. Save the copied text as a local `.json` file.

6. Compare two saved reports locally:

```powershell
npm run compare:runtime-shadow -- .\left-report.json .\right-report.json
```

No automatic download, persistence, upload, or telemetry is performed.

## Verification

GitHub Actions `Core contract check` run #36 completed successfully after the final validation changes.

### T16 report fixture

- Report hash: `510a938a`
- Fixture observations: 3
- CLI identical exit: 0
- CLI valid-difference exit: 1
- CLI invalid-report exit: 2
- Tampered overall count: rejected
- Tampered observation hash: rejected
- Tampered character summary bucket: rejected
- Unknown report schema: rejected

### Existing runtime shadow fixture

- Current commands: 9
- Long-run observer hash: `13653c2f`
- Default disabled: true
- Observation ring limit: 256
- Current-command mismatches: 0

### Existing regression suites

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
- Server relay command contract present: true

### Mobile distribution

- Embedded images: 119
- Excluded files: 4
- Original image total: 42.8 MB
- WebP image total: 3.3 MB
- Distribution size: 4.56 MB
- Rebuild diff: none

## Changed files

- `.github/workflows/core-check.yml`
- `dist/mamoken_mobile.html`
- `package.json`
- `runtime/runtime-command-shadow-browser.js`
- `test/runtime-shadow-export.test.mjs`
- `test/runtime-shadow-hook.test.mjs`
- `tools/compare_runtime_shadow_reports.mjs`
- `reports/T16_COMPLETION.md`

## Non-changes

- `prototype/mamoken_prototype_v01.html` hook points
- `index.html`
- Current BAL values
- Existing 9 command moves
- Attack, grab, dodge, guard, gauge, damage, or command execution behavior
- Online protocol or server
- UI drawing or controls
- Assets
- Provisional moves or timings

## Rollback

Remove:

- T16 report methods and summary generation from the browser observer
- `tools/compare_runtime_shadow_reports.mjs`
- T16 tests, package scripts, CI step, and report

Then regenerate `dist/mamoken_mobile.html` from the unchanged T15 prototype/build path.
