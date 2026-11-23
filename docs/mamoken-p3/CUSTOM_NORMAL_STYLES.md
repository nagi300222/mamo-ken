# Existing 81 body/style combinations

Normal animation is selected by visual body. Startup, active and recovery remain
selected by combat style. Those styles may have different active counts, so a
contact table sampled only at the visual body's actual frames cannot certify
every frame used by the selected style.

`Avatar.measureContacts(avatar,{styleId})` now measures the union of the visual
body's source phases and the selected style's actual phases, on the real skinned
mesh at each exact source-clip time. The option defaults to the combat style
captured when `createAvatar(definition)` constructed the avatar. Existing source
`battleActive` is retained. Measured style coverage is recorded separately as
`normalSampling:'exact-style-active-frames'` and `normalStyleId`.

Custom Battle validates phase coverage directly, including the selected style's
every actual active frame. A missing style midpoint is rejected even when the
original body has a complete 2F table. The existing provider contract still
validates the body table against its own performance. With v17 approved, using
a different style without real measurements requests measurement rather than
presenting an interpolated base-only table as exact custom geometry.

This changes no allowed style, part, skeleton, move mix, performance or GLB. It
preserves the existing 81 combinations by measuring their actual rendered poses.

Actual CPU verification uses original modular skins and real v17 clips:

- 9 bodies × 9 styles × 6 normals = 486 selected clips;
- 1,899 actual active-frame poses independently reskinned after measurement;
- source contact-clock alignment and selected-style active counts;
- measured reach/height versus actual current skin, maximum error below
  0.00005 m (the four-decimal measurement rounding bound);
- inner/outer collision boundaries for both Battle facing directions.

The full report is
[custom-normal-styles-cpu.json](evidence/custom-normal-styles-cpu.json).
Dojo tests pass 195/195, custom tests 16/16, Pages builds pass, and the actual
27-special/54-mixed-socket CPU suite still passes after the measurement change.
Global normal and special production approvals remain unchanged. CPU skin
evidence is distinct from WebGL rendering, floor/art quality and physical-phone
startup/performance measurements; this tool does not certify those.

```sh
node --loader ./exp/fable-3d/custom/v16/tools/three-loader.mjs \
  exp/fable-3d/custom/v16/tools/verify-custom-normal-styles.mjs
```
