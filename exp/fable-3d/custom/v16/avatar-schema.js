import { IDS, ROSTER } from '../../dojo/balance.js';

export const AVATAR_SCHEMA_VERSION = 1;
export const AVATAR_PARTS = Object.freeze(['head','ears','tail','hands','feet','accessory']);
export const AVATAR_PATTERNS = Object.freeze(['solid','spots','stripes','mask']);
const COLORS = Object.freeze({fur:'#a17a53',belly:'#e1c199',muzzle:'#edd9b6',accent:'#bd3940',pattern:'#554235'});
// Default colour values are from mamo3d/characters.py via the v16 asset manifest.
export const DEFAULT_AVATAR_PALETTES=Object.freeze({
 "moguzo": {
  "fur": "#bd915c",
  "belly": "#ebcc94",
  "muzzle": "#edd4a3",
  "paw": "#422e21",
  "foot": "#383636",
  "ear": "#734c33",
  "tail": "#bd915c",
  "accent": "#cc140f"
 },
 "pisuke": {
  "fur": "#cca870",
  "belly": "#e0c48f",
  "muzzle": "#e0c799",
  "paw": "#e6cc9e",
  "foot": "#e6cc9e",
  "ear": "#8c6647",
  "tail": "#cca870",
  "accent": "#124ccc"
 },
 "godan": {
  "fur": "#664224",
  "belly": "#b28547",
  "muzzle": "#bd9457",
  "paw": "#33241a",
  "foot": "#30241c",
  "ear": "#40291a",
  "tail": "#664224",
  "accent": "#0f0f12"
 },
 "hakuma": {
  "fur": "#858585",
  "belly": "#ede0bd",
  "muzzle": "#f2e6c7",
  "paw": "#3d3838",
  "foot": "#ccb899",
  "ear": "#332e2e",
  "tail": "#424040",
  "accent": "#215233"
 },
 "chirka": {
  "fur": "#dba342",
  "belly": "#9e4c24",
  "muzzle": "#e6b85c",
  "paw": "#3d332e",
  "foot": "#42362e",
  "ear": "#33241a",
  "tail": "#47301f",
  "accent": "#5c297a"
 },
 "takimaru": {
  "fur": "#adadb0",
  "belly": "#dbdbdb",
  "muzzle": "#f0f0ed",
  "paw": "#121214",
  "foot": "#17171a",
  "ear": "#242426",
  "tail": "#333336",
  "accent": "#e6a81a"
 },
 "yomikage": {
  "fur": "#5e5745",
  "belly": "#ad9e73",
  "muzzle": "#c2b28f",
  "paw": "#6b5c4c",
  "foot": "#80705c",
  "ear": "#332921",
  "tail": "#5e5745",
  "accent": "#e0dbc7"
 },
 "bullet": {
  "fur": "#cc6b24",
  "belly": "#e68f3d",
  "muzzle": "#e6994c",
  "paw": "#5c3d29",
  "foot": "#c79461",
  "ear": "#73381a",
  "tail": "#703012",
  "accent": "#9e7042"
 },
 "dark_moguzo": {
  "fur": "#362b29",
  "belly": "#786961",
  "muzzle": "#6e5e57",
  "paw": "#120f0f",
  "foot": "#1a1717",
  "ear": "#1a1414",
  "tail": "#362b29",
  "accent": "#801214"
 }
});
export const moveRef = (characterId, index) => `${characterId}.s${index + 1}`;
export function parseMoveRef(ref) {
  const match = typeof ref === 'string' && /^([a-z_]+)\.s([123])$/.exec(ref);
  if (!match || !IDS.includes(match[1])) return null;
  return {characterId:match[1],index:Number(match[2])-1,moveId:'s'+match[2]};
}
export function createDefaultAvatar(baseId='moguzo') {
  if (!IDS.includes(baseId)) throw new Error('不明な骨格: '+baseId);
  return {schemaVersion:AVATAR_SCHEMA_VERSION,name:'名もなきマーモット',
    appearance:{baseId,parts:Object.fromEntries(AVATAR_PARTS.map(key=>[key,'base'])),palette:{...COLORS,...DEFAULT_AVATAR_PALETTES[baseId]},pattern:'solid'},
    combat:{styleId:baseId,specials:[0,1,2].map(index=>moveRef(baseId,index))}};
}
// Shape, colour and combat identity are stored independently. Invalid saved data is
// rejected, rather than silently changing a player's selected moves or base rig.
export function validateAvatar(raw) {
  const errors=[];
  const fail=(path,message)=>errors.push({path,message});
  if (!raw || typeof raw!=='object' || Array.isArray(raw)) return {ok:false,errors:[{path:'avatar',message:'キャラ情報がありません'}],definition:null};
  if(raw.schemaVersion!==undefined&&raw.schemaVersion!==AVATAR_SCHEMA_VERSION)fail('schemaVersion','未対応の保存形式です');
  const baseId=raw.appearance?.baseId,styleId=raw.combat?.styleId;
  if(!IDS.includes(baseId))fail('appearance.baseId','9体の骨格から選んでください');
  if(!IDS.includes(styleId))fail('combat.styleId','9体の戦闘スタイルから選んでください');
  const name=typeof raw.name==='string'?raw.name.trim():'';
  if(!name||[...name].length>24||/[\u0000-\u001f\u007f]/.test(name))fail('name','名前は1〜24文字で入力してください');
  const parts={};
  for(const key of AVATAR_PARTS){
    const value=raw.appearance?.parts?.[key]??'base';
    if(typeof value!=='string'||!(value==='base'||key==='accessory'&&value==='none'||key!=='accessory'&&IDS.includes(value)))fail('appearance.parts.'+key,'未対応のパーツです');
    else parts[key]=value;
  }
  const pattern=raw.appearance?.pattern??'solid';
  if(!AVATAR_PATTERNS.includes(pattern))fail('appearance.pattern','未対応の毛模様です');
  const palette={...COLORS,...DEFAULT_AVATAR_PALETTES[baseId]};
  const inputPalette=raw.appearance?.palette;
  if(inputPalette!==undefined&&(!inputPalette||typeof inputPalette!=='object'||Array.isArray(inputPalette)))fail('appearance.palette','部位色が不正です');
  else for(const [key,value] of Object.entries(inputPalette??{})){
    if(!/^[a-zA-Z][\w]{0,30}$/.test(key)||key==='__proto__'||key==='constructor'||!/^#[0-9a-f]{6}$/i.test(value))fail('appearance.palette.'+key,'色は#RRGGBB形式で指定してください');
    else palette[key]=value.toLowerCase();
  }
  const specials=raw.combat?.specials;
  if(!Array.isArray(specials)||specials.length!==3||specials.some(ref=>!parseMoveRef(ref)))fail('combat.specials','必殺技を3つ選んでください');
  const definition=errors.length?null:{schemaVersion:AVATAR_SCHEMA_VERSION,name,
    appearance:{baseId,parts,palette,pattern},combat:{styleId,specials:[...specials]}};
  return {ok:!errors.length,errors,definition};
}
export function normalizeAvatar(raw) {
  const result=validateAvatar(raw);
  if(!result.ok)throw new Error(result.errors.map(e=>e.message).join(' / '));
  return result.definition;
}
export function isUnmodifiedCombatShape(definition) {
  return AVATAR_PARTS.every(key=>definition.appearance.parts[key]==='base');
}
export function seededRandom(seed) {
  let state=Number(seed)>>>0;
  return ()=>{state+=0x6d2b79f5;let n=Math.imul(state^(state>>>15),1|state);n^=n+Math.imul(n^(n>>>7),61|n);return ((n^(n>>>14))>>>0)/4294967296;};
}
export function createSeededMob(seed) {
  const random=seededRandom(seed),baseId=IDS[Math.floor(random()*IDS.length)],definition=createDefaultAvatar(baseId);
  const colours=['#ce935c','#7589ad','#9e76b3','#679d82','#d9bc78','#b8707f'];
  definition.name=['山風','こもれび','黄昏','石ころ','新月','渓流'][Math.floor(random()*6)]+'のマーモット';
  definition.appearance.palette.fur=colours[Math.floor(random()*colours.length)];
  definition.appearance.palette.accent=colours[Math.floor(random()*colours.length)];
  definition.appearance.pattern=AVATAR_PATTERNS[Math.floor(random()*AVATAR_PATTERNS.length)];
  // Random mobs only select shapes/skills whose geometry is already known. The
  // authored base style supplies exactly one ability, never two stacked abilities.
  const projectileIds=IDS.filter(id=>ROSTER[id].specials[0].kind==='projectile');
  definition.combat.specials[0]=moveRef(projectileIds[Math.floor(random()*projectileIds.length)],0);
  return definition;
}
