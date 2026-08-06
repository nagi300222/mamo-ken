import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const MARKER='/* T22 character detail panel */';

function replaceOnce(text,from,to,label){
  const count=text.split(from).length-1;
  if(count!==1)throw new Error(`${label}: expected exactly one match, found ${count}`);
  return text.replace(from,to);
}
function patch(relativePath,fn){
  const target=path.join(ROOT,relativePath);
  const source=readFileSync(target,'utf8');
  const updated=fn(source);
  if(updated===source){console.log(`unchanged ${relativePath}`);return;}
  writeFileSync(target,updated,'utf8');
  console.log(`patched ${relativePath}`);
}

patch('prototype/mamoken_prototype_v01.html',(source)=>{
  if(source.includes(MARKER))return source;
  let text=source;

  text=replaceOnce(
    text,
    '<script>\n"use strict";',
    '<script src="../runtime/character-catalog-browser.js"></script>\n<script>\n"use strict";',
    'load browser character catalog before game runtime',
  );

  text=replaceOnce(
    text,
    "  if(game.screen==='select'){selectPress(p);return null;}",
    "  if(game.screen==='select'){selectPress(p);return null;}\n  if(game.screen==='characterDetail'){characterDetailPress(p);return null;}",
    'route character detail input',
  );

  const state=`${MARKER}
const CHARACTER_DETAIL_CATALOG=window.__MAMOKEN_CHARACTER_CATALOG__||null;
const CHARACTER_DETAIL_TABS=[
  {id:'performance',label:'性能'},
  {id:'moves',label:'わざ'},
  {id:'combos',label:'コンボ'}
];
let characterDetailTab='performance';
let characterDetailScroll=0;
let characterDetailMaxScroll=0;
const SELECT_DETAIL_BTN={x:60,y:638,w:W-120,h:74};
const CHARACTER_DETAIL_BACK_BTN={x:20,y:872,w:W-40,h:76};
const CHARACTER_DETAIL_SCROLL_UP={x:454,y:202,w:76,h:76};
const CHARACTER_DETAIL_SCROLL_DOWN={x:454,y:782,w:76,h:76};
function characterDetailTabRect(i){
  const gap=8,w=(W-40-gap*2)/3;
  return{x:20+i*(w+gap),y:108,w:w,h:76};
}
function selectedCharacterDetail(){
  const selected=ROSTER[selCharIdx];
  return CHARACTER_DETAIL_CATALOG&&CHARACTER_DETAIL_CATALOG.byId[selected.id];
}
function openCharacterDetail(){
  if(!selectedCharacterDetail()){sfx('guard');return;}
  characterDetailTab='performance';characterDetailScroll=0;characterDetailMaxScroll=0;
  sfx('tap');game.screen='characterDetail';
}
`;
  text=replaceOnce(
    text,
    "const SELECT_BACK_BTN={x:60,y:904,w:W-120,h:40}; // キャラ選択画面の「もどる」(タイトルへ)\n",
    "const SELECT_BACK_BTN={x:60,y:904,w:W-120,h:40}; // キャラ選択画面の「もどる」(タイトルへ)\n"+state,
    'insert character detail state',
  );

  const selectStart=text.indexOf('function selectPress(p){');
  const resultStart=text.indexOf('function resultPress(p){',selectStart);
  if(selectStart<0||resultStart<0)throw new Error('selectPress/resultPress boundary not found');
  const inputFns=`function selectPress(p){
  for(let i=0;i<SELECT_SLOTS;i++){
    const r=slotRect(i);
    if(inRect(p,r.x,r.y,r.w,r.h)){selCharIdx=i;sfx('tap');return;}
  }
  if(inRect(p,SELECT_DETAIL_BTN.x,SELECT_DETAIL_BTN.y,SELECT_DETAIL_BTN.w,SELECT_DETAIL_BTN.h)){openCharacterDetail();return;}
  for(let i=0;i<3;i++){
    const r=diffRect(i);
    if(inRect(p,r.x,r.y,r.w,r.h)){aiDifficulty=DIFF_LEVELS[i];sfx('tap');return;}
  }
  if(inRect(p,SELECT_CONFIRM_BTN.x,SELECT_CONFIRM_BTN.y,SELECT_CONFIRM_BTN.w,SELECT_CONFIRM_BTN.h)){
    const selected=ROSTER[selCharIdx];
    if(!selected.playable){sfx('guard');return;}
    game.p1=selected.combatIndex;game.p2=(Math.random()*CHARS.length)|0;
    sfx('tap');startBattle();return;
  }
  if(inRect(p,SELECT_BACK_BTN.x,SELECT_BACK_BTN.y,SELECT_BACK_BTN.w,SELECT_BACK_BTN.h)){sfx('tap');game.screen='title';return;}
}
function characterDetailPress(p){
  for(let i=0;i<CHARACTER_DETAIL_TABS.length;i++){
    const r=characterDetailTabRect(i);
    if(inRect(p,r.x,r.y,r.w,r.h)){
      characterDetailTab=CHARACTER_DETAIL_TABS[i].id;
      characterDetailScroll=0;sfx('tap');return;
    }
  }
  if(inRect(p,CHARACTER_DETAIL_SCROLL_UP.x,CHARACTER_DETAIL_SCROLL_UP.y,CHARACTER_DETAIL_SCROLL_UP.w,CHARACTER_DETAIL_SCROLL_UP.h)){
    characterDetailScroll=Math.max(0,characterDetailScroll-260);sfx('tap');return;
  }
  if(inRect(p,CHARACTER_DETAIL_SCROLL_DOWN.x,CHARACTER_DETAIL_SCROLL_DOWN.y,CHARACTER_DETAIL_SCROLL_DOWN.w,CHARACTER_DETAIL_SCROLL_DOWN.h)){
    characterDetailScroll=Math.min(characterDetailMaxScroll,characterDetailScroll+260);sfx('tap');return;
  }
  if(inRect(p,CHARACTER_DETAIL_BACK_BTN.x,CHARACTER_DETAIL_BACK_BTN.y,CHARACTER_DETAIL_BACK_BTN.w,CHARACTER_DETAIL_BACK_BTN.h)){
    sfx('tap');game.screen='select';return;
  }
}
`;
  text=text.slice(0,selectStart)+inputFns+text.slice(resultStart);

  const selectDrawStart=text.indexOf('function rSelect(){');
  const resultDrawStart=text.indexOf('function rResult(){',selectDrawStart);
  if(selectDrawStart<0||resultDrawStart<0)throw new Error('rSelect/rResult boundary not found');

  const drawFns=`function detailWrapped(text,x,y,maxW,size,color,maxLines){
  const value=String(text||'—'),lineH=Math.ceil(size*1.45),lines=[];
  ctx.save();ctx.font=size+'px sans-serif';
  let line='';
  for(const ch of value){
    const candidate=line+ch;
    if(line&&ctx.measureText(candidate).width>maxW){lines.push(line);line=ch;}
    else line=candidate;
  }
  if(line)lines.push(line);
  const limit=maxLines||lines.length;
  for(let i=0;i<Math.min(lines.length,limit);i++){
    let shown=lines[i];
    if(i===limit-1&&lines.length>limit)shown=shown.slice(0,Math.max(1,shown.length-1))+'…';
    txt(shown,x,y+i*lineH,size,color||'#e7ebf4','left');
  }
  ctx.restore();
  return Math.min(lines.length,limit)*lineH;
}
function detailCard(x,y,w,h,accent){
  ctx.fillStyle='rgba(31,37,55,0.96)';rr(x,y,w,h,14);ctx.fill();
  ctx.strokeStyle=accent||'#3a4560';ctx.lineWidth=2;rr(x,y,w,h,14);ctx.stroke();
}
function detailStatusLabel(status){
  if(status==='current_runtime')return '実装済み';
  if(status==='design_confirmed')return '設計確定・未実装';
  if(status==='candidate')return '候補';
  return '確定';
}
function detailDifficultyLabel(value){
  if(value==='beginner')return '初級';
  if(value==='standard')return '標準';
  if(value==='advanced')return '上級';
  return String(value);
}
function detailAttributeColor(attribute){
  if(attribute==='HIGH')return '#ff7b65';
  if(attribute==='MID')return '#ffd23f';
  if(attribute==='LOW')return '#8ee06b';
  return '#ffb6ff';
}
function drawDetailPerformance(c,startY){
  let y=startY;
  const textCard=(title,body,accent)=>{
    detailCard(26,y,414,104,accent);txt(title,44,y+23,14,accent||'#7fd8ff','left');
    detailWrapped(body,44,y+48,378,15,'#f0f2f7',3);y+=116;
  };
  textCard('コンセプト',c.conceptJa,'#ffd23f');
  textCard('勝ち筋',c.winConditionJa,'#7CFC00');
  textCard('弱点',c.weaknessJa,'#ff8b8b');
  detailCard(26,y,414,190,'#7fd8ff');txt('表示性能',44,y+24,16,'#7fd8ff','left');
  const statRows=[['ATK','atk'],['SPD','spd'],['DEF','def'],['TEC','tec'],['BRK','brk']];
  let sy=y+54;
  for(const row of statRows){
    txt(row[0],48,sy,14,'#aab3c8','left');
    for(let k=0;k<5;k++){
      ctx.fillStyle=k<c.displayStats[row[1]]?'#ffd23f':'#39415a';ctx.beginPath();ctx.arc(145+k*42,sy-4,9,0,TAU);ctx.fill();
    }
    sy+=27;
  }
  let stars='';for(let k=0;k<5;k++)stars+=k<c.difficulty?'★':'☆';
  txt('総合難度',48,y+174,14,'#aab3c8','left');txt(stars,150,y+174,19,'#ffd23f','left');y+=202;
  for(const special of c.specials){
    detailCard(26,y,414,132,special.status==='candidate'?'#ffbf4a':'#b89cff');
    txt('固有能力 '+detailStatusLabel(special.status),44,y+23,13,special.status==='candidate'?'#ffbf4a':'#b89cff','left');
    txt(special.nameJa,44,y+50,20,'#fff','left');
    detailWrapped(special.summaryJa,44,y+76,378,14,'#dfe4ee',3);y+=144;
  }
  detailCard(26,y,414,120,'#ff9a66');txt('咆哮 / ギュイーンへ影響なし',44,y+23,13,'#ff9a66','left');
  txt(c.roar.nameJa,44,y+51,20,'#fff','left');detailWrapped(c.roar.summaryJa,44,y+77,378,14,'#dfe4ee',2);y+=132;
  detailCard(26,y,414,128,'#ffe14d');txt('奥義',44,y+23,13,'#ffe14d','left');
  txt(c.ultimate.nameJa,44,y+51,20,'#fff','left');detailWrapped(c.ultimate.summaryJa,44,y+77,378,14,'#dfe4ee',3);y+=140;
  detailCard(26,y,414,104,'#7fd8ff');txt('CPU方針',44,y+23,13,'#7fd8ff','left');
  detailWrapped(c.cpuPlanJa,44,y+49,378,14,'#dfe4ee',3);y+=116;
  return y;
}
function drawDetailMoves(c,startY){
  let y=startY;
  detailCard(26,y,414,86,'#7fd8ff');txt('基本7技',44,y+24,18,'#7fd8ff','left');
  txt('技名・入力・属性・Reach・用途・実装状態',44,y+55,13,'#cfd6e6','left');y+=98;
  for(const move of c.moves){
    const extra=move.conditionsJa.length?24:0,h=128+extra,accent=detailAttributeColor(move.attribute);
    detailCard(26,y,414,h,accent);
    txt(move.slot+'. '+move.nameJa,44,y+25,19,'#fff','left');
    txt(move.command.notationJa,422,y+25,18,'#ffd23f','right');
    txt(move.attribute+' / Reach '+move.reach+' / '+detailDifficultyLabel(move.difficulty),44,y+52,13,accent,'left');
    txt(detailStatusLabel(move.implementationStatus),422,y+52,12,move.implementationStatus==='current_runtime'?'#7CFC00':'#ffcf66','right');
    detailWrapped(move.roleJa,44,y+78,378,14,'#e2e7f0',2);
    if(move.conditionsJa.length)txt('条件: '+move.conditionsJa.join('／'),44,y+116,12,'#b89cff','left');
    y+=h+12;
  }
  for(const special of c.specials){
    detailCard(26,y,414,122,special.status==='candidate'?'#ffbf4a':'#b89cff');
    txt('特殊 '+detailStatusLabel(special.status),44,y+23,13,special.status==='candidate'?'#ffbf4a':'#b89cff','left');
    txt(special.nameJa,44,y+50,19,'#fff','left');detailWrapped(special.summaryJa,44,y+76,378,14,'#dfe4ee',2);y+=134;
  }
  return y;
}
function drawDetailCombos(c,startY){
  let y=startY;
  detailCard(26,y,414,112,'#ffcf66');txt('コンボは全枠 未検証',44,y+25,18,'#ffcf66','left');
  detailWrapped('技の発生・硬直・Capacityを実装し、実機で連続成立とダメージを確認してから確定します。',44,y+54,378,14,'#e1e5ee',3);y+=124;
  for(const combo of c.combos){
    detailCard(26,y,414,116,'#65708a');
    txt(combo.labelJa,44,y+27,20,'#fff','left');txt('未検証',422,y+27,14,'#ffcf66','right');
    txt('入力列: 未確定',44,y+58,14,'#aab3c8','left');
    detailWrapped(combo.notesJa.join('／'),44,y+82,378,13,'#cfd6e6',2);y+=128;
  }
  detailCard(26,y,414,104,'#7fd8ff');txt('確定時に追加する情報',44,y+24,15,'#7fd8ff','left');
  detailWrapped('入力列／始動条件／消費リソース／用途／実測ダメージ／検証状態',44,y+53,378,14,'#dfe4ee',3);y+=116;
  return y;
}
function rSelect(){ // T22: 9体を選び、性能・わざ・コンボ詳細へ遷移可能
  const c=ROSTER[selCharIdx],detail=selectedCharacterDetail();
  const g=ctx.createLinearGradient(0,0,0,H);
  g.addColorStop(0,'#20263c');g.addColorStop(0.55,'#1a2032');g.addColorStop(1,'#12141c');
  ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  txt('キャラクターをえらぶ',W/2,22,13,'#8891a6');
  txt(c.name,W/2,55,34,'#fff');
  txt(c.type+' / '+c.species,W/2,86,15,'#ffd23f');
  txt(c.playable?'プレイ可能':'アート正本採用・戦闘実装待ち',W/2,112,13,c.playable?'#7CFC00':'#ffcf66');
  demoF.c=c.playable?CHARS[c.combatIndex]:CHARS[0];
  if(!drawStanding('roster_'+c.id,W/2,338,300*c.displayScale)&&c.playable)rFighter(demoF,W/2,286);
  for(let i=0;i<SELECT_SLOTS;i++){
    const r=slotRect(i),entry=ROSTER[i],active=i===selCharIdx;
    ctx.fillStyle=active?'rgba(255,210,60,0.16)':'#232a3d';rr(r.x,r.y,r.w,r.h,12);ctx.fill();
    ctx.strokeStyle=active?'#ffd23f':'#3a4560';ctx.lineWidth=active?3:2;rr(r.x,r.y,r.w,r.h,12);ctx.stroke();
    ctx.save();rr(r.x+2,r.y+2,r.w-4,r.h-4,10);ctx.clip();
    drawStanding('roster_'+entry.id,r.x+r.w/2,r.y+r.h-10,(r.h+10)*entry.displayScale);
    ctx.restore();
    ctx.fillStyle='rgba(8,10,16,0.72)';ctx.fillRect(r.x+4,r.y+r.h-20,r.w-8,16);
    txt(entry.name,r.x+r.w/2,r.y+r.h-12,10,'#fff');
    ctx.fillStyle=entry.playable?'#7CFC00':'#ffbf4a';ctx.beginPath();ctx.arc(r.x+r.w-9,r.y+9,4,0,TAU);ctx.fill();
  }
  ctx.fillStyle=detail?'rgba(85,118,181,0.30)':'#343946';rr(SELECT_DETAIL_BTN.x,SELECT_DETAIL_BTN.y,SELECT_DETAIL_BTN.w,SELECT_DETAIL_BTN.h,16);ctx.fill();
  ctx.strokeStyle=detail?'#7fd8ff':'#666f82';ctx.lineWidth=3;rr(SELECT_DETAIL_BTN.x,SELECT_DETAIL_BTN.y,SELECT_DETAIL_BTN.w,SELECT_DETAIL_BTN.h,16);ctx.stroke();
  txt('性能・わざ・コンボを見る',W/2,SELECT_DETAIL_BTN.y+SELECT_DETAIL_BTN.h/2,19,detail?'#e8f6ff':'#9da5b5');
  txt('特性',80,731,12,'#8891a6','left');txt(detail?detail.specials.map(function(s){return s.nameJa;}).join('／'):c.ability,W-80,731,14,'#fff','right');
  txt('奥義',80,754,12,'#8891a6','left');txt(detail?detail.ultimate.nameJa:c.ult,W-80,754,14,'#ffe6a3','right');
  txt('むずかしさ',W/2,782,13,'#8891a6');
  for(let i=0;i<3;i++){
    const dl=DIFF_LEVELS[i],r=diffRect(i),active=(aiDifficulty===dl);
    ctx.fillStyle=active?'rgba(255,255,255,0.14)':'#232a3d';rr(r.x,r.y,r.w,r.h,10);ctx.fill();
    ctx.strokeStyle=active?DIFF_COL[dl]:'#3a4560';ctx.lineWidth=active?3:2;rr(r.x,r.y,r.w,r.h,10);ctx.stroke();
    txt(dl,r.x+r.w/2,r.y+r.h/2,16,active?DIFF_COL[dl]:'#cfd6e6');
  }
  ctx.fillStyle=c.playable?'#3d6e2f':'#343946';rr(SELECT_CONFIRM_BTN.x,SELECT_CONFIRM_BTN.y,SELECT_CONFIRM_BTN.w,SELECT_CONFIRM_BTN.h,16);ctx.fill();
  ctx.strokeStyle=c.playable?'#7CFC00':'#666f82';ctx.lineWidth=3;rr(SELECT_CONFIRM_BTN.x,SELECT_CONFIRM_BTN.y,SELECT_CONFIRM_BTN.w,SELECT_CONFIRM_BTN.h,16);ctx.stroke();
  txt(c.playable?'けってい（あいてはランダム）':'閲覧のみ：2D・技 実装待ち',W/2,SELECT_CONFIRM_BTN.y+SELECT_CONFIRM_BTN.h/2,18,c.playable?'#fff':'#b8bfce');
  ctx.fillStyle='rgba(255,255,255,0.06)';rr(SELECT_BACK_BTN.x,SELECT_BACK_BTN.y,SELECT_BACK_BTN.w,SELECT_BACK_BTN.h,12);ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,0.35)';ctx.lineWidth=2;rr(SELECT_BACK_BTN.x,SELECT_BACK_BTN.y,SELECT_BACK_BTN.w,SELECT_BACK_BTN.h,12);ctx.stroke();
  txt('もどる',W/2,SELECT_BACK_BTN.y+SELECT_BACK_BTN.h/2,16,'#dfe4ee');
}
function rCharacterDetail(){
  const selected=ROSTER[selCharIdx],c=selectedCharacterDetail();
  const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#1d263a');g.addColorStop(1,'#0f121a');
  ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  if(!c){txt('詳細データを読み込めませんでした',W/2,H/2,20,'#ff8b8b');return;}
  txt(c.name,W/2,34,30,'#fff');txt(c.styleJa+' / '+c.speciesJa,W/2,67,14,'#ffd23f');
  txt(selected.playable?'プレイ可能':'閲覧のみ・戦闘実装待ち',W/2,91,12,selected.playable?'#7CFC00':'#ffcf66');
  for(let i=0;i<CHARACTER_DETAIL_TABS.length;i++){
    const tab=CHARACTER_DETAIL_TABS[i],r=characterDetailTabRect(i),active=characterDetailTab===tab.id;
    ctx.fillStyle=active?'rgba(127,216,255,0.22)':'#252b3d';rr(r.x,r.y,r.w,r.h,14);ctx.fill();
    ctx.strokeStyle=active?'#7fd8ff':'#414a62';ctx.lineWidth=active?3:2;rr(r.x,r.y,r.w,r.h,14);ctx.stroke();
    txt(tab.label,r.x+r.w/2,r.y+r.h/2,19,active?'#eaf9ff':'#c3cad8');
  }
  ctx.save();ctx.beginPath();ctx.rect(20,194,426,664);ctx.clip();
  let endY=204-characterDetailScroll;
  if(characterDetailTab==='performance')endY=drawDetailPerformance(c,endY);
  else if(characterDetailTab==='moves')endY=drawDetailMoves(c,endY);
  else endY=drawDetailCombos(c,endY);
  ctx.restore();
  const contentBottom=endY+characterDetailScroll;
  characterDetailMaxScroll=Math.max(0,contentBottom-850);
  if(characterDetailScroll>characterDetailMaxScroll)characterDetailScroll=characterDetailMaxScroll;
  const drawScrollButton=(r,label,enabled)=>{
    ctx.fillStyle=enabled?'rgba(127,216,255,0.20)':'rgba(255,255,255,0.05)';rr(r.x,r.y,r.w,r.h,16);ctx.fill();
    ctx.strokeStyle=enabled?'#7fd8ff':'#4b5262';ctx.lineWidth=2;rr(r.x,r.y,r.w,r.h,16);ctx.stroke();
    txt(label,r.x+r.w/2,r.y+r.h/2,28,enabled?'#e9f8ff':'#747c8d');
  };
  drawScrollButton(CHARACTER_DETAIL_SCROLL_UP,'▲',characterDetailScroll>0);
  drawScrollButton(CHARACTER_DETAIL_SCROLL_DOWN,'▼',characterDetailScroll<characterDetailMaxScroll);
  ctx.fillStyle='rgba(255,255,255,0.08)';rr(CHARACTER_DETAIL_BACK_BTN.x,CHARACTER_DETAIL_BACK_BTN.y,CHARACTER_DETAIL_BACK_BTN.w,CHARACTER_DETAIL_BACK_BTN.h,16);ctx.fill();
  ctx.strokeStyle='#7f8aa4';ctx.lineWidth=2;rr(CHARACTER_DETAIL_BACK_BTN.x,CHARACTER_DETAIL_BACK_BTN.y,CHARACTER_DETAIL_BACK_BTN.w,CHARACTER_DETAIL_BACK_BTN.h,16);ctx.stroke();
  txt('キャラ選択へもどる',W/2,CHARACTER_DETAIL_BACK_BTN.y+CHARACTER_DETAIL_BACK_BTN.h/2,19,'#f0f2f7');
}
`;
  text=text.slice(0,selectDrawStart)+drawFns+text.slice(resultDrawStart);

  text=replaceOnce(
    text,
    "  else if(game.screen==='select')rSelect();",
    "  else if(game.screen==='select')rSelect();\n  else if(game.screen==='characterDetail')rCharacterDetail();",
    'render character detail panel',
  );
  return text;
});

