# T22 Completion — キャラ選択「性能／わざ／コンボ」詳細画面

## Status

- Base main: `ac7e97b2a0a9fac46b8dbb08a95c1a8a323fa1fa`
- Pull request: #45
- UI contract: `ui-contract-v2`
- Browser catalog version: `character-catalog-v1`
- Browser/Core catalog hash: `3dc9690b`
- Roster details: 9 characters
- Move details: 63 command moves
- Combo categories: 45, all explicitly unverified

## Smartphone character detail screen

The offline 3 × 3 character-select screen now contains a large `性能・わざ・コンボを見る` action.

Opening it shows a read-only detail screen for the currently focused character.

### 性能

- character name, species and style
- concept
- win condition
- weakness
- ATK / SPD / DEF / TEC / BRK
- total operation / decision difficulty
- confirmed and candidate special abilities
- roar and the explicit rule that it does not affect Gyuiin
- ultimate
- CPU behavior plan
- current battle availability

### わざ

- all seven command moves
- command notation
- HIGH / MID / LOW / GRAB text label
- Reach 0–3
- role
- input difficulty
- conditions
- implementation status
  - `実装済み`
  - `設計確定・未実装`
  - `候補`
- special ability summaries

### コンボ

Every character exposes the five confirmed categories:

1. 初心者
2. 基本
3. 実戦
4. 上級
5. 最大／条件付き最大

No route was invented. Until MoveSpec implementation and measured continuous-hit validation are complete, every category displays:

- `未検証`
- `入力列: 未確定`
- the reason that MoveSpec and measured damage are required

## Smartphone input behavior

- Three tab targets: 76 logical pixels high
- Detail-open target: 74 logical pixels high
- Back target: 76 logical pixels high
- On a 320 × 568 viewport these scale to approximately 44 CSS pixels or larger
- Large ▲ / ▼ buttons scroll by 260 logical pixels
- Switching tabs resets only the detail scroll position
- Returning to selection does not alter `selCharIdx`
- The same character remains focused
- The detail screen contains no battle-start path

## Data synchronization

`tools/build_character_catalog_browser.mjs` deterministically generates:

```text
runtime/character-catalog-browser.js
```

from:

```text
src/core/character-catalog.ts
```

The browser API is installed at:

```js
window.__MAMOKEN_CHARACTER_CATALOG__
```

Properties:

- generated from the Core catalog rather than maintained by hand
- hash `3dc9690b`
- deeply frozen, including nested move and combo data
- global property is non-writable and non-configurable
- no timestamps, random values, network, storage, clipboard or telemetry

The prototype loads it as a local external script. `tools/build_mobile.mjs` inlines the same generated source into the single-file mobile distribution.

## Verification

GitHub Actions `Core contract check` run #67 completed successfully with all 34 workflow steps.

T22-specific results:

- UI contract: slots 9 / playable 3 / detail tabs 3 / viewports 4 / cues 8
- browser catalog: characters 9 / moves 63 / hash `3dc9690b` / deeply frozen
- browser catalog regeneration diff: none
- detail panel: tabs 3 / roster 9 / selection preserved / battle guard retained / dist inline true
- prototype inline JavaScript syntax: valid
- distribution inline JavaScript syntax: valid
- mobile distribution regeneration diff: none
- mobile embedded images: 128
- excluded files: 4
- source images: 42.9 MB
- embedded WebP images: 3.3 MB
- final single-file distribution: 4.70 MB

Regression results retained:

- Core deterministic hash: `7a28953f`
- command parser hash: `f5a7abc5`
- combat hash: `7fab5c7a`
- defense hash: `99b1f043`
- gauge hash: `3ad4dad9`
- sprite hash: `e2da0b40`
- current Core-three roster hash: `9b2b349d`
- runtime adapter hash: `2f2f6296`
- runtime input hash: `a989a2c7`
- current phase count: 24
- current flow count: 7
- current runtime command count: 9
- RNG call count: 50
- localStorage count: 0
- BAL parity: true
- current character parity: true
- pose-ID parity: true
- server relay command contract: unchanged

## Preserved battle boundary

- Current playable roster remains Moguzo / Piske / Godan only.
- Hakuma / Chirka / Takimaru / Yomikage / Bullet / Dark Moguzo remain preview-only.
- Information visibility does not change battle availability.
- BAL, damage, frame values, command execution and hitboxes are unchanged.
- Current three combat sprites are unchanged.
- Online roster, online authority, protocol and server are unchanged.
- T19 offline Core command authority and legacy rollback query are unchanged.
- Images and art assets are unchanged.
- No image generation, redraw or style conversion was performed.

## Next task

T23 can begin expanding the current three characters from three implemented command moves toward their confirmed seven-move catalogs. Runtime rollout, new art requirements and online compatibility remain separated into reviewable stages.
