// Real WebGL battle with touch events and a deterministic setup via the existing
// dojo diagnostics. Record a silent same-commit input and camera demonstration.
import assert from 'node:assert/strict';
import {mkdir, writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import path from 'node:path';
const {chromium}=createRequire(import.meta.url)('playwright-core');
const base=process.env.MAMOKEN_URL??'http://127.0.0.1:4173/exp/fable-3d/dojo/';
const output=path.join(process.env.MAMOKEN_EVIDENCE??'/tmp/mamoken-evidence','matte-battle');
await mkdir(output,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH??'/usr/bin/google-chrome',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const context=await browser.newContext({
 viewport:{width:852,height:393},hasTouch:true,isMobile:true,deviceScaleFactor:1,
 ...(process.env.MAMOKEN_UI_VIDEO==='1'?{recordVideo:{dir:output,size:{width:852,height:393}}}:{}),
});
const page=await context.newPage();
const cdp=await context.newCDPSession(page);
const errors=[], actions=[];
page.on('pageerror',error=>errors.push(error.message));
page.on('response',response=>{if(response.status()>=400&&!response.url().endsWith('favicon.ico'))errors.push(response.status()+' '+response.url());});
const report={sha:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),physicalIphoneTested:false,actions,layouts:[]};
async function screenshot(name){await page.screenshot({path:path.join(output,name+'.png')});}
try{
 await page.goto(new URL('?mode=battle',base).href);
 await page.locator('#start').tap();
 await page.waitForFunction(()=>window.mamoken3d?.presentation.state==='fight'&&mamoken3d.battle.frame>0);
 await page.evaluate(()=>{const target=mamoken3d.battle.fighters[1];target.stun=5000;target.action=null;});
 for(const [name,width,height,insets] of [
  ['landscape-852',852,393,{}],['landscape-720',720,320,{}],
  ['notch-left-720',720,320,{left:58,right:20,bottom:21}],
  ['notch-right-720',720,320,{left:20,right:58,bottom:21}],
  ['portrait-393',393,852,{top:58,bottom:20,left:21}],
 ]){
  const safe={top:0,bottom:0,left:0,right:0,...insets};
  await page.setViewportSize({width,height});
  await cdp.send('Emulation.setSafeAreaInsetsOverride',{insets:safe});
  await page.evaluate(()=>dispatchEvent(new Event('resize')));
  await page.waitForFunction(rotated=>mamoken3d.landscapeLocked===rotated,height>width);
  const layout=await page.evaluate(()=>{
   const box=document.querySelector('#stage').getBoundingClientRect().toJSON();
   const buttons=[...document.querySelectorAll('[data-control]')].map(element=>{
    const r=element.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2;
    return {key:element.dataset.control,rect:r.toJSON(),centerHit:document.elementFromPoint(x,y)?.closest('button')===element,
      symbol:element.querySelector('.attack-label')?.textContent};
   });
   return {box,buttons,rotated:mamoken3d.landscapeLocked};
  });
  assert.equal(layout.box.width,width,name);
  assert.equal(layout.box.height,height,name);
  for(const {key,rect:r,centerHit} of layout.buttons){
   assert.ok(r.width>=43.9&&r.height>=43.9,`${name}: ${key} under 44px`);
   assert.ok(r.left>=safe.left-.5&&r.top>=safe.top-.5&&r.right<=width-safe.right+.5&&r.bottom<=height-safe.bottom+.5,`${name}: ${key} outside safe area`);
   assert.ok(centerHit,`${name}: ${key} center is blocked`);
  }
  await screenshot(name);
  report.layouts.push({name,...layout});
 }
 await page.setViewportSize({width:852,height:393});
 await cdp.send('Emulation.setSafeAreaInsetsOverride',{insets:{left:0,right:0,top:0,bottom:0}});
 await page.waitForFunction(()=>!mamoken3d.landscapeLocked);
 // Exercise the real pause and help overlays while a movement key is held.
 await page.keyboard.down('KeyD');
 await page.locator('[popovertarget="commands-help"]').first().tap();
 await page.waitForFunction(()=>document.querySelector('#commands-help').matches(':popover-open'));
 const frame=await page.evaluate(()=>mamoken3d.battle.frame);
 await page.keyboard.press('KeyX');
 await page.waitForTimeout(160);
 assert.equal(await page.evaluate(()=>mamoken3d.battle.frame),frame,'open move list freezes the battle');
 await page.keyboard.up('KeyD');
 await page.locator('#commands-help button').tap();
 for(const [key,symbol] of [['weak','B'],['strong','A'],['throw','Y'],['gyuiin','Z'],['special','S'],['ultimateButton','X']]){
  const control=page.locator(`[data-control="${key}"]`);
  assert.equal(await control.locator('.attack-label').textContent(),symbol);
  await page.evaluate(key=>{
   const game=mamoken3d.battle,[p,t]=game.fighters;
   p.x=-.2;t.x=.2;p.y=t.y=0;p.facing=1;t.facing=-1;
   p.action=t.action=null;p.stop=t.stop=0;p.stun=0;t.stun=250;
   p.dashF=p.dashRecovery=p.gyuiinCooldown=0;p.drive=100;p.super=key==='ultimateButton'?100:0;
   p.vx=t.vx=p.vy=t.vy=0;p.state=t.state='idle';
   game.clinch=game.throwSequence=null;game.projectiles=[];
   if(!window.actionProbe){
    window.actionProbe=[];
    const base=game.tick.bind(game);
    game.tick=(input,...rest)=>{
     const result=base(input,...rest);
     for(const event of game.events){
      if(event.type==='move'&&event.slot===0)window.actionProbe.push({key:Object.keys(input).find(k=>input[k]===true),id:event.action});
     }
     return result;
    };
   }
   window.actionProbe.length=0;
  },key);
  if(symbol==='X'){
   await page.waitForFunction(()=>document.querySelector('[data-control=ultimateButton]').hasAttribute('data-ready'));
   await page.emulateMedia({reducedMotion:'reduce'});
   assert.equal(await page.locator('#ultimate-ready-0 svg').evaluate(e=>getComputedStyle(e).animationName),'none');
   await screenshot('ultimate-ready');
   await page.emulateMedia({reducedMotion:'no-preference'});
  }
  const rect=await control.boundingBox();
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:rect.x+rect.width/2,y:rect.y+rect.height/2}]});
  assert.ok(await control.evaluate(el=>el.classList.contains('held')||window.mamoken3d.cinematic.active),key+' has immediate press feedback');
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await page.waitForFunction(key=>window.actionProbe.some(result=>result.key===key),key);
  const observed=await page.evaluate(()=>window.actionProbe.slice());
  assert.equal(observed.filter(action=>action.key===key).length,1);
  actions.push({key,symbol,observed});
  if(symbol==='X'){
   await page.waitForFunction(()=>mamoken3d.cinematic.active);
   await page.locator('#cinematic-skip').tap();
   await page.waitForFunction(()=>!mamoken3d.cinematic.active);
   assert.equal(await control.getAttribute('data-ready'),null);
  }
  await page.waitForTimeout(420);
 }
 await page.evaluate(()=>{
  const [p,t]=mamoken3d.battle.fighters;p.x=1.12;t.x=1.55;p.stun=t.stun=200;p.action=t.action=null;
 });
 await page.waitForTimeout(550);await screenshot('edge-right');
 await page.evaluate(()=>{const [p,t]=mamoken3d.battle.fighters;p.x=-1.68;t.x=-1.32;});
 await page.waitForTimeout(550);await screenshot('edge-left');
 assert.deepEqual(errors,[]);
} finally {
 const video=page.video();
 await context.close();
 if(video)report.video=path.basename(await video.path());
 report.errors=errors;
 await writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');
 await browser.close();
}
console.log('MATTE BATTLE PASS:',report.layouts.length,'layouts and',actions.length,'touch actions at',report.sha);
