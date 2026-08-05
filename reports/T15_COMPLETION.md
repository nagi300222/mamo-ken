# T15 Completion — off-by-default runtime shadow診断フック

## Status

Completed on top of T14 main:

- Base: `06e88dc1290ba4c3db160f8f2ab907a2cb8da00b`
- Pull request: #37
- Runtime execution authority remains the legacy implementation.
- Core/browser shadow authority is observation-only.

## Added

### Browser diagnostic observer

`runtime/runtime-command-shadow-browser.js`

- Version: `runtime-command-shadow-browser-v1`
- Default: disabled
- Opt-in query: `?mamokenShadow=1`
- Global diagnostic API: `window.__MAMOKEN_COMMAND_SHADOW__`
- Observation ring limit: 256
- Stable FNV-1a hash
- Mismatch counter
- No localStorage, RNG, network, UI, BAL, fighter, or battle-state writes

### Runtime hook

`prototype/mamoken_prototype_v01.html`

- Reset at offline battle creation
- Reset at online battle creation
- Observe actual legacy command candidate after attack command detection
- Observe actual legacy command candidate after grab command detection
- Observer failures disable diagnostics without changing gameplay
- No command execution path was replaced

### Reproducible injection

`tools/apply_t15_runtime_shadow_hook.mjs`

- Exact-anchor patching
- Idempotent marker validation
- Requires exactly two command observation points
- Requires both offline and online reset points

### Mobile distribution

`tools/build_mobile.mjs`

- Prototype uses an external diagnostic script.
- Mobile distribution inlines the same script.
- `dist/mamoken_mobile.html` remains a single-file build.
- CI requires the committed distribution to reproduce byte-for-byte.

## Verification

GitHub Actions `Core contract check` run #32 completed successfully.

### Runtime hook fixture

- Current command comparisons: 9
- Default disabled: true
- Observation ring: 256
- Deterministic long-run hash: `aa7e46c6`
- Expected current-command mismatches: 0
- Intentional negative mismatch: detected

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

### Mobile build

- Embedded images: 119
- Excluded files: 4
- Original image total: 42.8 MB
- WebP image total: 3.3 MB
- Distribution size: 4.56 MB
- Rebuild diff: none

## Non-changes

- Current BAL values
- Existing 9 command moves
- Command execution authority
- Attack, grab, dodge, guard, gauge, or damage behavior
- Online protocol or server
- UI drawing or controls
- Assets
- Provisional command timing or moves

## Rollback

Remove:

- The T15 runtime helper and four hook calls from the prototype
- `runtime/runtime-command-shadow-browser.js`
- The runtime script inline step from `tools/build_mobile.mjs`
- T15 test and CI entries

Then regenerate `dist/mamoken_mobile.html`.
