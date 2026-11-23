# R2 native routes: measured spacing and confirmation

The common v15.1 midscreen weak → heavy → s2 macro no longer describes the
actual R2 striking surfaces. Both standing and crouching tests fail first for
Moguzo and stop iterating, but full inspection finds the same spacing issue on
eight characters; Takimaru retains the route. It is not a hitstun shortage.
For example, Moguzo reaches s2 with 22F of opponent stun remaining, but the
distance after two hit pushbacks is 0.495m and the visible strike reaches only
0.2906m + the existing 0.16m hurt radius. Extending stun cannot close that gap.
Some characters would still be out of range even with zero heavy knockback.

**No gameplay numbers, hitboxes, source clocks, CPU policy or cancel rules are
changed.** This replaces the obsolete common macro fixture with actual native
routes and preserves the original s2 conversion at close wall spacing. The
historical v15.1 documents remain records of that earlier surface version.

At 0.35m midscreen, initial weak alone is unguarded; the defender then holds
correct continuous guard. Inputs occur just after hitstop releases. Both facing
directions and both normal postures have three real hits and two legal cancels:

|Character|Finisher|Role|Finisher S/A/R|Heavy hitstun stand/crouch|Stun remaining immediately before hit3 stand/crouch|
|---|---|---|---|---|---|
|Moguzo|s1 大地の波|Basic wave confirmation; s2 remains close anti-air|13/2/20|28/30|16/18|
|Pisuke|s3 連脚|Forward moving kick chain|7/9/20|27/30|21/24|
|Godan|s3 肩当て突進|Weighty shoulder advance|18/7/32|33/35|16/18|
|Hakuma|s1 雪壁掌|Heavy grounded palm|11/6/22|32/34|22/24|
|Chirka|s3 影引き爪|Advancing claw|13/5/22|27/30|15/18|
|Takimaru|s2 抱え上げ|Existing close rising lift|10/7/27|33/35|24/26|
|Yomikage|s1 残月の波|Wave finish; counter is a defensive read|13/1/23|30/33|18/21|
|Bullet|s3 尾薙ぎ|Native long-tail spacing|19/6/23|32/34|14/16|
|Dark Moguzo|s3 暗連|Forward rush chain|7/9/24|29/32|23/26|

All heavy hit-confirm windows remain `[0,5]` active-clock frames. S/A/R,
hitstun and recovery above are existing values, not new proposals. The three-hit
counter and positive pre-hit stun prove that the defender did not regain a
guardable neutral state between hits. Damage scaling remains verified.

At the existing minimum close wall spacing of 0.34m, all nine original
weak → heavy → s2 conversions still work: **36/36** standing/crouching and
left/right cases, each with three real hits and two cancels. This positions s2
as a close conversion rather than inflating its visible midscreen reach.

The 216-case raw audit also includes delayed confirms (8F), guarded openers and
whiffed openers. All fail to bypass the existing hit-confirm/cancel rules. Raw
events, contact samples, distances, victim stun and active-frame observations:

- [routes.json](routes.json)
- [route-summary.json](route-summary.json)

`combat-v151.test.mjs` passes 16/16 under combined live R2 selection. The audit
table in `combo-routes-p3.mjs` is a test/documentation and future guide candidate;
no extra production Practice row is added to the narrow mobile layout. Existing
Practice UI has no common-s2 recipe to replace. UI adoption can follow its
separate review. This is real Battle logic evidence, not a claim of human combo
difficulty, visual polish, or final competitive balance.

Reproduce with reviewed R2 normal and special delivery selected:

```sh
node exp/fable-3d/dojo/p3-combo-probe.mjs
node --test exp/fable-3d/dojo/combat-v151.test.mjs
```
