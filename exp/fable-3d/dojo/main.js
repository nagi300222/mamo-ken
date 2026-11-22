import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js';
import { createChirkaIllusions } from './showtime-illusions.js';
import { Battle, DRIVE } from './battle.js';
import { ROSTER, IDS, FPS, ARENA } from './balance.js';
import { MODEL_ASSETS, MODEL_REVISION, chooseClip } from './models.js';
import { frameTargets } from './camera-frame.js';
import { showtimeFor, showtimeHex, superCaption, isShowtimeMove } from './showtime-profiles.js';
import { createCombatAudio } from './combat-audio.js';
import { createArenaMusic } from './arena-music.js';
import { hudTheme, isSuperReady, chargePips } from './hud-themes.js';
import { createMovieDirector, movieScript } from './ultimate-cinematic.js';
import { createShowtimeLoader } from './showtime-assets.js';
import { createAuthoredCinematic } from './authored-cinematic.js';
import { bindMorphTargets } from './morph-binding.js';
import { shouldRotateLandscape, localStickAxes } from './landscape-lock.js';
import { createPracticeController } from './practice-mode.js';

const $=id=>document.getElementById(id), canvas=$('stage');
let gameRotated=false;
function updateLandscapeLock(){
  // Safari cannot be relied on to override the iOS rotation-lock switch.
  // Rotate the entire Web game, never the OS viewport or touch targets individually.
  const touchDevice=window.matchMedia?.('(pointer: coarse)')?.matches ||
    (navigator.maxTouchPoints||0)>0;
  const next=shouldRotateLandscape(window.innerWidth,window.innerHeight,touchDevice);
  if(next===gameRotated)return;
  gameRotated=next;
  document.documentElement.classList.toggle('landscape-locked',next);
  clearInput(); // discard joystick presses captured in the previous coordinate space
  requestAnimationFrame(resize); // WebGL draws using CSS layout dimensions, not transformed bounds
}
const scene=new THREE.Scene();scene.background=new THREE.Color(0x758993);
const camera=new THREE.OrthographicCamera(-1.4,1.4,1,-1,.01,30);
const cameraPose={x:0,y:.5,halfWidth:1.4};
camera.position.set(0,1.2,5.5);camera.lookAt(0,.5,0);
const renderer=(()=>{try{return new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});}
catch(error){$('loading-status').textContent='3D表示を開始できません。Safari/Chromeで開き直してください。';$('start').disabled=true;throw error;}})();
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));
renderer.outputColorSpace=THREE.SRGBColorSpace;
scene.add(new THREE.HemisphereLight(0xe5f7ff,0x8f796a,2.25));
const sun=new THREE.DirectionalLight(0xffecd0,2.45);sun.position.set(-1.2,2.8,2.9);scene.add(sun);
const ambient=new THREE.DirectionalLight(0x9cb2cf,.6);ambient.position.set(2,1,-3);scene.add(ambient);

const environment=new THREE.Group();scene.add(environment);
const floor=new THREE.Mesh(new THREE.PlaneGeometry(7,4),new THREE.MeshStandardMaterial({color:0x6e776a,roughness:.98}));
floor.rotation.x=-Math.PI/2;floor.position.y=-.018;environment.add(floor);
const pattern=new THREE.GridHelper(4.2,28,0xaeb2a2,0x5c655d);pattern.position.y=-.013;environment.add(pattern);
const ring=new THREE.Mesh(new THREE.RingGeometry(1.58,1.62,64),new THREE.MeshBasicMaterial({color:0xd3ba88,side:THREE.DoubleSide}));
ring.rotation.x=-Math.PI/2;ring.position.y=.002;environment.add(ring);
for(let k=0;k<9;k++){
  const x=(k-4)*.54, h=(.55+((k*11)%5)*.11);
  const m=new THREE.Mesh(new THREE.ConeGeometry(.6,h,3),new THREE.MeshLambertMaterial({color:k%2?0x576d73:0x61797c,flatShading:true}));
  m.position.set(x,h*.5-.04,-3.0-(k%3)*.3);m.rotation.y=.2+k*.15;environment.add(m);
}
const cloudMat=new THREE.MeshBasicMaterial({color:0xe2e1d8,transparent:true,opacity:.32,depthWrite:false});
for(let i=0;i<5;i++){const cloud=new THREE.Mesh(new THREE.SphereGeometry(.32+i*.05,9,5),cloudMat);
  cloud.position.set(-3+i*1.5,.95+(i%2)*.24,-3.9);cloud.scale.y=.28;environment.add(cloud);}
