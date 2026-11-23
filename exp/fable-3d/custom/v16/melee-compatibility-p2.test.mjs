import test from 'node:test';import assert from 'node:assert/strict';
import {createDefaultAvatar} from './avatar-schema.js';
import {compatibilityForMove,validateCombatLoadout,createCustomBattle} from './custom-combat.js';
import {p2MeleeCompatibility,p2AppearanceKey,P2_MELEE_REFS,P2_MELEE_TARGETS,P2_MELEE_MESH_PROFILES} from './melee-compatibility-p2.js';
test('P2 melee catalogue opens only explicit measured source/body pairs and keeps a failed heavy kick closed',()=>{
 let accepted=0;for(const baseId of P2_MELEE_TARGETS)for(const ref of P2_MELEE_REFS){
  const def=createDefaultAvatar(baseId),entry=p2MeleeCompatibility(def,ref);
  assert.equal(entry.supported,!(baseId==='godan'&&ref==='pisuke.s3'));
  if(entry.supported){accepted++;assert.equal(entry.identity.runtimeClip,'s3_v17');assert.equal(entry.sourceVersion,'v17-p3-specials-r2');}
  else assert.match(entry.reason,/支持足/);
 }
 assert.equal(accepted,8);
 const unknown=createDefaultAvatar('pisuke');assert.equal(p2MeleeCompatibility(unknown,'godan.s3').supported,false);
 for(const ref of ['godan.s1','godan.s2','takimaru.s3','yomikage.s3','bullet.s2','bullet.s3'])assert.equal(p2MeleeCompatibility(createDefaultAvatar('moguzo'),ref).supported,false);
});
test('P2 foreign melee rejects unmeasured physical donors and keeps source version and geometry signatures explicit',()=>{
 const def=createDefaultAvatar('moguzo'),original=p2AppearanceKey(def);
 def.appearance.meshParts={hands:'moguzo'};assert.equal(p2AppearanceKey(def),original);assert.equal(p2MeleeCompatibility(def,'godan.s3').supported,true);
 def.appearance.meshParts.hands='godan';assert.equal(p2MeleeCompatibility(def,'godan.s3').supported,false);assert.notEqual(p2AppearanceKey(def),original);
 delete def.appearance.meshParts;
 assert.equal(p2MeleeCompatibility(def,'godan.s3',{sourceVersion:null}).supported,false);
 def.appearance.parts.feet='pisuke';assert.equal(p2MeleeCompatibility(def,'godan.s3').supported,false);
});
test('P2 saves the selected supported skill but never starts foreign melee with canonical-only collision data',()=>{
 const def=createDefaultAvatar('moguzo');def.combat.specials[0]='godan.s3';
 assert.equal(validateCombatLoadout(def).ok,true);assert.equal(compatibilityForMove(def,'godan.s3').compatibility,'measured-foreign-melee');
 assert.throws(()=>createCustomBattle(def,'pisuke'),/全持続フレーム/);
 const saved=JSON.parse(JSON.stringify(def));assert.equal(saved.combat.specials[0],'godan.s3');
 assert.equal(compatibilityForMove(def,'bullet.s3').supported,false);
 assert.equal(compatibilityForMove(def,'yomikage.s3').supported,false);
});

test('P2 opens only the three independently measured physical module profiles',()=>{
 for(const baseId of P2_MELEE_TARGETS){const def=createDefaultAvatar(baseId);def.appearance.meshParts={...P2_MELEE_MESH_PROFILES[baseId]};
  assert.equal(p2MeleeCompatibility(def,'godan.s3').supported,true);assert.equal(p2MeleeCompatibility(def,'chirka.s3').supported,true);
  assert.equal(p2MeleeCompatibility(def,'pisuke.s3').supported,baseId!=='godan');
  def.appearance.meshParts.ears='chirka';assert.equal(p2MeleeCompatibility(def,'godan.s3').supported,false);
 }
});
