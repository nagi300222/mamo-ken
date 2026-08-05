# T09 Completion — CPU・決定論

## Scope

- Branch: `feature/cpu-persona-v1`
- Pure CPU decision layer only; runtime AI is not rewired.
- Runtime / BAL / online protocol / server / UI / assets / dist behavior diff: 0.

## Contracts

- Public observation allowlist includes only visible fighter state and last public action.
- Raw input, direction history, command buffer, future action and pointer data are never copied into CPU observations.
- Observations become usable only after difficulty-specific perception delay.
- EASY / NORMAL / HARD define reaction delay, cadence, Mikiri, dodge and command-rate caps.
- Eight personas define preferences without changing shared combat or Gyuiin rules.
- CPU uses an `aiSeed` stream separate from battle state seed.
- Boss overrides are separate phase records with public-action weight deltas and one-time rule IDs; they do not read hidden inputs.
- Every accepted decision records frame, source observation frame, action, before/after seed, persona and difficulty.

## Tests

- Hidden fields are discarded by the observation sanitizer.
- Same seed and public observations produce identical action/log sequences; changed AI seed diverges.
- All 28 unordered style pairings run 1,000 deterministic synthetic bouts each.
- P1/P2 swap exchanges win counts exactly.
- Gyuiin draw sequence remains identical across all personas.
- Forbidden random, wall-clock, locale, DOM and timer APIs are absent.

## Handoff

T11 may attach persona IDs and public preferences to the existing three characters. Runtime AI migration and real-match 1,000-bout balancing remain separate integration/BAL work.
