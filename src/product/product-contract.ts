import type {
  ProductCompletionInput,
  ProductCompletionResult,
  ProductContract,
  ProductDecision,
  ProductDecisionStatus,
  ProductOwner,
  ProductPhaseContract,
  ProductPhaseId,
  ProductWorkStatus,
} from './product-types.ts';

export const PRODUCT_CONTRACT_VERSION='mamoken-product-contract-v1' as const;

const ALLOWED_ROOTS=Object.freeze([
  'design/product/',
  'src/product/',
  'test/product-',
  'reports/product/',
  '.github/workflows/product-contract.yml',
  'package.json',
  'tsconfig.product.json',
]);

const FORBIDDEN_ROOTS=Object.freeze([
  'prototype/',
  'dist/',
  'runtime/',
  'server/',
  'assets/',
  'src/core/',
  'design/combat/',
]);

const OWNERS=new Set<ProductOwner>(['product','qa','save','ux','accessibility','platform','performance','online_ops','legal','tutorial','localization','release']);

function authority(){
  return Object.freeze({allowedRoots:ALLOWED_ROOTS,forbiddenRoots:FORBIDDEN_ROOTS,combatAuthority:false as const,runtimeAuthority:false as const,onlineProtocolAuthority:false as const});
}

const PHASES=Object.freeze([
  {id:'P00',name:'Product source-of-truth / naming / diff governance',owner:'product',status:'COMPLETE',dependsOn:[],deliverableIds:['product.source_precedence','product.phase_ids','product.naming','product.pending_policy','product.completion_gate','product.scoped_diff_gate','product.rollback_policy','product.ci']},
  {id:'P01',name:'QA foundation',owner:'qa',status:'PENDING',dependsOn:['P00'],deliverableIds:['qa.matrix','qa.smoke','qa.regression']},
  {id:'P02',name:'Save and migration',owner:'save',status:'PENDING',dependsOn:['P00','P01'],deliverableIds:['save.schema','save.migration','save.corruption_recovery']},
  {id:'P03',name:'Menus and product navigation',owner:'ux',status:'PENDING',dependsOn:['P00','P02'],deliverableIds:['menu.flow','menu.settings','menu.confirmations']},
  {id:'P04',name:'Accessibility',owner:'accessibility',status:'PENDING',dependsOn:['P00','P03'],deliverableIds:['accessibility.motion','accessibility.flashes','accessibility.input','accessibility.text']},
  {id:'P05',name:'Device lifecycle',owner:'platform',status:'PENDING',dependsOn:['P00','P02'],deliverableIds:['lifecycle.pause_resume','lifecycle.background','lifecycle.orientation']},
  {id:'P06',name:'Performance budgets',owner:'performance',status:'PENDING',dependsOn:['P00','P01'],deliverableIds:['performance.frame_budget','performance.memory_budget','performance.asset_budget']},
  {id:'P07',name:'Online operations UX',owner:'online_ops',status:'PENDING',dependsOn:['P00','P03','P05'],deliverableIds:['online.reconnect','online.error_ux','online.maintenance']},
  {id:'P08',name:'Rights and compliance',owner:'legal',status:'PENDING',dependsOn:['P00'],deliverableIds:['rights.assets','rights.audio','rights.privacy']},
  {id:'P09',name:'Tutorial and onboarding',owner:'tutorial',status:'PENDING',dependsOn:['P00','P03','P04'],deliverableIds:['tutorial.first_match','tutorial.controls','tutorial.practice']},
  {id:'P10',name:'Localization',owner:'localization',status:'PENDING',dependsOn:['P00','P03'],deliverableIds:['localization.keys','localization.fallback','localization.layout']},
  {id:'P11',name:'Release readiness',owner:'release',status:'PENDING',dependsOn:['P01','P02','P03','P04','P05','P06','P07','P08','P09','P10'],deliverableIds:['release.checklist','release.channel_gate','release.rollback_drill']},
].map((phase)=>Object.freeze({...phase,dependsOn:Object.freeze(phase.dependsOn),deliverableIds:Object.freeze(phase.deliverableIds),authority:authority()})) as readonly ProductPhaseContract[]);

