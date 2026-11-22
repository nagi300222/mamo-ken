import assert from 'node:assert/strict';
import {writeFile,mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('playwright-core');
const root=process.env.MAMOKEN_URL??'http://127.0.0.1:4173/exp/fable-3d/dojo/';
const evidence=(process.env.MAMOKEN_EVIDENCE??'/tmp/mamoken-device')+'/device';await mkdir(evidence,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH??'/usr/bin/google-chrome',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:852,height:393},isMobile:true,hasTouch:true});
const errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));
page.on('request',r=>{if(r.url().endsWith('.glb'))requests.push(r.url());});
const report=[];
try{
 await page.goto(root+'?check=1');await page.waitForFunction(()=>window.mamoken3d);
 assert.equal(await page.locator('#check-mode').isChecked(),true);
 await page.locator('#start').tap();await page.waitForFunction(()=>mamoken3d.battle?.frame>0);
 for(let i=0;i<4;i++){
  await page.locator('[data-control="ultimateButton"]').tap();await page.waitForFunction(()=>mamoken3d.cinematic.active);
  await page.waitForFunction(()=>mamoken3d.cinematic.elapsed>2,undefined,{timeout:20000});
  if(i%2)await page.locator('#cinematic-skip').tap();
  await page.waitForFunction(()=>!mamoken3d.cinematic.active,undefined,{timeout:20000});
  await page.waitForTimeout(150);
  report.push(await page.evaluate(()=>({stats:mamoken3d.diagnostics,hp:mamoken3d.battle.fighters.map(f=>f.hp),super:mamoken3d.battle.fighters[0].super})));
  assert.equal(report.at(-1).super,100);assert.equal(report.at(-1).stats.checking,true);
 }
 assert.equal(report.at(-1).stats.textures,report[0].stats.textures,'textures grew after movies');
 assert.ok(report.at(-1).stats.geometries<=report[0].stats.geometries+2,'geometry grew after movies');
 assert.ok(requests.every(url=>!url.includes('_v14.glb')),'authoring mesh downloaded');
 await page.locator('#select-back').tap();await page.locator('#check-mode').uncheck();await page.locator('#start').tap();
 await page.waitForFunction(()=>mamoken3d.battle?.frame>5&&!mamoken3d.diagnostics.checking);
 assert.equal(await page.evaluate(()=>mamoken3d.battle.fighters[0].super),0);
 await page.screenshot({path:evidence+'/normal-play.png'});
 assert.deepEqual(errors,[]);await writeFile(evidence+'/report.json',JSON.stringify({report,requests,errors},null,2));
 console.log('Device check mode, repeated natural/skip returns, bounded GPU resources, animation-only downloads PASS');
}finally{await browser.close();}
