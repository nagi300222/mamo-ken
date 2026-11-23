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
 await page.locator('#avatar-name').fill('端末内の旅人');await page.locator('#enter').click();await page.waitForFunction(()=>mamokenStory.mode==='explore',undefined,{timeout:90000});
 await page.reload();await page.waitForFunction(()=>mamokenStory.mode==='editor'&&mamokenStory.player,undefined,{timeout:90000});assert.equal(await page.locator('#avatar-name').inputValue(),'端末内の旅人');
 await page.screenshot({path:output+'/03-bundled-story-save.png'});
 assert.deepEqual(remoteRequests,[]);assert.deepEqual(errors,[]);
 await writeFile(output+'/report.json',JSON.stringify({webglRendered:true,nativeAdapterSimulated:true,uiKitTested:false,remoteRequests,errors,report},null,2));
 console.log('P1 BUNDLED WEBGL PASS: five modes, real GLBs/practice, simulated native background/foreground/input reset, no CSS double rotation, Story save reload, no external asset requests');
}catch(error){await page.screenshot({path:output+'/failure.png'}).catch(()=>{});console.error({errors,remoteRequests});throw error;}
finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
