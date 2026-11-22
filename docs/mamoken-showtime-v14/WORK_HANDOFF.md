# Agent execution handoff — Claude + Codex actual work

**Current work addendum:** The user has supplied exact scenarios for **all nine ~10-second ultimates** (including victim hit reactions and distinctive camera choreography). Read [ULTIMATE_10S_DIRECTION.md](ULTIMATE_10S_DIRECTION.md) and immediately forward it to any already-running Claude Code and Codex sessions. Old 4–6 second guidance is superseded. This file does not constitute a direct message to those sessions.

This file is **ready-to-send task material**, not a claim that Claude/Codex have already started.

## Claude / Claude Code

Open `nagi300222/mamo-ken` on `docs/mamoken-v14-claude-codex-production`. Read root `CLAUDE.md`, the project's Notion Agent Operating Guide, and [Issue #177](https://github.com/nagi300222/mamo-ken/issues/177).

**Task:** Independently redesign all 27 special moves and 9 ultimate cinematic concepts, review actual existing GLB motion footage, then produce animation and camera assets (starting Moguzo/Godan/Chirka) as a real Draft PR. Do not stop at a design memo or a static storyboard. Coordinate the camera/clip manifest with [Codex Issue #178](https://github.com/nagi300222/mamo-ken/issues/178). Preserve original assets. Keep a precise status report.

## Codex

Open the same repository / branch. Read root `AGENTS.md`, [Issue #178](https://github.com/nagi300222/mamo-ken/issues/178), [Issue #177](https://github.com/nagi300222/mamo-ken/issues/177), and [CINEMATIC_CONTRACT.md](CINEMATIC_CONTRACT.md).

**Task:** Implement the data-driven 9-character cinematic engine (~10 seconds and individually choreographed Claude-directed multi-shot cameras plus scripted attacker/target animation), new special move loading, and robust hit-only trigger/freeze/KO/skip/restoration. Use the actual Claude asset deliverables. Begin with parser/tests while Claude is animating; don't mark movies as completed until content and real browser acceptance pass. Deliver separate Draft PR, not main.

## Optional one-message ChatGPT Work orchestration handoff

> マモ拳のGitHub制作正本 https://github.com/nagi300222/mamo-ken/issues/176 を読み、Claude用 https://github.com/nagi300222/mamo-ken/issues/177 とCodex用 https://github.com/nagi300222/mamo-ken/issues/178 の実作業をそれぞれ依頼してください。必要ならClaude WebまたはClaude Code、Codexを起動し、本人認証が必要な場合にだけ操作を求めてください。両者が編集できるGitHubリポジトリは nagi300222/mamo-ken、基準の設計ブランチは docs/mamoken-v14-claude-codex-production です。Claudeには36技の再設計と実際のアニメ・カメラ・動画成果物を、Codexにはその素材のゲーム統合とカットシーンエンジン・CIを担当させてください。Issueや仕様書の作成だけで完了扱いにせず、各AIの実際のセッションと成果PRを回収し、Notionのマモ拳Projectに「AI本人の実施」と「まだ未実施」を分けて記録してください。本人への小刻みな試遊依頼は不要。mainや既存Draftを自動マージしない。

Workの実行環境からClaude/Codexへ接続できない場合はその旨を正確に報告し、ログイン済みだと推測したり勝手に別AIで代行したりしない。

## Branches/quality gates

- Initial docs branch: `docs/mamoken-v14-claude-codex-production` (main unchanged).
- Claude production: create child branch e.g. `feat/mamoken-claude-new-motions-v14`; Codex technical: create separate child branch e.g. `feat/mamoken-codex-cinematic-v14`. Avoid concurrent edits of the same files without PR-based handoff.
- Representative quality gate: real before/after recordings and source assets for 3×(s1+s2+s3+ultimate), real 4–7-shot cinematic, Chrome/WebGL test; only then scale to all nine.
- Final human gate: stable, substantial playable build, not an early Mio placeholder/preview. Leave unresolved items marked explicitly.
