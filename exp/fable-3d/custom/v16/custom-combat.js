import { Battle } from '../../dojo/battle.js';
import { IDS, ROSTER, normalMove, specialMove } from '../../dojo/balance.js';
import {NORMAL_CONTACTS,NORMAL_HURT_BOUNDS,ACTIVE_NORMAL_MOTION_VERSION} from '../../dojo/normal-contact-source.js';
import {validNormalStrikeHeight,NORMAL_STRIKE_RADIUS} from '../../dojo/normal-contact-runtime-v151.js';
import {validNormalActiveTrajectory} from '../../dojo/p3-contact-adapter.js';
import {ACTIVE_P3_SPECIAL_CONTACT_DELIVERY} from '../../dojo/special-contact-runtime-p3.js';
import {p2MeleeCompatibility,p2AppearanceKey,P2_MELEE_COMPATIBILITY_VERSION} from './melee-compatibility-p2.js';
import {cpuInput} from '../../dojo/cpu.js';
import { normalizeAvatar, createDefaultAvatar, parseMoveRef, isUnmodifiedCombatShape } from './avatar-schema.js';

const NORMAL=/^(stand|crouch|air)_(weak|heavy)$/;
const CUSTOM_PROJECTILE_RADIUS=.08;
const check=(value,message)=>{if(!value)throw new Error(message);};
export function compatibilityForMove(definition,ref) {
  const parsed=parseMoveRef(ref);
  if(!parsed)return {supported:false,reason:'不明な必殺技です'};
  const {characterId,index,moveId}=parsed,move=specialMove(characterId,index);
  const {baseId,parts}=definition.appearance;
  let reason='',p2=null;
  const nativePart=key=>parts[key]==='base'||parts[key]===baseId;
  if(move.kind==='tail'&&(baseId!=='bullet'||!nativePart('tail')))reason='尾薙ぎにはバレット骨格の元の6ボーン長尾が必要です';
  else if(characterId==='bullet'&&index===1&&(baseId!=='bullet'||!nativePart('tail')))reason='尾跳ねにはバレット骨格の元の長尾が必要です';
  else if(move.kind==='counter'&&definition.combat.styleId!=='yomikage')reason='受け返しは見切り能力を持つヨミカゲスタイルで対応します';
  else if(characterId!==baseId&&move.kind!=='projectile'){
    p2=p2MeleeCompatibility(definition,ref,{sourceVersion:ACTIVE_P3_SPECIAL_CONTACT_DELIVERY?.version??null});
    if(!p2.supported)reason=p2.reason;
  }
  else if(!['projectile','tail'].includes(move.kind)&&(!nativePart('hands')||!nativePart('feet')))reason='交換した手足の必殺打撃は接触計測が未対応です。通常技と飛び道具から選べます';
  return {ref,characterId,moveId,index,name:move.name,kind:move.kind,supported:!reason,reason,
    compatibility:characterId===baseId?'native-rig':move.kind==='projectile'?'retargeted-projectile':'measured-foreign-melee',
    ...(p2?.supported?{p2Version:p2.version,targetAppearanceKey:p2.targetAppearanceKey}:{}),
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
function validateMeasurement(value,label,baseId,styleId,definition) {
  check(value&&value.source==='runtime-skinned-mesh',label+'のスキン後接触計測が必要です');
  for(const slot of Object.keys(NORMAL_CONTACTS.moguzo)){
    const m=value.normals?.[slot];
    check(m&&Number.isFinite(m.reach)&&m.reach>=0&&validNormalStrikeHeight(slot,m.height,.02)&&
      Number.isFinite(m.contact)&&Number.isFinite(m.contactEnd)&&m.contact>0&&m.contactEnd>m.contact&&m.contactEnd<1&&
        // A grounded sweep's centre may finish below root while its existing
        // strike circle still intersects ground (v15 Bullet tail: -0.0259m).
        // Keep the measured sign; reject a circle entirely below that plane.
      validNormalActiveTrajectory({...m,slot},{expectedActive:normalMove(baseId,slot).active,
        requiredActives:value.normalSampling==='exact-style-active-frames'||m.battleActive!==undefined?[normalMove(styleId,slot).active]:[],
        minLegacySamples:2,groundTolerance:NORMAL_STRIKE_RADIUS}),label+'の通常技計測が不正: '+slot);
  }
  for(const stance of ['stand','crouch']){
    const b=value.hurtBounds?.[stance];
    check(b&&Number.isFinite(b.bottom)&&Number.isFinite(b.top)&&b.bottom>=-.02&&b.top>b.bottom,label+'の被弾範囲が不正');
  }
  const socket=value.projectileSocket;
  check(socket&&Number.isFinite(socket.forward)&&socket.forward>=0&&socket.forward<1&&Number.isFinite(socket.height)&&socket.height>0&&socket.height<1.5,label+'の発射位置が不正');
  for(const [ref,socket]of Object.entries(value.projectileSockets??{})){
    check(parseMoveRef(ref)&&Number.isFinite(socket.forward)&&Math.abs(socket.forward)<2&&Number.isFinite(socket.height)&&socket.height>=-CUSTOM_PROJECTILE_RADIUS&&socket.height<2,label+'の技別発射位置が不正: '+ref);
  }
  for(const [ref,row]of Object.entries(value.specialContacts??{})){
    const parsed=parseMoveRef(ref),move=parsed&&specialMove(parsed.characterId,parsed.index);
    check(row&&parsed&&row.ref===ref&&row.sourceCharacterId===parsed.characterId&&row.sourceMoveId===parsed.moveId&&
      row.clip===parsed.moveId+'_v17'&&row.motionVersion==='v17'&&typeof row.sourceVersion==='string'&&
      row.source==='runtime-skinned-mesh'&&row.sampling==='exact-clip-clock'&&row.status==='ok'&&
      Number.isFinite(row.contactSeconds)&&row.contactSeconds>0&&Math.abs(row.sampledContactSeconds-row.contactSeconds)<.00002&&
      Number.isFinite(row.reach)&&Number.isFinite(row.height)&&row.activeFrameCount===move.active&&
      Array.isArray(row.activeReach)&&row.activeReach.length>=move.active&&row.activeReach.every((p,i,all)=>
        Number.isFinite(p.phase)&&p.phase>=0&&p.phase<=1&&(!i||p.phase>all[i-1].phase)&&Number.isFinite(p.reach)&&Number.isFinite(p.height))&&
      Array.from({length:move.active},(_,frame)=>frame/Math.max(1,move.active-1)).every(phase=>row.activeReach.some(p=>Math.abs(p.phase-phase)<1e-6)),
      label+'の必殺技接触計測が不正: '+ref);
    if(parsed.characterId!==baseId&&move.kind!=='projectile'){
      const compatible=p2MeleeCompatibility(definition,ref,{sourceVersion:row.sourceVersion});
      check(compatible.supported&&row.visualRigId===baseId&&row.targetAppearanceKey===p2AppearanceKey(definition)&&
        row.retargetCompatibilityVersion===P2_MELEE_COMPATIBILITY_VERSION,label+'の異骨格近接は現在の実パーツで再計測が必要です: '+ref);
    }
  }
  return value;
}
function baseMeasurement(definition) {
  const id=definition.appearance.baseId;
  check(ACTIVE_NORMAL_MOTION_VERSION!=='v17'||definition.combat.styleId===id,'別スタイルの自キャラは実持続フレームの接触計測後に対戦できます');
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
    const customSpecialContact=fighter.customMeasurement?.specialContacts?.[ref];
    const projectileSocket=fighter.customMeasurement?.projectileSockets?.[ref]??customSpecialContact?.projectileSocket;
    return {...specialMove(compatibility.characterId,compatibility.index),customRef:ref,
      sourceCharacterId:compatibility.characterId,sourceMoveId:compatibility.moveId,
      ...(customSpecialContact?{customSpecialContact}:{}),...(projectileSocket?{projectileSocket}:{}),
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
    const foreign=definition.combat.specials.filter(ref=>{const parsed=parseMoveRef(ref);return parsed.characterId!==definition.appearance.baseId&&specialMove(parsed.characterId,parsed.index).kind!=='projectile';});
    check(foreign.every(ref=>options.measurements?.[i]?.specialContacts?.[ref]),'異骨格近接はリターゲット後の全持続フレームを実スキン計測してから対戦できます');
    if(options.measurements?.[i])return validateMeasurement(options.measurements[i],i?'相手':'自キャラ',definition.appearance.baseId,definition.combat.styleId,definition);
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
      return projectile.y+CUSTOM_PROJECTILE_RADIUS>=target.y+bounds.bottom&&projectile.y-CUSTOM_PROJECTILE_RADIUS<=target.y+bounds.top;
    },
    customAgain:old=>createCustomBattle(...definitions.map((definition,i)=>definition??raws[i]),old.level,options)
  });
  for(let i=0;i<2;i++)if(definitions[i]){
    Object.assign(battle.fighters[i],{definition:definitions[i],visualRigId:definitions[i].appearance.baseId,customMeasurement:measurements[i],displayName:definitions[i].name});
  }
  battle.customDefinitions=definitions;
  const nativeTick=battle.tick;
  battle.tick=function(raw1={},raw2=null){
    if(raw2===null&&this.fighters[1].definition){
      // Battle chooses its CPU input after incrementing the simulation frame.
      // Keep its exact policy/cadence, gating only a newly equipped P2 melee
      // in the old far-range projectile slot against its own measured surface.
      raw2=customCpuInput({...this,frame:this.frame+1},this.fighters[1],this.fighters[0],this.level);
    }
    return nativeTick.call(this,raw1,raw2);
  };
  return battle;
}

export function customCpuInput(game,fighter,target,level=game.level){
  const input=cpuInput(game,fighter,target,level);
  if(input.special1&&fighter.definition){
    const move=customMoveFor(fighter,'s1',null);
    if(move?.customCompatibility==='measured-foreign-melee'&&game.canReachSpecial(fighter,target,0)===false)delete input.special1;
  }
  return input;
}

export {createDefaultAvatar};
