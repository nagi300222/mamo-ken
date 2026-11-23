// Real browser UI acceptance. Terminal state injection below only accelerates
// result/KO conditions; editor, movement, conversation and skill use are real UI.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('playwright-core');
const root=process.env.MAMOKEN_URL??'http://127.0.0.1:4173/exp/fable-3d/story/';
const dir=process.env.MAMOKEN_EVIDENCE??'/tmp/mamoken-story';await mkdir(dir,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH??'/usr/bin/google-chrome',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:852,height:393},hasTouch:true,isMobile:true});
const errors=[],report=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('favicon.ico'))errors.push(r.status()+' '+r.url());});
page.on('console',m=>{if(['warning','error'].includes(m.type()))console.log('STORY BROWSER',m.type(),m.text());});
try{
 await page.goto(root);await page.waitForFunction(()=>mamokenStory.previewReady,undefined,{timeout:90000});
 await page.locator('#avatar-name').fill('山風のナギ');
 assert.equal(await page.locator('#avatar-style option').count(),9);
 await page.locator('#part-head').selectOption('pisuke');
 if(await page.locator('#p4-editor-tab-1').count())await page.locator('#p4-editor-tab-1').click();else await page.locator('details').nth(1).locator('summary').click();
 await page.locator('#avatar-pattern').selectOption('stripes');
 await page.locator('#color-fields').locator('input').first().evaluate(e=>{e.value='#69967d';e.dispatchEvent(new Event('input',{bubbles:true}));});
 if(await page.locator('#p4-editor-tab-2').count())await page.locator('#p4-editor-tab-2').click();
 await page.locator('#move-0').selectOption('pisuke.s1');
 await page.screenshot({path:dir+'/01-editor.png'});
 // Submit in the same event turn as a colour edit: an outstanding preview timer
 // must not invalidate the enterVillage load token or strand the loading screen.
 await page.evaluate(()=>{const input=document.querySelector('#color-fur');input.value='#69967d';input.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('#avatar-form').requestSubmit();});await page.waitForFunction(()=>mamokenStory.mode==='explore',undefined,{timeout:90000});
 assert.equal(await page.evaluate(()=>mamokenStory.avatar.name),'山風のナギ');assert.equal(await page.evaluate(()=>mamokenStory.avatar.appearance.parts.head),'pisuke');assert.equal(await page.evaluate(()=>mamokenStory.avatar.appearance.pattern),'stripes');assert.equal(await page.evaluate(()=>mamokenStory.avatar.combat.specials[0]),'pisuke.s1');
 await page.keyboard.down('w');await page.waitForFunction(()=>mamokenStory.nearby?.id==='moguzo',undefined,{timeout:20000});await page.keyboard.up('w');
 const returnPosition=await page.evaluate(()=>mamokenStory.progress.position);
 await page.locator('#talk').tap();await page.waitForFunction(()=>mamokenStory.mode==='dialogue');
 assert.match(await page.locator('#dialogue-name').textContent(),/モグゾー/);
 await page.locator('#talk-close').click();await page.waitForFunction(()=>mamokenStory.mode==='explore');
 await page.locator('#talk').tap();await page.locator('#challenge').click();
 await page.waitForFunction(()=>mamokenStory.mode==='battle'&&mamokenStory.battle.frame>5,undefined,{timeout:120000});
 assert.equal(await page.evaluate(()=>{const a=mamokenStory.actors[0],clip=a.actions.v15_stand_weak.getClip();return clip.tracks.filter(t=>t.name.endsWith('.morphTargetInfluences')).length===a.avatar.meshes.filter(m=>m.morphTargetInfluences).length;}),true,'game replay must use the same modular morph binding as skin measurement');
 await page.locator('[data-control="special"]').tap();
 await page.waitForFunction(()=>mamokenStory.events.some(e=>e.type==='move'&&e.slot===0&&e.action==='s1'),undefined,{timeout:10000});
 report.push(await page.evaluate(()=>({mode:mamokenStory.mode,custom:mamokenStory.battle.fighters[0].definition,metrics:mamokenStory.metrics})));
 await page.screenshot({path:dir+'/02-custom-battle.png'});
 // Real confirmed ultimate in the same custom Battle; movie time is separate
 // from the frozen combat clock and returns the original edited appearance.
 await page.evaluate(()=>{const g=mamokenStory.battle,[a,t]=g.fighters;g.projectiles=[];a.x=-.18;t.x=.18;a.y=t.y=a.vy=t.vy=0;a.action=t.action=null;a.frame=t.frame=0;a.state=t.state='idle';a.input=t.input={};a.stun=a.stop=0;t.stun=600;t.stop=0;a.super=100;a.prev.ultimateButton=false;t.hp=1000;t.ability.grit=false;});
 await page.locator('[data-control="ultimateButton"]').tap();
 await page.waitForFunction(()=>mamokenStory.events.some(e=>e.type==='ultimate_hit'),undefined,{timeout:20000});
 await page.waitForFunction(()=>mamokenStory.cinematic.elapsed>1||mamokenStory.mode==='battle',undefined,{timeout:120000});
 assert.equal(await page.evaluate(()=>mamokenStory.cinematic.active),true,'confirmed movie failed to load; see browser warning');
 const frozen=await page.evaluate(()=>({frame:mamokenStory.battle.frame,time:mamokenStory.battle.time,hp:mamokenStory.battle.fighters.map(f=>f.hp)}));
 await page.waitForFunction(()=>mamokenStory.cinematic.elapsed>2,undefined,{timeout:20000});
 assert.deepEqual(await page.evaluate(()=>({frame:mamokenStory.battle.frame,time:mamokenStory.battle.time,hp:mamokenStory.battle.fighters.map(f=>f.hp)})),frozen);
 await page.screenshot({path:dir+'/02b-style-ultimate.png'});await page.locator('#movie-skip').tap();await page.waitForFunction(()=>mamokenStory.mode==='battle');
 assert.equal(await page.evaluate(()=>mamokenStory.actors[0].definition.appearance.parts.head),'pisuke');
 // Explicitly force a terminal condition only; no replacement Battle or fake result.
 await page.evaluate(()=>{const g=mamokenStory.battle;g.fighters[0].hp=500;g.fighters[1].hp=0;});
 await page.waitForFunction(()=>mamokenStory.mode==='result',undefined,{timeout:10000});assert.equal(await page.evaluate(()=>mamokenStory.progress.battles),1);
 await page.locator('#return').click();await page.waitForFunction(()=>mamokenStory.mode==='explore');
 const after=await page.evaluate(()=>mamokenStory.progress);assert.deepEqual(after.position,returnPosition);assert.equal(after.wins,1);
 await page.screenshot({path:dir+'/03-return.png'});
 await page.reload();await page.waitForFunction(()=>mamokenStory.previewReady,undefined,{timeout:90000});
 assert.equal(await page.locator('#avatar-name').inputValue(),'山風のナギ');assert.equal(await page.evaluate(()=>mamokenStory.progress.wins),1);assert.equal(await page.locator('#move-0').inputValue(),'pisuke.s1');assert.equal(await page.locator('#part-head').inputValue(),'pisuke');assert.equal(await page.locator('#avatar-pattern').inputValue(),'stripes');
 // Re-edit style independently from the visual base, then end a second actual
 // Battle by timeout draw. The existing win count and location must survive.
 if(await page.locator('#p4-editor-tab-2').count())await page.locator('#p4-editor-tab-2').click();
 await page.locator('#avatar-style').selectOption('pisuke');await page.locator('#move-0').selectOption('yomikage.s1');await page.locator('#enter').click();
 await page.waitForFunction(()=>mamokenStory.mode==='explore'&&mamokenStory.nearby?.id==='moguzo',undefined,{timeout:90000});
 await page.locator('#talk').tap();await page.locator('#challenge').click();await page.waitForFunction(()=>mamokenStory.mode==='battle'&&mamokenStory.battle.frame>0,undefined,{timeout:120000});
 assert.equal(await page.evaluate(()=>mamokenStory.battle.fighters[0].id),'pisuke');assert.equal(await page.evaluate(()=>mamokenStory.actors[0].baseId),'moguzo');
 await page.evaluate(()=>{const g=mamokenStory.battle;g.fighters[0].hp=0;g.fighters[1].hp=0;g.time=1;});
 await page.waitForFunction(()=>mamokenStory.mode==='result');assert.equal(await page.evaluate(()=>mamokenStory.progress.battles),2);assert.equal(await page.evaluate(()=>mamokenStory.progress.wins),1);
 assert.match(await page.locator('#result-reason').textContent(),/TIME UP/);await page.locator('#return').click();await page.waitForFunction(()=>mamokenStory.mode==='explore');
 assert.deepEqual(await page.evaluate(()=>mamokenStory.progress.position),returnPosition);
 await page.locator('#edit').click();await page.waitForFunction(()=>mamokenStory.previewReady); 
 await page.setViewportSize({width:393,height:852});await page.waitForFunction(()=>mamokenStory.landscapeLocked);
 await page.screenshot({path:dir+'/04-portrait-locked.png'});
 // A hidden-tab autosave must not replace an unreadable existing save until
 // the user explicitly chooses to save a newly created character.
 // Seed before the new document boots. The outgoing valid session is allowed
 // to autosave on reload; that is separate from preserving an unreadable load.
 await page.addInitScript(()=>localStorage.setItem('mamoken.story.v16.1','{invalid-preserve-me'));
 await page.reload();await page.waitForFunction(()=>mamokenStory.previewReady,undefined,{timeout:90000});
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});
 assert.equal(await page.evaluate(()=>localStorage.getItem('mamoken.story.v16.1')),'{invalid-preserve-me');
 assert.deepEqual(errors,[]);await writeFile(dir+'/report.json',JSON.stringify({report,returnPosition,after,errors},null,2));
 console.log('Story actual WebGL PASS: avatar editor/save, cross-style skill, free movement, dialogue/cancel, Battle/KO, same-position return, reload, portrait lock.');
} catch(error){await page.screenshot({path:dir+'/error.png'}).catch(()=>{});console.error('story state',await page.evaluate(()=>({mode:window.mamokenStory?.mode,status:document.querySelector('#status')?.textContent,editorError:document.querySelector('#editor-error')?.textContent,loading:document.querySelector('#loading-copy')?.textContent,position:window.mamokenStory?.progress?.position})).catch(()=>null));console.error('page errors',errors);throw error;}
finally{await browser.close();}
