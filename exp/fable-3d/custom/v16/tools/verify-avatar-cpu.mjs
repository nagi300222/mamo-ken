import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
// Node skin sampling does not decode/upload images. Browser CI separately proves
// actual texture and shader rendering; these stubs are never included in Pages.
const nativeFetch=globalThis.fetch;
globalThis.self=globalThis;
globalThis.createImageBitmap=async()=>({width:1024,height:1024,close(){}});
globalThis.ProgressEvent=class{constructor(type,props){this.type=type;Object.assign(this,props);}};
globalThis.fetch=async(url,options)=>{
 const path=typeof url==='string'||url instanceof URL?String(url):url.url;
 if(path.startsWith('file:')){try{return new Response(await readFile(fileURLToPath(path)),{headers:{'Content-Type':path.endsWith('.json')?'application/json':'application/octet-stream'}});}catch{return new Response('missing',{status:404});}}
 return nativeFetch(url,options);
};
const {createAvatar,measureContacts,measureProjectileSocket,AVATAR_PARTS}=await import('../avatar-factory.js');
const {NORMAL_CONTACTS}=await import('../../../dojo/normal-contacts-v151.js');
const {buildNormalPack}=await import('../../../dojo/normal-clip-builder-v15.mjs');
for(const id of ['moguzo','godan','bullet','pisuke','hakuma','chirka','takimaru','yomikage','dark_moguzo']){
 const target=new URL(`../../../normal/v15/${id}_normals.glb`,import.meta.url);
 await mkdir(new URL('.',target),{recursive:true});const original=await readFile(new URL(`../../../chars/${id}/${id}.glb`,import.meta.url));
 await writeFile(target,buildNormalPack(original,id).bytes);
}
const results=[];
for(const id of ['moguzo','godan','bullet','pisuke','hakuma','chirka','takimaru','yomikage','dark_moguzo']){
 const def={appearance:{baseId:id,parts:{},palette:{},pattern:'solid'}};
 const a=await createAvatar(def),t=performance.now(),m=measureContacts(a);
 assert.equal(a.animations.length,43);assert.ok(a.meshes.length>=7);assert.ok(a.bones.size>=35);
 assert.equal(m.source,'runtime-skinned-mesh');
 const shot=measureProjectileSocket(a,a.animations.find(c=>c.name==='cmd_236'),.25);assert.ok(Number.isFinite(shot.forward)&&shot.height>.05);
 const errors=[];
 for(const [slot,row] of Object.entries(m.normals)){
  const reference=NORMAL_CONTACTS[id][slot];
  assert.ok(row.activeReach.every(p=>Number.isFinite(p.reach)&&Number.isFinite(p.height)));
  errors.push({slot,reach:row.reach,reference:reference.reach,error:Math.abs(row.reach-reference.reach)});
 }
 // Original art table rounds to mm and samples every second vertex; this checks
 // all module vertices, so allow the established 1.5cm surface tolerance.
 assert.ok(errors.every(r=>r.error<.015),id+' contact mismatch: '+JSON.stringify(errors));
 assert.ok(m.hurtBounds.stand.top>m.hurtBounds.crouch.top);assert.ok(m.projectileSocket.height>.1);
 results.push({id,measurementMs:performance.now()-t,errors,hurtBounds:m.hurtBounds});
 const modified=await createAvatar({appearance:{...def.appearance,parts:{head:id==='godan'?'pisuke':'godan',ears:'hakuma',hands:id==='godan'?'pisuke':'godan',feet:'pisuke',accessory:'none'},palette:{fur:'#265d9b',belly:'#eab937'},pattern:'spots'}});
 const changed=measureContacts(modified);
 assert.ok(modified.grafts.includes('head'));assert.ok(modified.meshes.filter(x=>x.userData.avatarPart==='accessory').every(x=>!x.visible));
 assert.ok(Object.keys(changed.normals).length===6);assert.ok(Object.values(changed.normals).every(x=>x.reach>.05&&x.height>=-.01));
 assert.ok(changed.normals.stand_weak.reach!==m.normals.stand_weak.reach,'hand graft did not change actual surface');
 a.dispose();modified.dispose();
}
await assert.rejects(createAvatar({appearance:{baseId:'moguzo',parts:{tail:'bullet'}}}),/尾骨/);
const report={passed:true,note:'Actual Three CPU skin sampling, image decoding stubbed; GPU rendering not tested',results};
await mkdir(new URL('../evidence/',import.meta.url),{recursive:true});await writeFile(new URL('../evidence/cpu-contact-report.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
