import test from 'node:test';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {Battle} from '../../dojo/battle.js';
import {IDS,ROSTER,normalMove,specialMove} from '../../dojo/balance.js';
import {NORMAL_CONTACTS,NORMAL_HURT_BOUNDS} from '../../dojo/normal-contacts-v151.js';
import {createDefaultAvatar,normalizeAvatar,validateAvatar,createSeededMob} from './avatar-schema.js';
import {createCustomBattle,compatibilityForMove,validateCombatLoadout,compatibleSpecialSuggestion} from './custom-combat.js';
import {retargetCustomClip,inspectClipCompatibility,customSpecialTime} from './custom-animation.js';
import {readGlb,accessor} from '../../normal-art/v15_1/tools/glbfk.mjs';

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
  assert.equal(compatibilityForMove(definition,'godan.s3').supported,false);
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
test('all 81 visual-rig/style combinations use visual surface with style timing',()=>{
  for(const baseId of IDS)for(const styleId of IDS){
    const definition=createDefaultAvatar(baseId);definition.combat.styleId=styleId;
    definition.combat.specials=['pisuke.s1','moguzo.s1','yomikage.s1'];
    const battle=createCustomBattle(definition,'hakuma');
    battle.tick({weak:true},{});const move=battle.fighters[0].action;
    assert.equal(move.reach,NORMAL_CONTACTS[baseId].stand_weak.reach);
    assert.equal(move.startup,normalMove(styleId,'stand_weak').startup);
    assert.equal(move.sourceCharacterId,baseId);assert.equal(battle.fighters[0].id,styleId);
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
test('custom vs custom uses each defender own measured bounds and a selected single ability',()=>{
  const a=createDefaultAvatar('godan'),b=createDefaultAvatar('pisuke');a.combat.styleId='bullet';a.combat.specials=['moguzo.s1','pisuke.s1','bullet.s1'];
  const g=createCustomBattle(a,b);assert.equal(g.fighters[0].id,'bullet');assert.equal(g.fighters[0].visualRigId,'godan');
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
