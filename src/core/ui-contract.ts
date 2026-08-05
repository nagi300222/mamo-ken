import { CURRENT_CHARACTERS } from './constants.ts';
import type { CurrentCharacterId } from './types.ts';
import type {
  CurrentRosterStats,
  PortraitLayoutContract,
  RosterSlotContract,
  UiContract,
  UiHitRegion,
  UiRect,
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

export const UI_CONTRACT: UiContract = Object.freeze({
  version: 'ui-contract-v1',
  roster: Object.freeze([
    Object.freeze({ slot: 1, characterId: 'moguzo', archetype: 'standard', status: 'current_impl', unlocked: true, displayName: 'モグゾー', placeholder: null, stats: CURRENT_STATS.moguzo, statsAreIndependentAxes: true }),
    Object.freeze({ slot: 2, characterId: 'pisuke', archetype: 'rush', status: 'current_impl', unlocked: true, displayName: 'ピスケ', placeholder: null, stats: CURRENT_STATS.pisuke, statsAreIndependentAxes: true }),
    Object.freeze({ slot: 3, characterId: 'godan', archetype: 'power', status: 'current_impl', unlocked: true, displayName: 'ゴダン', placeholder: null, stats: CURRENT_STATS.godan, statsAreIndependentAxes: true }),
    Object.freeze({ slot: 4, characterId: 'himalaya', archetype: 'defense', status: 'planned', unlocked: false, displayName: '？', placeholder: 'question', stats: null, statsAreIndependentAxes: true }),
    Object.freeze({ slot: 5, characterId: 'bobak', archetype: 'tricky', status: 'planned', unlocked: false, displayName: '？', placeholder: 'question', stats: null, statsAreIndependentAxes: true }),
    Object.freeze({ slot: 6, characterId: 'grappler_tbd', archetype: 'grappler', status: 'planned', unlocked: false, displayName: '？', placeholder: 'lock', stats: null, statsAreIndependentAxes: true }),
    Object.freeze({ slot: 7, characterId: 'counter_tbd', archetype: 'counter', status: 'planned', unlocked: false, displayName: '？', placeholder: 'lock', stats: null, statsAreIndependentAxes: true }),
    Object.freeze({ slot: 8, characterId: 'charge_tbd', archetype: 'charge', status: 'planned', unlocked: false, displayName: '？', placeholder: 'lock', stats: null, statsAreIndependentAxes: true }),
  ] satisfies readonly RosterSlotContract[]),
  difficulties: Object.freeze(['EASY', 'NORMAL', 'HARD']),
  actions: Object.freeze([
    Object.freeze({ id: 'back', visibleOn: Object.freeze(['character_select', 'move_list']), requiresConfirmation: false }),
    Object.freeze({ id: 'pause', visibleOn: Object.freeze(['battle']), requiresConfirmation: false }),
    Object.freeze({ id: 'move_list', visibleOn: Object.freeze(['battle', 'pause']), requiresConfirmation: false }),
    Object.freeze({ id: 'disconnect_request', visibleOn: Object.freeze(['pause']), requiresConfirmation: true }),
    Object.freeze({ id: 'disconnect_confirm', visibleOn: Object.freeze(['disconnect_confirm']), requiresConfirmation: true }),
    Object.freeze({ id: 'disconnect_cancel', visibleOn: Object.freeze(['disconnect_confirm']), requiresConfirmation: false }),
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
  const rosterHeight = rosterBottom - rosterTop;
  const cardWidth = (width - pad * 2 - gap) / 2;
  const cardHeight = (rosterHeight - gap * 3) / 4;
  const rosterRegions: UiHitRegion[] = [];
  for (let index = 0; index < 8; index += 1) {
    const column = index % 2;
    const row = Math.floor(index / 2);
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
  if (contract.roster.length !== 8) throw new Error('UI roster must contain eight slots');
  if (new Set(contract.roster.map((slot) => slot.slot)).size !== 8) throw new Error('duplicate roster slot');
  if (contract.roster.filter((slot) => slot.unlocked).length !== 3) throw new Error('only current three slots may be unlocked');
  for (const slot of contract.roster) {
    if (!slot.statsAreIndependentAxes) throw new Error('display stats must not be treated as TOTAL');
    if (!slot.unlocked && slot.placeholder === null) throw new Error('locked slot needs visible placeholder');
  }
  for (const cue of contract.inputCues) {
    if (!cue.colorToken || !cue.shapeToken || !cue.positionToken || !cue.seToken) throw new Error(`incomplete cue: ${cue.id}`);
  }
  if (!contract.onlineDisconnect.confirmationRequired) throw new Error('online disconnect confirmation is required');
}

export function validatePortraitLayout(layout: PortraitLayoutContract): void {
  const groups = [layout.rosterRegions, layout.battleRegions];
  for (const regions of groups) {
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
