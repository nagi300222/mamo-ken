// Reproducible engine audit, not a replacement for human competitive play.
import {writeFileSync,mkdirSync} from 'node:fs';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {resolve,dirname} from 'node:path';
const engine=process.env.MAMOKEN_ENGINE_DIR||dirname(fileURLToPath(import.meta.url));
const {Battle}=await import(pathToFileURL(resolve(engine,'battle.js')));
const {IDS,normalMove,specialMove}=await import(pathToFileURL(resolve(engine,'balance.js')));
const {cpuInput}=await import(pathToFileURL(resolve(engine,'cpu.js')));
const slots=['stand_weak','stand_heavy','crouch_weak','crouch_heavy','air_weak','air_heavy'];
const out=process.env.MAMOKEN_AUDIT_DIR||resolve(engine,'../../../docs/mamoken-v151');
mkdirSync(out,{recursive:true});
export function contactProbe(id,slot,{distance=.35,face=1,guard=false,stance='stand'}={}){
 const g=new Battle(id,'godan'),[p,t]=g.fighters;
 p.x=-face*distance/2;t.x=face*distance/2;p.facing=face;t.facing=-face;
 if(slot.startsWith('air_')){p.y=.30;p.vy=.03;}
 if(stance==='air'){t.y=.30;t.vy=.03;}
 const m=normalMove(id,slot);g._begin(p,m,slot);
 let event=null,at=null,readyA=null,readyT=null;
 for(let f=0;f<140;f++){
  const back=face===1?'right':'left';
  g.tick({},guard?{[back]:true,down:stance==='crouch'}:stance==='crouch'?{down:true}:{});
  if(!event){event=g.events.find(e=>['hit','block'].includes(e.type)&&e.slot===1);if(event)at=g.frame;}
  else{
   if(readyA===null&&!p.action&&!p.stop&&!p.stun)readyA=g.frame;
   if(readyT===null&&!t.action&&!t.stop&&!t.stun)readyT=g.frame;
   if(readyA!==null&&readyT!==null)break;
  }
 }
 return {outcome:event?.type??'whiff',damage:event?.damage??0,contactFrame:at,advantage:readyA!==null&&readyT!==null?readyT-readyA:null};
}
const normals=[];
for(const id of IDS)for(const slot of slots){
 const move=normalMove(id,slot),row={id,slot,...move,
  hit:contactProbe(id,slot),block:contactProbe(id,slot,{guard:true,stance:slot.startsWith('crouch_')?'crouch':'stand'}),ranges:[]};
 for(const face of [1,-1])for(const stance of ['stand','crouch','air'])for(const distance of [.34,.40,.46,.52,.58,.64,.70,.76,.82,.90])
  row.ranges.push({face,stance,distance,...contactProbe(id,slot,{distance,face,stance,guard:true})});
 normals.push(row);
}
writeFileSync(resolve(out,'normal-metrics.json'),JSON.stringify(normals,null,2)+'\n');
const cols=['キャラ','技','発生','持続','硬直','威力','リーチm','ヒット差F','ガード差F'];
let md='# 54通常技の実測表\n\n固定60Hz。硬直差はBattleで入力可能になるフレームの差（正値は攻撃側が先）。初段・最速接触、距離0.35m、相手ゴダン。空中技は両者の高さ・着地時刻に依存するため地上技と単純比較しない。技のreachに相手hurt半径0.16mを別加算。\n\n|'+cols.join('|')+'|\n|'+cols.map(()=> '---').join('|')+'|\n';
for(const r of normals)md+='|'+[r.id,r.slot,r.startup,r.active,r.recovery,r.damage,r.reach,r.hit.advantage,r.block.outcome==='block'?r.block.advantage:r.block.outcome].join('|')+'|\n';
writeFileSync(resolve(out,'NORMAL_TABLE.md'),md);
if(process.env.MAMOKEN_SKIP_CPU==='1')process.exit(0);
const patterns=['neutral','confirm','low-pressure','air-footsies','grapple-pressure','ranged-control'];
function policy(g,p,t,level,seed){
 const input=cpuInput({...g,frame:g.frame+1},p,t,level);
 if((seed===1||seed===4)&&p.action&&p.comboContact){
  const key=p.action.id.endsWith('_weak')?'strong':'special2';
  if(!p.prev[key])return {[key]:true};
 }
 if(seed===2){
  if(input.weak||input.strong)input.down=true;
  if(!p.action&&!p.stun&&!p.stop&&Math.abs(p.x-t.x)<.43&&g.frame%101===p.slot*17)input.throw=true;
 }
 if(seed===3){
  if(!p.action&&!p.stun&&!p.stop&&p.y===0&&g.frame%149===p.slot*23){input.up=true;input[t.x>p.x?'right':'left']=true;}
  if(p.y>.1&&!p.action&&!p.stun&&!p.stop){input.strong=g.frame%3===0;}
 }
 if(seed===4&&!p.action&&!p.stun&&!p.stop){
  const grab=specialMove(p.id,2),key=grab.kind==='throw'?'special3':'throw';
  if(Math.abs(p.x-t.x)<.40&&g.frame%19===p.slot*5)return {[key]:true};
  if(Math.abs(p.x-t.x)>.39&&!input.weak&&!input.strong)input[t.x>p.x?'right':'left']=true;
 }
 if(seed===5&&!p.action&&!p.stun&&!p.stop){
  const distance=Math.abs(p.x-t.x),projectile=specialMove(p.id,0).kind==='projectile';
  if(projectile&&distance>.70){
   if(g.frame%71===p.slot*13)return {special1:true};
   if(distance<1.2)return {[t.x>p.x?'left':'right']:true};
  }
  if(t.y>.20&&distance<.65&&g.frame%13===p.slot*3)return {special2:true};
  if(!projectile&&distance<.70&&g.frame%71===p.slot*13)return {special1:true};
 }
 return input;
}
const results=[];
for(const level of [1,2,3])for(const seed of [0,1,2,3,4,5]){
 for(const left of IDS)for(const right of IDS){
  const g=new Battle(left,right,level);g.cpuSeed=seed;
  const spacing=[.70,1.20,2.40,.36,.36,1.40][seed];
  g.fighters[0].x=-spacing/2;g.fighters[1].x=spacing/2;
  while(g.phase==='fight'&&g.frame<4600){
   const [p,t]=g.fighters;g.tick(policy(g,p,t,level,seed),policy(g,t,p,level,seed));
  }
  if(g.phase==='fight')throw Error('simulation did not finish: '+left+'/'+right);
  results.push({level,seed,pattern:patterns[seed],spacing,left,right,winner:g.winner,frames:g.frame,hp:g.fighters.map(p=>p.hp),timeout:g.time<=0});
 }
 console.log('CPU audit completed level',level,'seed',seed);
}
writeFileSync(resolve(out,'cpu-matrix.json'),JSON.stringify(results)+'\n');
const summary=IDS.map(id=>{const games=results.filter(r=>r.left!==r.right&&(r.left===id||r.right===id));const wins=games.filter(r=>r.winner===(r.left===id?0:1)).length;const draws=games.filter(r=>r.winner===-1).length;return {id,games:games.length,wins,draws,score:(wins+draws/2)/games.length};});
writeFileSync(resolve(out,'cpu-summary.json'),JSON.stringify({rounds:results.length,levels:[1,2,3],seeds:[0,1,2,3,4,5],patterns,summary},null,2)+'\n');
console.log(summary);
