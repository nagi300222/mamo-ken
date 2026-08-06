import type { ArchetypeId, CharacterId, CurrentCharacterId } from './types.ts';

export type RosterCombatStatus = 'current_playable' | 'planned' | 'another_planned';
export type RosterArtStatus = 'adopted_3d_master' | '2d_candidate' | '2d_pending';
export type TrialSkeletonSource = CurrentCharacterId;
export type SelectionCropProfile = Readonly<{
  anchorX: number;
  anchorY: number;
  zoom: number;
}>;

export type FullRosterCharacter = Readonly<{
  slot: number;
  id: CharacterId;
  nameJa: string;
  speciesJa: string;
  archetype: ArchetypeId | 'another';
  styleJa: string;
  specialJa: string;
  ultimateJa: string;
  combatStatus: RosterCombatStatus;
  artStatus: RosterArtStatus;
  playableNow: boolean;
  offlineTrialPlayable: boolean;
  trialSkeletonSource: TrialSkeletonSource;
  trialLabelJa: string | null;
  heightRatio: number | null;
  widthRatio: number | null;
  selectionDisplayScale: number;
  selectionFaceCrop: SelectionCropProfile;
  selectionHeroCrop: SelectionCropProfile;
  accessoryJa: string;
  artMasterPath: string;
  selectionAssetPath: string;
  notes: readonly string[];
}>;

const face = (anchorX: number, anchorY: number, zoom: number): SelectionCropProfile => Object.freeze({ anchorX, anchorY, zoom });
const hero = (anchorX: number, anchorY: number, zoom: number): SelectionCropProfile => Object.freeze({ anchorX, anchorY, zoom });

