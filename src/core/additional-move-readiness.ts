import { CHARACTER_CATALOG_BY_ID } from './character-catalog.ts';
import { buildCore3CommandCatalogContract, hashCore3CommandCatalog } from './command-catalog.ts';
import type { CombatMoveSpec } from './combat-types.ts';
import { validateCombatMoveSpec } from './combat-validation.ts';
import { fnv1a32, stableStringify } from './determinism.ts';
import { CORE3_ROSTER } from './roster-core3.ts';
import type {
  AdditionalMoveCapability,
  AdditionalMoveCommandId,
  AdditionalMoveImplementationDraft,
  AdditionalMoveReadinessRecord,
  AdditionalMoveReadinessReport,
  AdditionalMoveSlot,
  AdditionalMoveSpecDraft,
  AdditionalMoveVerification,
} from './additional-move-readiness-types.ts';
import type { CurrentCharacterId, CurrentLevel } from './types.ts';

export const ADDITIONAL_MOVE_READINESS_VERSION = 'additional-move-readiness-v1' as const;

export const SUPPORTED_ADDITIONAL_MOVE_CAPABILITIES = Object.freeze([
  'conditional_command',
  'one_hit_armor',
  'combo_end',
  'combo_limit',
  'guard_pressure',
] as const satisfies readonly AdditionalMoveCapability[]);

export const UNSUPPORTED_ADDITIONAL_MOVE_CAPABILITIES = Object.freeze([
  'forward_movement',
  'down_on_hit',
] as const satisfies readonly AdditionalMoveCapability[]);

const REQUIRED_CAPABILITY_DATA = {
  'moguzo:slot-7': ['combo_limit'],
  'pisuke:slot-6': ['conditional_command'],
  'pisuke:slot-7': ['forward_movement', 'combo_end'],
  'godan:slot-4': ['one_hit_armor'],
  'godan:slot-6': ['down_on_hit'],
  'godan:slot-7': ['guard_pressure'],
} as const satisfies Readonly<Partial<Record<AdditionalMoveCommandId, readonly AdditionalMoveCapability[]>>>;
const REQUIRED_CAPABILITIES: Readonly<Partial<Record<AdditionalMoveCommandId, readonly AdditionalMoveCapability[]>>> = Object.freeze(REQUIRED_CAPABILITY_DATA);

const MOVE_SPEC_REQUIRED_FIELDS = Object.freeze([
  'weight',
  'telegraphF',
  'startupF',
  'activeF',
  'recoveryF',
  'damage',
  'chipDamage',
  'guardDamage',
  'hitAdvF',
  'blockAdvF',
  'whiffExtraRecoveryF',
  'hitKnockbackClass',
  'blockKnockbackClass',
  'starterScale',
  'comboProration',
  'comboWeight',
  'repeatLimit',
  'cancelOnHit',
  'cancelOnBlock',
  'cancelOnWhiff',
  'armorHits',
  'roarGainOnHit',
  'roarGainOnBlock',
] as const satisfies readonly (keyof AdditionalMoveSpecDraft)[]);

const VERIFICATION_KEYS = Object.freeze([
  'moveSpecUnit',
  'commandResolution',
  'deterministicCombat',
  'comboInteraction',
  'runtimeIntegration',
  'cpuPolicy',
  'onlineDeterminism',
  'mobileSmoke',
] as const satisfies readonly (keyof AdditionalMoveVerification)[]);

const BLANK_VERIFICATION: AdditionalMoveVerification = Object.freeze({
  moveSpecUnit: false,
  commandResolution: true,
  deterministicCombat: false,
  comboInteraction: false,
  runtimeIntegration: false,
  cpuPolicy: false,
  onlineDeterminism: false,
  mobileSmoke: false,
});

function moveLevel(attribute: 'HIGH' | 'MID' | 'LOW' | 'GRAB'): CurrentLevel {
  if (attribute === 'GRAB') throw new Error('current-three additional slots 4-7 must be attacks');
  return attribute.toLowerCase() as CurrentLevel;
}

