// G02: read-only legacy adapter (shadow_only) — external context types.
//
// Mirrors the precedent set by RuntimeAdapterContext (runtime-adapter-types.ts): values that are
// genuinely absent from a single legacy battle-frame snapshot, but are required by BattleState V2,
// must be supplied by the adapter's caller rather than guessed or defaulted by the adapter itself.
//
// - rngState / aiRngState: same meaning as G01's RuntimeAdapterContext. The live prototype has a
//   single seeded `rng` and no separate AI RNG stream at all; callers that only have one seed must
//   supply the same value for both fields rather than have this adapter invent a second one.
// - fighterSeeds: per-character maximum resource values (maxHp/maxGuard/maxSGauge/maxFocusGauge/
//   maxUltimateStock) and abilityId. The live runtime never stores these on the mutable fighter
//   object either (only the *current* value, e.g. `f.hp`, is stored; the max is looked up once from
//   a character table at battle start and discarded). This adapter cannot re-derive them from
//   `BAL_R1_CHARS` because that table is not mirrored into `reports/current_impl_constants.json` /
//   `src/core/constants.ts` (see G02_COMPLETION.md §Findings). Callers must supply the real values.
import type { PlayerIdV2 } from './v2-types/combat-contract-v2.ts';

export type LegacyAdapterV2FighterSeed = Readonly<{
  maxHp: number;
  maxGuard: number;
  maxSGauge: number;
  maxFocusGauge: number;
  maxUltimateStock: number;
  abilityId: string;
}>;

export type LegacyAdapterV2Context = Readonly<{
  rngState: number;
  aiRngState: number;
  fighterSeeds: Readonly<Record<PlayerIdV2, LegacyAdapterV2FighterSeed>>;
}>;

export type LegacyAdapterV2Issue = Readonly<{ path: string; expected: string; actual: string }>;
