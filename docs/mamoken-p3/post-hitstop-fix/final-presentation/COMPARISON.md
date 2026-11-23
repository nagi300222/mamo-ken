# Final presentation fix: exact runtime CPU receipt

The final `bfa00a1` presentation follow-up (root code commit `e103da7`) aligns
authored impact points after all trade, separation and later-projectile movement.
It fixes the independently reproduced 45 mm weak-trade offset while keeping
projectile-world impacts independent. The earlier hitstop root hold remains.
The four targeted wall/trade/projectile regressions pass separately.

The exact final Battle SHA256 is
`ced458404345df723db4f0a6a42087a7a805acfe2fc0e7ce02c35d58eeef3eb4`.
Before replay, the audit worktree's entire Dojo tree was verified identical to
root `e103da7`. Both phases then ran again in fresh processes with that runtime:

- 1,458 reference rounds: old v15 `15.1-r3` normal contacts and legacy special
  geometry, selected by null normal/special contact and special motion overrides;
- 1,458 combined-R2 rounds: reviewed `v17-p3-normals-r2` contacts and `v17r2`
  special motion/contact selection.

No policy, timing, damage, reach, cancel, knockback or other gameplay parameter
was changed for this replay. The new phases have identical Battle/balance/CPU
code hashes and frozen-policy hash. Provider versions and full file hashes are
recorded in [comparison.json](comparison.json) and both summaries.

All **2,916 rounds terminate**. Compared separately with both the original
combined-R2 audit and the first wall-fix audit:

|Phase|Changed stored round records|Changed winners|Timeouts|Draws|Mean simulation frames|
|---|---:|---:|---:|---:|---:|
|Reference|0 / 1,458|0|69|44|1,388.49|
|Combined R2|0 / 1,458|0|60|36|1,406.27|

The raw matrix bytes, per-move usage, final HP, winner, frame length and timeout
fields are identical to both previous receipts. Every character's combined-R2
score is unchanged: Moguzo 68.2%, Pisuke 64.9%, Godan 30.9%, Hakuma 31.6%, Chirka
67.9%, Takimaru 29.9%, Yomikage 54.5%, Bullet 31.6%, Dark Moguzo 70.5% (draws
count half, mirror matches excluded). The existing balance-review limitations
and fast-character advantage therefore remain.

This confirms no changed final outcomes under the fixed six CPU patterns. It
does not prove all intermediate positions are unchanged or replace the targeted
actual trade/wall tests. It is not human competitive-balance or physical-device
FPS certification. All 77 protected assets still verify.

Raw independently rerun evidence:

- [Reference matrix](reference/cpu-matrix.json), [summary](reference/cpu-summary.json), [usage](reference/move-usage.json)
- [Combined R2 matrix](combined-r2/cpu-matrix.json), [summary](combined-r2/cpu-summary.json), [usage](combined-r2/move-usage.json)

The earlier [initial wall-fix receipt](../COMPARISON.md) and
[original combined-R2 receipt](../../r2-combined-cpu/COMPARISON.md) remain intact.
This final evidence update changes documentation and data receipts only.
