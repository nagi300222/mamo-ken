// P3 candidate, not final user-approved balance. Movement, damage, active windows,
// cancel permissions and authored reach remain in their existing data tables.
// All values are simulation frames at 60 Hz; camera/FX consume the same outcome.
const CHARACTERS=Object.freeze({
 moguzo:{weak:5,heavy:8,special:[5,8,7],texture:'fist',weight:'balanced'},
 pisuke:{weak:4,heavy:7,special:[4,6,6],texture:'kick',weight:'light'},
 godan:{weak:6,heavy:10,special:[10,9,10],texture:'stone',weight:'heavy'},
 hakuma:{weak:6,heavy:9,special:[8,8,9],texture:'palm',weight:'heavy'},
 chirka:{weak:4,heavy:7,special:[6,6,7],texture:'claw',weight:'light'},
 takimaru:{weak:6,heavy:10,special:[5,8,10],texture:'palm',weight:'heavy'},
 yomikage:{weak:4,heavy:8,special:[5,7,9],texture:'elbow',weight:'precise'},
 bullet:{weak:5,heavy:9,special:[6,8,9],texture:'tail',weight:'ranged'},
 dark_moguzo:{weak:4,heavy:8,special:[5,8,7],texture:'fist',weight:'rush'}
});
export const FIGHT_FEEL_VERSION='P3-candidate-1';
export const FIGHT_FEEL_PROFILES=CHARACTERS;
const NORMAL=/^(stand|crouch|air)_(weak|heavy)$/;
export function fightFeelFor(characterId,moveId,move={}){
 const character=CHARACTERS[characterId];
 if(!character||(!NORMAL.test(moveId)&&!/^s[123]$/.test(moveId)))return null;
 const heavy=moveId.endsWith('_heavy')||(/^s[123]$/.test(moveId)&&move.kind!=='projectile');
 const frames=NORMAL.test(moveId)?character[moveId.endsWith('_weak')?'weak':'heavy']:character.special[Number(moveId[1])-1];
 const texture=move.kind==='tail'?'tail':move.kind==='projectile'?'projectile':
   (move.attackPart==='tail'?'tail':character.texture);
 const effect=texture==='claw'||texture==='elbow'?'slash':texture==='stone'?'shard':'hit';
 return {id:characterId+'.'+moveId,characterId,moveId,weight:character.weight,texture,heavy,
   hitstop:frames,guardstop:heavy?(character.weight==='heavy'?5:4):3,
   hitSound:move.kind==='projectile'?'contact_projectile':heavy?'contact_'+texture:'contact_light',
   guardSound:heavy?'guard_heavy':'guard_light',swingSound:move.kind==='projectile'?'projectile_cast':heavy?'swing_heavy':'swing_light',
   effect,scale:heavy?1.05:.68,lifeFrames:heavy?12:8,shake:heavy?.008:.002};
}
export function feedbackForMove(fighter,move,outcome,point){
 const characterId=move.sourceCharacterId??fighter.id,moveId=move.sourceMoveId??move.id;
 const profile=fightFeelFor(characterId,moveId,move);if(!profile)return null;
 const contact=outcome==='hit'||outcome==='guard';
 // Paired throws use their existing shared sequence clock. Their interruption
 // timing is not silently changed by adding an impact sound.
 const stopFrames=contact&&move.kind!=='throw'?(outcome==='guard'?profile.guardstop:profile.hitstop):0;
 return {...profile,outcome,stopFrames,
   sound:outcome==='hit'?profile.hitSound:outcome==='guard'?profile.guardSound:outcome==='swing'?profile.swingSound:null,
   effect:outcome==='guard'?'block':outcome==='hit'?profile.effect:null,
   scale:outcome==='guard'?.60:profile.scale,
   lifeFrames:outcome==='guard'?7:profile.lifeFrames,
   shake:contact?(outcome==='guard'?.0015:profile.shake):0,
   point:point?{...point}:null};
}
export function combatFeedback(event){return event?.feedback??null;}
export function presentCombatFeedback(event,{audio,impact,shake,effectsEnabled=true}={}){
 const feedback=combatFeedback(event);if(!feedback)return false;
 audio?.playFeedback(event);
 if(effectsEnabled&&feedback.effect&&feedback.point){
  impact?.(feedback);
  if(feedback.shake>0)shake?.(feedback.shake,feedback.lifeFrames);
 }
 // The consumer keeps semantic HUD/KO/counter-animation handling, but skips its
 // old generic impact sound/particle to avoid double audio for the same contact.
 return true;
}

// Original synthesis recipes: spectral envelope and texture, not just volume,
// distinguish a light hit, weighty hit, palm, claw, tail, guard and a clean miss.
export const IMPACT_SOUND_RECIPES=Object.freeze({
 contact_light:{ratio:1.05,duration:.065,level:.22,wave:'triangle'},
 contact_fist:{ratio:.58,duration:.14,level:.27,wave:'triangle'},
 contact_kick:{ratio:.72,duration:.105,level:.25,wave:'triangle'},
 contact_stone:{ratio:.37,duration:.19,level:.28,wave:'sawtooth',noise:{filter:'lowpass',cutoff:620,endCutoff:110}},
 contact_palm:{ratio:.45,duration:.13,level:.24,wave:'triangle',noise:{filter:'bandpass',cutoff:950,endCutoff:260}},
 contact_claw:{ratio:1.7,duration:.095,level:.20,wave:'triangle',noise:{filter:'highpass',cutoff:2400,endCutoff:1000}},
 contact_elbow:{ratio:.70,duration:.085,level:.23,wave:'square'},
 contact_tail:{ratio:.43,duration:.17,level:.25,wave:'triangle',noise:{filter:'lowpass',cutoff:780,endCutoff:180}},
 contact_projectile:{ratio:1.18,duration:.115,level:.21,wave:'sine'},
 guard_light:{ratio:1.6,duration:.055,level:.12,wave:'triangle'},
 guard_heavy:{ratio:1.08,duration:.10,level:.16,wave:'square'},
 swing_light:{ratio:1.4,duration:.055,level:.050,wave:'sine',noise:{filter:'bandpass',cutoff:2300,endCutoff:1400}},
 swing_heavy:{ratio:.9,duration:.095,level:.075,wave:'sine',noise:{filter:'bandpass',cutoff:1400,endCutoff:430}},
 projectile_cast:{ratio:1.8,duration:.10,level:.10,wave:'sine'}
});
