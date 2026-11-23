import {Capacitor} from '@capacitor/core';
import {App} from '@capacitor/app';
import {Preferences} from '@capacitor/preferences';
import {createSaveMirror} from './save-mirror.js';

if(!window.mamokenNative){
 const native=Capacitor.isNativePlatform();
 const state={isNative:native,platform:Capacitor.getPlatform(),active:true,warnings:[],ready:null,flushSaves:async()=>{}};
 window.mamokenNative=state;
 function warning(message){state.warnings.push(message);console.warn('MamoKen native:',message);}
 function emit(active){
  if(state.active===active)return;state.active=active;
  window.dispatchEvent(new CustomEvent('mamoken:native-state',{detail:{active}}));
  if(!active)state.flushSaves();
 }
 state.ready=(async()=>{
  if(!native)return;
  document.documentElement.classList.add('native-runtime');
  let mirror;
  try{
   mirror=createSaveMirror({storage:window.localStorage,preferences:Preferences,onWarning:warning});
   await mirror.restore();mirror.install();state.flushSaves=()=>mirror.flush();
   // A fallback when a WebKit implementation does not expose writable Storage
   // methods. All game keys remain local; no cloud or account is involved.
   setInterval(()=>mirror.flush(),2000);
   await mirror.flush();
  }catch(error){warning('保存はWebKitのローカル領域のみ: '+error.message);}
  try{
   await App.addListener('appStateChange',({isActive})=>emit(!!isActive));
   await App.addListener('pause',()=>emit(false));
   await App.addListener('resume',()=>emit(true));
   const initial=await App.getState();emit(!!initial.isActive);
  }catch(error){warning('アプリ状態の通知を開始できません: '+error.message);}
 })();
}
