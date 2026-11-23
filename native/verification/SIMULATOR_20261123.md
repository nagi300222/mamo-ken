# P1 actual iOS Simulator evidence — 2026-11-23

This records a real Simulator run, separately from Chromium with a mocked native adapter and from an owner's physical iPhone review. The P1 human review gate remains pending.

| Item | Actual result |
| --- | --- |
| Workflow | [45128527109](https://github.com/nagi300222/mamo-ken/actions/runs/45128527109), job 137538386998 |
| Source | `d58371f3e5b3a138b21d5cfa143990445afa736b` |
| Toolchain | Xcode 26.6, build 17F113; iPhoneSimulator SDK 26.5 |
| Device | iPhone 17 Simulator, iOS 26.5 |
| Native build | `BUILD SUCCEEDED`, no signing credentials supplied |
| Boot | Initial 180-second wait timed out during advancing first-boot migration; one conditional extension completed after approximately 55 more seconds |
| App | Installed `jp.nagi.mamoken.poc`, launched PID 15240; launchctl confirmed the UIKit application process remained alive before capture |
| Captures | Two original 1206 × 2622 PNGs, identical SHA256 `d313ccf899b4f846011c0320450b7564fa5fc72bbcd31d3d3f847554149f7f59` |
| Interface orientation | UIKit unified log explicitly reported `UIInterfaceOrientationLandscapeRight` |
| Human image review by implementation agent | The five-mode Japanese MamoKen launcher and Moguzo image rendered in WKWebView; no blank page or application error page |
| Layout defect observed | Dynamic Island overlaps the leading part of the normal-battle card description; the launcher lacks safe-area insets |

The original PNG framebuffer has portrait pixel dimensions and sideways landscape content. The image has not been rotated or altered to claim a landscape pass. UIKit's separate orientation log is the orientation evidence; screenshot dimensions alone do not prove or disprove interface orientation. The app's landscape setting does not establish that all controls avoid the notch.

Actual unified-log entries:

```text
2026-11-23 07:12:10.174 Scene updated orientation preferences: none -> ( Ll Lr )
2026-11-23 07:12:10.601 [Interface Orientation] was:Interface Unknown now:UIInterfaceOrientationLandscapeRight reason:Using key window scene
```

Evidence is in [artifact 14796544191](https://github.com/nagi300222/mamo-ken/actions/runs/45128527109/artifacts/14796544191), including `evidence/simulator/report.json`, command logs, both unmodified PNGs, device/runtime inventory, app output and the unified log. The ZIP SHA256 is `d5841ebb85af94086b97bf78010c93c6e8d9b091a41e4cb2ddc9e06dc76ba516`. Actions artifacts have limited retention; the recorded hashes and results preserve their identity, not their future availability.

Not tested by this run: native touch navigation, actual Simulator WebGL battle, native background/save/audio interactions, physical iPhone installation, touch comfort, thermal behavior or device frame rate. Browser regression covers a separate scope. Safe-area changes require a subsequent visual check; this image does not validate a later UI revision.

## Safe-area source audit at this run

- Launcher: `lobby/style.css` uses fixed/clamped `main` padding, overridden to `14px 25px` on short landscape screens. No safe-area inset protects its cards.
- Normal battle, practice, arcade and survival share `dojo/#app`, whose four-sided safe-area padding protects their common layout. The fixed selection screen has separate safe-area insets.
- Story/editor: header uses the right inset for both horizontal sides; editor/journey/footer/movie controls include fixed edge offsets. P0 control rails override the stick's earlier safe-left positioning with `left:0` and `inset:auto`. These need explicit protection before claiming notch-safe operation.

A minimal native-only Story solution can size the entire `#story-app` to the safe rectangle, using separate left/right/top/bottom insets, so all child UI shares one coordinate system. The existing renderer uses `canvas.clientWidth/clientHeight`, which supports that change. This is a proposed correction, not a result of the captured run.

## Follow-up implementation, awaiting another capture

`runtime/native-layout.css` now adds native-only four-sided safe padding to the launcher and makes the entire Story app a safe rectangle. Its link is appended after existing web styles, including compact-height rules. The ordinary web source markup/styles remain byte-identical in the bundle after removing the two native entry tags. The four dojo modes retain their existing `#app` insets.

The Chromium fixture checks real DOM bounds with explicitly simulated left/right/bottom inset inputs (including either notch side), plus the unmodified web layout when the native class is absent. Those inputs are not real UIKit safe-area measurements. The changed layout still needs another actual Simulator screenshot; the earlier PNGs above show the defect before this change.
