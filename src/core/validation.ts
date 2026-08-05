import type { CharacterCombatSpec, CommandMoveSpec, CurrentCharacterId, CurrentMoveKey, Direction, MoveSpec } from './types.ts';

export type ValidationResult = Readonly<{ ok: true } | { ok: false; errors: readonly string[] }>;

function isFinitePositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function result(errors: string[]): ValidationResult {
  return errors.length === 0 ? { ok: true } : { ok: false, errors };
}

export function validateMoveSpec(name: CurrentMoveKey, spec: MoveSpec): ValidationResult {
  const errors: string[] = [];
  if (!isFinitePositiveNumber(spec.s)) errors.push(`${name}.s must be a positive finite number`);
  if (!isFinitePositiveNumber(spec.a)) errors.push(`${name}.a must be a positive finite number`);
  if (!isFinitePositiveNumber(spec.r)) errors.push(`${name}.r must be a positive finite number`);
  if (!isFinitePositiveNumber(spec.d)) errors.push(`${name}.d must be a positive finite number`);
  if (!isFiniteNumber(spec.y)) errors.push(`${name}.y must be a finite number`);
  if (!isFinitePositiveNumber(spec.w)) errors.push(`${name}.w must be a positive finite number`);
  if (name === 'low' && spec.down !== true) errors.push('low.down must stay true in CURRENT_IMPL');
  return result(errors);
}

function isDirection(value: unknown): value is Direction {
  return value === 'left' || value === 'down' || value === 'right';
}

export function validateCommandMoveSpec(characterId: CurrentCharacterId, move: CommandMoveSpec): ValidationResult {
  const errors: string[] = [];
  if (typeof move.name !== 'string' || move.name.length === 0) errors.push(`${characterId}.cmd.name must be non-empty`);
  if (!Array.isArray(move.seq) || move.seq.length === 0 || !move.seq.every(isDirection)) errors.push(`${characterId}.${move.name}.seq must contain directions`);
  if (!['high', 'mid', 'low', 'grab'].includes(move.trigger)) errors.push(`${characterId}.${move.name}.trigger is invalid`);
  if (!['atk', 'grab', 'stance'].includes(move.type)) errors.push(`${characterId}.${move.name}.type is invalid`);
  if (move.lv !== undefined && !['high', 'mid', 'low', 'crouch'].includes(move.lv)) errors.push(`${characterId}.${move.name}.lv is invalid`);
  if (move.type !== 'stance' && !isFinitePositiveNumber(move.s)) errors.push(`${characterId}.${move.name}.s must be a positive finite number`);
  if (move.type !== 'stance' && !isFinitePositiveNumber(move.d)) errors.push(`${characterId}.${move.name}.d must be a positive finite number`);
  return result(errors);
}

export function validateCharacterCombatSpec(character: CharacterCombatSpec): ValidationResult {
  const errors: string[] = [];
  if (!['moguzo', 'pisuke', 'godan'].includes(character.id)) errors.push('character.id must be a CURRENT_IMPL id');
  if (!isFinitePositiveNumber(character.dMul)) errors.push(`${character.id}.dMul must be positive`);
  if (!isFinitePositiveNumber(character.sMul)) errors.push(`${character.id}.sMul must be positive`);
  if (!isFiniteNumber(character.sOfs)) errors.push(`${character.id}.sOfs must be finite`);
  if (!isFinitePositiveNumber(character.gMax)) errors.push(`${character.id}.gMax must be positive`);
  return result(errors);
}

export function assertValid(resultToAssert: ValidationResult): void {
  if (!resultToAssert.ok) throw new Error(resultToAssert.errors.join('\n'));
}
