# Normal r2: real file/clip selection

This implements Claude delivery `15977ff`, read against
`motion/v17r2/README.md`. It keeps family `source.version === 'v17'` while
`source.contactVersion === 'v17-p3-normals-r2'`. Production approval is unchanged.
No original, r1, custom-part GLB or metadata file is rewritten or aliased.

`p3-normal-candidate.js` exports:

- `NORMAL_ART_MANIFEST_FILES`: the r1 metadata, partial r2 metadata and full r2
  JSON contact paths, relative to `exp/fable-3d/`;
- `mergeNormalArtMetadata(r1,r2)`: pure strict character-level merge. The original
  metadata must contain nine bodies, and the partial r2 metadata exactly the six
  Takimaru rows. Returned 54 rows retain their authored metadata file provenance;
- `loadMergedNormalArtMetadata({read,fetchJSON,assetRoot})`: `read(relativePath)`
  returns parsed JSON for Node callers, or `fetchJSON(URL)` supplies browser I/O;
- `loadP3NormalMotionCandidate({artRevision:'r2'})`: default candidate loading.
  Explicit `{artRevision:'r1'}` still loads the unchanged r1 delivery.

The adapter requires `raw.clip === authored.clip` and a known delivered file
identity. The sole r2 normal file is
`motion/v17r2/takimaru_normals_v17r2.glb`. Its crouch-heavy clip is
`v17r2_crouch_heavy`, and the other five retain their `v17_*` names. Other bodies
retain their original r1 files. Unknown paths, traversal, cross-body files,
incorrect clip names and undeclared active limbs fail validation.

Provider API:

- `source.pack(id)` returns the validated actual `file`, `path`, `url` and six
  actual per-rig `clipNames`;
- `source.clipName(slot,{rigId})` selects that body's actual clip. Omitting the
  rig when bodies use different clip names fails instead of guessing;
- `slotForClip`, `isNormalClip` and `originalClipName` accept the same optional
  `{rigId}` and recognize only declared actual identities;
- `chooseClip(...,{normalMotionSource,rigId})` uses explicit rigId, then the
  fighter's visualRigId, then fighter.id. Story should pass actor.baseId.

Takimaru's revised crouch-heavy declares both hands. Its active leading hand
changes `armR → armL → armL → armL`. Factory measurement compares both declared
arm surfaces at every actual and style-added phase and records the winning
part. It retains the source body's `battleActive` and per-style exact coverage.

Actual Three CPU verification passes all 54 selected clips and all 81 body/style
combinations (486 clips, 1,899 actual active-frame poses). At 0.55 m, the initial
low contact against nine crouching canonical opponents in both directions
improves from r1 4/18 contacts to r2 18/18. Height changes from 0.6063 to 0.2597 m;
performance and the low attribute are unchanged. Reports:

- [normal-source-cpu-15977ff-r2.json](evidence/normal-source-cpu-15977ff-r2.json)
- [custom-normal-styles-cpu-15977ff-r2.json](evidence/custom-normal-styles-cpu-15977ff-r2.json)

Dojo tests pass 196/196, custom tests 16/16 and all 77 protected assets verify.
These are CPU skin/clock/collision results with image decoding stubbed. Actual
WebGL, floor/art review, live approval and build asset copying are separate
integration work. The CPU tool defaults to r2; set
`MAMOKEN_NORMAL_ART_REVISION=r1` to replay the old source explicitly.

The existing custom special sampler also retains R2 source provenance supplied
by its separate loader via `sourceClip` and `sourceFile`; it does not rename or
mutate a source asset.
