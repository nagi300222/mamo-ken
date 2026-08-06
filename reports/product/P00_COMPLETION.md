# P00 Completion Report — Product Source-of-Truth / Naming / Diff Governance v1

## Scope

- Added an isolated product-layer contract for non-art, non-gameplay work.
- Fixed stable P00–P11 phase IDs, owners, dependencies, deliverable IDs, and authority boundaries.
- Added stable setting IDs, save keys, error classes, and release channels.
- Added explicit work-status and decision-status transition contracts.
- Added pending/open preservation and FORMAL promotion validation.
- Added completion, scoped-diff, rollback, deterministic report, typecheck, test, and CI gates.

## Product source precedence

1. explicit current decision
2. versioned product contract
3. completion report
4. implementation and tests
5. roadmap or proposal

Lower-precedence material cannot silently overwrite a higher-precedence decision.

## Stable phase state

- Phase count: 12
- COMPLETE: `P00`
- PENDING: `P01`–`P11`
- Every phase has a unique owner.
- Every dependency references an earlier stable phase ID.
- No phase has combat, runtime, or online-protocol authority.

## Stable identifiers

- Setting IDs: 7
- Save keys: 3
- Error classes: 7
- Release channels: 4

Release channels remain:

```text
local
preview
staging
production
```

## Decision policy

- PENDING and OPEN decisions keep `value=null`.
- PENDING cannot jump directly to FORMAL.
- FORMAL requires a resolved non-UNKNOWN value and a source reference.
- FORMAL may be reopened only by an explicit transition to OPEN.

## Completion gate

A phase is complete only when:

- every registered deliverable is true
- every in-scope decision is FORMAL and valid
- tests pass
- scoped diff passes
- a complete rollback note exists

Synthetic pass and blocked cases are covered by tests.

## Scoped diff gate

Allowed P00 roots:

```text
design/product/**
src/product/**
test/product-*.test.mjs
reports/product/**
.github/workflows/product-contract.yml
package.json
tsconfig.product.json
```

Forbidden roots:

```text
prototype/**
dist/**
runtime/**
server/**
assets/**
src/core/**
design/combat/**
```

Lookalike paths such as `package.jsonx`, disabled workflow suffixes, and malformed test extensions are rejected.

## Rollback policy

- Trigger: completion-gate regression or scoped-diff violation
- Target: last green product-contract commit
- Preserved data: user save data, user settings, diagnostic evidence
- Verification: product-contract test plus affected-phase smoke tests

## Determinism and validation

- Product contract version: `mamoken-product-contract-v1`
- Deterministic contract hash: `a0575e60`
- Dedicated product typecheck passed.
- Product contract test passed.
- Dedicated scoped-diff gate passed.
- Existing 40-step Core/runtime/UI/mobile workflow passed.
- Product modules import only sibling product modules.
- No browser, storage, network, random, or timer APIs are used by the P00 contract.

## Authority boundary

P00 does not change or control:

- combat rules or balance
- input processing
- runtime authority
- online protocol
- server behavior
- prototype or mobile distribution
- character art or assets

## Next

- G01 may build BattleState V2 / MoveSpec V2 on the separately merged combat v0.2 boundary.
- P01 remains PENDING until QA foundation work is started in its own PR.
