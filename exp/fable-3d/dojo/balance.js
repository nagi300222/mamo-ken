// マモ拳3D 対戦バランス v0.1 — すべて仮値。60Hz、距離はモデルのm単位。
export const FPS = 60;
export const ARENA = Object.freeze({ minX: -1.76, maxX: 1.76, pushRadius: 0.17, gravity: 0.0062, roundSeconds: 75 });
const S = (name, kind, startup, active, recovery, damage, reach, extra = {}) =>
  Object.freeze({ name, kind, startup, active, recovery, damage, reach, ...extra });
const C = (name, role, hp, walk, dash, jump, power, ability, specials, ultimate, extra = {}) =>
  Object.freeze({ name, role, hp, walk, back: +(walk * .8).toFixed(5), dash, jump, power,
    ability, specials, ultimate, ...extra });
export const ROSTER = Object.freeze({
  moguzo: C('モグゾー', '万能・根性', 1000, .016, .27, .095, 1, 'guts', [
    S('大地の波', 'projectile', 13, 2, 20, 57, .42, { speed: .040, life: 85, effect:'earth' }),
    S('昇り拳', 'anti', 6, 8, 26, 95, .40, { anim: 'sp_rising_upper', invul: 4 }),
    S('地走り', 'dash', 12, 5, 19, 75, .51, { travel: .32 })
  ], S('大地烈掌', 'super', 8, 10, 32, 205, .79, { anim: 'sp_rising_upper' })),
  pisuke: C('ピスケ', '高速・チェイス', 850, .025, .36, .102, .88, 'chase', [
    S('風の気弾', 'projectile', 11, 1, 17, 38, .3, { speed: .035, life: 28, effect:'wind' }),
    S('空牙蹴り', 'anti', 6, 8, 22, 70, .36, { anim: 'sp_double_kick' }),
    S('連脚', 'dash', 7, 9, 20, 75, .47, { travel: .38, anim:'sp_double_kick' })
  ], S('音速連咆', 'super', 5, 12, 27, 173, .72, { anim:'sp_double_kick' })),
  godan: C('ゴダン', '重量・装甲', 1230, .0115, .20, .092, 1.18, 'armor', [
    S('肩当て突進', 'dash', 15, 8, 24, 115, .57, { travel: .34, armor: 1, anim:'sp_shoulder_charge' }),
    S('岩砕き', 'anti', 9, 8, 27, 115, .42, { armor: 1 }),
    S('重圧踏み', 'strike', 18, 5, 26, 100, .63, { armor: 1, level:'low' })
  ], S('山崩し', 'super', 10, 9, 38, 250, .65, { anim:'sp_shoulder_charge' })),
  hakuma: C('ハクマ', '守勢・鉄壁', 1150, .0125, .19, .092, 1.04, 'iron_wall', [
    S('雪壁掌', 'strike', 11, 6, 22, 81, .56, { anim:'sp_harite' }),
    S('白峰対空', 'anti', 8, 7, 24, 85, .43, { anim:'sp_harite' }),
    S('連続突っ張り', 'dash', 12, 9, 25, 100, .55, { travel:.20, anim:'sp_harite' })
  ], S('白峰不動掌', 'super', 11, 10, 34, 210, .72, { anim:'sp_harite' })),
  chirka: C('チルカ', '奇襲・毒', 860, .022, .31, .102, .9, 'poison', [
    S('影毒の気弾', 'projectile', 14, 1, 21, 36, .4, { speed:.027, life:43, poison: 1, effect:'violet' }),
    S('影引き爪', 'anti', 7, 7, 27, 73, .42, { anim:'sp_feint_claw', poison:1 }),
    S('惑わし足', 'dash', 10, 6, 18, 61, .48, { travel:.35, poison:1, anim:'sp_feint_claw' })
  ], S('百面本命打ち', 'super', 9, 11, 30, 186, .72, { poison:1, anim:'sp_feint_claw' })),
  takimaru: C('タキマル', '投げ・接近', 1160, .014, .22, .093, 1.12, 'pressure', [
    S('地鳴り波', 'projectile', 19, 1, 26, 52, .36, { speed:.027, life:49, effect:'earth' }),
    S('抱え上げ', 'anti', 9, 8, 27, 90, .43, { anim:'sp_bear_grab' }),
    S('抱え込み', 'throw', 8, 3, 37, 125, .31, { anim:'sp_bear_grab' })
  ], S('天地大回転', 'super', 13, 8, 35, 240, .43, { kind:'throw', anim:'sp_bear_grab' })),
  yomikage: C('ヨミカゲ', '反撃・入替', 945, .019, .30, .098, .96, 'just', [
    S('残月の波', 'projectile', 12, 1, 19, 50, .39, { speed:.054, life:66, effect:'blue' }),
    S('受け返し', 'counter', 6, 20, 19, 97, .50, { anim:'sp_counter' }),
    S('影越え', 'dash', 10, 6, 20, 58, .47, { travel:.48, sideSwitch:1 })
  ], S('後の先・月断', 'super', 7, 10, 33, 207, .65, { anim:'sp_counter' })),
  bullet: C('バレット', '長射程・長尾', 895, .014, .23, .096, .88, 'charge', [
    S('尾薙ぎ', 'tail', 19, 6, 23, 107, .651, { minReach:.27, anim:'sp_tail_whip', dynamicTail:1 }),
    S('木の実弾', 'projectile', 15, 1, 25, 54, .40, { speed:.049, life:88, effect:'amber' }),
    S('尾跳ね', 'anti', 8, 8, 23, 79, .49, { anim:'sp_tail_whip' })
  ], S('超圧縮・弾丸頭突き', 'super', 12, 9, 34, 220, .90, { anim:'sp_tail_whip' })),
  dark_moguzo: C('ダークモグゾー', '高火力・低耐久', 815, .024, .34, .102, 1.15, 'dark_chain', [
    S('黒い地走波', 'projectile', 11, 1, 19, 55, .42, { speed:.049, life:80, effect:'violet' }),
    S('逆昇撃', 'anti', 5, 8, 31, 102, .45, { anim:'sp_dark_rush' }),
    S('暗連', 'dash', 7, 9, 24, 88, .52, { travel:.39, anim:'sp_dark_rush' })
  ], S('暗連・黒天烈掌', 'super', 5, 13, 32, 223, .76, { anim:'sp_dark_rush' }))
});
export const IDS = Object.freeze(Object.keys(ROSTER));
const BASE_NORMAL = Object.freeze({
  stand_weak:  { startup:5, active:3, recovery:12, damage:38, reach:.39, level:'mid', anim:'stand_light' },
  stand_heavy: { startup:11, active:4, recovery:21, damage:80, reach:.54, level:'mid', anim:'stand_heavy' },
  crouch_weak: { startup:6, active:3, recovery:13, damage:32, reach:.39, level:'low', anim:'stand_light' },
  crouch_heavy:{ startup:12, active:4, recovery:23, damage:76, reach:.57, level:'low', anim:'stand_heavy' },
  air_weak:   { startup:6, active:5, recovery:12, damage:39, reach:.42, level:'air', anim:'stand_light' },
  air_heavy:  { startup:10,active:6, recovery:17, damage:77, reach:.49, level:'air', anim:'stand_heavy' }
});
export function normalMove(id, slot) {
  const r=ROSTER[id], m=BASE_NORMAL[slot];
  if (!r || !m) throw Error('unknown normal: '+id+'/'+slot);
  const offset = id==='pisuke'||id==='chirka'||id==='dark_moguzo'?-1:
                 id==='godan'||id==='hakuma'||id==='takimaru'?2:0;
  return { ...m, name: slot, kind:'strike', startup:Math.max(3,m.startup+offset),
    recovery:m.recovery, damage:Math.round(m.damage*r.power),
    reach:m.reach+(id==='bullet'? .11 : id==='godan'||id==='takimaru'? .05:0),
    knockback:slot.includes('heavy')?.14:.08 };
}
export function specialMove(id, index) {
  const r=ROSTER[id]; if (!r) throw Error('unknown fighter '+id);
  const m=r.specials[index];
  if (!m) throw Error('unknown special '+index);
  return { ...m, damage:Math.round(m.damage*r.power), level:m.level||'mid', specialIndex:index };
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
