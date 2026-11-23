// One active Story modal. Focus and inert state follow the real game mode;
// loading, movies and backgrounding never keep a hidden dialog keyboard-active.
export function createModalFocus(root){
 const doc=root.ownerDocument,blocked=new Map();
 let dialog=null,initial=null,suspended=doc.hidden||globalThis.mamokenNative?.active===false;
 const visible=node=>!!node?.isConnected&&!node.closest('[hidden],[inert]')&&node.getClientRects().length>0;
 const targets=()=>dialog?[...dialog.querySelectorAll('button,a[href],input,select,textarea,[tabindex]')].filter(node=>node.tabIndex>=0&&!node.matches(':disabled')&&visible(node)):[];
 const focusInside=()=>{
  if(!dialog||suspended)return;
  const target=visible(initial)&&!initial.matches(':disabled')?initial:targets()[0]??dialog;
  target.focus({preventScroll:true});
 };
 const release=()=>{
  const old=dialog;dialog=null;initial=null;
  for(const [node,inert]of blocked)node.inert=inert;blocked.clear();
  if(old?.contains(doc.activeElement))doc.activeElement.blur();
 };
 const keydown=event=>{
  if(!dialog||suspended||event.key!=='Tab')return;
  const items=targets(),index=items.indexOf(doc.activeElement);
  event.preventDefault();event.stopPropagation();
  if(!items.length){dialog.focus({preventScroll:true});return;}
  const next=index<0?(event.shiftKey?items.length-1:0):(index+(event.shiftKey?-1:1)+items.length)%items.length;
  items[next].focus({preventScroll:true});
 };
 const focusin=event=>{if(dialog&&!suspended&&!dialog.contains(event.target))focusInside();};
 doc.addEventListener('keydown',keydown,true);doc.addEventListener('focusin',focusin,true);
 return {
  open(container,first){
   release();dialog=container.querySelector('[role="dialog"]')??container;initial=first;
   for(const child of root.children)if(!child.contains(dialog)&&child.id!=='status'){blocked.set(child,child.inert);child.inert=true;}
   focusInside();
  },
  close:release,
  suspend(){suspended=true;if(dialog?.contains(doc.activeElement))doc.activeElement.blur();},
  resume(){suspended=false;if(dialog&&!dialog.contains(doc.activeElement))focusInside();},
  dispose(){release();doc.removeEventListener('keydown',keydown,true);doc.removeEventListener('focusin',focusin,true);}
 };
}
