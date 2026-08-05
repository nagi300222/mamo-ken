#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(__dirname,'..');
const TARGET=path.join(ROOT,'prototype','mamoken_prototype_v01.html');
const MARKER='/* T15 runtime command shadow hook */';
const SCRIPT_TAG='<script src="../runtime/runtime-command-shadow-browser.js"></script>';

function replaceOnce(source,anchor,replacement,label){
  const count=source.split(anchor).length-1;
  if(count!==1)throw new Error(`${label}: expected one anchor, found ${count}`);
  return source.replace(anchor,replacement);
}

let html=readFileSync(TARGET,'utf8');
if(html.includes(MARKER)){
  if(!html.includes(SCRIPT_TAG))throw new Error('T15 marker exists but browser observer tag is missing');
  const calls=html.split('runtimeCommandShadowObserve(f,c,cm);').length-1;
  if(calls!==2)throw new Error(`T15 marker exists but observe call count is ${calls}`);
  console.log('T15 runtime shadow hook already applied');
  process.exit(0);
}

const helper=`${MARKER}
function runtimeCommandShadowReset(){
  const api=window.__MAMOKEN_COMMAND_SHADOW__;
  if(api&&api.enabled)api.reset();
}
function runtimeCommandShadowObserve(f,c,cm){
  const api=window.__MAMOKEN_COMMAND_SHADOW__;
  if(!api||!api.enabled)return;
  try{
    const trigger=c.t==='grab'?'grab':c.lv;
    const compatible=!!cm&&(trigger==='grab'
      ?cm.move.type==='grab'
      :(cm.move.type==='atk'||cm.move.type==='stance')&&cm.move.trigger===trigger);
    const legacy=compatible
      ?{kind:'command',commandId:f.c.id+':slot-'+(cm.idx+1),slot:cm.idx+1,name:cm.move.name}
      :(trigger==='grab'
        ?{kind:'fallback',fallback:'normal-grab'}
        :{kind:'fallback',fallback:'normal-attack',level:trigger});
    api.observeTrigger({
      frame:B.f,
      player:f.side,
      characterId:f.c.id,
      trigger:trigger,
      directions:f.dirBuf.map(function(entry){return{direction:entry.dir,frame:entry.f};}),
      legacy:legacy
    });
  }catch(error){
    try{api.disable(error);}catch(ignore){}
  }
}
`;

html=replaceOnce(
  html,
  'function applyInputs(f,opp,cmds,held){',
  helper+'function applyInputs(f,opp,cmds,held){',
  'applyInputs helper insertion'
);

const detectAnchor='const cm=detectCommandMove(f); //';
const detectCount=html.split(detectAnchor).length-1;
if(detectCount!==2)throw new Error(`command detection hook: expected two anchors, found ${detectCount}`);
html=html.split(detectAnchor).join('const cm=detectCommandMove(f);runtimeCommandShadowObserve(f,c,cm); //');

html=replaceOnce(
  html,
  '  aiReset();roundInit(true);\n  game.screen=\'battle\';',
  '  aiReset();runtimeCommandShadowReset();roundInit(true);\n  game.screen=\'battle\';',
  'offline battle reset hook'
);
html=replaceOnce(
  html,
  '  roundInit(true);\n  NET.matchSeq++;',
  '  runtimeCommandShadowReset();roundInit(true);\n  NET.matchSeq++;',
  'online battle reset hook'
);
html=replaceOnce(
  html,
  '</script>\n</body>\n</html>',
  `</script>\n${SCRIPT_TAG}\n</body>\n</html>`,
  'browser observer script tag'
);

writeFileSync(TARGET,html,'utf8');
console.log('Applied T15 default-off runtime command shadow hook');
