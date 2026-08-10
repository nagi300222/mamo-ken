#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const OUT=path.join(ROOT,'reports','ui-visual-audit');
const URL=pathToFileURL(path.join(ROOT,'dist','mamoken_mobile.html')).href;
const LOGICAL={width:540,height:960};
const VIEWPORTS=[
  {id:'320x568',width:320,height:568},
  {id:'390x844',width:390,height:844},
  {id:'430x932',width:430,height:932},
];

await mkdir(OUT,{recursive:true});
const browser=await chromium.launch({headless:true});
const manifest={version:'mamoken-ui-visual-audit-v1',url:'dist/mamoken_mobile.html',viewports:[],errors:[]};

async function delay(page,ms=250){await page.waitForTimeout(ms);}
async function clickLogical(page,x,y){
  const canvas=page.locator('#game');
  const box=await canvas.boundingBox();
  if(!box)throw new Error('canvas bounding box unavailable');
  await page.mouse.click(box.x+x/LOGICAL.width*box.width,box.y+y/LOGICAL.height*box.height);
  await delay(page);
}
async function shot(page,viewportId,name){
  const file=`${viewportId}-${name}.png`;
  await page.screenshot({path:path.join(OUT,file),fullPage:true});
  return file;
}
async function globalEval(page,source){
  return page.evaluate((script)=>window.eval(script),source);
}

for(const viewport of VIEWPORTS){
  const context=await browser.newContext({viewport:{width:viewport.width,height:viewport.height},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',(error)=>errors.push(`pageerror: ${error.message}`));
  page.on('console',(message)=>{if(message.type()==='error')errors.push(`console: ${message.text()}`);});
  await page.goto(URL,{waitUntil:'load'});
  await page.waitForSelector('#game');
  await delay(page,1200);
  const files=[];
  files.push(await shot(page,viewport.id,'01-title'));

  await clickLogical(page,270,700); // MENU-R1(#111): タイトルのBATTLEボタン(旧: タップ場所を問わずselectへ遷移)
  await clickLogical(page,270,250); // menuBattleのVS CPUボタン→select
  files.push(await shot(page,viewport.id,'02-select-moguzo'));

  await clickLogical(page,270,420); // Bullet: row 2, column 3
  files.push(await shot(page,viewport.id,'03-select-bullet'));

  await clickLogical(page,270,514);
  files.push(await shot(page,viewport.id,'04-detail-performance'));
  await clickLogical(page,270,145);
  files.push(await shot(page,viewport.id,'05-detail-moves'));
  await clickLogical(page,438,145);
  files.push(await shot(page,viewport.id,'06-detail-combos'));
  await clickLogical(page,270,909);

  await clickLogical(page,372,318); // Hakuma: row 1, column 4
  files.push(await shot(page,viewport.id,'07-select-hakuma'));
  await clickLogical(page,270,698);
  await delay(page,900);
  files.push(await shot(page,viewport.id,'08-battle-trial'));

  await clickLogical(page,517,23);
  files.push(await shot(page,viewport.id,'09-pause'));
  await clickLogical(page,270,510);
  files.push(await shot(page,viewport.id,'10-movelist-trial'));

  try{
    await globalEval(page,"B.result='WIN';game.screen='result';");
    await delay(page);
    files.push(await shot(page,viewport.id,'11-result-trial'));
  }catch(error){
    errors.push(`result-state: ${error.message}`);
  }

  const canvas=await page.locator('#game').boundingBox();
  manifest.viewports.push({id:viewport.id,width:viewport.width,height:viewport.height,canvas,files,errors:[...errors]});
  manifest.errors.push(...errors.map((error)=>`${viewport.id}: ${error}`));
  await context.close();
}

await browser.close();
await writeFile(path.join(OUT,'manifest.json'),JSON.stringify(manifest,null,2)+'\n','utf8');
if(manifest.errors.length)throw new Error(`visual audit browser errors:\n${manifest.errors.join('\n')}`);
console.log(`UI visual audit captured; viewports=${VIEWPORTS.length}; screenshots=${manifest.viewports.reduce((sum,item)=>sum+item.files.length,0)}`);
