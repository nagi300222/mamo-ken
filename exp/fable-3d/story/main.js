import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {clone as cloneSkeleton} from 'three/addons/utils/SkeletonUtils.js';
import {ROSTER,IDS,FPS,ARENA} from '../dojo/balance.js';
import {chooseClip} from '../dojo/models.js';
import {normalClipTime} from '../dojo/normal-timing-v151.js';
import {bindMorphTargets} from '../dojo/morph-binding.js';
import {createCombatAudio} from '../dojo/combat-audio.js';
import {createShowtimeLoader} from '../dojo/showtime-assets.js';
import {createAuthoredCinematic} from '../dojo/authored-cinematic.js';
import {shouldRotateLandscape,localStickAxes} from '../dojo/landscape-lock.js';
import * as Avatar from '../custom/v16/avatar-factory.js';
import {normalizeAvatar,validateAvatar,createDefaultAvatar,createSeededMob} from '../custom/v16/avatar-schema.js';
import {createCustomBattle,moveCatalog,validateCombatLoadout} from '../custom/v16/custom-combat.js';
import {retargetCustomClip} from '../custom/v16/custom-animation.js';
import {freshProgress,NPCS,mobPlacements,moveInVillage,nearestNpc,readSave,writeSave,recordEncounter} from './story-state.js';
import {createVillage,createBattleStage} from './village-scene.js';
import {createExplorationControls,EXPLORATION_CAMERA} from './exploration-controls.js';
import {BATTLE_INPUT_PROFILE,createCombatInput,battleHUDMarkup,battleControlsMarkup,battleStepsMarkup,updateBattleHUD as syncBattleHUD} from '../shared-ui/battle-ui.js';

