// Browser-side skeleton/skin measurements and real Battle contacts, plus three
// actual WebGL editor views. Requires the v16 Story + modular asset stages.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('playwright-core');
const root=process.env.MAMOKEN_STORY_URL??'http://127.0.0.1:4173/exp/fable-3d/story/';
const output=(process.env.MAMOKEN_EVIDENCE??'/tmp/mamoken-v16')+'/custom-combat';
await mkdir(output,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH??'/usr/bin/google-chrome',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:852,height:393},isMobile:true,hasTouch:true,deviceScaleFactor:1});
const errors=[];
page.on('pageerror',error=>errors.push(error.message));
page.on('console',message=>{if(/PropertyBinding.*(not found|failed)|WebGLProgram.*Shader Error|VALIDATE_STATUS.*false/.test(message.text()))errors.push(message.text());});
page.on('response',response=>{if(response.status()>=400&&!response.url().endsWith('favicon.ico'))errors.push(response.status()+' '+response.url());});
try{
 await page.goto(root,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.mamokenStory?.mode==='editor'&&mamokenStory.player,undefined,{timeout:60000});
 const report=await page.evaluate(async()=>{
  const A=await import('../custom/v16/avatar-factory.js'),S=await import('../custom/v16/avatar-schema.js'),C=await import('../custom/v16/custom-combat.js'),R=await import('../custom/v16/custom-animation.js');
  const {IDS,ROSTER,specialMove}=await import('../dojo/balance.js');
  const {NORMAL_CONTACTS,ACTIVE_NORMAL_MOTION_VERSION}=await import('../dojo/normal-contact-source.js');
  const {normalReachAt,normalHeightAt}=await import('../dojo/normal-contact-runtime-v151.js');
  const {createShowtimeLoader}=await import('../dojo/showtime-assets.js');
  const {loadApprovedSpecialMotionSource,resolveSpecialBone,specialClipTime}=await import('../dojo/special-motion-source.js');
  const {bindMorphTargets}=await import('../dojo/morph-binding.js');
  const {GLTFLoader}=await import('three/addons/loaders/GLTFLoader.js');
  const THREE=await import('three'),loader=new GLTFLoader();
  const check=(condition,message)=>{if(!condition)throw Error(message);};
  const sources=IDS.filter(id=>ROSTER[id].specials[0].kind==='projectile'),donors={},clipPacks=new Map();
  const specialSource=await loadApprovedSpecialMotionSource();
  const loadShowtime=createShowtimeLoader(new URL('../cinematic/v14/',location.href),{specialMotionSource:specialSource});
  for(const id of [...new Set([...sources,'hakuma'])]){
   const original=await loader.loadAsync(new URL(`../chars/${id}/${id}.glb`,location.href).href);
   const entries=await loadShowtime(id,async(source,url)=>{
    let animations=original.animations;
    if(source.glb){
     const path=new URL(source.glb,url).href;
     if(!clipPacks.has(path))clipPacks.set(path,loader.loadAsync(path));
     animations=(await clipPacks.get(path)).animations;
    }
    const clip=animations.find(clip=>clip.name===source.clip);
    check(clip,`missing selected source clip ${id}/${source.clip}`);return clip;
   });
   const {spec}=entries.s1,clip=entries.s1.start??entries.s1.attacker;
   if(specialSource){
    const identity=specialSource.characters[id].s1.identity;
    check(spec.sourceFile===identity.sourceFile&&spec.actualSourceClip===identity.sourceClip,id+' bypassed selected special asset');
   }
   donors[id]={original,clip,spec,entries};
  }
  const result={normalVersion:ACTIVE_NORMAL_MOTION_VERSION,specialVersion:specialSource?.version??'v14',normalCases:[],projectileCases:[],nativeSpecialCases:[],rigCases:[],errors:[]};
  for(const [targetIndex,baseId]of IDS.entries()){
   const definition=S.createDefaultAvatar(baseId),avatar=await A.createAvatar(definition,{loader});
   try{
    const selectedStyle=IDS[(targetIndex+3)%IDS.length],measurement=A.measureContacts(avatar,{styleId:selectedStyle});
    check(measurement.source==='runtime-skinned-mesh',baseId+' is not skinned-surface measured');
    check(measurement.normalMotionVersion===ACTIVE_NORMAL_MOTION_VERSION&&measurement.normalStyleId===selectedStyle&&measurement.normalSampling==='exact-style-active-frames',baseId+' sampled a different normal source/style');
    definition.combat.styleId=selectedStyle;definition.combat.specials=['moguzo.s1','pisuke.s1','bullet.s1'];
    let battle=C.createCustomBattle(definition,'pisuke',1,{measurements:[measurement]});
    for(const [slot,contact]of Object.entries(measurement.normals)){
     const original=NORMAL_CONTACTS[baseId][slot];
     check(Math.abs(contact.reach-original.reach)<.02,baseId+'/'+slot+' native surface drift');
     const fighter=battle.fighters[0],foe=battle.fighters[1];fighter.action=null;fighter.stop=0;fighter.stun=0;fighter.y=slot.startsWith('air_')?.5:0;fighter.frame=0;fighter.x=0;
     check(battle._begin(fighter,{},slot),baseId+'/'+slot+' did not resolve');
     check(Math.abs(fighter.action.reach-contact.reach)<1e-6,'move ignored avatar surface');
     const boundaries=[];
     for(let frame=0;frame<fighter.action.active;frame++){
      const phase=frame/(fighter.action.active-1);
      check(contact.activeReach.some(point=>Math.abs(point.phase-phase)<1e-9),baseId+'/'+slot+' missing selected style active frame');
      fighter.frame=fighter.action.startup+frame;
      const reach=normalReachAt(fighter.action,fighter.frame),height=normalHeightAt(fighter.action,fighter.frame);
      for(const facing of [1,-1]){
       fighter.facing=facing;foe.y=Math.max(0,fighter.y+height-.2);foe.state='idle';foe.input={};
       foe.x=facing*(reach+.16-.003);
       check(battle._contact(fighter,foe,fighter.action),baseId+'/'+slot+'/'+frame+'/'+facing+' contact inside must land');
       foe.x=facing*(reach+.16+.003);
       check(!battle._contact(fighter,foe,fighter.action),baseId+'/'+slot+'/'+frame+'/'+facing+' contact outside must miss');
       boundaries.push({frame,phase,facing,reach,height});
      }
     }
     result.normalCases.push({baseId,styleId:definition.combat.styleId,slot,clip:avatar.normalMotionSource.pack(baseId).clipNames.find(name=>avatar.normalMotionSource.slotForClip(name)===slot),reach:contact.reach,height:contact.height,boundaries});
    }
    for(const sourceId of sources){
     const {original,clip,spec}=donors[sourceId];
     const ref=sourceId+'.s1',expected=specialMove(sourceId,0);
     check(C.compatibilityForMove(definition,ref).supported,ref+' compatibility must remain supported');
     const compatibility=R.inspectClipCompatibility(clip,original.scene,avatar.scene,{moveKind:'projectile'});
     check(compatibility.ok,sourceId+' -> '+baseId+' unsupported skeleton');
     const transferred=sourceId===baseId?clip:bindMorphTargets(R.retargetCustomClip(clip,original.scene,avatar.scene,{moveKind:'projectile'}),avatar.scene);
     const converted=A.bindAvatarClip(transferred,avatar);
     check(converted.tracks.every(track=>[...track.values].every(Number.isFinite)),sourceId+' -> '+baseId+' non-finite retarget');
     let socket,own;
     if(spec.motionVersion==='v17'){
      const releaseBone=resolveSpecialBone(avatar.scene,spec.releaseAnchor??spec.attackLimb);
      check(releaseBone?.isBone,ref+' missing actual selected release bone');
      own=A.measureSpecialContact(avatar,converted,spec,expected,{ref,sourceVersion:spec.sourceVersion,releaseBone});
      check(own.source==='runtime-skinned-mesh'&&own.sampling==='exact-clip-clock'&&own.activeFrameCount===expected.active,ref+' missing actual selected special measurement');
      for(let frame=0;frame<expected.active;frame++)check(own.activeReach.some(point=>Math.abs(point.phase-frame/Math.max(1,expected.active-1))<1e-9),ref+' missing actual special frame');
      socket=own.projectileSocket;measurement.specialContacts={[ref]:own};
     }else{
      socket=A.measureProjectileSocket(avatar,converted,spec.contactSeconds??converted.duration*.3);measurement.specialContacts={};
     }
     check(socket?.source==='runtime-bone-world-position',sourceId+' -> '+baseId+' missing measured socket');
     measurement.projectileSockets={[ref]:socket};
     definition.combat.specials[0]=sourceId+'.s1';
     battle=C.createCustomBattle(definition,'pisuke',1,{measurements:[measurement]});
     const [player,foe]=battle.fighters;player.x=-.45;foe.x=.60;foe.ability.grit=false;
     let spawned=null,hits=0,damage=0;
     battle.tick({special1:true},{});
     check(player.action.sourceCharacterId===sourceId,'foreign source move was not equipped');
     if(own)check(player.action.customSpecialContact===own&&player.action.projectileSocket.forward===socket.forward&&player.action.projectileSocket.height===socket.height,'Battle ignored selected custom special measurement');
     for(let i=0;i<180;i++){
      battle.tick({},{});
      if(!spawned&&battle.projectiles.length)spawned={...battle.projectiles[0],playerX:player.x};
      for(const event of battle.events)if(event.type==='hit'){hits++;damage+=event.damage;}
     }
     check(spawned,sourceId+' -> '+baseId+' projectile never spawned');
     check(Math.abs(spawned.y-socket.height)<1e-6,'projectile ignored measured height');
     check(Math.abs(spawned.x-(spawned.playerX+socket.forward+expected.speed))<1e-6,'projectile ignored measured origin');
     check(hits===1&&damage===expected.damage,sourceId+' -> '+baseId+' expected single unblocked hit');
     const mixer=new THREE.AnimationMixer(avatar.scene),action=mixer.clipAction(converted);action.play();action.time=spec.contactSeconds??converted.duration*.3;mixer.update(0);avatar.scene.updateMatrixWorld(true);
     const point=new THREE.Vector3();let vertices=0;
     avatar.scene.traverse(mesh=>{if(!mesh.isSkinnedMesh)return;for(let i=0;i<mesh.geometry.attributes.position.count;i+=83){mesh.getVertexPosition(i,point);check([point.x,point.y,point.z].every(Number.isFinite),'non-finite skinned animation vertex');vertices++;}});
     if(own){
      const bone=resolveSpecialBone(avatar.scene,socket.bone);bone.getWorldPosition(point);
      check(Math.abs(point.z-socket.forward)<.000002&&Math.abs(point.y-socket.height)<.000002,ref+' actual bound release differs from measured socket');
     }
     mixer.stopAllAction();mixer.uncacheRoot(avatar.scene);
     result.projectileCases.push({sourceId,baseId,styleId:definition.combat.styleId,hits,damage,socket,clip:converted.name,actualSourceClip:spec.actualSourceClip??clip.name,sourceFile:spec.sourceFile??spec.animationSources.attacker.glb,sourceVersion:spec.sourceVersion??'v14',sampling:own?.sampling,activeFrameCount:own?.activeFrameCount,boneTracks:converted.tracks.length,vertices});
    }
    if(specialSource&&['hakuma','dark_moguzo'].includes(baseId)){
     const entry=donors[baseId].entries.s3,spec=entry.spec,ref=baseId+'.s3',expected=specialMove(baseId,2);
     const clip=A.bindAvatarClip(entry.start??entry.attacker,avatar);
     const releaseBone=resolveSpecialBone(avatar.scene,spec.releaseAnchor??spec.attackLimb);
     const own=A.measureSpecialContact(avatar,clip,spec,expected,{ref,sourceVersion:spec.sourceVersion,releaseBone});
     measurement.specialContacts={[ref]:own};definition.combat.specials[2]=ref;
     const probe=C.createCustomBattle(definition,'pisuke',1,{measurements:[measurement]}),[fighter,foe]=probe.fighters;
     check(probe._begin(fighter,{},'s3')&&fighter.action.specialContact===own,ref+' Battle rejected the actual custom surface');
     const declared=spec.attackLimb.split('+').flatMap(limb=>({pawL:['armL'],pawR:['armR'],elbowL:['armL'],elbowR:['armR'],shoulderL:['armL','body'],shoulderR:['armR','body'],body:['body','head']})[limb]??[]);
     check(declared.includes('armL')&&declared.includes('armR'),ref+' fixture requires the actual two-hand authored move');
     const part=name=>{const n=name.toLowerCase().replace(/[^a-z0-9]/g,''),side=n.endsWith('l')?'L':n.endsWith('r')?'R':'';
      if(/paw|hand|wrist|elbow|shoulder|clav|forearm|upperarm|arm/.test(n))return 'arm'+side;
      if(/foot|shin|thigh|knee|ankle|leg|toe/.test(n))return 'leg'+side;
      return /tail/.test(n)?'tail':/head|jaw|ear|neck|snout|nose|beak/.test(n)?'head':'body';};
     const surfaces=avatar.meshes.filter(mesh=>mesh.visible).map(mesh=>{
      const {position,skinIndex,skinWeight}=mesh.geometry.attributes,vertices=[];
      for(let i=0;i<position.count;i++){let k=0;for(let j=1;j<4;j++)if(skinWeight.getComponent(i,j)>skinWeight.getComponent(i,k))k=j;
       const group=part(mesh.skeleton.bones[skinIndex.getComponent(i,k)].name);if(declared.includes(group))vertices.push({index:i,part:group});}
      return {mesh,vertices};
     });
     const mixer=new THREE.AnimationMixer(avatar.scene),action=mixer.clipAction(clip);action.reset().setLoop(THREE.LoopOnce,1);action.clampWhenFinished=true;action.play();action.setEffectiveTimeScale(0);
     const renderer=new THREE.WebGLRenderer({antialias:false,preserveDrawingBuffer:true});
     const gpuScene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(35,1,.01,20),width=320,height=320,pixels=new Uint8Array(width*height*4);
     gpuScene.add(avatar.scene);gpuScene.add(new THREE.HemisphereLight(0xffffff,0x758399,2));
     const light=new THREE.DirectionalLight(0xffffff,3);light.position.set(2,3,4);gpuScene.add(light);
     if(renderer){renderer.setSize(width,height,false);renderer.setClearColor(0x10202a);}
     const samples=[],images=[];let gpuFrames=0;
     try{
      for(let frame=0;frame<expected.active;frame++){
       fighter.x=fighter.y=0;fighter.frame=fighter.action.startup+frame;
       const seconds=specialClipTime(spec,expected,fighter.frame,clip.duration),phase=frame/Math.max(1,expected.active-1);
       action.time=seconds;mixer.update(0);avatar.scene.updateMatrixWorld(true);
       const vector=new THREE.Vector3();let reach=-Infinity,strikeHeight=0,leadingPart;
       for(const {mesh,vertices}of surfaces){mesh.skeleton.update();for(const vertex of vertices){mesh.getVertexPosition(vertex.index,vector);vector.applyMatrix4(mesh.matrixWorld);if(vector.z>reach){reach=vector.z;strikeHeight=vector.y;leadingPart=vertex.part;}}}
       const measured=own.activeReach.find(point=>Math.abs(point.phase-phase)<1e-9);
       check(measured&&Math.abs(measured.reach-reach)<.000002&&Math.abs(measured.height-strikeHeight)<.000002&&measured.part===leadingPart,ref+'/'+frame+' selected sampler lost the actually leading hand');
       for(const facing of [1,-1]){
        fighter.facing=facing;foe.y=Math.max(0,strikeHeight-.2);foe.state='idle';foe.input={};
        foe.x=facing*(Math.max(0,reach)+.16-.003);check(probe._contact(fighter,foe,fighter.action),ref+'/'+frame+'/'+facing+' actual inside must contact');
        foe.x=facing*(Math.max(0,reach)+.16+.003);check(!probe._contact(fighter,foe,fighter.action),ref+'/'+frame+'/'+facing+' actual outside must miss');
       }
       let visiblePixels=0;
       if(renderer){
        camera.position.set(1.3+frame*.015,.85,1.8);camera.lookAt(0,.35,.12);renderer.render(gpuScene,camera);
        renderer.getContext().readPixels(0,0,width,height,renderer.getContext().RGBA,renderer.getContext().UNSIGNED_BYTE,pixels);
        for(let i=4;i<pixels.length;i+=4)if(Math.abs(pixels[i]-pixels[0])+Math.abs(pixels[i+1]-pixels[1])+Math.abs(pixels[i+2]-pixels[2])>12)visiblePixels++;
        check(visiblePixels>100,ref+'/'+frame+' WebGL rendered no visible custom model');gpuFrames++;
        if([0,Math.floor((expected.active-1)/2),expected.active-1].includes(frame))images.push({name:baseId+'-s3-active-'+frame+'.png',dataURL:renderer.domElement.toDataURL('image/png')});
       }
       samples.push({frame,phase,seconds,reach,height:strikeHeight,leadingPart,visiblePixels});
      }
     }finally{mixer.stopAllAction();mixer.uncacheRoot(avatar.scene);gpuScene.remove(avatar.scene);renderer?.dispose();}
     check(new Set(samples.map(sample=>sample.leadingPart)).size===2,ref+' probe failed to exercise the leading-hand switch');
     result.nativeSpecialCases.push({ref,baseId,styleId:definition.combat.styleId,actualSourceClip:spec.actualSourceClip,sourceFile:spec.sourceFile,sourceVersion:spec.sourceVersion,samples,gpuFrames,images});
    }
    result.rigCases.push({baseId,hurtBounds:measurement.hurtBounds});
   }finally{avatar.dispose();}
  }
  return result;
 },undefined,{timeout:180000});
 assert.equal(report.normalCases.length,54);assert.equal(report.projectileCases.length,54);assert.equal(report.rigCases.length,9);
 if(report.specialVersion!=='v14'){
  assert.equal(report.nativeSpecialCases.length,2,'missing actual custom two-hand probes');
  for(const row of report.nativeSpecialCases){
   assert.equal(row.samples.length,9);assert.equal(row.gpuFrames,row.samples.length,'native custom special did not render every actual active frame');
   for(const image of row.images)await writeFile(output+'/'+image.name,Buffer.from(image.dataURL.split(',')[1],'base64'));
   row.images=row.images.map(image=>image.name);
  }
 }
 await writeFile(output+'/report.json',JSON.stringify({...report,errors},null,2));
 if(await page.locator('#p4-editor-tab-1').count())await page.locator('#p4-editor-tab-1').click();else await page.locator('#editor details').nth(1).locator('summary').click();
 for(const baseId of ['moguzo','godan','bullet']){
  await page.locator('#avatar-base').selectOption(baseId);
  await page.locator('#avatar-name').fill('検証 '+baseId);
  if(await page.locator('#p4-editor-tab-0').count())await page.locator('#p4-editor-tab-0').click();
  await page.locator('#part-head').selectOption(baseId==='godan'?'pisuke':'godan');
  if(await page.locator('#p4-editor-tab-1').count())await page.locator('#p4-editor-tab-1').click();
  await page.locator('#avatar-pattern').selectOption('spots');
  await page.locator('#color-fur').fill('#397db9');
  await page.waitForFunction(id=>{const d=mamokenStory.player?.definition;return d?.appearance.baseId===id&&d.name==='検証 '+id&&d.appearance.parts.head===(id==='godan'?'pisuke':'godan')&&d.appearance.pattern==='spots'&&d.appearance.palette.fur==='#397db9';},baseId,{timeout:60000});
  await page.screenshot({path:output+'/'+baseId+'-custom-webgl.png'});
 }
 assert.deepEqual(errors,[]);
 await writeFile(output+'/report.json',JSON.stringify({...report,errors},null,2));
 console.log('V16 CUSTOM COMBAT WEBGL PASS: 9 measured rigs, 54 normal surface boundaries, 54 real selected mixed-projectile hits/retargets/sockets, Haku/Dark two-hand active-frame WebGL/contact probes, three custom WebGL previews');
}catch(error){await page.screenshot({path:output+'/failure.png'}).catch(()=>{});throw error;}
finally{await browser.close();}
