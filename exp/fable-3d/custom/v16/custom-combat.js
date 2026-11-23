import { Battle } from '../../dojo/battle.js';
import { IDS, ROSTER, normalMove, specialMove } from '../../dojo/balance.js';
import {NORMAL_CONTACTS,NORMAL_HURT_BOUNDS,ACTIVE_NORMAL_MOTION_VERSION} from '../../dojo/normal-contact-source.js';
import {validNormalStrikeHeight} from '../../dojo/normal-contact-runtime-v151.js';
import { normalizeAvatar, createDefaultAvatar, parseMoveRef, isUnmodifiedCombatShape } from './avatar-schema.js';

const NORMAL=/^(stand|crouch|air)_(weak|heavy)$/;
const check=(value,message)=>{if(!value)throw new Error(message);};
export function compatibilityForMove(definition,ref) {
  const parsed=parseMoveRef(ref);
  if(!parsed)return {supported:false,reason:'不明な必殺技です'};
  const {characterId,index,moveId}=parsed,move=specialMove(characterId,index);
  const {baseId,parts}=definition.appearance;
  let reason='';
  const nativePart=key=>parts[key]==='base'||parts[key]===baseId;
  if(move.kind==='tail'&&(baseId!=='bullet'||!nativePart('tail')))reason='尾薙ぎにはバレット骨格の元の6ボーン長尾が必要です';
  else if(characterId==='bullet'&&index===1&&(baseId!=='bullet'||!nativePart('tail')))reason='尾跳ねにはバレット骨格の元の長尾が必要です';
  else if(move.kind==='counter'&&definition.combat.styleId!=='yomikage')reason='受け返しは見切り能力を持つヨミカゲスタイルで対応します';
  else if(characterId!==baseId&&move.kind!=='projectile')reason='この骨格への打撃・投げの移植と接触計測は未対応です';
  else if(!['projectile','tail'].includes(move.kind)&&(!nativePart('hands')||!nativePart('feet')))reason='交換した手足の必殺打撃は接触計測が未対応です。通常技と飛び道具から選べます';
  return {ref,characterId,moveId,index,name:move.name,kind:move.kind,supported:!reason,reason,
    compatibility:characterId===baseId?'native-rig':'retargeted-projectile',
    requiredBones:move.kind==='tail'?['tail_01','tail_02','tail_03','tail_04','tail_05','tail_06']:['pelvis','chest','head']};
}
export function moveCatalog(raw) {
  const definition=normalizeAvatar(raw);
  return IDS.flatMap(id=>[0,1,2].map(index=>compatibilityForMove(definition,`${id}.s${index+1}`)));
}
export function validateCombatLoadout(raw) {
  let definition;
  try{definition=normalizeAvatar(raw);}catch(error){return {ok:false,errors:[{path:'avatar',message:error.message}],definition:null};}
  const errors=definition.combat.specials.flatMap((ref,index)=>{
    const result=compatibilityForMove(definition,ref);
    return result.supported?[]:[{path:`combat.specials.${index}`,ref,message:result.reason}];
  });
  return {ok:!errors.length,errors,definition};
}
// Offered to the editor as an explicit alternative, never applied to saved data
// automatically when a user changes the style or body.
export function compatibleSpecialSuggestion(raw) {
  const definition=normalizeAvatar(raw),all=moveCatalog(definition),native=all.filter(m=>m.characterId===definition.combat.styleId&&m.supported);
  const others=all.filter(m=>m.supported&&m.kind==='projectile');
  return [0,1,2].map(index=>native.find(m=>m.index===index)?.ref??others[index%others.length].ref);
}
function validateMeasurement(value,label) {
  check(value&&value.source==='runtime-skinned-mesh',label+'のスキン後接触計測が必要です');
  for(const slot of Object.keys(NORMAL_CONTACTS.moguzo)){
    const m=value.normals?.[slot];
    check(m&&Number.isFinite(m.reach)&&m.reach>=0&&validNormalStrikeHeight(slot,m.height,.02)&&
      Number.isFinite(m.contact)&&Number.isFinite(m.contactEnd)&&m.contact>0&&m.contactEnd>m.contact&&m.contactEnd<1&&
      Array.isArray(m.activeReach)&&m.activeReach.length>=2&&m.activeReach.every(p=>
        Number.isFinite(p.phase)&&p.phase>=0&&p.phase<=1&&Number.isFinite(p.reach)&&p.reach>=0&&validNormalStrikeHeight(slot,p.height,.02)),label+'の通常技計測が不正: '+slot);
  }
  for(const stance of ['stand','crouch']){
    const b=value.hurtBounds?.[stance];
    check(b&&Number.isFinite(b.bottom)&&Number.isFinite(b.top)&&b.bottom>=-.02&&b.top>b.bottom,label+'の被弾範囲が不正');
  }
  const socket=value.projectileSocket;
  check(socket&&Number.isFinite(socket.forward)&&socket.forward>=0&&socket.forward<1&&Number.isFinite(socket.height)&&socket.height>0&&socket.height<1.5,label+'の発射位置が不正');
  return value;
}
function baseMeasurement(definition) {
  const id=definition.appearance.baseId;
  return {normals:NORMAL_CONTACTS[id],hurtBounds:NORMAL_HURT_BOUNDS[id],projectileSocket:{forward:.30,height:.30},
    normalMotionVersion:ACTIVE_NORMAL_MOTION_VERSION,source:ACTIVE_NORMAL_MOTION_VERSION==='v17'?'v17-approved-base-surface':'v151-original-base-surface'};
}
export function customMoveFor(fighter,id,original) {
  const definition=fighter.definition;
  if(!definition)return original;
  const baseId=definition.appearance.baseId;
  if(NORMAL.test(id)){
    const visual=fighter.customMeasurement.normals[id];
    return {...normalMove(fighter.id,id),reach:visual.reach,strikeHeight:visual.height,
      activeReach:visual.activeReach.map(p=>({...p})),visualRigId:baseId,
      customContact:visual,sourceCharacterId:baseId,sourceMoveId:id};
  }
  if(/^s[123]$/.test(id)){
    const ref=definition.combat.specials[Number(id.slice(1))-1],compatibility=compatibilityForMove(definition,ref);
    if(!compatibility.supported)return null;
    // Source move keeps its own timing, projectile speed, damage and visual. Only
    // the selected style's single ability can subsequently modify it in Battle.
    return {...specialMove(compatibility.characterId,compatibility.index),customRef:ref,
      sourceCharacterId:compatibility.characterId,sourceMoveId:compatibility.moveId,
      customCompatibility:compatibility.compatibility};
  }
  return original;
}
export function createCustomBattle(player,opponent='godan',level=1,options={}) {
  const raws=[player,opponent],defs=raws.map(raw=>typeof raw==='string'?null:validateCombatLoadout(raw));
  defs.forEach((value,i)=>{
    if(value&&!value.ok)throw new Error((i?'相手':'自キャラ')+': '+value.errors.map(e=>e.message).join(' / '));
    if(!value)check(IDS.includes(raws[i]),'不明な対戦相手です');
  });
  const definitions=defs.map(value=>value?.definition??null);
  const measurements=definitions.map((definition,i)=>{
    if(!definition)return null;
    if(options.measurements?.[i])return validateMeasurement(options.measurements[i],i?'相手':'自キャラ');
    check(isUnmodifiedCombatShape(definition),'形を変えた自キャラは接触計測後に対戦できます');
    return baseMeasurement(definition);
  });
  const ids=definitions.map((definition,i)=>definition?.combat.styleId??raws[i]);
  const battle=new Battle(...ids,level,{
    specialContactDelivery:options.specialContactDelivery,
    moveResolver:(fighter,move,id)=>customMoveFor(fighter,id,move),
    hurtBoundsResolver:target=>target.customMeasurement?{[target.id]:target.customMeasurement.hurtBounds}:NORMAL_HURT_BOUNDS,
    projectileOrigin:(fighter,move)=>fighter.customMeasurement?.projectileSockets?.[move.customRef]??fighter.customMeasurement?.projectileSocket??{forward:.30,height:.30},
    projectileContact:(projectile,target)=>{
      if(!projectile.customRef)return undefined;
      const crouch=target.y===0&&(target.state==='crouch'||target.state==='block'&&target.input?.down||target.action?.id?.startsWith('crouch_'));
      const bounds=(target.customMeasurement?.hurtBounds??NORMAL_HURT_BOUNDS[target.id])[crouch?'crouch':'stand'];
      return projectile.y+.08>=target.y+bounds.bottom&&projectile.y-.08<=target.y+bounds.top;
    },
    customAgain:old=>createCustomBattle(...definitions.map((definition,i)=>definition??raws[i]),old.level,options)
  });
  for(let i=0;i<2;i++)if(definitions[i]){
    Object.assign(battle.fighters[i],{definition:definitions[i],visualRigId:definitions[i].appearance.baseId,customMeasurement:measurements[i],displayName:definitions[i].name});
  }
  battle.customDefinitions=definitions;
  return battle;
}

export {createDefaultAvatar};
