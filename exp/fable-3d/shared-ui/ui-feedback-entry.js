import {createUIFeedback,readUIAudioMuted,syncSoundToggle,subscribeUIAudioMuted} from './ui-feedback.js';

// Fetching tiny local samples never opens or resumes an audio context. They are
// ready for the first deliberate choice; navigation itself is never delayed.
const sounds=Object.fromEntries(['select','confirm','back','save'].map(kind=>
 [kind,new URL('../ui-art/v18/audio/ui-'+kind+'.wav',import.meta.url)]));
const bytes=new Map(Object.values(sounds).map(url=>[url.href,
 fetch(url).then(response=>response.ok?response.arrayBuffer():null).catch(()=>null)]));
const feedback=createUIFeedback({sounds,volume:.55,fetcher:async url=>{
 const data=await bytes.get(String(url));
 return {ok:!!data,arrayBuffer:async()=>data?.slice(0)};
}});
// Battle feedback occupies the reserved status line, never the resource bars.
// The original ID/live-region and event timing remain owned by the game.
const note=document.getElementById('note'),footnote=document.querySelector('#app .footnote');
if(note&&footnote){
 footnote.querySelector('span')?.classList.add('keyboard-help');
 footnote.prepend(note);
}
const toggle=document.getElementById('lobby-sound');
if(toggle){
 syncSoundToggle(toggle,readUIAudioMuted());
 subscribeUIAudioMuted(muted=>syncSoundToggle(toggle,muted));
 toggle.addEventListener('click',()=>{const muted=feedback.setMuted(!feedback.muted);if(!muted)void feedback.play('select');});
}
// A save mark describes a successful write, never merely the press of Save.
document.addEventListener('mamoken:save-complete',()=>{
 const status=document.getElementById('editor-save-state');
 if(status){status.textContent='保存しました。旅の記録はこの端末に残ります。';status.dataset.saved='true';}
});

