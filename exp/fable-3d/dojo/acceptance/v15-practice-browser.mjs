// Real mobile Chromium acceptance for v15 Practice + Combo controls.
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('playwright-core');
const base=process.env.MAMOKEN_URL||'http://127.0.0.1:4173/exp/fable-3d/dojo/';
const dir=process.env.MAMOKEN_EVIDENCE||'/tmp/mamoken-v15';
await mkdir(dir,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/google-chrome',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:393,height:852},isMobile:true,hasTouch:true,deviceScaleFactor:1});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('favicon.ico'))errors.push(r.status()+' '+r.url());});
try{
 await page.goto(base,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.mamoken3d?.landscapeLocked===true);
 await page.locator('#match-mode').selectOption('practice');
 assert.equal(await page.locator('#difficulty').evaluate(e=>e.parentElement.hidden),true);
 await page.locator('#start').tap();
 await page.waitForFunction(()=>mamoken3d.practice.enabled&&mamoken3d.battle?.frame>4,undefined,{timeout:35000});
 assert.equal(await page.locator('#practice-panel').isVisible(),true);
 assert.equal(await page.locator('#timer').textContent(),'∞');
 assert.equal(await page.locator('#buttons-rail [data-control]').count(),6);
 await page.screenshot({path:dir+'/practice-landscape-locked.png'});
 await page.evaluate(()=>{const g=mamoken3d.battle;g.fighters[0].x=-.18;g.fighters[1].x=.18;g.fighters[1].stun=0;g.fighters[0].action=null;g.fighters[0].stop=0;});
 await page.locator('[data-control="weak"]').tap();
 await page.waitForFunction(()=>mamoken3d.practice.stats.hits>=1,undefined,{timeout:6500});
 const stats=await page.evaluate(()=>mamoken3d.practice.stats);
 assert.ok(stats.damage>0);
 await page.screenshot({path:dir+'/practice-hit-counter.png'});
 await page.locator('#practice-dummy').selectOption('guard');
 assert.equal(await page.evaluate(()=>mamoken3d.practice.dummy),'guard');
 await page.locator('#practice-dummy').selectOption('cpu');
 assert.equal(await page.evaluate(()=>mamoken3d.practice.dummy),'cpu');
 await page.locator('#practice-dummy').selectOption('stand');
 await page.evaluate(()=>{mamoken3d.battle.fighters[0].x=1.1;});
 await page.locator('#practice-reset').tap();
 await page.waitForFunction(()=>Math.abs(mamoken3d.battle.fighters[0].x+.70)<.1,undefined,{timeout:4500});
 assert.equal(await page.evaluate(()=>mamoken3d.practice.stats.hits),0);
 assert.equal(await page.evaluate(()=>mamoken3d.battle.fighters[0].super),100);
 await page.evaluate(()=>{
  const g=mamoken3d.battle,p=g.fighters[0],t=g.fighters[1];p.x=-.2;t.x=.2;
  p.action=null;p.stun=0;p.stop=0;p.super=100;t.stun=450;t.stop=0;t.action=null;
 });
 await page.locator('[data-control="ultimateButton"]').tap();
 await page.waitForFunction(()=>mamoken3d.cinematic.active,undefined,{timeout:9000});
 assert.equal(await page.locator('#stage').evaluate(e=>e.parentElement.id),'cinematic-viewport');
 await page.screenshot({path:dir+'/practice-ultimate.png'});
 await page.locator('#cinematic-skip').tap();
 await page.waitForFunction(()=>!mamoken3d.cinematic.active,undefined,{timeout:6000});
 assert.equal(await page.evaluate(()=>mamoken3d.practice.enabled),true);
 await page.locator('#select-back').tap();
 await page.locator('#match-mode').selectOption('battle');
 await page.locator('#start').tap();
 await page.waitForFunction(()=>mamoken3d.battle?.frame>0&&!mamoken3d.practice.enabled,undefined,{timeout:30000});
 assert.equal(await page.locator('#practice-panel').isVisible(),false);
 assert.deepEqual(errors,[]);
 console.log('V15 PRACTICE CHROMIUM PASS: portrait-lock, training match, dummy options, 1P hits/DMG, reset, ultimate/skip, normal match return');
}catch(e){await page.screenshot({path:dir+'/error.png'}).catch(()=>{});console.error('page errors',errors);throw e;}
finally{await browser.close();}
