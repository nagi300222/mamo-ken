// Keep the landscape UI even when a phone's native orientation is locked to portrait.
// Browser viewports don't reliably support ScreenOrientation.lock(), especially iOS.
export function isNativeRuntime(scope=globalThis){
  try{return scope.mamokenNative?.isNative===true||scope.Capacitor?.isNativePlatform?.()===true;}catch{return false;}
}
export function shouldRotateLandscape(width,height,touchDevice=true,native=isNativeRuntime()){
  // UIKit owns orientation in the installed app. A portrait launch/interruption
  // viewport must not trigger the browser's additional +90 degree CSS rotation.
  return !native && !!touchDevice && Number.isFinite(width) && Number.isFinite(height) &&
    width>0 && height>0 && width<height;
}
// A CSS +90° rotation maps local +X to screen +Y and local +Y to screen -X.
// Invert that for the joystick's hit-test; buttons use DOM pointer capture unchanged.
export function localStickAxes(clientDx,clientDy,radius,rotated){
  const r=Math.max(1,Number(radius)||1);
  const x=rotated?clientDy:clientDx;
  const y=rotated?-clientDx:clientDy;
  return {x:x===0?0:x/r,y:y===0?0:y/r};
}
