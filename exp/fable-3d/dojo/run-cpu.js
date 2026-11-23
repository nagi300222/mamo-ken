// Nine legacy difficulty rows. Adapted to the 3D engine's available guard/step/roar.
// There is no 2D MIKIRI/dodge engine here; advanced defense uses a real back-step.
export const RUN_CPU_LEVELS=Object.freeze([
 null,
 {think:[28,44],react:[20,28],guard:.25,advanced:.05,attack:.50,down:0},
 {think:[24,38],react:[18,25],guard:.35,advanced:.08,attack:.60,down:0},
 {think:[20,32],react:[16,22],guard:.45,advanced:.12,attack:.80,down:.50},
 {think:[16,28],react:[13,20],guard:.58,advanced:.18,attack:.90,down:.75},
 {think:[14,25],react:[11,16],guard:.68,advanced:.27,attack:1,down:1},
 {think:[12,22],react:[10,15],guard:.75,advanced:.34,attack:1.05,down:1},
 {think:[10,20],react:[9,14],guard:.82,advanced:.42,attack:1.10,down:1},
 {think:[9,18],react:[8,13],guard:.88,advanced:.50,attack:1.15,down:1},
 {think:[8,16],react:[8,12],guard:.92,advanced:.58,attack:1.20,down:1}
].map(x=>x&&Object.freeze(x)));
const chance=(a,b=0)=>{let x=Math.imul((a^b)>>>0,1597334677);x^=x>>>16;return(x>>>0)/4294967296;};
const range=(r,n)=>r[0]+Math.floor(n*(r[1]-r[0]+1));
export function runCpuInput(g,level=1){
 const cfg=RUN_CPU_LEVELS[level];if(!cfg)throw Error('invalid run CPU level');
 const [op,p]=g.fighters,seed=g.cpuSeed||1,t=g.frame,dir=op.x>=p.x?'right':'left',back=dir==='right'?'left':'right',d=Math.abs(op.x-p.x);
 if(p.ko||p.action)return {};
 if(p.stun||p.stop)return p.state==='block'?{[back]:true,down:!!p.input?.down}:{};
 const react=range(cfg.react,chance(seed,op.action?.serial||0));
 const visible=op.action&&op.frame>=react&&op.frame<op.action.startup+op.action.active;
 if(visible&&!['throw','clinch'].includes(op.action.kind)&&d<Math.max(.82,(op.action.reach||.4)+.27)){
  const roll=chance(seed+3,op.action.serial*37);
  if(roll<cfg.guard)return {[back]:true,down:op.action.level==='low'};
  if(roll<cfg.guard+(1-cfg.guard)*cfg.advanced&&d<.65)return {stepBack:true};
 }
 const projectile=g.projectiles?.find(b=>b.owner!==p.slot&&(b.x-p.x)*b.face<0&&Math.abs(b.x-p.x)<.5);
 if(projectile&&chance(seed,Math.floor(t/30))<cfg.guard)return {[back]:true};
 const cadence=range(cfg.think,chance(seed,Math.floor(t/90))),beat=Math.max(12,Math.round(cadence*1.8/cfg.attack));
 const i={};
 if(d>.62){i[dir]=true;if(t%(beat*3)===seed%(beat*3))i.special1=true;return i;}
 if(['ko','wakeup','thrown'].includes(op.state)&&chance(seed,Math.floor(t/40))>=cfg.down)return {};
 if(t%beat===seed%beat){
  const r=chance(seed,t);
  if(p.super>=100&&r<level*.015)i.super=true;
  else if(d<.31&&r<.18)i.throw=true;
  else if(r<.48)i.weak=true;
  else if(r<.68)i.strong=true;
  else if(r<.90)i[p.id==='bullet'||p.id==='godan'?'special3':'special2']=true;
  else if(level>=5)i.roar=true;
  else i.weak=true;
 }else if(d>.42)i[dir]=true;
 else if(d<.24&&Math.floor(t/50)%3===0)i[back]=true;
 return i;
}
