# P2 measured foreign melee tranche

This is an AI implementation candidate, not a claim of owner playtest approval.
`cpu.json` records real GLTFLoader / Three CPU skin and existing Battle results;
images are stubbed. GPU acceptance is supplied separately in
`custom/v16/p2-melee-browser.mjs` and must run on the built Pages site.

| Body | Godan s3 shoulder | Chirka s3 claw | Pisuke s3 kick |
|---|---|---|---|
| Moguzo | measured | measured | measured |
| Godan | existing native | measured | unsupported: support-foot correction >50 mm |
| Bullet | measured | measured | measured |

Every supported cell runs on both the original body and one explicit actual
physical module profile: Moguzo head=Godan, Godan hands=Bullet, Bullet feet=Moguzo.
Other physical module combinations remain unsupported for foreign melee.
Existing native skills keep their own measured path. The failed kick is retained
in saves/UI with a reason; no automatic substitution is made.

16 supported body/profile/technique cases, 108 active frames independently
skinned to within 1 micrometre of the runtime contact samples, 864 mirrored
inside/outside/height checks, 96 real startup hit/guard/miss runs and 16 custom
CPU runs pass. Source file hashes and physical module provenance are in the raw
report. These results concern the recorded hashes; rerun after asset changes.

The clone-only pelvis correction lifts a retargeted support foot toward the
host's own idle floor. It fades when the source raises its feet; it never pushes
a jump downward. All source animation keys, mapped Battle frames and 60 Hz
poses are checked. The maximum accepted whole-clip lift is 30.324 mm; the
Pisuke→Godan candidate needed 50.669 mm and remains closed. Original GLBs and
original clips/rig poses are unchanged. No damage, reach inflation, frame data,
knockback, invulnerability or style ability is added.

The only AI policy adaptation is for a custom CPU whose equipped slot1 is a
new measured foreign melee: the old far-range wave opportunity is filtered by
the same own-surface reach predicate. Movement and original timing are kept;
original CPU, projectiles and native NPCs keep their existing policy.

Run CPU:

```sh
node --experimental-loader ./exp/fable-3d/custom/v16/tools/three-loader.mjs exp/fable-3d/custom/v16/tools/verify-p2-melee.mjs
```

Run built-site WebGL acceptance:

```sh
MAMOKEN_STORY_URL=http://127.0.0.1:4173/story/ MAMOKEN_EVIDENCE=/tmp/p2 node exp/fable-3d/custom/v16/p2-melee-browser.mjs
```

The browser acceptance uses editor selection/save, exploration/NPC dialogue and
actual Story actors/Battle. It tests mirrored measured contact boundaries and
real startup hit/guard/miss, then verifies each equipped slot's own action
instance despite the shared `s3_v17` clip name, plus source-owned feedback/cues.
GPU execution and physical phone performance are not measured in this CPU report.

The receipt was rerun after integrating artist `965f393bf8e2ceeb0d5b97d60a9ddc7d44e2b656` (all 26 delivered modules). All three equipped physical modules changed bytes; the new report records their current hashes and repeats the same 16 measured cases.
