import test from 'node:test';
import assert from 'node:assert/strict';
import {Battle} from './battle.js';
import {ROSTER} from './balance.js';
import {isConfirmedUltimateHit,createMovieDirector,MOVIE_SCRIPTS} from './ultimate-cinematic.js';
import {readFileSync} from 'node:fs';

function superOutcome({dist=.43,blocked=false,defenderHp=null,attacker=0}={}){
 const g=new Battle('moguzo','godan');
 g.fighters[0].x=-dist/2;g.fighters[1].x=dist/2;
 const a=g.fighters[attacker],t=g.fighters[1-attacker];
 a.super=100;a.stop=0;a.stun=0;
 if(defenderHp!==null)t.hp=defenderHp;
 const hitEvents=[];
 for(let i=0;i<66&&g.phase==='fight';i++){
   const one=i===0&&attacker===0?{ultimateButton:true}:
      blocked&&attacker!==0?{right:true}:{};
   const two=i===0&&attacker===1?{ultimateButton:true}:
      blocked&&attacker===0?{right:true}:{};
   g.tick(one,two);
   hitEvents.push(...g.events.filter(e=>e.type==='ultimate_hit'));
 }
 return {g,hitEvents};
}
test('real super hit creates one dedicated cinematic event; HP/damage are computed by Battle',()=>{
 const {g,hitEvents}=superOutcome({dist:.40});
 assert.equal(hitEvents.length,1);
 assert.equal(hitEvents[0].slot,0);
 assert.equal(hitEvents[0].target,1);
 assert.equal(hitEvents[0].type,'ultimate_hit');
 assert.equal(hitEvents[0].move,ROSTER.moguzo.ultimate.name);
 assert.ok(hitEvents[0].damage>0);
 assert.ok(g.fighters[1].hp<ROSTER.godan.hp);
});
test('guarded and whiffed super attacks NEVER start the movie',()=>{
 const guarded=superOutcome({dist:.4,blocked:true});
 assert.equal(guarded.hitEvents.length,0,'blocked');
 const miss=superOutcome({dist:2.8});
 assert.equal(miss.hitEvents.length,0,'whiff');
});
test('KO event coexists with confirmed super hit; cutaway can defer results',()=>{
 const {g,hitEvents}=superOutcome({dist:.32,defenderHp:40});
 assert.equal(hitEvents.length,1);
 assert.equal(g.phase,'ko');
 const m=createMovieDirector();
 assert.equal(m.start(hitEvents[0],g.fighters[0].id),true);
 const frame=g.frame,time=g.time,hp=g.fighters.map(p=>p.hp);
 m.update(1);m.update(1);
 assert.equal(g.frame,frame);
 assert.equal(g.time,time);
 assert.deepEqual(g.fighters.map(p=>p.hp),hp);
 m.cancel();assert.equal(m.active,false);
});
test('movie director rejects blocked/miss/fake and only plays confirmed hit',()=>{
 const m=createMovieDirector();
 assert.equal(m.start({type:'move',slot:0,target:1,damage:100},'moguzo'),false);
 assert.equal(m.start({type:'ultimate_hit',slot:0,target:1,damage:0},'moguzo'),false);
 const e={type:'ultimate_hit',slot:0,target:1,damage:201,move:'奥義'};
 assert.equal(isConfirmedUltimateHit(e),true);
 assert.equal(m.start(e,'moguzo'),true);
 assert.equal(m.start(e,'moguzo'),false);
 const earlier=m.update(.10);assert.equal(earlier.phase,'anticipation');
 for(let i=0;i<30;i++)m.update(.12);
 assert.ok(m.update(.01).ended);
 m.cancel();assert.equal(m.active,false);
 const reduced=createMovieDirector({reducedMotion:true});
 assert.ok(reduced.duration<m.duration);
});
test('nine cinematic scripts, full screen canvas handoff and KO gating are wired',()=>{
 assert.deepEqual(Object.keys(MOVIE_SCRIPTS).sort(),Object.keys(ROSTER).sort());
 const main=readFileSync(new URL('./main.js',import.meta.url),'utf8');
 const html=readFileSync(new URL('./index.html',import.meta.url),'utf8');
 const style=readFileSync(new URL('./style.css',import.meta.url),'utf8');
 const bundle=readFileSync(new URL('./build-pages.mjs',import.meta.url),'utf8');
 assert.match(main,/if\(e\.type==='ultimate_hit'\)/);
 assert.match(main,/beginUltimateMovie\(e\)/);
 assert.match(main,/movieViewport\.appendChild\(canvas\)/);
 assert.match(main,/canvasHome\.insertBefore\(canvas,canvasFollowingNode\)/);
 assert.match(main,/if\(battle\.phase==='ko'&&!finishShown&&!movie\.active&&!practiceEnabled\)/);
 assert.match(main,/if\(movie\.active\|\|battle\.phase!=='fight'\)break/);
 assert.match(main,/superSignature\(p\)/);
 assert.match(html,/id="cinematic-skip"/);
 assert.match(html,/id="cinematic-viewport"/);
 assert.match(style,/#cinematic-layer\[hidden\]/);
 assert.match(bundle,/ultimate-cinematic\.js/);
});
