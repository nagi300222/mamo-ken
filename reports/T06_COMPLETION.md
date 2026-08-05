# T06 Completion — ゲージ・咆哮・ギュイーン

## Scope

- Branch: `feature/gauge-gyuiin-v1`
- Runtime integration: none
- Runtime / existing BAL / online protocol / server / UI / assets / dist behavior diff: 0

## Added contracts

- Separate S Gauge, Focus, Ult stock and charge-only Charge state.
- Current S/Focus gain values read from the audited BAL snapshot.
- Charge exists only for the charge archetype and cannot increase through time or Gyuiin.
- Roar consumes S; only an unblocked, non-armor-absorbed clean hit grants Ult +1.
- Gyuiin weights are 50% / 25% / 25% and rewards are exactly damage 120 and Ult +1.
- Gyuiin S, Focus, Charge, streak bonus and guaranteed follow-up stun are all zero.
- Post-contact flow order follows the v2.7 tick contract: KO, Ult activation, Gyuiin, fight.

## Tests

- Identical Gyuiin reward for all current, planned and boss character IDs.
- Three minigame outcomes from a deterministic separate PRNG sequence.
- Clean-hit / blocked / armor-absorbed Roar cases.
- Charge ownership, gain-source and MAX consumption boundaries.
- KO / stock3 / Gyuiin same-frame flow priority.
- Independent 10,000-draw replay equality and changed-seed divergence.
- Forbidden random, wall-clock, locale, DOM and timer APIs.

## Legacy boundary

The existing HTML runtime still contains legacy streak, S gain and loser-stun behavior. T06 defines the canonical Core contract without silently rewiring runtime or online protocol; runtime migration remains a separate high-risk integration step.
