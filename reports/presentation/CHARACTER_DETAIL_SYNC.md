# PRESENTATION-R1 (C+G): Character-Select Detail Screen Sync

Follow-up to PRESENTATION-R1 (B) (`#82`), split off per that PR's own
scope note. Syncs `rCharacterDetail()` (the "性能・わざ・コンボを見る" panel
reached from the character-select screen) to current live values and fixes
the stale per-move implementation-status labels this task's item (G) called
out.

## 1. What was stale, and what wasn't

`window.__MAMOKEN_CHARACTER_CATALOG__` (`src/core/character-catalog.ts`,
built by `tools/build_character_catalog_browser.mjs`) is a hand-authored,
separate data source from `BAL.CMD.moves` — it predates CMD-R1 (which
implemented all 63 moves) and vNext PR3 (which replaced every move's
numbers). Auditing it against the live prototype found:

- **Stale**: `move.implementationStatus` is `'current_runtime'` for only
  3 of each character's 7 moves (the CMD-R1-era subset) and
  `'design_confirmed'` for the rest — even though PRESENTATION-R1 (E)'s
  63/63 runtime audit (merged in `#80`) already proved all 63 moves are
  live with dedicated motion. This is exactly the "stale 3-technique"
  reference item (G) called out.
- **Not stale, by design**: `combos` (all 5 slots `status:
  'unverified_move_spec'`, empty `routeJa`) — `validateCharacterCatalog()`
  itself throws if a combo slot is anything other than unverified with an
  empty route, so this isn't drift, it's an intentional placeholder the
  schema enforces until real routes are verified (PRESENTATION-R1 (D)).
  Left untouched.
- **Not present, so not "stale"**: no HP/Guard/Normal Chain Limit numbers,
  and no literal "Focus"/"集中" text, exist anywhere in this catalog (it
  only stores 1-5 relative `displayStats`, not raw combat numbers) — grep
  audit confirmed zero Focus/集中 references. The task's "old-Focus
  references" item does not apply to this screen.
- **Also not stale**: `conceptJa`/`winConditionJa`/`weaknessJa`/`specials`/
  `roar`/`ultimate`/`cpuPlanJa` prose — these describe character identity
  and are still accurate.

Given `src/core/character-catalog.ts` has its own validator
(`validateCharacterCatalog()`) and dedicated tests
(`test/character-catalog.test.mjs`, `test/character-catalog-browser.test.mjs`)
that assert its current (partially-stale) shape, editing that source file to
mark all 63 moves `current_runtime` would require touching those tests'
expectations too, and would still leave a second source of truth to keep in
sync with `BAL.CMD.moves` going forward. Instead, this PR makes
`rCharacterDetail()` **cross-reference the live prototype data at render
time** rather than trust the catalog's stored flags — a smaller, one-way
fix that can't drift again.

## 2. Changes (`prototype/mamoken_prototype_v01.html` only)

- **`drawDetailPerformance()`**: added a new "実測ステータス(現行値)" card
  showing `r1Char(c).hp`/`r1Char(c).guard`/`normalChainLimitFor(c)` — the
  actual live `BAL_R1_CHARS`/`NORMAL_CHAIN_LIMIT` values the battle engine
  uses, not the catalog's 1-5 relative `displayStats`. Since `r1Char()`/
  `normalChainLimitFor()` key off `c.id` (already present on the catalog
  entry), this needed no catalog schema change.
- **`drawDetailMoves()`**:
  - Added a "クラシックキャンセル" explainer card (Classic Cancel wasn't
    mentioned anywhere on this screen before). Kept to the general
    mechanism only (opens on Command HIT, technique-dependent 12-16F
    window) since per-move exact `ccWindow` values already live on the
    わざ表 COMMAND tab (PRESENTATION-R1 (B)) — this card points there
    instead of duplicating numbers in two places.
  - Replaced `detailStatusLabel(move.implementationStatus)` (stale
    catalog flag) with a live lookup: `BAL.CMD.moves[c.id]` is searched
    for a move with the same `nameJa`; if found, the card always shows
    "実装済み" (green) regardless of what the catalog says. Verified via
    smoke test (§4) that this resolves "実装済み" for all 9×7=63 moves.
  - Added a "MODERN対応" line (cross-referencing `MODERN_PATTERNS[c.id]`)
    on any move that's a Modern-pattern target, pointing to the わざ表
    MODERN tab for the actual pattern.
- **Fixed a Codex review finding on the just-merged PR #82**: the
  ABILITY tab's Yomikage trigger text said queuing an input during dodge
  frames 5-9 creates the Just version. That's backwards — `yomiJust` is
  decided by `def.pf` at the instant the dodge successfully intercepts the
  opponent's attack (`def.yomiJust=(def.pf>=5&&def.pf<=9)`), and the
  H/M/L/grab queue only becomes available afterward once `yomiState`
  becomes `'pending'`. Corrected the wording to describe the evade-contact
  timing, not the queue timing.

## 3. Verification

- Syntax check on the extracted `<script>` body: OK.
- All 35 `npm run check:*` scripts: green.
- Render-path smoke test (`presentation_r1_c_detail_smoke.mjs`, deleted
  after use): for all 9 roster characters — opened the detail screen,
  confirmed `r1Char()`/`normalChainLimitFor()` resolve positive HP/Guard/
  chain-limit values (not `undefined`/`NaN`), confirmed all 7 catalog
  moves per character resolve as "live" against `BAL.CMD.moves` (63/63
  total), rendered and scrolled-to-bottom both the Performance and Moves
  tabs via the real `characterDetailPress()` scroll-button hit-test, and
  backed out to the select screen — 0 exceptions, 0 page errors.
- Manual screenshot review (Godan Performance tab, Moves tab at top and
  scrolled to a Modern-tagged move) confirmed no text overflow/overlap.
- `npm run build:mobile`: dist regenerated successfully.
- No combat-logic code touched — `rCharacterDetail()`/`drawDetailPerformance()`
  /`drawDetailMoves()` only run on the `characterDetail` screen (pre-battle,
  non-simulating) and read `BAL.CMD.moves`/`MODERN_PATTERNS`/`BAL_R1_CHARS`/
  `NORMAL_CHAIN_LIMIT` read-only.

## 4. Deferred (unchanged, tracked elsewhere)

- `drawDetailCombos()`'s "コンボは全枠 未検証" — accurate as-is; real routes
  land in PRESENTATION-R1 (D).
- `src/core/character-catalog.ts`'s own `implementationStatus` field values
  and validator — left as historical/design-reference data. A future pass
  could update the source data (and its tests) directly instead of
  overriding at render time, but that's a `src/core` schema change outside
  this presentation-only task's blast radius.
