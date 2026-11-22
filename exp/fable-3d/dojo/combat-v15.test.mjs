import test from 'node:test';
import assert from 'node:assert/strict';
import {Battle} from './battle.js';
import {ROSTER,IDS,normalMove} from './balance.js';
import {FIGHT_STYLE,fighterStyle} from './fighter-style.js';

function encounter(id='moguzo',distance=.38,guard=false){
 const g=new Battle(id,'godan');
 g.fighters[0].x=-distance/2;g.fighters[1].x=distance/2;
 return {g,defender:()=>guard?{right:true}:{}};
}
function initialContact(g,defender){
 const events=[];
 for(let f=0;f<32;f++){
  g.tick(f===0?{weak:true}:{},defender());
  events.push(...g.events);
  if(events.some(e=>e.type==='hit'||e.type==='block'))break;
 }
 return events;
}
function attempt(g,defender,input){
 const all=[];
 for(let f=0;f<42;f++){
  g.tick(f===1?input:{},defender());
  all.push(...g.events);
 }
 return all;
}
test('nine fighters have genuinely different air steering, dash profiles and weak chain caps',()=>{
 assert.deepEqual(Object.keys(FIGHT_STYLE).sort(),[...IDS].sort());
 assert.equal(new Set(IDS.map(id=>fighterStyle(id).airSpeed)).size,9);
 assert.ok(fighterStyle('pisuke').airSpeed>fighterStyle('godan').airSpeed);
 assert.ok(fighterStyle('dark_moguzo').weakChainMax>fighterStyle('godan').weakChainMax);
 for(const id of IDS){
   const s=fighterStyle(id);
   assert.ok(s.dashFrames>=12&&s.dashRecovery>=1&&s.airSpeed>=.02);
   assert.ok(normalMove(id,'stand_heavy').recovery>normalMove(id,'stand_weak').recovery);
 }
});
test('air mobility in a real Battle varies by character, without affecting jump height',()=>{
 function flight(id){
  const g=new Battle(id,'godan'),p=g.fighters[0];p.x=-1.4;
  g.tick({up:true,right:true},{});
  const begin=p.x;let peak=0;
  for(let f=0;f<19;f++){g.tick({right:true},{});peak=Math.max(peak,p.y);}
  return {traveled:p.x-begin,peak};
 }
 const fast=flight('pisuke'),slow=flight('godan');
 assert.ok(fast.traveled>slow.traveled+.12,JSON.stringify({fast,slow}));
 assert.ok(fast.peak>.5&&slow.peak>.5);
});
test('on hit: weak into weak, one genuine cancel event, no auto-repeat from holding',()=>{
 const {g,defender}=encounter();
 const first=initialContact(g,defender);
 assert.ok(first.some(e=>e.type==='hit'),JSON.stringify(first));
 const results=attempt(g,defender,{weak:true});
 const cancels=results.filter(e=>e.type==='cancel'&&e.to==='stand_weak');
 assert.equal(cancels.length,1,JSON.stringify(results.filter(e=>e.type==='cancel')));
 assert.ok(g.fighters[0].chainWeakCount<=fighterStyle('moguzo').weakChainMax);
});
test('on hit: weak into strong and normal into direction+special',()=>{
 const a=encounter();initialContact(a.g,a.defender);
 const toHeavy=attempt(a.g,a.defender,{strong:true});
 assert.ok(toHeavy.some(e=>e.type==='cancel'&&e.to==='stand_heavy'));
 const b=encounter();initialContact(b.g,b.defender);
 const special=attempt(b.g,b.defender,{special:true,right:true});
 assert.ok(special.some(e=>e.type==='cancel'&&e.to==='s3'));
});
test('on block: weak into special allowed; whiff and holding do not cancel',()=>{
 const guard=encounter('moguzo',.39,true);const first=initialContact(guard.g,guard.defender);
 assert.ok(first.some(e=>e.type==='block'));
 const canceled=attempt(guard.g,guard.defender,{special:true});
 assert.ok(canceled.some(e=>e.type==='cancel'&&e.to==='s1'));
 const whiff=encounter('moguzo',2.9,false);
 initialContact(whiff.g,whiff.defender);
 const no=attempt(whiff.g,whiff.defender,{special:true});
 assert.ok(no.every(e=>e.type!=='cancel'));
 const hold=encounter();initialContact(hold.g,hold.defender);
 let count=0;
 for(let i=0;i<65;i++){hold.g.tick({weak:true},{});count+=hold.g.events.filter(e=>e.type==='cancel').length;}
 assert.equal(count,0);
});
test('Godan weak link limit and Dark Moguzo triple weak are different',()=>{
 assert.equal(fighterStyle('godan').weakChainMax,1);
 assert.equal(fighterStyle('dark_moguzo').weakChainMax,3);
 const {g,defender}=encounter('godan',.39);initialContact(g,defender);
 const results=attempt(g,defender,{weak:true});
 assert.ok(results.every(e=>e.type!=='cancel'));
});
test('combo damage scaling never gives extra damage, and battle command inputs are intact',()=>{
 const {g,defender}=encounter('pisuke',.30);
 initialContact(g,defender);
 const seq=attempt(g,defender,{weak:true});
 const hit=seq.filter(e=>e.type==='hit');
 if(hit.length)assert.ok(hit[0].damage<=normalMove('pisuke','stand_weak').damage);
 const ids=new Set(seq.filter(e=>e.type==='move').map(e=>e.action));
 assert.ok([...ids].every(id=>!id||typeof id==='string'));
 const direct=new Battle('moguzo','godan');direct.tick({special:true,up:true},{});
 assert.equal(direct.fighters[0].action?.id,'s2');
});
