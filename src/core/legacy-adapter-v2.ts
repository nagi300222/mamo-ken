// G02 — read-only legacy adapter (shadow_only).
//
// Converts today's live legacy battle-frame snapshot (the same `B`/fighter shape G01's
// runtime-adapter.ts reads) into BattleState V2 (design/combat/contracts/MAMOKEN_BATTLE_STATE_AND_
// MOVESPEC_V2_v0.1.md). This module never imports the prototype, never writes back, and never
// switches runtime authority — it only reads a plain JS snapshot object and produces a frozen,
// independently re-validated BattleStateV2.
//
// Fail-closed: every field this adapter cannot losslessly derive from the legacy source is either
// (a) read strictly from the source and rejected if missing/invalid, (b) read from the caller-
// supplied LegacyAdapterV2Context for values the legacy snapshot itself never carries per-frame
// (max resource values, ability id — see legacy-adapter-v2-types.ts), or (c) a documented,
// non-fabricated structural constant for a V2-only dimension with no live analog at all (see
// reports/combat/G02_COMPLETION.md §5). Nothing is silently backfilled with 0 or an initial-state
// default for data the source was supposed to provide.
import { CURRENT_PHASE_REPORT, FULL_ROSTER_IDS } from './constants.ts';
import { hashBattleStateV2, validateBattleStateV2 } from './v2-validation/battle-state-v2-validation.ts';
import { COMBAT_CONTRACT_V2, type FighterControlStateV2, type PlayerIdV2, type PostureStateV2 } from './v2-types/combat-contract-v2.ts';
import {
  BATTLE_STATE_V2_AUTHORITY,
  BATTLE_STATE_V2_VERSION,
  type BattleStateV2,
  type DefenseStateV2,
  type FighterStateV2,
  type RosterCharacterIdV2,
} from './v2-types/battle-state-v2.ts';
import type { LegacyAdapterV2Context, LegacyAdapterV2FighterSeed, LegacyAdapterV2Issue } from './legacy-adapter-v2-types.ts';

export const LEGACY_ADAPTER_V2_VERSION = 'legacy-adapter-v2-g02' as const;

export const LEGACY_ADAPTER_V2_CONTRACT = {
  version: LEGACY_ADAPTER_V2_VERSION,
  source: 'prototype/mamoken_prototype_v01.html',
  direction: 'legacy-runtime-to-battle-state-v2',
  writeBack: false,
  liveRuntimeAuthority: false,
  battleFields: ['f', 'round', 'wins', 'timer', 'flow', 'hitstop', 'clash', 'p'] as const,
  fighterFields: ['c.id', 'phase', 'dodgeType', 'atkLv', 'hp', 'guard', 's', 'ult', 'focus', 'combo', 'pf', 'clinchF', 'cmdArmorUsed', 'cmdMove', 'landedHit'] as const,
  externalContext: ['rngState', 'aiRngState', 'fighterSeeds'] as const,
} as const;

// G02 audit finding: tools/audit_current_impl.mjs's fighterPhases scan also picks up B.clash.phase
// assignments ('in'/'select'/'reveal') because its regex does not distinguish `f.phase=` from
// `c.phase=` on the clash minigame object. Confirmed via direct grep of the live source: 'in',
// 'select', and 'reveal' are ONLY ever assigned to B.clash.phase, never to a fighter's own `phase`
// field. G01's CURRENT_FIGHTER_PHASE_SET (constants.ts, via reports/current_impl_phases.json)
// inherits this over-broad set; this adapter intentionally uses the narrower, verified 21-value set
// below instead of reusing that report, and rejects the 3 spurious values as "unknown phase" (they
// can never legitimately occur on a real fighter object). See G02_COMPLETION.md §Findings.
const LEGACY_FIGHTER_PHASES_V2 = Object.freeze([
  'attack', 'blockstun', 'clash', 'cmdAtk', 'cmdStance', 'dizzy', 'dodge', 'down', 'grab',
  'grabbed', 'grabHit', 'grabrec', 'guard', 'hitstun', 'idle', 'ko', 'mikiriRec', 'roar',
  'ultAtk', 'wake', 'win',
]);
const LEGACY_FIGHTER_PHASE_SET = new Set(LEGACY_FIGHTER_PHASES_V2);
const LEGACY_BATTLE_FLOW_SET = new Set<string>(CURRENT_PHASE_REPORT.battleFlows.map(({ value }) => value));
const ROSTER_CHARACTER_ID_SET = new Set<string>(FULL_ROSTER_IDS);
const CLASH_MINIGAME_PHASE_SET = new Set(['in', 'select', 'reveal']);
const DODGE_POSTURE: Readonly<Record<string, PostureStateV2>> = Object.freeze({ crouch: 'CROUCH', sway: 'SWAY_DEEP', lunge: 'LUNGE' });

