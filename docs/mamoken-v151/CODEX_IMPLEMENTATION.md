# v15.1 implementation — Issue #196

Base: PR #195, b92717c97a99de8f9518d7ad51dbd8d2397b18a2. User-approved v15 choreography is retained.

## Implemented

- `normal-balance-v151.js`: 54 explicit rows. Final normal damage is explicit, without applying power a second time. Character mobility, specials, original models and ultimates are unchanged.
- Normal source contact pose maps to Battle startup. Active span and recovery have separate time segments. Hitstop freezes the same game and pose clock.
- Actual contact opens a finite, hit/block-specific cancel window. Strong normals cannot loop into normals, and weak chain limits remain character-specific. Blocked normals cannot cancel to special2/3; Moguzo retains weak→special1 on block.
- A correct held guard remains a guard during blockstun; canceled pressure cannot convert an already blocked string into a free hit. CPU holds its chosen guard through blockstun without reading a future input. Air normals require standing guard.
- Hitstun/blockstun and pushback come from each normal. True combos require the same defender still in hitstun; the arbitrary 32-wall-frame combo cutoff is removed.
- CPU reads `fighter.frame`, fixing the nonexistent `action.frame` reference. `cpuSeed` supports repeatable varied cadence/guard simulations.
- Practice adds standing guard, crouching guard and weak reversal. Hit count uses actual combo contacts, and frame advantage measures when both fighters become ready. A canceled action does not display a fictitious raw advantage.

## Shared reviewed art contract

Codex owns performance and rendering integration; Claude owns motif edits and contact/reach metadata. Neither modifies the other's sources before mutual review.

`normalClipTime(id, slot, frame, move, clip.duration, contacts)` accepts optional contact data keyed by character/slot, with normalized `contact` and `contactEnd` values. Source +Z is forward before facing rotation. Reach means fighter-root to visible striking surface, with defender hurt radius 0.16m added separately. No transparent extension. The integrated candidate reads reach/activeReach from Claude contact data, and shares contact/contactEnd with rendering. All 54 are checked against the actual skinned surface in WebGL.

## Validation

134 Node tests pass; static Pages build passes. Nine real weak→strong→special2 routes hit three times against a defender holding guard after hit1, in both directions. Whiffs and expired contact windows do not cancel. The integrated candidate passes all 54 contact-clock/surface/height browser checks and all 81 cinematic pairings. The 1,458-round six-pattern CPU audit records residual fast/universal-fighter advantage; it does not certify final competitive balance.

Reciprocal-review follow-up: normal contact also samples activeReach.height against measured stand/crouch NORMAL_HURT_BOUNDS, with a vertical strike half-width of 0.06m. Floor tail attacks miss raised feet. This applies only to normals; special/ultimate collision rules are retained. Body bounds use the producer's measured body/head/leg P98 envelope across idle and guard poses.
