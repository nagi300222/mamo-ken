import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Battle, DRIVE } from './battle.js';
import { ROSTER } from './balance.js';
import { directionCode, pushDirection, readCommand } from './commands.js';

function scripted(sequence,{left='moguzo',right='godan',reverse=false,superReady=false}={}){
  const g=new Battle(left,right);
  g.fighters[0].x=reverse?.5:-.5;
  g.fighters[1].x=reverse?-.5:.5;
  if(superReady)g.fighters[0].super=100;
  for(const keys of sequence)g.tick(keys,{});
  return g;
}
const DOWN={down:true}, DF={down:true,right:true}, F={right:true}, B={left:true},
      DB={down:true,left:true}, DFL={down:true,left:true};

test('全員共通236/623/214/236236を弱強入力で認識',()=>{
  assert.equal(scripted([DOWN,DF,{right:true,weak:true}]).fighters[0].action?.id,'s1');
  assert.equal(scripted([F,DOWN,{down:true,right:true,weak:true}]).fighters[0].action?.id,'s2');
  assert.equal(scripted([DOWN,DB,{left:true,strong:true}]).fighters[0].action?.id,'s3');
  assert.equal(scripted([DOWN,DF,F,DOWN,DF,{right:true,strong:true}],{superReady:true}).fighters[0].action?.id,'ultimate');
});
test('左右反転時も236と623入力が通る',()=>{
  assert.equal(scripted([DOWN,DFL,{left:true,weak:true}],{reverse:true}).fighters[0].action?.id,'s1');
  assert.equal(scripted([B,DOWN,{down:true,left:true,strong:true}],{reverse:true}).fighters[0].action?.id,'s2');
});
test('斜め省略の甘い入力と236236の優先順位',()=>{
  assert.equal(scripted([DOWN,{right:true,weak:true}]).fighters[0].action?.id,'s1');
  const g=scripted([DOWN,F,DOWN,{right:true,strong:true}],{superReady:true});
  assert.equal(g.fighters[0].action?.id,'ultimate','短縮2回波動は単発より優先');
});
test('咆哮は35ドライブを消費し、連打で再発動しない',()=>{
  const g=new Battle();g.tick({roar:true},{});
  assert.equal(g.fighters[0].action?.kind,'roar');
  assert.equal(g.fighters[0].drive,DRIVE.initial-DRIVE.roarCost);
  const first=g.fighters[0].roarCooldown;
  for(let k=0;k<6;k++)g.tick({roar:true},{});
  assert.ok(g.fighters[0].roarCooldown<first);
});
test('咆哮は飛び道具を消し、攻撃中の装甲で通常攻撃を受け止める',()=>{
  const g=new Battle('moguzo','pisuke');
  g.fighters[0].x=-.4;g.fighters[1].x=.4;
  g.projectiles.push({id:99,owner:1,x:-.1,y:.3,face:-1,speed:.01,life:80,damage:85,level:'mid'});
  const hp=g.fighters[0].hp;
  g.tick({roar:true},{});
  assert.equal(g.projectiles.length,0);
  assert.equal(g.fighters[0].hp,hp);
  g.fighters[0].frame=4;
  g._damage(g.fighters[1],g.fighters[0],{kind:'strike',name:'テスト攻撃',damage:120,level:'mid'},.3);
  assert.equal(g.fighters[0].hp,hp);
});
test('後出しの咆哮で先行の咆哮を返せる',()=>{
  const g=new Battle('moguzo','godan');
  g.fighters[0].x=-.25;g.fighters[1].x=.25;
  g.tick({roar:true},{});
  for(let i=0;i<6;i++)g.tick({},{});
  g.tick({},{roar:true});
  let counter=false;
  for(let i=0;i<22;i++){
    g.tick({},{});
    if(g.events.some(e=>e.type==='roar_counter')){counter=true;break;}
  }
  assert.ok(counter,'roar counter event');
  assert.ok(g.fighters[0].stun>0);
});
test('ギュイーンは双方が同じクリンチ状態になりHP無変化で距離を離す',()=>{
  const g=new Battle('moguzo','takimaru');
  g.fighters[0].x=-.3;g.fighters[1].x=.3;
  const hp=g.fighters.map(p=>p.hp);
  g.tick({gyuiin:true},{});
  assert.ok(g.clinch);
  assert.deepEqual(g.fighters.map(p=>p.state),['clinch','clinch']);
  assert.equal(g.fighters[0].drive,DRIVE.initial-DRIVE.gyuiinCost);
  for(let i=0;i<DRIVE.clinchFrames;i++)g.tick({},{});
  assert.equal(g.clinch,null);
  assert.deepEqual(g.fighters.map(p=>p.hp),hp);
  assert.ok(Math.abs(g.fighters[0].x-g.fighters[1].x)>=DRIVE.resetSpacing-.01);
  assert.deepEqual(g.fighters.map(p=>p.state),['clinch_recoil','clinch_recoil']);
});
test('ドライブ不足でギュイーン不能、回復で再使用できる',()=>{
  const g=new Battle();
  g.fighters[0].drive=DRIVE.gyuiinCost-1;
  g.tick({gyuiin:true},{});
  assert.equal(g.clinch,null);
  assert.ok(g.fighters[0].drive<DRIVE.gyuiinCost);
  for(let i=0;i<600;i++)g.tick({},{});
  assert.ok(g.fighters[0].drive>DRIVE.gyuiinCost);
});
test('ジャンプで相手を越え、左右の向きと後ろガードが入れ替わる',()=>{
  const g=new Battle('moguzo','godan');
  g.fighters[0].x=-.26;g.fighters[1].x=.30;
  let apex=0;
  for(let i=0;i<52;i++){
    g.tick({right:true,up:i===0},{});
    apex=Math.max(apex,g.fighters[0].y);
  }
  assert.ok(apex>.80, 'apex higher than opponent character');
  assert.ok(g.fighters[0].x>g.fighters[1].x,'crossed opponent');
  assert.equal(g.fighters[0].facing,-1,'facing switches after crossing');
});
test('スマホ配置：左右の操作エリアと中央対戦画面を分離、5ボタンのみ',()=>{
  const html=readFileSync(new URL('./index.html',import.meta.url),'utf8');
  const css=readFileSync(new URL('./style.css',import.meta.url),'utf8');
  assert.match(html,/id="combat-layout"/);
  assert.ok(html.indexOf('id="stick-rail"')<html.indexOf('id="arena"'));
  assert.ok(html.indexOf('id="buttons-rail"')>html.indexOf('</section>'));
  const buttons=[...html.matchAll(/data-control="([^"]+)"/g)].map(m=>m[1]);
  assert.deepEqual(buttons,['weak','strong','throw','roar','gyuiin']);
  assert.ok(!html.includes('data-control="special1"'));
  assert.match(css,/#combat-layout\s*\{/);
});
