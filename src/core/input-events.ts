import type { CommandParserState, DirectionHistoryEntry, NormalizedInputEvent } from './command-types.ts';
import type { Direction } from './types.ts';

const EMPTY_HELD: Readonly<Record<Direction, null>> = { left: null, down: null, right: null };

export function createCommandParserState(): CommandParserState {
  return { history: [], held: EMPTY_HELD, lastHash: '' };
}

export function compareInputEvents(a: NormalizedInputEvent, b: NormalizedInputEvent): number {
  return a.frame - b.frame || a.order - b.order || a.player - b.player;
}

export function applyInputEvent(state: CommandParserState, event: NormalizedInputEvent, maxHistory = 32): CommandParserState {
  if (event.kind === 'directionPress' && event.direction) {
    const entry: DirectionHistoryEntry = { frame: event.frame, order: event.order, player: event.player, direction: event.direction };
    return {
      ...state,
      history: [...state.history, entry].slice(-maxHistory),
      held: { ...state.held, [event.direction]: event.frame },
    };
  }
  if (event.kind === 'directionRelease' && event.direction) {
    return { ...state, held: { ...state.held, [event.direction]: null } };
  }
  return state;
}

export function applyInputEvents(state: CommandParserState, events: readonly NormalizedInputEvent[], maxHistory = 32): CommandParserState {
  return [...events].sort(compareInputEvents).reduce((next, event) => applyInputEvent(next, event, maxHistory), state);
}
