# Special r2 integration: explicit source identities

Read against Claude `15977ff` and `motion/v17r2/README.md`. The delivery has six revised special clips in six new packs; the other 21 gestures remain the declared r1 actions. The seven-clip artist delivery also includes one normal, handled by the separate normal provider.

`loadV17R2SpecialMotionSource()` merges the complete r1 metadata with the exact six-body r2 metadata. `special-motion-contract-p3.js` accepts only the two known versions and the six declared revised identities. Every full-table row must match its actual file, clip, revision and changed flag. Unknown versions, cross-body files and missing metadata fail.

The loader reads the actual file/clip, then clones a revised clip to the canonical `sN_v17` runtime action name. It never renames a cached source clip or rewrites a GLB. The spec and contact row retain:

- `motionVersion: 'v17'` for the existing compatible runtime clock/retarget API;
- `sourceVersion: 'v17-p3-specials-r2'` for the complete delivery;
- `runtimeClip`, `actualSourceClip`, `sourceFile` on the spec;
- canonical `clip`, actual `sourceClip` and `sourceFile` on contact rows.

`ShowtimeLoader` performs canonical cloning before handing entries to either actor consumer. Existing custom retargeting receives the supported canonical name. Its own measurement must still record the actual source provenance. R2 custom contact rows lacking that provenance fail closed. Existing custom projectile sockets remain authoritative. No new P2 compatibility is enabled.

The author's exact sampler uses integer source frames. R2 merge preserves the rounded metadata values as `sourceTiming` while deriving contact and active-end seconds from the original integer frames. `specialClipTime` consumes optional exact `contactEndSeconds`. R1 loading keeps its previous clock unchanged. Battle startup/active/recovery/damage and attributes are unchanged.

Both approval files remain owned by the integration lane. Approval must set the animation family `v17r2` and a complete r2 exact contact delivery together. An r1 animation approval paired with r2 contacts is explicitly rejected.

## Browser and build handoff

Add `special-motion-contract-p3.js` to the Pages runtime file list. Copy the actual r1/r2 GLBs and JSON selected by the provider. `p3-authored-special-delivery.mjs` is a Node audit helper, not an application asset requirement.

Run the existing special browser fixture with `MAMOKEN_SPECIAL_SOURCE_VERSION=v17r2`. It measures all 27 actual original-rig clips, runs the six revised plus three previous redesigns in both directions (50 special cases), and checks six Takimaru crouch-heavy hit/guard/whiff cases at actual 0.55m versus a crouching Chirka. The low-normal cases require the real common normal provider to be activated on the delivered r2 Takimaru pack; the test does not fake that path. Effective pose weight is now recorded and checked in each captured contact.

`authoredSpecialContactDelivery(source)` converts the author's per-active-frame table to the strict Battle delivery and retains the producer label. Integer sample `frame` becomes its exact rational phase; geometry values are retained. This is the author's measured table, not independent browser certification. The browser fixture produces a separate independently measured candidate JSON.

At this checkpoint Node tests and original77 protection pass; real r2 WebGL evidence is still to be collected by integration CI. iPhone performance and continuous video quality are not inferred from Node tests.