type PhaseMappingV2 = Readonly<{ controlState: FighterControlStateV2; postureState: PostureStateV2 }>;

// Coarse phase -> (controlState, postureState) table. `dodge` is handled separately because its
// posture depends on `dodgeType`; `attack` is overridden to CROUCH posture when atkLv==='crouch'
// (startCrouchAtk is the only source of a crouching attack; every other attack level is standing).
const BASE_PHASE_MAP: Readonly<Record<string, PhaseMappingV2>> = Object.freeze({
  idle: { controlState: 'actionable', postureState: 'NORMAL' },
  guard: { controlState: 'guarding', postureState: 'NORMAL' },
  hitstun: { controlState: 'hitstun', postureState: 'NORMAL' },
  blockstun: { controlState: 'blockstun', postureState: 'NORMAL' },
  dizzy: { controlState: 'guard_break', postureState: 'NORMAL' },
  attack: { controlState: 'committed', postureState: 'NORMAL' },
  cmdAtk: { controlState: 'committed', postureState: 'NORMAL' },
  cmdStance: { controlState: 'committed', postureState: 'NORMAL' },
  roar: { controlState: 'committed', postureState: 'NORMAL' },
  ultAtk: { controlState: 'cinematic', postureState: 'NORMAL' },
  clash: { controlState: 'committed', postureState: 'NORMAL' },
  grab: { controlState: 'throw_startup', postureState: 'NORMAL' },
  grabHit: { controlState: 'throw_startup', postureState: 'NORMAL' },
  grabrec: { controlState: 'throw_startup', postureState: 'NORMAL' },
  grabbed: { controlState: 'thrown', postureState: 'NORMAL' },
  mikiriRec: { controlState: 'mikiri', postureState: 'NORMAL' },
  down: { controlState: 'down', postureState: 'DOWN' },
  wake: { controlState: 'wake', postureState: 'DOWN' },
  ko: { controlState: 'ko', postureState: 'DOWN' },
  win: { controlState: 'win', postureState: 'NORMAL' },
});

export class LegacyAdapterV2Error extends TypeError {
  readonly issues: readonly LegacyAdapterV2Issue[];
  constructor(issues: readonly LegacyAdapterV2Issue[]) {
    super(issues.map((issue) => `${issue.path}: expected ${issue.expected}; received ${issue.actual}`).join('\n'));
    this.name = 'LegacyAdapterV2Error';
    this.issues = issues;
  }
}

function describe(value: unknown): string {
  if (typeof value === 'number' && Number.isNaN(value)) return 'NaN';
  if (typeof value === 'number' && !Number.isFinite(value)) return String(value);
  if (value === null) return 'null';
  if (Array.isArray(value)) return `array(length=${value.length})`;
  if (typeof value === 'string') return JSON.stringify(value);
  return typeof value;
}

function fail(path: string, expected: string, actual: unknown): never {
  throw new LegacyAdapterV2Error([{ path, expected, actual: describe(actual) }]);
}

