// Independent exact-time measurement on the real original-rig WebGL actors.
// Only this browser page routes an explicit candidate into the provider. The
// repository's approval module remains null; this is not adoption or P2 work.
import assert from 'node:assert/strict';import {mkdir,readFile,writeFile} from 'node:fs/promises';import {createRequire} from 'node:module';import {createHash} from 'node:crypto';import {resolve} from 'node:path';
import {createP3ContactDelivery} from '../../../dojo/p3-contact-adapter.js';
import {compareExactReference} from './exact-reference-policy.js';
const {chromium}=createRequire(import.meta.url)('playwright-core');
const metadataBytes=await readFile(new URL('../normals_v17.json',import.meta.url)),metadata=JSON.parse(metadataBytes);
const contactInput=process.env.MAMOKEN_NORMAL_CONTACTS?resolve(process.env.MAMOKEN_NORMAL_CONTACTS):new URL('../normal_contacts_v17.json',import.meta.url),contactBytes=await readFile(contactInput),contactData=JSON.parse(contactBytes),contacts=contactData.characters??contactData;
// An explicit table is only an isolated QA candidate. No approval file is written.
const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
const approvalModule=await readFile(new URL('../../../dojo/normal-contact-overrides-p3.js',import.meta.url),'utf8');assert.match(approvalModule,/export\s+const\s+APPROVED_P3_CONTACT_DELIVERY\s*=\s*null\s*;/,'QA must not claim a null production approval when the module is adopted');
const delivery=createP3ContactDelivery(metadata,{source:'runtime-skinned-mesh',characters:contacts});
const base=process.env.MAMOKEN_URL??'http://127.0.0.1:4173/exp/fable-3d/dojo/',dir=process.env.MAMOKEN_EVIDENCE??'/tmp/mamoken-p3-motion-qa';await mkdir(dir,{recursive:true});
const ids=(process.env.MAMOKEN_QA_IDS??Object.keys(metadata.characters).join(',')).split(','),slots=['stand_weak','stand_heavy','crouch_weak','crouch_heavy','air_weak','air_heavy'];

