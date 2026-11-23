// Verified native route fixtures and a future practice-guide candidate.
// No production UI or CPU policy is changed by importing this audit module.
import {ROSTER} from './balance.js';
import {ACTIVE_NORMAL_MOTION_VERSION} from './normal-contact-source.js';
import {APPROVED_P3_SPECIAL_MOTION_VERSION} from './special-motion-overrides-p3.js';
export const P3_COMBO_FINISHERS=Object.freeze({moguzo:'s1',pisuke:'s3',godan:'s3',hakuma:'s1',chirka:'s3',takimaru:'s2',yomikage:'s1',bullet:'s3',dark_moguzo:'s3'});
export function practiceRouteFor(id,{normalVersion=ACTIVE_NORMAL_MOTION_VERSION,specialVersion=APPROVED_P3_SPECIAL_MOTION_VERSION}={}){
 if(!ROSTER[id])throw Error('unknown practice fighter '+id);
 const finisher=normalVersion==='v17'&&specialVersion==='v17r2'?P3_COMBO_FINISHERS[id]:'s2';
 const direction={s1:'必殺',s2:'↑＋必殺',s3:'前＋必殺'}[finisher];
 return {finisher,name:ROSTER[id].specials[+finisher[1]-1].name,distance:.35,
  text:`近距離：弱 → 強 → ${direction}（${ROSTER[id].specials[+finisher[1]-1].name}）。ヒット確認後、停止が解けたら入力。壁際の密着は弱 → 強 → ↑＋必殺も狙える。`};
}
