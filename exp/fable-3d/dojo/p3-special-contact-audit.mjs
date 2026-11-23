// Isolates the measured special surface candidate from all other performance.
// Repeat with a fresh exact delivery after art revisions; never edits approval.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';import {resolve,dirname} from 'node:path';import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {validateP3SpecialContactDelivery} from './special-contact-runtime-p3.js';
import {probeSpecial,cornerPressureProbe} from './p3-special-audit.mjs';
const here=dirname(fileURLToPath(import.meta.url)),engineDir=process.env.MAMOKEN_ENGINE_DIR??here;
const file=process.env.MAMOKEN_SPECIAL_CONTACT_DELIVERY;if(!file)throw Error('MAMOKEN_SPECIAL_CONTACT_DELIVERY must name a measured exact-clock delivery');
const delivery=validateP3SpecialContactDelivery(JSON.parse(readFileSync(file)));
const out=resolve(process.env.MAMOKEN_AUDIT_DIR??'/tmp/mamoken-p3-special-surface-audit');mkdirSync(out,{recursive:true});
const [{Battle},balance,{cpuInput}]=await Promise.all(['battle.js','balance.js','cpu.js'].map(name=>import(pathToFileURL(resolve(engineDir,name)))));
const {IDS,specialMove,normalMove}=balance;
const normalSource=await import(pathToFileURL(resolve(engineDir,'normal-contact-source.js')));
const knownReachPolicy=process.env.MAMOKEN_KNOWN_REACH_POLICY==='1';
const engine=table=>({Battle:class extends Battle{constructor(left,right,level=2,options={}){super(left,right,level,{...options,specialContactDelivery:table});}},specialMove,normalMove});
const engines={reference:engine(null),surface:engine(delivery)};
const snapshots={schemaVersion:1,deliveryFile:resolve(file),deliverySha256:createHash('sha256').update(readFileSync(file)).digest('hex'),deliveryVersion:delivery.version,engineDirectory:engineDir,
 normalContactVersion:normalSource.NORMAL_CONTACTS_VERSION,normalMotionVersion:normalSource.ACTIVE_NORMAL_MOTION_VERSION,
 knownReachPolicy,
 note:'Reference and candidate use the same current engine, normal source, P3 hitstop/hitstun and six frozen CPU policies. Only special surfaces/release sockets differ. Not human balance or physical-device evidence.',probes:{},cpu:{}};

if(process.env.MAMOKEN_CPU_ONLY!=='1')for(const [phase,e]of Object.entries(engines)){
 const rows=[],pressure=[];
 for(const id of IDS)for(let index=0;index<3;index++){
  const move=specialMove(id,index);if(!['strike','anti','dash','tail'].includes(move.kind))continue;
  for(const face of [1,-1])for(const distance of [.34,.55,.9])for(const height of [0,.35,.8])for(const timing of ['first','last'])for(const guard of [false,true])for(const wall of [false,true]){
   rows.push(probeSpecial(id,index,{face,distance,height,timing,guard,wall},e));
  }
  for(const face of [1,-1])rows.push(probeSpecial(id,index,{face,whiff:true},e));
  for(const face of [1,-1])for(const late of [false,true])pressure.push(cornerPressureProbe(id,index,{face,late},e));
 }
 const directory=resolve(out,phase);mkdirSync(directory,{recursive:true});
 writeFileSync(resolve(directory,'probes.json'),JSON.stringify(rows)+'\n');writeFileSync(resolve(directory,'corner-pressure.json'),JSON.stringify(pressure)+'\n');
 snapshots.probes[phase]={count:rows.length,pressureCases:pressure.length,outcomes:rows.reduce((a,r)=>(a[r.outcome]=(a[r.outcome]??0)+1,a),{}),pressure:{initialContactCases:pressure.filter(r=>r.contacts>0).length,maxHits:Math.max(...pressure.map(r=>r.maxHits)),guardReturnedAfterInitialContact:pressure.filter(r=>r.contacts>0).every(r=>r.blocks>0)}};
 console.log('Special surface probes',phase,rows.length,'pressure',pressure.length);
}