const report={revision:process.env.MAMOKEN_ART_REVISION??'7f79ea252d6f5c08de892bd11c0e85845a91af14',source:'real-dojo-original-rig-exact-time-WebGL',candidateOnly:true,productionApproval:'null',contactTableInput:{mode:process.env.MAMOKEN_NORMAL_CONTACTS?'explicit-candidate':'default-author-table',path:String(contactInput),sha256:sha256(contactBytes)},metadataSha256:sha256(metadataBytes),packSha256:{},records:[],failures:[],diagnostics:[],errors:[]};
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH??'/usr/bin/google-chrome',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:852,height:393},hasTouch:true,isMobile:true,deviceScaleFactor:1});page.on('pageerror',e=>report.errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('favicon.ico'))report.errors.push(r.status()+' '+r.url());});page.on('console',m=>{if(/PropertyBinding.*(not found|failed)/.test(m.text()))report.errors.push(m.text());});
await page.route('**/normal-contact-overrides-p3.js',route=>route.fulfill({contentType:'text/javascript',body:'export const APPROVED_P3_CONTACT_DELIVERY='+JSON.stringify(delivery)+';'}));
try{
 await page.goto(base);await page.waitForFunction(()=>window.mamoken3d);
 assert.equal(await page.evaluate(async()=> (await import('./normal-motion-source.js')).ACTIVE_NORMAL_MOTION_SOURCE.version),'v17','isolated candidate provider was not selected');
 for(const id of ids){
  assert.ok(metadata.characters[id],id);report.packSha256[id]=sha256(await readFile(new URL('../'+id+'_normals_v17.glb',import.meta.url)));await page.evaluate(id=>mamoken3d.startMatch({ids:[id,'moguzo'],practice:true,instant:true}),id);
  await page.waitForFunction(id=>mamoken3d.actors[0]?.id===id&&mamoken3d.battle.frame>1&&mamoken3d.practice.enabled,id,{timeout:90000});
  // Install a probe after the game has loaded actors through its real provider.
  await page.evaluate(()=>{
   const actor=mamoken3d.actors[0],game=mamoken3d.battle;const rows=[];
   const group=name=>{const n=name.toLowerCase().replace(/[^a-z0-9]/g,''),side=n.endsWith('l')?'L':n.endsWith('r')?'R':'';
    if(/paw|hand|wrist|elbow|shoulder|clav|forearm|upperarm|arm/.test(n))return'arm'+side;
    if(/foot|shin|thigh|knee|ankle|leg|toe/.test(n))return'leg'+side;if(/tail/.test(n))return'tail';if(/head|jaw|ear|neck|snout|nose|beak/.test(n))return'head';return'body';};
   actor.gltf.scene.traverse(mesh=>{if(!mesh.isSkinnedMesh)return;const si=mesh.geometry.attributes.skinIndex,sw=mesh.geometry.attributes.skinWeight,groups=[],feet=[];
    for(let i=0;i<si.count;i++){let k=0;for(let j=1;j<4;j++)if(sw.getComponent(i,j)>sw.getComponent(i,k))k=j;const name=mesh.skeleton.bones[si.getComponent(i,k)].name;groups.push(group(name));if(/foot|toe/i.test(name))feet.push(i);}rows.push({mesh,groups,feet});
   });
   actor.__qa={rows,v:actor.holder.position.clone()};game.__qaTick=game.tick;
   game.tick=function(input={}){const result=this.__qaTick.call(this,input,{}),probe=this.__qaProbe,p=this.fighters[0];if(probe&&p.action?.id===probe.slot&&p.frame===probe.frame){p.stop=10000;this.fighters[1].stop=10000;probe.reached=true;}return result;};
   window.__p3Surface=(feetOnly=false)=>{
    const a=mamoken3d.actors[0],p=mamoken3d.battle.fighters[0],data=a.__qa,result={groups:{},footMin:Infinity};a.holder.updateMatrixWorld(true);
    for(const row of data.rows){row.mesh.skeleton.update();const indices=feetOnly?row.feet:Array.from({length:row.groups.length},(_,i)=>i);for(const i of indices){row.mesh.getVertexPosition(i,data.v);data.v.applyMatrix4(row.mesh.matrixWorld);const forward=(data.v.x-p.x)*p.facing,height=data.v.y-p.y;
     if(feetOnly){result.footMin=Math.min(result.footMin,height);continue;}const part=row.groups[i],old=result.groups[part];if(!old||forward>old.reach)result.groups[part]={reach:forward,height};
    }}return result;
   };
  });
  for(const slot of slots){
   const authored=metadata.characters[id][slot],reference=contacts[id][slot],record={id,slot,clip:authored.clip,clock:[],exact:[],feet:null,mirror:null};
   assert.equal(await page.evaluate(clip=>!!mamoken3d.actors[0].actions[clip],authored.clip),true,id+'/'+slot+' v17 action absent');
   // Every actual active frame passes through the game's fixed-step clock.
   const active=await page.evaluate(async({id,slot})=>(await import('./balance.js')).normalMove(id,slot).active,{id,slot});record.gameActiveFrames=active;
   for(let offset=0;offset<active;offset++){const boundary=offset===0?'startup':offset===active-1?'activeEnd':'active-'+offset;
    await page.evaluate(async({id,slot,offset})=>{
     const {normalMove}=await import('./balance.js'),g=mamoken3d.battle,p=g.fighters[0],t=g.fighters[1];g.phase='fight';g.time=75*60;
     Object.assign(p,{action:null,stun:0,stop:0,ko:false,state:'idle',frame:0,y:slot.startsWith('air_')?.8:0,vy:0,x:-1.4,used:false,prev:{},input:{}});Object.assign(t,{x:1.6,y:0,stun:10000,stop:0,action:null,ko:false,prev:{},input:{}});
     g._begin(p,normalMove(id,slot),slot);const frame=p.action.startup+offset;g.__qaProbe={slot,frame,reached:false};if(offset>0)p.frame=frame-1;
    },{id,slot,offset});
    await page.waitForFunction(({slot,clip})=>{const g=mamoken3d.battle,a=mamoken3d.actors[0];return g.__qaProbe?.reached&&g.fighters[0].action?.id===slot&&a.currentName===clip;},{slot,clip:authored.clip},{timeout:10000});
    const observed=await page.evaluate(async()=>{const {normalReachAt,normalHeightAt}=await import('./normal-contact-runtime-v151.js');const p=mamoken3d.battle.fighters[0],a=mamoken3d.actors[0];return {frame:p.frame,time:a.current.time,duration:a.current.getClip().duration,weight:a.current.getEffectiveWeight(),configuredReach:normalReachAt(p.action,p.frame),configuredHeight:normalHeightAt(p.action,p.frame),surface:__p3Surface()};});
    const phase=active>1?offset/(active-1):0,expectedSeconds=(authored.contact_frame+authored.contact_hold_frames*phase)/60;
    record.clock.push({boundary,phase,...observed,expectedSeconds});const rendered=observed.surface.groups[reference.attackPart];if(Math.abs(rendered.reach-observed.configuredReach)>.015||Math.abs(rendered.height-observed.configuredHeight)>.015)report.failures.push({id,slot,kind:'every-active-frame-hitbox-surface',phase,rendered,configuredReach:observed.configuredReach,configuredHeight:observed.configuredHeight});if(Math.abs(observed.time-expectedSeconds)>.0003||observed.weight<.99)report.failures.push({id,slot,kind:'actual-frame-clock',boundary,time:observed.time,expectedSeconds,weight:observed.weight});
   }
   await page.locator('#pause').tap();
   // Exact authored contact times, not a sparse N40 curve interpolation. Both
   // mirrored orientations are sampled on the same actual source SkinnedMesh.
   const exact=await page.evaluate(({authored,reference,slot,active})=>{
    const a=mamoken3d.actors[0],p=mamoken3d.battle.fighters[0],clip=a.actions[authored.clip].getClip(),samples=[];
    const pose=(seconds,facing)=>{a.mixer.stopAllAction();const action=a.actions[authored.clip];action.reset();action.enabled=true;action.setEffectiveWeight(1);action.setEffectiveTimeScale(0);action.setLoop(2200,1);action.clampWhenFinished=true;action.play();action.time=seconds;a.mixer.update(0);p.facing=facing;p.y=slot.startsWith('air_')?.7:0;a.holder.position.set(p.x,p.y,0);a.turn.rotation.set(0,facing===1?Math.PI/2:-Math.PI/2,0);return __p3Surface();};
    const phases=[...new Set([0,.5,1,...Array.from({length:active},(_,i)=>active>1?i/(active-1):0)])].sort((a,b)=>a-b);for(const phase of phases){const seconds=(authored.contact_frame+authored.contact_hold_frames*phase)/60;const right=pose(seconds,1),left=pose(seconds,-1);samples.push({phase,seconds,right,left});}
    let feet=null;if(!slot.startsWith('air_')){pose(0,1);const baseline=__p3Surface(true).footMin;let minimum=baseline,highest=baseline,at=0;for(let frame=0;frame<=authored.frames;frame++){pose(frame/60,1);const value=__p3Surface(true).footMin;if(value<minimum){minimum=value;at=frame;}highest=Math.max(highest,value);}feet={baseline,minimum,relativeSink:minimum-baseline,highestGroundMin:highest,minimumFrame:at};}
    window.__p3ExactPose=pose;pose(authored.contact_frame/60,1);return {samples,feet,vertices:a.__qa.rows.reduce((n,r)=>n+r.groups.length,0)};
   },{authored,reference,slot,active});
   const expectedParts=authored.attack_limb.split('+').flatMap(l=>l==='body'?['body','head']:/^paw|^elbow|^shoulder/.test(l)?['arm'+l.at(-1)]:/^foot|^knee/.test(l)?['leg'+l.at(-1)]:[l]);
   for(const point of exact.samples){const group=reference.attackPart,right=point.right.groups[group],left=point.left.groups[group],comparison=compareExactReference(reference.activeReach,active,point.phase,right),leading=Object.entries(point.right.groups).sort((a,b)=>b[1].reach-a[1].reach)[0];
    const row={phase:point.phase,seconds:point.seconds,attackPart:group,right,left,...comparison,leading:{part:leading[0],...leading[1]}};record.exact.push(row);
    if(row.failed)report.failures.push({id,slot,kind:row.missingBattleReference?'missing-active-reference':'exact-surface-vs-delivery',...row});else if(row.comparisonMode==='diagnostic'&&row.outsideTolerance)report.diagnostics.push({id,slot,kind:'unmeasured-non-battle-phase',...row});
    if(Math.abs(right.reach-left.reach)>1e-5||Math.abs(right.height-left.height)>1e-5)report.failures.push({id,slot,kind:'left-right-mirror',phase:point.phase,right,left});
    if(!expectedParts.includes(leading[0])&&leading[1].reach-right.reach>.03)report.failures.push({id,slot,kind:'wrong-leading-limb',phase:point.phase,seconds:point.seconds,expectedParts,leadingPart:leading[0],gap:leading[1].reach-right.reach});
   }
   record.mirror={points:exact.samples.length,maxReachDelta:Math.max(...exact.samples.map(p=>Math.abs(p.right.groups[reference.attackPart].reach-p.left.groups[reference.attackPart].reach))),maxHeightDelta:Math.max(...exact.samples.map(p=>Math.abs(p.right.groups[reference.attackPart].height-p.left.groups[reference.attackPart].height)))};record.feet=exact.feet;record.vertices=exact.vertices;if(exact.feet?.relativeSink<-.012)report.failures.push({id,slot,kind:'ground-foot-surface-sink',...exact.feet});
   report.records.push(record);if(slot==='stand_heavy'||slot==='air_heavy'){await page.screenshot({path:dir+'/'+id+'-'+slot+'-exact.png'});await page.evaluate(seconds=>__p3ExactPose(seconds,-1),authored.contact_frame/60);await page.screenshot({path:dir+'/'+id+'-'+slot+'-left-exact.png'});await page.evaluate(seconds=>__p3ExactPose(seconds,1),authored.contact_frame/60);}
   await page.locator('#pause').tap();
  }
  await page.locator('#select-back').tap();console.log('P3 exact WebGL audited',id);
 }
 await writeFile(dir+'/independent-exact-report.json',JSON.stringify(report,null,2));
 const measured={};for(const row of report.records){measured[row.id]??={};const old=contacts[row.id][row.slot];measured[row.id][row.slot]={...old,contact:metadata.characters[row.id][row.slot].contact_frame/metadata.characters[row.id][row.slot].frames,contactEnd:(metadata.characters[row.id][row.slot].contact_frame+metadata.characters[row.id][row.slot].contact_hold_frames)/metadata.characters[row.id][row.slot].frames,reach:row.exact[0].right.reach,height:row.exact[0].right.height,battleActive:row.gameActiveFrames,activeReach:row.exact.map(p=>({phase:p.phase,reach:p.right.reach,height:p.right.height})),source:'independent-exact-time-WebGL',reviewStatus:'candidate-only-not-approved'};}
 await writeFile(dir+'/independent-exact-contacts.json',JSON.stringify(measured,null,2));
 assert.deepEqual(report.errors,[]);if(process.env.MAMOKEN_QA_REPORT_ONLY!=='1')assert.deepEqual(report.failures,[],'Candidate motion delivery failed independent exact-time checks; inspect artifact report');
 console.log('P3 exact WebGL summary',JSON.stringify({clips:report.records.length,failures:report.failures.length,diagnostics:report.diagnostics.length,reportOnly:process.env.MAMOKEN_QA_REPORT_ONLY==='1',productionApproval:'null'}));
}catch(error){await writeFile(dir+'/independent-exact-report.json',JSON.stringify(report,null,2));await page.screenshot({path:dir+'/failure.png'}).catch(()=>{});throw error;}
finally{await browser.close();}
