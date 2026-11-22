import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import {shouldRotateLandscape,localStickAxes} from './landscape-lock.js';

test('portrait touch gets landscape-only game canvas, not desktop or landscape',()=>{
  assert.equal(shouldRotateLandscape(393,852,true),true);
  assert.equal(shouldRotateLandscape(375,667,true),true);
  assert.equal(shouldRotateLandscape(320,568,true),true);
  assert.equal(shouldRotateLandscape(852,393,true),false);
  assert.equal(shouldRotateLandscape(393,852,false),false);
  assert.equal(shouldRotateLandscape(0,852,true),false);
});
test('clockwise CSS rotation inverts joystick axes, including diagonals',()=>{
  assert.deepEqual(localStickAxes(0,40,40,true),{x:1,y:0}); // game-right = physical-down
  assert.deepEqual(localStickAxes(0,-40,40,true),{x:-1,y:0});
  assert.deepEqual(localStickAxes(40,0,40,true),{x:0,y:-1}); // game-up = physical-right
  assert.deepEqual(localStickAxes(-40,0,40,true),{x:0,y:1});
  assert.deepEqual(localStickAxes(20,-30,40,true),{x:-.75,y:-.5});
  assert.deepEqual(localStickAxes(40,0,40,false),{x:1,y:0});
  assert.deepEqual(localStickAxes(0,40,40,false),{x:0,y:1});
});
test('CSS rotational layout, cinematic and old device-stats remain without gameplay edits',()=>{
 const css=fs.readFileSync(new URL('./style.css',import.meta.url),'utf8');
 const main=fs.readFileSync(new URL('./main.js',import.meta.url),'utf8');
 const build=fs.readFileSync(new URL('./build-pages.mjs',import.meta.url),'utf8');
 assert.match(css,/transform:translateX\(100vw\) rotate\(90deg\)/);
 assert.match(css,/#cinematic-layer/);
 assert.match(main,/localStickAxes\(e\.clientX-cx,e\.clientY-cy,radius,gameRotated\)/);
 assert.match(main,/window\.visualViewport\?\.addEventListener\('resize',updateLandscapeLock\)/);
 assert.match(build,/landscape-lock\.js/);
});

