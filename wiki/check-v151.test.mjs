// v15.1 wiki metadata QA only. Does not read/modify game runtime.
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import test from 'node:test';
const read=(p)=>readFileSync(new URL(p,import.meta.url),'utf8');
const doc=JSON.parse(read('./v151-data.json'));
const page=read('./v151-development.html');
const index=read('./index.html');
const roster=['moguzo','pisuke','godan','hakuma','chirka','takimaru','yomikage','bullet','dark_moguzo'];
const slots=['stand_weak','stand_heavy','crouch_weak','crouch_heavy','air_weak','air_heavy'];

test('Wiki v15.1 is a fixed snapshot of reviewed PR199, not older 2D or v15',()=>{
 assert.equal(doc.schema,'mamo-ken-v151-wiki-v1');
 assert.equal(doc.snapshot.commit,'78dd0c685d78af617896c01bd95a277928e01368');
 assert.deepEqual(doc.order,roster);
 assert.equal(doc.definitions.fps,60);
 assert.equal(doc.definitions.hurtRadius,.16);
 assert.match(index,/href="v151-development.html"/);
 assert.match(page,/v151-data\.json/);
 assert.match(page,/noindex,nofollow/);
});

test('54 normal moves have complete, non-invented frame and reach data',()=>{
 let count=0;
 for(const id of roster){
  const actor=doc.characters[id];assert.ok(actor?.name,id);
  assert.deepEqual(actor.normals.map(n=>n.id),slots);
  for(const m of actor.normals){
   assert.ok(Number.isInteger(m.startup)&&m.startup>0,id+'/'+m.id+'/startup');
   assert.ok(Number.isInteger(m.active)&&m.active>0,id+'/'+m.id+'/active');
   assert.ok(Number.isInteger(m.recovery)&&m.recovery>0,id+'/'+m.id+'/recovery');
   assert.equal(m.total,m.startup+m.active+m.recovery);
   assert.ok(m.reach>.20&&m.reach<.75,id+'/'+m.id+'/reach');
   assert.ok(m.damage>0);
   assert.ok(m.strikeHeight>=0&&m.strikeHeight<1.2);
   assert.ok(['mid','low','air','overhead'].includes(m.level));
   assert.ok(typeof m.hitAdv==='number',id+'/'+m.id+'/hitAdv');
   assert.ok(typeof m.blockAdv==='number'||m.blockAdv==='whiff');
   assert.ok(m.attackPart&&m.description);
   assert.ok(m.activeReach.length>=3);
   assert.ok(m.cancelWindow&&m.cancelOnHit&&m.cancelOnBlock);
   count++;
  }
 }
 assert.equal(count,54);
});

test('nine characters have exactly 27 specials and 9 supers, with raw source names',()=>{
 let specials=0,ultimates=0;
 for(const id of roster){
  const actor=doc.characters[id];
  assert.equal(actor.specials.length,3);
  assert.deepEqual(actor.specials.map(m=>m.id),['s1','s2','s3']);
  for(const m of [...actor.specials,actor.ultimate]){
   assert.ok(m.name&&m.kind);
   assert.equal(m.total,m.startup+m.active+m.recovery);
   assert.ok(Number.isInteger(m.damage)&&m.damage>0);
   assert.ok(Number.isFinite(m.reach));
  }
  specials+=actor.specials.length;ultimates++;
 }
 assert.equal(specials,27);assert.equal(ultimates,9);
});

test('nine video references for both new normal poses and existing specials / ultimates',()=>{
 for(const id of roster){
  const clips=doc.characters[id].videos;
  for(const [key,path]of Object.entries({normals:'/normal-art/v15_1/evidence/videos/',specials:'/cinematic/v14/evidence/specials/',ultimate:'/cinematic/v14/evidence/movies/'})){
   assert.ok(clips[key].page.includes(path),id+'/'+key);
   assert.ok(clips[key].src.endsWith('.mp4'));
   assert.ok(existsSync(new URL('./'+clips[key].src,import.meta.url)),id+'/'+key+' local video missing');
   assert.ok(clips[key].page.includes(doc.snapshot.commit));
  }
 }
 assert.match(page,/<video playsinline controls/);
 assert.match(page,/13時刻/);
});

test('edit request textarea, source links and no automatic game code changes',()=>{
 assert.match(page,/変更依頼メモ/);
 assert.match(page,/navigator\.clipboard\.writeText/);
 assert.match(page,/cpuCsv/);
 assert.ok(!page.includes('automatically update battle.js'));
 assert.ok(doc.characters.pisuke.normals.find(x=>x.id==='stand_heavy').reach <
   doc.characters.pisuke.normals.find(x=>x.id==='stand_weak').reach);
});
