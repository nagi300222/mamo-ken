import test from 'node:test';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {Battle} from '../../dojo/battle.js';
import {IDS,ROSTER,normalMove,specialMove} from '../../dojo/balance.js';
import {NORMAL_CONTACTS,NORMAL_HURT_BOUNDS,ACTIVE_NORMAL_MOTION_VERSION} from '../../dojo/normal-contact-source.js';
import {NORMAL_CONTACTS as LEGACY_NORMAL_CONTACTS,NORMAL_HURT_BOUNDS as LEGACY_NORMAL_HURT_BOUNDS} from '../../dojo/normal-contacts-v151.js';
import {actualAvatarMeasurement,disposeMeasuredAvatars} from './test-support/actual-avatar-measurements.mjs';
import {createDefaultAvatar,normalizeAvatar,validateAvatar,createSeededMob} from './avatar-schema.js';
import {createCustomBattle,compatibilityForMove,validateCombatLoadout,compatibleSpecialSuggestion} from './custom-combat.js';
import {retargetCustomClip,inspectClipCompatibility,customSpecialTime} from './custom-animation.js';
import {readGlb,accessor} from '../../normal-art/v15_1/tools/glbfk.mjs';

test.after(disposeMeasuredAvatars);

test('avatar schema persists separate shape/style/loadout and rejects corrupt data',()=>{
  const definition=createDefaultAvatar('godan');definition.name='ナギのマモ';definition.appearance.palette.fur='#FAbC09';
  definition.combat.styleId='pisuke';definition.combat.specials=['pisuke.s1','moguzo.s1','bullet.s1'];
  const saved=normalizeAvatar(JSON.parse(JSON.stringify(definition)));
  assert.equal(saved.appearance.baseId,'godan');assert.equal(saved.combat.styleId,'pisuke');assert.equal(saved.appearance.palette.fur,'#fabc09');
  for(const bad of [{...saved,schemaVersion:9},{...saved,name:'x'.repeat(25)},{...saved,combat:{styleId:'unknown',specials:saved.combat.specials}},
    {...saved,appearance:{...saved.appearance,palette:{fur:'red'}}},{...saved,combat:{...saved.combat,specials:['moguzo.s9']}}])assert.equal(validateAvatar(bad).ok,false);
});
test('known tail/counter incompatibility is rejected rather than becoming invisible reach',()=>{
  const definition=createDefaultAvatar('moguzo');definition.combat.specials[2]='bullet.s3';
  assert.equal(validateCombatLoadout(definition).ok,false);
  assert.throws(()=>createCustomBattle(definition),/6ボーン長尾/);
  const bullet=createDefaultAvatar('bullet');bullet.appearance.parts.tail='none';
  assert.equal(compatibilityForMove(bullet,'bullet.s3').supported,false);
  assert.equal(compatibilityForMove(bullet,'bullet.s2').supported,false);
  assert.equal(compatibilityForMove(definition,'yomikage.s3').supported,false);
  assert.equal(compatibilityForMove(definition,'godan.s2').supported,false);
  // Selecting a supported fallback is an explicit editor action.
  const before=JSON.stringify(definition);assert.equal(compatibleSpecialSuggestion(definition).length,3);assert.equal(JSON.stringify(definition),before);
});
test('six foreign projectile moves really change the Battle action and damage',()=>{
  const projectileIds=IDS.filter(id=>ROSTER[id].specials[0].kind==='projectile');
  for(const source of projectileIds)for(const baseId of IDS){
    const definition=createDefaultAvatar(baseId);definition.combat.specials[1]=source+'.s1';
    const battle=createCustomBattle(definition,'pisuke'),p=battle.fighters[0],t=battle.fighters[1];
    p.x=-.35;t.x=.35;t.ability.grit=false;
    battle.tick({special2:true},{});
    const action=p.action,expected=specialMove(source,0);
    assert.equal(p.id,baseId);assert.equal(action.sourceCharacterId,source);assert.equal(action.sourceMoveId,'s1');
    assert.equal(action.startup,expected.startup);assert.equal(action.damage,expected.damage);assert.equal(action.speed,expected.speed);
    let damage=0;
    for(let i=0;i<150;i++){
      battle.tick({},{});
      damage+=battle.events.filter(e=>e.type==='hit').reduce((sum,e)=>sum+e.damage,0);
    }
    assert.equal(damage,expected.damage,source+' on '+baseId+' must hit exactly once');
    assert.equal(t.hp,ROSTER.pisuke.hp-expected.damage);
  }
});
test('all 81 visual-rig/style combinations use real measured skin with complete style frame coverage',async()=>{
  for(const baseId of IDS)for(const styleId of IDS){
    const definition=createDefaultAvatar(baseId);definition.combat.styleId=styleId;
    definition.combat.specials=['pisuke.s1','moguzo.s1','yomikage.s1'];
    if(ACTIVE_NORMAL_MOTION_VERSION==='v17'&&baseId!==styleId)assert.throws(()=>createCustomBattle(definition,'hakuma'),/実持続フレーム/);
    const measurement=await actualAvatarMeasurement(definition);
    assert.equal(measurement.source,'runtime-skinned-mesh');assert.equal(measurement.normalSampling,'exact-style-active-frames');assert.equal(measurement.normalStyleId,styleId);assert.equal(measurement.normalMotionVersion,ACTIVE_NORMAL_MOTION_VERSION);
    const battle=createCustomBattle(definition,'hakuma',1,{measurements:[measurement]}),p=battle.fighters[0];
    for(const slot of Object.keys(measurement.normals)){
     assert.ok(battle._begin(p,{},slot));const move=p.action,row=measurement.normals[slot],style=normalMove(styleId,slot);
     assert.equal(move.reach,row.reach);assert.deepEqual(move.activeReach,row.activeReach);
     assert.ok(Math.abs(row.reach-NORMAL_CONTACTS[baseId][slot].reach)<.015,baseId+'/'+styleId+'/'+slot+' measured skin diverged');
     assert.equal(move.startup,style.startup);assert.equal(move.active,style.active);assert.equal(move.recovery,style.recovery);
     for(let frame=0;frame<style.active;frame++)assert.ok(row.activeReach.some(point=>Math.abs(point.phase-frame/(style.active-1))<1e-9),baseId+'/'+styleId+'/'+slot+' missing actual style frame');
     assert.equal(move.sourceCharacterId,baseId);assert.equal(p.id,styleId);p.action=null;p.frame=0;
    }
  }
});
test('changed shape requires measured contact data and measured surface drives collision',()=>{
  const definition=createDefaultAvatar('godan');definition.appearance.parts.head='pisuke';
  assert.throws(()=>createCustomBattle(definition),/接触計測/);
  const measurement={source:'runtime-skinned-mesh',normals:structuredClone(NORMAL_CONTACTS.godan),hurtBounds:structuredClone(NORMAL_HURT_BOUNDS.godan),projectileSocket:{forward:.22,height:.32}};
  measurement.normals.stand_weak.reach=.18;
  measurement.normals.stand_weak.activeReach.forEach(p=>p.reach=.18);
  const battle=createCustomBattle(definition,'pisuke',1,{measurements:[measurement]});
  const p=battle.fighters[0],t=battle.fighters[1];p.x=0;t.x=.40;
  battle.tick({weak:true},{});p.frame=p.action.startup;
  assert.equal(battle._contact(p,t,p.action),false,'must not use old larger body reach');
  t.x=.32;assert.equal(battle._contact(p,t,p.action),true);
  const again=battle.again();assert.deepEqual(again.fighters[0].definition,definition);assert.equal(again.fighters[0].customMeasurement.normals.stand_weak.reach,.18);
});
test('custom vs custom uses each defender own measured bounds and a selected single ability',async()=>{
  const a=createDefaultAvatar('godan'),b=createDefaultAvatar('pisuke');a.combat.styleId='bullet';a.combat.specials=['moguzo.s1','pisuke.s1','bullet.s1'];
  const measurements=await Promise.all([actualAvatarMeasurement(a),actualAvatarMeasurement(b)]);
  const g=createCustomBattle(a,b,1,{measurements});
  assert.deepEqual(g.fighters.map(f=>f.customMeasurement.hurtBounds),measurements.map(m=>m.hurtBounds));
  assert.notDeepEqual(measurements[0].hurtBounds,measurements[1].hurtBounds);
  assert.equal(g.fighters[0].id,'bullet');assert.equal(g.fighters[0].visualRigId,'godan');
  g.tick({special1:true},{});assert.equal(g.fighters[0].action.sourceCharacterId,'moguzo');
  assert.equal(g.fighters[0].ability.gutsReady,false);assert.equal(g.fighters[0].action.damage,specialMove('moguzo',0).damage);
  const again=g.again();assert.deepEqual(again.fighters.map(f=>f.definition),g.fighters.map(f=>f.definition));
});
test('seeded mobs reproduce valid custom loadouts over 1000 seeds',()=>{
  for(let seed=0;seed<1000;seed++){
    const a=createSeededMob(seed);assert.deepEqual(a,createSeededMob(seed));assert.equal(validateCombatLoadout(a).ok,true);
    assert.ok(createCustomBattle(a,'moguzo') instanceof Battle);
  }
});

