// Real production actor consumers: no clip, source or contact table replacement.
import assert from 'node:assert/strict';import {mkdir,writeFile} from 'node:fs/promises';import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('playwright-core');
const base=process.env.MAMOKEN_URL??'http://127.0.0.1:4173/exp/fable-3d/dojo/';
const directory=(process.env.MAMOKEN_EVIDENCE??'/tmp/mamoken-p3')+'/special-responses';await mkdir(directory,{recursive:true});
const report={source:'live-production-Dojo-and-Story-actors',physicalDeviceTested:false,fixtureFreezes:'Latch already rendered real fixed frames for PNG; never rewrite clip time or replace assets',cases:[],errors:[]};
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH??'/usr/bin/google-chrome',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});let page;
async function open(mode,id){
 page=await browser.newPage({viewport:{width:852,height:393},isMobile:true,hasTouch:true});
 page.on('pageerror',e=>report.errors.push(mode+'/'+id+': '+e.message));page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('favicon.ico'))report.errors.push(r.status()+' '+r.url());});
 page.on('console',m=>{if(/PropertyBinding.*(not found|failed)/.test(m.text()))report.errors.push(m.text());});
 await page.goto(mode==='story'?new URL('../story/',base).href:base);await page.waitForFunction(()=>window.mamokenStory?.previewReady||window.mamoken3d,undefined,{timeout:90000});
 if(mode==='story'){
  await page.locator('#avatar-base').selectOption(id);
  if(await page.locator('#p4-editor-tab-2').count())await page.locator('#p4-editor-tab-2').click();
  await page.locator('#avatar-style').selectOption(id);for(let i=0;i<3;i++)await page.locator('#move-'+i).selectOption(id+'.s'+(i+1));
  await page.locator('#enter').click();await page.waitForFunction(()=>mamokenStory.mode==='explore',undefined,{timeout:90000});
  await page.keyboard.down('w');try{await page.waitForFunction(()=>mamokenStory.nearby?.id==='moguzo',undefined,{timeout:20000});}finally{await page.keyboard.up('w');}
  await page.locator('#talk').tap();await page.locator('#challenge').click();await page.waitForFunction(()=>mamokenStory.mode==='battle'&&mamokenStory.battle?.frame>2,undefined,{timeout:120000});
 }else{await page.evaluate(id=>mamoken3d.startMatch({ids:[id,'moguzo'],practice:true,instant:true}),id);await page.waitForFunction(()=>!mamoken3d.diagnostics.loading&&mamoken3d.battle?.frame>2,undefined,{timeout:90000});}
 const source=await page.evaluate(async mode=>{
  window.__responseApp=mode==='story'?mamokenStory:mamoken3d;const a=__responseApp.actors[0],g=__responseApp.battle;
  const {APPROVED_P3_SPECIAL_MOTION_VERSION:family}=await import('../dojo/special-motion-overrides-p3.js');
  return {family,version:g.specialContactDelivery?.version,spec:a.showtime.s3.spec,action:a.showtime.s3.action.getClip().name};
 },mode);
 assert.equal(source.family,'v17r2');assert.equal(source.version,'v17-p3-specials-r2');assert.equal(source.action,'s3_v17');
 return source;
}
async function setup(kind,facing,behavior){await page.evaluate(async({kind,facing,behavior})=>{
 const {specialMove,normalMove}=await import('../dojo/balance.js'),g=__responseApp.battle,[p,t]=g.fighters;
 g.phase='fight';g.time=75*60;g.projectiles=[];
 for(const fighter of [p,t])Object.assign(fighter,{action:null,stun:0,stop:0,ko:false,state:'idle',frame:0,y:0,vy:0,hp:900,guard:100,super:0,input:{},prev:{},dashF:0,landF:0,comboHits:0,comboContact:null});
 p.x=-facing*.18;t.x=facing*.18;p.facing=facing;t.facing=-facing;
 window.__response={kind,behavior,started:g.frame,events:[],incoming:false};
 const tick=g.__responseOriginalTick??g.tick;g.__responseOriginalTick=tick;
 g.tick=function(input={}){
  const actor=__responseApp.actors[0];
  // Inspect the last completed render at the beginning of the next fixed tick.
  // This prevents screenshot latency advancing the response/pair; freezing after
  // _throwTick would incorrectly skip one animation update per photograph.
  const wait=kind==='counter'&&!__response.waitReleased&&p.action?.id==='s3'&&p.frame>=4&&actor.currentName==='s3_v17';
  const response=kind==='counter'&&!__response.responseReleased&&actor.counterFrame>=7&&actor.currentName==='counter_success_v14';
  const pair=kind==='throw'&&__response.pairTarget!==null&&this.throwSequence?.frame>=__response.pairTarget;
  if(__response.hold||wait||response||pair){__response.hold??=wait?'wait':response?'response':'pair';p.stop=1;t.stop=1;this.events=[];return this;}
  if(kind==='counter'&&behavior!=='miss'&&!__response.incoming&&p.action?.kind==='counter'&&p.frame>=p.action.startup+3){this._begin(t,normalMove(t.id,'stand_weak'),'stand_weak');__response.incoming=true;}
  const result=tick.call(this,input,{});for(const e of this.events)if(['counter','hit','block','throw_pair','throw_finish'].includes(e.type))__response.events.push({...e,gameFrame:this.frame});return result;
 };
 if(kind==='throw')__response.pairTarget=8;
 if(!g._begin(p,specialMove(p.id,2),'s3'))throw Error('Actual production special s3 did not begin');
},{kind,facing,behavior});}
async function snapshot(){return page.evaluate(()=>{
 const g=__responseApp.battle;return {gameFrame:g.frame,pair:g.throwSequence&&{...g.throwSequence},fighters:g.fighters.map(p=>({state:p.state,frame:p.frame,stun:p.stun,action:p.action?.id})),
  actors:__responseApp.actors.map(a=>({clip:a.currentName,time:a.current?.time,duration:a.current?.getClip().duration,weight:a.current?.getEffectiveWeight(),counterFrame:a.counterFrame??0})),events:[...__response.events]};
});}
try{
 for(const mode of ['dojo','story']){
  const counterSource=await open(mode,'yomikage');
  for(const facing of [1,-1])for(const behavior of ['finish','interrupt','miss']){
   await setup('counter',facing,behavior);
   await page.waitForFunction(()=>__response.hold==='wait',undefined,{timeout:10000});
   const waiting=await snapshot();assert.equal(waiting.actors[0].clip,'s3_v17');assert.ok(Math.abs(waiting.actors[0].duration-.85)<.0001);
   await page.screenshot({path:directory+'/'+mode+'-counter-'+facing+'-'+behavior+'-wait.png'});
   await page.evaluate(()=>{__response.waitReleased=true;__response.hold=null;for(const p of __responseApp.battle.fighters)p.stop=0;});
   if(behavior==='miss'){
    await page.waitForFunction(()=>!__responseApp.battle.fighters[0].action&&__responseApp.actors[0].currentName==='idle',undefined,{timeout:10000});
    const result=await snapshot();assert.equal(result.events.filter(e=>e.type==='counter').length,0);assert.equal(result.events.filter(e=>e.type==='hit'||e.type==='block').length,0);
    assert.ok(result.gameFrame>=waiting.gameFrame+30);report.cases.push({mode,kind:'counter',facing,behavior,source:counterSource,waiting,result});continue;
   }
   await page.waitForFunction(()=>__response.hold==='response',undefined,{timeout:10000});
   const response=await snapshot(),event=response.events.find(e=>e.type==='counter');assert.ok(event);assert.ok(Math.abs(response.actors[0].duration-.35)<.0001);assert.ok(response.actors[0].time>0&&response.actors[0].time<=.35);
   assert.ok(response.gameFrame>event.gameFrame,'successful visual must not freeze Battle');assert.equal(response.fighters[0].action,undefined);
   await page.screenshot({path:directory+'/'+mode+'-counter-'+facing+'-'+behavior+'-success.png'});
   if(behavior==='interrupt'){
    assert.equal(await page.evaluate(async()=>{const {normalMove}=await import('../dojo/balance.js'),g=__responseApp.battle,a=__responseApp.actors[0];
     if(a.currentName!=='counter_success_v14'||a.counterFrame>=21)throw Error('Interrupt fixture missed the actual response');__response.responseReleased=true;__response.hold=null;for(const p of g.fighters)p.stop=0;
     return g._begin(g.fighters[0],normalMove(g.fighters[0].id,'stand_weak'),'stand_weak');}),true);
    await page.waitForFunction(()=>!__responseApp.actors[0].counterFrame&&__responseApp.actors[0].currentName!=='counter_success_v14',undefined,{timeout:10000});
   }else{await page.evaluate(()=>{__response.responseReleased=true;__response.hold=null;for(const p of __responseApp.battle.fighters)p.stop=0;});await page.waitForFunction(()=>!__responseApp.actors[0].counterFrame&&__responseApp.actors[0].currentName==='idle',undefined,{timeout:10000});}
   const result=await snapshot();assert.equal(result.events.filter(e=>e.type==='counter').length,1);report.cases.push({mode,kind:'counter',facing,behavior,source:counterSource,waiting,response,result});
  }
  await page.close();const throwSource=await open(mode,'takimaru');
  for(const facing of [1,-1]){
   await setup('throw',facing,'pair');
   const samples=[];
   for(const frame of [8,27,46]){
    await page.waitForFunction(frame=>__response.hold==='pair'&&__responseApp.battle.throwSequence?.frame===frame,frame,{timeout:10000});
    const row=await snapshot();assert.ok(row.pair);assert.equal(row.actors[0].clip,'throw_hit');assert.equal(row.actors[1].clip,'thrown');assert.equal(row.pair.total,48);
    for(const [i,duration]of [[0,.8],[1,44/60]]){assert.ok(Math.abs(row.actors[i].duration-duration)<.0001);assert.ok(Math.abs(row.actors[i].time-Math.min((row.pair.frame+1)/60,duration))<2/60,'pair source time diverged from actual Battle sequence');}
    if(frame===46)assert.ok(Math.abs(row.actors[1].time-44/60)<.0001,'victim must hold its last source frame during the final pair frames');
    samples.push(row);await page.screenshot({path:directory+'/'+mode+'-throw-'+facing+'-at-'+frame+'.png'});
    await page.evaluate(next=>{__response.pairTarget=next;__response.hold=null;for(const p of __responseApp.battle.fighters)p.stop=0;},frame===8?27:frame===27?46:null);
   }
   await page.waitForFunction(()=>!__responseApp.battle.throwSequence&&__response.events.some(e=>e.type==='throw_finish'),undefined,{timeout:10000});
   const result=await snapshot(),begin=result.events.find(e=>e.type==='throw_pair'),finish=result.events.find(e=>e.type==='throw_finish');assert.ok(begin&&finish);assert.equal(finish.gameFrame-begin.gameFrame,48);
   assert.equal(result.events.filter(e=>e.type==='hit').length,1,'pair animation must not apply additional damage');
   await page.waitForFunction(()=>__responseApp.battle.fighters[1].stun===0&&!__responseApp.battle.fighters[1].action,undefined,{timeout:10000});
   report.cases.push({mode,kind:'throw',facing,source:throwSource,samples,result,returned:await snapshot()});
  }
  await page.close();
 }
 assert.equal(report.cases.length,16);assert.deepEqual(report.errors,[]);report.passed=true;
}catch(error){report.error=error.stack;await page?.screenshot({path:directory+'/failure.png'}).catch(()=>{});throw error;}
finally{await writeFile(directory+'/report.json',JSON.stringify(report,null,2));await browser.close();}