function readRecord(value: unknown, path: string): Readonly<Record<string, unknown>> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) fail(path, 'object', value);
  return value as Readonly<Record<string, unknown>>;
}

function readRequired(record: Readonly<Record<string, unknown>>, key: string, path: string): unknown {
  if (!Object.hasOwn(record, key)) fail(`${path}.${key}`, 'present field', undefined);
  return record[key];
}

function readNonNegativeNumber(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) fail(path, 'finite non-negative number', value);
  return value;
}

function readNonNegativeInteger(value: unknown, path: string): number {
  const n = readNonNegativeNumber(value, path);
  if (!Number.isInteger(n)) fail(path, 'non-negative integer', value);
  return n;
}

function readUint32(value: unknown, path: string): number {
  const n = readNonNegativeInteger(value, path);
  if (n > 0xffff_ffff) fail(path, 'unsigned 32-bit integer', value);
  return n;
}

function readBoolean(value: unknown, path: string): boolean {
  if (typeof value !== 'boolean') fail(path, 'boolean', value);
  return value;
}

function readText(value: unknown, path: string): string {
  if (typeof value !== 'string' || value.length === 0) fail(path, 'non-empty string', value);
  return value;
}

function readRosterCharacterId(value: unknown, path: string): RosterCharacterIdV2 {
  if (typeof value !== 'string' || !ROSTER_CHARACTER_ID_SET.has(value)) fail(path, `roster character ID (${FULL_ROSTER_IDS.join(' | ')})`, value);
  return value as RosterCharacterIdV2;
}

function readLegacyPhase(value: unknown, path: string): string {
  if (typeof value !== 'string' || !LEGACY_FIGHTER_PHASE_SET.has(value)) fail(path, 'unknown phase: audited legacy fighter phase', value);
  return value;
}

function readLegacyFlow(value: unknown, path: string): string {
  if (typeof value !== 'string' || !LEGACY_BATTLE_FLOW_SET.has(value)) fail(path, 'audited legacy battle flow', value);
  return value;
}

function readFighterSeed(context: Readonly<Record<string, unknown>>, playerId: PlayerIdV2): LegacyAdapterV2FighterSeed {
  const path = `context.fighterSeeds.${playerId}`;
  const seeds = readRecord(readRequired(context, 'fighterSeeds', 'context'), 'context.fighterSeeds');
  const seed = readRecord(readRequired(seeds, String(playerId), 'context.fighterSeeds'), path);
  return {
    maxHp: readNonNegativeInteger(readRequired(seed, 'maxHp', path), `${path}.maxHp`),
    maxGuard: readNonNegativeInteger(readRequired(seed, 'maxGuard', path), `${path}.maxGuard`),
    maxSGauge: readNonNegativeInteger(readRequired(seed, 'maxSGauge', path), `${path}.maxSGauge`),
    maxFocusGauge: readNonNegativeInteger(readRequired(seed, 'maxFocusGauge', path), `${path}.maxFocusGauge`),
    maxUltimateStock: readNonNegativeInteger(readRequired(seed, 'maxUltimateStock', path), `${path}.maxUltimateStock`),
    abilityId: readText(readRequired(seed, 'abilityId', path), `${path}.abilityId`),
  };
}

type LegacyFighterFields = Readonly<{
  characterId: RosterCharacterIdV2;
  phase: string;
  dodgeType: string | null;
  atkLv: string | null;
  hp: number;
  guard: number;
  s: number;
  ult: number;
  focus: number;
  combo: number;
  pf: number;
  clinchF: number;
  cmdArmorUsed: boolean;
  landedHit: boolean;
  moveName: string | null;
  moveArmorStartF: number | null;
  moveArmorEndF: number | null;
}>;

