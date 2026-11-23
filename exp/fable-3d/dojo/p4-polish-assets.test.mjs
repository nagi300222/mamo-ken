import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../ui-art/v18/',import.meta.url);
const manifest=JSON.parse(await readFile(new URL('manifest.json',root),'utf8'));
test('v18 runtime art and audio match the independent Claude delivery',async()=>{
 assert.equal(manifest.version,'v18-p4-ui-polish-r1');
 const shipped=manifest.assets.filter(row=>/\.webp$/.test(row.file)||/^svg\//.test(row.file)||/\.wav$/.test(row.file));
 assert.equal(shipped.filter(row=>row.file.endsWith('.webp')).length,6);
 assert.equal(shipped.filter(row=>row.file.endsWith('.wav')).length,4);
 for(const row of shipped){
  assert.ok(!row.file.includes('..'),'asset path escapes its version');
  const data=await readFile(new URL(row.file,root));
  assert.equal(data.length,row.bytes,row.file+' bytes');
  assert.equal(createHash('sha256').update(data).digest('hex'),row.sha256,row.file+' delivery changed');
  if(row.file.endsWith('.svg'))assert.ok(!/<script|<foreignObject|(?:href|src)\s*=\s*["']https?:/i.test(data.toString()),row.file+' contains nonlocal active content');
 }
 assert.ok(shipped.reduce((sum,row)=>sum+row.bytes,0)<200000,'runtime UI delivery should remain below 200KB');
});
test('authored UI samples are finite mono PCM with a quiet endpoint and distinct cues',async()=>{
 const audio=JSON.parse(await readFile(new URL('audio/audio.json',root),'utf8'));
 const hashes=new Set();
 for(const [kind,row] of Object.entries(audio.sounds)){
  const data=await readFile(new URL(row.file,root));hashes.add(createHash('sha256').update(data).digest('hex'));
  assert.equal(data.toString('ascii',0,4),'RIFF',kind);assert.equal(data.toString('ascii',8,12),'WAVE');
  assert.equal(data.readUInt16LE(20),1);assert.equal(data.readUInt16LE(22),1);assert.equal(data.readUInt16LE(34),16);
  const duration=(data.length-44)/2/data.readUInt32LE(24);assert.ok(duration>=.06&&duration<=.35,kind+' duration');
  let peak=0;for(let i=44;i<data.length;i+=2)peak=Math.max(peak,Math.abs(data.readInt16LE(i)));
  assert.ok(peak>0&&peak<32767,kind+' must be audible and not clipped');
  assert.ok(Math.abs(data.readInt16LE(data.length-2))<8,kind+' endpoint clicks');
 }
 assert.equal(hashes.size,4,'select/confirm/back/save must be distinguishable source samples');
});