const glb=file=>readGlb(fileURLToPath(new URL(file,import.meta.url)));
function rootFor(g){
  const joints=new Set(g.doc.skins?.flatMap(s=>s.joints)??[]);
  const nodes=new Map(g.doc.nodes.map((n,i)=>[n.name,{isBone:joints.has(i),position:{toArray:()=>n.translation??[0,0,0]},
    quaternion:{toArray:()=>n.rotation??[0,0,0,1]},scale:{toArray:()=>n.scale??[1,1,1]}}]));
  return {getObjectByName:name=>nodes.get(name)};
}
function clipFor(g,name){
  const a=g.doc.animations.find(a=>a.name===name),tracks=a.channels.filter(c=>c.target.path!=='weights').map(c=>({
    name:g.doc.nodes[c.target.node].name+'.'+({rotation:'quaternion',translation:'position'}[c.target.path]??c.target.path),
    values:accessor(g,a.samplers[c.sampler].output).data
  }));
  const make=tracks=>({name,tracks,clone:()=>make(tracks.map(t=>({...t,values:t.values.slice()})))});
  return make(tracks);
}
test('54 actual authored projectile-to-rig retargets bind required bones with finite keys',()=>{
  const targets=Object.fromEntries(IDS.map(id=>[id,rootFor(glb(`../../chars/${id}/${id}.glb`))]));
  for(const source of IDS.filter(id=>ROSTER[id].specials[0].kind==='projectile')){
    const sourceRig=rootFor(glb(`../../chars/${source}/${source}.glb`)),clip=clipFor(glb(`../../cinematic/v14/${source}/${source}_v14.glb`),'s1_v14');
    const before=clip.tracks.map(t=>Array.from(t.values));
    for(const target of IDS){
      const report=inspectClipCompatibility(clip,sourceRig,targets[target],{moveKind:'projectile'});
      assert.equal(report.ok,true,`${source} -> ${target}: ${report.missing}`);
      const result=retargetCustomClip(clip,sourceRig,targets[target],{moveKind:'projectile'});
      assert.ok(result.tracks.length>30);
      for(const track of result.tracks){assert.ok([...track.values].every(Number.isFinite));assert.ok(targets[target].getObjectByName(track.name.replace(/\.[^.]+$/,''))?.isBone);}
    }
    assert.deepEqual(clip.tracks.map(t=>Array.from(t.values)),before,'authoring source must be immutable');
  }
});
test('special pose clock aligns source contact to Battle startup and finishes once',()=>{
  const move=specialMove('pisuke',0),spec={contactSeconds:.28};
  assert.equal(customSpecialTime(0,move,spec,.9),0);
  assert.equal(customSpecialTime(move.startup,move,spec,.9),.28);
  assert.equal(customSpecialTime(999,move,spec,.9),.9);
});
test('custom measured air strikes retain signed height while ground/nonfinite data is rejected',()=>{
  const definition=createDefaultAvatar('bullet');
  const measurement={source:'runtime-skinned-mesh',normals:structuredClone(NORMAL_CONTACTS.bullet),hurtBounds:structuredClone(NORMAL_HURT_BOUNDS.bullet),projectileSocket:{forward:.22,height:.32}};
  measurement.normals.air_heavy.height=-.17;measurement.normals.air_heavy.activeReach.forEach(point=>point.height=-.17);
  const g=createCustomBattle(definition,'chirka',1,{measurements:[measurement]}),p=g.fighters[0];
  assert.ok(g._begin(p,{},'air_heavy'));assert.equal(p.action.strikeHeight,-.17);assert.equal(p.action.customContact.height,-.17);
  const invalid=structuredClone(measurement);invalid.normals.stand_heavy.height=-.17;
  assert.throws(()=>createCustomBattle(definition,'chirka',1,{measurements:[invalid]}),/通常技計測/);
  const invalidActive=structuredClone(measurement);invalidActive.normals.stand_heavy.activeReach[1].height=-.17;
  assert.throws(()=>createCustomBattle(definition,'chirka',1,{measurements:[invalidActive]}),/通常技計測/);
  const infinite=structuredClone(measurement);infinite.normals.air_heavy.height=NaN;
  assert.throws(()=>createCustomBattle(definition,'chirka',1,{measurements:[infinite]}),/通常技計測/);
});

