import { fnv1a32, stableStringify } from '../determinism.ts';
import {
  COMBAT_CONTRACT_V2,
  type CancelWindowV2,
  type CombatContractV2,
  type ContactKindV2,
  type ContactScheduleV2,
  type Current3CharacterId,
  type MoveSpecV2Closure,
  type PlayerIdV2,
  type PostureStateV2,
} from '../v2-types/combat-contract-v2.ts';

export type ValidationResultV2=Readonly<{ok:boolean;errors:readonly string[]}>;
export type MatchupRunV2=Readonly<{left:string;right:string;mirror:boolean;sideSwapped:boolean}>;

const CURRENT3=new Set<Current3CharacterId>(['moguzo','pisuke','godan']);
const STATUS=new Set(['CURRENT_ANCHOR','PROTOTYPE_CANDIDATE','FORMAL','OPEN']);
const MOVE_KIND=new Set(['strike','throw','stance']);
const FORWARD=new Set(['NONE','ONE_STEP','TWO_STEP','CHASE_TO_CONTACT','ENTER_CLINCH']);
const DOWN=new Set(['NONE','lightDown','hardDown','throwDown','ultimateDown']);
const BASIS=new Set(['FIRST_CONTACT','LAST_CONTACT','ACTION_START','ACTION_END']);

function object(value:unknown):Record<string,unknown>|null{
  return value!==null&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:null;
}
function integer(value:unknown,min=0):value is number{return Number.isInteger(value)&&Number(value)>=min;}
function text(value:unknown):value is string{return typeof value==='string'&&value.length>0;}
function push(errors:string[],condition:boolean,message:string):void{if(!condition)errors.push(message);}

function validateContactKind(value:unknown,path:string,errors:string[]):ContactKindV2|null{
  const item=object(value);if(!item){errors.push(`${path}: object required`);return null;}
  if(item.kind==='strike'){
    push(errors,['HIGH','MID','LOW'].includes(String(item.level)),`${path}.level: HIGH/MID/LOW required`);
    return item as unknown as ContactKindV2;
  }
  if(item.kind==='throw'){
    push(errors,['CLINCH_ONLY','NORMAL_SHORT','NORMAL_LONG'].includes(String(item.throwRange)),`${path}.throwRange: authoritative range required`);
    return item as unknown as ContactKindV2;
  }
  if(item.kind==='stance'){
    push(errors,text(item.stanceId),`${path}.stanceId: required`);
    return item as unknown as ContactKindV2;
  }
  errors.push(`${path}.kind: invalid tagged union`);return null;
}

function validateSchedule(value:unknown,path:string,errors:string[]):ContactScheduleV2|null{
  const item=object(value);if(!item){errors.push(`${path}: object required`);return null;}
  push(errors,item.status==='FIXED_STRUCTURE'||item.status==='OPEN_TIMING',`${path}.status: invalid`);
  push(errors,integer(item.count,1),`${path}.count: positive integer required`);
  if(item.status==='FIXED_STRUCTURE'){
    push(errors,Array.isArray(item.activeOffsetsF),`${path}.activeOffsetsF: fixed schedule required`);
    if(Array.isArray(item.activeOffsetsF)){
      push(errors,item.activeOffsetsF.length===item.count,`${path}.activeOffsetsF: count mismatch`);
      push(errors,item.activeOffsetsF.every((frame)=>integer(frame)),`${path}.activeOffsetsF: non-negative integers required`);
    }
  }else push(errors,item.activeOffsetsF===null,`${path}.activeOffsetsF: OPEN timing must remain null`);
  if(integer(item.count,1)&&item.count>1)push(errors,item.status==='OPEN_TIMING'||(Array.isArray(item.activeOffsetsF)&&item.activeOffsetsF.length===item.count),`${path}: multi-hit schedule unresolved`);
  return item as unknown as ContactScheduleV2;
}

function validateCancelWindow(value:unknown,path:string,errors:string[]):CancelWindowV2|null{
  if(value===null)return null;
  const item=object(value);if(!item){errors.push(`${path}: object or null required`);return null;}
  push(errors,STATUS.has(String(item.statusTag)),`${path}.statusTag: invalid`);
  push(errors,BASIS.has(String(item.basis)),`${path}.basis: required`);
  const open=item.statusTag==='OPEN';
  push(errors,open?item.startOffsetF===null:integer(item.startOffsetF),`${path}.startOffsetF: invalid`);
  push(errors,open?item.endOffsetF===null:integer(item.endOffsetF),`${path}.endOffsetF: invalid`);
  if(integer(item.startOffsetF)&&integer(item.endOffsetF))push(errors,item.startOffsetF<=item.endOffsetF,`${path}: start after end`);
  push(errors,Array.isArray(item.allowedMoveIds)&&item.allowedMoveIds.every(text),`${path}.allowedMoveIds: string array required`);
  push(errors,typeof item.oncePerCombo==='boolean',`${path}.oncePerCombo: boolean required`);
  return item as unknown as CancelWindowV2;
}

