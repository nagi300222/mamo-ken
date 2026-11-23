// Combined live-surface balance audit: fixed current policy and real Battle.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const engineDir=process.env.MAMOKEN_ENGINE_DIR??dirname(fileURLToPath(import.meta.url));
const directory=process.env.MAMOKEN_EVIDENCE??'/tmp/p3-combined-cpu';await mkdir(directory,{recursive:true});
const [{Battle},{IDS,specialMove},{cpuInput},normalSource,{APPROVED_P3_SPECIAL_MOTION_VERSION}]=await Promise.all(['battle.js','balance.js','cpu.js','normal-contact-source.js','special-motion-overrides-p3.js'].map(name=>import(pathToFileURL(resolve(engineDir,name)))));
const patterns=['neutral','confirm','low-pressure','air-footsies','grapple-pressure','ranged-control'];
function frozenPolicy(g,p,t,level,seed){
 const input=cpuInput({...g,frame:g.frame+1},p,t,level);
 if((seed===1||seed===4)&&p.action&&p.comboContact){const key=p.action.id.endsWith('_weak')?'strong':'special2';if(!p.prev[key])return {[key]:true};}
 if(seed===2){if(input.weak||input.strong)input.down=true;if(!p.action&&!p.stun&&!p.stop&&Math.abs(p.x-t.x)<.43&&g.frame%101===p.slot*17)input.throw=true;}
 if(seed===3){if(!p.action&&!p.stun&&!p.stop&&p.y===0&&g.frame%149===p.slot*23){input.up=true;input[t.x>p.x?'right':'left']=true;}if(p.y>.1&&!p.action&&!p.stun&&!p.stop)input.strong=g.frame%3===0;}
 if(seed===4&&!p.action&&!p.stun&&!p.stop){const grab=specialMove(p.id,2),key=grab.kind==='throw'?'special3':'throw';if(Math.abs(p.x-t.x)<.40&&g.frame%19===p.slot*5)return {[key]:true};if(Math.abs(p.x-t.x)>.39&&!input.weak&&!input.strong)input[t.x>p.x?'right':'left']=true;}
 if(seed===5&&!p.action&&!p.stun&&!p.stop){const distance=Math.abs(p.x-t.x),projectile=specialMove(p.id,0).kind==='projectile';if(projectile&&distance>.70){if(g.frame%71===p.slot*13)return {special1:true};if(distance<1.2)return {[t.x>p.x?'left':'right']:true};}if(t.y>.20&&distance<.65&&g.frame%13===p.slot*3)return {special2:true};if(!projectile&&distance<.70&&g.frame%71===p.slot*13)return {special1:true};}
 return input;
}
function policy(g,p,t,level,seed){
 const input=frozenPolicy(g,p,t,level,seed);
 // Optional second checkpoint also gates the explicit confirm/air-footsie
 // policy overrides, which otherwise bypass the actual cpuInput function.
 for(const index of [1,2])if(input['special'+(index+1)]&&g.canReachSpecial(p,t,index)===false)delete input['special'+(index+1)];
 return input;
}
const results=[],usage=Object.fromEntries(IDS.flatMap(id=>['stand_weak','stand_heavy','crouch_weak','crouch_heavy','air_weak','air_heavy','s1','s2','s3'].map(move=>[id+'.'+move,{starts:0,hits:0,blocks:0,whiffs:0}])));
for(const level of [1,2,3])for(const seed of [0,1,2,3,4,5]){
 for(const left of IDS)for(const right of IDS){
  const g=new Battle(left,right,level),spacing=[.70,1.20,2.40,.36,.36,1.40][seed];g.cpuSeed=seed;g.fighters[0].x=-spacing/2;g.fighters[1].x=spacing/2;
  while(g.phase==='fight'&&g.frame<4600){
   const [p,t]=g.fighters;g.tick(policy(g,p,t,level,seed),policy(g,t,p,level,seed));
   for(const event of g.events){if(event.type==='move'){const row=usage[g.fighters[event.slot].id+'.'+event.action];if(row)row.starts++;}const row=usage[event.feedback?.id];if(row){if(event.type==='hit'||event.type==='counter')row.hits++;if(event.type==='block')row.blocks++;if(event.feedback.outcome==='whiff')row.whiffs++;}}
  }
  if(g.phase==='fight')throw Error('CPU did not finish '+left+'/'+right);
  results.push({level,seed,pattern:patterns[seed],spacing,left,right,winner:g.winner,frames:g.frame,hp:g.fighters.map(p=>p.hp),timeout:g.time<=0});
 }
 console.log('Combined CPU audit',process.env.MAMOKEN_PHASE??'phase',level,seed);
}
const summary=IDS.map(id=>{const games=results.filter(r=>r.left!==r.right&&(r.left===id||r.right===id)),wins=games.filter(r=>r.winner===(r.left===id?0:1)).length,draws=games.filter(r=>r.winner===-1).length;return {id,games:games.length,wins,draws,score:(wins+draws/2)/games.length,timeouts:games.filter(r=>r.timeout).length};});
const codeHashes=Object.fromEntries(await Promise.all(['battle.js','balance.js','cpu.js','normal-balance-v151.js','special-balance-p3.js'].map(async name=>[name,createHash('sha256').update(await readFile(resolve(engineDir,name))).digest('hex')])));
const providerFiles={normal:normalSource.ACTIVE_NORMAL_MOTION_VERSION==='v17'?['normal-contact-reviewed-v17.js']:['normal-contacts-v151.js'],special:APPROVED_P3_SPECIAL_MOTION_VERSION===null?['battle.js','balance.js']:['special-contact-reviewed-v17r2.js']};
const providerHashes=Object.fromEntries(await Promise.all(Object.entries(providerFiles).map(async([kind,files])=>[kind,Object.fromEntries(await Promise.all(files.map(async name=>[name,createHash('sha256').update(await readFile(resolve(engineDir,name))).digest('hex')])))])));
const report={providerFiles,providerHashes,phase:process.env.MAMOKEN_PHASE??'unspecified',normalContactVersion:normalSource.NORMAL_CONTACTS_VERSION,normalMotionVersion:normalSource.ACTIVE_NORMAL_MOTION_VERSION,specialMotionVersion:APPROVED_P3_SPECIAL_MOTION_VERSION,
 codeHashes,policySha256:createHash('sha256').update(frozenPolicy.toString()+policy.toString()).digest('hex'),note:'Same current CPU known-reach policy, six frozen patterns, timings/damage/hitstun/stop profiles in both phases. Both normals and specials select their actual phase-specific surfaces. Fixed confirm patterns intentionally retain old s2 requests, filtered by current known-reach rules. CPU scores are not human competitive balance or phone performance.',
 rounds:results.length,timeouts:results.filter(r=>r.timeout).length,draws:results.filter(r=>r.winner===-1).length,meanFrames:results.reduce((n,r)=>n+r.frames,0)/results.length,patterns,summary};
await writeFile(directory+'/cpu-matrix.json',JSON.stringify(results)+'\n');await writeFile(directory+'/cpu-summary.json',JSON.stringify(report,null,2)+'\n');await writeFile(directory+'/move-usage.json',JSON.stringify(usage,null,2)+'\n');console.log(JSON.stringify(report,null,2));