// Frozen copies of the six policies in normal-audit-v151.mjs. They contain no
// new range assistance, future input lookup or compensation for short new limbs.
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
 if(knownReachPolicy)for(const index of [1,2])if(input['special'+(index+1)]&&g.canReachSpecial(p,t,index)===false)delete input['special'+(index+1)];
 return input;
}
if(process.env.MAMOKEN_SKIP_CPU!=='1')for(const [phase,e]of Object.entries(engines)){
 const results=[],usage=Object.fromEntries(IDS.flatMap(id=>[1,2,3].map(i=>[id+'.s'+i,{starts:0,hits:0,blocks:0,whiffs:0}])));
 for(const level of [1,2,3])for(const seed of [0,1,2,3,4,5]){
  for(const left of IDS)for(const right of IDS){
   const g=new e.Battle(left,right,level),spacing=[.70,1.20,2.40,.36,.36,1.40][seed];g.cpuSeed=seed;g.fighters[0].x=-spacing/2;g.fighters[1].x=spacing/2;
   while(g.phase==='fight'&&g.frame<4600){
    const [p,t]=g.fighters;g.tick(policy(g,p,t,level,seed),policy(g,t,p,level,seed));
    for(const event of g.events){if(event.type==='move'){const row=usage[g.fighters[event.slot].id+'.'+event.action];if(row)row.starts++;}const row=usage[event.feedback?.id];if(row){if(event.type==='hit'||event.type==='counter')row.hits++;if(event.type==='block')row.blocks++;if(event.feedback.outcome==='whiff')row.whiffs++;}}
   }
   if(g.phase==='fight')throw Error('CPU did not finish '+phase+'/'+left+'/'+right);
   results.push({level,seed,pattern:patterns[seed],spacing,left,right,winner:g.winner,frames:g.frame,hp:g.fighters.map(p=>p.hp),timeout:g.time<=0});
  }
  console.log('CPU surface audit',phase,'level',level,'seed',seed);
 }
 const summary=IDS.map(id=>{const games=results.filter(r=>r.left!==r.right&&(r.left===id||r.right===id)),wins=games.filter(r=>r.winner===(r.left===id?0:1)).length,draws=games.filter(r=>r.winner===-1).length;return {id,games:games.length,wins,draws,score:(wins+draws/2)/games.length};});
 const directory=resolve(out,phase);mkdirSync(directory,{recursive:true});writeFileSync(resolve(directory,'cpu-matrix.json'),JSON.stringify(results)+'\n');writeFileSync(resolve(directory,'cpu-summary.json'),JSON.stringify({rounds:results.length,patterns,summary},null,2)+'\n');writeFileSync(resolve(directory,'cpu-special-usage.json'),JSON.stringify(usage,null,2)+'\n');snapshots.cpu[phase]={rounds:results.length,summary};
}
const read=(phase,name)=>JSON.parse(readFileSync(resolve(out,phase,name)));
if(snapshots.probes.reference&&snapshots.probes.surface){
 const reference=read('reference','probes.json'),surface=read('surface','probes.json'),changes=[];
 for(let i=0;i<reference.length;i++){const a=reference[i],b=surface[i];if(a.outcome!==b.outcome||a.damage!==b.damage||a.advantage!==b.advantage)changes.push({id:a.id,moveId:a.moveId,face:a.face,distance:a.distance,height:a.height,timing:a.timing,wall:a.wall,guard:a.guardRequested,whiffFixture:a.whiffFixture,before:{outcome:a.outcome,damage:a.damage,advantage:a.advantage},after:{outcome:b.outcome,damage:b.damage,advantage:b.advantage}});}
 writeFileSync(resolve(out,'probe-changes.json'),JSON.stringify(changes)+'\n');snapshots.probeChanges=changes.length;
 snapshots.groundFirstContact=IDS.flatMap(id=>[1,2,3].map(i=>{const matches=rows=>rows.find(r=>r.id===id&&r.moveId==='s'+i&&r.face===1&&r.distance===.34&&r.height===0&&r.timing==='first'&&r.wall&&!r.guardRequested&&!r.whiffFixture);const a=matches(reference),b=matches(surface);return a&&b?{id,moveId:'s'+i,reference:{outcome:a.outcome,frame:a.contactActionFrame,advantage:a.advantage},surface:{outcome:b.outcome,frame:b.contactActionFrame,advantage:b.advantage}}:null;})).filter(Boolean);
}
if(snapshots.cpu.reference&&snapshots.cpu.surface){const a=read('reference','cpu-matrix.json'),b=read('surface','cpu-matrix.json');snapshots.cpuWinnerChanges=a.filter((r,i)=>r.winner!==b[i].winner).length;}
writeFileSync(resolve(out,'comparison.json'),JSON.stringify(snapshots,null,2)+'\n');console.log('Saved special surface audit',out);