export function materializeMoveSpecV2Closure(document:unknown):readonly MoveSpecV2Closure[]{
  const root=object(document);if(!root||!Array.isArray(root.moves))throw new TypeError('candidate document with moves is required');
  const defaults=object(root.defaults);if(!defaults)throw new TypeError('candidate defaults are required');
  const single=defaults.singleContactSchedule;
  const empty=object(defaults.emptyCancelWindows);
  return Object.freeze(root.moves.map((raw,index)=>{
    const move=object(raw);if(!move)throw new TypeError(`moves[${index}] must be an object`);
    const cancel=Object.freeze({
      onHit:(move.cancelOnHit??empty?.onHit??null) as CancelWindowV2|null,
      onBlock:(move.cancelOnBlock??empty?.onBlock??null) as CancelWindowV2|null,
      onWhiff:(move.cancelOnWhiff??empty?.onWhiff??null) as CancelWindowV2|null,
    });
    const downType=String(move.downType);
    const kind=String(move.moveKind);
    return Object.freeze({
      id:move.id,
      characterId:move.characterId,
      slot:move.slot,
      nameJa:move.nameJa,
      statusTag:defaults.statusTag,
      authority:defaults.authority,
      sourceStatus:move.sourceStatus,
      moveKind:kind,
      contactKind:move.contactKind,
      downType,
      followupAllowed:move.followupAllowed,
      forwardMovement:move.forwardMovement,
      maximumApproachSteps:move.maximumApproachSteps,
      contactSchedule:move.contactSchedule??single,
      cancelWindows:cancel,
      resourcePolicyId:defaults.resourcePolicyId,
      advantagePolicy:kind==='throw'||kind==='stance'||downType!=='NONE'?'not_applicable':'standard_contact_formula',
    } as MoveSpecV2Closure);
  }));
}

export function validateMoveSpecV2CandidateDocument(document:unknown):ValidationResultV2{
  const errors:string[]=[];const root=object(document);
  if(!root)return Object.freeze({ok:false,errors:Object.freeze(['root: object required'])});
  push(errors,root.version==='mamoken-current3-movespec-closure-v0.2','version: invalid');
  push(errors,root.statusTag==='PROTOTYPE_CANDIDATE','statusTag: must remain PROTOTYPE_CANDIDATE');
  push(errors,root.authority==='shadow_only','authority: must remain shadow_only');
  push(errors,root.liveRuntimeAuthority===false,'liveRuntimeAuthority: must be false');
  push(errors,root.formalBalanceAuthority===false,'formalBalanceAuthority: must be false');
  push(errors,text(root.inheritsNumericCandidatesFrom),'inheritsNumericCandidatesFrom: required');
  let moves:readonly MoveSpecV2Closure[]=[];
  try{moves=materializeMoveSpecV2Closure(document);}catch(error){errors.push(error instanceof Error?error.message:String(error));}
  push(errors,moves.length===21,`moves: expected 21, found ${moves.length}`);
  push(errors,new Set(moves.map((move)=>move.id)).size===moves.length,'moves: duplicate id');
  for(const characterId of CURRENT3)push(errors,moves.filter((move)=>move.characterId===characterId).length===7,`${characterId}: seven moves required`);
  for(const [index,move] of moves.entries()){
    const path=`moves[${index}]`;
    push(errors,CURRENT3.has(move.characterId),`${path}.characterId: invalid`);
    push(errors,integer(move.slot,1)&&move.slot<=7,`${path}.slot: 1..7 required`);
    push(errors,move.id===`${move.characterId}:slot-${move.slot}`,`${path}.id: identity mismatch`);
    push(errors,text(move.nameJa),`${path}.nameJa: required`);
    push(errors,move.statusTag==='PROTOTYPE_CANDIDATE',`${path}.statusTag: candidate required`);
    push(errors,move.authority==='shadow_only',`${path}.authority: shadow_only required`);
    push(errors,MOVE_KIND.has(move.moveKind),`${path}.moveKind: invalid`);
    const contact=validateContactKind(move.contactKind,`${path}.contactKind`,errors);
    if(contact)push(errors,contact.kind===move.moveKind,`${path}: moveKind/contactKind mismatch`);
    push(errors,DOWN.has(move.downType),`${path}.downType: invalid`);
    push(errors,typeof move.followupAllowed==='boolean',`${path}.followupAllowed: boolean required`);
    push(errors,FORWARD.has(move.forwardMovement),`${path}.forwardMovement: invalid`);
    if(move.forwardMovement==='CHASE_TO_CONTACT'){
      push(errors,integer(move.maximumApproachSteps,1)&&move.maximumApproachSteps<=2,`${path}.maximumApproachSteps: 1..2 required for chase`);
    }else push(errors,move.maximumApproachSteps===null,`${path}.maximumApproachSteps: only chase may set it`);
    validateSchedule(move.contactSchedule,`${path}.contactSchedule`,errors);
    validateCancelWindow(move.cancelWindows.onHit,`${path}.cancelWindows.onHit`,errors);
    validateCancelWindow(move.cancelWindows.onBlock,`${path}.cancelWindows.onBlock`,errors);
    validateCancelWindow(move.cancelWindows.onWhiff,`${path}.cancelWindows.onWhiff`,errors);
    push(errors,move.resourcePolicyId==='resource.action-contact-v0.2',`${path}.resourcePolicyId: policy reference required`);
    const excludesAdvantage=move.moveKind==='throw'||move.moveKind==='stance'||move.downType!=='NONE';
    push(errors,move.advantagePolicy===(excludesAdvantage?'not_applicable':'standard_contact_formula'),`${path}.advantagePolicy: invalid for contact result`);
    if(move.downType==='lightDown'&&move.id==='godan:slot-6')push(errors,move.followupAllowed===false,`${path}: 根こそぎ follow-up must be disabled`);
  }
  const ts=moves.find((move)=>move.id==='pisuke:slot-7');
  push(errors,ts?.forwardMovement==='CHASE_TO_CONTACT'&&ts.maximumApproachSteps===2,'pisuke:slot-7: maximumApproachSteps=2 required');
  const multi=new Map(moves.filter((move)=>move.contactSchedule.count>1).map((move)=>[move.id,move.contactSchedule.count]));
  push(errors,multi.get('pisuke:slot-1')===2,'pisuke:slot-1: two contacts required');
  push(errors,multi.get('pisuke:slot-4')===3,'pisuke:slot-4: three contacts required');
  return Object.freeze({ok:errors.length===0,errors:Object.freeze(errors)});
}

