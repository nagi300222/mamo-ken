// Data-driven offline remix of existing GLB normal clips into 54 new actual 3D rig clips.
// Output is an animation-only glTF 2.0 binary loaded by GLTFLoader, not a flat image.
import {animationBundle} from './animation-bundle.mjs';
import {MOTIFS,GESTURES,NORMAL_SOURCE,NORMAL_SLOTS} from './normal-motifs-v15.js';
const TYPES=Object.freeze({SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16});
const RAD=Math.PI/180;
function quatAngles(rx,ry,rz){
 const hx=rx*RAD/2,hy=ry*RAD/2,hz=rz*RAD/2;
 const x=Math.sin(hx),y=Math.sin(hy),z=Math.sin(hz);
 const a=Math.cos(hx),b=Math.cos(hy),c=Math.cos(hz);
 return [x*b*c+a*y*z,a*y*c-x*b*z,a*b*z+x*y*c,a*b*c-x*y*z]; // XYZ
}
function quatMul(u,v){
 const [x,y,z,w]=u,[a,b,c,d]=v;
 const q=[w*a+x*d+y*c-z*b,w*b-x*c+y*d+z*a,w*c+x*b-y*a+z*d,w*d-x*a-y*b-z*c];
 const m=Math.hypot(...q)||1;
 return q.map(n=>n/m);
}
const canonical=n=>String(n||'').replace(/[^a-z0-9]/gi,'').toLowerCase();
function poseAt(source,character,poseId,phase){
 const spec=MOTIFS[character]?.[poseId];if(!spec)throw Error('no normal art for '+character+'/'+poseId);
 const pose=GESTURES[spec.gesture];if(!pose)throw Error('no normal gesture '+spec.gesture);
 const key=canonical(source);
 return {spec,angles:pose[key]||Object.entries(pose).find(([k])=>key.endsWith(k))?.[1]||null};
}
function envelope(f,contact){
 const t=Math.max(0,Math.min(1,f)),hit=Math.max(.25,Math.min(.75,contact));
 if(t<.10)return -.28*Math.sin((t/.10)*Math.PI/2);
 if(t<hit)return -.28+1.28*((t-.10)/(hit-.10))**2;
 if(t<hit+.18)return 1-.32*((t-hit)/.18);
 return .68*Math.max(0,1-(t-hit-.18)/(.82-hit));
}
function accessorView(doc,bin,index){
 const a=doc.accessors[index],v=doc.bufferViews[a?.bufferView];
 if(!a||!v||a.componentType!==5126||a.sparse)return null;
 const dim=TYPES[a.type],stride=v.byteStride||dim*4;
 if(!dim||stride<dim*4)return null;
 const offset=(v.byteOffset||0)+(a.byteOffset||0);
 if(offset+(a.count-1)*stride+dim*4>bin.length)throw Error('out of bounds accessor '+index);
 return {data:new DataView(bin.buffer,bin.byteOffset,bin.byteLength),offset,stride,dim,count:a.count};
}
function getNum(v,i,k){return v.data.getFloat32(v.offset+i*v.stride+4*k,true);}
function setNum(v,i,k,n){v.data.setFloat32(v.offset+i*v.stride+4*k,n,true);}
function wrapGlb(doc,bin){
 const json=Buffer.from(JSON.stringify(doc));
 const pad=Buffer.concat([json,Buffer.alloc((4-json.length%4)%4,32)]);
 const head=Buffer.alloc(20);head.write('glTF');head.writeUInt32LE(2,4);
 head.writeUInt32LE(28+pad.length+bin.length,8);head.writeUInt32LE(pad.length,12);head.write('JSON',16);
 const bh=Buffer.alloc(8);bh.writeUInt32LE(bin.length,0);bh.write('BIN\0',4);
 return Buffer.concat([head,pad,bh,bin]);
}
export function decodeNormalPack(bytes){
 const jlen=bytes.readUInt32LE(12);
 const doc=JSON.parse(bytes.toString('utf8',20,20+jlen));
 const bin=Buffer.from(bytes.subarray(28+jlen)); // mutable standalone
 return {doc,bin};
}
export function buildNormalPack(originalGlb,id){
 if(!MOTIFS[id])throw Error('unknown normal character '+id);
 const picked=new Set(Object.values(NORMAL_SOURCE));
 const {doc,bin:packedBin}=decodeNormalPack(animationBundle(originalGlb,picked));
 let bin=packedBin;
 // Insert authored keyframes on previously stationary bones as well as modifying
 // existing source tracks. Otherwise an air kick can have only two keyed limbs.
 function appendFloatAccessor(values,type){
   const bytes=Buffer.alloc(values.length*4);
   for(let i=0;i<values.length;i++)bytes.writeFloatLE(values[i],i*4);
   const offset=bin.length;bin=Buffer.concat([bin,bytes]);
   const view=doc.bufferViews.push({buffer:0,byteOffset:offset,byteLength:bytes.length})-1;
   const dim=TYPES[type],itemCount=values.length/dim;
   const a={bufferView:view,componentType:5126,count:itemCount,type};
   if(type==='SCALAR'){a.min=[Math.min(...values)];a.max=[Math.max(...values)];}
   return doc.accessors.push(a)-1;
 }
 const report=[];
 for(const [slot,source] of Object.entries(NORMAL_SOURCE)){
   const animation=doc.animations.find(a=>a.name===source);
   if(!animation)throw Error('source normal missing '+id+'/'+source);
   const spec=MOTIFS[id][slot];if(!spec)throw Error('missing normal spec '+id+'/'+slot);
   let touched=0,changedSamples=0;
   const editedBones=new Set();
   for(const channel of animation.channels){
     if(channel.target.path!=='rotation')continue;
     const boneName=doc.nodes[channel.target.node]?.name||'';
     const {angles}=poseAt(boneName,id,slot);
     if(!angles)continue;
     const sampler=animation.samplers[channel.sampler];
     if((sampler.interpolation||'LINEAR')==='CUBICSPLINE')continue;
     const times=accessorView(doc,bin,sampler.input),quats=accessorView(doc,bin,sampler.output);
     if(!times||!quats||times.dim!==1||quats.dim!==4||times.count!==quats.count)continue;
     const min=getNum(times,0,0),span=Math.max(.0001,getNum(times,times.count-1,0)-min);
     let modified=0;
     for(let i=0;i<quats.count;i++){
       const time=(getNum(times,i,0)-min)/span;
       const amount=spec.power*envelope(time,spec.contact);
       if(Math.abs(amount)<.0001)continue;
       const q0=[0,1,2,3].map(k=>getNum(quats,i,k));
       const delta=quatAngles(angles[0]*amount,angles[1]*amount,angles[2]*amount);
       const q=quatMul(q0,delta);
       for(let k=0;k<4;k++)setNum(quats,i,k,q[k]);
       modified++;
     }
     if(modified){touched++;changedSamples+=modified;editedBones.add(canonical(boneName));}
   }
   // The source can animate just a couple of bones for a small jab. Author fresh
   // explicit rotation channels for the other character-specific limb gestures.
   const sourceSampler=animation.samplers[0];
   const baseTime=sourceSampler&&accessorView(doc,bin,sourceSampler.input);
   const duration=baseTime?getNum(baseTime,baseTime.count-1,0):0;
   if(!(duration>.04))throw Error('normal clip too short '+id+'/'+slot);
   const keys=[0,.10,spec.contact,Math.min(.92,spec.contact+.18),1];
   const timeline=keys.map(t=>Number((t*duration).toFixed(5)));
   const authoredPose=GESTURES[spec.gesture];
   for(const [name,angles] of Object.entries(authoredPose)){
     const nodeIndex=doc.nodes.findIndex(node=>{
       const nodeName=canonical(node.name);
       return nodeName===name||nodeName.endsWith(name);
     });
     if(nodeIndex<0)continue;
     const node=doc.nodes[nodeIndex];
     const norm=canonical(node.name);
     if(node.matrix||editedBones.has(norm))continue; // no duplicate channels, no matrix/TRS mixing
     const original=Array.isArray(node.rotation)&&node.rotation.length===4?node.rotation:[0,0,0,1];
     const samples=keys.flatMap(t=>{
       const amount=spec.power*envelope(t,spec.contact);
       return quatMul(original,quatAngles(angles[0]*amount,angles[1]*amount,angles[2]*amount));
     });
     const inAcc=appendFloatAccessor(timeline,'SCALAR');
     const outAcc=appendFloatAccessor(samples,'VEC4');
     const samplerIndex=animation.samplers.push({input:inAcc,output:outAcc,interpolation:'LINEAR'})-1;
     animation.channels.push({sampler:samplerIndex,target:{node:nodeIndex,path:'rotation'}});
     touched++;changedSamples+=keys.length;
   }
   if(touched<3||changedSamples<12)throw Error('not enough authored bones '+id+'/'+slot+' '+touched+'/'+changedSamples);
   animation.name='v15_'+slot;
   animation.extras={source,gesture:spec.gesture,authoring:'normal-motifs-v15',character:id};
   report.push({slot,clip:animation.name,gesture:spec.gesture,bones:touched,modifiedSamples:changedSamples});
 }
 doc.buffers[0].byteLength=bin.length;
 const out=wrapGlb(doc,bin);
 if(doc.animations.length!==NORMAL_SLOTS.length)throw Error('wrong normal count '+id);
 return {bytes:out,report};
}
