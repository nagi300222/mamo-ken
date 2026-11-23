import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('playwright-core');
const base=process.env.MAMOKEN_ASSET_URL??'http://127.0.0.1:4173/exp/fable-3d/custom/v16/';
const evidence=process.env.MAMOKEN_EVIDENCE??'/tmp/mamoken-v16-avatar';await mkdir(evidence,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH??'/usr/bin/google-chrome',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1280,height:780},deviceScaleFactor:1}),errors=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
try{
 await page.goto(base+'inspection.html');
 await page.waitForFunction(()=>window.avatarEvidence?.ready||window.avatarEvidence?.error,undefined,{timeout:60000});
 assert.equal(await page.evaluate(()=>avatarEvidence.error),undefined);
 await page.screenshot({path:evidence+'/avatar-source-grafts.png'});
 const report=await page.evaluate(()=>({rows:avatarEvidence.rows,renderer:avatarEvidence.rendererInfo}));
 assert.equal(report.rows.length,6);assert.ok(report.renderer.calls>10);assert.ok(report.renderer.textures>0);
 for(const row of report.rows){assert.equal(Object.keys(row.measurements.normals).length,6);assert.ok(row.meshes>=7);}
 // The new shader must compile for all three pattern modes and remain visible.
 const pixel=await page.evaluate(()=>{const {renderer}=avatarEvidence;const gl=renderer.getContext();const out=new Uint8Array(4);gl.readPixels(640,390,1,1,gl.RGBA,gl.UNSIGNED_BYTE,out);return [...out];});
 report.pixel=pixel;
 assert.deepEqual(errors,[],'WebGL/page/shader error');
 await writeFile(evidence+'/avatar-report.json',JSON.stringify(report,null,2));
 console.log('AVATAR WEBGL PASS: three base rigs, three grafted/color-pattern avatars, real textures/shaders and six normal measurements per actor');
}finally{await browser.close();}
