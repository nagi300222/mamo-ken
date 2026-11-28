// Compare what the player SEES with what the browser HITS on the six attack buttons.
// Pass 1: make only the painted SVG shapes hit-testable -> "visible owner" per pixel.
// Pass 2: restore the real CSS -> "hit owner" per pixel (button box, clip-path, DOM order).
// A pixel painted by one button but hit-tested to another is a steal (wrong move fires).
import {mkdir, writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import path from 'node:path';
const {chromium}=createRequire(import.meta.url)('playwright-core');
const base=process.env.MAMOKEN_URL??'http://127.0.0.1:4173/exp/fable-3d/dojo/';
const TARGETS=(process.env.MAMOKEN_HIT_TARGETS??'dojo,story').split(',');
const output=path.join(process.env.MAMOKEN_EVIDENCE??'/tmp/mamoken-evidence','hit-ownership');
const strict=process.env.MAMOKEN_HIT_STRICT==='1';
await mkdir(output,{recursive:true});
const LAYOUTS=[
 ['landscape-852',852,393,{}],['landscape-720',720,320,{}],
 ['notch-left-720',720,320,{left:58,right:20,bottom:21}],
 ['notch-right-720',720,320,{left:20,right:58,bottom:21}],
 ['portrait-393',393,852,{top:58,bottom:20,left:21}],
];
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH??'/usr/bin/google-chrome',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const context=await browser.newContext({viewport:{width:852,height:393},hasTouch:true,isMobile:true,deviceScaleFactor:1});
const page=await context.newPage();
const cdp=await context.newCDPSession(page);
const errors=[];
page.on('pageerror',e=>errors.push(e.message));
const report={sha:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),physicalIphoneTested:false,layouts:[]};
let failed=false;
async function enterDojo(){
 await page.goto(new URL('?mode=battle',base).href);
 await page.locator('#start').tap();
 await page.waitForFunction(()=>window.mamoken3d?.presentation.state==='fight'&&mamoken3d.battle.frame>0);
 await page.evaluate(()=>{const t=mamoken3d.battle.fighters[1];t.stun=1e6;t.action=null;});
 return {rail:'#buttons-rail',locked:()=>page.evaluate(()=>mamoken3d.landscapeLocked)};
}
async function enterStory(){
 await page.setViewportSize({width:852,height:393});
 await page.goto(new URL('../story/',base).href);
 await page.waitForFunction(()=>mamokenStory.previewReady,undefined,{timeout:90000});
 await page.evaluate(()=>document.querySelector('#avatar-form').requestSubmit());
 await page.waitForFunction(()=>mamokenStory.mode==='explore',undefined,{timeout:90000});
 await page.keyboard.down('w');await page.waitForFunction(()=>mamokenStory.nearby?.id==='moguzo',undefined,{timeout:20000});await page.keyboard.up('w');
 await page.locator('#talk').tap();await page.locator('#challenge').click();
 await page.waitForFunction(()=>mamokenStory.mode==='battle'&&mamokenStory.battle.frame>5,undefined,{timeout:120000});
 await page.evaluate(()=>{const t=mamokenStory.battle.fighters[1];t.stun=1e6;t.action=null;});
 return {rail:'#battle-buttons',locked:()=>page.evaluate(()=>mamokenStory.landscapeLocked)};
}
try{
 for(const target of TARGETS){
 const {rail,locked}=target==='story'?await enterStory():await enterDojo();
 for(const [layoutName,width,height,insets] of LAYOUTS){
  const name=target+'-'+layoutName;
  await page.setViewportSize({width,height});
  await cdp.send('Emulation.setSafeAreaInsetsOverride',{insets:{top:0,bottom:0,left:0,right:0,...insets}});
  await page.evaluate(()=>dispatchEvent(new Event('resize')));
  for(let i=0;i<50&&(await locked())!==(height>width);i++)await page.waitForTimeout(50);
  if(process.env.MAMOKEN_HIT_CSS)await page.addStyleTag({content:process.env.MAMOKEN_HIT_CSS});
  await page.waitForTimeout(150);
  const result=await page.evaluate(rail=>{
   const buttons=[...document.querySelectorAll(rail+' button.attack[data-control]')];
   if(!buttons.length)throw Error('no attack buttons in '+rail);
   const label=b=>b?.querySelector('.attack-label')?.textContent??null;
   const rects=buttons.map(b=>b.getBoundingClientRect());
   const x0=Math.floor(Math.min(...rects.map(r=>r.left)))-6, x1=Math.ceil(Math.max(...rects.map(r=>r.right)))+6;
   const y0=Math.floor(Math.min(...rects.map(r=>r.top)))-6, y1=Math.ceil(Math.max(...rects.map(r=>r.bottom)))+6;
   const sample=fn=>{const grid=[];for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)grid.push(fn(x+.5,y+.5));return grid;};
   const style=document.createElement('style');
   style.textContent=`${rail} button.attack[data-control],${rail} button.attack[data-control]::before{pointer-events:none!important}
    ${rail} .attack-art,${rail} .attack-art svg,${rail} .attack-art svg g{pointer-events:none!important}
    ${rail} .attack-art svg :is(path,circle){pointer-events:visiblePainted!important}
    ${rail} .bt-ring{pointer-events:none!important}`;
   document.head.append(style);
   const seen=sample((x,y)=>label(document.elementFromPoint(x,y)?.closest?.(rail+' .attack-art svg')?.closest('button')));
   style.remove();
   const hit=sample((x,y)=>{const e=document.elementFromPoint(x,y);const b=e?.closest?.('button[data-control]');return b?(label(b)??b.dataset.control):(e?.closest?.(rail)?null:'(other)');});
   const steals={},dead={},extra={},painted={};let stealPx=0,deadPx=0;
   const w=x1-x0+1, examples={};
   seen.forEach((s,i)=>{
    const h=hit[i];
    if(s)painted[s]=(painted[s]??0)+1;
    if(s&&h&&h!==s&&h!=='(other)'){const k=s+'→'+h;steals[k]=(steals[k]??0)+1;stealPx++;(examples[k]??=[]).length<4&&examples[k].push([x0+i%w,y0+Math.floor(i/w)]);}
    else if(s&&(!h||h==='(other)')){dead[s]=(dead[s]??0)+1;deadPx++;}
    else if(!s&&h&&h!=='(other)')extra[h]=(extra[h]??0)+1;
   });
   const boxes=Object.fromEntries(buttons.map((b,i)=>[label(b),{x:+rects[i].x.toFixed(1),y:+rects[i].y.toFixed(1),w:+rects[i].width.toFixed(1),h:+rects[i].height.toFixed(1),clip:getComputedStyle(b).clipPath}]));
   return {scan:{x0,y0,x1,y1},boxes,painted,steals,stealPx,examples,deadVisible:dead,deadPx,invisibleHitMargin:extra,
    grid:{w,seen:seen.map(s=>s??'.').join(''),hit:hit.map(h=>h==null?'.':h==='(other)'?'#':h).join('')}};
  },rail);
  if(!Object.keys(result.painted).length)throw Error(name+': no painted button art found');
  await page.screenshot({path:path.join(output,name+'.png')});
  const {grid,...summary}=result;
  report.layouts.push({name,target,width,height,insets,...summary});
  await writeFile(path.join(output,name+'.grid.txt'),
   [`# ${name} seen (painted owner)`,...grid.seen.match(new RegExp(`.{${grid.w}}`,'g')),'',`# ${name} hit (browser target)`,...grid.hit.match(new RegExp(`.{${grid.w}}`,'g'))].join('\n'));
  console.log(`${name}: steal ${result.stealPx}px ${JSON.stringify(result.steals)} | visible-but-dead ${result.deadPx}px ${JSON.stringify(result.deadVisible)}`);
  if(result.stealPx>0||result.deadPx>0)failed=true;
 }
 }
 if(errors.length)console.log('page errors:',errors);
}finally{
 await writeFile(path.join(output,'report.json'),JSON.stringify(report,null,1));
 await browser.close();
}
if(strict&&failed){console.error('Hit ownership mismatch: a visible button edge fires a different move.');process.exit(1);}
