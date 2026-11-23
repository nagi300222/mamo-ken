// Actual Chromium/WebGL against the offline asset bundle, plus an explicitly
// simulated native-state adapter. This is not a WKWebView/UIKit device test.
import assert from 'node:assert/strict';
import http from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('playwright-core');
const base=path.resolve(fileURLToPath(new URL('../www/',import.meta.url))),output=process.env.MAMOKEN_EVIDENCE??fileURLToPath(new URL('../evidence/browser/',import.meta.url));
await mkdir(output,{recursive:true});
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.json':'application/json','.css':'text/css','.glb':'model/gltf-binary','.png':'image/png','.webp':'image/webp'};
const server=http.createServer(async(req,res)=>{
 try{const url=new URL(req.url,'http://127.0.0.1');let route=decodeURIComponent(url.pathname);if(route.endsWith('/'))route+='index.html';const file=path.resolve(base,'.'+route);
  if(!file.startsWith(base+path.sep)&&file!==path.join(base,'index.html')){res.writeHead(403);res.end();return;}
  const data=await readFile(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]??'application/octet-stream','Cache-Control':'no-store'});res.end(data);
 }catch{res.writeHead(404);res.end('missing');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const url='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH??'/usr/bin/google-chrome',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const context=await browser.newContext({viewport:{width:852,height:393},isMobile:true,hasTouch:true,deviceScaleFactor:1});
const page=await context.newPage(),errors=[],remoteRequests=[],report=[];
const safeAreaGeometry=[];
const nativeEnvGeometry=[];
const cdp=await context.newCDPSession(page);
async function safeInsets(left,right,bottom=21){
 await page.evaluate(({left,right,bottom})=>{
  for(const [edge,value]of Object.entries({left,right,top:0,bottom}))document.documentElement.style.setProperty('--native-safe-'+edge,value+'px');
  dispatchEvent(new Event('resize'));
 },{left,right,bottom});
 await page.waitForTimeout(80);
}
async function safeBounds(selector,left,right,bottom=21){
 const rect=await page.locator(selector).boundingBox();assert.ok(rect,'Missing visible notch geometry target '+selector);
 assert.ok(rect.x>=left-.5&&rect.x+rect.width<=852-right+.5,'Target crosses horizontal safe rectangle: '+selector+' '+JSON.stringify(rect));
 assert.ok(rect.y>=-.5&&rect.y+rect.height<=393-bottom+.5,'Target crosses vertical safe rectangle: '+selector+' '+JSON.stringify(rect));
 safeAreaGeometry.push({selector,simulatedInsets:{left,right,bottom},rect});
}
page.on('pageerror',error=>errors.push(error.message));page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('favicon.ico'))errors.push(r.status()+' '+r.url());});
await context.route('**/*',route=>{const request=route.request().url();if(request.startsWith(url)||request.startsWith('data:'))return route.continue();remoteRequests.push(request);return route.abort();});
await context.addInitScript(()=>{
 // The native implementation and persistence have separate Node/plugin tests.
 // The fixture exposes only the agreed adapter contract to the real game code.
 window.mamokenNative={isNative:true,active:true,warnings:[],ready:Promise.resolve(),flushSaves:async()=>{}};
 const mark=()=>document.documentElement?.classList.add('native-runtime');mark();document.addEventListener('DOMContentLoaded',mark,{once:true});
});
try{
 await page.goto(url+'/');assert.equal(await page.locator('.modes a').count(),5);
 // Chromium has no iPhone notch: explicit CSS inputs exercise real DOM geometry,
 // not UIKit env() values. Test either side and preserve web layout when disabled.
 for(const [left,right]of [[62,0],[0,62],[62,62]]){
  await safeInsets(left,right);await safeBounds('.modes',left,right);
 }
 await page.evaluate(()=>document.documentElement.classList.remove('native-runtime'));
 assert.equal(await page.locator('main').evaluate(el=>getComputedStyle(el).paddingLeft),'25px','Native layout leaked into the web launcher');
 await page.evaluate(()=>document.documentElement.classList.add('native-runtime'));
 await page.screenshot({path:output+'/01-bundled-five-modes.png'});
 await page.locator('a[href="./dojo/?mode=practice"]').click();
 await page.waitForFunction(()=>window.mamoken3d,undefined,{timeout:15000});
 await page.locator('#start').tap();await page.waitForFunction(()=>mamoken3d.practice.enabled&&mamoken3d.battle?.frame>3,undefined,{timeout:90000});
 assert.equal(await page.locator('[data-control]').count(),8); // six attacks + two step buttons
 assert.equal(await page.evaluate(()=>mamoken3d.landscapeLocked),false);
 // A transient portrait viewport must be left to UIKit, not rotated again by CSS.
 await page.setViewportSize({width:393,height:852});await page.waitForTimeout(150);
 assert.equal(await page.evaluate(()=>mamoken3d.landscapeLocked),false);await page.setViewportSize({width:852,height:393});
 await page.keyboard.down('ArrowRight');await page.waitForTimeout(100);
 await page.evaluate(()=>{mamokenNative.active=false;dispatchEvent(new CustomEvent('mamoken:native-state',{detail:{active:false}}));});
 const frozen=await page.evaluate(()=>mamoken3d.battle.frame);await page.waitForTimeout(250);assert.equal(await page.evaluate(()=>mamoken3d.battle.frame),frozen,'background native state advanced Battle');
 assert.equal(await page.locator('#pause').textContent(),'再開');
 await page.keyboard.up('ArrowRight');await page.evaluate(()=>{mamokenNative.active=true;dispatchEvent(new CustomEvent('mamoken:native-state',{detail:{active:true}}));});
 await page.waitForTimeout(150);assert.equal(await page.evaluate(()=>mamoken3d.battle.frame),frozen,'foreground automatically resumed Battle');
 const beforeResume=await page.evaluate(()=>mamoken3d.battle.fighters[0].x);await page.locator('#pause').tap();
 await page.waitForFunction(frame=>mamoken3d.battle.frame>frame+4,frozen);const afterResume=await page.evaluate(()=>mamoken3d.battle.fighters[0].x);
 assert.ok(Math.abs(beforeResume-afterResume)<.001,'released movement remained latched');
 report.push(await page.evaluate(()=>({frame:mamoken3d.battle.frame,practice:mamoken3d.practice,diagnostics:mamoken3d.diagnostics,nativeSimulated:true})));
 await page.screenshot({path:output+'/02-native-state-practice.png'});
 await page.goto(url+'/story/');await page.waitForFunction(()=>window.mamokenStory?.mode==='editor'&&mamokenStory.player,undefined,{timeout:90000});
 for(const [left,right]of [[62,0],[0,62],[62,62]]){
  await safeInsets(left,right);await safeBounds('#story-app',left,right);await safeBounds('#editor',left,right);
 }
 await page.evaluate(()=>document.documentElement.classList.remove('native-runtime'));
 assert.equal((await page.locator('#story-app').boundingBox()).x,0,'Native safe rectangle leaked into web Story');
 await page.evaluate(()=>document.documentElement.classList.add('native-runtime'));
 await page.locator('#avatar-name').fill('端末内の旅人');await page.locator('#enter').click();await page.waitForFunction(()=>mamokenStory.mode==='explore',undefined,{timeout:90000});
 await safeBounds('#story-stick',62,62);if(await page.locator('#talk').isVisible())await safeBounds('#talk',62,62);
 // The skip control shares the same safe parent; this is a layout-only probe,
 // not a claim that an actual native movie was played by this browser fixture.
 await page.locator('#movie-ui').evaluate(el=>el.hidden=false);await safeBounds('#movie-skip',62,62);await page.locator('#movie-ui').evaluate(el=>el.hidden=true);
 // Exercise actual CSS env() consumers as well as the outer native rectangle.
 // CDP emulates these env values; this is still not UIKit/iPhone certification.
 await page.keyboard.down('w');await page.waitForFunction(()=>mamokenStory.nearby?.id==='moguzo',undefined,{timeout:30000});await page.keyboard.up('w');
 await page.locator('#talk').tap();await page.waitForFunction(()=>mamokenStory.mode==='dialogue');await page.locator('#challenge').tap();
 await page.waitForFunction(()=>mamokenStory.mode==='battle',undefined,{timeout:90000});await page.locator('#pause').tap();
 for(const side of [59,62]){
  await page.evaluate(()=>{for(const edge of ['left','right','top','bottom'])document.documentElement.style.removeProperty('--native-safe-'+edge);});
  await cdp.send('Emulation.setSafeAreaInsetsOverride',{insets:{left:side,right:side,top:0,bottom:21}});
  await page.evaluate(()=>dispatchEvent(new Event('resize')));await page.waitForTimeout(100);
  const geometry=await page.evaluate(()=>{
   const box=selector=>{const el=document.querySelector(selector),r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};
   const probe=document.createElement('div');probe.style.cssText='position:absolute;width:env(safe-area-inset-left);height:env(safe-area-inset-right)';document.body.append(probe);const env=box('body>div:last-child');probe.remove();
   return {env,app:box('#story-app'),world:box('#world'),hud:box('#battle-hud'),buttons:box('#battle-buttons'),camera:box('#camera-tools'),header:box('header'),touches:[...document.querySelectorAll('#battle-buttons [data-control],#battle-steps [data-control]')].map(el=>{const r=el.getBoundingClientRect();return {control:el.dataset.control,x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};})};
  });
  nativeEnvGeometry.push({side,bottom:21,...geometry});
  await writeFile(output+'/native-env-geometry.json',JSON.stringify({uiKitTested:false,cssEnvOverriddenViaCDP:true,nativeEnvGeometry},null,2));
  assert.equal(geometry.env.width,side,'CDP did not override actual CSS env(left)');assert.equal(geometry.env.height,side,'CDP did not override actual CSS env(right)');
  assert.ok(Math.abs(geometry.app.x-side)<.5&&Math.abs(geometry.app.width-(852-side*2))<.5,'Native outer safe rectangle did not follow env values');
  assert.ok(geometry.world.right<=geometry.buttons.x+.5,'Native attack rail overlaps the real world canvas: '+JSON.stringify(geometry));
  assert.ok(Math.abs(geometry.hud.x-geometry.world.x)<.5&&Math.abs(geometry.hud.right-geometry.world.right)<.5,'HUD does not align with central world canvas');
  assert.equal(geometry.touches.length,8,'Expected six attacks and two step touch controls');
  for(const touch of geometry.touches){assert.ok(touch.width>=44&&touch.height>=44,'Native touch target below 44px '+JSON.stringify(touch));assert.ok(touch.x>=side-.5&&touch.right<=852-side+.5&&touch.y>=-.5&&touch.bottom<=393-21+.5,'Native touch escaped the safe rectangle '+JSON.stringify(touch));}
 }
 await page.screenshot({path:output+'/04-native-env-story-battle.png'});
 await cdp.send('Emulation.setSafeAreaInsetsOverride',{insets:{left:0,right:0,top:0,bottom:0}});
 await page.reload();await page.waitForFunction(()=>mamokenStory.mode==='editor'&&mamokenStory.player,undefined,{timeout:90000});assert.equal(await page.locator('#avatar-name').inputValue(),'端末内の旅人');
 await page.screenshot({path:output+'/03-bundled-story-save.png'});
 assert.deepEqual(remoteRequests,[]);assert.deepEqual(errors,[]);
 await writeFile(output+'/report.json',JSON.stringify({webglRendered:true,nativeAdapterSimulated:true,uiKitTested:false,safeAreaInsetsSimulated:true,safeAreaGeometry,nativeEnvGeometry,remoteRequests,errors,report},null,2));
 console.log('P1 BUNDLED WEBGL PASS: five modes, real GLBs/practice, simulated native background/foreground/input reset, no CSS double rotation, Story save reload, no external asset requests');
}catch(error){await page.screenshot({path:output+'/failure.png'}).catch(()=>{});console.error({errors,remoteRequests});throw error;}
finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
