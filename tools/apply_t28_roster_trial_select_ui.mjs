import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const TARGET=path.join(ROOT,'prototype','mamoken_prototype_v01.html');
const MARKER='/* T28 roster trial select UI */';

function replaceOnce(text,from,to,label){
  const count=text.split(from).length-1;
  if(count!==1)throw new Error(`${label}: expected one literal match, found ${count}`);
  return text.replace(from,to);
}
function replaceRegexOnce(text,regex,to,label){
  const matches=[...text.matchAll(new RegExp(regex.source,regex.flags.includes('g')?regex.flags:regex.flags+'g'))];
  if(matches.length!==1)throw new Error(`${label}: expected one regex match, found ${matches.length}`);
  return text.replace(regex,to);
}

let source=readFileSync(TARGET,'utf8');
if(source.includes(MARKER)){
  console.log('unchanged prototype/mamoken_prototype_v01.html');
  process.exit(0);
}

const rosterBlock=`const CHARS=[
 {id:'moguzo',name:'モグゾー',type:'スタンダード',ult:'大地烈掌',color:'#b58756',belly:'#ecd9b4',dMul:1,sMul:1,sOfs:0,gMax:100,pips:{p:3,s:3,g:3},stats5:{atk:3,spd:3,def:3,tech:3,brk:3},usability:1,trial:false,skeletonId:'moguzo',trialLabel:null},
 {id:'pisuke',name:'ピスケ',type:'ラッシュ',ult:'音速連咆',color:'#cfa972',belly:'#f5ead0',dMul:0.85,sMul:1.25,sOfs:-2,gMax:90,pips:{p:2,s:5,g:2},stats5:{atk:2,spd:5,def:2,tech:4,brk:2},usability:2,trial:false,skeletonId:'pisuke',trialLabel:null},
 {id:'godan',name:'ゴダン',type:'パワー',ult:'山崩し',color:'#8a6540',belly:'#d9c19d',dMul:1.18,sMul:0.9,sOfs:2,gMax:110,pips:{p:5,s:2,g:4},stats5:{atk:5,spd:2,def:4,tech:2,brk:4},usability:1,trial:false,skeletonId:'godan',trialLabel:null},
 {id:'hakuma',name:'ハクマ',type:'ディフェンス',ult:'白峰不動掌',color:'#8a6540',belly:'#d9c19d',dMul:1.18,sMul:0.9,sOfs:2,gMax:110,pips:{p:5,s:2,g:4},stats5:{atk:5,spd:2,def:4,tech:2,brk:4},usability:1,trial:true,skeletonId:'godan',trialLabel:'ゴダン骨格 / 共通技のみ'},
 {id:'chirka',name:'チルカ',type:'トリッキー',ult:'百面本命打ち',color:'#cfa972',belly:'#f5ead0',dMul:0.85,sMul:1.25,sOfs:-2,gMax:90,pips:{p:2,s:5,g:2},stats5:{atk:2,spd:5,def:2,tech:4,brk:2},usability:2,trial:true,skeletonId:'pisuke',trialLabel:'ピスケ骨格 / 共通技のみ'},
 {id:'takimaru',name:'タキマル',type:'グラップラー',ult:'天地大回転',color:'#8a6540',belly:'#d9c19d',dMul:1.18,sMul:0.9,sOfs:2,gMax:110,pips:{p:5,s:2,g:4},stats5:{atk:5,spd:2,def:4,tech:2,brk:4},usability:1,trial:true,skeletonId:'godan',trialLabel:'ゴダン骨格 / 共通技のみ'},
 {id:'yomikage',name:'ヨミカゲ',type:'カウンター',ult:'後の先・月断',color:'#cfa972',belly:'#f5ead0',dMul:0.85,sMul:1.25,sOfs:-2,gMax:90,pips:{p:2,s:5,g:2},stats5:{atk:2,spd:5,def:2,tech:4,brk:2},usability:2,trial:true,skeletonId:'pisuke',trialLabel:'ピスケ骨格 / 共通技のみ'},
 {id:'bullet',name:'バレット',type:'チャージ',ult:'超圧縮・弾丸頭突き',color:'#cfa972',belly:'#f5ead0',dMul:0.85,sMul:1.25,sOfs:-2,gMax:90,pips:{p:2,s:5,g:2},stats5:{atk:2,spd:5,def:2,tech:4,brk:2},usability:2,trial:true,skeletonId:'pisuke',trialLabel:'ピスケ骨格 / 共通技のみ'},
 {id:'dark_moguzo',name:'ダークモグゾー',type:'アナザー',ult:'暗連・黒天烈掌',color:'#b58756',belly:'#ecd9b4',dMul:1,sMul:1,sOfs:0,gMax:100,pips:{p:3,s:3,g:3},stats5:{atk:3,spd:3,def:3,tech:3,brk:3},usability:1,trial:true,skeletonId:'moguzo',trialLabel:'モグゾー骨格 / 共通技のみ'}
];
/* T20 full roster art select */
${MARKER}
const ROSTER=[
 {id:'moguzo',name:'モグゾー',type:'スタンダード',species:'基準マーモット',ability:'根性',ult:'大地烈掌',playable:true,trialPlayable:true,combatIndex:0,skeletonId:'moguzo',trialLabel:null,displayScale:1.00,faceCrop:{x:0.50,y:0.28,z:2.35},heroCrop:{x:0.50,y:0.42,z:1.25}},
 {id:'pisuke',name:'ピスケ',type:'ラッシュ',species:'細身のマーモット',ability:'チェイス',ult:'音速連咆',playable:true,trialPlayable:true,combatIndex:1,skeletonId:'pisuke',trialLabel:null,displayScale:1.04,faceCrop:{x:0.50,y:0.27,z:2.40},heroCrop:{x:0.50,y:0.41,z:1.28}},
 {id:'godan',name:'ゴダン',type:'パワー',species:'大柄なマーモット',ability:'ヘビーアーマー',ult:'山崩し',playable:true,trialPlayable:true,combatIndex:2,skeletonId:'godan',trialLabel:null,displayScale:1.08,faceCrop:{x:0.50,y:0.29,z:2.25},heroCrop:{x:0.50,y:0.43,z:1.18}},
 {id:'hakuma',name:'ハクマ',type:'ディフェンス',species:'ヒマラヤマーモット',ability:'アイアンウォール',ult:'白峰不動掌',playable:false,trialPlayable:true,combatIndex:3,skeletonId:'godan',trialLabel:'ゴダン骨格で試運転',displayScale:1.05,faceCrop:{x:0.50,y:0.30,z:2.18},heroCrop:{x:0.50,y:0.44,z:1.14}},
 {id:'chirka',name:'チルカ',type:'トリッキー',species:'ボバクマーモット',ability:'フェイント／ディレイ',ult:'百面本命打ち',playable:false,trialPlayable:true,combatIndex:4,skeletonId:'pisuke',trialLabel:'ピスケ骨格で試運転',displayScale:0.98,faceCrop:{x:0.50,y:0.28,z:2.32},heroCrop:{x:0.50,y:0.42,z:1.22}},
 {id:'takimaru',name:'タキマル',type:'グラップラー',species:'ホーリーマーモット',ability:'プレッシャー',ult:'天地大回転',playable:false,trialPlayable:true,combatIndex:5,skeletonId:'godan',trialLabel:'ゴダン骨格で試運転',displayScale:1.07,faceCrop:{x:0.50,y:0.28,z:2.24},heroCrop:{x:0.50,y:0.42,z:1.16}},
 {id:'yomikage',name:'ヨミカゲ',type:'カウンター',species:'クロボウシマーモット',ability:'ジャスト',ult:'後の先・月断',playable:false,trialPlayable:true,combatIndex:6,skeletonId:'pisuke',trialLabel:'ピスケ骨格で試運転',displayScale:1.00,faceCrop:{x:0.50,y:0.28,z:2.36},heroCrop:{x:0.50,y:0.42,z:1.24}},
 {id:'bullet',name:'バレット',type:'チャージ',species:'オナガマーモット',ability:'オーバーチャージ',ult:'超圧縮・弾丸頭突き',playable:false,trialPlayable:true,combatIndex:7,skeletonId:'pisuke',trialLabel:'ピスケ骨格で試運転',displayScale:1.03,faceCrop:{x:0.42,y:0.28,z:2.48},heroCrop:{x:0.43,y:0.41,z:1.38}},
 {id:'dark_moguzo',name:'ダークモグゾー',type:'アナザー',species:'モグゾー別ルート',ability:'暗連',ult:'暗連・黒天烈掌',playable:false,trialPlayable:true,combatIndex:8,skeletonId:'moguzo',trialLabel:'モグゾー骨格で試運転',displayScale:1.00,faceCrop:{x:0.50,y:0.28,z:2.35},heroCrop:{x:0.50,y:0.42,z:1.25}}
];
const OFFICIAL_CHARACTER_COUNT=3;
function skeletonIdOf(c){return(c&&c.skeletonId)||c.id;}
function spriteHeightForChar(c){return BAL.SPRITE_H[skeletonIdOf(c)];}
function portraitRatioForChar(c){return BAL.PORTRAIT_RATIO[skeletonIdOf(c)];}
function commandMovesFor(c){return BAL.CMD.moves[c.id]||[];}
const LEVELS=`;
source=replaceRegexOnce(source,/const CHARS=\[[\s\S]*?const LEVELS=/,rosterBlock,'replace runtime roster and trial characters');

source=replaceOnce(source,"for(const c of CHARS)loadImg('face_'+c.id,'../assets/ui/face_'+c.id+'.png');","for(const c of CHARS.slice(0,OFFICIAL_CHARACTER_COUNT))loadImg('face_'+c.id,'../assets/ui/face_'+c.id+'.png');",'official face assets only');
source=replaceOnce(source,"for(const c of CHARS)loadImg('facesq_'+c.id,'../assets/ui/facesq_'+c.id+'.png');","for(const c of CHARS.slice(0,OFFICIAL_CHARACTER_COUNT))loadImg('facesq_'+c.id,'../assets/ui/facesq_'+c.id+'.png');",'official square face assets only');
source=replaceRegexOnce(source,/const SPRITES=\{\};[\s\S]*?\n\}/,`const SPRITES={}; // 公式3骨格だけをロードし、仮キャラはskeletonId経由で共有する
for(const sid of ['moguzo','pisuke','godan']){
  SPRITES[sid]={};
  for(const pid of POSE_IDS)SPRITES[sid][pid]=loadImg('sprite_'+sid+'_'+pid,'../assets/chars/'+sid+'/'+pid+'.png');
}`,'replace sprite loading');

