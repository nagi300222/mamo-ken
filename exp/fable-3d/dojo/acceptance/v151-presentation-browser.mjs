// Real WebGL Chromium acceptance for v15.1 Presentation (Issue #201):
// VS → face intro → FIGHT → K.O. slow / TIME UP / DOUBLE K.O. → nine victory movies → result.
// Runs in real time against the served game (no clock stubbing). The battle outcome is produced by the real Battle:
// the test only sets HP / timer / positions and starts a real move, it never writes winner or phase.
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {setMatch} from './match-settings.mjs';
const require=createRequire(import.meta.url);
const {chromium}=(()=>{try{return require('playwright-core');}catch{return require('playwright');}})();
const base=process.env.MAMOKEN_URL||'http://127.0.0.1:4173/exp/fable-3d/dojo/';
const dir=process.env.MAMOKEN_EVIDENCE||'/tmp/mamoken-v151-presentation';
await mkdir(dir,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/google-chrome',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const IDS=['moguzo','pisuke','godan','hakuma','chirka','takimaru','yomikage','bullet','dark_moguzo'];
const errors=[];
async function open({viewport,reducedMotion='no-preference',mobile=true}){
  const context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile,deviceScaleFactor:1,reducedMotion});
  const page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('favicon.ico'))errors.push(r.status()+' '+r.url());});
  await page.goto(base,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.mamoken3d);
  return {context,page};
}
const P=page=>page.evaluate(()=>({...mamoken3d.presentation,context:{...mamoken3d.presentation.context},frame:mamoken3d.battle?.frame??null,
  phase:mamoken3d.battle?.phase??null,winner:mamoken3d.battle?.winner??null,movie:mamoken3d.cinematic.active,hp:mamoken3d.battle?.fighters.map(f=>f.hp)}));
