import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {setMatch} from './match-settings.mjs';
const {chromium}=createRequire(import.meta.url)('playwright-core');
const base=process.env.MAMOKEN_URL||'http://127.0.0.1:4173/exp/fable-3d/dojo/';
const evidence=(process.env.MAMOKEN_EVIDENCE||'/tmp/mamoken-runs')+'/runs';await mkdir(evidence,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/google-chrome',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:852,height:393},isMobile:true,hasTouch:true});
const errors=[],report=[];page.on('pageerror',e=>errors.push(e.message));
page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('favicon.ico'))errors.push(r.status()+' '+r.url());});
async function enter(){
 await page.waitForFunction(()=>mamoken3d.run||document.querySelector('#loading-status')?.textContent.includes('失敗'));
 for(let i=0;i<3;i++){if(await page.locator('#run-dialogue').isVisible())await page.locator('#run-dialogue button').tap();}
 await page.waitForFunction(()=>mamoken3d.presentation.loaded,undefined,{timeout:45000});
 await page.waitForFunction(()=>mamoken3d.presentation.state==='fight',undefined,{timeout:20000});
 await page.evaluate(()=>{const p=mamoken3d.battle.fighters[1];p.stun=10000;p.action=null;p.stop=0;});
}
async function finish(winner=0,timeout=false){
 // Round-end state fixture isolates flow integration; real Battle contacts are tested separately.
 await page.evaluate(({winner,timeout})=>{const g=mamoken3d.battle;g.phase='ko';g.winner=winner;if(!timeout)g.fighters[winner===0?1:0].hp=0;g.events=timeout?[{type:'timeout'}]:[{type:'ko',slot:winner}];},{winner,timeout});
 await page.waitForFunction(()=>mamoken3d.presentation.state==='ko');
 const before=await page.evaluate(()=>({frame:mamoken3d.battle.frame,time:mamoken3d.battle.time}));
 await page.waitForTimeout(180);
 assert.deepEqual(await page.evaluate(()=>({frame:mamoken3d.battle.frame,time:mamoken3d.battle.time})),before);
 await page.evaluate(()=>mamoken3d.skipPresentation());
 await page.waitForFunction(()=>mamoken3d.presentation.state!=='ko');
}
async function result(){
 if(await page.evaluate(()=>mamoken3d.presentation.state==='victory'))await page.evaluate(()=>mamoken3d.skipPresentation());
 await page.waitForFunction(()=>mamoken3d.presentation.state==='result');
}
try{
 await page.goto(base);await page.waitForFunction(()=>window.mamoken3d);
 await setMatch(page,'#match-mode','arcade');await setMatch(page,'#run-difficulty','7');await page.locator('#start').tap();await enter();
 assert.equal(await page.evaluate(()=>mamoken3d.run.encounter.level),7);
 for(let stage=1;stage<=8;stage++){
  const first=await page.evaluate(()=>({...mamoken3d.run.encounter}));assert.equal(first.fight,stage);
  await finish();await page.waitForFunction(()=>mamoken3d.presentation.state==='intro');
  assert.equal(await page.evaluate(()=>mamoken3d.run.score[0]),1);
  assert.equal(await page.evaluate(()=>mamoken3d.presentation.log.at(-1)),'intro','no victory film on a round win');
  await page.evaluate(()=>mamoken3d.skipPresentation());await page.waitForFunction(()=>mamoken3d.presentation.state==='fight');
  await finish();assert.equal(await page.evaluate(()=>mamoken3d.presentation.state),'victory');await result();
  report.push(await page.evaluate(()=>({mode:mamoken3d.run.mode,status:mamoken3d.run.status,encounter:mamoken3d.run.encounter})));
  if(stage===8){assert.equal(await page.locator('#result-title').textContent(),'ARCADE CLEAR');assert.equal(first.opponent,'dark_moguzo');assert.equal(first.stage,'newmoon');}
  else{await page.locator('#run-next').tap();await enter();}
 }
 await page.screenshot({path:evidence+'/arcade-clear.png'});
 await page.locator('#result-select').tap();await setMatch(page,'#match-mode','arcade');await page.locator('#start').tap();await enter();
 const original=await page.evaluate(()=>mamoken3d.run.encounter);await finish(-1,true);await result();
 assert.equal(await page.locator('#result-title').textContent(),'CONTINUE?');await page.locator('#run-next').tap();await enter();
 const again=await page.evaluate(()=>({e:mamoken3d.run.encounter,count:mamoken3d.run.continues,hp:mamoken3d.battle.fighters[0].hp,max:mamoken3d.ROSTER[mamoken3d.run.player].hp}));
 assert.equal(again.count,1);assert.equal(again.e.opponent,original.opponent);assert.equal(again.e.stage,original.stage);assert.equal(again.hp,again.max);
 await page.locator('#select-back').tap();await setMatch(page,'#match-mode','survival');await page.locator('#start').tap();await enter();
 for(let i=1;i<=3;i++){
  await page.evaluate(()=>{const p=mamoken3d.battle.fighters[0];p.hp=100;p.poison=20;p.super=100;p.ability.charge=3;});
  await finish();assert.equal(await page.evaluate(()=>mamoken3d.presentation.context.victoryVariant),'short');await result();
  assert.equal(await page.evaluate(()=>mamoken3d.run.wins),i);await page.locator('#run-next').tap();await enter();
  const reset=await page.evaluate(()=>({hp:mamoken3d.battle.fighters[0].hp,poison:mamoken3d.battle.fighters[0].poison,super:mamoken3d.battle.fighters[0].super,charge:mamoken3d.battle.fighters[0].ability.charge}));
  assert.deepEqual(reset,{hp:600,poison:0,super:0,charge:0});
 }
 await finish(1);await result();assert.equal(await page.locator('#result-title').textContent(),'SURVIVAL END');assert.equal(await page.locator('#run-next').isVisible(),false);assert.match(await page.locator('#result-description').textContent(),/残HP 0/);
 await page.screenshot({path:evidence+'/survival-end.png'});
 await page.locator('#result-select').tap();await page.setViewportSize({width:393,height:852});await setMatch(page,'#match-mode','practice');await page.locator('#start').tap();await page.waitForFunction(()=>mamoken3d.practice.enabled&&!mamoken3d.diagnostics.loading&&mamoken3d.presentation.loaded&&mamoken3d.battle?.frame>3);
 assert.equal(await page.evaluate(()=>mamoken3d.run),null);assert.equal(await page.locator('#run-status').isVisible(),false);assert.equal(await page.locator('#timer').textContent(),'∞');assert.equal(await page.evaluate(()=>mamoken3d.landscapeLocked),true);
 await page.screenshot({path:evidence+'/practice-return.png'});assert.deepEqual(errors,[]);await writeFile(evidence+'/report.json',JSON.stringify({report,again,errors},null,2));console.log('RUN MODES WEBGL PASS: 8 matches, 16 rounds, final, continue draw, carry/reset, short victory, loss, portrait practice return');
}catch(e){await page.screenshot({path:evidence+'/error.png'}).catch(()=>{});console.error(errors);throw e;}finally{await browser.close();}
