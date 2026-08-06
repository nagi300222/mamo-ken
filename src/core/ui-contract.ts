import { CURRENT_CHARACTERS } from './constants.ts';
import type { CurrentCharacterId } from './types.ts';
import type {
  CurrentRosterStats,
  PortraitLayoutContract,
  RosterSlotContract,
  UiContract,
  UiHitRegion,
  UiRect,
  UiScreenId,
} from './ui-types.ts';

const CURRENT_STATS: CurrentRosterStats = Object.freeze(Object.fromEntries(
  CURRENT_CHARACTERS.map((character) => [character.id, Object.freeze({
    ATK: character.stats5.atk,
    SPD: character.stats5.spd,
    DEF: character.stats5.def,
    TEC: character.stats5.tech,
    BRK: character.stats5.brk,
  })]),
) as Record<CurrentCharacterId, CurrentRosterStats[CurrentCharacterId]>);

function screens(...values: UiScreenId[]): readonly UiScreenId[] {
  return Object.freeze(values);
}

export const UI_CONTRACT: UiContract = Object.freeze({
  version: 'ui-contract-v2',
  roster: Object.freeze([
    Object.freeze({ slot: 1, characterId: 'moguzo', archetype: 'standard', status: 'current_impl', unlocked: true, playableNow: true, displayName: 'モグゾー', placeholder: null, stats: CURRENT_STATS.moguzo, statsAreIndependentAxes: true }),
    Object.freeze({ slot: 2, characterId: 'pisuke', archetype: 'rush', status: 'current_impl', unlocked: true, playableNow: true, displayName: 'ピスケ', placeholder: null, stats: CURRENT_STATS.pisuke, statsAreIndependentAxes: true }),
    Object.freeze({ slot: 3, characterId: 'godan', archetype: 'power', status: 'current_impl', unlocked: true, playableNow: true, displayName: 'ゴダン', placeholder: null, stats: CURRENT_STATS.godan, statsAreIndependentAxes: true }),
    Object.freeze({ slot: 4, characterId: 'hakuma', archetype: 'defense', status: 'planned', unlocked: true, playableNow: false, displayName: 'ハクマ', placeholder: null, stats: null, statsAreIndependentAxes: true }),
    Object.freeze({ slot: 5, characterId: 'chirka', archetype: 'tricky', status: 'planned', unlocked: true, playableNow: false, displayName: 'チルカ', placeholder: null, stats: null, statsAreIndependentAxes: true }),
    Object.freeze({ slot: 6, characterId: 'takimaru', archetype: 'grappler', status: 'planned', unlocked: true, playableNow: false, displayName: 'タキマル', placeholder: null, stats: null, statsAreIndependentAxes: true }),
    Object.freeze({ slot: 7, characterId: 'yomikage', archetype: 'counter', status: 'planned', unlocked: true, playableNow: false, displayName: 'ヨミカゲ', placeholder: null, stats: null, statsAreIndependentAxes: true }),
    Object.freeze({ slot: 8, characterId: 'bullet', archetype: 'charge', status: 'planned', unlocked: true, playableNow: false, displayName: 'バレット', placeholder: null, stats: null, statsAreIndependentAxes: true }),
    Object.freeze({ slot: 9, characterId: 'dark_moguzo', archetype: 'another', status: 'planned', unlocked: true, playableNow: false, displayName: 'ダークモグゾー', placeholder: null, stats: null, statsAreIndependentAxes: true }),
  ] satisfies readonly RosterSlotContract[]),
  difficulties: Object.freeze(['EASY', 'NORMAL', 'HARD'] as const),
  actions: Object.freeze([
    Object.freeze({ id: 'back', visibleOn: screens('character_select', 'character_detail', 'move_list'), requiresConfirmation: false }),
    Object.freeze({ id: 'character_detail', visibleOn: screens('character_select'), requiresConfirmation: false }),
    Object.freeze({ id: 'pause', visibleOn: screens('battle'), requiresConfirmation: false }),
    Object.freeze({ id: 'move_list', visibleOn: screens('battle', 'pause'), requiresConfirmation: false }),
    Object.freeze({ id: 'disconnect_request', visibleOn: screens('pause'), requiresConfirmation: true }),
    Object.freeze({ id: 'disconnect_confirm', visibleOn: screens('disconnect_confirm'), requiresConfirmation: true }),
    Object.freeze({ id: 'disconnect_cancel', visibleOn: screens('disconnect_confirm'), requiresConfirmation: false }),
  ]),
  inputCues: Object.freeze([
    Object.freeze({ id: 'dir_left', label: '←', colorToken: 'direction_neutral', shapeToken: 'arrow_left', positionToken: 'left_pad_left', seToken: 'direction_tap' }),
    Object.freeze({ id: 'dir_down', label: '↓', colorToken: 'direction_neutral', shapeToken: 'arrow_down', positionToken: 'left_pad_center', seToken: 'direction_tap' }),
    Object.freeze({ id: 'dir_right', label: '→', colorToken: 'direction_neutral', shapeToken: 'arrow_right', positionToken: 'left_pad_right', seToken: 'direction_tap' }),
    Object.freeze({ id: 'attack_high', label: '上', colorToken: 'level_high', shapeToken: 'chevron_up', positionToken: 'right_pad_high', seToken: 'tele_high' }),
    Object.freeze({ id: 'attack_mid', label: '中', colorToken: 'level_mid', shapeToken: 'circle', positionToken: 'right_pad_mid', seToken: 'tele_mid' }),
    Object.freeze({ id: 'attack_low', label: '下', colorToken: 'level_low', shapeToken: 'chevron_down', positionToken: 'right_pad_low', seToken: 'tele_low' }),
    Object.freeze({ id: 'guard', label: '防', colorToken: 'guard', shapeToken: 'shield', positionToken: 'left_pad_hold', seToken: 'guard_on' }),
    Object.freeze({ id: 'grab', label: '掴', colorToken: 'grab', shapeToken: 'paw', positionToken: 'right_pad_grab', seToken: 'grab_go' }),
  ]),
  characterDetail: Object.freeze({
    screen: 'character_detail',
    tabs: Object.freeze(['performance', 'moves', 'combos'] as const),
    tabLabelsJa: Object.freeze({ performance: '性能', moves: 'わざ', combos: 'コンボ' }),
    returnsTo: 'character_select',
    preservesSelectedCharacter: true,
    allRosterEntriesVisible: true,
    battleAvailabilityUnchanged: true,
    comboUnverifiedLabelJa: '未検証',
    scrollStepLogicalPx: 260,
    minimumPrimaryTargetLogicalPx: 74,
  }),
  ultTextOverlay: Object.freeze({ status: 'optional', bakedIntoSprite: false, token: 'ult_text_overlay' }),
  onlineDisconnect: Object.freeze({ confirmationRequired: true, screen: 'disconnect_confirm' }),
});

