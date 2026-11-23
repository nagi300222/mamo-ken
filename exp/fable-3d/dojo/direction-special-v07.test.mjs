import {BATTLE_INPUT_PROFILE} from '../shared-ui/battle-ui.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { specialButtonSlot } from './commands.js';
import { Battle, DRIVE } from './battle.js';
import { ROSTER } from './balance.js';

const read=(name)=>readFileSync(new URL('./'+name,import.meta.url),'utf8');

test('方向+必殺は前後反転と斜め入力を含む共通マップ',()=>{
  for(const facing of [-1,1]){
    const forward=facing===1?'right':'left',back=facing===1?'left':'right';
    assert.equal(specialButtonSlot({},facing),'s1');
    assert.equal(specialButtonSlot({[back]:true},facing),'s1');
    assert.equal(specialButtonSlot({[forward]:true},facing),'s3');
    assert.equal(specialButtonSlot({up:true,[forward]:true},facing),'s2');
    assert.equal(specialButtonSlot({up:true},facing),'s2');
    assert.equal(specialButtonSlot({down:true,[forward]:true},facing),'roar');
    assert.equal(specialButtonSlot({down:true,up:true},facing),'roar');
  }
});

test('全9体の必殺を同じ4方向で出し分けられる',()=>{
  for(const id of Object.keys(ROSTER)){
    for(const reversed of [false,true]){
      const f=reversed?-1:1;
      const forward=f===1?'right':'left';
      const other={};
      for(const [raw,expected] of [
        [{special:true},'s1'],
        [{special:true,up:true},'s2'],
        [{special:true,[forward]:true},'s3'],
        [{special:true,down:true},'roar'],
      ]){
        const g=new Battle(id,'godan'),p=g.fighters[0],op=g.fighters[1];
        if(reversed){p.x=.7;op.x=-.7;}
        g.tick(raw,other);
        assert.equal(p.facing,f,id+' / '+JSON.stringify(raw));
        assert.equal(p.action?.id,expected,id+' / '+JSON.stringify(raw));
      }
    }
  }
});

test('↓+必殺は既存の咆哮性能とドライブ消費を保持',()=>{
  const g=new Battle();
  g.tick({down:true,special:true},{});
  const p=g.fighters[0];
  assert.equal(p.action?.kind,'roar');
  assert.equal(p.drive,DRIVE.initial-DRIVE.roarCost);
  const first=p.roarCooldown;
  for(let i=0;i<60;i++)g.tick({down:true,special:true},{});
  assert.ok(p.roarCooldown<first);
  assert.equal(p.drive,DRIVE.initial-DRIVE.roarCost,'holding special does not repeatedly spend drive');
});

test('↑+必殺はジャンプより必殺優先。押し直しでのみ次の技',()=>{
  const g=new Battle(),p=g.fighters[0];
  g.tick({up:true,special:true},{});
  assert.equal(p.action?.id,'s2');
  const serial=p.action.serial;
  for(let i=0;i<90;i++)g.tick({special:true},{});
  assert.notEqual(p.action?.serial,serial,'action eventually ends');
  assert.equal(p.action,null,'holding special must not auto repeat');
  g.tick({},{});
  g.tick({special:true},{});
  assert.equal(p.action?.id,'s1','release and press triggers another special');
});

test('奥義専用ボタンはゲージ100で発動、不足時は暴発しない',()=>{
  const no=new Battle(),p1=no.fighters[0];p1.super=99;
  no.tick({ultimateButton:true},{});
  assert.equal(p1.action,null);
  assert.equal(p1.super,99);
  const yes=new Battle(),p2=yes.fighters[0];p2.super=100;
  yes.tick({ultimateButton:true},{});
  assert.equal(p2.action?.id,'ultimate');
  assert.equal(p2.super,0);
});

test('咆哮は↓+必殺で後出しカウンター可、CPU旧IDも維持',()=>{
  const g=new Battle('moguzo','godan');
  g.fighters[0].x=-.25;g.fighters[1].x=.25;
  g.tick({down:true,special:true},{});
  for(let i=0;i<6;i++)g.tick({},{});
  g.tick({},{down:true,special:true});
  let returned=false;
  for(let i=0;i<23;i++){
    g.tick({},{});
    if(g.events.some(e=>e.type==='roar_counter')){returned=true;break;}
  }
  assert.ok(returned,'new roar input retains counter interaction');
  const ai=new Battle();
  ai.tick({special1:true},{});
  assert.equal(ai.fighters[0].action?.id,'s1');
});

test('横画面UIは右6ボタン、左前後2ボタン、中央の幅を保持',()=>{
  const html=read('index.html'),css=read('style.css'),main=read('main.js');
  const right=html.split('id="buttons-rail"')[1];
  const controls=[...right.matchAll(/data-control="([^"]+)"/g)].map(m=>m[1]);
  assert.deepEqual(controls,['weak','strong','throw','gyuiin','special','ultimateButton']);
  assert.ok(!controls.includes('roar'));
  assert.match(html,/id="ultimate-status"/);
  assert.match(html,/id="roar-status"/);
  assert.equal(BATTLE_INPUT_PROFILE.keyMap.KeyB,'special');
  assert.match(main,/const keyMap=BATTLE_INPUT_PROFILE.keyMap/);
  assert.equal(BATTLE_INPUT_PROFILE.keyMap.KeyM,'ultimateButton');
  assert.match(main,/const keyMap=BATTLE_INPUT_PROFILE.keyMap/);
  assert.match(css,/#buttons-rail \.attack\.ultimateButton\{grid-column:3;grid-row:2\}/);
  const left=html.split('id="stick-rail"')[1].split('id="arena"')[0];
  assert.deepEqual([...left.matchAll(/data-control="([^"]+)"/g)].map(m=>m[1]),['stepBack','stepForward']);
  assert.match(css,/#combat-layout\s*\{/);
});
