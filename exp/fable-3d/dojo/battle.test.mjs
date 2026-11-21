import test from 'node:test';
import assert from 'node:assert/strict';
import { ROSTER, IDS, assertBalance, normalMove, tailTipAt, ARENA } from './balance.js';
import { Battle, simFight } from './battle.js';
import { MODEL_ASSETS, chooseClip } from './models.js';

test('9キャラに6通常＋3必殺＋1奥義と独立したGLBを設定',()=>{
  assert.equal(assertBalance(),true);assert.equal(IDS.length,9);
  for(const id of IDS){
    assert.match(MODEL_ASSETS[id].glb,new RegExp(id));
    assert.equal(ROSTER[id].specials.length,3);
    for(const s of ['stand_weak','stand_heavy','crouch_weak','crouch_heavy','air_weak','air_heavy'])assert.ok(normalMove(id,s).damage>0);
  }
});
test('ゲーム中のモデル差し替えは判定ロジックを変更しない',()=>{
  const g=new Battle('moguzo','pisuke');
  assert.equal(g.fighters[0].id,'moguzo');
  assert.equal(chooseClip({action:{id:'s1',anim:'missing_clip'},state:'attack',stun:0,ko:false},['idle','stand_heavy']),'stand_heavy');
});
test('尾薙ぎのリーチはパンチを超え、F24に最大点',()=>{
  assert.ok(Math.abs(tailTipAt(24)-.651)<.001);
  assert.ok(tailTipAt(20)<tailTipAt(24));
  const g=new Battle('bullet','godan');g.fighters[0].x=-.55;g.fighters[1].x=.1;
  const initial=g.fighters[1].hp;for(let f=0;f<70;f++)g.tick({special1:f===0},{});
  assert.ok(g.fighters[1].hp<initial,'tail should connect at 0.65m');
});
test('弱攻撃が命中し、後ろガードでHPを減らさない',()=>{
  const hit=new Battle('moguzo','godan');hit.fighters[0].x=-.21;hit.fighters[1].x=.22;
  const hp=hit.fighters[1].hp;for(let f=0;f<45;f++)hit.tick({weak:f===0},{});
  assert.ok(hit.fighters[1].hp<hp,'normal hit');
  const block=new Battle('moguzo','godan');block.fighters[0].x=-.21;block.fighters[1].x=.22;
  for(let f=0;f<45;f++)block.tick({weak:f===0},{right:true});
  assert.equal(block.fighters[1].hp,ROSTER.godan.hp,'back guard stops damage');
  assert.ok(block.fighters[1].guard<100,'block costs guard');
});
test('モグゾー踏ん張りは1回だけ致死を耐える',()=>{
  const g=new Battle('moguzo','godan');
  const p=g.fighters[0],a=g.fighters[1];p.hp=30;
  g._damage(a,p,{damage:200,level:'mid',kind:'strike',id:'test'},.3);
  assert.equal(p.hp,1);assert.equal(p.ability.grit,false);
  p.stun=0;p.stop=0;p.action=null;g.phase='fight';g._damage(a,p,{damage:200,level:'mid',kind:'strike',id:'test2'},.3);
  assert.equal(p.hp,0);
});
test('時間切れでHP割合による勝敗を確定',()=>{
  const g=new Battle('pisuke','godan');g.time=1;g.fighters[0].hp=100;g.fighters[1].hp=800;g.tick({});
  assert.equal(g.phase,'ko');assert.equal(g.winner,1);
});
test('全81組み合わせをCPUで一試合・例外なし',()=>{
  for(const id of IDS)for(const other of IDS) {
    const g=simFight(id,other,ARENA.roundSeconds*60+10);
    assert.equal(g.phase,'ko',id+'/'+other);
    assert.ok(g.winner===-1||g.winner===0||g.winner===1);
    assert.ok(g.fighters.every(f=>Number.isFinite(f.hp)&&Number.isFinite(f.x)),id+'/'+other);
  }
});
