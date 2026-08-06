import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(__dirname,'..');
const MARKER='/* T20 full roster art select */';

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
  const roster=`${MARKER}
const ROSTER=[
 {id:'moguzo',name:'モグゾー',type:'スタンダード',species:'基準マーモット',ability:'根性',ult:'大地烈掌',playable:true,combatIndex:0,stats5:CHARS[0].stats5,usability:CHARS[0].usability,sizeLabel:'基準1.00',displayScale:1.00},
 {id:'pisuke',name:'ピスケ',type:'ラッシュ',species:'細身のマーモット',ability:'チェイス',ult:'音速連咆',playable:true,combatIndex:1,stats5:CHARS[1].stats5,usability:CHARS[1].usability,sizeLabel:'細身・少し高め',displayScale:1.04},
 {id:'godan',name:'ゴダン',type:'パワー',species:'大柄なマーモット',ability:'ヘビーアーマー',ult:'山崩し',playable:true,combatIndex:2,stats5:CHARS[2].stats5,usability:CHARS[2].usability,sizeLabel:'幅広・低重心',displayScale:1.08},
 {id:'hakuma',name:'ハクマ',type:'ディフェンス',species:'ヒマラヤマーモット',ability:'アイアンウォール',ult:'白峰不動掌',playable:false,combatIndex:null,stats5:null,usability:null,sizeLabel:'身長1.05／横幅1.18',displayScale:1.05},
 {id:'chirka',name:'チルカ',type:'トリッキー',species:'ボバクマーモット',ability:'フェイント／ディレイ',ult:'百面本命打ち',playable:false,combatIndex:null,stats5:null,usability:null,sizeLabel:'身長0.98／横幅1.00',displayScale:0.98},
 {id:'takimaru',name:'タキマル',type:'グラップラー',species:'ホーリーマーモット',ability:'プレッシャー',ult:'天地大回転',playable:false,combatIndex:null,stats5:null,usability:null,sizeLabel:'身長1.07／横幅1.14',displayScale:1.07},
 {id:'yomikage',name:'ヨミカゲ',type:'カウンター',species:'クロボウシマーモット',ability:'ジャスト',ult:'後の先・月断',playable:false,combatIndex:null,stats5:null,usability:null,sizeLabel:'身長1.00／横幅0.95',displayScale:1.00},
 {id:'bullet',name:'バレット',type:'チャージ',species:'オナガマーモット',ability:'オーバーチャージ',ult:'超圧縮・弾丸頭突き',playable:false,combatIndex:null,stats5:null,usability:null,sizeLabel:'身長1.03／横幅1.10',displayScale:1.03},
 {id:'dark_moguzo',name:'ダークモグゾー',type:'アナザー',species:'モグゾー別ルート',ability:'暗連',ult:'暗連・黒天烈掌',playable:false,combatIndex:null,stats5:null,usability:null,sizeLabel:'モグゾーと同体格',displayScale:1.00}
];
`;
  text=replaceOnce(text,"const LEVELS=['high','mid','low'];",roster+"const LEVELS=['high','mid','low'];",'insert full roster');
  text=replaceOnce(text,"function loadImg(key,src){", "function loadImg(key,src,preserveWhite){",'optional preserve-white loader');
  text=replaceOnce(text,"  img.onload=function(){whitenAsset(e);e.ready=true;};", "  img.onload=function(){if(!preserveWhite)whitenAsset(e);else{e.canvas=null;e.bboxH=e.img.naturalHeight;}e.ready=true;};",'preserve white roster art');
  text=replaceOnce(text,"loadImg('standing_godan','../assets/portraits/godan.png');", "loadImg('standing_godan','../assets/portraits/godan.png');\nloadImg('roster_moguzo','../assets/roster3d/moguzo.webp',true);\nloadImg('roster_pisuke','../assets/roster3d/pisuke.webp',true);\nloadImg('roster_godan','../assets/roster3d/godan.webp',true);\nloadImg('roster_hakuma','../assets/roster3d/hakuma.webp',true);\nloadImg('roster_chirka','../assets/roster3d/chirka.webp',true);\nloadImg('roster_takimaru','../assets/roster3d/takimaru.webp',true);\nloadImg('roster_yomikage','../assets/roster3d/yomikage.webp',true);\nloadImg('roster_bullet','../assets/roster3d/bullet.webp',true);\nloadImg('roster_dark_moguzo','../assets/roster3d/dark_moguzo.webp',true); // T20: 3D正本由来・同一足元/同一キャンバスの選択画面専用アート",'load roster art');
  text=replaceOnce(text,"const SELECT_SLOTS=8; // キャラ選択8枠グリッド(2行×4列、§6.9 v2.6)。CHARSに要素を追加するだけで枠1〜3以降が解放される", "const SELECT_SLOTS=ROSTER.length; // T20: 通常8キャラ＋アナザー1キャラの3×3ロスター",'selection slot count');
  text=replaceOnce(text,"const SELECT_LOCKED=[5,7]; // 未実装枠のうち鍵アイコンを出す2枠(0-indexed)\n",'', 'remove old locked slots');
  text=replaceOnce(text,"  const cols=4,s=92,gapX=14,gapY=14,totalW=cols*s+(cols-1)*gapX,x0=(W-totalW)/2,y0=420;", "  const cols=3,s=88,gapX=14,gapY=10,totalW=cols*s+(cols-1)*gapX,x0=(W-totalW)/2,y0=350;",'3x3 selection grid');
  text=replaceOnce(text,"    if(inRect(p,r.x,r.y,r.w,r.h)){if(i<CHARS.length){selCharIdx=i;sfx('tap');}return;} // 未実装枠はタップ無効", "    if(inRect(p,r.x,r.y,r.w,r.h)){selCharIdx=i;sfx('tap');return;} // 全9体を閲覧可能。戦闘開始可否は決定ボタン側で分離",'all roster focusable');
  text=replaceOnce(text,"    game.p1=selCharIdx;game.p2=(Math.random()*CHARS.length)|0;\n    sfx('tap');startBattle();return;", "    const selected=ROSTER[selCharIdx];\n    if(!selected.playable){sfx('guard');return;}\n    game.p1=selected.combatIndex;game.p2=(Math.random()*CHARS.length)|0;\n    sfx('tap');startBattle();return;",'playable selection guard');

  const start=text.indexOf('function rSelect(){');
  const end=text.indexOf('function rResult(){',start);
  if(start<0||end<0)throw new Error('rSelect block not found');
  const selectFn=`function rSelect(){ // T20: 9体3D正本ロスター。現行3体だけ戦闘可能、残り6体は閲覧可能
  const c=ROSTER[selCharIdx];
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
  const stX0=(W-260)/2;
  if(c.stats5){
    let yy=654;
    for(const[label,key]of SELECT_STAT_ROWS){
      txt(label,stX0,yy,13,'#9aa2b8','left');
      for(let k=0;k<5;k++){
        ctx.fillStyle=(k<c.stats5[key])?'#ffd23f':'#39415a';ctx.beginPath();ctx.arc(stX0+70+k*22,yy-4,6,0,TAU);ctx.fill();
      }
      yy+=19;
    }
    txt('つかいやすさ',stX0,yy,12,'#7fd8ff','left');
    let stars='';for(let k=0;k<5;k++)stars+=(k<c.usability)?'★':'☆';
    txt(stars,stX0+100,yy,17,'#ffd23f','left');
  }else{
    ctx.fillStyle='rgba(255,255,255,0.05)';rr(76,646,W-152,116,14);ctx.fill();
    txt('特性',104,668,12,'#8891a6','left');txt(c.ability,W-104,668,14,'#fff','right');
    txt('奥義',104,694,12,'#8891a6','left');txt(c.ult,W-104,694,14,'#fff','right');
    txt('体格',104,720,12,'#8891a6','left');txt(c.sizeLabel,W-104,720,14,'#ffe6a3','right');
    txt('戦闘数値・2Dスプライトは実装工程で確定',W/2,746,12,'#ffcf66');
  }
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
`;
  text=text.slice(0,start)+selectFn+text.slice(end);
  return text;
});

