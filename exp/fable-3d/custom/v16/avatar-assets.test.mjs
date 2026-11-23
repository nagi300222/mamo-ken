import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const dir=new URL('./assets/',import.meta.url);
const manifest=JSON.parse(await readFile(new URL('manifest.json',dir),'utf8'));
const decode=b=>JSON.parse(b.toString('utf8',20,20+b.readUInt32LE(12)));
const hash=b=>createHash('sha256').update(b).digest('hex');
test('nine modular assets preserve source skins, morphs, all original animations and every triangle',async()=>{
 assert.equal(Object.keys(manifest.bases).length,9);
 for(const [id,entry] of Object.entries(manifest.bases)){
  const raw=await readFile(new URL(entry.file,dir)),original=await readFile(new URL(`../../chars/${id}/${id}.glb`,import.meta.url));
  assert.equal(hash(raw),entry.sha256);assert.equal(hash(original),entry.sourceSHA256);
  const glb=decode(raw),source=decode(original);assert.deepEqual(glb.skins,source.skins,id+' skin changed');
  assert.deepEqual(glb.animations,source.animations,id+' original animations changed');
  assert.equal(glb.nodes.length,source.nodes.length);assert.equal(glb.animations.length,37);
  const count=j=>j.meshes.flatMap(m=>m.primitives).reduce((n,p)=>n+j.accessors[p.indices].count,0);
  assert.equal(count(glb),count(source),id+' triangles lost or duplicated');
  const names=new Set(glb.meshes.flatMap(m=>m.primitives).map(p=>glb.materials[p.material].extras.avatarPart));
  for(const part of ['body','head','ears','hands','feet','tail','accessory'])assert.ok(names.has(part),id+' missing '+part);
  for(const p of glb.meshes.flatMap(m=>m.primitives)){
   assert.ok(p.attributes._AVATAR_REGION!==undefined);assert.ok(p.attributes._AVATAR_PART!==undefined);
   assert.equal(p.targets.length,source.meshes[0].primitives[0].targets.length);
   assert.ok(glb.accessors[p.attributes.POSITION].count<source.accessors[source.meshes[0].primitives[0].attributes.POSITION].count,'module did not compact');
  }
 }
});
