import test from 'node:test';
import assert from 'node:assert/strict';
import {IDS,normalMove} from './balance.js';
import {NORMAL_CONTACTS as BASE} from './normal-contacts-v151.js';
import {NORMAL_SLOTS} from './normal-motifs-v15.js';
import {createP3ContactDelivery,validateP3ContactDelivery} from './p3-contact-adapter.js';
import {ACTIVE_NORMAL_MOTION_VERSION,NORMAL_CONTACTS} from './normal-contact-source.js';
import {APPROVED_P3_CONTACT_DELIVERY} from './normal-contact-overrides-p3.js';
import {normalClipTime} from './normal-timing-v151.js';

// Validation fixture only. These synthetic authored clocks are not a Claude
// asset or an assertion that v17 meshes have been measured or approved.
function fixture(){
 const metadata={version:'unit-test-fixture-not-art',characters:{}},measurements={source:'runtime-skinned-mesh',characters:{}};
 const names={armL:'pawL',armR:'pawR',legL:'footL',legR:'footR',tail:'tail',head:'head',body:'body'};
 for(const id of IDS){metadata.characters[id]={};measurements.characters[id]={};for(const slot of NORMAL_SLOTS){
  const base=BASE[id][slot];
  metadata.characters[id][slot]={clip:'v17_'+slot,character:id,game_action:slot,fps:60,frames:100,duration_sec:100/60,
   contact_frame:30,contact_hold_frames:10,contact:.3,contact_end:.4,attack_limb:names[base.attackPart],name_jp:'test'};
  measurements.characters[id][slot]={...structuredClone(base),contact:.3,contactEnd:.4};
 }}return {metadata,measurements};
}
test('authored contact clock alone cannot become a measured P3 hitbox',()=>{
 const {metadata,measurements}=fixture();
 assert.throws(()=>createP3ContactDelivery(metadata,{characters:measurements.characters}),/skinned-mesh/);
 delete measurements.characters.moguzo.stand_weak;
 assert.throws(()=>createP3ContactDelivery(metadata,measurements),/measured attack part/);
});
test('v17 handoff requires 54 aligned measured active trajectories and identity',()=>{
 const {metadata,measurements}=fixture(),delivery=createP3ContactDelivery(metadata,measurements);
 assert.equal(Object.values(delivery.characters).flatMap(Object.values).length,54);
 assert.equal(validateP3ContactDelivery(delivery),delivery);
 const wrongClock=structuredClone(metadata);wrongClock.characters.godan.stand_heavy.contact=.8;
 assert.throws(()=>createP3ContactDelivery(wrongClock,measurements),/normalized clock/);
 const wrongPart=structuredClone(measurements);wrongPart.characters.godan.stand_heavy.attackPart='tail';
 assert.throws(()=>createP3ContactDelivery(metadata,wrongPart),/intended limb/);
 const badSurface=structuredClone(measurements);badSurface.characters.bullet.stand_heavy.activeReach[1].reach=NaN;
 assert.throws(()=>createP3ContactDelivery(metadata,badSurface),/active surface/);
 const incomplete=structuredClone(delivery);delete incomplete.characters.dark_moguzo.air_heavy;
 assert.throws(()=>validateP3ContactDelivery(incomplete),/missing reviewed row/);
});
test('only a measured approved override selects v17; custom pose clocks remain authoritative',()=>{
 if(APPROVED_P3_CONTACT_DELIVERY){assert.equal(ACTIVE_NORMAL_MOTION_VERSION,'v17');assert.equal(NORMAL_CONTACTS,APPROVED_P3_CONTACT_DELIVERY.characters);}
 else{assert.equal(ACTIVE_NORMAL_MOTION_VERSION,'v15');assert.equal(NORMAL_CONTACTS,BASE);}
 const move={...normalMove('moguzo','stand_weak'),customContact:{contact:.61,contactEnd:.73}};
 assert.equal(normalClipTime('moguzo','stand_weak',move.startup,move,2),1.22);
 assert.equal(normalClipTime('moguzo','stand_weak',move.startup+move.active-1,move,2),1.46);
});
