(function installCurrentArtRuntime(root) {
  'use strict';

  function assertInteger(value, label) {
    if (!Number.isInteger(value) || value < 0) throw new RangeError(`${label} must be a non-negative integer`);
  }

  function selectFourFrame(timing, phaseFrame) {
    const startupF = timing.startupF;
    const activeF = timing.activeF;
    const recoveryF = timing.recoveryF;
    assertInteger(startupF, 'startupF');
    assertInteger(activeF, 'activeF');
    assertInteger(recoveryF, 'recoveryF');
    assertInteger(phaseFrame, 'phaseFrame');
    if (startupF <= 0) {
      if (phaseFrame < activeF) return 2;
      return 3;
    }
    if (phaseFrame <= startupF) {
      const firstHalfEnd = Math.max(0, Math.floor(startupF / 2));
      return phaseFrame <= firstHalfEnd ? 0 : 1;
    }
    if (phaseFrame <= startupF + activeF) return 2;
    return 3;
  }

  function commandActionId(commandIndex) {
    assertInteger(commandIndex, 'commandIndex');
    if (commandIndex > 6) throw new RangeError('commandIndex must map to one of seven command-art slots');
    return `cmd_${String(commandIndex + 1).padStart(2, '0')}`;
  }

  function character(manifest, characterId) {
    if (!manifest || manifest.version !== 'current-art-runtime-v1') return null;
    return manifest.characters && manifest.characters[characterId] ? manifest.characters[characterId] : null;
  }

  function frameAt(manifest, characterId, actionId, frameIndex) {
    const entry = character(manifest, characterId);
    const action = entry && entry.actions ? entry.actions[actionId] : null;
    if (!action || !Array.isArray(action.frames) || !action.frames.length) return null;
    const index = Math.max(0, Math.min(action.frames.length - 1, frameIndex));
    return action.frames[index] || null;
  }

  function pose(manifest, characterId, poseId) {
    const entry = character(manifest, characterId);
    return entry && entry.poses ? entry.poses[poseId] || null : null;
  }

  function resolveFrame(manifest, request) {
    if (!request || typeof request !== 'object') return null;
    if (request.kind === 'pose') return pose(manifest, request.characterId, request.poseId);
    if (request.kind === 'frame') return frameAt(manifest, request.characterId, request.actionId, request.frameIndex);
    if (request.kind === 'timed') {
      return frameAt(
        manifest,
        request.characterId,
        request.actionId,
        selectFourFrame(request.timing, request.phaseFrame),
      );
    }
    return null;
  }

  function paletteForSide(side) {
    return side === 1 ? 'p2' : 'p1';
  }

  function variant(frame, palette) {
    if (!frame || !frame.variants) return null;
    return frame.variants[palette] || frame.variants.p1 || null;
  }

  function displayHeight(manifest, characterId, baseHeight) {
    const entry = character(manifest, characterId);
    if (!entry || !entry.sizeTarget) return baseHeight;
    return baseHeight * entry.sizeTarget.heightRatioToMoguzo;
  }

  root.MAMOKEN_CURRENT_ART_RUNTIME = Object.freeze({
    commandActionId,
    displayHeight,
    frameAt,
    paletteForSide,
    pose,
    resolveFrame,
    selectFourFrame,
    variant,
  });
}(globalThis));
