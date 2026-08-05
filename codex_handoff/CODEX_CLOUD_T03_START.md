# Codex Cloud T03 Start — checkpointed restart

## Purpose

Restart T03 safely from latest `origin/main` without modifying completed T01/T00/T00.1/T02 work.

## Required reads

Before implementation, read both:

1. `codex_handoff/CODEX_CLOUD_T03_BOOTSTRAP.md` on this branch
2. GitHub Issue #23: `T03 checkpoint: 入力・コマンドパーサ v1（未公開Codex成果）`

Issue #23 preserves the unpublished prior Codex result: intended files, APIs, test coverage, known hashes, prebuffer boundaries, P1/P2 behavior, and diff-0 scope.

Treat Issue #23 as a comparison checkpoint, not as permission to skip implementation or tests. Do not hard-code its hashes merely to satisfy fixtures. Equivalent implementation may only be accepted after the complete required suite passes.

## Clean start

- Start from latest `origin/main`.
- Do not continue PR #21 or any T02 branch.
- Create a new T03 work branch: `feature/command-parser-v1`.
- Create a new Draft PR for T03.
- Do not merge.

## Safety

Do not modify current runtime behavior, BAL, existing nine command moves, online protocol, server, UI, assets, or generated dist behavior.

Do not use Apply / local continuation as the delivery method. Deliver through a new GitHub Draft PR.

## Completion

Follow every requirement in `CODEX_CLOUD_T03_BOOTSTRAP.md`, update CI, and report the Draft PR URL plus all requested test evidence.
