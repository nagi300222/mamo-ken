// Independent geometry regression for the P4 polish. This does not award a UI
// score, represent human/thumb testing, or measure physical-device performance.
// Run after build:pages. Playwright video is SILENT; use it only for UI timing.
import assert from 'node:assert/strict';
import {mkdir, readFile, stat, writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('playwright-core');

const evidence=path.join(process.env.MAMOKEN_EVIDENCE??'/tmp/mamoken-p4-polish','polish');
await mkdir(evidence,{recursive:true});
const sha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const report={schemaVersion:1,sha,recordedAt:new Date().toISOString(),environment:'Desktop Chromium / SwiftShader, CSS pixels; not a physical phone',physicalIphoneTested:false,humanTesters:0,audioQualityEvaluated:false,videoContainsAudio:false,checks:[],measurements:[],errors:[]};
const siteRoot=path.resolve(fileURLToPath(new URL('../../_pages/',import.meta.url)));
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.glb':'model/gltf-binary','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.svg':'image/svg+xml'};
let server,browser,context,page,video,cdp;
let root=process.env.MAMOKEN_UI_URL;
const cases=[
 {id:'720x320',width:720,height:320},
 {id:'852x393',width:852,height:393},
 {id:'portrait-393x852',width:393,height:852},
 {id:'safe-720x320',width:720,height:320,insets:{left:62,right:21,top:0,bottom:21}},
 {id:'safe-852x393',width:852,height:393,insets:{left:62,right:21,top:0,bottom:21}},
 {id:'safe-portrait-393x852',width:393,height:852,insets:{left:62,right:21,top:0,bottom:21}}
];
function check(condition,message,data){report.checks.push({pass:!!condition,message,...(data===undefined?{}:{data})});}
function inside(rect,area,tolerance=1){return rect&&rect.width>0&&rect.height>0&&rect.x>=area.left-tolerance&&rect.y>=area.top-tolerance&&rect.right<=area.right+tolerance&&rect.bottom<=area.bottom+tolerance;}
function overlaps(a,b,tolerance=.5){return a&&b&&Math.min(a.right,b.right)-Math.max(a.x,b.x)>tolerance&&Math.min(a.bottom,b.bottom)-Math.max(a.y,b.y)>tolerance;}
async function settle(){await page.evaluate(async()=>{await document.fonts.ready;await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});}
async function configure(c){
 await page.setViewportSize({width:c.width,height:c.height});
 await settle();
 const portrait=await page.evaluate(()=>document.documentElement.classList.contains('portrait')||document.documentElement.classList.contains('landscape-locked'));
 // Insets are in logical landscape UI coordinates. Rotate the safe rectangle
 // with the same clockwise CSS transform rather than treating portrait as wide.
 const i=c.insets??{left:0,right:0,top:0,bottom:0};
 const physical=c.width<c.height&&portrait?{left:i.bottom,right:i.top,top:i.left,bottom:i.right}:i;
 // Exercise env(safe-area-inset-*) itself, including P0 combat rails and canvas,
 // rather than changing only the decorative --ui-safe-* layer. This remains a
 // CDP simulation, and is never recorded as a UIKit or physical-notch result.
 await cdp.send('Emulation.setSafeAreaInsetsOverride',{insets:physical});
 await page.evaluate(()=>{for(const side of ['left','right','top','bottom'])document.documentElement.style.removeProperty('--ui-safe-'+side);dispatchEvent(new Event('resize'));});
 await settle();
 const safe=c.width<c.height&&portrait?{left:i.bottom,right:c.width-i.top,top:i.left,bottom:c.height-i.right}:{left:i.left,right:c.width-i.right,top:i.top,bottom:c.height-i.bottom};
 return {...c,portrait,physicalInsets:physical,safe};
}
async function metrics(selector){return page.locator(selector).evaluateAll(elements=>elements.map(element=>{
 const rect=element.getBoundingClientRect(),style=getComputedStyle(element);
 const visible=!!element.getClientRects().length&&style.visibility!=='hidden'&&style.display!=='none'&&Number(style.opacity)!==0;
 const center={x:rect.x+rect.width/2,y:rect.y+rect.height/2};
 // Decorative labels/guides intentionally use pointer-events:none. Temporarily
 // include this painted element in hit testing; restore synchronously without
 // sending input or changing layout. A parent button hit is also legitimate.
 const previousPointer=element.style.pointerEvents,pointerless=style.pointerEvents==='none';
 if(pointerless)element.style.pointerEvents='auto';
 const hit=document.elementFromPoint(center.x,center.y);
 if(pointerless)element.style.pointerEvents=previousPointer;
 const action=element.closest('button,a,[role=tab]');
 const range=document.createRange();range.selectNodeContents(element);
 return {selector:element.id||element.dataset.control||element.dataset.mode||element.className,text:element.textContent.trim(),rect:rect.toJSON(),textRects:[...range.getClientRects()].filter(r=>r.width&&r.height).map(r=>r.toJSON()),fontSize:parseFloat(style.fontSize),visible,unobscured:hit===element||element.contains(hit)||hit===action,scrollWidth:element.scrollWidth,clientWidth:element.clientWidth,scrollHeight:element.scrollHeight,clientHeight:element.clientHeight,ariaLabel:element.getAttribute('aria-label'),title:element.getAttribute('title')};
}));}
async function targets(selector,c,label,{minimum=0,text=false}={}){
 const rows=await metrics(selector);report.measurements.push({screen:label,case:c.id,selector,rows});
 check(rows.length>0,label+' exists',c.id);
 for(const row of rows){
  check(row.visible&&inside(row.rect,c.safe)&&row.unobscured,label+' visible and unobscured within safe area',{case:c.id,...row});
  if(minimum)check(row.rect.width>=minimum-.1&&row.rect.height>=minimum-.1,label+' target at least '+minimum+'px',{case:c.id,...row});
  if(text)for(const rect of row.textRects)check(inside(rect,row.rect),label+' rendered text stays within its box',{case:c.id,text:row.text,rect,box:row.rect});
 }
 return rows;
}
async function capture(name){await page.screenshot({path:path.join(evidence,name+'.png')});}

async function lobby(){
 await page.goto(root,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.documentElement.dataset.uiArt==='v17-p4-ui-art-1');
 const modeScenes=await page.locator('.mode-illustration').evaluateAll(nodes=>nodes.map(node=>getComputedStyle(node).backgroundImage));
 check(modeScenes.length===5&&new Set(modeScenes).size===5&&modeScenes.every(scene=>scene.includes('.webp')),'five mode scenes are distinct authored assets',{modeScenes});
 for(const item of cases){const c=await configure(item);
  await page.locator('.mode-hall').evaluate(node=>{node.scrollTop=0;});await settle();
  const scroll=await page.locator('.mode-hall').evaluate(node=>({top:node.scrollTop,height:node.scrollHeight,client:node.clientHeight}));
  check(scroll.top===0,'Lobby evidence starts before user scroll',{case:c.id,scroll});
  const cards=await targets('.modes a[data-mode]',c,'all five mode cards',{minimum:44});check(cards.length===5,'five routes retained',c.id);
  await targets('.modes a h2',c,'all five mode names',{text:true});
  const actions=await targets('.modes a :is(.mode-action,.mode-rule)',c,'all five mode actions',{text:true});check(actions.length===5,'five visible action captions',c.id);
  for(const name of await metrics('.modes a h2'))check(name.fontSize>=14,'mode names at least 14px',{case:c.id,...name});
  await capture('lobby-'+c.id);
 }
}
async function selection(){
 // Keep one scenario failure from inheriting an unrelated previous viewport.
 // Every required viewport (including portrait safe) is still measured below.
 await configure(cases[1]);
 await page.goto(new URL('dojo/?mode=battle',root).href,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.mamoken3d&&document.querySelectorAll('.fighter-card').length===9,undefined,{timeout:90000});
 // The longest existing roster name, not a synthetic replacement of UI text.
 const longest=await page.locator('.fighter-card').evaluateAll(nodes=>nodes.map(node=>({name:node.querySelector('span').textContent,length:node.querySelector('span').textContent.length})).sort((a,b)=>b.length-a.length)[0].name);
 await page.locator('.fighter-card').filter({hasText:longest}).click();await settle();
 for(const item of cases){const c=await configure(item);
  await page.locator('#selection').evaluate(node=>{node.scrollTop=0;});await settle();
  const cards=await targets('.fighter-card',c,'all nine fighters before scrolling',{minimum:44});check(cards.length===9,'nine roster targets retained',c.id);
  await targets('.fighter-card span',c,'full fighter names',{text:true});
  await targets('.p4-profile [data-strength],.p4-profile [data-weakness]',c,'selected strengths and weaknesses',{text:true});
  await targets('#start',c,'start and roster visible together',{minimum:44,text:true});
  check(await page.locator('#arena > .hud').evaluate(node=>getComputedStyle(node).visibility==='hidden'),'battle HUD is hidden while choosing a fighter',c.id);
  try{await page.locator('.fighter-card').filter({hasText:longest}).click({timeout:2500});check(true,'longest fighter can be selected in this viewport',c.id);}catch(error){check(false,'longest fighter can be selected in this viewport',{case:c.id,error:error.message});}
  const chosen=await page.locator('#chosen-name').textContent();check(chosen===longest,'longest actual fighter selected',{case:c.id,chosen,longest});
  await capture('selection-'+c.id);
 }
}
async function editor(){
 await configure(cases[1]);
 await page.goto(new URL('story/',root).href,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.mamokenStory?.previewReady,undefined,{timeout:120000});
 const name='ダークモグゾーと山あいを旅するマーモット'.slice(0,24);
 await page.locator('#avatar-name').fill(name);
 // Choose the longest enabled real move label so layout stress preserves the
 // actual catalog/compatibility contract. Do not silently select disabled moves.
 await page.locator('#p4-editor-tab-2').click();
 const option=await page.locator('#move-0 option').evaluateAll(nodes=>nodes.filter(node=>!node.disabled).map(node=>({value:node.value,label:node.textContent})).sort((a,b)=>b.label.length-a.label.length)[0]);
 await page.locator('#move-0').selectOption(option.value);await settle();
 report.measurements.push({screen:'editor-long-inputs',name,actualMove:option});
 for(const item of cases){const c=await configure(item);
  for(let tab=0;tab<4;tab++){
   await page.locator('#p4-editor-tab-'+tab).click();await settle();
   await targets('.p4-editor-tabs [role=tab]',c,'all editor tabs '+tab,{minimum:44,text:true});
   const footer=await targets('#enter',c,'persistent editor save action '+tab,{minimum:44,text:true});
   const pane=page.locator('.p4-editor-scroll');
   check(await pane.count()===1,'editor has one dedicated content scroller',{case:c.id,tab});
   if(await pane.count()){
    for(const edge of ['top','bottom']){
     await pane.evaluate((node,edge)=>{node.scrollTop=edge==='top'?0:node.scrollHeight;},edge);await settle();
     await targets('.p4-editor-tabs [role=tab],#enter',c,'fixed editor navigation at '+edge+' tab '+tab);
     const panes=await metrics('.p4-editor-scroll');const paneRect=panes[0].rect;
     const navigation=await metrics('.p4-editor-tabs,.p4-editor-footer');
     for(const node of navigation)check(!overlaps(paneRect,node.rect),'editor content viewport does not overlap fixed navigation',{case:c.id,tab,edge,pane:paneRect,navigation:node});
    }
    const controls=pane.locator('input,select,button,summary').filter({visible:true});
    const count=await controls.count();
    if(count){
     for(const index of [...new Set([0,count-1])]){
      const field=controls.nth(index);await field.scrollIntoViewIfNeeded();await settle();
      const bounds=await field.boundingBox();const paneBox=await pane.boundingBox();
      check(bounds&&paneBox&&inside({...bounds,right:bounds.x+bounds.width,bottom:bounds.y+bounds.height},{left:paneBox.x,top:paneBox.y,right:paneBox.x+paneBox.width,bottom:paneBox.y+paneBox.height}),'first/last editor field can be fully exposed',{case:c.id,tab,index,bounds,paneBox});
     }
    }
    if(tab===3){
     await pane.evaluate(node=>{node.scrollTop=0;});await settle();
     const initialSummary=await page.locator('.p4-save-summary').boundingBox(),initialPane=await pane.boundingBox();
     check(initialSummary&&initialPane&&inside({...initialSummary,right:initialSummary.x+initialSummary.width,bottom:initialSummary.y+initialSummary.height},{left:initialPane.x,top:initialPane.y,right:initialPane.x+initialPane.width,bottom:initialPane.y+initialPane.height}),'confirmation initially shows every summary row together',{case:c.id,initialSummary,initialPane});
     const paper=await page.locator('.p4-save-summary').evaluate(node=>getComputedStyle(node).backgroundColor);
     const paperRGBA=paper.match(/[\d.]+/g)?.map(Number)??[];
     check(paperRGBA.length>=3&&(paperRGBA[3]??1)===1&&paperRGBA.slice(0,3).every(value=>value>200),'confirmation text has opaque light paper beneath the decorative cutout',{case:c.id,paper});
     const entries=pane.locator('.p4-save-summary > div');check(await entries.count()===4,'save summary retains four explicit entries',c.id);
     for(let index=0;index<await entries.count();index++){
      const entry=entries.nth(index);await entry.scrollIntoViewIfNeeded();await settle();
      const bounds=await entry.boundingBox(),paneBox=await pane.boundingBox();
      check(bounds&&paneBox&&inside({...bounds,right:bounds.x+bounds.width,bottom:bounds.y+bounds.height},{left:paneBox.x,top:paneBox.y,right:paneBox.x+paneBox.width,bottom:paneBox.y+paneBox.height}),'each save summary entry is independently reachable',{case:c.id,index,bounds,paneBox,text:await entry.textContent()});
      for(const row of await metrics('.p4-save-summary > div:nth-child('+(index+1)+') dd'))for(const rect of row.textRects)check(inside(rect,row.rect),'full saved summary text wraps inside its own cell',{case:c.id,index,text:row.text,rect,cell:row.rect});
     }
     check(await page.locator('[data-save-name]').textContent()===name,'full long saved name retained in summary',c.id);
    }
   }
   check(footer.length===1,'one unambiguous save/continue action',{case:c.id,tab});
   await capture('editor-'+c.id+'-tab'+tab);
  }
 }
 await page.locator('#p4-editor-tab-3').click();await page.locator('#enter').click();
 await page.waitForFunction(()=>mamokenStory.mode==='explore',undefined,{timeout:120000});
 check(await page.evaluate(()=>mamokenStory.avatar.name)===name,'long custom name survives save');
 for(const item of cases){const c=await configure(item);
  await targets('#help',c,'exploration instructions',{text:true});
  const style=await page.locator('#help').evaluate(node=>{const s=getComputedStyle(node);return {font:parseFloat(s.fontSize),color:s.color,background:s.backgroundColor};});
  const bg=style.background.match(/[\d.]+/g)?.map(Number)??[];
  check(style.font>=12&&bg[0]===16&&bg[1]===39&&bg[2]===31&&(bg[3]??1)>=.9,'exploration guide has a readable independent surface',{case:c.id,style});
  const help=await page.locator('#help').boundingBox(),stick=await page.locator('#stick-rail').boundingBox();
  check(help&&stick&&!overlaps({...help,right:help.x+help.width,bottom:help.y+help.height},{...stick,right:stick.x+stick.width,bottom:stick.y+stick.height}),'exploration instructions do not cover movement controls',{case:c.id,help,stick});
  await capture('exploration-'+c.id);
 }
 await configure(cases[1]);
 await page.keyboard.down('w');try{await page.waitForFunction(()=>mamokenStory.nearby?.id==='moguzo',undefined,{timeout:30000});}finally{await page.keyboard.up('w');}
 await page.locator('#talk').tap();await page.locator('#challenge').click();
 await page.waitForFunction(()=>mamokenStory.mode==='battle'&&mamokenStory.battle.frame>5,undefined,{timeout:120000});
 await battleControls('story');
}
async function setResources(kind,ready){
 await page.evaluate(({kind,ready})=>{
  const g=kind==='story'?mamokenStory.battle:mamoken3d.battle;
  const [p,t]=g.fighters;p.super=ready?100:0;p.drive=ready?100:0;p.gyuiinCooldown=p.roarCooldown=0;p.y=0;p.action=null;p.stun=p.stop=p.dashF=0;
  // Freeze the opponent's actions without replacing the game's HUD update.
  t.stun=99999;t.action=null;g.projectiles=[];g.time=75*60;
 },{kind,ready});
 await page.waitForFunction(ready=>document.querySelector('#ultimate-status')?.textContent===(ready?'発動可':'ゲージ不足'),ready,{timeout:15000});
}
async function battleControls(kind){
 const selector=kind==='story'?'#battle-buttons .attack':'#buttons-rail .attack';
 for(const item of cases){const c=await configure(item);
  for(const ready of [false,true]){
   await setResources(kind,ready);
   if(kind==='dojo'){
    // Use a real, current pause message. The start message intentionally expires
    // after 48 simulation frames and an empty hidden message has no rectangle.
    await page.locator('#pause').click();
    await page.waitForFunction(()=>document.querySelector('#note')?.textContent==='一時停止');
    const note=await page.locator('#note').boundingBox(),hud=await page.locator('#arena > .hud').boundingBox();
    check(note&&hud&&!overlaps({...note,right:note.x+note.width,bottom:note.y+note.height},{...hud,right:hud.x+hud.width,bottom:hud.y+hud.height}),'battle status never covers HP/Drive/ultimate meters',{case:c.id,note,hud});
    check(await page.locator('#app .footnote #note').count()===1,'battle status occupies reserved footer',{case:c.id});
    await page.locator('#pause').click();
   }
   const buttons=await targets(selector,c,kind+' six combat buttons '+ready,{minimum:44});check(buttons.length===6,kind+' retains six controls',{case:c.id,ready});
   const glyphs=await page.locator(selector).evaluateAll(nodes=>nodes.map(button=>{
    const label=button.querySelector('.attack-label'),svg=button.querySelector('svg.bt');
    const glyph=svg?.querySelector('.bt-glyph-ink');
    const rect=glyph?.getBoundingClientRect();
    return {
     key:button.dataset.control,symbol:svg?.dataset.symbol,fallback:label?.textContent,
     fallbackClipped:label&&getComputedStyle(label).clipPath==='inset(50%)',
     rect:rect?.toJSON(),button:button.getBoundingClientRect().toJSON(),
     stroke:glyph&&getComputedStyle(glyph).stroke,
     hit:rect&&document.elementFromPoint(rect.x+rect.width/2,rect.y+rect.height/2)?.closest('button')===button,
    };
   }));
   check(glyphs.map(glyph=>glyph.symbol).join('')==='BAYZSX',kind+' uses the approved SVG action symbols',{case:c.id,ready,glyphs});
   for(const glyph of glyphs){
    check(glyph.fallbackClipped&&glyph.fallback===glyph.symbol,kind+' retains the clipped fallback symbol',{case:c.id,ready,glyph});
    check(glyph.stroke&&glyph.stroke!=='none'&&glyph.hit&&inside(glyph.rect,glyph.button)&&inside(glyph.rect,c.safe),kind+' paints an unobscured glyph inside its own button',{case:c.id,ready,glyph});
   }
   const gauge=await page.locator('#hud-side-0 .resource').evaluateAll(rows=>rows.map(row=>row.classList[1]));
   check(gauge.join('/')==='health/super/drive',kind+' shows HP, ultimate and Drive in order',{case:c.id,gauge});
   const readySignal=await page.locator('#ultimate-ready-0').isVisible();
   check(readySignal===ready,kind+' mirrors ultimate readiness in the HUD',{case:c.id,ready,readySignal});
   const portraits=await page.locator('.hud-eye img').evaluateAll(images=>images.map(img=>img.complete&&img.naturalWidth>0));
   check(portraits.length===2&&portraits.every(Boolean),kind+' uses both real roster portraits',{case:c.id,portraits});
   const statuses=await page.locator('#gyuiin-status,#roar-status,#ultimate-status').evaluateAll(nodes=>nodes.map(node=>({id:node.id,text:node.textContent,parentLabel:node.parentElement.getAttribute('aria-label'),className:node.className})));
   check(statuses.length===3&&statuses.every(s=>s.parentLabel),kind+' retains accessible status contracts',{case:c.id,ready,statuses});
   report.measurements.push({screen:kind+'-statuses',case:c.id,ready,statuses});
   // HP/resource/long fighter name boxes may truncate deliberately, but their
   // actual text must stay inside the HUD region and keep full accessible copy.
   const hud=await metrics('.hud-name');for(let i=0;i<hud.length;i++)for(let j=i+1;j<hud.length;j++)check(!overlaps(hud[i].rect,hud[j].rect),kind+' fighter name regions remain separated',{case:c.id,ready,left:hud[i],right:hud[j]});
   await capture(kind+'-controls-'+c.id+'-'+(ready?'ready':'unavailable'));
  }
 }
}
async function dojo(){
 await configure(cases[1]);
 await page.goto(new URL('dojo/?mode=battle',root).href,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.mamoken3d,undefined,{timeout:90000});
 await page.locator('.fighter-card').filter({hasText:'ダークモグゾー'}).click();
 await page.locator('#start').click();
 await page.waitForFunction(()=>mamoken3d.presentation.loaded&&mamoken3d.presentation.inputEnabled&&mamoken3d.presentation.state==='fight'&&mamoken3d.battle?.frame>2,undefined,{timeout:120000});
 await battleControls('dojo');
}
try{
 if(!root){server=http.createServer(async(request,response)=>{try{let file=path.resolve(siteRoot,'.'+decodeURIComponent(new URL(request.url,'http://localhost').pathname));if(file!==siteRoot&&!file.startsWith(siteRoot+path.sep)){response.writeHead(403);response.end();return;}if((await stat(file)).isDirectory())file=path.join(file,'index.html');response.writeHead(200,{'content-type':mime[path.extname(file)]??'application/octet-stream','cache-control':'no-store'});response.end(await readFile(file));}catch{response.writeHead(404);response.end('Not found');}});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));root='http://127.0.0.1:'+server.address().port+'/';}
 report.url=root;
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH??'/usr/bin/google-chrome',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const record=process.env.MAMOKEN_UI_VIDEO==='1';
 context=await browser.newContext({viewport:{width:852,height:393},isMobile:true,hasTouch:true,deviceScaleFactor:1,...(record?{recordVideo:{dir:path.join(evidence,'video'),size:{width:852,height:393}}}:{})});
 page=await context.newPage();video=page.video();cdp=await context.newCDPSession(page);
 page.on('pageerror',error=>report.errors.push(error.message));page.on('response',response=>{if(response.status()>=400&&!response.url().endsWith('favicon.ico'))report.errors.push(response.status()+' '+response.url());});
 for(const [name,run] of [['lobby',lobby],['selection',selection],['dojo',dojo],['editor-and-story',editor]]){
  try{await run();}catch(error){check(false,name+' scenario completed',error.message);await capture('failure-'+name).catch(()=>{});}
 }
 check(report.errors.length===0,'no browser or HTTP resource errors',report.errors);
 report.passed=report.checks.filter(row=>row.pass).length;report.failed=report.checks.length-report.passed;
 await context.close();context=null;
 if(video){const file=await video.path();report.video={artifactPath:path.relative(evidence,file),bytes:(await stat(file)).size,audio:false,scope:'Silent interface/navigation evidence; not audio-quality evidence or measured gameplay FPS'};}
 await writeFile(path.join(evidence,'report.json'),JSON.stringify(report,null,2)+'\n');
 assert.equal(report.failed,0,report.failed+' P4 polish geometry checks failed; see polish/report.json');
 console.log('P4 POLISH GEOMETRY PASS:',report.passed,'checks at',sha);
}catch(error){
 report.fatal=error.message;await writeFile(path.join(evidence,'report.json'),JSON.stringify(report,null,2)+'\n');throw error;
}finally{await context?.close().catch(()=>{});await browser?.close().catch(()=>{});if(server)await new Promise(resolve=>server.close(resolve));}
