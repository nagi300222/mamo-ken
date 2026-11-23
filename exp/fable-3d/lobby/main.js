import {markUIArt} from '../shared-ui/p4-art-map.js';
markUIArt();
// Read-only presentation: never modifies the saved avatar or journey progress.
function rotate(){const native=globalThis.mamokenNative?.isNative===true||globalThis.Capacitor?.isNativePlatform?.()===true;document.documentElement.classList.toggle('portrait',!native&&innerHeight>innerWidth);}
addEventListener('resize',rotate);rotate();
async function restoreJourneyLabel(){try{
 await globalThis.mamokenNative?.ready;
 const raw=localStorage.getItem('mamoken.story.v16.1');
 if(raw&&raw.length<100000){const saved=JSON.parse(raw);if(saved.version===1&&typeof saved.avatar?.name==='string'){
  document.getElementById('saved-journey').textContent=saved.avatar.name.slice(0,24)+' の旅を続ける';
 }}
}catch{/* A damaged or unavailable save must never block the mode menu. */}}
restoreJourneyLabel();
