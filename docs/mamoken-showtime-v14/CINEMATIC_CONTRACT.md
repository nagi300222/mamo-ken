# MamoKen Showtime v1.0｜Claude ↔ Codex asset / cinematic integration contract

**This is a proposed interface to coordinate two genuine producers, not a claim that the movie assets exist.** Claude may improve the interface with a documented migration plan; Codex should not ship fake replacement media.

## 1. Versioning and identities

- Source branch: `feat/mamoken-super-hit-cinematic-v13` (parent Draft PR #175, HEAD at initial handoff `3ecaf0d3dc9af4754b31d91d3235deb3808dfedb`).
- Key every move by `characterId` and `moveId` = `s1|s2|s3|ultimate`. Keep the existing character IDs: `moguzo`, `pisuke`, `godan`, `hakuma`, `chirka`, `takimaru`, `yomikage`, `bullet`, `dark_moguzo`.
- New source assets should be versioned, e.g. `exp/fable-3d/cinematic/v14/<id>/`; original `exp/fable-3d/chars/<id>/<id>.glb` stays untouched until a revised asset is separately accepted. Include source hash, version, authoring script, export parameters and a way back.
- A move-animation change that alters contact windows/hitbox needs explicit game design review. A shot move during a frozen cinematic must **never** affect Battle collision/hp.

## 2. Spec schema draft

```json
{
  "schemaVersion": 1,
  "characterId": "chirka",
  "moveId": "ultimate",
  "displayName": "百面本命打ち",
  "trigger": "confirmed_unblocked_ultimate_hit",
  "runtime": "threejs",
  "durationSeconds": 5.1,
  "animationSources": {
    "attacker": {"glb": "cin_chirka_v14.glb", "clip": "cin_chirka_finish"},
    "target": {"clip": "cin_hit_followthrough"}
  },
  "shots": [
    {
      "id": "01-reveal",
      "start": 0.0,
      "end": 0.6,
      "camera": {
        "rig": "target-reaction",
        "position": {"x": 0.0, "y": 0.75, "z": 2.1},
        "lookAt": "target.head",
        "projection": "perspective",
        "fov": 43,
        "rollDeg": 0,
        "easing": "easeOutCubic"
      },
      "actorPose": "foe-notices-a-clone",
      "fxCues": [],
      "sfxCues": []
    }
  ]
}
```

**Example only**, not an actual finished storyboard. Production assets need **4–7 individually designed shots** per ultimate, not a shared template with labels changed.

The final contract must define timeline semantics (seconds independent from frozen Battle frames), camera coordinate and target-bone lookup/fallback, spatial continuity, safe-area cropping for iPhone landscape, animation state/pose targets of both actors, flash/shake accessibility, cue tracks, and cleanup. A renderer-specific implementation may use orthographic or perspective, but should not cut to a view that clips the head, hides the intended contact, or loses the target. Documentary examples are not enough.

## 3. Event / freeze contract

- Battle is the truth for `ultimate_hit`; it fires after a real unguarded positive-damage super hit. **No movie on pressing the button, missing, guarding, countering or absorbing.**
- Upon event, snapshot the two fighters for cinema. Pause gameplay `battle.tick`, CPU, timer, real input accumulation, gameplay hitstop and projectile motion. Do not subtract extra damage from movie hits. Reflect any eventual KO **after** the movie.
- Use separate cutscene presentation/mixer state, independent from battle movement. Finish/skip/blur/abort/KO returns the same canvas, original match camera, HUD, audio state and stable interactive input. Do not leave skinned ghosts, materials or extra renderers.
- Three.js animation playback may continue during the cutscene, but keep its movie clocks separate from Battle frame count. Synchronize camera and two actor rigs from the same movie timeline.
- OS reduced-motion and the user FX OFF setting must shorten or simplify camera movement and effects, without losing movie state correctness.
- No second full-screen WebGLRenderer should be created if reuse of the existing canvas is feasible; document actual memory and FPS measures.

## 4. Capability tests

- Run gameplay simulation tests for whiff/block/guard break/counter/armor/airborne/KO/double KO/timeout and 9 characters.
- Verify every manifest shot duration, clip existence and camera target bone. Fail CI on missing required assets rather than silently substituting a generic three-beat zoom.
- Render actual portrait/mobile 852×393 and wider landscape views using WebGL; capture both special (match camera) and cinematic (full-screen) evidence. Node green is necessary but not sufficient.
- Preserve existing v0.7 six buttons, v0.5 balance while revising visuals. Suggest any mechanical redesign separately with reason/impact; do not silently alter `balance.js`.
- State what is actually validated, and which 9 movies / 27 specials remain incomplete.

## 5. Deliverables and independent ownership

- Claude: per-move visual storyboard, GLB/Blender/Fable animation sources, render/motion files, shot manifest, sample video, clip name list and rig compatibility.
- Codex: manifest parser and types, asset loader, shot director and animation sync, safe combat transition, robust cleanup, Node/Chromium/CI, Web build and screenshots.
- Integration begins with Moguzo/Godan/Chirka and expands to all nine. Claude's design should drive the feel; Codex must not independently invent simple ring effects as a substitute.

## 6. Three.js runtime mapping (implementation branch)

- The runtime entry point is `exp/fable-3d/cinematic/v14/manifest.json` with `{"schemaVersion":1,"characters":{"chirka":"chirka/manifest.json"}}`. Each registered character file is `{"moves":[...]}` with the four per-move objects described above. Keep source Blender files and videos in GitHub. The Pages build copies the index, registered manifests and referenced GLBs.
- `animationSources.attacker.glb` and `animationSources.target.glb` are optional, sibling GLBs. Omit `glb` to select a clip on the corresponding fighter's original model. Custom clips bind to the original model by GLB node name. If using a single target clip across the roster, export tracks for common bones and preserve character proportions.
- For specials, optional `contactSeconds` is the authored clip's contact time. The player aligns that point with the existing startup boundary and fits the remaining clip to the existing active and recovery frames. Set `cueTrack` in ascending clip seconds.
- The cinematic uses a separate stage in meters. The attacker starts at `(0,0,0)` facing +X and the target at `(.65,0,0)` facing −X. Camera positions and vector `lookAt` are stage coordinates. A named `lookAt` can be `attacker`, `target`, `midpoint`, or a fighter and exact bone name such as `target.head`.
- Shots cut at their start. For a move inside a shot, specify optional `endPosition`, `endLookAt`, `endRollDeg` and one of `endFov` or `endOrthoWidth`. Perspective uses `fov` in vertical degrees and orthographic uses `orthoWidth` in meters of visible stage width. Easing values are `linear`, `easeInCubic`, `easeOutCubic` and `easeInOutCubic`.
- Cinematic `cueTrack` times are absolute movie seconds. A visual cue can have an `actor` (`attacker` or `target`) and a `bone`. Supported effect keys are `hit`, `block`, `roar`, `clinch`, `special`, `ultimate`, `shard`, `slash` and `reticle`. Existing sound keys are `tap`, `hit`, `block`, `special`, `ultimate`, `roar`, `clinch`, `counter` and `ko`. The first special and movie deliveries can propose additional authored effects with the assets that require them.
