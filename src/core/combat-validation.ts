import type { CombatCharacterSpec, CombatMoveSpec, ComboRuleProfile } from './combat-types.ts';

export type CombatValidationResult = Readonly<{ ok: true } | { ok: false; errors: readonly string[] }>;

function result(errors: string[]): CombatValidationResult {
  return errors.length === 0 ? { ok: true } : { ok: false, errors };
}
function finite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}
function nonNegative(value: unknown): value is number {
  return finite(value) && value >= 0;
}
function positive(value: unknown): value is number {
  return finite(value) && value > 0;
}
function positiveScale(value: unknown): value is number {
  return positive(value) && value <= 1;
}
function nonNegativeInteger(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) >= 0;
}
function validateStringArray(path: string, values: readonly string[], errors: string[]): void {
  if (!Array.isArray(values) || values.some((value) => typeof value !== 'string' || value.length === 0)) {
    errors.push(`${path} must contain non-empty strings`);
    return;
  }
  if (new Set(values).size !== values.length) errors.push(`${path} must not contain duplicates`);
}

export function validateCombatMoveSpec(spec: CombatMoveSpec): CombatValidationResult {
  const errors: string[] = [];
  if (typeof spec.id !== 'string' || spec.id.length === 0) errors.push('move.id must be non-empty');
  if (typeof spec.nameJa !== 'string' || spec.nameJa.length === 0) errors.push(`${spec.id}.nameJa must be non-empty`);
  if (!['high', 'mid', 'low', 'grab'].includes(spec.level)) errors.push(`${spec.id}.level is invalid`);
  if (!positive(spec.weight)) errors.push(`${spec.id}.weight must be positive`);
  if (!nonNegativeInteger(spec.telegraphF)) errors.push(`${spec.id}.telegraphF must be a non-negative integer`);
  if (!positive(spec.startupF) || !Number.isInteger(spec.startupF)) errors.push(`${spec.id}.startupF must be a positive integer`);
  if (finite(spec.telegraphF) && finite(spec.startupF) && spec.telegraphF > spec.startupF) errors.push(`${spec.id}.telegraphF must stay inside startupF`);
  if (!positive(spec.activeF) || !Number.isInteger(spec.activeF)) errors.push(`${spec.id}.activeF must be a positive integer`);
  if (!nonNegativeInteger(spec.recoveryF)) errors.push(`${spec.id}.recoveryF must be a non-negative integer`);
  for (const [field, value] of [
    ['damage', spec.damage],
    ['chipDamage', spec.chipDamage],
    ['guardDamage', spec.guardDamage],
    ['whiffExtraRecoveryF', spec.whiffExtraRecoveryF],
    ['roarGainOnHit', spec.roarGainOnHit],
    ['roarGainOnBlock', spec.roarGainOnBlock],
  ] as const) {
    if (!nonNegative(value)) errors.push(`${spec.id}.${field} must be a non-negative finite number`);
  }
  if (!finite(spec.hitAdvF)) errors.push(`${spec.id}.hitAdvF must be finite`);
  if (!finite(spec.blockAdvF)) errors.push(`${spec.id}.blockAdvF must be finite`);
  if (![0, 1, 2, 3].includes(spec.reachClass)) errors.push(`${spec.id}.reachClass is invalid`);
  if (![0, 1, 2].includes(spec.hitKnockbackClass)) errors.push(`${spec.id}.hitKnockbackClass is invalid`);
  if (![0, 1, 2].includes(spec.blockKnockbackClass)) errors.push(`${spec.id}.blockKnockbackClass is invalid`);
  if (!positiveScale(spec.starterScale)) errors.push(`${spec.id}.starterScale must be in (0, 1]`);
  if (!positiveScale(spec.comboProration)) errors.push(`${spec.id}.comboProration must be in (0, 1]`);
  if (!positive(spec.comboWeight)) errors.push(`${spec.id}.comboWeight must be positive`);
  if (typeof spec.repeatGroup !== 'string' || spec.repeatGroup.length === 0) errors.push(`${spec.id}.repeatGroup must be non-empty`);
  if (!Number.isInteger(spec.repeatLimit) || spec.repeatLimit < 1) errors.push(`${spec.id}.repeatLimit must be a positive integer`);
  validateStringArray(`${spec.id}.cancelOnHit`, spec.cancelOnHit, errors);
  validateStringArray(`${spec.id}.cancelOnBlock`, spec.cancelOnBlock, errors);
  validateStringArray(`${spec.id}.cancelOnWhiff`, spec.cancelOnWhiff, errors);
  validateStringArray(`${spec.id}.tags`, spec.tags, errors);
  if (!nonNegativeInteger(spec.armorHits)) errors.push(`${spec.id}.armorHits must be a non-negative integer`);
  if (spec.armorHits > 0) {
    if (!positive(spec.armorStartF) || !Number.isInteger(spec.armorStartF)) errors.push(`${spec.id}.armorStartF is required for armor`);
    if (!positive(spec.armorEndF) || !Number.isInteger(spec.armorEndF)) errors.push(`${spec.id}.armorEndF is required for armor`);
    if (finite(spec.armorStartF) && finite(spec.armorEndF) && spec.armorStartF > spec.armorEndF) errors.push(`${spec.id}.armorStartF must not exceed armorEndF`);
  }
  return result(errors);
}