function readLegacyFighter(value: unknown, index: 0 | 1): LegacyFighterFields {
  const path = `battle.p[${index}]`;
  const fighter = readRecord(value, path);
  const character = readRecord(readRequired(fighter, 'c', path), `${path}.c`);
  const phase = readLegacyPhase(readRequired(fighter, 'phase', path), `${path}.phase`);

  let dodgeType: string | null = null;
  if (phase === 'dodge') {
    const raw = readRequired(fighter, 'dodgeType', path);
    if (typeof raw !== 'string' || !Object.hasOwn(DODGE_POSTURE, raw)) fail(`${path}.dodgeType`, 'unknown posture: dodgeType in (crouch | sway | lunge)', raw);
    dodgeType = raw;
  }

  let atkLv: string | null = null;
  if (phase === 'attack') {
    const raw = Object.hasOwn(fighter, 'atkLv') ? fighter.atkLv : undefined;
    atkLv = typeof raw === 'string' ? raw : null;
  }

  let moveName: string | null = null;
  let moveArmorStartF: number | null = null;
  let moveArmorEndF: number | null = null;
  if (Object.hasOwn(fighter, 'cmdMove') && fighter.cmdMove !== null && fighter.cmdMove !== undefined) {
    const move = readRecord(fighter.cmdMove, `${path}.cmdMove`);
    moveName = readText(readRequired(move, 'name', `${path}.cmdMove`), `${path}.cmdMove.name`);
    if (Object.hasOwn(move, 'armorStartF') && move.armorStartF !== null && move.armorStartF !== undefined) {
      moveArmorStartF = readNonNegativeInteger(move.armorStartF, `${path}.cmdMove.armorStartF`);
      moveArmorEndF = readNonNegativeInteger(readRequired(move, 'armorEndF', `${path}.cmdMove`), `${path}.cmdMove.armorEndF`);
    }
  }

  return {
    characterId: readRosterCharacterId(readRequired(character, 'id', `${path}.c`), `${path}.c.id`),
    phase,
    dodgeType,
    atkLv,
    // hp/guard/s/focus must be integers here, not just non-negative numbers: BattleStateV2's
    // validator (validateFighter) requires every resources.* value to satisfy Number.isInteger.
    // The live legacy runtime routinely produces fractional guard/focus/hp (e.g. guard regen,
    // chip damage, and dMul-scaled hits all leave fractional remainders — see G01's own test
    // fixture, which uses guard:93.4/focus:18.5 as valid V1 values). This adapter does not round
    // fractional resource values to fit V2's integer contract, since rounding would silently
    // discard real precision the source actually reported; it rejects instead. See
    // G02_COMPLETION.md §Findings for the owner-facing writeup of this schema mismatch.
    hp: readNonNegativeInteger(readRequired(fighter, 'hp', path), `${path}.hp`),
    guard: readNonNegativeInteger(readRequired(fighter, 'guard', path), `${path}.guard`),
    s: readNonNegativeInteger(readRequired(fighter, 's', path), `${path}.s`),
    ult: readNonNegativeInteger(readRequired(fighter, 'ult', path), `${path}.ult`),
    focus: readNonNegativeInteger(readRequired(fighter, 'focus', path), `${path}.focus`),
    combo: readNonNegativeInteger(readRequired(fighter, 'combo', path), `${path}.combo`),
    pf: readNonNegativeInteger(readRequired(fighter, 'pf', path), `${path}.pf`),
    clinchF: readNonNegativeInteger(readRequired(fighter, 'clinchF', path), `${path}.clinchF`),
    cmdArmorUsed: readBoolean(readRequired(fighter, 'cmdArmorUsed', path), `${path}.cmdArmorUsed`),
    landedHit: readBoolean(readRequired(fighter, 'landedHit', path), `${path}.landedHit`),
    moveName,
    moveArmorStartF,
    moveArmorEndF,
  };
}

