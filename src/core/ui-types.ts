import type { ArchetypeId, CharacterId, CurrentCharacterId } from './types.ts';

export type DisplayStatKey = 'ATK' | 'SPD' | 'DEF' | 'TEC' | 'BRK';
export type UiDifficulty = 'EASY' | 'NORMAL' | 'HARD';
export type UiScreenId = 'character_select' | 'battle' | 'pause' | 'move_list' | 'disconnect_confirm';

export type UiRect = Readonly<{ x: number; y: number; width: number; height: number }>;

export type RosterSlotContract = Readonly<{
  slot: number;
  characterId: CharacterId;
  archetype: ArchetypeId;
  status: 'current_impl' | 'planned';
  unlocked: boolean;
  displayName: string;
  placeholder: null | 'lock' | 'question';
  stats: Readonly<Record<DisplayStatKey, number>> | null;
  statsAreIndependentAxes: true;
}>;

export type InputCueContract = Readonly<{
  id: string;
  label: string;
  colorToken: string;
  shapeToken: string;
  positionToken: string;
  seToken: string;
}>;

export type UiActionContract = Readonly<{
  id: 'back' | 'pause' | 'move_list' | 'disconnect_request' | 'disconnect_confirm' | 'disconnect_cancel';
  visibleOn: readonly UiScreenId[];
  requiresConfirmation: boolean;
}>;

export type UiHitRegion = Readonly<{
  id: string;
  rect: UiRect;
  role: 'roster_slot' | 'direction' | 'attack' | 'grab' | 'guard' | 'utility';
}>;

export type PortraitLayoutContract = Readonly<{
  viewport: Readonly<{ width: number; height: number; safeTop: number; safeBottom: number }>;
  rosterRegions: readonly UiHitRegion[];
  battleRegions: readonly UiHitRegion[];
}>;

export type UiContract = Readonly<{
  version: 'ui-contract-v1';
  roster: readonly RosterSlotContract[];
  difficulties: readonly UiDifficulty[];
  actions: readonly UiActionContract[];
  inputCues: readonly InputCueContract[];
  ultTextOverlay: Readonly<{ status: 'optional'; bakedIntoSprite: false; token: 'ult_text_overlay' }>;
  onlineDisconnect: Readonly<{ confirmationRequired: true; screen: 'disconnect_confirm' }>;
}>;

export type CurrentRosterStats = Readonly<Record<CurrentCharacterId, Readonly<Record<DisplayStatKey, number>>>>;