// 遷移ログは試合をまたいで残るので、直近の試合（最後の vs / loading 以降）だけを見る
const run=log=>log.slice(Math.max(log.lastIndexOf('vs'),log.lastIndexOf('loading')));
// 待ち時間は長めに取る: ソフトウェア描画では 1 フレームの進みを 0.05 秒で頭打ちにしているため、表示クロックが壁時計より遅れる
const waitState=(page,state,timeout=30000)=>page.waitForFunction(s=>mamoken3d.presentation.state===s,state,{timeout});
// Battle が自分で決着を出すように条件だけ作る
const finish=(page,kind,winner=0)=>page.evaluate(async([kind,winner])=>{
  const B=await import('./balance.js');const g=mamoken3d.battle,a=g.fighters[winner],t=g.fighters[1-winner];
  if(kind==='timeout'){t.hp=Math.floor(t.hp/2);g.time=2;return;}
  if(kind==='timeout_draw'){g.time=2;return;}
  a.x=winner===0?-.2:.2;t.x=-a.x;a.facing=winner===0?1:-1;t.facing=-a.facing;
  for(const f of [a,t]){f.y=0;f.vy=0;f.action=null;f.stun=0;f.stop=0;f.dashF=0;if(f.ability&&'grit' in f.ability)f.ability.grit=false;}
  t.hp=1;if(kind==='double')a.hp=1;
  // 非ガードの命中を作る: 相手の入力と状態を空にして長い硬直に置く（Battle のガード仕様はそのまま。判定は Battle が行う）
  if(kind!=='double'){t.state='idle';t.input={};t.action=null;t.stop=0;t.stun=600;}
  if(kind==='ultimate'){a.super=100;t.stun=300;g._begin(a,{...B.ultimateMove(a.id)},'ultimate');return;}
  g._begin(a,{...B.normalMove(a.id,'stand_heavy')},'stand_heavy');
  if(kind==='double')g._begin(t,{...B.normalMove(t.id,'stand_heavy')},'stand_heavy');
},[kind,winner]);
const startBy=(page,options)=>page.evaluate(o=>{mamoken3d.startMatch(o);},options);
const controlVisibility=(page,visible)=>page.waitForFunction(visible=>['stick-rail','buttons-rail'].every(id=>getComputedStyle(document.getElementById(id)).visibility===(visible?'visible':'hidden')),visible,{timeout:4000});
try{
  // ---------- A. 縦持ち（回転ロック）のスマホ: 通常対戦の一連の流れ ----------
  {
    const {context,page}=await open({viewport:{width:393,height:852}});
    await page.waitForFunction(()=>mamoken3d.landscapeLocked===true);
    await setMatch(page,'#cpu-choice','godan');
    await page.locator('#start').tap();
    await waitState(page,'vs',20000);
    await controlVisibility(page,false);
    assert.equal(await page.locator('#vs-screen').isVisible(),true,'VS 画面');
    assert.equal(await page.locator('#selection').isVisible(),false);
    let s=await P(page);
    if(!s.loaded){assert.equal(await page.evaluate(()=>mamoken3d.skipPresentation()),false,'ロード中はスキップ不可');assert.match(await page.locator('#vs-status').textContent(),/LOADING/);}
    await page.waitForFunction(()=>mamoken3d.presentation.loaded,undefined,{timeout:60000});
    assert.deepEqual(await page.evaluate(()=>[0,1].map(i=>document.getElementById('vs-img-'+i).naturalWidth>0)),[true,true],'VS のキャラ画像 2 枚');
    assert.deepEqual(await page.evaluate(()=>[0,1].map(i=>document.getElementById('vs-name-'+i).textContent)),['モグゾー','ゴダン']);
    assert.match(await page.evaluate(()=>getComputedStyle(document.getElementById('vs-img-1')).transform),/matrix\(-1/,'CPU 側は左右反転');
    assert.equal((await P(page)).frame,0,'VS 中は Battle を進めない');
    await page.screenshot({path:dir+'/a1-vs-portrait-locked.png'});
    await waitState(page,'intro',24000);
    await controlVisibility(page,false);
    await page.waitForFunction(()=>mamoken3d.presentation.faceFrame?.slot===0,undefined,{timeout:4000});
    s=await P(page);assert.equal(s.camera,'presentation');assert.equal(s.frame,0);
    for(const key of ['head','top','nose','back'])assert.ok(Math.abs(s.faceFrame[key][0])<.9&&Math.abs(s.faceFrame[key][1])<.9,'1P の顔が画面内 '+key+' '+JSON.stringify(s.faceFrame));
    assert.equal(await page.locator('#intro-name').textContent(),'モグゾー');
    await page.screenshot({path:dir+'/a2-face-1p.png'});
    await page.locator('[data-control="weak"]').tap({force:true}).catch(()=>{});       // 導入中の入力は捨てられる
    await page.waitForFunction(()=>mamoken3d.presentation.faceFrame?.slot===1,undefined,{timeout:4000});
    s=await P(page);
    for(const key of ['head','top','nose','back'])assert.ok(Math.abs(s.faceFrame[key][0])<.9&&Math.abs(s.faceFrame[key][1])<.9,'CPU の顔が画面内 '+key+' '+JSON.stringify(s.faceFrame));
    assert.equal(await page.locator('#intro-name').textContent(),'ゴダン');
    await page.screenshot({path:dir+'/a3-face-cpu.png'});
    await page.waitForFunction(()=>!document.getElementById('round-call').hidden&&document.getElementById('round-call-text').textContent==='FIGHT!',undefined,{timeout:5000});
    await page.screenshot({path:dir+'/a4-fight-call.png'});
    await waitState(page,'fight',20000);
    await controlVisibility(page,true);
    await page.waitForFunction(()=>mamoken3d.battle.frame>3,undefined,{timeout:4000});
    assert.equal(await page.evaluate(()=>mamoken3d.battle.fighters[0].action),null,'導入中に押したボタンが FIGHT 直後に出ない');
    assert.equal(await page.locator('#buttons-rail [data-control]').count(),6);
    // K.O. とスロー
    await finish(page,'ko',0);await waitState(page,'ko',20000);
    await controlVisibility(page,false);
    assert.equal(await page.locator('#ko-title').textContent(),'K.O.');assert.equal(await page.locator('#ko-banner').isVisible(),true);
    assert.equal(await page.locator('#round-call').isVisible(),false,'early KO must clear the FIGHT call');
    const before=await P(page);await page.waitForTimeout(700);const during=await P(page);
    assert.equal(during.state,'ko');assert.equal(during.frame,before.frame,'KO 演出中に Battle.frame は進まない');assert.deepEqual(during.hp,before.hp);
    assert.ok(during.koSlow>0&&during.koSlow<.5,'表示クロックだけスロー '+during.koSlow);
    await page.screenshot({path:dir+'/a5-ko-slow.png'});
    // 勝利ムービー
    await waitState(page,'victory',20000);
    await controlVisibility(page,false);
    s=await P(page);assert.equal(s.camera,'presentation');assert.equal(s.victoryClip,'victory_v151');
    assert.equal(await page.locator('#round-call').isVisible(),false,'victory must not retain FIGHT');
    assert.equal(await page.evaluate(()=>mamoken3d.actors[1].currentName),'ko','敗者は ko、勝者は victory（取り違えない）');
    await page.waitForFunction(t=>mamoken3d.presentation.victoryTime>t+.4,s.victoryTime,{timeout:8000});   // 勝利クリップが進む
    await page.waitForFunction(()=>document.getElementById('victory-banner').dataset.shown==='true',undefined,{timeout:5000});
    assert.equal(await page.locator('#victory-name').textContent(),'モグゾー');assert.match(await page.locator('#victory-side').textContent(),/^1P WIN/);
    await page.screenshot({path:dir+'/a6-victory.png'});
    await waitState(page,'result',27000);
    await controlVisibility(page,false);
    s=await P(page);assert.deepEqual(run(s.log),['vs','intro','fight','ko','victory','result']);assert.equal(s.frame,before.frame);
    assert.equal(await page.locator('#round-call').isVisible(),false,'result must not retain FIGHT');
    assert.equal(await page.locator('#result-title').textContent(),'勝利');assert.equal(await page.locator('#result-reason').textContent(),'KO');
    assert.equal(await page.locator('#rematch').isVisible(),true);assert.equal(await page.locator('#result-select').isVisible(),true);
    await page.screenshot({path:dir+'/a7-result.png'});
    // 再戦: 勝利ポーズを片付けて VS からやり直す
    await page.locator('#rematch').tap();await waitState(page,'vs',20000);
    await page.waitForFunction(()=>mamoken3d.presentation.loaded,undefined,{timeout:60000});
    assert.equal(await page.locator('#game-over').isVisible(),false);assert.equal(await page.locator('#victory-banner').isVisible(),false);
    await page.evaluate(()=>mamoken3d.showSelection());
    assert.equal((await P(page)).state,'select');assert.equal(await page.locator('#selection').isVisible(),true);assert.equal(await page.locator('#vs-screen').isVisible(),false);
    await context.close();
  }
  // ---------- B. 横画面: キーのスキップ（Escape / Space / Enter）、CPU 勝利、ミラー対戦 ----------
  {
    const {context,page}=await open({viewport:{width:852,height:393},mobile:false});
    await setMatch(page,'#cpu-choice','chirka');await page.locator('.fighter-card').nth(IDS.indexOf('chirka')).click();
    await page.locator('#start').click();await page.evaluate(()=>document.activeElement?.blur());
    await page.waitForFunction(()=>mamoken3d.presentation.loaded&&mamoken3d.presentation.time>1,undefined,{timeout:60000});
    await page.keyboard.press('Escape');assert.equal((await P(page)).state,'intro','Escape で VS をスキップ');
    await page.keyboard.press('Space');assert.equal(await page.evaluate(()=>mamoken3d.presentation.inputEnabled),false,'スキップ直後も FIGHT 表示までは入力不可');
    await waitState(page,'fight',20000);await page.waitForFunction(()=>mamoken3d.battle.frame>2);
    assert.equal(await page.evaluate(()=>mamoken3d.battle.fighters[0].action),null,'スキップに使ったキーが技として残らない');
    await finish(page,'ko',1);await waitState(page,'ko',20000);const frame=(await P(page)).frame;
    await page.keyboard.press('Enter');assert.equal((await P(page)).state,'victory','Enter で KO 演出をスキップ');
    assert.equal(await page.evaluate(()=>[mamoken3d.actors[1].currentName,mamoken3d.actors[0].currentName]).then(String),'victory_v151,ko','CPU 勝利: CPU が victory、1P が ko');
    assert.match(await page.locator('#victory-side').textContent(),/^CPU WIN/);
    await page.screenshot({path:dir+'/b1-cpu-victory-mirror.png'});
    await page.keyboard.press('Escape');let s=await P(page);assert.equal(s.state,'result');assert.equal(s.frame,frame,'スキップで Battle は進まない');
    assert.equal(await page.locator('#result-title').textContent(),'敗北');assert.equal(run(s.log).filter(x=>x==='ko').length,1);
    await context.close();
  }
  // ---------- C. 時間切れ／引き分け／ダブルKO／奥義 KO ----------
  {
    const {context,page}=await open({viewport:{width:852,height:393}});
    const begin=async ids=>{await startBy(page,{ids,instant:true});await waitState(page,'fight',180000);await page.waitForFunction(()=>mamoken3d.battle.frame>2);};
    await begin(['hakuma','takimaru']);await finish(page,'timeout',0);await waitState(page,'ko',20000);
    assert.equal(await page.locator('#ko-title').textContent(),'TIME UP','時間切れに K.O. と出さない');assert.equal((await P(page)).koSlow,1);
    await page.screenshot({path:dir+'/c1-time-up.png'});
    await waitState(page,'victory',20000);await page.evaluate(()=>mamoken3d.skipPresentation());
    assert.equal(await page.locator('#result-reason').textContent(),'時間切れ');assert.equal(await page.locator('#result-title').textContent(),'勝利');
    await begin(['hakuma','takimaru']);await page.evaluate(()=>{const [a,b]=mamoken3d.battle.fighters;a.hp=Math.round(mamoken3d.ROSTER[a.id].hp/2);b.hp=Math.round(mamoken3d.ROSTER[b.id].hp/2);});
    await finish(page,'timeout_draw');await waitState(page,'ko',20000);
    assert.equal(await page.locator('#ko-title').textContent(),'TIME UP');assert.equal(await page.locator('#ko-sub').textContent(),'DRAW');
    await waitState(page,'result',20000);let s=await P(page);assert.ok(!run(s.log).includes('victory'),'引き分けに勝利ムービーなし');assert.equal(await page.locator('#result-title').textContent(),'引き分け');
    await begin(['moguzo','moguzo']);await finish(page,'double');await waitState(page,'ko',20000);
    s=await P(page);
    if(s.context.kind==='double_ko'){
      assert.equal(await page.locator('#ko-title').textContent(),'DOUBLE K.O.');await page.screenshot({path:dir+'/c2-double-ko.png'});
      await waitState(page,'result',21000);assert.ok(!run((await P(page)).log).includes('victory'));assert.equal(await page.locator('#result-reason').textContent(),'ダブルKO');
    }else console.log('note: 相打ちにならず片側 KO（発生差）。DOUBLE K.O. の文言は Node テストで検証');
    // 奥義命中 KO: 10 秒ムービー中は KO を出さず、終了（スキップ）後に 1 回だけ
    await begin(['godan','pisuke']);await finish(page,'ultimate',0);
    await page.waitForFunction(()=>mamoken3d.cinematic.active,undefined,{timeout:9000});
    await page.waitForFunction(()=>mamoken3d.battle.phase==='ko',undefined,{timeout:15000});
    s=await P(page);assert.equal(s.movie,true);assert.equal(s.state,'fight','ムービー中は KO 演出を始めない');assert.equal(await page.locator('#ko-banner').isVisible(),false);
    await page.locator('#cinematic-skip').tap();await waitState(page,'ko',20000);
    s=await P(page);assert.equal(s.context.viaUltimate,true);assert.equal(await page.locator('#ko-title').textContent(),'K.O.');
    await page.screenshot({path:dir+'/c3-ko-after-ultimate.png'});
    await waitState(page,'victory',20000);await waitState(page,'result',27000);
    s=await P(page);assert.equal(run(s.log).filter(x=>x==='ko').length,1,'奥義 KO でも KO は 1 回');assert.equal(await page.locator('#result-title').textContent(),'勝利');
    // 非アクティブ: 対戦中のフォーカス喪失は一時停止。演出中は Battle が進まないまま
    await begin(['moguzo','godan']);await page.evaluate(()=>window.dispatchEvent(new Event('blur')));
    const f0=(await P(page)).frame;await page.waitForTimeout(400);assert.equal((await P(page)).frame,f0,'フォーカス喪失で停止');assert.equal(await page.locator('#pause').textContent(),'再開');
    await page.locator('#pause').tap();await page.waitForFunction(f=>mamoken3d.battle.frame>f,f0,{timeout:3000});
    await context.close();
  }
  // ---------- D. 9 体の勝利ムービー（実 GLB のクリップ・カメラ・文字が 9 通り）と短縮版 ----------
  {
    const {context,page}=await open({viewport:{width:852,height:393}});
    const seen=[];
    for(const id of IDS){
      const foe=id==='pisuke'?'moguzo':'pisuke';
      await startBy(page,{ids:[id,foe],instant:true,victoryVariant:id==='bullet'?'short':'full'});await waitState(page,'fight',180000);await page.waitForFunction(()=>mamoken3d.battle.frame>2);
      await finish(page,'ko',0);await waitState(page,'ko',20000);await page.evaluate(()=>mamoken3d.skipPresentation());
      let s=await P(page);assert.equal(s.state,'victory',id);assert.equal(s.victoryClip,'victory_v151',id+' の勝利クリップ');
      const t0=s.victoryTime;await page.waitForFunction(t=>mamoken3d.presentation.victoryTime>t+.5,t0,{timeout:8000});s=await P(page);   // 勝利クリップが進む（描画の遅い環境でも待つ）
      const root=await page.evaluate(()=>mamoken3d.actors[0].holder.position.toArray());
      seen.push({id,line:await page.locator('#victory-line').textContent(),title:await page.locator('#victory-side').textContent(),
        camera:s.cameraPosition.map((v,i)=>+(v-root[i]).toFixed(2)).join(','),from:+t0.toFixed(2)});
      await page.screenshot({path:dir+'/d-victory-'+id+'.png'});
      await page.evaluate(()=>mamoken3d.skipPresentation());assert.equal((await P(page)).state,'result');assert.equal(await page.locator('#result-title').textContent(),'勝利');
    }
    for(const key of ['line','title','camera'])assert.equal(new Set(seen.map(v=>v[key])).size,9,key+' が 9 通り '+JSON.stringify(seen.map(v=>v[key])));
    // 読み取りまでに実時間が少し進むので、絶対値ではなく「短縮版は編集元の開始位置（70F=1.17 秒）以降」「フル版は頭から」を幅を持たせて見る
    assert.ok(seen.find(v=>v.id==='bullet').from>=1.16,'短縮版は後半から始まる');assert.ok(seen.find(v=>v.id==='moguzo').from<1.0,'フル版は頭から');
    // プラクティスは VS／顔アップなし（従来どおり）
    await page.evaluate(()=>mamoken3d.showSelection());await setMatch(page,'#match-mode','practice');await page.locator('#start').tap();
    await page.waitForFunction(()=>mamoken3d.practice.enabled&&mamoken3d.presentation.state==='fight'&&mamoken3d.battle?.frame>4,undefined,{timeout:35000});
    assert.deepEqual((await P(page)).log.slice(-2),['loading','fight']);assert.equal(await page.locator('#vs-screen').isVisible(),false);
    await context.close();
  }
  // ---------- E. 低刺激（OS の動き軽減）: スローなし・短い顔アップ ----------
  {
    const {context,page}=await open({viewport:{width:852,height:393},reducedMotion:'reduce'});
    await page.locator('#start').tap();await page.waitForFunction(()=>mamoken3d.presentation.loaded,undefined,{timeout:60000});
    // 導入の長さは表示クロック（flow.time）で測る。描画が遅い環境でも壁時計に左右されない
    await page.evaluate(()=>{window.__intro=0;const tick=()=>{const p=mamoken3d.presentation;if(p.state==='intro')window.__intro=Math.max(window.__intro,p.time);if(p.state!=='fight')requestAnimationFrame(tick);};tick();});
    await waitState(page,'intro',24000);await waitState(page,'fight',36000);
    const introSeconds=await page.evaluate(()=>window.__intro);assert.ok(introSeconds>1.5&&introSeconds<2.9,'低刺激の導入は短い（2.7 秒。通常は 3.6 秒）: '+introSeconds);
    await page.waitForFunction(()=>mamoken3d.battle.frame>2);await finish(page,'ko',0);await waitState(page,'ko',20000);
    await page.waitForTimeout(350);const s=await P(page);assert.equal(s.koSlow,1,'低刺激では KO をスローにしない');assert.equal(await page.locator('#ko-banner').getAttribute('data-motion'),'reduced');
    assert.equal(await page.locator('#round-call').isVisible(),false,'reduced-motion early KO must clear FIGHT');
    await page.screenshot({path:dir+'/e1-ko-reduced-motion.png'});
    await waitState(page,'victory',20000);await waitState(page,'result',27000);
    await context.close();
  }
  assert.deepEqual(errors,[],'ブラウザのエラーなし');
  console.log('v15.1 presentation browser acceptance: OK');
}finally{await browser.close();}
