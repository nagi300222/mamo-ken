import type { AbilityHookId } from './ability-types.ts';
import type { ArchetypeId, CurrentCharacterId, CurrentLevel, Direction } from './types.ts';
import type { PoseId } from './sprite-types.ts';

export type RosterDataStatus = 'current_impl' | 'design_confirmed';
export type CommandTier = 'beginner' | 'standard' | 'advanced';
export type RosterMoveAttribute = 'HIGH' | 'MID' | 'LOW' | 'GRAB';
export type RosterFrameDataStatus = 'current_audited' | 'bal_undecided';

export type RosterCommandMove = Readonly<{
  id: string;
  slot: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  status: RosterDataStatus;
  nameJa: string;
  sequence: readonly Direction[];
  trigger: CurrentLevel | 'grab';
  type: 'atk' | 'grab' | 'stance';
  level: CurrentLevel | null;
  attribute: RosterMoveAttribute;
  reach: 0 | 1 | 2 | 3;
  tier: CommandTier;
  roleJa: string;
  conditionsJa: readonly string[];
  balanceConstraints: readonly string[];
  frameDataStatus: RosterFrameDataStatus;
  estimatedDamage: number | null;
  tags: readonly string[];
}>;

export type CharacterSpecialData = Readonly<{
  id: string;
  nameJa: string;
  status: 'confirmed';
  abilityHook: AbilityHookId;
}>;

export type RecommendedComboData = Readonly<{
  id: string;
  category: 'beginner' | 'basic' | 'practical' | 'advanced' | 'max';
  labelJa: string;
  status: 'unverified_move_spec';
  moveIds: readonly string[];
  condition: 'undecided';
  estimatedDamage: null;
}>;

export type CharacterAssetMapping = Readonly<{
  status: 'current_impl';
  portraitRatio: number;
  spriteHeight: number;
  poseMap: Readonly<Record<PoseId, string>>;
  commandPoseMap: Readonly<Record<1 | 2 | 3, 'cmd1' | 'cmd2' | 'cmd3'>>;
}>;

export type CharacterBalanceAudit = Readonly<{
  maxHp: number;
  guardMax: number;
  damageMul: number;
  startupOffsetF: number;
  sGainMul: number;
  currentCommandCount: 3;
  plannedCommandCount: 7;
}>;

export type CoreRosterCharacter = Readonly<{
  id: CurrentCharacterId;
  displayName: string;
  archetype: Extract<ArchetypeId, 'standard' | 'rush' | 'power'>;
  commandDifficulty: 1 | 2;
  commandMoves: readonly RosterCommandMove[];
  special: CharacterSpecialData;
  recommendedCombos: readonly RecommendedComboData[];
  personaId: Extract<ArchetypeId, 'standard' | 'rush' | 'power'>;
  assets: CharacterAssetMapping;
  balanceAudit: CharacterBalanceAudit;
}>;
