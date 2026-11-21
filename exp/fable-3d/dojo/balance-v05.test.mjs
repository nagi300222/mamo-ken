import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CPU_LEVELS, cpuInput } from './cpu.js';
import { Battle, DRIVE, UNIVERSAL_ACTIONS, simFight } from './battle.js';
import { ROSTER, IDS, normalMove, specialMove } from './balance.js';

test('CPUやさしい・ふつう・つよいには人間の反応時間を設定',()=>{
  assert.ok(CPU_LEVELS[1].reactionFrames>CPU_LEVELS[2].reactionFrames);
  assert.ok(CPU_LEVELS[2].reactionFrames>CPU_LEVELS[3].reactionFrames);
  assert.ok(CPU_LEVELS[1].guardChance<CPU_LEVELS[2].guardChance);
  assert.ok(CPU_LEVELS[2].guardChance<CPU_LEVELS[3].guardChance);
  const html=readFileSync(new URL('./index.html',import.meta.url),'utf8');
  assert.match(html,/value="1" selected>やさしい/);
  const pages=readFileSync(new URL('./build-pages.mjs',import.meta.url),'utf8');
  assert.match(pages,/['"]cpu\.js['"]/);
});
test('CPUは予備動作が見えていない時点で下段属性を透視しない',()=>{
  const g=new Battle('moguzo','godan',2);
  const defender=g.fighters[1],enemy=g.fighters[0];
  defender.x=.22;enemy.x=-.22;
  const input=t=>{
    enemy.action={id:'stand_heavy',kind:'strike',startup:20,active:4,recovery:30,damage:70,reach:.58,level:t,serial:4};
    enemy.frame=1;
    return cpuInput({...g,frame:31},defender,enemy,2);
  };
  assert.deepEqual(input('low'),input('mid'),'attack level cannot be known before reaction');
});
test('全キャラのコンセプトが異なり、ゴダンに過剰な攻防倍率がない',()=>{
  assert.equal(IDS.length,9);
  assert.equal(new Set(IDS.map(id=>ROSTER[id].ability)).size,9);
  assert.ok(ROSTER.godan.hp<1150);
  assert.ok(ROSTER.godan.power<=1.06);
  assert.ok(ROSTER.godan.walk<ROSTER.moguzo.walk);
  assert.ok(ROSTER.godan.guardMax<ROSTER.hakuma.guardMax);
  assert.equal(ROSTER.dark_moguzo.guardMax,Math.min(...IDS.map(id=>ROSTER[id].guardMax)));
  assert.ok(ROSTER.dark_moguzo.power<ROSTER.moguzo.power);
});
test('ゴダンは指定重量技のみ一撃装甲、発生序盤・硬直中・投げには無効',()=>{
  const g=new Battle('godan','moguzo'),p=g.fighters[0],enemy=g.fighters[1];
  const move=specialMove('godan',1);
  assert.ok(g._begin(p,move,'s2'));
  p.frame=3;
  assert.equal(g._absorbing(p,{kind:'strike'}),null,'no 0-frame armor');
  p.frame=7;
  const hp=p.hp;
  g._damage(enemy,p,{kind:'strike',level:'mid',damage:90},.4);
  assert.equal(p.hp,hp-63,'armor takes 70% not 55%');
  assert.ok(p.ability.armorCooldown>0);
  assert.equal(p.action?.armorUsed,true);
  const hp2=p.hp;p.stop=0;p.stun=0;
  g._damage(enemy,p,{kind:'strike',level:'mid',damage:90},.4);
  assert.equal(p.hp,hp2-90,'second hit breaks through');
  const another=new Battle('godan','moguzo'),q=another.fighters[0];
  another._begin(q,specialMove('godan',2),'s3');q.frame=9;
  assert.equal(another._absorbing(q,{kind:'throw'}),null);
  q.frame=50;assert.equal(another._absorbing(q,{kind:'strike'}),null);
});
test('モグゾー：異なる種類の成功を重ねた次のコマンド技だけ強化',()=>{
  const g=new Battle('moguzo','godan'),p=g.fighters[0],t=g.fighters[1];
  g._damage(p,t,{kind:'strike',id:'stand_weak',damage:20,level:'mid'},.3);
  g._damage(p,t,{kind:'strike',id:'stand_heavy',damage:20,level:'mid'},.3);
  assert.equal(p.ability.gutsProgress,1,'same type should not farm');
  g._damage(p,t,{kind:'strike',id:'crouch_weak',damage:20,level:'low'},.3);
  assert.equal(p.ability.gutsReady,true);
  p.stop=0;
  const normal=specialMove('moguzo',0);
  assert.ok(g._begin(p,normal,'s1'));
  assert.ok(p.action.damage>normal.damage);
  assert.equal(p.ability.gutsReady,false);
});
test('ピスケ：通常技ヒットだけCHASEが生まれ、連続ステップに上限あり',()=>{
  const g=new Battle('pisuke','moguzo'),p=g.fighters[0],t=g.fighters[1];
  g._begin(p,normalMove('pisuke','stand_weak'),'stand_weak');
  g._damage(p,t,{kind:'strike',id:'stand_weak',damage:20,level:'mid'},.3);
  assert.ok(p.ability.chase>0);
  p.stop=0;g._input(p,t,{dash:true});
  assert.ok(p.ability.chaseCooldown>0);
  assert.equal(p.ability.chase,0);
});
test('ハクマ：通常ガードを受け止めると鉄壁が1回だけ発動',()=>{
  const g=new Battle('moguzo','hakuma'),a=g.fighters[0],t=g.fighters[1];
  t.input={right:true,down:false};t.facing=-1;
  g._damage(a,t,{kind:'strike',damage:50,level:'mid'},.3);
  assert.equal(t.ability.iron,1);
  t.stun=0;t.stop=0;
  const basic=specialMove('hakuma',1);
  g._begin(t,basic,'s2');
  assert.ok(t.action.damage>basic.damage);
  assert.equal(t.ability.iron,0);
});
test('チルカ：フェイントとディレイは攻撃後隙を残し毒ダメージを与えない',()=>{
  const g=new Battle('chirka','moguzo'),p=g.fighters[0];
  g.tick({special1:true},{});g.tick({},{});g.tick({},{});
  g.tick({left:true},{});
  assert.equal(p.action.kind,'feint');
  assert.equal(p.ability.feintCount,1);
  const d=new Battle('chirka','moguzo'),u=d.fighters[0];
  d.tick({special1:true},{});d.tick({},{});d.tick({},{});
  const initial=u.action.startup;
  d.tick({down:true},{});
  assert.equal(u.action.startup,initial+8);
  assert.equal(u.action.delayed,true);
  assert.equal(ROSTER.chirka.ability,'feint_delay');
});
test('タキマル：打撃でプレッシャー獲得、次の投げのみ強化、ギュイーンは公平',()=>{
  const g=new Battle('takimaru','moguzo'),p=g.fighters[0],t=g.fighters[1];
  g._damage(p,t,{kind:'strike',damage:24,level:'mid',id:'stand_weak'},.3);
  assert.ok(p.ability.pressure>0);
  p.stop=0;
  const base=specialMove('takimaru',2);
  g._begin(p,base,'s3');
  assert.ok(p.action.reach>base.reach);
  assert.equal(p.ability.pressure,0);
  assert.equal(UNIVERSAL_ACTIONS.gyuiin.damage,0);
  assert.equal(DRIVE.gyuiinCost,60);
});
test('ヨミカゲ：ガードだけでは見切り発動せず、正解の後退ステップで返しを得る',()=>{
  const g=new Battle('yomikage','moguzo'),p=g.fighters[0],op=g.fighters[1];
  p.input={left:true};g._damage(op,p,{kind:'strike',damage:40,level:'mid'},.3);
  assert.equal(p.ability.just,0);
  p.stun=0;p.stop=0;p.action=null;p.input={};p.prev={};p.x=-.2;op.x=.2;
  g._begin(op,normalMove('moguzo','stand_heavy'),'stand_heavy');
  op.frame=9;
  g._input(p,op,{left:true,dash:true});
  assert.ok(p.ability.just>0);
  assert.ok(p.ability.evadeF>0);
});
test('バレット：異なる成功で0〜3溜め、尾薙ぎ214でMAXだけ全消費',()=>{
  const g=new Battle('bullet','godan'),p=g.fighters[0],t=g.fighters[1];
  for(const hit of [
    {kind:'strike',id:'stand_weak',damage:18,level:'mid'},
    {kind:'projectile',id:'projectile',damage:18,level:'mid'},
    {kind:'anti',id:'s2',damage:18,level:'mid'}
  ])g._damage(p,t,hit,.3);
  assert.equal(p.ability.charge,3);
  p.stop=0;
  const base=specialMove('bullet',2);
  assert.equal(base.kind,'tail');
  assert.equal(base.chargeRelease,true);
  assert.ok(g._begin(p,base,'s3'));
  assert.equal(p.ability.charge,0);
  assert.ok(p.action.damage>base.damage);
  const same=ROSTER.bullet.ultimate;
  assert.ok(!same.chargeRelease,'super does not consume charge');
});
test('ダークモグゾー：コマンド技ヒット後だけ別コマンド技に一度派生、単発倍率は低い',()=>{
  const g=new Battle('dark_moguzo','moguzo'),p=g.fighters[0],t=g.fighters[1];
  g._begin(p,specialMove('dark_moguzo',1),'s2');
  g._damage(p,t,{...specialMove('dark_moguzo',1),id:'s2'},.3);
  assert.ok(p.ability.dark>0);
  p.stop=0;
  p.dirHistory=[{dir:2,frame:1},{dir:3,frame:2},{dir:6,frame:3}];
  g.frame=3;
  g._input(p,t,{strong:true});
  assert.equal(p.action.id,'s1');
  assert.equal(p.ability.darkUsed,true);
  assert.equal(p.ability.dark,0);
  assert.ok(p.action.damage<specialMove('dark_moguzo',0).damage);
});
test('CPU対CPU全81組を完走、ゴダンだけの絶対一強にはならない',()=>{
  let godanWins=0;
  for(const a of IDS)for(const b of IDS){
    const g=simFight(a,b,4560,2);
    assert.equal(g.phase,'ko',a+'/'+b);
    if(a==='godan'&&b!=='godan'&&g.winner===0)godanWins++;
    if(b==='godan'&&a!=='godan'&&g.winner===1)godanWins++;
  }
  assert.ok(godanWins<15,'Godan should have counters under a deterministic CPU-v-CPU benchmark');
});
