// Actual original-rig WebGL -> exact active-frame delivery -> real Battle hits.
// Production mode measures the actual selected clips/table without replacing
// them. Explicit candidate mode remains available for archived r1 comparisons.
import assert from 'node:assert/strict';import {mkdir,writeFile} from 'node:fs/promises';import {createRequire} from 'node:module';
import {createP3SpecialContactDelivery} from '../special-contact-runtime-p3.js';
const {chromium}=createRequire(import.meta.url)('playwright-core');
const base=process.env.MAMOKEN_URL??'http://127.0.0.1:4173/exp/fable-3d/dojo/';
const sourceVersion=process.env.MAMOKEN_SPECIAL_SOURCE_VERSION??'v17';
const requireProduction=process.env.MAMOKEN_REQUIRE_PRODUCTION==='1';
assert.ok(['v17','v17r2'].includes(sourceVersion));
const dir=(process.env.MAMOKEN_EVIDENCE??'/tmp/mamoken-p3')+'/special-contact';await mkdir(dir,{recursive:true});
const report={candidateOnly:!requireProduction,requireProduction,productionApproval:'unobserved',source:'actual-Three.js-SkinnedMesh-exact-Battle-frame',specialSourceVersion:sourceVersion,physicalDeviceTested:false,rows:[],cases:[],errors:[]};
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH??'/usr/bin/google-chrome',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:852,height:393},isMobile:true,hasTouch:true});
page.on('pageerror',e=>report.errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('favicon.ico'))report.errors.push(r.status()+' '+r.url());});
page.on('console',m=>{if(/PropertyBinding.*(not found|failed)/.test(m.text()))report.errors.push(m.text());});
async function start(id){await page.evaluate(id=>mamoken3d.startMatch({ids:[id,'moguzo'],practice:true,instant:true}),id);await page.waitForFunction(id=>mamoken3d.actors[0]?.id===id&&!mamoken3d.diagnostics.loading&&mamoken3d.battle?.frame>1,id,{timeout:90000});}
async function inspect(id){return page.evaluate(async ({id,sourceVersion,requireProduction})=>{
 const [{GLTFLoader},{bindMorphTargets},{loadV17SpecialMotionSource,loadV17R2SpecialMotionSource,canonicalSpecialClip,specialMotionOverride,specialClipTime,resolveSpecialBone,specialReleaseAnchor},{specialMove}]=await Promise.all([
  import('three/addons/loaders/GLTFLoader.js'),import('./morph-binding.js'),import('./special-motion-source.js'),import('./balance.js')]);
 const source=await (sourceVersion==='v17r2'?loadV17R2SpecialMotionSource():loadV17SpecialMotionSource()),a=mamoken3d.actors[0],g=mamoken3d.battle,p=g.fighters[0];
 const packed=requireProduction?null:await new GLTFLoader().loadAsync(new URL(source.characters[id].s1.identity.sourceFile,source.rootURL).href);
 const rows=[];
 const group=name=>{const n=name.toLowerCase().replace(/[^a-z0-9]/g,''),side=n.endsWith('l')?'L':n.endsWith('r')?'R':'';
  if(/paw|hand|wrist|elbow|shoulder|clav|forearm|upperarm|arm/.test(n))return'arm'+side;
  if(/foot|shin|thigh|knee|ankle|leg|toe/.test(n))return'leg'+side;if(/tail/.test(n))return'tail';if(/head|jaw|ear|neck|snout|nose|beak/.test(n))return'head';return'body';};
 a.gltf.scene.traverse(mesh=>{if(!mesh.isSkinnedMesh)return;const si=mesh.geometry.attributes.skinIndex,sw=mesh.geometry.attributes.skinWeight,groups=[];
  for(let i=0;i<si.count;i++){let k=0;for(let j=1;j<4;j++)if(sw.getComponent(i,j)>sw.getComponent(i,k))k=j;groups.push(group(mesh.skeleton.bones[si.getComponent(i,k)].name));}rows.push({mesh,groups});});
 const v=a.holder.position.clone();
 const surface=()=>{const groups={};a.holder.updateMatrixWorld(true);for(const row of rows){row.mesh.skeleton.update();for(let i=0;i<row.groups.length;i++){
  row.mesh.getVertexPosition(i,v);v.applyMatrix4(row.mesh.matrixWorld);const forward=(v.x-p.x)*p.facing,height=v.y-p.y,part=row.groups[i],old=groups[part];if(!old||forward>old.reach)groups[part]={reach:forward,height};
 }}return groups;};
 const result={};
 for(const [slot,authored]of Object.entries(source.characters[id])){
  const prior=a.showtime[slot],selected=requireProduction?{spec:prior?.spec}:specialMotionOverride(source,id,prior.spec,new URL('../cinematic/v14/'+id+'/manifest.json',location.href));
  const clip=requireProduction?prior?.action?.getClip():packed.animations.find(c=>c.name===authored.row.clip);if(!clip)throw Error('Missing special '+id+'.'+slot);
  let action;
  if(requireProduction){
   const spec=selected.spec,identity=authored.identity;
   if(spec?.sourceVersion!==source.sourceVersion||spec.actualSourceClip!==identity.sourceClip||spec.sourceFile!==identity.sourceFile||clip.name!==identity.runtimeClip)throw Error('Actual production source mismatch: '+id+'.'+slot);
   if(g.specialContactDelivery?.version!==source.sourceVersion)throw Error('Actual production Battle uses another contact delivery');
   action=prior.action;
  }else{
   const bound=bindMorphTargets(canonicalSpecialClip(selected.spec,clip),a.gltf.scene);action=a.mixer.clipAction(bound);a.actions[bound.name]=action;a.showtime[slot]={...prior,spec:selected.spec,attacker:bound,start:null,action};
  }
  const move=specialMove(id,Number(slot.slice(1))-1),points=[],mirrors=[];
  const intended=[...new Set(authored.row.attack_limb.split('+').flatMap(limb=>/^paw|^elbow/.test(limb)?['arm'+limb.at(-1)]:/^shoulder/.test(limb)?['arm'+limb.at(-1),'body']:/^foot|^knee/.test(limb)?['leg'+limb.at(-1)]:limb==='body'?['body','head']:[limb]))];
  const leading=groups=>Object.entries(groups).filter(([part])=>intended.includes(part)).map(([part,p])=>({...p,part})).sort((a,b)=>b.reach-a.reach)[0];
  const pose=(seconds,facing)=>{a.mixer.stopAllAction();action.reset().setEffectiveWeight(1).setEffectiveTimeScale(0).setLoop(2200,1);action.clampWhenFinished=true;action.play();action.time=seconds;a.mixer.update(0);p.facing=facing;p.y=0;a.holder.position.set(p.x,p.y,0);a.turn.rotation.set(0,facing===1?Math.PI/2:-Math.PI/2,0);return surface();};
  const phases=[...new Set([0,.5,1,...Array.from({length:move.active},(_,i)=>i/Math.max(1,move.active-1))])].sort((a,b)=>a-b);
  for(const phase of phases){const frame=move.startup+phase*(move.active-1),seconds=specialClipTime(selected.spec,move,frame,clip.duration),right=leading(pose(seconds,1)),left=leading(pose(seconds,-1));if(!right||!left)throw Error('Unmeasured attack part '+id+'.'+slot);
   points.push({phase,reach:right.reach,height:right.height,part:right.part});mirrors.push({phase,seconds,right,left});}
  pose(selected.spec.contactSeconds,1);const socketBone=authored.row.kind==='projectile'&&resolveSpecialBone(a.gltf.scene,specialReleaseAnchor(authored.row));
  let projectileSocket;if(socketBone){socketBone.getWorldPosition(v);projectileSocket={forward:(v.x-p.x)*p.facing,height:v.y-p.y};}
  result[slot]={...authored.surface,source:'runtime-skinned-mesh',sampling:'exact-clip-clock',sampledContactSeconds:selected.spec.contactSeconds,
   attackPart:points[0].part,reach:points[0].reach,height:points[0].height,activeReach:points,...(projectileSocket?{projectileSocket}:{}),independentMirrorSamples:mirrors,
   ...(requireProduction?{productionContact:g.specialContactDelivery.characters[id][slot]}:{})};
 }
 a.mixer.stopAllAction();a.current=null;a.key='';
 window.__p3SpecialSurface=surface;window.__p3SpecialMeta=source;
 return {rows:result,vertices:rows.reduce((n,r)=>n+r.groups.length,0)};
},{id,sourceVersion,requireProduction});}
try{
 await page.goto(base);await page.waitForFunction(()=>window.mamoken3d);
 const approval=await page.evaluate(async()=>{const {APPROVED_P3_SPECIAL_MOTION_VERSION:family}=await import('./special-motion-overrides-p3.js'),{ACTIVE_P3_SPECIAL_CONTACT_DELIVERY:d}=await import('./special-contact-runtime-p3.js');return {family,contactVersion:d?.version??null};});
 report.productionApproval=approval.family;report.productionContactVersion=approval.contactVersion;
 if(requireProduction)assert.equal(approval.family,sourceVersion,'requested production animation family is not approved');
 const metadata=await page.evaluate(async version=>{const api=await import('./special-motion-source.js');return (await(version==='v17r2'?api.loadV17R2SpecialMotionSource():api.loadV17SpecialMotionSource())).metadata;},sourceVersion);
 const measured={source:'runtime-skinned-mesh',sampling:'exact-clip-clock',characters:{}};
 for(const id of Object.keys(metadata.characters)){
  await start(id);const observed=await inspect(id);measured.characters[id]=observed.rows;
  for(const [slot,row]of Object.entries(observed.rows)){
   for(const pair of row.independentMirrorSamples){assert.ok(Math.abs(pair.right.reach-pair.left.reach)<1e-5,id+'.'+slot+' mirrored reach');assert.ok(Math.abs(pair.right.height-pair.left.height)<1e-5,id+'.'+slot+' mirrored height');}
   if(requireProduction){
    const production=row.productionContact,active=metadata.characters[id][slot].active;
    for(let i=0;i<active;i++){
     const phase=i/Math.max(1,active-1),actual=row.activeReach.find(p=>Math.abs(p.phase-phase)<1e-6),expected=production.activeReach.find(p=>Math.abs(p.phase-phase)<1e-6);
     assert.ok(actual&&expected,id+'.'+slot+' production table misses actual active frame '+i);
     assert.ok(Math.abs(actual.reach-expected.reach)<.005&&Math.abs(actual.height-expected.height)<.005,id+'.'+slot+' actual production surface differs from rendered pose at active '+i);
    }
    if(row.projectileSocket)for(const key of ['forward','height'])assert.ok(Math.abs(row.projectileSocket[key]-production.projectileSocket[key])<.005,id+'.'+slot+' production release socket differs from actual bone');
   }
   report.rows.push({id,slot,vertices:observed.vertices,reach:row.reach,height:row.height,activePoints:row.activeReach.length,projectileSocket:row.projectileSocket});
  }
 }
 const delivery=createP3SpecialContactDelivery(metadata,measured);await writeFile(dir+'/exact-candidate-delivery.json',JSON.stringify(delivery,null,2));
 // Existing main/story consumers retain responsibility for the final production
 // selector. These three redesigns now exercise that same loader, frame player,
 // live Battle, renderer, hit feedback and release socket on actual new clips.
 const scenarios=[['godan','s3'],['chirka','s3'],['dark_moguzo','s1'],...(sourceVersion==='v17r2'?[['moguzo','s2'],['godan','s2'],['takimaru','s2'],['yomikage','s2'],['bullet','s2'],['hakuma','s3']]:[])];
 for(const [id,slot]of scenarios){
  await start(id);await inspect(id);
  for(const facing of [1,-1])for(const outcome of id==='dark_moguzo'?['release']:['hit','guard','whiff']){
   await page.locator('#practice-dummy').selectOption(outcome==='guard'?'guard_stand':'stand');
   await page.evaluate(async({id,slot,facing,outcome,delivery,requireProduction})=>{
    const {specialMove}=await import('./balance.js'),{validateP3SpecialContactDelivery}=await import('./special-contact-runtime-p3.js');
    const g=mamoken3d.battle,[p,t]=g.fighters;
    if(requireProduction){if(g.specialContactDelivery?.version!==delivery.version)throw Error('Production Battle lost its approved contacts');}
    else g.specialContactDelivery=validateP3SpecialContactDelivery(delivery);
    g.phase='fight';g.time=75*60;g.projectiles=[];
    for(const a of [p,t])Object.assign(a,{action:null,hp:900,stun:0,stop:0,frame:0,y:0,vy:0,state:'idle',ko:false,used:false,spawned:false,input:{},prev:{},dashF:0,landF:0,comboHits:0,comboContact:null});
    p.x=facing===1?-.5:.5;p.facing=facing;t.facing=-facing;
    const row=delivery.characters[id][slot],maximum=Math.max(...row.activeReach.map(p=>p.reach));
    t.x=p.x+facing*(outcome==='release'?1.4:outcome==='whiff'?maximum+.45:row.reach+.12);t.guard=100;
    // Let the real startup play so the renderer completes its normal blending.
    g._begin(p,specialMove(id,Number(slot.slice(1))-1),slot);window.__p3SpecialEvent=null;
    const tick=g.tick;g.tick=function(...args){const result=tick.apply(this,args),e=this.events.find(e=>outcome==='release'?e.type==='projectile':e.type===(outcome==='guard'?'block':'hit'));
     const whiff=outcome==='whiff'&&this.events.find(e=>e.type==='combat_feedback'&&e.feedback?.outcome==='whiff');
     if(e||whiff){window.__p3SpecialEvent={event:e??whiff,frame:p.frame,stop:p.stop,targetStop:t.stop,rootX:p.x,projectile:this.projectiles[0]&&{...this.projectiles[0]},hitEvents:this.events.filter(e=>e.type==='hit'||e.type==='block')};p.stop=300;t.stop=300;this.tick=tick;}return result;};
   },{id,slot,facing,outcome,delivery,requireProduction});
   await page.waitForFunction(()=>window.__p3SpecialEvent,undefined,{timeout:12000});
   const record=await page.evaluate(()=>{const a=mamoken3d.actors[0],p=mamoken3d.battle.fighters[0],entry=a.showtime[p.action?.id];return {...window.__p3SpecialEvent,clip:a.currentName,time:a.current?.time,poseWeight:a.current?.getEffectiveWeight(),expectedTime:entry?.spec.contactSeconds,surface:__p3SpecialSurface(),renderedFrame:p.frame};});
   assert.equal(record.clip,slot+'_v17',id+' actual renderer did not consume v17 special');assert.ok(record.poseWeight>.99,id+' incomplete contact pose blending');
   if(outcome==='release'){
    assert.ok(record.projectile);const socket=delivery.characters[id][slot].projectileSocket;
    // _projectiles moves once after spawn during the same fixed step.
    const expected=record.rootX+facing*(socket.forward+record.projectile.speed);
    assert.ok(Math.abs(record.projectile.x-expected)<.005,'release did not use measured paw socket');assert.ok(Math.abs(record.projectile.y-socket.height)<.005);
   }else if(outcome==='whiff')assert.equal(record.hitEvents.length,0);
   else{
    assert.equal(record.event.feedback.point.space,'authored-special-surface');
    const part=delivery.characters[id][slot].attackPart,actual=record.surface[part],event=record.event.feedback.point;
    assert.ok(Math.abs(event.x-(record.rootX+facing*actual.reach))<.005,id+' actual visible striking surface disagrees with hit point');
    assert.ok(Math.abs(event.y-actual.height)<.005,id+' actual strike height disagrees with hit point');
   }
   await page.screenshot({path:dir+'/'+id+'-'+slot+'-'+(facing===1?'right':'left')+'-'+outcome+'.png'});report.cases.push({id,slot,facing,outcome,...record});
  }
 }
 if(sourceVersion==='v17r2'){
  // Production's common normal provider must already select the delivered r2
  // Takimaru pack. Do not fake the GLB path or monkeypatch its approval here.
  await page.evaluate(()=>mamoken3d.startMatch({ids:['takimaru','chirka'],practice:true,instant:true}));
  await page.waitForFunction(()=>mamoken3d.actors[0]?.id==='takimaru'&&!mamoken3d.diagnostics.loading&&mamoken3d.battle?.frame>1);
  const active=await page.evaluate(async()=>{const {ACTIVE_NORMAL_MOTION_SOURCE:s}=await import('./normal-motion-source.js');return {version:s.contactVersion,clip:s.clipName('crouch_heavy',{rigId:'takimaru'}),file:s.pack('takimaru').file};});
  assert.equal(active.clip,'v17r2_crouch_heavy');assert.equal(active.file,'motion/v17r2/takimaru_normals_v17r2.glb');report.normalProvider=active;report.normalCases=[];
  for(const facing of [1,-1])for(const outcome of ['hit','guard','whiff']){
   await page.locator('#practice-dummy').selectOption('guard_crouch');
   await page.evaluate(async({facing,outcome})=>{
    const {normalMove}=await import('./balance.js'),g=mamoken3d.battle,[p,t]=g.fighters;
    g.phase='fight';g.time=75*60;g.projectiles=[];
    for(const a of [p,t])Object.assign(a,{action:null,hp:900,stun:0,stop:0,frame:0,y:0,vy:0,state:'idle',ko:false,input:{},prev:{},dashF:0,landF:0,comboHits:0,comboContact:null});
    p.x=-facing*.5;p.facing=facing;t.x=p.x+facing*(outcome==='whiff'?.95:.55);t.facing=-facing;t.guard=100;window.__p3LowEvent=null;
    g._begin(p,normalMove('takimaru','crouch_heavy'),'crouch_heavy');const tick=g.tick;
    g.tick=function(input){const back=p.x>=t.x?'left':'right',result=tick.call(this,input,{down:true,...(outcome==='guard'?{[back]:true}:{})});
     const event=this.events.find(e=>e.type===(outcome==='guard'?'block':'hit')),whiff=outcome==='whiff'&&this.events.find(e=>e.feedback?.outcome==='whiff'&&e.slot===0);
     if(event||whiff){window.__p3LowEvent={event:event??whiff,frame:p.frame,hitEvents:this.events.filter(e=>e.type==='hit'||e.type==='block')};p.stop=300;t.stop=300;this.tick=tick;}return result;};
   },{facing,outcome});
   await page.waitForFunction(()=>window.__p3LowEvent,undefined,{timeout:12000});
   const row=await page.evaluate(()=>({...window.__p3LowEvent,clip:mamoken3d.actors[0].currentName,time:mamoken3d.actors[0].current.time,poseWeight:mamoken3d.actors[0].current.getEffectiveWeight()}));
   assert.equal(row.clip,'v17r2_crouch_heavy');assert.ok(row.poseWeight>.99);
   if(outcome==='whiff')assert.equal(row.hitEvents.length,0);else{assert.equal(row.event.type,outcome==='guard'?'block':'hit');assert.equal(row.frame,15);assert.equal(row.event.feedback.point.space,'authored-strike-surface');}
   await page.screenshot({path:dir+'/takimaru-crouch_heavy-'+(facing===1?'right':'left')+'-'+outcome+'.png'});report.normalCases.push({facing,outcome,...row});
  }
  assert.equal(report.normalCases.length,6);
 }
 assert.equal(report.rows.length,27);assert.equal(report.cases.length,sourceVersion==='v17r2'?50:14);assert.deepEqual(report.errors,[]);report.passed=true;
}catch(error){report.error=error.stack;await page.screenshot({path:dir+'/failure.png'}).catch(()=>{});throw error;}
finally{await writeFile(dir+'/report.json',JSON.stringify(report,null,2));await browser.close();}
