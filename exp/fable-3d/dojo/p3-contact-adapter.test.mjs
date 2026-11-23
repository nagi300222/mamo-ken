import test from 'node:test';
import assert from 'node:assert/strict';
import {IDS,normalMove} from './balance.js';
import {NORMAL_CONTACTS as BASE} from './normal-contacts-v151.js';
import {NORMAL_SLOTS} from './normal-motifs-v15.js';
import {createP3ContactDelivery,validateP3ContactDelivery,validNormalActiveTrajectory} from './p3-contact-adapter.js';
import {ACTIVE_NORMAL_MOTION_VERSION,NORMAL_CONTACTS} from './normal-contact-source.js';
import {APPROVED_P3_CONTACT_DELIVERY} from './normal-contact-overrides-p3.js';
import {normalClipTime} from './normal-timing-v151.js';
import {Battle} from './battle.js';
import {normalHeightAt} from './normal-contact-runtime-v151.js';

// Validation fixture only. These synthetic authored clocks are not a Claude
// asset or an assertion that v17 meshes have been measured or approved.
function fixture(){
 const metadata={version:'unit-test-fixture-not-art',characters:{}},measurements={source:'runtime-skinned-mesh',characters:{}};
 const names={armL:'pawL',armR:'pawR',legL:'footL',legR:'footR',tail:'tail',head:'head',body:'body'};
 for(const id of IDS){metadata.characters[id]={};measurements.characters[id]={};for(const slot of NORMAL_SLOTS){
  const base=BASE[id][slot];
  metadata.characters[id][slot]={clip:'v17_'+slot,character:id,game_action:slot,fps:60,frames:100,duration_sec:100/60,
   contact_frame:30,contact_hold_frames:10,contact:.3,contact_end:.4,attack_limb:base.bothHands?'pawL+pawR':names[base.attackPart],name_jp:'test'};
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
  const unresolved=structuredClone(measurements);unresolved.characters.bullet.stand_heavy.status='fix';
  assert.throws(()=>createP3ContactDelivery(metadata,unresolved),/unresolved art/);
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
test('exact trajectories cover the actual Battle frames, including valid 2F normals',()=>{
 const {metadata,measurements}=fixture(),two=measurements.characters.pisuke.stand_weak;
 assert.equal(normalMove('pisuke','stand_weak').active,2);
 Object.assign(two,{battleActive:2,contactSeconds:.5,activeReach:[two.activeReach[0],two.activeReach.at(-1)]});
 const delivery=createP3ContactDelivery(metadata,measurements),row=delivery.characters.pisuke.stand_weak;
 assert.equal(row.activeReach.length,2);assert.equal(row.trajectorySampling,'exact-battle-active-frames');
 assert.equal(validateP3ContactDelivery(delivery),delivery);
 const incomplete=structuredClone(delivery);incomplete.characters.pisuke.stand_weak.activeReach.pop();
 assert.throws(()=>validateP3ContactDelivery(incomplete),/actual Battle frame coverage/);
 const mislabeled=structuredClone(measurements);mislabeled.characters.pisuke.stand_weak.battleActive=3;
 assert.throws(()=>createP3ContactDelivery(metadata,mislabeled),/actual Battle frame coverage/);
 const noClock=structuredClone(measurements);delete noClock.characters.pisuke.stand_weak.contactSeconds;
 assert.throws(()=>createP3ContactDelivery(metadata,noClock),/actual Battle frame coverage/);
 const missingClock=structuredClone(delivery);delete missingClock.characters.pisuke.stand_weak.contactSeconds;
 assert.throws(()=>validateP3ContactDelivery(missingClock),/actual Battle frame coverage/);
 const legacy=delivery.characters.moguzo.stand_weak;assert.equal(legacy.trajectorySampling,'legacy-active-samples');
 const falseClaim=structuredClone(delivery);falseClaim.characters.moguzo.stand_weak.trajectorySampling='exact-battle-active-frames';
 assert.throws(()=>validateP3ContactDelivery(falseClaim),/exact sampling claim/);
});
test('exact rows permit extra diagnostic phases but cannot omit an actual active frame',()=>{
 const {metadata,measurements}=fixture(),row=measurements.characters.moguzo.stand_heavy;
 row.battleActive=4;row.contactSeconds=.5;
 row.activeReach=[0,1/3,.5,2/3,1].map(phase=>({...row.activeReach[0],phase}));
 assert.equal(validateP3ContactDelivery(createP3ContactDelivery(metadata,measurements)).characters.moguzo.stand_heavy.activeReach.length,5);
 row.activeReach[1].phase=.2;
 assert.throws(()=>createP3ContactDelivery(metadata,measurements),/actual Battle frame coverage/);
 const missing=structuredClone(measurements);missing.characters.moguzo.stand_heavy.activeReach[1].phase=1/3;
 const delivery=createP3ContactDelivery(metadata,missing);delivery.characters.moguzo.stand_heavy.activeReach[1].phase=.2;
 assert.throws(()=>validateP3ContactDelivery(delivery),/actual Battle frame coverage/);
});
test('a mixed style must measure its own active grid without changing the source rig clock',()=>{
 const {metadata,measurements}=fixture(),row=measurements.characters.pisuke.stand_weak;
 Object.assign(row,{battleActive:2,contactSeconds:.5,activeReach:[row.activeReach[0],row.activeReach.at(-1)]});
 const exact=createP3ContactDelivery(metadata,measurements).characters.pisuke.stand_weak;
 assert.equal(validNormalActiveTrajectory({...exact,slot:'stand_weak'},{expectedActive:2,requiredActives:[3]}),false,'the 3F style midpoint was not measured');
 exact.activeReach.splice(1,0,{...exact.activeReach[0],phase:.5});
 assert.equal(validNormalActiveTrajectory({...exact,slot:'stand_weak'},{expectedActive:2,requiredActives:[3]}),true);
 assert.equal(exact.battleActive,2,'the original visual rig contract stays intact');
});
test('only air slots accept signed local heights and real contact adds airborne world Y',()=>{
 const {metadata,measurements}=fixture(),air=measurements.characters.bullet.air_heavy;
 air.height=-.17;air.activeReach.forEach(point=>point.height=-.17);
 const delivery=createP3ContactDelivery(metadata,measurements);assert.equal(validateP3ContactDelivery(delivery),delivery);
 const ground=structuredClone(measurements);ground.characters.bullet.stand_heavy.height=-.17;ground.characters.bullet.stand_heavy.activeReach.forEach(point=>point.height=-.17);
 assert.throws(()=>createP3ContactDelivery(metadata,ground),/missing measured surface/);
 const nonfinite=structuredClone(measurements);nonfinite.characters.bullet.air_heavy.height=-Infinity;
 assert.throws(()=>createP3ContactDelivery(metadata,nonfinite),/missing measured surface/);
 const g=new Battle('bullet','chirka'),[a,t]=g.fighters,move={...normalMove('bullet','air_heavy'),strikeHeight:-.17,activeReach:[{phase:0,reach:.5,height:-.17},{phase:1,reach:.5,height:-.17}]};
 a.x=0;a.y=.5;a.facing=1;a.frame=move.startup;t.x=.3;t.y=0;t.state='crouch';t.input={down:true};
 assert.equal(normalHeightAt(move,a.frame),-.17);assert.equal(g._contact(a,t,move),true,'visible low tail at world .33 should reach the crouching body');
 const clamped={...move,strikeHeight:0,activeReach:move.activeReach.map(point=>({...point,height:0}))};
 assert.equal(g._contact(a,t,clamped),false,'clamping local height to zero would incorrectly move this hit above the target');
 a.y=.05;assert.equal(g._contact(a,t,move),false,'a fully underground strike must not create a phantom ground hit');
});
