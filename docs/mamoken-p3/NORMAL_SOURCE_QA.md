# Shared normal motion source (P3 candidate)

The production selection remains v15. `APPROVED_P3_CONTACT_DELIVERY` remains
`null`; this change neither approves Claude's candidate nor regenerates any model.

`normal-motion-source.js` owns normal pack paths, six clip IDs, pack validation
and contact-table identity. Models and AvatarFactory use the same active source.
QA may explicitly call `loadP3NormalMotionCandidate()` and pass its `.source` to
`createAvatar(definition,{normalMotionSource:source})` and
`chooseClip(fighter,names,commandMap,{normalMotionSource:source})`. Whole-game QA
must also select the matching Battle contact table; selecting only a visual pack
does not constitute integrated collision verification. Root owns those entry points.

Pack validation rejects missing, duplicated, wrong-version or stale-duration
clips. Avatar measurements retain their own `customContact` timing. A negative
local strike height is valid only for an air normal: world height is the signed
local value plus `fighter.y`. Ground data retains the existing small numerical
tolerance. Mesh floor penetration is a separate art check.

## Verification

- Dojo unit/regression tests: 173/173 passed.
- Existing custom-combat tests: 10/10 passed, including signed air collision and
  rejection of invalid ground/nonfinite samples.
- Pages build passed both without candidate assets and with all nine actual
  v17 normal packs bundled. Active selection stayed v15.
- Actual Three.js CPU GLTFLoader/skin/morph comparison used Claude revision
  `7f79ea25`: nine original modular rigs, 54 real candidate clips, original
  37 clips retained per rig, three existing custom appearances, contact clocks,
  morph broadcast and unchanged original/parts GLB hashes checked.
- **That surface comparison failed**: 20/54 moves exceeded the 1.5 cm gate at
  one or more exact active samples. Maximum reach discrepancy was 4.54 cm;
  maximum height discrepancy was 16.97 cm (Bullet air heavy, signed height
  clamped to zero in the candidate table). Mid-active samples mostly agree;
  exact initial contact sampling needs correction. Full failed output is
  [normal-source-cpu-7f79ea25.json](evidence/normal-source-cpu-7f79ea25.json).

The CPU tool stubs image decoding. It does not measure WebGL rendering, mirror
composition, floor appearance, device performance or phone behavior. These
results are a blocking art/contact diagnostic, not approval or successful GPU QA.

Reproduce using the unmodified candidate delivery checked out separately:

```sh
MAMOKEN_V17_MOTION_ROOT=/absolute/path/to/motion/v17 \
MAMOKEN_ART_REVISION=7f79ea25 \
node --loader ./exp/fable-3d/custom/v16/tools/three-loader.mjs \
  exp/fable-3d/custom/v16/tools/verify-normal-motion-source.mjs
```

The tool writes its report before exiting with failure on any surface mismatch.
