import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('playwright-core');
const base=process.env.MAMOKEN_WIKI_URL||'http://127.0.0.1:4174/wiki/';
const evidence=process.env.MAMOKEN_WIKI_EVIDENCE||'/tmp/mamoken-wiki-acceptance';
await mkdir(evidence,{recursive:true});
const browser=await chromium.launch({
 executablePath:process.env.CHROMIUM_PATH||'/usr/bin/google-chrome',
 args:['--no-sandbox']
});
const errors=[];
const page=await browser.newPage({viewport:{width:1180,height:850},deviceScaleFactor:1});
page.on('pageerror',e=>errors.push(e.message));
page.on('response',r=>{
 if(r.url().startsWith('http://127.0.0.1:4174')&&r.status()>=400&&!r.url().endsWith('favicon.ico'))errors.push('HTTP '+r.status()+' '+r.url());
});
const fighters=['moguzo','pisuke','godan','hakuma','chirka','takimaru','yomikage','bullet','dark_moguzo'];
try{
 await page.goto(base,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.querySelectorAll('#fighter-nav button').length===9,undefined,{timeout:12000});
 assert.equal(await page.locator('#fighter-heading h2').textContent(),'モグゾー');
 assert.match(await page.title(),/3D v15.1/);
 const oldLink=page.getByRole('link',{name:'旧2D版はこちら'});
 assert.equal(await oldLink.count(),1,'old wiki has a separate link');
 const oldPage=await browser.newPage();
 await oldPage.goto(new URL('legacy-2d.html',base),{waitUntil:'domcontentloaded'});
 assert.match(await oldPage.title(),/マモ拳 攻略Wiki/);
 assert.ok((await oldPage.locator('body').textContent()).includes('モグゾー'));
 await oldPage.close();
 const v14=await page.request.get(new URL('v14-development.html',base).href);
 assert.equal(v14.status(),200,'v14 archive kept');
 const historic=await page.request.get(new URL('v151-development.html',base).href);
 assert.equal(historic.status(),200,'v15.1 old URL retained');
 assert.ok((await historic.text()).includes("index.html"),'v15.1 old URL redirects');
 const checked=[];
 for(const id of fighters){
  await page.locator('[data-id="'+id+'"]').click();
  assert.equal(await page.locator('#normal-table tbody tr').count(),6,id+'/normals');
  assert.equal(await page.locator('#special-table tbody tr').count(),4,id+'/specials');
  assert.equal(await page.locator('#shared-table tbody tr').count(),3,id+'/shared');
  assert.equal(await page.locator('.video-item video').count(),3,id+'/videos');
  assert.equal(await page.locator('#normal-details details').count(),6,id+'/details');
  const hrefs=await page.locator('#video-grid a').evaluateAll(els=>els.map(el=>el.href));
  assert.ok(hrefs.every(h=>h.endsWith('.mp4')&&h.includes('78dd0c685d78af617896c01bd95a277928e01368')),id+'/video links');
  const localVideo=await page.locator('#video-grid video source').first().getAttribute('src');
  assert.equal(localVideo,'v151/videos/'+id+'_normals_before_after.mp4');
  const mp4=await page.request.get(new URL(localVideo,base).href);
  assert.equal(mp4.status(),200,id+' video fetch');
  assert.match(mp4.headers()['content-type']||'',/video\/mp4/);
  checked.push(id);
  await page.screenshot({path:evidence+'/'+id+'-wiki.png',fullPage:false});
 }
 await page.locator('[data-id="pisuke"]').click();
 const table=await page.locator('#normal-table tbody').textContent();
 assert.ok(table.includes('0.376m')&&table.includes('0.335m'),'Pisuke grounded reach');
 await page.locator('[data-edit="stand_heavy"]').first().click();
 const memo=await page.locator('#change-request').inputValue();
 assert.match(memo,/ピスケ／立ち強/);
 assert.match(memo,/発生11F/);
 assert.match(memo,/実測reach 0.335m/);
 await page.locator('#normal-details details').first().evaluate(el=>el.open=true);
 assert.equal(await page.locator('#normal-details details[open]').count(),1);
 await page.setViewportSize({width:390,height:844});
 await page.locator('[data-id="bullet"]').click();
 assert.equal(await page.locator('#fighter-heading h2').textContent(),'バレット');
 const scroll=await page.locator('#normal-table').evaluate(el=>({c:el.clientWidth,s:el.scrollWidth}));
 assert.ok(scroll.s>=scroll.c,'narrow phone tables must scroll without breaking layout');
 assert.ok(await page.locator('#fighter-nav button').nth(8).isVisible());
 await page.screenshot({path:evidence+'/mobile-bullet-wiki.png',fullPage:true});
 assert.deepEqual(errors,[]);
 console.log('MAMOKEN V15.1 WIKI PASS: 9 fighters, 90 techniques, 27 videos, move details, copy template, mobile layout, PR199 source');
}catch(e){
 await page.screenshot({path:evidence+'/failure.png',fullPage:true}).catch(()=>{});
 console.error('WIKI ERRORS',errors,'COMPLETE',evidence);
 throw e;
}finally{await browser.close();}
