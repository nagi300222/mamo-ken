import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {animationBundle} from './animation-bundle.mjs';
import {IDS} from './balance.js';
const parse=b=>({doc:JSON.parse(b.toString('utf8',20,20+b.readUInt32LE(12))),bin:b.subarray(28+b.readUInt32LE(12))});
function data({doc,bin},index){const a=doc.accessors[index],v=doc.bufferViews[a.bufferView];return bin.subarray(v.byteOffset??0,(v.byteOffset??0)+v.byteLength);}
test('animation-only bundles retain every sample and morph binding without render geometry or images',async()=>{
  for(const id of IDS){
    const source=await readFile(new URL('../cinematic/v14/'+id+'/'+id+'_v14.glb',import.meta.url));
    const a=parse(source),names=new Set(a.doc.animations.filter(c=>c.name.startsWith('cin')||c.name.endsWith('_v14')).map(c=>c.name));
    const packed=animationBundle(source,names),b=parse(packed);
    assert.ok(packed.length<source.length);
    for(const key of ['images','textures','skins'])assert.equal(b.doc[key],undefined);
    for(const mesh of b.doc.meshes)assert.equal(b.doc.accessors[mesh.primitives[0].attributes.POSITION].count,3);
    for(const node of b.doc.nodes.filter(n=>n.mesh!==undefined)){const old=a.doc.nodes.find(n=>n.name===node.name);assert.equal(b.doc.meshes[node.mesh].primitives.length,a.doc.meshes[old.mesh].primitives.length);}
    for(const animation of b.doc.animations){
      const old=a.doc.animations.find(c=>c.name===animation.name);
      assert.deepEqual(animation.channels,old.channels);
      for(const [i,s]of animation.samplers.entries()){
        for(const key of ['input','output']){
          assert.deepEqual(data(b,s[key]),data(a,old.samplers[i][key]),id+'/'+animation.name+'/'+key);
          assert.equal(b.doc.accessors[s[key]].count,a.doc.accessors[old.samplers[i][key]].count);
        }
      }
    }
  }
});