export function validateCombatCharacterSpec(spec: CombatCharacterSpec): CombatValidationResult {
  const errors: string[] = [];
  for (const [field, value] of [
    ['maxHp', spec.maxHp],
    ['guardMax', spec.guardMax],
    ['guardRegenPerSec', spec.guardRegenPerSec],
    ['damageTakenMul', spec.damageTakenMul],
    ['guardDamageTakenMul', spec.guardDamageTakenMul],
    ['chipDamageTakenMul', spec.chipDamageTakenMul],
    ['knockbackTakenMul', spec.knockbackTakenMul],
    ['comboCapacity', spec.comboCapacity],
  ] as const) {
    if (!positive(value)) errors.push(`character.${field} must be positive`);
  }
  if (!nonNegativeInteger(spec.guardRegenDelayF)) errors.push('character.guardRegenDelayF must be a non-negative integer');
  for (const [field, value] of [
    ['normalCancelLimit', spec.normalCancelLimit],
    ['specialCancelLimit', spec.specialCancelLimit],
    ['stepCancelLimit', spec.stepCancelLimit],
  ] as const) {
    if (!nonNegativeInteger(value)) errors.push(`character.${field} must be a non-negative integer`);
  }
  if (![1, 2, 3, 4, 5].includes(spec.commandDifficulty)) errors.push('character.commandDifficulty is invalid');
  if (!['standard', 'rush', 'power', 'defense', 'tricky', 'grappler', 'counter', 'charge'].includes(spec.archetype)) errors.push('character.archetype is invalid');
  if (typeof spec.abilityHook !== 'string' || spec.abilityHook.length === 0) errors.push('character.abilityHook must be non-empty');
  return result(errors);
}

export function validateComboRuleProfile(profile: ComboRuleProfile): CombatValidationResult {
  const errors: string[] = [];
  if (typeof profile.id !== 'string' || profile.id.length === 0) errors.push('comboProfile.id must be non-empty');
  if (!['current_impl', 'provisional'].includes(profile.status)) errors.push(`${profile.id}.status is invalid`);
  if (!Number.isInteger(profile.maxHits) || profile.maxHits < 1) errors.push(`${profile.id}.maxHits must be a positive integer`);
  if (!positive(profile.capacity)) errors.push(`${profile.id}.capacity must be positive`);
  for (const [field, values] of [
    ['hitScales', profile.hitScales],
    ['repeatDamageScales', profile.repeatDamageScales],
    ['repeatHitstunScales', profile.repeatHitstunScales],
    ['repeatRoarScales', profile.repeatRoarScales],
  ] as const) {
    if (!Array.isArray(values) || values.length === 0 || values.some((value) => !positiveScale(value))) errors.push(`${profile.id}.${field} must contain scales in (0, 1]`);
  }
  if (profile.counterHitScales && (profile.counterHitScales.length === 0 || profile.counterHitScales.some((value) => !positiveScale(value)))) errors.push(`${profile.id}.counterHitScales is invalid`);
  if (!nonNegative(profile.minimumScale) || profile.minimumScale > 1) errors.push(`${profile.id}.minimumScale must be in [0, 1]`);
  if (!positive(profile.counterStarterMul)) errors.push(`${profile.id}.counterStarterMul must be positive`);
  if (profile.cancelWindowF !== null && !nonNegativeInteger(profile.cancelWindowF)) errors.push(`${profile.id}.cancelWindowF must be null or a non-negative integer`);
  if (profile.heightLimits) {
    for (const level of ['high', 'mid', 'low'] as const) {
      if (!Number.isInteger(profile.heightLimits[level]) || profile.heightLimits[level] < 1) errors.push(`${profile.id}.heightLimits.${level} must be a positive integer`);
    }
  }
  if (profile.downFollowup) {
    if (!Number.isInteger(profile.downFollowup.limit) || profile.downFollowup.limit < 1) errors.push(`${profile.id}.downFollowup.limit must be positive`);
    if (!positiveScale(profile.downFollowup.damageMul)) errors.push(`${profile.id}.downFollowup.damageMul must be in (0, 1]`);
  }
  return result(errors);
}

export function assertCombatValid(validation: CombatValidationResult): void {
  if (!validation.ok) throw new Error(validation.errors.join('\n'));
}