const loader=new GLTFLoader();
const loadShowtime=createShowtimeLoader(new URL('../cinematic/v14/',import.meta.url));
const animationCache=new Map();
const actors=[null,null], bullets=new Map(), flashes=[];
const audioFX=createCombatAudio();
const music=createArenaMusic(()=>audioFX.context);
const reducedMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches??false;
let visualFXEnabled=true;
const effectsAllowed=()=>visualFXEnabled&&!reducedMotion;
// Shared buffers and geometry: no new geometry allocations for each hit.
const fxGeometry=Object.freeze({
  hit:new THREE.OctahedronGeometry(.10,0),
  block:new THREE.RingGeometry(.085,.12,6),
  roar:new THREE.RingGeometry(.12,.145,32),
  clinch:new THREE.RingGeometry(.105,.14,4),
  special:new THREE.RingGeometry(.19,.235,32),
  ultimate:new THREE.RingGeometry(.30,.34,40),
  shard:new THREE.TetrahedronGeometry(.09),
  slash:new THREE.PlaneGeometry(.07,.47),
  reticle:new THREE.RingGeometry(.17,.21,4)
});
let cameraShake=0, cameraShakeStrength=0, bannerUntil=0;
const movie=createMovieDirector({reducedMotion});
const movieLayer=$('cinematic-layer'),movieViewport=$('cinematic-viewport');
const MOVIE_BACKGROUND=Object.freeze({
 moguzo:0x35261b,pisuke:0x142f3f,godan:0x382b22,hakuma:0x1c3540,
 chirka:0x2c1745,takimaru:0x362b24,yomikage:0x142c3c,
 bullet:0x362416,dark_moguzo:0x1d1738
});
let canvasHome=null,canvasFollowingNode=null,movieLastPhase='',authoredMovie=null;
const movieFlashes=[];
const movieSounds=new Set();
function playMovieSound(kind,id){
  return audioFX.play(kind,id,{voices:movieSounds});
}
function clearMovieEffects(){
  for(const flash of movieFlashes){flash.mesh.removeFromParent();flash.mesh.material.dispose();}
  movieFlashes.length=0;
  for(const stop of movieSounds)stop();
  movieSounds.clear();
}
function beginUltimateMovie(event){
  const attacker=battle?.fighters[event.slot];
  if(!attacker||!movie.start(event,attacker.id))return false;
  const entry=actors[event.slot]?.showtime.ultimate;
  if(!entry){
    movie.cancel();
    note('奥義の演出データを読み込めません');
    return false;
  }
  try{
    authoredMovie=createAuthoredCinematic({
      entry,attacker:actors[event.slot],target:actors[event.target],mirror:attacker.facing<0,
      background:MOVIE_BACKGROUND[attacker.id],lights:scene.children.filter(node=>node.isLight),
      reducedMotion:!effectsAllowed(),
      visualCue:(destination,kind,point)=>impactFX(kind,showtimeFor(attacker.id).color,
        point.x,point.y,1,14,destination,movieFlashes,point.z),
      audioCue:kind=>playMovieSound(kind,attacker.id)
    });
  }catch(error){
    movie.cancel();
    console.warn('奥義ムービーの再生準備に失敗',error);
    return false;
  }
  clearInput();
  movieLastPhase='';
  $('showtime-banner').classList.remove('active');
  movieLayer.hidden=false;
  // A distinct virtual cinematic stage: hide only scenery, never actors or their skeletons.
  environment.visible=false;
  scene.background.setHex(MOVIE_BACKGROUND[attacker.id]||0x151a2b);
  movieLayer.dataset.character=attacker.id;
  movieLayer.style.setProperty('--cinematic-accent',showtimeHex(attacker.id));
  $('cinematic-portrait').src=MODEL_ASSETS[attacker.id].portrait;
  $('cinematic-name').textContent=ROSTER[attacker.id].name;
  $('cinematic-move').textContent=entry.spec.displayName||event.move||ROSTER[attacker.id].ultimate.name;
  $('cinematic-subtitle').textContent=authoredMovie?'':movieScript(attacker.id)[0];
  canvasHome=canvas.parentNode;canvasFollowingNode=canvas.nextSibling;
  movieViewport.appendChild(canvas);
  renderer.setSize(Math.max(1,canvas.clientWidth),Math.max(1,canvas.clientHeight),false);
  if(!authoredMovie){
    if(effectsAllowed())actors[event.slot]?.illusions?.start(attacker);
    playMovieSound('counter',attacker.id);
  }
  music.update(false);
  return true;
}
function finishUltimateMovie(){
  if(!movie.active)return;
  movie.cancel();
  authoredMovie?.dispose();
  authoredMovie=null;
  clearMovieEffects();
  movieLayer.hidden=true;
  environment.visible=true;scene.background.setHex(0x758993);
  movieLayer.dataset.phase='';
  movieLastPhase='';
  if(canvasHome){
    canvasHome.insertBefore(canvas,canvasFollowingNode);
    canvasHome=null;canvasFollowingNode=null;
  }
  for(const actor of actors)actor?.illusions?.stop();
  // Re-establish the approved v0.3 match camera and pixel dimensions.
  resize();acc=0;lastFrame=0;
  clearInput();
  if(checking)readyForCheck();
  if(battle)hud(); // KO result waits until the movie ends.
}
function renderUltimateMovie(delta){
  if(!movie.active)return;
  if(authoredMovie){
    const aspect=Math.max(.3,canvas.clientWidth/Math.max(1,canvas.clientHeight));
    const frame=authoredMovie.update(delta,aspect);
    if(frame.ended){finishUltimateMovie();return;}
    if(movieLastPhase!==frame.shot){
      movieLastPhase=frame.shot;
      movieLayer.dataset.phase=frame.shot;
    }
    if($('cinematic-subtitle').textContent!==frame.caption){
      $('cinematic-subtitle').textContent=frame.caption;
    }
    animateFX(movieFlashes,delta*FPS);
    renderer.render(frame.scene,frame.camera);
    return true;
  }
  const shot=movie.update(delta);
  if(shot.ended){finishUltimateMovie();return;}
  const attacker=battle.fighters[shot.data.slot],target=battle.fighters[shot.data.target];
  if(!attacker||!target){finishUltimateMovie();return;}
  if(movieLastPhase!==shot.phase){
    movieLastPhase=shot.phase;movieLayer.dataset.phase=shot.phase;
    const script=movieScript(shot.data.id);
    $('cinematic-subtitle').textContent=shot.phase==='anticipation'?script[0]:
      shot.phase==='hero'?script[1]:script[2];
    if(shot.phase==='impact'){
      impactFX('ultimate',showtimeFor(attacker.id).color,target.x,target.y+.30,2.2,26,scene,movieFlashes);
      playMovieSound('ultimate',attacker.id);
    }
  }
  // The same real 3D scene and the same WebGL canvas move into a full-screen movie layer.
  const phase=shot.phase;
  const focal=phase==='impact'?target.x:phase==='aftermath'?(attacker.x+target.x)/2:attacker.x;
  const focusY=phase==='impact'?target.y+.40:attacker.y+.47;
  const width=phase==='aftermath'?Math.max(1.25,Math.abs(target.x-attacker.x)*.65+.48):
    phase==='hero'?.72:phase==='impact'?.84:.93;
  const ratio=Math.max(.3,canvas.clientWidth/Math.max(1,canvas.clientHeight));
  camera.position.set(focal+(phase==='hero'?attacker.facing*.12:0),focusY+.19,
    phase==='hero'?2.25:phase==='impact'?2.75:3.15);
  camera.lookAt(focal,focusY,0);
  camera.left=-width;camera.right=width;
  camera.top=width/ratio;camera.bottom=-width/ratio;camera.updateProjectionMatrix();
  for(const actor of actors){
    if(!actor)continue;
    actor.mixer.update(Math.min(delta,.045));
    actor.illusions?.step(battle.fighters[actor.slot]);
  }
  animateFX(movieFlashes,delta*FPS);
}
function shake(strength,frames=7){
  if(!effectsAllowed())return;
  cameraShake=Math.max(cameraShake,frames);
  cameraShakeStrength=Math.max(cameraShakeStrength,strength);
}
function showBanner(slot,id,move){
  const banner=$('showtime-banner'),profile=showtimeFor(id),theme=hudTheme(id);
  banner.style.setProperty('--showtime',showtimeHex(id));
  banner.dataset.element=theme.tone;
  banner.replaceChildren();
  const portrait=document.createElement('img'),copy=document.createElement('div');
  portrait.className='showtime-portrait';portrait.alt='';portrait.src=MODEL_ASSETS[id].portrait;
  const lead=document.createElement('span'),body=document.createElement('strong');
  lead.textContent=(slot===0?'1P':'CPU')+' · '+theme.mark+' / '+profile.signature;
  body.textContent=move;
  copy.className='showtime-copy';copy.append(lead,body);
  banner.append(portrait,copy);banner.classList.add('active');
  bannerUntil=(battle?.frame??0)+68;
}
function impactFX(kind,color,x,y,scale=1,life=14,destination=scene,queue=flashes,z=.23){
  if(!effectsAllowed())return;
  if(queue.length>=24){
    const old=queue.shift();old.mesh.removeFromParent();old.mesh.material.dispose();
  }
  const mat=new THREE.MeshBasicMaterial({color,transparent:true,opacity:.85,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending});
  const mesh=new THREE.Mesh(fxGeometry[kind]||fxGeometry.hit,mat);
  mesh.position.set(x,y,z);mesh.scale.setScalar(scale);
  destination.add(mesh);queue.push({mesh,life,maxLife:life,scale});
  return mesh;
}
function updateActionTrail(a,p){
  if(!a)return;
  const active=p.action&&isShowtimeMove(p.action.id)&&
    p.frame>=Math.max(0,p.action.startup-3)&&
    p.frame<=p.action.startup+p.action.active+4&&!p.stop&&effectsAllowed();
  if(!active){if(a.trail){a.trail.mesh.visible=false;a.trail.points.length=0;a.trail.actionKey='';}return;}
  const profile=showtimeFor(a.id),key=p.action.serial;
  if(!a.trail){
    const geometry=new THREE.BufferGeometry(),positions=new Float32Array(12*3);
    const attr=new THREE.BufferAttribute(positions,3);attr.setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute('position',attr);geometry.setDrawRange(0,0);
    const material=new THREE.LineBasicMaterial({color:profile.color,transparent:true,opacity:.9,depthWrite:false,blending:THREE.AdditiveBlending});
    const mesh=new THREE.Line(geometry,material);mesh.frustumCulled=false;scene.add(mesh);
    a.trail={mesh,points:[],actionKey:''};
  }
  const trail=a.trail;
  if(trail.actionKey!==key){trail.points.length=0;trail.actionKey=key;}
  const source=a.gltf.scene.getObjectByName(profile.bone);
  if(!source){trail.mesh.visible=false;return;}
  a.holder.updateMatrixWorld(true);
  const point=source.getWorldPosition(new THREE.Vector3());
  trail.points.push([point.x,point.y,point.z+.1]);
  if(trail.points.length>profile.tail)trail.points.shift();
  const values=trail.mesh.geometry.attributes.position.array;
  for(let i=0;i<trail.points.length;i++){
    const pos=trail.points[i];values[i*3]=pos[0];values[i*3+1]=pos[1];values[i*3+2]=pos[2];
  }
  trail.mesh.geometry.setDrawRange(0,trail.points.length);
  trail.mesh.geometry.attributes.position.needsUpdate=true;
  trail.mesh.visible=trail.points.length>1;
}
// Nine ultra-lightweight super signatures using existing GLB and battle event data.
function superSignature(p){
  const color=showtimeFor(p.id).color,x=p.x,y=p.y+.33,d=p.facing;
  impactFX('ultimate',color,x,y,1,23);
  if(p.id==='moguzo'){ // warm, low earth ripples
    for(const offset of [-.32,.32])impactFX('special',0xffc878,x+offset,y-.20,.82,19);
  }else if(p.id==='pisuke'){ // rapid kicks in a rushing line
    for(const [i,dy] of [-.22,0,.22].entries())
      impactFX('special',0x86dcff,x+d*(.22+i*.15),y+dy,.55,14+i*3);
  }else if(p.id==='godan'){ // heavy angular rock shards
    for(const [dx,dy] of [[-.23,-.2],[.22,-.13],[-.08,.3],[.25,.23]])
      impactFX('shard',0xffa369,x+dx,y+dy,1.1,20);
  }else if(p.id==='hakuma'){ // three bright snow-white bursts
    for(let i=0;i<3;i++)impactFX('shard',0xe4fff3,x+d*(i*.19),y+.16*i,1.15,19);
  }else if(p.id==='chirka'){ // real animated visual-only model echoes are handled independently
    impactFX('special',0xdd9aff,x,y+.04,1,18);
  }else if(p.id==='takimaru'){ // square grab-seal echoes
    for(const offset of [-.23,.23])impactFX('clinch',0xffd695,x+offset,y,.98,21);
  }else if(p.id==='yomikage'){ // moonlight crossing slashes and target reticle
    const target=battle?.fighters?.[1-p.slot];
    if(target)impactFX('reticle',0x9defff,target.x,target.y+.34,.85,20);
    for(const dir of [-1,1]){
      const slash=impactFX('slash',0x9defff,x+d*.28,y+dir*.15,1,19);
      if(slash)slash.rotation.z=dir*.68;
    }
  }else if(p.id==='bullet'){ // three amber rounds, tail-guided
    for(let i=0;i<3;i++)impactFX('shard',0xffb045,x+d*(.17+i*.17),y+.16*(i%2),.75,16+i*3);
  }else if(p.id==='dark_moguzo'){ // violet diagonal strike echoes
    for(let i=0;i<4;i++){
      const slash=impactFX('slash',0xbe78ff,x+d*(i*.14),y+(i%2?-.14:.16),.85,15+i*2);
      if(slash)slash.rotation.z=i%2?.6:-.6;
    }
  }
}
function actionShowtime(e){
  const p=battle?.fighters[e.slot];if(!p)return;
  if(e.action==='ultimate'){
    // A small tell, NOT the full cinematic. Whiff/guard never enter movie mode.
    audioFX.play('special',p.id);
    impactFX('special',showtimeFor(p.id).color,p.x,p.y+.36,1,10);
  }else if(/^s[123]$/.test(e.action)){
    // Specials now own the older super-level flourish during ordinary gameplay.
    showBanner(e.slot,p.id,e.action==='ultimate'?(actors[e.slot]?.showtime.ultimate?.spec.displayName??e.name):e.name);
    if(!actors[e.slot]?.showtime[e.action])audioFX.play('ultimate',p.id);
    $('note').style.setProperty('--special-accent',showtimeHex(p.id));
    if(!actors[e.slot]?.showtime[e.action]){superSignature(p);shake(.014,8);}
  }else if(e.action==='roar'){audioFX.play('roar',p.id);impactFX('roar',0xf6d17b,p.x,p.y+.31,1.3,12);}
  else if(e.action==='gyuiin'){audioFX.play('clinch',p.id);}
}
const checkAvailable=new URLSearchParams(location.search).get('check')==='1';
$('check-mode-label').hidden=!checkAvailable;$('check-mode').checked=checkAvailable;
$('device-stats').hidden=!checkAvailable;
let checking=false;
const metrics={fps:0,frameMs:0,loadMs:0,geometries:0,textures:0,drawCalls:0};
let metricAt=0,metricFrames=0;
function readyForCheck(){
  if(!checking||!battle)return;
  battle=new Battle(actors[0].id,actors[1].id,1);
  const [a,t]=battle.fighters;a.x=-.18;t.x=.18;a.super=100;
  const bullet=actors.find(actor=>actor.id==='bullet');
  if(bullet)battle.setTailTipPath(bullet.meta.clips.sp_tail_whip.tail_tip_path);
  finishShown=false;
}
let battle=null,selected='moguzo',cpuChoice='godan',playing=false,paused=false,loading=false,lastFrame=0,acc=0,finishShown=false;
let practiceEnabled=false;
const practice=createPracticeController();
function syncPracticeUI(){
  $('practice-panel').hidden=!practiceEnabled;
  if(!practiceEnabled)return;
  const stats=practice.stats;
  $('practice-hits').textContent=String(stats.hits);
  $('practice-damage').textContent=String(stats.damage);
  $('practice-last').textContent=String(stats.lastDamage);
}


