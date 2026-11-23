import {specialSourceIdentity} from '../../dojo/special-motion-contract-p3.js';

// Explicit initial P2 tranche. This is not permission for arbitrary foreign
// strikes, throws, counters or tails. Every equipped strike still needs its
// own post-retarget skin measurements before Battle can start it.
export const P2_MELEE_COMPATIBILITY_VERSION='p2-melee-contact-r1';
export const P2_MELEE_SOURCE_VERSION='v17-p3-specials-r2';
export const P2_MELEE_TARGETS=Object.freeze(['moguzo','godan','bullet']);
export const P2_MELEE_REFS=Object.freeze(['godan.s3','chirka.s3','pisuke.s3']);
// The three published host-bound module profiles; unrelated donor combinations
// remain closed. The same clone grounding + per-avatar measurements are required.
export const P2_MELEE_MESH_PROFILES=Object.freeze({moguzo:Object.freeze({head:'godan'}),godan:Object.freeze({hands:'bullet'}),bullet:Object.freeze({feet:'moguzo'})});
const PARTS=['head','ears','tail','hands','feet','accessory'];
const normalized=(value,baseId)=>value===undefined||value==='base'||value===baseId?'base':value;
export function p2AppearanceKey(raw){
 const appearance=raw?.appearance??raw,baseId=appearance?.baseId;
 return JSON.stringify({baseId,parts:Object.fromEntries(PARTS.map(slot=>[slot,normalized(appearance?.parts?.[slot],baseId)])),
  meshParts:Object.fromEntries(Object.entries(appearance?.meshParts??{}).sort(([a],[b])=>a.localeCompare(b)).map(([slot,value])=>[slot,normalized(value,baseId)]).filter(([,value])=>value!=='base'))});
}
export function p2MeleeCompatibility(raw,ref,{sourceVersion=P2_MELEE_SOURCE_VERSION}={}){
 const appearance=raw?.appearance??raw,baseId=appearance?.baseId;
 const fail=reason=>({supported:false,reason,ref,baseId,compatibility:'unverified-foreign-melee'});
 if(!P2_MELEE_REFS.includes(ref))return fail('この異骨格の打撃・投げ・当身は未対応です');
 if(!P2_MELEE_TARGETS.includes(baseId))return fail('この骨格への近接移植は全持続フレームの接触・接地を確認中です');
 if(ref==='pisuke.s3'&&baseId==='godan')return fail('この蹴りは重量骨格で支持足が安定しないため未対応です。別の近接技か飛び道具を選んでください');
 if(sourceVersion!==P2_MELEE_SOURCE_VERSION)return fail('この技は確認済みv17r2モーションの接触時計で対応します');
 for(const slot of ['hands','feet'])if(normalized(appearance.parts?.[slot],baseId)!=='base')return fail('この寸法変更の手足と異骨格近接は未検証です。元の手足か対応済みドナーメッシュを選んでください');
 if(Object.entries(appearance.meshParts??{}).some(([slot,value])=>normalized(value,baseId)!=='base'&&P2_MELEE_MESH_PROFILES[baseId]?.[slot]!==value))return fail('この実ドナーメッシュと異骨格近接の組み合わせは接触・接地を確認中です');
 const [sourceCharacterId,sourceMoveId]=ref.split('.'),identity=specialSourceIdentity(sourceVersion,sourceCharacterId,sourceMoveId);
 return Object.freeze({supported:true,reason:'',ref,baseId,sourceCharacterId,sourceMoveId,sourceVersion,
  compatibility:sourceCharacterId===baseId?'native-rig':'measured-foreign-melee',version:P2_MELEE_COMPATIBILITY_VERSION,
  identity:Object.freeze(identity),targetAppearanceKey:p2AppearanceKey(appearance),requiredBones:Object.freeze(['pelvis','chest','head'])});
}
