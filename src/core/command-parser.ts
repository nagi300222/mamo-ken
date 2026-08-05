import { BAL, CURRENT_CHARACTER_IDS, CURRENT_CONTRACT } from './constants.ts';
import type {
  CommandContext,
  CommandDefinition,
  CommandFallback,
  CommandMatch,
  CommandPrebufferDecision,
  CommandTimingProfile,
  DirectionInputEvent,
  InputHistoryState,
  InputTrigger,
  MatchSet,
  ScheduledCommand,
  TriggerInputEvent,
  TriggerResolution,
} from './command-types.ts';
import type { CurrentCharacterId, Direction } from './types.ts';

export const CURRENT_COMPAT_PROFILE: CommandTimingProfile = Object.freeze({
  id: 'current-compat',
  status: 'current_impl',
  directionHistoryF: BAL.CMD.bufF,
  commandPrebufferF: BAL.CMD.buffer,
  latestDirectionsOnly: true,
});

export const TARGET_PROVISIONAL_PROFILE: CommandTimingProfile = Object.freeze({
  id: 'target-provisional',
  status: 'provisional',
  directionHistoryF: 38,
  commandPrebufferF: BAL.CMD.buffer,
  latestDirectionsOnly: true,
  directionGapMaxF: 18,
  commandTotal3F: 28,
  commandTotal4F: 38,
  finalButtonGraceF: 10,
  sameDirectionMinGapF: 2,
  holdDetectF: 30,
  chargeCompleteF: 45,
});

function triggerOf(event: TriggerInputEvent): InputTrigger {
  return event.kind === 'grab' ? 'grab' : event.level;
}

export function buildCurrentCommandDefinitions(characterId?: CurrentCharacterId): readonly CommandDefinition[] {
  const characterIds = characterId ? [characterId] : CURRENT_CHARACTER_IDS;
  const definitions: CommandDefinition[] = [];
  let definitionOrder = 0;
  for (const id of characterIds) {
    const moves = CURRENT_CONTRACT.bal.CMD.moves[id];
    moves.forEach((move, index) => {
      definitions.push({
        id: `${id}:slot-${index + 1}`,
        name: move.name,
        characterId: id,
        slot: index + 1,
        directions: [...move.seq],
        trigger: move.trigger,
        specificity: 0,
        definitionOrder,
        source: 'current_impl',
      });
      definitionOrder += 1;
    });
  }
  return definitions;
}

function suffixMatches(presses: InputHistoryState['directionPresses'], directions: readonly Direction[]) {
  if (presses.length < directions.length) return undefined;
  const matched = presses.slice(presses.length - directions.length);
  for (let index = 0; index < directions.length; index += 1) {
    if (matched[index].direction !== directions[index]) return undefined;
  }
  return matched;
}

function timingMatches(
  matched: NonNullable<ReturnType<typeof suffixMatches>>,
  triggerFrame: number,
  profile: CommandTimingProfile,
): boolean {
  if (matched.length === 0) return false;
  if (triggerFrame - matched[0].frame > profile.directionHistoryF) return false;
  if (profile.finalButtonGraceF !== undefined && triggerFrame - matched[matched.length - 1].frame > profile.finalButtonGraceF) return false;
  if (profile.directionGapMaxF !== undefined) {
    for (let index = 1; index < matched.length; index += 1) {
      if (matched[index].frame - matched[index - 1].frame > profile.directionGapMaxF) return false;
    }
  }
  const total = matched[matched.length - 1].frame - matched[0].frame;
  if (matched.length === 3 && profile.commandTotal3F !== undefined && total > profile.commandTotal3F) return false;
  if (matched.length === 4 && profile.commandTotal4F !== undefined && total > profile.commandTotal4F) return false;
  return true;
}

function chargeMatches(
  state: InputHistoryState,
  definition: CommandDefinition,
  triggerFrame: number,
  profile: CommandTimingProfile,
): boolean {
  const requirement = definition.charge;
  if (!requirement) return true;
  const minimum = requirement.minHoldF ?? profile.chargeCompleteF;
  if (minimum === undefined) return false;
  const active = state.activeHolds[requirement.direction];
  if (active && !requirement.releaseRequired && triggerFrame - active.frame >= minimum) return true;
  for (let index = state.completedHolds.length - 1; index >= 0; index -= 1) {
    const hold = state.completedHolds[index];
    if (hold.direction !== requirement.direction || hold.endFrame > triggerFrame) continue;
    return hold.endFrame - hold.startFrame >= minimum;
  }
  return false;
}

function conditionIsActive(definition: CommandDefinition, context: CommandContext): boolean {
  return definition.conditionId === undefined || context.activeConditions?.has(definition.conditionId) === true;
}

