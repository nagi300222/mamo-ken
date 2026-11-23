import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {IDS} from './balance.js';
import {NORMAL_CONTACTS as BASE} from './normal-contacts-v151.js';
import {NORMAL_MOTION_SLOTS,createNormalMotionSource,ACTIVE_NORMAL_MOTION_SOURCE,getNormalMotionPack} from './normal-motion-source.js';
import {MODEL_ASSETS,chooseClip} from './models.js';
import {loadP3NormalMotionCandidate,mergeNormalArtMetadata,loadMergedNormalArtMetadata,createP3NormalMotionCandidate,NORMAL_ART_MANIFEST_FILES} from './p3-normal-candidate.js';

// Deliberately synthetic selector fixture, not a claim of new measured art.
function delivery(){return {version:'unit-selector-fixture',source:'runtime-skinned-mesh',characters:Object.fromEntries(IDS.map(id=>[id,Object.fromEntries(NORMAL_MOTION_SLOTS.map(slot=>[slot,{...structuredClone(BASE[id][slot]),clip:'v17_'+slot,source:'runtime-skinned-mesh',status:'ok',authoredDuration:1,attackParts:BASE[id][slot].bothHands?['armL','armR']:[BASE[id][slot].attackPart]}]))]))};}
function authored(d){
 const reverse={armL:'pawL',armR:'pawR',legL:'footL',legR:'footR',tail:'tail',body:'body',head:'head'};
 const meta={version:'unit-selector-fixture',characters:{}};
 for(const id of IDS){meta.characters[id]={};for(const slot of NORMAL_MOTION_SLOTS){const row=d.characters[id][slot];
  // Integer fixture clocks are isolated from the real Claude metadata.
  Object.assign(row,{contact:.3,contactEnd:.4});
  meta.characters[id][slot]={character:id,game_action:slot,clip:'v17_'+slot,fps:60,frames:100,duration_sec:100/60,contact_frame:30,contact_hold_frames:10,contact:.3,contact_end:.4,attack_limb:row.bothHands?'pawL+pawR':reverse[row.attackPart]};
 }}return meta;
}
test('models and active normal packs expose one version and source URL across nine actors',()=>{
 for(const id of IDS){const pack=getNormalMotionPack(id);assert.equal(MODEL_ASSETS[id].normal,pack.path);assert.equal(MODEL_ASSETS[id].normalVersion,ACTIVE_NORMAL_MOTION_SOURCE.version);
  assert.equal(pack.clipNames.length,6);assert.equal(pack.contacts,ACTIVE_NORMAL_MOTION_SOURCE.contacts[id]);
  const expectedFile=ACTIVE_NORMAL_MOTION_SOURCE.version==='v17'?ACTIVE_NORMAL_MOTION_SOURCE.contacts[id].stand_weak.file??`motion/v17/${id}_normals_v17.glb`:`normal/v15/${id}_normals.glb`;
  assert.equal(pack.file,expectedFile);assert.ok(pack.url.endsWith(expectedFile));
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
 const candidate=await loadP3NormalMotionCandidate({artRevision:'r1',motionRoot:new URL('https://example.invalid/fixture/motion/v17/'),
  fetcher:async()=>({ok:true,json:async()=>meta}),moduleLoader:async()=>({NORMAL_CONTACTS_V17:d.characters}),revision:'unit-test'});
 assert.equal(candidate.status,'candidate-only');assert.equal(candidate.source.version,'v17');assert.equal(candidate.revision,'unit-test');assert.equal(ACTIVE_NORMAL_MOTION_SOURCE,before);
 await assert.rejects(loadP3NormalMotionCandidate({fetcher:async()=>({ok:false,status:404}),moduleLoader:async()=>({})}),/HTTP 404/);
});
const json=path=>readFile(new URL('../'+path,import.meta.url),'utf8').then(JSON.parse);
test('actual r2 handoff merges its six authored rows and preserves strict per-rig file and clip provenance',async()=>{
 const [r1,r2,raw]=await Promise.all([json(NORMAL_ART_MANIFEST_FILES.r1Metadata),json(NORMAL_ART_MANIFEST_FILES.r2Metadata),json(NORMAL_ART_MANIFEST_FILES.r2Contacts)]);
 const merged=mergeNormalArtMetadata(r1,r2);assert.equal(Object.values(merged.characters).flatMap(Object.values).length,54);
 assert.equal(merged.characters.takimaru.crouch_heavy.clip,'v17r2_crouch_heavy');assert.equal(r1.characters.takimaru.crouch_heavy.clip,'v17_crouch_heavy','r1 metadata is immutable');
 const loaded=await loadMergedNormalArtMetadata({read:json});assert.deepEqual(loaded,merged);
 const {source,delivery}=createP3NormalMotionCandidate(merged,raw);
 assert.equal(source.version,'v17');assert.equal(source.contactVersion,'v17-p3-normals-r2');
 assert.equal(source.pack('takimaru').path,'../motion/v17r2/takimaru_normals_v17r2.glb');
 assert.equal(source.pack('moguzo').path,'../motion/v17/moguzo_normals_v17.glb');
 assert.equal(source.pack('takimaru').clipNames.length,6);assert.ok(source.pack('takimaru').clipNames.includes('v17r2_crouch_heavy'));
 assert.throws(()=>source.clipName('crouch_heavy'),/visual rig id required/);
 assert.equal(source.clipName('crouch_heavy',{rigId:'takimaru'}),'v17r2_crouch_heavy');
 assert.equal(source.clipName('crouch_heavy',{rigId:'godan'}),'v17_crouch_heavy');
 assert.equal(source.slotForClip('v17r2_crouch_heavy',{rigId:'takimaru'}),'crouch_heavy');
 assert.equal(source.isNormalClip('v17r2_crouch_heavy',{rigId:'moguzo'}),false);
 assert.equal(chooseClip({id:'pisuke',visualRigId:'takimaru',action:{id:'crouch_heavy'}},source.pack('takimaru').clipNames,{},{normalMotionSource:source}),'v17r2_crouch_heavy');
 assert.equal(chooseClip({id:'pisuke',action:{id:'crouch_heavy'}},source.pack('takimaru').clipNames,{},{normalMotionSource:source,rigId:'takimaru'}),'v17r2_crouch_heavy');
 assert.deepEqual(delivery.characters.takimaru.crouch_heavy.attackParts,['armL','armR']);
 for(const replacement of ['../v17r2/takimaru_normals_v17r2.glb','motion/v17r2/moguzo_normals_v17r2.glb','motion/v17/takimaru_normals_v17.glb']){
  const corrupt=structuredClone(raw);corrupt.takimaru.crouch_heavy.file=replacement;assert.throws(()=>createP3NormalMotionCandidate(merged,corrupt),/source pack\/clip mismatch/);
 }
 const badClip=structuredClone(raw);badClip.takimaru.crouch_heavy.clip='v17r2_stand_heavy';assert.throws(()=>createP3NormalMotionCandidate(merged,badClip),/source pack\/clip mismatch/);
 const badPart=structuredClone(raw);badPart.takimaru.crouch_heavy.activeReach[1].part='tail';assert.throws(()=>createP3NormalMotionCandidate(merged,badPart),/undeclared limb/);
 const badPartial=structuredClone(r2);delete badPartial.characters.takimaru.stand_weak;assert.throws(()=>mergeNormalArtMetadata(r1,badPartial),/all six/);
});
test('provider accepts a full exact 2F pack contract and rejects missing-frame delivery',()=>{
 const d=delivery(),row=d.characters.pisuke.stand_weak;
 Object.assign(row,{battleActive:2,contactSeconds:row.contact*row.authoredDuration,activeReach:[row.activeReach[0],row.activeReach.at(-1)]});
 const source=createNormalMotionSource({version:'v17',delivery:d});assert.equal(source.contacts.pisuke.stand_weak.activeReach.length,2);
 row.activeReach.pop();assert.throws(()=>createNormalMotionSource({version:'v17',delivery:d}),/actual Battle frame coverage/);
});
