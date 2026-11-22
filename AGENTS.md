# Codex instructions — MamoKen Showtime v1.0 production

**最新のユーザー追加指示（2026-11-22）：** [奥義ムービー約10秒・9体別演出の確定指示](docs/mamoken-showtime-v14/ULTIMATE_10S_DIRECTION.md)を最優先で参照。旧『4〜6秒／4〜7ショット』指定は上書き。攻撃側・被弾側を含む約10秒の独立カメラ演出を制作する。

Read [docs/mamoken-showtime-v14/PRODUCTION_BRIEF.md](docs/mamoken-showtime-v14/PRODUCTION_BRIEF.md) and [docs/mamoken-showtime-v14/CINEMATIC_CONTRACT.md](docs/mamoken-showtime-v14/CINEMATIC_CONTRACT.md) **before editing code**.

Follow [Codex execution Issue #178](https://github.com/nagi300222/mamo-ken/issues/178). Coordinate animation and camera assets with [Claude Issue #177](https://github.com/nagi300222/mamo-ken/issues/177). [Parent #176](https://github.com/nagi300222/mamo-ken/issues/176) tracks the project.

**Current user intent (2026-11-22):** The user does NOT want more small, provisional visual-effect demos from Mio, or requests to try each tiny change. Claude and Codex should actually build a redesigned set of 27 special moves and nine hit-confirmed cinematic ultimates. The current v0.13 three-beat zoom is only scaffolding, not accepted finished art.

**Implementation contract:**
- Keep gameplay controls (v0.7, smartphone landscape), baseline balance and existing GLBs stable unless a separate, explicit gameplay redesign proposal is approved.
- Improve the ACTION and silhouettes, not merely colored particles; accept Claude-authored clips, per-character cameras and opponent reactions.
- The cinematic only begins after actual unguarded `ultimate_hit`. Existing damage and KO are applied once; freeze Battle/time/CPU during playback; restore canvas/camera, controls and audio on finish, skip, blur, KO and rematch.
- No generic shared three-shot camera for all nine. Every ultimate needs its own **approximately 10-second** camera choreography plus victim's reaction animation; see [the nine user-approved movie scenarios](docs/mamoken-showtime-v14/ULTIMATE_10S_DIRECTION.md).
- Work in a separate branch and Draft PR. Do not merge main or alter upstream Drafts. Provide test logs, WebGL evidence, the precise assets imported and unresolved problems.
- Do not claim any Codex run has started just because an Issue or this instruction file exists.

Unless the user specifically asks again, avoid posting another early **“とりあえず試遊版”**. Deliver substantial, verifiable completed work first.


## 2026-11-22 v15 new task (after v14 device-ready)

The user has tested and really likes the v14 version, but wants stronger individual character identity, distinct ground/air control, startup/recovery and fighting-game combos (weak→weak, weak→strong and normal→special). **P0 orientation-locked landscape view first**: [Issue #186](https://github.com/nagi300222/mamo-ken/issues/186), [P0 PR #187](https://github.com/nagi300222/mamo-ken/pull/187). Read [docs/mamoken-v15/COMBAT_REDESIGN.md](docs/mamoken-v15/COMBAT_REDESIGN.md) and [Issue #189](https://github.com/nagi300222/mamo-ken/issues/189). Make *actual* Codex gameplay changes and tests in a separate Draft PR, not just a proposal. Do not overwrite the original v14 good cinematics or silently merge. Treat listed air speeds/combos as provisional tuning, not adopted fact.
