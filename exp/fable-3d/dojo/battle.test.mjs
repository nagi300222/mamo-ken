import {battleControlsMarkup} from '../shared-ui/battle-ui.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { ROSTER, IDS, assertBalance, normalMove, tailTipAt, ARENA } from './balance.js';
import { Battle, simFight, UNIVERSAL_ACTIONS, DRIVE } from './battle.js';
import { pushDirection, readCommand } from './commands.js';
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
  const initial=g.fighters[1].hp;for(let f=0;f<70;f++)g.tick({special3:f===0},{});
  assert.ok(g.fighters[1].hp<initial,'tail should connect at 0.65m');
});
test('GLB差し替え時の尾判定はモーションJSONの軌跡を読み直す',()=>{
  const g=new Battle('bullet','moguzo');
  const oldReach=g._tailAt(24);
  g.setTailTipPath([[0,-.4],[18,.15],[24,.73],[26,.70],[48,-.4]]);
  assert.equal(g._tailAt(24),.73);
  assert.ok(g._tailAt(24)>oldReach);
  const again=g.again();assert.equal(again._tailAt(24),.73);
});

test('弱攻撃が命中し、後ろガードでHPを減らさない',()=>{
  const hit=new Battle('moguzo','godan');hit.fighters[0].x=-.21;hit.fighters[1].x=.22;
  const hp=hit.fighters[1].hp;for(let f=0;f<45;f++)hit.tick({weak:f===0},{});
  assert.ok(hit.fighters[1].hp<hp,'normal hit');
  const block=new Battle('moguzo','godan');block.fighters[0].x=-.21;block.fighters[1].x=.22;
  for(let f=0;f<45;f++)block.tick({weak:f===0},{right:true});
  assert.equal(block.fighters[1].hp,ROSTER.godan.hp,'back guard stops damage');
  assert.ok(block.fighters[1].guard<ROSTER.godan.guardMax,'block costs guard');
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


function stickInput(code,facing=1){
  const x=((((code-1)%3)-1)*facing),y=Math.floor((code-1)/3)-1;
  return {left:x<0,right:x>0,up:y>0,down:y<0};
}
test('共通4コマンドを両向き・斜め抜けで認識',()=>{
  const cases=[
    [[2,3,6],'qcf','weak',false],[[2,6],'qcf','weak',false],
    [[6,2,3],'dp','strong',false],[[6,2,6],'dp','strong',false],
    [[2,1,4],'qcb','weak',false],[[2,4],'qcb','strong',false],
    [[2,3,6,2,3,6],'super','strong',true],[[2,6,2,6],'super','strong',true]
  ];
  for(const facing of [1,-1])for(const [seq,expected,button,meter] of cases){
    let history=[];
    seq.forEach((dir,i)=>{history=pushDirection(history,stickInput(dir,facing),i+1,facing);});
    assert.equal(readCommand(history,button,seq.length+1,meter),expected,expected+seq.join('')+facing);
  }
  assert.equal(readCommand(pushDirection([],stickInput(6),1), 'weak',2,false),null,'前＋弱だけでは必殺技を誤発動しない');
});
test('全9体がジャンプで相手の頭上を横切れる',()=>{
  for(const id of IDS){
    const g=new Battle(id,'godan');const p=g.fighters[0],enemy=g.fighters[1];
    p.x=-.22;enemy.x=.22;g.tick({up:true,right:true},{});
    let peak=0,cross=false;
    for(let i=0;i<58;i++){
      g.tick({right:true},{});
      peak=Math.max(peak,p.y);
      if(p.y>.45&&p.x>enemy.x+.05)cross=true;
    }
    assert.ok(peak>.62&&peak<.83,id+': v0.3の低いジャンプの範囲外');
    assert.ok(cross,id+': 相手を飛び越せない');
  }
});
test('咆哮は敵弾を消し、後出し咆哮で返せる',()=>{
  const g=new Battle('moguzo','godan');const p=g.fighters[0],enemy=g.fighters[1];
  g._begin(p,UNIVERSAL_ACTIONS.roar,'roar');
  for(let i=0;i<5;i++)g.tick({},{});
  g.projectiles.push({id:999,owner:1,x:p.x+.35,y:.30,face:-1,speed:.01,life:30,damage:90});
  g.tick({},{});
  assert.equal(g.projectiles.length,0);
  assert.ok(g.events.some(e=>e.type==='roar_erase'));
  const c=new Battle('moguzo','godan');const a=c.fighters[0],b=c.fighters[1];
  a.x=-.2;b.x=.2;c._begin(a,UNIVERSAL_ACTIONS.roar,'roar');
  for(let i=0;i<4;i++)c.tick({},{});
  c._begin(b,UNIVERSAL_ACTIONS.roar,'roar');
  let counter=false;
  for(let i=0;i<28;i++){c.tick({},{});counter ||= c.events.some(e=>e.type==='roar_counter');}
  assert.ok(counter,'遅れて咆哮を出した側が返せる');
});
test('同時咆哮は相殺し、一方だけダメージを受けない',()=>{
  const g=new Battle('moguzo','godan');const a=g.fighters[0],b=g.fighters[1];
  a.x=-.20;b.x=.20;
  g._begin(a,UNIVERSAL_ACTIONS.roar,'roar');g._begin(b,UNIVERSAL_ACTIONS.roar,'roar');
  let clash=false;for(let i=0;i<26;i++){g.tick({},{});clash ||=g.events.some(e=>e.type==='roar_clash');}
  assert.ok(clash);assert.equal(a.hp,ROSTER.moguzo.hp);assert.equal(b.hp,ROSTER.godan.hp);
});
test('ギュイーンはドライブを消費、先行入力で即拘束せず接触からクリンチ',()=>{
  const g=new Battle('moguzo','godan');const p=g.fighters[0],op=g.fighters[1];
  p.x=-.25;op.x=.25;
  g.tick({gyuiin:true},{});
  assert.equal(g.clinch,null,'初フレームで拘束されない');
  assert.equal(p.drive,DRIVE.initial-DRIVE.gyuiinCost);
  assert.equal(p.action?.kind,'clinch');
  let engaged=false;for(let i=0;i<25;i++){g.tick({},{});engaged ||= !!g.clinch;}
  assert.ok(engaged,'前進と接触でクリンチ成立');
});
test('距離外の攻撃をハイパーアーマーで受けてもギュイーンは解除されない',()=>{
  const g=new Battle('moguzo','godan');const p=g.fighters[0],attacker=g.fighters[1];
  p.x=-.7;attacker.x=.7;g.tick({gyuiin:true},{});
  for(let i=0;i<4;i++)g.tick({},{});
  g._damage(attacker,p,{kind:'strike',id:'test',damage:100,level:'mid'},.3);
  assert.equal(p.stun,0);assert.equal(p.action?.kind,'clinch');
});
test('v0.7は右6操作（方向+必殺と奥義専用）で左スティックも保持',async()=>{
  const {readFile}=await import('node:fs/promises');
  const html=await readFile(new URL('./index.html',import.meta.url),'utf8');
  const rail=battleControlsMarkup();
  const buttons=[...rail.matchAll(/data-control="([^"]+)"/g)].map(x=>x[1]);
  assert.deepEqual(buttons,['weak','strong','throw','gyuiin','special','ultimateButton']);
  for(const k of ['roar','special1','special2','special3','super'])assert.ok(!buttons.includes(k));
  assert.ok(html.includes('id="joystick"'));
});
