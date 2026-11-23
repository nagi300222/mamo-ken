# Production R2 special and paired-response acceptance

Verified game commit: `e10c823b4586c5c3d48112af6830b595b24c71c7`.
Actual CI run: [45146238314](https://github.com/nagi300222/mamo-ken/actions/runs/45146238314).
Special job: [137596104430](https://github.com/nagi300222/mamo-ken/actions/runs/45146238314/job/137596104430), **SUCCESS**.
Evidence: [artifact 14804372067 — mamoken-runs-custom-story-special](https://github.com/nagi300222/mamo-ken/actions/runs/45146238314/artifacts/14804372067).
Exact preview: <https://e726fd23.mamoken-3d.pages.dev>.

This is an actual Chromium/Three.js/WebGL run using software rendering and an
852×393 mobile viewport. Neither a physical iPhone nor physical-device GPU/FPS
performance was measured. Both reports explicitly say `physicalDeviceTested:false`.

## Production motion and collision

`special-contact/report.json` reports `passed:true`, `candidateOnly:false`,
`productionApproval:"v17r2"`, `productionContactVersion:"v17-p3-specials-r2"`,
and no errors. The fixture used production-selected actors, clips and contact
delivery; it did not replace the production source or contact table.

| Check | Actual result |
| --- | --- |
| Source poses | All 9 bodies / 27 special clips measured from real SkinnedMesh |
| Active surfaces | Every actual active-frame point compared against the approved table, within 5 mm |
| Mirroring | Independently sampled left/right source surfaces agree |
| Projectile origin | All 6 actual release bones/sockets compared against approved sockets |
| Combat scenarios | 50 passed: 32 actual hits/guards, 16 whiffs, 2 projectile releases |
| Contact roots | All 32 hit/guard roots remained identical from impact tick to stopped render |
| Visible hit points | Maximum actual X error 0.049912 mm; maximum Y error 0.038275 mm |
| Revised low attack | Takimaru crouch-heavy: 6 actual hit/low-guard/whiff cases across both directions |
| Errors | No page, asset or animation-binding errors recorded |

The 50 combat cases cover Godan S3, Chirka S3, Dark Moguzo S1 and the six revised
R2 moves (Moguzo/Godan/Takimaru/Yomikage/Bullet S2, Hakuma S3). They do not mean
that all 27 specials were each tested against every opponent in browser play.
The 27-source measurement and the broader Node collision/CPU audits are separate
evidence.

## Counter and paired throw

`special-responses/report.json` reports `passed:true`, 16 cases and no errors.
Both the normal Dojo and the existing Story custom-character Battle consumer
used their actual production loaders and real battle events.

| Consumer | Yomikage counter | Takimaru paired throw |
| --- | --- | --- |
| Dojo | 6: finish, interruption, miss × both directions | 2 directions |
| Story | 6: finish, interruption, miss × both directions | 2 directions |

The counter waited using `s3_v17` (0.85 s) and actually switched after success to
the retained `counter_success_v14` (0.35 s). Battle advanced during the response;
interruption canceled the response, and a miss produced no counter/hit/block.
The response was sampled at counter frame 7, source time 0.10 s, with full weight.

Each throw produced one damage event and a 48-tick pair. Samples at pair frames
8, 27 and 46 showed attacker `throw_hit` and victim `thrown` progressing together:
0.15/0.15 s, 0.466667/0.466667 s, and 0.783333/0.733333 s. The victim correctly
held the last frame of its retained 44-frame clip while the attacker finished its
48-frame clip. Throw completion returned to normal stun/recovery without another
damage application.

The fixture deliberately holds already-rendered fixed frames for screenshots.
It never rewrites clip time or substitutes an animation; these held captures
are timing/correctness evidence, not a performance benchmark.

## Image review and the wall correction

Independent PNG review included all six revised first-hit poses, Godan S3's
actual wall guard, Chirka S3, the revised Takimaru low hit, both counter consumers
and the Story paired throw. Models, limbs and opponent reactions were visible;
the Story result used the actual custom marmot and CPU opponent. Screenshots
support those sampled poses and their feedback alignment, not an artistic
approval of every frame of every animation.

This successful run includes the narrowly scoped
[impact position / stopped-root fix](IMPACT_POSITION_FIX.md). The earlier failed
runs remain failures: one revealed natural backward guard retreat, the next
revealed a real wall/separation feedback mismatch. No reach or 5 mm tolerance was
inflated to obtain this result. The fix is separate from the 19-special hitstun
proposal. Its full local Node suite passed 211/211 before publication.
