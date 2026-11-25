// Actual Chromium/WebGL and native browser touch dispatch for P0. State mutation
// is restricted to terminal/attack fixtures; exploration gestures are real input.
import assert from 'node:assert/strict';import {mkdir,writeFile} from 'node:fs/promises';import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('playwright-core');
const base=process.env.MAMOKEN_URL??'http://127.0.0.1:4173/exp/fable-3d/story/';
const output=process.env.MAMOKEN_EVIDENCE??'/tmp/mamoken-p0';await mkdir(output,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH??'/usr/bin/google-chrome',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:852,height:393},hasTouch:true,isMobile:true});const errors=[],report={};
page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('favicon.ico'))errors.push(r.status()+' '+r.url());});
const cdp=await page.context().newCDPSession(page);
const touch=(id,x,y)=>({id,x,y,radiusX:4,radiusY:4,force:1});
const touches=async(type,points=[])=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points});
try{
 await page.goto(base);await page.waitForFunction(()=>mamokenStory.previewReady,undefined,{timeout:90000});await page.locator('#enter').click();await page.waitForFunction(()=>mamokenStory.mode==='explore',undefined,{timeout:90000});
 await page.keyboard.down('w');await page.waitForFunction(()=>mamokenStory.nearby?.id==='moguzo',undefined,{timeout:30000});await page.keyboard.up('w');
 const original=await page.evaluate(()=>({position:mamokenStory.progress.position,view:mamokenStory.controls.exploration}));
 // A right swipe rotates/pitches without moving the avatar.
 const orbit=await page.locator('#camera-orbit').boundingBox(),stick=await page.locator('#story-stick').boundingBox();
 const right=touch(22,orbit.x+orbit.width*.5,orbit.y+orbit.height*.45);
 await touches('touchStart',[right]);await touches('touchMove',[touch(22,right.x+65,right.y+25)]);await touches('touchEnd');
 await page.waitForFunction(yaw=>Math.abs(mamokenStory.controls.exploration.yaw-yaw)>.2,original.view.yaw);
 let observed=await page.evaluate(()=>({position:mamokenStory.progress.position,view:mamokenStory.controls.exploration}));assert.deepEqual(observed.position,original.position);assert.notEqual(observed.view.pitch,original.view.pitch);
 await page.locator('#camera-reset').tap();await page.locator('#camera-follow').tap();assert.equal(await page.locator('#camera-follow').getAttribute('aria-pressed'),'false');
 const left=touch(11,stick.x+stick.width*.5,stick.y+stick.height*.5);
 // Two active native pointers: right view input does not change the left stick.
 await touches('touchStart',[left,right]);await page.waitForFunction(()=>mamokenStory.controls.exploration.leftPointer!==null&&mamokenStory.controls.exploration.rightPointer!==null);
 await touches('touchMove',[touch(11,left.x,left.y-30),touch(22,right.x+32,right.y+12)]);
 await page.waitForFunction(pos=>Math.hypot(mamokenStory.progress.position.x-pos.x,mamokenStory.progress.position.z-pos.z)>.015,original.position);
 const simultaneous=await page.evaluate(()=>mamokenStory.controls.exploration);assert.ok(simultaneous.stick.y<-.5);assert.notEqual(simultaneous.leftPointer,simultaneous.rightPointer);
 // Third pointer invokes Talk while both control gestures still exist. Opening
 // dialogue must release every capture rather than leak it into Battle.
 const talk=await page.locator('#talk').boundingBox();assert.ok(talk);
 await touches('touchStart',[touch(11,left.x,left.y-30),touch(22,right.x+32,right.y+12),touch(33,talk.x+talk.width*.5,talk.y+talk.height*.5)]);
 await page.waitForFunction(()=>mamokenStory.mode==='dialogue');await touches('touchEnd');
 assert.equal(await page.evaluate(()=>mamokenStory.controls.exploration.leftPointer),null);assert.equal(await page.evaluate(()=>mamokenStory.controls.exploration.rightPointer),null);
 await page.locator('#talk-close').click();await page.waitForFunction(()=>mamokenStory.mode==='explore');
 let position=await page.evaluate(()=>mamokenStory.progress.position),view=await page.evaluate(()=>mamokenStory.controls.exploration);
 // A blur clears held keys and both pointer streams, requiring explicit resume.
 await page.keyboard.down('ArrowRight');await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await page.keyboard.up('ArrowRight');
 assert.equal(await page.evaluate(()=>mamokenStory.controls.paused),true);assert.deepEqual(await page.evaluate(()=>mamokenStory.controls.battle.keys),[]);await page.locator('#pause').tap();position=await page.evaluate(()=>mamokenStory.progress.position);view=await page.evaluate(()=>mamokenStory.controls.exploration);
 await page.locator('#talk').tap();
 // Native inactive arrives in the same task as a user-started asynchronous load.
 // Finishing that load must not silently start combat in the background.
 await page.evaluate(()=>{document.querySelector('#challenge').click();window.dispatchEvent(new CustomEvent('mamoken:native-state',{detail:{active:false}}));});
 await page.waitForFunction(()=>mamokenStory.mode==='battle',undefined,{timeout:120000});assert.equal(await page.evaluate(()=>mamokenStory.controls.paused),true);assert.equal(await page.evaluate(()=>mamokenStory.battle.frame),0);
 await page.evaluate(()=>window.dispatchEvent(new CustomEvent('mamoken:native-state',{detail:{active:true}})));assert.equal(await page.evaluate(()=>mamokenStory.controls.paused),true);await page.locator('#pause').tap();await page.waitForFunction(()=>mamokenStory.battle.frame>2);
 assert.deepEqual(await page.locator('#battle-buttons [data-control]').evaluateAll(nodes=>nodes.map(n=>n.dataset.control)),['weak','strong','throw','gyuiin','special','ultimateButton']);
 assert.deepEqual(await page.locator('#battle-steps [data-control]').evaluateAll(nodes=>nodes.map(n=>n.dataset.control)),['stepBack','stepForward']);
 for(const id of ['hp-0','hp-1','drive-0','drive-1','meter-0','meter-1','timer','name-0','name-1'])assert.equal(await page.locator('#'+id).count(),1,id);
 assert.equal(await page.locator('#camera-orbit').isVisible(),false);
 const storyAttack=key=>page.locator(`#battle-buttons [data-control=${key}]`);
 const faceColor=key=>storyAttack(key).locator('.bt-face').evaluate(e=>getComputedStyle(e).fill);
 assert.deepEqual(await page.locator('#battle-buttons svg.bt').evaluateAll(nodes=>nodes.map(n=>n.dataset.symbol)),['B','A','Y','Z','S','X']);
 await page.evaluate(()=>{
  const [p,cpu]=mamokenStory.battle.fighters;
  cpu.stun=2000;cpu.action=null;p.super=0;p.drive=20;
 });
 await page.waitForFunction(()=>['ultimateButton','gyuiin'].every(key=>document.querySelector(`[data-control=${key}]`).hasAttribute('data-wait')));
 assert.equal(await faceColor('ultimateButton'),'rgb(52, 50, 74)');
 assert.equal(await faceColor('gyuiin'),'rgb(51, 57, 63)');
 await page.evaluate(()=>{mamokenStory.battle.fighters[0].super=100;});
 await page.waitForFunction(()=>getComputedStyle(document.querySelector('#battle-buttons .bt-ring')).opacity==='1');
 assert.equal(await faceColor('ultimateButton'),'rgb(216, 155, 36)');
 await page.screenshot({path:output+'/story-v2-852-ready.png'});
 const strong=await storyAttack('strong').boundingBox();
 await touches('touchStart',[touch(44,strong.x+strong.width/2,strong.y+strong.height/2)]);
 await page.waitForFunction(()=>getComputedStyle(document.querySelector('#battle-buttons [data-control=strong] .bt-body')).translate==='0px 3px');
 assert.equal(await faceColor('strong'),'rgb(104, 47, 38)');
 await page.screenshot({path:output+'/story-v2-852-held.png'});
 await page.locator('#story-battle-help').press('Enter');
 await page.waitForFunction(()=>document.querySelector('#commands-help').matches(':popover-open'));
 assert.equal(await storyAttack('strong').evaluate(e=>e.classList.contains('held')),false);
 assert.deepEqual(await page.evaluate(()=>mamokenStory.controls.battle.pointers),[]);
 await touches('touchEnd');
 await page.locator('#commands-help button').tap();
 for(const [layout,insets] of [
  ['720',{left:0,right:0,bottom:0}],
  ['720-notch-left',{left:58,right:20,bottom:21}],
  ['720-notch-right',{left:20,right:58,bottom:21}],
 ]){
  await page.setViewportSize({width:720,height:320});
  await cdp.send('Emulation.setSafeAreaInsetsOverride',{insets:{top:0,...insets}});
  await page.evaluate(()=>dispatchEvent(new Event('resize')));
  const geometry=await page.evaluate(()=>{
   const hudBottom=Math.max(...[...document.querySelectorAll('#battle-hud .hud-side')].map(e=>e.getBoundingClientRect().bottom));
   const buttons=[...document.querySelectorAll('#battle-buttons [data-control],#battle-steps [data-control]')].map(button=>{
    const r=button.getBoundingClientRect();
    return {key:button.dataset.control,rect:r.toJSON(),hit:document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('button')===button};
   });
   return {hudBottom,buttons};
  });
  assert.ok(geometry.hudBottom<geometry.buttons.find(b=>b.key==='ultimateButton').rect.top,layout+' HUD overlap');
  assert.ok(geometry.buttons.every(({hit,rect:r})=>hit&&r.left>=insets.left-.5&&r.right<=720-insets.right+.5&&r.bottom<=320-insets.bottom+.5),JSON.stringify(geometry));
  await page.screenshot({path:output+`/story-v2-${layout}.png`});
 }
 await cdp.send('Emulation.setSafeAreaInsetsOverride',{insets:{top:0,bottom:0,left:0,right:0}});
 await page.setViewportSize({width:852,height:393});
 await page.locator('#pause').tap();const frame=await page.evaluate(()=>mamokenStory.battle.frame);await page.locator('[data-control="weak"]').tap();await page.waitForTimeout(120);assert.equal(await page.evaluate(()=>mamokenStory.battle.frame),frame);await page.locator('#pause').tap();
 // Forward/backstep touch buttons use the same existing Battle actions as dojo.
 await page.evaluate(()=>{const g=mamokenStory.battle;for(const f of g.fighters){f.action=null;f.stun=0;f.stop=0;f.y=0;f.ko=false;}g.fighters[0].x=-.9;g.fighters[1].x=1.6;g.fighters[1].stun=1000;});
 await page.locator('[data-control="stepBack"]').tap();await page.waitForFunction(()=>mamokenStory.battle.fighters[0].locomotion>0);assert.ok(await page.evaluate(()=>mamokenStory.battle.fighters[0].x<-.9));
 await page.screenshot({path:output+'/shared-story-battle.png'});
 // Simulate browser logical safe-area insets in a real layout. This is a CSS
 // acceptance probe, not a claim to have used an iPhone's Dynamic Island.
 await page.evaluate(()=>{const app=document.querySelector('#story-app');app.style.setProperty('--story-safe-start','59px');app.style.setProperty('--story-safe-end','59px');window.dispatchEvent(new Event('resize'));});
 for(const selector of ['#story-stick','#battle-steps','#battle-buttons','#battle-hud']){const b=await page.locator(selector).boundingBox();assert.ok(b&&b.x>=59-1&&b.x+b.width<=852-59+1,'unsafe landscape inset '+selector+JSON.stringify(b));}
 const stage=await page.locator('#world').boundingBox();assert.equal(stage.x,0);assert.equal(stage.width,852);
 await page.screenshot({path:output+'/safe-area-story-battle.png'});await page.evaluate(()=>{const app=document.querySelector('#story-app');app.style.removeProperty('--story-safe-start');app.style.removeProperty('--story-safe-end');window.dispatchEvent(new Event('resize'));});
 for(const size of [{width:667,height:375},{width:568,height:320},{width:393,height:852}]){
  await page.setViewportSize(size);await page.waitForFunction(()=>mamokenStory.landscapeLocked=== (innerWidth<innerHeight));
  for(const selector of ['#story-stick','#battle-steps','#battle-buttons','#battle-hud','#world']){const b=await page.locator(selector).boundingBox();assert.ok(b&&b.x>=-1&&b.y>=-1&&b.x+b.width<=size.width+1&&b.y+b.height<=size.height+1,selector+JSON.stringify({b,size}));}
 }
 await page.setViewportSize({width:852,height:393});await page.evaluate(()=>{mamokenStory.battle.fighters[1].hp=0;});await page.waitForFunction(()=>mamokenStory.mode==='result');await page.locator('#return').click();await page.waitForFunction(()=>mamokenStory.mode==='explore');
 assert.deepEqual(await page.evaluate(()=>mamokenStory.progress.position),position);const returned=await page.evaluate(()=>mamokenStory.controls.exploration);for(const key of ['yaw','pitch','follow'])assert.equal(returned[key],view[key],key);
 await page.screenshot({path:output+'/independent-story-camera.png'});report.story={original,simultaneous,position,returned};
 // Regression for the unwanted ordinary-match Dark narration only. Gameplay's
 // Dark ability label and legacy Arcade narration remain independent contracts.
 await page.goto(new URL('../dojo/',base).href);await page.waitForFunction(()=>window.mamoken3d);
 // A native lifecycle event arrives before the async dojo model load resolves.
 // The presentation may finish its intro, but Battle must remain at frame zero.
 await page.evaluate(()=>{mamoken3d.startMatch({ids:['dark_moguzo','moguzo']});window.dispatchEvent(new CustomEvent('mamoken:native-state',{detail:{active:false}}));});
 await page.waitForFunction(()=>document.querySelector('#vs-screen').dataset.ready==='true',undefined,{timeout:90000});assert.equal(await page.locator('#vs-omen').isVisible(),false);assert.equal((await page.locator('#vs-omen').textContent()).trim(),'');
 await page.locator('#vs-screen').tap();await page.waitForFunction(()=>mamoken3d.presentation.state==='fight',undefined,{timeout:30000});assert.equal(await page.evaluate(()=>mamoken3d.battle.frame),0);assert.equal(await page.locator('#pause').textContent(),'再開');
 await page.evaluate(()=>window.dispatchEvent(new CustomEvent('mamoken:native-state',{detail:{active:true}})));await page.waitForTimeout(180);assert.equal(await page.evaluate(()=>mamoken3d.battle.frame),0,'native foreground must not auto-resume');await page.locator('#pause').tap();await page.waitForFunction(()=>mamoken3d.battle.frame>0);assert.match(await page.locator('#ability-0').textContent(),/暗連/);await page.screenshot({path:output+'/dark-ordinary-match.png'});
 assert.deepEqual(errors,[]);await writeFile(output+'/p0-report.json',JSON.stringify({report,errors},null,2));console.log('P0 actual WebGL PASS: independent multi-touch camera/move/talk, shared HUD+6buttons+steps, pause, return camera/save, short/portrait bounds, Dark ordinary VS copy and native async-load pause');
}catch(error){await page.screenshot({path:output+'/error.png'}).catch(()=>{});console.error('P0 page errors',errors);throw error;}
finally{await browser.close();}
