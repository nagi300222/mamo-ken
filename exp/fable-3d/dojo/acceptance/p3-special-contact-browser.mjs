// Actual original-rig WebGL -> exact active-frame delivery -> real Battle hits.
// Uses an isolated candidate object, leaving both repository approvals null.
import assert from 'node:assert/strict';import {mkdir,writeFile} from 'node:fs/promises';import {createRequire} from 'node:module';
import {createP3SpecialContactDelivery} from '../special-contact-runtime-p3.js';
const {chromium}=createRequire(import.meta.url)('playwright-core');
const base=process.env.MAMOKEN_URL??'http://127.0.0.1:4173/exp/fable-3d/dojo/';
const dir=(process.env.MAMOKEN_EVIDENCE??'/tmp/mamoken-p3')+'/special-contact';await mkdir(dir,{recursive:true});
const report={candidateOnly:true,productionApproval:'null',source:'actual-Three.js-SkinnedMesh-exact-Battle-frame',physicalDeviceTested:false,rows:[],cases:[],errors:[]};
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH??'/usr/bin/google-chrome',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:852,height:393},isMobile:true,hasTouch:true});
page.on('pageerror',e=>report.errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('favicon.ico'))report.errors.push(r.status()+' '+r.url());});
page.on('console',m=>{if(/PropertyBinding.*(not found|failed)/.test(m.text()))report.errors.push(m.text());});
async function start(id){await page.evaluate(id=>mamoken3d.startMatch({ids:[id,'moguzo'],practice:true,instant:true}),id);await page.waitForFunction(id=>mamoken3d.actors[0]?.id===id&&!mamoken3d.diagnostics.loading&&mamoken3d.battle?.frame>1,id,{timeout:90000});}
async function install(id){return page.evaluate(async id=>{
 const [{GLTFLoader},{bindMorphTargets},{loadV17SpecialMotionSource,specialMotionOverride,specialClipTime,resolveSpecialBone,specialReleaseAnchor},{specialMove}]=await Promise.all([
  import('three/addons/loaders/GLTFLoader.js'),import('./morph-binding.js'),import('./special-motion-source.js'),import('./balance.js')]);
 const source=await loadV17SpecialMotionSource(),a=mamoken3d.actors[0],g=mamoken3d.battle,p=g.fighters[0];
 const packed=await new GLTFLoader().loadAsync(new URL('../motion/v17/'+id+'_specials_v17.glb',location.href).href);
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
  const prior=a.showtime[slot],selected=specialMotionOverride(source,id,prior.spec,new URL('../cinematic/v14/'+id+'/manifest.json',location.href));
  const clip=packed.animations.find(c=>c.name===authored.row.clip);if(!clip)throw Error('Missing special '+id+'.'+slot);
  const bound=bindMorphTargets(clip,a.gltf.scene),action=a.mixer.clipAction(bound);a.actions[bound.name]=action;
  a.showtime[slot]={...prior,spec:selected.spec,attacker:bound,start:null,action};
  const move=specialMove(id,Number(slot.slice(1))-1),points=[],mirrors=[];
  const pose=(seconds,facing)=>{a.mixer.stopAllAction();action.reset().setEffectiveWeight(1).setEffectiveTimeScale(0).setLoop(2200,1);action.clampWhenFinished=true;action.play();action.time=seconds;a.mixer.update(0);p.facing=facing;p.y=0;a.holder.position.set(p.x,p.y,0);a.turn.rotation.set(0,facing===1?Math.PI/2:-Math.PI/2,0);return surface();};
  const phases=[...new Set([0,.5,1,...Array.from({length:move.active},(_,i)=>i/Math.max(1,move.active-1))])].sort((a,b)=>a-b);
  for(const phase of phases){const frame=move.startup+phase*(move.active-1),seconds=specialClipTime(selected.spec,move,frame,clip.duration),right=pose(seconds,1)[authored.surface.attackPart],left=pose(seconds,-1)[authored.surface.attackPart];if(!right||!left)throw Error('Unmeasured attack part '+id+'.'+slot);
   points.push({phase,reach:right.reach,height:right.height});mirrors.push({phase,seconds,right,left});}
  pose(selected.spec.contactSeconds,1);const socketBone=authored.row.kind==='projectile'&&resolveSpecialBone(a.gltf.scene,specialReleaseAnchor(authored.row));
  let projectileSocket;if(socketBone){socketBone.getWorldPosition(v);projectileSocket={forward:(v.x-p.x)*p.facing,height:v.y-p.y};}
  result[slot]={...authored.surface,source:'runtime-skinned-mesh',sampling:'exact-clip-clock',sampledContactSeconds:selected.spec.contactSeconds,
   reach:points[0].reach,height:points[0].height,activeReach:points,...(projectileSocket?{projectileSocket}:{}),independentMirrorSamples:mirrors};
 }
 a.mixer.stopAllAction();a.current=null;a.key='';
 window.__p3SpecialSurface=surface;window.__p3SpecialMeta=source;
 return {rows:result,vertices:rows.reduce((n,r)=>n+r.groups.length,0)};
},id);}
try{
 await page.goto(base);await page.waitForFunction(()=>window.mamoken3d);
 const metadata=await page.evaluate(async()=>{const r=await fetch(new URL('../motion/v17/specials_v17.json',location.href));if(!r.ok)throw Error('special metadata missing');return r.json();});
 const measured={source:'runtime-skinned-mesh',sampling:'exact-clip-clock',characters:{}};
 for(const id of Object.keys(metadata.characters)){
  await start(id);const observed=await install(id);measured.characters[id]=observed.rows;
  for(const [slot,row]of Object.entries(observed.rows)){
   for(const pair of row.independentMirrorSamples){assert.ok(Math.abs(pair.right.reach-pair.left.reach)<1e-5,id+'.'+slot+' mirrored reach');assert.ok(Math.abs(pair.right.height-pair.left.height)<1e-5,id+'.'+slot+' mirrored height');}
   report.rows.push({id,slot,vertices:observed.vertices,reach:row.reach,height:row.height,activePoints:row.activeReach.length,projectileSocket:row.projectileSocket});
  }
 }
 const delivery=createP3SpecialContactDelivery(metadata,measured);await writeFile(dir+'/exact-candidate-delivery.json',JSON.stringify(delivery,null,2));
 // Existing main/story consumers retain responsibility for the final production
 // selector. These three redesigns now exercise that same loader, frame player,
 // live Battle, renderer, hit feedback and release socket on actual new clips.
 for(const [id,slot]of [['godan','s3'],['chirka','s3'],['dark_moguzo','s1']]){
  await start(id);await install(id);
  for(const facing of [1,-1])for(const outcome of id==='dark_moguzo'?['release']:['hit','guard','whiff']){
   await page.locator('#practice-dummy').selectOption(outcome==='guard'?'guard_stand':'stand');
   await page.evaluate(async({id,slot,facing,outcome,delivery})=>{
    const {specialMove}=await import('./balance.js'),{validateP3SpecialContactDelivery}=await import('./special-contact-runtime-p3.js');
    const g=mamoken3d.battle,[p,t]=g.fighters;g.specialContactDelivery=validateP3SpecialContactDelivery(delivery);g.phase='fight';g.time=75*60;g.projectiles=[];
    for(const a of [p,t])Object.assign(a,{action:null,hp:900,stun:0,stop:0,frame:0,y:0,vy:0,state:'idle',ko:false,used:false,spawned:false,input:{},prev:{},dashF:0,landF:0,comboHits:0,comboContact:null});
    p.x=facing===1?-.5:.5;p.facing=facing;t.facing=-facing;
    const row=delivery.characters[id][slot],maximum=Math.max(...row.activeReach.map(p=>p.reach));
    t.x=p.x+facing*(outcome==='release'?1.4:outcome==='whiff'?maximum+.45:row.reach+.12);t.guard=100;
    // Let the real startup play so the renderer completes its normal blending.
    g._begin(p,specialMove(id,Number(slot.slice(1))-1),slot);window.__p3SpecialEvent=null;
    const tick=g.tick;g.tick=function(...args){const result=tick.apply(this,args),e=this.events.find(e=>outcome==='release'?e.type==='projectile':e.type===(outcome==='guard'?'block':'hit'));
     const whiff=outcome==='whiff'&&this.events.find(e=>e.type==='combat_feedback'&&e.feedback?.outcome==='whiff');
     if(e||whiff){window.__p3SpecialEvent={event:e??whiff,frame:p.frame,stop:p.stop,targetStop:t.stop,rootX:p.x,projectile:this.projectiles[0]&&{...this.projectiles[0]},hitEvents:this.events.filter(e=>e.type==='hit'||e.type==='block')};p.stop=300;t.stop=300;this.tick=tick;}return result;};
   },{id,slot,facing,outcome,delivery});
   await page.waitForFunction(()=>window.__p3SpecialEvent,undefined,{timeout:12000});
   const record=await page.evaluate(()=>{const a=mamoken3d.actors[0],p=mamoken3d.battle.fighters[0],entry=a.showtime[p.action?.id];return {...window.__p3SpecialEvent,clip:a.currentName,time:a.current?.time,expectedTime:entry?.spec.contactSeconds,surface:__p3SpecialSurface(),renderedFrame:p.frame};});
   assert.equal(record.clip,slot+'_v17',id+' actual renderer did not consume v17 special');
   if(outcome==='release'){
    assert.ok(record.projectile);const socket=delivery.characters[id][slot].projectileSocket;
    // _projectiles moves once after spawn during the same fixed step.
    const expected=record.rootX+facing*(socket.forward+record.projectile.speed);
    assert.ok(Math.abs(record.projectile.x-expected)<1e-6,'release did not use measured paw socket');assert.ok(Math.abs(record.projectile.y-socket.height)<1e-6);
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
 assert.equal(report.rows.length,27);assert.equal(report.cases.length,14);assert.deepEqual(report.errors,[]);report.passed=true;
}catch(error){report.error=error.stack;await page.screenshot({path:dir+'/failure.png'}).catch(()=>{});throw error;}
finally{await writeFile(dir+'/report.json',JSON.stringify(report,null,2));await browser.close();}
