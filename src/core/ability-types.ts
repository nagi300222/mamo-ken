export type AbilityHookId =
  | 'guts'
  | 'chase'
  | 'heavy_armor'
  | 'iron_wall'
  | 'feint'
  | 'pressure'
  | 'just'
  | 'overcharge';

export type GutsState = Readonly<{
  distinctMoveIds: readonly string[];
  commandReliefReady: boolean;
}>;

export type HeavyArmorState = Readonly<{
  hitsRemaining: 0 | 1;
}>;

export type HeavyArmorResolution = Readonly<{
  absorbed: boolean;
  starterScale: number;
  state: HeavyArmorState;
}>;

export type IronWallState = Readonly<{
  charges: 0 | 1;
  expiresFrame: number;
}>;

export type IronWallBonus = Readonly<{
  startupReductionF: number;
  guardDamageMul: number;
}>;

export type FeintState = Readonly<{
  usedInSequence: boolean;
}>;

export type FeintResolution = Readonly<{
  accepted: boolean;
  recoveryF: number;
  nextActionFrame: number;
  state: FeintState;
}>;

export type PressureResolution = Readonly<{
  canBranchToThrow: boolean;
  throwWhiffF: number;
  followupStarterScale: number;
  guaranteesThrow: false;
}>;

export type JustState = Readonly<{
  followupReady: boolean;
  expiresFrame: number;
}>;

export type AbilityGyuiinEffect = Readonly<{
  weightMul: 1;
  timingBonusF: 0;
  rewardDamageBonus: 0;
  rewardUltBonus: 0;
}>;
