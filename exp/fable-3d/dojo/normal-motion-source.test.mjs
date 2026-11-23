import test from 'node:test';
import assert from 'node:assert/strict';
import {IDS} from './balance.js';
import {NORMAL_CONTACTS as BASE} from './normal-contacts-v151.js';
import {NORMAL_MOTION_SLOTS,createNormalMotionSource,ACTIVE_NORMAL_MOTION_SOURCE,getNormalMotionPack} from './normal-motion-source.js';
import {MODEL_ASSETS,chooseClip} from './models.js';
import {loadP3NormalMotionCandidate} from './p3-normal-candidate.js';

// Deliberately synthetic selector fixture, not a claim of new measured art.
function delivery(){return {version:'unit-selector-fixture',source:'runtime-skinned-mesh',characters:Object.fromEntries(IDS.map(id=>[id,Object.fromEntries(NORMAL_MOTION_SLOTS.map(slot=>[slot,{...structuredClone(BASE[id][slot]),clip:'v17_'+slot,source:'runtime-skinned-mesh',status:'ok',authoredDuration:1}]))]))};}
function authored(d){
 const reverse={armL:'pawL',armR:'pawR',legL:'footL',legR:'footR',tail:'tail',body:'body',head:'head'};
 const meta={version:'unit-selector-fixture',characters:{}};
 for(const id of IDS){meta.characters[id]={};for(const slot of NORMAL_MOTION_SLOTS){const row=d.characters[id][slot];
  // Integer fixture clocks are isolated from the real Claude metadata.
  Object.assign(row,{contact:.3,contactEnd:.4});
  meta.characters[id][slot]={character:id,game_action:slot,clip:'v17_'+slot,fps:60,frames:100,duration_sec:100/60,contact_frame:30,contact_hold_frames:10,contact:.3,contact_end:.4,attack_limb:reverse[row.attackPart]};
 }}return meta;
}
test('models and active normal packs expose one version and source URL across nine actors',()=>{
 for(const id of IDS){const pack=getNormalMotionPack(id);assert.equal(MODEL_ASSETS[id].normal,pack.path);assert.equal(MODEL_ASSETS[id].normalVersion,ACTIVE_NORMAL_MOTION_SOURCE.version);
  assert.equal(pack.clipNames.length,6);assert.equal(pack.contacts,ACTIVE_NORMAL_MOTION_SOURCE.contacts[id]);
  assert.ok(pack.url.endsWith(ACTIVE_NORMAL_MOTION_SOURCE.version==='v17'?`motion/v17/${id}_normals_v17.glb`:`normal/v15/${id}_normals.glb`));
 }
});
test('v17 QA injection selects only its own 54 clip names and matching contact clocks',()=>{
 const d=delivery(),source=createNormalMotionSource({version:'v17',delivery:d,assetRoot:new URL('https://example.invalid/fixture/')});
 for(const id of IDS)for(const slot of NORMAL_MOTION_SLOTS){
  const pack=getNormalMotionPack(id,{source});assert.equal(pack.url,`https://example.invalid/fixture/motion/v17/${id}_normals_v17.glb`);assert.equal(pack.contacts,d.characters[id]);
  const clip=source.clipName(slot);assert.equal(clip,'v17_'+slot);assert.equal(source.slotForClip(clip),slot);assert.equal(source.slotForClip('v15_'+slot),null);
  assert.equal(chooseClip({action:{id:slot}},['idle','v15_'+slot,clip],{},{normalMotionSource:source}),clip);
  assert.throws(()=>chooseClip({action:{id:slot}},['idle','v15_'+slot],{},{normalMotionSource:source}),/Missing selected/);
 }
 assert.equal(source.originalClipName('v17_crouch_weak'),'crouch_light');
 assert.equal(source.originalClipName('s2_v17'),null);
 assert.throws(()=>createNormalMotionSource({version:'v17'}),/measured versioned/);
 assert.throws(()=>getNormalMotionPack('unknown',{source}),/unknown rig/);
});
test('selected packs reject missing, duplicate and wrong-version clips',()=>{
 const source=createNormalMotionSource({version:'v17',delivery:delivery()});
 const pack={animations:source.clipNames.map(name=>({name,duration:1,tracks:[{},{},{},{}]}))};
 assert.equal(source.validatePack('godan',pack),pack);
 assert.throws(()=>source.validatePack('godan',{animations:pack.animations.slice(1)}),/exactly six/);
 const duplicate=structuredClone(pack);duplicate.animations[1].name=duplicate.animations[0].name;assert.throws(()=>source.validatePack('godan',duplicate),/duplicate/);
 const wrong=structuredClone(pack);wrong.animations[0].name='v15_stand_weak';assert.throws(()=>source.validatePack('godan',wrong),/unexpected/);
  const stale=structuredClone(pack);stale.animations[0].duration=.7;assert.throws(()=>source.validatePack('godan',stale),/stale pack duration/);
});
test('explicit candidate loading never changes the live source and fails on missing metadata',async()=>{
 const before=ACTIVE_NORMAL_MOTION_SOURCE,d=delivery(),meta=authored(d);
 const candidate=await loadP3NormalMotionCandidate({motionRoot:new URL('https://example.invalid/fixture/motion/v17/'),
  fetcher:async()=>({ok:true,json:async()=>meta}),moduleLoader:async()=>({NORMAL_CONTACTS_V17:d.characters}),revision:'unit-test'});
 assert.equal(candidate.status,'candidate-only');assert.equal(candidate.source.version,'v17');assert.equal(candidate.revision,'unit-test');assert.equal(ACTIVE_NORMAL_MOTION_SOURCE,before);
 await assert.rejects(loadP3NormalMotionCandidate({fetcher:async()=>({ok:false,status:404}),moduleLoader:async()=>({})}),/HTTP 404/);
});
