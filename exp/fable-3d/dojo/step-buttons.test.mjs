import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Battle } from './battle.js';
import { normalMove } from './balance.js';

const html=readFileSync(new URL('./index.html',import.meta.url),'utf8');
const css=readFileSync(new URL('./style.css',import.meta.url),'utf8');
const main=readFileSync(new URL('./main.js',import.meta.url),'utf8');

function setup(reverse=false,id='moguzo'){
  const g=new Battle(id,'godan');
  g.fighters[0].x=reverse?-.9:-.9;
  g.fighters[1].x=reverse?-1.6:1.6;
  return g;
}

test('スティック直下に「後ステップ」「前ステップ」を独立配置、中央画面は変更しない',()=>{
  const rail=html.split('id="stick-rail"')[1].split('<section id="arena"')[0];
  assert.match(rail,/id="joystick"/);
  assert.match(rail,/class="step-pad"/);
  assert.ok(rail.indexOf('id="joystick"')<rail.indexOf('class="step-pad"'));
  const controls=[...rail.matchAll(/data-control="([^"]+)"/g)].map(m=>m[1]);
  assert.deepEqual(controls,['stepBack','stepForward']);
  assert.match(rail,/aria-label="前後ステップ"/);
  assert.match(css,/#stick-rail \.step-pad\s*\{/);
  assert.match(css,/#stick-rail \.step-button\.held\s*\{/);
  assert.equal((html.match(/id="combat-layout"/g)||[]).length,1);
  assert.equal((html.match(/id="stage"/g)||[]).length,1);
  const right=html.split('id="buttons-rail"')[1];
  assert.deepEqual([...right.matchAll(/data-control="([^"]+)"/g)].map(m=>m[1]),
    ['weak','strong','throw','roar','gyuiin']);
});
test('左向き・右向き、スティックと反対方向を入力していても前後ステップは相手基準',()=>{
  for(const facing of [1,-1]){
    for(const kind of ['stepBack','stepForward']){
      const g=setup(facing===-1);
      const p=g.fighters[0];
      const before=p.x;
      const contradictory=facing===1?{left:true}:{right:true};
      g.tick({...contradictory,[kind]:true},{});
      const expected=facing*(kind==='stepForward'?1:-1);
      assert.equal(p.facing,facing,kind);
      assert.equal(p.dashDir,expected,kind+' facing '+facing);
      assert.equal(p.state,'dash',kind);
      assert.ok((p.x-before)*expected>0,kind);
      for(let f=0;f<17;f++)g.tick({},{});
      assert.equal(p.dashF,0,kind+' stops after 18 frames');
      assert.ok((p.x-before)*expected>.18,kind+' full travel');
    }
  }
});
test('1回押しただけで一度だけステップ、スティック長押し・攻撃ボタンを妨げない',()=>{
  const g=setup(),p=g.fighters[0];
  g.tick({stepBack:true},{});
  const first=p.locomotion;
  for(let f=0;f<40;f++)g.tick({stepBack:true},{});
  assert.equal(first,1);
  assert.equal(p.locomotion,1,'holding button must not auto-repeat');
  g.tick({},{});
  g.tick({stepBack:true},{});
  assert.equal(p.locomotion,2,'release and re-press permits another step');
});
test('ヨミカゲの見切りは後ステップ専用ボタンからも成立する',()=>{
  const g=new Battle('yomikage','godan'),p=g.fighters[0],op=g.fighters[1];
  p.x=-.25;op.x=.25;
  g._begin(op,normalMove('godan','stand_heavy'),'stand_heavy');
  op.frame=op.action.startup-1;
  g.tick({stepBack:true},{});
  assert.ok(p.ability.just>0,'just step state');
  assert.ok(p.ability.evadeF>0,'evade window');
  assert.equal(p.dashDir,-1);
});
test('短いタップとキーボード F/R が既存の入力バッファに乗る',()=>{
  assert.match(main,/KeyF:'stepForward'/);
  assert.match(main,/KeyR:'stepBack'/);
  assert.match(main,/queuedActions\.add\(k\)/);
  assert.match(main,/for\(const k of queuedActions\)o\[k\]=true/);
  assert.match(main,/button\.setPointerCapture\(e\.pointerId\)/);
});