function blankMoveSpec(
  commandId: AdditionalMoveCommandId,
  nameJa: string,
  level: CurrentLevel,
  reachClass: 0 | 1 | 2 | 3,
): AdditionalMoveSpecDraft {
  return Object.freeze({
    id: commandId,
    nameJa,
    level,
    reachClass,
    repeatGroup: commandId,
    tags: Object.freeze(['design_confirmed', 'additional_command']),
    weight: null,
    telegraphF: null,
    startupF: null,
    activeF: null,
    recoveryF: null,
    damage: null,
    chipDamage: null,
    guardDamage: null,
    hitAdvF: null,
    blockAdvF: null,
    whiffExtraRecoveryF: null,
    hitKnockbackClass: null,
    blockKnockbackClass: null,
    starterScale: null,
    comboProration: null,
    comboWeight: null,
    repeatLimit: null,
    cancelOnHit: null,
    cancelOnBlock: null,
    cancelOnWhiff: null,
    armorHits: null,
    armorStartF: null,
    armorEndF: null,
    roarGainOnHit: null,
    roarGainOnBlock: null,
  });
}

function createBlankDrafts(): readonly AdditionalMoveImplementationDraft[] {
  const drafts: AdditionalMoveImplementationDraft[] = [];
  for (const character of CORE3_ROSTER) {
    for (const move of character.commandMoves.slice(3)) {
      const slot = move.slot as AdditionalMoveSlot;
      const commandId = `${character.id}:slot-${slot}` as AdditionalMoveCommandId;
      drafts.push(Object.freeze({
        commandId,
        moveSpec: blankMoveSpec(commandId, move.nameJa, move.level as CurrentLevel, move.reach),
        implementedCapabilities: Object.freeze([]),
        satisfiedConstraintIds: Object.freeze([]),
        runtimeBehaviorId: null,
        poseStrategy: null,
        poseId: null,
        seToken: null,
        verification: BLANK_VERIFICATION,
      }));
    }
  }
  return Object.freeze(drafts);
}

export const ADDITIONAL_MOVE_IMPLEMENTATION_DRAFTS = createBlankDrafts();

function requiredConstraintIds(commandId: AdditionalMoveCommandId, count: number): readonly string[] {
  return Object.freeze(Array.from({ length: count }, (_, index) => `${commandId}:constraint-${index + 1}`));
}

function materializeMoveSpec(draft: AdditionalMoveSpecDraft): CombatMoveSpec | null {
  for (const field of MOVE_SPEC_REQUIRED_FIELDS) if (draft[field] === null) return null;
  if (draft.armorHits !== null && draft.armorHits > 0 && (draft.armorStartF === null || draft.armorEndF === null)) return null;
  return Object.freeze({
    id: draft.id,
    nameJa: draft.nameJa,
    level: draft.level,
    weight: draft.weight as number,
    telegraphF: draft.telegraphF as number,
    startupF: draft.startupF as number,
    activeF: draft.activeF as number,
    recoveryF: draft.recoveryF as number,
    damage: draft.damage as number,
    chipDamage: draft.chipDamage as number,
    guardDamage: draft.guardDamage as number,
    hitAdvF: draft.hitAdvF as number,
    blockAdvF: draft.blockAdvF as number,
    whiffExtraRecoveryF: draft.whiffExtraRecoveryF as number,
    reachClass: draft.reachClass,
    hitKnockbackClass: draft.hitKnockbackClass as 0 | 1 | 2,
    blockKnockbackClass: draft.blockKnockbackClass as 0 | 1 | 2,
    starterScale: draft.starterScale as number,
    comboProration: draft.comboProration as number,
    comboWeight: draft.comboWeight as number,
    repeatGroup: draft.repeatGroup,
    repeatLimit: draft.repeatLimit as number,
    cancelOnHit: draft.cancelOnHit as readonly string[],
    cancelOnBlock: draft.cancelOnBlock as readonly string[],
    cancelOnWhiff: draft.cancelOnWhiff as readonly string[],
    armorHits: draft.armorHits as number,
    ...(draft.armorStartF === null ? {} : { armorStartF: draft.armorStartF }),
    ...(draft.armorEndF === null ? {} : { armorEndF: draft.armorEndF }),
    roarGainOnHit: draft.roarGainOnHit as number,
    roarGainOnBlock: draft.roarGainOnBlock as number,
    tags: draft.tags,
  });
}