export function validateCombatContractV2(contract:CombatContractV2=COMBAT_CONTRACT_V2):ValidationResultV2{
  const errors:string[]=[];
  push(errors,contract.statusTag==='PROTOTYPE_CANDIDATE','contract status must remain candidate');
  push(errors,!contract.liveRuntimeAuthority&&!contract.formalBalanceAuthority,'contract authority boundary violated');
  push(errors,JSON.stringify(contract.postureStates)===JSON.stringify(['NORMAL','SWAY_SHALLOW','SWAY_DEEP','CROUCH','LUNGE','CLINCH','DOWN']),'posture schema mismatch');
  push(errors,!contract.postureStates.includes('SWAY' as PostureStateV2),'legacy SWAY must not enter v2 enum');
  push(errors,contract.inputConstants.commandPrebufferF===10&&contract.inputConstants.directionHistoryF===40&&contract.inputConstants.commandTotal4F===40,'input candidates mismatch');
  push(errors,JSON.stringify(contract.inputNormalizationOrder)!==JSON.stringify(contract.actionPriorityOrder),'input order and action priority must be separate constants');
  push(errors,contract.clinch.standardDurationF===24&&contract.clinch.simultaneousForwardDurationF===18,'clinch candidates mismatch');
  push(errors,contract.cpuMatchups.nonMirrorPairCount===36&&contract.cpuMatchups.mirrorPairCount===9&&contract.cpuMatchups.sideSwappedSymmetryRuns,'CPU matchup plan mismatch');
  return Object.freeze({ok:errors.length===0,errors:Object.freeze(errors)});
}

export function reachPosturesV2(reach:0|1|2|3):readonly PostureStateV2[]{
  const sets=[['CLINCH'],['CLINCH','NORMAL'],['CLINCH','NORMAL','SWAY_SHALLOW'],['CLINCH','NORMAL','SWAY_SHALLOW','SWAY_DEEP']] as const;
  return Object.freeze([...sets[reach]]);
}

export function buildCpuMatchupRunsV2(roster:readonly string[]=COMBAT_CONTRACT_V2.cpuMatchups.roster):readonly MatchupRunV2[]{
  const runs:MatchupRunV2[]=[];
  for(let left=0;left<roster.length;left++)for(let right=left;right<roster.length;right++)runs.push(Object.freeze({left:roster[left],right:roster[right],mirror:left===right,sideSwapped:true}));
  return Object.freeze(runs);
}

export function findCancelCyclesV2(moves:readonly MoveSpecV2Closure[]):readonly (readonly string[])[]{
  const graph=new Map<string,readonly string[]>();
  for(const move of moves)graph.set(move.id,Object.freeze([move.cancelWindows.onHit,move.cancelWindows.onBlock,move.cancelWindows.onWhiff].flatMap((window)=>window?.allowedMoveIds??[])));
  const cycles:string[][]=[];const visiting=new Set<string>();const path:string[]=[];
  function visit(id:string):void{
    const at=path.indexOf(id);if(at>=0){cycles.push([...path.slice(at),id]);return;}
    if(visiting.has(id))return;visiting.add(id);path.push(id);
    for(const next of graph.get(id)??[])if(graph.has(next))visit(next);
    path.pop();visiting.delete(id);
  }
  for(const id of graph.keys())visit(id);
  const unique=new Map(cycles.map((cycle)=>[cycle.join('>'),Object.freeze(cycle)]));
  return Object.freeze([...unique.values()]);
}

export function swapPlayerPairV2<T>(pair:Readonly<Record<PlayerIdV2,T>>):Readonly<Record<PlayerIdV2,T>>{
  return Object.freeze({0:pair[1],1:pair[0]});
}

export function hashCombatContractClosureV2(contract:CombatContractV2,moves:readonly MoveSpecV2Closure[]):string{
  return fnv1a32(stableStringify({contract,moves}));
}
