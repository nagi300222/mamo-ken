import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createChirkaIllusions,ILLUSION_COUNT,ILLUSION_FRAMES} from './showtime-illusions.js';

test('3D分身は2体・28F以下、reduced-motionでは無効化',()=>{
 assert.equal(ILLUSION_COUNT,2);assert.ok(ILLUSION_FRAMES<=28);
 const fx=createChirkaIllusions({reducedMotion:true});
 assert.equal(fx.start({id:'chirka',action:{id:'ultimate',serial:1}}),false);
 assert.equal(fx.active,false);fx.dispose();
});
test('分身はskinning cloneを使用しゲーム用hitboxを追加しない',()=>{
 const main=readFileSync(new URL('./main.js',import.meta.url),'utf8');
 const code=readFileSync(new URL('./showtime-illusions.js',import.meta.url),'utf8');
 assert.match(main,/SkeletonUtils\.js/);
 assert.match(main,/illusions\?\.start\(p\)/);
 assert.match(main,/illusions\?\.step\(p\)/);
 assert.match(main,/illusions\?\.dispose\(\)/);
 assert.match(code,/cloneSkeleton\(gltf\.scene\)/);
 assert.match(code,/mixer\.clipAction\(clip\)/);
 assert.match(code,/p\.action\.serial!==serial/);
 assert.match(code,/material\.dispose\(\)/);
 assert.doesNotMatch(code,/battle\.tick|damage|hitbox|collider/);
});