function rect(x: number, y: number, width: number, height: number): UiRect {
  return Object.freeze({ x, y, width, height });
}

export function rectanglesOverlap(a: UiRect, b: UiRect): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

export function buildPortraitLayout(width: number, height: number, safeTop = 0, safeBottom = 0): PortraitLayoutContract {
  if (width < 320 || height < 568) throw new RangeError('minimum portrait viewport is 320x568');
  const pad = 12;
  const gap = 8;
  const rosterTop = safeTop + 56;
  const rosterBottom = Math.floor(height * 0.56);
  const columns = 3;
  const rows = 3;
  const cardWidth = (width - pad * 2 - gap * (columns - 1)) / columns;
  const cardHeight = (rosterBottom - rosterTop - gap * (rows - 1)) / rows;
  const rosterRegions: UiHitRegion[] = [];
  for (let index = 0; index < 9; index += 1) {
    const column = index % columns;
    const row = Math.floor(index / columns);
    rosterRegions.push(Object.freeze({
      id: `roster_${index + 1}`,
      role: 'roster_slot',
      rect: rect(pad + column * (cardWidth + gap), rosterTop + row * (cardHeight + gap), cardWidth, cardHeight),
    }));
  }

  const half = width / 2;
  const leftX = pad;
  const rightX = half + gap / 2;
  const leftWidth = half - pad - gap / 2;
  const rightWidth = width - rightX - pad;
  const rowHeight = Math.max(48, Math.min(76, Math.floor((height * 0.28 - gap) / 2)));
  const topY = height - safeBottom - pad - rowHeight * 2 - gap;
  const leftCell = (leftWidth - gap * 2) / 3;
  const rightCell = (rightWidth - gap * 2) / 3;
  const battleRegions: UiHitRegion[] = [];
  ['left', 'down', 'right'].forEach((id, index) => battleRegions.push(Object.freeze({ id: `dir_${id}`, role: 'direction', rect: rect(leftX + index * (leftCell + gap), topY, leftCell, rowHeight) })));
  ['high', 'mid', 'low'].forEach((id, index) => battleRegions.push(Object.freeze({ id: `attack_${id}`, role: 'attack', rect: rect(rightX + index * (rightCell + gap), topY, rightCell, rowHeight) })));
  battleRegions.push(Object.freeze({ id: 'guard', role: 'guard', rect: rect(leftX, topY + rowHeight + gap, leftWidth, rowHeight) }));
  battleRegions.push(Object.freeze({ id: 'grab', role: 'grab', rect: rect(rightX, topY + rowHeight + gap, rightWidth, rowHeight) }));
  battleRegions.push(Object.freeze({ id: 'pause', role: 'utility', rect: rect(width - pad - 48, safeTop + 8, 48, 40) }));
  battleRegions.push(Object.freeze({ id: 'move_list', role: 'utility', rect: rect(width - pad - 104, safeTop + 8, 48, 40) }));

  const layout = Object.freeze({
    viewport: Object.freeze({ width, height, safeTop, safeBottom }),
    rosterRegions: Object.freeze(rosterRegions),
    battleRegions: Object.freeze(battleRegions),
  });
  validatePortraitLayout(layout);
  return layout;
}