export const PRODUCT_CONTRACT:ProductContract=Object.freeze({
  version:PRODUCT_CONTRACT_VERSION,
  sourcePrecedence:Object.freeze([
    'explicit current decision',
    'versioned product contract',
    'completion report',
    'implementation and tests',
    'roadmap or proposal',
  ]),
  phases:PHASES,
  settingIds:Object.freeze([
    'settings.audio.master','settings.audio.bgm','settings.audio.sfx',
    'settings.accessibility.screen_shake','settings.accessibility.flashes',
    'settings.input.haptics','settings.language.locale',
  ]),
  saveKeys:Object.freeze(['mamoken.save.v1','mamoken.settings.v1','mamoken.replay.v1']),
  errorClasses:Object.freeze(['VALIDATION','STORAGE','NETWORK','PROTOCOL','ASSET','LIFECYCLE','UNKNOWN']),
  releaseChannels:Object.freeze(['local','preview','staging','production']),
  statusTransitions:Object.freeze({
    PENDING:Object.freeze(['OPEN','BLOCKED']),
    OPEN:Object.freeze(['IN_PROGRESS','BLOCKED']),
    IN_PROGRESS:Object.freeze(['COMPLETE','BLOCKED','OPEN']),
    BLOCKED:Object.freeze(['OPEN','IN_PROGRESS']),
    COMPLETE:Object.freeze([]),
  }),
  decisionTransitions:Object.freeze({
    PENDING:Object.freeze(['OPEN']),
    OPEN:Object.freeze(['PENDING','FORMAL']),
    FORMAL:Object.freeze(['OPEN']),
  }),
  defaultRollback:Object.freeze({
    trigger:'completion gate regression or scoped-diff violation',
    rollbackTarget:'last green product contract commit',
    preservedData:Object.freeze(['user save data','user settings','diagnostic evidence']),
    verification:'rerun product contract and affected phase smoke tests',
  }),
});

function stable(value:unknown):string{
  if(value===null||typeof value!=='object')return JSON.stringify(value);
  if(Array.isArray(value))return`[${value.map(stable).join(',')}]`;
  const record=value as Record<string,unknown>;
  return`{${Object.keys(record).sort().map((key)=>`${JSON.stringify(key)}:${stable(record[key])}`).join(',')}}`;
}
function fnv1a(text:string):string{
  let hash=0x811c9dc5;
  for(let index=0;index<text.length;index++){hash^=text.charCodeAt(index);hash=Math.imul(hash,0x01000193)>>>0;}
  return hash.toString(16).padStart(8,'0');
}

export function hashProductContract(contract:ProductContract=PRODUCT_CONTRACT):string{return fnv1a(stable(contract));}

export function canTransitionProductStatus(from:ProductWorkStatus,to:ProductWorkStatus,contract:ProductContract=PRODUCT_CONTRACT):boolean{
  return contract.statusTransitions[from].includes(to);
}

export function canTransitionDecisionStatus(from:ProductDecisionStatus,to:ProductDecisionStatus,contract:ProductContract=PRODUCT_CONTRACT):boolean{
  return contract.decisionTransitions[from].includes(to);
}

export function validateProductDecision(decision:ProductDecision):readonly string[]{
  const errors:string[]=[];
  if(!decision.id)errors.push('decision.id required');
  if(decision.status==='FORMAL'){
    if(decision.value===null||decision.value==='UNKNOWN')errors.push(`${decision.id}: FORMAL value must be resolved`);
    if(!decision.sourceRef)errors.push(`${decision.id}: FORMAL sourceRef required`);
  }
  if((decision.status==='PENDING'||decision.status==='OPEN')&&decision.value!==null)errors.push(`${decision.id}: unresolved decision value must remain null`);
  return Object.freeze(errors);
}

