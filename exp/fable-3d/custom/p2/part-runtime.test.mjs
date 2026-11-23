import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {validateMeshPartManifest,meshPartOptions,resolveMeshParts} from './part-contract.js';
const empty={schemaVersion:1,version:'p2-exchange-1',modules:[]};
test('unproduced mesh choices never claim availability or silently replace saved donor selections',()=>{
 assert.equal(validateMeshPartManifest(empty),empty);
 assert.deepEqual(meshPartOptions(empty,'moguzo','head').map(o=>o.available),[true,false,false]);
 assert.match(meshPartOptions(empty,'moguzo','tail').find(o=>o.id==='bullet').reason,/6骨/);
 assert.throws(()=>resolveMeshParts(empty,'moguzo',{head:'godan'},{}),/置換しません/);
 assert.throws(()=>resolveMeshParts(empty,'moguzo',{head:'moguzo'},{head:'godan'}),/同時指定/);
 assert.deepEqual(resolveMeshParts(empty,'moguzo',{head:'moguzo'},{head:'moguzo'}),[]);
});
test('real GLB CPU modules preserve shared skin, morph seams and measured surfaces on all 3 representative hosts',()=>{
 const result=spawnSync(process.execPath,['--loader',fileURLToPath(new URL('../v16/tools/three-loader.mjs',import.meta.url)),fileURLToPath(new URL('./tools/verify-part-runtime.mjs',import.meta.url))],{encoding:'utf8',timeout:120000});
 assert.equal(result.status,0,result.stderr+'\n'+result.stdout);assert.match(result.stdout,/P2 PART RUNTIME CPU PASS/);
});
