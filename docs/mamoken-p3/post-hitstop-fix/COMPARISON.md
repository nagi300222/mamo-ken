# CPU comparison after the wall hitstop fix

After receiving runtime fix `b3770b2`, both phases were replayed with that exact
fixed Battle: **1,458 old-surface reference rounds + 1,458 combined-R2 rounds**.
The original [R2 receipt](../r2-combined-cpu/COMPARISON.md) is preserved unchanged.

The fix translates newly authored impact feedback after existing separation and
holds roots while both fighters began the tick in hitstop. No timing, damage,
range, knockback, collision dimension, cancel or CPU parameter changed. Targeted
mirrored wall hit/guard and projectile-world-point tests pass separately. These
matrix results do not replace those targeted pose/anchor checks.

The new Battle SHA256 is
`86b27296050ccd4008af093a5e986bc390dd3fb264efe3a5199eb08075bfc169`.
Balance, CPU, normal-performance, special-performance, policy and reviewed R2
provider hashes match the previous audit. Only the shared Battle code hash
changes. Both new phases use that same fixed code and six frozen policies.
Complete hashes and selected provider versions are in
[comparison.json](comparison.json).

|Phase|Normal / special source|Timeouts old → fixed|Draws old → fixed|Changed final round records|
|---|---|---:|---:|---:|
|Reference|v15 `15.1-r3` / legacy special geometry|69 → 69|44 → 44|0 / 1,458|
|Combined R2|`v17-p3-normals-r2` / reviewed `v17r2`|60 → 60|36 → 36|0 / 1,458|

Winner, final HP, simulation length, timeout flags and all other stored round
fields are identical to their old receipts; the raw matrix bytes and move-usage
counts are identical as well. Mean lengths remain 1,388.49 frames for reference
and 1,406.27 for combined R2. All 2,916 rounds terminate. Fixed reference versus
fixed R2 still changes 104 winners, exactly as in the earlier source comparison.

Combined-R2 scores (draw = half win, 288 non-mirror appearances each) are unchanged:

|Character|Before fix|After fix|
|---|---:|---:|
|Moguzo|68.2%|68.2%|
|Pisuke|64.9%|64.9%|
|Godan|30.9%|30.9%|
|Hakuma|31.6%|31.6%|
|Chirka|67.9%|67.9%|
|Takimaru|29.9%|29.9%|
|Yomikage|54.5%|54.5%|
|Bullet|31.6%|31.6%|
|Dark Moguzo|70.5%|70.5%|

This quantifies the fix's observed effect under these fixed controllers. It
does not claim every intermediate position was unchanged or that the wall bug
was cosmetic in all possible play. The real-browser wall fixture exposed a
case these aggregate final-record results do not distinguish. Fast-character
advantages and the prior balance-review limits remain; this is not human
competitive-balance or physical-device performance certification.

Raw rerun outputs:

- [Reference matrix](reference/cpu-matrix.json), [summary](reference/cpu-summary.json), [move usage](reference/move-usage.json)
- [Combined R2 matrix](combined-r2/cpu-matrix.json), [summary](combined-r2/cpu-summary.json), [move usage](combined-r2/move-usage.json)

The runtime copy used for reference resets only the three contact/motion
selection overrides to null while keeping the fixed current Battle and policy.
The same `p3-combined-cpu-audit.mjs` replays each runtime. This evidence commit
changes no production selectors or game code. All 77 protected assets verify.