function unique<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...new Set(values)]);
}

function evaluateDraft(draft: AdditionalMoveImplementationDraft): AdditionalMoveReadinessRecord {
  const contract = buildCore3CommandCatalogContract();
  const definition = contract.definitions.find((candidate) => candidate.id === draft.commandId);
  if (!definition || definition.source !== 'design_confirmed' || definition.slot === undefined || definition.slot < 4 || definition.slot > 7) {
    throw new Error(`${draft.commandId}: design-confirmed command definition is required`);
  }
  const characterId = definition.characterId as CurrentCharacterId;
  const slot = definition.slot as AdditionalMoveSlot;
  const design = CHARACTER_CATALOG_BY_ID[characterId].moves[slot - 1];
  if (!design || design.implementationStatus !== 'design_confirmed') throw new Error(`${draft.commandId}: design catalog entry is required`);
  if (draft.moveSpec.id !== draft.commandId || draft.moveSpec.nameJa !== design.nameJa) throw new Error(`${draft.commandId}: move draft identity mismatch`);
  if (draft.moveSpec.level !== moveLevel(design.attribute) || draft.moveSpec.reachClass !== design.reach) throw new Error(`${draft.commandId}: move draft level/reach mismatch`);

  const requiredCapabilities = Object.freeze([...(REQUIRED_CAPABILITIES[draft.commandId] ?? [])]);
  const unsupportedCapabilities = Object.freeze(requiredCapabilities.filter((capability: AdditionalMoveCapability) =>
    UNSUPPORTED_ADDITIONAL_MOVE_CAPABILITIES.includes(capability as typeof UNSUPPORTED_ADDITIONAL_MOVE_CAPABILITIES[number]),
  ));
  const constraintIds = requiredConstraintIds(draft.commandId, design.balanceConstraints.length);
  const overlaps = Object.freeze(contract.overlaps
    .filter((overlap) => overlap.shorterId === draft.commandId || overlap.longerId === draft.commandId)
    .map((overlap) => Object.freeze({ shorterId: overlap.shorterId, longerId: overlap.longerId, resolution: overlap.resolution })));

  const designReady = design.reach !== 3 || design.balanceConstraints.length >= 2;
  const inputReady = definition.directions.join(',') === design.command.directions.join(',')
    && definition.trigger === design.command.trigger
    && overlaps.every((overlap) => overlap.resolution === 'longest-command-first');
  const schemaReady = unsupportedCapabilities.length === 0;

  const missingMoveSpecFields = MOVE_SPEC_REQUIRED_FIELDS.filter((field) => draft.moveSpec[field] === null).map(String);
  if ((draft.moveSpec.armorHits ?? 0) > 0 || requiredCapabilities.includes('one_hit_armor')) {
    if (draft.moveSpec.armorStartF === null) missingMoveSpecFields.push('armorStartF');
    if (draft.moveSpec.armorEndF === null) missingMoveSpecFields.push('armorEndF');
  }
  const spec = materializeMoveSpec(draft.moveSpec);
  const specErrors = spec ? validateCombatMoveSpec(spec) : null;
  const moveSpecReady = missingMoveSpecFields.length === 0 && spec !== null && specErrors?.ok === true;

  const missingRuntimeItems: string[] = [];
  for (const capability of requiredCapabilities) if (!draft.implementedCapabilities.includes(capability)) missingRuntimeItems.push(`capability.${capability}`);
  for (const constraintId of constraintIds) if (!draft.satisfiedConstraintIds.includes(constraintId)) missingRuntimeItems.push(`constraint.${constraintId}`);
  if (!draft.runtimeBehaviorId) missingRuntimeItems.push('behaviorId');
  if (!draft.poseStrategy) missingRuntimeItems.push('poseStrategy');
  if (!draft.poseId) missingRuntimeItems.push('poseId');
  if (!draft.seToken) missingRuntimeItems.push('seToken');
  const runtimeReady = missingRuntimeItems.length === 0;

  const missingVerificationItems = VERIFICATION_KEYS.filter((key) => !draft.verification[key]).map(String);
  const verificationReady = missingVerificationItems.length === 0;

  const blockers: string[] = [];
  if (!designReady) blockers.push('design.reach3-costs');
  if (!inputReady) blockers.push('input.contract');
  for (const capability of unsupportedCapabilities) blockers.push(`schema.${capability}`);
  for (const field of missingMoveSpecFields) blockers.push(`moveSpec.${field}`);
  if (specErrors && !specErrors.ok) for (const error of specErrors.errors) blockers.push(`moveSpec.validation:${error}`);
  for (const item of missingRuntimeItems) blockers.push(`runtime.${item}`);
  for (const item of missingVerificationItems) blockers.push(`verification.${item}`);
  const authorityReady = designReady && inputReady && schemaReady && moveSpecReady && runtimeReady && verificationReady;

  return Object.freeze({
    commandId: draft.commandId,
    characterId,
    slot,
    nameJa: design.nameJa,
    roleJa: design.roleJa,
    reachClass: design.reach,
    designConstraintsJa: Object.freeze([...design.balanceConstraints]),
    requiredConstraintIds: constraintIds,
    requiredCapabilities,
    unsupportedCapabilities,
    conditionId: definition.conditionId ?? null,
    overlaps,
    missingMoveSpecFields: Object.freeze(missingMoveSpecFields),
    missingRuntimeItems: Object.freeze(missingRuntimeItems),
    missingVerificationItems: Object.freeze(missingVerificationItems),
    blockers: unique(blockers),
    stages: Object.freeze({
      design: designReady,
      input: inputReady,
      schema: schemaReady,
      moveSpec: moveSpecReady,
      runtime: runtimeReady,
      verification: verificationReady,
      authority: authorityReady,
    }),
  });
}