patch('tools/build_mobile.mjs',(source)=>{
  if(source.includes("top === 'roster3d'"))return source;
  return replaceOnce(source,"  if (top === 'portraits') return { height: 520 };", "  if (top === 'portraits') return { height: 520 };\n  if (top === 'roster3d') return { height: 256 };",'roster art build resize');
});

patch('src/core/ui-types.ts',(source)=>{
  let text=source;
  if(!text.includes('playableNow: boolean;')){
    text=replaceOnce(text,"  archetype: ArchetypeId;\n  status: 'current_impl' | 'planned';\n  unlocked: boolean;", "  archetype: ArchetypeId | 'another';\n  status: 'current_impl' | 'planned';\n  unlocked: boolean;\n  playableNow: boolean;",'UI roster playability contract');
  }
  return text;
});

patch('src/core/ui-contract.ts',(source)=>{
  let text=source;
  const rosterStart=text.indexOf('  roster: Object.freeze([');
  const rosterEnd=text.indexOf('  ] satisfies readonly RosterSlotContract[]),',rosterStart);
  if(rosterStart<0||rosterEnd<0)throw new Error('UI roster block not found');
  const rosterBlock=`  roster: Object.freeze([
    Object.freeze({ slot: 1, characterId: 'moguzo', archetype: 'standard', status: 'current_impl', unlocked: true, playableNow: true, displayName: 'モグゾー', placeholder: null, stats: CURRENT_STATS.moguzo, statsAreIndependentAxes: true }),
    Object.freeze({ slot: 2, characterId: 'pisuke', archetype: 'rush', status: 'current_impl', unlocked: true, playableNow: true, displayName: 'ピスケ', placeholder: null, stats: CURRENT_STATS.pisuke, statsAreIndependentAxes: true }),
    Object.freeze({ slot: 3, characterId: 'godan', archetype: 'power', status: 'current_impl', unlocked: true, playableNow: true, displayName: 'ゴダン', placeholder: null, stats: CURRENT_STATS.godan, statsAreIndependentAxes: true }),
    Object.freeze({ slot: 4, characterId: 'hakuma', archetype: 'defense', status: 'planned', unlocked: true, playableNow: false, displayName: 'ハクマ', placeholder: null, stats: null, statsAreIndependentAxes: true }),
    Object.freeze({ slot: 5, characterId: 'chirka', archetype: 'tricky', status: 'planned', unlocked: true, playableNow: false, displayName: 'チルカ', placeholder: null, stats: null, statsAreIndependentAxes: true }),
    Object.freeze({ slot: 6, characterId: 'takimaru', archetype: 'grappler', status: 'planned', unlocked: true, playableNow: false, displayName: 'タキマル', placeholder: null, stats: null, statsAreIndependentAxes: true }),
    Object.freeze({ slot: 7, characterId: 'yomikage', archetype: 'counter', status: 'planned', unlocked: true, playableNow: false, displayName: 'ヨミカゲ', placeholder: null, stats: null, statsAreIndependentAxes: true }),
    Object.freeze({ slot: 8, characterId: 'bullet', archetype: 'charge', status: 'planned', unlocked: true, playableNow: false, displayName: 'バレット', placeholder: null, stats: null, statsAreIndependentAxes: true }),
    Object.freeze({ slot: 9, characterId: 'dark_moguzo', archetype: 'another', status: 'planned', unlocked: true, playableNow: false, displayName: 'ダークモグゾー', placeholder: null, stats: null, statsAreIndependentAxes: true }),
  ] satisfies readonly RosterSlotContract[]),`;
  text=text.slice(0,rosterStart)+rosterBlock+text.slice(rosterEnd+'  ] satisfies readonly RosterSlotContract[]),'.length);
  text=replaceOnce(text,"  const cardWidth = (width - pad * 2 - gap) / 2;\n  const cardHeight = (rosterBottom - rosterTop - gap * 3) / 4;", "  const columns = 3;\n  const rows = 3;\n  const cardWidth = (width - pad * 2 - gap * (columns - 1)) / columns;\n  const cardHeight = (rosterBottom - rosterTop - gap * (rows - 1)) / rows;",'3x3 UI layout dimensions');
  text=replaceOnce(text,"  for (let index = 0; index < 8; index += 1) {\n    const column = index % 2;\n    const row = Math.floor(index / 2);", "  for (let index = 0; index < 9; index += 1) {\n    const column = index % columns;\n    const row = Math.floor(index / columns);",'3x3 UI layout loop');
  const validateStart=text.indexOf('export function validateUiContract(');
  const validateEnd=text.indexOf('export function validatePortraitLayout(',validateStart);
  if(validateStart<0||validateEnd<0)throw new Error('validateUiContract block not found');
  const validateFn=`export function validateUiContract(contract: UiContract = UI_CONTRACT): void {
  if (contract.roster.length !== 9) throw new Error('UI roster must contain nine slots');
  if (new Set(contract.roster.map((slot) => slot.slot)).size !== 9) throw new Error('duplicate roster slot');
  if (contract.roster.filter((slot) => slot.playableNow).length !== 3) throw new Error('only current three slots may be playable');
  for (const slot of contract.roster) {
    if (!slot.statsAreIndependentAxes) throw new Error('display stats must not be treated as TOTAL');
    if (!slot.unlocked) throw new Error('all adopted roster art must be focusable');
    if (slot.playableNow !== (slot.status === 'current_impl')) throw new Error('UI playability must match current implementation status');
    if (!slot.playableNow && slot.stats !== null) throw new Error('planned roster stats must remain unset');
  }
  for (const cue of contract.inputCues) {
    if (!cue.colorToken || !cue.shapeToken || !cue.positionToken || !cue.seToken) throw new Error(\`incomplete cue: \${cue.id}\`);
  }
  if (!contract.onlineDisconnect.confirmationRequired) throw new Error('online disconnect confirmation is required');
}

`;
  text=text.slice(0,validateStart)+validateFn+text.slice(validateEnd);
  return text;
});