const fwd=(v)=>Math.max(0,Math.min(100,v));
const ABILITY_GUIDE=Object.freeze({
  moguzo:'違う種類の技を2回当てる→次の必殺を小幅強化。ピンチで一度だけHP1で踏ん張る。',
  pisuke:'通常技がヒットした直後、ステップで一度だけ攻めをつなげる。',
  godan:'岩砕き/肩当ての途中で1ヒット装甲。投げや咆哮に弱く、発動後は回復時間がある。',
  hakuma:'通常攻撃をガードして鉄壁を獲得。次のコマンド必殺1回を小幅強化。',
  chirka:'だまし突き（236）/影引き爪（214）の予備動作中に←でフェイント、↓で発生を遅らせる。',
  takimaru:'打撃ヒット・ガード後の短い間は次の掴みが少し長く届く。',
  yomikage:'相手の攻撃発生直前に後ろステップで見切り。214の返しが強化される。',
  bullet:'異なる攻撃・ガードの成功を3回重ねてMAXに。214の長い尻尾技で全消費。',
  dark_moguzo:'コマンド技をヒットさせた直後、別のコマンド技へ1度だけ派生。単発威力は低い。'
});
let cueUntil=0;
function note(message,kind=''){$('note').textContent=message;$('note').dataset.kind=kind;cueUntil=(battle?.frame??0)+48;}
function makeChooser(){
  const r=$('roster');r.replaceChildren();
  IDS.forEach(id=>{
    const d=ROSTER[id],m=MODEL_ASSETS[id],b=document.createElement('button');
    b.type='button';b.className='fighter-card'+(selected===id?' chosen':'');
    b.innerHTML=`<img src="${m.portrait}" alt="" loading="lazy"><span>${d.name}</span><small>${d.role}</small>`;
    b.onclick=()=>{selected=id;updateChoice();};r.appendChild(b);
  });
  $('cpu-choice').replaceChildren(...IDS.map(id=>{const o=document.createElement('option');o.value=id;o.textContent=ROSTER[id].name;if(id===cpuChoice)o.selected=true;return o;}));
  $('cpu-choice').onchange=e=>cpuChoice=e.target.value;
  $('difficulty').onchange=()=>{};
  $('match-mode').onchange=()=>{
    const enabled=$('match-mode').value==='practice';
    $('difficulty').parentElement.hidden=enabled;
    if(checkAvailable)$('check-mode-label').hidden=enabled;
    $('start').firstChild.textContent=enabled?'練習開始 ':'対戦開始 ';
  };
  updateChoice();
}
function updateChoice(){
  [...$('roster').children].forEach((node,i)=>node.classList.toggle('chosen',IDS[i]===selected));
  $('chosen-name').textContent=ROSTER[selected].name;
  $('chosen-role').textContent=ROSTER[selected].role;
  $('ability-guide').textContent=ABILITY_GUIDE[selected];
}
function updateCamera(snap=false){
  const w=canvas.clientWidth,h=canvas.clientHeight;
  if(w<1||h<1)return;
  const t=frameTargets(battle?.fighters||[],w/h);
  const blend=snap?1:.18;
  cameraPose.x+=(t.centerX-cameraPose.x)*blend;
  cameraPose.y+=(t.focusY-cameraPose.y)*blend;
  cameraPose.halfWidth+=(t.halfWidth-cameraPose.halfWidth)*blend;
  camera.position.set(cameraPose.x,cameraPose.y+.70,5.5);
  camera.lookAt(cameraPose.x,cameraPose.y,0);
  // Add only a tiny display shake to the approved v0.3 camera composition.
  if(cameraShake>0){
    const fraction=cameraShake/10;
    camera.position.x+=Math.sin(cameraShake*2.57)*cameraShakeStrength*fraction;
    camera.position.y+=Math.cos(cameraShake*3.11)*cameraShakeStrength*fraction*.5;
    cameraShake--;if(cameraShake===0)cameraShakeStrength=0;
  }
  const halfHeight=cameraPose.halfWidth/(w/h);
  camera.left=-cameraPose.halfWidth;camera.right=cameraPose.halfWidth;
  camera.top=halfHeight;camera.bottom=-halfHeight;camera.updateProjectionMatrix();
}
function resize(){
  const w=canvas.clientWidth,h=canvas.clientHeight;
  if(w<1||h<1)return;
  renderer.setSize(w,h,false);renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));
  if(!movie.active)updateCamera(true);
}
const observer=new ResizeObserver(resize);observer.observe(canvas);window.addEventListener('resize',resize);
function disposable(o){o.traverse(node=>{if(node.geometry)node.geometry.dispose();
  if(node.material)for(const m of (Array.isArray(node.material)?node.material:[node.material])){m.map?.dispose();m.dispose();}});
}
function clearActors(){for(let i=0;i<2;i++){const a=actors[i];if(!a)continue;
    a.shadow.geometry.dispose();a.shadow.material.dispose();
    if(a.trail){scene.remove(a.trail.mesh);a.trail.mesh.geometry.dispose();a.trail.mesh.material.dispose();}
    a.illusions?.dispose();
    a.mixer.stopAllAction();scene.remove(a.holder);disposable(a.gltf.scene);actors[i]=null;}
  for(const m of bullets.values()){scene.remove(m);m.geometry.dispose();m.material.dispose();}bullets.clear();
  for(const f of flashes){scene.remove(f.mesh);f.mesh.material.dispose();}flashes.length=0;
  cameraShake=0;cameraShakeStrength=0;$('showtime-banner').classList.remove('active');}
