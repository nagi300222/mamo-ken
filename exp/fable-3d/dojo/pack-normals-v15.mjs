// Generates 9 small, real glTF 2.0 animation packs from the repository's unchanged GLBs.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {IDS} from './balance.js';
import {buildNormalPack} from './normal-clip-builder-v15.mjs';
const outBase=new URL('../normal/v15/',import.meta.url);
await mkdir(outBase,{recursive:true});
const summary=[];
for(const id of IDS){
 const bytes=await readFile(new URL('../chars/'+id+'/'+id+'.glb',import.meta.url));
 const {bytes:pack,report}=buildNormalPack(bytes,id);
 await writeFile(new URL(id+'_normals.glb',outBase),pack);
 summary.push({id,originalBytes:bytes.length,packBytes:pack.length,clips:report});
}
await writeFile(new URL('report.json',outBase),JSON.stringify({version:'v15',generatedBy:'normal-motifs-v15',characters:summary},null,2)+'\n');
console.log('V15 54 authored normal clips:',summary.length*6,'packs:',summary.reduce((n,c)=>n+c.packBytes,0),'bytes');
