// UI-only feedback. Authored short samples are supplied by the integration entry
// point; there is no fallback to combat effects or delayed navigation.
export const UI_AUDIO_KEY='mamoken.ui.audio.v1';
const settingListeners=new Set();
let fallbackMuted=false;
function localStore(){try{return globalThis.localStorage;}catch{return null;}}
export function readUIAudioMuted(storage=localStore()){
 try{const raw=storage?.getItem(UI_AUDIO_KEY);if(raw==null)return fallbackMuted;
  const saved=JSON.parse(raw);return saved?.version===1&&typeof saved.muted==='boolean'?saved.muted:false;
 }catch{return fallbackMuted;}
}
export function setUIAudioMuted(next,storage=localStore()){
 const muted=!!next;fallbackMuted=muted;
 try{storage?.setItem(UI_AUDIO_KEY,JSON.stringify({version:1,muted}));}catch{/* Muting still works for this document if storage is unavailable. */}
 for(const listener of settingListeners)listener(muted);
 return muted;
}
export function subscribeUIAudioMuted(listener){settingListeners.add(listener);return()=>settingListeners.delete(listener);}
export function syncSoundToggle(button,muted){
 if(!button||button.disabled)return;
 button.textContent=muted?'音 OFF':'音 ON';
 button.setAttribute('aria-pressed',String(!muted));
}

export function createUIFeedback({sounds={},storage=localStore(),document:doc=globalThis.document,
 eventTarget=globalThis.window??globalThis,contextFactory=()=>globalThis.AudioContext??globalThis.webkitAudioContext,
 fetcher=(...args)=>globalThis.fetch(...args),volume=.32}={}){
 let context=null,master=null,armed=false,disposed=false,generation=0,muted=readUIAudioMuted(storage);
 const active=new Set(),buffers=new Map(),removers=[];
 const available=()=>!disposed&&!doc?.hidden&&eventTarget?.mamokenNative?.active!==false;
 function stop(){generation++;for(const source of active){try{source.stop();source.disconnect();}catch{}}active.clear();}
 function suspend(){armed=false;stop();if(context?.state==='running')try{context.suspend()?.catch?.(()=>{});}catch{}}
 function gesture(){
  if(!available())return false;armed=true;
  if(muted)return true;
  if(!context){try{const Factory=contextFactory();if(!Factory)return false;context=new Factory();master=context.createGain();master.gain.value=Math.max(0,Math.min(1,volume));master.connect(context.destination);}catch{context=null;master=null;return false;}}
  if(context.state==='suspended')try{context.resume()?.catch?.(()=>{});}catch{}
  return true;
 }
 async function play(kind){
  const url=sounds[kind];if(!url||muted||!armed||!available()||!gesture())return false;
  const token=++generation;
  try{
   if(context.state==='suspended')await context.resume();
   if(!buffers.has(String(url)))buffers.set(String(url),(async()=>{
    const response=await fetcher(url);if(!response.ok)throw Error('UI sample unavailable');
    return context.decodeAudioData(await response.arrayBuffer());
   })().catch(error=>{buffers.delete(String(url));throw error;}));
   const buffer=await buffers.get(String(url));
   if(token!==generation||muted||!armed||!available()||context.state!=='running')return false;
   const source=context.createBufferSource();source.buffer=buffer;source.connect(master);active.add(source);
   source.onended=()=>{active.delete(source);source.disconnect();};source.start();return true;
  }catch{return false;}
 }
 const unsubscribe=subscribeUIAudioMuted(value=>{muted=value;stop();if(master)master.gain.value=muted?0:Math.max(0,Math.min(1,volume));});
 function listen(target,type,handler,options){target?.addEventListener?.(type,handler,options);removers.push(()=>target?.removeEventListener?.(type,handler,options));}
 const realGesture=event=>{if(event.isTrusted!==false)gesture();};
 listen(doc,'pointerdown',realGesture,{capture:true});
 listen(doc,'keydown',event=>{if(['Enter',' ','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))realGesture(event);},{capture:true});
 listen(doc,'visibilitychange',()=>{if(doc.hidden)suspend();});
 listen(eventTarget,'pagehide',suspend);
 listen(eventTarget,'blur',suspend);
 listen(eventTarget,'mamoken:native-state',event=>{if(event.detail?.active===false)suspend();});
 listen(eventTarget,'storage',event=>{if(event.key===UI_AUDIO_KEY){muted=readUIAudioMuted(storage);stop();}});
 // Only menu intent produces a UI cue; the six combat buttons keep their actual
 // hit/guard/whiff audio. Capture the enabled intent before a target handler
 // disables its button for loading. Save success is explicit, never inferred
 // from a click.
 listen(doc,'click',event=>{
  const button=event.target?.closest?.('button,a[href],[role=tab]');if(!button||button.disabled||button.matches('[data-control]'))return;
  let kind=button.dataset.uiFeedback;
  if(kind==='none'||kind==='save')return;
  if(!kind){
   if(button.matches('.fighter-card,[role=tab]'))kind='select';
   else if(button.matches('#select-back,#result-select,#cinematic-skip,#presentation-skip,#movie-skip,[data-ui-back]'))kind='back';
   else if(button.matches('.mode,#start,#rematch,#talk,#challenge,[data-ui-confirm]'))kind='confirm';
  }
  if(kind)void play(kind);
 },{capture:true});
 listen(doc,'mamoken:save-complete',()=>void play('save'));
 return {play,gesture,suspend,stop,setSounds(next){stop();sounds={...next};},setMuted(next){return setUIAudioMuted(next,storage);},get muted(){return muted;},get context(){return context;},get activeCount(){return active.size;},dispose(){if(disposed)return;suspend();disposed=true;unsubscribe();for(const remove of removers)remove();context?.close?.()?.catch?.(()=>{});buffers.clear();}};
}
