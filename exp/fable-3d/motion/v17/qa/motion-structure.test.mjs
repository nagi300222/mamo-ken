import {test} from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {createHash} from 'node:crypto';
const art=new URL('../',import.meta.url),repo=new URL('../../../../../',import.meta.url);
const metadata=JSON.parse(await readFile(new URL('normals_v17.json',art))),contacts=JSON.parse(await readFile(new URL('normal_contacts_v17.json',art)));
const ids=['moguzo','pisuke','godan','hakuma','chirka','takimaru','yomikage','bullet','dark_moguzo'],slots=['stand_weak','stand_heavy','crouch_weak','crouch_heavy','air_weak','air_heavy'];
const glb=buffer=>{assert.equal(buffer.toString('utf8',0,4),'glTF');assert.equal(buffer.readUInt32LE(4),2);assert.equal(buffer.readUInt32LE(8),buffer.length);const size=buffer.readUInt32LE(12);return {doc:JSON.parse(buffer.toString('utf8',20,20+size)),bin:buffer.subarray(28+size)};};
const dimensions={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16};
function floats(gltf,index){const a=gltf.doc.accessors[index],view=gltf.doc.bufferViews[a.bufferView],size=dimensions[a.type],out=[];assert.equal(a.componentType,5126);const start=(a.byteOffset??0)+(view.byteOffset??0),stride=view.byteStride??size*4;for(let i=0;i<a.count;i++)for(let k=0;k<size;k++)out.push(gltf.bin.readFloatLE(start+i*stride+k*4));assert.ok(out.every(Number.isFinite));return {values:out,size,count:a.count};}
test('54 versioned clips are finite, native-rig animation-only and use actual authored 60Hz clocks',async()=>{
 let count=0;for(const id of ids){const original=glb(await readFile(new URL(`exp/fable-3d/chars/${id}/${id}.glb`,repo))),gltf=glb(await readFile(new URL(`${id}_normals_v17.glb`,art))),names=new Set(original.doc.nodes.map(n=>n.name));assert.equal(gltf.doc.animations.length,6,id);assert.equal(gltf.doc.images?.length??0,0,id+' embedded texture');
  const renderVertices=(gltf.doc.meshes??[]).flatMap(m=>m.primitives).reduce((n,p)=>n+gltf.doc.accessors[p.attributes.POSITION].count,0);assert.ok(renderVertices<=3,id+' animation proxy only');
  assert.deepEqual(gltf.doc.animations.map(a=>a.name).sort(),slots.map(s=>'v17_'+s).sort());
  for(const slot of slots){const m=metadata.characters[id][slot],clip=gltf.doc.animations.find(a=>a.name==='v17_'+slot),contact=contacts[id][slot];assert.equal(m.character,id);assert.equal(m.game_action,slot);assert.equal(m.fps,60);assert.ok(m.contact_frame>0&&m.contact_frame+m.contact_hold_frames<m.frames);assert.equal(contact.clip,m.clip);assert.equal(contact.status,'ok');
   assert.ok(Math.abs(m.contact-m.contact_frame/m.frames)<.0002);assert.ok(Math.abs(m.contact_end-(m.contact_frame+m.contact_hold_frames)/m.frames)<.0002);
   let duration=0,rotationCount=0;for(const channel of clip.channels){const node=gltf.doc.nodes[channel.target.node];assert.ok(names.has(node.name),id+'/'+slot+' unbound target '+node.name);const sampler=clip.samplers[channel.sampler],times=floats(gltf,sampler.input).values,values=floats(gltf,sampler.output);assert.ok(times.every((t,i)=>i===0||t>times[i-1]),'nonmonotonic clock');duration=Math.max(duration,times.at(-1));
    if(channel.target.path==='rotation'){rotationCount++;for(let i=0;i<values.values.length;i+=4)assert.ok(Math.abs(Math.hypot(...values.values.slice(i,i+4))-1)<.00002,'non-unit joint quaternion');}
   }
   assert.ok(rotationCount>=20,id+'/'+slot+' lacks whole-body joint tracks');assert.ok(Math.abs(duration-m.frames/60)<.00001,id+'/'+slot+' GLB length differs from authored frame clock');count++;
  }
 }assert.equal(count,54);
});
test('all 77 original models, cinematic, victory and custom assets retain baseline Git blob identities',async()=>{
 const baseline=JSON.parse(await readFile(new URL('./protected-assets-baseline.json',import.meta.url)));assert.equal(baseline.baseline,'8ab8972295d059426b858d9b8edabfda6068a7a3');const entries=Object.entries(baseline.preserveOriginalAssets);assert.equal(entries.length,77);
 for(const[path,sha]of entries){const buffer=await readFile(new URL(path,repo));assert.equal(createHash('sha1').update('blob '+buffer.length+'\0').update(buffer).digest('hex'),sha,path+' changed');}
});