// flow: direct 1:1 map for 6 of the 7 legacy flow values. 'clash' fans out to gyuiin_intro/play/
// result via B.clash.phase (in/select/reveal), the only sub-state the legacy source distinguishes.
function mapFlow(flow: string, clashPhase: string | null): BattleStateV2['flow'] {
  switch (flow) {
    case 'intro': return 'round_intro';
    case 'fight': return 'fight';
    case 'ko': return 'ko_freeze';
    case 'roundEnd': return 'round_result';
    case 'matchEnd': return 'match_result';
    case 'ultCine': return 'ultimate_cinematic';
    case 'clash':
      if (clashPhase === 'in') return 'gyuiin_intro';
      if (clashPhase === 'select') return 'gyuiin_play';
      if (clashPhase === 'reveal') return 'gyuiin_result';
      fail('battle.clash.phase', 'unknown phase: clash minigame phase in (in | select | reveal)', clashPhase);
      break;
    default:
      fail('battle.flow', 'audited legacy battle flow', flow);
  }
  throw new Error('unreachable');
}

// freeze: `flow` and `freeze.kind` are orthogonal (design doc §2). The legacy source only ever
// pauses everything via B.hitstop; which FreezeKindV2 that pause "is" depends on which flow it
// occurs during (mirrors freezePolicy's uniform gating behavior across HITSTOP/ULTIMATE_FREEZE/
// GYUIIN_INTRO/KO_FREEZE — see G02_COMPLETION.md §Findings for why this is a defensible, non-
// fabricated reading rather than a guess).
function mapFreeze(hitstop: number, flow: string, clashPhase: string | null): BattleStateV2['freeze'] {
  if (hitstop <= 0) return { kind: 'NONE', remainingF: 0, sourceId: null };
  const kind = flow === 'ultCine' ? 'ULTIMATE_FREEZE' : flow === 'ko' ? 'KO_FREEZE' : (flow === 'clash' && clashPhase === 'in') ? 'GYUIIN_INTRO' : 'HITSTOP';
  return { kind, remainingF: hitstop, sourceId: `legacy:flow=${flow}` };
}

