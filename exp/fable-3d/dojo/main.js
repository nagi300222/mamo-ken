import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Battle } from './battle.js';
import { ROSTER, IDS, FPS, ARENA } from './balance.js';
import { MODEL_ASSETS, MODEL_REVISION, chooseClip } from './models.js';

const $=id=>document.getElementById(id), canvas=$('stage');
const scene=new THREE.Scene();scene.background=new THREE.Color(0x758993);
const camera=new THREE.OrthographicCamera(-2.15,2.15,1.38,-.78,.01,30);
camera.position.set(0,1.55,5.5);camera.lookAt(0,.75,0);
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));
renderer.outputColorSpace=THREE.SRGBColorSpace;
scene.add(new THREE.HemisphereLight(0xe5f7ff,0x8f796a,2.25));
const sun=new THREE.DirectionalLight(0xffecd0,2.45);sun.position.set(-1.2,2.8,2.9);scene.add(sun);
const ambient=new THREE.DirectionalLight(0x9cb2cf,.6);ambient.position.set(2,1,-3);scene.add(ambient);

const floor=new THREE.Mesh(new THREE.PlaneGeometry(7,4),new THREE.MeshStandardMaterial({color:0x6e776a,roughness:.98}));
floor.rotation.x=-Math.PI/2;floor.position.y=-.018;scene.add(floor);
const pattern=new THREE.GridHelper(4.2,28,0xaeb2a2,0x5c655d);pattern.position.y=-.013;scene.add(pattern);
const ring=new THREE.Mesh(new THREE.RingGeometry(1.58,1.62,64),new THREE.MeshBasicMaterial({color:0xd3ba88,side:THREE.DoubleSide}));
ring.rotation.x=-Math.PI/2;ring.position.y=.002;scene.add(ring);
for(let k=0;k<9;k++){
  const x=(k-4)*.54, h=(.55+((k*11)%5)*.11);
  const m=new THREE.Mesh(new THREE.ConeGeometry(.6,h,3),new THREE.MeshLambertMaterial({color:k%2?0x576d73:0x61797c,flatShading:true}));
  m.position.set(x,h*.5-.04,-3.0-(k%3)*.3);m.rotation.y=.2+k*.15;scene.add(m);
}
const cloudMat=new THREE.MeshBasicMaterial({color:0xe2e1d8,transparent:true,opacity:.32,depthWrite:false});
for(let i=0;i<5;i++){const cloud=new THREE.Mesh(new THREE.SphereGeometry(.32+i*.05,9,5),cloudMat);
  cloud.position.set(-3+i*1.5,.95+(i%2)*.24,-3.9);cloud.scale.y=.28;scene.add(cloud);}
const loader=new GLTFLoader();
const actors=[null,null], bullets=new Map(), flashes=[];
let battle=null,selected='moguzo',cpuChoice='godan',playing=false,paused=false,loading=false,lastFrame=0,acc=0,finishShown=false;

const fwd=(v)=>Math.max(0,Math.min(100,v));
function note(s){$('note').textContent=s;}
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
  updateChoice();
}
function updateChoice(){
  [...$('roster').children].forEach((node,i)=>node.classList.toggle('chosen',IDS[i]===selected));
  $('chosen-name').textContent=ROSTER[selected].name;
  $('chosen-role').textContent=ROSTER[selected].role;
}
function resize(){
  const w=canvas.clientWidth,h=canvas.clientHeight;
  if(w<1||h<1)return;
  renderer.setSize(w,h,false);renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));
  const aspect=w/h,halfWidth=Math.max(2.22,1.32*aspect),halfHeight=halfWidth/aspect;
  camera.left=-halfWidth;camera.right=halfWidth;
  camera.top=.56+halfHeight;camera.bottom=.56-halfHeight;camera.updateProjectionMatrix();
}
const observer=new ResizeObserver(resize);observer.observe(canvas);window.addEventListener('resize',resize);
function disposable(o){o.traverse(node=>{if(node.geometry)node.geometry.dispose();
  if(node.material)for(const m of (Array.isArray(node.material)?node.material:[node.material])){m.map?.dispose();m.dispose();}});
}
function clearActors(){for(let i=0;i<2;i++){const a=actors[i];if(!a)continue;a.mixer.stopAllAction();scene.remove(a.holder);disposable(a.gltf.scene);actors[i]=null;}
  for(const m of bullets.values()){scene.remove(m);m.geometry.dispose();m.material.dispose();}bullets.clear();
  for(const f of flashes){scene.remove(f.mesh);f.mesh.geometry.dispose();f.mesh.material.dispose();}flashes.length=0;}
