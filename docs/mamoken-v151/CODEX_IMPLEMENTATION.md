# v15.1 implementation — Issue #196

Base: PR #195, b92717c97a99de8f9518d7ad51dbd8d2397b18a2. User-approved v15 choreography is retained.

## Implemented

- `normal-balance-v151.js`: 54 explicit rows. Final normal damage is explicit, without applying power a second time. Character mobility, specials, original models and ultimates are unchanged.
- Normal source contact pose maps to Battle startup. Active span and recovery have separate time segments. Hitstop freezes the same game and pose clock.
- Actual contact opens a finite, hit/block-specific cancel window. Strong normals cannot loop into normals, and weak chain limits remain character-specific. Blocked normals cannot cancel to special2/3; Moguzo retains weak→special1 on block.
- Hitstun/blockstun and pushback come from each normal. True combos require the same defender still in hitstun; the arbitrary 32-wall-frame combo cutoff is removed.
- CPU reads `fighter.frame`, fixing the nonexistent `action.frame` reference. `cpuSeed` supports repeatable varied cadence/guard simulations.
- Practice adds standing guard, crouching guard and weak reversal. Hit count uses actual combo contacts, and frame advantage measures when both fighters become ready. A canceled action does not display a fictitious raw advantage.

## Art contract (pending Claude audit)

Codex owns performance and rendering integration; Claude owns motif edits and contact/reach metadata. Neither modifies the other's sources before mutual review.

`normalClipTime(id, slot, frame, move, clip.duration, contacts)` accepts optional contact data keyed by character/slot, with normalized `contact` and `contactEnd` values. Source +Z is forward before facing rotation. Reach means fighter-root to visible striking surface, with defender hurt radius 0.16m added separately. No transparent extension. Current reach is preserved until the measured art report is received; it is not yet certified as visually aligned.

## Validation at initial submission

126 Node tests pass; static Pages build passes. Nine real weak→strong→special2 routes hit three times against a defender holding guard after hit1, in both directions. Whiffs and expired contact windows do not cancel. These are initial regression results; art measurements, repeated CPU matrix and browser review are still in progress. Do not treat this Draft as completed balance or final integration.
