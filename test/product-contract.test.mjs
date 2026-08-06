import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
  PRODUCT_CONTRACT,
  PRODUCT_CONTRACT_VERSION,
  buildProductContractReport,
  canTransitionDecisionStatus,
  canTransitionProductStatus,
  evaluateProductCompletion,
  hashProductContract,
  validateProductContract,
  validateProductDecision,
  validateProductScopedPaths,
} from '../src/product/index.ts';

const plain=(value)=>JSON.parse(JSON.stringify(value));

assert.equal(PRODUCT_CONTRACT_VERSION,'mamoken-product-contract-v1');
assert.deepEqual(validateProductContract(),[]);
assert.deepEqual(PRODUCT_CONTRACT.phases.map((phase)=>phase.id),['P00','P01','P02','P03','P04','P05','P06','P07','P08','P09','P10','P11']);
assert.equal(PRODUCT_CONTRACT.phases.length,12);
assert.equal(new Set(PRODUCT_CONTRACT.phases.map((phase)=>phase.owner)).size,12);
assert.equal(PRODUCT_CONTRACT.phases[0].status,'COMPLETE');
assert.ok(PRODUCT_CONTRACT.phases.slice(1).every((phase)=>phase.status==='PENDING'));
assert.ok(PRODUCT_CONTRACT.phases.every((phase)=>phase.authority.combatAuthority===false));
assert.ok(PRODUCT_CONTRACT.phases.every((phase)=>phase.authority.runtimeAuthority===false));
assert.ok(PRODUCT_CONTRACT.phases.every((phase)=>phase.authority.onlineProtocolAuthority===false));
assert.ok(PRODUCT_CONTRACT.phases.every((phase)=>phase.authority.forbiddenRoots.includes('prototype/')));
assert.ok(PRODUCT_CONTRACT.phases.every((phase)=>phase.authority.forbiddenRoots.includes('src/core/')));

assert.deepEqual(PRODUCT_CONTRACT.settingIds,[
  'settings.audio.master','settings.audio.bgm','settings.audio.sfx',
  'settings.accessibility.screen_shake','settings.accessibility.flashes',
  'settings.input.haptics','settings.language.locale',
]);
assert.deepEqual(PRODUCT_CONTRACT.saveKeys,['mamoken.save.v1','mamoken.settings.v1','mamoken.replay.v1']);
assert.deepEqual(PRODUCT_CONTRACT.errorClasses,['VALIDATION','STORAGE','NETWORK','PROTOCOL','ASSET','LIFECYCLE','UNKNOWN']);
assert.deepEqual(PRODUCT_CONTRACT.releaseChannels,['local','preview','staging','production']);
for(const values of [PRODUCT_CONTRACT.settingIds,PRODUCT_CONTRACT.saveKeys,PRODUCT_CONTRACT.errorClasses,PRODUCT_CONTRACT.releaseChannels])assert.equal(new Set(values).size,values.length);

assert.equal(canTransitionProductStatus('PENDING','OPEN'),true);
assert.equal(canTransitionProductStatus('PENDING','COMPLETE'),false);
assert.equal(canTransitionProductStatus('OPEN','IN_PROGRESS'),true);
assert.equal(canTransitionProductStatus('IN_PROGRESS','COMPLETE'),true);
assert.equal(canTransitionProductStatus('COMPLETE','OPEN'),false);
assert.equal(canTransitionDecisionStatus('PENDING','FORMAL'),false);
assert.equal(canTransitionDecisionStatus('PENDING','OPEN'),true);
assert.equal(canTransitionDecisionStatus('OPEN','FORMAL'),true);
assert.equal(canTransitionDecisionStatus('FORMAL','OPEN'),true);

assert.deepEqual(validateProductDecision({id:'decision.locale',status:'PENDING',value:null,sourceRef:null,note:null}),[]);
assert.deepEqual(validateProductDecision({id:'decision.locale',status:'OPEN',value:null,sourceRef:null,note:'under review'}),[]);
assert.deepEqual(validateProductDecision({id:'decision.locale',status:'FORMAL',value:'ja-JP',sourceRef:'product-contract-v1',note:null}),[]);
assert.ok(validateProductDecision({id:'decision.locale',status:'FORMAL',value:null,sourceRef:null,note:null}).length>=2);
assert.ok(validateProductDecision({id:'decision.locale',status:'FORMAL',value:'UNKNOWN',sourceRef:'x',note:null}).length>=1);
assert.ok(validateProductDecision({id:'decision.locale',status:'OPEN',value:'ja-JP',sourceRef:null,note:null}).length>=1);

