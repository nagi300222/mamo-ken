import type { AbilityHookId } from './ability-types.ts';
import type { ArchetypeId, CurrentCharacterId, CurrentLevel, Direction } from './types.ts';
import type { PoseId } from './sprite-types.ts';

export type RosterDataStatus = 'current_impl' | 'provisional';
export type CommandTier = 'beginner' | 'intermediate' | 'advanced';

export type RosterCommandMove = Readonly<{
  id: string;
  slot: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  status: RosterDataStatus;
  nameJa: string;
  sequence: readonly Direction[];
  trigger: CurrentLevel | 'grab';
  type: 'atk' | 'grab' | 'stance';
  level: CurrentLevel | null;
  tier: CommandTier;
  role: string;
  estimatedDamage: number;
  tags: readonly string[];
}>;

export type CharacterSpecialData = Readonly<{
  id: string;
  nameJa: string;
  status: 'provisional';
  abilityHook: AbilityHookId;
}>;

export type RecommendedComboData = Readonly<{
  id: string;
  labelJa: string;
  moveIds: readonly string[];
  condition: 'normal' | 'conditional';
  estimatedDamage: number;
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
