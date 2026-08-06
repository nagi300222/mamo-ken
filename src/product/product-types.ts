export type ProductPhaseId='P00'|'P01'|'P02'|'P03'|'P04'|'P05'|'P06'|'P07'|'P08'|'P09'|'P10'|'P11';
export type ProductOwner='product'|'qa'|'save'|'ux'|'accessibility'|'platform'|'performance'|'online_ops'|'legal'|'tutorial'|'localization'|'release';
export type ProductWorkStatus='PENDING'|'OPEN'|'IN_PROGRESS'|'BLOCKED'|'COMPLETE';
export type ProductDecisionStatus='PENDING'|'OPEN'|'FORMAL';
export type ReleaseChannel='local'|'preview'|'staging'|'production';
export type ProductErrorClass='VALIDATION'|'STORAGE'|'NETWORK'|'PROTOCOL'|'ASSET'|'LIFECYCLE'|'UNKNOWN';

export type ProductAuthorityBoundary=Readonly<{
  allowedRoots:readonly string[];
  forbiddenRoots:readonly string[];
  combatAuthority:false;
  runtimeAuthority:false;
  onlineProtocolAuthority:false;
}>;

export type ProductDecision<T=unknown>=Readonly<{
  id:string;
  status:ProductDecisionStatus;
  value:T|null;
  sourceRef:string|null;
  note:string|null;
}>;

export type ProductPhaseContract=Readonly<{
  id:ProductPhaseId;
  name:string;
  owner:ProductOwner;
  status:ProductWorkStatus;
  dependsOn:readonly ProductPhaseId[];
  deliverableIds:readonly string[];
  authority:ProductAuthorityBoundary;
}>;

export type ProductSettingId=
  |'settings.audio.master'
  |'settings.audio.bgm'
  |'settings.audio.sfx'
  |'settings.accessibility.screen_shake'
  |'settings.accessibility.flashes'
  |'settings.input.haptics'
  |'settings.language.locale';

export type ProductSaveKey='mamoken.save.v1'|'mamoken.settings.v1'|'mamoken.replay.v1';

export type RollbackNote=Readonly<{
  trigger:string;
  rollbackTarget:string;
  preservedData:readonly string[];
  verification:string;
}>;

export type ProductCompletionInput=Readonly<{
  phaseId:ProductPhaseId;
  deliverables:Readonly<Record<string,boolean>>;
  decisions:readonly ProductDecision[];
  testsPassed:boolean;
  scopedDiffPassed:boolean;
  rollbackNote:RollbackNote|null;
}>;

export type ProductCompletionResult=Readonly<{
  complete:boolean;
  blockers:readonly string[];
}>;

export type ProductContract=Readonly<{
  version:'mamoken-product-contract-v1';
  sourcePrecedence:readonly string[];
  phases:readonly ProductPhaseContract[];
  settingIds:readonly ProductSettingId[];
  saveKeys:readonly ProductSaveKey[];
  errorClasses:readonly ProductErrorClass[];
  releaseChannels:readonly ReleaseChannel[];
  statusTransitions:Readonly<Record<ProductWorkStatus,readonly ProductWorkStatus[]>>;
  decisionTransitions:Readonly<Record<ProductDecisionStatus,readonly ProductDecisionStatus[]>>;
  defaultRollback:RollbackNote;
}>;
