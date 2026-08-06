import {readFileSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const MARKER='G01.2 RNG and combo schema correction';

function replaceOnce(text,from,to,label){
  const count=text.split(from).length-1;
  if(count!==1)throw new Error(`${label}: expected one match, found ${count}`);
  return text.replace(from,to);
}
function patch(relative,transform){
  const file=path.join(ROOT,relative);
  const before=readFileSync(file,'utf8');
  if(before.includes(MARKER)){console.log(`unchanged ${relative}`);return;}
  const after=transform(before);
  if(after===before)throw new Error(`${relative}: no change`);
  writeFileSync(file,after,'utf8');
  console.log(`patched ${relative}`);
}

patch('src/core/v2-validation/battle-state-v2-validation.ts',(source)=>{
  source=replaceOnce(source,
    "export type InitialBattleStateOptionsV2=Readonly<{\n  fighters:Readonly<Record<PlayerIdV2,FighterSeedV2>>;\n  roundIndex:number;",
    "export type InitialBattleStateOptionsV2=Readonly<{\n  fighters:Readonly<Record<PlayerIdV2,FighterSeedV2>>;\n  rng:Readonly<{combatState:number;aiState:number}>;\n  roundIndex:number;",
    'initial options rng');
  source=replaceOnce(source,
    "    resources:Object.freeze({hp:seed.maxHp,maxHp:seed.maxHp,guard:seed.maxGuard,maxGuard:seed.maxGuard,sGauge:0,maxSGauge:seed.maxSGauge,focusGauge:0,maxFocusGauge:seed.maxFocusGauge,ultimateStock:0,maxUltimateStock:seed.maxUltimateStock}),\n    timers:Object.freeze",
    "    resources:Object.freeze({hp:seed.maxHp,maxHp:seed.maxHp,guard:seed.maxGuard,maxGuard:seed.maxGuard,sGauge:0,maxSGauge:seed.maxSGauge,focusGauge:0,maxFocusGauge:seed.maxFocusGauge,ultimateStock:0,maxUltimateStock:seed.maxUltimateStock}),\n    combo:Object.freeze({count:0}),\n    timers:Object.freeze",
    'fighter combo factory');
  source=replaceOnce(source,
    "  if(!integer(options.roundIndex,1)||!integer(options.timerCombatF))throw new TypeError('invalid round options');",
    "  if(!integer(options.roundIndex,1)||!integer(options.timerCombatF)||!integer(options.rng.combatState)||options.rng.combatState>0xffff_ffff||!integer(options.rng.aiState)||options.rng.aiState>0xffff_ffff)throw new TypeError('invalid round or RNG options');",
    'initial options validation');
  source=replaceOnce(source,
    "    freeze:Object.freeze({kind:'NONE',remainingF:0,sourceId:null}),\n    fighters:freezePair",
    "    freeze:Object.freeze({kind:'NONE',remainingF:0,sourceId:null}),\n    rng:Object.freeze({combatState:options.rng.combatState,aiState:options.rng.aiState}),\n    fighters:freezePair",
    'rng factory');
  source=replaceOnce(source,
    "  for(const [key,value] of Object.entries(fighter.timers))if(!integer(value))errors.push(`${path}.timers.${key}: non-negative integer required`);",
    "  if(!integer(fighter.combo.count))errors.push(`${path}.combo.count: non-negative integer required`);\n  for(const [key,value] of Object.entries(fighter.timers))if(!integer(value))errors.push(`${path}.timers.${key}: non-negative integer required`);",
    'combo validation');
  source=replaceOnce(source,
    "  if(state.freeze.kind==='NONE'){\n    if(state.freeze.remainingF!==0||state.freeze.sourceId!==null)errors.push('freeze: NONE invariant violated');\n  }else if(!integer(state.freeze.remainingF,1)||!text(state.freeze.sourceId))errors.push('freeze: active freeze requires duration and source');",
    "  if(state.freeze.kind==='NONE'){\n    if(state.freeze.remainingF!==0||state.freeze.sourceId!==null)errors.push('freeze: NONE invariant violated');\n  }else if(!integer(state.freeze.remainingF,1)||!text(state.freeze.sourceId))errors.push('freeze: active freeze requires duration and source');\n  if(!integer(state.rng.combatState)||state.rng.combatState>0xffff_ffff||!integer(state.rng.aiState)||state.rng.aiState>0xffff_ffff)errors.push('rng: unsigned 32-bit states required');",
    'rng validation');
  return `// ${MARKER}\n${source}`;
});

patch('test/battle-state-v2.test.mjs',(source)=>{
  source=source.replaceAll("assert.equal(BATTLE_STATE_V2_VERSION,'mamoken-battle-state-v2-v0.2');","assert.equal(BATTLE_STATE_V2_VERSION,'mamoken-battle-state-v2-v0.3');");
  source=source.replaceAll("assert.equal(state.version,'mamoken-battle-state-v2-v0.2');","assert.equal(state.version,'mamoken-battle-state-v2-v0.3');");
  source=source.replaceAll("  roundIndex:1,\n  timerCombatF:5940,","  rng:{combatState:0x12345678,aiState:0x51a1},\n  roundIndex:1,\n  timerCombatF:5940,");
  source=source.replaceAll("},roundIndex:1,timerCombatF:5940,timeoutEnabled:true}))","},rng:{combatState:0x12345678,aiState:0x51a1},roundIndex:1,timerCombatF:5940,timeoutEnabled:true}))");
  source=replaceOnce(source,
    "assert.equal(state.flow,'fight');",
    "assert.deepEqual(state.rng,{combatState:0x12345678,aiState:0x51a1});\nassert.deepEqual(state.fighters[0].combo,{count:0});\nassert.equal(state.flow,'fight');",
    'rng combo expectation');
  source=replaceOnce(source,
    "const invalidFocus=structuredClone(state);",
    "const invalidRng=structuredClone(state);invalidRng.rng.combatState=0x1_0000_0000;\nassert.equal(validateBattleStateV2(invalidRng).ok,false);\nconst invalidCombo=structuredClone(state);invalidCombo.fighters[0].combo.count=-1;\nassert.equal(validateBattleStateV2(invalidCombo).ok,false);\nconst invalidFocus=structuredClone(state);",
    'invalid rng combo cases');
  source=replaceOnce(source,
    "console.log(`battle state v2 tests passed; moves=21; openNumerics=21; reasons=${RESOLUTION_REASON_CODES_V2.length}; clocks=3; currentGauges=s+focus+ult+charge; hash=${stateHash}`);",
    "console.log(`battle state v2 tests passed; moves=21; openNumerics=21; reasons=${RESOLUTION_REASON_CODES_V2.length}; clocks=3; currentGauges=s+focus+ult+charge; rng=2; combo=1; hash=${stateHash}`);",
    'console summary');
  return `// ${MARKER}\n${source}`;
});

patch('design/combat/contracts/MAMOKEN_BATTLE_STATE_AND_MOVESPEC_V2_v0.1.md',(source)=>{
  source=replaceOnce(source,'# マモ拳 BattleState V2 / MoveSpec V2 schema v0.2','# マモ拳 BattleState V2 / MoveSpec V2 schema v0.3','document version');
  source=replaceOnce(source,
    '## 5. Current gauge schema',
    `## 5. Deterministic RNG and combo\n\n${MARKER}. BattleStateは現行snapshotの\`seed\` / \`aiSeed\`を捨てず、unsigned 32-bitの\`rng.combatState\` / \`rng.aiState\`として保持する。各fighterは\`combo.count\`を持つ。これらはstate hashへ含まれる。\n\nContactResultは\`comboCountDelta\`をP1/P2別に持つ。G01.2は型とvalidatorだけを追加し、combo resolverは追加しない。\n\n## 6. Current gauge schema`,
    'rng combo section');
  source=source.replaceAll('## 6. SpatialPairState V2','## 7. SpatialPairState V2')
    .replaceAll('## 7. Full MoveSpec V2','## 8. Full MoveSpec V2')
    .replaceAll('## 8. TaggedValue','## 9. TaggedValue')
    .replaceAll('## 9. G00 closureからの変換','## 10. G00 closureからの変換')
    .replaceAll('## 10. Intent / Result','## 11. Intent / Result')
    .replaceAll('## 11. 理由コード','## 12. 理由コード')
    .replaceAll('## 12. 対称性','## 13. 対称性')
    .replaceAll('## 13. 非目標','## 14. 非目標')
    .replaceAll('## 14. 後続','## 15. 後続');
  return source;
});

patch('reports/combat/G01_COMPLETION.md',(source)=>{
  source=replaceOnce(source,'# G01 Completion Report — BattleState V2 / Full MoveSpec V2 Schema v0.2','# G01 Completion Report — BattleState V2 / Full MoveSpec V2 Schema v0.3','report version');
  source=replaceOnce(source,
    '## Current gauge correction',
    `## RNG and combo correction\n\n${MARKER}. BattleState now preserves current deterministic RNG values as unsigned 32-bit combat and AI states, and each fighter preserves the current combo count. Both are included in the deterministic state hash. ContactResult exposes a P1/P2 combo-count delta field for later resolvers.\n\n## Current gauge correction`,
    'report rng combo section');
  return source;
});