function matchesPattern(
  state: InputHistoryState,
  event: TriggerInputEvent,
  definition: CommandDefinition,
  profile: CommandTimingProfile,
): CommandMatch | undefined {
  if (definition.trigger !== triggerOf(event)) return undefined;
  const eligible = state.directionPresses.filter((press) => event.frame - press.frame <= profile.directionHistoryF && press.frame <= event.frame);
  const matchedPresses = suffixMatches(eligible, definition.directions);
  if (!matchedPresses || !timingMatches(matchedPresses, event.frame, profile)) return undefined;
  if (!chargeMatches(state, definition, event.frame, profile)) return undefined;
  return { definition, matchedPresses };
}

export function matchCommandDefinitions(
  state: InputHistoryState,
  event: TriggerInputEvent,
  definitions: readonly CommandDefinition[],
  profile: CommandTimingProfile,
  context: CommandContext = {},
): MatchSet {
  const matches: CommandMatch[] = [];
  const blockers: CommandMatch[] = [];
  for (const definition of definitions) {
    const match = matchesPattern(state, event, definition, profile);
    if (!match) continue;
    if (conditionIsActive(definition, context)) matches.push(match);
    else if (definition.conditionId && definition.blockShorterOnConditionFailure) blockers.push(match);
  }
  return { matches, blockers };
}

function isStrictSuffix(shorter: readonly Direction[], longer: readonly Direction[]): boolean {
  if (shorter.length >= longer.length) return false;
  const offset = longer.length - shorter.length;
  for (let index = 0; index < shorter.length; index += 1) {
    if (shorter[index] !== longer[index + offset]) return false;
  }
  return true;
}

function commandPriority(a: CommandMatch, b: CommandMatch): number {
  const aConditional = a.definition.conditionId === undefined ? 0 : 1;
  const bConditional = b.definition.conditionId === undefined ? 0 : 1;
  return bConditional - aConditional
    || b.definition.directions.length - a.definition.directions.length
    || b.definition.specificity - a.definition.specificity
    || a.definition.definitionOrder - b.definition.definitionOrder;
}

function normalFallback(event: TriggerInputEvent): CommandFallback {
  return event.kind === 'grab' ? { kind: 'normal-grab' } : { kind: 'normal-attack', level: event.level };
}

export function resolveCommandTrigger(
  state: InputHistoryState,
  event: TriggerInputEvent,
  definitions: readonly CommandDefinition[],
  profile: CommandTimingProfile,
  options: Readonly<{ context?: CommandContext; fallbackDirection?: Direction }> = {},
): TriggerResolution {
  const set = matchCommandDefinitions(state, event, definitions, profile, options.context);
  const blockedIds = set.blockers.map((blocker) => blocker.definition.id);
  const candidates = set.matches.filter((candidate) => !set.blockers.some((blocker) =>
    isStrictSuffix(candidate.definition.directions, blocker.definition.directions),
  ));
  candidates.sort(commandPriority);
  if (candidates[0]) return { kind: 'command', match: candidates[0], blockedBy: blockedIds };
  if (options.fallbackDirection) {
    return { kind: 'fallback', fallback: { kind: 'direction-fallback', direction: options.fallbackDirection }, blockedBy: blockedIds };
  }
  return { kind: 'fallback', fallback: normalFallback(event), blockedBy: blockedIds };
}

export function resolveDirectionFallback(event: DirectionInputEvent): CommandFallback {
  return { kind: 'direction-fallback', direction: event.direction };
}

export function decideCommandPrebuffer(
  triggerFrame: number,
  recoveryRemainingF: number,
  actionableFrame: number,
  profile: CommandTimingProfile,
): CommandPrebufferDecision {
  if (!Number.isInteger(triggerFrame) || triggerFrame < 0) throw new RangeError('triggerFrame must be a non-negative integer');
  if (!Number.isInteger(recoveryRemainingF) || recoveryRemainingF < 0) throw new RangeError('recoveryRemainingF must be a non-negative integer');
  if (!Number.isInteger(actionableFrame) || actionableFrame < triggerFrame) throw new RangeError('actionableFrame must be an integer at or after triggerFrame');
  if (recoveryRemainingF === 0) return { status: 'immediate', executeFrame: triggerFrame };
  if (recoveryRemainingF <= profile.commandPrebufferF) return { status: 'queued', executeFrame: actionableFrame };
  return { status: 'rejected' };
}

export function scheduleCommandMatch(
  match: CommandMatch,
  triggerFrame: number,
  recoveryRemainingF: number,
  actionableFrame: number,
  profile: CommandTimingProfile,
): ScheduledCommand {
  const decision = decideCommandPrebuffer(triggerFrame, recoveryRemainingF, actionableFrame, profile);
  if (decision.status === 'rejected') return { status: 'rejected', match };
  return { status: decision.status, match, executeFrame: decision.executeFrame };
}
