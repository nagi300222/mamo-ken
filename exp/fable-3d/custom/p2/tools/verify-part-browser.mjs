import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('playwright-core');
const target=new URL('inspection.html',process.env.MAMOKEN_P2_ASSET_URL??'http://127.0.0.1:4173/exp/fable-3d/custom/p2/');if(process.env.MAMOKEN_REQUIRE_P2_FULL==='1')target.searchParams.set('full','1');
const url=target.href,out=(process.env.MAMOKEN_EVIDENCE??'/tmp/mamoken-p2-runtime')+'/parts';await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH??'/usr/bin/google-chrome',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']}),page=await browser.newPage({viewport:{width:1280,height:900},deviceScaleFactor:1}),errors=[];
page.on('pageerror',error=>errors.push(error.message));page.on('response',response=>{if(response.status()>=400)errors.push(response.status()+' '+response.url());});page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
try{
 await page.goto(url);await page.waitForFunction(()=>window.meshPartEvidence?.ready||window.meshPartEvidence?.error,undefined,{timeout:120000});
 assert.equal(await page.evaluate(()=>meshPartEvidence.error),undefined);
 const report=await page.evaluate(()=>({rows:meshPartEvidence.rows,catalogRows:meshPartEvidence.catalogRows,mixedRows:meshPartEvidence.mixedRows,delivery:meshPartEvidence.delivery,requireFull:meshPartEvidence.requireFull,renderer:meshPartEvidence.rendererInfo}));assert.equal(report.rows.length,3);assert.ok(report.renderer.calls>=42);assert.ok(report.renderer.textures>0);
 for(const row of report.rows){assert.ok(row.actualMeshes.length>0);assert.ok(row.actualMeshes.every(m=>m.id===row.moduleId&&m.sha256===row.sha256&&m.targetBaseId===row.targetBaseId&&m.donorId===row.donorId));assert.equal(Object.keys(row.measurements.normals).length,6);assert.ok(row.seamMotion.every(s=>s.sampledPoses===54&&s.maxGap<=.00002));assert.ok(row.morphTracks>6);}
 await page.screenshot({path:out+'/actual-donor-runtime-idle.png'});
 for(const pose of ['stand_heavy','crouch_heavy','hurt_heavy']){await page.evaluate(pose=>meshPartEvidence.setPose(pose,.5),pose);await page.screenshot({path:out+'/actual-donor-runtime-'+pose+'.png'});}
 assert.equal(report.catalogRows.length,report.delivery.publishedModules);assert.equal(new Set(report.catalogRows.map(row=>row.moduleId)).size,report.delivery.publishedModules);
 for(const row of report.catalogRows){assert.equal(row.glError,0);assert.ok(row.rendered&&row.drawCalls>0&&row.actualMeshes.length);assert.ok(row.actualMeshes.every(mesh=>mesh.id===row.moduleId&&mesh.sha256===row.sha256));}
 assert.equal(report.mixedRows.length,3);for(const row of report.mixedRows){assert.deepEqual(row.assembly.modules.map(m=>m.id).sort(),[...row.moduleIds].sort());assert.ok(row.seamMotion.every(s=>s.maxGap<=.00002));if(report.requireFull){assert.equal(row.partial,false);assert.equal(row.mixedDonors,2);assert.ok(row.exchangedSlots>=4);}}
 if(report.requireFull){assert.equal(report.delivery.full,true);assert.equal(report.delivery.publishedModules,26);}
 await page.evaluate(()=>meshPartEvidence.showMixed());await page.screenshot({path:out+'/actual-available-mixed-assemblies.png'});
 assert.deepEqual(errors,[]);await writeFile(out+'/browser-parts.json',JSON.stringify({url,note:'Actual WebGL runtime, three representative published donor modules. Software GPU; physical iPhone performance untested.',...report,errors},null,2));
 console.log('P2 PARTS WEBGL PASS: 3 rich pairs, '+report.delivery.publishedModules+' actual module renders, 3 available mixed profiles; full catalog='+report.delivery.full);
}catch(error){await page.screenshot({path:out+'/error.png'}).catch(()=>{});throw error;}finally{await browser.close();}
