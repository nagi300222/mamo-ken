// Art samples use local forward and local height in metres, independent of facing.
function sample(move,frame,field,fallback){
 const points=move.activeReach;
 if(!points?.length)return fallback;
 const value=p=>p[field]??fallback;
 const phase=Math.max(0,Math.min(1,(frame-move.startup)/Math.max(1,move.active-1)));
 if(phase<=points[0].phase)return value(points[0]);
 for(let i=1;i<points.length;i++)if(phase<=points[i].phase){
  const a=points[i-1],b=points[i],mix=(phase-a.phase)/(b.phase-a.phase);
  return value(a)+(value(b)-value(a))*mix;
 }
 return value(points.at(-1));
}
export const normalReachAt=(move,frame)=>Math.max(0,sample(move,frame,'reach',move.reach));
export const normalHeightAt=(move,frame)=>sample(move,frame,'height',move.strikeHeight);
// Air attacks may reach below the fighter's foot/root plane. Keep that signed
// local coordinate; normalVerticalContact adds the actual airborne world Y.
export function validNormalStrikeHeight(slot,height,groundTolerance=.01){
 return Number.isFinite(height)&&(String(slot).startsWith('air_')||height>=-groundTolerance);
}
export function normalVerticalContact(attacker,target,move,hurtBounds){
 const crouching=target.y===0&&(target.state==='crouch'||
   target.state==='block'&&target.input.down||target.action?.id?.startsWith('crouch_'));
 const box=hurtBounds?.[target.id]?.[crouching?'crouch':'stand'];
 if(!box)throw Error('missing measured hurt bounds: '+target.id);
 const y=attacker.y+normalHeightAt(move,attacker.frame),radius=move.strikeRadius??.06;
 return y+radius>=target.y+box.bottom&&y-radius<=target.y+box.top;
}
