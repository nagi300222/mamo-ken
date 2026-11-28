import {ROSTER} from './balance.js';
import {STAGE_NAMES,survivalLevel} from './run-controller.js';
import {runDialogue} from './run-dialogue.js';

export function createRunUI({onNext}){
 const $=id=>document.getElementById(id),mode=$('match-mode');
 for(const [value,label] of [['arcade','アーケード（8戦）'],['survival','サバイバル']]){const o=document.createElement('option');o.value=value;o.textContent=label;mode.appendChild(o);}
 const levelLabel=document.createElement('label');levelLabel.className='opponent';levelLabel.hidden=true;levelLabel.append('CPU Lv ');
 const level=document.createElement('select');level.id='run-difficulty';level.setAttribute('aria-label','アーケードCPU難度');
 for(let i=1;i<=9;i++){const o=document.createElement('option');o.value=String(i);o.textContent=String(i);level.appendChild(o);}levelLabel.appendChild(level);$('difficulty').parentElement.after(levelLabel);
 const note=document.createElement('small');note.id='run-rule-note';note.hidden=true;note.textContent='旧版ルール／3D景観・CPU防御は近似。サバイバル自己ベストはこの端末に保存';$('selection').querySelector('.selection-footer').appendChild(note);
 const status=document.createElement('output');status.id='run-status';status.hidden=true;status.setAttribute('aria-live','off');($('app').querySelector('.footnote')??$('arena')).appendChild(status);
 const next=document.createElement('button');next.id='run-next';next.className='primary';next.hidden=true;next.onclick=onNext;$('rematch').after(next);
 const dialog=document.createElement('div');dialog.className='run-dialogue';dialog.id='run-dialogue';dialog.hidden=true;dialog.setAttribute('role','dialog');dialog.setAttribute('aria-label','対戦前の掛け合い');
 const speaker=document.createElement('strong'),line=document.createElement('p'),advance=document.createElement('button');advance.className='primary';advance.textContent='次へ';dialog.append(speaker,line,advance);$('arena').appendChild(dialog);
 const style=document.createElement('style');style.textContent=`
 #run-status{position:absolute;z-index:7;top:52px;left:8px;right:8px;text-align:center;font-size:10px;line-height:1.4;color:#fff4d4;text-shadow:0 1px 3px #000;pointer-events:none;background:#19212b9c;border-radius:4px;padding:2px 5px}
 #run-rule-note{flex-basis:100%;font-size:10px;color:#c6b9a2}#run-rule-note[hidden],#run-status[hidden],#run-next[hidden],.run-dialogue[hidden]{display:none!important}
 .run-dialogue{position:absolute;z-index:45;inset:0;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:12px;background:#111a29ed;color:#f8e7c0;text-align:center}
 .run-dialogue strong{font-size:14px}.run-dialogue p{font-size:clamp(14px,2.3vw,23px);margin:12px 0 20px}.run-dialogue button{min-height:40px}
 `;document.head.appendChild(style);
 let pending=null;
 function cancelDialogue(){if(pending){const done=pending;pending=null;dialog.hidden=true;advance.onclick=null;done(false);}}
 const checkAllowed=new URLSearchParams(globalThis.location?.search??'').get('check')==='1';
 mode.addEventListener('change',()=>{
  const value=mode.value,isRun=['arcade','survival'].includes(value);
  $('cpu-choice').parentElement.hidden=isRun;
  $('difficulty').parentElement.hidden=isRun||value==='practice';levelLabel.hidden=value!=='arcade';note.hidden=!isRun;
  // The cinematic check toggle is a ?check=1 developer aid (main.js); never reveal it otherwise.
  if($('check-mode-label'))$('check-mode-label').hidden=!checkAllowed||isRun||value==='practice';
 });
 return {
  get level(){return +level.value;},
  reset(){cancelDialogue();status.hidden=true;next.hidden=true;$('rematch').hidden=false;},
  cancelDialogue,
  async dialogue(run){
   if(run.mode!=='arcade'||run.round!==1)return true;
   cancelDialogue();const lines=runDialogue(run.player,run.encounter.opponent,run.index);let index=0;
   const paint=()=>{speaker.textContent=lines[index].speaker?ROSTER[lines[index].speaker].name:'FINAL';line.textContent=lines[index].text;advance.textContent=index===lines.length-1?'VSへ':'次へ';};
   paint();dialog.hidden=false;
   return new Promise(resolve=>{pending=resolve;advance.onclick=()=>{if(++index<lines.length)paint();else{pending=null;dialog.hidden=true;advance.onclick=null;resolve(true);}};});
  },
  hud(run){
   if(!run){status.hidden=true;return;}status.hidden=false;const e=run.encounter;
   status.textContent=run.mode==='arcade'?`ARCADE ${e.final?'FINAL':e.fight+'/8'} · ROUND ${run.round} · ${run.score[0]} — ${run.score[1]} · CPU Lv${e.level} · ${STAGE_NAMES[e.stage]} · CONTINUE ${run.continues}`:
    `SURVIVAL ${run.wins}勝 · HP ${Math.ceil(run.status==='fighting'?run.battle.fighters[0].hp:run.hp)} · 回復 +${run.lastHeal} · CPU Lv${e.level}${e.boss?' BOSS':''} · 次 Lv${survivalLevel(e.fight+1)} · BEST ${run.best}`;
  },
  result(run,out){
   $('rematch').hidden=true;next.hidden=['end','clear'].includes(out.kind);
   next.textContent=out.kind==='continue'?'CONTINUE':out.kind==='round'?'次のラウンド':'次の対戦';
   $('result-title').textContent=out.kind==='clear'?'ARCADE CLEAR':out.kind==='end'?'SURVIVAL END':out.kind==='continue'?'CONTINUE?':out.kind==='round'?'ROUND '+run.round+' 終了':'WIN';
   $('result-description').textContent=run.mode==='arcade'?`${run.index+1}/8戦 · ${run.score[0]} — ${run.score[1]} · CONTINUE ${run.continues}`:`${run.wins}連勝 · 残HP ${Math.ceil(run.hp)} · 回復 +${run.lastHeal} · BEST ${run.best}`;
   this.hud(run);
  }
 };
}
