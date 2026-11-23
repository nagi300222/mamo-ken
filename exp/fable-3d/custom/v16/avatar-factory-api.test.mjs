import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
test('appearance-only createAvatar API still loads real rigs and defaults contact clocks to its base style',()=>{
 const result=spawnSync(process.execPath,['--loader',fileURLToPath(new URL('./tools/three-loader.mjs',import.meta.url)),fileURLToPath(new URL('./tools/verify-appearance-only.mjs',import.meta.url))],{encoding:'utf8',timeout:60000});
 assert.equal(result.status,0,result.stderr+'\n'+result.stdout);assert.match(result.stdout,/APPEARANCE-ONLY FACTORY CPU PASS/);
});
test('actual R2 two-hand specials follow the declared leading limb after hand swaps',()=>{
 const result=spawnSync(process.execPath,['--loader',fileURLToPath(new URL('./tools/three-loader.mjs',import.meta.url)),fileURLToPath(new URL('./tools/verify-custom-special-leading.mjs',import.meta.url))],
  {encoding:'utf8',timeout:60000,env:{...process.env,MAMOKEN_LEADING_TEST_IDS:'hakuma,dark_moguzo',MAMOKEN_EVIDENCE:'/tmp/p3-custom-special-leading-unit'}});
 assert.equal(result.status,0,result.stderr+'\n'+result.stdout);assert.match(result.stdout,/CUSTOM SPECIAL LEADING CPU PASS: 12/);
});
