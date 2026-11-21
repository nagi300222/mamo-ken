import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Battle, DRIVE, simFight } from './battle.js';
import { IDS, ROSTER } from './balance.js';
import { MODEL_REVISION, chooseClip } from './models.js';

const loadModel=(id)=>{
  const meta=JSON.parse(readFileSync(new URL(`../chars/${id}/${id}_motions.json`,import.meta.url),'utf8'));
  const glb=readFileSync(new URL(`../chars/${id}/${id}.glb`,import.meta.url));
  assert.equal(glb.toString('ascii',0,4),'glTF',id+' GLB header');
  assert.equal(glb.readUInt32LE(4),2,'GLB version 2');
  assert.equal(glb.readUInt32LE(16),0x4E4F534A,'first chunk is JSON');
  const len=glb.readUInt32LE(12);
  const doc=JSON.parse(glb.toString('utf8',20,20+len));
  return {meta,animations:doc.animations.map(a=>a.name),size:glb.length};
};
test('9体とも各GLBに37本の実アニメがあり、コマンドJSONと一致',()=>{
  assert.match(MODEL_REVISION,/motion-v2/);
  for(const id of IDS){
    const {meta,animations,size}=loadModel(id);
    assert.equal(animations.length,37,id);
    assert.equal(Object.keys(meta.clips).length,37,id);
    assert.equal(meta.v2_clips.length,26,id);
    assert.ok(size>2400000&&size<3200000,id);
    for(const notation of ['236','623','214','236236']){
      assert.ok(animations.includes(meta.command_map[notation]),id+'/'+notation);
    }
    for(const name of ['roar','roar_hit','gyuiin','clinch_hold','clinch_recoil','guard_hit',
      'guard_impact','guard_crouch','guard_crouch_hit','hurt_heavy','down','ko','wakeup',
      'throw_reach','throw_hit','thrown','land','dash_stop','dash_b',
      'crouch_light','crouch_heavy','air_light','air_heavy','super']){
      assert.ok(animations.includes(name),id+'/'+name);
    }
  }
});
test('9体それぞれの技入力は本物の固有/新規アニメへ接続される',()=>{
  for(const id of IDS){
    const {meta,animations}=loadModel(id);
    for(const [slot,notation] of [['s1','236'],['s2','623'],['s3','214'],['ultimate','236236']]){
      const fake={state:'attack',stun:0,ko:false,action:{id:slot,kind:slot==='ultimate'?'super':'strike',
        anim:'stand_heavy'},reaction:null};
      const clip=chooseClip(fake,animations,meta.command_map);
      assert.equal(clip,meta.command_map[notation],id+' '+slot);
    }
  }
});
test('通常技・しゃがみガード・被弾・クリンチ・KOが新クリップに接続される',()=>{
  const {animations}=loadModel('moguzo');
  const p=(state,rest={})=>({state,ko:false,stun:0,action:null,landF:0,...rest});
  assert.equal(chooseClip(p('attack',{action:{id:'crouch_weak',anim:'stand_light'}}),animations),'crouch_light');
  assert.equal(chooseClip(p('attack',{action:{id:'crouch_heavy',anim:'stand_heavy'}}),animations),'crouch_heavy');
  assert.equal(chooseClip(p('attack',{action:{id:'air_weak',anim:'stand_light'}}),animations),'air_light');
  assert.equal(chooseClip(p('attack',{action:{id:'air_heavy',anim:'stand_heavy'}}),animations),'air_heavy');
  assert.equal(chooseClip(p('crouch',{input:{down:true,left:true},facing:1}),animations),'guard_crouch');
  assert.equal(chooseClip(p('block',{stun:12,reaction:'guard_impact'}),animations),'guard_impact');
  assert.equal(chooseClip(p('hit',{stun:12,reaction:'roar_hit'}),animations),'roar_hit');
  assert.equal(chooseClip(p('clinch'),animations),'clinch_hold');
  assert.equal(chooseClip(p('clinch_recoil',{stun:26}),animations),'clinch_recoil');
  assert.equal(chooseClip(p('throw_hit'),animations),'throw_hit');
  assert.equal(chooseClip(p('thrown'),animations),'thrown');
  assert.equal(chooseClip(p('wakeup',{stun:40}),animations),'wakeup');
  assert.equal(chooseClip(p('idle',{landF:8}),animations),'land');
  assert.equal(chooseClip(p('idle',{ko:true}),animations),'ko');
});
test('ギュイーン弾き戻しは26F完走後ニュートラルへ復帰',()=>{
  const g=new Battle('moguzo','godan');
  g.fighters[0].x=-.22;g.fighters[1].x=.22;
  g.tick({gyuiin:true},{});
  for(let i=0;i<46&&!g.clinch;i++)g.tick({},{});
  assert.ok(g.clinch);
  for(let i=0;i<DRIVE.clinchFrames;i++)g.tick({},{});
  assert.ok(!g.clinch);
  assert.deepEqual(g.fighters.map(x=>x.stun),[26,26]);
  assert.deepEqual(g.fighters.map(x=>x.state),['clinch_recoil','clinch_recoil']);
  for(let i=0;i<26;i++)g.tick({},{});
  assert.ok(g.fighters.every(p=>p.state!=='clinch_recoil'));
});
test('掴みヒット時は双方の投げ・投げられ・起き上がりを同期しダメージ一度だけ',()=>{
  const g=new Battle('moguzo','godan');
  g.fighters[0].x=-.18;g.fighters[1].x=.18;
  const hp=g.fighters[1].hp;
  for(let i=0;i<14&&!g.throwSequence;i++)g.tick({throw:i===0},{});
  assert.ok(g.throwSequence);
  assert.equal(g.fighters[0].state,'throw_hit');
  assert.equal(g.fighters[1].state,'thrown');
  const hitHp=g.fighters[1].hp;
  assert.ok(hitHp<hp);
  for(let i=0;i<48;i++)g.tick({},{});
  assert.equal(g.throwSequence,null);
  assert.equal(g.fighters[1].state,'wakeup');
  assert.equal(g.fighters[1].hp,hitHp,'no extra damage while in throw animation');
  for(let i=0;i<40;i++)g.tick({},{});
  assert.ok(g.fighters[1].state!=='wakeup');
});
test('新モーション接続後も81組のCPU戦を完走',()=>{
  for(const a of IDS)for(const b of IDS){
    const g=simFight(a,b,ROSTER[a].hp*10);
    assert.equal(g.phase,'ko',a+'/'+b);
  }
});
