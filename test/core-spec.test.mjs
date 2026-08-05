import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const constants = readFileSync(new URL('../src/core/constants.ts', import.meta.url), 'utf8');
const determinism = readFileSync(new URL('../src/core/determinism.ts', import.meta.url), 'utf8');
const types = readFileSync(new URL('../src/core/types.ts', import.meta.url), 'utf8');
const current = JSON.parse(readFileSync(new URL('../reports/current_impl_constants.json', import.meta.url), 'utf8'));

function mustContain(source, snippet) {
  assert.ok(source.includes(snippet), `missing snippet: ${snippet}`);
}

mustContain(types, "export type Level = 'high' | 'mid' | 'low';");
mustContain(types, "export type Direction = 'left' | 'down' | 'right';");
mustContain(types, "export type BattleFlow =");
mustContain(types, "export type BattleInput =");

for (const [level, spec] of Object.entries(current.bal.ATK)) {
  for (const [key, value] of Object.entries(spec)) {
    mustContain(constants, `${key}: ${value}`);
  }
}

mustContain(constants, `HP: ${current.bal.HP}`);
mustContain(constants, `TIME: ${current.bal.TIME}`);
mustContain(constants, `WINS: ${current.bal.WINS}`);
mustContain(constants, `MIKIRI: { window: ${current.bal.MIKIRI.window}, windowPinch: ${current.bal.MIKIRI.windowPinch}, whiff: ${current.bal.MIKIRI.whiff} }`);
mustContain(constants, `DOWN: { downF: ${current.bal.DOWN.downF}, wakeF: ${current.bal.DOWN.wakeF}, followupMul: ${current.bal.DOWN.followupMul} }`);
mustContain(constants, `ROAR: { s: ${current.bal.ROAR.s}, armor: ${current.bal.ROAR.armor}, a: ${current.bal.ROAR.a}, r: ${current.bal.ROAR.r}, d: ${current.bal.ROAR.d}, stun: ${current.bal.ROAR.stun} }`);

assert.ok(!/Math\.random|Date\./.test(determinism), 'determinism helpers must not use Math.random or Date');
mustContain(determinism, 'export function mulberry32');
mustContain(determinism, 'export function stateHash');

console.log('core spec snapshot tests passed');
