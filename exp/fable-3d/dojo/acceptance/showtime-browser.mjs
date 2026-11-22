// Real Chromium smoke of the STACKED Showtime branch, beyond Node source tests.
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('playwright-core');
const base=process.env.MAMOKEN_URL||'http://127.0.0.1:4173/exp/fable-3d/dojo/';
const evidence=process.env.MAMOKEN_EVIDENCE||'/tmp/mamoken-showtime';
await mkdir(evidence,{recursive:true});
const chromiumPath=process.env.CHROMIUM_PATH||'/usr/bin/google-chrome';
const browser=await chromium.launch({executablePath:chromiumPath,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const errors=[];
const page=await browser.newPage({viewport:{width:852,height:393},isMobile:true,hasTouch:true,deviceScaleFactor:1});
page.on('pageerror',error=>errors.push('JS: '+error.message));
page.on('response',response=>{if(response.status()>=400&&!response.url().endsWith('favicon.ico'))errors.push(response.status()+' '+response.url());});
const openFighter=async(id)=>{
  await page.locator('#selection').waitFor({state:'visible'});
  await page.locator('.fighter-card').nth(['moguzo','pisuke','godan','hakuma','chirka','takimaru','yomikage','bullet','dark_moguzo'].indexOf(id)).tap();
  await page.locator('#start').tap();
  await page.waitForFunction(id=>window.mamoken3d?.actors?.[0]?.id===id&&window.mamoken3d?.battle?.frame>0,id,{timeout:25000});
};
try{
  await page.goto(base,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.mamoken3d);
  assert.equal(await page.locator('#buttons-rail [data-control]').count(),6);
  assert.equal(await page.locator('#stick-rail [data-control]').count(),2);
  const layout=await page.evaluate(()=>{
    const r=id=>document.getElementById(id).getBoundingClientRect().toJSON();
    return {stage:r('stage'),left:r('stick-rail'),right:r('buttons-rail')};
  });
  assert.ok(layout.left.right<=layout.stage.left);
  assert.ok(layout.stage.right<=layout.right.left);
  await openFighter('chirka');
  await page.evaluate(()=>{
    const g=window.mamoken3d.battle,p=g.fighters[0],op=g.fighters[1];
    p.x=-1.4;op.x=1.4;op.stun=160;
    p.super=100;p.stop=0;p.stun=0;p.action=null;p.dashF=0;
  });
  await page.locator('[data-control="ultimateButton"]').tap();
  await page.waitForFunction(()=>document.querySelector('#showtime-banner.active')&&window.mamoken3d?.actors?.[0]?.illusions?.active,undefined,{timeout:7000});
  assert.equal(await page.locator('#showtime-banner .showtime-portrait').count(),1);
  assert.equal(await page.locator('#showtime-banner').getAttribute('data-element'),'illusion');
  await page.screenshot({path:evidence+'/chirka-super-3d.png'});
  // FX OFF should immediately clear both real 3D ghosts and screen-space flashes.
  await page.locator('.av-settings-toggle').tap();
  await page.locator('#fx-toggle').tap();
  assert.equal(await page.locator('#fx-toggle').getAttribute('aria-pressed'),'false');
  assert.equal(await page.evaluate(()=>window.mamoken3d.actors[0].illusions.active),false);
  await page.locator('#music-toggle').tap();
  assert.equal(await page.locator('#music-toggle').getAttribute('aria-pressed'),'true');
  await page.locator('#sound-toggle').tap();
  assert.equal(await page.locator('#sound-toggle').getAttribute('aria-pressed'),'false');
  await page.locator('#music-toggle').tap();
  assert.equal(await page.locator('#music-toggle').getAttribute('aria-pressed'),'false');
  await page.locator('.av-settings-toggle').tap(); // close popover
  await page.locator('#select-back').tap();
  await openFighter('bullet');
  await page.evaluate(()=>{
    const g=window.mamoken3d.battle,p=g.fighters[0];p.ability.charge=3;
  });
  await page.waitForFunction(()=>document.querySelectorAll('#charge-pips-0 .filled').length===3,undefined,{timeout:4000});
  assert.equal(await page.locator('#hud-side-0').getAttribute('data-element'),'amber');
  await page.screenshot({path:evidence+'/bullet-hud.png'});
  assert.deepEqual(errors,[]);
  console.log('Showtime Chromium PASS: 6 buttons, valid stage bounds, Chirka skinned ghosts, FX/SFX/BGM settings, Bullet charge HUD');
}catch(error){
  await page.screenshot({path:evidence+'/failure.png'}).catch(()=>{});
  console.error('Browser errors:',errors);
  throw error;
}finally{
  await browser.close();
}