async function createActor(id,slot) {
  const asset=MODEL_ASSETS[id];if(!asset)throw Error('3Dアセットが見つからない: '+id);
  // v15: load authored skeleton motion pack without replacing the original character GLB.
  const [gltf,meta,normalGLB]=await Promise.all([
    loader.loadAsync(new URL(asset.glb,import.meta.url).href+'?v='+MODEL_REVISION),
    fetch(new URL(asset.motion,import.meta.url)).then(r=>{if(!r.ok)throw Error('motion JSON HTTP '+r.status);return r.json();}),
    loader.loadAsync(new URL('../normal/v15/'+id+'_normals.glb',import.meta.url).href)
  ]);
  const mixer=new THREE.AnimationMixer(gltf.scene),actions=Object.fromEntries(gltf.animations.map(c=>[c.name,mixer.clipAction(c)]));
  const normalIds=new Set(['stand_weak','stand_heavy','crouch_weak','crouch_heavy','air_weak','air_heavy'].map(s=>'v15_'+s));
  if(normalGLB.animations.length!==normalIds.size)throw Error(id+' のv15通常技パックは6技必要');
  for(const clip of normalGLB.animations){
    if(!normalIds.has(clip.name)||!clip.tracks.length)throw Error(id+' の通常技クリップ不正: '+clip.name);
    const bound=bindMorphTargets(clip,gltf.scene);
    actions[bound.name]=mixer.clipAction(bound);
  }
  if(normalIds.size!==[...normalIds].filter(k=>actions[k]).length)throw Error(id+' の通常技が不足');
  // Keep only the clips; animation pack rendering stubs must never become visible fighters.
  disposable(normalGLB.scene);
  let showtime={};
  try{
    const animationFiles=animationCache;
    showtime=await loadShowtime(id,async(source,manifestUrl)=>{
      const url=source.glb&&new URL(source.glb,manifestUrl).href;
      if(url&&!animationFiles.has(url)){
        if(animationFiles.size>=4)animationFiles.delete(animationFiles.keys().next().value);
        animationFiles.set(url,loader.loadAsync(url).then(result=>{
          disposable(result.scene);
          return result.animations;
        }).catch(error=>{animationFiles.delete(url);throw error;}));
      }
      const clips=url?await animationFiles.get(url):gltf.animations;
      const clip=clips.find(item=>item.name===source.clip);
      if(!clip)throw new Error('Missing showtime clip: '+source.clip);
      return bindMorphTargets(clip,gltf.scene);
    });
  }catch(error){
    mixer.stopAllAction();mixer.uncacheRoot(gltf.scene);
    disposable(gltf.scene);
    throw new Error(id+' の専用技素材を読み込めません: '+error.message);
  }
  for(const [moveId,entry] of Object.entries(showtime)){
    if(entry.start)entry.action=mixer.clipAction(entry.start);
    else if(moveId!=='ultimate'&&entry.attacker)entry.action=mixer.clipAction(entry.attacker);
  }
  if(!actions.idle||!actions.stand_light||!actions.stand_heavy){
    disposable(gltf.scene);throw Error(id+' のGLBに必須動作がない');
  }
  const holder=new THREE.Group(),turn=new THREE.Group();holder.add(turn);turn.add(gltf.scene);scene.add(holder);
  gltf.scene.traverse(o=>{if(o.isSkinnedMesh)o.frustumCulled=false;});
  const sh=new THREE.Mesh(new THREE.CircleGeometry(.18,24),new THREE.MeshBasicMaterial({color:0x142128,transparent:true,opacity:.24,depthWrite:false}));
  sh.rotation.x=-Math.PI/2;sh.position.y=.003;holder.add(sh);
  const illusions=id==='chirka'?createChirkaIllusions({THREE,cloneSkeleton,gltf,scene,reducedMotion}):null;
  return {id,slot,gltf,meta,holder,turn,shadow:sh,mixer,actions,showtime,illusions,current:null,key:'',specialCueIndex:0};
}
function clipChange(a,p){
  const special=a.showtime[p.action?.id];
  const name=special?.action?special.action.getClip().name:chooseClip(p,Object.keys(a.actions),a.meta.command_map||{});
  const key=name+':'+(p.action?.serial||0)+':'+(p.state==='clinch'?p.state:p.state==='clinch_recoil'?p.state:'');
  if(key===a.key)return;
  const next=special?.action??a.actions[name]??a.actions.idle,prev=a.current;
  const originalNormal={
    v15_stand_weak:'stand_light',v15_stand_heavy:'stand_heavy',
    v15_crouch_weak:'crouch_light',v15_crouch_heavy:'crouch_heavy',
    v15_air_weak:'air_light',v15_air_heavy:'air_heavy'
  }[name];
  const info=a.meta.clips[originalNormal||name]||{},isLoop=!special?.action&&!!info.loop;
  next.reset();next.enabled=true;next.clampWhenFinished=true;
  next.setLoop(isLoop?THREE.LoopRepeat:THREE.LoopOnce,isLoop?Infinity:1);
  // Claudeのモーションの頭から末尾までを、既存の対戦フレームに合わせて再生。
  const total=p.action?p.action.startup+p.action.active+p.action.recovery:0;
  const rate=total&&info.frames&&!isLoop?Math.max(.55,Math.min(2.5,info.frames/total)):1;
  next.setEffectiveTimeScale(special?.action?0:rate);next.setEffectiveWeight(1);next.play();
  if(prev&&prev!==next)next.crossFadeFrom(prev,.055,false);
  a.current=next;a.currentName=name;a.key=key;a.specialCueIndex=0;
}
function syncActor(a,p){
  if(!a)return;
  if(a.counterFrame){
    if(!p.action&&!p.stun&&!p.ko&&p.state==='idle'&&a.counterFrame<21){
      if(!p.stop){a.mixer.update(1/FPS);a.counterFrame++;}
      a.holder.position.set(p.x,p.y,0);a.turn.rotation.set(0,p.facing===1?Math.PI/2:-Math.PI/2,0);return;
    }
    a.current?.stop();a.counterFrame=0;a.key='';
  }
  clipChange(a,p);a.holder.position.set(p.x,p.y,0);
  a.turn.rotation.set(0,p.facing===1?Math.PI/2:-Math.PI/2,0);
  a.turn.scale.setScalar(1);
  a.turn.position.z=0;
  // 新クリップに踏み込み・被弾・押し合いが入っているので、
  // 旧版用のモデル全体の拡大/傾きを重ねない。
  const special=a.showtime[p.action?.id];
  const authored=!!special?.action||a.currentName?.startsWith('v15_')||!!a.meta.clips[a.currentName]?.v2;
  if(!authored){
    if(p.action?.kind==='roar'){
      const phase=p.frame/(p.action.startup+p.action.active);
      a.turn.scale.setScalar(1+.06*Math.sin(Math.PI*Math.min(phase,1)));
      a.turn.rotation.z=p.facing*.07*Math.sin(Math.PI*Math.min(phase,1));
    }else if(p.action?.kind==='clinch'){
      a.turn.rotation.z=-p.facing*.14;
      a.turn.position.z=p.facing*.02;
    }else{
      if(p.state==='hit'||p.state==='clinch_recoil')a.turn.rotation.z=p.facing*.11;
      if(p.state==='block')a.turn.rotation.z=-p.facing*.06;
      if(p.state==='clinch'){a.turn.rotation.z=-p.facing*.21;a.turn.scale.setScalar(1.045);}
    }
  }
  a.shadow.scale.setScalar(Math.max(.6,1-p.y*.65));
  a.shadow.material.opacity=Math.max(.11,.3-p.y*.13);
  if(special?.action){
    playSpecialFrame(a,p,special);
  }else if(!p.stop)a.mixer.update(1/FPS);
  updateActionTrail(a,p);
  a.illusions?.step(p);
}
function playSpecialFrame(actor,fighter,entry){
  const { startup, active, recovery }=fighter.action;
  const { duration }=entry.action.getClip();
  const contact=entry.spec.contactSeconds??duration*startup/(startup+active+recovery);
  const frame=fighter.frame;
  const tail=active+recovery;
  const seconds=frame<=startup?contact*frame/Math.max(1,startup):
    contact+(duration-contact)*Math.min(1,(frame-startup)/tail);
  entry.action.time=Math.max(0,seconds);
  actor.mixer.update(fighter.stop?0:1/FPS);
  actor.holder.updateMatrixWorld(true);
  const cues=entry.spec.cueTrack??[];
  while(actor.specialCueIndex<cues.length&&cues[actor.specialCueIndex].at<=seconds){
    const cue=cues[actor.specialCueIndex++];
    if(cue.type==='sfx')audioFX.play(cue.key,actor.id);
    if(cue.type==='vfx'){
      const position=cue.bone&&actor.gltf.scene.getObjectByName(cue.bone)?.getWorldPosition(new THREE.Vector3());
      impactFX(cue.key,showtimeFor(actor.id).color,position?.x??fighter.x,position?.y??fighter.y+.35,1,14,scene,flashes,position?.z??.23);
    }
  }
}
const projectileMat={
 earth:0xb1a579,wind:0x9de4c9,violet:0xb68ce9,amber:0xf6ca72,blue:0x83c4ed
};
function syncProjectiles(){
  const alive=new Set();
  for(const p of battle?.projectiles||[]){
    alive.add(p.id);
    let mesh=bullets.get(p.id);
    if(!mesh){mesh=new THREE.Mesh(new THREE.SphereGeometry(.09,12,10),new THREE.MeshBasicMaterial({color:projectileMat[p.effect]||0xe6b471}));
      bullets.set(p.id,mesh);scene.add(mesh);}
    mesh.position.set(p.x,p.y,0);mesh.scale.set(1.35,.8,.7);
  }
  for(const [id,mesh] of bullets)if(!alive.has(id)){scene.remove(mesh);mesh.geometry.dispose();mesh.material.dispose();bullets.delete(id);}
}
// 言葉と接触形状を対にし、色だけに頼らず結果を伝える。
const cues={
  hit:['ヒット','hit'], block:['ガード','block'], clash:['弾相殺','block'],
  counter:['後の先','hit'], grit:['踏ん張り · HP 1','block'],
  roar_hit:['咆哮ヒット','roar'], roar_absorb:['咆哮 · 受け止め','roar'],
  roar_counter:['咆哮返し','roar'], roar_clash:['咆哮相殺','roar'], roar_erase:['咆哮 · 弾消し','roar'],
  gyuiin_start:['組み合い','clinch'], gyuiin_break:['弾き戻し','clinch'],
  gyuiin_armor:['ギュイーン · 装甲','clinch'], gyuiin_whiff:['ギュイーン · 空振り','clinch']
};
const cueColors={hit:0xffb77a,block:0x9fe0ff,roar:0xffcc65,clinch:0xd8a1fa};
function vfx(){
  for(const e of battle.events){
    if(e.type==='ultimate_hit'){
      beginUltimateMovie(e); // Only a confirmed strike can open full-screen movie mode.
      continue;
    }
    if(e.type==='move'){
      actionShowtime(e);
      if(e.slot===0 || e.action==='roar' || e.action==='gyuiin'){
        note(e.action==='ultimate'?(actors[e.slot]?.showtime.ultimate?.spec.displayName??e.name):e.name,e.action==='gyuiin'?'clinch':e.action);
      }
      continue;
    }
    if(e.type==='counter'){
      const a=actors[e.slot],clip=a?.showtime.reactions?.counter_success_v14;
      if(clip){
        const action=a.mixer.clipAction(clip);a.current?.stop();action.reset();
        action.setLoop(THREE.LoopOnce,1);action.clampWhenFinished=true;action.setEffectiveTimeScale(1);action.setEffectiveWeight(1);action.play();
        a.current=action;a.currentName=clip.name;a.key='counter:'+battle.frame;a.counterFrame=1;
      }
    }
    if(e.type==='ko'){audioFX.play('ko',battle.fighters[e.slot]?.id);continue;}
    if(e.type==='charge' && battle.fighters[e.slot]?.id==='bullet'){
      audioFX.play('tap','bullet');
      continue;
    }
    const cue=cues[e.type];
    if(!cue)continue;
    const [label,kind]=cue;
    // hit.slot は被弾側。攻撃した側の手柄として表示する。
    const owner=e.type==='hit'?1-e.slot:e.slot;
    const side=owner===0?'1P':owner===1?'CPU':'';
    note(side?side+' · '+label:label,kind);
    const id=battle.fighters[owner]?.id||'moguzo';
    const soundKind=e.type==='block'?'block':e.type==='counter'?'counter':
      kind==='clinch'?'clinch':kind==='roar'?'roar':'hit';
    audioFX.play(soundKind,id);
    if(e.x===undefined)continue;
    const color=kind==='hit'?showtimeFor(id).color:cueColors[kind];
    impactFX(kind,color,e.x,e.y??.42,1,e.damage>=100?18:14);
    if(kind==='hit'&&e.damage>=95)shake(.012,7);
    if(e.type==='roar_counter'||e.type==='counter')shake(.014,9);
  }
  if(battle.frame>=cueUntil && $('note').textContent)note('');
  if(battle.frame>=bannerUntil)$('showtime-banner').classList.remove('active');
}
function animateFX(queue=flashes,frames=1){
  for(let i=queue.length-1;i>=0;i--){
    const f=queue[i];f.life=Math.max(0,f.life-frames);
    const progress=(f.maxLife-f.life)/f.maxLife;
    f.mesh.scale.setScalar(f.scale*(1+progress*1.5));
    f.mesh.material.opacity=f.life/f.maxLife*.8;
    if(f.life<=0){f.mesh.removeFromParent();f.mesh.material.dispose();queue.splice(i,1);}
  }
}
function abilityLabel(p){
  const a=p.ability;
  switch(p.id){
    case 'moguzo':return a.gutsReady?'根性 READY':`根性 ${a.gutsProgress}/2`+(a.grit?' · 踏ん張り':'');
    case 'pisuke':return a.chase?'CHASE 受付中':'チェイス';
    case 'godan':return a.armorCooldown?'装甲 回復中':'装甲 READY';
    case 'hakuma':return a.iron?'鉄壁 READY':'鉄壁';
    case 'chirka':return 'フェイント/ディレイ';
    case 'takimaru':return a.pressure?'投げ派生 READY':'プレッシャー';
    case 'yomikage':return a.just?'見切り返し READY':'後の先';
    case 'bullet':return 'チャージ '+a.charge+'/3';
    case 'dark_moguzo':return a.dark&&!a.darkUsed?'暗連 READY':'暗連';
    default:return '';
  }
}
// 表示専用。入力を無効化せず、実際の技の成否は Battle が決める。
function driveStatus(move,p,op){
  if(battle.phase!=='fight')return '終了';
  if(p.drive<DRIVE[move+'Cost'])return '不足';
  if(p[move+'Cooldown']>0)return '回復中';
  if(battle.clinch)return '待機';
  // Codex #151: ギュイーンだけはヒットストップ・被弾中も発動できる。
  if(move==='gyuiin')return p.y>.09?'空中':'発動可';
  if(p.stop||p.stun)return '待機';
  if(p.y>.06)return '空中';
  const canCounter=p.action?.kind!=='roar' && op.action?.kind==='roar';
  return p.dashF || (p.action&&!canCounter)?'待機':'発動可';
}
function showDriveStatus(move){
  const status=driveStatus(move,...battle.fighters);
  const label=$(move+'-status');
  // The special button remains usable even when its down+special roar lacks Drive.
  // Do not mark the entire special button unavailable on roar cooldown.
  if(move==='roar'){
    const message='咆哮 '+status;
    if(label.textContent!==message)label.textContent=message;
    return;
  }
  if(label.textContent===status)return;
  label.textContent=status;
  const button=label.parentElement;
  button.toggleAttribute('data-wait',status!=='発動可');
  button.setAttribute('aria-label',button.firstChild.textContent.trim()+'：'+status);
}
function showUltimateStatus(){
  const p=battle.fighters[0],label=$('ultimate-status'),button=label.parentElement;
  const ready=p.super>=100;
  label.textContent=ready?'発動可':'ゲージ不足';
  button.toggleAttribute('data-wait',!ready);
  button.setAttribute('aria-label',ready?'奥義：発動可':'奥義：ゲージ不足');
}
function hud(){
  if(!battle)return;
  for(let i=0;i<2;i++){
    const p=battle.fighters[i],r=ROSTER[p.id],theme=hudTheme(p.id);
    $('hud-side-'+i).dataset.element=theme.tone;
    $('hud-side-'+i).dataset.mark=theme.mark;
    $('hud-side-'+i).querySelector('.hud-name').dataset.mark=theme.mark;
    $('name-'+i).textContent=r.name;
    $('trait-'+i).textContent=theme.word;
    const ready=isSuperReady(p.super);
    $('ultimate-ready-'+i).hidden=!ready;
    const chargeBar=$('charge-pips-'+i);
    chargeBar.hidden=p.id!=='bullet';
    if(p.id==='bullet'){
      const pipState=chargePips(p.ability.charge);
      [...chargeBar.children].forEach((node,k)=>node.classList.toggle('filled',pipState[k]));
      chargeBar.setAttribute('aria-label','バレットのチャージ '+p.ability.charge+'/3');
    }
    $('arena').style.setProperty(i===0?'--p1-accent':'--p2-accent',showtimeHex(p.id));
    $('ability-'+i).textContent=abilityLabel(p);
    $('hp-'+i).style.width=fwd(p.hp/r.hp*100)+'%';
    $('meter-'+i).style.width=fwd(p.super)+'%';
    $('drive-'+i).style.width=fwd(p.drive/DRIVE.max*100)+'%';
    $('drive-value-'+i).textContent=Math.floor(p.drive);
    $('super-value-'+i).textContent=Math.floor(p.super);
    $('hp-'+i).classList.toggle('low',p.hp/r.hp<.25);
    $('meter-'+i).classList.toggle('ready',p.super>=100);
  }
  showDriveStatus('roar');
  showDriveStatus('gyuiin');
  showUltimateStatus();
  $('timer').textContent=String(Math.ceil(battle.time/FPS));
  $('round-message').textContent=practiceEnabled?'PRACTICE':battle.phase==='fight'?'ROUND 1':'FINISH';
  if(practiceEnabled){$('timer').textContent='∞';syncPracticeUI();}
  if(battle.phase==='ko'&&!finishShown&&!movie.active&&!practiceEnabled) {
    finishShown=true;playing=false;$('game-over').classList.remove('hidden');
    const w=battle.winner;
    const timedOut=battle.events.some(e=>e.type==='timeout');
    $('result-reason').textContent=timedOut?'時間切れ':w<0?'ダブルKO':'KO';
    $('result-title').textContent=w<0?'引き分け':w===0?'勝利':'敗北';
    $('result-description').textContent=w<0?(timedOut?'残り体力が同率':'両者ダウン'):ROSTER[battle.fighters[w].id].name+'の勝ち';
    note('');

  }
}
function setLoading(s){$('loading-status').textContent=s;}
async function startMatch(){
  if(loading)return;
  if(movie.active)finishUltimateMovie();
  audioFX.unlock(); // Only during explicit user-initiated start/click.
  const loadStarted=performance.now();
  practiceEnabled=$('match-mode').value==='practice';
  checking=!practiceEnabled&&checkAvailable&&$('check-mode').checked;
  practice.clear();practice.setDummy($('practice-dummy').value);syncPracticeUI();
  loading=true;clearInput();
  playing=false;paused=false;finishShown=false;$('pause').textContent='一時停止';$('start').disabled=true;setLoading('GLBを読み込み中…');
  const ids=[selected,cpuChoice],level=+$('difficulty').value;
  try{
    clearActors();
    const loaded=await Promise.allSettled(ids.map((id,i)=>createActor(id,i)));
    for(const [i,result] of loaded.entries())if(result.status==='fulfilled')actors[i]=result.value;
    const failed=loaded.find(result=>result.status==='rejected');
    if(failed)throw failed.reason;
    battle=new Battle(...ids,level);
    if(practiceEnabled)practice.prepare(battle);
    readyForCheck();
    const bulletActor=actors.find(a=>a?.id==='bullet');
    if(bulletActor){
      const path=bulletActor.meta?.clips?.sp_tail_whip?.tail_tip_path;
      if(!path) throw Error('バレットの尾軌跡がモーションJSONにありません');
      battle.setTailTipPath(path);
    }
    $('selection').classList.add('hidden');$('game-over').classList.add('hidden');
    const fallback=actors.some(a=>['roar','gyuiin','clinch_hold','clinch_recoil'].some(name=>!a.actions[name]));
    setLoading(fallback?'咆哮・ギュイーンは仮モーション':'操作：方向＋必殺／奥義専用'); note('FIGHT！ 必殺は方向＋ボタン／奥義は専用ボタン');
    clearInput();
    metrics.loadMs=performance.now()-loadStarted;
    playing=true;lastFrame=0;acc=0;hud();
    if(practiceEnabled)note('PRACTICE｜相手行動・位置リセット・コンボを確認');
  }catch(e){clearActors();battle=null;console.error(e);note('起動エラー: '+e.message);setLoading('モデルの読込に失敗: '+e.message);$('selection').classList.remove('hidden');}
  finally{loading=false;$('start').disabled=false;}
}
function showSelection(){
  if(loading)return;
  if(movie.active)finishUltimateMovie();
  practiceEnabled=false;syncPracticeUI();
  playing=false;paused=false;$('selection').classList.remove('hidden');$('game-over').classList.add('hidden');
  note('キャラクターを選んで対戦開始');setLoading('キャラ選択中');clearInput();
}
// アナログスティックは単独のポインターで制御。右側のボタンは別PointerIdで同時押し。
const pressedKeys=new Set(),pressedTouch=new Map();
const queuedActions=new Set(),directionSamples=[];
const directions=['left','right','up','down'];
let lastDirectionTap=null;
let dashPulse=0;
const stick=$('joystick'),thumb=$('stick-thumb');
const analog={pointer:null,x:0,y:0,left:false,right:false,up:false,down:false};
function directionTap(k){
  const now=performance.now();
  if(lastDirectionTap?.key===k&&now-lastDirectionTap.at<280)dashPulse=3;
  lastDirectionTap={key:k,at:now};
}
function recordDirection(){
  const sample=Object.fromEntries(directions.map(key=>[key,pressedKeys.has(key)||analog[key]]));
  if(sample.up||sample.down){lastDirectionTap=null;dashPulse=0;}
  const prev=directionSamples.at(-1);
  if(prev&&directions.every(key=>sample[key]===prev[key]))return;
  directionSamples.push(sample);
  if(directionSamples.length>24)directionSamples.shift();
}
function analogMove(e){
  const r=stick.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
  const radius=Math.min(r.width,r.height)*.34;
  let {x,y}=localStickAxes(e.clientX-cx,e.clientY-cy,radius,gameRotated);
  const norm=Math.hypot(x,y);
  if(norm>1){x/=norm;y/=norm;}
  if(norm<.24){x=0;y=0;}
  const previous=analog.left?-1:analog.right?1:0;
  const dirX=x>=.33?1:x<=-.33?-1:0;
  const dirY=y>=.33?1:y<=-.33?-1:0;
  if(!previous&&!analog.up&&!analog.down&&!dirY&&dirX)directionTap(dirX===1?'right':'left');
  Object.assign(analog,{x,y,left:dirX===-1,right:dirX===1,down:dirY===1,up:dirY===-1});
  recordDirection();
  thumb.style.transform=`translate(calc(-50% + ${x*radius}px),calc(-50% + ${y*radius}px))`;
}
function resetAnalog(){
  Object.assign(analog,{pointer:null,x:0,y:0,left:false,right:false,up:false,down:false});
  thumb.style.transform='translate(-50%,-50%)';
  stick.classList.remove('held');
}
stick.addEventListener('pointerdown',e=>{
  if(movie.active||analog.pointer!==null)return;
  e.preventDefault();analog.pointer=e.pointerId;stick.setPointerCapture(e.pointerId);
  stick.classList.add('held');analogMove(e);
});
stick.addEventListener('pointermove',e=>{if(analog.pointer===e.pointerId){e.preventDefault();analogMove(e);}});
for(const type of ['pointerup','pointercancel','lostpointercapture']){
  stick.addEventListener(type,e=>{if(analog.pointer===e.pointerId){resetAnalog();recordDirection();}});
}
stick.addEventListener('contextmenu',e=>e.preventDefault());
const keyMap={
  ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down',
  KeyA:'left',KeyD:'right',KeyW:'up',KeyS:'down',
  KeyZ:'weak',KeyX:'strong',KeyV:'throw',KeyB:'special',KeyM:'ultimateButton',KeyN:'gyuiin',KeyC:'dash',KeyF:'stepForward',KeyR:'stepBack'
};
function clearInput(){
  if(analog.pointer!==null&&stick.hasPointerCapture(analog.pointer))stick.releasePointerCapture(analog.pointer);
  document.querySelectorAll('[data-control]').forEach(button=>{
    for(const pointer of pressedTouch.keys())if(button.hasPointerCapture(pointer))button.releasePointerCapture(pointer);
    button.classList.remove('held');
  });
  pressedKeys.clear();pressedTouch.clear();queuedActions.clear();directionSamples.length=0;
  lastDirectionTap=null;dashPulse=0;resetAnalog();
}
document.addEventListener('keydown',e=>{
  const k=keyMap[e.code];if(!k)return;
  if(movie.active||document.activeElement?.tagName==='SELECT')return;
  e.preventDefault();
  if(e.repeat)return;
  if((k==='left'||k==='right')&&!pressedKeys.has(k)&&!pressedKeys.has('up')&&!pressedKeys.has('down'))directionTap(k);
  pressedKeys.add(k);
  if(directions.includes(k))recordDirection();
  else queuedActions.add(k);
});
document.addEventListener('keyup',e=>{
  const k=keyMap[e.code];if(k){e.preventDefault();pressedKeys.delete(k);if(directions.includes(k))recordDirection();}
});
window.addEventListener('blur',()=>{
  if(movie.active)finishUltimateMovie();
  clearInput();paused=true;$('pause').textContent='再開';music.update(false);
});
document.addEventListener('visibilitychange',()=>{
  if(!document.hidden)return;
  if(movie.active)finishUltimateMovie();
  music.update(false);
});
$('fx-toggle').onclick=()=>{
  visualFXEnabled=!visualFXEnabled;
  const enabled=effectsAllowed();
  $('fx-toggle').textContent=enabled?'演出 ON':'演出 小';
  $('fx-toggle').setAttribute('aria-pressed',String(enabled));
  if(!enabled){
    cameraShake=0;cameraShakeStrength=0;
    for(const f of flashes){scene.remove(f.mesh);f.mesh.material.dispose();}
    flashes.length=0;
    for(const actor of actors){actor?.illusions?.stop();if(actor?.trail)actor.trail.mesh.visible=false;}
  }
};
if(reducedMotion){$('fx-toggle').textContent='演出 小';$('fx-toggle').disabled=true;$('fx-toggle').title='OSの動きを減らす設定を優先';}
$('music-toggle').onclick=()=>{
  if(!audioFX.unlock())return;
  const enabled=music.setEnabled(!music.enabled);
  $('music-toggle').textContent=enabled?'BGM ON':'BGM OFF';
  $('music-toggle').setAttribute('aria-pressed',String(enabled));
};
$('sound-toggle').onclick=()=>{
  audioFX.unlock();
  const muted=audioFX.setMuted(!audioFX.muted);
  $('sound-toggle').textContent=muted?'音 OFF':'音 ON';
  $('sound-toggle').setAttribute('aria-pressed',String(!muted));
  if(!muted)audioFX.play('tap',selected);
};
if(!audioFX.supported){
  $('sound-toggle').textContent='音 非対応';
  $('sound-toggle').disabled=true;
  $('music-toggle').disabled=true;
}
document.querySelectorAll('[data-control]').forEach(button=>{
  const k=button.dataset.control;
  button.addEventListener('pointerdown',e=>{
    if(movie.active)return;
    e.preventDefault();button.setPointerCapture(e.pointerId);
    pressedTouch.set(e.pointerId,k);queuedActions.add(k);button.classList.add('held');
  });
  const end=e=>{
    pressedTouch.delete(e.pointerId);
    if(![...pressedTouch.values()].includes(k))button.classList.remove('held');
  };
  button.addEventListener('pointerup',end);
  button.addEventListener('pointercancel',end);
  button.addEventListener('lostpointercapture',end);
  button.addEventListener('contextmenu',e=>e.preventDefault());
});
function input(){
  const o={directionSamples:directionSamples.splice(0)};
  for(const k of pressedKeys)o[k]=true;
  for(const key of directions)if(analog[key])o[key]=true;
  for(const k of pressedTouch.values())o[k]=true;
  for(const k of queuedActions)o[k]=true;
  queuedActions.clear();
  if(dashPulse>0){o.dash=true;dashPulse--;}
  return o;
}
$('practice-dummy').onchange=()=>practice.setDummy($('practice-dummy').value);
$('practice-reset').onclick=()=>{
  if(!practiceEnabled||!battle||movie.active)return;
  battle=practice.reset(battle);clearInput();
  for(let i=0;i<2;i++)syncActor(actors[i],battle.fighters[i]);
  syncProjectiles();hud();resize();note('位置・体力・ゲージ・コンボをリセット');
};
$('cinematic-skip').onclick=finishUltimateMovie;
document.addEventListener('keydown',event=>{
  if(movie.active&&(event.code==='Escape'||event.code==='Space')){
    event.preventDefault();finishUltimateMovie();
  }
});
$('start').onclick=startMatch;$('select-back').onclick=showSelection;$('result-select').onclick=showSelection;$('rematch').onclick=startMatch;
$('pause').onclick=()=>{if(!battle||battle.phase!=='fight')return;clearInput();paused=!paused;$('pause').textContent=paused?'再開':'一時停止';note(paused?'一時停止':'対戦再開');};

