import * as THREE from 'three';
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js';
import { createCinePlayer } from '../cinematic/v14/player/cine-player.js';
import { createFx } from '../cinematic/v14/player/fx.js';
import { buildCinematicStage } from './cinematic-stage.js';

function performer(actor, clips, illusion) {
  const model = cloneSkeleton(actor.gltf.scene), root = new THREE.Group();
  const materials = [];
  model.traverse(node => {
    if (!node.isMesh) return;
    const list = (Array.isArray(node.material) ? node.material : [node.material]).map(material => {
      const clone = material.clone();
      if (illusion) {
        clone.transparent = true;
        clone.opacity = illusion.opacity ?? .6;
        clone.emissive = new THREE.Color(illusion.color ?? 0xb070ff);
        clone.emissiveIntensity = illusion.glow ?? .55;
      }
      materials.push({ material: clone, opacity: clone.opacity });
      return clone;
    });
    node.material = Array.isArray(node.material) ? list : list[0];
    node.frustumCulled = false;
  });
  root.add(model);
  const mixer = new THREE.AnimationMixer(model);
  return {
    id: actor.id, root, mixer, clips, height: actor.meta.height ?? .65,
    setOpacity(value) {
      for (const { material, opacity } of materials) {
        material.transparent = !!illusion || value < 1;
        material.opacity = opacity * value;
      }
      root.visible = value > .01;
    },
    dispose() {
      mixer.stopAllAction();
      mixer.uncacheRoot(model);
      for (const { material } of materials) material.dispose();
      model.traverse(node => { if (node.isSkinnedMesh) node.skeleton.dispose(); });
      root.removeFromParent();
    }
  };
}

const SOUND_KINDS = [
  [/hitstop_release|whoosh|swoosh|wind|dash/, 'special'],
  [/ult_hit|slam|rock_wall_break|explosion/, 'ultimate'],
  [/land|step|stomp|foot/, 'clinch'],
  [/claw|hit|punch/, 'hit'],
  [/wink|finish|chime/, 'counter']
];

export function createChoreographedCinematic({ entry, attacker, target, reducedMotion, audioCue, mirror }) {
  const spec = entry.spec;
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(40, 2, .02, 60);
  scene.add(camera);
  buildCinematicStage(THREE, scene, spec.stage);
  const actors = {};
  let fx;
  try {
    const attackClips = { ...attacker.showtime.reactions, [entry.attacker.name]: entry.attacker };
    const targetClips = target.showtime.reactions ?? {};
    for (const [name, track] of Object.entries(spec.actorTracks)) {
      const source = name === 'target' ? target : attacker;
      const clips = name === 'target' ? targetClips : attackClips;
      for (const segment of track.segments) {
        if (!clips[segment.clip]) throw new Error('Missing cinema actor clip: ' + source.id + '/' + segment.clip);
      }
      actors[name] = performer(source, clips, track.material === 'illusion' ? spec.stage.illusion : null);
      scene.add(actors[name].root);
    }
    const manifest = {
      ...spec,
      cues: reducedMotion ? spec.cues.filter(cue => cue.type !== 'shake' &&
        !(cue.type === 'vfx' && ['flash','dim','speed_lines'].includes(cue.key))) : spec.cues
    };
    if(reducedMotion){
      const ids=spec.reducedMotion?.useShots??[spec.shots[0].id,spec.shots.at(-1).id];
      manifest.shots=ids.map((id,index)=>{
        const shot=spec.shots.find(item=>item.id===id);
        const start=index*spec.durationSeconds/ids.length;
        const end=(index+1)*spec.durationSeconds/ids.length;
        return {...shot,start,end,camera:{...shot.camera,keys:[{...shot.camera.keys[0],t:start}]}};
      });
    }
    fx = createFx(THREE, scene, camera, manifest);
    const player = createCinePlayer(THREE, {
      scene, camera, manifest, actors, mirror, fx,
      onCue(cue) {
        if (cue.type !== 'sfx') return;
        const kind = SOUND_KINDS.find(([pattern]) => pattern.test(cue.key))?.[1] ?? 'special';
        audioCue(kind);
      }
    });
    let elapsed = 0, disposed = false;
    return {
      get elapsed() { return elapsed; },
      update(dt, aspect) {
        elapsed = Math.min(spec.durationSeconds, elapsed + Math.max(0, dt));
        camera.aspect = aspect;
        const state = player.seek(elapsed, { reducedMotion });
        const caption = spec.cues.find(cue => cue.type === 'caption' &&
          elapsed >= cue.at && elapsed < cue.at + cue.dur);
        return { scene, camera, shot: state.shot, caption: caption?.text ?? '', ended: elapsed >= spec.durationSeconds };
      },
      dispose() {
        if (disposed) return;
        disposed = true;
        fx.dispose();
        for (const actor of Object.values(actors)) actor.dispose();
        const geometries = new Set(), materials = new Set();
        scene.traverse(node => {
          if (node.geometry) geometries.add(node.geometry);
          if (node.material) for (const material of (Array.isArray(node.material) ? node.material : [node.material])) materials.add(material);
        });
        // Shared fighter geometry is removed with the performers before disposing stage resources.
        for (const geometry of geometries) geometry.dispose();
        for (const material of materials) material.dispose();
        scene.clear();
      }
    };
  } catch (error) {
    fx?.dispose();
    for (const actor of Object.values(actors)) actor.dispose();
    throw error;
  }
}
