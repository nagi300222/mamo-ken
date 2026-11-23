// Node-only unit support. Uses the shipped GLTFLoader, modular skins and real
// morph/bone sampling. Image decoding is stubbed; this proves no GPU rendering.
import {register} from 'node:module';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {buildNormalPack} from '../../../dojo/normal-clip-builder-v15.mjs';
register('../tools/three-loader.mjs',import.meta.url);
const avatars=new Map(),measurements=new Map();
let factory,assetQueue=Promise.resolve();
async function withFileAssets(task){
 const saved=Object.fromEntries(['fetch','self','createImageBitmap','ProgressEvent'].map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]));
 const originalFetch=globalThis.fetch;
 globalThis.self=globalThis;
 globalThis.createImageBitmap=async()=>({width:1024,height:1024,close(){}});
 globalThis.ProgressEvent=class{constructor(type,props){this.type=type;Object.assign(this,props);}};
 globalThis.fetch=async(url,options)=>{
  const path=typeof url==='string'||url instanceof URL?String(url):url.url;
  if(!path.startsWith('file:'))return originalFetch(url,options);
  try{
   let bytes;
   try{bytes=await readFile(fileURLToPath(path));}
   catch(error){
    const legacy=path.match(/\/normal\/v15\/([a-z_]+)_normals\.glb$/);
    if(!legacy||error.code!=='ENOENT')throw error;
    // Unit CI precedes Pages generation. Build the existing v15 normal pack in
    // memory from its unchanged GLB, using the same builder as Pages.
    const original=await readFile(new URL('../../../chars/'+legacy[1]+'/'+legacy[1]+'.glb',import.meta.url));
    bytes=buildNormalPack(original,legacy[1]).bytes;
   }
   return new Response(bytes,{headers:{'Content-Type':path.endsWith('.json')?'application/json':'application/octet-stream'}});
  }catch(error){return new Response(error.message,{status:404});}
 };
 try{return await task();}
 finally{for(const [key,descriptor]of Object.entries(saved))if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];}
}
export async function actualAvatarMeasurement(definition){
 factory??=await import('../avatar-factory.js');
 const baseId=definition.appearance.baseId,styleId=definition.combat.styleId,key=baseId+'/'+styleId;
 if(!measurements.has(key)){
  if(!avatars.has(baseId)){
   const loading=assetQueue.then(()=>withFileAssets(()=>factory.createAvatar(definition)));
   assetQueue=loading.catch(()=>{});avatars.set(baseId,loading);
  }
  measurements.set(key,factory.measureContacts(await avatars.get(baseId),{styleId}));
 }
 return structuredClone(measurements.get(key));
}
export async function disposeMeasuredAvatars(){for(const result of await Promise.allSettled(avatars.values()))if(result.status==='fulfilled')result.value.dispose();avatars.clear();measurements.clear();}
