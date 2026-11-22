import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright-core');
const base = process.env.MAMOKEN_URL ?? 'http://127.0.0.1:4173/exp/fable-3d/dojo/';
const evidence = process.env.MAMOKEN_EVIDENCE ?? '/tmp/mamoken-choreography';
const attacker = process.env.MAMOKEN_ATTACKER ?? 'moguzo';
await mkdir(evidence, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH ?? '/usr/bin/google-chrome',
  args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']
});
const page = await browser.newPage({ viewport: { width: 852, height: 393 }, isMobile: true, hasTouch: true });
const errors = [], results = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => {
  if (/PropertyBinding|再生準備に失敗|奥義ムービーを終了|未対応の VFX/.test(message.text())) errors.push(message.text());
});
const snapshot = () => page.evaluate(() => {
  const battle = mamoken3d.battle;
  return { frame: battle.frame, time: battle.time, fighters: battle.fighters.map(f => ({
    hp: f.hp, drive: f.drive, super: f.super, x: f.x, y: f.y, state: f.state,
    action: f.action?.id, frame: f.frame, ability: f.ability
  })) };
});
try {
  await page.goto(base);
  await page.waitForFunction(() => window.mamoken3d);
  const ids = await page.evaluate(() => Object.keys(mamoken3d.ROSTER));
  for (const [index, target] of ids.entries()) {
    if (index) await page.locator('#result-select').tap();
    await page.locator('.fighter-card').nth(ids.indexOf(attacker)).tap();
    await page.locator('#cpu-choice').selectOption(target);
    await page.locator('#start').tap();
    await page.waitForFunction(({attacker,target}) => mamoken3d.battle?.frame > 0 &&
      mamoken3d.actors[0]?.id === attacker && mamoken3d.actors[1]?.id === target,
    {attacker,target}, {timeout:40000});
    const mirror = index % 2 === 1;
    await page.evaluate(mirror => {
      const [a,t] = mamoken3d.battle.fighters;
      a.x = mirror ? .18 : -.18; t.x = -a.x;
      a.facing = mirror ? -1 : 1; t.facing = -a.facing;
      a.super = 100; a.action = null; a.frame = 0; a.stun = a.stop = 0;
      a.y = t.y = a.vy = t.vy = 0; a.dashF = t.dashF = 0;
      t.hp = 15; t.action = null; t.stun = 600; t.stop = 0;
      a.prev.ultimateButton = false;
    }, mirror);
    await page.locator('[data-control="ultimateButton"]').tap();
    await page.waitForFunction(() => mamoken3d.cinematic.active, undefined, {timeout:12000});
    const frozen = await snapshot();
    await page.waitForFunction(() => mamoken3d.cinematic.elapsed >= 3, undefined, {timeout:20000});
    assert.deepEqual(await snapshot(), frozen, 'combat changed during choreography');
    await page.screenshot({path: evidence + '/' + attacker + '-vs-' + target + '.png'});
    await page.waitForFunction(() => mamoken3d.cinematic.elapsed >= 7, undefined, {timeout:20000});
    assert.deepEqual(await snapshot(), frozen);
    await page.locator('#game-over').waitFor({state:'visible',timeout:20000});
    assert.equal(await page.locator('#stage').evaluate(node => node.parentElement.id), 'arena');
    results.push({attacker,target,mirror,passed:true});
  }
  assert.deepEqual(errors, []);
  console.log('Choreography matrix passed', JSON.stringify(results));
} catch (error) {
  await page.screenshot({path:evidence + '/failure.png'}).catch(() => {});
  throw error;
} finally {
  await writeFile(evidence + '/results.json', JSON.stringify({results,errors},null,2));
  await browser.close();
}
