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
const context=await browser.newContext({viewport:{width:852,height:393},isMobile:true,hasTouch:true,deviceScaleFactor:1});
const page=await context.newPage(),errors=[],report=[];
page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('favicon.ico'))errors.push(r.status()+' '+r.url());});
async function tapTargets(selector){
 const rows=await page.locator(selector).evaluateAll(nodes=>nodes.filter(n=>!n.hidden&&n.getClientRects().length).map(n=>{const r=n.getBoundingClientRect();return {name:n.textContent.trim().slice(0,40),width:r.width,height:r.height};}));
 for(const row of rows)assert.ok(row.width>=43.9&&row.height>=43.9,'touch target below44: '+JSON.stringify(row));
 return rows;
}
try{
 for(const viewport of [{width:720,height:320},{width:852,height:393},{width:393,height:852}]){
  await page.setViewportSize(viewport);await page.goto(root,{waitUntil:'domcontentloaded'});
  assert.equal(await page.locator('.modes a[data-mode]').count(),5);
  await page.waitForFunction(()=>document.documentElement.dataset.uiArt==='v17-p4-ui-art-1');
  assert.match(await page.locator('.mode-versus .mode-kicker').evaluate(n=>getComputedStyle(n,'::before').backgroundImage),/mode-versus\.svg/);
  const targets=await tapTargets('.modes a');assert.equal(targets.length,5);
  const overflow=await page.evaluate(()=>{const r=document.querySelector('.mode-hall').getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,screen:[innerWidth,innerHeight]};});
  await page.screenshot({path:dir+`/lobby-${viewport.width}x${viewport.height}.png`});report.push({screen:'lobby',viewport,targets,overflow});
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
  await page.screenshot({path:dir+`/select-${mode}.png`});
  if(mode==='practice'){
   await page.locator('#start').tap();await page.waitForFunction(()=>mamoken3d.practice.enabled&&!mamoken3d.diagnostics.loading&&mamoken3d.presentation.loaded&&mamoken3d.battle?.frame>2,undefined,{timeout:60000});
   assert.equal(await page.locator('#timer').textContent(),'∞');
   const controls=await page.locator('#buttons-rail .attack').evaluateAll(nodes=>nodes.map(n=>({key:n.dataset.control,art:getComputedStyle(n).backgroundImage})));assert.ok(controls.every(n=>/button-(weak|heavy|throw|gyuiin|special|ultimate)\.svg/.test(n.art)),JSON.stringify(controls));
   assert.match(await page.locator('.hud .health .track').first().evaluate(n=>getComputedStyle(n).backgroundImage),/hud-hp-frame\.svg/);assert.match(await page.locator('.round-center').evaluate(n=>getComputedStyle(n).backgroundImage),/hud-timer-dark\.svg/);
   await tapTargets('#buttons-rail button,#stick-rail button,#practice-panel select,#practice-panel button');
   await page.screenshot({path:dir+'/practice-common-hud.png'});
  }
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
 await page.screenshot({path:dir+'/editor-save-tab.png'});
 await page.locator('#p4-editor-tab-3').focus();await page.keyboard.press('ArrowLeft');assert.equal(await page.locator('#p4-editor-tab-2').getAttribute('aria-selected'),'true');
 await page.locator('#enter').click();await page.waitForFunction(()=>mamokenStory.mode==='explore',undefined,{timeout:90000});
 await page.screenshot({path:dir+'/exploration.png'});
 assert.equal(await page.evaluate(()=>mamokenStory.avatar.name),'山の旅人');assert.equal(await page.evaluate(()=>mamokenStory.avatar.combat.specials[0]),'yomikage.s1');
 const saved=await page.evaluate(()=>localStorage.getItem('mamoken.story.v16.1'));
 await page.goto(root);assert.match(await page.locator('#saved-journey').textContent(),/山の旅人/);assert.equal(await page.evaluate(()=>localStorage.getItem('mamoken.story.v16.1')),saved,'menu changed saved journey');
 await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.locator('.mode').first().evaluate(n=>getComputedStyle(n).transitionDuration),'0s');
 assert.deepEqual(errors,[]);await writeFile(dir+'/report.json',JSON.stringify({report,errors},null,2));
 console.log('P4 UI WEBGL PASS: five mode routes, native & rotated 720/852 layouts, 44px targets, paired character roles, shared Practice HUD, four-tab editor save and unchanged journey record');
}catch(error){await page.screenshot({path:dir+'/error.png'}).catch(()=>{});console.error(errors);throw error;}
finally{await browser.close();if(server)await new Promise(resolve=>server.close(resolve));}
