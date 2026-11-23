// Local Node CPU verification only: browser import maps use the same vendored Three.
import {fileURLToPath,pathToFileURL} from 'node:url';
const vendor=new URL('../../../preview/vendor/',import.meta.url);
export async function resolve(specifier,context,next){
 if(specifier==='three')return {url:new URL('three.module.min.js',vendor).href,shortCircuit:true};
 if(specifier.startsWith('three/addons/'))return {url:new URL('addons/'+specifier.slice(13),vendor).href,shortCircuit:true};
 return next(specifier,context);
}
