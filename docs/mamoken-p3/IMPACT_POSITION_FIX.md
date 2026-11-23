# Corner impact position and hitstop correction

This is a physics/presentation bug fix, separate from the 19-special hitstun
candidate and its balance data. No move damage, reach, active trajectory,
startup, recovery, hitstop duration or knockback parameter changes.

The actual production R2 browser run `45142345050` failed the first Godan S3
right-facing guard case. The defender guarded at the real arena wall. The
feedback point used the attacker's root before the existing body-separation
pass, while rendering used its position afterwards. The first-frame discrepancy
was 11.17 mm. Subsequent ticks continued resolving the residual wall overlap
during hitstop, increasing the rendered discrepancy to 22.04 mm with the attack
pose still held at frame 18. The source mesh/table comparison itself passed.

The same phase issue reproduced in real mirrored weak/weak trades: the first
hit's attacker was subsequently knocked back, leaving its impact 45 mm ahead of
its final root. A later projectile can likewise move an earlier hitter.

The fix preserves the existing separation calculation and collision order. The
authored feedback's attacker/root at creation is stored privately in a WeakMap.
After pending trades, separation and projectiles, only that tick's authored
normal/special feedback is translated by the attacker's final root displacement.
Each origin is consumed once; independent projectile world points stay unchanged.
When both fighters began a tick in hitstop, body
separation is skipped for that tick so that their roots stop with their poses.

`impact-position-p3.test.mjs` exercises normal and special hit/guard against both
walls, verifies the first rendered contact point and every stopped root/frame,
and checks real mirrored trades and subsequent projectile knockback. Projectile
contacts retain their world points despite body separation or later alignment.
The real browser fixture also compares the captured contact root to
the later stopped render root and retains a 5 mm mesh-contact tolerance.

Actual WebGL acceptance must be rerun after this correction; the failed run is
evidence for the bug, not a completed browser acceptance result.

The rerun has now completed successfully on `e10c823`: CI `45146238314`, special
job `137596104430`, artifact `14804372067`. All 32 actual hit/guard captures
retained their impact roots and matched the independently rendered attack surface
within the unchanged 5 mm threshold. Full counts, counter/throw evidence and
device limitations are recorded in [the final production receipt](SPECIAL_R2_FINAL_WEBGL.md).