export function buildAdditionalMoveReadinessReport(
  drafts: readonly AdditionalMoveImplementationDraft[] = ADDITIONAL_MOVE_IMPLEMENTATION_DRAFTS,
): AdditionalMoveReadinessReport {
  if (drafts.length !== 12) throw new Error('additional move readiness requires exactly twelve drafts');
  if (new Set(drafts.map((draft) => draft.commandId)).size !== 12) throw new Error('additional move readiness contains duplicate command ids');
  const records = Object.freeze(drafts.map(evaluateDraft));
  const counts = Object.freeze({
    designReady: records.filter((record) => record.stages.design).length,
    inputReady: records.filter((record) => record.stages.input).length,
    schemaReady: records.filter((record) => record.stages.schema).length,
    moveSpecReady: records.filter((record) => record.stages.moveSpec).length,
    runtimeReady: records.filter((record) => record.stages.runtime).length,
    verificationReady: records.filter((record) => record.stages.verification).length,
    authorityReady: records.filter((record) => record.stages.authority).length,
  });
  const unsupportedCapabilities = unique(records.flatMap((record) => record.unsupportedCapabilities));
  const body = Object.freeze({
    version: ADDITIONAL_MOVE_READINESS_VERSION,
    commandContractHash: hashCore3CommandCatalog(),
    totalMoves: 12 as const,
    counts,
    unsupportedCapabilities,
    records,
  });
  return Object.freeze({ ...body, hash: fnv1a32(stableStringify(body)) });
}

export function assertAdditionalMoveAuthorityReady(
  drafts: readonly AdditionalMoveImplementationDraft[] = ADDITIONAL_MOVE_IMPLEMENTATION_DRAFTS,
): void {
  const report = buildAdditionalMoveReadinessReport(drafts);
  const blocked = report.records.filter((record) => !record.stages.authority);
  if (blocked.length > 0) {
    throw new Error(blocked.map((record) => `${record.commandId}: ${record.blockers.join(', ')}`).join('\n'));
  }
}
