import {markUIArt} from '../shared-ui/p4-art-map.js';
import {P4_POLISH_ART} from '../shared-ui/p4-polish-art.js';
markUIArt();
// MENU-B (UI bible 13, user-picked direction): one large stage + five mode switches.
// First tap on a switch shows that mode on the stage; the start button (or a second tap
// on the shown switch) enters it. Read-only: never writes the saved avatar or progress.
const MODES={
 battle:{art:'mode-vs',kicker:'一対一の真剣勝負',title:'対戦する',text:'9体から相棒を選んで、CPUとひと勝負。',action:'相棒を選ぶ'},
 arcade:{art:'mode-arcade',kicker:'勝ち進む',title:'アーケード',text:'全8戦。最後の相手まで勝ち抜こう。',action:'8戦に挑む'},
 practice:{art:'mode-practice',kicker:'自分の間合いを知る',title:'練習する',text:'技と連係を、自分のペースで。',action:'技を試す'},
 story:{art:'mode-story',kicker:'自分を作って、旅に出る',title:'キャラクリ＋探索',text:'自分だけの姿と技で、集落へ。',action:'旅の支度'},
 survival:{art:'mode-survival',kicker:'生き残る',title:'サバイバル',text:'体力をつないで、連勝に挑もう。',action:'連勝に挑む'},
};
const $=id=>document.getElementById(id);
const menu=$('menu'),tabs=[...document.querySelectorAll('.mode-tab[data-mode]')],start=$('mode-start');
for(const node of document.querySelectorAll('[data-art]'))node.style.backgroundImage=`url("${P4_POLISH_ART[MODES[node.dataset.art].art]}")`;
let selected='battle';
function select(mode,{focus=false}={}){
 if(!MODES[mode])return;
 const changed=mode!==selected;selected=mode;menu.dataset.selected=mode;
 const m=MODES[mode],tab=tabs.find(t=>t.dataset.mode===mode);
 for(const t of tabs){if(t===tab)t.setAttribute('aria-current','true');else t.removeAttribute('aria-current');}
 $('stage-kicker').textContent=m.kicker;$('stage-title').textContent=m.title;$('stage-text').textContent=m.text;$('stage-action').textContent=m.action;
 start.href=tab.getAttribute('href');
 $('saved-journey').hidden=mode!=='story'||!journeyLabel;
 if(changed){menu.classList.remove('stage-swap');void menu.offsetWidth;menu.classList.add('stage-swap');}
 // Back navigation returns to the mode that was showing (URL hash only, no storage write).
 try{history.replaceState(history.state,'','#'+mode);}catch{}
 if(focus)tab.focus();
}
for(const tab of tabs){
 tab.addEventListener('click',event=>{
  if(tab.dataset.mode!==selected){event.preventDefault();select(tab.dataset.mode);}
 });
 tab.addEventListener('focus',()=>{if(tab.matches(':focus-visible'))select(tab.dataset.mode);});
 tab.addEventListener('keydown',event=>{
  const step=event.key==='ArrowRight'?1:event.key==='ArrowLeft'?-1:0;if(!step)return;
  event.preventDefault();const i=(tabs.indexOf(tab)+step+tabs.length)%tabs.length;select(tabs[i].dataset.mode,{focus:true});
 });
}
// Horizontal swipe on the stage switches modes like the switches below it.
let swipe=null;
menu.addEventListener('pointerdown',event=>{if(event.target.closest('a,button'))return;swipe={x:event.clientX,y:event.clientY,id:event.pointerId};});
menu.addEventListener('pointerup',event=>{
 if(!swipe||swipe.id!==event.pointerId)return;
 const portrait=document.documentElement.classList.contains('portrait');
 const dx=portrait?event.clientY-swipe.y:event.clientX-swipe.x,dy=portrait?swipe.x-event.clientX:event.clientY-swipe.y;swipe=null;
 if(Math.abs(dx)<48||Math.abs(dx)<Math.abs(dy)*1.4)return;
 const i=tabs.findIndex(t=>t.dataset.mode===selected),next=(i+(dx<0?1:-1)+tabs.length)%tabs.length;select(tabs[next].dataset.mode);
});
menu.addEventListener('pointercancel',()=>{swipe=null;});
function rotate(){const native=globalThis.mamokenNative?.isNative===true||globalThis.Capacitor?.isNativePlatform?.()===true;document.documentElement.classList.toggle('portrait',!native&&innerHeight>innerWidth);}
addEventListener('resize',rotate);rotate();
let journeyLabel='';
async function restoreJourneyLabel(){try{
 await globalThis.mamokenNative?.ready;
 const raw=localStorage.getItem('mamoken.story.v16.1');
 if(raw&&raw.length<100000){const saved=JSON.parse(raw);if(saved.version===1&&typeof saved.avatar?.name==='string'){
  journeyLabel=saved.avatar.name.slice(0,24)+' の旅を続ける';
  const tag=$('saved-journey');tag.textContent=journeyLabel;tag.title=journeyLabel;tag.hidden=selected!=='story';
 }}
}catch{/* A damaged or unavailable save must never block the mode menu. */}}
const initial=location.hash.slice(1);
select(MODES[initial]?initial:'battle');menu.classList.remove('stage-swap');
restoreJourneyLabel();
window.mamokenMenu={get selected(){return selected;},select,MODES};