const p00=PRODUCT_CONTRACT.phases[0];
const allDeliverables=Object.fromEntries(p00.deliverableIds.map((id)=>[id,true]));
const formalDecision={id:'product.naming.base',status:'FORMAL',value:'stable-dot-id',sourceRef:'MAMOKEN_PRODUCT_SOURCE_OF_TRUTH_v1.0.md',note:null};
const complete=evaluateProductCompletion({
  phaseId:'P00',deliverables:allDeliverables,decisions:[formalDecision],testsPassed:true,scopedDiffPassed:true,rollbackNote:PRODUCT_CONTRACT.defaultRollback,
});
assert.deepEqual(complete,{complete:true,blockers:[]});
const blocked=evaluateProductCompletion({
  phaseId:'P00',deliverables:{...allDeliverables,'product.ci':false},decisions:[{...formalDecision,status:'OPEN',value:null,sourceRef:null}],testsPassed:false,scopedDiffPassed:false,rollbackNote:null,
});
assert.equal(blocked.complete,false);
assert.ok(blocked.blockers.includes('deliverable:product.ci'));
assert.ok(blocked.blockers.includes('decision:product.naming.base:OPEN'));
assert.ok(blocked.blockers.includes('tests'));
assert.ok(blocked.blockers.includes('scoped-diff'));
assert.ok(blocked.blockers.includes('rollback-note'));
assert.deepEqual(evaluateProductCompletion({phaseId:'P99',deliverables:{},decisions:[],testsPassed:true,scopedDiffPassed:true,rollbackNote:PRODUCT_CONTRACT.defaultRollback}),{complete:false,blockers:['P99: unknown phase']});

const allowed=[
  'design/product/MAMOKEN_PRODUCT_SOURCE_OF_TRUTH_v1.0.md',
  'src/product/product-types.ts','src/product/product-contract.ts','src/product/index.ts',
  'test/product-contract.test.mjs','reports/product/P00_COMPLETION.md',
  '.github/workflows/product-contract.yml','package.json','tsconfig.product.json',
];
assert.deepEqual(validateProductScopedPaths(allowed),[]);
for(const forbidden of ['prototype/x.html','dist/x.html','runtime/x.js','server/x.js','assets/x.webp','src/core/types.ts','design/combat/x.md'])assert.ok(validateProductScopedPaths([forbidden])[0].includes('forbidden root'));
for(const lookalike of ['package.jsonx','tsconfig.product.json.bak','.github/workflows/product-contract.yml.disabled','test/product-contract.test.mjsx','test/product-other.mjs','README.md'])assert.ok(validateProductScopedPaths([lookalike])[0].includes('outside P00 scope'),lookalike);

const report=buildProductContractReport();
assert.equal(report.version,'mamoken-product-contract-v1');
assert.equal(report.phaseCount,12);
assert.deepEqual(report.completePhases,['P00']);
assert.deepEqual(report.pendingPhases,['P01','P02','P03','P04','P05','P06','P07','P08','P09','P10','P11']);
assert.equal(report.settingCount,7);
assert.equal(report.saveKeyCount,3);
assert.equal(report.errorClassCount,7);
assert.deepEqual(report.validationErrors,[]);
assert.match(report.hash,/^[0-9a-f]{8}$/);
assert.equal(report.hash,hashProductContract());
assert.deepEqual(plain(buildProductContractReport()),plain(report));
const changed={...PRODUCT_CONTRACT,releaseChannels:['local','production']};
assert.notEqual(hashProductContract(changed),report.hash);

const design=readFileSync(new URL('../design/product/MAMOKEN_PRODUCT_SOURCE_OF_TRUTH_v1.0.md',import.meta.url),'utf8');
for(const token of ['P00','P11','PENDING','OPEN','FORMAL','completion gate','scoped diff gate','Rollback note','mamoken.save.v1','production'])assert.ok(design.includes(token),`design missing ${token}`);
for(const path of ['../src/product/product-types.ts','../src/product/product-contract.ts']){
  const source=readFileSync(new URL(path,import.meta.url),'utf8');
  const imports=[...source.matchAll(/from\s+['"]([^'"]+)['"]/g)].map((match)=>match[1]);
  assert.ok(imports.every((specifier)=>specifier.startsWith('./')),`${path}: product source may only import sibling product modules`);
  for(const forbiddenApi of ['Math.random','Date.now','document.','window.','localStorage','sessionStorage','fetch(','XMLHttpRequest','WebSocket'])assert.equal(source.includes(forbiddenApi),false,`${path}: forbidden API ${forbiddenApi}`);
}

console.log(`product contract tests passed; phases=12; P00=complete; pending=11; settings=7; saveKeys=3; channels=4; hash=${report.hash}`);
