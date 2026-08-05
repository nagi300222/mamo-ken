import type {
  CompletedHold,
  DirectionInputEvent,
  InputHistoryState,
  InputHistoryUpdate,
  NormalizedInputEvent,
  PlayerId,
  CommandTimingProfile,
} from './command-types.ts';
import type { Direction } from './types.ts';

const DIRECTIONS: readonly Direction[] = ['left', 'down', 'right'];

function assertNonNegativeInteger(value: number, label: string): void {
  if (!Number.isInteger(value) || value < 0) throw new RangeError(`${label} must be a non-negative integer`);
}

export function compareNormalizedInputEvents(a: NormalizedInputEvent, b: NormalizedInputEvent): number {
  return a.frame - b.frame || a.order - b.order || a.player - b.player;
}

export function createInputHistoryState(player: PlayerId): InputHistoryState {
  return {
    player,
    directionPresses: [],
    activeHolds: {},
    completedHolds: [],
    lastFrame: -1,
    lastOrder: -1,
  };
}

export function validateNormalizedInputEvent(event: NormalizedInputEvent): void {
  assertNonNegativeInteger(event.frame, 'event.frame');
  assertNonNegativeInteger(event.order, 'event.order');
  if (event.player !== 0 && event.player !== 1) throw new RangeError('event.player must be 0 or 1');
  if (event.kind === 'direction' && !DIRECTIONS.includes(event.direction)) throw new TypeError('invalid logical direction');
  if (event.kind === 'attack' && !['high', 'mid', 'low'].includes(event.level)) throw new TypeError('invalid attack level');
}

function assertMonotonic(state: InputHistoryState, event: NormalizedInputEvent): void {
  if (event.player !== state.player) throw new Error(`event player ${event.player} does not match history player ${state.player}`);
  if (event.frame < state.lastFrame || (event.frame === state.lastFrame && event.order <= state.lastOrder)) {
    throw new Error('events for one player must be applied in strict frame/order order');
  }
}

function pruneHistory(state: InputHistoryState, currentFrame: number, profile: CommandTimingProfile): InputHistoryState {
  const oldest = currentFrame - profile.directionHistoryF;
  return {
    ...state,
    directionPresses: state.directionPresses.filter((press) => press.frame >= oldest),
    completedHolds: state.completedHolds.filter((hold) => hold.endFrame >= oldest || hold.startFrame >= oldest),
  };
}

function lastSameDirectionPress(state: InputHistoryState, direction: Direction) {
  for (let index = state.directionPresses.length - 1; index >= 0; index -= 1) {
    const press = state.directionPresses[index];
    if (press.direction === direction) return press;
  }
  return undefined;
}

function applyDirectionEvent(
  state: InputHistoryState,
  event: DirectionInputEvent,
  profile: CommandTimingProfile,
): InputHistoryUpdate {
  if (event.action === 'press') {
    const previous = lastSameDirectionPress(state, event.direction);
    const minGap = profile.sameDirectionMinGapF;
    if (previous && minGap !== undefined && event.frame - previous.frame < minGap) {
      return {
        state: { ...state, lastFrame: event.frame, lastOrder: event.order },
        accepted: false,
        reason: 'anti-chatter',
      };
    }
    const activeHolds = { ...state.activeHolds };
    if (!activeHolds[event.direction]) {
      activeHolds[event.direction] = { direction: event.direction, frame: event.frame, order: event.order };
    }
    return {
      state: {
        ...state,
        directionPresses: [...state.directionPresses, { direction: event.direction, frame: event.frame, order: event.order }],
        activeHolds,
        lastFrame: event.frame,
        lastOrder: event.order,
      },
      accepted: true,
    };
  }

  const started = state.activeHolds[event.direction];
  const activeHolds = { ...state.activeHolds };
  delete activeHolds[event.direction];
  const completedHolds: readonly CompletedHold[] = started
    ? [...state.completedHolds, {
        direction: event.direction,
        startFrame: started.frame,
        startOrder: started.order,
        endFrame: event.frame,
        endOrder: event.order,
      }]
    : state.completedHolds;
  return {
    state: {
      ...state,
      activeHolds,
      completedHolds,
      lastFrame: event.frame,
      lastOrder: event.order,
    },
    accepted: true,
  };
}

export function applyNormalizedInputEvent(
  inputState: InputHistoryState,
  event: NormalizedInputEvent,
  profile: CommandTimingProfile,
): InputHistoryUpdate {
  validateNormalizedInputEvent(event);
  assertMonotonic(inputState, event);
  const state = pruneHistory(inputState, event.frame, profile);
  if (event.kind === 'direction') return applyDirectionEvent(state, event, profile);
  return {
    state: { ...state, lastFrame: event.frame, lastOrder: event.order },
    accepted: true,
  };
}

export function applyNormalizedInputEvents(
  initialState: InputHistoryState,
  events: readonly NormalizedInputEvent[],
  profile: CommandTimingProfile,
): InputHistoryState {
  const sorted = [...events].sort(compareNormalizedInputEvents);
  for (let index = 1; index < sorted.length; index += 1) {
    const previous = sorted[index - 1];
    const current = sorted[index];
    if (previous.frame === current.frame && previous.order === current.order && previous.player === current.player) {
      throw new Error('duplicate frame/order/player input key');
    }
  }
  let state = initialState;
  for (const event of sorted) {
    if (event.player !== initialState.player) continue;
    state = applyNormalizedInputEvent(state, event, profile).state;
  }
  return state;
}

export function heldFrames(
  state: InputHistoryState,
  direction: Direction,
  frame: number,
): number {
  const active = state.activeHolds[direction];
  if (!active || frame < active.frame) return 0;
  return frame - active.frame;
}

export function isDirectionHeld(
  state: InputHistoryState,
  direction: Direction,
  frame: number,
  profile: CommandTimingProfile,
): boolean {
  const minimum = profile.holdDetectF ?? 0;
  return heldFrames(state, direction, frame) >= minimum;
}
