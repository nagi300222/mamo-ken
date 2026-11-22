import { IDS } from './balance.js';

export const MOVE_IDS = ['s1', 's2', 's3', 'ultimate'];
const SFX_KEYS = new Set(['tap','hit','block','special','ultimate','roar','clinch','counter','ko']);
const VFX_KEYS = new Set(['hit','block','roar','clinch','special','ultimate','shard','slash','reticle']);
const EASING = {
  linear: t => t,
  easeInCubic: t => t ** 3,
  easeOutCubic: t => 1 - (1 - t) ** 3,
  easeInOutCubic: t => t < .5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2
};

function requireValue(valid, message) {
  if (!valid) throw new Error(message);
}

function vector(value) {
  return value && ['x', 'y', 'z'].every(key => Number.isFinite(value[key]));
}

function source(value) {
  return typeof value?.clip === 'string' && value.clip.length > 0 &&
    (value.glb === undefined || /^[\w-]+\.glb$/.test(value.glb));
}

function focal(value) {
  return vector(value) || (typeof value === 'string' &&
    /^(attacker|target|midpoint)(\.[\w-]+)?$/.test(value));
}

export function validateShowtimeIndex(index) {
  requireValue(index?.schemaVersion === 1 && index.characters &&
    !Array.isArray(index.characters) && typeof index.characters === 'object', 'Invalid showtime index');
  for (const [id, path] of Object.entries(index.characters)) {
    requireValue(IDS.includes(id) && path === id + '/manifest.json', 'Invalid character manifest: ' + id);
  }
  return index.characters;
}

function validateCues(cues, duration, label) {
  requireValue(Array.isArray(cues) && cues.every((cue, i) =>
    Number.isFinite(cue?.at) && cue.at >= 0 && cue.at < duration &&
    (i === 0 || cue.at >= cues[i - 1].at) &&
    (cue.type === 'sfx' ? SFX_KEYS.has(cue.key) : cue.type === 'vfx' && VFX_KEYS.has(cue.key)) &&
    (cue.bone === undefined || /^[\w-]+$/.test(cue.bone)) &&
    (cue.actor === undefined || ['attacker', 'target'].includes(cue.actor))),
  'Invalid or unsorted showtime cues: ' + label);
}

export function validateClipTiming(spec, clip) {
  requireValue(Number.isFinite(clip.duration) && clip.duration > 0, 'Invalid clip length: ' + clip.name);
  if (spec.moveId !== 'ultimate') {
    requireValue(spec.contactSeconds === undefined || spec.contactSeconds < clip.duration,
      'Contact must be inside the special clip: ' + clip.name);
    validateCues(spec.cueTrack ?? [], clip.duration, clip.name);
  }
}

export function validateMoveManifest(manifest, id, moveId) {
  const label = id + '/' + moveId;
  requireValue(manifest?.schemaVersion === 1 && IDS.includes(id) &&
    MOVE_IDS.includes(moveId) && manifest.characterId === id && manifest.moveId === moveId,
    'Invalid move identity: ' + label);
  requireValue(source(manifest.animationSources?.attacker), 'Missing attacker clip: ' + label);
  if (moveId !== 'ultimate') {
    if (manifest.contactSeconds !== undefined) {
      requireValue(Number.isFinite(manifest.contactSeconds) && manifest.contactSeconds > 0,
        'Invalid special contact: ' + label);
    }
    return manifest;
  }
  if (manifest.actorTracks) return validateChoreography(manifest, label);
  const { durationSeconds, shots, animationSources, cueTrack = [] } = manifest;
  requireValue(manifest.trigger === 'confirmed_unblocked_ultimate_hit' && manifest.runtime === 'threejs' &&
    Number.isFinite(durationSeconds) && durationSeconds >= 9 && durationSeconds <= 11 &&
    source(animationSources.target), 'Invalid cinematic playback: ' + label);
  requireValue(Array.isArray(shots) && shots.length >= 2,
    'Expected independent camera shots: ' + label);
  let end = 0;
  const shotIds = new Set();
  for (const shot of shots) {
    const camera = shot?.camera;
    requireValue(typeof shot?.id === 'string' && shot.id.length && !shotIds.has(shot.id) &&
      Number.isFinite(shot.start) && Math.abs(shot.start - end) < 1e-6 &&
      Number.isFinite(shot.end) && shot.end > shot.start, 'Invalid shot interval: ' + label);
    shotIds.add(shot.id);
    end = shot.end;
    requireValue(vector(camera?.position) && focal(camera.lookAt) &&
      (camera.endPosition === undefined || vector(camera.endPosition)) &&
      (camera.endLookAt === undefined || focal(camera.endLookAt)) &&
      Object.hasOwn(EASING, camera.easing ?? 'linear') &&
      Number.isFinite(camera.rollDeg ?? 0) && Number.isFinite(camera.endRollDeg ?? 0),
    'Invalid shot camera: ' + shot.id);
    const perspective = camera.projection === 'perspective';
    const lens = perspective ? camera.fov : camera.orthoWidth;
    const endLens = perspective ? camera.endFov : camera.endOrthoWidth;
    requireValue((perspective || camera.projection === 'orthographic') &&
      Number.isFinite(lens) && lens > 0 && (!perspective || lens < 180) &&
      (endLens === undefined || (Number.isFinite(endLens) && endLens > 0 && (!perspective || endLens < 180))),
    'Invalid shot lens: ' + shot.id);
  }
  requireValue(Math.abs(end - durationSeconds) < 1e-6, 'Shots must cover the duration: ' + label);
  validateCues(cueTrack, durationSeconds, label);
  return manifest;
}

