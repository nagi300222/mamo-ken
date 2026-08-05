# Codex Cloud T02起動指示 — Core型・定数レイヤー

## Current baseline

- Repository: `nagi300222/mamo-ken`
- T01: merged
- T00: merged as PR #17
- T00.1 correction: merged as PR #18
- Current main head after T00.1: `f257ae49d554480846a402e48ecff1275a4a3b3b`
- Canonical docs: `docs/03_data_design.md v2.7`
- T02 status: GO

## Cloud task setup

Use repository `nagi300222/mamo-ken` in Codex Cloud.

```bash
git fetch origin main ops/codex-handoff-t00-t02
git switch main
git reset --hard origin/main

git show origin/ops/codex-handoff-t00-t02:codex_handoff/START_HERE_T00_T02.md
git show origin/ops/codex-handoff-t00-t02:codex_handoff/MODEL_ROUTING_POLICY.md
```

Apply Phase 2 only. Do not repeat T00.

## Branch / PR

- Branch: `feature/core-spec-v1`
- Base: latest `origin/main`
- PR: Draft
- Merge: prohibited

## T02 scope

Add a minimal, reviewable core contract and deterministic state inspection layer while preserving runtime behavior.

Required:

1. Core IDs and status labels
2. FighterPhase and BattleFlow contracts from T00 reports
3. MoveSpec and CharacterCombatSpec validation contracts
4. Current / provisional / legacy separation
5. Runtime constants remain single-source
6. Canonical battle snapshot
7. Stable serialization and versioned hash
8. Node tests including 10,000F+ deterministic fixture
9. P1/P2 swap fixture
10. Source/dist contract verification
11. Completion report `reports/T02_COMPLETION.md`
12. Fable5 rollup update

## Non-goals / prohibited changes

Do not change:

- BAL numbers
- attack/guard/roar behavior
- Gyuiin legacy reward behavior
- command recognition behavior
- CPU decisions
- online message schema
- server
- UI
- assets

Do not opportunistically fix T06 items.

## Model routing

- FAST: searches, extraction, repeated checks, log formatting
- CODE: contracts, validation, snapshot/hash, tests
- REASONING: architecture choice, determinism boundary, final PR review

If the client cannot switch models, continue safe mechanical work and record `MODEL_SWITCH_RECOMMENDED` before high-risk design work.

## Mandatory tests

```bash
node tools/audit_current_impl.mjs
npm run build:mobile
node tools/audit_current_impl.mjs
npm test
# or the explicit node:test command if package script is added under another name

git diff --check
git diff --stat -- prototype/mamoken_prototype_v01.html index.html dist/mamoken_mobile.html server assets
```

Also report:

- exact changed files
- numeric diff before/after
- runtime behavior diff
- online protocol diff
- 10,000F hash result
- P1/P2 swap result
- source/dist specVersion consistency
- preserved legacy differences
- blockers

## Failure fallback

If push or Draft PR creation fails, do not end with only a local commit. Export both:

- `mamoken_T02.patch`
- `mamoken_T02_fallback.zip`

Return them as downloadable task artifacts before ending.

## Stop condition

Stop with HOLD if any of the following becomes necessary:

- online protocol change
- server change
- battle processing order change
- BAL value change
- broad runtime rewrite
- unresolved deterministic divergence
- design reinterpretation not fixed by v2.7/T00 reports
