// Real P2 editor / selected mesh / old-save / Battle-return acceptance.
// Spatial and terminal setup below accelerates encounters; inputs and contacts
// still run through the existing UI, actor loader and Battle implementation.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('playwright-core');
const root=process.env.MAMOKEN_STORY_URL??'http://127.0.0.1:4173/exp/fable-3d/story/';
const dir=(process.env.MAMOKEN_EVIDENCE??'/tmp/mamoken-p2')+'/editor';await mkdir(dir,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH??'/usr/bin/google-chrome',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const context=await browser.newContext({viewport:{width:852,height:393},isMobile:true,hasTouch:true,deviceScaleFactor:1});
const page=await context.newPage(),errors=[],report=[];
const watch=page=>{page.on('pageerror',error=>errors.push(error.message));page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('favicon.ico'))errors.push(r.status()+' '+r.url());});};watch(page);
const tab=async(index,target=page)=>{await target.locator('#p4-editor-tab-'+index).click();};
try{
 await page.goto(root);await page.waitForFunction(()=>mamokenStory.previewReady,undefined,{timeout:90000});
 const legacy=await page.evaluate(async()=>{
  const {createDefaultAvatar}=await import('../custom/v16/avatar-schema.js'),{freshProgress,SAVE_KEY}=await import('./story-state.js');
  const avatar=createDefaultAvatar('moguzo');avatar.name='旧セーブのナギ';avatar.appearance.parts.head='godan';avatar.appearance.palette.futureShade='#123456';
  const progress=freshProgress(2601123);progress.position={x:0,z:-1.5};progress.battles=2;progress.wins=1;
  const raw=JSON.stringify({version:1,avatar,progress});localStorage.setItem(SAVE_KEY,raw);return raw;
 });
 await page.reload();await page.waitForFunction(()=>mamokenStory.previewReady,undefined,{timeout:90000});
 assert.equal(await page.locator('#part-head').inputValue(),'godan');assert.equal(await page.locator('#mesh-part-head').inputValue(),'');
 assert.equal(await page.evaluate(()=>Object.hasOwn(mamokenStory.avatar.appearance,'meshParts')),false);
 await page.locator('#avatar-base').selectOption('godan');assert.equal(await page.locator('#part-head').inputValue(),'godan','body change silently reset a saved graft');
 await page.locator('#avatar-base').selectOption('moguzo');assert.equal(await page.locator('#part-head').inputValue(),'godan');
 assert.equal(await page.evaluate(()=>localStorage.getItem('mamoken.story.v16.1')),legacy,'editing changed the committed save');
 assert.equal(await page.locator('#mesh-part-tail option[value="bullet"]').evaluate(option=>option.disabled),true);
 assert.match(await page.locator('#unavailable-mesh-parts').textContent(),/長尾6骨/);
 const manifest=await page.evaluate(async()=>{const response=await fetch('../custom/p2/assets/manifest.json');if(!response.ok)throw Error('part manifest HTTP '+response.status);return response.json();});
 for(const [index,baseId]of ['moguzo','godan','bullet'].entries()){
  const module=manifest.modules.find(entry=>entry.targetBaseId===baseId&&entry.slot==='head'&&entry.donorId!==baseId);
  assert.ok(module,baseId+' has no actual verified foreign head module');
  await tab(0);await page.locator('#avatar-base').selectOption(baseId);
  // Every clear is an explicit user action; changing the base must not do it.
  for(const slot of ['head','ears','hands','feet','tail','accessory'])await page.locator('#mesh-part-'+slot).selectOption('');
  for(const slot of ['head','ears','hands','feet','tail','accessory'])await page.locator('#part-'+slot).selectOption('base');
  await page.locator('#mesh-part-head').selectOption(module.donorId);
  await page.locator('#avatar-name').fill('旅の実パーツ '+baseId);
  await tab(1);await page.locator('#avatar-pattern').selectOption(['spots','stripes','mask'][index]);
  await page.locator('#color-fur').fill(['#397db9','#9959ba','#78a65b'][index]);
  await tab(2);await page.locator('#avatar-style').selectOption(baseId);
  for(let slot=0;slot<3;slot++)await page.locator('#move-'+slot).selectOption(baseId+'.s'+(slot+1));
  await page.waitForFunction(({baseId,moduleId,pattern,fur})=>{
   const a=mamokenStory.player;
   return mamokenStory.previewReady&&a.baseId===baseId&&a.definition.name==='旅の実パーツ '+baseId&&a.definition.combat.styleId===baseId&&a.definition.appearance.pattern===pattern&&a.definition.appearance.palette.fur===fur&&a.avatar.partAssembly?.modules.some(module=>module.id===moduleId)&&document.querySelector('#preview-state').textContent==='プレビュー更新済み';
  },{baseId,moduleId:module.id,pattern:['spots','stripes','mask'][index],fur:['#397db9','#9959ba','#78a65b'][index]},{timeout:90000});
  const preview=await page.evaluate(moduleId=>{
   const a=mamokenStory.player,entry=a.avatar.partAssembly.modules.find(module=>module.id===moduleId);
   const meshes=a.avatar.meshes.filter(mesh=>mesh.userData.meshPart?.id===moduleId);
   return {entry,meshes:meshes.map(mesh=>({name:mesh.name,part:mesh.userData.meshPart,vertices:mesh.geometry.attributes.position.count,morphs:mesh.morphTargetInfluences.length,sharedSkin:mesh.skeleton===a.avatar.meshes[0].skeleton}))};
  },module.id);
  assert.equal(preview.entry.sha256,module.sha256);assert.ok(preview.meshes.length>0);
  assert.equal(preview.meshes.reduce((n,mesh)=>n+mesh.vertices,0),preview.entry.vertices);
  assert.ok(preview.meshes.every(mesh=>mesh.morphs===4&&mesh.sharedSkin&&mesh.part.donorId===module.donorId));
  await tab(3);assert.ok((await page.locator('[data-save-mesh]').textContent()).includes(await page.locator('#mesh-part-head').evaluate(select=>select.selectedOptions[0].textContent)),'confirmation omitted the selected physical head');await page.screenshot({path:dir+'/'+baseId+'-editor.png'});await page.locator('#enter').click();
  await page.waitForFunction(()=>mamokenStory.mode==='explore'&&mamokenStory.nearby?.id==='moguzo',undefined,{timeout:90000});
  const before=await page.evaluate(()=>({position:mamokenStory.progress.position,camera:mamokenStory.progress.camera,battles:mamokenStory.progress.battles,wins:mamokenStory.progress.wins}));
  assert.equal(await page.evaluate(()=>mamokenStory.avatar.appearance.palette.futureShade),'#123456');
  await page.locator('#talk').tap();await page.locator('#challenge').click();
  await page.waitForFunction(()=>mamokenStory.mode==='battle'&&mamokenStory.battle.frame>2,undefined,{timeout:120000});
  assert.equal(await page.evaluate(moduleId=>mamokenStory.actors[0].avatar.partAssembly.modules.some(module=>module.id===moduleId),module.id),true);
  const hp=await page.evaluate(()=>{
   const g=mamokenStory.battle,[p,t]=g.fighters;g.projectiles=[];Object.assign(p,{action:null,frame:0,stun:0,stop:0,x:-.175,y:0,vy:0,state:'idle',prev:{},input:{}});Object.assign(t,{action:null,frame:0,stun:600,stop:0,x:.175,y:0,vy:0,state:'idle',input:{}});return t.hp;
  });
  await page.locator('[data-control="weak"]').tap();
  await page.waitForFunction(hp=>mamokenStory.battle.fighters[1].hp<hp,hp,{timeout:10000});
  await page.screenshot({path:dir+'/'+baseId+'-actual-battle.png'});
  const measured=await page.evaluate(()=>({measurement:mamokenStory.battle.fighters[0].customMeasurement,definition:mamokenStory.battle.fighters[0].definition}));
  assert.equal(measured.measurement.source,'runtime-skinned-mesh');assert.equal(measured.definition.appearance.meshParts.head,module.donorId);
  await page.evaluate(()=>{mamokenStory.battle.fighters[1].hp=0;});await page.waitForFunction(()=>mamokenStory.mode==='result',undefined,{timeout:10000});
  await page.locator('#return').click();await page.waitForFunction(()=>mamokenStory.mode==='explore');
  const after=await page.evaluate(()=>mamokenStory.progress);assert.deepEqual(after.position,before.position);assert.deepEqual(after.camera,before.camera);assert.equal(after.battles,before.battles+1);assert.equal(after.wins,before.wins+1);
  await page.locator('#edit').click();await page.waitForFunction(()=>mamokenStory.previewReady);
  await page.reload();await page.waitForFunction(()=>mamokenStory.previewReady,undefined,{timeout:90000});
  assert.equal(await page.locator('#mesh-part-head').inputValue(),module.donorId);assert.equal(await page.evaluate(()=>mamokenStory.avatar.appearance.palette.futureShade),'#123456');
  assert.equal(await page.evaluate(()=>mamokenStory.progress.battles),after.battles);
  report.push({baseId,moduleId:module.id,donorId:module.donorId,sha256:module.sha256,preview,before,after,measuredSource:measured.measurement.source});
 }
 // An unavailable stored donor is preserved and visibly refused, never silently
 // normalized to the current body. A separate context avoids outgoing autosave.
 const invalidRaw=await page.evaluate(()=>{const value=JSON.parse(localStorage.getItem('mamoken.story.v16.1'));value.avatar.appearance.baseId='moguzo';value.avatar.combat.styleId='moguzo';value.avatar.combat.specials=['moguzo.s1','moguzo.s2','moguzo.s3'];value.avatar.appearance.meshParts={tail:'bullet'};return JSON.stringify(value);});
 const other=await browser.newContext({viewport:{width:720,height:320},isMobile:true,hasTouch:true}),invalid=await other.newPage();watch(invalid);
 await invalid.addInitScript(raw=>localStorage.setItem('mamoken.story.v16.1',raw),invalidRaw);await invalid.goto(root);
 await invalid.waitForFunction(()=>window.mamokenStory?.mode==='editor'&&document.querySelector('#mesh-part-tail')?.value==='bullet');
 assert.match(await invalid.locator('#mesh-part-reason-tail').textContent(),/長尾6骨/);
 await invalid.locator('#enter').click();assert.equal(await invalid.evaluate(()=>mamokenStory.mode),'editor');assert.match(await invalid.locator('#editor-error').textContent(),/長尾6骨/);
 assert.equal(await invalid.evaluate(()=>localStorage.getItem('mamoken.story.v16.1')),invalidRaw);
 await invalid.screenshot({path:dir+'/unsupported-saved-part-720x320.png'});
 await invalid.locator('#mesh-part-tail').selectOption('');await invalid.waitForFunction(()=>mamokenStory.previewReady,undefined,{timeout:90000});
 assert.equal(await invalid.evaluate(()=>localStorage.getItem('mamoken.story.v16.1')),invalidRaw,'explicit unsaved edit overwrote the committed character');
 await other.close();assert.deepEqual(errors,[]);
 await writeFile(dir+'/report.json',JSON.stringify({report,errors,physicalDevice:'not tested'},null,2));
 console.log('P2 EDITOR WEBGL PASS: three real exchanged heads, old-save re-edit, explicit selections/reasons, actual hit, same-position/camera return, progress/reload, unavailable saved donor preserved');
}catch(error){await page.screenshot({path:dir+'/failure.png'}).catch(()=>{});await writeFile(dir+'/failure.json',JSON.stringify({message:error.message,report,errors},null,2));throw error;}
finally{await browser.close();}
