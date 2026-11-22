# Claude / ヨル — MamoKen actual animation + cinematic production

**最新のユーザー追加指示（2026-11-22）：** [奥義ムービー約10秒・9体別演出の確定指示](docs/mamoken-showtime-v14/ULTIMATE_10S_DIRECTION.md)を最優先で参照。旧『4〜6秒／4〜7ショット』指定は上書き。攻撃側・被弾側を含む約10秒の独立カメラ演出を制作する。

Start with [GitHub Issue #177](https://github.com/nagi300222/mamo-ken/issues/177) and [production brief](docs/mamoken-showtime-v14/PRODUCTION_BRIEF.md). Read the existing [Notion Agent Operating Guide v0.0.6](https://app.notion.com/p/40f0163e26ff81c9ad34da72f03faa64) and [Notion MamoKen project](https://app.notion.com/p/3de0163e26ff8174bf7ce96f8b96100e) when connected.

**ナギの最新の要望：** 今の27必殺技に映えないものが多く、技そのものと9奥義の見せ方を再設計したい。奥義は**ヒット後だけ**本格ムービーへ。映像は拡大/パンだけではなく、動く相手・フィニッシュポーズ・約10秒のキャラ専用複数ショットが必要。ミオの小さな試遊版を繰り返し作る工程はもう不要。

- **Make actual assets**, not just feedback, pretty screenshots or a design memo. Inspect the original 9 GLBs and `*_motions.json` clips, then deliver edited animation source, export process, camera motion/shots, before/after recordings and a Draft PR.
- Audit **all 27 specials and 9 ultimates**, propose a full redesign catalog, then produce a first high-quality batch: **Moguzo / Godan / Chirka** 3 specials and 1 ultimate each. Continue remaining six characters after the initial production milestone.
- No move should be distinguished only by hue/scale; distinguish stance, timing, silhouette, displacement, attack limb and contact moment. Film from the actual landscape match view for specials.
- For hit-confirmed cinematics, design **different** camera and opponent choreography for every character, not a single generic three-beat zoom.
- Preserve original art, geometry/materials and skeletons. Do not silently replace the accepted GLB. Put new assets in versioned paths; record clip names, authoring/editable source and export recipe.
- Agree a structured camera/animation handoff with Codex using [CINEMATIC_CONTRACT.md](docs/mamoken-showtime-v14/CINEMATIC_CONTRACT.md).
- Report what you actually created and verified. Never say “all 9 are finished” unless source assets, movie footage, and integration evidence are present.

This file prepares Claude's workspace. **Its presence does not mean Claude has run**; the agent must be launched in Claude/Claude Code or a supported orchestration workflow.


## 2026-11-22 v15 separate animation task

The user reports that the full v14 playable game feels very good, but weak/strong and character-specific move animations are too similar. See [docs/mamoken-v15/COMBAT_REDESIGN.md](docs/mamoken-v15/COMBAT_REDESIGN.md) and [Issue #188](https://github.com/nagi300222/mamo-ken/issues/188). Create actual unique GLB action/pose differences across the nine fighters and provide contact timings, editable source and short before/after footage. Coordinate with Codex's normal-attack chain-cancel rules. Do not change the user-approved nine ~10s ultimate movies by accident. P0 landscape lock [PR #187](https://github.com/nagi300222/mamo-ken/pull/187) must be preserved.
