// P4 visual/interaction acceptance on the built site, not static screenshots.
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile,stat} from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('playwright-core');
// Serve the built artifact at its own origin root, exactly like Cloudflare and
// Capacitor. Mounting it below the repository path changes ../../../assets URLs.
const siteRoot=path.resolve(fileURLToPath(new URL('../../_pages/',import.meta.url)));
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.glb':'model/gltf-binary','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.svg':'image/svg+xml'};
let server=null;
let root=process.env.MAMOKEN_UI_URL;
if(!root){
 server=http.createServer(async(request,response)=>{
  try{
   let file=path.resolve(siteRoot,'.'+decodeURIComponent(new URL(request.url,'http://localhost').pathname));
   if(file!==siteRoot&&!file.startsWith(siteRoot+path.sep)){response.writeHead(403);response.end();return;}
   if((await stat(file)).isDirectory())file=path.join(file,'index.html');
   response.writeHead(200,{'content-type':mime[path.extname(file)]??'application/octet-stream','cache-control':'no-store'});response.end(await readFile(file));
  }catch{response.writeHead(404);response.end('Not found');}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));root='http://127.0.0.1:'+server.address().port+'/';
}
const dir=(process.env.MAMOKEN_EVIDENCE??'/tmp/mamoken-p4')+'/ui';await mkdir(dir,{recursive:true});
let browser;try{browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH??'/usr/bin/google-chrome',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});}catch(error){server?.close();throw error;}
const recording=process.env.MAMOKEN_UI_VIDEO==='1';
if(recording)await mkdir(dir+'/video',{recursive:true});
let context,page;
try{
 context=await browser.newContext({viewport:{width:852,height:393},isMobile:true,hasTouch:true,deviceScaleFactor:1,...(recording?{recordVideo:{dir:dir+'/video',size:{width:852,height:393}}}:{})});
 page=await context.newPage();
}catch(error){await browser.close();server?.close();throw error;}
const videoHandle=page.video(),errors=[],report=[];
let contextClosed=false,videoReceipt=null;
async function flushVideo(){
 if(!contextClosed){contextClosed=true;await context.close();}
 if(videoHandle&&!videoReceipt){
  const file=await videoHandle.path(),info=await stat(file);assert.ok(info.size>0,'recorded UI video is empty');
  videoReceipt={path:file,artifactPath:path.relative(dir,file),bytes:info.size,size:{width:852,height:393},environment:'Desktop Chromium / SwiftShader; not a physical phone'};
 }
 return videoReceipt;
}
page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('favicon.ico'))errors.push(r.status()+' '+r.url());});
async function tapTargets(selector){
 const rows=await page.locator(selector).evaluateAll(nodes=>nodes.filter(n=>!n.hidden&&n.getClientRects().length).map(n=>{const r=n.getBoundingClientRect();return {name:n.textContent.trim().slice(0,40),width:r.width,height:r.height};}));
 for(const row of rows)assert.ok(row.width>=43.9&&row.height>=43.9,'touch target below44: '+JSON.stringify(row));
 return rows;
}
async function visibleTargets(selector){
 const rows=await page.locator(selector).evaluateAll(nodes=>nodes.map(n=>{
  const r=n.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
  return {name:n.textContent.trim().slice(0,40),x:r.x,y:r.y,width:r.width,height:r.height,
   inside:r.left>=-1&&r.top>=-1&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1,
   unobscured:hit===n||n.contains(hit)};
 }));
 for(const row of rows)assert.ok(row.inside&&row.unobscured,'unreachable or obscured UI: '+JSON.stringify(row));
 return rows;
}
async function layoutEvidence(){
 return page.evaluate(()=>({viewport:{width:innerWidth,height:innerHeight},game:window.mamoken3d?{mode:document.querySelector('#match-mode')?.value,run:mamoken3d.run?{mode:mamoken3d.run.mode,status:mamoken3d.run.status,round:mamoken3d.run.round}:null,presentation:mamoken3d.presentation,frame:mamoken3d.battle?.frame,phase:mamoken3d.battle?.phase,loading:mamoken3d.diagnostics.loading,loadingCopy:document.querySelector('#loading-status')?.textContent,dialogueVisible:document.querySelector('#run-dialogue')?!document.querySelector('#run-dialogue').hidden:false}:null,nodes:[...document.querySelectorAll('.mode-hall,.modes,.mode-story,.mode-story>div,.journey-tag,#editor,.p4-editor-tabs,.p4-save-summary,.editor-actions')].map(n=>{
  const s=getComputedStyle(n),r=n.getBoundingClientRect(),range=document.createRange();range.selectNodeContents(n);
  return {element:n.id||n.className,bounds:r.toJSON(),textBounds:range.getBoundingClientRect().toJSON(),scroll:{top:n.scrollTop,height:n.scrollHeight,client:n.clientHeight},style:Object.fromEntries(['display','height','minHeight','gridTemplateRows','paddingTop','paddingBottom','overflowY','fontSize','lineHeight'].map(k=>[k,s[k]]))};
 })}));
}
try{
 for(const viewport of [{width:720,height:320},{width:852,height:393},{width:393,height:852}]){
  await page.setViewportSize(viewport);await page.goto(root,{waitUntil:'domcontentloaded'});
  assert.equal(await page.locator('.modes a[data-mode]').count(),5);
  await page.waitForFunction(()=>document.documentElement.dataset.uiArt==='v17-p4-ui-art-1');
  assert.match(await page.locator('.mode-versus .mode-kicker').evaluate(n=>getComputedStyle(n,'::before').backgroundImage),/mode-versus\.svg/);
  const targets=await tapTargets('.modes a');assert.equal(targets.length,5);
  const overflow=await page.evaluate(()=>{const r=document.querySelector('.mode-hall').getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,screen:[innerWidth,innerHeight]};});
  const upper=await visibleTargets('.mode-versus .mode-action,.mode-arcade .mode-rule,.mode-practice .mode-rule');
  await page.screenshot({path:dir+`/lobby-${viewport.width}x${viewport.height}.png`});
  const before=await page.locator('.mode-hall').evaluate(n=>({top:n.scrollTop,height:n.scrollHeight,client:n.clientHeight}));
  // Exercise actual user scrolling, including the portrait-rotated landscape menu.
  // A large page element or Playwright's automatic click scrolling is not proof
  // that the lower two mode actions can be reached in the viewport.
  await page.mouse.move(viewport.width/2,viewport.height/2);await page.mouse.wheel(0,2000);
  await page.waitForFunction(()=>{const n=document.querySelector('.mode-hall');return n.scrollTop+n.clientHeight>=n.scrollHeight-1;});
  const lower=await visibleTargets('.mode-story,.mode-survival,.mode-story .mode-rule,.mode-survival .mode-rule,.journey-tag');
  const tagContainment=await page.locator('.journey-tag').evaluate(tag=>({tag:tag.getBoundingClientRect().toJSON(),card:tag.closest('.mode-story').getBoundingClientRect().toJSON(),minHeight:getComputedStyle(tag.closest('.mode-story')).minHeight}));
  await page.screenshot({path:dir+`/lobby-lower-${viewport.width}x${viewport.height}.png`});
  assert.ok(tagContainment.tag.bottom<=tagContainment.card.bottom-1,'journey name clipped by its card: '+JSON.stringify(tagContainment));
  const after=await page.locator('.mode-hall').evaluate(n=>({top:n.scrollTop,height:n.scrollHeight,client:n.clientHeight}));
  if(before.height>before.client)assert.ok(after.top>before.top,'wheel did not scroll the menu');
  report.push({screen:'lobby',viewport,targets,overflow,upper,lower,tagContainment,scroll:{before,after}});
 }
 await page.setViewportSize({width:720,height:320});
 for(const mode of ['battle','practice','arcade','survival']){
  await page.goto(root);await page.locator(`[data-mode="${mode}"]`).click();
  await page.waitForFunction(()=>window.mamoken3d,undefined,{timeout:60000});
  assert.equal(await page.locator('#match-mode').inputValue(),mode);
  await tapTargets('.fighter-card');await tapTargets('#start,.selection-footer select:not([hidden])');
  await page.waitForFunction(()=>document.querySelectorAll('.fighter-card .p4-crest').length===9&&[...document.querySelectorAll('.p4-crest')].every(image=>image.complete&&image.naturalWidth>0));
  await page.locator('.fighter-card').nth(2).tap();assert.equal(await page.locator('#chosen-name').textContent(),'ゴダン');
  assert.match(await page.locator('.p4-profile').textContent(),/得意.*苦手/);
  await page.waitForFunction(()=>{const image=document.querySelector('.p4-selected-portrait'),selected=document.querySelector('.fighter-card.chosen img:not(.p4-crest)');return image&&!image.hidden&&image.complete&&image.naturalWidth>0&&image.currentSrc===selected?.currentSrc;});
  assert.ok(await page.locator('.p4-selected-portrait').evaluate(n=>n.getBoundingClientRect().height>=80),'selected face should be larger than roster thumbnails');
  const names=await page.locator('.fighter-card span').evaluateAll(nodes=>nodes.map(n=>({name:n.textContent,clipped:n.scrollWidth>n.clientWidth+1||n.scrollHeight>n.clientHeight+1})));assert.ok(names.every(n=>!n.clipped),'full roster names must remain readable: '+JSON.stringify(names));
  await page.locator('.p4-profile').scrollIntoViewIfNeeded();
  const profile=await visibleTargets('.p4-profile');
  const separation=await page.locator('.selection-footer').evaluate(footer=>({profileBottom:document.querySelector('.p4-profile').getBoundingClientRect().bottom,footerTop:footer.getBoundingClientRect().top,position:getComputedStyle(footer).position}));
  assert.ok(separation.footerTop>=separation.profileBottom,'selection footer covers strengths/weaknesses');
  await page.screenshot({path:dir+`/select-${mode}.png`});
  await page.locator('#start').scrollIntoViewIfNeeded();const start=await visibleTargets('#start');
  await page.screenshot({path:dir+`/select-actions-${mode}.png`});report.push({screen:'selection',mode,profile,separation,start});
  await page.locator('#start').tap();
  // Existing RunUI shows dialogue only on Arcade round one. Survival goes
  // directly to VS/face intro and must not wait for an absent dialogue.
  if(mode==='arcade'){
   await page.locator('#run-dialogue').waitFor({state:'visible',timeout:15000});
   const dialogue=[];
   for(let line=0;line<3&&await page.locator('#run-dialogue').isVisible();line++){
    const before=await page.locator('#run-dialogue').textContent();dialogue.push(before.trim());
    await tapTargets('#run-dialogue button');
    await page.screenshot({path:dir+'/'+mode+'-dialogue-'+line+'.png'});
    await page.locator('#run-dialogue button').tap();
    await page.waitForFunction(previous=>{const panel=document.querySelector('#run-dialogue');return panel.hidden||getComputedStyle(panel).display==='none'||panel.textContent!==previous;},before);
   }
   assert.equal(await page.locator('#run-dialogue').isVisible(),false,'run dialogue did not finish through its actual actions');
   report.push({screen:'actual-run-dialogue',mode,dialogue});
  }
  await page.waitForFunction(()=>!mamoken3d.diagnostics.loading&&mamoken3d.presentation.loaded&&mamoken3d.presentation.state==='fight'&&mamoken3d.presentation.inputEnabled&&mamoken3d.battle?.frame>2,undefined,{timeout:90000});
  if(mode==='survival')assert.equal(await page.locator('#run-dialogue').isVisible(),false,'Survival must retain its direct VS/intro flow');
  if(mode==='practice')assert.equal(await page.locator('#timer').textContent(),'∞');
  else assert.notEqual(await page.locator('#timer').textContent(),'∞');
  const controls=await page.locator('#buttons-rail .attack').evaluateAll(nodes=>nodes.map(n=>({key:n.dataset.control,art:getComputedStyle(n).backgroundImage})));
  assert.equal(controls.length,6);assert.ok(controls.every(n=>/button-(weak|heavy|throw|gyuiin|special|ultimate)\.svg/.test(n.art)),JSON.stringify(controls));
  assert.match(await page.locator('.hud .health .track').first().evaluate(n=>getComputedStyle(n).backgroundImage),/hud-hp-frame\.svg/);
  assert.match(await page.locator('.round-center').evaluate(n=>getComputedStyle(n).backgroundImage),/hud-timer-dark\.svg/);
  await tapTargets('#buttons-rail button,#stick-rail button');
  if(mode==='practice')await tapTargets('#practice-panel select,#practice-panel button');
  await page.screenshot({path:dir+'/'+mode+'-common-hud.png'});
  report.push({screen:'actual-battle-hud',mode,controls});
 }
 await page.goto(root);await page.locator('[data-mode="story"]').click();
 await page.waitForFunction(()=>window.mamokenStory?.previewReady,undefined,{timeout:90000});
 assert.equal(await page.getByRole('tab').count(),4);await tapTargets('#p4-editor-tabs button,#enter,#preview-turn');
 await page.locator('#avatar-name').fill('山の旅人');
 await page.locator('#p4-editor-tab-1').click();assert.equal(await page.locator('#color-fields').isVisible(),true);await tapTargets('#color-fields input');
 await page.locator('#avatar-pattern').selectOption('spots');
 await page.locator('#p4-editor-tab-2').click();await page.locator('#avatar-style').selectOption('pisuke');await page.locator('#move-0').selectOption('yomikage.s1');
 await page.locator('#p4-editor-tab-3').click();assert.equal(await page.locator('[data-save-name]').textContent(),'山の旅人');assert.match(await page.locator('[data-save-style]').textContent(),/ピスケ/);
 assert.match(await page.locator('.p4-save-summary').evaluate(n=>getComputedStyle(n).backgroundImage),/paper-strip\.svg/);
 await page.locator('.p4-save-summary').scrollIntoViewIfNeeded();const saveSummary=await visibleTargets('.p4-save-summary');
 const summaryGap=await page.locator('.p4-save-summary').evaluate(n=>n.getBoundingClientRect().top-document.querySelector('.p4-editor-tabs').getBoundingClientRect().bottom);
 assert.ok(summaryGap>=-1,'sticky tabs cover journey summary');report.push({screen:'editor-save-summary',saveSummary,summaryGap});
 await page.screenshot({path:dir+'/editor-save-tab.png'});
 await page.locator('#enter').scrollIntoViewIfNeeded();await visibleTargets('#enter');await page.screenshot({path:dir+'/editor-save-actions.png'});
 await page.locator('#p4-editor-tab-3').focus();await page.keyboard.press('ArrowLeft');assert.equal(await page.locator('#p4-editor-tab-2').getAttribute('aria-selected'),'true');
 await page.locator('#enter').click();await page.waitForFunction(()=>mamokenStory.mode==='explore',undefined,{timeout:90000});
 await page.screenshot({path:dir+'/exploration.png'});
 assert.equal(await page.evaluate(()=>mamokenStory.avatar.name),'山の旅人');assert.equal(await page.evaluate(()=>mamokenStory.avatar.combat.specials[0]),'yomikage.s1');
 const saved=await page.evaluate(()=>localStorage.getItem('mamoken.story.v16.1'));
 await page.goto(root);assert.match(await page.locator('#saved-journey').textContent(),/山の旅人/);assert.equal(await page.evaluate(()=>localStorage.getItem('mamoken.story.v16.1')),saved,'menu changed saved journey');
 await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.locator('.mode').first().evaluate(n=>getComputedStyle(n).transitionDuration),'0s');
 // Controlled layout simulation, not an iPhone measurement: ensure the short
 // lobby keeps both the left notch and bottom home-indicator gutters intact.
 await page.evaluate(()=>{for(const [side,value] of Object.entries({left:62,right:21,top:0,bottom:21}))document.documentElement.style.setProperty('--ui-safe-'+side,value+'px');});
 await page.mouse.move(360,160);await page.mouse.wheel(0,2000);
 await page.waitForFunction(()=>{const n=document.querySelector('.mode-hall');return n.scrollTop+n.clientHeight>=n.scrollHeight-1;});
 const safeCards=await visibleTargets('.mode-story,.mode-survival,.hall-footer');
 for(const card of safeCards)assert.ok(card.x>=61&&card.x+card.width<=700&&card.y+card.height<=300,'simulated safe area covered: '+JSON.stringify(card));
 report.push({screen:'lobby-simulated-insets',insets:{left:62,right:21,top:0,bottom:21},safeCards});
 await page.screenshot({path:dir+'/lobby-simulated-insets-720x320.png'});
 assert.deepEqual(errors,[]);const video=await flushVideo();await writeFile(dir+'/report.json',JSON.stringify({report,errors,video,environment:'Desktop Chromium / SwiftShader; physical iPhone not tested'},null,2));
 if(video)console.log('P4 actual interaction video:',video.path,'(Chromium/SwiftShader, not physical iPhone)');
 console.log('P4 UI WEBGL PASS: five mode routes, native & rotated 720/852 layouts, 44px targets, paired character roles, four live shared Battle HUDs, four-tab editor save and unchanged journey record');
}catch(error){
 await page.screenshot({path:dir+'/error.png'}).catch(()=>{});const layout=await layoutEvidence().catch(()=>null);
 const video=await flushVideo().catch(failure=>({error:failure.message}));
 await writeFile(dir+'/failure-layout.json',JSON.stringify({error:error.message,report,errors,layout,video},null,2)).catch(()=>{});console.error(errors);throw error;
}finally{if(!contextClosed)await context.close().catch(()=>{});await browser.close();if(server)await new Promise(resolve=>server.close(resolve));}
