# Combined live R2: 1,458 CPU rounds per phase

This comparison activates **both** reviewed R2 normal contacts and reviewed R2
special contacts. It is not the earlier special-only comparison that held v15
normals constant. The reference deliberately selects the accepted old v15 normal
table and old v14 numerical special surfaces, with the same current engine and
known-reach CPU policy. Timing, damage, cancel rules, P3 hitstop and the existing
19-special hitstun candidate are identical in both phases. No balance value was
changed to produce these results.

|Phase|Normal provider|Special provider|
|---|---|---|
|Reference|`v15`, `15.1-r3`, `normal-contacts-v151.js`|Legacy collision paths in `battle.js` and `balance.js`; special motion/contact overrides null|
|Combined R2|`v17`, `v17-p3-normals-r2`, `normal-contact-reviewed-v17.js`|`v17r2`, `special-contact-reviewed-v17r2.js`|

The exact SHA256 of each selected provider and shared battle/balance/CPU code is
in [comparison.json](comparison.json) and both phase summaries. For example the
reference normal provider starts `7ec0ea1df46d`, the combined normal provider
`9f188cce799e`, and the combined special provider `7aff0c674105`. Shared code and
the frozen policy hash match exactly. This identifies actual old versus new
data instead of relabeling an unchanged contact table.

Each phase plays all 9×9 ordered pairs, three CPU levels and six fixed patterns:
neutral, confirm, low pressure, air footsies, grapple pressure and ranged control.
Initial spacings are 0.70/1.20/2.40/0.36/0.36/1.40m. Both seat orders are covered;
mirror matches are included in raw matrices and excluded from character scores.
The confirm-pattern override deliberately retains its frozen common-s2 request,
filtered by the current known-reach rule; it does not adopt the new human route
guide to inflate candidate results. The same rule is applied in both phases.

Scores below count draws as half a win (288 non-mirror appearances per fighter):

|Character|Reference score|Combined R2 score|Change|
|---|---:|---:|---:|
|Moguzo|67.7%|68.2%|+0.5 points|
|Pisuke|64.4%|64.9%|+0.5|
|Godan|35.8%|30.9%|−4.9|
|Hakuma|31.9%|31.6%|−0.3|
|Chirka|64.6%|67.9%|+3.3|
|Takimaru|30.6%|29.9%|−0.7|
|Yomikage|55.2%|54.5%|−0.7|
|Bullet|29.0%|31.6%|+2.6|
|Dark Moguzo|70.8%|70.5%|−0.3|

All 2,916 rounds terminate. Timeouts decrease **69 → 60**; draws decrease
**44 → 36**. Winners change in 104/1,458 paired cases. Mean length changes
1,388.49 → 1,406.27 simulation frames. These are game-simulation frames, not
measured device FPS or wall-clock rendering performance.

The remaining fast-character advantage is substantial. Godan loses 4.9 points
in this fixed-controller sample; Bullet gains 2.6 and Chirka 3.3. This is review
data and does not certify human balance or justify automatically buffing one
move. Both normal and special surfaces differ, so this combined result alone
cannot assign the shift to an individual animation. Native human routes remain
separately verified in [the route audit](../r2-combo/ROUTES.md).

Raw data and move starts/hits/blocks/misses are retained:

- [Reference matrix](reference/cpu-matrix.json), [summary](reference/cpu-summary.json), [move usage](reference/move-usage.json)
- [Combined R2 matrix](combined-r2/cpu-matrix.json), [summary](combined-r2/cpu-summary.json), [move usage](combined-r2/move-usage.json)

The independent audit worktree copied the reviewed R2 overrides/data from the
integration worktree. Its reference runtime is an identical temporary copy with
only normal-contact, special-motion and special-contact override exports reset
to null. These local selector copies are not committed as an activation change.
`p3-combined-cpu-audit.mjs` accepts `MAMOKEN_ENGINE_DIR` and `MAMOKEN_EVIDENCE` to
replay either frozen runtime. The 77 protected original assets also verify.
