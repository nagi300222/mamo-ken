# T20 Completion — 9体正式アートとスマホ3×3キャラ選択

## Status

Completed on top of T19 main:

- Base: `27b090e9dcbbc77417163031fd0b492b6f762160`
- Pull request: #42
- Full visual roster: 9 characters
- Currently playable: 3 characters
- Art-preview / combat-pending: 6 characters
- Online playable roster: unchanged at the current 3 characters

## Image-generation boundary

T20 did **not** generate, redraw, restyle, inpaint, or invent any character image.

Only the nine images explicitly attached by the user were used. Processing was limited to mechanical asset preparation:

- background transparency
- resizing
- same 256 × 256 canvas
- common foot anchor
- WebP optimization

When the ZIP materials and the directly attached images differ, the directly attached image is the visual source of truth.

## Full roster

1. モグゾー — current playable
2. ピスケ — current playable
3. ゴダン — current playable
4. ハクマ — art preview / combat pending
5. チルカ — art preview / combat pending
6. タキマル — art preview / combat pending
7. ヨミカゲ — art preview / combat pending
8. バレット — art preview / combat pending
9. ダークモグゾー — another-route art preview / combat pending

The normal roster is eight characters plus one alternate character.

## Smartphone character selection

The offline selection screen now uses a 3 × 3 grid.

- All nine characters can be focused and viewed.
- Each character uses the same foot anchor.
- Character-specific display scale preserves the decided body-size impression.
- モグゾー、ピスケ、ゴダン can start a battle.
- The six pending characters show their adopted art and implementation status, but cannot start a battle.
- The online selection screen remains limited to the current three playable characters.
- No pending character is assigned an existing character's commands, BAL, sprites, or combat implementation.

## White-fur protection

Roster images are prepared with transparency before being loaded.

The asset loader supports a `preserveWhite` path so that white or cream fur is not removed by the legacy approximate-white background removal used for older portrait assets.

## Art and design contract

Added:

- `src/core/roster-full.ts`
- `design/MAMOKEN_CHARACTER_DESIGN_v1.0.md`
- `design/MAMOKEN_CHARACTER_ART_PROGRESS_2026-08-06.md`
- `design/2D_ART_RESUME_PLAN_2026-08-06.md`
- `design/character_art/source_manifest.json`

The contract records:

- stable character IDs and names
- species impression
- archetype / play style
- special ability and ultimate name
- accessory
- current combat and art status
- height / width guidance
- selection display scale
- source image mapping and hash
- `handDigits = 4`
- `footToes = 4`

## Image-generation resume plan

While image generation is unavailable:

- use existing images only
- do not generate, redraw, restyle, or complete missing art
- do not begin 24-pose combat sprite production for an unapproved 2D master

Resume order after image generation becomes available and the user explicitly requests resumption:

1. ピスケ
2. モグゾー
3. ゴダン
4. ハクマ
5. チルカ
6. タキマル
7. ヨミカゲ
8. バレット
9. ダークモグゾー
10. nine-character common-ground-line and scale audit

## Verification

GitHub Actions `Core contract check` run #57 completed successfully with all 29 workflow steps.

### T20 checks

- Full roster count: 9
- Current playable count: 3
- Preview-only count: 6
- Selection asset count: 9
- Selection asset dimensions: 256 × 256
- UI selection slots: 9
- Playable UI slots: 3
- Verified viewports: 4
- UI feedback cues: 8
- Current command count: 9
- Current fighter phase count: 24
- Current battle flow count: 7
- RNG call count: 50
- localStorage count: 0

### Mobile distribution

- Embedded images: 128
- Excluded files: 4
- Source image total: 42.9 MB
- Embedded WebP total: 3.3 MB
- Distribution size: 4.65 MB
- Committed distribution rebuild diff: none

### Preserved regression boundaries

- Core typecheck and deterministic tests: passed
- Current command parser: passed
- Combat and combo tests: passed
- Defense and step tests: passed
- Gauge / roar / Gyuiin tests: passed
- Ability hook tests: passed
- Sprite pipeline tests: passed
- CPU persona tests: passed
- Core-three roster tests: passed
- Runtime adapter and input bridge tests: passed
- Shadow / export / canary / audit tests: passed
- T19 offline Core command authority tests: passed
- Current BAL parity: true
- Current character parity: true
- Current pose-ID parity: true
- Server relay command contract: unchanged

## Changed areas

- Nine `assets/roster3d/*.webp` selection assets
- Offline character selection UI
- Full-roster Core and UI contracts
- Art source manifest and design documents
- Mobile build inclusion for roster art
- Full-roster and UI tests
- Reproducible T20 patcher
- Rebuilt single-file mobile distribution

## Non-changes

- Current three combat character definitions
- Current BAL values
- Current nine command definitions and execution
- Existing combat sprite sets
- Online roster and online deterministic authority
- Online protocol and server
- Runtime command Core/legacy authority boundary from T19
- Input controls
- Provisional character combat timings
- Network, persistence, telemetry, or automatic download behavior

## Future replacement path

Current selection assets:

```text
assets/roster3d/<character-id>.webp
```

After an approved 2D master exists, replace the selection asset through the documented same-path or `assets/roster2d/` migration. Directly attached future images remain higher priority than older documents or ZIP candidates.
