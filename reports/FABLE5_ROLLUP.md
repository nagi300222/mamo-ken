# Fable5 Rollup — T00〜T11

## PRs and merge state

| Task | PR | SHA / state | Purpose |
|---|---:|---|---|
| T00 | #17 | merged `5c566d1452b611c0942420c81c954e7bc741858d` | Current implementation audit and generated reports. |
| T00.1 | #18 | merged `f257ae49d554480846a402e48ecff1275a4a3b3b` | Correct source/dist audit comparison. |
| T01 | #16 | merged `6f707d171da9dbbcfec1e3ba1bd08d333d480500` | Canonical data design v2.7. |
| T02 | #21 | merged `66b13bcbeb5bd53a41d63e8236cd53b1a16ca48c` | Core types, constants, validation, stable hash and determinism. |
| T03 | #25 | merged `090c7ffe2f7bad3e88db342e83e801fffe43a0df` | Normalized input history and deterministic command parser. |
| T04 | #26 | merged `acb8a021d456bf1f17e843b546b1071203b55a33` | MoveSpec migration and combo contracts. |
| T05 | #27 | merged `b3a326b2eb8436eeb315095d0495b800b3cb60fc` | Defense triangle, just step and step-cancel contracts. |
| T06 | #28 | merged `74cca88d9d4d2fadf37bc6f8880648a1b4d3e0e8` | Gauge separation, Roar clean hit and fair Gyuiin. |
| T07 | #29 | merged `4430a99ac098890cc32a2ce81b010520148e6c3c` | Eight isolated ability hooks. |
| T08 | #30 | merged `72b5bdfb809636b650f5ad3dac83985706117a03` | Deterministic sprite-processing contract. |
| T09 | #31 | merged `8fad1f19a0d3725dcd1dc220c45a05e3c07a9f26` | Public-observation CPU, personas and AI determinism. |
| T10 | #32 | merged `5103c18557addbbc6fba516452349d3831e19c54` | Eight-slot roster and portrait UI contract. |
| T11 | #33 | merge candidate on `feature/roster-core3-v1` | Rebuilt current-three roster data. |

Superseded T02 drafts #19 and #20 were closed without merge. Issue #23 preserved the unpublished first T03 attempt and was closed after PR #25 merged.

## Verification commands

- `npm ci`
- `npm run check:core`
- `npm run check:command`
- `npm run check:combat`
- `npm run check:defense`
- `npm run check:gauge`
- `npm run check:ability`
- `npm run check:sprite`
- `npm run check:cpu`
- `npm run check:ui`
- `npm run check:roster`
- `node tools/audit_current_impl.mjs`
- `npm run build:mobile`
- second audit after build
- `git diff --check`
- scoped diff check for runtime HTML, index, generated dist, server and assets

## Core judgments

### T02–T04

- Current constants and existing commands are sourced from T00 reports rather than copied into a second BAL.
- Stable serialization rejects ambiguous values and excludes `lastHash` from its own hash target.
- T03 current compatibility remains direction history 24F and command prebuffer 12F.
- T04 current compatibility remains max 3Hit, 14F cancel window, `[1.0, 0.9, 0.8]` scale and one 0.5 down follow-up.
- Capacity, repeat decay, height limits and new cancel routes remain provisional.

### T05–T07

- Current dodge is 22F with active frames 1–10 and the fixed high/mid/low triangle.
- Provisional just step is sway/step center ±2F, return -4F, Counter Ready 22F and one tagged hit-only cancel token.
- S, Focus, Ult and Charge are separate. Charge exists only for the charge archetype and never grows through time or Gyuiin.
- Canonical Gyuiin is exactly damage 120 + Ult 1; S, Focus, Charge, streak and follow-up stun are zero for every character and ability.
- Eight abilities are isolated hooks and cannot change Gyuiin.

### T08–T10

- Sprite processing removes only exterior-connected white, preserves enclosed interior white, requires 24 poses and keeps per-character overrides outside base data.
- D-02 S6 is `crouch / sway / lunge / crouch_atk`; down and KO remain horizontal.
- CPU receives only public observations after configured perception delay, uses a separate AI PRNG and logs accepted decisions.
- All 28 style pairings pass 1,000 deterministic synthetic bouts and P1/P2 swap checks.
- UI contract provides eight visible roster slots, five independent display axes, non-color-only input cues, safe portrait hit regions and online disconnect confirmation.

### T11

- Existing command slots 1–3 are generated from `CURRENT_CONTRACT.bal.CMD.moves` and remain unchanged.
- Each current character has seven command slots, one provisional special, five recommended combos, a matching Persona, current BAL audit and canonical-to-current asset mapping.
- New slots 4–7 and specials remain provisional data and are not enabled in the legacy runtime.

## Safety boundary

Through T11, the legacy runtime HTML, existing BAL values, existing nine command moves, online protocol, server, UI rendering, source assets and generated dist behavior remain unchanged. The new files are pure Core contracts, deterministic evaluators, validators, reports and tests.

Runtime migration, activation of provisional moves/values, actual sprite conversion and online state/wire integration remain separate explicit work with long-run desync and gameplay regression gates.