export const FULL_ROSTER = [
  {
    slot: 1, id: 'moguzo', nameJa: 'モグゾー', speciesJa: '基準マーモット', archetype: 'standard', styleJa: 'スタンダード',
    specialJa: '根性', ultimateJa: '大地烈掌', combatStatus: 'current_playable', artStatus: '2d_candidate', playableNow: true,
    offlineTrialPlayable: true, trialSkeletonSource: 'moguzo', trialLabelJa: null,
    heightRatio: 1, widthRatio: 1, selectionDisplayScale: 1, selectionFaceCrop: face(0.50,0.28,2.35), selectionHeroCrop: hero(0.50,0.42,1.25), accessoryJa: '赤ハチマキ',
    artMasterPath: 'design/character_art/source_manifest.json#moguzo', selectionAssetPath: 'assets/roster3d/moguzo.webp', notes: ['基準1.00', '洋梨型標準体格'],
  },
  {
    slot: 2, id: 'pisuke', nameJa: 'ピスケ', speciesJa: '細身のマーモット', archetype: 'rush', styleJa: 'ラッシュ',
    specialJa: 'チェイス', ultimateJa: '音速連咆', combatStatus: 'current_playable', artStatus: '2d_pending', playableNow: true,
    offlineTrialPlayable: true, trialSkeletonSource: 'pisuke', trialLabelJa: null,
    heightRatio: null, widthRatio: null, selectionDisplayScale: 1.04, selectionFaceCrop: face(0.50,0.27,2.40), selectionHeroCrop: hero(0.50,0.41,1.28), accessoryJa: '青リストバンド',
    artMasterPath: 'design/character_art/source_manifest.json#pisuke', selectionAssetPath: 'assets/roster3d/pisuke.webp', notes: ['厳密比未確定', 'モグゾーより細身で少し高く見せる'],
  },
  {
    slot: 3, id: 'godan', nameJa: 'ゴダン', speciesJa: '大柄なマーモット', archetype: 'power', styleJa: 'パワー',
    specialJa: 'ヘビーアーマー', ultimateJa: '山崩し', combatStatus: 'current_playable', artStatus: '2d_candidate', playableNow: true,
    offlineTrialPlayable: true, trialSkeletonSource: 'godan', trialLabelJa: null,
    heightRatio: null, widthRatio: null, selectionDisplayScale: 1.08, selectionFaceCrop: face(0.50,0.29,2.25), selectionHeroCrop: hero(0.50,0.43,1.18), accessoryJa: '黒帯',
    artMasterPath: 'design/character_art/source_manifest.json#godan', selectionAssetPath: 'assets/roster3d/godan.webp', notes: ['厳密比未確定', '幅広・低重心'],
  },
  {
    slot: 4, id: 'hakuma', nameJa: 'ハクマ', speciesJa: 'ヒマラヤマーモット', archetype: 'defense', styleJa: 'ディフェンス',
    specialJa: 'アイアンウォール', ultimateJa: '白峰不動掌', combatStatus: 'planned', artStatus: 'adopted_3d_master', playableNow: false,
    offlineTrialPlayable: true, trialSkeletonSource: 'godan', trialLabelJa: 'ゴダン骨格で試運転',
    heightRatio: 1.05, widthRatio: 1.18, selectionDisplayScale: 1.05, selectionFaceCrop: face(0.50,0.30,2.18), selectionHeroCrop: hero(0.50,0.44,1.14), accessoryJa: '深緑の厚い首巻き',
    artMasterPath: 'design/character_art/source_manifest.json#hakuma', selectionAssetPath: 'assets/roster3d/hakuma.webp', notes: ['防御成功を次の安定反撃へ変える'],
  },
  {
    slot: 5, id: 'chirka', nameJa: 'チルカ', speciesJa: 'ボバクマーモット', archetype: 'tricky', styleJa: 'トリッキー',
    specialJa: 'フェイント／ディレイ', ultimateJa: '百面本命打ち', combatStatus: 'planned', artStatus: 'adopted_3d_master', playableNow: false,
    offlineTrialPlayable: true, trialSkeletonSource: 'pisuke', trialLabelJa: 'ピスケ骨格で試運転',
    heightRatio: 0.98, widthRatio: 1, selectionDisplayScale: 0.98, selectionFaceCrop: face(0.50,0.28,2.32), selectionHeroCrop: hero(0.50,0.42,1.22), accessoryJa: '紫の細い房付き首紐',
    artMasterPath: 'design/character_art/source_manifest.json#chirka', selectionAssetPath: 'assets/roster3d/chirka.webp', notes: ['同じ予備動作から攻撃・停止・遅延を使い分ける'],
  },
  {
    slot: 6, id: 'takimaru', nameJa: 'タキマル', speciesJa: 'ホーリーマーモット', archetype: 'grappler', styleJa: 'グラップラー',
    specialJa: 'プレッシャー', ultimateJa: '天地大回転', combatStatus: 'planned', artStatus: 'adopted_3d_master', playableNow: false,
    offlineTrialPlayable: true, trialSkeletonSource: 'godan', trialLabelJa: 'ゴダン骨格で試運転',
    heightRatio: 1.07, widthRatio: 1.14, selectionDisplayScale: 1.07, selectionFaceCrop: face(0.50,0.28,2.24), selectionHeroCrop: hero(0.50,0.42,1.16), accessoryJa: '黄土色の太い肩縄',
    artMasterPath: 'design/character_art/source_manifest.json#takimaru', selectionAssetPath: 'assets/roster3d/takimaru.webp', notes: ['縦長大型', '長い前腕'],
  },
  {
    slot: 7, id: 'yomikage', nameJa: 'ヨミカゲ', speciesJa: 'クロボウシマーモット', archetype: 'counter', styleJa: 'カウンター',
    specialJa: 'ジャスト', ultimateJa: '後の先・月断', combatStatus: 'planned', artStatus: 'adopted_3d_master', playableNow: false,
    offlineTrialPlayable: true, trialSkeletonSource: 'pisuke', trialLabelJa: 'ピスケ骨格で試運転',
    heightRatio: 1, widthRatio: 0.95, selectionDisplayScale: 1, selectionFaceCrop: face(0.50,0.28,2.36), selectionHeroCrop: hero(0.50,0.42,1.24), accessoryJa: '片手だけ白い手甲',
    artMasterPath: 'design/character_art/source_manifest.json#yomikage', selectionAssetPath: 'assets/roster3d/yomikage.webp', notes: ['ジャスト成功直後に専用反撃を選ぶ'],
  },
  {
    slot: 8, id: 'bullet', nameJa: 'バレット', speciesJa: 'オナガマーモット', archetype: 'charge', styleJa: 'チャージ',
    specialJa: 'オーバーチャージ', ultimateJa: '超圧縮・弾丸頭突き', combatStatus: 'planned', artStatus: 'adopted_3d_master', playableNow: false,
    offlineTrialPlayable: true, trialSkeletonSource: 'pisuke', trialLabelJa: 'ピスケ骨格で試運転',
    heightRatio: 1.03, widthRatio: 1.1, selectionDisplayScale: 1.03, selectionFaceCrop: face(0.42,0.28,2.48), selectionHeroCrop: hero(0.43,0.41,1.38), accessoryJa: '首から下げた木の実3個',
    artMasterPath: 'design/character_art/source_manifest.json#bullet', selectionAssetPath: 'assets/roster3d/bullet.webp', notes: ['胴が厚い箱型中量級', '長い尾', 'UI表示は尾を除外して頭・胴体基準で合わせる'],
  },
  {
    slot: 9, id: 'dark_moguzo', nameJa: 'ダークモグゾー', speciesJa: 'モグゾー別ルート', archetype: 'another', styleJa: 'アナザー',
    specialJa: '暗連', ultimateJa: '暗連・黒天烈掌', combatStatus: 'another_planned', artStatus: 'adopted_3d_master', playableNow: false,
    offlineTrialPlayable: true, trialSkeletonSource: 'moguzo', trialLabelJa: 'モグゾー骨格で試運転',
    heightRatio: 1, widthRatio: 1, selectionDisplayScale: 1, selectionFaceCrop: face(0.50,0.28,2.35), selectionHeroCrop: hero(0.50,0.42,1.25), accessoryJa: '暗赤ハチマキ',
    artMasterPath: 'design/character_art/source_manifest.json#dark_moguzo', selectionAssetPath: 'assets/roster3d/dark_moguzo.webp', notes: ['通常モグゾーと同じ身長・骨格・体格', '怪物化・悪魔化させない'],
  },
] as const satisfies readonly FullRosterCharacter[];