patch('test/ui-contract.test.mjs',(source)=>{
  let text=source;
  text=replaceOnce(text,'assert.equal(UI_CONTRACT.roster.length, 8);','assert.equal(UI_CONTRACT.roster.length, 9);','UI roster count test');
  text=replaceOnce(text,"assert.ok(UI_CONTRACT.roster.slice(0, 3).every((slot) => slot.unlocked && slot.status === 'current_impl'));\nassert.ok(UI_CONTRACT.roster.slice(3).every((slot) => !slot.unlocked && slot.status === 'planned' && slot.placeholder !== null));", "assert.ok(UI_CONTRACT.roster.slice(0, 3).every((slot) => slot.unlocked && slot.playableNow && slot.status === 'current_impl'));\nassert.deepEqual(UI_CONTRACT.roster.slice(3).map((slot) => slot.characterId), ['hakuma', 'chirka', 'takimaru', 'yomikage', 'bullet', 'dark_moguzo']);\nassert.ok(UI_CONTRACT.roster.slice(3).every((slot) => slot.unlocked && !slot.playableNow && slot.status === 'planned' && slot.placeholder === null));",'UI roster state test');
  text=replaceOnce(text,'assert.equal(layout.rosterRegions.length, 8);','assert.equal(layout.rosterRegions.length, 9);','UI layout count test');
  text=replaceOnce(text,"assert.throws(() => validateUiContract({ ...UI_CONTRACT, roster: UI_CONTRACT.roster.slice(0, 7) }), /eight/);", "assert.throws(() => validateUiContract({ ...UI_CONTRACT, roster: UI_CONTRACT.roster.slice(0, 8) }), /nine/);",'UI invalid roster test');
  text=replaceOnce(text,'console.log(`UI contract tests passed; slots=8; viewports=${viewports.length}; cues=${UI_CONTRACT.inputCues.length}`);','console.log(`UI contract tests passed; slots=9; playable=3; viewports=${viewports.length}; cues=${UI_CONTRACT.inputCues.length}`);','UI test log');
  return text;
});

