import * as THREE from 'three';
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js';
import { sampleCinematic } from './showtime-assets.js';

const FORWARD = Math.PI / 2;

function makePerformer(actor, clip, x, rotation) {
  const model = cloneSkeleton(actor.gltf.scene);
  const mixer = new THREE.AnimationMixer(model);
  const action = mixer.clipAction(clip);
  action.setLoop(THREE.LoopOnce, 1);
  action.clampWhenFinished = true;
  action.play();
  const turn = new THREE.Group();
  turn.position.x = x;
  turn.rotation.y = rotation;
  turn.add(model);
  const origin = new THREE.Vector3();
  const bones = new Map();
  model.traverse(node => { if (node.isBone) bones.set(node.name, node); });
  return {
    turn, origin, bones, mixer, clip,
    dispose() {
      mixer.stopAllAction();
      mixer.uncacheRoot(model);
      model.traverse(node => { if (node.isSkinnedMesh) node.skeleton.dispose(); });
      turn.removeFromParent();
    }
  };
}

export function createAuthoredCinematic({ entry, attacker, target, background, lights, reducedMotion, visualCue, audioCue }) {
  const { spec } = entry;
  const targetClip = entry.target ?? target.gltf.animations.find(clip =>
    clip.name === spec.animationSources.target.clip);
  if (!targetClip) throw new Error('Missing cinematic target clip for ' + target.id);
  const performers = {
    attacker: makePerformer(attacker, entry.attacker, 0, FORWARD),
    target: makePerformer(target, targetClip, .65, -FORWARD)
  };
  let disposed = false;
  try {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(background);
    scene.add(...lights.map(light => light.clone()), performers.attacker.turn, performers.target.turn);
    const perspective = new THREE.PerspectiveCamera(42, 1, .02, 30);
    const ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, .02, 30);
    const safeCamera = new THREE.Vector3(.32, .82, 2.5);
    const startPosition = new THREE.Vector3(), endPosition = new THREE.Vector3();
    const aim = new THREE.Vector3(), aimEnd = new THREE.Vector3();
    const cues = spec.cueTrack ?? [];
    let elapsed = 0, cueIndex = 0;
    const duration = reducedMotion ? Math.min(1.25, spec.durationSeconds) : spec.durationSeconds;

    function focus(out, anchor) {
      if (typeof anchor !== 'string') return out.set(anchor.x, anchor.y, anchor.z);
      const [role, boneName] = anchor.split('.');
      if (role === 'midpoint') return out.copy(performers.attacker.origin).lerp(performers.target.origin, .5).addScaledVector(THREE.Object3D.DEFAULT_UP, .42);
      const performer = performers[role];
      const bone = performer.bones.get(boneName);
      if (bone) return bone.getWorldPosition(out);
      return out.copy(performer.origin).addScaledVector(THREE.Object3D.DEFAULT_UP, boneName === 'head' ? .52 : .36);
    }

    function update(dt, aspect) {
      elapsed = Math.min(duration, elapsed + Math.max(0, dt));
      const seconds = elapsed / duration * spec.durationSeconds;
      const { shot, blend } = sampleCinematic(spec, seconds);
      for (const performer of Object.values(performers)) {
        performer.mixer.setTime(Math.min(seconds, performer.clip.duration));
        performer.turn.updateMatrixWorld(true);
        performer.turn.getWorldPosition(performer.origin);
      }
      const config = shot.camera;
      const camera = reducedMotion || config.projection === 'perspective' ? perspective : ortho;
      if (camera === perspective) {
        camera.aspect = aspect;
        camera.fov = reducedMotion ? 38 : THREE.MathUtils.lerp(config.fov, config.endFov ?? config.fov, blend);
      } else {
        const half = THREE.MathUtils.lerp(config.orthoWidth, config.endOrthoWidth ?? config.orthoWidth, blend) / 2;
        camera.left = -half;
        camera.right = half;
        camera.top = half / aspect;
        camera.bottom = -half / aspect;
      }
      camera.updateProjectionMatrix();
      if (reducedMotion) {
        camera.position.copy(safeCamera);
        focus(aim, 'midpoint');
      } else {
        const end = config.endPosition ?? config.position;
        camera.position.copy(startPosition.set(config.position.x, config.position.y, config.position.z))
          .lerp(endPosition.set(end.x, end.y, end.z), blend);
        focus(aim, config.lookAt).lerp(focus(aimEnd, config.endLookAt ?? config.lookAt), blend);
      }
      camera.lookAt(aim);
      if (!reducedMotion) {
        const roll = config.rollDeg ?? 0;
        camera.rotateZ(THREE.MathUtils.degToRad(THREE.MathUtils.lerp(roll, config.endRollDeg ?? roll, blend)));
      }
      while (cueIndex < cues.length && cues[cueIndex].at <= seconds) {
        const cue = cues[cueIndex++];
        if (cue.type === 'sfx') audioCue(cue.key);
        if (cue.type === 'vfx' && !reducedMotion) {
          const actor = cue.actor ?? 'target';
          focus(aim, cue.bone ? actor + '.' + cue.bone : actor);
          visualCue(scene, cue.key, aim);
        }
      }
      return { scene, camera, shot: shot.id, caption: shot.caption ?? '', ended: elapsed >= duration };
    }

    return {
      update,
      dispose() {
        if (disposed) return;
        disposed = true;
        for (const performer of Object.values(performers)) performer.dispose();
      }
    };
  } catch (error) {
    for (const performer of Object.values(performers)) performer.dispose();
    throw error;
  }
}
