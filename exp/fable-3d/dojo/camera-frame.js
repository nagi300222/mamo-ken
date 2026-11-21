// 試遊v0.3: 対戦中の2体を中心に、背景の空きすぎを防ぐカメラ。
// スマホ画面/Three.jsから独立させ、フレーミング条件をテスト可能にする。
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
export function frameTargets(players=[],aspect=1.6){
  const a=players[0]||{x:-.7,y:0};
  const b=players[1]||{x:.7,y:0};
  const ar=clamp(Number.isFinite(aspect)?aspect:1.6,.85,4);
  const distance=Math.abs(a.x-b.x);
  const maxAir=Math.max(0,a.y||0,b.y||0);
  // 地面と頭上を両方残しつつ、跳躍時は少しだけ視線を上げる。
  const focusY=.50+Math.min(.26,maxAir*.33);
  const verticalHalf=Math.max(.82,focusY+.16,maxAir+.77-focusY+.22);
  // 近距離では寄り、離れたときだけ左右へ引いて両者を追う。
  const halfWidth=clamp(Math.max(1.30,distance*.5+.43,verticalHalf*ar),1.30,2.70);
  return {centerX:(a.x+b.x)*.5,focusY,halfWidth,halfHeight:halfWidth/ar};
}
