import {test} from 'node:test';import assert from 'node:assert/strict';
import {freshProgress,validateProgress,moveInVillage,BUILDINGS,WORLD,nearestNpc,recordEncounter,readSave,writeSave,mobPlacements,SAVE_KEY} from './story-state.js';
test('movement is diagonal-normalized, frame-clamped, bounded and cannot enter houses',()=>{
 let p={x:0,z:0};p=moveInVillage(p,{x:1,z:1},1);assert.ok(Math.hypot(p.x,p.z)<=WORLD.speed*.05+1e-9);
 p={x:BUILDINGS[0].x+BUILDINGS[0].w/2+WORLD.radius+.001,z:BUILDINGS[0].z};
 for(let i=0;i<100;i++)p=moveInVillage(p,{x:-1,z:0},.05);assert.ok(p.x>BUILDINGS[0].x+BUILDINGS[0].w/2);
 p={x:5.79,z:5.79};for(let i=0;i<10;i++)p=moveInVillage(p,{x:1,z:1},.05);assert.equal(p.x,WORLD.maxX);assert.equal(p.z,WORLD.maxZ);
});
test('nearby conversation uses nearest identity and a finite radius',()=>{const n=[{id:'a',x:0,z:1},{id:'b',x:.2,z:.1}];assert.equal(nearestNpc({x:0,z:0},n).id,'b');assert.equal(nearestNpc({x:4,z:4},n),null);});
test('battle result retains return position and creates exactly one explicit progress update',()=>{const p=freshProgress(13);p.position={x:1.3,z:-.7};const won=recordEncounter(p,'godan',0);assert.deepEqual(won.position,p.position);assert.equal(won.wins,1);assert.equal(p.wins,0);assert.equal(recordEncounter(won,'godan',-1).wins,1);assert.equal(recordEncounter(won,'godan',1).battles,2);});
test('corrupt or future saves remain stored, storage failures are visible, valid saves round trip',()=>{const data=new Map();const storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};const avatar={id:'one',name:'ナギ'};assert.equal(writeSave(storage,avatar,freshProgress()),null);assert.deepEqual(readSave(storage,x=>x).save.avatar,avatar);data.set(SAVE_KEY,'{broken');assert.ok(readSave(storage,x=>x).error);assert.equal(data.get(SAVE_KEY),'{broken');assert.ok(writeSave({setItem(){throw Error('quota')}},avatar,freshProgress()));assert.throws(()=>validateProgress({...freshProgress(),version:2}));});
test('seeded mob identities and spawn slots are repeatable',()=>{assert.deepEqual(mobPlacements(42),mobPlacements(42));assert.notDeepEqual(mobPlacements(42),mobPlacements(43));assert.equal(new Set(mobPlacements(42).map(x=>x.seed)).size,3);});
