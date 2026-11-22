import {readFile,writeFile,copyFile} from 'node:fs/promises';
import {IDS} from './balance.js';
import {animationBundle} from './animation-bundle.mjs';
const root=new URL('../cinematic/v14/',import.meta.url);
let before=0,after=0;const report=[];
for(const id of IDS){
  const base=new URL(id+'/',root);
  const spec=JSON.parse(await readFile(new URL('manifest.json',base),'utf8'));
  const names=new Set([
    ...spec.reactions.filter(r=>r.glb===id+'_animations.glb').map(r=>r.clip),
    ...spec.moves.filter(m=>m.animationSources.attacker.glb===id+'_animations.glb').flatMap(m=>[m.animationSources.attacker.clip,m.inGameStartClip?.clip,
      ...Object.entries(m.actorTracks??{}).filter(([role])=>role!=='target').flatMap(([,track])=>track.segments.map(s=>s.clip))].filter(Boolean))
  ]);
  const source=await readFile(new URL(id+'_v14.glb',base));
  const bundle=animationBundle(source,names);
  await writeFile(new URL(id+'_animations.glb',base),bundle);
  if(['bullet','yomikage'].includes(id))await copyFile(new URL('anim/'+id+'_polish_anim.glb',root),new URL(id+'_polish_anim.glb',base));
  before+=source.length;after+=bundle.length;report.push({id,sourceBytes:source.length,animationBytes:bundle.length,clips:names.size});
}
await writeFile(new URL('runtime-size.json',root),JSON.stringify({before,after,reduction:1-after/before,characters:report},null,2)+'\n');
console.log(JSON.stringify({before,after,reduction:1-after/before}));
