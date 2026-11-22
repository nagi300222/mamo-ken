// Practice uses the real Battle: only resources / time are replenished.
import {ROSTER,FPS,ARENA} from './balance.js';
import {Battle} from './battle.js';
export const DUMMY_MODES=Object.freeze(['stand','guard','cpu']);
export function createPracticeController(){
  let dummy='stand',hits=0,damage=0,lastDamage=0,lastFrame=-9999;
  function setDummy(mode){if(!DUMMY_MODES.includes(mode))throw Error('invalid dummy '+mode);dummy=mode;return dummy;}
  function prepare(b){
    if(!b)return;
    b.time=FPS*ARENA.roundSeconds;
    for(const p of b.fighters){p.hp=ROSTER[p.id].hp;p.drive=100;p.super=100;p.driveDelay=0;}
  }
  function dummyInput(b){
    if(dummy==='cpu')return null;
    if(dummy==='stand')return {};
    const p=b.fighters[1],a=b.fighters[0];
    return {[p.facing===1?'left':'right']:true,down:a.action?.level==='low'};
  }
  function after(b){
    if(!b)return;
    for(const e of b.events){
      if(!['hit','gyuiin_hit'].includes(e.type)||e.slot!==1||!(e.damage>0))continue;
      if(b.frame-lastFrame>42){hits=0;damage=0;}
      hits++;damage+=e.damage;lastDamage=e.damage;lastFrame=b.frame;
    }
    for(const p of b.fighters){p.hp=ROSTER[p.id].hp;p.drive=100;p.super=100;p.driveDelay=0;p.ko=false;}
    if(b.phase==='ko'){b.phase='fight';b.winner=null;}
    b.time=FPS*ARENA.roundSeconds;
  }
  function reset(old){
    const next=new Battle(old.fighters[0].id,old.fighters[1].id,old.level);
    if(old.tailTipSamples)next.setTailTipPath(old.tailTipSamples);
    clear();prepare(next);return next;
  }
  function clear(){hits=0;damage=0;lastDamage=0;lastFrame=-9999;}
  return {setDummy,prepare,dummyInput,after,reset,clear,get dummy(){return dummy;},
    get stats(){return {hits,damage,lastDamage};}};
}
