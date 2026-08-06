import {readFileSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const MARKER='G01.1 current gauge schema correction';

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
    "  maxSGauge:number;\n  maxRoarGauge:number;\n  abilityId:string;",
    "  maxSGauge:number;\n  maxFocusGauge:number;\n  maxUltimateStock:number;\n  abilityId:string;",
    'fighter seed gauges');
  source=replaceOnce(source,
    "  if(!integer(seed.maxHp,1)||!integer(seed.maxGuard,1)||!integer(seed.maxSGauge,1)||!integer(seed.maxRoarGauge,1)||!text(seed.abilityId))throw new TypeError(`player ${playerId}: invalid fighter seed`);",
    "  if(!integer(seed.maxHp,1)||!integer(seed.maxGuard,1)||!integer(seed.maxSGauge,1)||!integer(seed.maxFocusGauge,1)||!integer(seed.maxUltimateStock,1)||!text(seed.abilityId))throw new TypeError(`player ${playerId}: invalid fighter seed`);",
    'seed validation');
  source=replaceOnce(source,
    "    resources:Object.freeze({hp:seed.maxHp,maxHp:seed.maxHp,guard:seed.maxGuard,maxGuard:seed.maxGuard,sGauge:0,maxSGauge:seed.maxSGauge,roarGauge:0,maxRoarGauge:seed.maxRoarGauge}),",
    "    resources:Object.freeze({hp:seed.maxHp,maxHp:seed.maxHp,guard:seed.maxGuard,maxGuard:seed.maxGuard,sGauge:0,maxSGauge:seed.maxSGauge,focusGauge:0,maxFocusGauge:seed.maxFocusGauge,ultimateStock:0,maxUltimateStock:seed.maxUltimateStock}),",
    'resource factory');
  source=replaceOnce(source,
    "  for(const [value,max,key] of [[fighter.resources.hp,fighter.resources.maxHp,'hp'],[fighter.resources.guard,fighter.resources.maxGuard,'guard'],[fighter.resources.sGauge,fighter.resources.maxSGauge,'sGauge'],[fighter.resources.roarGauge,fighter.resources.maxRoarGauge,'roarGauge']] as const){",
    "  for(const [value,max,key] of [[fighter.resources.hp,fighter.resources.maxHp,'hp'],[fighter.resources.guard,fighter.resources.maxGuard,'guard'],[fighter.resources.sGauge,fighter.resources.maxSGauge,'sGauge'],[fighter.resources.focusGauge,fighter.resources.maxFocusGauge,'focusGauge'],[fighter.resources.ultimateStock,fighter.resources.maxUltimateStock,'ultimateStock']] as const){",
    'resource validation');
  return `// ${MARKER}\n${source}`;
});

patch('test/battle-state-v2.test.mjs',(source)=>{
  source=source.replaceAll("maxSGauge:100,maxRoarGauge:100","maxSGauge:100,maxFocusGauge:100,maxUltimateStock:1");
  source=replaceOnce(source,"assert.equal(BATTLE_STATE_V2_VERSION,'mamoken-battle-state-v2-v0.1');","assert.equal(BATTLE_STATE_V2_VERSION,'mamoken-battle-state-v2-v0.2');",'version expectation');
  source=replaceOnce(source,"assert.equal(state.version,'mamoken-battle-state-v2-v0.1');","assert.equal(state.version,'mamoken-battle-state-v2-v0.2');",'state version expectation');
  source=replaceOnce(source,
    "assert.equal(state.fighters[0].bulletCharge,null);",
    "assert.deepEqual(state.fighters[0].resources,{hp:1000,maxHp:1000,guard:100,maxGuard:100,sGauge:0,maxSGauge:100,focusGauge:0,maxFocusGauge:100,ultimateStock:0,maxUltimateStock:1});\nassert.equal(state.fighters[0].bulletCharge,null);",
    'resource expectation');
  source=replaceOnce(source,
    "const invalidBullet=structuredClone(state);invalidBullet.fighters[1].bulletCharge.maxReady=true;",
    "const invalidFocus=structuredClone(state);invalidFocus.fighters[0].resources.focusGauge=101;\nassert.equal(validateBattleStateV2(invalidFocus).ok,false);\nconst invalidUlt=structuredClone(state);invalidUlt.fighters[0].resources.ultimateStock=2;\nassert.equal(validateBattleStateV2(invalidUlt).ok,false);\nconst invalidBullet=structuredClone(state);invalidBullet.fighters[1].bulletCharge.maxReady=true;",
    'invalid gauge cases');
  source=replaceOnce(source,
    "console.log(`battle state v2 tests passed; moves=21; openNumerics=21; reasons=${RESOLUTION_REASON_CODES_V2.length}; clocks=3; hash=${stateHash}`);",
    "console.log(`battle state v2 tests passed; moves=21; openNumerics=21; reasons=${RESOLUTION_REASON_CODES_V2.length}; clocks=3; currentGauges=s+focus+ult+charge; hash=${stateHash}`);",
    'console summary');
  return `// ${MARKER}\n${source}`;
});

patch('design/combat/contracts/MAMOKEN_BATTLE_STATE_AND_MOVESPEC_V2_v0.1.md',(source)=>{
  source=replaceOnce(source,'# マモ拳 BattleState V2 / MoveSpec V2 schema v0.1','# マモ拳 BattleState V2 / MoveSpec V2 schema v0.2','document version');
  source=replaceOnce(source,
    '## 5. SpatialPairState V2',
    `## 5. Current gauge schema\n\n${MARKER}. 現行runtime正本に合わせ、fighter resourcesは次を保持する。\n\n\`\`\`text\nhp / maxHp\nguard / maxGuard\nsGauge / maxSGauge\nfocusGauge / maxFocusGauge\nultimateStock / maxUltimateStock\n\`\`\`\n\nBulletのchargeはresourcesへ混ぜず、引き続きBulletChargeStateで管理する。独立したroarGaugeは現行正本に存在しないため削除する。ContactResultはS / focus / ultimate / Bullet chargeのdeltaを別々に持つ。\n\n## 6. SpatialPairState V2`,
    'gauge section');
  source=source.replaceAll('## 6. Full MoveSpec V2','## 7. Full MoveSpec V2')
    .replaceAll('## 7. TaggedValue','## 8. TaggedValue')
    .replaceAll('## 8. G00 closureからの変換','## 9. G00 closureからの変換')
    .replaceAll('## 9. Intent / Result','## 10. Intent / Result')
    .replaceAll('## 10. 理由コード','## 11. 理由コード')
    .replaceAll('## 11. 対称性','## 12. 対称性')
    .replaceAll('## 12. 非目標','## 13. 非目標')
    .replaceAll('## 13. 後続','## 14. 後続');
  return source;
});

patch('reports/combat/G01_COMPLETION.md',(source)=>{
  source=replaceOnce(source,'# G01 Completion Report — BattleState V2 / Full MoveSpec V2 Schema v0.1','# G01 Completion Report — BattleState V2 / Full MoveSpec V2 Schema v0.2','report version');
  source=replaceOnce(source,
    '## Three clocks',
    `## Current gauge correction\n\n${MARKER}. The BattleState resource schema now matches the current runtime gauge source:\n\n- S gauge\n- focus gauge\n- ultimate stock\n- Bullet charge in separate BulletChargeState\n\nThe unsupported standalone roar gauge fields were removed. ContactResult now exposes separate S, focus, ultimate, and Bullet-charge deltas.\n\n## Three clocks`,
    'report gauge section');
  return source;
});