async function createActor(id,slot) {
  const asset=MODEL_ASSETS[id];if(!asset)throw Error('3Dアセットが見つからない: '+id);
  const [gltf,meta]=await Promise.all([
    loader.loadAsync(new URL(asset.glb,import.meta.url).href+'?v='+MODEL_REVISION),
    fetch(new URL(asset.motion,import.meta.url)).then(r=>{if(!r.ok)throw Error('motion JSON HTTP '+r.status);return r.json();})
  ]);
  const mixer=new THREE.AnimationMixer(gltf.scene),actions=Object.fromEntries(gltf.animations.map(c=>[c.name,mixer.clipAction(c)]));
  if(!actions.idle||!actions.stand_light||!actions.stand_heavy){
    disposable(gltf.scene);throw Error(id+' のGLBに必須動作がない');
  }
  const holder=new THREE.Group(),turn=new THREE.Group();holder.add(turn);turn.add(gltf.scene);scene.add(holder);
  gltf.scene.traverse(o=>{if(o.isSkinnedMesh)o.frustumCulled=false;});
  const sh=new THREE.Mesh(new THREE.CircleGeometry(.18,24),new THREE.MeshBasicMaterial({color:0x142128,transparent:true,opacity:.24,depthWrite:false}));
  sh.rotation.x=-Math.PI/2;sh.position.y=.003;holder.add(sh);
  return {id,slot,gltf,meta,holder,turn,shadow:sh,mixer,actions,current:null,previous:null,key:'',actionAge:0};
}
function clipChange(a,p){
  const name=chooseClip(p,Object.keys(a.actions)),key=name+':'+(p.action?.serial||0);
  if(key===a.key)return;
  const next=a.actions[name]||a.actions.idle,prev=a.current;
  const info=a.meta.clips[name]||{},isLoop=!!info.loop;
  next.reset();next.enabled=true;next.clampWhenFinished=true;
  next.setLoop(isLoop?THREE.LoopRepeat:THREE.LoopOnce,isLoop?Infinity:1);
  next.setEffectiveTimeScale(1);next.setEffectiveWeight(1);next.play();
  if(prev&&prev!==next)next.crossFadeFrom(prev,.055,false);
  a.current=next;a.key=key;a.actionAge=0;
}
function syncActor(a,p){
  if(!a)return;clipChange(a,p);a.holder.position.set(p.x,p.y,0);
  a.turn.rotation.set(0,p.facing===1?Math.PI/2:-Math.PI/2,0);
  a.turn.scale.setScalar(1);
  a.turn.position.z=0;
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
    if(p.state==='clinch'){
      a.turn.rotation.z=-p.facing*.21;
      a.turn.scale.setScalar(1.045);
    }
  }
  a.shadow.scale.setScalar(Math.max(.6,1-p.y*.65));
  a.shadow.material.opacity=Math.max(.11,.3-p.y*.13);
  if(!p.stop)a.mixer.update(1/FPS);
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
function vfx(){
  for(const e of battle?.events||[]){
    if(e.type==='move'){if(e.slot===0)note(e.name);continue;}
    if(e.type==='roar_absorb'&&e.slot===0)note('咆哮！ 攻撃を受け止めた');
    if(e.type==='roar_counter')note('咆哮返し！');
    if(e.type==='roar_erase')note('咆哮で飛び道具を消した！');
    if(e.type==='gyuiin_hit'||e.type==='gyuiin_start')note('ギュイーン！ 組み合い開始');
    if(e.type==='gyuiin_break')note('ギュイーン！ 仕切り直し');
    if(e.type==='gyuiin_armor')note('ギュイーンのハイパーアーマー');
    if(!['hit','block','clash','counter','grit','ko','roar_absorb','roar_counter','roar_hit','roar_clash','roar_erase','gyuiin_hit','gyuiin_start','gyuiin_break','gyuiin_armor'].includes(e.type))continue;
    const x=e.x??battle.fighters[e.slot||0].x,y=e.y??.42;
    const col=e.type==='hit'?0xffd39c:e.type==='block'?0x9fdaf8:e.type.startsWith('roar')?0xffc06c:e.type.startsWith('gyuiin')?0xa98ef4:0xf7e9c3;
    const mesh=new THREE.Mesh(new THREE.OctahedronGeometry(.11,0),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:.8,depthWrite:false}));
    mesh.position.set(x,y,.07);scene.add(mesh);flashes.push({mesh,life:14});
    if(e.type==='grit')note('踏ん張り！ HP1で耐えた');
    if(e.type==='counter')note('後の先・カウンター！');
  }
}
function animateFX(){
  for(let i=flashes.length-1;i>=0;i--){
    const f=flashes[i];f.life--;f.mesh.scale.setScalar(1+(14-f.life)*.12);f.mesh.material.opacity=f.life/14*.8;
    if(f.life<=0){scene.remove(f.mesh);f.mesh.geometry.dispose();f.mesh.material.dispose();flashes.splice(i,1);}
  }
}
function abilityLabel(p){
  const a=p.ability;
  switch(p.id){
    case 'moguzo':return p.hp<=ROSTER.moguzo.hp*.3?'根性発動':'根性 / 踏ん張り'+(a.grit?'○':'×');
    case 'pisuke':return a.chase?'CHASE 受付中':'チェイス';
    case 'godan':return '装甲 '+a.armor+'/3';
    case 'hakuma':return a.iron?'鉄壁 READY':'鉄壁';
    case 'chirka':return '毒・奇襲';
    case 'takimaru':return a.pressure?'投げ派生 READY':'プレッシャー';
    case 'yomikage':return a.just?'返し READY':'後の先';
    case 'bullet':return 'チャージ '+a.charge+'/3';
    case 'dark_moguzo':return a.dark?'暗連 READY':'暗連';
    default:return '';
  }
}
function hud(){
  if(!battle)return;
  for(let i=0;i<2;i++){
    const p=battle.fighters[i],r=ROSTER[p.id];
    $('name-'+i).textContent=r.name;
    $('ability-'+i).textContent=abilityLabel(p);
    $('hp-'+i).style.width=fwd(p.hp/r.hp*100)+'%';
    $('meter-'+i).style.width=fwd(p.super)+'%';
    $('drive-'+i).style.width=fwd(p.drive??100)+'%';
    $('hp-'+i).style.background=p.hp/r.hp<.25?'linear-gradient(90deg,#e46e69,#eab36b)':'linear-gradient(90deg,#72d0b0,#cce9a5)';
  }
  $('timer').textContent=String(Math.ceil(battle.time/FPS));
  $('round-message').textContent=battle.phase==='fight'?'ROUND 1':'FINISH';
  if(battle.phase==='ko'&&!finishShown) {
    finishShown=true;playing=false;$('game-over').classList.remove('hidden');
    const w=battle.winner; $('result-title').textContent=w<0?'引き分け！':w===0?'勝利！':'敗北…';
    $('result-description').textContent=w<0?'決着は次のラウンドへ':w===0?ROSTER[battle.fighters[0].id].name+'の勝ち！':ROSTER[battle.fighters[1].id].name+'の勝ち！';
  }
}
function setLoading(s){$('loading-status').textContent=s;}
async function startMatch(){
  if(loading)return;
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
    const bulletActor=actors.find(a=>a?.id==='bullet');
    if(bulletActor){
      const path=bulletActor.meta?.clips?.sp_tail_whip?.tail_tip_path;
      if(!path) throw Error('バレットの尾軌跡がモーションJSONにありません');
      battle.setTailTipPath(path);
    }
    $('selection').classList.add('hidden');$('game-over').classList.add('hidden');
    const fallback=actors.some(a=>['roar','gyuiin','clinch_hold','clinch_recoil'].some(name=>!a.actions[name]));
    setLoading(fallback?'咆哮・ギュイーンは仮モーション':'操作：方向＋攻撃'); note('FIGHT！ コマンドは236・623・214・236236');
    clearInput();
    playing=true;lastFrame=0;acc=0;hud();
  }catch(e){clearActors();battle=null;console.error(e);note('起動エラー: '+e.message);setLoading('モデルの読込に失敗: '+e.message);$('selection').classList.remove('hidden');}
  finally{loading=false;$('start').disabled=false;}
}
function showSelection(){
  if(loading)return;
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
  let x=(e.clientX-cx)/radius,y=(e.clientY-cy)/radius;
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
  if(analog.pointer!==null)return;
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
  KeyZ:'weak',KeyX:'strong',KeyV:'throw',KeyB:'roar',KeyN:'gyuiin',KeyC:'dash'
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
  if(document.activeElement?.tagName==='SELECT')return;
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
window.addEventListener('blur',()=>{clearInput();paused=true;$('pause').textContent='再開';});
document.querySelectorAll('[data-control]').forEach(button=>{
  const k=button.dataset.control;
  button.addEventListener('pointerdown',e=>{
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
$('start').onclick=startMatch;$('select-back').onclick=showSelection;$('result-select').onclick=showSelection;$('rematch').onclick=startMatch;
$('pause').onclick=()=>{if(!battle||battle.phase!=='fight')return;clearInput();paused=!paused;$('pause').textContent=paused?'再開':'一時停止';note(paused?'一時停止':'対戦再開');};

const FIXED=1/FPS;
function render(now){
  requestAnimationFrame(render);
  const delta=Math.min(.05,lastFrame?(now-lastFrame)/1000:FIXED);lastFrame=now;
  if(battle&&playing&&!paused&&battle.phase==='fight') {
    acc=Math.min(.10,acc+delta);let steps=0;
    while(acc>=FIXED&&steps<5){
      battle.tick(input());for(let i=0;i<2;i++)syncActor(actors[i],battle.fighters[i]);
      syncProjectiles();vfx();animateFX();acc-=FIXED;steps++;
      if(battle.phase!=='fight')break;
    }
    if(steps)hud();
  }
  renderer.render(scene,camera);
}
makeChooser();resize();requestAnimationFrame(render);
window.mamoken3d={get battle(){return battle;},get actors(){return actors;},startMatch,showSelection,ROSTER,MODEL_ASSETS};
