// Evidence only: one live Dojo page, genuine Playwright input, actual WebAudio
// destination taps. No microphone, forced AudioContext resume, synthetic hit,
// application-state mutation, or replacement sound is used.
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile,stat} from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
const {chromium}=createRequire(import.meta.url)('playwright-core');
const output=path.join(process.env.MAMOKEN_EVIDENCE??'/tmp/mamoken-p4','ui-audio');
const siteRoot=path.resolve(fileURLToPath(new URL('../../_pages/',import.meta.url)));
await mkdir(path.join(output,'video'),{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.glb':'model/gltf-binary','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.wav':'audio/wav'};
let server=null,root=process.env.MAMOKEN_UI_URL;
if(!root){server=http.createServer(async(req,res)=>{try{
 let file=path.resolve(siteRoot,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
 if(file!==siteRoot&&!file.startsWith(siteRoot+path.sep)){res.writeHead(403).end();return;}
 if((await stat(file)).isDirectory())file=path.join(file,'index.html');
 res.writeHead(200,{'content-type':mime[path.extname(file)]??'application/octet-stream','cache-control':'no-store'});res.end(await readFile(file));
 }catch{res.writeHead(404).end('Not found');}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));root=`http://127.0.0.1:${server.address().port}/`;}

function installAudioCapture(){
 const connect=AudioNode.prototype.connect,disconnect=AudioNode.prototype.disconnect;
 const contexts=[],markers=[],captureStart=performance.now();let nextId=1;
 const contextMap=new WeakMap(),nativeConstructors=new Map();
 function register(context){
  if(contextMap.has(context))return contextMap.get(context);
  const row={context,id:nextId++,createdPerformanceMs:performance.now(),createdState:context.state,
   states:[{performanceMs:performance.now(),state:context.state}],sources:[],tapped:new WeakSet(),chunks:[],mimeType:null,
   recorder:null,analyser:null,destination:null,startPerformanceMs:null,firstDataPerformanceMs:null,stopPromise:null};
  contexts.push(row);contextMap.set(context,row);
  context.addEventListener('statechange',()=>row.states.push({performanceMs:performance.now(),state:context.state}));
  return row;
 }
 for(const name of ['AudioContext','webkitAudioContext']){
  const Native=window[name];if(!Native)continue;
  let ProxyConstructor=nativeConstructors.get(Native);
  if(!ProxyConstructor){ProxyConstructor=new Proxy(Native,{construct(Target,args){const context=Reflect.construct(Target,args);register(context);return context;}});nativeConstructors.set(Native,ProxyConstructor);}
  window[name]=ProxyConstructor;
 }
 function stopRecorder(row){
  if(row.stopPromise)return row.stopPromise;
  row.stopPromise=new Promise(resolve=>{
   if(!row.recorder||row.recorder.state==='inactive'){resolve();return;}
   row.recorder.addEventListener('stop',resolve,{once:true});row.recorder.stop();
  });return row.stopPromise;
 }
 const close=AudioContext.prototype.close;
 AudioContext.prototype.close=function(...args){const row=contextMap.get(this);if(row)void stopRecorder(row);return close.apply(this,args);};
 function tap(node,row){
  if(row.tapped.has(node))return;
  if(!row.recorder){
   row.destination=row.context.createMediaStreamDestination();row.analyser=row.context.createAnalyser();row.analyser.fftSize=2048;
   connect.call(row.analyser,row.destination);
   row.mimeType=['audio/webm;codecs=opus','audio/webm'].find(type=>MediaRecorder.isTypeSupported(type));
   if(!row.mimeType)throw Error('No supported browser audio recorder');
   row.recorder=new MediaRecorder(row.destination.stream,{mimeType:row.mimeType,audioBitsPerSecond:96000});
   row.recorder.addEventListener('dataavailable',event=>{if(event.data.size){row.firstDataPerformanceMs??=performance.now();row.chunks.push(event.data);}});
   row.startPerformanceMs=performance.now();row.startContextSeconds=row.context.currentTime;row.startState=row.context.state;row.recorder.start(200);
  }
  connect.call(node,row.analyser);row.tapped.add(node);
 }
 AudioNode.prototype.connect=function(...args){
  const result=connect.apply(this,args);
  if(args[0]===this.context.destination&&!(this.context instanceof OfflineAudioContext))tap(this,register(this.context));
  return result;
 };
 AudioNode.prototype.disconnect=function(...args){
  const result=disconnect.apply(this,args),row=contextMap.get(this.context);
  if(row?.tapped.has(this)&&(!args.length||args[0]===this.context.destination)){
   if(args.length)try{disconnect.call(this,row.analyser);}catch{}
   row.tapped.delete(this);
  }
  return result;
 };
 for(const [Type,kind] of [[AudioBufferSourceNode,'authored-buffer'],[OscillatorNode,'oscillator']]){
  const start=Type.prototype.start;Type.prototype.start=function(...args){
   const row=register(this.context);row.sources.push({kind,performanceMs:performance.now(),contextSeconds:this.context.currentTime,duration:this.buffer?.duration??null});
   return start.apply(this,args);
  };
 }
 let finished=false;const observations=[];
 function sample(){return {performanceMs:performance.now(),game:window.mamoken3d?{frame:mamoken3d.battle?.frame,presentation:mamoken3d.presentation?.state,fighters:mamoken3d.battle?.fighters.map(f=>({id:f.id,action:f.action?.id??null,frame:f.frame,stun:f.stun,stop:f.stop,x:f.x,y:f.y}))}:null,contexts:contexts.map(row=>{
   let rms=0,peak=0;if(row.analyser&&row.context.state==='running'){
    const data=new Float32Array(row.analyser.fftSize);row.analyser.getFloatTimeDomainData(data);let sum=0;
    for(const value of data){sum+=value*value;peak=Math.max(peak,Math.abs(value));}rms=Math.sqrt(sum/data.length);
   }
   return {id:row.id,state:row.context.state,rms,peak,recording:row.recorder?.state??null};
  })};}
 // Sampling lives in the page before any gesture. A round-trip after tap can
 // miss a 70ms sample; this records that real signal without extending it.
 const sampler=setInterval(()=>{if(!finished)observations.push(sample());},16);
 window.__p4AudioCapture={
  captureStartPerformanceMs:captureStart,timeOrigin:performance.timeOrigin,
  mark(name){const row={name,performanceMs:performance.now(),epochMs:performance.timeOrigin+performance.now()};markers.push(row);return row;},
  sample,
  between(start,end){return {frames:observations.filter(frame=>frame.performanceMs>=start&&frame.performanceMs<=end),sources:contexts.flatMap(row=>row.sources.filter(source=>source.performanceMs>=start&&source.performanceMs<=end).map(source=>({contextId:row.id,...source})))};},
  async finish(){
   finished=true;clearInterval(sampler);
   await Promise.all(contexts.map(stopRecorder));
   const result=[];
   for(const row of contexts){
    const blob=new Blob(row.chunks,{type:row.mimeType??'audio/webm'}),bytes=new Uint8Array(await blob.arrayBuffer());let binary='';
    for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
    result.push({id:row.id,createdPerformanceMs:row.createdPerformanceMs,createdState:row.createdState,
     startPerformanceMs:row.startPerformanceMs,startContextSeconds:row.startContextSeconds,startState:row.startState,
     firstDataPerformanceMs:row.firstDataPerformanceMs,states:row.states,sources:row.sources,mimeType:row.mimeType,
     byteLength:bytes.length,base64:btoa(binary)});
    if(row.analyser)try{disconnect.call(row.analyser);}catch{}
    for(const track of row.destination?.stream.getTracks()??[])track.stop();
   }
   return {timeOrigin:performance.timeOrigin,captureStartPerformanceMs:captureStart,markers,contexts:result};
  }
 };
}
let browser,context,page,videoHandle,closed=false;
const segments=[],errors=[],wavResponses=[],samples=[];
const videoPageEpochBounds={};
let receipt=null,failed=null;
try{
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH??'/usr/bin/google-chrome',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 context=await browser.newContext({viewport:{width:852,height:393},isMobile:true,hasTouch:true,deviceScaleFactor:1,
  recordVideo:{dir:path.join(output,'video'),size:{width:852,height:393}}});
 await context.addInitScript(installAudioCapture);
 videoPageEpochBounds.before=Date.now();page=await context.newPage();videoPageEpochBounds.after=Date.now();videoHandle=page.video();
 page.on('pageerror',error=>errors.push(error.message));
 page.on('response',response=>{if(/\.wav(?:\?|$)/.test(response.url()))wavResponses.push({url:response.url(),status:response.status()});
  if(response.status()>=400&&!response.url().endsWith('favicon.ico'))errors.push(`${response.status()} ${response.url()}`);});
 await page.goto(new URL('dojo/?mode=practice',root).href,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.mamoken3d&&document.querySelectorAll('.fighter-card').length===9,undefined,{timeout:60000});
 async function observe(name,milliseconds=650,action){
  const start=await page.evaluate(name=>__p4AudioCapture.mark(name+':start'),name);
  if(action)await action();await page.waitForTimeout(milliseconds);
  const end=await page.evaluate(name=>__p4AudioCapture.mark(name+':end'),name);
  const {frames,sources}=await page.evaluate(({start,end})=>__p4AudioCapture.between(start,end),{start:start.performanceMs,end:end.performanceMs});
  assert.ok(frames.length>0,'no page-side audio observations in '+name);
  const peakRms=Math.max(0,...frames.flatMap(frame=>frame.contexts.map(context=>context.rms)));
  const peak=Math.max(0,...frames.flatMap(frame=>frame.contexts.map(context=>context.peak)));
  const row={name,start,end,peakRms,peak,sources,frames};segments.push(row);samples.push(...frames);return row;
 }
 async function waitNeutral(){
  await page.waitForFunction(()=>{const game=window.mamoken3d,f=game?.battle?.fighters[0];return game?.presentation.inputEnabled&&f&&!f.action&&!f.stun&&!f.stop&&f.y<.01;},undefined,{timeout:30000});
 }
 const pre=await observe('before-first-gesture',500);
 assert.equal(pre.peakRms,0,'audio was present before user interaction');
 assert.equal(pre.frames.at(-1).contexts.length,0,'an AudioContext was created before the first gesture');
 const select=await observe('roster-selection',650,()=>page.locator('.fighter-card').nth(1).tap());
 assert.ok(select.peakRms>1e-5,'roster selection produced no actual destination audio');
 await page.locator('.av-settings-toggle').tap();await page.locator('#sound-toggle').tap();
 await page.waitForTimeout(350);const quietMenu=await observe('muted-roster-selection',650,()=>page.locator('.fighter-card').nth(2).tap());
 assert.ok(quietMenu.peakRms<1e-4,'sound OFF leaked audio during roster selection');
 await page.locator('.av-settings-toggle').tap();await observe('sound-restored',650,()=>page.locator('#sound-toggle').tap());
 // Dismiss the popover through an actual click on the selected roster entry.
 await page.locator('.fighter-card').nth(2).tap();
 assert.equal(await page.locator('#match-mode').inputValue(),'practice');
 const confirmation=await observe('practice-confirmation',650,()=>page.locator('#start').tap());
 assert.ok(confirmation.peakRms>1e-5,'practice confirmation produced no actual destination audio');
 assert.ok(confirmation.sources.some(source=>source.kind==='authored-buffer'&&Math.abs(source.duration-.2)<1/22050),'the authored 0.2s confirmation WAV did not actually start');
 await page.waitForFunction(()=>mamoken3d.practice.enabled&&mamoken3d.presentation.state==='fight'&&mamoken3d.presentation.inputEnabled&&mamoken3d.battle?.frame>2,undefined,{timeout:90000});
 await page.keyboard.down('ArrowRight');await page.waitForTimeout(1100);await page.keyboard.up('ArrowRight');
 await waitNeutral();await observe('practice-weak',650,()=>page.locator('[data-control="weak"]').tap());
 // Slow software rendering is not a combat clock. Wait for the real prior
 // action/recovery to end rather than assuming 650ms of wall time is neutral.
 await waitNeutral();const attack=await observe('practice-strong',900,()=>page.locator('[data-control="strong"]').tap());
 assert.ok(attack.frames.some(frame=>frame.game?.fighters?.[0]?.action==='stand_heavy'),'the trusted strong input was never accepted by the real Battle');
 assert.ok(attack.peakRms>1e-5,'practice input produced no actual destination audio');
 await observe('practice-pause',650,()=>page.locator('#pause').tap());assert.equal(await page.locator('#pause').textContent(),'再開');
 await page.locator('.av-settings-toggle').tap();await page.locator('#sound-toggle').tap();
 await page.waitForTimeout(350);await page.locator('#pause').tap();assert.equal(await page.locator('#pause').textContent(),'一時停止');
 await waitNeutral();const quietBattle=await observe('muted-practice-resume-and-attack',900,()=>page.locator('[data-control="strong"]').tap());
 assert.ok(quietBattle.frames.some(frame=>frame.game?.fighters?.[0]?.action==='stand_heavy'),'muted strong input was not accepted; silence alone cannot prove the mute');
 assert.ok(quietBattle.peakRms<1e-4,'sound OFF leaked audio after pause/resume');
 await page.locator('.av-settings-toggle').tap();await page.locator('#sound-toggle').tap();
 const back=await observe('back-to-roster',650,()=>page.locator('#select-back').tap());
 assert.ok(back.peakRms>1e-5,'back action produced no actual destination audio');
 await page.screenshot({path:path.join(output,'end-state.png')});
 assert.ok(wavResponses.some(response=>/\/ui-art\/v18\//.test(response.url)&&response.status===200),'no real authored v18 WAV loaded');
 assert.ok(wavResponses.every(response=>response.status===200),'a requested authored WAV was missing');
 assert.deepEqual(errors,[]);
 const actualSources=await page.evaluate(()=>__p4AudioCapture.sample());
 assert.ok(actualSources.contexts.length>=2,'expected distinct live UI and combat AudioContexts');
}catch(error){failed={message:error.message,stack:error.stack};if(page)await page.screenshot({path:path.join(output,'failure.png')}).catch(()=>{});}
finally{
 if(page)receipt=await page.evaluate(()=>window.__p4AudioCapture?.finish()).catch(error=>({captureError:error.message}));
 if(context){await context.close();closed=true;}if(browser)await browser.close();if(server)await new Promise(resolve=>server.close(resolve));
}
let video=null;
if(videoHandle&&closed){const file=await videoHandle.path();video={file:path.relative(output,file),bytes:(await stat(file)).size,requestedSize:{width:852,height:393},pageCreationEpochBounds:videoPageEpochBounds};}
if(receipt?.contexts)for(const row of receipt.contexts){const file=`audio-context-${row.id}.webm`;if(row.byteLength)await writeFile(path.join(output,file),Buffer.from(row.base64,'base64'));row.file=row.byteLength?file:null;delete row.base64;}
if(!failed&&!receipt?.contexts?.some(context=>context.sources.some(source=>source.kind==='authored-buffer')))failed={message:'no real authored AudioBufferSource was started'};
const sha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const report={schemaVersion:1,sha,url:new URL('dojo/?mode=practice',root).href,environment:'Chromium / SwiftShader; actual WebAudio capture, not a physical iPhone',
 physicalIphoneTested:false,humanAudioQualityJudged:false,saveSoundLivePathTested:false,
 captureMethod:'Each real AudioContext destination is additionally tapped into a same-context MediaStreamDestination; original speakers and application lifecycle are unchanged. Context construction/resume is not forced.',
 synchronization:'Audio uses page performance/timeOrigin timestamps. Playwright raw video start is bounded by page creation; the optional mux is approximate. Raw separate streams remain authoritative, especially across suspended contexts.',
 quietRmsLimit:1e-4,video,receipt,segments,wavResponses,errors,failure:failed};
await writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');
console.log('P4 actual UI audio evidence:',path.join(output,'report.json'));
if(failed)throw Error(failed.message);
console.log('UI AUDIO PASS: gesture gating, authored roster/confirmation/back cues, shared mute, actual practice input and muted pause/resume');