const storage={getItem:key=>localStorage.getItem(key),setItem:(key,value)=>localStorage.setItem(key,value)};
const $=id=>document.getElementById(id),app=$('story-app'),canvas=$('world');
$('battle-hud').innerHTML=battleHUDMarkup();$('battle-buttons').innerHTML=battleControlsMarkup();$('battle-steps').innerHTML=battleStepsMarkup();
const exploration=createExplorationControls(),combatInput=createCombatInput();
const loader=new GLTFLoader(),audio=createCombatAudio(),showtimeLoader=createShowtimeLoader(new URL('../cinematic/v14/',import.meta.url));
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
const renderer=(()=>{try{return new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});}catch(error){$('loading-copy').textContent='3Dを開始できません。WebGLが使えるSafari/Chromeで開いてください。';throw error;}})();
renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;
const scene=new THREE.Scene();scene.background=new THREE.Color(0xa8c0bd);scene.fog=new THREE.Fog(0xa8c0bd,7,17);
scene.add(new THREE.HemisphereLight(0xfff3d7,0x4d7866,2.4));const sun=new THREE.DirectionalLight(0xffdfab,2.5);sun.position.set(-3,6,4);scene.add(sun);
const village=createVillage(),arena=createBattleStage();scene.add(village,arena);arena.visible=false;
const camera=new THREE.PerspectiveCamera(43,2,.03,40),battleCamera=new THREE.OrthographicCamera(-1.7,1.7,1,-1,.01,30);
let mode='loading',previousMode=null,rotated=false,paused=false,backgroundPaused=false,last=0,acc=0,previewAngle=0,spinning=false,loadGeneration=0;
let avatar=null,player=null,progress=freshProgress(),npcs=[],nearby=null,dialogueNpc=null,battle=null,combatActors=[],movie=null,finished=false;
let returnPoint=null,storageWarning='',saveReady=false,fpsAt=0,fpsFrames=0;
const state={editorError:'',loading:false,metrics:{fps:0,loadMs:0,geometries:0,textures:0,drawCalls:0},events:[]};
const originalCache=new Map(),showtimeCache=new Map(),npcActors=new Map(),npcPending=new Map(),projectiles=new Map(),impacts=[];
function setStatus(text){$('status').textContent=text;}
function clearInput(){
 for(const node of [document.getElementById('story-stick'),document.getElementById('camera-orbit'),...document.querySelectorAll('[data-control]')])if(node){for(const pointer of [stick.pointer,exploration.snapshot.leftPointer,exploration.snapshot.rightPointer,...held.keys()])if(pointer!==null&&node.hasPointerCapture(pointer))node.releasePointerCapture(pointer);}
 keys.clear();held.clear();queued.clear();combatInput.clear();exploration.clearPointers();stick.x=stick.y=0;stick.pointer=null;$('story-thumb').style.transform='';$('camera-orbit').classList.remove('dragging');document.querySelectorAll('[data-control]').forEach(b=>b.classList.remove('held'));
}
function setMode(next){mode=next;app.dataset.mode=next;clearInput();
 $('editor').hidden=next!=='editor';$('journey').hidden=next!=='explore';$('dialogue').hidden=next!=='dialogue';$('result').hidden=next!=='result';$('loading').hidden=next!=='loading';
 $('input-controls').hidden=!['explore','battle'].includes(next);$('battle-buttons').hidden=next!=='battle';$('battle-hud').hidden=!['battle','movie','result'].includes(next);
 $('movie-ui').hidden=next!=='movie';$('edit').hidden=!['explore','editor'].includes(next);$('save').hidden=next!=='explore';$('pause').hidden=!['explore','battle'].includes(next);
 $('npc-tag').hidden=true;$('talk').hidden=true;$('camera-orbit').hidden=next!=='explore';$('camera-tools').hidden=next!=='explore';$('help').textContent=next==='battle'?'方向＋必殺／↓咆哮 · F前/R後ステップ · M奥義':'左で移動 · 右ドラッグで視点 · Eで会話';
 paused=backgroundPaused||document.hidden||window.mamokenNative?.active===false;$('pause').textContent=paused?'再開':'一時停止';resize();
}
function resize(){
 const coarse=matchMedia('(pointer:coarse)').matches||navigator.maxTouchPoints>0;
 const next=shouldRotateLandscape(innerWidth,innerHeight,coarse);if(next!==rotated){rotated=next;document.documentElement.classList.toggle('landscape-locked',next);clearInput();}
 const width=canvas.clientWidth,height=canvas.clientHeight;if(!width||!height)return;
 renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();
 battleCamera.left=-1.75;battleCamera.right=1.75;battleCamera.top=1.75/(width/height);battleCamera.bottom=-battleCamera.top;battleCamera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(app);addEventListener('resize',resize);addEventListener('orientationchange',resize);
function disposeActor(actor){if(!actor)return;actor.mixer.stopAllAction();actor.mixer.uncacheRoot(actor.model);actor.holder.removeFromParent();actor.avatar.dispose();}
async function original(id){
 if(!originalCache.has(id)&&originalCache.size>=4)originalCache.delete(originalCache.keys().next().value);
 if(!originalCache.has(id))originalCache.set(id,Promise.all([
  loader.loadAsync(new URL(`../chars/${id}/${id}.glb`,import.meta.url).href),
  fetch(new URL(`../chars/${id}/${id}_motions.json`,import.meta.url)).then(r=>{if(!r.ok)throw Error('モーションの読込に失敗');return r.json();}),
  loader.loadAsync(new URL(`../normal/v15/${id}_normals.glb`,import.meta.url).href)
 ]).then(([gltf,meta,normals])=>({gltf,meta,normals})).catch(e=>{originalCache.delete(id);throw e;}));
 return originalCache.get(id);
}
async function showtime(id){
 if(!showtimeCache.has(id)&&showtimeCache.size>=4)showtimeCache.delete(showtimeCache.keys().next().value);
 if(!showtimeCache.has(id))showtimeCache.set(id,(async()=>{
  const source=await original(id),clips=new Map();
  return showtimeLoader(id,async(spec,url)=>{
   let list=source.gltf.animations;if(spec.glb){const path=new URL(spec.glb,url).href;if(!clips.has(path))clips.set(path,loader.loadAsync(path).then(v=>v.animations));list=await clips.get(path);}
   const clip=list.find(c=>c.name===spec.clip);if(!clip)throw Error('技アニメが不足: '+spec.clip);return clip;
  });
 })().catch(e=>{showtimeCache.delete(id);throw e;}));
 return showtimeCache.get(id);
}
async function createActor(definition,{combat=false}={}){
 const av=await Avatar.createAvatar(definition,{loader});
 try{
  const baseId=definition.appearance.baseId,source=await original(baseId),model=av.scene;
  // Factory normals already bind the paw/face stream to every real module.
  // Appending the old two-primitive pack would overwrite those corrected clips.
  const mixer=new THREE.AnimationMixer(model),animations=av.animations??[...source.gltf.animations,...source.normals.animations.map(c=>Avatar.bindAvatarClip(c,av))];
  const clips=Object.fromEntries(animations.map(clip=>[clip.name,bindMorphTargets(clip,model)]));
  const actions=Object.fromEntries(Object.entries(clips).map(([name,clip])=>[name,mixer.clipAction(clip)]));
  const holder=new THREE.Group(),turn=new THREE.Group();turn.add(model);holder.add(turn);
  const actor={avatar:av,definition,baseId,id:definition.combat.styleId,model,gltf:{scene:model,animations:Object.values(clips)},holder,turn,mixer,actions,meta:source.meta,showtime:{},key:'',current:null};
  if(combat){
   const own=await showtime(baseId);actor.showtime={...own};
   for(let slot=0;slot<3;slot++){
    const ref=definition.combat.specials[slot],split=ref.split('.'),entries=await showtime(split[0]);let entry=entries[split[1]];
    if(!entry)throw Error('技素材が不足: '+ref);
    if(split[0]!==baseId){const donor=await original(split[0]);const convert=clip=>clip&&bindMorphTargets(retargetCustomClip(clip,donor.gltf.scene,model,{moveKind:entry.spec.kind??'projectile'}),model);
     entry={...entry,attacker:convert(entry.attacker),start:convert(entry.start)};
    }else entry={...entry};
    const clip=Avatar.bindAvatarClip(entry.start??entry.attacker,av);entry.action=mixer.clipAction(clip);actor.showtime['s'+(slot+1)]=entry;
   }
   // The original nine authored movies remain intact. For a different selected style,
   // cinema intentionally uses the canonical style rig (accepted v16 initial rule).
   actor.showtime.ultimate=(await showtime(definition.combat.styleId)).ultimate;
  }
  return actor;
 }catch(error){av.dispose();throw error;}
}
function playIdle(actor,walking=false,delta=0){
 const name=walking?'walk_f':'idle';if(actor.key!==name){actor.current?.stop();actor.current=actor.actions[name]??actor.actions.idle;actor.current?.reset().setLoop(THREE.LoopRepeat,Infinity).play();actor.key=name;}
 actor.mixer.update(delta);
}
function setNpcList(){npcs=[...NPCS.map(n=>({...n,name:ROSTER[n.id].name,definition:{...createDefaultAvatar(n.id),name:ROSTER[n.id].name}})),...mobPlacements(progress.seed).map(n=>{const definition=createSeededMob(n.seed);return {...n,name:definition.name,definition};})];}
function updateJourney(){
 $('player-label').textContent=avatar.name;$('journey-record').textContent=`${progress.battles}戦 ${progress.wins}勝 · 旅人${progress.seed.toString(16).slice(-4)}`;
 $('task').textContent=progress.battles?'出会った相手との戦績は保存される。ほかのマーモットにも話しかけよう。':'道場前のモグゾーに話しかけてみよう。';
}
function save(){saveReady=true;const error=writeSave(storage,avatar,progress);setStatus(error??'キャラと旅の記録を保存した');return !error;}
let npcRefreshAt=0,npcWanted=new Set();
async function updateNpcModels(now){
 if(now<npcRefreshAt)return;npcRefreshAt=now+500;
 const nearest=[...npcs].sort((a,b)=>Math.hypot(a.x-progress.position.x,a.z-progress.position.z)-Math.hypot(b.x-progress.position.x,b.z-progress.position.z)).slice(0,3);
 const wanted=new Set(nearest.map(n=>n.id));npcWanted=wanted;
 for(const [id,actor] of npcActors)if(!wanted.has(id)){disposeActor(actor);npcActors.delete(id);}
 for(const n of nearest){if(npcActors.has(n.id)||npcPending.has(n.id))continue;
  const promise=createActor(n.definition).then(actor=>{if(!npcWanted.has(n.id)||!['explore','dialogue'].includes(mode)){disposeActor(actor);return;}
   actor.holder.position.set(n.x,0,n.z);actor.turn.rotation.y=Math.atan2(-n.x,-n.z);village.add(actor.holder);npcActors.set(n.id,actor);playIdle(actor);
  }).catch(e=>{console.warn('NPC model',n.id,e);setStatus('一部の住人を読み込めません。近づくと再試行します');}).finally(()=>npcPending.delete(n.id));npcPending.set(n.id,promise);
 }
}
async function enterVillage(){
 if(document.hidden||window.mamokenNative?.active===false)return;
 if(!document.hidden&&window.mamokenNative?.active!==false)backgroundPaused=false;
 clearTimeout(previewTimer);
 const validation=validateCombatLoadout(readForm());if(!validation.ok){$('editor-error').textContent=validation.errors.map(e=>e.message).join(' / ');return;}
 const next=validation.definition??normalizeAvatar(readForm());const token=++loadGeneration;setMode('loading');$('loading-copy').textContent='旅のキャラを準備しています';
 try{const replacement=await createActor(next);if(token!==loadGeneration){disposeActor(replacement);return;}
  disposeActor(player);player=replacement;avatar=next;village.add(player.holder);player.holder.position.set(progress.position.x,0,progress.position.z);player.turn.rotation.y=progress.heading;playIdle(player);exploration.restore(progress.camera);syncCameraTools();
  village.visible=true;arena.visible=false;for(const actor of combatActors)disposeActor(actor);combatActors=[];battle=null;setNpcList();updateJourney();setMode('explore');setStatus(storageWarning);save();
 }catch(error){setMode('editor');$('editor-error').textContent='キャラを準備できません: '+error.message;}
}
function openDialogue(){if(mode!=='explore'||paused||!nearby)return;dialogueNpc=nearby;setMode('dialogue');$('dialogue-name').textContent=nearby.name;
 const old=progress.encounters[nearby.id];$('dialogue-line').textContent=old?.battles?`また来たね。これまで${old.battles}戦、君の${old.wins}勝だ。もう一度、勝負しよう。`:nearby.line;}
function closeDialogue(){dialogueNpc=null;setMode('explore');setStatus('');}
function clearProjectiles(){for(const mesh of projectiles.values())mesh.removeFromParent();projectiles.clear();for(const p of impacts)p.mesh.removeFromParent();impacts.length=0;}
async function startBattle(){
 if(mode!=='dialogue'||!dialogueNpc||document.hidden||window.mamokenNative?.active===false)return;if(!document.hidden&&window.mamokenNative?.active!==false)backgroundPaused=false;audio.unlock();returnPoint={position:{...progress.position},heading:progress.heading,camera:exploration.view};const token=++loadGeneration;setMode('loading');$('loading-copy').textContent='稽古の準備と技の互換性を確認中…';const started=performance.now();
 try{
  const definitions=[avatar,dialogueNpc.definition];const loaded=await Promise.allSettled(definitions.map(def=>createActor(def,{combat:true})));
  const failed=loaded.find(v=>v.status==='rejected');if(failed){for(const v of loaded)if(v.status==='fulfilled')disposeActor(v.value);throw failed.reason;}
  const next=loaded.map(v=>v.value);if(token!==loadGeneration){next.forEach(disposeActor);return;}
  try{const measurements=await Promise.all(next.map(a=>{const measured=Avatar.measureContacts(a.avatar);measured.projectileSockets={};const catalog=moveCatalog(a.definition);for(let slot=0;slot<3;slot++){const ref=a.definition.combat.specials[slot],move=catalog.find(m=>m.ref===ref);if(move?.kind!=='projectile'||!Avatar.measureProjectileSocket)continue;const entry=a.showtime['s'+(slot+1)],clip=entry.action.getClip(),contact=entry.spec.contactSeconds??clip.duration*.3;measured.projectileSockets[ref]=Avatar.measureProjectileSocket(a.avatar,clip,contact);}return measured;}));
   battle=createCustomBattle(avatar,dialogueNpc.definition,1,{measurements});
  }catch(e){next.forEach(disposeActor);throw e;}
  combatActors=next;for(const actor of combatActors)scene.add(actor.holder);clearProjectiles();finished=false;acc=0;
  village.visible=false;arena.visible=true;for(let i=0;i<2;i++)syncCombatActor(combatActors[i],battle.fighters[i]);
  setMode('battle');setStatus('FIGHT！');state.metrics.loadMs=performance.now()-started;updateBattleHUD();last=0;
 }catch(error){setMode('dialogue');setStatus('対戦を準備できません: '+error.message);}
}
function syncCombatActor(actor,fighter){
 const entry=actor.showtime[fighter.action?.id];let name=entry?.action?entry.action.getClip().name:chooseClip(fighter,Object.keys(actor.actions),actor.meta.command_map??{});
 const key=name+':'+(fighter.action?.serial??0)+':'+fighter.state;
 if(actor.key!==key){actor.current?.stop();const next=entry?.action??actor.actions[name]??actor.actions.idle;
  next.reset().setLoop(['idle','walk_f','walk_b','crouch','guard_stand','guard_crouch'].includes(name)?THREE.LoopRepeat:THREE.LoopOnce,Infinity);next.clampWhenFinished=true;next.play();actor.current=next;actor.currentName=name;actor.key=key;
 }
 actor.holder.position.set(fighter.x,fighter.y,0);actor.turn.rotation.set(0,fighter.facing===1?Math.PI/2:-Math.PI/2,0);
 if(fighter.action&&actor.currentName.startsWith('v15_')){
  actor.current.setEffectiveTimeScale(0);actor.current.time=normalClipTime(actor.baseId,fighter.action.id,fighter.frame,fighter.action,actor.current.getClip().duration);actor.mixer.update(0);
 }else if(fighter.action&&entry?.action){
  const m=fighter.action,duration=entry.action.getClip().duration,contact=entry.spec.contactSeconds??duration*m.startup/(m.startup+m.active+m.recovery);
  const seconds=fighter.frame<=m.startup?contact*fighter.frame/m.startup:contact+(duration-contact)*(fighter.frame-m.startup)/(m.active+m.recovery);
  entry.action.setEffectiveTimeScale(0);entry.action.time=Math.min(duration,seconds);actor.mixer.update(0);
 }else if(!fighter.stop)actor.mixer.update(1/FPS);
}
const projectileGeo=new THREE.SphereGeometry(.08,10,7),projectileMat=new THREE.MeshStandardMaterial({color:0xe9c578,emissive:0xbb7b25,emissiveIntensity:.6});
const impactGeo=new THREE.RingGeometry(.055,.09,10),impactMat=new THREE.MeshBasicMaterial({color:0xffdd96,side:THREE.DoubleSide,transparent:true,opacity:.9,depthWrite:false});
function updateProjectiles(){const ids=new Set();for(const p of battle.projectiles){ids.add(p.id);let mesh=projectiles.get(p.id);if(!mesh){mesh=new THREE.Mesh(projectileGeo,projectileMat);projectiles.set(p.id,mesh);scene.add(mesh);}mesh.position.set(p.x,p.y,.02);}for(const [id,mesh]of projectiles)if(!ids.has(id)){mesh.removeFromParent();projectiles.delete(id);}}
function battleEvents(){for(const e of battle.events){state.events.push({...e,frame:battle.frame});if(state.events.length>100)state.events.shift();
 if(e.type==='ultimate_hit'){beginMovie(e);continue;}
 if(['hit','block','ko','throw_pair','gyuiin_start'].includes(e.type)){audio.play(e.type==='block'?'block':e.type==='ko'?'ko':'hit',battle.fighters[e.slot??0].id);
  const p=battle.fighters[e.target??1];const mesh=new THREE.Mesh(impactGeo,impactMat);mesh.position.set(e.x??p.x,e.y??p.y+.35,.2);scene.add(mesh);impacts.push({mesh,life:.18});}
}}
function updateBattleHUD(){syncBattleHUD(app,{battle,names:combatActors.map(a=>a.definition.name),roundLabel:'ROUND 1'});}

function finishRound(){if(finished||movie)return;finished=true;progress=recordEncounter(progress,dialogueNpc.id,battle.winner);
 $('result-title').textContent=battle.winner===0?'その一歩が、力になる。':battle.winner===1?'次は、もう一歩。':'互角の稽古だった。';
 $('result-reason').textContent=battle.events.some(e=>e.type==='timeout')?'TIME UP':battle.winner<0?'DOUBLE K.O.':'K.O.';
 $('result-copy').textContent=`${dialogueNpc.name}との稽古は${progress.lastResult}。${progress.battles}戦を経験し、${progress.wins}勝を重ねた。`;
 save();setMode('result');setStatus('');
}
function returnToVillage(){if(mode!=='result')return;for(const actor of combatActors)disposeActor(actor);combatActors=[];battle=null;clearProjectiles();arena.visible=false;village.visible=true;
 progress.position={...returnPoint.position};progress.heading=returnPoint.heading;exploration.restore(returnPoint.camera);progress.camera=exploration.view;player.holder.position.set(progress.position.x,0,progress.position.z);player.turn.rotation.y=progress.heading;dialogueNpc=null;setMode('explore');syncCameraTools();updateExplorationCamera(0,true);updateJourney();save();}
async function canonicalCinemaActor(styleId){
 // Preserve the original two-primitive film actor exactly. The editor's modular
 // avatar is restored after the movie; it must not silently replace film faces.
 const source=await original(styleId),model=cloneSkeleton(source.gltf.scene),mixer=new THREE.AnimationMixer(model);
 const bind=clip=>clip&&bindMorphTargets(clip,model),holder=new THREE.Group(),turn=new THREE.Group();turn.add(model);holder.add(turn);
 const entries=await showtime(styleId),authored={};
 for(const [key,entry]of Object.entries(entries)){
  if(key==='reactions'){authored[key]=Object.fromEntries(Object.entries(entry).map(([name,clip])=>[name,bind(clip)]));continue;}
  authored[key]={...entry,attacker:bind(entry.attacker),target:bind(entry.target),start:bind(entry.start),
   ...(entry.clips?{clips:Object.fromEntries(Object.entries(entry.clips).map(([name,clip])=>[name,bind(clip)]))}:{})};
 }
 return {id:styleId,baseId:styleId,meta:source.meta,model,holder,turn,mixer,gltf:{scene:model,animations:source.gltf.animations.map(bind)},showtime:authored,
  avatar:{dispose(){const skeletons=new Set();model.traverse(n=>{if(n.isSkinnedMesh)skeletons.add(n.skeleton);});for(const s of skeletons)s.dispose();holder.removeFromParent();}}};
}
let cinemaActors=[];
async function beginMovie(event){
 if(movie||mode==='movie')return;const token=++loadGeneration;setMode('movie');setStatus('');$('movie-caption').textContent='';
 try{
  const attacker=combatActors[event.slot],target=combatActors[event.target];
  // Rest-pose/appearance swaps require retargeted movie shots not yet certified.
  // Use the selected style's original actor for this one legacy movie only.
  const sources=await Promise.all([canonicalCinemaActor(attacker.id),canonicalCinemaActor(target.id)]);
  if(token!==loadGeneration){sources.forEach(disposeActor);return;}
  cinemaActors=sources;const entry=sources[0].showtime.ultimate;
  movie=createAuthoredCinematic({entry,attacker:sources[0],target:sources[1],mirror:battle.fighters[event.slot].facing<0,background:0x182b2b,lights:scene.children.filter(x=>x.isLight),reducedMotion,visualCue:()=>{},audioCue:kind=>audio.play(kind,attacker.id)});
 }catch(error){console.warn('story cinema',error);setStatus('奥義映像を終了しました。対戦に復帰します');finishMovie();}
}
function finishMovie(){loadGeneration++;movie?.dispose();movie=null;cinemaActors.forEach(disposeActor);cinemaActors=[];setMode('battle');last=0;acc=0;if(battle?.phase==='ko')finishRound();}
function formOptions(select,items){select.replaceChildren(...items.map(item=>{const option=document.createElement('option');option.value=item.id;option.textContent=item.label??item.name??item.id;return option;}));}
const partLabels={head:'頭',ears:'耳',tail:'尻尾',hands:'手・前脚',feet:'足・後脚',accessory:'装飾'};
const colorLabels={fur:'毛',belly:'腹',muzzle:'口元',paw:'手',foot:'足',ear:'耳の内側',tail:'尻尾',accent:'装飾',pattern:'模様'};
function buildForm(){
 formOptions($('avatar-base'),IDS.map(id=>({id,label:ROSTER[id].name})));formOptions($('avatar-style'),IDS.map(id=>({id,label:ROSTER[id].name+' · '+ROSTER[id].role})));
 const partSpec=Avatar.AVATAR_PARTS??Object.fromEntries(Object.keys(partLabels).map(slot=>[slot,IDS.map(id=>({id,label:ROSTER[id].name}))]));
 for(const [slot,label]of Object.entries(partLabels)){const field=document.createElement('label');field.textContent=label;const select=document.createElement('select');select.id='part-'+slot;field.append(select);formOptions(select,partSpec[slot]??IDS.map(id=>({id,label:ROSTER[id].name})));$('part-fields').append(field);}
 for(const [key,label]of Object.entries(colorLabels)){const field=document.createElement('label');field.textContent=label;const input=document.createElement('input');input.type='color';input.id='color-'+key;field.append(input);$('color-fields').append(field);}
 formOptions($('avatar-pattern'),Avatar.AVATAR_PATTERNS);
 for(let i=0;i<3;i++){const field=document.createElement('label');field.textContent=['基本必殺（N）','対空必殺（↑）','攻め必殺（前）'][i];const select=document.createElement('select');select.id='move-'+i;field.append(select);$('move-fields').append(field);}
}
function readForm(){const definition=structuredClone(avatar??createDefaultAvatar($('avatar-base').value));definition.name=$('avatar-name').value.trim()||'旅のマーモット';definition.appearance.baseId=$('avatar-base').value;
 definition.appearance.parts=Object.fromEntries(Object.keys(partLabels).map(slot=>[slot,$('part-'+slot).value]));definition.appearance.palette=Object.fromEntries(Object.keys(colorLabels).map(key=>[key,$('color-'+key).value]));definition.appearance.pattern=$('avatar-pattern').value;
 definition.combat.styleId=$('avatar-style').value;definition.combat.specials=[0,1,2].map(i=>$('move-'+i).value);return definition;}
function updatePartCompatibility(){const longTail=$('avatar-base').value==='bullet';for(const option of $('part-tail').options)option.disabled=option.value!=='base'&&((option.value==='bullet')!==longTail);}
function fillForm(definition){avatar=definition;$('avatar-name').value=definition.name;$('avatar-base').value=definition.appearance.baseId;$('avatar-style').value=definition.combat.styleId;
 for(const slot of Object.keys(partLabels))$('part-'+slot).value=definition.appearance.parts?.[slot]??'base';
 for(const key of Object.keys(colorLabels))$('color-'+key).value=definition.appearance.palette?.[key]??'#a78254';$('avatar-pattern').value=definition.appearance.pattern??'solid';updateMoveOptions(definition.combat.specials);updatePartCompatibility();
}
function updateMoveOptions(selected=[0,1,2].map(i=>$('move-'+i).value)){
 const candidate=readForm();candidate.combat.specials=candidate.combat.specials.map((ref,i)=>/^[a-z_]+\.s[123]$/.test(ref)?ref:createDefaultAvatar(candidate.appearance.baseId).combat.specials[i]);const catalog=moveCatalog(candidate);for(let i=0;i<3;i++){const select=$('move-'+i);select.replaceChildren(...catalog.map(move=>{const option=document.createElement('option');option.value=move.ref;option.textContent=move.name+(move.supported?'':'（未対応）');option.disabled=!move.supported;option.title=move.reason??'';return option;}));
  select.value=selected[i]??'';if(!select.value){const placeholder=document.createElement('option');placeholder.value='';placeholder.textContent='対応する技を選択';placeholder.selected=true;select.prepend(placeholder);}
 }
 const selectedMoves=selected.map(ref=>catalog.find(m=>m.ref===ref));$('compatibility').textContent=selectedMoves.some(m=>!m?.supported)?'外見・骨格に合わせ、未対応になった技を選び直してください。技は自動で置き換えません。':'別スタイルの対応技を組み合わせられます。奥義は選択スタイルの既存映像を使用（映像中は元の姿）。';
}
let previewTimer;
async function refreshPreview(){
 if(mode!=='editor')return;
 const token=++loadGeneration;const candidate=readForm();$('editor-error').textContent='';
 try{const actor=await createActor(candidate);if(token!==loadGeneration||mode!=='editor'){disposeActor(actor);return;}disposeActor(player);player=actor;scene.add(player.holder);player.holder.position.set(.8,0,0);player.turn.rotation.y=previewAngle;playIdle(player);setStatus('');}
 catch(error){if(token===loadGeneration)$('editor-error').textContent='プレビュー: '+error.message;}
}
function editAvatar(){if(!['explore','editor'].includes(mode))return;clearTimeout(previewTimer);loadGeneration++;village.visible=false;arena.visible=false;for(const actor of npcActors.values())actor.holder.visible=false;setMode('editor');fillForm(avatar);refreshPreview();}
$('avatar-form').addEventListener('input',event=>{if(event.target.type==='color'){clearTimeout(previewTimer);previewTimer=setTimeout(refreshPreview,220);}});
$('avatar-form').addEventListener('change',event=>{
 if(event.target.id==='avatar-base'){for(const slot of Object.keys(partLabels))$('part-'+slot).value='base';}
 if(event.target.tagName==='SELECT'){updatePartCompatibility();updateMoveOptions();clearTimeout(previewTimer);previewTimer=setTimeout(refreshPreview,60);}
});
$('avatar-form').addEventListener('submit',event=>{event.preventDefault();audio.unlock();enterVillage();});$('preview-turn').onclick=()=>spinning=!spinning;
$('edit').onclick=editAvatar;$('save').onclick=save;$('talk').onclick=openDialogue;$('talk').addEventListener('pointerdown',event=>{if(mode!=='explore'||paused)return;event.preventDefault();openDialogue();});$('talk-close').onclick=closeDialogue;$('challenge').onclick=startBattle;$('return').onclick=returnToVillage;$('movie-skip').onclick=finishMovie;
$('sound').onclick=()=>{audio.unlock();const muted=audio.setMuted(!audio.muted);$('sound').textContent=muted?'音 OFF':'音 ON';};
$('pause').onclick=()=>{if(!['explore','battle'].includes(mode)||document.hidden||window.mamokenNative?.active===false)return;paused=!paused;if(!paused)backgroundPaused=false;clearInput();$('pause').textContent=paused?'再開':'一時停止';setStatus(paused?'一時停止':'');};
const keys=new Set(),held=new Map(),queued=new Set(),stick={pointer:null,x:0,y:0};
const keyMap=BATTLE_INPUT_PROFILE.keyMap;
addEventListener('keydown',event=>{
 if(event.target.matches('input,select,textarea')||mode==='editor')return;
 if(event.code==='Escape'){if(mode==='dialogue')closeDialogue();else if(mode==='movie')finishMovie();return;}
 if(event.code==='KeyE'&&mode==='explore'){event.preventDefault();openDialogue();return;}
 if(!['explore','battle'].includes(mode)||paused)return;
 const key=keyMap[event.code];if(key){event.preventDefault();if(event.repeat)return;keys.add(key);if(mode==='battle')combatInput.keyDown(event.code);}
});addEventListener('keyup',event=>{const key=keyMap[event.code];if(key){keys.delete(key);combatInput.keyUp(event.code);}});
const joystick=$('story-stick');
function pointerPoint(event){const box=app.getBoundingClientRect();return rotated?{x:event.clientY-box.top,y:box.right-event.clientX}:{x:event.clientX-box.left,y:event.clientY-box.top};}
function stickMove(event){const b=joystick.getBoundingClientRect(),axes=localStickAxes(event.clientX-b.x-b.width/2,event.clientY-b.y-b.height/2,Math.min(b.width,b.height)*.34,rotated);
 if(mode==='battle'){const value=combatInput.setAnalog(axes.x,axes.y);stick.x=value.x;stick.y=value.y;}
 else{exploration.move(event.pointerId,axes.x,axes.y);const value=exploration.snapshot.stick;stick.x=value.x;stick.y=value.y;}
 $('story-thumb').style.transform=`translate(${stick.x*30}px,${stick.y*30}px)`;
}
joystick.addEventListener('pointerdown',event=>{if(!['explore','battle'].includes(mode)||stick.pointer!==null||paused)return;if(mode==='explore'&&!exploration.beginMove(event.pointerId))return;event.preventDefault();stick.pointer=event.pointerId;joystick.setPointerCapture(event.pointerId);stickMove(event);});
joystick.addEventListener('pointermove',event=>{if(event.pointerId===stick.pointer){event.preventDefault();stickMove(event);}});
for(const type of ['pointerup','pointercancel','lostpointercapture'])joystick.addEventListener(type,event=>{if(event.pointerId===stick.pointer){stick.pointer=null;stick.x=stick.y=0;exploration.endMove(event.pointerId);combatInput.setAnalog(0,0);$('story-thumb').style.transform='';}});
const orbitPad=$('camera-orbit');orbitPad.addEventListener('pointerdown',event=>{if(mode!=='explore'||paused)return;const point=pointerPoint(event);if(!exploration.beginOrbit(event.pointerId,point.x,point.y))return;event.preventDefault();orbitPad.setPointerCapture(event.pointerId);orbitPad.classList.add('dragging');});
orbitPad.addEventListener('pointermove',event=>{if(mode!=='explore'||paused)return;const point=pointerPoint(event);if(exploration.orbit(event.pointerId,point.x,point.y))event.preventDefault();});
for(const type of ['pointerup','pointercancel','lostpointercapture'])orbitPad.addEventListener(type,event=>{if(exploration.endOrbit(event.pointerId))orbitPad.classList.remove('dragging');});
for(const node of [orbitPad,joystick])node.addEventListener('contextmenu',event=>event.preventDefault());
for(const button of document.querySelectorAll('[data-control]')){button.addEventListener('pointerdown',event=>{if(mode!=='battle'||paused)return;event.preventDefault();button.setPointerCapture(event.pointerId);held.set(event.pointerId,button.dataset.control);combatInput.hold(event.pointerId,button.dataset.control);button.classList.add('held');});for(const type of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(type,event=>{held.delete(event.pointerId);combatInput.release(event.pointerId);button.classList.remove('held');});button.addEventListener('contextmenu',event=>event.preventDefault());}
function controls(){return combatInput.consume();}
function syncCameraTools(){const value=exploration.view.follow;$('camera-follow').setAttribute('aria-pressed',String(value));$('camera-follow').textContent='後方追従 '+(value?'ON':'OFF');}
$('camera-reset').onclick=()=>{if(mode!=='explore'||paused)return;exploration.resetView(progress.heading);updateExplorationCamera(0,true);};
$('camera-follow').onclick=()=>{if(mode!=='explore'||paused)return;exploration.setFollow(!exploration.view.follow);syncCameraTools();};
function updateExplorationCamera(delta,snap=false){const view=exploration.view,distance=EXPLORATION_CAMERA.distance,flat=distance*Math.cos(view.pitch);
 const position=new THREE.Vector3(progress.position.x+Math.sin(view.yaw)*flat,.35+Math.sin(view.pitch)*distance,progress.position.z+Math.cos(view.yaw)*flat);
 camera.position.lerp(position,snap||reducedMotion?1:Math.min(1,delta*10));camera.lookAt(progress.position.x,.35,progress.position.z);
}
function pauseForBackground(){backgroundPaused=true;if(mode==='movie')finishMovie();clearInput();last=0;acc=0;if(['battle','explore'].includes(mode)){paused=true;$('pause').textContent='再開';setStatus('一時停止');}if(avatar&&saveReady){progress.camera=exploration.view;writeSave(storage,avatar,progress);}}
addEventListener('mamoken:native-state',event=>{if(event.detail?.active===false)pauseForBackground();else last=0;});
addEventListener('blur',pauseForBackground);document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseForBackground();else last=0;});
function render(now){requestAnimationFrame(render);const elapsed=last?Math.max(0,(now-last)/1000):1/FPS,delta=Math.min(.05,elapsed);last=now;
 if(mode==='editor'&&player){if(spinning)previewAngle+=delta*.6;player.turn.rotation.y=previewAngle;playIdle(player,false,delta);camera.position.set(.15,.60,1.65);camera.lookAt(.15,.34,0);}
 if(['explore','dialogue'].includes(mode)&&player){
  if(mode==='explore'&&!paused){const direction=exploration.movement(Object.fromEntries([...keys].map(key=>[key,true])));
   const before=progress.position;progress.position=moveInVillage(before,direction,delta);const dx=progress.position.x-before.x,dz=progress.position.z-before.z,moving=Math.hypot(dx,dz)>1e-5;
   if(moving)progress.heading=Math.atan2(dx,dz);exploration.update(delta,progress.heading,moving);progress.camera=exploration.view;player.holder.position.set(progress.position.x,0,progress.position.z);player.turn.rotation.y=progress.heading;playIdle(player,moving,delta);updateNpcModels(now);
   nearby=nearestNpc(progress.position,npcs,1.05);$('talk').hidden=!nearby;$('npc-tag').hidden=!nearby;if(nearby){$('npc-name').textContent=nearby.name;const e=progress.encounters[nearby.id];$('npc-record').textContent=e?`${e.battles}戦 ${e.wins}勝`:'話しかけられる';}
  }
  for(const actor of npcActors.values()){actor.holder.visible=true;playIdle(actor,false,paused?0:delta);}
  if(!paused)updateExplorationCamera(delta);
 }
 if(mode==='battle'&&battle&&!paused){acc=Math.min(.1,acc+delta);let ticks=0;while(acc>=1/FPS&&ticks<5&&mode==='battle'&&battle.phase==='fight'){
  battle.tick(controls());for(let i=0;i<2;i++)syncCombatActor(combatActors[i],battle.fighters[i]);updateProjectiles();battleEvents();acc-=1/FPS;ticks++;
 }updateBattleHUD();if(battle.phase==='ko'&&mode==='battle')finishRound();}
 for(let i=impacts.length-1;i>=0;i--){const p=impacts[i];p.life-=delta;p.mesh.scale.multiplyScalar(1+delta*4);if(p.life<=0){p.mesh.removeFromParent();impacts.splice(i,1);}}
 if(mode==='movie'){if(movie&&!document.hidden){try{const frame=movie.update(elapsed,canvas.clientWidth/Math.max(1,canvas.clientHeight));$('movie-caption').textContent=frame.caption;renderer.render(frame.scene,frame.camera);if(frame.ended)finishMovie();return;}catch(error){console.warn(error);finishMovie();}}else if(!movie){renderer.render(scene,battleCamera);return;}}
 const battleView=['battle','movie','result'].includes(mode);if(battleView&&battle){const center=(battle.fighters[0].x+battle.fighters[1].x)*.5,width=Math.max(1.35,Math.abs(battle.fighters[0].x-battle.fighters[1].x)*.6+.65),ratio=canvas.clientWidth/Math.max(1,canvas.clientHeight);battleCamera.left=-width;battleCamera.right=width;battleCamera.top=width/ratio;battleCamera.bottom=-width/ratio;battleCamera.position.set(center,1.08,5.5);battleCamera.lookAt(center,.35,0);battleCamera.updateProjectionMatrix();}
 renderer.render(scene,battleView?battleCamera:camera);fpsFrames++;if(now-fpsAt>1000){state.metrics.fps=Math.round(fpsFrames*1000/(now-fpsAt));fpsAt=now;fpsFrames=0;Object.assign(state.metrics,renderer.info.memory,{drawCalls:renderer.info.render.calls});$('perf').textContent=`${state.metrics.fps} FPS · ${npcActors.size}人表示`;}
}
async function boot(){await window.mamokenNative?.ready;buildForm();const saved=readSave(storage,normalizeAvatar);storageWarning=saved.error??'';saveReady=!!saved.save;avatar=saved.save?.avatar??createDefaultAvatar('moguzo');progress=saved.save?.progress??freshProgress();fillForm(avatar);village.visible=false;setMode('editor');resize();requestAnimationFrame(render);await refreshPreview();setStatus(storageWarning);}
window.mamokenStory={get mode(){return mode;},get previewReady(){return mode==='editor'&&player?.holder.parent===scene;},get player(){return player;},get avatar(){return avatar;},get progress(){return structuredClone(progress);},get battle(){return battle;},get actors(){return combatActors;},get nearby(){return nearby;},get npcs(){return npcs.map(({definition,...n})=>n);},get metrics(){return {...state.metrics,npcModels:npcActors.size};},get cinematic(){return {active:mode==='movie',elapsed:movie?.elapsed??0};},get landscapeLocked(){return rotated;},get controls(){return {exploration:exploration.snapshot,battle:combatInput.snapshot,paused};},get events(){return [...state.events];},save,openDialogue,returnToVillage};
boot().catch(error=>{$('loading').hidden=false;$('loading-copy').textContent='起動できません: '+error.message;console.error(error);});
