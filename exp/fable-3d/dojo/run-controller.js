import {Battle} from './battle.js';
import {IDS,ROSTER} from './balance.js';

export const RUN_STAGES=Object.freeze(['village','alpine','canyon','river','burrow']);
export const STAGE_NAMES=Object.freeze({village:'集落の闘技場／昼',alpine:'アルプス草原アリーナ',canyon:'岩壁の峡谷',river:'雪解けの渓流',burrow:'地下巣穴闘技場',newmoon:'新月の闇闘技場'});
export const survivalLevel=fight=>fight<=15?1:fight<=30?3:fight<=45?5:fight<=60?7:9;
export const healFraction=wins=>wins<=15?1/2:wins<=30?1/3:1/4;
export function seededRandom(seed){let s=seed>>>0;return()=>{s+=0x6D2B79F5;let t=s;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
function shuffle(items,random){const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
const BEST_KEY='mamoken.survival.best.v1';
export function readSurvivalBest(storage){try{const n=Number(storage?.getItem(BEST_KEY));return Number.isSafeInteger(n)&&n>=0?n:0;}catch{return 0;}}
export function saveSurvivalBest(storage,n){try{storage?.setItem(BEST_KEY,String(n));return true;}catch{return false;}}

// Owns a run, never collision/frames. Each round is a fresh instance of the real Battle.
export class RunController{
 constructor({mode,player,seed=Date.now(),level=1,storage}={}){
  if(!['arcade','survival'].includes(mode)||!IDS.includes(player))throw Error('invalid run');
  this.mode=mode;this.player=player;this.seed=seed>>>0;this.random=seededRandom(seed);this.level=Math.max(1,Math.min(9,Math.trunc(Number(level)||1)));
  this.storage=storage;this.best=readSurvivalBest(storage);this.wins=0;this.continues=0;this.index=0;this.round=1;this.score=[0,0];this.lastHeal=0;this.hp=ROSTER[player].hp;this.status='ready';this.resolved=null;this.previousStage=null;
  this.route=mode==='arcade'?shuffle(IDS.filter(id=>id!==player),this.random).slice(0,7).map(opponent=>({opponent,stage:this.stage()})):[];
  if(mode==='arcade')this.route.push({opponent:player==='dark_moguzo'?'moguzo':'dark_moguzo',stage:'newmoon'});
  else this.appendBlock();
 }
 stage(){const pool=RUN_STAGES.filter(id=>id!==this.previousStage);const id=pool[Math.floor(this.random()*pool.length)];this.previousStage=id;return id;}
 appendBlock(){
  const size=this.player==='dark_moguzo'?8:15;
  const pool=IDS.filter(id=>id!==this.player&&id!=='dark_moguzo');let bag=[];
  for(let i=0;i<size-1;i++){
   if(!bag.length)bag=shuffle(pool,this.random);
   this.route.push({opponent:bag.pop(),stage:this.stage()});
  }
  this.route.push({opponent:'dark_moguzo',stage:'newmoon',boss:true});this.previousStage='newmoon';
 }
 get encounter(){const e=this.route[this.index];return {...e,fight:this.index+1,round:this.round,score:[...this.score],level:this.mode==='survival'?survivalLevel(this.index+1):this.level,short:this.mode==='survival',final:this.mode==='arcade'&&this.index===7};}
 createBattle(){
  if(this.status!=='ready')throw Error('run is not ready');
  const e=this.encounter,g=new Battle(this.player,e.opponent,1);
  if(this.mode==='survival')g.fighters[0].hp=Math.max(1,Math.min(ROSTER[this.player].hp,this.hp));
  g.cpuSeed=(this.seed+Math.imul(this.index+1,997)+this.round*17)>>>0;
  this.status='fighting';this.resolved=null;this.battle=g;return g;
 }
 finish(g){
  if(this.resolved===g)return this.outcome;
  if(this.status!=='fighting'||g!==this.battle||g.phase!=='ko')throw Error('run needs its completed round');
  this.resolved=g;
  const winner=g.winner,reason=g.events.some(e=>e.type==='timeout')?'timeout':winner<0?'double-ko':'ko';
  let result;
  if(this.mode==='survival'){
   if(winner!==0){this.hp=g.fighters[0].hp;this.lastHeal=0;this.status='end';result={kind:'end',winner,reason,victory:false};}
   else{
    this.wins++;const max=ROSTER[this.player].hp,before=g.fighters[0].hp;
    this.hp=Math.min(max,before+Math.floor(max*healFraction(this.wins)));this.lastHeal=this.hp-before;
    this.best=Math.max(this.best,this.wins);saveSurvivalBest(this.storage,this.best);
    this.status='between';result={kind:'next',winner,reason,victory:true,short:true};
   }
  }else if(winner<0){this.status='continue';result={kind:'continue',winner,reason,victory:false};}
  else{
   this.score[winner]++;
   if(this.score[winner]<2){this.status='round';result={kind:'round',winner,reason,victory:false};}
   else if(winner===1){this.status='continue';result={kind:'continue',winner,reason,victory:true};}
   else{
    this.wins++;this.status=this.index===7?'clear':'between';result={kind:this.index===7?'clear':'next',winner,reason,victory:true};
   }
  }
  this.outcome=Object.freeze(result);return this.outcome;
 }
 advance(){
  if(this.status==='round'){this.round++;this.status='ready';return;}
  if(this.status!=='between')throw Error('cannot advance run');
  this.index++;this.round=1;this.score=[0,0];
  if(this.index>=this.route.length)this.appendBlock();
  this.status='ready';
 }
 continue(){if(this.status!=='continue')throw Error('cannot continue run');this.continues++;this.score=[0,0];this.round=1;this.hp=ROSTER[this.player].hp;this.status='ready';}
}
