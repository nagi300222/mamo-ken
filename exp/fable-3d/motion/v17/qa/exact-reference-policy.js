// The fixed-step game can only render i/(active-1) during its active frames.
// Additional diagnostic samples remain valuable for mirror/limb/foot review,
// but are not compared strictly to an interpolated, unmeasured reference.
export const PHASE_EPSILON=.0001;
export function interpolateReference(points,phase){
 const b=points.find(p=>p.phase>=phase)??points.at(-1),a=points[Math.max(0,points.indexOf(b)-1)],u=b.phase===a.phase?0:(phase-a.phase)/(b.phase-a.phase);
 return {phase,reach:a.reach+(b.reach-a.reach)*u,height:a.height+(b.height-a.height)*u};
}
export function compareExactReference(points,activeFrames,phase,actual,tolerance=.015){
 const isBattleFrame=Array.from({length:activeFrames},(_,i)=>activeFrames>1?i/(activeFrames-1):0).some(p=>Math.abs(p-phase)<=PHASE_EPSILON);
 const hasExactReference=points.some(p=>Math.abs(p.phase-phase)<=PHASE_EPSILON),comparisonMode=isBattleFrame||hasExactReference?'strict':'diagnostic';
 const expected=interpolateReference(points,phase),reachError=actual.reach-expected.reach,heightError=actual.height-expected.height;
 const outsideTolerance=Math.abs(reachError)>tolerance||Math.abs(heightError)>tolerance;
 return {isBattleFrame,hasExactReference,comparisonMode,expected,reachError,heightError,outsideTolerance,
  missingBattleReference:isBattleFrame&&!hasExactReference,failed:isBattleFrame&&!hasExactReference||comparisonMode==='strict'&&outsideTolerance};
}
