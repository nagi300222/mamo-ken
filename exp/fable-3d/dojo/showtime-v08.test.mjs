import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ROSTER } from './balance.js';
import { SHOWTIME_PROFILES, SHOWTIME_IDS, showtimeFor, showtimeHex, superCaption, isShowtimeMove } from './showtime-profiles.js';
import { createCombatAudio } from './combat-audio.js';

const read=n=>readFileSync(new URL('./'+n,import.meta.url),'utf8');
test('全9キャラのプレゼン用カラー・音の高さ・トレイル部位を持つ',()=>{
  assert.deepEqual([...SHOWTIME_IDS].sort(),Object.keys(ROSTER).sort());
  for(const id of SHOWTIME_IDS){
    const p=showtimeFor(id);
    assert.ok(p.color>0&&p.color<0x1000000&&p.pitch>50&&p.pitch<800&&p.bone);
    assert.match(showtimeHex(id),/^#[0-9a-f]{6}$/);
    assert.ok(superCaption(id,ROSTER[id].ultimate.name).includes(ROSTER[id].ultimate.name));
  }
  assert.equal(SHOWTIME_PROFILES.chirka.element,'illusion');
  assert.equal(SHOWTIME_PROFILES.bullet.bone,'tail_03');
  assert.equal(isShowtimeMove('ultimate'),true);
  assert.equal(isShowtimeMove('s2'),true);
  assert.equal(isShowtimeMove('roar'),false);
});
test('効果音はユーザー操作でunlockされるまでAudioContextを作らない',()=>{
  let created=0,started=0;
  class FakeAudioContext {
    constructor(){created++;this.state='running';this.currentTime=1;this.destination={};}
    createGain(){return {gain:{value:0,setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){}};}
    createOscillator(){return {type:'',frequency:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},start(){started++;},stop(){},disconnect(){}};}
  }
  const sfx=createCombatAudio(()=>FakeAudioContext);
  assert.equal(created,0);
  assert.equal(sfx.play('hit','moguzo'),false);
  assert.equal(created,0);
  sfx.unlock();assert.equal(created,1);
  assert.equal(sfx.play('special','moguzo'),true);
  assert.equal(started,1);
  sfx.setMuted(true);assert.equal(sfx.play('ultimate','chirka'),false);
  assert.equal(started,1);
  sfx.setMuted(false);assert.equal(sfx.play('ultimate','chirka'),true);
  assert.equal(started,2);
});
test('音声APIがない環境では静かにフォールバック',()=>{
  const sfx=createCombatAudio(()=>undefined);
  assert.equal(sfx.supported,false);
  assert.equal(sfx.unlock(),false);
  assert.equal(sfx.play('hit','godan'),false);
});
test('戦闘ロジックの数値ファイルに手を入れず、キャラ別VFXを描画側に置く',()=>{
  const html=read('index.html'),main=read('main.js'),build=read('build-pages.mjs');
  assert.match(html,/id="sound-toggle"/);
  assert.match(html,/id="showtime-banner"/);
  assert.match(main,/function updateActionTrail/);
  assert.match(main,/function actionShowtime/);
  assert.match(main,/createCombatAudio/);
  assert.match(main,/impactFX\(kind,color,e\.x/);
  assert.match(main,/updateCamera\(\);\s*renderer\.render\(scene,camera\)/);
  assert.match(build,/showtime-profiles\.js/);
  assert.match(build,/combat-audio\.js/);
});
