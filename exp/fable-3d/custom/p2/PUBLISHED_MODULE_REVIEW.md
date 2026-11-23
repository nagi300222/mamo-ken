# Independent runtime review — first three authored modules

Artist source: Draft #224, `art/mamoken-p2-exchange-modules`, **6251dd73defb5fed611671c8106ccd763d6be196**. Only three modules are published at this revision. The remaining 23 candidates are not covered by this result. Original v16 binaries and all artist GLBs were read without alteration.

The production Factory successfully checks each published asset's actual bytes/hash, parses it with the shipped GLTFLoader, rebinds the real donor meshes to the host Skeleton, and checks interface position/normal/weights/four morph channels. Six actual normal attacks are sampled per assembled appearance. Independently paired boundary vertices are then sampled in 54 poses: nine timestamps each in idle, walk, guard, selected standing-heavy normal, selected crouching-heavy normal and heavy hurt.

| Module | Original slot triangles | Assembled slot triangles | Animated seam maximum | Actual normal surface change |
| --- | ---: | ---: | ---: | --- |
| Moguzo ← Godan head | 3,866 | 3,894 | 0m / 194 pairs | Arms/tail attack surfaces unchanged, as expected for a head swap |
| Godan ← Bullet hands | 7,260 | 4,898 | 0m / 194 pairs | Grounded arm reach +5.8–7.1mm; attack height changes also measured |
| Bullet ← Moguzo feet | 4,230 | 5,714 | 0m / 244 pairs | Existing arm/tail attack surfaces unchanged; actual foot geometry is replaced |

The first runtime rejection was an adapter issue: manifest names correctly contain the exported `paw.L` syntax, while Three.js sanitizes node names to `pawL`. The adapter now applies the same PropertyBinding sanitization to declared names before comparing ordered skin joints and mapping them to the host. Sanitized-name collisions, missing joints, changed inverse binds and mismatching transforms still fail. No artist file was changed to bypass a check.

Artist-authored six-pose sheets were independently inspected. The foreign head/arm/leg silhouettes and topology visibly change and remain connected through guard, attack and hurt poses. The first published sheets also show the existing host headband/wrist accessories intersecting or floating relative to some replacement shapes; source author documents this limitation. Donor pigment differences in those authoring sheets are not proof of a runtime palette problem: the Factory separately uses the donor reference palette for user-selected part colors. The sheets are authoring-page evidence, not evidence that the actual Factory shader rendered in a browser.

## Browser acceptance fixture

`custom/p2/inspection.html` loads the exact same production Factory and real modules for the three representative pairs above, with real embedded textures and the part palette/pattern shader. Its paired actors are source-vs-replacement, and its evidence includes module IDs/hashes from actual mesh metadata, live WebGL draw/texture counts, actual attack-surface measurements, four-morph stream bindings, real sockets and the independent 54-pose seam samples. It is an unlinked acceptance fixture, not an alternate user-facing game mode.

Run the existing static source server and then:

```bash
CHROMIUM_PATH=/usr/bin/google-chrome node exp/fable-3d/custom/p2/tools/verify-part-browser.mjs
```

`MAMOKEN_P2_ASSET_URL` may target the built `/custom/p2/` route. Evidence goes to `MAMOKEN_EVIDENCE/parts`: paired idle/standing-heavy/crouching-heavy/hurt screenshots and `browser-parts.json`. The fixture always selects these three exact IDs even after more modules are published, while the CPU runner validates every manifest module.

At this commit the CPU run passed; the browser fixture awaits execution in CI because the local Chromium process cannot create its required socket. No physical iPhone touch, thermal, battery or hardware-FPS result is claimed.

## Complete-catalog and adjacent multi-slot gate

`MAMOKEN_REQUIRE_P2_FULL=1` makes both CPU and browser acceptance require the exact 26 approved target/donor/slot combinations: two foreign donors for four slots on each of three hosts, plus the two short-tail exchanges. Counting 26 arbitrary entries is insufficient. Missing, extra or duplicate combinations fail; a three-module publication cannot pass this gate.

The CPU runner checks all published modules individually in 54 poses, then creates three actual available mixed-slot appearances. A complete catalog supplies five slots on Moguzo/Godan and four on Bullet, alternates donors across head/ears/hands/feet, and samples the resulting adjacent swapped interfaces in all 54 poses. The browser keeps the richer three paired views, renders every remaining published module in an actual normal pose to compile its material/skin/morph shader, and renders the three mixed assemblies for `actual-available-mixed-assemblies.png`.

With the current three-module source, default-mode CPU checks pass but each available host profile has only **one slot and one donor**, explicitly reported `partial:true`. The strict complete-catalog command was separately confirmed to reject that source with the exact 23 missing combinations. No adjacent multi-slot result is claimed until the full authored assets have been tested.

## Full delivery tested independently

The subsequent artist delivery **965f393bf8e2ceeb0d5b97d60a9ddc7d44e2b656** contains the exact 26 expected modules, totaling 17,568,132 bytes. Strict full-mode CPU execution exited successfully against those actual GLBs without artist-asset edits. The compact, per-asset result and its full-report hash are saved in `evidence/runtime-cpu-summary-965f393.json`.

- All 26 individual physical assemblies passed host skin/bind, four morph channels, slot topology replacement, six actual normal surfaces and 54 animated seam poses each: **156 normal records**, maximum animated seam gap **0m**.
- Moguzo and Godan each assembled five swapped slots, Bullet four, with two foreign donors per host and adjacent swapped head/ears interfaces. All three mixed assemblies passed their own six-normal measurement and 54-pose seam pass; maximum gap **0m**, with `partial:false` for all three.
- Across individual modules, rest-position, morph-delta and skin-weight seam errors were zero; maximum normal-vector difference was approximately 1.21×10⁻⁷.

This establishes the CPU skin/contact compatibility of that exact 26-module delivery and the three tested mixed assemblies. It does not establish every possible multi-slot permutation, all foreign melee combinations, actual browser composition, GPU shader success or physical iPhone performance. Those remain separate checks; the browser fixture is ready to perform its strict full-catalog pass.
