import type { CharacterId, MoveSpec } from './types';

export const CORE_SPEC_VERSION = 'core-spec-v1' as const;

export const LEVELS = ['high', 'mid', 'low'] as const;
export const DIRECTIONS = ['left', 'down', 'right'] as const;

export const BAL = {
  LOGIC_FPS: 60,
  HP: 1000,
  TIME: 3600,
  WINS: 2,
  ULT: { stock: 3, d: 300, impact: 70, total: 130 },
  ATK: {
    high: { s: 22, a: 3, r: 24, d: 100, y: -108, w: 2 },
    mid: { s: 14, a: 3, r: 18, d: 70, y: -68, w: 1 },
    low: { s: 30, a: 4, r: 30, d: 150, y: -26, w: 3, down: true },
    crouch: { s: 10, a: 3, r: 14, d: 50, y: -20, w: 0.5 },
  } satisfies Record<string, MoveSpec>,
  TELEGRAPH: { mid: 8, high: 13, low: 18, crouch: 6 },
  HITSTUN: { high: 32, mid: 24, crouch: 19 },
  BLOCKSTUN: { high: 16, mid: 14, low: 15, crouch: 12 },
  CHAIN: 14,
  CMAX: 3,
  SCALE: [1, 0.9, 0.8],
  PINCH_HP: 300,
  MIKIRI: { window: 5, windowPinch: 7, whiff: 22 },
  DOWN: { downF: 45, wakeF: 20, followupMul: 0.5 },
  FOCUS: { max: 100, gainDmgMul: 0.15, gainGuard: 8, gainMikiri: 30, slowMul: 0.25, durationMs: 600, zoom: 1.3 },
  GUARD: { base: 100, regenPerF: 0.22, breakDizzyF: 90 },
  GDMG_A: 10,
  GDMG_S: 45,
  CHIP_LOW: 6,
  CHIP_S: 20,
  ROAR: { s: 16, armor: 14, a: 4, r: 24, d: 130, stun: 34 },
  GRAB: { s: 12, a: 3, d: 90, rec: 28, stun: 30 },
  BUF: 10,
  CMD: { buffer: 12, bufF: 24 },
  FLICK_MS: 300,
  JUST_TAP_MS: 100,
} as const;

export const CHARACTER_CORE = {
  moguzo: { archetype: 'standard', hp: 1000, guard: 100, startupOffsetF: 0, damageMul: 1, sMul: 1 },
  pisuke: { archetype: 'rush', hp: 1000, guard: 90, startupOffsetF: -2, damageMul: 0.85, sMul: 1.25 },
  godan: { archetype: 'power', hp: 1000, guard: 110, startupOffsetF: 2, damageMul: 1.18, sMul: 0.9 },
} as const satisfies Partial<Record<CharacterId, object>>;
