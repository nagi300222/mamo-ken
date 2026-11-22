// Actual rotated-touch landscape-only game acceptance in Chromium WebGL.
// Tests physical portrait viewports (iOS rotation-lock approximation) and true landscape.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir} from 'node:fs/promises';
const {chromium}=createRequire(import.meta.url)('playwright-core');
const base=process.env.MAMOKEN_URL||'http://127.0.0.1:4173/exp/fable-3d/dojo/';
const shots=process.env.MAMOKEN_EVIDENCE||'/tmp/mamoken-portrait-lock';
await mkdir(shots,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/google-chrome',
  args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const errors=[];
const page=await browser.newPage({viewport:{width:393,height:852},isMobile:true,hasTouch:true,deviceScaleFactor:1});
page.on('pageerror',e=>errors.push(e.message));
page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('favicon.ico'))errors.push(r.status()+' '+r.url());});
const checkViewport=async (w,h,expectedRotation)=>{
 await page.setViewportSize({width:w,height:h});
 await page.waitForFunction(expect=>window.mamoken3d?.landscapeLocked===expect,expectedRotation);
 const bounds=await page.evaluate(()=>{
  const rect=id=>document.getElementById(id).getBoundingClientRect().toJSON();
  return {app:rect('app'),arena:rect('arena'),stick:rect('stick-rail'),
    buttons:rect('buttons-rail'),stage:rect('stage'),selection:rect('selection')};
 });
 assert.equal(await page.evaluate(()=>document.documentElement.classList.contains('landscape-locked')),expectedRotation);
 assert.ok(Math.abs(bounds.app.width-w)<=2,`width ${w}:${JSON.stringify(bounds.app)}`);
 assert.ok(Math.abs(bounds.app.height-h)<=2,`height ${h}:${JSON.stringify(bounds.app)}`);
 assert.ok(bounds.stage.width>95&&bounds.stage.height>160,'landscape stage must remain meaningful');
 if(expectedRotation){
   assert.ok(bounds.stick.bottom<=bounds.arena.top+2,'physical upper rail corresponds to game left');
   assert.ok(bounds.arena.bottom<=bounds.buttons.top+2,'physical lower rail corresponds to game right');
 }else{
   assert.ok(bounds.stick.right<=bounds.arena.left+2);
   assert.ok(bounds.arena.right<=bounds.buttons.left+2);
 }
 console.log('landscape-only viewport OK',w,h,'CSS rotated?',expectedRotation);
 return bounds;
};
try{
 await page.goto(base,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.mamoken3d);
 let bounds=await checkViewport(393,852,true);
 assert.equal(await page.locator('#buttons-rail [data-control]').count(),6);
 assert.equal(await page.locator('#stick-rail [data-control]').count(),2);
 assert.equal(await page.locator('#rotate').isVisible(),false);
 await page.screenshot({path:shots+'/portrait-393-game.png'});
 // Top-layer popovers need their own transform; controls are not allowed to disappear.
 for(const [trigger,panel] of [['.av-settings-toggle','#av-settings'],['button[popovertarget="commands-help"]','#commands-help']]){
   await page.locator(trigger).tap();
   assert.equal(await page.locator(panel).evaluate(el=>el.matches(':popover-open')),true);
   const rect=await page.locator(panel).boundingBox();
   assert.ok(rect.x>=-2&&rect.y>=-2&&rect.x+rect.width<=395&&rect.y+rect.height<=854,
     'rotated settings must remain on-screen: '+JSON.stringify(rect));
   await page.screenshot({path:shots+'/'+panel.slice(1)+'.png'});
   await page.locator(trigger).tap();
 }
 // Real pointer events: CSS game-right maps to physical down on portrait-locked phone.
 await page.locator('#start').tap();
 await page.waitForFunction(()=>window.mamoken3d?.battle?.frame>2,undefined,{timeout:30000});
 await page.evaluate(()=>{
  const g=mamoken3d.battle;
  g.fighters[1].x=1.6;g.fighters[1].stun=600;g.fighters[0].x=-.55;
  g.fighters[0].stun=0;g.fighters[0].stop=0;
 });
 const stick=await page.locator('#joystick').boundingBox(),cx=stick.x+stick.width/2,cy=stick.y+stick.height/2;
 const cdp=await page.context().newCDPSession(page);
 const dispatch=(type,points)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points});
 const before=await page.evaluate(()=>mamoken3d.battle.fighters[0].x);
 await dispatch('touchStart',[{x:cx,y:cy+33,id:7}]);
 await page.waitForFunction(x=>mamoken3d.battle.fighters[0].x>x+.08,before,{timeout:4500});
 await dispatch('touchMove',[{x:cx+33,y:cy,id:7}]);
 await page.waitForFunction(()=>mamoken3d.battle.fighters[0].y>0,undefined,{timeout:4500});
 await dispatch('touchEnd',[]);
 console.log('rotated joystick touch axes OK: right then up');
 // In portrait-locked mode, a confirmed ultimate keeps the entire rotated movie inside the viewport.
 await page.evaluate(()=>{
  const g=mamoken3d.battle,p=g.fighters[0],t=g.fighters[1];
  p.x=-.20;t.x=.20;p.y=t.y=0;p.vy=t.vy=0;p.super=100;p.stun=0;p.stop=0;p.action=null;p.frame=0;
  p.prev.ultimateButton=false;t.stun=400;t.action=null;t.stop=0;
 });
 await page.locator('[data-control="ultimateButton"]').tap();
 await page.waitForFunction(()=>mamoken3d.cinematic.active,undefined,{timeout:8000});
 const cinema=await page.locator('#cinematic-layer').boundingBox();
 assert.ok(cinema.width>=390&&cinema.width<=395&&cinema.height>=850,'movie should cover physical portrait viewport');
 assert.equal(await page.locator('#stage').evaluate(e=>e.parentElement.id),'cinematic-viewport');
 await page.screenshot({path:shots+'/portrait-locked-ultimate.png'});
 await page.locator('#cinematic-skip').tap();
 await page.waitForFunction(()=>!mamoken3d.cinematic.active,undefined,{timeout:4500});
 assert.equal(await page.locator('#stage').evaluate(e=>e.parentElement.id),'arena');
 await checkViewport(375,667,true);
 await checkViewport(320,568,true);
 await checkViewport(852,393,false);
 await page.screenshot({path:shots+'/native-landscape-852.png'});
 assert.deepEqual(errors,[]);
 console.log('PORTRAIT LANDSCAPE LOCK PASS: 3 portrait sizes, 1 landscape, popovers, joystick, movie+skip, GLB');
}catch(error){
 await page.screenshot({path:shots+'/failure.png'}).catch(()=>{});
 console.error('browser errors:',errors);
 throw error;
}finally{await browser.close();}