patch('tools/build_mobile.mjs',(source)=>{
  if(source.includes('CHARACTER_CATALOG_BROWSER_TAG'))return source;
  let text=source;
  text=replaceOnce(
    text,
    "const RUNTIME_SHADOW_JS = path.join(ROOT, 'runtime', 'runtime-command-shadow-browser.js');\nconst RUNTIME_SHADOW_TAG = '<script src=\"../runtime/runtime-command-shadow-browser.js\"></script>';",
    "const RUNTIME_SHADOW_JS = path.join(ROOT, 'runtime', 'runtime-command-shadow-browser.js');\nconst RUNTIME_SHADOW_TAG = '<script src=\"../runtime/runtime-command-shadow-browser.js\"></script>';\nconst CHARACTER_CATALOG_BROWSER_JS = path.join(ROOT, 'runtime', 'character-catalog-browser.js');\nconst CHARACTER_CATALOG_BROWSER_TAG = '<script src=\"../runtime/character-catalog-browser.js\"></script>';",
    'add browser catalog build constants',
  );
  text=replaceOnce(
    text,
    "  const runtimeShadowSource = readFileSync(RUNTIME_SHADOW_JS, 'utf8');",
    "  const runtimeShadowSource = readFileSync(RUNTIME_SHADOW_JS, 'utf8');\n  const characterCatalogBrowserSource = readFileSync(CHARACTER_CATALOG_BROWSER_JS, 'utf8');",
    'read generated browser catalog',
  );
  text=replaceOnce(
    text,
    "  if (!out.includes(RUNTIME_SHADOW_TAG)) {",
    "  if (!out.includes(CHARACTER_CATALOG_BROWSER_TAG)) {\n    throw new Error(`アンカー行が見つかりません: ${JSON.stringify(CHARACTER_CATALOG_BROWSER_TAG)} (character catalog browser bridgeが未適用の可能性があります)`);\n  }\n  out = out.replace(CHARACTER_CATALOG_BROWSER_TAG, `<script>\\n${characterCatalogBrowserSource}\\n</script>`);\n\n  if (!out.includes(RUNTIME_SHADOW_TAG)) {",
    'inline generated browser catalog',
  );
  return text;
});
