import { readFile, readdir, writeFile } from 'node:fs/promises';
import { IDS, ROSTER, FPS } from './balance.js';
const base = new URL('../cinematic/v14/', import.meta.url);
const json = async url => JSON.parse(await readFile(url, 'utf8'));
const files = await readdir(new URL('manifest/', base));
const characters = {};
const polish=id=>json(new URL('anim/'+id+'_polish_motions.json',base));
for (const id of IDS) {
  const model = id + '_animations.glb';
  const meta = await json(new URL(id + '/' + id + '_v14_motions.json', base));
  const moves = [];
  if (files.includes(id + '_ultimate.json')) {
    for (const moveId of ['s1','s2','s3']) {
      let name = meta.command_map[{s1:'236',s2:'623',s3:'214'}[moveId]], clip = meta.clips[name], glb=model;
      if(id==='bullet'&&moveId==='s3'){
        name='s3_v14';clip=(await polish(id)).clips[name];glb='bullet_polish_anim.glb';
      }
      if (!clip) throw new Error('Missing authored special: ' + id + '/' + name);
      moves.push({
        schemaVersion: 1, characterId: id, moveId,
        contactSeconds: (clip.contact_pose_frame ?? clip.contact_frame ?? ROSTER[id].specials[Number(moveId[1])-1].startup) / (clip.fps ?? FPS),
        animationSources: { attacker: { glb, clip: name } },
        cueTrack: [{ at: 0, type: 'sfx', key: 'special' }]
      });
    }
    const ultimate = await json(new URL('manifest/' + id + '_ultimate.json', base));
    if(id==='bullet'){
      const previous=ultimate.displayName;ultimate.displayName='尾連・爆ぜ木の実';
      for(const cue of ultimate.cues)if(cue.type==='caption'&&cue.text===previous)cue.text=ultimate.displayName;
    }
    ultimate.animationSources.attacker.glb = model;
    ultimate.animationSources.target = { clip: ultimate.animationSources.target.clip };
    const clip = meta.clips[ultimate.inGameStartClip.clip];
    ultimate.contactSeconds = (clip.contact_pose_frame ?? clip.contact_frame) / (clip.fps ?? 60);
    moves.push(ultimate);
  }
  const reactions = Object.keys(meta.clips).filter(name => name.startsWith('cinv_'))
    .map(clip => ({ glb: model, clip }));
  if(id==='yomikage')reactions.push({glb:'yomikage_polish_anim.glb',clip:'counter_success_v14'});
  await writeFile(new URL(id + '/manifest.json', base), JSON.stringify({ moves, reactions },null,2) + '\n');
  characters[id] = id + '/manifest.json';
}
await writeFile(new URL('manifest.json',base),JSON.stringify({schemaVersion:1,characters},null,2) + '\n');
console.log('Registered authored films:', files.filter(name=>name.endsWith('_ultimate.json')).length);
