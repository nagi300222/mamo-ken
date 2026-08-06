# T28 Completion Report — Offline Trial Roster and Character Select UI v1

## Scope

- Enabled all nine roster entries for offline provisional play before dedicated 2D character assets are available.
- Reused only the three existing runtime skeletons, hitboxes, common 24 poses, and current balance values.
- Rebuilt the portrait character-select layout as a 2-row × 5-column grid with nine roster entries and one mystery cell.
- Replaced full-body thumbnail fitting with explicit face crops centered around each character's nose.
- Separated character art from name, style, species, implementation status, ability, and ultimate text.
- Added dedicated Bullet crop profiles so the long tail does not control icon or hero-art scale.
- Added provisional-state labels to character select, battle HUD, move list, and character detail.

## Provisional skeleton mapping

| Character | Trial skeleton |
|---|---|
| モグゾー | モグゾー |
| ピスケ | ピスケ |
| ゴダン | ゴダン |
| ハクマ | ゴダン |
| チルカ | ピスケ |
| タキマル | ゴダン |
| ヨミカゲ | ピスケ |
| バレット | ピスケ |
| ダークモグゾー | モグゾー |

## Character-select layout

- Grid: 2 rows × 5 columns
- Roster cells: 9
- Mystery cell: 1, displayed as `? / 未定`
- Thumbnail strategy: nose-centered face crop
- Hero-art strategy: independent upper-body crop
- Text placement: dedicated information card, never overlaid on character art
- Primary controls: detail, difficulty, confirm, and back occupy separate non-overlapping regions
- Official implementation marker: green
- Provisional skeleton marker: yellow

## Bullet correction

- Face crop anchor: `x=0.42`, `y=0.28`, `zoom=2.48`
- Hero crop anchor: `x=0.43`, `y=0.41`, `zoom=1.38`
- UI sizing explicitly ignores the full-image tail extent and uses the head/body crop instead.

## Runtime boundary

- Official runtime characters: 3
- Offline trial characters: 9
- Online-selectable characters: 3
- Planned characters inherit the source skeleton's existing runtime values without new BAL data.
- Planned characters have no dedicated command moves; command lookup returns an empty list.
- Planned characters are excluded from command shadow and canary diagnostics.
- Planned characters display `仮骨格 / 共通技のみ` during battle.
- Their move list explicitly states that dedicated command moves are not implemented.

## Validation

- UI contract version: `ui-contract-v3`
- Portrait layouts checked at 320×568, 360×640, 390×844, and 430×932.
- Character-select cell and control rectangles are non-overlapping.
- All nine 256×256 WebP roster images remain present and valid.
- Prototype and dist JavaScript syntax checks pass.
- Mobile distribution remains reproducible and single-file.
- Embedded images: 128; excluded images: 4.
- Distribution size: approximately 4.72 MB.
- Existing gameplay hashes remain unchanged:
  - Core: `7a28953f`
  - Command parser: `f5a7abc5`
  - Combat: `7fab5c7a`
  - Defense: `99b1f043`
  - Gauge: `3ad4dad9`
  - Sprite contract: `e2da0b40`
  - Runtime adapter: `2f2f6296`
  - Runtime input bridge: `a989a2c7`
  - Runtime command shadow: `2553e560`
- Full 39-step Core/runtime/UI/mobile workflow passed.

## Non-goals

- No dedicated 2D sprite generation for the six planned characters.
- No planned-character-specific hitboxes, balance, command moves, abilities, CPU personas, or online authority.
- No online protocol or server changes.
