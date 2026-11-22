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
const authoredFixture=process.env.MAMOKEN_TEST_AUTHORED==='1';
const page=await browser.newPage({viewport:{width:852,height:393},isMobile:true,hasTouch:true,deviceScaleFactor:1});
page.on('pageerror',e=>errors.push('JS: '+e.message));
page.on('console',msg=>{if(msg.type()==='warning'&&/PropertyBinding|専用技素材|奥義ムービー/.test(msg.text()))errors.push(msg.text());});
if(authoredFixture){
  const common={schemaVersion:1,characterId:'chirka'};
  const authored={
    ...common,moveId:'ultimate',trigger:'confirmed_unblocked_ultimate_hit',runtime:'threejs',
    durationSeconds:10,animationSources:{attacker:{clip:'super'},target:{clip:'throw_hit'}},
    shots:Array.from({length:4},(_,i)=>({
      id:'fixture-'+i,start:i*2.5,end:(i+1)*2.5,
      camera:{position:{x:-.4+i*.3,y:.9,z:2-i*.14},endPosition:{x:-.16+i*.3,y:1,z:2-i*.14},
        lookAt:i%2?'target.head':'attacker.head',projection:'perspective',fov:45,rollDeg:i*2}
    })),
    cueTrack:[{at:.8,type:'sfx',key:'hit'},{at:1.2,type:'vfx',key:'shard',bone:'head'}]
  };
  await page.route('**/cinematic/v14/manifest.json', route=>route.fulfill({
    json:{schemaVersion:1,characters:{chirka:'chirka/manifest.json'}}
  }));
  await page.route('**/cinematic/v14/chirka/manifest.json',route=>route.fulfill({
    json:{moves:[...['s1','s2','s3'].map(moveId=>({...common,moveId,
      animationSources:{attacker:{clip:'cmd_236'}},cueTrack:[{at:0,type:'sfx',key:'special'}]})),authored]}
  }));
}

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
  if(authoredFixture){
    await page.waitForFunction(()=>document.getElementById('cinematic-layer').dataset.phase==='fixture-0');
    await page.waitForFunction(()=>document.getElementById('cinematic-layer').dataset.phase==='fixture-1',undefined,{timeout:15000});
  }
  const frozen=await page.evaluate(()=>({
    frame:mamoken3d.battle.frame,time:mamoken3d.battle.time,hp:mamoken3d.battle.fighters.map(p=>[p.hp,p.drive,p.super])
  }));
  await page.waitForTimeout(authoredFixture?4200:165);
  const after=await page.evaluate(()=>({
    frame:mamoken3d.battle.frame,time:mamoken3d.battle.time,hp:mamoken3d.battle.fighters.map(p=>[p.hp,p.drive,p.super])
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
  if(!authoredFixture)await page.locator('#cinematic-skip').tap();
  await page.locator('#game-over').waitFor({state:'visible',timeout:25000});
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
  await page.locator('.av-settings-toggle').tap();
  await page.locator('#fx-toggle').tap();
  assert.equal(await page.locator('#fx-toggle').getAttribute('aria-pressed'),'true');
  await page.locator('.av-settings-toggle').tap();
  const index=await page.evaluate(async()=>{
    const result=await fetch('../cinematic/v14/manifest.json');
    if(!result.ok)throw new Error('Showtime index HTTP '+result.status);
    return result.json();
  });
  for(const [id,path] of Object.entries(index.characters)){
    const {moves}=await page.evaluate(async path=>(await fetch('../cinematic/v14/'+path)).json(),path);
    await page.locator('#select-back').tap();
    await choose(id);
    if(!moves.length)continue;
    const loaded=await page.evaluate(()=>Object.keys(mamoken3d.actors[0].showtime).filter(key=>key!=='reactions').sort());
    assert.deepEqual(loaded,['s1','s2','s3','ultimate'], id+' missing authored clips');
    await positions(.36);
    for(const [move, direction] of [['s1',null],['s2','ArrowUp'],['s3','ArrowRight']]){
      await page.evaluate(direction=>{
        for(const code of [direction,'KeyB'].filter(Boolean)){
          document.dispatchEvent(new KeyboardEvent('keydown',{code,cancelable:true}));
        }
      },direction);
      await page.waitForFunction(move=>{
        const actor=mamoken3d.actors[0];
        return actor.current===actor.showtime[move].action;
      },move,{timeout:5000});
      await page.evaluate(direction=>{
        for(const code of ['KeyB',direction].filter(Boolean)){
          document.dispatchEvent(new KeyboardEvent('keyup',{code,cancelable:true}));
        }
      },direction);
      assert.equal(await page.locator('#cinematic-layer').evaluate(el=>el.hidden),true);
      await page.screenshot({path:evidence+'/'+id+'-'+move+'.png'});
      await positions(.36);
      await page.evaluate(()=>{
        const p=mamoken3d.battle.fighters[0];
        p.prev.special=false;
      });
    }
    const spec=moves.find(move=>move.moveId==='ultimate');
    await positions(.36,20);
    await page.locator('[data-control="ultimateButton"]').tap();
    await page.waitForFunction(()=>mamoken3d.cinematic.active,undefined,{timeout:7500});
    assert.equal(await page.locator('#game-over').isVisible(),false);
    const begin=await page.evaluate(()=>[mamoken3d.battle.frame,mamoken3d.battle.time]);
    await page.waitForFunction(shot=>document.getElementById('cinematic-layer').dataset.phase===shot,
      spec.shots[1].id,{timeout:15000});
    assert.deepEqual(await page.evaluate(()=>[mamoken3d.battle.frame,mamoken3d.battle.time]),begin);
    await page.screenshot({path:evidence+'/'+id+'-authored-ultimate.png'});
    await page.locator('#game-over').waitFor({state:'visible',timeout:30000});
    assert.equal(await page.locator('#stage').evaluate(el=>el.parentElement.id),'arena');
    console.log('Authored clips and hit-confirmed KO verified:',id);
  }
  assert.deepEqual(errors,[]);
  console.log('Cinematic browser PASS: super whiff no movie, specials dramatic, confirmed super fullscreen scene, freeze, skip, KO defer, SFX/BGM/FX, Bullet HUD');
}catch(e){
  await page.screenshot({path:evidence+'/failure.png'}).catch(()=>{});
  console.error('Browser errors:',errors);
  throw e;
}finally{await browser.close();}
