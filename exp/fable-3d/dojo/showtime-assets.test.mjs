import test from 'node:test';
import assert from 'node:assert/strict';
import { sampleCinematic, validateMoveManifest, validateClipTiming, validateShowtimeIndex } from './showtime-assets.js';

function manifest() {
  return {
    schemaVersion: 1, characterId: 'chirka', moveId: 'ultimate',
    trigger: 'confirmed_unblocked_ultimate_hit', runtime: 'threejs', durationSeconds: 10,
    animationSources: { attacker: { clip: 'super' }, target: { clip: 'throw_hit' } },
    shots: Array.from({length: 4}, (_, i) => ({
      id: 'shot-' + i, start: i * 2.5, end: (i + 1) * 2.5,
      camera: {
        position: { x: 0, y: 1, z: 2 }, lookAt: 'target.head',
        projection: 'perspective', fov: 40, easing: 'easeInCubic'
      }
    }))
  };
}

test('authored timeline crosses cuts on the exact frame and eases within each shot', () => {
  const spec = validateMoveManifest(manifest(), 'chirka', 'ultimate');
  assert.equal(sampleCinematic(spec, 1.25).blend, .125);
  assert.equal(sampleCinematic(spec, 2.5).shot.id, 'shot-1');
  assert.equal(sampleCinematic(spec, 10).shot.id, 'shot-3');
});

test('authored cinematics reject gaps, path traversal and unknown cues', () => {
  const gap = manifest();
  gap.shots[1].start += .01;
  assert.throws(() => validateMoveManifest(gap, 'chirka', 'ultimate'), /interval/);
  assert.throws(() => validateShowtimeIndex({schemaVersion: 1, characters: {chirka: '../art.json'}}), /Invalid character/);
  const badCue = {...manifest(), cueTrack: [{ at: .5, type: 'sfx', key: 'missing' }]};
  assert.throws(() => validateMoveManifest(badCue, 'chirka', 'ultimate'), /cues/);
});

test('special contact must fall before the end of the authored clip', () => {
  const clip = {name: 'new-upper', duration: 1};
  assert.doesNotThrow(() => validateClipTiming({moveId: 's2', contactSeconds: .2}, clip));
  assert.throws(() => validateClipTiming({moveId: 's2', contactSeconds: 1}, clip), /Contact/);
});

test('normal ultimates use the ten-second production window', () => {
  for (const duration of [5.1, 8, 11.1]) {
    const spec = manifest();
    spec.durationSeconds = duration;
    assert.throws(() => validateMoveManifest(spec, 'chirka', 'ultimate'), /playback/);
  }
});
