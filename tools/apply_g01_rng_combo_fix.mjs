import {readFileSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const MARKER='G01.2 RNG and combo schema correction';

function occurrences(text,needle){return text.split(needle).length-1;}
function replaceOrVerify(text,before,after,label){
  if(occurrences(text,after)===1)return text;
  const count=occurrences(text,before);
  if(count!==1)throw new Error(`${label}: expected one source or generated match; source=${count}; generated=${occurrences(text,after)}`);
  return text.replace(before,after);
}
function removeOrVerify(text,before,label){
  const count=occurrences(text,before);
  if(count===0)return text;
  if(count!==1)throw new Error(`${label}: expected zero or one match, found ${count}`);
  return text.replace(before,'');
}
function ensureMarker(text){return text.includes(MARKER)?text:`// ${MARKER}\n${text}`;}
function patch(relative,transform){
  const file=path.join(ROOT,relative);
  const before=readFileSync(file,'utf8');
  const after=transform(before);
  if(after===before){console.log(`verified ${relative}`);return;}
  writeFileSync(file,after,'utf8');
  console.log(`patched ${relative}`);
}

patch('src/core/v2-types/battle-state-v2.ts',(source)=>{
  source=removeOrVerify(source,
    "export type BattleRngStateV2=Readonly<{\n  combatState:number;\n  aiState:number;\n}>;\n\n",
    'remove renamed RNG wrapper');
  source=replaceOrVerify(source,
    '  rng:BattleRngStateV2;',
    '  seed:number;\n  aiSeed:number;',
    'BattleState seed fields');
  return ensureMarker(source);
});

patch('src/core/v2-validation/battle-state-v2-validation.ts',(source)=>{
  source=replaceOrVerify(source,
    "  rng:Readonly<{combatState:number;aiState:number}>;",
    "  seed:number;\n  aiSeed:number;",
    'initial options seed fields');
  source=replaceOrVerify(source,
    "  if(!integer(options.roundIndex,1)||!integer(options.timerCombatF)||!integer(options.rng.combatState)||options.rng.combatState>0xffff_ffff||!integer(options.rng.aiState)||options.rng.aiState>0xffff_ffff)throw new TypeError('invalid round or RNG options');",
    "  if(!integer(options.roundIndex,1)||!integer(options.timerCombatF)||!integer(options.seed)||options.seed>0xffff_ffff||!integer(options.aiSeed)||options.aiSeed>0xffff_ffff)throw new TypeError('invalid round or RNG options');",
    'factory seed validation');
  source=replaceOrVerify(source,
    "    rng:Object.freeze({combatState:options.rng.combatState,aiState:options.rng.aiState}),",
    "    seed:options.seed,\n    aiSeed:options.aiSeed,",
    'factory seed storage');
  source=replaceOrVerify(source,
    "  if(!integer(fighter.combo.count))errors.push(`${path}.combo.count: non-negative integer required`);",
    "  if(fighter.combo===null||typeof fighter.combo!=='object')errors.push(`${path}.combo: required`);\n  else if(!integer(fighter.combo.count))errors.push(`${path}.combo.count: non-negative integer required`);",
    'combo fail-closed validation');
  source=replaceOrVerify(source,
    "  if(!integer(state.rng.combatState)||state.rng.combatState>0xffff_ffff||!integer(state.rng.aiState)||state.rng.aiState>0xffff_ffff)errors.push('rng: unsigned 32-bit states required');",
    "  const stateRecord=state as unknown as Readonly<Record<string,unknown>>;\n  if(!Object.hasOwn(stateRecord,'seed'))errors.push('seed: required');\n  else if(!integer(state.seed)||state.seed>0xffff_ffff)errors.push('seed: unsigned 32-bit integer required');\n  if(!Object.hasOwn(stateRecord,'aiSeed'))errors.push('aiSeed: required');\n  else if(!integer(state.aiSeed)||state.aiSeed>0xffff_ffff)errors.push('aiSeed: unsigned 32-bit integer required');",
    'state seed fail-closed validation');
  return ensureMarker(source);
});

patch('test/battle-state-v2.test.mjs',(source)=>{
  source=replaceOrVerify(source,
    "import assert from 'node:assert/strict';\nimport {readFileSync} from 'node:fs';",
    "import assert from 'node:assert/strict';\nimport {spawnSync} from 'node:child_process';\nimport {readFileSync} from 'node:fs';\nimport {fileURLToPath} from 'node:url';",
    'test imports');
  source=source.replaceAll('rng:{combatState:0x12345678,aiState:0x51a1},','seed:0x12345678,aiSeed:0x51a1,');
  source=replaceOrVerify(source,
    "assert.deepEqual(state.rng,{combatState:0x12345678,aiState:0x51a1});\nassert.deepEqual(state.fighters[0].combo,{count:0});",
    "assert.equal(state.seed,0x12345678);\nassert.equal(state.aiSeed,0x51a1);\nassert.deepEqual(state.fighters[0].combo,{count:0});\nassert.deepEqual(state.fighters[1].combo,{count:0});",
    'state seed expectations');
  source=replaceOrVerify(source,
    "const invalidRng=structuredClone(state);invalidRng.rng.combatState=0x1_0000_0000;\nassert.equal(validateBattleStateV2(invalidRng).ok,false);\nconst invalidCombo=structuredClone(state);invalidCombo.fighters[0].combo.count=-1;\nassert.equal(validateBattleStateV2(invalidCombo).ok,false);",
    "const invalidSeed=structuredClone(state);invalidSeed.seed=0x1_0000_0000;\nassert.equal(validateBattleStateV2(invalidSeed).ok,false);\nconst invalidAiSeed=structuredClone(state);invalidAiSeed.aiSeed=-1;\nassert.equal(validateBattleStateV2(invalidAiSeed).ok,false);\nconst invalidCombo=structuredClone(state);invalidCombo.fighters[0].combo.count=-1;\nassert.equal(validateBattleStateV2(invalidCombo).ok,false);",
    'invalid seed tests');
  source=replaceOrVerify(source,
    "assert.equal(state.spatial.sideSwap,false);\n\nconst normalClocks=",
    "assert.equal(state.spatial.sideSwap,false);\n\nconst distinctState=structuredClone(state);\ndistinctState.seed=0x89abcdef;\ndistinctState.aiSeed=0x10203040;\ndistinctState.fighters[0].combo.count=2;\ndistinctState.fighters[1].combo.count=7;\nassert.equal(validateBattleStateV2(distinctState).ok,true,validateBattleStateV2(distinctState).errors.join('\\n'));\nconst serialized=JSON.stringify(distinctState);\nconst deserialized=JSON.parse(serialized);\nassert.equal(deserialized.seed,0x89abcdef);\nassert.equal(deserialized.aiSeed,0x10203040);\nassert.equal(deserialized.fighters[0].combo.count,2);\nassert.equal(deserialized.fighters[1].combo.count,7);\nassert.equal(validateBattleStateV2(deserialized).ok,true,validateBattleStateV2(deserialized).errors.join('\\n'));\nassert.notEqual(hashBattleStateV2(distinctState),hashBattleStateV2(state));\nconst sameSeedClone=JSON.parse(JSON.stringify(state));\nassert.equal(hashBattleStateV2(sameSeedClone),hashBattleStateV2(state));\n\nconst missingSeed=structuredClone(state);delete missingSeed.seed;\nassert.deepEqual(validateBattleStateV2(missingSeed).errors.filter((error)=>error.startsWith('seed:')),['seed: required']);\nconst missingAiSeed=structuredClone(state);delete missingAiSeed.aiSeed;\nassert.deepEqual(validateBattleStateV2(missingAiSeed).errors.filter((error)=>error.startsWith('aiSeed:')),['aiSeed: required']);\nconst missingP1Combo=structuredClone(state);delete missingP1Combo.fighters[0].combo;\nassert.deepEqual(validateBattleStateV2(missingP1Combo).errors.filter((error)=>error.startsWith('fighters.0.combo')),['fighters.0.combo: required']);\nconst missingP2Combo=structuredClone(state);delete missingP2Combo.fighters[1].combo;\nassert.deepEqual(validateBattleStateV2(missingP2Combo).errors.filter((error)=>error.startsWith('fighters.1.combo')),['fighters.1.combo: required']);\nconst missingSeedOptions={fighters:{0:{characterId:'moguzo',maxHp:1000,maxGuard:100,maxSGauge:100,maxFocusGauge:100,maxUltimateStock:1,abilityId:'moguzo.guts'},1:{characterId:'bullet',maxHp:900,maxGuard:90,maxSGauge:100,maxFocusGauge:100,maxUltimateStock:1,abilityId:'bullet.overcharge'}},aiSeed:1,roundIndex:1,timerCombatF:5940,timeoutEnabled:true};\nassert.throws(()=>createInitialBattleStateV2(missingSeedOptions),TypeError);\n\nconst normalClocks=",
    'roundtrip and missing-field tests');
  source=replaceOrVerify(source,
    "for(const path of ['../src/core/v2-types/battle-state-v2.ts','../src/core/v2-types/move-spec-v2.ts','../src/core/v2-validation/battle-state-v2-validation.ts']){",
    "const generatedPaths=['../src/core/v2-types/battle-state-v2.ts','../src/core/v2-validation/battle-state-v2-validation.ts','../test/battle-state-v2.test.mjs','../design/combat/contracts/MAMOKEN_BATTLE_STATE_AND_MOVESPEC_V2_v0.1.md','../reports/combat/G01_COMPLETION.md'];\nconst generatedBefore=generatedPaths.map((relative)=>readFileSync(new URL(relative,import.meta.url),'utf8'));\nconst patcherRun=spawnSync(process.execPath,[fileURLToPath(new URL('../tools/apply_g01_rng_combo_fix.mjs',import.meta.url))],{cwd:fileURLToPath(new URL('..',import.meta.url)),encoding:'utf8'});\nassert.equal(patcherRun.status,0,`${patcherRun.stdout}\\n${patcherRun.stderr}`);\nconst generatedAfter=generatedPaths.map((relative)=>readFileSync(new URL(relative,import.meta.url),'utf8'));\nassert.deepEqual(generatedAfter,generatedBefore);\n\nfor(const path of ['../src/core/v2-types/battle-state-v2.ts','../src/core/v2-types/move-spec-v2.ts','../src/core/v2-validation/battle-state-v2-validation.ts']){",
    'patcher idempotence test');
  return ensureMarker(source);
});

patch('design/combat/contracts/MAMOKEN_BATTLE_STATE_AND_MOVESPEC_V2_v0.1.md',(source)=>{
  source=replaceOrVerify(source,
    'BattleStateは現行snapshotの`seed` / `aiSeed`を捨てず、unsigned 32-bitの`rng.combatState` / `rng.aiState`として保持する。各fighterは`combo.count`を持つ。これらはstate hashへ含まれる。',
    'BattleStateは現行snapshotの`seed` / `aiSeed`を名称も値も変えず、unsigned 32-bit整数として直接保持する。各fighterは`combo.count`をP1/P2別に持つ。これらはstate hashへ含まれる。',
    'design seed terminology');
  return source;
});

patch('reports/combat/G01_COMPLETION.md',(source)=>{
  source=replaceOrVerify(source,
    'BattleState now preserves current deterministic RNG values as unsigned 32-bit combat and AI states, and each fighter preserves the current combo count.',
    'BattleState now preserves current `seed` and `aiSeed` directly as unsigned 32-bit integers, and each fighter preserves its independent current `combo.count`.',
    'report seed terminology');
  return source;
});