function mapFighter(playerId: PlayerIdV2, legacy: LegacyFighterFields, seed: LegacyAdapterV2FighterSeed, clinchEngaged: boolean): FighterStateV2 {
  const mapping = legacy.phase === 'dodge'
    ? { controlState: 'dodging' as const, postureState: DODGE_POSTURE[legacy.dodgeType as string] }
    : BASE_PHASE_MAP[legacy.phase];
  if (!mapping) fail(`battle.p[${playerId}].phase`, 'unknown phase: no V2 posture/control mapping', legacy.phase);
  const postureState: PostureStateV2 = clinchEngaged ? 'CLINCH' : (legacy.phase === 'attack' && legacy.atkLv === 'crouch' ? 'CROUCH' : mapping.postureState);

  const isIdle = legacy.phase === 'idle';
  // G02 does not resolve fine-grained telegraph/startup/active/recovery sub-phases — that is G03's
  // explicit scope ("frame/advantage shadow", design doc §15). Every non-idle legacy phase maps to
  // the coarse 'active' ActionPhase: something is genuinely underway, but this adapter does not yet
  // claim which contact sub-window it is in.
  const action = isIdle
    ? { actionId: null, moveId: null, phase: 'idle' as const, startedCombatFrame: null, actionFrame: 0, currentContactIndex: 0, cancelConsumed: false }
    : {
      actionId: legacy.phase,
      moveId: legacy.moveName,
      phase: 'active' as const,
      startedCombatFrame: null as number | null, // filled in by caller (needs battle.f); see mapFighter call site
      actionFrame: legacy.pf,
      currentContactIndex: 0,
      cancelConsumed: legacy.landedHit,
    };

  // defense: only dodgeWindowF and armor are derivable from a resting snapshot. mikiriWindowF and
  // lastResult have no live per-frame analog (MIKIRI's active window is an input-timing check, not
  // a stored counter; the last contact result is resolved and discarded inside hitApply(), never
  // persisted on the fighter) — both are documented gaps pending G03+, not fabricated data.
  const dodgeJudgeF = 10; // BAL.DODGE.judgeF (BAL-R1.1): active evasion window is pf in [2, judgeF]
  const dodgeWindowF = legacy.phase === 'dodge' ? Math.max(0, dodgeJudgeF - legacy.pf) : 0;
  const roarArmorActive = legacy.phase === 'roar' && legacy.pf >= 4 && legacy.pf <= 15; // BAL.ROAR.armorStartF/armorEndF
  const cmdArmorActive = legacy.phase === 'cmdAtk' && legacy.moveArmorStartF !== null && !legacy.cmdArmorUsed
    && legacy.pf >= legacy.moveArmorStartF && legacy.pf <= (legacy.moveArmorEndF as number);
  const defense: DefenseStateV2 = {
    guardHeld: legacy.phase === 'guard',
    mikiriWindowF: 0,
    dodgeWindowF,
    armorHitsRemaining: (roarArmorActive || cmdArmorActive) ? 1 : 0,
    lastResult: 'NONE',
  };

  const bulletCharge = legacy.characterId === 'bullet'
    ? fail(`battle.p[${playerId}]`, 'missing resource: bulletCharge (legacy source has no BulletCharge gauge)', undefined)
    : null;

  return {
    playerId,
    characterId: legacy.characterId,
    controlState: mapping.controlState,
    postureState,
    action,
    defense,
    ability: { abilityId: seed.abilityId, phase: 'idle', values: Object.freeze({}) },
    resources: {
      hp: legacy.hp, maxHp: seed.maxHp,
      guard: legacy.guard, maxGuard: seed.maxGuard,
      sGauge: legacy.s, maxSGauge: seed.maxSGauge,
      focusGauge: legacy.focus, maxFocusGauge: seed.maxFocusGauge,
      ultimateStock: legacy.ult, maxUltimateStock: seed.maxUltimateStock,
    },
    combo: { count: legacy.combo },
    timers: { hitstunF: 0, blockstunF: 0, guardBreakF: 0, downF: 0, wakeF: 0, invulnerabilityF: 0 },
    inputHold: { activeHolds: Object.freeze({}), completedHolds: Object.freeze([]) },
    bulletCharge,
  };
}

