# T08 Completion — スプライト処理パイプライン

## Scope

- Branch: `feature/sprite-pipeline-v1`
- Pure metadata/RGBA processing only; source images and runtime rendering are unchanged.
- Runtime / BAL / online protocol / server / UI / assets / dist behavior diff: 0.

## Pipeline

- Validate deterministic RGBA byte buffers.
- Flood-fill only border-connected near-white pixels to alpha 0.
- Preserve enclosed interior white regions such as belly, teeth and eyes.
- Split even-sized source sheets into deterministic 2×2 rectangles.
- Detect opaque bounds, normalize head height, center on a unified canvas and align all poses to one ground line.
- Keep character-specific placement overrides outside the base manifest.
- Require exactly 24 unique pose IDs.
- D-02 S6 IDs are `crouch`, `sway`, `lunge`, `crouch_atk`.
- `down` and `ko` must be horizontal; all other poses are standing.
- Hash image bytes and manifest through stable serialization.

## Tests

- Exterior white becomes transparent while enclosed white remains opaque.
- 2×2 split boundaries.
- Opaque bounds and normalized head height.
- Unified ground line.
- Exact 24 pose set, missing/duplicate rejection and horizontal down/KO.
- Same input produces the same hash; a one-channel pixel change produces a different hash.
- No random, wall-clock, locale, DOM or timer dependency.

## Handoff

Actual sprite conversion remains an asset operation using this contract. T11 may reference pose IDs and asset mappings without embedding per-character offsets into combat data.
