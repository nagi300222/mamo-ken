// Chirka: real skinned 3D illusion actors, visual-only.
// Does not change the original GLB, animation clips, attack logic or hitboxes.
// Mesh geometry / textures are shared; opacity materials belong to these echoes.
export const ILLUSION_FRAMES = 28;
export const ILLUSION_COUNT = 2;

export function createChirkaIllusions({THREE, cloneSkeleton, gltf, scene, reducedMotion=false}) {
  let copies=null, remaining=0, serial=null;
  const noop={start(){return false;},step(){},stop(){},dispose(){},get active(){return false;}};
  if(reducedMotion||!gltf?.scene||!gltf.animations?.length)return noop;

  function build(){
    if(copies)return;
    const clips=gltf.animations;
    const clip=clips.find(x=>x.name==='super')||clips.find(x=>x.name==='sp_feint_claw')||clips.find(x=>x.name==='idle');
    copies=[];
    for(let i=0;i<ILLUSION_COUNT;i++){
      const ghost=cloneSkeleton(gltf.scene),holder=new THREE.Group(),materials=[];
      holder.name='chirka-visual-only-echo-'+i;
      holder.add(ghost);holder.visible=false;scene.add(holder);
      ghost.traverse(node=>{
        if(!node.isMesh)return;
        const oldMaterials=Array.isArray(node.material)?node.material:[node.material];
        const owned=oldMaterials.map(source=>{
          const mat=source.clone();
          mat.transparent=true;mat.depthWrite=false;mat.opacity=0;
          mat.color?.multiply(new THREE.Color(0xcda8ff));
          materials.push(mat);return mat;
        });
        node.material=Array.isArray(node.material)?owned:owned[0];
        node.castShadow=false;node.receiveShadow=false;
        node.renderOrder=5;
      });
      const mixer=new THREE.AnimationMixer(ghost);
      const action=clip?mixer.clipAction(clip):null;
      copies.push({holder,mixer,action,materials,index:i});
    }
  }
  function stop(){
    remaining=0;serial=null;
    if(copies)for(const g of copies){g.holder.visible=false;g.action?.stop();}
  }
  function start(p){
    if(p?.id!=='chirka'||p.action?.id!=='ultimate')return false;
    build();stop();serial=p.action.serial;remaining=ILLUSION_FRAMES;
    for(const g of copies){
      g.holder.visible=true;
      if(g.action){g.action.reset();g.action.enabled=true;g.action.setLoop(THREE.LoopOnce,1);g.action.clampWhenFinished=true;g.action.play();}
    }
    return true;
  }
  function step(p){
    if(!remaining||!copies)return;
    if(!p||p.ko||p.action?.id!=='ultimate'||p.action.serial!==serial){stop();return;}
    const progress=1-remaining/ILLUSION_FRAMES;
    const alpha=.35*Math.min(1,(1-progress)*3,Math.max(.1,progress*6));
    for(const g of copies){
      const side=g.index===0?-1:1;
      const drift=.20+.17*progress;
      g.holder.position.set(p.x+side*drift,p.y-.01,side*.05);
      g.holder.rotation.y=p.facing===1?Math.PI/2:-Math.PI/2;
      g.holder.scale.setScalar(1-progress*.07);
      g.materials.forEach(m=>m.opacity=alpha);
      if(!p.stop)g.mixer.update(1/60);
    }
    remaining--;if(!remaining)stop();
  }
  function dispose(){
    stop();
    if(!copies)return;
    for(const g of copies){
      g.mixer.stopAllAction();
      g.mixer.uncacheRoot(g.holder.children[0]);
      scene.remove(g.holder);
      // Shared geometry and textures belong to the original glTF and MUST NOT be disposed here.
      for(const material of g.materials)material.dispose();
    }
    copies=null;
  }
  return {start,step,stop,dispose,get active(){return remaining>0;}};
}
