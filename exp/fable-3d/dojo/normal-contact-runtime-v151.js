// Animation audit data is expressed in local forward metres, independent of facing.
export function normalReachAt(move,frame){
 const points=move.activeReach;
 if(!points?.length)return move.reach;
 const phase=Math.max(0,Math.min(1,(frame-move.startup)/Math.max(1,move.active-1)));
 if(phase<=points[0].phase)return Math.max(0,points[0].reach);
 for(let i=1;i<points.length;i++)if(phase<=points[i].phase){
  const a=points[i-1],b=points[i],mix=(phase-a.phase)/(b.phase-a.phase);
  return Math.max(0,a.reach+(b.reach-a.reach)*mix);
 }
 return Math.max(0,points.at(-1).reach);
}
