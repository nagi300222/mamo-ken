import { CURRENT_CONTRACT } from './constants.ts';
import { applyInputEvent } from './input-events.ts';
import type { CommandDefinition, CommandMatch, CommandParserState, CommandResolution, NormalizedInputEvent, PrebufferResolution, TimingProfile } from './command-types.ts';
import type { CurrentCharacterId, Direction } from './types.ts';

function compareCodeUnit(a: string, b: string): number { return a < b ? -1 : a > b ? 1 : 0; }

export const CURRENT_COMMAND_PROFILE: TimingProfile = {
  kind: 'current_impl',
  directionHistoryF: CURRENT_CONTRACT.bal.CMD.bufF,
  commandPrebufferF: CURRENT_CONTRACT.bal.CMD.buffer,
  latestDirectionCount: 2,
};

export const TARGET_COMMAND_PROFILE: TimingProfile = {
  kind: 'target_provisional',
  directionHistoryF: 60,
  commandPrebufferF: CURRENT_CONTRACT.bal.CMD.buffer,
  latestDirectionCount: 4,
  directionGapMaxF: 18,
  commandTotal3F: 28,
  commandTotal4F: 38,
  finalButtonGraceF: 10,
  sameDirectionMinGapF: 2,
  holdDetectF: 30,
  chargeCompleteF: 45,
};

export function currentCommandDefinitions(characterId: CurrentCharacterId): readonly CommandDefinition[] {
  return CURRENT_CONTRACT.bal.CMD.moves[characterId].map((move, index) => ({
    id: `${characterId}:${index}:${move.name}`,
    characterId,
    name: move.name,
    sequence: move.seq,
    trigger: move.trigger,
    definitionOrder: index,
    specificity: move.seq.length,
    currentMoveIndex: index,
    payload: move,
  }));
}

function recentDirections(state: CommandParserState, frame: number, profile: TimingProfile) {
  return state.history.filter((entry) => frame - entry.frame <= profile.directionHistoryF);
}

function sequenceMatches(entries: readonly { direction: Direction; frame: number }[], sequence: readonly Direction[], profile: TimingProfile, triggerFrame: number): boolean {
  if (entries.length < sequence.length) return false;
  const matched = entries.slice(entries.length - sequence.length);
  if (!matched.every((entry, index) => entry.direction === sequence[index])) return false;
  if (profile.finalButtonGraceF != null && triggerFrame - matched[matched.length - 1].frame > profile.finalButtonGraceF) return false;
  if (profile.sameDirectionMinGapF != null) {
    for (let i = 1; i < matched.length; i += 1) if (matched[i - 1].direction === matched[i].direction && matched[i].frame - matched[i - 1].frame < profile.sameDirectionMinGapF) return false;
  }
  if (profile.directionGapMaxF != null) {
    for (let i = 1; i < matched.length; i += 1) if (matched[i].frame - matched[i - 1].frame > profile.directionGapMaxF) return false;
  }
  const total = matched[matched.length - 1].frame - matched[0].frame;
  if (sequence.length === 3 && profile.commandTotal3F != null && total > profile.commandTotal3F) return false;
  if (sequence.length === 4 && profile.commandTotal4F != null && total > profile.commandTotal4F) return false;
  return true;
}

export function findCommandMatches(state: CommandParserState, frame: number, trigger: string, definitions: readonly CommandDefinition[], profile: TimingProfile): readonly CommandMatch[] {
  const win = recentDirections(state, frame, profile);
  const matches: CommandMatch[] = [];
  for (const definition of definitions) {
    if (definition.trigger !== trigger) continue;
    if (definition.charge) {
      const heldFrom = state.held[definition.charge.direction];
      if (heldFrom == null || frame - heldFrom < definition.charge.holdF) continue;
    }
    if (!sequenceMatches(win, definition.sequence, definition.charge ? { ...profile, finalButtonGraceF: undefined } : profile, frame)) continue;
    const matchedDirections = win.slice(win.length - definition.sequence.length);
    matches.push({ definition, completedFrame: frame, matchedDirections });
  }
  return matches;
}

function chooseCommand(matches: readonly CommandMatch[]): CommandMatch | null {
  if (matches.length === 0) return null;
  return [...matches].sort((a, b) => {
    const ac = a.definition.condition?.active === true ? 1 : 0;
    const bc = b.definition.condition?.active === true ? 1 : 0;
    return bc - ac
      || b.definition.sequence.length - a.definition.sequence.length
      || b.definition.specificity - a.definition.specificity
      || compareCodeUnit(a.definition.id, b.definition.id)
      || a.definition.definitionOrder - b.definition.definitionOrder;
  })[0];
}

function findBlockingDefinition(state: CommandParserState, frame: number, trigger: string, definitions: readonly CommandDefinition[], profile: TimingProfile): CommandDefinition | undefined {
  return definitions.find((definition) => definition.trigger === trigger
    && definition.condition?.active === false
    && definition.condition.blocksOverlappingFallback === true
    && sequenceMatches(recentDirections(state, frame, profile), definition.sequence, profile, frame));
}

export function resolveCommand(state: CommandParserState, event: NormalizedInputEvent, definitions: readonly CommandDefinition[], profile: TimingProfile = CURRENT_COMMAND_PROFILE): CommandResolution {
  const trigger = event.kind === 'attack' ? event.level : event.kind === 'grab' ? 'grab' : null;
  if (event.kind === 'directionPress') return { kind: 'directionFallback', frame: event.frame, event };
  if (!trigger) return { kind: 'rejected', frame: event.frame, event };
  const matches = findCommandMatches(state, event.frame, trigger, definitions, profile).filter((match) => match.definition.condition?.active !== false);
  const chosen = chooseCommand(matches);
  if (chosen) return { kind: 'command', frame: event.frame, event, match: chosen };
  const blockedBy = findBlockingDefinition(state, event.frame, trigger, definitions, profile);
  if (blockedBy) return { kind: 'rejected', frame: event.frame, event, blockedBy };
  return { kind: event.kind === 'grab' ? 'normalGrabFallback' : 'normalAttackFallback', frame: event.frame, event };
}

export function applyAndResolve(state: CommandParserState, event: NormalizedInputEvent, definitions: readonly CommandDefinition[], profile: TimingProfile = CURRENT_COMMAND_PROFILE): readonly [CommandParserState, CommandResolution] {
  const next = applyInputEvent(state, event);
  return [next, resolveCommand(next, event, definitions, profile)] as const;
}

export function resolvePrebuffer(match: CommandMatch | undefined, recoveryRemainingF: number | null, actionableFrame: number, profile: TimingProfile = CURRENT_COMMAND_PROFILE): PrebufferResolution {
  if (!match) return { decision: 'rejected' };
  if (recoveryRemainingF == null || recoveryRemainingF <= 0) return { decision: 'immediate', command: match, actionableFrame };
  if (recoveryRemainingF <= profile.commandPrebufferF) return { decision: 'queued', command: match, actionableFrame };
  return { decision: 'rejected', command: match };
}
