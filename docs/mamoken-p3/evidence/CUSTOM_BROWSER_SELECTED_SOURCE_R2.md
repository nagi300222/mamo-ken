# Selected-source custom browser fixture

The initial r2 live job `137578040970` stopped at a normal surface comparison against the frozen v15 table. The fixture now consumes `normal-contact-source.js`, the avatar's actual selected pack, and the selected style's complete active-frame grid.

Mixed projectiles now load through the same `createShowtimeLoader` and approved special source as Story. Native clips bind to the modular avatar; foreign clips use the existing supported retarget path. Each selected clip produces its own `measureSpecialContact` record and release bone socket before creating the existing Battle. All 54 combinations must retain their equipped source, finite bone/skin samples, measured spawn position, and exactly one hit with the existing damage.

Hakuma.s3 and Dark Moguzo.s3 additionally measure the leading surface across both declared hands at all nine active frames. Each phase must match an independently sampled skin surface and leading part, and the actual custom Battle must accept the inner boundary and reject the outer boundary from both directions. The browser renders every one of these 18 poses to WebGL, checks non-background pixels, and saves first/middle/last PNGs for both moves.

Local callback dry-run with the actual GLTFLoader and image decoding stubbed: selected normals `v17`, specials `v17r2`; 54 normal rows, 422 both-facing active-frame boundary samples, 54 mixed projectile hits, nine rigs, and the two nine-frame special probes passed. Hakuma changes from armL to armR; Dark Moguzo changes armL→armR→armL. This dry-run bypassed WebGLRenderer only in a disposable local copy. The committed browser fixture requires actual WebGL rendering; its live rerun remains pending.

No production source, factory, compatibility, assets, move performance, or approval selector changes are included in this fixture commit. It depends on the separately reviewed factory correction `f953f3b`.

## Integrated WebGL receipt

Source HEAD: `2dc707fbee841fef29c712f05c519404d22b242e`. [Actions run 45142345050](https://github.com/nagi300222/mamo-ken/actions/runs/45142345050) completed both watched jobs successfully:

| Job | Artifact | Confirmed result |
| --- | --- | --- |
| Custom `137583158536` | `14802581896` | Selected v17 normals / v17r2 specials; 54 normal rows, 422 both-facing active-frame boundary samples, 54 single-hit mixed projectiles, `errors: []` |
| Avatar `137583158450` | `14803165458` | Six visible original/grafted/patterned avatars; 45 draw calls, 93 textures; no page/shader errors |

Hakuma.s3 and Dark Moguzo.s3 each rendered all nine active frames: **18 actual GPU frames** in total, with **six saved first/middle/last PNGs** manually reviewed. Visible-model pixel counts ranged from 11,575–13,451 for Hakuma and 7,520–9,428 for Dark Moguzo. The independently sampled leading hands changed L→R and L→R→L respectively; both-facing inner/outer Battle boundaries passed at every phase.

The avatar inspection's older single centre `readPixels` sample returned stale zero after presentation. It is not visibility evidence; the actual screenshot was reviewed and shows all six textured models. The custom special renderer uses a preserved framebuffer and checks visible pixels on every frame.

The source reports and PNGs remain in the GitHub Actions artifacts, whose configured retention is **14 days**. No raw PNG copies are added here. These results use desktop Chromium/SwiftShader; physical iPhone/Android operation and performance remain untested.
