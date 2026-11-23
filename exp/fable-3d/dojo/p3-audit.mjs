// Offline, reproducible P3 comparison. Never modifies the gameplay policy or
// claims CPU win rate is human competitive balance.
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {dirname,resolve} from 'node:path';
import {fightFeelFor} from './fight-feel.js';
import {specialHitstunP3} from './special-balance-p3.js';
const here=dirname(fileURLToPath(import.meta.url));
const engine=process.env.MAMOKEN_ENGINE_DIR??here;
const out=process.env.MAMOKEN_AUDIT_DIR??resolve(here,'../../../docs/mamoken-p3/proposal');
const baseSha=process.env.MAMOKEN_AUDIT_BASE_SHA??'8ab8972295d059426b858d9b8edabfda6068a7a3';
mkdirSync(out,{recursive:true});
const {Battle}=await import(pathToFileURL(resolve(engine,'battle.js')));
const {IDS,normalMove,specialMove,ROSTER}=await import(pathToFileURL(resolve(engine,'balance.js')));
const contactSource=await import(pathToFileURL(resolve(engine,existsSync(resolve(engine,'normal-contact-source.js'))?'normal-contact-source.js':'normal-contacts-v151.js')));
const {NORMAL_CONTACTS}=contactSource,normalVersion=contactSource.ACTIVE_NORMAL_MOTION_VERSION??'v15';
const slots=['stand_weak','stand_heavy','crouch_weak','crouch_heavy','air_weak','air_heavy'];
const roles={
 moguzo:['万能/根性','突出した距離と高速連打は持たない'],pisuke:['機動/蹴り/差し返し','低い体力とガード耐久'],
 godan:['重量/装甲/大打撃','遅い移動と大きな予備・ガードリスク'],hakuma:['守勢/掌の押し返し','追い掛け性能が低い'],
 chirka:['フェイント/可変タイミング','一撃の威力と耐久が低い'],takimaru:['近接/掴み','接近までにリスクがある'],
 yomikage:['見切り/反撃','読まれた当て身の大きな隙'],bullet:['長尾/距離支配','尾の内側と空振りの戻り'],
 dark_moguzo:['高速/連係','低耐久と切り返されるリスク']
};
const specialRoles={projectile:'牽制/位置を動かす',anti:'対空/迎撃',dash:'前進/ライン回復',strike:'間合いで押す',throw:'接近/拘束',counter:'読み/反撃',tail:'長尾/距離支配'};
const catalog=[];
for(const id of IDS){
 const hash=createHash('sha256').update(readFileSync(resolve(here,`../chars/${id}/${id}.glb`))).digest('hex');
 const manifest=JSON.parse(readFileSync(resolve(here,`../cinematic/v14/${id}/manifest.json`)));
 for(const moveId of [...slots,'s1','s2','s3']){
  const normal=slots.includes(moveId),move=normal?normalMove(id,moveId):specialMove(id,Number(moveId[1])-1);
  const authored=normal?NORMAL_CONTACTS[id][moveId]:manifest.moves.find(row=>row.moveId===moveId);
  const feel=fightFeelFor(id,moveId,move),paired=move.kind==='throw'||move.kind==='counter';
  const oldHitstun=normal?move.hitstun:move.kind==='throw'?'paired40':move.kind==='counter'?'response16/24':Math.max(12,Math.round(move.damage*.16));
  catalog.push({key:id+'.'+moveId,characterId:id,name:normal?moveId:move.name,moveId,kind:normal?'normal':'special',
   characterRole:roles[id][0],weakness:roles[id][1],role:normal?(moveId.startsWith('air_')?'空中差し合い':moveId.startsWith('crouch_')?'低姿勢/下段':moveId.endsWith('_weak')?'近距離牽制/連係開始':'中距離/大打撃'):specialRoles[move.kind],
   performance:move,animation:{model:`chars/${id}/${id}.glb`,modelSha256:hash,
    file:normal?(normalVersion==='v17'?`motion/v17/${id}_normals_v17.glb`:`normal/v15/${id}_normals.glb`):`cinematic/v14/${id}/${authored.animationSources.attacker.glb??id+'.glb'}`,
    clip:normal?normalVersion+'_'+moveId:authored.animationSources.attacker.clip,
    contact:normal?authored.contact:authored.contactSeconds,contactEnd:normal?authored.contactEnd:undefined,
    attackPart:normal?authored.attackPart:undefined,measurement:normal?normalVersion+' actual skinned surface':'current authored spec, new P3 measurement pending'},
   baseline:{hitstopFrames:paired?0:6,guardstopFrames:paired?null:3,hitstunFrames:oldHitstun},
   proposal:{hitstopFrames:paired?0:feel.hitstop,guardstopFrames:paired?null:feel.guardstop,
    hitstunFrames:normal?move.hitstun:(specialHitstunP3(id,Number(moveId[1])-1)??oldHitstun),
    sound:{hit:feel.hitSound,guard:feel.guardSound,swing:feel.swingSound},gameplayValuesChanged:!normal&&specialHitstunP3(id,Number(moveId[1])-1)!==undefined},
   rationale:'Keep measured reach, startup/active/recovery/damage/cancel. Propose symmetric contact holds and distinct hit/guard/swing audio; no claim of new Claude animation integration.'});
 }
}
if(catalog.length!==81)throw Error('P3 requires 81 moves');
writeFileSync(resolve(out,'MOVE_CATALOG.json'),JSON.stringify({schemaVersion:1,baselineSha:baseSha,performanceSource:engine,catalog},null,2)+'\n');
let markdown='# P3 81技の凍結値と提案差分\n\n基準PR209 `'+baseSha+'`。S/A/R・威力・到達距離は現在の実データ。変更する性能列は19近接必殺のhitstunだけ。停止Fとhitstun候補を凍結値と分離。必殺の新P3打点はClaude素材の受領・再計測待ち。CPU使用率は同フォルダの `cpu-move-usage.json`。\n\n|キャラ|技|役割|発生/持続/硬直|威力|到達m|旧→候補HitStop|旧→候補GuardStop|旧→候補HitStun|\n|---|---|---|---|---|---|---|---|---|\n';
for(const row of catalog){const m=row.performance;markdown+='|'+[row.characterId,row.moveId,row.role,[m.startup,m.active,m.recovery].join('/'),m.damage,m.reach,row.baseline.hitstopFrames+'→'+row.proposal.hitstopFrames,row.baseline.guardstopFrames+'→'+row.proposal.guardstopFrames,row.baseline.hitstunFrames+'→'+row.proposal.hitstunFrames].join('|')+'|\n';}
writeFileSync(resolve(out,'MOVE_CATALOG.md'),markdown);
if(process.env.MAMOKEN_CATALOG_ONLY==='1')process.exit(0);
const usage=Object.fromEntries(catalog.map(row=>[row.key,{starts:0,hits:0,blocks:0,whiffs:0}]));
const oldTick=Battle.prototype.tick;
Battle.prototype.tick=function(...args){
 const result=oldTick.apply(this,args);
 if(this.cpuSeed===undefined)return result;
 for(const event of this.events){
  if(event.type==='move'){const key=this.fighters[event.slot].id+'.'+event.action;if(usage[key])usage[key].starts++;}
  if(event.feedback){const row=usage[event.feedback.id];if(row){if(event.type==='hit'||event.type==='counter')row.hits++;if(event.type==='block')row.blocks++;if(event.feedback.outcome==='whiff')row.whiffs++;}}
 }
 return result;
};
try{await import('./normal-audit-v151.mjs');}finally{Battle.prototype.tick=oldTick;}
writeFileSync(resolve(out,'cpu-move-usage.json'),JSON.stringify({baselineSha:baseSha,rounds:1458,note:'Fixed seeds/seat-swapped existing six policies. hit/block/whiff analytics available only in P3 feedback engine; baseline starts remain comparable.',usage},null,2)+'\n');