export function validateUiContract(contract: UiContract = UI_CONTRACT): void {
  if (contract.roster.length !== 9) throw new Error('UI roster must contain nine slots');
  if (new Set(contract.roster.map((slot) => slot.slot)).size !== 9) throw new Error('duplicate roster slot');
  if (contract.roster.filter((slot) => slot.playableNow).length !== 3) throw new Error('only current three slots may be playable');
  for (const slot of contract.roster) {
    if (!slot.statsAreIndependentAxes) throw new Error('display stats must not be treated as TOTAL');
    if (!slot.unlocked) throw new Error('all adopted roster art must be focusable');
    if (slot.playableNow !== (slot.status === 'current_impl')) throw new Error('UI playability must match current implementation status');
    if (!slot.playableNow && slot.stats !== null) throw new Error('planned roster stats must remain unset');
  }
  for (const cue of contract.inputCues) {
    if (!cue.colorToken || !cue.shapeToken || !cue.positionToken || !cue.seToken) throw new Error(`incomplete cue: ${cue.id}`);
  }
  if (JSON.stringify(contract.characterDetail.tabs) !== JSON.stringify(['performance', 'moves', 'combos'])) throw new Error('character detail tabs must be performance/moves/combos');
  if (!contract.characterDetail.preservesSelectedCharacter) throw new Error('character detail must preserve selected character');
  if (!contract.characterDetail.allRosterEntriesVisible) throw new Error('all roster entries must expose character details');
  if (!contract.characterDetail.battleAvailabilityUnchanged) throw new Error('character details must not alter battle availability');
  if (contract.characterDetail.minimumPrimaryTargetLogicalPx < 74) throw new Error('character detail primary tap targets are too small');
  if (contract.characterDetail.comboUnverifiedLabelJa !== '未検証') throw new Error('unverified combo label must remain explicit');
  if (!contract.onlineDisconnect.confirmationRequired) throw new Error('online disconnect confirmation is required');
}

export function validatePortraitLayout(layout: PortraitLayoutContract): void {
  for (const regions of [layout.rosterRegions, layout.battleRegions]) {
    for (const region of regions) {
      const { x, y, width, height } = region.rect;
      if (width < 40 || height < 40) throw new Error(`tap region too small: ${region.id}`);
      if (x < 0 || y < layout.viewport.safeTop || x + width > layout.viewport.width || y + height > layout.viewport.height - layout.viewport.safeBottom) {
        throw new Error(`region outside viewport: ${region.id}`);
      }
    }
    for (let a = 0; a < regions.length; a += 1) for (let b = a + 1; b < regions.length; b += 1) {
      if (rectanglesOverlap(regions[a].rect, regions[b].rect)) throw new Error(`tap regions overlap: ${regions[a].id}/${regions[b].id}`);
    }
  }
}
