// Actual built Story UI/actor/Battle acceptance; no fixture game or rig.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('playwright-core');
const root=process.env.MAMOKEN_STORY_URL??'http://127.0.0.1:4173/exp/fable-3d/story/';
const dir=(process.env.MAMOKEN_EVIDENCE??'/tmp/mamoken-p2')+'/melee';await mkdir(dir,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH??'/usr/bin/google-chrome',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const errors=[],report={passed:false,rows:[]};
const context=await browser.newContext({viewport:{width:852,height:393},isMobile:true,hasTouch:true,deviceScaleFactor:1}),page=await context.newPage();
page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('favicon.ico'))errors.push(r.status()+' '+r.url());});
page.on('console',m=>{if(/PropertyBinding.*(not found|failed)|WebGLProgram.*Shader Error/.test(m.text()))errors.push(m.text());});
const tab=async i=>page.locator('#p4-editor-tab-'+i).click();
try{
 await page.goto(root);await page.waitForFunction(()=>mamokenStory.previewReady,undefined,{timeout:90000});
 // Seed only encounter distance; all character/loadout changes use the editor.
 await page.evaluate(async()=>{const {SAVE_KEY,freshProgress}=await import('./story-state.js');const avatar=structuredClone(mamokenStory.avatar),progress=freshProgress(2601123);progress.position={x:0,z:-1.5};localStorage.setItem(SAVE_KEY,JSON.stringify({version:1,avatar,progress}));});
 await page.reload();await page.waitForFunction(()=>mamokenStory.previewReady,undefined,{timeout:90000});
 const profiles={moguzo:{head:'godan'},godan:{hands:'bullet'},bullet:{feet:'moguzo'}},styles={moguzo:'pisuke',godan:'bullet',bullet:'moguzo'};
 for(const baseId of Object.keys(profiles))for(const profile of ['base','published']){
  await tab(0);await page.locator('#avatar-base').selectOption(baseId);
  for(const slot of ['head','ears','hands','feet','tail','accessory']){await page.locator('#mesh-part-'+slot).selectOption('');await page.locator('#part-'+slot).selectOption('base');}
  if(profile==='published')for(const [slot,donor]of Object.entries(profiles[baseId]))await page.locator('#mesh-part-'+slot).selectOption(donor);
  await tab(2);await page.locator('#avatar-style').selectOption(styles[baseId]);
  const refs=baseId==='godan'?['godan.s3','chirka.s3','moguzo.s1']:['godan.s3','chirka.s3','pisuke.s3'];
  for(let i=0;i<3;i++)await page.locator('#move-'+i).selectOption(refs[i]);
  await page.waitForFunction(({baseId,refs,profile,parts})=>mamokenStory.previewReady&&mamokenStory.player.baseId===baseId&&mamokenStory.player.definition.combat.specials.every((r,i)=>r===refs[i])&&(profile==='base'||Object.entries(parts).every(([s,d])=>mamokenStory.player.definition.appearance.meshParts?.[s]===d)),{baseId,refs,profile,parts:profiles[baseId]},{timeout:120000});
  await tab(3);await page.locator('#enter').click();await page.waitForFunction(()=>mamokenStory.mode==='explore'&&mamokenStory.nearby?.id==='moguzo',undefined,{timeout:120000});
  await page.locator('#talk').tap();await page.locator('#challenge').click();await page.waitForFunction(()=>mamokenStory.mode==='battle'&&mamokenStory.battle.frame>2,undefined,{timeout:120000});
  await page.evaluate(()=>{const g=mamokenStory.battle,realTick=g.tick;window.p2Probe=null;g.tick=function(input){const q=window.p2Probe;if(q?.done){for(const p of this.fighters)p.stop=60;return realTick.call(this,{},{});}const result=realTick.call(this,{},q?.outcome==='guard'?{[q.facing===1?'right':'left']:true}:{});if(q){q.frames++;q.events.push(...structuredClone(this.events));if(this.events.some(e=>e.type==='hit'||e.type==='block')||(!this.fighters[0].action&&q.frames>2)){q.done=true;for(const p of this.fighters)p.stop=60;}}return result;};});
  const row={baseId,profile,refs,cases:[]};
  for(let slot=0;slot<(baseId==='godan'?2:3);slot++)for(const facing of [1,-1])for(const outcome of ['hit','guard','miss']){
   const initial=await page.evaluate(({slot,facing,outcome})=>{
    const g=mamokenStory.battle,[p,t]=g.fighters,a=mamokenStory.actors[0],entry=a.showtime['s'+(slot+1)];g.projectiles=[];g.pending=[];g.events=[];
    for(const x of [p,t])Object.assign(x,{action:null,frame:0,stun:0,stop:0,y:0,vy:0,state:'idle',prev:{},input:{},hp:2000,ko:false,used:false,spawned:false});
    p.x=-facing*.225;t.x=facing*.225;p.facing=facing;t.facing=-facing;
    if(outcome==='guard'){t.x=facing*1.76;p.x=t.x-facing*.45;}if(outcome==='miss'){p.x=-facing*1.2;t.x=facing*1.2;}
    a.specialCueLog=[];window.p2Probe={slot,facing,outcome,frames:0,done:false,events:[]};
    if(!g._begin(p,{},'s'+(slot+1)))throw Error('actual selected P2 move refused');
    const surface=p.action.specialContact;if(!surface||surface.source!=='runtime-skinned-mesh')throw Error('missing real custom surface');
    const boundaries=[];const px=p.x,tx=t.x;
    for(let f=0;f<p.action.active;f++){const point=surface.activeReach[f];p.frame=p.action.startup+f;t.x=p.x+facing*(point.reach+.16-.003);const inner=g._contact(p,t,p.action);t.x=p.x+facing*(point.reach+.16+.003);const outer=g._contact(p,t,p.action);if(outer)throw Error('outside actual skin surface hit');const bounds=g.hurtBoundsResolver(t)[t.id].stand;const height=point.height+.06>=bounds.bottom&&point.height-.06<=bounds.top;if(inner!==height)throw Error('inside custom surface/height mismatch');boundaries.push({frame:f,inner,outer,...point});}
    p.x=px;t.x=tx;p.frame=0;return {ref:p.action.customRef,sourceId:p.action.sourceCharacterId,clip:entry.action.getClip().name,uuid:entry.action.getClip().uuid,boundaries,grounding:entry.action.getClip().userData?.customRetarget?.grounding};
   },{slot,facing,outcome});
   await page.waitForFunction(()=>window.p2Probe?.done,undefined,{timeout:12000});
   const observed=await page.evaluate(async()=>{const g=mamokenStory.battle,p=g.fighters[0],a=mamokenStory.actors[0],q=window.p2Probe,entry=a.showtime['s'+(q.slot+1)],surface=p.action?.specialContact;let renderedSurface;
    if(surface){const THREE=await import('three'),vector=new THREE.Vector3(),inverse=a.avatar.scene.matrixWorld.clone().invert();let reach=-Infinity,height=0,part;
     const group=name=>{const n=name.toLowerCase().replace(/[^a-z0-9]/g,''),side=n.endsWith('l')?'L':n.endsWith('r')?'R':'';if(/paw|hand|wrist|elbow|shoulder|clav|forearm|upperarm|arm/.test(n))return'arm'+side;if(/foot|shin|thigh|knee|ankle|leg|toe/.test(n))return'leg'+side;if(/tail/.test(n))return'tail';if(/head|jaw|ear|neck|snout|nose|beak/.test(n))return'head';return'body';};
     for(const mesh of a.avatar.meshes.filter(m=>m.visible)){const si=mesh.geometry.attributes.skinIndex,sw=mesh.geometry.attributes.skinWeight;for(let i=0;i<si.count;i++){let best=0;for(let k=1;k<4;k++)if(sw.getComponent(i,k)>sw.getComponent(i,best))best=k;const which=group(mesh.skeleton.bones[si.getComponent(i,best)].name);if(!surface.attackParts.includes(which))continue;mesh.getVertexPosition(i,vector);vector.applyMatrix4(mesh.matrixWorld).applyMatrix4(inverse);if(vector.z>reach){reach=vector.z;height=vector.y;part=which;}}}
     const reference=surface.activeReach[p.frame-p.action.startup];renderedSurface={reach,height,part,reference,clipSeconds:entry.action.time};
    }
    return {...q,actionInstance:a.current===entry.action,sourceRef:entry.sourceRef,currentClip:a.current?.getClip().uuid,cues:a.specialCueLog,frame:p.frame,contact:surface,renderedSurface};});
   const hits=observed.events.filter(e=>e.type==='hit'),blocks=observed.events.filter(e=>e.type==='block');assert.equal(hits.length,outcome==='hit'?1:0);assert.equal(blocks.length,outcome==='guard'?1:0);
   if(outcome!=='miss'){assert.equal(observed.actionInstance,true,'same canonical clip selected the wrong slot action');assert.equal(observed.currentClip,initial.uuid);assert.equal(observed.sourceRef,initial.ref);assert.ok(observed.renderedSurface.reference,'rendered contact pose is not an actual active frame');assert.ok(Math.abs(observed.renderedSurface.reach-observed.renderedSurface.reference.reach)<.000001&&Math.abs(observed.renderedSurface.height-observed.renderedSurface.reference.height)<.000001,'rendered equipped skin differs from actual collision sample');assert.equal(observed.renderedSurface.part,observed.renderedSurface.reference.part);const feedback=(hits[0]??blocks[0]).feedback;assert.equal(feedback.characterId,initial.sourceId);assert.equal(feedback.id,initial.ref);assert.ok(observed.cues.some(c=>c.type==='sfx'),'selected source movement SFX cue was not consumed');assert.ok(observed.cues.every(c=>c.characterId===initial.sourceId&&c.ref===initial.ref),'movement cue owner used visual rig/style');}
   row.cases.push({slot,facing,outcome,initial,observed});
   if(outcome==='hit'&&facing===1)await page.screenshot({path:dir+'/'+baseId+'-'+profile+'-s'+(slot+1)+'.png'});
  }
  report.rows.push(row);await page.evaluate(()=>{window.p2Probe=null;const g=mamokenStory.battle;for(const p of g.fighters)p.stop=0;g.fighters[1].hp=0;});await page.waitForFunction(()=>mamokenStory.mode==='result',undefined,{timeout:10000});await page.locator('#return').click();await page.waitForFunction(()=>mamokenStory.mode==='explore');await page.locator('#edit').click();await page.waitForFunction(()=>mamokenStory.previewReady,undefined,{timeout:90000});
 }
 assert.deepEqual(errors,[]);report.passed=true;console.log('P2 actual Story/WebGL melee PASS: six profiles, sixteen selected technique rows, mirrored exact boundaries, real startup hit/guard/miss, independent action instances and source feedback/cues');
}catch(error){report.error=error.stack;await page.screenshot({path:dir+'/error.png'}).catch(()=>{});report.state=await page.evaluate(()=>({mode:window.mamokenStory?.mode,probe:window.p2Probe,status:document.querySelector('#editor-error')?.textContent})).catch(()=>null);throw error;}
finally{report.errors=errors;await writeFile(dir+'/report.json',JSON.stringify(report,null,2));await browser.close();}
