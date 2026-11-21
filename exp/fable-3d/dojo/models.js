// 造形差し替えの唯一の接続点。モデルと対戦データは完全分離。
// GLBの差し替え: 対象パスと revision を更新すれば戦闘ロジックは変更不要。
export const MODEL_REVISION = 'r9-20261121';
export const MODEL_IDS = Object.freeze(['moguzo','pisuke','godan','hakuma','chirka','takimaru','yomikage','bullet','dark_moguzo']);
export const MODEL_ASSETS = Object.freeze(Object.fromEntries(MODEL_IDS.map(id => [id,
  Object.freeze({ glb:`../chars/${id}/${id}.glb`, motion:`../chars/${id}/${id}_motions.json`,
    portrait:`../../../assets/ui/facesq_${id}.png`, hero:`../../../assets/roster3d/${id}.webp` })
])));
export const FALLBACK_CLIPS = Object.freeze({
  stand_weak:'stand_light',stand_heavy:'stand_heavy',
  crouch_weak:'stand_light',crouch_heavy:'stand_heavy',
  air_weak:'stand_light',air_heavy:'stand_heavy',
  throw:'stand_heavy',ultimate:'stand_heavy',
  s1:'stand_heavy',s2:'stand_heavy',s3:'stand_heavy'
});
export function chooseClip(fighter, available=[]) {
  if (fighter.ko) return available.includes('hurt_light')?'hurt_light':'idle';
  if (fighter.stun && fighter.state==='block') return available.includes('guard_stand')?'guard_stand':'idle';
  if (fighter.stun) return available.includes('hurt_light')?'hurt_light':'idle';
  if (fighter.action) {
    const m=fighter.action;
    const exact=m.anim||FALLBACK_CLIPS[m.id]||'stand_heavy';
    return available.includes(exact)?exact:(available.includes(FALLBACK_CLIPS[m.id])?FALLBACK_CLIPS[m.id]:'stand_heavy');
  }
  const states={dash:'dash_f',walk_f:'walk_f',walk_b:'walk_b',crouch:'crouch',jump:'jump_n',block:'guard_stand',hit:'hurt_light'};
  const wanted=states[fighter.state]||'idle';
  return available.includes(wanted)?wanted:'idle';
}
