import * as THREE from 'three';
import {BUILDINGS} from './story-state.js';
export function createVillage(){
 const group=new THREE.Group();group.name='mountain-village';
 const materials={grass:new THREE.MeshStandardMaterial({color:0x8a9c74,roughness:1}),path:new THREE.MeshStandardMaterial({color:0xcab48c,roughness:1}),wood:new THREE.MeshStandardMaterial({color:0x6e5038,roughness:1}),wall:new THREE.MeshStandardMaterial({color:0xd3c5a4,roughness:1}),roof:new THREE.MeshStandardMaterial({color:0x355d59,roughness:1}),leaf:new THREE.MeshStandardMaterial({color:0x4c7561,roughness:1}),stone:new THREE.MeshStandardMaterial({color:0x8d9990,roughness:1})};
 function box(w,h,d,x,y,z,mat){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),materials[mat]);mesh.position.set(x,y,z);group.add(mesh);return mesh;}
 box(12,.1,12,0,-.07,0,'grass');box(2.4,.015,11.8,0,-.009,0,'path');box(11.8,.016,1.7,0,-.008,0,'path');
 for(const b of BUILDINGS){
  box(b.w,1.25,b.d,b.x,.625,b.z,'wall');box(b.w+.25,.15,b.d+.22,b.x,1.28,b.z,'wood');
  const roof=new THREE.Mesh(new THREE.ConeGeometry(1,1,4),materials.roof);roof.scale.set(b.w*.85,.65,b.d*.85);roof.position.set(b.x,1.65,b.z);roof.rotation.y=Math.PI/4;group.add(roof);
  box(.43,.7,.035,b.x,.35,b.z+b.d/2+.025,'wood');
  for(const dx of [-.6,.6]){box(.28,.28,.04,b.x+dx,.85,b.z+b.d/2+.03,'roof');}
 }
 for(let i=0;i<18;i++){
  const angle=i*Math.PI/9,r=5.4+(i%3)*.13,x=Math.sin(angle)*r,z=Math.cos(angle)*r;
  if(BUILDINGS.some(b=>Math.abs(x-b.x)<b.w/2+.25&&Math.abs(z-b.z)<b.d/2+.25))continue;
  box(.12,.7,.12,x,.35,z,'wood');const leaf=new THREE.Mesh(new THREE.ConeGeometry(.45,1.1,6),materials.leaf);leaf.position.set(x,1.1,z);group.add(leaf);
 }
 for(let i=0;i<14;i++){
  const m=new THREE.Mesh(new THREE.ConeGeometry(2.5,2.3+(i%4)*.6,4),materials.stone);const a=i/14*Math.PI*2;m.position.set(Math.sin(a)*11,-.2,Math.cos(a)*11);m.rotation.y=a;group.add(m);
 }
 const well=box(.65,.28,.65,4.8,.14,-.4,'stone');well.rotation.y=.2;
 const lanternMat=new THREE.MeshStandardMaterial({color:0xf0d28c,emissive:0xa16d25,emissiveIntensity:.22});
 for(const [x,z] of [[-1.1,-3],[1.1,3]]){box(.07,1,.07,x,.5,z,'wood');const bulb=new THREE.Mesh(new THREE.BoxGeometry(.2,.25,.2),lanternMat);bulb.position.set(x,1,z);group.add(bulb);}
 return group;
}
export function createBattleStage(){
 const group=new THREE.Group();const mat=new THREE.MeshStandardMaterial({color:0x9b977f,roughness:1});
 const floor=new THREE.Mesh(new THREE.CircleGeometry(3.6,48),mat);floor.rotation.x=-Math.PI/2;floor.position.y=-.012;group.add(floor);
 const ring=new THREE.Mesh(new THREE.RingGeometry(1.7,1.73,48),new THREE.MeshBasicMaterial({color:0xe1cb8d,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=.001;group.add(ring);
 return group;
}
