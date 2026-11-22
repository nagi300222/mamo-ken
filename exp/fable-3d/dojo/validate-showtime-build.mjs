import { readFile } from 'node:fs/promises';
import { IDS } from './balance.js';
import { MOVE_IDS, validateClipTiming, validateMoveManifest, validateShowtimeIndex } from './showtime-assets.js';

function glbJSON(buffer, url) {
  if (buffer.length < 20 || buffer.toString('ascii', 0, 4) !== 'glTF' ||
      buffer.toString('ascii', 16, 20) !== 'JSON') {
    throw new Error('Invalid GLB: ' + url.pathname);
  }
  return JSON.parse(buffer.toString('utf8', 20, 20 + buffer.readUInt32LE(12)));
}

function getAnimation(doc, clip, rig) {
  const animation = doc.animations?.find(item => item.name === clip);
  if (!animation) throw new Error('Missing clip: ' + clip);
  if (doc !== rig) {
    const names = new Set(rig.nodes.map(node => node.name));
    for (const channel of animation.channels) {
      const joint = doc.nodes[channel.target.node]?.name;
      if (!joint || !names.has(joint)) throw new Error('Animation channel cannot bind: ' + clip + '/' + joint);
    }
  }
  const duration = Math.max(...animation.samplers.map(sampler =>
    doc.accessors[sampler.input].max[0]));
  return { name: clip, duration };
}

export async function validateShowtimeBuild(base) {
  const readJSON = async url => JSON.parse(await readFile(url, 'utf8'));
  const index = validateShowtimeIndex(await readJSON(new URL('manifest.json', base)));
  const files = new Set(['manifest.json']);
  const documents = new Map();
  function readModel(url) {
    if (!documents.has(url.href)) {
      documents.set(url.href, readFile(url).then(bytes => glbJSON(bytes, url)));
    }
    return documents.get(url.href);
  }
  const rosterModel = id => readModel(new URL('../../chars/' + id + '/' + id + '.glb', base));
  for (const [id, path] of Object.entries(index)) {
    files.add(path);
    const url = new URL(path, base);
    const { moves } = await readJSON(url);
    if (!Array.isArray(moves) || ![0,MOVE_IDS.length].includes(moves.length)) {
      throw new Error('Expected all four authored moves: ' + id);
    }
    const clipsById = new Map(moves.map(move => [move.moveId, move]));
    const character = await readJSON(url);
    for (const reaction of character.reactions ?? []) {
      const file = id + '/' + reaction.glb;
      files.add(file);
      const model = await readModel(new URL(reaction.glb, url));
      getAnimation(model, reaction.clip, await rosterModel(id));
    }
    for (const move of moves) {
      const moveId = move.moveId;
      const spec = validateMoveManifest(clipsById.get(moveId), id, moveId);
      async function sourceModel(source, fighter) {
        if (!source.glb) return rosterModel(fighter);
        files.add(id + '/' + source.glb);
        return readModel(new URL(source.glb, url));
      }
      const attackerModel = await sourceModel(spec.animationSources.attacker, id);
      const attackerRig = await rosterModel(id);
      validateClipTiming(spec, getAnimation(attackerModel, spec.animationSources.attacker.clip, attackerRig));
      if (moveId === 'ultimate') {
        for (const target of IDS) {
          const targetSource = spec.animationSources.target;
          const targetModel = spec.actorTracks ?
            await readModel(new URL(target + '/' + target + '_v14.glb', base)) :
            await sourceModel(targetSource, target);
          const targetRig = await rosterModel(target);
          getAnimation(targetModel, targetSource.clip, targetRig);
          const bones = {
            attacker: new Set(attackerRig.nodes.map(node => node.name)),
            target: new Set(targetRig.nodes.map(node => node.name))
          };
          if (spec.actorTracks) {
            for (const [role, track] of Object.entries(spec.actorTracks)) {
              const doc = role === 'target' ? targetModel : attackerModel;
              const rig = role === 'target' ? targetRig : attackerRig;
              for (const segment of track.segments) {
                const clip = getAnimation(doc, segment.clip, rig);
                if (clip.duration + .02 < spec.durationSeconds && track.segments.length === 1) {
                  throw new Error('Authored clip ends before the film: ' + segment.clip);
                }
              }
            }
            continue;
          }
          for (const { camera } of spec.shots) {
            for (const lookAt of [camera.lookAt, camera.endLookAt]) {
              if (typeof lookAt !== 'string') continue;
              const [role, anchor] = lookAt.split('.');
              if (anchor && !bones[role]?.has(anchor)) {
                throw new Error('Unknown cinematic camera anchor for ' + id + ' vs ' + target + ': ' + lookAt);
              }
            }
          }
        }
      }
    }
  }
  return files;
}
