import type { ArchetypeId, CharacterId } from './types.ts';

export type GyuiinKind = 'jyanken' | 'renda' | 'hayauchi';
export type GaugeGainSource = 'attack_hit' | 'attack_block' | 'whiff' | 'guard_success' | 'damage_taken';
export type ChargeGainSource = 'attack_hit' | 'guard_success' | 'just_step' | 'active_success' | 'time' | 'gyuiin';

export type GaugeState = Readonly<{
  s: number;
  focus: number;
  ult: number;
  charge: number | null;
}>;

export type GyuiinRule = Readonly<{
  damage: number;
  ultStock: number;
  sGauge: 0;
  focus: 0;
  charge: 0;
  streakBonus: 0;
  guaranteedFollowupStunF: 0;
  weights: Readonly<Record<GyuiinKind, number>>;
}>;

export type GyuiinParticipant = Readonly<{
  characterId: CharacterId;
  archetype: ArchetypeId;
  hp: number;
  gauges: GaugeState;
}>;

export type GyuiinRewardResult = Readonly<{
  winner: GyuiinParticipant;
  loser: GyuiinParticipant;
}>;

export type RoarContact = Readonly<{
  hit: boolean;
  blocked: boolean;
  armorAbsorbed: boolean;
}>;

export type RoarResolution = Readonly<{
  cleanHit: boolean;
  damage: number;
  gauges: GaugeState;
}>;

export type PostContactFlow = 'ko' | 'ultActivation' | 'gyuiinIntro' | 'fight';

export type PostContactFlowInput = Readonly<{
  ko: boolean;
  ultStock: number;
  gyuiinTriggered: boolean;
}>;
