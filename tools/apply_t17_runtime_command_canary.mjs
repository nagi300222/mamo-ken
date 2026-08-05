import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(__dirname,'..');
const TARGET=path.join(ROOT,'prototype','mamoken_prototype_v01.html');
const MARKER='/* T17 offline runtime command canary */';
const APPLY_INPUTS='function applyInputs(f,opp,cmds,held){';

const HELPER=`${MARKER}
function runtimeCommandCanaryResolve(f,c,legacyCm){
  const api=window.__MAMOKEN_COMMAND_SHADOW__;
  if(!api||!api.canaryEnabled||lastMatchOnline||NET.active)return legacyCm;
  try{
    const trigger=c.t==='grab'?'grab':c.lv;
    const result=api.resolveTrigger({
      frame:B.f,
      player:f.side,
      characterId:f.c.id,
      trigger:trigger,
      directions:f.dirBuf.map(function(entry){return{direction:entry.dir,frame:entry.f};})
    });
    if(!result||!result.accepted)return legacyCm;
    if(result.decision.kind==='fallback')return null;
    const idx=result.decision.slot-1;
    const moves=BAL.CMD.moves[f.c.id];
    const move=moves&&moves[idx];
    if(!move||move.name!==result.decision.name||result.decision.commandId!==f.c.id+':slot-'+(idx+1)){
      throw new Error('Core command canary resolved an unknown current move');
    }
    return{move:move,idx:idx};
  }catch(error){
    try{api.disable(error);}catch(ignore){}
    return legacyCm;
  }
}
`;

const GRAB_OLD="      const cm=detectCommandMove(f);runtimeCommandShadowObserve(f,c,cm); // コマンド技(v0.10): 直前2方向+つかみタップ=投げ系コマンド技";
const GRAB_NEW="      const legacyCm=detectCommandMove(f);runtimeCommandShadowObserve(f,c,legacyCm); // コマンド技(v0.10): 直前2方向+つかみタップ=投げ系コマンド技\n      const cm=runtimeCommandCanaryResolve(f,c,legacyCm);";
const ATTACK_OLD="      const cm=detectCommandMove(f);runtimeCommandShadowObserve(f,c,cm); // コマンド技(v0.10): 直前2方向+同じ高さの攻撃タップ=コマンド技";
const ATTACK_NEW="      const legacyCm=detectCommandMove(f);runtimeCommandShadowObserve(f,c,legacyCm); // コマンド技(v0.10): 直前2方向+同じ高さの攻撃タップ=コマンド技\n      const cm=runtimeCommandCanaryResolve(f,c,legacyCm);";

function count(text,needle){return text.split(needle).length-1;}
function replaceExactlyOnce(text,from,to,label){
  const matches=count(text,from);
  if(matches!==1)throw new Error(`${label}: expected exactly one anchor, found ${matches}`);
  return text.replace(from,to);
}

let html=readFileSync(TARGET,'utf8');
if(!html.includes(MARKER)){
  html=replaceExactlyOnce(html,APPLY_INPUTS,`${HELPER}${APPLY_INPUTS}`,'helper insertion');
}
if(html.includes(GRAB_OLD))html=replaceExactlyOnce(html,GRAB_OLD,GRAB_NEW,'grab canary hook');
if(html.includes(ATTACK_OLD))html=replaceExactlyOnce(html,ATTACK_OLD,ATTACK_NEW,'attack canary hook');

if(count(html,MARKER)!==1)throw new Error('T17 marker count must be 1');
if(count(html,'runtimeCommandCanaryResolve(f,c,legacyCm);')!==2)throw new Error('T17 canary resolution hook count must be 2');
if(count(html,'const legacyCm=detectCommandMove(f);runtimeCommandShadowObserve(f,c,legacyCm);')!==2)throw new Error('T17 legacy observation hook count must be 2');
if(count(html,'const cm=detectCommandMove(f);runtimeCommandShadowObserve(f,c,cm);')!==0)throw new Error('legacy combined command hook must be fully replaced');
if(count(html,'if(!api||!api.canaryEnabled||lastMatchOnline||NET.active)return legacyCm;')!==1)throw new Error('offline/online authority guard is missing');
if(count(html,'<script src="../runtime/runtime-command-shadow-browser.js"></script>')!==1)throw new Error('runtime diagnostic script tag count must remain 1');

writeFileSync(TARGET,html,'utf8');
console.log('T17 offline runtime command canary hook applied');
