# T10 Completion — UI契約

## Scope

- Branch: `feature/ui-contract-v1`
- Data/layout contract only; current HTML UI is not rewired.
- Runtime / BAL / online protocol / server / assets / dist behavior diff: 0.

## Contracts

- Eight roster slots: current Moguzo/Pisuke/Godan unlocked, five planned slots visibly locked or unknown.
- Five display axes are ATK / SPD / DEF / TEC / BRK and explicitly are not a TOTAL score.
- EASY / NORMAL / HARD selector contract.
- Back, Pause and move-list actions.
- Online disconnect request requires a confirmation screen.
- Direction and attack controls each expose color, shape, position and SE tokens; information is never color-only.
- Ult text is an optional UI overlay and is not baked into sprites.
- Deterministic portrait layouts provide separate roster and battle hit regions with minimum 40px targets.

## Tests

- 320×568, 360×640, 390×844 and 430×932 portrait layouts including safe areas.
- No hit-region overlap and all regions remain inside the safe viewport.
- Eight roster statuses and placeholders.
- Five independent display axes with no TOTAL field.
- Complete cue tokens and disconnect confirmation.
- Forbidden random, wall-clock, locale, DOM and timer APIs.

## Handoff

A later runtime UI integration PR may render this contract. T11 may attach current character move-list data and asset mappings without changing layout or unlock status.
