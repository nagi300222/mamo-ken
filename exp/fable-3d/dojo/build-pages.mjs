import { cp, copyFile, mkdir, readdir, rm, stat, writeFile, access,readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateShowtimeBuild } from './validate-showtime-build.mjs';
import {ACTIVE_NORMAL_MOTION_SOURCE} from './normal-motion-source.js';
await import('./pack-showtime.mjs');
await import('./pack-normals-v15.mjs');
const ROOT = path.resolve(fileURLToPath(new URL('..',import.meta.url)));
const PROJECT = path.resolve(ROOT,'../..'); // repo root: exp/fable-3d -> ../.. 
const OUTPUT = path.join(ROOT,'_pages');
const IDS=['moguzo','pisuke','godan','hakuma','chirka','takimaru','yomikage','bullet','dark_moguzo'];
async function copyOne(source,target){await mkdir(path.dirname(target),{recursive:true});await copyFile(source,target);}
await rm(OUTPUT,{recursive:true,force:true});await mkdir(OUTPUT,{recursive:true});
const dojo=path.join(ROOT,'dojo');
for(const name of ['index.html','style.css','models.js','balance.js','battle.js','commands.js','cpu.js','camera-frame.js','main.js','showtime-profiles.js','combat-audio.js','showtime-illusions.js','arena-music.js','hud-themes.js','ultimate-cinematic.js','showtime-assets.js','authored-cinematic.js','run-controller.js','run-cpu.js','run-stages.js','run-ui.js','run-dialogue.js','presentation-flow.js','presentation-data.js','choreographed-cinematic.js','cinematic-stage.js','morph-binding.js','landscape-lock.js','practice-mode.js','fighter-style.js','normal-balance-v151.js','normal-contact-runtime-v151.js','normal-contacts-v151.js','normal-timing-v151.js','normal-motifs-v15.js','fight-feel.js','special-balance-p3.js','p3-contact-adapter.js','normal-contact-overrides-p3.js','normal-contact-source.js','normal-motion-source.js','p3-normal-candidate.js'])
  await copyOne(path.join(dojo,name),path.join(OUTPUT,'dojo',name));
for(const name of ['special-motion-source.js','special-motion-overrides-p3.js','special-motion-contract-p3.js','special-cues.js','special-contact-runtime-p3.js','special-contact-overrides-p3.js','special-contact-reviewed-v17r2.js','normal-contact-reviewed-v17.js','combat-geometry.js'])
  await copyOne(path.join(dojo,name),path.join(OUTPUT,'dojo',name));
await cp(path.join(ROOT,'preview','vendor'),path.join(OUTPUT,'preview','vendor'),{recursive:true});
await cp(path.join(ROOT,'shared-ui'),path.join(OUTPUT,'shared-ui'),{recursive:true,filter:file=>!file.endsWith('.test.mjs')});
// v16 is a separate lazy entry point; normal matches do not download custom rigs.
await cp(path.join(ROOT,'story'),path.join(OUTPUT,'story'),{recursive:true,
  filter:file=>!file.endsWith('.mjs')});
await cp(path.join(ROOT,'custom','v16'),path.join(OUTPUT,'custom','v16'),{recursive:true,
  filter:file=>!file.includes('/tools')&&!file.includes('/evidence')&&!file.endsWith('.mjs')&&!file.endsWith('.md')});
