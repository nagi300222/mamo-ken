# T05 Completion — 防御・ジャストステップ・ステップキャンセル

## Scope

- Branch: `feature/step-defense-v1`
- Base: latest `main` after T04
- Runtime integration: none
- Runtime / BAL / online protocol / server / UI / assets / dist behavior diff: 0

## Added contracts

- Current 22F dodge profile sourced from the audited BAL snapshot.
- High / mid / low versus crouch / sway / step 3×3 relation table.
- Provisional just-step window at active center 6F ±2F for sway and step only.
- Just-step reward: return -4F, Counter Ready 22F, one step-cancel token, no damage multiplier.
- Hit-only, move-tagged step cancel. Standard limit 1; rush candidate limit 2.
- Provisional guard-break short-return hook: 36F, at most two follow-up hits, no full combo guarantee.
- Delivery-delay replay helper with stable delivered-frame and order sorting.

## Tests

- All nine attack-height / dodge combinations.
- Just-step 3/4/8/9F boundaries and crouch exclusion.
- Counter Ready 18F / 22F boundaries.
- Whiff and block step cancel rejection.
- Token, move-tag, standard-limit and rush-two-limit checks.
- Independent 10,000-event replay equality and changed-delay divergence.
- Forbidden random, wall-clock, locale, DOM and timer APIs.

## Handoff

T06 may consume the defense success result, but Gyuiin, Ult and Charge rewards remain outside this module. T07 ability hooks may add style-specific reactions without changing the shared dodge triangle or Gyuiin fairness.