export function validateProductContract(contract:ProductContract=PRODUCT_CONTRACT):readonly string[]{
  const errors:string[]=[];
  const expected=Array.from({length:12},(_,index)=>`P${String(index).padStart(2,'0')}`);
  const ids=contract.phases.map((phase)=>phase.id);
  if(JSON.stringify(ids)!==JSON.stringify(expected))errors.push('phase IDs must be stable P00..P11');
  if(new Set(ids).size!==12)errors.push('duplicate phase ID');
  for(const phase of contract.phases){
    if(!OWNERS.has(phase.owner))errors.push(`${phase.id}: invalid owner`);
    if(new Set(phase.deliverableIds).size!==phase.deliverableIds.length)errors.push(`${phase.id}: duplicate deliverable ID`);
    for(const dependency of phase.dependsOn){
      if(!ids.includes(dependency))errors.push(`${phase.id}: unknown dependency ${dependency}`);
      if(ids.indexOf(dependency)>=ids.indexOf(phase.id))errors.push(`${phase.id}: dependency must precede phase`);
    }
    if(phase.authority.combatAuthority||phase.authority.runtimeAuthority||phase.authority.onlineProtocolAuthority)errors.push(`${phase.id}: forbidden authority`);
    if(JSON.stringify(phase.authority.forbiddenRoots)!==JSON.stringify(FORBIDDEN_ROOTS))errors.push(`${phase.id}: forbidden roots changed`);
  }
  for(const values of [contract.settingIds,contract.saveKeys,contract.errorClasses,contract.releaseChannels])if(new Set(values).size!==values.length)errors.push('stable identifier set contains duplicates');
  if(JSON.stringify(contract.releaseChannels)!==JSON.stringify(['local','preview','staging','production']))errors.push('release channels changed');
  if(contract.phases[0].status!=='COMPLETE')errors.push('P00 must be complete in product contract v1');
  if(contract.phases.slice(1).some((phase)=>phase.status!=='PENDING'))errors.push('P01..P11 must remain pending at P00 completion');
  return Object.freeze(errors);
}

export function evaluateProductCompletion(input:ProductCompletionInput,contract:ProductContract=PRODUCT_CONTRACT):ProductCompletionResult{
  const blockers:string[]=[];
  const phase=contract.phases.find((candidate)=>candidate.id===input.phaseId);
  if(!phase)return Object.freeze({complete:false,blockers:Object.freeze([`${input.phaseId}: unknown phase`])});
  for(const deliverableId of phase.deliverableIds)if(input.deliverables[deliverableId]!==true)blockers.push(`deliverable:${deliverableId}`);
  for(const decision of input.decisions){
    for(const error of validateProductDecision(decision))blockers.push(`decision:${error}`);
    if(decision.status!=='FORMAL')blockers.push(`decision:${decision.id}:${decision.status}`);
  }
  if(!input.testsPassed)blockers.push('tests');
  if(!input.scopedDiffPassed)blockers.push('scoped-diff');
  if(!input.rollbackNote)blockers.push('rollback-note');
  else if(!input.rollbackNote.trigger||!input.rollbackNote.rollbackTarget||!input.rollbackNote.verification)blockers.push('rollback-note-incomplete');
  return Object.freeze({complete:blockers.length===0,blockers:Object.freeze([...new Set(blockers)])});
}

export function validateProductScopedPaths(paths:readonly string[],contract:ProductContract=PRODUCT_CONTRACT):readonly string[]{
  const errors:string[]=[];
  for(const path of paths){
    const forbidden=FORBIDDEN_ROOTS.find((root)=>path.startsWith(root));
    if(forbidden){errors.push(`${path}: forbidden root ${forbidden}`);continue;}
    if(!ALLOWED_ROOTS.some((root)=>root.endsWith('/')?path.startsWith(root):path===root||path.startsWith(root)))errors.push(`${path}: outside P00 scope`);
  }
  return Object.freeze(errors);
}

export function buildProductContractReport(contract:ProductContract=PRODUCT_CONTRACT){
  const validation=validateProductContract(contract);
  return Object.freeze({
    version:contract.version,
    phaseCount:contract.phases.length,
    completePhases:contract.phases.filter((phase)=>phase.status==='COMPLETE').map((phase)=>phase.id),
    pendingPhases:contract.phases.filter((phase)=>phase.status==='PENDING').map((phase)=>phase.id),
    settingCount:contract.settingIds.length,
    saveKeyCount:contract.saveKeys.length,
    errorClassCount:contract.errorClasses.length,
    releaseChannels:contract.releaseChannels,
    validationErrors:validation,
    hash:hashProductContract(contract),
  });
}
