// Real Chromium WebGL acceptance for hit-confirmed full-screen ultimate movies.
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('playwright-core');
const base=process.env.MAMOKEN_URL||'http://127.0.0.1:4173/exp/fable-3d/dojo/';
const evidence=process.env.MAMOKEN_EVIDENCE||'/tmp/mamoken-cinematic';
await mkdir(evidence,{recursive:true});
const browser=await chromium.launch({
  executablePath:process.env.CHROMIUM_PATH||'/usr/bin/google-chrome',
  args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']
});
const errors=[];
const page=await browser.newPage({viewport:{width:852,height:393},isMobile:true,hasTouch:true,deviceScaleFactor:1});
page.on('pageerror',e=>errors.push('JS: '+e.message));
page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('favicon.ico'))errors.push(r.status()+' '+r.url());});
async function choose(id){
  await page.locator('#selection').waitFor({state:'visible'});
  const ids=['moguzo','pisuke','godan','hakuma','chirka','takimaru','yomikage','bullet','dark_moguzo'];
  await page.locator('.fighter-card').nth(ids.indexOf(id)).tap();
  await page.locator('#start').tap();
  await page.waitForFunction(id=>window.mamoken3d?.actors?.[0]?.id===id&&window.mamoken3d?.battle?.frame>0,id,{timeout:25000});
}
const positions=async (dist,opHp=null)=>{
  await page.evaluate(({dist,opHp})=>{
    const g=window.mamoken3d.battle,p=g.fighters[0],t=g.fighters[1];
    p.x=-dist/2;t.x=dist/2;p.y=t.y=0;p.vy=t.vy=0;
    p.super=100;p.action=null;p.frame=0;p.stun=0;p.stop=0;p.dashF=0;p.prev.ultimateButton=false;
    t.action=null;t.frame=0;t.stun=220;t.stop=0;t.dashF=0;
    if(opHp!==null)t.hp=opHp;
  },{dist,opHp});
};
try{
  await page.goto(base,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.mamoken3d);
  assert.equal(await page.locator('#buttons-rail [data-control]').count(),6);
  assert.equal(await page.locator('#stick-rail [data-control]').count(),2);
  const layout=await page.evaluate(()=>{
    const b=id=>document.getElementById(id).getBoundingClientRect().toJSON();
    return {stage:b('stage'),left:b('stick-rail'),right:b('buttons-rail')};
  });
  assert.ok(layout.left.right<=layout.stage.left);
  assert.ok(layout.stage.right<=layout.right.left);
  await choose('chirka');

  // 1. No transition on a whiff. Match time and inputs keep moving.
  await positions(2.8);
  const startFrame=await page.evaluate(()=>mamoken3d.battle.frame);
  await page.locator('[data-control="ultimateButton"]').tap();
  await page.waitForFunction(f=>mamoken3d.battle.frame>f+36,startFrame,{timeout:8000});
  assert.equal(await page.locator('#cinematic-layer').evaluate(el=>el.hidden),true,'miss cannot start movie');

  // 2. Ordinary specials show the old super's flair without starting movie mode.
  await page.evaluate(()=>{
    const p=mamoken3d.battle.fighters[0];p.action=null;p.stun=0;p.stop=0;
  });
  await page.locator('[data-control="special"]').tap();
  await page.waitForFunction(()=>document.getElementById('showtime-banner').classList.contains('active'),undefined,{timeout:4500});
  assert.equal(await page.locator('#cinematic-layer').evaluate(el=>el.hidden),true,'special is not a full-screen movie');

  // 3. Actual super connection switches THE SAME WebGL canvas to full screen.
  await positions(.40);
  await page.locator('[data-control="ultimateButton"]').tap();
  await page.waitForFunction(()=>window.mamoken3d.cinematic.active&&
    !document.getElementById('cinematic-layer').hidden,undefined,{timeout:7500});
  assert.equal(await page.locator('#stage').evaluate(el=>el.parentElement.id),'cinematic-viewport');
  assert.ok((await page.locator('#cinematic-portrait').getAttribute('src')).includes('chirka'));
  assert.equal(await page.locator('#cinematic-layer').getAttribute('data-character'),'chirka');
  const frozen=await page.evaluate(()=>({
    frame:mamoken3d.battle.frame,time:mamoken3d.battle.time,hp:mamoken3d.battle.fighters.map(p=>p.hp)
  }));
  await page.waitForTimeout(165);
  const after=await page.evaluate(()=>({
    frame:mamoken3d.battle.frame,time:mamoken3d.battle.time,hp:mamoken3d.battle.fighters.map(p=>p.hp)
  }));
  assert.deepEqual(after,frozen,'combat must stay frozen inside the movie');
  await page.screenshot({path:evidence+'/chirka-fullscreen-movie.png'});
  await page.locator('#cinematic-skip').tap();
  await page.waitForFunction(()=>document.getElementById('cinematic-layer').hidden);
  assert.equal(await page.locator('#stage').evaluate(el=>el.parentElement.id),'arena');
  assert.equal(await page.evaluate(()=>mamoken3d.actors[0].illusions.active),false);

  // 4. The hit that kills also plays the movie BEFORE announcing the result.
  await positions(.38,35);
  await page.locator('[data-control="ultimateButton"]').tap();
  await page.waitForFunction(()=>window.mamoken3d.cinematic.active,undefined,{timeout:7500});
  assert.equal(await page.locator('#game-over').isVisible(),false,'KO result must wait');
  await page.screenshot({path:evidence+'/ko-cinematic-before-result.png'});
  await page.locator('#cinematic-skip').tap();
  await page.locator('#game-over').waitFor({state:'visible',timeout:5000});
  assert.equal(await page.locator('#cinematic-layer').evaluate(el=>el.hidden),true);

  // 5. All independent controls stay functional after a movie and a KO.
  await page.locator('.av-settings-toggle').tap();
  await page.locator('#fx-toggle').tap();
  assert.equal(await page.locator('#fx-toggle').getAttribute('aria-pressed'),'false');
  await page.locator('#music-toggle').tap();
  assert.equal(await page.locator('#music-toggle').getAttribute('aria-pressed'),'true');
  await page.locator('#sound-toggle').tap();
  assert.equal(await page.locator('#sound-toggle').getAttribute('aria-pressed'),'false');
  await page.locator('#music-toggle').tap();
  assert.equal(await page.locator('#music-toggle').getAttribute('aria-pressed'),'false');
  await page.locator('.av-settings-toggle').tap();

  // 6. Existing Bullet charge HUD survives new cinematic layer.
  await page.locator('#select-back').tap();
  await choose('bullet');
  await page.evaluate(()=>{mamoken3d.battle.fighters[0].ability.charge=3;});
  await page.waitForFunction(()=>document.querySelectorAll('#charge-pips-0 .filled').length===3,undefined,{timeout:4000});
  assert.equal(await page.locator('#hud-side-0').getAttribute('data-element'),'amber');
  await page.screenshot({path:evidence+'/bullet-after-movie.png'});
  assert.deepEqual(errors,[]);
  console.log('Cinematic browser PASS: super whiff no movie, specials dramatic, confirmed super fullscreen scene, freeze, skip, KO defer, SFX/BGM/FX, Bullet HUD');
}catch(e){
  await page.screenshot({path:evidence+'/failure.png'}).catch(()=>{});
  console.error('Browser errors:',errors);
  throw e;
}finally{await browser.close();}