patch('src/core/types.ts',(source)=>{
  let text=source;
  text=replaceOnce(text,"export type PlannedCharacterId = 'himalaya' | 'bobak' | 'grappler_tbd' | 'counter_tbd' | 'charge_tbd';", "export type PlannedCharacterId = 'hakuma' | 'chirka' | 'takimaru' | 'yomikage' | 'bullet';",'planned character ids');
  return text;
});

patch('src/core/constants.ts',(source)=>{
  let text=source;
  text=replaceOnce(text,"export const PLANNED_CHARACTER_IDS = ['himalaya', 'bobak', 'grappler_tbd', 'counter_tbd', 'charge_tbd'] as const;", "export const PLANNED_CHARACTER_IDS = ['hakuma', 'chirka', 'takimaru', 'yomikage', 'bullet'] as const;",'planned constants ids');
  text=replaceOnce(text,"export const BOSS_CHARACTER_IDS = ['dark_moguzo'] as const;", "export const BOSS_CHARACTER_IDS = ['dark_moguzo'] as const;\nexport const FULL_ROSTER_IDS = [...CURRENT_CHARACTER_IDS, ...PLANNED_CHARACTER_IDS, ...BOSS_CHARACTER_IDS] as const;",'full roster ids');
  return text;
});


patch('.github/workflows/core-check.yml',(source)=>{
  let text=source;
  if(!text.includes("      - 'assets/roster3d/**'")){
    text=replaceOnce(text,"      - 'prototype/mamoken_prototype_v01.html'", `      - 'prototype/mamoken_prototype_v01.html'
      - 'assets/roster3d/**'
      - 'design/MAMOKEN_CHARACTER_DESIGN_v1.0.md'
      - 'design/MAMOKEN_CHARACTER_ART_PROGRESS_2026-08-06.md'
      - 'design/2D_ART_RESUME_PLAN_2026-08-06.md'
      - 'design/character_art/source_manifest.json'
      - 'src/core/roster-full.ts'`,'T20 workflow paths');
  }
  if(!text.includes("      - 'tools/apply_t20_full_roster_art_select.mjs'")){
    text=replaceOnce(text,"      - 'tools/apply_t19_offline_core_default.mjs'", `      - 'tools/apply_t19_offline_core_default.mjs'
      - 'tools/apply_t20_full_roster_art_select.mjs'`,'T20 patcher workflow path');
  }
  if(!text.includes("      - 'test/full-roster-art.test.mjs'")){
    text=replaceOnce(text,"      - 'test/roster-core3.test.mjs'", `      - 'test/roster-core3.test.mjs'
      - 'test/full-roster-art.test.mjs'`,'T20 test workflow path');
  }
  if(!text.includes('Full roster art and mobile selection tests')){
    text=replaceOnce(text,`      - name: Legacy runtime adapter tests
        run: npm run check:runtime`, `      - name: Full roster art and mobile selection tests
        run: npm run check:roster-full

      - name: Legacy runtime adapter tests
        run: npm run check:runtime`,'T20 workflow test step');
  }
  return text;
});

patch('package.json',(source)=>{
  if(source.includes('check:roster-full'))return source;
  return replaceOnce(source,'    "check:roster": "npm run typecheck:core && node --experimental-strip-types test/roster-core3.test.mjs",', '    "check:roster": "npm run typecheck:core && node --experimental-strip-types test/roster-core3.test.mjs",\n    "check:roster-full": "npm run typecheck:core && node --experimental-strip-types test/full-roster-art.test.mjs",','full roster package script');
});