test('v15 Bullet ground tail retains its measured below-root follow-through and actual ground collision',()=>{
  const definition=createDefaultAvatar('bullet');
  const measurement={source:'runtime-skinned-mesh',normals:structuredClone(LEGACY_NORMAL_CONTACTS.bullet),hurtBounds:structuredClone(LEGACY_NORMAL_HURT_BOUNDS.bullet),projectileSocket:{forward:.22,height:.32}};
  // Exact Three.js skin measurements of the unchanged v15 modular rig. The
  // authored table rounded/clamped its negative follow-through heights to zero.
  Object.assign(measurement.normals.crouch_heavy,{reach:.6412,height:.0071,activeReach:[
    {phase:0,reach:.6412,height:.0071},{phase:.5,reach:.6205,height:-.0164},{phase:1,reach:.5851,height:-.0259}
  ]});
  const battle=createCustomBattle(definition,'pisuke',1,{measurements:[measurement]}),[p,t]=battle.fighters;
  p.x=0;t.x=.6;assert.equal(battle._begin(p,{},'crouch_heavy'),true);p.frame=p.action.startup+p.action.active-1;
  assert.equal(p.action.activeReach.at(-1).height,-.0259);assert.equal(battle._contact(p,t,p.action),true);
  const invalid=structuredClone(measurement);invalid.normals.crouch_heavy.activeReach.at(-1).height=-.061;
  assert.throws(()=>createCustomBattle(definition,'pisuke',1,{measurements:[invalid]}),/通常技計測/);
});
test('custom exact measurements accept 2F moves but reject a missing real active frame',()=>{
 const definition=createDefaultAvatar('pisuke');
 const measurement={source:'runtime-skinned-mesh',normals:structuredClone(NORMAL_CONTACTS.pisuke),hurtBounds:structuredClone(NORMAL_HURT_BOUNDS.pisuke),projectileSocket:{forward:.22,height:.32}};
 const row=measurement.normals.stand_weak;
 Object.assign(row,{battleActive:2,authoredDuration:1,contactSeconds:row.contact,activeReach:[row.activeReach[0],row.activeReach.at(-1)]});
 assert.ok(createCustomBattle(definition,'godan',1,{measurements:[measurement]}));
 row.activeReach.pop();assert.throws(()=>createCustomBattle(definition,'godan',1,{measurements:[measurement]}),/通常技計測/);
});
test('per-ref custom special measurements retain native source identity and require every active frame',async()=>{
 const definition=createDefaultAvatar('godan');definition.combat.styleId='pisuke';
 const ref='godan.s3',move=specialMove('godan',2),row={ref,sourceCharacterId:'godan',sourceMoveId:'s3',clip:'s3_v17',motionVersion:'v17',sourceVersion:'unit-validation-not-art',
  source:'runtime-skinned-mesh',sampling:'exact-clip-clock',status:'ok',contactSeconds:.3,sampledContactSeconds:.3,activeFrameCount:move.active,reach:.4,height:.3,
  activeReach:Array.from({length:move.active},(_,i)=>({phase:i/(move.active-1),reach:.4,height:.3}))};
 // The special row is a declared validator fixture. Its foreign-style normal
 // prerequisite is independently sampled from the real modular skin.
 const measurement=await actualAvatarMeasurement(definition);measurement.specialContacts={[ref]:row};
 const battle=createCustomBattle(definition,'moguzo',1,{measurements:[measurement],specialContactDelivery:null});
 assert.ok(battle._begin(battle.fighters[0],{},'s3'));const action=battle.fighters[0].action;
 assert.equal(action.customSpecialContact,row);assert.equal(action.sourceCharacterId,'godan');assert.equal(action.startup,move.startup);assert.equal(battle.fighters[0].id,'pisuke');
 const bad=structuredClone(measurement);bad.specialContacts[ref].activeReach.splice(1,1);
 assert.throws(()=>createCustomBattle(definition,'moguzo',1,{measurements:[bad]}),/必殺技接触計測/);
 const badSource=structuredClone(measurement);badSource.specialContacts[ref].sourceCharacterId='pisuke';
 assert.throws(()=>createCustomBattle(definition,'moguzo',1,{measurements:[badSource]}),/必殺技接触計測/);
});
test('measured foreign projectile sockets preserve signed release centres while rejecting fully buried circles',()=>{
 const definition=createDefaultAvatar('godan');definition.combat.specials[0]='takimaru.s1';
 const measurement={source:'runtime-skinned-mesh',normals:structuredClone(NORMAL_CONTACTS.godan),hurtBounds:structuredClone(NORMAL_HURT_BOUNDS.godan),projectileSocket:{forward:.22,height:.32},
  projectileSockets:{'takimaru.s1':{forward:.345098,height:-.002557}}};
 const battle=createCustomBattle(definition,'pisuke',1,{measurements:[measurement],specialContactDelivery:null}),[p,t]=battle.fighters;
 assert.ok(battle._begin(p,{},'s1'));p.frame=p.action.startup-1;battle._act(p,t);
 assert.equal(battle.projectiles[0].y,-.002557);assert.equal(p.action.projectileSocket.height,-.002557);
 const invalid=structuredClone(measurement);invalid.projectileSockets['takimaru.s1'].height=-.081;
 assert.throws(()=>createCustomBattle(definition,'pisuke',1,{measurements:[invalid]}),/技別発射位置/);
});
test('custom style validation rejects an unmeasured style frame even when the visual base grid is complete',async()=>{
 const definition=createDefaultAvatar('pisuke');definition.combat.styleId='godan';
 const measurement=await actualAvatarMeasurement(definition);
 assert.ok(createCustomBattle(definition,'moguzo',1,{measurements:[measurement]}));
 assert.equal(normalMove('pisuke','stand_weak').active,2);
 assert.ok(measurement.normals.stand_weak.sampledBattleActives.includes(2));
 assert.ok(measurement.normals.stand_weak.sampledBattleActives.includes(normalMove('godan','stand_weak').active));
 const invalid=structuredClone(measurement);invalid.normals.stand_weak.activeReach=invalid.normals.stand_weak.activeReach.filter(point=>point.phase!==.5);
 assert.throws(()=>createCustomBattle(definition,'moguzo',1,{measurements:[invalid]}),/通常技計測が不正: stand_weak/);
});