const cropHelper=`function drawRosterCrop(key,x,y,w,h,crop,radius){ // 鼻/胴体アンカー中心のクロップ。画像全体の尾や余白を倍率計算に使わない
  if(!assetReady(key))return false;
  const e=ASSETS[key],src=e.canvas||e.img,iw=e.img.naturalWidth,ih=e.img.naturalHeight;
  const z=Math.max(1,crop&&crop.z||1),ax=(crop&&crop.x!=null?crop.x:0.5)*iw,ay=(crop&&crop.y!=null?crop.y:0.5)*ih;
  let sw=iw/z,sh=sw*h/w;
  if(sh>ih/z){sh=ih/z;sw=sh*w/h;}
  const sx=Math.max(0,Math.min(iw-sw,ax-sw/2)),sy=Math.max(0,Math.min(ih-sh,ay-sh/2));
  ctx.save();rr(x,y,w,h,radius||12);ctx.clip();ctx.drawImage(src,sx,sy,sw,sh,x,y,w,h);ctx.restore();
  return true;
}
`;
source=replaceOnce(source,'function drawUiIcon(key,cx,cy,targetW){',cropHelper+'function drawUiIcon(key,cx,cy,targetW){','add roster crop helper');

source=source.replaceAll('  const moves=BAL.CMD.moves[f.c.id];','  const moves=commandMovesFor(f.c);');
source=replaceOnce(source,'  const moves=BAL.CMD.moves[me.c.id];','  const moves=commandMovesFor(me.c);','CPU command helper');
source=replaceOnce(source,'function runtimeCommandShadowObserve(f,c,cm){\n  const api=',"function runtimeCommandShadowObserve(f,c,cm){\n  if(f.c.trial)return;\n  const api=",'skip trial shadow observation');
source=replaceOnce(source,'function runtimeCommandCanaryResolve(f,c,legacyCm){\n  const api=',"function runtimeCommandCanaryResolve(f,c,legacyCm){\n  if(f.c.trial)return legacyCm;\n  const api=",'skip trial canary');

