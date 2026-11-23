import {cp,mkdir,readFile,writeFile,readdir,stat,rm} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';
const native=new URL('../',import.meta.url),repo=new URL('../',native),web=new URL('www/',native);
execFileSync(process.execPath,[fileURLToPath(new URL('exp/fable-3d/dojo/build-pages.mjs',repo))],{cwd:fileURLToPath(repo),stdio:'inherit'});
await rm(web,{recursive:true,force:true});await mkdir(web,{recursive:true});
await cp(new URL('exp/fable-3d/_pages/',repo),web,{recursive:true});
await build({entryPoints:[fileURLToPath(new URL('runtime/runtime-entry.js',native))],bundle:true,format:'iife',platform:'browser',target:['safari16'],minify:true,outfile:fileURLToPath(new URL('native-runtime.js',web))});
for(const path of ['index.html','dojo/index.html','story/index.html']){
 const file=new URL(path,web),html=await readFile(file,'utf8');
 if(!html.includes('<head>'))throw Error('Missing native entry <head>: '+path);
 const entry='<script src="/native-runtime.js"></script><style>html.native-runtime.portrait body{width:100vw;height:100dvh;transform:none;overflow:auto}html.native-runtime.portrait main{min-height:100dvh}</style>';
 await writeFile(file,html.replace('<head>','<head>'+entry));
}
const files=[];
async function walk(dir,prefix=''){
 for(const entry of await readdir(dir,{withFileTypes:true})){
  const path=prefix+entry.name,url=new URL(entry.name+(entry.isDirectory()?'/':''),dir);
  if(entry.isDirectory())await walk(url,path+'/');
  else{const data=await readFile(url);files.push({path,bytes:data.length,sha256:createHash('sha256').update(data).digest('hex')});}
 }
}
await walk(web);files.sort((a,b)=>a.path.localeCompare(b.path));
await mkdir(new URL('evidence/',native),{recursive:true});
const summary={schemaVersion:1,source:'local Pages build + pinned native runtime',assetFiles:files.length,bytes:files.reduce((n,f)=>n+f.bytes,0),remoteServerURL:null,files};
await writeFile(new URL('evidence/native-assets.json',native),JSON.stringify(summary,null,2)+'\n');
for(const expected of ['index.html','dojo/index.html','story/index.html','native-runtime.js','chars/moguzo/moguzo.glb','custom/v16/assets/moguzo_parts.glb'])if(!files.some(f=>f.path===expected))throw Error('Missing bundled asset: '+expected);
console.log(JSON.stringify({nativeAssetFiles:summary.assetFiles,nativeBytes:summary.bytes,remoteServerURL:null}));
