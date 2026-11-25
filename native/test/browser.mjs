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
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.json':'application/json','.css':'text/css','.glb':'model/gltf-binary','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml'};
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
const nativeLobbyScroll=[];
const svgDecoding=[];
const cdp=await context.newCDPSession(page);
async function assertDecodedArt(screen,expectations){
 const checks=await page.evaluate(async expectations=>Promise.all(expectations.map(async([selector,pseudo,filename])=>{
  const element=document.querySelector(selector);if(!element)return {selector,pseudo,filename,error:'Required art target missing'};
  const background=getComputedStyle(element,pseudo||null).backgroundImage;
  const urls=[...background.matchAll(/url\(["']?([^"')]+)["']?\)/g)].map(match=>match[1]);
  const src=urls.find(value=>new URL(value,location.href).pathname.endsWith('/'+filename));
  if(!src)return {selector,pseudo,filename,background,error:'Expected art is not applied to the real UI'};
  try{
   const response=await fetch(src),image=new Image();image.src=src;await image.decode();
   return {selector,pseudo,filename,src,status:response.status,mime:response.headers.get('content-type'),width:image.naturalWidth,height:image.naturalHeight,decoded:true};
  }catch(error){return {selector,pseudo,filename,src,error:error.message};}
 })),expectations);
 svgDecoding.push({screen,checks});await writeFile(output+'/native-svg-decoding.json',JSON.stringify({uiKitTested:false,svgDecoding},null,2));
 for(const check of checks){assert.equal(check.error,undefined,screen+' '+JSON.stringify(check));assert.equal(check.status,200);assert.match(check.mime??'',check.filename.endsWith('.webp')?/^image\/webp\b/:/^image\/svg\+xml\b/);assert.ok(check.decoded&&check.width>0&&check.height>0,'Art did not decode: '+JSON.stringify(check));}
}
async function safeInsets(left,right,bottom=21){
 await page.evaluate(({left,right,bottom})=>{
  for(const [edge,value]of Object.entries({left,right,top:0,bottom}))document.documentElement.style.setProperty('--native-safe-'+edge,value+'px');
  dispatchEvent(new Event('resize'));
 },{left,right,bottom});
 await page.waitForTimeout(80);
}
async function safeBounds(selector,left,right,bottom=21){
 const rect=await page.locator(selector).boundingBox();assert.ok(rect,'Missing visible notch geometry target '+selector);
 const viewport=page.viewportSize();
 safeAreaGeometry.push({selector,viewport,simulatedInsets:{left,right,bottom},rect});
 await writeFile(output+'/native-safe-bounds.json',JSON.stringify({uiKitTested:false,safeAreaGeometry},null,2));
 assert.ok(rect.x>=left-.5&&rect.x+rect.width<=viewport.width-right+.5,'Target crosses horizontal safe rectangle: '+selector+' '+JSON.stringify(rect));
 assert.ok(rect.y>=-.5&&rect.y+rect.height<=viewport.height-bottom+.5,'Target crosses vertical safe rectangle: '+selector+' '+JSON.stringify(rect));
}
async function lobbyInsets({width,height,left,right,bottom}){
 await page.setViewportSize({width,height});
 await cdp.send('Emulation.setSafeAreaInsetsOverride',{insets:{left,right,top:0,bottom}});
 await page.evaluate(()=>{for(const edge of ['left','right','top','bottom'])document.documentElement.style.removeProperty('--native-safe-'+edge);dispatchEvent(new Event('resize'));});
 await page.waitForTimeout(80);
}
async function inspectLobby(condition){
 const {left,right,bottom}=condition;await lobbyInsets(condition);
 await safeBounds('.mode-hall',left,right,bottom);
 const scroll=await page.locator('.mode-hall').evaluate(el=>({position:getComputedStyle(el).position,overflow:getComputedStyle(el).overflowY,clientHeight:el.clientHeight,scrollHeight:el.scrollHeight,scrollTop:el.scrollTop}));
 assert.equal(scroll.position,'fixed');assert.equal(scroll.overflow,'auto');assert.ok(scroll.scrollHeight<=scroll.clientHeight+1,'P4 five-mode overview requires scrolling at the supported native size');
 await page.locator('.hall-header').scrollIntoViewIfNeeded();await safeBounds('.hall-header',left,right,bottom);await safeBounds('.hall-title h1',left,right,bottom);
 assert.equal((await page.locator('.hall-title h1').textContent()).trim(),'マモ拳');
 const cards=[];
 for(const mode of ['battle','practice','arcade','survival','story']){
  const selector='.modes a[data-mode="'+mode+'"]',card=page.locator(selector);
  await safeBounds(selector,left,right,bottom);
  const action=card.locator('.mode-action,.mode-rule').first();await action.click({trial:true});
  await safeBounds(selector+' h2',left,right,bottom);await safeBounds(selector+' '+(mode==='battle'?'.mode-action':'.mode-rule'),left,right,bottom);
  const record=await card.evaluate(el=>{
   const action=el.querySelector('.mode-action,.mode-rule'),r=action.getBoundingClientRect(),card=el.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
   return {mode:el.dataset.mode,href:el.getAttribute('href'),card:{x:card.x,y:card.y,width:card.width,height:card.height},action:{x:r.x,y:r.y,width:r.width,height:r.height},hitMatches:hit?.closest('a[data-mode]')===el,scrollTop:document.querySelector('.mode-hall').scrollTop};
  });
  assert.equal(record.hitMatches,true,'Native action is clipped or covered: '+mode);cards.push(record);
  if(mode==='story'){
   await safeBounds('#saved-journey',left,right,bottom);assert.match(await page.locator('#saved-journey').textContent(),/端末内の長い名前/);
   const label=await page.locator('#saved-journey').evaluate(el=>{const r=el.getBoundingClientRect(),card=el.closest('a').getBoundingClientRect();return {inside:r.left>=card.left&&r.right<=card.right+.5&&r.top>=card.top&&r.bottom<=card.bottom+.5,wrapped:el.scrollWidth<=el.clientWidth+1};});
   assert.equal(label.inside,true,'Saved name escapes its native mode card');assert.equal(label.wrapped,true,'Saved journey name is horizontally clipped');
  }
 }
 await page.locator('.hall-footer').scrollIntoViewIfNeeded();await safeBounds('.hall-footer',left,right,bottom);
 const maxScroll=await page.locator('.mode-hall').evaluate(el=>el.scrollTop);assert.equal(maxScroll,0,'The five-mode overview must start and remain visible before scrolling');
 await page.screenshot({path:output+'/lobby-safe-lower-'+condition.width+'-'+left+'-'+right+'.png'});
 await page.locator('.hall-header').scrollIntoViewIfNeeded();await safeBounds('.hall-header',left,right,bottom);
 nativeLobbyScroll.push({condition,scroll,maxScroll,cards});
 await writeFile(output+'/native-lobby-scroll.json',JSON.stringify({uiKitTested:false,cssEnvOverriddenViaCDP:true,nativeLobbyScroll},null,2));
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
 await page.waitForFunction(()=>document.documentElement.dataset.uiArt==='v17-p4-ui-art-1');
 await assertDecodedArt('five-mode-entry',[
  ['.ui-seal','','fist-seal.svg'],['.mode-hall','::before','ridge-far.svg'],['.mode-hall','::before','ridge-near.svg'],
  ...[['battle','versus'],['practice','practice'],['arcade','arcade'],['survival','survival'],['story','journey-paper']].map(([mode,asset])=>['.mode[data-mode="'+mode+'"] .mode-kicker','::before','mode-'+asset+'.svg']),
  ...[['battle','vs-large'],['practice','practice'],['arcade','arcade'],['survival','survival'],['story','story']].map(([mode,asset])=>['.mode[data-mode="'+mode+'"] .mode-illustration','','mode-'+asset+'.webp'])
 ]);
 // Preserve a valid long saved name, prove every card and its action can be
 // scrolled into the native safe scrollport, then take all five real routes.
 const previousSave=await page.evaluate(()=>localStorage.getItem('mamoken.story.v16.1'));
 const seededSave=await page.evaluate(async()=>{const {createDefaultAvatar}=await import('/custom/v16/avatar-schema.js'),{freshProgress,writeSave}=await import('/story/story-state.js');const avatar=createDefaultAvatar('moguzo');avatar.name='端末内の長い名前と仲間たちの山旅を続ける';writeSave(localStorage,avatar,freshProgress());return localStorage.getItem('mamoken.story.v16.1');});
 await page.reload();await page.waitForFunction(()=>document.querySelector('#saved-journey').textContent.includes('端末内の長い名前'));
 for(const condition of [{width:852,height:393,left:62,right:0,bottom:21},{width:852,height:393,left:0,right:62,bottom:21},{width:852,height:393,left:62,right:62,bottom:21},{width:720,height:320,left:62,right:21,bottom:21}])await inspectLobby(condition);
 assert.equal(await page.evaluate(()=>localStorage.getItem('mamoken.story.v16.1')),seededSave,'Mode menu scrolling changed the saved journey');
 for(const mode of ['battle','practice','arcade','survival','story']){
  await page.goto(url+'/');await lobbyInsets({width:720,height:320,left:62,right:21,bottom:21});
  const card=page.locator('.modes a[data-mode="'+mode+'"]');await card.scrollIntoViewIfNeeded();
  await safeBounds('.modes a[data-mode="'+mode+'"]',62,21);
  const target=new URL(await card.getAttribute('href'),url+'/');
  await Promise.all([page.waitForURL(actual=>actual.pathname===target.pathname&&actual.search===target.search),card.locator('.mode-action,.mode-rule').first().tap()]);
  if(mode==='story')await page.locator('#story-app').waitFor();else{await page.waitForFunction(()=>window.mamoken3d,undefined,{timeout:15000});assert.equal(await page.locator('#match-mode').inputValue(),mode);}
  nativeLobbyScroll.push({route:mode,actualUrl:page.url(),tapNavigated:true});
 }
 await page.goto(url+'/');
 await page.evaluate(value=>{if(value===null)localStorage.removeItem('mamoken.story.v16.1');else localStorage.setItem('mamoken.story.v16.1',value);},previousSave);
 await cdp.send('Emulation.setSafeAreaInsetsOverride',{insets:{left:0,right:0,top:0,bottom:0}});await page.setViewportSize({width:852,height:393});await page.reload();
 // The native stylesheet must be inert for ordinary web/PWA layout. Compare
 // the same real web DOM with the stylesheet enabled and disabled.
 const webLayout=async()=>page.locator('.mode-hall').evaluate(el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return {x:r.x,y:r.y,width:r.width,height:r.height,position:s.position,padding:s.padding,overflow:s.overflowY};});
 await page.evaluate(()=>{document.documentElement.classList.remove('native-runtime');document.querySelector('link[href="/native-layout.css"]').disabled=true;});const originalWeb=await webLayout();
 await page.evaluate(()=>{document.querySelector('link[href="/native-layout.css"]').disabled=false;});assert.deepEqual(await webLayout(),originalWeb,'Native stylesheet changed ordinary web/PWA layout');
 await page.evaluate(()=>document.documentElement.classList.add('native-runtime'));
 await writeFile(output+'/native-lobby-scroll.json',JSON.stringify({uiKitTested:false,cssEnvOverriddenViaCDP:true,nativeLobbyScroll,originalWeb},null,2));
 await page.screenshot({path:output+'/01-bundled-five-modes.png'});
 await page.locator('a[href="./dojo/?mode=practice"]').click();
 await page.waitForFunction(()=>window.mamoken3d,undefined,{timeout:15000});
 await page.locator('#start').tap();await page.waitForFunction(()=>mamoken3d.practice.enabled&&mamoken3d.battle?.frame>3,undefined,{timeout:90000});
 await assertDecodedArt('dojo-hud-and-controls',[
  ['.brand-mark','','fist-seal.svg'],['#arena .round-center','','hud-timer-dark.svg'],
 ]);
 const nativeLabels=await page.locator('#buttons-rail .attack-label').allTextContents();
 assert.deepEqual(nativeLabels,['B','A','Y','Z','S','X']);
 assert.equal(await page.locator('#buttons-rail .attack-rim').count(),6);
 assert.deepEqual(await page.locator('#match-hud .hud-eye img').evaluateAll(imgs=>imgs.map(img=>img.complete&&img.naturalWidth>0)),[true,true]);
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
 await assertDecodedArt('story-editor', [['#story-app header .brand','::before','fist-seal.svg'],['#editor','','cut-panel.svg']]);
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
 await assertDecodedArt('story-hud-and-controls',[
  ['#battle-hud .round-center','','hud-timer-dark.svg'],
 ]);
 assert.equal(await page.locator('#battle-buttons .attack-rim').count(),6);
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
  assert.ok(Math.abs(geometry.app.x)<.5&&Math.abs(geometry.app.width-852)<.5,'Battle stage must use full viewport width');
  assert.ok(Math.abs(geometry.world.x)<.5&&Math.abs(geometry.world.right-852)<.5,'Battle canvas lost full bleed');
  assert.ok(geometry.hud.x>=side-.5&&geometry.hud.right<=852-side+.5,'HUD escaped the safe rectangle');
  assert.equal(geometry.touches.length,8,'Expected six attacks and two step touch controls');
  for(const touch of geometry.touches){assert.ok(touch.width>=44&&touch.height>=44,'Native touch target below 44px '+JSON.stringify(touch));assert.ok(touch.x>=side-.5&&touch.right<=852-side+.5&&touch.y>=-.5&&touch.bottom<=393-21+.5,'Native touch escaped the safe rectangle '+JSON.stringify(touch));}
 }
 await page.screenshot({path:output+'/04-native-env-story-battle.png'});
 await cdp.send('Emulation.setSafeAreaInsetsOverride',{insets:{left:0,right:0,top:0,bottom:0}});
 await page.reload();await page.waitForFunction(()=>mamokenStory.mode==='editor'&&mamokenStory.player,undefined,{timeout:90000});assert.equal(await page.locator('#avatar-name').inputValue(),'端末内の旅人');
 await page.screenshot({path:output+'/03-bundled-story-save.png'});
 assert.deepEqual(remoteRequests,[]);assert.deepEqual(errors,[]);
 await writeFile(output+'/report.json',JSON.stringify({webglRendered:true,nativeAdapterSimulated:true,uiKitTested:false,safeAreaInsetsSimulated:true,safeAreaGeometry,nativeEnvGeometry,nativeLobbyScroll,svgDecoding,remoteRequests,errors,report},null,2));
 console.log('P1 BUNDLED WEBGL PASS: five modes, real GLBs/practice, simulated native background/foreground/input reset, no CSS double rotation, Story save reload, no external asset requests');
}catch(error){await page.screenshot({path:output+'/failure.png'}).catch(()=>{});console.error({errors,remoteRequests});throw error;}
finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
