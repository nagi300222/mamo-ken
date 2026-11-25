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

// Reserve the touch zones in screen space while keeping a full-width canvas.
// Fighters have priority over effects when projectiles leave the fighting area.
export function frameCombat(fighters, projectiles, aspect, zones, previous, blend) {
  const base = frameTargets(fighters, aspect);
  const {left, right} = zones;
  const safeSpan = Math.max(.25, 1 - left - right);
  const positions = fighters.map(fighter => fighter.x);
  const min = Math.min(...positions) - .42;
  const max = Math.max(...positions) + .42;
  const airborne = Math.max(...fighters.map(fighter => fighter.y));
  const focusY = base.focusY + .04;
  const verticalHalf = Math.max(.76, focusY + .14, (airborne + .86 - focusY) / .55);
  const required = Math.max(verticalHalf * aspect, (max - min) / (2 * safeSpan));
  const shotLeft = Math.min(min, ...projectiles.map(shot => Math.max(min - .30, shot.x - .08)));
  const shotRight = Math.max(max, ...projectiles.map(shot => Math.min(max + .30, shot.x + .08)));
  const desired = Math.max(required, (shotRight - shotLeft) / (2 * safeSpan));
  const halfWidth = blend === 1 ? desired :
    Math.max(required, previous.halfWidth + (desired - previous.halfWidth) * blend);
  const target = (shotLeft + shotRight) * .5 + (right - left) * halfWidth;
  const center = previous.x + (target - previous.x) * blend;
  return {
    x: clamp(center, max - (1 - 2 * right) * halfWidth, min + (1 - 2 * left) * halfWidth),
    y: previous.y + (focusY - previous.y) * blend,
    halfWidth,
  };
}

// Use local landscape X even when CSS rotates the whole app on a portrait phone.
export function combatTouchZones(canvas, leftRail, rightRail, rotated) {
  const screen = canvas.getBoundingClientRect();
  const left = leftRail.getBoundingClientRect();
  const right = rightRail.getBoundingClientRect();
  const width = rotated ? screen.height : screen.width;
  const fromLeft = rotated ? left.bottom - screen.top : left.right - screen.left;
  const fromRight = rotated ? screen.bottom - right.top : screen.right - right.left;
  return {
    left: clamp((fromLeft + 6) / Math.max(1, width), 0, .34),
    right: clamp((fromRight + 6) / Math.max(1, width), 0, .41),
  };
}
