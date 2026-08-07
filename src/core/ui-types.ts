import type { ArchetypeId, CharacterId, CurrentCharacterId } from './types.ts';

export type DisplayStatKey = 'ATK' | 'SPD' | 'DEF' | 'TEC' | 'BRK';
export type UiDifficulty = 'EASY' | 'NORMAL' | 'HARD';
export type CharacterDetailTab = 'performance' | 'moves' | 'combos';
export type UiScreenId = 'character_select' | 'character_detail' | 'battle' | 'pause' | 'move_list' | 'disconnect_confirm';

export type UiRect = Readonly<{ x: number; y: number; width: number; height: number }>;
export type UiCropProfile = Readonly<{ anchorX: number; anchorY: number; zoom: number }>;

export type RosterSlotContract = Readonly<{
  slot: number;
  characterId: CharacterId;
  archetype: ArchetypeId | 'another';
  status: 'current_impl' | 'planned';
  unlocked: boolean;
  playableNow: boolean;
  offlineTrialPlayable: boolean;
  trialSkeletonSource: CurrentCharacterId;
  trialLabelJa: string | null;
  displayName: string;
  placeholder: null | 'lock' | 'question';
  stats: Readonly<Record<DisplayStatKey, number>> | null;
  statsAreIndependentAxes: true;
  faceCrop: UiCropProfile;
  heroCrop: UiCropProfile;
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
  id: 'back' | 'character_detail' | 'pause' | 'move_list' | 'disconnect_request' | 'disconnect_confirm' | 'disconnect_cancel';
  visibleOn: readonly UiScreenId[];
  requiresConfirmation: boolean;
}>;

export type UiHitRegion = Readonly<{
  id: string;
  rect: UiRect;
  role: 'roster_slot' | 'mystery_slot' | 'direction' | 'attack' | 'grab' | 'guard' | 'utility';
}>;

export type PortraitLayoutContract = Readonly<{
  viewport: Readonly<{ width: number; height: number; safeTop: number; safeBottom: number }>;
  rosterRegions: readonly UiHitRegion[];
  battleRegions: readonly UiHitRegion[];
}>;

export type CharacterSelectContract = Readonly<{
  columns: 5;
  rows: 2;
  rosterEntries: 9;
  totalCells: 10;
  mysteryCellIndex: 9;
  faceCropAnchor: 'nose';
  textSeparatedFromArtwork: true;
  officialPlayableCount: 3;
  offlineTrialPlayableCount: 9;
  onlinePlayableCount: 9;
  provisionalSkeletonLabelRequired: true;
}>;

export type CharacterDetailContract = Readonly<{
  screen: 'character_detail';
  tabs: readonly CharacterDetailTab[];
  tabLabelsJa: Readonly<Record<CharacterDetailTab, string>>;
  returnsTo: 'character_select';
  preservesSelectedCharacter: true;
  allRosterEntriesVisible: true;
  battleAvailabilityUnchanged: true;
  offlineTrialAvailabilityVisible: true;
  comboUnverifiedLabelJa: '未検証';
  scrollStepLogicalPx: number;
  minimumPrimaryTargetLogicalPx: number;
}>;

export type UiContract = Readonly<{
  version: 'ui-contract-v3';
  roster: readonly RosterSlotContract[];
  characterSelect: CharacterSelectContract;
  difficulties: readonly UiDifficulty[];
  actions: readonly UiActionContract[];
  inputCues: readonly InputCueContract[];
  characterDetail: CharacterDetailContract;
  ultTextOverlay: Readonly<{ status: 'optional'; bakedIntoSprite: false; token: 'ult_text_overlay' }>;
  onlineDisconnect: Readonly<{ confirmationRequired: true; screen: 'disconnect_confirm' }>;
}>;

export type CurrentRosterStats = Readonly<Record<CurrentCharacterId, Readonly<Record<DisplayStatKey, number>>>>;