for(const file of ['player/cine-player.js','player/fx.js']){
  await copyOne(path.join(ROOT,'cinematic','v14',file),path.join(OUTPUT,'cinematic','v14',file));
}
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
  await copyOne(path.join(ROOT,'normal','v15',id+'_normals.glb'),path.join(OUTPUT,'normal','v15',id+'_normals.glb'));
  // v15.1 Presentation: winner-only victory clips (animation-only GLB)
  await copyOne(path.join(ROOT,'presentation','v151',id+'_victory.glb'),path.join(OUTPUT,'presentation','v151',id+'_victory.glb'));
  for(const [folder,name] of [['ui','facesq_'+id+'.png'],['roster3d',id+'.webp']]){
    await copyOne(path.join(PROJECT,'assets',folder,name),path.join(OUTPUT,'assets',folder,name));
  }
}
// A complete candidate may be bundled for isolated QA while the live approval
// remains null. No Blender/model regeneration or global activation happens here.
const v17Directory=path.join(ROOT,'motion','v17');
const hasV17=await access(path.join(v17Directory,'normals_v17.json')).then(()=>true).catch(error=>{if(error.code==='ENOENT')return false;throw error;});
if(ACTIVE_NORMAL_MOTION_SOURCE.version==='v17'&&!hasV17)throw Error('Approved v17 normal packs are missing');
if(hasV17){
  for(const id of IDS){
    const name=id+'_normals_v17.glb',source=path.join(v17Directory,name),bytes=await readFile(source);
    const document=JSON.parse(bytes.toString('utf8',20,20+bytes.readUInt32LE(12)));
    const expected=['stand_weak','stand_heavy','crouch_weak','crouch_heavy','air_weak','air_heavy'].map(slot=>'v17_'+slot);
    if(document.animations?.length!==6||new Set(document.animations.map(clip=>clip.name)).size!==6||document.animations.some(clip=>!expected.includes(clip.name)))throw Error(id+' v17 normal pack is incomplete');
    await copyOne(source,path.join(OUTPUT,'motion','v17',name));
  }
  for(const id of IDS){
    const name=id+'_specials_v17.glb',source=path.join(v17Directory,name),bytes=await readFile(source);
    const document=JSON.parse(bytes.toString('utf8',20,20+bytes.readUInt32LE(12)));
    if(document.animations?.length!==3||new Set(document.animations.map(clip=>clip.name)).size!==3||document.animations.some(clip=>!['s1_v17','s2_v17','s3_v17'].includes(clip.name)))throw Error(id+' v17 special pack is incomplete');
    await copyOne(source,path.join(OUTPUT,'motion','v17',name));
  }
  for(const name of ['normals_v17.json','normal-contacts-v17.js','normal_contacts_v17.json','specials_v17.json','special_contacts_v17.json'])await copyOne(path.join(v17Directory,name),path.join(OUTPUT,'motion','v17',name));
  console.log('Bundled 54 v17 candidate normals; active selection:',ACTIVE_NORMAL_MOTION_SOURCE.version);
}
// r2 is an overlay of seven authored changes. Preserve every r1 pack and copy
// only runtime files, keeping movies/audit footage outside the phone bundle.
const r2Directory=path.join(ROOT,'motion','v17r2');
if(await access(path.join(r2Directory,'normal_contacts_v17r2.json')).then(()=>true).catch(error=>{if(error.code==='ENOENT')return false;throw error;})){
 const normals=JSON.parse(await readFile(path.join(r2Directory,'normal_contacts_v17r2.json'),'utf8'));
 const specials=JSON.parse(await readFile(path.join(r2Directory,'special_contacts_v17r2.json'),'utf8'));
 for(const name of await readdir(r2Directory)){
  if(!/\.(glb|json|js)$/.test(name))continue;
  const source=path.join(r2Directory,name);if(!(await stat(source)).isFile())continue;
  if(name.endsWith('.glb')){
   const id=IDS.find(id=>name.startsWith(id+'_'));if(!id)throw Error('Unknown revised rig '+name);
   const rows=name.includes('_normals_')?normals[id]:specials[id],relative='motion/v17r2/'+name;
   const expected=Object.values(rows).filter(row=>row.file===relative).map(row=>row.clip);
   const bytes=await readFile(source),document=JSON.parse(bytes.toString('utf8',20,20+bytes.readUInt32LE(12)));
   if(![3,6].includes(expected.length)||document.animations?.length!==expected.length||new Set(document.animations.map(c=>c.name)).size!==expected.length||document.animations.some(c=>!expected.includes(c.name)))throw Error('Incomplete revised pack '+name);
  }
  await copyOne(source,path.join(OUTPUT,'motion','v17r2',name));
 }
}
await copyOne(path.join(ROOT,'lobby','index.html'),path.join(OUTPUT,'index.html'));
await copyOne(path.join(ROOT,'lobby','style.css'),path.join(OUTPUT,'lobby','style.css'));
await writeFile(path.join(OUTPUT,'_headers'),'/chars/*\n  Cache-Control: public, max-age=120\n/normal/*\n  Cache-Control: public, max-age=120\n/motion/*\n  Cache-Control: no-cache\n/presentation/*\n  Cache-Control: public, max-age=120\n/dojo/*\n  Cache-Control: no-cache\n/cinematic/*\n  Cache-Control: no-cache\n');
console.log('Cloudflare Pages static output:',OUTPUT);
console.log('9 GLB total:',(bytes/1024/1024).toFixed(2)+' MiB');
console.log('Cloudflare build command: node exp/fable-3d/dojo/build-pages.mjs');
console.log('Cloudflare output directory: exp/fable-3d/_pages');
