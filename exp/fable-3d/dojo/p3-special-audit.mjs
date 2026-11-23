import {Battle} from './battle.js';
import {IDS,specialMove,normalMove} from './balance.js';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {specialHitstunP3} from './special-balance-p3.js';
const HERE=dirname(fileURLToPath(import.meta.url));
const ready=(g,p)=>!g.throwSequence&&!g.clinch&&!p.action&&!p.stun&&!p.stop&&!p.dashF;

// Controlled contact-window probe. To inspect the latest active frame, the target
// is kept above the attack until that frame, then placed at the requested height.
// This measures a timing boundary, not a claim about a neutral match setup.
export function probeSpecial(id,index,{face=1,distance=.34,height=0,timing='first',guard=false,whiff=false,wall=true}={},engine={Battle,specialMove,normalMove}){
 const move=engine.specialMove(id,index),g=new engine.Battle(id,'pisuke'),[p,t]=g.fighters;
 p.x=wall?face*(1.76-distance):-face*distance/2;t.x=wall?face*1.76:face*distance/2;p.facing=face;t.facing=-face;t.ability.grit=false;
 const desired=move.startup+(timing==='last'?move.active-1:0);
 g._begin(p,move,'s'+(index+1));
 let event=null,gameContact=null,actionContact=null,aReady=null,tReady=null,expired=null,maxStop=0;
 const incoming=engine.normalMove('pisuke','stand_weak');let incomingStarted=false;
 let damageActionFrame=null,contactSeparation=null,afterDamageSeparation=null;const baseDamage=g._damage;
 g._damage=function(attacker,target,...args){
  if(attacker.slot===0)damageActionFrame=attacker.frame;
  contactSeparation=Math.abs(attacker.x-target.x);const result=baseDamage.call(this,attacker,target,...args);afterDamageSeparation=Math.abs(attacker.x-target.x);return result;
 };
 const published=[];
 for(let frame=0;frame<240;frame++){
  if(!event){
   t.y=whiff||g.frame+1<desired?2:height;t.vy=0;
   if(move.kind==='counter'&&!whiff&&!incomingStarted&&g.frame+1>=desired-incoming.startup+1){g._begin(t,incoming,'stand_weak');incomingStarted=true;}
  }
  const guardBack=p.x>=t.x?'left':'right';
  g.tick({},guard?{[guardBack]:true,down:move.level==='low'}:{});
  maxStop=Math.max(maxStop,p.stop,t.stop);
  published.push(...g.events.filter(e=>e.feedback).map(e=>({type:e.type,id:e.feedback.id,outcome:e.feedback.outcome,frame:g.frame})));
  if(!event){
   event=g.events.find(e=>(e.type==='hit'||e.type==='block')&&e.slot===1||e.type==='counter'&&e.slot===0)??null;
   if(event){gameContact=g.frame;actionContact=damageActionFrame??p.frame;}
  }
  if(expired===null&&g.events.some(e=>e.feedback?.outcome==='whiff'&&e.slot===0))expired=g.frame;
  if(event){if(aReady===null&&ready(g,p))aReady=g.frame;if(tReady===null&&ready(g,t))tReady=g.frame;}
  else if(aReady===null&&ready(g,p))aReady=g.frame;
  if(event&&aReady!==null&&tReady!==null)break;
  if(!event&&ready(g,p)&&g.projectiles.length===0&&frame>desired)break;
 }
 return {id,index,moveId:'s'+(index+1),kind:move.kind,face,distance,height,timing,wall,guardRequested:guard,whiffFixture:whiff,
  controlledFixture:timing==='last'||whiff||height>0,outcome:event?.type??'whiff',damage:event?.damage??0,
  contactGameFrame:gameContact,contactActionFrame:actionContact,attackerReady:aReady,targetReady:tReady,
  advantage:event&&aReady!==null&&tReady!==null?tReady-aReady:null,
  contactSeparation,afterDamageSeparation,separation:Math.abs(p.x-t.x),maxStop,missEventFrame:expired,published};
}

