import * as THREE from 'three';
import {STAGE_NAMES} from './run-controller.js';

// Procedural 3D interpretations of the legacy locations, with no borrowed backgrounds.
// Scenery stays behind the combat plane and never changes Battle collision.
export function createRunStage(id){
 if(!STAGE_NAMES[id])throw Error('unknown run stage');
 const group=new THREE.Group(),materials=new Map(),geometry=new Set();
 const mat=(color,emissive=0)=>{const key=color+':'+emissive;if(!materials.has(key))materials.set(key,new THREE.MeshStandardMaterial({color,roughness:.95,emissive}));return materials.get(key);};
 function mesh(g,c,x,y,z,s=[1,1,1],emissive=0){geometry.add(g);const m=new THREE.Mesh(g,mat(c,emissive));m.position.set(x,y,z);m.scale.set(...s);group.add(m);return m;}
 const box=(c,x,y,z,s)=>mesh(new THREE.BoxGeometry(1,1,1),c,x,y,z,s);
 const rock=(c,x,y,z,s)=>mesh(new THREE.DodecahedronGeometry(1,0),c,x,y,z,s);
 const tree=(x,z,pine=false)=>{mesh(new THREE.CylinderGeometry(.05,.08,.7,6),0x5b4129,x,.3,z);mesh(pine?new THREE.ConeGeometry(.32,.85,7):new THREE.IcosahedronGeometry(.36,0),pine?0x315653:0x4e7844,x,.85,z);};
 const colors={village:[0xb4d9e4,0x8f9560],alpine:[0x9fcfe2,0x6b8b58],canyon:[0xb8a08b,0x91715c],river:[0x9ac5d3,0x849a8b],burrow:[0x3f3733,0x675442],newmoon:[0x11132a,0x39364b]}[id];
 box(colors[1],0,-.065,0,[9,.1,7]);
 // Mark the playable plane without placing decorative collision in it.
 const ring=mesh(new THREE.RingGeometry(1.55,1.59,64),id==='newmoon'?0x9874d9:0xcbb88b,0,-.009,0);ring.rotation.x=-Math.PI/2;
 if(id==='village'){
  for(const [x,z] of [[-1.6,-2.1],[1.6,-2.3]]){
   box(0xbfa06d,x,.42,z,[.95,.85,.9]);const roof=mesh(new THREE.ConeGeometry(.85,.55,4),0x77563d,x,1.06,z);roof.rotation.y=Math.PI/4;
   box(0x493e32,x,.22,z+.46,[.24,.43,.025]);
  }
  for(const x of [-2.5,2.6])tree(x,-1.8);
  for(let i=0;i<8;i++)box(0x7b6243,-2.3+i*.65,.23,-1.2,[.06,.48,.06]);
  box(0x7b6243,0,.3,-1.2,[4.7,.05,.05]);
 }else if(id==='alpine'){
  for(let i=0;i<7;i++){const peak=mesh(new THREE.ConeGeometry(.8,1.6+(i%3)*.25,5),0x7e9290,-3+i,1,-3.1);peak.rotation.y=i*.7;mesh(new THREE.ConeGeometry(.34,.55,5),0xdfe9df,-3+i,1.9+(i%3)*.2,-3.1);}
  for(const x of [-2.3,2.4])tree(x,-1.7,true);
  for(let i=0;i<18;i++)rock(i%2?0xddc460:0xb8cf95,-2.8+i*.33,.02,-1.2-(i%3)*.2,[.025,.035,.025]);
 }else if(id==='canyon'){
  for(const side of [-1,1])for(let i=0;i<4;i++)rock(i%2?0x926851:0xa57c61,side*(2.2+i*.2),.45+i*.18,-1.5-i*.55,[.5,.8+i*.1,.55]);
  for(let i=0;i<9;i++)box(i%2?0x866754:0x95705a,-3+i*.75,.85+(i%3)*.2,-3.7,[.8,2,.8]);
 }else if(id==='river'){
  box(0x6caac0,0,-.003,-1.6,[7,.015,.6]);
  for(let i=0;i<6;i++)rock(i%2?0xd6e1db:0x647f80,-2.1+i*.84,.04,-1.15,[.2,.15,.13]);
  box(0x74543c,1.6,.13,-1.6,[.8,.09,1]);for(const x of [1.23,1.97])box(0x987653,x,.34,-1.6,[.04,.38,1]);
  for(const x of [-2.5,2.7])tree(x,-2.4,true);
 }else if(id==='burrow'){
  for(let i=0;i<13;i++){const a=Math.PI*i/12;rock(0x75604b,Math.cos(a)*2.8,Math.sin(a)*2.1,-2.4,[.6,.65,.6]);}
  for(const x of [-2.2,2.2]){box(0x4f3a29,x,.35,-1.4,[.1,.65,.1]);mesh(new THREE.ConeGeometry(.09,.2,7),0xffc15a,x,.75,-1.4,[1,1,1],0x6c3a05);const light=new THREE.PointLight(0xffb95e,1.8,4);light.position.set(x,.85,-1.1);group.add(light);}
 }else{
  mesh(new THREE.SphereGeometry(.32,20,12),0xc7c0e9,1.6,1.8,-4,[1,1,.15],0x29233e);
  for(const x of [-2.5,2.5]){box(0x3f374c,x,.6,-1.8,[.38,1.2,.4]);rock(0x61506f,x,1.35,-1.8,[.3,.24,.25]);}
  for(let i=0;i<10;i++){const a=i*Math.PI/5;box(0x74608e,Math.cos(a)*1.75,.001,Math.sin(a)*.8,[.08,.025,.12]);}
 }
 return {group,background:colors[0],id,dispose(){group.removeFromParent();for(const g of geometry)g.dispose();for(const m of materials.values())m.dispose();}};
}