export function validateChoreography(spec, label) {
  requireValue(spec.trigger === 'confirmed_unblocked_ultimate_hit' && spec.runtime === 'threejs' &&
    Number.isFinite(spec.durationSeconds) && spec.durationSeconds >= 9 && spec.durationSeconds <= 11 &&
    source(spec.animationSources.target), 'Invalid authored duration or target: ' + label);
  requireValue(spec.actorTracks.attacker && spec.actorTracks.target &&
    Array.isArray(spec.shots) && spec.shots.length >= 2 &&
    Array.isArray(spec.cues), 'Incomplete choreography: ' + label);
  let end = 0;
  for (const shot of spec.shots) {
    requireValue(Math.abs(shot.start - end) < 1e-6 && shot.end > shot.start &&
      Array.isArray(shot.camera?.keys) && shot.camera.keys.length > 0, 'Invalid authored shot: ' + label);
    end = shot.end;
    for (const key of shot.camera.keys) {
      requireValue(Number.isFinite(key.t) && key.t >= shot.start && key.t <= shot.end &&
        key.pos && key.look && Number.isFinite(key.fov) && key.fov > 0 && key.fov < 180,
      'Invalid authored camera: ' + label);
    }
  }
  requireValue(Math.abs(end - spec.durationSeconds) < 1e-6, 'Incomplete shot coverage: ' + label);
  for (const track of Object.values(spec.actorTracks)) {
    requireValue(Array.isArray(track.segments) && track.segments.length &&
      Array.isArray(track.root) && track.root.length, 'Invalid actor track: ' + label);
  }
  return spec;
}

export function sampleCinematic(manifest, seconds) {
  const elapsed = Math.max(0, Math.min(manifest.durationSeconds, seconds));
  const shot = manifest.shots.find(item => elapsed < item.end) ?? manifest.shots.at(-1);
  const fraction = (elapsed - shot.start) / (shot.end - shot.start);
  const ease = EASING[shot.camera.easing ?? 'linear'];
  return { shot, blend: ease(Math.max(0, Math.min(1, fraction))) };
}

async function fetchJSON(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Showtime HTTP ' + response.status + ': ' + url.pathname);
  return response.json();
}

export function createShowtimeLoader(base) {
  let index;
  return async (id, loadClip) => {
    index ??= fetchJSON(new URL('manifest.json', base)).then(validateShowtimeIndex)
      .catch(error => { index = undefined; throw error; });
    const location = (await index)[id];
    if (!location) return {};
    const url = new URL(location, base);
    const character = await fetchJSON(url);
    if (!Array.isArray(character.moves) || ![0,MOVE_IDS.length].includes(character.moves.length)) {
      throw new Error('Expected all four authored moves: ' + id);
    }
    const byId = new Map(character.moves.map(move => [move.moveId, move]));
    const reactions = Object.fromEntries(await Promise.all((character.reactions ?? []).map(async source =>
      [source.clip, await loadClip(source, url)])));
    const entries = await Promise.all(character.moves.map(async move => {
      const moveId = move.moveId;
      const spec = validateMoveManifest(byId.get(moveId), id, moveId);
      const attacker = await loadClip(spec.animationSources.attacker, url);
      validateClipTiming(spec, attacker);
      const targetSource = spec.animationSources.target;
      const target = targetSource?.glb ? await loadClip(targetSource, url) : null;
      const start = spec.inGameStartClip?.clip ? await loadClip({
        ...spec.animationSources.attacker, clip: spec.inGameStartClip.clip
      }, url) : null;
      const trackNames = new Set(Object.entries(spec.actorTracks ?? {})
        .filter(([role]) => role !== 'target')
        .flatMap(([,track]) => track.segments.map(segment => segment.clip)));
      const clips = Object.fromEntries(await Promise.all([...trackNames].map(async clip =>
        [clip, await loadClip({ ...spec.animationSources.attacker, clip }, url)])));
      return [moveId, { spec, attacker, target, start, clips }];
    }));
    return { ...Object.fromEntries(entries), reactions };
  };
}