export function cornerPressureProbe(id,index,{face=1,late=false,frames=2000}={},engine={Battle,specialMove,normalMove}){
 const g=new engine.Battle(id,'godan'),[p,t]=g.fighters,move=engine.specialMove(id,index),moveId='s'+(index+1);
 p.x=face*1.42;t.x=face*1.76;p.facing=face;t.facing=-face;g._begin(p,move,moveId);
 let landed=false,blocks=0,maxHits=0,contacts=0,firstGuardFrame=null;const firstContacts=[];
 for(let f=0;f<frames;f++){
  t.hp=999999;t.guard=100;
  if(!landed&&late){t.y=p.frame+1<move.startup+move.active-1?2:0;t.vy=0;}
  const input={};
  if(landed&&!p.stop&&!p.stun){
   if(!p.action&&!p.prev.weak)input.weak=true;
   else if(p.action?.id.endsWith('_weak')&&p.comboContact&&!p.prev.strong)input.strong=true;
   else if(p.action?.id.endsWith('_heavy')&&p.comboContact&&!p.prev['special'+(index+1)])input['special'+(index+1)]=true;
  }
  const back=p.x>=t.x?'left':'right';g.tick(input,landed?{[back]:true,down:p.action?.level==='low'}:{});
  for(const event of g.events){
   if(event.type==='hit'){landed=true;contacts++;maxHits=Math.max(maxHits,event.comboHits??1);}
   if(event.type==='block'){blocks++;firstGuardFrame??=g.frame;}
   if((event.type==='hit'||event.type==='block')&&firstContacts.length<8)firstContacts.push({frame:g.frame,outcome:event.type,comboHits:event.comboHits??null,move:event.feedback?.moveId??null});
  }
 }
 return {id,index,moveId,face,late,frames,contacts,blocks,maxHits,firstGuardFrame,firstContacts};
}

async function main(){
 const directory=process.env.MAMOKEN_ENGINE_DIR??HERE,out=process.env.MAMOKEN_AUDIT_DIR??resolve(HERE,'../../../docs/mamoken-p3/proposal');
 const [{Battle:EngineBattle},balance]=await Promise.all([import(pathToFileURL(resolve(directory,'battle.js'))),import(pathToFileURL(resolve(directory,'balance.js')))]);
 const engine={Battle:EngineBattle,...balance},rows=[];
 for(const id of IDS)for(let index=0;index<3;index++){
  const move=engine.specialMove(id,index);
  for(const face of [1,-1])for(const distance of [.34,.55,.9])for(const height of [0,.35,.8])for(const timing of move.active===1?['first']:['first','last'])for(const guard of move.kind==='counter'?[false]:[false,true]){
   rows.push(probeSpecial(id,index,{face,distance,height,timing,guard},engine));
  }
  rows.push(probeSpecial(id,index,{whiff:true},engine));
  for(const face of [1,-1])for(const distance of [.34,.55,.9])for(const height of [0,.35,.8])for(const guard of move.kind==='counter'?[false]:[false,true]){
   rows.push(probeSpecial(id,index,{face,distance,height,guard,wall:false},engine));
  }
 }
 const header={engineDirectory:directory,note:'Controlled active-window probes; air/last/whiff target positions are fixtures. Guard input follows the current visible opponent side. Normal projectile guard/hit are real engine collision. No human-balance or mesh-measurement claim.'};
 mkdirSync(out,{recursive:true});writeFileSync(resolve(out,'SPECIAL_PROBES.json'),JSON.stringify(header).slice(0,-1)+',"rows":[\n'+rows.map(row=>JSON.stringify(row)).join(',\n')+'\n]}\n');
 let md='# 27必殺の実接触時計・反撃リスク\n\n最速/最遅activeの制御プローブ、距離0.34m、相手ピスケを壁際に配置。投げは既存48Fペア＋40F起き上がり、当て身は実際の弱攻撃への反応。空振りは相手を打撃外の高さに置く制御fixture。全距離/空中/左右の生データはSPECIAL_PROBES.json。\n\n|キャラ|技|最速Hit差|最遅Hit差|最速Guard差|最遅Guard差|回復時距離m|空振り行動終了F|\n|---|---|---|---|---|---|---|---|\n';
 for(const id of IDS)for(let index=0;index<3;index++){
  const pick=(timing,guard)=>rows.find(row=>row.id===id&&row.index===index&&row.face===1&&row.distance===.34&&row.height===0&&row.timing===timing&&row.guardRequested===guard&&!row.whiffFixture&&row.wall);
  const first=pick('first',false),last=pick('last',false)??first,guardFirst=pick('first',true),guardLast=pick('last',true)??guardFirst,miss=rows.find(row=>row.id===id&&row.index===index&&row.whiffFixture);
  md+='|'+[id,'s'+(index+1),first?.advantage??first?.outcome,last?.advantage??last?.outcome,guardFirst?.outcome==='block'?guardFirst.advantage:'ガード対象外',guardLast?.outcome==='block'?guardLast.advantage:'ガード対象外',first?.separation.toFixed(3),miss.attackerReady].join('|')+'|\n';
 }
 writeFileSync(resolve(out,'SPECIAL_TABLE.md'),md);console.log('P3 special probes',rows.length,out);
 const cancels=[];
 for(const id of IDS)for(let index=0;index<3;index++)if(specialHitstunP3(id,index)!==undefined)for(const face of [1,-1])for(const late of [false,true])cancels.push(cornerPressureProbe(id,index,{face,late},engine));
 writeFileSync(resolve(out,'CANCEL_STRESS.json'),JSON.stringify({policy:'Initial earliest/latest special contact, then weak -> confirmed strong -> selected special; defender continuously guards after first hit. Defender HP/guard reset per frame. No future input lookup.',cases:cancels},null,1)+'\n');
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await main();
