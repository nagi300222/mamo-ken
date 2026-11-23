// Parse simctl inventories without assuming a fixed runner's device UUID/name.
export function selectIPhoneSimulator(devices,runtimes){
 const candidates=[];
 for(const runtime of runtimes.runtimes??[]){
  if(runtime.isAvailable===false||!/^com\.apple\.CoreSimulator\.SimRuntime\.iOS-/.test(runtime.identifier??''))continue;
  for(const device of devices.devices?.[runtime.identifier]??[]){
   const iPhone=/^iPhone\b/i.test(device.name??'')||/\.iPhone[-.]/i.test(device.deviceTypeIdentifier??'');
   if(device.isAvailable===false||!iPhone||!device.udid)continue;
   candidates.push({udid:device.udid,name:device.name,runtime:runtime.identifier,version:runtime.version??'',state:device.state,deviceTypeIdentifier:device.deviceTypeIdentifier??null});
  }
 }
 const versions=value=>String(value).split('.').map(part=>Number(part)||0);
 candidates.sort((a,b)=>{
  const x=versions(a.version),y=versions(b.version);
  for(let i=0;i<Math.max(x.length,y.length);i++){const delta=(y[i]??0)-(x[i]??0);if(delta)return delta;}
  return Number(b.state==='Booted')-Number(a.state==='Booted')||a.name.localeCompare(b.name)||a.udid.localeCompare(b.udid);
 });
 if(!candidates.length)throw Error('No available iPhone iOS Simulator runtime/device in this Xcode installation');
 return candidates[0];
}
export function pngDimensions(data){
 if(data.length<24||!data.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))||data.toString('ascii',12,16)!=='IHDR')throw Error('Simulator did not produce a valid PNG screenshot');
 const width=data.readUInt32BE(16),height=data.readUInt32BE(20);
 if(!width||!height)throw Error('Simulator screenshot has an empty framebuffer');
 return {width,height,landscapePixels:width>height};
}
// A moving elapsed counter alone does not demonstrate migration progress.
export function coldBootProgress(output){
 const plugins=[...new Set([...String(output).matchAll(/Reason:Running plugin ([^\r\n]+)/g)].map(match=>match[1].trim()))];
 const statuses=[...new Set([...String(output).matchAll(/Status=(\d+), isTerminal=NO/g)].map(match=>Number(match[1])))];
 return {plugins,statuses,advanced:plugins.length>1||statuses.length>1};
}
