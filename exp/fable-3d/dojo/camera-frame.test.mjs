import test from 'node:test';
import assert from 'node:assert/strict';
import { frameTargets } from './camera-frame.js';

test('近距離では画角を寄せ、従来の左右2.22mよりキャラを大きく映す',()=>{
  const p=[{x:-.7,y:0},{x:.7,y:0}];
  const view=frameTargets(p,1.45);
  assert.ok(view.halfWidth<1.7);
  assert.ok(view.halfWidth>=1.3);
  assert.equal(view.centerX,0);
});
test('遠距離では両キャラと攻撃シルエットに必要な左右余白を取る',()=>{
  for(const aspect of [1,1.2,1.45,1.8,2.5]){
    const players=[{x:-1.74,y:0},{x:1.74,y:0}];
    const view=frameTargets(players,aspect);
    assert.ok(view.halfWidth>=1.74+.40,JSON.stringify({aspect,view}));
    assert.ok(Number.isFinite(view.halfHeight));
  }
});
test('ジャンプ最高点でも地面と頭上の両方が視野に収まる',()=>{
  const players=[{x:.25,y:.795},{x:-.25,y:0}];
  for(const aspect of [1,1.2,1.7,2.2]){
    const v=frameTargets(players,aspect);
    assert.ok(v.focusY-v.halfHeight<=-.12,JSON.stringify(v));
    assert.ok(v.focusY+v.halfHeight>=.795+.77+.20,JSON.stringify(v));
  }
});
test('中央への追従は対戦フィールドの現在位置を使い、プレイヤーの入力とは独立',()=>{
  const view=frameTargets([{x:1.0,y:0},{x:1.4,y:0}],1.5);
  assert.equal(view.centerX,1.2);
  const defaultView=frameTargets([],1.3);
  assert.equal(defaultView.centerX,0);
});
test('Cloudflare静的出力にcamera-frame.jsが含まれる',async()=>{
  const {readFileSync}=await import('node:fs');
  const file=readFileSync(new URL('./build-pages.mjs',import.meta.url),'utf8');
  assert.match(file,/['"]camera-frame\.js['"]/);
});
test('full-bleed match framing reserves both controls including during a fast cross-up',async()=>{
  const {frameCombat}=await import('./camera-frame.js');
  const zones={left:.24,right:.32}, aspect=720/320, blend=.18;
  let frame={x:0,y:.5,halfWidth:1.4};
  for(const xs of [[-1.76,-1.3],[-1.76,1.76],[1.76,1.4],[1.45,1.76],[-.3,.3]]){
    const fighters=xs.map((x,i)=>({x,y:i*.7}));
    frame=frameCombat(fighters,[{x:xs[0]-.1},{x:xs[1]+.25}],aspect,zones,frame,blend);
    const screen=x=>(x-frame.x)/(2*frame.halfWidth)+.5;
    assert.ok(screen(Math.min(...xs)-.42)>=zones.left-1e-8);
    assert.ok(screen(Math.max(...xs)+.42)<=1-zones.right+1e-8);
    assert.ok(frame.halfWidth>0);
  }
  const fighters=[{x:.1,y:0},{x:.6,y:0}];
  const instant=frameCombat(fighters,[],aspect,zones,frame,1);
  const follow=frameCombat(fighters,[],aspect,zones,frame,.18);
  assert.ok(Math.abs(follow.x-instant.x)>1e-5);
  assert.ok(Math.abs(follow.x-frame.x)<Math.abs(instant.x-frame.x));
});
