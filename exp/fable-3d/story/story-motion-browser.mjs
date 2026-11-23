// Verify the actor that the actual Story UI constructed and its real playback.
// Factory-only sampling would miss an unbound/raw clip replacing the bound pack.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('playwright-core');
const root=process.env.MAMOKEN_STORY_URL??'http://127.0.0.1:4173/exp/fable-3d/story/';
const dir=(process.env.MAMOKEN_EVIDENCE??'/tmp/mamoken-v16')+'/story-motion';
await mkdir(dir,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH??'/usr/bin/google-chrome',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:852,height:393},hasTouch:true,isMobile:true,deviceScaleFactor:1});
const errors=[],report=[];
page.on('pageerror',error=>errors.push(error.message));
page.on('response',response=>{if(response.status()>=400&&!response.url().endsWith('favicon.ico'))errors.push(response.status()+' '+response.url());});
try{
 await page.goto(root,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.mamokenStory?.mode==='editor'&&mamokenStory.player,undefined,{timeout:90000});
 await page.locator('#avatar-base').selectOption('chirka');
 if(await page.locator('#p4-editor-tab-2').count())await page.locator('#p4-editor-tab-2').click();
 await page.locator('#avatar-style').selectOption('chirka');
 await page.locator('#avatar-name').fill('接触検査のチルカ');
 for(let i=0;i<3;i++)await page.locator('#move-'+i).selectOption('chirka.s'+(i+1));
 await page.locator('#enter').click();
 await page.waitForFunction(()=>mamokenStory.mode==='explore',undefined,{timeout:90000});
 // Move and talk through the product UI; no replacement actor/loader is used.
 await page.keyboard.down('w');
 try{await page.waitForFunction(()=>mamokenStory.nearby?.id==='moguzo',undefined,{timeout:10000});}
 finally{await page.keyboard.up('w');}
 await page.locator('#talk').tap();await page.locator('#challenge').click();
 await page.waitForFunction(()=>mamokenStory.mode==='battle'&&mamokenStory.battle?.frame>3,undefined,{timeout:120000});
 assert.equal(await page.evaluate(()=>mamokenStory.actors[0].baseId),'chirka');
 assert.deepEqual(await page.evaluate(()=>mamokenStory.avatar.combat.specials),['chirka.s1','chirka.s2','chirka.s3']);
 // Suppress CPU decisions only in the acceptance fixture. Latch at the exact
 // real Battle startup boundary, before main.js samples and renders the actor.
 await page.evaluate(()=>{
  const g=mamokenStory.battle;g.__storyMotionOriginalTick=g.tick;
  g.tick=function(input={}){
   const value=this.__storyMotionOriginalTick.call(this,input,{}),p=this.fighters[0],probe=this.__storyMotionProbe;
   if(probe&&p.action?.id===probe.slot&&p.frame===p.action.startup){
    p.stop=10000;this.fighters[1].stop=10000;probe.frozen=true;
   }
   return value;
  };
 });
 for(const slot of ['stand_heavy','crouch_heavy'])for(const facing of [1,-1]){
  await page.keyboard.up('ArrowDown');
  await page.evaluate(async({slot,facing})=>{
   const {ROSTER}=await import('../dojo/balance.js');
   const g=mamokenStory.battle;g.phase='fight';g.winner=null;g.time=75*60;g.projectiles=[];g.events=[];g.pending=[];
   for(const p of g.fighters){
    Object.assign(p,{action:null,frame:0,stun:0,stop:0,used:false,spawned:false,ko:false,prev:{},input:{},state:'idle',y:0,vy:0,dashF:0,dashRecovery:0,landF:0});
    p.hp=ROSTER[p.id].hp;
   }
   const [p,t]=g.fighters;p.x=-facing*.35;p.facing=facing;t.x=facing*1.7;t.facing=-facing;t.stun=10000;
   g.__storyMotionProbe={slot,facing,frozen:false};
  },{slot,facing});
  if(slot.startsWith('crouch'))await page.keyboard.down('ArrowDown');
  await page.locator('[data-control="strong"]').tap();
  await page.waitForFunction(slot=>{
   const g=mamokenStory.battle,a=mamokenStory.actors[0],p=g.fighters[0];
   return g.__storyMotionProbe?.frozen&&p.action?.id===slot&&p.frame===p.action.startup&&a.currentName==='v15_'+slot;
  },slot,{timeout:10000});
  const row=await page.evaluate(async()=>{
   const THREE=await import('three'),g=mamokenStory.battle,p=g.fighters[0],actor=mamokenStory.actors[0];
   const clip=actor.current.getClip(),time=actor.current.time,measurement=p.customMeasurement.normals[p.action.id];
   const tracks=clip.tracks.filter(track=>track.name.endsWith('.morphTargetInfluences'));
   const meshTargets=actor.avatar.meshes.filter(mesh=>mesh.morphTargetInfluences?.length).map(mesh=>mesh.name);
   const boundTargets=tracks.map(track=>track.name.slice(0,-'.morphTargetInfluences'.length));
   let maxMorphError=0;
   for(const mesh of actor.avatar.meshes){
    if(!mesh.morphTargetInfluences?.length)continue;
    const track=tracks.find(t=>t.name===mesh.name+'.morphTargetInfluences');
    if(!track)continue;
    const expected=track.createInterpolant().evaluate(time);
    for(let i=0;i<expected.length;i++)maxMorphError=Math.max(maxMorphError,Math.abs(expected[i]-mesh.morphTargetInfluences[i]));
   }
   const bonePart=name=>{
    const n=name.toLowerCase().replace(/[^a-z0-9]/g,''),side=n.endsWith('l')?'L':n.endsWith('r')?'R':'';
    if(/paw|hand|wrist|elbow|shoulder|clav|forearm|upperarm|arm/.test(n))return 'arm'+side;
    if(/foot|shin|thigh|knee|ankle|leg|toe/.test(n))return 'leg'+side;
    if(/tail/.test(n))return 'tail';return /head|jaw|ear|neck|snout|nose|beak/.test(n)?'head':'body';
   };
   actor.holder.updateMatrixWorld(true);
   const point=new THREE.Vector3();let reach=-Infinity,height=0,vertices=0;
   for(const mesh of actor.avatar.meshes){
    if(!mesh.visible)continue;
    mesh.skeleton.update();
    const {position,skinIndex,skinWeight}=mesh.geometry.attributes;
    for(let i=0;i<position.count;i++){
     let strongest=0;for(let j=1;j<4;j++)if(skinWeight.getComponent(i,j)>skinWeight.getComponent(i,strongest))strongest=j;
     const bone=mesh.skeleton.bones[skinIndex.getComponent(i,strongest)];
     if(bonePart(bone.name)!==measurement.attackPart)continue;
     mesh.getVertexPosition(i,point);point.applyMatrix4(mesh.matrixWorld);vertices++;
     const forward=(point.x-p.x)*p.facing;
     if(forward>reach){reach=forward;height=point.y-p.y;}
    }
   }
   return {slot:p.action.id,facing:p.facing,frame:p.frame,startup:p.action.startup,clip:clip.name,time,
    attackPart:measurement.attackPart,vertices,reach,height,expectedReach:p.action.activeReach[0].reach,expectedHeight:p.action.activeReach[0].height,
    meshTargets,boundTargets,maxMorphError,morphCounts:actor.avatar.meshes.map(mesh=>({name:mesh.name,count:mesh.morphTargetInfluences?.length??0}))};
  });
  assert.equal(row.facing,facing);assert.equal(row.frame,row.startup);assert.ok(row.vertices>0,'missing actual striking surface');
  assert.ok(row.meshTargets.length>=7,'Story actor does not use the modular asset');
  assert.deepEqual([...new Set(row.boundTargets)].sort(),[...new Set(row.meshTargets)].sort(),'Story clip did not bind the morph stream to every avatar module');
  assert.ok(row.maxMorphError<1e-5,'Story mixer did not apply the actual morph samples: '+row.maxMorphError);
  assert.ok(Number.isFinite(row.reach)&&Math.abs(row.reach-row.expectedReach)<.015,'Story playback diverges from measured hit reach: '+JSON.stringify(row));
  assert.ok(Number.isFinite(row.height)&&Math.abs(row.height-row.expectedHeight)<.015,'Story playback diverges from measured hit height: '+JSON.stringify(row));
  report.push(row);await page.screenshot({path:dir+'/'+slot+'-'+(facing===1?'right':'left')+'.png'});
 }
 await page.keyboard.up('ArrowDown');assert.deepEqual(errors,[]);
 await writeFile(dir+'/report.json',JSON.stringify({report,errors},null,2));
 console.log('STORY MOTION WEBGL PASS: Chirka standing/crouching heavy in both directions, all module morph tracks applied, actual Story skin reach/height matches Battle contact');
}catch(error){await page.screenshot({path:dir+'/failure.png'}).catch(()=>{});console.error('page errors',errors);throw error;}
finally{await browser.close();}