source=replaceOnce(source,"function rFighter(f,ox,oy){ // ポーズ画像があればdrawImage、無ければ図形描画にフォールバック\n  const sp=SPRITES[f.c.id]&&SPRITES[f.c.id][poseId(f)];","function rFighter(f,ox,oy){ // 仮キャラは既存3体の骨格・共通24ポーズを明示的に流用\n  const sid=skeletonIdOf(f.c),sp=SPRITES[sid]&&SPRITES[sid][poseId(f)];",'skeleton sprite lookup');
source=replaceOnce(source,'function spriteScale(charId){ // 表示倍率=目標身長(BAL.SPRITE_H)/idle.pngの実測キャラ高(alpha bboxの高さ)。全ポーズ同倍率で統一\n  const idleE=SPRITES[charId]&&SPRITES[charId].idle;\n  const idleH=(idleE&&idleE.bboxH)||SPRITE_IDLE_H_FALLBACK[charId];\n  return BAL.SPRITE_H[charId]/idleH;\n}',"function spriteScale(c){ // 仮キャラも元骨格の実測倍率・表示身長をそのまま使う\n  const charId=skeletonIdOf(c),idleE=SPRITES[charId]&&SPRITES[charId].idle;\n  const idleH=(idleE&&idleE.bboxH)||SPRITE_IDLE_H_FALLBACK[charId];\n  return BAL.SPRITE_H[charId]/idleH;\n}",'skeleton sprite scale');
source=replaceOnce(source,'  const scale=spriteScale(f.c.id); // idle基準の実測倍率(動的計測。全ポーズ同倍率で統一)','  const scale=spriteScale(f.c); // 元骨格idle基準の実測倍率。仮キャラも全ポーズ同倍率','draw sprite scale call');
source=source.replaceAll('BAL.SPRITE_H[myF.c.id]','spriteHeightForChar(myF.c)');
source=source.replaceAll('BAL.SPRITE_H[f.c.id]','spriteHeightForChar(f.c)');

