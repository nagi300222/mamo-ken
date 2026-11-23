// マモ拳3D 対戦バランス v0.5（固有能力・CPU再設計） — すべて仮値。60Hz、距離はモデルのm単位。
import {normalPerformance} from './normal-balance-v151.js';
import {NORMAL_CONTACTS,NORMAL_CONTACTS_VERSION,ACTIVE_NORMAL_MOTION_VERSION} from './normal-contact-source.js';
import {specialHitstunP3} from './special-balance-p3.js';
export const FPS = 60;
export const ARENA = Object.freeze({ minX: -1.76, maxX: 1.76, pushRadius: 0.17, gravity: 0.0062, roundSeconds: 75 });
const S = (name, kind, startup, active, recovery, damage, reach, extra = {}) =>
  Object.freeze({ name, kind, startup, active, recovery, damage, reach, ...extra });
const C = (name, role, hp, walk, dash, jump, power, ability, specials, ultimate, extra = {}) =>
  Object.freeze({ name, role, hp, walk, back: +(walk * .8).toFixed(5), dash, jump, power,
    ability, specials, ultimate, guardMax:extra.guardMax??100,...extra });
export const ROSTER = Object.freeze({
  moguzo: C('モグゾー', '万能・根性', 1000, .016, .27, .095, 1, 'guts', [
    S('大地の波', 'projectile', 13, 2, 20, 57, .42, { speed: .040, life: 85, effect:'earth' }),
    S('昇り拳', 'anti', 6, 8, 26, 95, .40, { anim: 'sp_rising_upper', invul: 4 }),
    S('地走り', 'dash', 12, 5, 19, 75, .51, { travel: .32 })
  ], S('大地烈掌', 'super', 8, 10, 32, 205, .79, { anim: 'sp_rising_upper' })),
  pisuke: C('ピスケ', '高速・チェイス', 900, .025, .36, .102, .92, 'chase', [
    S('風の気弾', 'projectile', 11, 1, 17, 38, .3, { speed: .035, life: 28, effect:'wind' }),
    S('空牙蹴り', 'anti', 6, 8, 22, 70, .36, { anim: 'sp_double_kick' }),
    S('連脚', 'dash', 7, 9, 20, 75, .47, { travel: .38, anim:'sp_double_kick' })
  ], S('音速連咆', 'super', 5, 12, 27, 173, .72, { anim:'sp_double_kick' }),{guardMax:90}),
  godan: C('ゴダン', '重量・装甲', 1110, .0115, .20, .092, 1.04, 'armor', [
    S('地割り', 'strike', 21, 5, 28, 90, .52, { level:'low' }),
    S('岩砕き', 'anti', 11, 7, 31, 105, .41, { armor:1 }),
    S('肩当て突進', 'dash', 18, 7, 32, 108, .56, { travel:.30, armor:1, anim:'sp_shoulder_charge' })
  ], S('山崩し', 'super', 10, 9, 38, 238, .65, { anim:'sp_shoulder_charge' }),{guardMax:94}),
  hakuma: C('ハクマ', '守勢・鉄壁', 1070, .0125, .19, .092, 1.00, 'iron_wall', [
    S('雪壁掌', 'strike', 11, 6, 22, 81, .56, { anim:'sp_harite' }),
    S('白峰対空', 'anti', 8, 7, 24, 85, .43, { anim:'sp_harite' }),
    S('連続突っ張り', 'dash', 12, 9, 25, 100, .55, { travel:.20, anim:'sp_harite' })
  ], S('白峰不動掌', 'super', 11, 10, 34, 210, .72, { anim:'sp_harite' }),{guardMax:112}),
  chirka: C('チルカ', '奇襲・フェイント', 920, .022, .31, .102, .92, 'feint_delay', [
    S('だまし突き', 'strike', 13, 4, 19, 69, .49, { feintable:true, delayable:true }),
    S('跳ね爪', 'anti', 8, 7, 25, 74, .42),
    S('影引き爪', 'dash', 13, 5, 22, 72, .50, { travel:.21,feintable:true,delayable:true,anim:'sp_feint_claw' })
  ], S('百面本命打ち', 'super', 9, 11, 30, 186, .72, { anim:'sp_feint_claw' }),{guardMax:91}),
  takimaru: C('タキマル', '投げ・接近', 1080, .014, .22, .093, 1.03, 'pressure', [
    S('大地走り', 'projectile', 20, 1, 30, 38, .34, { speed:.026, life:32, effect:'earth' }),
    S('抱え上げ', 'anti', 10, 7, 27, 80, .43),
    S('抱え込み', 'throw', 9, 3, 37, 108, .33, { anim:'sp_bear_grab' })
  ], S('天地落とし', 'super', 13, 8, 35, 228, .43, { kind:'throw', anim:'sp_bear_grab' }),{guardMax:102}),
  yomikage: C('ヨミカゲ', '反撃・見切り', 960, .019, .30, .098, .96, 'just', [
    S('残月の波', 'projectile', 13, 1, 23, 47, .38, { speed:.047, life:58, effect:'blue' }),
    S('昇り肘', 'anti', 8, 7, 25, 82, .43),
    S('受け返し', 'counter', 7, 13, 31, 83, .47, { anim:'sp_counter' })
  ], S('後の先・月断', 'super', 7, 10, 33, 207, .65, { anim:'sp_counter' }),{guardMax:95}),
  bullet: C('バレット', '長射程・長尾', 930, .014, .23, .096, .91, 'charge', [
    S('木の実弾', 'projectile', 17, 1, 28, 46, .39, { speed:.043, life:72, effect:'amber' }),
    S('尾跳ね', 'anti', 9, 7, 27, 79, .46),
    S('尾薙ぎ', 'tail', 19, 6, 23, 100, .651, { minReach:.27,anim:'sp_tail_whip',dynamicTail:1,chargeRelease:true })
  ], S('超圧縮・弾丸頭突き', 'super', 12, 9, 34, 220, .90, { anim:'sp_tail_whip' }),{guardMax:95}),
  dark_moguzo: C('ダークモグゾー', '高速連携・低耐久', 820, .024, .34, .102, .92, 'dark_chain', [
    S('黒い地走波', 'projectile', 11, 1, 19, 55, .42, { speed:.049, life:80, effect:'violet' }),
    S('逆昇撃', 'anti', 5, 8, 31, 102, .45, { anim:'sp_dark_rush' }),
    S('暗連', 'dash', 7, 9, 24, 88, .52, { travel:.39, anim:'sp_dark_rush' })
  ], S('暗連・黒天烈掌', 'super', 5, 13, 32, 223, .76, { anim:'sp_dark_rush' }),{guardMax:78})
});
export const IDS = Object.freeze(Object.keys(ROSTER));
export function normalMove(id, slot) {
  if (!ROSTER[id]) throw Error('unknown normal: '+id+'/'+slot);
  const motion=NORMAL_CONTACTS[id]?.[slot];
  if(!motion)throw Error('missing authored contact: '+id+'/'+slot);
  return {...normalPerformance(id,slot),reach:motion.reach,strikeHeight:motion.height,activeReach:motion.activeReach.map(p=>({...p})),
    name:slot,kind:'strike',normalVersion:ACTIVE_NORMAL_MOTION_VERSION==='v17'?NORMAL_CONTACTS_VERSION:'15.1'};
}
export function specialMove(id, index) {
  const r=ROSTER[id]; if (!r) throw Error('unknown fighter '+id);
  const m=r.specials[index];
  if (!m) throw Error('unknown special '+index);
  const hitstun=specialHitstunP3(id,index);
  return { ...m, damage:Math.round(m.damage*r.power), level:m.level||'mid', specialIndex:index,...(hitstun===undefined?{}:{hitstun}) };
}
export function ultimateMove(id) {
  const r=ROSTER[id]; return { ...r.ultimate, kind:r.ultimate.kind||'super',
    damage: Math.round(r.ultimate.damage*r.power), level:'mid', isSuper:true };
}
// 尾の実GLB由来 2Fごとの tip forward 座標（m）。戦闘中も同じ姿勢データから補間する。
// 出典: chars/bullet/bullet_motions.json sp_tail_whip.tail_tip_path F18-26
const TAIL = Object.freeze([[18,.168],[20,.447],[22,.611],[24,.651],[26,.624]]);
export function tailTipAt(frame) {
  if (frame<TAIL[0][0]) return TAIL[0][1];
  for (let i=1;i<TAIL.length;i++) if(frame<=TAIL[i][0]) {
    const [f0,x0]=TAIL[i-1], [f1,x1]=TAIL[i];
    return x0+(x1-x0)*(frame-f0)/(f1-f0);
  }
  return TAIL.at(-1)[1];
}
export function assertBalance() {
  if(IDS.length!==9) throw Error('need 9 fighters');
  for(const id of IDS) {
    const r=ROSTER[id]; if(r.specials.length!==3||!r.specials.some(s=>s.kind==='anti'||s.kind==='counter')) throw Error(id+' has no anti-air');
    for(const m of [...r.specials, r.ultimate]) if(m.startup<1||m.active<1||m.recovery<0||m.damage<1) throw Error('invalid move '+id);
  }
  return true;
}
