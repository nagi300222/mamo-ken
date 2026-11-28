// P4.5 SELECT-A (UI bible 13, user-picked A): 3×3 faces on the left, the chosen marmot
// steps onto a stage on the right with a large name. Match settings live behind one
// "対戦設定" sheet instead of three always-open selects.
// Layout only: every existing control (#roster buttons, #cpu-choice, #match-mode, #difficulty,
// #run-difficulty, #check-mode, #start) is MOVED, never re-created, so main.js / run-ui.js
// handlers and ids keep working unchanged.
import {ROSTER,IDS} from '../dojo/balance.js';
const $=id=>document.getElementById(id);
const selection=$('selection'),roster=$('roster'),start=$('start');
const MODE_LABEL={battle:'通常対戦',practice:'プラクティス',arcade:'アーケード',survival:'サバイバル'};
if(selection&&roster&&start&&!selection.classList.contains('select-a')){
 selection.classList.add('select-a');
 const inner=selection.querySelector('.selection-inner'),footer=selection.querySelector('.selection-footer');
 const profile=selection.querySelector('.p4-profile');
 // Head: back to the mode menu + what this screen is for.
 const head=document.createElement('div');head.className='sa-head';
 const back=footer.querySelector('a[href="../"]');if(back){back.className='sa-back';back.innerHTML='<b aria-hidden="true">‹</b> モード';back.setAttribute('aria-label','モード選択へ戻る');head.append(back);}
 const title=document.createElement('h1');title.className='sa-title';title.innerHTML='<small id="sa-mode">通常対戦</small>相棒を選ぶ';head.append(title);
 // Stage: full-body art + big name + short strengths (reuse the P4 profile copy).
 const stage=document.createElement('section');stage.className='sa-stage';stage.setAttribute('aria-label','選択中のキャラクター');
 const floor=document.createElement('i');floor.className='sa-floor';floor.setAttribute('aria-hidden','true');
 const body=document.createElement('img');body.className='sa-body';body.alt='';body.setAttribute('aria-hidden','true');body.decoding='async';
 stage.append(floor,body);if(profile)stage.append(profile);
 // Actions: settings summary chip + the one commit button.
 const actions=document.createElement('div');actions.className='sa-actions';
 const toggle=document.createElement('button');toggle.type='button';toggle.id='sa-settings-toggle';toggle.className='sa-settings-toggle';toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-controls','sa-settings');
 toggle.innerHTML='<span class="sa-settings-label">対戦設定</span><span id="sa-settings-summary" class="sa-settings-summary"></span>';
 const sheet=document.createElement('div');sheet.id='sa-settings';sheet.className='sa-settings';sheet.hidden=true;sheet.setAttribute('role','group');sheet.setAttribute('aria-label','対戦設定');
 for(const node of [...footer.children])if(node!==start&&!node.matches('.chosen'))sheet.append(node);
 const close=document.createElement('button');close.type='button';close.className='sa-settings-close';close.textContent='閉じる';sheet.append(close);
 actions.append(toggle,start);
 const main=selection.querySelector('.p4-selection-main')??inner;
 inner.prepend(head);main.append(stage);inner.append(actions);selection.append(sheet);footer.hidden=true;
 const setOpen=open=>{sheet.hidden=!open;toggle.setAttribute('aria-expanded',String(open));selection.classList.toggle('sa-sheet-open',open);if(open)sheet.querySelector('select,input,button')?.focus();else toggle.focus({preventScroll:true});};
 toggle.addEventListener('click',()=>setOpen(sheet.hidden));
 close.addEventListener('click',()=>setOpen(false));
 selection.addEventListener('keydown',event=>{if(event.key==='Escape'&&!sheet.hidden){event.preventDefault();setOpen(false);}});
 selection.addEventListener('pointerdown',event=>{if(!sheet.hidden&&!sheet.contains(event.target)&&!toggle.contains(event.target))setOpen(false);});
 // Keep the chip and stage in sync with the existing state owners.
 let shown=null;
 const chosenId=()=>{const i=[...roster.children].findIndex(node=>node.classList.contains('chosen'));return IDS[i]??IDS[0];};
 const option=id=>{const node=$(id);return node?.selectedOptions?.[0]?.textContent?.trim()??'';};
 function sync(){
  const id=chosenId();
  if(id!==shown){
   shown=id;body.src=new URL('../../../assets/roster3d/'+id+'.webp',import.meta.url).href;stage.dataset.fighter=id;
   stage.classList.remove('sa-enter');void stage.offsetWidth;stage.classList.add('sa-enter');
  }
  const mode=$('match-mode')?.value??'battle';selection.dataset.mode=mode;
  $('sa-mode').textContent=MODE_LABEL[mode]??option('match-mode');
  const parts=mode==='arcade'?['CPU Lv'+($('run-difficulty')?.value??'1')]:mode==='survival'?['勝ち抜くほど強く']:mode==='practice'?['相手 '+option('cpu-choice')]:['相手 '+option('cpu-choice'),option('difficulty')];
  if($('check-mode')?.checked&&!$('check-mode-label')?.hidden)parts.push('演出確認');
  $('sa-settings-summary').textContent=parts.filter(Boolean).join(' · ');
 }
 for(const id of ['cpu-choice','match-mode','difficulty','run-difficulty','check-mode'])$(id)?.addEventListener('change',()=>queueMicrotask(sync));
 new MutationObserver(sync).observe(roster,{subtree:true,attributes:true,attributeFilter:['class'],childList:true});
 new MutationObserver(sync).observe(selection,{attributes:true,attributeFilter:['class']});
 // Roster tiles: name stays readable, role moves to the stage.
 sync();
 window.mamokenSelectA={sync,setOpen,get fighter(){return shown;},ROSTER};
}
