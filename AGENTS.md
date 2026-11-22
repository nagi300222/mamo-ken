# Codex instructions — MamoKen Showtime v1.0 production

Read [docs/mamoken-showtime-v14/PRODUCTION_BRIEF.md](docs/mamoken-showtime-v14/PRODUCTION_BRIEF.md) and [docs/mamoken-showtime-v14/CINEMATIC_CONTRACT.md](docs/mamoken-showtime-v14/CINEMATIC_CONTRACT.md) **before editing code**.

Follow [Codex execution Issue #178](https://github.com/nagi300222/mamo-ken/issues/178). Coordinate animation and camera assets with [Claude Issue #177](https://github.com/nagi300222/mamo-ken/issues/177). [Parent #176](https://github.com/nagi300222/mamo-ken/issues/176) tracks the project.

**Current user intent (2026-11-22):** The user does NOT want more small, provisional visual-effect demos from Mio, or requests to try each tiny change. Claude and Codex should actually build a redesigned set of 27 special moves and nine hit-confirmed cinematic ultimates. The current v0.13 three-beat zoom is only scaffolding, not accepted finished art.

**Implementation contract:**
- Keep gameplay controls (v0.7, smartphone landscape), baseline balance and existing GLBs stable unless a separate, explicit gameplay redesign proposal is approved.
- Improve the ACTION and silhouettes, not merely colored particles; accept Claude-authored clips, per-character cameras and opponent reactions.
- The cinematic only begins after actual unguarded `ultimate_hit`. Existing damage and KO are applied once; freeze Battle/time/CPU during playback; restore canvas/camera, controls and audio on finish, skip, blur, KO and rematch.
- No generic shared three-shot camera for all nine. Every ultimate needs its own camera choreography and fighter animation.
- Work in a separate branch and Draft PR. Do not merge main or alter upstream Drafts. Provide test logs, WebGL evidence, the precise assets imported and unresolved problems.
- Do not claim any Codex run has started just because an Issue or this instruction file exists.

Unless the user specifically asks again, avoid posting another early **“とりあえず試遊版”**. Deliver substantial, verifiable completed work first.
