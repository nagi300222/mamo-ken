// Two independent pointer streams: left controls movement, right controls only
// orbit. Yaw is the avatar-to-camera horizontal angle; zero looks toward -Z.
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
export const EXPLORATION_CAMERA=Object.freeze({distance:2.95,minPitch:.12,maxPitch:.98,defaultPitch:.43,deadzone:.18,sensitivity:.006,followSpeed:2.2,followDelay:.9});
export function cameraRelativeMove(x,y,yaw){
 if(![x,y,yaw].every(Number.isFinite))return {x:0,z:0};const norm=Math.max(1,Math.hypot(x,y));x/=norm;y/=norm;
 return {x:Math.cos(yaw)*x+Math.sin(yaw)*y,z:-Math.sin(yaw)*x+Math.cos(yaw)*y};
}
export function createExplorationControls(initial={}){
 let left=null,right=null,stick={x:0,y:0},rightPoint=null;
 let yaw=Number.isFinite(initial.yaw)?wrap(initial.yaw):0,pitch=Number.isFinite(initial.pitch)?clamp(initial.pitch,EXPLORATION_CAMERA.minPitch,EXPLORATION_CAMERA.maxPitch):EXPLORATION_CAMERA.defaultPitch;
 let follow=initial.follow!==false,manualDelay=0;
 const api={
  beginMove(pointer){if(left!==null||pointer===right)return false;left=pointer;return true;},
  move(pointer,x,y){if(pointer!==left||![x,y].every(Number.isFinite))return false;const length=Math.hypot(x,y);if(length<EXPLORATION_CAMERA.deadzone)stick={x:0,y:0};else{const scale=Math.max(1,length);stick={x:x/scale,y:y/scale};}return true;},
  endMove(pointer){if(pointer!==left)return false;left=null;stick={x:0,y:0};return true;},
  beginOrbit(pointer,x,y){if(right!==null||pointer===left||![x,y].every(Number.isFinite))return false;right=pointer;rightPoint={x,y};manualDelay=EXPLORATION_CAMERA.followDelay;return true;},
  orbit(pointer,x,y){if(pointer!==right||![x,y].every(Number.isFinite))return false;const dx=x-rightPoint.x,dy=y-rightPoint.y;rightPoint={x,y};yaw=wrap(yaw-dx*EXPLORATION_CAMERA.sensitivity);pitch=clamp(pitch+dy*EXPLORATION_CAMERA.sensitivity,EXPLORATION_CAMERA.minPitch,EXPLORATION_CAMERA.maxPitch);manualDelay=EXPLORATION_CAMERA.followDelay;return true;},
  endOrbit(pointer){if(pointer!==right)return false;right=null;rightPoint=null;return true;},
  movement(keys={}){const x=keys.right?1:keys.left?-1:stick.x,y=keys.down?1:keys.up?-1:stick.y;return cameraRelativeMove(x,y,yaw);},
  update(dt,heading,moving){const seconds=clamp(Number(dt)||0,0,.05);manualDelay=Math.max(0,manualDelay-seconds);if(follow&&moving&&right===null&&manualDelay===0&&Number.isFinite(heading)){const target=wrap(heading-Math.PI);yaw=wrap(yaw+wrap(target-yaw)*Math.min(1,seconds*EXPLORATION_CAMERA.followSpeed));}return api.snapshot;},
  resetView(heading=Math.PI){yaw=Number.isFinite(heading)?wrap(heading-Math.PI):0;pitch=EXPLORATION_CAMERA.defaultPitch;manualDelay=0;},
  setFollow(value){follow=!!value;return follow;},
  clearPointers(){left=null;right=null;rightPoint=null;stick={x:0,y:0};},
  restore(view){if(!view)return;if(Number.isFinite(view.yaw))yaw=wrap(view.yaw);if(Number.isFinite(view.pitch))pitch=clamp(view.pitch,EXPLORATION_CAMERA.minPitch,EXPLORATION_CAMERA.maxPitch);if(typeof view.follow==='boolean')follow=view.follow;api.clearPointers();},
  get snapshot(){return {yaw,pitch,follow,leftPointer:left,rightPointer:right,stick:{...stick}};},
  get view(){return {yaw,pitch,follow};}
 };return api;
}
