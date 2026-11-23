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
page.on('response',response=>{if(response.status()>=400&&!response.url().endsWith('favicon.ico'))errors.push(response.status()+' '+response.url());});
try{
 await page.goto(root,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.mamokenStory?.mode==='editor'&&mamokenStory.player,undefined,{timeout:60000});
 const report=await page.evaluate(async()=>{
  const A=await import('../custom/v16/avatar-factory.js'),S=await import('../custom/v16/avatar-schema.js'),C=await import('../custom/v16/custom-combat.js'),R=await import('../custom/v16/custom-animation.js');
  const {IDS,ROSTER,specialMove}=await import('../dojo/balance.js');
  const {NORMAL_CONTACTS}=await import('../dojo/normal-contacts-v151.js');
  const {GLTFLoader}=await import('three/addons/loaders/GLTFLoader.js');
  const THREE=await import('three'),loader=new GLTFLoader();
  const check=(condition,message)=>{if(!condition)throw Error(message);};
  const sources=IDS.filter(id=>ROSTER[id].specials[0].kind==='projectile'),donors={};
  for(const id of sources){
   const [original,pack,manifest]=await Promise.all([
    loader.loadAsync(new URL(`../chars/${id}/${id}.glb`,location.href).href),
    loader.loadAsync(new URL(`../cinematic/v14/${id}/${id}_animations.glb`,location.href).href),
    fetch(new URL(`../cinematic/v14/${id}/manifest.json`,location.href)).then(r=>r.json())
   ]);
   const spec=manifest.moves.find(move=>move.moveId==='s1'),clip=pack.animations.find(clip=>clip.name===spec.animationSources.attacker.clip);
   check(clip,`missing source clip ${id}`);donors[id]={original,clip,spec};
  }
  const result={normalCases:[],projectileCases:[],rigCases:[],errors:[]};
  for(const [targetIndex,baseId]of IDS.entries()){
   const definition=S.createDefaultAvatar(baseId),avatar=await A.createAvatar(definition,{loader});
   try{
    const measurement=A.measureContacts(avatar);
    check(measurement.source==='runtime-skinned-mesh',baseId+' is not skinned-surface measured');
    definition.combat.styleId=IDS[(targetIndex+3)%IDS.length];definition.combat.specials=['moguzo.s1','pisuke.s1','bullet.s1'];
    let battle=C.createCustomBattle(definition,'pisuke',1,{measurements:[measurement]});
    for(const [slot,contact]of Object.entries(measurement.normals)){
     const original=NORMAL_CONTACTS[baseId][slot];
     check(Math.abs(contact.reach-original.reach)<.02,baseId+'/'+slot+' native surface drift');
     const fighter=battle.fighters[0],foe=battle.fighters[1];fighter.action=null;fighter.stop=0;fighter.stun=0;fighter.y=0;fighter.frame=0;fighter.x=0;fighter.facing=1;
     check(battle._begin(fighter,{},slot),baseId+'/'+slot+' did not resolve');fighter.frame=fighter.action.startup;
     check(Math.abs(fighter.action.reach-contact.reach)<1e-6,'move ignored avatar surface');
     foe.x=fighter.action.activeReach[0].reach+.16-.003;foe.y=contact.height;foe.state='idle';
     check(battle._contact(fighter,foe,fighter.action),baseId+'/'+slot+' contact inside must land');
     foe.x=fighter.action.activeReach[0].reach+.16+.003;
     check(!battle._contact(fighter,foe,fighter.action),baseId+'/'+slot+' contact outside must miss');
     result.normalCases.push({baseId,styleId:definition.combat.styleId,slot,reach:contact.reach,height:contact.height});
    }
    for(const sourceId of sources){
     const {original,clip,spec}=donors[sourceId];
     const converted=R.retargetCustomClip(clip,original.scene,avatar.scene,{moveKind:'projectile'});
     check(converted.tracks.every(track=>[...track.values].every(Number.isFinite)),sourceId+' -> '+baseId+' non-finite retarget');
     const socket=A.measureProjectileSocket(avatar,converted,spec.contactSeconds??converted.duration*.45);
     check(socket.source==='runtime-bone-world-position',sourceId+' -> '+baseId+' missing measured socket');
     measurement.projectileSockets={[sourceId+'.s1']:socket};
     definition.combat.specials[0]=sourceId+'.s1';
     battle=C.createCustomBattle(definition,'pisuke',1,{measurements:[measurement]});
     const [player,foe]=battle.fighters;player.x=-.45;foe.x=.60;foe.ability.grit=false;
     let spawned=null,hits=0,damage=0;
     battle.tick({special1:true},{});
     check(player.action.sourceCharacterId===sourceId,'foreign source move was not equipped');
     for(let i=0;i<180;i++){
      battle.tick({},{});
      if(!spawned&&battle.projectiles.length)spawned={...battle.projectiles[0],playerX:player.x};
      for(const event of battle.events)if(event.type==='hit'){hits++;damage+=event.damage;}
     }
     const expected=specialMove(sourceId,0);
     check(spawned,sourceId+' -> '+baseId+' projectile never spawned');
     check(Math.abs(spawned.y-socket.height)<1e-6,'projectile ignored measured height');
     check(Math.abs(spawned.x-(spawned.playerX+socket.forward+expected.speed))<1e-6,'projectile ignored measured origin');
     check(hits===1&&damage===expected.damage,sourceId+' -> '+baseId+' expected single unblocked hit');
     const mixer=new THREE.AnimationMixer(avatar.scene),action=mixer.clipAction(converted);action.play();action.time=spec.contactSeconds??converted.duration*.45;mixer.update(0);avatar.scene.updateMatrixWorld(true);
     const point=new THREE.Vector3();let vertices=0;
     avatar.scene.traverse(mesh=>{if(!mesh.isSkinnedMesh)return;for(let i=0;i<mesh.geometry.attributes.position.count;i+=83){mesh.getVertexPosition(i,point);check([point.x,point.y,point.z].every(Number.isFinite),'non-finite skinned animation vertex');vertices++;}});
     mixer.stopAllAction();mixer.uncacheRoot(avatar.scene);
     result.projectileCases.push({sourceId,baseId,styleId:definition.combat.styleId,hits,damage,socket,boneTracks:converted.tracks.length,vertices});
    }
    result.rigCases.push({baseId,hurtBounds:measurement.hurtBounds});
   }finally{avatar.dispose();}
  }
  return result;
 },undefined,{timeout:180000});
 assert.equal(report.normalCases.length,54);assert.equal(report.projectileCases.length,54);assert.equal(report.rigCases.length,9);
 await writeFile(output+'/report.json',JSON.stringify({...report,errors},null,2));
 const tabbedEditor=await page.locator('#p4-editor-tab-0').count()>0;
 if(!tabbedEditor)await page.locator('#editor details').nth(1).locator('summary').click();
 for(const baseId of ['moguzo','godan','bullet']){
  if(tabbedEditor)await page.locator('#p4-editor-tab-0').click();
  await page.locator('#avatar-base').selectOption(baseId);
  await page.locator('#avatar-name').fill('検証 '+baseId);
  await page.locator('#part-head').selectOption(baseId==='godan'?'pisuke':'godan');
  if(tabbedEditor)await page.locator('#p4-editor-tab-1').click();
  await page.locator('#avatar-pattern').selectOption('spots');
  await page.locator('#color-fur').fill('#397db9');
  await page.waitForFunction(id=>{const d=mamokenStory.player?.definition;return d?.appearance.baseId===id&&d.name==='検証 '+id&&d.appearance.parts.head===(id==='godan'?'pisuke':'godan')&&d.appearance.pattern==='spots'&&d.appearance.palette.fur==='#397db9';},baseId,{timeout:60000});
  await page.screenshot({path:output+'/'+baseId+'-custom-webgl.png'});
 }
 assert.deepEqual(errors,[]);
 await writeFile(output+'/report.json',JSON.stringify({...report,errors},null,2));
 console.log('V16 CUSTOM COMBAT WEBGL PASS: 9 measured rigs, 54 normal surface boundaries, 54 real mixed-projectile hits/retargets/sockets, three custom WebGL previews');
}catch(error){await page.screenshot({path:output+'/failure.png'}).catch(()=>{});throw error;}
finally{await browser.close();}