export function adaptLegacyBattleToV2(source: unknown, context: LegacyAdapterV2Context): BattleStateV2 {
  const battle = readRecord(source, 'battle');
  const contextRecord = readRecord(context, 'context');

  const rngState = readUint32(readRequired(contextRecord, 'rngState', 'context'), 'context.rngState');
  const aiRngState = readUint32(readRequired(contextRecord, 'aiRngState', 'context'), 'context.aiRngState');
  const seeds: Record<PlayerIdV2, LegacyAdapterV2FighterSeed> = { 0: readFighterSeed(contextRecord, 0), 1: readFighterSeed(contextRecord, 1) };

  const frame = readNonNegativeInteger(readRequired(battle, 'f', 'battle'), 'battle.f');
  const round = readNonNegativeInteger(readRequired(battle, 'round', 'battle'), 'battle.round');
  if (round < 1) fail('battle.round', 'positive integer (round index)', round);
  const winsRaw = readRequired(battle, 'wins', 'battle');
  if (!Array.isArray(winsRaw) || winsRaw.length !== 2) fail('battle.wins', 'two-element array', winsRaw);
  const wins: Readonly<Record<PlayerIdV2, number>> = { 0: readNonNegativeInteger(winsRaw[0], 'battle.wins[0]'), 1: readNonNegativeInteger(winsRaw[1], 'battle.wins[1]') };
  const timer = readNonNegativeInteger(readRequired(battle, 'timer', 'battle'), 'battle.timer');
  const hitstop = readNonNegativeInteger(readRequired(battle, 'hitstop', 'battle'), 'battle.hitstop');
  const flowRaw = readLegacyFlow(readRequired(battle, 'flow', 'battle'), 'battle.flow');

  let clashPhase: string | null = null;
  if (flowRaw === 'clash') {
    const clash = readRecord(readRequired(battle, 'clash', 'battle'), 'battle.clash');
    const rawPhase = readRequired(clash, 'phase', 'battle.clash');
    if (typeof rawPhase !== 'string' || !CLASH_MINIGAME_PHASE_SET.has(rawPhase)) fail('battle.clash.phase', 'unknown phase: clash minigame phase in (in | select | reveal)', rawPhase);
    clashPhase = rawPhase;
  }

  const fightersRaw = readRequired(battle, 'p', 'battle');
  if (!Array.isArray(fightersRaw) || fightersRaw.length !== 2) fail('battle.p', 'two-fighter array', fightersRaw);
  const legacyFighters: readonly [LegacyFighterFields, LegacyFighterFields] = [readLegacyFighter(fightersRaw[0], 0), readLegacyFighter(fightersRaw[1], 1)];

  const clinchEngaged = legacyFighters[0].clinchF > 0 || legacyFighters[1].clinchF > 0;
  const clinchRemainingF = clinchEngaged ? Math.max(legacyFighters[0].clinchF, legacyFighters[1].clinchF) : 0;

  const mappedFighters = [
    mapFighter(0, legacyFighters[0], seeds[0], clinchEngaged),
    mapFighter(1, legacyFighters[1], seeds[1], clinchEngaged),
  ] as const;
  // startedCombatFrame: legacy has no separate combat-frame field, so this adapter uses B.f itself
  // as the combat clock (see clocks mapping below) — startedCombatFrame = frame - pf is therefore a
  // real derived value (the frame at which pf was last 0), not a placeholder.
  const fighters: Readonly<Record<PlayerIdV2, FighterStateV2>> = {
    0: mappedFighters[0].action.phase === 'idle' ? mappedFighters[0] : { ...mappedFighters[0], action: { ...mappedFighters[0].action, startedCombatFrame: frame - legacyFighters[0].pf } },
    1: mappedFighters[1].action.phase === 'idle' ? mappedFighters[1] : { ...mappedFighters[1], action: { ...mappedFighters[1].action, startedCombatFrame: frame - legacyFighters[1].pf } },
  };

  const state: BattleStateV2 = Object.freeze({
    version: BATTLE_STATE_V2_VERSION,
    combatContractVersion: COMBAT_CONTRACT_V2.version,
    authority: BATTLE_STATE_V2_AUTHORITY,
    liveRuntimeAuthority: false,
    flow: mapFlow(flowRaw, clashPhase),
    clocks: Object.freeze({ simulationFrame: frame, combatFrame: frame, fighterActionFrame: Object.freeze({ 0: legacyFighters[0].pf, 1: legacyFighters[1].pf }) }),
    freeze: Object.freeze(mapFreeze(hitstop, flowRaw, clashPhase)),
    seed: rngState,
    aiSeed: aiRngState,
    fighters: Object.freeze({ 0: Object.freeze(fighters[0]), 1: Object.freeze(fighters[1]) }),
    spatial: Object.freeze({ engagement: clinchEngaged ? 'CLINCH' : 'NORMAL', clinchRemainingF, overextendedPlayer: null, sideSwap: false, lastPositionBatchId: 0 }),
    round: Object.freeze({ roundIndex: round, timerCombatF: timer, wins: Object.freeze(wins), timeoutEnabled: true }),
    lastBatchId: 0,
  });

  const validation = validateBattleStateV2(state);
  if (!validation.ok) throw new LegacyAdapterV2Error(validation.errors.map((message) => ({ path: 'state', expected: 'valid BattleStateV2 (see design/combat/contracts v0.1)', actual: message })));
  return state;
}

export function hashLegacyAdaptedBattleV2(source: unknown, context: LegacyAdapterV2Context): string {
  return hashBattleStateV2(adaptLegacyBattleToV2(source, context));
}
