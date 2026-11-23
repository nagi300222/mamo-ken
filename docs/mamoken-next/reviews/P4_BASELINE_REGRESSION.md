# PR222 baseline independent regression receipt

Source: `1391c49493eca193c3a49a22140e5b1c3d2c6417`. This is functional verification, not a UI quality score.

- Protected original assets: 77 unchanged.
- Local Node: combat 216/216; P2/custom/story/shared UI 53/53; native 14/14; review validator 6/6.
- Pages build and native asset bundle build pass; native 289 files / 130,704,820 bytes; no remote application server.
- Existing CI run 45164225654 re-read through GitHub API: same SHA, all 10 WebGL suite jobs and review framework success. iOS run 45164225785 re-read: same SHA, success.
- Existing exported evidence: all 29 files in the retained manifest independently matched bytes and SHA256. The 36.92-second video is encoded at 852×392 / 25 fps for a requested 852×393 viewport; this is not measured gameplay or phone FPS.
- Local Chromium recapture could not launch: sandbox socket permission error before application loaded. See `baseline-ui.log`. No user-session browser or permission bypass attempted. New visual evidence should be captured by CI or permitted browser surface.
- Physical iPhone, real human tasks, owner P4 decision: untested.

## Commands

```sh
node tools/verify-protected-assets.mjs
npm --prefix exp/fable-3d/dojo test
node --test exp/fable-3d/custom/p2/*.test.mjs exp/fable-3d/custom/v16/*.test.mjs exp/fable-3d/story/*.test.mjs exp/fable-3d/shared-ui/*.test.mjs
npm --prefix exp/fable-3d/dojo run build:pages
npm --prefix native run build
npm --prefix native test
node --test tools/qa/validate-p4-review.test.mjs
CHROMIUM_PATH=/usr/bin/chromium MAMOKEN_UI_VIDEO=1 MAMOKEN_EVIDENCE=<output> node exp/fable-3d/dojo/acceptance/p4-ui-browser.mjs
```

The native exact dependencies were reused from an existing local worktree via an untracked node_modules symlink. The source files were not edited.