const selectGeometry=`function diffRect(i){
  const w=160,gap=8,totalW=3*w+2*gap,x0=(W-totalW)/2;
  return{x:x0+i*(w+gap),y:590,w:w,h:48};
}
let selCharIdx=0;
const SELECT_SLOTS=10; // 2段×5列。先頭9枠=ロスター、10枠目=?
function slotRect(i){
  const cols=5,s=96,gapX=6,gapY=6,totalW=cols*s+(cols-1)*gapX,x0=(W-totalW)/2,y0=270;
  const col=i%cols,row=Math.floor(i/cols);
  return{x:x0+col*(s+gapX),y:y0+row*(s+gapY),w:s,h:s};
}
const SELECT_STAT_ROWS=[['こうげき','atk'],['はやさ','spd'],['まもり','def'],['わざ','tech'],['くずし','brk']];
const SELECT_DETAIL_BTN={x:18,y:478,w:W-36,h:72};
const SELECT_CONFIRM_BTN={x:18,y:660,w:W-36,h:76};
const SELECT_BACK_BTN={x:18,y:758,w:W-36,h:58};
`;
source=replaceRegexOnce(source,/function diffRect\(i\)\{[\s\S]*?\/\* T22 character detail panel \*\//,selectGeometry+'/* T22 character detail panel */','replace select geometry');

const selectInput=`function selectPress(p){
  for(let i=0;i<SELECT_SLOTS;i++){
    const r=slotRect(i);
    if(inRect(p,r.x,r.y,r.w,r.h)){
      if(i>=ROSTER.length){sfx('guard');return;}
      selCharIdx=i;sfx('tap');return;
    }
  }
  if(inRect(p,SELECT_DETAIL_BTN.x,SELECT_DETAIL_BTN.y,SELECT_DETAIL_BTN.w,SELECT_DETAIL_BTN.h)){openCharacterDetail();return;}
  for(let i=0;i<3;i++){
    const r=diffRect(i);
    if(inRect(p,r.x,r.y,r.w,r.h)){aiDifficulty=DIFF_LEVELS[i];sfx('tap');return;}
  }
  if(inRect(p,SELECT_CONFIRM_BTN.x,SELECT_CONFIRM_BTN.y,SELECT_CONFIRM_BTN.w,SELECT_CONFIRM_BTN.h)){
    const selected=ROSTER[selCharIdx];
    if(!selected.trialPlayable){sfx('guard');return;}
    game.p1=selected.combatIndex;
    game.p2=(Math.random()*CHARS.length)|0;
    if(game.p2===game.p1)game.p2=(game.p2+1)%CHARS.length;
    sfx('tap');startBattle();return;
  }
  if(inRect(p,SELECT_BACK_BTN.x,SELECT_BACK_BTN.y,SELECT_BACK_BTN.w,SELECT_BACK_BTN.h)){sfx('tap');game.screen='title';return;}
}
function characterDetailPress(p){`;
source=replaceRegexOnce(source,/function selectPress\(p\)\{[\s\S]*?function characterDetailPress\(p\)\{/,selectInput,'replace select input');

const selectRender=`function rSelect(){ // T28: 2x5顔アイコン＋アート/文字分離＋全9体オフライン仮試運転
  const c=ROSTER[selCharIdx],detail=selectedCharacterDetail();
  const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#20263c');g.addColorStop(0.55,'#1a2032');g.addColorStop(1,'#12141c');
  ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  txt('キャラクターをえらぶ',W/2,14,13,'#a4adc0');
  const hero={x:18,y:34,w:184,h:218},info={x:214,y:34,w:308,h:218};
  ctx.fillStyle='#252c40';rr(hero.x,hero.y,hero.w,hero.h,18);ctx.fill();ctx.strokeStyle='#48546f';ctx.lineWidth=2;rr(hero.x,hero.y,hero.w,hero.h,18);ctx.stroke();
  drawRosterCrop('roster_'+c.id,hero.x+6,hero.y+6,hero.w-12,hero.h-12,c.heroCrop,14);
  ctx.fillStyle='rgba(26,31,47,0.98)';rr(info.x,info.y,info.w,info.h,18);ctx.fill();ctx.strokeStyle='#48546f';ctx.lineWidth=2;rr(info.x,info.y,info.w,info.h,18);ctx.stroke();
  txt(c.name,info.x+18,info.y+34,c.name.length>6?23:30,'#fff','left');
  txt(c.type,info.x+18,info.y+68,17,'#ffd23f','left');
  txt(c.species,info.x+18,info.y+94,13,'#aeb8cb','left');
  txt(c.playable?'正式実装 / オンライン可':'オフライン仮試運転',info.x+18,info.y+124,13,c.playable?'#7CFC00':'#ffcf66','left');
  if(c.trialLabel)txt(c.trialLabel,info.x+18,info.y+149,12,'#ffb36b','left');
  txt('特性  '+(detail?detail.specials.map(function(s){return s.nameJa;}).join('／'):c.ability),info.x+18,info.y+181,13,'#e8ecf4','left');
  txt('奥義  '+(detail?detail.ultimate.nameJa:c.ult),info.x+18,info.y+207,13,'#ffe6a3','left');
  for(let i=0;i<SELECT_SLOTS;i++){
    const r=slotRect(i),entry=ROSTER[i],active=i===selCharIdx;
    ctx.fillStyle=active?'rgba(255,210,60,0.16)':'#232a3d';rr(r.x,r.y,r.w,r.h,12);ctx.fill();
    ctx.strokeStyle=active?'#ffd23f':'#3a4560';ctx.lineWidth=active?3:2;rr(r.x,r.y,r.w,r.h,12);ctx.stroke();
    if(!entry){
      txt('?',r.x+r.w/2,r.y+39,38,'#8993aa');
      ctx.fillStyle='rgba(8,10,16,0.86)';ctx.fillRect(r.x+4,r.y+r.h-25,r.w-8,21);txt('未定',r.x+r.w/2,r.y+r.h-14,10,'#aeb6c8');
      continue;
    }
    drawRosterCrop('roster_'+entry.id,r.x+4,r.y+4,r.w-8,r.h-31,entry.faceCrop,8);
    ctx.fillStyle='rgba(8,10,16,0.90)';ctx.fillRect(r.x+4,r.y+r.h-25,r.w-8,21);
    txt(entry.name,r.x+r.w/2,r.y+r.h-14,entry.name.length>6?8:10,'#fff');
    ctx.fillStyle=entry.playable?'#7CFC00':'#ffbf4a';ctx.beginPath();ctx.arc(r.x+r.w-10,r.y+10,5,0,TAU);ctx.fill();
  }
  ctx.fillStyle=detail?'rgba(85,118,181,0.30)':'#343946';rr(SELECT_DETAIL_BTN.x,SELECT_DETAIL_BTN.y,SELECT_DETAIL_BTN.w,SELECT_DETAIL_BTN.h,16);ctx.fill();
  ctx.strokeStyle=detail?'#7fd8ff':'#666f82';ctx.lineWidth=3;rr(SELECT_DETAIL_BTN.x,SELECT_DETAIL_BTN.y,SELECT_DETAIL_BTN.w,SELECT_DETAIL_BTN.h,16);ctx.stroke();
  txt('性能・わざ・コンボを見る',W/2,SELECT_DETAIL_BTN.y+SELECT_DETAIL_BTN.h/2,19,detail?'#e8f6ff':'#9da5b5');
  txt('CPUむずかしさ',W/2,572,13,'#a2abc0');
  for(let i=0;i<3;i++){
    const dl=DIFF_LEVELS[i],r=diffRect(i),active=aiDifficulty===dl;
    ctx.fillStyle=active?'rgba(255,255,255,0.14)':'#232a3d';rr(r.x,r.y,r.w,r.h,10);ctx.fill();
    ctx.strokeStyle=active?DIFF_COL[dl]:'#3a4560';ctx.lineWidth=active?3:2;rr(r.x,r.y,r.w,r.h,10);ctx.stroke();txt(dl,r.x+r.w/2,r.y+r.h/2,16,active?DIFF_COL[dl]:'#cfd6e6');
  }
  ctx.fillStyle=c.playable?'#3d6e2f':'#665124';rr(SELECT_CONFIRM_BTN.x,SELECT_CONFIRM_BTN.y,SELECT_CONFIRM_BTN.w,SELECT_CONFIRM_BTN.h,16);ctx.fill();
  ctx.strokeStyle=c.playable?'#7CFC00':'#ffcf66';ctx.lineWidth=3;rr(SELECT_CONFIRM_BTN.x,SELECT_CONFIRM_BTN.y,SELECT_CONFIRM_BTN.w,SELECT_CONFIRM_BTN.h,16);ctx.stroke();
  txt(c.playable?'けってい（正式実装）':'仮骨格で試運転',W/2,SELECT_CONFIRM_BTN.y+31,20,'#fff');
  txt(c.playable?'相手は9体からランダム':'既存性能・共通技のみ / 専用技未実装',W/2,SELECT_CONFIRM_BTN.y+55,12,c.playable?'#cceac3':'#ffe1a8');
  ctx.fillStyle='rgba(255,255,255,0.06)';rr(SELECT_BACK_BTN.x,SELECT_BACK_BTN.y,SELECT_BACK_BTN.w,SELECT_BACK_BTN.h,12);ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,0.35)';ctx.lineWidth=2;rr(SELECT_BACK_BTN.x,SELECT_BACK_BTN.y,SELECT_BACK_BTN.w,SELECT_BACK_BTN.h,12);ctx.stroke();txt('もどる',W/2,SELECT_BACK_BTN.y+SELECT_BACK_BTN.h/2,16,'#dfe4ee');
  txt('●緑=正式実装  ●黄=仮骨格テスト　オンラインは正式3体のみ',W/2,850,12,'#aeb6c8');
}
function rCharacterDetail(){`;
source=replaceRegexOnce(source,/function rSelect\(\)\{[\s\S]*?function rCharacterDetail\(\)\{/,selectRender,'replace select rendering');
source=replaceOnce(source,"  txt(selected.playable?'プレイ可能':'閲覧のみ・戦闘実装待ち',W/2,91,12,selected.playable?'#7CFC00':'#ffcf66');","  txt(selected.playable?'正式実装・オンライン可':'仮骨格でオフライン試運転可',W/2,91,12,selected.playable?'#7CFC00':'#ffcf66');",'detail trial status');

source=replaceOnce(source,"  const moves=BAL.CMD.moves[myF.c.id]||[];","  const moves=commandMovesFor(myF.c);",'move list helper fallback');
source=replaceOnce(source,"  let y=104;\n  for(let i=0;i<moves.length;i++){","  let y=104;\n  if(myF.c.trial){txt('仮骨格テスト：専用コマンド技は未実装',60,y+18,14,'#ffcf66','left');y+=42;}\n  for(let i=0;i<moves.length;i++){",'trial move list notice');

source=replaceOnce(source,"  txt(p1.c.name,18,48,15,'#fff','left');\n  txt(p2.c.name+(onlineActive()?'':'(CPU)'),W-18,48,15,'#fff','right');","  txt(p1.c.name,18,48,15,'#fff','left');\n  txt(p2.c.name+(onlineActive()?'':'(CPU)'),W-18,48,15,'#fff','right');\n  if(p1.c.trial)txt('仮骨格 / 共通技のみ',30,137,11,'#ffcf66','left');\n  if(p2.c.trial)txt('仮骨格 / 共通技のみ',W-30,137,11,'#ffcf66','right');",'battle trial labels');

source=replaceOnce(source,"    const winnerId=(winSide===0)?CHARS[game.p1].id:CHARS[game.p2].id;\n    drawStanding('standing_'+winnerId,W/2,522,308*BAL.PORTRAIT_RATIO[winnerId]); // 体格比を適用(§6.6 v2.4.1)","    const winner=(winSide===0)?CHARS[game.p1]:CHARS[game.p2];\n    demoF.c=winner;\n    if(!drawStanding('standing_'+winner.id,W/2,522,308*portraitRatioForChar(winner)))rFighter(demoF,W/2,500);",'trial result art fallback');

source=replaceOnce(source,'const SELECT_DETAIL_BTN={x:60,y:638,w:W-120,h:74};\n','','remove superseded T22 detail button');
writeFileSync(TARGET,source,'utf8');
console.log('patched prototype/mamoken_prototype_v01.html');