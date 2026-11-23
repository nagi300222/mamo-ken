import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Battle, DRIVE, simFight } from './battle.js';
import { chooseClip } from './models.js';
import {createNormalMotionSource} from './normal-motion-source.js';
import { ROSTER } from './balance.js';
import { directionCode, pushDirection, readCommand } from './commands.js';

const legacyNormals=createNormalMotionSource({version:'v15'});

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
  assert.equal(g.fighters[0].action?.kind,'clinch','先に超装甲で踏み込む');
  assert.equal(g.fighters[0].drive,DRIVE.initial-DRIVE.gyuiinCost);
  for(let i=0;i<25&&!g.clinch;i++)g.tick({},{});
  assert.ok(g.clinch,'間合い内で両者クリンチへ移行する');
  assert.deepEqual(g.fighters.map(p=>p.state),['clinch','clinch']);
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
  assert.ok(apex>.62&&apex<.83, 'v0.3 jump apex stays low but clears opponent');
  assert.ok(g.fighters[0].x>g.fighters[1].x,'crossed opponent');
  assert.equal(g.fighters[0].facing,-1,'facing switches after crossing');
});
test('スマホ配置：左右の操作エリアと中央対戦画面を分離、右6ボタン',()=>{
  const html=readFileSync(new URL('./index.html',import.meta.url),'utf8');
  const css=readFileSync(new URL('./style.css',import.meta.url),'utf8');
  assert.match(html,/id="combat-layout"/);
  assert.ok(html.indexOf('id="stick-rail"')<html.indexOf('id="arena"'));
  assert.ok(html.indexOf('id="buttons-rail"')>html.indexOf('</section>'));
  const rightRail=html.split('id="buttons-rail"')[1]||'';
  const buttons=[...rightRail.matchAll(/data-control="([^"]+)"/g)].map(m=>m[1]);
  assert.deepEqual(buttons,['weak','strong','throw','gyuiin','special','ultimateButton']);
  const stickRail=html.split('id="stick-rail"')[1].split('id="arena"')[0];
  assert.deepEqual([...stickRail.matchAll(/data-control="([^"]+)"/g)].map(m=>m[1]),['stepBack','stepForward']);
  assert.ok(!html.includes('data-control="special1"'));
  assert.match(css,/#combat-layout\s*\{/);
});

test('Claudeの新規リアクションクリップを優先し、未配信なら旧GLBで再生',()=>{
  const p={state:'clinch',action:null,ko:false,stun:0};
  assert.equal(chooseClip(p,['idle','guard_stand','clinch_hold']),'clinch_hold');
  assert.equal(chooseClip(p,['idle','guard_stand']),'guard_stand');
  p.state='clinch_recoil';p.stun=9;
  assert.equal(chooseClip(p,['idle','hurt_light','clinch_recoil']),'clinch_recoil');
  p.state='hit';p.reaction='roar_hit';
  assert.equal(chooseClip(p,['idle','hurt_light','roar_hit']),'roar_hit');
  assert.equal(chooseClip(p,['idle','hurt_light']),'hurt_light');
  p.state='block';p.reaction='guard_crouch_hit';
  assert.equal(chooseClip(p,['idle','guard_stand','guard_crouch_hit']),'guard_crouch_hit');
});

test('同時咆哮入力中に自分の咆哮を消さない（左右差の回帰）',()=>{
  const g=new Battle('moguzo','moguzo');
  g.fighters[0].x=-.3;g.fighters[1].x=.3;
  g.tick({roar:true},{roar:true});
  g.tick({},{});
  g.tick({roar:true},{roar:true});
  assert.equal(g.fighters[0].action?.kind,'roar');
  assert.equal(g.fighters[1].action?.kind,'roar');
  assert.equal(g.fighters[0].drive,g.fighters[1].drive);
});
test('同キャラAIは両側の決着が同じ（初期対称性）',()=>{
  for(const id of ['moguzo','pisuke','godan','hakuma','chirka','takimaru','yomikage','bullet','dark_moguzo']){
    const g=simFight(id,id,4510);
    assert.equal(g.winner,-1,id+' mirror');
  }
});
test('Cloudflare Pagesに入力コマンドモジュールも梱包する',()=>{
  const script=readFileSync(new URL('./build-pages.mjs',import.meta.url),'utf8');
  assert.match(script,/['"]commands\.js['"]/);
});

test('各コマンドの省略・ニュートラル・長押しを両向きで扱う',()=>{
  for(const reverse of [false,true]){
    const forward=reverse?B:F, back=reverse?F:B;
    for(const button of ['weak','strong']){
      for(const [sequence,expected] of [
        [[DOWN,{},forward],'s1'],
        [[forward,{},DOWN,{},forward],'s2'],
        [[DOWN,{},back],'s3'],
        [[DOWN,{},forward,{},DOWN,{},forward],button==='strong'?'ultimate':'s1']
      ]){
        const last={...sequence.at(-1),[button]:true};
        const g=scripted([...Array(24).fill(sequence[0]),...sequence.slice(1,-1),last],{reverse,superReady:true});
        assert.equal(g.fighters[0].action?.id,expected);
      }
    }
  }
});

test('方向サンプルを取りこぼさず、無関係な方向や長押しにコマンドが暴発しない',()=>{
  assert.equal(scripted([{directionSamples:[DOWN,DF,F,{}],weak:true}]).fighters[0].action?.id,'s1');
  assert.equal(scripted([DOWN,DF,F,{up:true,weak:true}]).fighters[0].action?.id,'stand_weak');
  assert.equal(scripted([DOWN,DF,...Array(65).fill(F),{...F,weak:true}]).fighters[0].action?.id,'stand_weak');
  const g=scripted([DOWN,DF]);
  g.fighters[0].x=.5;g.fighters[1].x=-.5;
  g.tick({...B,weak:true},{});
  assert.equal(g.fighters[0].action?.id,'stand_weak');
});

test('ギュイーンは被弾中に起動し、左右両側と同座標で正しく組み合う',()=>{
  for(const slot of [0,1]){
    const g=new Battle();
    const p=g.fighters[slot],o=g.fighters[1-slot];
    p.x=o.x=0;p.stun=30;p.stop=12;p.poison=180;p.poisonTick=29;
    const inputs=slot===0?[{gyuiin:true},{}]:[{}, {gyuiin:true}];
    const hp=g.fighters.map(f=>f.hp);
    g.tick(...inputs);
    assert.equal(p.action?.id,'gyuiin');
    assert.equal(p.stun,0);
    assert.equal(p.stop,0);
    assert.equal(p.drive,DRIVE.initial-DRIVE.gyuiinCost);
    while(!g.clinch&&g.frame<25)g.tick(...inputs);
    assert.equal(g.clinch?.initiator,slot);
    assert.equal(Math.abs(p.x-o.x),.36);
    assert.equal(p.facing,-o.facing);
    // Claudeの26Fクリップを最後まで見せるため、回帰条件も26Fに更新する。
    for(let i=0;i<DRIVE.clinchFrames+26;i++)g.tick({},{});
    assert.deepEqual(g.fighters.map(f=>f.hp),hp);
    assert.deepEqual(g.fighters.map(f=>f.state),['idle','idle']);
    assert.ok(Math.abs(p.x-o.x)>=DRIVE.resetSpacing-.01);
    g.tick({},{});
    assert.equal(p.hp,hp[slot]-4,'毒はニュートラルに戻ると再開');
  }
});

test('敵の打撃・弾・投げ・奥義・咆哮からギュイーンを保護し、自分の弾は消さない',()=>{
  for(const kind of ['strike','projectile','throw','super','roar']){
    const g=new Battle(),[p,o]=g.fighters;
    g.tick({gyuiin:true},{});
    const hp=p.hp;
    g._damage(o,p,{kind,damage:999,level:'mid'});
    assert.ok(g.events.some(e=>e.type==='gyuiin_armor'),kind);
    assert.equal(p.hp,hp);
    assert.equal(p.action?.id,'gyuiin');
  }
  const g=new Battle(),p=g.fighters[0];
  g.projectiles.push({id:1,owner:0,x:p.x+.15,y:.30,face:1,speed:.01,life:20},
    {id:2,owner:1,x:p.x+.20,y:.30,face:-1,speed:.01,life:20});
  g.tick({gyuiin:true},{});
  assert.deepEqual(g.projectiles.map(b=>b.id),[1]);
  for(let i=0;i<46;i++)g.tick({gyuiin:true},{});
  assert.equal(g.clinch,null);
  assert.equal(p.action,null);
  assert.equal(p.drive,DRIVE.initial-DRIVE.gyuiinCost);
});

test('追加クリップは旧通常技・掴みの再生先より優先する',()=>{
  for(const [id,anim,added,kind] of [
    ['crouch_weak','stand_light','crouch_light','strike'],
    ['crouch_heavy','stand_heavy','crouch_heavy','strike'],
    ['air_weak','stand_light','air_light','strike'],
    ['air_heavy','stand_heavy','air_heavy','strike'],
    ['throw','stand_heavy','throw_reach','throw']
  ]){
    const p={action:{id,anim,kind}};
    assert.equal(chooseClip(p,['idle',anim,added],{},{normalMotionSource:legacyNormals}),added);
    assert.equal(chooseClip(p,['idle',anim],{},{normalMotionSource:legacyNormals}),anim);
  }
});

test('全9体が全9対戦相手を左右から飛び越え、着地後は後ろガードも反転する',()=>{
  for(const left of Object.keys(ROSTER))for(const right of Object.keys(ROSTER))for(const side of [1,-1]){
    const g=new Battle(left,right),[p,o]=g.fighters;
    p.x=-side*.28;o.x=side*.28;
    const forward=side===1?'right':'left';
    let apex=0;
    for(let i=0;i<42;i++){
      g.tick({[forward]:true,up:i===0},{});
      apex=Math.max(apex,p.y);
      assert.ok(Math.abs(p.x)<=1.76);
    }
    const label=left+'/'+right+'/'+side;
    assert.ok((p.x-o.x)*side>0&&p.y===0&&apex>.62&&apex<.83,label);
    assert.equal(p.facing,-side,label);
    // Keep the new back input against the wall: this checks guard direction,
    // rather than allowing a valid short weak attack to whiff as we walk away.
    p.x=side*1.76;o.x=side*(1.76-.34);
    const hp=p.hp;
    for(let i=0;i<10;i++)g.tick({[forward]:true},{weak:i===0});
    assert.ok(p.guard<ROSTER[p.id].guardMax,label);
    assert.equal(p.hp,hp,label);
  }
});

test('チルカは毒ダメージではなく予備動作フェイント/ディレイで相手を揺さぶる',()=>{
  const g=new Battle('chirka','hakuma');
  g.fighters[0].x=-.22;g.fighters[1].x=.22;
  g.tick({special1:true},{});
  g.tick({},{});g.tick({},{});
  g.tick({left:true},{});
  assert.equal(g.fighters[0].action?.kind,'feint');
  for(let i=0;i<35;i++)g.tick({},{});
  assert.equal(g.fighters[1].poison,0);
  assert.equal(g.fighters[1].hp,ROSTER.hakuma.hp);
  const next=g.again();
  assert.equal(next.fighters[0].ability.feintCount,0);
});
