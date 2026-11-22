// Presentation-only director. The combat simulation is paused while the cutaway plays.
// This is real-time in-engine 3D filmmaking, NOT a pre-rendered video or extra damage.
export const MOVIE_SECONDS=2.15;
export const QUICK_MOVIE_SECONDS=.55;
export const MOVIE_STAGES=Object.freeze(['anticipation','hero','impact','aftermath']);
export const MOVIE_SCRIPTS=Object.freeze({
  moguzo:['大地が目を覚ます','拳が地を駆ける','大地烈掌'],
  pisuke:['風は止まらない','加速、そして連脚','音速連咆'],
  godan:['その重みは山のように','砕く、ただ一撃','山崩し'],
  hakuma:['静かなる白峰','不動の連撃','白峰不動掌'],
  chirka:['どれが本物？','幻影から本命へ','百面本命打ち'],
  takimaru:['逃がさない','天地ごと投げ落とす','天地落とし'],
  yomikage:['見切った','月光の一閃','後の先・月断'],
  bullet:['狙いはひとつ','弾丸、解き放つ','超圧縮・弾丸頭突き'],
  dark_moguzo:['闇に紛れろ','雷光の連撃','暗連・黒天烈掌']
});
export function isConfirmedUltimateHit(event){
 return !!(event&&event.type==='ultimate_hit'&&event.damage>0&&
  (event.slot===0||event.slot===1)&&
  (event.target===0||event.target===1)&&event.slot!==event.target);
}
export function movieScript(id){return MOVIE_SCRIPTS[id]||MOVIE_SCRIPTS.moguzo;}
export function createMovieDirector({reducedMotion=false}={}){
 let data=null,elapsed=0,finished=false;
 const duration=reducedMotion?QUICK_MOVIE_SECONDS:MOVIE_SECONDS;
 function start(event,id){
   if(data||!isConfirmedUltimateHit(event))return false;
   data={slot:event.slot,target:event.target,id,move:event.move,damage:event.damage};
   elapsed=0;finished=false;return true;
 }
 function update(dt){
   if(!data)return {active:false,ended:finished,phase:'none',progress:1,data:null};
   elapsed=Math.min(duration,elapsed+Math.max(0,Math.min(.12,Number(dt)||0)));
   const progress=elapsed/duration;
   const phase=reducedMotion?(progress<.5?'hero':'impact'):
     progress<.21?'anticipation':progress<.51?'hero':
     progress<.78?'impact':'aftermath';
   const ended=elapsed>=duration;
   return {active:true,ended,phase,progress,data};
 }
 function cancel(){data=null;elapsed=0;finished=true;}
 return {start,update,cancel,movieScript,
   get active(){return !!data;},
   get data(){return data;},
   get duration(){return duration;},
   get elapsed(){return elapsed;}
 };
}