const FIXED=1/FPS;
function render(now){
  requestAnimationFrame(render);
  music.update(!!(battle&&playing&&!paused&&battle.phase==='fight'&&!movie.active&&!document.hidden));
  const elapsed=lastFrame?Math.max(0,(now-lastFrame)/1000):FIXED;
  const delta=Math.min(.05,elapsed);lastFrame=now;
  if(checkAvailable){
    metricFrames++;
    if(now-metricAt>=1000){
      metrics.fps=Math.round(metricFrames*1000/(now-metricAt));metrics.frameMs=(now-metricAt)/metricFrames;
      Object.assign(metrics,renderer.info.memory,{drawCalls:renderer.info.render.calls});
      $('device-stats').textContent=`${metrics.fps} FPS · 読込 ${(metrics.loadMs/1000).toFixed(1)}秒`;
      metricAt=now;metricFrames=0;
    }
  }
  if(battle&&playing&&!paused&&battle.phase==='fight'&&!movie.active) {
    acc=Math.min(.10,acc+delta);let steps=0;
    while(acc>=FIXED&&steps<5){
      if(checking){battle.time=75*FPS;if(!battle.fighters[0].action)battle.fighters[0].super=100;}
      if(practiceEnabled){
        practice.prepare(battle);
        const other=practice.dummyInput(battle);
        if(other===null)battle.tick(input());else battle.tick(input(),other);
        practice.after(battle);
      }else if(checking)battle.tick(input(),{});else battle.tick(input());
      for(let i=0;i<2;i++)syncActor(actors[i],battle.fighters[i]);
      syncProjectiles();vfx();animateFX();acc-=FIXED;steps++;
      if(movie.active||battle.phase!=='fight')break;
    }
    if(steps)hud();
  }
  if(movie.active&&!document.hidden){
    try{
      if(renderUltimateMovie(elapsed))return;
    }catch(error){
      console.warn('奥義ムービーを終了しました',error);
      finishUltimateMovie();
    }
  }
  // Preserve KO presentation but defer it until after the cutscene.
  if(battle?.phase==='ko'&&!movie.active)for(const actor of actors)actor?.illusions?.stop();
  if(battle?.phase==='ko'&&!paused&&!movie.active){
    for(const actor of actors)if(actor)actor.mixer.update(delta);
  }
  if(!movie.active)updateCamera();
  renderer.render(scene,camera);
}
makeChooser();
$('drive-costs').textContent=`咆哮：ドライブ${DRIVE.roarCost}消費　ギュイーン：${DRIVE.gyuiinCost}消費`;
window.addEventListener('resize',updateLandscapeLock);
window.addEventListener('orientationchange',updateLandscapeLock);
window.visualViewport?.addEventListener('resize',updateLandscapeLock);
window.addEventListener('pageshow',updateLandscapeLock);
updateLandscapeLock();resize();requestAnimationFrame(render);
window.mamoken3d={get battle(){return battle;},get actors(){return actors;},
  get cinematic(){return {active:movie.active,data:movie.data,elapsed:authoredMovie?.elapsed??movie.elapsed};},
  startMatch,showSelection,ROSTER,MODEL_ASSETS,
  get practice(){return {enabled:practiceEnabled,dummy:practice.dummy,stats:practice.stats};},
  get landscapeLocked(){return gameRotated;},
  get diagnostics(){return {...metrics,checking,loading};}};
