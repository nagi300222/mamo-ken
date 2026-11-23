// Display/input contract shared by the dojo and Story. Battle remains the only
// owner of guard, attacks, costs, hit confirmation and fixed 60 Hz simulation.
import {ROSTER,FPS} from '../dojo/balance.js';
import {DRIVE} from '../dojo/battle.js';
import {hudTheme,chargePips} from '../dojo/hud-themes.js';
export const BATTLE_INPUT_PROFILE=Object.freeze({
 id:'mamoken-six-button-v1',deadzone:.24,directionThreshold:.33,doubleTapMs:280,
 directions:Object.freeze(['left','right','up','down']),
 keyMap:Object.freeze({ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down',KeyA:'left',KeyD:'right',KeyW:'up',KeyS:'down',KeyZ:'weak',KeyX:'strong',KeyV:'throw',KeyB:'special',KeyM:'ultimateButton',KeyN:'gyuiin',KeyC:'dash',KeyF:'stepForward',KeyR:'stepBack'}),
 attacks:Object.freeze([
  {key:'weak',label:'弱',className:'weak',aria:'弱攻撃'},
  {key:'strong',label:'強',className:'heavy',aria:'強攻撃'},
  {key:'throw',label:'掴み',className:'throw',aria:'掴み'},
  {key:'gyuiin',label:'ギュイーン',className:'gyuiin',aria:'ギュイーン',status:'gyuiin-status'},
  {key:'special',label:'必殺',className:'special',aria:'方向と組み合わせて必殺技、下で咆哮',status:'roar-status'},
  {key:'ultimateButton',label:'奥義',className:'ultimateButton',aria:'奥義',status:'ultimate-status'}
 ].map(Object.freeze)),
 steps:Object.freeze([{key:'stepBack',label:'後ステップ'},{key:'stepForward',label:'前ステップ'}].map(Object.freeze))
});
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function battleAnalog(x,y){
 if(!Number.isFinite(x)||!Number.isFinite(y))return {x:0,y:0,left:false,right:false,up:false,down:false};
 const norm=Math.hypot(x,y);if(norm< BATTLE_INPUT_PROFILE.deadzone)x=y=0;else if(norm>1){x/=norm;y/=norm;}
 const t=BATTLE_INPUT_PROFILE.directionThreshold;return {x,y,left:x<=-t,right:x>=t,up:y<=-t,down:y>=t};
}
export function createCombatInput(now=()=>performance.now()){
 const keys=new Set(),touches=new Map(),queued=new Set(),samples=[];
 let analog=battleAnalog(0,0),lastTap=null,dashPulse=0;
 const dirs=BATTLE_INPUT_PROFILE.directions;
 function directionTap(key){const time=now();if(lastTap?.key===key&&time-lastTap.at<BATTLE_INPUT_PROFILE.doubleTapMs)dashPulse=3;lastTap={key,at:time};}
 function record(){const next=Object.fromEntries(dirs.map(k=>[k,keys.has(k)||analog[k]]));if(next.up||next.down){lastTap=null;dashPulse=0;}
  const old=samples.at(-1);if(old&&dirs.every(k=>old[k]===next[k]))return;samples.push(next);if(samples.length>24)samples.shift();}
 return {
  keyDown(code){const key=BATTLE_INPUT_PROFILE.keyMap[code];if(!key||keys.has(key))return false;
   if(['left','right'].includes(key)&&!keys.has('up')&&!keys.has('down'))directionTap(key);
   keys.add(key);if(dirs.includes(key))record();else queued.add(key);return true;},
  keyUp(code){const key=BATTLE_INPUT_PROFILE.keyMap[code];if(!key)return false;keys.delete(key);if(dirs.includes(key))record();return true;},
  setAnalog(x,y){const previous=analog,next=battleAnalog(x,y);if(!previous.left&&!previous.right&&!previous.up&&!previous.down&&!next.up&&!next.down&&(next.left||next.right))directionTap(next.left?'left':'right');analog=next;record();return {...analog};},
  hold(pointer,key){if(![...BATTLE_INPUT_PROFILE.attacks,...BATTLE_INPUT_PROFILE.steps].some(x=>x.key===key))return false;touches.set(pointer,key);queued.add(key);return true;},
  release(pointer){touches.delete(pointer);},
  consume(){const result={directionSamples:samples.splice(0)};for(const key of keys)result[key]=true;for(const key of dirs)if(analog[key])result[key]=true;for(const key of touches.values())result[key]=true;for(const key of queued)result[key]=true;queued.clear();if(dashPulse>0){result.dash=true;dashPulse--;}return result;},
  clear(){keys.clear();touches.clear();queued.clear();samples.length=0;analog=battleAnalog(0,0);lastTap=null;dashPulse=0;},
  get snapshot(){return {keys:[...keys],pointers:[...touches],analog:{...analog},queued:[...queued],samples:samples.length,dashPulse};}
 };
}
export function battleControlsMarkup(){return '<div class="attack-pad">'+BATTLE_INPUT_PROFILE.attacks.map(b=>`<button type="button" data-control="${b.key}" class="attack ${b.className}" aria-label="${b.aria}"><span class="attack-label">${b.label}</span>${b.status?`<small id="${b.status}"></small>`:''}</button>`).join('')+'</div>';}
export function battleStepsMarkup(){return '<div class="step-pad" role="group" aria-label="前後ステップ">'+BATTLE_INPUT_PROFILE.steps.map(b=>`<button type="button" data-control="${b.key}" class="step-button" aria-label="${b.label}">${b.label}</button>`).join('')+'</div>';}
export function battleHUDMarkup(){const side=i=>`<div class="hud-side${i?' mirrored':''}" id="hud-side-${i}"><div class="hud-name"><b>${i?'CPU':'1P'}</b><span id="name-${i}"></span><small id="ability-${i}"></small></div><div class="resource health"><span>体力</span><div class="track"><i id="hp-${i}"></i></div></div><div class="resource drive"><span>ドライブ</span><div class="track"><i id="drive-${i}"></i></div><b id="drive-value-${i}">100</b></div><div class="resource super"><span>奥義</span><div class="track"><i id="meter-${i}"></i></div><b id="super-value-${i}">0</b><small id="ultimate-ready-${i}" class="ultimate-ready" hidden>READY</small></div><div class="trait-row"><span id="trait-${i}" class="trait-word"></span><small>ガード <b id="guard-value-${i}"></b></small><div id="charge-pips-${i}" class="charge-pips" hidden><i></i><i></i><i></i></div></div></div>`;
 return side(0)+'<div class="round-center"><span id="timer">75</span><small id="round-message">ROUND 1</small></div>'+side(1);}
export function abilityLabel(p){const a=p.ability??{};switch(p.id){case'moguzo':return a.gutsReady?'根性 READY':`根性 ${a.gutsProgress??0}/2`+(a.grit?' · 踏ん張り':'');case'pisuke':return a.chase?'CHASE 受付中':'チェイス';case'godan':return a.armorCooldown?'装甲 回復中':'装甲 READY';case'hakuma':return a.iron?'鉄壁 READY':'鉄壁';case'chirka':return 'フェイント/ディレイ';case'takimaru':return a.pressure?'投げ派生 READY':'プレッシャー';case'yomikage':return a.just?'見切り返し READY':'後の先';case'bullet':return 'チャージ '+(a.charge??0)+'/3';case'dark_moguzo':return a.dark&&!a.darkUsed?'暗連 READY':'暗連';default:return '';}}
export function driveStatus(move,battle){const[p,op]=battle.fighters;if(battle.phase!=='fight')return'終了';if(p.drive<DRIVE[move+'Cost'])return'不足';if(p[move+'Cooldown']>0)return'回復中';if(battle.clinch)return'待機';if(move==='gyuiin')return p.y>.09?'空中':'発動可';if(p.stop||p.stun)return'待機';if(p.y>.06)return'空中';const counter=p.action?.kind!=='roar'&&op.action?.kind==='roar';return p.dashF||(p.action&&!counter)?'待機':'発動可';}
// Names belong on the touch targets; changing availability belongs next to
// them. Keeping the status nodes in their original buttons also preserves the
// dojo's status updates and accessibility contract.
function readableControlGuide(root,battle){
 const rail=root.querySelector('#buttons-rail')??root.querySelector('#battle-buttons');if(!rail)return;
 for(const button of rail.querySelectorAll('.attack[data-control]')){
  if(!button.querySelector('.attack-label')){const text=[...button.childNodes].find(node=>node.nodeType===3&&node.textContent.trim());if(text){const label=button.ownerDocument.createElement('span');label.className='attack-label';label.textContent=text.textContent.trim();text.replaceWith(label);}}
 }
 let guide=rail.querySelector('.battle-control-guide');
 if(!guide){guide=rail.ownerDocument.createElement('div');guide.className='battle-control-guide';guide.setAttribute('aria-hidden','true');guide.innerHTML='<p class="control-directions">そのまま・↑・前 ＋ 必殺</p><p><b>↓＋必殺</b><span data-control-state="roar"></span></p><p><b>ギュイーン</b><span data-control-state="gyuiin"></span></p><p><b>奥義</b><span data-control-state="ultimate"></span></p>';rail.appendChild(guide);}
 for(const [move,label] of [['roar','咆哮 ' + driveStatus('roar',battle)],['gyuiin',driveStatus('gyuiin',battle)],['ultimate',battle.fighters[0].super>=100?'発動可':'ゲージ不足']]){const node=guide.querySelector('[data-control-state="'+move+'"]');if(node.textContent!==label)node.textContent=label;node.dataset.ready=String(move==='ultimate'?battle.fighters[0].super>=100:driveStatus(move,battle)==='発動可');}
}
export function updateBattleHUD(root,{battle,names=[],roundLabel='ROUND 1',practice=false}){
 if(!battle)return;const find=id=>root.querySelector('#'+id),set=(id,value)=>{const node=find(id);if(node&&node.textContent!==String(value))node.textContent=String(value);};
 readableControlGuide(root,battle);
 for(let i=0;i<2;i++){
  const p=battle.fighters[i],r=ROSTER[p.id],theme=hudTheme(p.id),side=find('hud-side-'+i);if(side){side.dataset.element=theme.tone;side.dataset.mark=theme.mark;side.querySelector('.hud-name').dataset.mark=theme.mark;}
  set('name-'+i,names[i]??p.displayName??r.name);set('trait-'+i,theme.word);set('ability-'+i,abilityLabel(p));set('drive-value-'+i,Math.floor(p.drive));set('super-value-'+i,Math.floor(p.super));set('guard-value-'+i,Math.ceil(p.guard));
  for(const [id,value]of [['hp-',p.hp/r.hp*100],['drive-',p.drive/DRIVE.max*100],['meter-',p.super]]){const node=find(id+i);if(node)node.style.width=clamp(value,0,100)+'%';}
  find('hp-'+i)?.classList.toggle('low',p.hp/r.hp<.25);find('meter-'+i)?.classList.toggle('ready',p.super>=100);const ready=find('ultimate-ready-'+i);if(ready)ready.hidden=p.super<100;
  const charge=find('charge-pips-'+i);if(charge){charge.hidden=p.id!=='bullet';if(p.id==='bullet'){const pips=chargePips(p.ability.charge);[...charge.children].forEach((node,k)=>node.classList.toggle('filled',pips[k]));charge.setAttribute('aria-label','バレットのチャージ '+p.ability.charge+'/3');}}
 }
 set('timer',practice?'∞':Math.ceil(battle.time/FPS));set('round-message',practice?'PRACTICE':battle.phase==='fight'?roundLabel:'FINISH');
 for(const move of ['roar','gyuiin']){const status=driveStatus(move,battle);set(move+'-status',move==='roar'?'咆哮 '+status:status);const button=find(move+'-status')?.parentElement;if(button){if(move==='gyuiin'){button.toggleAttribute('data-wait',status!=='発動可');button.setAttribute('aria-label','ギュイーン：'+status);}else button.setAttribute('aria-label','必殺技：そのまま・上・前＋必殺。下＋必殺は咆哮：'+status);}}
 const ultimate=find('ultimate-status');if(ultimate){const ready=battle.fighters[0].super>=100;ultimate.textContent=ready?'発動可':'ゲージ不足';ultimate.parentElement.toggleAttribute('data-wait',!ready);ultimate.parentElement.setAttribute('aria-label','奥義：'+(ready?'発動可':'ゲージ不足'));}
}
