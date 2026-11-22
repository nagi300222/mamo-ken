// Real GLB and WebGL playback regression of all 54 v15 distinct normal animations.
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('playwright-core');
const base=process.env.MAMOKEN_URL||'http://127.0.0.1:4173/exp/fable-3d/dojo/';
const dir=process.env.MAMOKEN_EVIDENCE||'/tmp/mamoken-v15-normals';
await mkdir(dir,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/google-chrome',
 args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:852,height:393},isMobile:true,hasTouch:true,deviceScaleFactor:1});
const errors=[];page.on('pageerror',e=>errors.push('JS '+e.message));
page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('favicon.ico'))errors.push(r.status()+' '+r.url());});
page.on('console',c=>{if(/PropertyBinding.*(not found|failed)/.test(c.text()))errors.push('Animation bind: '+c.text());});
const ids=['moguzo','pisuke','godan','hakuma','chirka','takimaru','yomikage','bullet','dark_moguzo'];
const moves=['stand_weak','stand_heavy','crouch_weak','crouch_heavy','air_weak','air_heavy'];
const completed=[];
try{
 await page.goto(base,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.mamoken3d);
 for(const [index,id] of ids.entries()){
   await page.locator('#selection').waitFor({state:'visible'});
   await page.locator('.fighter-card').nth(index).tap();
   await page.locator('#match-mode').selectOption('practice');
   await page.locator('#start').tap();
   await page.waitForFunction(id=>mamoken3d?.actors?.[0]?.id===id&&
     mamoken3d.battle?.frame>0&&mamoken3d.practice.enabled,id,{timeout:35000});
   const actions=await page.evaluate(()=>{
     const a=mamoken3d.actors[0];
     return Object.fromEntries(Object.entries(a.actions).filter(([key])=>key.startsWith('v15_'))
       .map(([key,action])=>[key,{duration:action.getClip().duration,tracks:action.getClip().tracks.length}]));
   });
   assert.equal(Object.keys(actions).length,6,'missing normal package '+id);
   for(const slot of moves){
     const actionName='v15_'+slot;
     assert.ok(actions[actionName]?.tracks>=4,id+'/'+slot+' missing 3D rig tracks');
     const began=await page.evaluate(async ({id,slot})=>{
       const {normalMove}=await import('./balance.js');
       const g=mamoken3d.battle,p=g.fighters[0],t=g.fighters[1];
       p.action=null;p.frame=0;p.stun=0;p.stop=0;p.ko=false;
       p.y=slot.startsWith('air_')?.24:0;p.vy=0;
       p.x=-.64;t.x=.64;t.stun=380;t.stop=0;t.action=null;t.ko=false;
       const began=g._begin(p,normalMove(id,slot),slot);
       // Freeze at the actual startup after naturally advancing anticipation/blending.
       const tick=g.tick;g.tick=function(...inputs){
         const result=tick.apply(this,inputs);
         if(p.action?.id===slot&&p.frame>=p.action.startup){p.stop=300;this.tick=tick;}
         return result;
       };
       return began;
     },{id,slot});
     assert.equal(began,true,'start failed '+id+'/'+slot);
     await page.waitForFunction(name=>mamoken3d.actors[0]?.currentName===name,actionName,{timeout:5000});
     const bound=await page.evaluate(name=>{
       const a=mamoken3d.actors[0],clip=a.actions[name].getClip();
       return {current:a.currentName,key:a.key,rotations:clip.tracks.filter(t=>t.name.endsWith('.quaternion')).length};
     },actionName);
     assert.equal(bound.current,actionName);
     assert.ok(bound.rotations>=3,id+'/'+slot+' did not bind bone rotations');
     await page.waitForFunction(({id,slot})=>{
       const p=mamoken3d.battle.fighters[0],a=mamoken3d.actors[0];
       return p.action?.id===slot&&p.frame===p.action.startup&&p.stop>0&&a.currentName==='v15_'+slot;
     },{id,slot},{timeout:5000});
     const clock=await page.evaluate(async ({id,slot})=>{
       const {normalClipTime}=await import('./normal-timing-v151.js');
       const p=mamoken3d.battle.fighters[0],a=mamoken3d.actors[0],duration=a.current.getClip().duration;
       return {frame:p.frame,time:a.current.time,expected:normalClipTime(id,slot,p.frame,p.action,duration),weight:a.current.getEffectiveWeight()};
     },{id,slot});
     assert.ok(Math.abs(clock.time-clock.expected)<1e-6,id+'/'+slot+' contact pose/active mismatch '+JSON.stringify(clock));
     assert.ok(clock.weight>.99,id+'/'+slot+' previous pose still blended at contact '+JSON.stringify(clock));
     const frozen=await page.evaluate(()=>({frame:mamoken3d.battle.fighters[0].frame,stop:mamoken3d.battle.fighters[0].stop,time:mamoken3d.actors[0].current.time}));
     await page.waitForFunction(stop=>mamoken3d.battle.fighters[0].stop<stop-1,frozen.stop);
     const after=await page.evaluate(()=>({frame:mamoken3d.battle.fighters[0].frame,time:mamoken3d.actors[0].current.time}));
     assert.equal(after.frame,frozen.frame,id+'/'+slot+' game advanced through hitstop');
     assert.equal(after.time,frozen.time,id+'/'+slot+' pose advanced through hitstop');
     const contact=await page.evaluate(async ({id,slot})=>{
       const {NORMAL_CONTACTS}=await import('./normal-contacts-v151.js');
       const {normalMove}=await import('./balance.js');
       const expected=NORMAL_CONTACTS[id][slot],a=mamoken3d.actors[0],p=mamoken3d.battle.fighters[0];
       a.holder.updateMatrixWorld(true);
       const part=n=>{
         const s=n.toLowerCase(),side=/(_l|\.l)$/.test(s)||/[a-z]L$/.test(n)?'L':/(_r|\.r)$/.test(s)||/[a-z]R$/.test(n)?'R':'';
         if(/paw|hand|wrist|elbow|shoulder|clav|forearm|upper_?arm|arm/.test(s))return 'arm'+side;
         if(/foot|shin|thigh|knee|ankle|leg|toe/.test(s))return 'leg'+side;
         if(/tail/.test(s))return 'tail';if(/head|jaw|ear|neck|snout|nose|beak/.test(s))return 'head';return 'body';
       };
       let forward=-Infinity;
       a.gltf.scene.traverse(o=>{
         if(!o.isSkinnedMesh)return;
         const g=o.geometry,si=g.attributes.skinIndex,sw=g.attributes.skinWeight,v=o.position.clone();
         for(let i=0;i<g.attributes.position.count;i++){
           let bone=0,weight=-1;for(let k=0;k<4;k++)if(sw.getComponent(i,k)>weight){weight=sw.getComponent(i,k);bone=si.getComponent(i,k);}
           if(part(o.skeleton.bones[bone].name)!==expected.attackPart)continue;
           o.getVertexPosition(i,v);v.applyMatrix4(o.matrixWorld);forward=Math.max(forward,(v.x-p.x)*p.facing);
         }
       });
       return {forward,expected:expected.reach,configured:normalMove(id,slot).reach,status:expected.status,part:expected.attackPart};
     },{id,slot});
     assert.equal(contact.status,'ok',id+'/'+slot+' still has unresolved motion audit '+JSON.stringify(contact));
     assert.ok(Math.abs(contact.forward-contact.expected)<.015,id+'/'+slot+' visual limb/metadata reach mismatch '+JSON.stringify(contact));
     assert.equal(contact.configured,contact.expected,id+'/'+slot+' transparent reach extension');
     if(id==='bullet')assert.equal(contact.part,slot==='stand_weak'?'head':'tail',id+'/'+slot+' wrong intended striking part');
     completed.push(id+'/'+slot);
     if(slot==='stand_heavy'||slot==='crouch_heavy'||slot==='air_heavy'){
       await page.screenshot({path:dir+'/'+id+'-'+slot+'.png'});
     }
   }
   await page.locator('#select-back').tap();
 }
 assert.equal(completed.length,54);
 assert.deepEqual(errors,[]);
 console.log('V15 NORMALS WEBGL PASS: 54 character-specific GLB clips played on original 9 rig models',JSON.stringify(completed));
}catch(e){
 await page.screenshot({path:dir+'/failure.png'}).catch(()=>{});
 console.error('WebGL errors:',errors,'completed:',completed);
 throw e;
}finally{await browser.close();}
