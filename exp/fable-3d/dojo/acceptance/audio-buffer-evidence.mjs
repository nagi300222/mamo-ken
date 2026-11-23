// Acceptance evidence only; production audio synthesis is unchanged.
export function analyzeAudioBuffer(samples,sampleRate,{tailStart=0,quietStart=Infinity}={}){
 let sum=0,peak=0,last=0,tailSum=0,tailCount=0,quietPeak=0,finite=true;
 for(let i=0;i<samples.length;i++){
  const value=samples[i],time=i/sampleRate;finite&&=Number.isFinite(value);
  sum+=value**2;peak=Math.max(peak,Math.abs(value));
  if(Math.abs(value)>1e-5)last=i;
  if(time>=tailStart&&time<quietStart){tailSum+=value**2;tailCount++;}
  if(time>=quietStart)quietPeak=Math.max(quietPeak,Math.abs(value));
 }
 return {finite,rms:Math.sqrt(sum/samples.length),peak,duration:last/sampleRate,
  tailEnergy:tailSum/sampleRate,tailRms:Math.sqrt(tailSum/Math.max(1,tailCount)),quietPeak};
}
export function monoWav(samples,sampleRate){
 const output=Buffer.alloc(44+samples.length*2);
 output.write('RIFF');output.writeUInt32LE(output.length-8,4);output.write('WAVEfmt ',8);
 output.writeUInt32LE(16,16);output.writeUInt16LE(1,20);output.writeUInt16LE(1,22);
 output.writeUInt32LE(sampleRate,24);output.writeUInt32LE(sampleRate*2,28);
 output.writeUInt16LE(2,32);output.writeUInt16LE(16,34);output.write('data',36);output.writeUInt32LE(samples.length*2,40);
 samples.forEach((value,i)=>output.writeInt16LE(Math.round(Math.max(-1,Math.min(1,value))*32767),44+i*2));return output;
}
