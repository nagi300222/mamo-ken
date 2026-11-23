# Existing custom bodies: special contact synchronization

The v17 special sampler measures the already bound/retargeted clip on the
actual modular avatar. It changes no skeleton, saved part, model generator,
compatibility catalogue, move performance or original GLB.

Story integration API (called only for selected `motionVersion === 'v17'` clips):

```js
const row = Avatar.measureSpecialContact(avatar, entry.action.getClip(),
  entry.spec, specialMove(choice.characterId, choice.index), {ref});
measurement.specialContacts[ref] = row;
if (row.projectileSocket) measurement.projectileSockets[ref] = row.projectileSocket;
```

`sourceVersion` defaults to `entry.spec.sourceVersion`. An explicit
`{sourceVersion,releaseBone}` may be passed for isolated QA. Otherwise the
release bone comes from the actual movement VFX cue's bone or explicit spec
anchor. Missing/foreign bones fail; the sampler never substitutes body centre.
The existing three-argument `measureProjectileSocket()` keeps its old pawL
default for accepted legacy playback. Its optional `{bone}` supports the
correct source-specific foot, hand or tail anchor.

Each row includes the source character/move identity, original v17 clip ID,
exact source contact clock, and every real Battle active-frame surface sampled
with the shared `specialClipTime()`. Signed surface/socket coordinates survive.
The custom resolver passes this row as `customSpecialContact`. With the separate
P3 special-contact candidate enabled, the shared runtime validates its identity,
clock, version and frame coverage before preferring it over canonical data.
The existing per-ref projectile-origin callback remains highest priority.
Paired throw and counter rules retain their existing behavior.

Per-ref projectile-centre validation uses the existing 8 cm custom projectile
collision radius. A measured centre slightly below root can still intersect
ground; a circle wholly below the plane is rejected. No value is clamped.
Actual Godan-body/Takimaru-projectile release measures `-0.002557 m` locally.

Actual CPU verification uses real GLTFLoader, retargeted animation clips,
AnimationMixer and post-graft mesh skinning:

- all 27 native clips, 19 melee active trajectories and 27 contact sockets;
- nine existing head/ear/color/pattern combinations, with custom melee rows
  consumed by Battle rather than copied from canonical bodies;
- six accepted projectile sources on each of nine bodies (54 combinations),
  including equipping source s1 in slot s2 and spawning at its measured socket;
- three existing seeded custom appearances with all six release measurements;
- unchanged SHA256 hashes of all nine original GLBs and nine modular part GLBs.

The complete report is
[custom-special-surfaces-cpu.json](evidence/custom-special-surfaces-cpu.json).
Dojo tests pass 194/194, custom tests 15/15, and Pages build passes. Images are
stubbed in this CPU tool: it is not actual WebGL, physical-phone performance,
art-quality acceptance or approval to enable the production override.

Reproduce after loading the reviewed/candidate art files:

```sh
node --loader ./exp/fable-3d/custom/v16/tools/three-loader.mjs \
  exp/fable-3d/custom/v16/tools/verify-custom-special-surfaces.mjs
```

The sampler integration depends on the separate special-runtime precedence
fix `32b0bc5`; its artifact does not imply acceptance of a later author revision.
