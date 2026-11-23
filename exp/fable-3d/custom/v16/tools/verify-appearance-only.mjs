// Actual Three.js CPU skin/morph verification. Images are stubbed; this tool
// makes no claim of WebGL, shader, floor composition or iPhone performance QA.
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
const nativeFetch=globalThis.fetch;
globalThis.self=globalThis;globalThis.createImageBitmap=async()=>({width:1024,height:1024,close(){}});
globalThis.ProgressEvent=class{constructor(type,props){this.type=type;Object.assign(this,props);}};
globalThis.fetch=async(url,options)=>{
 const path=typeof url==='string'||url instanceof URL?String(url):url.url;
 if(path.startsWith('file:')){try{return new Response(await readFile(fileURLToPath(path)),{headers:{'Content-Type':path.endsWith('.json')?'application/json':'application/octet-stream'}});}catch(error){return new Response(error.message,{status:404});}}
 return nativeFetch(url,options);
};
const [{createAvatar,measureContacts},{createDefaultAvatar}]=await Promise.all([import('../avatar-factory.js'),import('../avatar-schema.js')]);
for(const baseId of ['moguzo','godan','bullet']){
 const definition=createDefaultAvatar(baseId),legacy=await createAvatar({appearance:definition.appearance});
 try{assert.equal(legacy.baseId,baseId);assert.equal(legacy.combatStyleId,baseId);assert.equal(measureContacts(legacy).normalStyleId,baseId);}
 finally{legacy.dispose();}
 definition.combat.styleId='pisuke';const full=await createAvatar(definition);
 try{assert.equal(full.combatStyleId,'pisuke');assert.equal(measureContacts(full).normalStyleId,'pisuke');}
 finally{full.dispose();}
}
console.log('APPEARANCE-ONLY FACTORY CPU PASS: 3 real legacy body loads/measurements and 3 explicit alternate styles; no WebGL claim');
