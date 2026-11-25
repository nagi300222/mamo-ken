// Usage: node design/battle-ui-v2/render-board.cjs <out.png>  (server on :4173 at repo root)
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:900,height:820},deviceScaleFactor:2});
const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.goto('http://127.0.0.1:4173/design/battle-ui-v2/preview.html');await p.waitForTimeout(800);
await p.screenshot({path:process.argv[2],fullPage:true});console.log(errs);await b.close();})();
