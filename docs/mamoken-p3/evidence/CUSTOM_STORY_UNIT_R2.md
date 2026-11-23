# Custom / Story unit regression after r2 selection

Base: `b5373b0`, with the integration checkout's local reviewed v17r2 normal and special selectors temporarily copied for the r2 run. This test-only change does not install or approve those selectors.

Command:

```sh
node --test exp/fable-3d/custom/v16/*.test.mjs exp/fable-3d/story/*.test.mjs exp/fable-3d/shared-ui/*.test.mjs
```

| Selection | Result | Approximate local duration |
| --- | --- | --- |
| Existing v15 / original special defaults | 32 passed, 0 failed | 11 seconds |
| Local reviewed v17r2 normals / specials | 32 passed, 0 failed | 12 seconds |

The 81 visual-body / fighting-style combinations now load the real modular GLBs and selected animation packs through the vendored GLTFLoader. The factory measures skin and morph vertices at the union of the body's and style's actual active phases. All 486 normal rows must retain the measured trajectory, chosen style's startup/active/recovery, body identity, and every required style frame. Under v17, all 72 foreign-style combinations also explicitly reject an unmeasured fallback before accepting these measurements.

Custom-versus-custom fixtures supply both fighters' independently measured hurt bounds. The missing-style-frame rejection removes a real measured point; the special validator's synthetic special row uses real measured normals as its foreign-style prerequisite. The historical v15 signed tail fixture remains explicitly based on the original v15 recording.

The Node helper decodes actual GLB bones, morphs and skin weights. Image decoding is stubbed and restored after loading. The v15 pack is generated in memory from the unchanged source GLB when unit CI runs before the Pages build. No assets, performance columns, runtime guards, Story implementation or approval files are changed. These results do not establish WebGL rendering or iPhone performance.
