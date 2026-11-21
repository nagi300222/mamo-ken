import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Battle, DRIVE } from './battle.js';
import { ROSTER, IDS, FPS, ARENA } from './balance.js';
import { MODEL_ASSETS, MODEL_REVISION, chooseClip } from './models.js';
import { frameTargets } from './camera-frame.js';

const $=id=>document.getElementById(id), canvas=$('stage');
const scene=new THREE.Scene();scene.background=new THREE.Color(0x758993);
const camera=new THREE.OrthographicCamera(-1.4,1.4,1,-1,.01,30);
const cameraPose={x:0,y:.5,halfWidth:1.4};
camera.position.set(0,1.2,5.5);camera.lookAt(0,.5,0);
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
  updateChoice();
}
function updateChoice(){
  [...$('roster').children].forEach((node,i)=>node.classList.toggle('chosen',IDS[i]===selected));
  $('chosen-name').textContent=ROSTER[selected].name;
  $('chosen-role').textContent=ROSTER[selected].role;
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
  const halfHeight=cameraPose.halfWidth/(w/h);
  camera.left=-cameraPose.halfWidth;camera.right=cameraPose.halfWidth;
  camera.top=halfHeight;camera.bottom=-halfHeight;camera.updateProjectionMatrix();
}
function resize(){
  const w=canvas.clientWidth,h=canvas.clientHeight;
  if(w<1||h<1)return;
  renderer.setSize(w,h,false);renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));
  updateCamera(true);
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
  const name=chooseClip(p,Object.keys(a.actions),a.meta.command_map||{});
  const key=name+':'+(p.action?.serial||0)+':'+(p.state==='clinch'?p.state:p.state==='clinch_recoil'?p.state:'');
  if(key===a.key)return;
  const next=a.actions[name]||a.actions.idle,prev=a.current;
  const info=a.meta.clips[name]||{},isLoop=!!info.loop;
  next.reset();next.enabled=true;next.clampWhenFinished=true;
  next.setLoop(isLoop?THREE.LoopRepeat:THREE.LoopOnce,isLoop?Infinity:1);
  // Claudeのモーションの頭から末尾までを、既存の対戦フレームに合わせて再生。
  const total=p.action?p.action.startup+p.action.active+p.action.recovery:0;
  const rate=total&&info.frames&&!isLoop?Math.max(.55,Math.min(2.5,info.frames/total)):1;
  next.setEffectiveTimeScale(rate);next.setEffectiveWeight(1);next.play();
  if(prev&&prev!==next)next.crossFadeFrom(prev,.055,false);
  a.current=next;a.currentName=name;a.key=key;a.actionAge=0;
}
function syncActor(a,p){
  if(!a)return;clipChange(a,p);a.holder.position.set(p.x,p.y,0);
  a.turn.rotation.set(0,p.facing===1?Math.PI/2:-Math.PI/2,0);
  a.turn.scale.setScalar(1);
  a.turn.position.z=0;
  // 新クリップに踏み込み・被弾・押し合いが入っているので、
  // 旧版用のモデル全体の拡大/傾きを重ねない。
  const authored=!!a.meta.clips[a.currentName]?.v2;
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
    if(e.type==='move'){
      if(e.slot===0 || e.action==='roar' || e.action==='gyuiin'){
        note(e.name,e.action==='gyuiin'?'clinch':e.action);
      }
      continue;
    }
    const cue=cues[e.type];
    if(!cue)continue;
    const [label,kind]=cue;
    // hit.slot は被弾側。攻撃した側の手柄として表示する。
    const owner=e.type==='hit'?1-e.slot:e.slot;
    const side=owner===0?'1P':owner===1?'CPU':'';
    note(side?side+' · '+label:label,kind);
    if(e.x===undefined)continue;
    // ガードは角のある盾、咆哮は輪、組み合いは角を立てた輪郭。
    let shape;
    if(kind==='hit')shape=new THREE.OctahedronGeometry(.10,0);
    else if(kind==='block')shape=new THREE.RingGeometry(.085,.12,6);
    else if(kind==='roar')shape=new THREE.RingGeometry(.12,.145,32);
    else shape=new THREE.RingGeometry(.105,.14,4);
    const mesh=new THREE.Mesh(shape,new THREE.MeshBasicMaterial({color:cueColors[kind],transparent:true,opacity:.85,depthWrite:false}));
    mesh.position.set(e.x,e.y??.42,.23);
    scene.add(mesh);flashes.push({mesh,life:14});
  }
  if(battle.frame>=cueUntil && $('note').textContent)note('');
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
  if(label.textContent===status)return;
  label.textContent=status;
  const button=label.parentElement;
  button.toggleAttribute('data-wait',status!=='発動可');
  button.setAttribute('aria-label',button.firstChild.textContent.trim()+'：'+status);
}
function hud(){
  if(!battle)return;
  for(let i=0;i<2;i++){
    const p=battle.fighters[i],r=ROSTER[p.id];
    $('name-'+i).textContent=r.name;
    $('ability-'+i).textContent=abilityLabel(p);
    $('hp-'+i).style.width=fwd(p.hp/r.hp*100)+'%';
    $('meter-'+i).style.width=fwd(p.super)+'%';
    $('drive-'+i).style.width=fwd(p.drive/DRIVE.max*100)+'%';
    $('drive-value-'+i).textContent=Math.floor(p.drive);
    $('super-value-'+i).textContent=Math.floor(p.super);
    $('hp-'+i).classList.toggle('low',p.hp/r.hp<.25);
  }
  showDriveStatus('roar');
  showDriveStatus('gyuiin');
  $('timer').textContent=String(Math.ceil(battle.time/FPS));
  $('round-message').textContent=battle.phase==='fight'?'ROUND 1':'FINISH';
  if(battle.phase==='ko'&&!finishShown) {
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
  // ラウンド終了後もKOアニメーションは最後まで再生する。
  if(battle?.phase==='ko'&&!paused){
    for(const actor of actors)if(actor)actor.mixer.update(delta);
  }
  updateCamera();
  renderer.render(scene,camera);
}
makeChooser();
$('drive-costs').textContent=`咆哮：ドライブ${DRIVE.roarCost}消費　ギュイーン：${DRIVE.gyuiinCost}消費`;
resize();requestAnimationFrame(render);
window.mamoken3d={get battle(){return battle;},get actors(){return actors;},startMatch,showSelection,ROSTER,MODEL_ASSETS};