export const FULL_ROSTER_IDS = FULL_ROSTER.map((character) => character.id) as readonly CharacterId[];
export const CURRENT_PLAYABLE_ROSTER_IDS = FULL_ROSTER.filter((character) => character.playableNow).map((character) => character.id);
export const OFFLINE_TRIAL_ROSTER_IDS = FULL_ROSTER.filter((character) => character.offlineTrialPlayable).map((character) => character.id);

export function validateFullRoster(roster: readonly FullRosterCharacter[] = FULL_ROSTER): void {
  if (roster.length !== 9) throw new Error('full roster must contain exactly nine characters');
  const ids = new Set<string>();
  const slots = new Set<number>();
  for (const character of roster) {
    if (ids.has(character.id)) throw new Error(`duplicate full-roster id: ${character.id}`);
    if (slots.has(character.slot)) throw new Error(`duplicate full-roster slot: ${character.slot}`);
    ids.add(character.id); slots.add(character.slot);
    if (character.slot < 1 || character.slot > 9) throw new Error(`invalid full-roster slot: ${character.slot}`);
    if (!(character.selectionDisplayScale > 0)) throw new Error(`invalid selection display scale: ${character.id}`);
    if (!character.artMasterPath || !character.selectionAssetPath) throw new Error(`missing art path: ${character.id}`);
    for (const [kind, crop] of [['face', character.selectionFaceCrop], ['hero', character.selectionHeroCrop]] as const) {
      if (!(crop.anchorX >= 0 && crop.anchorX <= 1)) throw new Error(`${character.id}: ${kind} anchorX must be normalized`);
      if (!(crop.anchorY >= 0 && crop.anchorY <= 1)) throw new Error(`${character.id}: ${kind} anchorY must be normalized`);
      if (!(crop.zoom >= 1)) throw new Error(`${character.id}: ${kind} zoom must be at least 1`);
    }
    if (!character.offlineTrialPlayable) throw new Error(`${character.id}: all nine roster entries must remain available for offline skeleton trials`);
    if (!['moguzo', 'pisuke', 'godan'].includes(character.trialSkeletonSource)) throw new Error(`${character.id}: invalid trial skeleton source`);
    if (character.playableNow && character.trialSkeletonSource !== character.id) throw new Error(`${character.id}: current playable must use its own skeleton`);
    if (!character.playableNow && !character.trialLabelJa) throw new Error(`${character.id}: trial roster entry needs a visible trial label`);
  }
  if (roster.filter((character) => character.playableNow).length !== 3) throw new Error('exactly three characters must remain currently playable');
  if (roster.filter((character) => character.offlineTrialPlayable).length !== 9) throw new Error('all nine characters must be offline-trial playable');
  const bullet = roster.find((character) => character.id === 'bullet');
  if (!bullet || bullet.selectionFaceCrop.anchorX === 0.5 || bullet.selectionHeroCrop.zoom <= 1.3) throw new Error('bullet UI crop must compensate for the long tail');
  const dark = roster.find((character) => character.id === 'dark_moguzo');
  if (!dark || dark.heightRatio !== 1 || dark.widthRatio !== 1 || dark.trialSkeletonSource !== 'moguzo') throw new Error('dark_moguzo must preserve Moguzo body scale and skeleton');
}
