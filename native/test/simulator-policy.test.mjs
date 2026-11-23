import test from 'node:test';import assert from 'node:assert/strict';
import {selectIPhoneSimulator,pngDimensions} from '../tools/simulator-policy.mjs';
const ios=n=>'com.apple.CoreSimulator.SimRuntime.iOS-'+n;
test('Simulator discovery selects an available iPhone on newest available iOS, excluding iPad/unavailable',()=>{
 const runtimes={runtimes:[{identifier:ios('26-4'),version:'26.4',isAvailable:true},{identifier:ios('26-5'),version:'26.5',isAvailable:true},{identifier:ios('27-0'),version:'27.0',isAvailable:false}]};
 const device=(udid,name,state='Shutdown',extra={})=>({udid,name,state,isAvailable:true,...extra});
 const devices={devices:{[ios('26-4')]:[device('old','iPhone 17','Booted')],[ios('26-5')]:[device('pad','iPad Pro'),device('cold','iPhone 17 Pro'),device('warm','iPhone 17','Booted'),device('missing','iPhone unavailable','Booted',{isAvailable:false})],[ios('27-0')]:[device('future','iPhone 18')]}};
 assert.equal(selectIPhoneSimulator(devices,runtimes).udid,'warm');
});
test('custom-named iPhone is detected by device type; missing runtime/device fails explicitly',()=>{
 const runtime=ios('26-5'),runtimes={runtimes:[{identifier:runtime,version:'26.5'}]};
 assert.equal(selectIPhoneSimulator({devices:{[runtime]:[{udid:'test',name:'Mamo test device',deviceTypeIdentifier:'com.apple.CoreSimulator.SimDeviceType.iPhone-17'}]}},runtimes).udid,'test');
 assert.throws(()=>selectIPhoneSimulator({devices:{}},runtimes),/No available iPhone/);
});
test('PNG metadata reports actual pixel orientation and rejects empty/truncated capture',()=>{
 const png=Buffer.alloc(24);Buffer.from([137,80,78,71,13,10,26,10]).copy(png);png.write('IHDR',12);png.writeUInt32BE(2532,16);png.writeUInt32BE(1170,20);
 assert.deepEqual(pngDimensions(png),{width:2532,height:1170,landscapePixels:true});
 png.writeUInt32BE(1170,16);png.writeUInt32BE(2532,20);assert.equal(pngDimensions(png).landscapePixels,false);
 assert.throws(()=>pngDimensions(Buffer.alloc(10)),/valid PNG/);png.writeUInt32BE(0,20);assert.throws(()=>pngDimensions(png),/empty framebuffer/);
});
