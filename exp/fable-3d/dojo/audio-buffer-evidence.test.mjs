import test from 'node:test';
import assert from 'node:assert/strict';
import {analyzeAudioBuffer,monoWav} from './acceptance/audio-buffer-evidence.mjs';

test('audio evidence separates a filtered low-level tail from an arbitrary absolute last-sample threshold',()=>{
 const rate=48000,light=new Float32Array(rate/2),heavy=new Float32Array(rate/2);
 for(let i=0;i<rate*.06;i++)light[i]=.01*Math.sin(i*.1);
 heavy.set(light);
 for(let i=Math.floor(rate*.08);i<rate*.19;i++)heavy[i]=.000005*Math.sin(i*.1);
 const options={tailStart:.101,quietStart:.215};
 const l=analyzeAudioBuffer(light,rate,options),h=analyzeAudioBuffer(heavy,rate,options);
 assert.equal(l.duration,h.duration,'fixed 1e-5 threshold cannot measure a quiet filtered tail');
 assert.equal(l.tailEnergy,0);assert.ok(h.tailEnergy>1e-12&&h.tailRms>1e-7);
 assert.equal(h.quietPeak,0);assert.equal(h.finite,true);
 heavy[Math.floor(rate*.3)]=.02;
 assert.equal(analyzeAudioBuffer(heavy,rate,options).quietPeak,heavy[Math.floor(rate*.3)],'a leaked voice must be detected');
 heavy[0]=NaN;assert.equal(analyzeAudioBuffer(heavy,rate,options).finite,false);
});
test('rendered audio evidence writes valid bounded mono PCM samples',()=>{
 const wav=monoWav([-2,-.5,0,.5,2],48000);
 assert.equal(wav.toString('ascii',0,4),'RIFF');assert.equal(wav.readUInt32LE(4),wav.length-8);
 assert.equal(wav.toString('ascii',8,16),'WAVEfmt ');assert.equal(wav.readUInt32LE(24),48000);
 assert.equal(wav.readUInt16LE(22),1);assert.equal(wav.readUInt16LE(34),16);assert.equal(wav.readUInt32LE(40),10);
 assert.deepEqual(Array.from({length:5},(_,i)=>wav.readInt16LE(44+i*2)),[-32767,-16383,0,16384,32767]);
});
