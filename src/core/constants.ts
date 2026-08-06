import currentImplementation from '../../reports/current_impl_constants.json' with { type: 'json' };
import currentPhases from '../../reports/current_impl_phases.json' with { type: 'json' };
import type { CurrentArchetypeId, CurrentCharacterId, CurrentImplementationContract, CurrentPhaseReport, PlannedArchetypeId } from './types.ts';

export const CORE_SPEC_VERSION = 'core-spec-v1' as const;
export const CURRENT_IMPL_SOURCE = 'prototype/mamoken_prototype_v01.html' as const;

export const CURRENT_CONTRACT = currentImplementation as unknown as CurrentImplementationContract;
export const CURRENT_PHASE_REPORT = currentPhases as unknown as CurrentPhaseReport;

export const BAL = CURRENT_CONTRACT.bal;
export const CURRENT_CHARACTERS = CURRENT_CONTRACT.characters;
export const CURRENT_CHARACTER_IDS = CURRENT_CONTRACT.characterIds;

export const CURRENT_ARCHETYPE_IDS = ['standard', 'rush', 'power'] as const satisfies readonly CurrentArchetypeId[];
export const PLANNED_ARCHETYPE_IDS = ['defense', 'tricky', 'grappler', 'counter', 'charge'] as const satisfies readonly PlannedArchetypeId[];
export const PLANNED_CHARACTER_IDS = ['hakuma', 'chirka', 'takimaru', 'yomikage', 'bullet'] as const;
export const BOSS_CHARACTER_IDS = ['dark_moguzo'] as const;
export const FULL_ROSTER_IDS = [...CURRENT_CHARACTER_IDS, ...PLANNED_CHARACTER_IDS, ...BOSS_CHARACTER_IDS] as const;
