// P3 AI candidate, not the user's final tuning. Only the hitstun column changes.
// Near-range projectile disadvantage, counter and paired throw clocks stay as
// before. These values do not lengthen reach or hide startup/recovery risk.
export const SPECIAL_HITSTUN_P3=Object.freeze({
 moguzo:Object.freeze([null,34,24]),
 pisuke:Object.freeze([null,30,29]),
 godan:Object.freeze([34,38,40]),
 hakuma:Object.freeze([30,31,34]),
 chirka:Object.freeze([24,31,27]),
 takimaru:Object.freeze([null,35,null]),
 yomikage:Object.freeze([null,32,null]),
 bullet:Object.freeze([null,33,30]),
 dark_moguzo:Object.freeze([null,38,32])
});
export function specialHitstunP3(id,index){return SPECIAL_HITSTUN_P3[id]?.[index]??undefined;}
