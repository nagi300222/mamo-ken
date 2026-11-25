// Usage: python3 -m http.server 4173 (repo root), node exp/fable-3d/dojo/pack-showtime.mjs once, then
// NODE_PATH=$(npm root -g) node design/battle-ui-v2/verify-overlay.cjs <outdir> [before]
// Applies the v2 reference assets to the live PR #230 game and screenshots states.
const {chromium}=require('playwright');const fs=require('fs');
const out=process.argv[2]||'shots';const apply=process.argv[3]!=='before';const tag=apply?'v2':'pr230';
(async()=>{
const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const ctx=await b.newContext({viewport:{width:852,height:393},hasTouch:true,isMobile:true,deviceScaleFactor:2});
const p=await ctx.newPage();const cdp=await ctx.newCDPSession(p);const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://127.0.0.1:4173/exp/fable-3d/dojo/?mode=battle');
await p.locator('#start').tap();
await p.waitForFunction(()=>window.mamoken3d?.presentation.state==='fight'&&mamoken3d.battle.frame>0,null,{timeout:90000});
await p.evaluate(()=>{const t=mamoken3d.battle.fighters[1];t.stun=500000;t.action=null;});
const rects=()=>p.evaluate(()=>[...document.querySelectorAll('[data-control]')].map(e=>{const r=e.getBoundingClientRect();return {k:e.dataset.control,x:+r.x.toFixed(2),y:+r.y.toFixed(2),w:+r.width.toFixed(2),h:+r.height.toFixed(2)}}));
const hud=()=>p.evaluate(()=>{const h=[...document.querySelectorAll('.hud-side')].map(s=>s.getBoundingClientRect());const x=document.querySelector('[data-control=ultimateButton] .attack-art').getBoundingClientRect();return {hudBottom:Math.max(...h.map(r=>r.bottom)),xArtTop:x.top,xHitTop:document.querySelector('[data-control=ultimateButton]').getBoundingClientRect().top}});
const layouts=[['852x393',852,393,{}],['720x320',720,320,{}],['notch-left-720',720,320,{left:58,right:20,bottom:21}],['notch-right-720',720,320,{left:20,right:58,bottom:21}],['portrait-393',393,852,{top:58,bottom:20,left:21}]];
const report={before:{},after:{},hud:{}};
async function setLayout([n,w,h,ins]){await p.setViewportSize({width:w,height:h});await cdp.send('Emulation.setSafeAreaInsetsOverride',{insets:{top:0,bottom:0,left:0,right:0,...ins}});await p.evaluate(()=>dispatchEvent(new Event('resize')));await p.waitForFunction(r=>mamoken3d.landscapeLocked===r,h>w);await p.waitForTimeout(450);}
for(const l of layouts){await setLayout(l);report.before[l[0]]=await rects();}
if(apply){
 await p.addStyleTag({url:'/exp/fable-3d/shared-ui/matte-battle-v2.css'});
 await p.evaluate(async()=>{
  const {battleControlArtV2}=await import('/exp/fable-3d/shared-ui/battle-control-art-v2.js');
  const sym={weak:'B',strong:'A',throw:'Y',gyuiin:'Z',special:'S',ultimateButton:'X'};
  for(const btn of document.querySelectorAll('.attack[data-control]')){const a=battleControlArtV2[sym[btn.dataset.control]];btn.setAttribute('style',a.style);const art=btn.querySelector('.attack-art');const label=art.querySelector('.attack-label');art.innerHTML=a.svg;art.append(label);}
  for(const i of [0,1]){const t=document.querySelector('#hp-'+i).parentElement;const g=document.createElement('b');g.className='guard-line';g.id='guard-line-'+i;t.append(g);}
  const {ROSTER}=await import('/exp/fable-3d/dojo/balance.js');
  (function loop(){const bt=mamoken3d.battle;if(bt)bt.fighters.forEach((f,i)=>{const g=document.getElementById('guard-line-'+i);const v=f.guard/ROSTER[f.id].guardMax*100;g.style.width=Math.max(0,Math.min(100,v))+'%';g.toggleAttribute('data-full',v>=100);});requestAnimationFrame(loop);})();
 });
 await p.waitForTimeout(300);
}
for(const l of layouts){await setLayout(l);report.after[l[0]]=await rects();report.hud[l[0]]=await hud();await p.screenshot({path:`${out}/${tag}-${l[0]}.png`});}
await setLayout(layouts[0]);
await p.evaluate(()=>{const [a,c]=mamoken3d.battle.fighters;a.super=100;a.hp*=.2;a.guard*=.55;c.super=63;c.drive=27;a.drive=48;});
await p.waitForTimeout(700);await p.screenshot({path:`${out}/${tag}-ready.png`});
await p.locator('[data-control=strong]').evaluate(e=>e.classList.add('held'));
await p.locator('[data-control=ultimateButton]').evaluate(e=>e.classList.add('held'));
await p.waitForTimeout(100);await p.screenshot({path:`${out}/${tag}-held.png`});
await p.evaluate(()=>document.querySelectorAll('.held').forEach(e=>e.classList.remove('held')));
// close-up of the button cluster
const box=await p.locator('#buttons-rail').boundingBox();
await p.screenshot({path:`${out}/${tag}-cluster-ready.png`,clip:{x:box.x-40,y:box.y-30,width:box.width+80,height:box.height+50}});
await p.evaluate(()=>{const [a]=mamoken3d.battle.fighters;a.super=40;a.drive=20;});await p.waitForTimeout(300);
await p.screenshot({path:`${out}/${tag}-cluster-wait.png`,clip:{x:box.x-40,y:box.y-30,width:box.width+80,height:box.height+50}});
await p.evaluate(()=>{const [a]=mamoken3d.battle.fighters;a.drive=100;});await p.waitForTimeout(300);
await p.screenshot({path:`${out}/${tag}-cluster-normal.png`,clip:{x:box.x-40,y:box.y-30,width:box.width+80,height:box.height+50}});
const hb=await p.locator('#hud-side-0').boundingBox();
await p.screenshot({path:`${out}/${tag}-hud.png`,clip:{x:0,y:hb.y-8,width:852,height:hb.height+16}});
let same=true;for(const n in report.before){report.before[n].forEach((r,i)=>{const a=report.after[n][i];if(Math.abs(r.x-a.x)>.01||Math.abs(r.y-a.y)>.01||Math.abs(r.w-a.w)>.01||Math.abs(r.h-a.h)>.01){same=false;console.log('DIFF',n,r,a);}});}
report.hitAreasUnchanged=same;report.errors=errs;
fs.writeFileSync(`${out}/${tag}-report.json`,JSON.stringify(report,null,1));
console.log('hitAreasUnchanged',same,'hud',JSON.stringify(report.hud),'errors',errs);
await b.close();})();
