# T17 Completion — オフライン限定Coreコマンド判定canary

## Status

Completed on top of T16 main:

- Base: `859112346c6159f8063bdf6a5f72a8e54f88cfc8`
- Pull request: #39
- Default gameplay authority remains the legacy runtime.
- Online gameplay authority remains the legacy runtime.
- Core-compatible command authority is available only through an explicit offline canary query.

## Activation matrix

| Launch mode | Shadow observation | Core-compatible command authority |
| --- | --- | --- |
| Normal launch | Off | Off |
| `?mamokenShadow=1` | On | Off |
| `?mamokenCoreCommand=1` | On | Offline current-command canary only |
| Online battle with either query | On when requested | Off |

Canary activation query:

```text
?mamokenCoreCommand=1
```

No UI toggle, storage flag, automatic rollout, or server flag was added.

## Browser diagnostic API

`runtime/runtime-command-shadow-browser.js`

- Observer version: `runtime-command-shadow-browser-v3`
- Report schema remains: `mamoken-command-shadow-report-v1`
- Existing shadow/report APIs remain available.

Added:

- `requestedShadow`
- `requestedCanary`
- `canaryEnabled`
- `resolveTrigger(payload)`
- `canaryStatus()`

`resolveTrigger`:

- Is disabled unless `mamokenCoreCommand=1` is requested.
- Accepts only current character IDs.
- Accepts only current attack/grab triggers.
- Reads the existing runtime `BAL.CMD` current move table.
- Returns either a current command slot decision or the existing normal attack/grab fallback.
- Performs no fighter, battle, UI, network, storage, or RNG writes.

## Runtime integration

`prototype/mamoken_prototype_v01.html`

The existing attack and grab paths now:

1. Compute the actual legacy candidate.
2. Send that legacy candidate to the existing shadow observer.
3. Ask the canary resolver only when all authority guards pass.
4. Continue through the unchanged existing attack/grab/stance/prebuffer execution branches.

Authority guards:

```js
!api || !api.canaryEnabled || lastMatchOnline || NET.active
```

When any guard is true, the exact legacy candidate is returned unchanged.

The canary result is mapped back to current runtime move data only after validating:

- Current slot exists.
- Command ID matches character and slot.
- Move name matches.
- Grab decision resolves to a grab move.
- Attack decision resolves to attack/stance with the same trigger.

If resolution or validation throws:

- The diagnostic API is disabled.
- The same input immediately falls back to the previously computed legacy candidate.
- Gameplay continues through the legacy path.

## Reproducible integration

`tools/apply_t17_runtime_command_canary.mjs`

- Exact-anchor patching.
- Idempotent marker validation.
- Requires exactly two legacy observation points.
- Requires exactly two canary resolution points.
- Requires the offline/online authority guard.
- Requires the move type/trigger compatibility guard.
- Preserves the existing runtime diagnostic script tag.

`tools/build_mobile.mjs` remains the existing T15 build path and inlines the updated browser script into the single-file distribution.

## Verification

GitHub Actions `Core contract check` run #42 completed successfully after final runtime hardening.

### T17 canary contract

- Current commands resolved: 9
- Characters: Moguzo, Pisuke, Godan
- Default canary enabled: false
- Shadow-only authority: false
- Offline explicit canary authority: true
- Online canary authority: false
- Missing command input: existing fallback
- Trigger mismatch: existing fallback
- Forced error rollback: legacy candidate
- Unknown current move rollback: legacy candidate

### Shadow and report fixtures

- Runtime command shadow hash: `2553e560`
- Browser long-run shadow hash: `80f30300`
- Browser report fixture hash: `e3905471`
- Observation ring limit: 256
- Current-command shadow mismatches: 0
- Report compare exits: identical 0 / valid difference 1 / invalid report 2

### Existing regression suites

- Core deterministic hash: `7a28953f`
- Command parser hash: `f5a7abc5`
- Combat hash: `7fab5c7a`
- Defense hash: `99b1f043`
- Gyuiin draw hash: `3ad4dad9`
- Sprite pipeline hash: `e2da0b40`
- Runtime adapter hash: `2f2f6296`
- Runtime input bridge hash: `a989a2c7`
- Core-three roster hash: `9b2b349d`

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
- Distribution size: 4.57 MB
- Rebuild diff: none

## Changed files

- `.github/workflows/core-check.yml`
- `dist/mamoken_mobile.html`
- `package.json`
- `prototype/mamoken_prototype_v01.html`
- `reports/T17_COMPLETION.md`
- `runtime/runtime-command-shadow-browser.js`
- `test/runtime-command-canary.test.mjs`
- `test/runtime-shadow-export.test.mjs`
- `test/runtime-shadow-hook.test.mjs`
- `tools/apply_t17_runtime_command_canary.mjs`

## Non-changes

- Current BAL values
- Existing nine command move definitions
- Existing attack/grab/stance execution functions
- Normal launch behavior
- Online protocol, server, queues, delay, or authority
- UI drawing or controls
- Assets
- Provisional move data or activation
- Gyuiin rewards

## Rollback

Remove:

- The T17 canary helper and two resolution calls from the prototype
- The canary API fields/methods from the browser observer
- T17 patcher, tests, CI step, package script, and completion report

Then regenerate `dist/mamoken_mobile.html` through the unchanged mobile build path.
