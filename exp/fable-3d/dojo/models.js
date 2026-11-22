// 造形差し替えの唯一の接続点。モデルと対戦データは完全分離。
// GLBの差し替え: 対象パスと revision を更新すれば戦闘ロジックは変更不要。
export const MODEL_REVISION = 'motion-v2-20261121';
export const MODEL_IDS = Object.freeze(['moguzo','pisuke','godan','hakuma','chirka','takimaru','yomikage','bullet','dark_moguzo']);
export const MODEL_ASSETS = Object.freeze(Object.fromEntries(MODEL_IDS.map(id => [id,
  Object.freeze({ glb:`../chars/${id}/${id}.glb`, motion:`../chars/${id}/${id}_motions.json`,
    portrait:`../../../assets/ui/facesq_${id}.png`, hero:`../../../assets/roster3d/${id}.webp` })
])));
export const FALLBACK_CLIPS = Object.freeze({
  stand_weak:'stand_light',stand_heavy:'stand_heavy',
  crouch_weak:'stand_light',crouch_heavy:'stand_heavy',
  air_weak:'stand_light',air_heavy:'stand_heavy',
  throw:'stand_heavy',roar:'guard_stand',gyuiin:'stand_heavy',ultimate:'stand_heavy',
  s1:'stand_heavy',s2:'stand_heavy',s3:'stand_heavy'
});
// Claudeの追加モーション名に優先対応。未追加のGLBでも既存の11クリップで再生可能。
const select=(available, list)=>list.find(name=>available.includes(name))||'idle';
const actionClips={
  crouch_weak:'crouch_light',crouch_heavy:'crouch_heavy',
  air_weak:'air_light',air_heavy:'air_heavy',throw:'throw_reach'
};
export function chooseClip(fighter, available=[], commandMap={}) {
  if (fighter.ko) return select(available,['ko','down','hurt_heavy','hurt_light','idle']);
  if(fighter.state==='throw_hit')return select(available,['throw_hit','throw_reach','stand_heavy','idle']);
  if(fighter.state==='thrown')return select(available,['thrown','hurt_heavy','hurt_light','idle']);
  if(fighter.state==='land' || (fighter.landF>0&&!fighter.action&&!fighter.stun))
    return select(available,['land','idle']);
  if(fighter.state==='wakeup')return select(available,['wakeup','idle']);
  if (fighter.state==='clinch') return select(available,['clinch_hold','gyuiin_hold','guard_stand','idle']);
  if (fighter.state==='clinch_recoil') return select(available,['clinch_recoil','hurt_heavy','hurt_light','idle']);
  if (fighter.stun && fighter.state==='block') {
    return select(available,[fighter.reaction,'guard_hit',fighter.input?.down?'guard_crouch':'guard_stand',
      'guard_stand','idle'].filter(Boolean));
  }
  if (fighter.stun) return select(available,[fighter.reaction,'hurt_heavy','hurt_light','idle'].filter(Boolean));
  if (fighter.action) {
    const m=fighter.action;
    const exact=m.anim||FALLBACK_CLIPS[m.id]||'stand_heavy';
    const notation={s1:'236',s2:'623',s3:'214',ultimate:'236236'}[m.id];
    const mapped=notation?commandMap[notation]:null;
    // Nine individual real v15 normal-move clips take priority over generic inherited normals.
    const authored=/^(stand|crouch|air)_(weak|heavy)$/.test(m.id||'')?'v15_'+m.id:null;
    const list=[authored,actionClips[m.id],mapped,exact].filter(Boolean);
    if (m.kind==='roar') list.push('roar','roar_burst','guard_stand');
    if (m.kind==='clinch') list.push('gyuiin','gyuiin_approach','guard_stand');
    if (m.kind==='throw') list.push('throw_reach','grab','stand_heavy');
    list.push(FALLBACK_CLIPS[m.id]||'stand_heavy','idle');
    return select(available,list);
  }
  if (fighter.state==='block') return select(available,['guard_stand','idle']);
  // 後ろ＋下の間は立ちガードではなく、しゃがみガード姿勢を保持。
  if(fighter.state==='crouch'&&fighter.input?.down&&
    (fighter.facing===1?fighter.input?.left:fighter.input?.right))
    return select(available,['guard_crouch','crouch','idle']);
  const states={dash:fighter.dashDir&&fighter.dashDir!==fighter.facing?['dash_b','walk_b']:['dash_f','walk_f'],
    walk_f:['walk_f'],walk_b:['walk_b'],
    crouch:['crouch'],jump:['jump_n'],hit:['hurt_light']};
  return select(available,[...(states[fighter.state]||[]),'idle']);
}
