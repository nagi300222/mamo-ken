import {test} from 'node:test';import assert from 'node:assert/strict';
import {cameraRelativeMove,createExplorationControls,EXPLORATION_CAMERA} from './exploration-controls.js';
import {moveInVillage,BUILDINGS,freshProgress,validateProgress} from './story-state.js';
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} vs ${b}`);
test('left movement rotates with camera without changing independent yaw',()=>{
 for(const[yaw,x,z]of [[0,0,-1],[Math.PI/2,-1,0],[Math.PI,0,1],[-Math.PI/2,1,0]]){const input=createExplorationControls({yaw,follow:false});input.beginMove(11);input.move(11,0,-1);const move=input.movement();close(move.x,x);close(move.z,z);assert.equal(input.view.yaw,Math.atan2(Math.sin(yaw),Math.cos(yaw)));}
 const diagonal=cameraRelativeMove(1,-1,.7);close(Math.hypot(diagonal.x,diagonal.z),1);
});
test('simultaneous left/right pointers never claim or release each other',()=>{
 const input=createExplorationControls({follow:false});assert.equal(input.beginMove(10),true);assert.equal(input.beginOrbit(10,50,50),false);assert.equal(input.beginOrbit(20,200,50),true);assert.equal(input.beginMove(21),false);
 input.move(10,.7,-.5);const before=input.snapshot;input.orbit(20,290,90);assert.notEqual(input.view.yaw,before.yaw);assert.notEqual(input.view.pitch,before.pitch);assert.deepEqual(input.snapshot.stick,before.stick);
 assert.equal(input.move(20,0,0),false);assert.equal(input.orbit(10,0,0),false);input.endOrbit(20);assert.equal(input.snapshot.leftPointer,10);assert.deepEqual(input.snapshot.stick,before.stick);input.endMove(10);assert.deepEqual(input.movement(),{x:0,z:0});
});
test('dead zone, pitch clamp, pointercancel/blur resets, follow toggle and view reset',()=>{
 const input=createExplorationControls();input.beginMove(1);input.move(1,.10,.05);assert.deepEqual(input.movement(),{x:0,z:0});input.beginOrbit(2,0,0);input.orbit(2,0,10000);assert.equal(input.view.pitch,EXPLORATION_CAMERA.maxPitch);input.orbit(2,0,-10000);assert.equal(input.view.pitch,EXPLORATION_CAMERA.minPitch);
 input.clearPointers();assert.equal(input.snapshot.leftPointer,null);assert.equal(input.snapshot.rightPointer,null);assert.deepEqual(input.movement(),{x:0,z:0});
 input.restore({yaw:1,pitch:.4,follow:false});for(let i=0;i<60;i++)input.update(.05,Math.PI,true);close(input.view.yaw,1);input.setFollow(true);for(let i=0;i<60;i++)input.update(.05,Math.PI,true);assert.ok(Math.abs(input.view.yaw)<.01);input.resetView(0);close(Math.abs(input.view.yaw),Math.PI);assert.equal(input.view.pitch,EXPLORATION_CAMERA.defaultPitch);
});
test('camera-relative diagonal movement still slides on the existing house collider',()=>{
 const b=BUILDINGS[0];let p={x:b.x+b.w/2+.221,z:b.z-.3};const before={...p};for(let i=0;i<8;i++)p=moveInVillage(p,cameraRelativeMove(-1,1,0),.05);close(p.x,before.x);assert.ok(p.z>before.z);
});
test('camera persists and old version-one saves keep backward-compatible heading',()=>{
 const progress=freshProgress(12);progress.camera={yaw:.8,pitch:.6,follow:false};assert.deepEqual(validateProgress(progress).camera,progress.camera);const old={...progress,heading:0};delete old.camera;close(Math.abs(validateProgress(old).camera.yaw),Math.PI);assert.throws(()=>validateProgress({...progress,camera:{yaw:NaN,pitch:.4,follow:true}}));
});
