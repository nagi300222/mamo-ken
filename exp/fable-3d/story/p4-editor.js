import {markUIArt} from '../shared-ui/p4-art-map.js';
markUIArt();
// Visual editor enhancement only. Existing input IDs, form events, validation,
// preview, save and Story progress remain owned by the original editor.
const form=document.getElementById('avatar-form');
if(form){
 const details=[...form.children].filter(node=>node.tagName==='DETAILS');
 if(details.length>=3){
  const nav=document.createElement('nav');nav.className='p4-editor-tabs';nav.id='p4-editor-tabs';nav.setAttribute('role','tablist');nav.setAttribute('aria-label','キャラクター編集の手順');
  const save=document.createElement('section');save.className='p4-tab-panel';save.innerHTML='<h3 class="p4-save-title">旅の札を確かめよう。</h3><p class="p4-save-copy">この姿と戦い方で出発。集落に入ったあとも編集できます。</p><dl class="p4-save-summary"><div><dt>名前</dt><dd data-save-name></dd></div><div><dt>体格</dt><dd data-save-base></dd></div><div><dt>戦い方</dt><dd data-save-style></dd></div><div><dt>実パーツ</dt><dd data-save-mesh></dd></div></dl>';
  const panels=[...details.slice(0,3),save],labels=['体格・パーツ','色・模様','戦い方','旅の札'];
  const actions=form.querySelector('.editor-actions');actions.before(save);
  let active=0,initialized=false;
  const choose=(index,focus=false)=>{
   active=(index+panels.length)%panels.length;
   document.getElementById('editor').dataset.editorStep=String(active);
   [...nav.children].forEach((button,i)=>{const selected=i===active;button.setAttribute('aria-selected',String(selected));button.tabIndex=selected?0:-1;panels[i].hidden=!selected;});
   if(active===3)summary();if(focus)nav.children[active].focus();
   // Short screens initially show the name/base row and tabs. Reveal the newly
   // selected content below the sticky tabs instead of leaving it offscreen.
   if(initialized)panels[active].scrollIntoView({block:'start',behavior:'instant'});
   initialized=true;
  };
  for(const [index,panel] of panels.entries()){
   panel.classList.add('p4-tab-panel');panel.id='p4-editor-panel-'+index;panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby','p4-editor-tab-'+index);if(panel.tagName==='DETAILS')panel.open=true;
   const button=document.createElement('button');button.type='button';button.id='p4-editor-tab-'+index;button.setAttribute('role','tab');button.setAttribute('aria-controls',panel.id);button.textContent=labels[index];button.onclick=()=>choose(index);nav.appendChild(button);
  }
  details[0].before(nav);
  // A scrollable editor body and a separate, always-visible footer. Leaving
  // actions in the form keeps submit validation, Enter and existing listeners
  // intact; they no longer cover fields or disappear below the fold.
  const scroll=document.createElement('div');scroll.className='p4-editor-scroll';scroll.tabIndex=-1;
  const footer=document.createElement('div');footer.className='p4-editor-footer';
  const preview=document.getElementById('preview-state'),error=document.getElementById('editor-error');
  for(const node of [...form.children])if(node!==actions&&node!==preview&&node!==error&&node!==nav)scroll.appendChild(node);
  const saveState=document.createElement('p');saveState.className='p4-save-state';saveState.id='editor-save-state';saveState.setAttribute('role','status');saveState.textContent='保存してから、集落へ進みます。';
  footer.append(saveState);if(preview)footer.append(preview);if(error)footer.append(error);footer.append(actions);form.append(nav,scroll,footer);
  const markEdited=()=>{saveState.textContent='変更あり · 未保存';delete saveState.dataset.saved;};form.addEventListener('input',markEdited);form.addEventListener('change',markEdited);
  const app=document.getElementById('story-app');if(app)new MutationObserver(()=>{if(app.dataset.mode==='editor')saveState.textContent='編集内容を確認して、保存して出発。';}).observe(app,{attributes:true,attributeFilter:['data-mode']});
  nav.addEventListener('keydown',event=>{const step={ArrowRight:1,ArrowLeft:-1}[event.key];if(step){event.preventDefault();choose(active+step,true);}else if(event.key==='Home'||event.key==='End'){event.preventDefault();choose(event.key==='Home'?0:panels.length-1,true);}});
  const summary=()=>{
   for(const [key,id] of [['name','avatar-name'],['base','avatar-base'],['style','avatar-style']]){const input=document.getElementById(id);save.querySelector('[data-save-'+key+']').textContent=input?.selectedOptions?.[0]?.textContent??input?.value??'';}
   const parts=[...form.querySelectorAll('#mesh-part-fields select')].filter(select=>select.value).map(select=>(select.parentElement.firstChild?.textContent??'部位')+'：'+select.selectedOptions[0].textContent);
   save.querySelector('[data-save-mesh]').textContent=parts.join(' / ')||'元の体格の部品';
  };
  form.addEventListener('input',summary);form.addEventListener('change',summary);summary();choose(0);
 }
}
