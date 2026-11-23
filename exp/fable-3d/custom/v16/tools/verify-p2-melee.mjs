// Actual GLTFLoader + CPU-skinned surfaces. Image decoding stubbed, no WebGL claim.
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
const nativeFetch=globalThis.fetch;
globalThis.self=globalThis;globalThis.createImageBitmap=async()=>({width:1024,height:1024,close(){}});
globalThis.ProgressEvent=class{constructor(type,props){this.type=type;Object.assign(this,props);}};
globalThis.fetch=async(url,options)=>{
 const path=typeof url==='string'||url instanceof URL?String(url):url.url;
 if(path.startsWith('file:')){try{return new Response(await readFile(fileURLToPath(path)),{headers:{'Content-Type':path.endsWith('.json')?'application/json':'application/octet-stream'}});}catch(error){return new Response(error.message,{status:404});}}
 return nativeFetch(url,options);
};
const {runP2MeleeProbes}=await import('./p2-melee-probes.js');
const out=resolve(process.env.MAMOKEN_EVIDENCE??'exp/fable-3d/custom/v16/tools/evidence/p2-melee');await mkdir(out,{recursive:true});
try{const report=await runP2MeleeProbes();const base=new URL('../../../',import.meta.url),manifest=JSON.parse(await readFile(new URL('custom/p2/assets/manifest.json',base),'utf8'));const files=[...new Set([...report.rows.flatMap(row=>[row.sourceFile,`chars/${row.ref.split('.')[0]}/${row.ref.split('.')[0]}.glb`]),...manifest.modules.map(m=>'custom/p2/assets/'+m.file)])];report.inputHashes=Object.fromEntries(await Promise.all(files.map(async file=>[file,createHash('sha256').update(await readFile(new URL(file,base))).digest('hex')])));report.note='Actual Three GLTFLoader and CPU skin; image decoding stubbed. No GPU or phone performance claim.';await writeFile(out+'/cpu.json',JSON.stringify(report,null,2));console.log(JSON.stringify({passed:report.passed,rows:report.rows.length,rejected:report.rejected,activeSamples:report.activeSamples,boundaryChecks:report.boundaryChecks,fullBattleCases:report.fullBattleCases,customCpuCases:report.customCpuCases}));}
catch(error){await writeFile(out+'/cpu.json',JSON.stringify({...error.report,error:error.stack},null,2));throw error;}
