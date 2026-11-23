// Three tapered claw marks for real P3 contacts. Cinematic/legacy geometry is
// deliberately separate so the existing nine movies retain their authored FX.
export function createClawSweepGeometry(THREE){
 const shapes=[-.05,0,.05].map(offset=>{
  const shape=new THREE.Shape();
  shape.moveTo(offset-.08,-.17);
  shape.quadraticCurveTo(offset+.12,-.035,offset+.035,.17);
  shape.quadraticCurveTo(offset+.052,-.025,offset-.08,-.17);
  shape.closePath();return shape;
 });
 return new THREE.ShapeGeometry(shapes,8);
}
