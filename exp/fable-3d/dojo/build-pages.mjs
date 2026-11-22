import { cp, copyFile, mkdir, readdir, rm, stat, writeFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateShowtimeBuild } from './validate-showtime-build.mjs';
const ROOT = path.resolve(fileURLToPath(new URL('..',import.meta.url)));
const PROJECT = path.resolve(ROOT,'../..'); // repo root: exp/fable-3d -> ../.. 
const OUTPUT = path.join(ROOT,'_pages');
const IDS=['moguzo','pisuke','godan','hakuma','chirka','takimaru','yomikage','bullet','dark_moguzo'];
async function copyOne(source,target){await mkdir(path.dirname(target),{recursive:true});await copyFile(source,target);}
await rm(OUTPUT,{recursive:true,force:true});await mkdir(OUTPUT,{recursive:true});
const dojo=path.join(ROOT,'dojo');
for(const name of ['index.html','style.css','models.js','balance.js','battle.js','commands.js','cpu.js','camera-frame.js','main.js','showtime-profiles.js','combat-audio.js','showtime-illusions.js','arena-music.js','hud-themes.js','ultimate-cinematic.js','showtime-assets.js','authored-cinematic.js'])
  await copyOne(path.join(dojo,name),path.join(OUTPUT,'dojo',name));
await cp(path.join(ROOT,'preview','vendor'),path.join(OUTPUT,'preview','vendor'),{recursive:true});
const cinematicFiles=await validateShowtimeBuild(new URL('../cinematic/v14/',import.meta.url));
for(const file of cinematicFiles){
  await copyOne(path.join(ROOT,'cinematic','v14',file),path.join(OUTPUT,'cinematic','v14',file));
}
let bytes=0;
for(const id of IDS){
  const file=path.join(ROOT,'chars',id,id+'.glb');
  const motion=path.join(ROOT,'chars',id,id+'_motions.json');
  await access(file);await access(motion);
  bytes+=(await stat(file)).size;
  await copyOne(file,path.join(OUTPUT,'chars',id,id+'.glb'));
  await copyOne(motion,path.join(OUTPUT,'chars',id,id+'_motions.json'));
  for(const [folder,name] of [['ui','facesq_'+id+'.png'],['roster3d',id+'.webp']]){
    await copyOne(path.join(PROJECT,'assets',folder,name),path.join(OUTPUT,'assets',folder,name));
  }
}
await writeFile(path.join(OUTPUT,'index.html'),'<!doctype html><html lang="ja"><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=./dojo/"><title>マモ拳3D</title><a href="./dojo/">ゲームを開く</a></html>');
await writeFile(path.join(OUTPUT,'_headers'),'/chars/*\n  Cache-Control: public, max-age=120\n/dojo/*\n  Cache-Control: no-cache\n');
console.log('Cloudflare Pages static output:',OUTPUT);
console.log('9 GLB total:',(bytes/1024/1024).toFixed(2)+' MiB');
console.log('Cloudflare build command: node exp/fable-3d/dojo/build-pages.mjs');
console.log('Cloudflare output directory: exp/fable-3d/_pages');