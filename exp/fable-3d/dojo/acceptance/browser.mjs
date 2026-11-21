import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright-core');
const directory=process.env.MAMOKEN_EVIDENCE ?? '/tmp';
const base=process.env.MAMOKEN_URL ?? 'http://127.0.0.1:4180/';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH ?? '/usr/bin/chromium',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const fail=[];
async function open(width,height,id,example){
  const page=await browser.newPage({viewport:{width,height},isMobile:true,hasTouch:true,deviceScaleFactor:1});
  page.on('pageerror',e=>fail.push(e.message));
  page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('favicon.ico'))fail.push(r.status()+' '+r.url());});
  await page.goto(base);
  await page.waitForURL('**/dojo/');
  await page.locator('#start').tap();
  await page.waitForFunction(()=>mamoken3d.battle&&mamoken3d.battle.frame>0);
  const cdp=await page.context().newCDPSession(page);
  const insets=example?{left:47,right:47,top:0,bottom:21}:{left:0,right:0,top:0,bottom:0};
  await cdp.send('Emulation.setSafeAreaInsetsOverride',{insets});
  const bounds=await page.evaluate(()=>{
    const rects=Object.fromEntries(['app','stage','joystick','arena','stick-rail','buttons-rail','game-over'].map(k=>[k,document.getElementById(k).getBoundingClientRect().toJSON()]));
    return {...rects,buttons:[...document.querySelectorAll('[data-control]')].map(b=>({key:b.dataset.control,...b.getBoundingClientRect().toJSON()}))};
  });
  assert.equal(bounds['stick-rail'].left,insets.left);
  assert.equal(bounds['buttons-rail'].right,width-insets.right);
  assert.ok(bounds.stage.bottom<=height-insets.bottom);
  assert.equal(bounds.joystick.width,bounds.joystick.height);
  assert.ok(bounds.joystick.right<=bounds.stage.left);
  assert.equal(bounds.buttons.length,5);
  assert.ok(bounds.buttons.every(b=>b.left>=bounds.stage.right&&b.right<=width-insets.right&&b.width>=42));
  const helpFits=await page.locator('#commands-help').evaluate(e=>e.scrollWidth===e.clientWidth);
  assert.ok(helpFits);
  await page.screenshot({path:directory+'/'+id+'.png'});
  console.log(id+' layout '+width+'x'+height+', arena '+bounds.stage.width+'x'+bounds.stage.height+', safe insets '+Object.values(insets).join('/'));
  return {page,cdp,bounds};
}
try{
  const narrow=await open(568,320,'chromium-narrow',false);
  await narrow.page.close();
  const android=await open(800,360,'chromium-android-layout',false);
  await android.page.close();
  const {page,cdp,bounds}=await open(852,393,'chromium-iphone-layout',true);
  await page.evaluate(()=>{
    window.audit={log:[],opponent:{},pointer:[]};
    for(const name of ['pointerdown','pointermove','pointerup','pointercancel','lostpointercapture']){
      document.addEventListener(name,e=>{
        if(e.pointerType==='touch')audit.pointer.push([name,e.pointerId,e.target.closest('[data-control],#joystick')?.id||e.target.closest('[data-control]')?.dataset.control]);
      },true);
    }
  });
  async function setup({reversed=false,dist=1.4,superReady=false,stop=0,poison=false}={}){
    await page.evaluate(({reversed,dist,superReady,stop,poison})=>{
      const g=mamoken3d.battle;
      Object.assign(g,new g.constructor('moguzo','godan'));
      const [p,o]=g.fighters, side=reversed?-1:1;
      p.x=-side*dist/2;o.x=side*dist/2;p.facing=side;o.facing=-side;
      p.super=superReady?100:0;p.stop=stop;p.stun=stop?25:0;
      if(poison){p.poison=180;p.poisonTick=0;}
      audit.opponent={};audit.log=[];audit.pointer=[];
      const tick=g.constructor.prototype.tick;
      g.tick=function(raw){
        const result=tick.call(this,raw,audit.opponent);
        for(const e of g.events)audit.log.push({...e,at:g.frame});
        return result;
      };
    },{reversed,dist,superReady,stop,poison});
  }
  const cx=Math.round(bounds.joystick.x+bounds.joystick.width/2),cy=Math.round(bounds.joystick.y+bounds.joystick.height/2);
  const pos=(code,reversed=false)=>({x:cx+((code-1)%3-1)*25*(reversed?-1:1),y:cy+(1-Math.floor((code-1)/3))*25,id:1});
  const button=(key,id)=>{const b=bounds.buttons.find(b=>b.key===key);return {x:Math.round(b.x+b.width/2),y:Math.round(b.y+b.height/2),id};};
  const touch=(type,...touchPoints)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints});
  const waitFrames=async(n=2)=>{const f=await page.evaluate(()=>mamoken3d.battle.frame);await page.waitForFunction(f=>mamoken3d.battle.frame>=f,f+n);};
  async function command(motion,key,expected,options={}){
    await setup(options);
    const [first,...rest]=motion;
    await touch('touchStart',pos(first,options.reversed));
    if(options.hold)await waitFrames(options.hold);
    for(const dir of rest)await touch('touchMove',pos(dir,options.reversed));
    await touch('touchStart',pos(motion.at(-1),options.reversed),button(key,2));
    await touch('touchEnd');
    await waitFrames();
    const moves=await page.evaluate(()=>audit.log.filter(e=>e.type==='move').map(e=>e.action));
    assert.deepEqual(moves,[expected],JSON.stringify({motion,options,key}));
  }
  for(const reversed of [false,true]){
    await command([2,3,6],'weak','s1',{reversed});
    await command([6,2,3],'strong','s2',{reversed});
    await command([2,1,4],'strong','s3',{reversed});
    await command([2,3,6,2,3,6],'strong','ultimate',{reversed,superReady:true});
    await command([2,5,6],'strong','s1',{reversed,hold:24});
    await command([6,5,2,5,6],'weak','s2',{reversed});
    await command([2,5,4],'weak','s3',{reversed});
    await command([2,5,6,5,2,5,6],'strong','ultimate',{reversed,superReady:true});
  }
  await command([2,6,2,6],'strong','s1');
  await command([2,6,2,6],'weak','s1',{superReady:true});
  await command([2,3,6,4],'weak','stand_weak');
  console.log('19 touch command cases: left/right, held down, omitted diagonals, neutral, super priority and no false positives');
  await setup({dist:.80,stop:12,poison:true});
  await touch('touchStart',pos(6));
  await touch('touchStart',pos(6),button('weak',2));
  await touch('touchStart',pos(6),button('weak',2),button('gyuiin',3));
  assert.equal(await page.locator('.held').count(),3);
  await touch('touchMove',{...pos(5),x:cx+85},button('weak',2),button('gyuiin',3));
  await touch('touchEnd');
  await page.waitForFunction(()=>mamoken3d.battle.clinch);
  let result=await page.evaluate(()=>({hp:mamoken3d.battle.fighters.map(p=>p.hp),faces:mamoken3d.battle.fighters.map(p=>p.facing),clips:mamoken3d.actors.map(a=>a.current.getClip().name),drive:mamoken3d.battle.fighters[0].drive,pointer:audit.pointer}));
  assert.deepEqual(result.hp,[1000,1230]);
  assert.deepEqual(result.faces,[1,-1]);
  assert.equal(result.drive,40);
  assert.deepEqual(result.clips,['guard_stand','guard_stand']);
  assert.ok(result.pointer.some(e=>e[0]==='pointermove'&&e[2]==='joystick'));
  assert.equal(new Set(result.pointer.filter(e=>e[0]==='pointerdown').map(e=>e[1])).size,3);
  assert.equal(await page.locator('.held').count(),0);
  await page.screenshot({path:directory+'/chromium-clinch.png'});
  await page.waitForFunction(()=>audit.log.some(e=>e.type==='gyuiin_break'));
  assert.ok(await page.evaluate(()=>Math.abs(mamoken3d.battle.fighters[0].x-mamoken3d.battle.fighters[1].x)>=1.34));
  console.log('3 independent touch IDs, captured stick slide, no held controls after release; gyuiin during hitstop and two synchronized fallback poses');
  await setup({dist:.70});
  await page.evaluate(()=>{mamoken3d.battle.projectiles.push({id:99,owner:1,x:-.1,y:.3,face:-1,speed:.001,life:80,damage:85,level:'mid'});});
  await touch('touchStart',button('roar',1));
  await touch('touchEnd');
  await page.waitForFunction(()=>audit.log.some(e=>e.type==='roar_erase'));
  await page.evaluate(()=>audit.opponent={roar:true});
  await page.waitForFunction(()=>audit.log.some(e=>e.type==='roar_counter'));
  assert.equal(await page.evaluate(()=>mamoken3d.battle.fighters[0].drive),65);
  console.log('touch roar drive, projectile erase, later CPU roar counter');
  await setup({dist:.56});
  await page.evaluate(async()=>{
    const { Box3, Vector3 }=await import('../preview/vendor/three.module.min.js');
    const actor=mamoken3d.actors[0];
    let measureMesh;
    actor.gltf.scene.traverse(node=>{if(!measureMesh&&node.isSkinnedMesh)measureMesh=node;});
    const original=measureMesh.onBeforeRender;
    audit.air={sampled:0,maxY:0,frameY:0,clipped:0};
    measureMesh.onBeforeRender=function(renderer,scene,camera,...rest){
      original.call(this,renderer,scene,camera,...rest);
      const { y }=mamoken3d.battle.fighters[0];
      if(y<=0||y<=audit.air.frameY)return;
      audit.air.frameY=y;
      audit.air.sampled++;
      audit.air.maxY=Math.max(audit.air.maxY,y);
      const {min,max}=new Box3().setFromObject(actor.gltf.scene,true);
      let maxNdc=0;
      for(const x of [min.x,max.x])for(const wy of [min.y,max.y])for(const z of [min.z,max.z]){
        const edge=new Vector3(x,wy,z).project(camera);
        maxNdc=Math.max(maxNdc,Math.abs(edge.x),Math.abs(edge.y));
      }
      if(maxNdc>1)audit.air.clipped++;
    };
  });
  await touch('touchStart',pos(9));
  await page.waitForFunction(()=>mamoken3d.battle.fighters[0].facing===-1);
  await touch('touchMove',pos(6));
  await page.waitForFunction(()=>mamoken3d.battle.fighters[0].y===0);
  await touch('touchEnd');
  const air=await page.evaluate(()=>audit.air);
  assert.ok(air.maxY>.80&&air.sampled>0);
  assert.equal(air.clipped,0);
  console.log('Touch jump crossed and turned, apex '+air.maxY.toFixed(3)+' m, clipped rising frames '+air.clipped+'/'+air.sampled);
  await setup({dist:.40});
  await page.evaluate(()=>{const p=mamoken3d.battle.fighters[1];p.hp=1;});
  await touch('touchStart',button('weak',1));
  await touch('touchEnd');
  await page.locator('#game-over').waitFor({state:'visible'});
  assert.equal(await page.locator('#result-title').textContent(),'勝利！');
  await page.screenshot({path:directory+'/chromium-ko.png'});
  await page.locator('#rematch').tap();
  await page.waitForFunction(()=>mamoken3d.battle?.phase==='fight'&&mamoken3d.actors.every(Boolean));
  assert.deepEqual(await page.evaluate(()=>mamoken3d.battle.fighters.map(p=>[p.hp,p.drive,p.super])),[[1000,100,0],[1230,100,0]]);
  await page.locator('#select-back').tap();
  await page.locator('#selection').waitFor({state:'visible'});
  for(const [i,id] of Object.keys(await page.evaluate(()=>mamoken3d.ROSTER)).entries()){
    await page.locator('.fighter-card').nth(i).tap();
    await page.locator('#start').tap();
    await page.waitForFunction(id=>mamoken3d.actors[0]?.id===id&&document.querySelector('#selection').classList.contains('hidden'),id);
    const data=await page.evaluate(()=>({keys:Object.keys(mamoken3d.actors[0].actions),tail:mamoken3d.battle.tailTipSamples}));
    assert.equal(data.keys.length,11);
    if(id==='bullet')assert.ok(data.tail.length>=2);
    console.log(id+': '+data.keys.join(', '));
    await page.locator('#select-back').tap();
  }
  console.log('Touch KO, rematch gauges, reselect, loaded 99 GLTFLoader clips; Bullet tail path loaded');
  assert.deepEqual(fail,[]);
  console.log('No uncaught JS errors or failed app/asset requests');
}finally{
  await browser.close();
}
